// utils/sendMail.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // false for port 587
  auth: {
    user: "akashdokala7@gmail.com", // same as your Brevo account email
    pass: "xsmtpsib-a378cbad67d9a93c69263cdfaa917133e49cb07958a537f819884563a91fba11-6yu04O8RWwYjOUDx", // the key value from Brevo
  },
});

const sendMail = async (to, subject, html) => {
  const mailOptions = {
    from: `"FixIt Support" <akashdokala7@gmail.com>`,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message);
  }
};

module.exports = sendMail;
