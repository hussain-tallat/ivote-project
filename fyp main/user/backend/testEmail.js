const mongoose = require('mongoose');
const dotenv = require('dotenv');
const sendEmail = require('./utils/sendEmail');

dotenv.config();

const testEmail = async () => {
  try {
    console.log('\n🧪 Testing Email Configuration...\n');
    console.log(`Sending test OTP to: ${process.env.EMAIL_USER}\n`);

    const testOTP = '123456';

    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #00563B; margin: 0;">iVotePK</h1>
            <p style="color: #666; margin: 5px 0;">Secure Digital Elections for Pakistan</p>
          </div>
          
          <h2 style="color: #00563B;">Email Configuration Test</h2>
          <p>Hello,</p>
          <p>This is a test email to verify that your iVotePK system can send emails successfully.</p>
          
          <div style="background: linear-gradient(135deg, #00563B 0%, #004d33 100%); color: white; padding: 20px; text-align: center; font-size: 36px; font-weight: bold; border-radius: 8px; margin: 25px 0; letter-spacing: 5px;">
            ${testOTP}
          </div>
          
          <p><strong style="color: #dc3545;">This is a TEST OTP.</strong></p>
          <p>If you received this email, your email configuration is working perfectly! ✅</p>
          
          <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #155724;"><strong>✅ Success!</strong></p>
            <p style="margin: 5px 0 0 0; color: #155724;">Your iVotePK system is now configured to send real emails!</p>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <div style="text-align: center;">
            <p style="color: #666; font-size: 12px; margin: 0;">This is an automated test email from iVotePK</p>
            <p style="color: #666; font-size: 12px; margin: 5px 0;">Intelligent Voting System - Final Year Project</p>
          </div>
        </div>
      </div>
    `;

    await sendEmail({
      email: process.env.EMAIL_USER,
      subject: '✅ iVotePK - Email Configuration Test Successful!',
      message
    });

    console.log('✅ TEST EMAIL SENT SUCCESSFULLY!\n');
    console.log('📧 Check your Gmail inbox: ' + process.env.EMAIL_USER);
    console.log('\n🎉 Email configuration is working!\n');
    console.log('You can now register users and they will receive OTP in their real Gmail inbox!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ EMAIL TEST FAILED!');
    console.error('Error:', error.message);
    console.error('\nPlease check:');
    console.error('1. Gmail App Password is correct');
    console.error('2. 2-Factor Authentication is enabled');
    console.error('3. App Password has no spaces');
    console.error('4. Gmail address is correct\n');
    process.exit(1);
  }
};

testEmail();
