// sendSMS.js
const twilio = require('twilio');
require('dotenv').config();

const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const sendSMS = async (phone, otp) => {
  try {
    const message = await client.messages.create({
      body: `Your OTP is: ${otp}`,
      from: process.env.TWILIO_PHONE, // Example: '+1234567890'
      to: phone,                      // Include country code! e.g. '+91xxxxxxxxxx'
    });
    console.log('✅ OTP sent via Twilio:', message.sid);
  } catch (err) {
    console.error('❌ Twilio SMS failed:', err.message);
  }
};

module.exports = sendSMS;