const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

/**
 * Production-level Email Service
 * Supports: Gmail SMTP, SendGrid API, Console fallback
 */

const sendEmailWithGmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  await transporter.verify();
  console.log('✅ Gmail transporter ready');

  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
    priority: 'high',
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high'
    }
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ Email sent via Gmail to ${options.email}`);
  return info;
};

const sendEmailWithSendGrid = async (options) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: options.email,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER,
      name: process.env.FROM_NAME || 'iVotePK'
    },
    subject: options.subject,
    html: options.message,
  };

  const response = await sgMail.send(msg);
  console.log(`✅ Email sent via SendGrid to ${options.email}`);
  return response;
};

const displayOTPInConsole = (options) => {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║                                                       ║');
  console.log('║  📧 EMAIL NOT CONFIGURED - OTP DISPLAYED BELOW       ║');
  console.log('║                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log(`\n📬 To: ${options.email}`);
  console.log(`📋 Subject: ${options.subject}\n`);

  const otpMatch = options.message.match(/\d{6}/);
  if (otpMatch) {
    console.log('╔═══════════════════════════════════════╗');
    console.log('║                                       ║');
    console.log(`║     🔑 YOUR OTP CODE: ${otpMatch[0]}        ║`);
    console.log('║                                       ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log('\n⚠️  Copy this code and enter it on the website!\n');
  }

  console.log('═══════════════════════════════════════════════════════\n');
};

const sendEmail = async (options) => {
  try {
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your_sendgrid_api_key') {
      const response = await sendEmailWithSendGrid(options);
      return { success: true, method: 'sendgrid', response };
    }

    if (process.env.EMAIL_USER &&
      process.env.EMAIL_USER !== 'your_email@gmail.com' &&
      process.env.EMAIL_PASS &&
      process.env.EMAIL_PASS !== 'your_gmail_app_password_here') {
      const info = await sendEmailWithGmail(options);
      return { success: true, method: 'gmail', info };
    }

    displayOTPInConsole(options);
    return { success: false, method: 'console', message: 'Email service is not configured. OTP printed in backend console.' };

  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.log('\n⚠️  FALLBACK: Displaying OTP in console\n');
    displayOTPInConsole(options);

    return { success: false, method: 'console_fallback', error: error.message };
  }
};

module.exports = sendEmail;
