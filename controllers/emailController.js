const { sendEmail } = require('../utils/mailer');

exports.sendCustomEmail = async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    // ভ্যালিডেশন
    if (!to || !subject || !message) {
      return res.status(400).json({ success: false, message: 'to, subject এবং message আবশ্যক' });
    }
    if (!/^\S+@\S+\.\S+$/.test(to)) {
      return res.status(400).json({ success: false, message: 'সঠিক ইমেইল অ্যাড্রেস দিন' });
    }

    // প্রফেশনাল ডার্ক-থিম HTML টেম্পলেট
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #000000; color: #ffffff; padding: 40px 20px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #B00020; margin: 0; font-size: 24px; letter-spacing: 1px;">UNFORGOTTEN</h1>
          <p style="color: #888; font-size: 12px; margin-top: 5px; text-transform: uppercase; letter-spacing: 2px;">So you never forget who you were</p>
        </div>
        <div style="background-color: #0a0a0a; padding: 30px; border-radius: 8px; border: 1px solid #222;">
          <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">${subject}</h2>
          <p style="color: #cccccc; font-size: 16px; line-height: 1.6;">${message}</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #666; font-size: 12px;">Sent from your private journal at <a href="https://donotforget.online" style="color: #B00020; text-decoration: none;">donotforget.online</a></p>
        </div>
      </div>
    `;

    await sendEmail(to, subject, htmlBody);

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email Controller Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};