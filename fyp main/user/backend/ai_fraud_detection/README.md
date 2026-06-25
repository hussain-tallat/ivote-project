# iVotePK AI Fraud Detection Module

This is the AI-powered fraud detection system for the iVotePK voting platform.

## Features

- Real-time fraud detection
- Rule-based risk scoring
- ML model integration support
- Batch prediction capability
- Analytics and reporting

## Installation

```bash
cd ai_fraud_detection
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Running the Server

```bash
python app.py
```

The server will start on port 5001 by default.

## API Endpoints

### POST /predict
Predict fraud for a single vote.

**Request:**
```json
{
  "voteId": "vote123",
  "userId": "user123",
  "electionId": "election123",
  "vote_count_last_hour": 2,
  "ip_vote_count": 1,
  "device_vote_count": 1,
  "time_since_last_vote": 300,
  "biometric_verified": true,
  "security_verified": true
}
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "is_fraudulent": false,
    "risk_score": 25.5,
    "confidence": 0.75,
    "fraud_indicators": []
  }
}
```

### POST /batch-predict
Predict fraud for multiple votes.

### GET /health
Health check endpoint.

## Risk Scoring Logic

- Vote count > 3 in last hour: +30 points
- IP address used > 5 times: +40 points
- Device used > 3 times: +25 points
- Time since last vote < 60s: +20 points
- No biometric verification: +15 points
- No security questions: +20 points
- Rapid voting pattern: +25 points
- Unusual voting hours: +10 points

**Fraud threshold:** 50+ points

## Future Enhancements

- Machine Learning model training
- Deep learning integration
- Behavioral analysis
- Network analysis
- Image verification
