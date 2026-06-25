const FRAUD_TYPE_LABELS = {
  multiple_votes: 'Duplicate voting attempt',
  duplicate_ip: 'Duplicate IP activity',
  duplicate_device: 'Suspicious device switching',
  suspicious_pattern: 'Suspicious voting pattern',
  rapid_voting: 'Rapid voting activity',
  biometric_mismatch: 'Biometric mismatch',
  security_question_fail: 'Security question failure',
  location_anomaly: 'Location anomaly',
  time_anomaly: 'Time anomaly',
  bot_detected: 'Bot-like activity',
  vpn_detected: 'VPN detected',
  proxy_detected: 'Proxy detected',
  other: 'Other suspicious activity'
};

const getFraudTypeLabel = (fraudType) => FRAUD_TYPE_LABELS[fraudType] || 'Suspicious activity';

const buildFraudUserSnapshot = (user) => ({
  userName: user?.name || '',
  userEmail: user?.email || '',
  userCnic: user?.cnic || ''
});

module.exports = {
  FRAUD_TYPE_LABELS,
  getFraudTypeLabel,
  buildFraudUserSnapshot
};
