const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config({ path: "../.env" });

const sendEmail = async (email, subject, text, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      //      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      text: text,
      html: html,
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.log("Error occurred: " + error.message);
  }

  return;
};

module.exports = sendEmail;
