/**
 * Professional Email Templates for iVotePK System
 * All templates use branded styling and comply with email client standards
 */

const getEmailHeader = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #1b4d3e 0%, #2a6b55 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 30px 20px; }
        .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
        .alert-box { border-left: 4px solid #dc3545; background-color: #fff5f5; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .alert-box.warning { border-left-color: #ffc107; background-color: #fffbea; }
        .alert-box.success { border-left-color: #28a745; background-color: #f0f9f4; }
        .alert-box h3 { margin: 0 0 10px 0; color: #dc3545; font-size: 16px; }
        .alert-box.warning h3 { color: #856404; }
        .alert-box.success h3 { color: #155724; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .details-table tr { border-bottom: 1px solid #eee; }
        .details-table th { background-color: #f5f5f5; padding: 10px; text-align: left; font-weight: 600; color: #333; }
        .details-table td { padding: 10px; color: #666; }
        .details-table td strong { color: #333; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .badge.critical { background-color: #dc3545; color: white; }
        .badge.high { background-color: #ff6b6b; color: white; }
        .badge.medium { background-color: #ffc107; color: #333; }
        .badge.low { background-color: #28a745; color: white; }
        .action-button { display: inline-block; padding: 12px 30px; background-color: #1b4d3e; color: white; text-decoration: none; border-radius: 4px; margin: 15px 0; }
        .action-button:hover { background-color: #2a6b55; }
        .timestamp { color: #999; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗳️ iVotePK</h1>
            <p>Pakistan's Digital Voting Platform</p>
        </div>
`;

const getEmailFooter = () => `
        <div class="footer">
            <p><strong>iVotePK Security Center</strong></p>
            <p>This is an automated security alert. Please do not reply to this email.</p>
            <p>© 2026 iVotePK. All rights reserved.</p>
            <p><a href="http://localhost:3000" style="color: #1b4d3e; text-decoration: none;">Visit Dashboard</a> | 
               <a href="http://localhost:3000/security" style="color: #1b4d3e; text-decoration: none;">Security Settings</a></p>
        </div>
    </div>
</body>
</html>
`;

/**
 * FRAUD ALERT EMAIL - Duplicate Email Registration
 */
exports.fraudAlertDuplicateEmail = (data) => {
  const { email, existingCnic, newCnic, attemptedAt, ipAddress } = data;
  const timestamp = new Date(attemptedAt).toLocaleString();

  return {
    subject: '🚨 URGENT: Fraudulent Registration Attempt - Duplicate Email',
    html: `
${getEmailHeader()}
        <div class="content">
            <h2 style="color: #1b4d3e;">Fraudulent Activity Detected</h2>
            
            <div class="alert-box">
                <h3>⚠️ DUPLICATE EMAIL REGISTRATION BLOCKED</h3>
                <p>A user attempted to register with an email address already in the system using a different CNIC.</p>
            </div>

            <table class="details-table">
                <tr>
                    <th colspan="2" style="background-color: #fff5f5;">Suspicious Account Details</th>
                </tr>
                <tr>
                    <td><strong>Email Address:</strong></td>
                    <td>${email}</td>
                </tr>
                <tr>
                    <td><strong>Existing CNIC:</strong></td>
                    <td><code>${existingCnic}</code></td>
                </tr>
                <tr>
                    <td><strong>Attempted CNIC:</strong></td>
                    <td><code>${newCnic}</code></td>
                </tr>
                <tr>
                    <td><strong>Attempt Time:</strong></td>
                    <td>${timestamp}</td>
                </tr>
                <tr>
                    <td><strong>IP Address:</strong></td>
                    <td><code>${ipAddress}</code></td>
                </tr>
                <tr>
                    <td><strong>Action Taken:</strong></td>
                    <td><span class="badge critical">ACCOUNT BLOCKED</span></td>
                </tr>
            </table>

            <p style="color: #666; margin-top: 20px;">
                <strong>⚡ Recommendation:</strong> Review this account immediately. Cross-reference the IP address with other suspicious activities.
            </p>

            <a href="http://localhost:3000/fraud-monitor" class="action-button">🔍 View in Fraud Monitor</a>
        </div>

${getEmailFooter()}
    `
  };
};

/**
 * FRAUD ALERT EMAIL - Duplicate Vote
 */
exports.fraudAlertDuplicateVote = (data) => {
  const { userCnic, userEmail, electionTitle, attemptTime, ipAddress, previousVoteTime } = data;
  const timestamp = new Date(attemptTime).toLocaleString();
  const prevTime = new Date(previousVoteTime).toLocaleString();

  return {
    subject: '🚨 URGENT: Multiple Vote Attempt - Election Fraud Detected',
    html: `
${getEmailHeader()}
        <div class="content">
            <h2 style="color: #1b4d3e;">Election Fraud Alert</h2>
            
            <div class="alert-box">
                <h3>🗳️ DUPLICATE VOTE ATTEMPT BLOCKED</h3>
                <p>A user attempted to vote multiple times in the same election.</p>
            </div>

            <table class="details-table">
                <tr>
                    <th colspan="2" style="background-color: #fff5f5;">Fraudulent Vote Details</th>
                </tr>
                <tr>
                    <td><strong>User CNIC:</strong></td>
                    <td><code>${userCnic}</code></td>
                </tr>
                <tr>
                    <td><strong>User Email:</strong></td>
                    <td>${userEmail}</td>
                </tr>
                <tr>
                    <td><strong>Election:</strong></td>
                    <td>${electionTitle}</td>
                </tr>
                <tr>
                    <td><strong>First Vote Time:</strong></td>
                    <td>${prevTime}</td>
                </tr>
                <tr>
                    <td><strong>Duplicate Attempt Time:</strong></td>
                    <td>${timestamp}</td>
                </tr>
                <tr>
                    <td><strong>IP Address (2nd Attempt):</strong></td>
                    <td><code>${ipAddress}</code></td>
                </tr>
                <tr>
                    <td><strong>Action Taken:</strong></td>
                    <td><span class="badge critical">VOTE BLOCKED</span></td>
                </tr>
            </table>

            <p style="color: #666; margin-top: 20px; padding: 15px; background-color: #f0f0f0; border-radius: 4px;">
                <strong>🔒 Notice:</strong> The duplicate vote has been <strong>permanently blocked</strong>. Only the first legitimate vote is recorded. The account has been flagged for investigation.
            </p>

            <a href="http://localhost:3000/fraud-monitor" class="action-button">🔍 View in Fraud Monitor</a>
        </div>

${getEmailFooter()}
    `
  };
};

/**
 * ACTIVITY ALERT EMAIL - Suspicious Login Pattern
 */
exports.activityAlertSuspiciousLogin = (data) => {
  const { userEmail, loginTime, newDevice, lastLoginTime, ipAddress } = data;
  const timestamp = new Date(loginTime).toLocaleString();
  const lastTime = lastLoginTime ? new Date(lastLoginTime).toLocaleString() : 'First login';

  return {
    subject: '⚠️ New Login Location Detected',
    html: `
${getEmailHeader()}
        <div class="content">
            <h2 style="color: #1b4d3e;">Login Activity Alert</h2>
            
            <div class="alert-box warning">
                <h3>🔐 NEW DEVICE OR LOCATION LOGIN</h3>
                <p>Your account was accessed from a new location or device.</p>
            </div>

            <table class="details-table">
                <tr>
                    <th colspan="2" style="background-color: #fffbea;">Login Information</th>
                </tr>
                <tr>
                    <td><strong>Account Email:</strong></td>
                    <td>${userEmail}</td>
                </tr>
                <tr>
                    <td><strong>Login Time:</strong></td>
                    <td>${timestamp}</td>
                </tr>
                <tr>
                    <td><strong>Device:</strong></td>
                    <td>${newDevice || 'Unknown'}</td>
                </tr>
                <tr>
                    <td><strong>IP Address:</strong></td>
                    <td><code>${ipAddress}</code></td>
                </tr>
                <tr>
                    <td><strong>Previous Login:</strong></td>
                    <td>${lastTime}</td>
                </tr>
            </table>

            <p style="color: #666; margin-top: 20px;">
                If this wasn't you, <strong>change your password immediately</strong> and contact support.
            </p>

            <a href="http://localhost:3000/account-security" class="action-button">🔒 Secure Your Account</a>
        </div>

${getEmailFooter()}
    `
  };
};

/**
 * VERIFICATION EMAIL - Email Confirmation
 */
exports.verificationEmail = (data) => {
  const { userEmail, otp, expiryMinutes = 15 } = data;

  return {
    subject: '✅ Verify Your iVotePK Email',
    html: `
${getEmailHeader()}
        <div class="content">
            <h2 style="color: #1b4d3e;">Email Verification Required</h2>
            
            <div class="alert-box success">
                <h3>✉️ VERIFY YOUR EMAIL</h3>
                <p>Thank you for registering. Please verify your email to complete registration.</p>
            </div>

            <p style="margin: 20px 0;">Your verification code:</p>

            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 4px; border: 2px solid #1b4d3e;">
                <p style="font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #1b4d3e; margin: 0;">${otp}</p>
            </div>

            <table class="details-table">
                <tr>
                    <td><strong>Code Expires In:</strong></td>
                    <td>${expiryMinutes} minutes</td>
                </tr>
                <tr>
                    <td><strong>Valid For Email:</strong></td>
                    <td>${userEmail}</td>
                </tr>
            </table>

            <p style="color: #999; font-size: 12px;">
                Do not share this code with anyone. iVotePK will never ask for your code via email or phone.
            </p>

            <a href="http://localhost:3000/register/verify" class="action-button">✅ Verify Email</a>
        </div>

${getEmailFooter()}
    `
  };
};

/**
 * PASSWORD RESET EMAIL
 */
exports.passwordResetEmail = (data) => {
  const { userEmail, resetToken, expiryMinutes = 30 } = data;
  const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

  return {
    subject: '🔑 Reset Your iVotePK Password',
    html: `
${getEmailHeader()}
        <div class="content">
            <h2 style="color: #1b4d3e;">Password Reset Request</h2>
            
            <div class="alert-box warning">
                <h3>🔐 PASSWORD RESET INITIATED</h3>
                <p>You requested to reset your password. Click the link below to proceed.</p>
            </div>

            <table class="details-table">
                <tr>
                    <td><strong>Account Email:</strong></td>
                    <td>${userEmail}</td>
                </tr>
                <tr>
                    <td><strong>Link Expires In:</strong></td>
                    <td>${expiryMinutes} minutes</td>
                </tr>
            </table>

            <p style="margin-top: 20px; color: #666;">
                <strong>Click the button below to reset your password:</strong>
            </p>

            <a href="${resetLink}" class="action-button">🔑 Reset Password</a>

            <p style="color: #999; font-size: 12px; margin-top: 20px;">
                If you didn't request this reset, ignore this email. Your password will not change unless you complete the reset process.
            </p>
        </div>

${getEmailFooter()}
    `
  };
};

/**
 * SUCCESSFUL REGISTRATION EMAIL
 */
exports.registrationSuccessEmail = (data) => {
  const { userEmail, userName, registrationDate } = data;
  const timestamp = new Date(registrationDate).toLocaleString();

  return {
    subject: '🎉 Welcome to iVotePK!',
    html: `
${getEmailHeader()}
        <div class="content">
            <h2 style="color: #1b4d3e;">Welcome, ${userName}!</h2>
            
            <div class="alert-box success">
                <h3>🎉 REGISTRATION COMPLETE</h3>
                <p>Your account is now active and ready to use for voting.</p>
            </div>

            <table class="details-table">
                <tr>
                    <th colspan="2" style="background-color: #f0f9f4;">Account Details</th>
                </tr>
                <tr>
                    <td><strong>Email:</strong></td>
                    <td>${userEmail}</td>
                </tr>
                <tr>
                    <td><strong>Registration Date:</strong></td>
                    <td>${timestamp}</td>
                </tr>
                <tr>
                    <td><strong>Status:</strong></td>
                    <td><span class="badge low">ACTIVE</span></td>
                </tr>
            </table>

            <h3 style="color: #1b4d3e; margin-top: 20px;">Your Next Steps:</h3>
            <ol style="color: #666; line-height: 1.8;">
                <li>Complete your fingerprint and face biometric setup</li>
                <li>Answer your security questions for account protection</li>
                <li>Keep your login credentials secure</li>
                <li>Enable two-factor authentication for extra security</li>
            </ol>

            <a href="http://localhost:3000/dashboard" class="action-button">📊 Go to Dashboard</a>
        </div>

${getEmailFooter()}
    `
  };
};

/**
 * ACCOUNT LOCKED EMAIL
 */
exports.accountLockedEmail = (data) => {
  const { userEmail, reason, lockedUntil, supportEmail = 'support@ivotepk.pk' } = data;
  const unlockTime = new Date(lockedUntil).toLocaleString();

  return {
    subject: '🔒 Your Account Has Been Locked',
    html: `
${getEmailHeader()}
        <div class="content">
            <h2 style="color: #1b4d3e;">Account Security Alert</h2>
            
            <div class="alert-box">
                <h3>⛔ ACCOUNT LOCKED</h3>
                <p>Your account has been temporarily locked for security reasons.</p>
            </div>

            <table class="details-table">
                <tr>
                    <th colspan="2" style="background-color: #fff5f5;">Lock Details</th>
                </tr>
                <tr>
                    <td><strong>Account Email:</strong></td>
                    <td>${userEmail}</td>
                </tr>
                <tr>
                    <td><strong>Reason:</strong></td>
                    <td>${reason}</td>
                </tr>
                <tr>
                    <td><strong>Locked Until:</strong></td>
                    <td>${unlockTime}</td>
                </tr>
            </table>

            <p style="color: #666; margin-top: 20px; padding: 15px; background-color: #f0f0f0; border-radius: 4px;">
                <strong>What happened?</strong> We detected suspicious activity on your account and locked it temporarily for your protection.
            </p>

            <h3 style="color: #1b4d3e; margin-top: 20px;">How to Regain Access:</h3>
            <ol style="color: #666;">
                <li>Wait for the lock to expire automatically</li>
                <li>Or contact support to unlock immediately</li>
            </ol>

            <a href="http://localhost:3000/support" class="action-button">📞 Contact Support</a>
        </div>

${getEmailFooter()}
    `
  };
};

/**
 * Generic function to send any template
 */
exports.sendTemplateEmail = async (sendEmailFunction, templateName, data) => {
  try {
    let emailContent;
    
    switch(templateName) {
      case 'fraud_duplicate_email':
        emailContent = exports.fraudAlertDuplicateEmail(data);
        break;
      case 'fraud_duplicate_vote':
        emailContent = exports.fraudAlertDuplicateVote(data);
        break;
      case 'activity_suspicious_login':
        emailContent = exports.activityAlertSuspiciousLogin(data);
        break;
      case 'verify_email':
        emailContent = exports.verificationEmail(data);
        break;
      case 'password_reset':
        emailContent = exports.passwordResetEmail(data);
        break;
      case 'registration_success':
        emailContent = exports.registrationSuccessEmail(data);
        break;
      case 'account_locked':
        emailContent = exports.accountLockedEmail(data);
        break;
      default:
        throw new Error(`Unknown email template: ${templateName}`);
    }

    return await sendEmailFunction({
      email: data.email || data.userEmail,
      subject: emailContent.subject,
      message: emailContent.html
    });

  } catch (error) {
    console.error(`Error sending ${templateName} email:`, error);
    throw error;
  }
};
