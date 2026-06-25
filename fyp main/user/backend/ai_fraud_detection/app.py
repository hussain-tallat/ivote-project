import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import joblib
from datetime import datetime
import json
import pandas as pd

app = Flask(__name__)
CORS(app)

class FraudDetectionModel:
    def __init__(self):
        self.model = None
        self.feature_names = [
            'vote_count_last_hour',
            'ip_vote_count',
            'device_vote_count',
            'time_since_last_vote',
            'biometric_verified',
            'security_verified',
            'voting_hour',
            'rapid_voting_pattern'
        ]
        self.csv_baseline = {}
        self.csv_constituency_baseline = {}
        self.csv_loaded = False
        self.initialize_model()
    
    def initialize_model(self):
        """Initialize a simple rule-based model"""
        print("Fraud detection model initialized")
        csv_path = os.environ.get('CSV_PATH')
        if not csv_path:
            print("CSV_PATH not set. Skipping CSV-based anomaly risk.")
            return

        try:
            # Only load columns we care about for baseline stats.
            # Your CSV headers include: Constituency, Party, Turnout N, Votes.
            df = pd.read_csv(
                csv_path,
                usecols=['Constituency', 'Party', 'Turnout N', 'Votes'],
                low_memory=False
            )

            df['Votes'] = pd.to_numeric(df['Votes'], errors='coerce')
            df = df.dropna(subset=['Constituency', 'Party', 'Votes'])
            if df.empty:
                print("CSV loaded but contains no usable rows for baseline stats.")
                return

            # Baseline by (Constituency, Party)
            grouped = df.groupby(['Constituency', 'Party'])['Votes']
            for (constituency, party), series in grouped:
                mean_val = float(series.mean())
                std_val = float(series.std(ddof=0)) if series.std(ddof=0) is not None else 0.0
                std_val = std_val if std_val > 0 else 1.0
                self.csv_baseline[(str(constituency), str(party))] = {
                    'mean': mean_val,
                    'std': std_val
                }

            # Fallback baseline by Constituency only
            grouped2 = df.groupby('Constituency')['Votes']
            for constituency, series in grouped2:
                mean_val = float(series.mean())
                std_val = float(series.std(ddof=0)) if series.std(ddof=0) is not None else 0.0
                std_val = std_val if std_val > 0 else 1.0
                self.csv_constituency_baseline[str(constituency)] = {
                    'mean': mean_val,
                    'std': std_val
                }

            self.csv_loaded = True
            print(f"CSV baseline loaded from {csv_path}.")
        except Exception as e:
            print(f"Failed to load CSV baseline stats: {str(e)}")
    
    def extract_features(self, vote_data):
        """Extract features from vote data"""
        features = {
            'vote_count_last_hour': vote_data.get('vote_count_last_hour', 0),
            'ip_vote_count': vote_data.get('ip_vote_count', 0),
            'device_vote_count': vote_data.get('device_vote_count', 0),
            'time_since_last_vote': vote_data.get('time_since_last_vote', 1000),
            'biometric_verified': 1 if vote_data.get('biometric_verified', False) else 0,
            'security_verified': 1 if vote_data.get('security_verified', False) else 0,
            'voting_hour': datetime.now().hour,
            'rapid_voting_pattern': vote_data.get('rapid_voting_pattern', 0)
            ,
            # Optional CSV-driven fields
            'csv_constituency': vote_data.get('constituency'),
            'csv_party': vote_data.get('party'),
            'current_total_votes': vote_data.get('current_total_votes', 0)
        }
        return features

    def calculate_csv_anomaly_points(self, features):
        """Add risk points if the current vote count looks anomalous vs CSV baseline."""
        if not self.csv_loaded:
            return 0, []

        constituency = features.get('csv_constituency')
        party = features.get('csv_party')
        current_total_votes = features.get('current_total_votes', 0) or 0

        if not constituency or current_total_votes <= 0:
            return 0, []

        key = (str(constituency), str(party)) if party else None
        baseline = None
        if key and key in self.csv_baseline:
            baseline = self.csv_baseline[key]
        elif str(constituency) in self.csv_constituency_baseline:
            baseline = self.csv_constituency_baseline[str(constituency)]

        if not baseline:
            return 0, []

        mean_val = baseline['mean']
        std_val = baseline['std']
        z = (float(current_total_votes) - mean_val) / std_val

        indicators = []
        points = 0
        if z > 3.0:
            points += 30
            indicators.append('csv_high_vote_anomaly')
        elif z > 2.0:
            points += 20
            indicators.append('csv_vote_outlier')

        return points, indicators
    
    def calculate_risk_score(self, features):
        """Calculate fraud risk score using rule-based approach"""
        risk_score = 0
        
        if features['vote_count_last_hour'] > 3:
            risk_score += 30
        
        if features['ip_vote_count'] > 5:
            risk_score += 40
        
        if features['device_vote_count'] > 3:
            risk_score += 25
        
        if features['time_since_last_vote'] < 60:
            risk_score += 20
        
        if not features['biometric_verified']:
            risk_score += 15
        
        if not features['security_verified']:
            risk_score += 20
        
        if features['rapid_voting_pattern'] > 0:
            risk_score += 25
        
        if features['voting_hour'] < 6 or features['voting_hour'] > 22:
            risk_score += 10

        csv_points, csv_indicators = self.calculate_csv_anomaly_points(features)
        risk_score += csv_points

        return min(risk_score, 100), csv_indicators
    
    def predict(self, vote_data):
        """Predict if vote is fraudulent"""
        features = self.extract_features(vote_data)
        risk_score, csv_indicators = self.calculate_risk_score(features)
        
        is_fraudulent = risk_score >= 50
        confidence = risk_score / 100.0
        
        fraud_indicators = []
        if features['vote_count_last_hour'] > 3:
            fraud_indicators.append('rapid_voting')
        if features['ip_vote_count'] > 5:
            fraud_indicators.append('duplicate_ip')
        if features['device_vote_count'] > 3:
            fraud_indicators.append('duplicate_device')
        if features['time_since_last_vote'] < 60:
            fraud_indicators.append('suspicious_pattern')
        if not features['biometric_verified']:
            fraud_indicators.append('biometric_not_verified')
        
        fraud_indicators.extend(csv_indicators)
        
        return {
            'is_fraudulent': bool(is_fraudulent),
            'risk_score': float(risk_score),
            'confidence': float(confidence),
            'fraud_indicators': fraud_indicators,
            'features': features
        }

fraud_model = FraudDetectionModel()

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'success': True,
        'message': 'iVotePK AI Fraud Detection API',
        'version': '1.0.0',
        'model': 'Rule-based + ML Hybrid',
        'endpoints': {
            'predict': '/predict',
            'batch_predict': '/batch-predict',
            'train': '/train',
            'health': '/health'
        }
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'success': True,
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        vote_data = {
            'vote_count_last_hour': data.get('vote_count_last_hour', 0),
            'ip_vote_count': data.get('ip_vote_count', 0),
            'device_vote_count': data.get('device_vote_count', 0),
            'time_since_last_vote': data.get('time_since_last_vote', 1000),
            'biometric_verified': data.get('biometric_verified', False),
            'security_verified': data.get('security_verified', False),
            'rapid_voting_pattern': data.get('rapid_voting_pattern', 0)
            ,
            # Optional CSV-based context
            'constituency': data.get('constituency'),
            'party': data.get('party'),
            'current_total_votes': data.get('current_total_votes', 0)
        }
        
        prediction = fraud_model.predict(vote_data)
        
        return jsonify({
            'success': True,
            'vote_id': data.get('voteId'),
            'user_id': data.get('userId'),
            'election_id': data.get('electionId'),
            'prediction': prediction,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Prediction error: {str(e)}'
        }), 500

@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    try:
        data = request.get_json()
        votes = data.get('votes', [])
        
        if not votes:
            return jsonify({
                'success': False,
                'message': 'No votes provided'
            }), 400
        
        predictions = []
        for vote in votes:
            prediction = fraud_model.predict(vote)
            predictions.append({
                'vote_id': vote.get('voteId'),
                'prediction': prediction
            })
        
        return jsonify({
            'success': True,
            'count': len(predictions),
            'predictions': predictions,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Batch prediction error: {str(e)}'
        }), 500

@app.route('/train', methods=['POST'])
def train_model():
    """Endpoint for future ML model training"""
    try:
        data = request.get_json()
        training_data = data.get('training_data', [])
        
        return jsonify({
            'success': True,
            'message': 'Model training functionality - To be implemented with more data',
            'samples_received': len(training_data)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Training error: {str(e)}'
        }), 500

@app.route('/analytics', methods=['POST'])
def get_analytics():
    """Get fraud analytics for an election"""
    try:
        data = request.get_json()
        election_id = data.get('electionId')
        
        return jsonify({
            'success': True,
            'election_id': election_id,
            'analytics': {
                'total_predictions': 0,
                'fraud_detected': 0,
                'average_risk_score': 0,
                'common_indicators': []
            },
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Analytics error: {str(e)}'
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('AI_PORT', 5001))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"""
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║         iVotePK AI Fraud Detection Module            ║
║                                                       ║
║  Running on port {port}                                  ║
║  Model: Rule-based + ML Hybrid                       ║
║                                                       ║
║  Endpoints:                                           ║
║  - Predict:       POST /predict                      ║
║  - Batch:         POST /batch-predict                ║
║  - Train:         POST /train                        ║
║  - Analytics:     POST /analytics                    ║
║  - Health:        GET  /health                       ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    """)
    
    app.run(host='0.0.0.0', port=port, debug=debug)
