const nodemailer = require('nodemailer');

module.exports = async function (context) {
  // 1. Debug: Check if variables exist (don't log the values for security!)
  context.log('Checking Environment Variables...');
  context.log('GMAIL_USER exists: ' + (process.env.GMAIL_USER ? 'YES' : 'NO'));
  context.log('GMAIL_APP_PASS exists: ' + (process.env.GMAIL_APP_PASS ? 'YES' : 'NO'));

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
    context.error('CRITICAL: Environment variables are missing in Function Settings.');
    return context.res.json({ 
      success: false, 
      error: 'Server configuration error: Missing Gmail credentials.' 
    }, 500);
  }

  const payload = typeof context.req.body === 'string' 
    ? JSON.parse(context.req.body) 
    : context.req.body;

  const { email, otp, name } = payload;

  if (!email || !otp) {
    return context.res.json({ success: false, error: 'Missing email or OTP' }, 400);
  }

  // 2. Create the transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASS
    }
  });

  const mailOptions = {
    from: `"Greenlink System" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Your Greenlink OTP',
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #16a34a;">Greenlink Password Reset</h2>
        <p>Hello ${name || 'User'},</p>
        <p>You requested a password reset. Use the following 6-digit OTP to proceed:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #16a34a; padding: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #888;">Greenlink Smart Waste Management System</p>
      </div>
    `
  };

  try {
    context.log(`Attempting to send email to ${email}...`);
    await transporter.sendMail(mailOptions);
    context.log(`Successfully sent OTP to ${email}`);
    return context.res.json({ success: true });
  } catch (error) {
    context.error(`Error sending email: ${error.message}`);
    return context.res.json({ success: false, error: error.message }, 500);
  }
};
