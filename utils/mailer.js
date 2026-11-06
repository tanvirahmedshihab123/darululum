const nodemailer = require('nodemailer');

// Transporter তৈরি (SMTP কনফিগারেশন)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * মেইল পাঠানোর মেইন ফাংশন
 * @param {string} to - কার কাছে পাঠাবে (যেমন: sabatanvir2019@gmail.com)
 * @param {string} subject - মেইলের সাবজেক্ট
 * @param {string} html - মেইলের বডি (HTML সাপোর্ট করে)
 */
const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"UNFORGOTTEN" <tanvirahmedshihab36@gmail.com>',
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send failed:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = { sendEmail };