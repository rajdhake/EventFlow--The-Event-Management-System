const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
//.env is in root folder
dotenv.config({ path: "../.env" });

const transporter = nodemailer.createTransport({
  // add porkbundle email and password
  // service: 'porkbun',
  //pop3
  host: "smtp.porkbun.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const mailOptions = {
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER,
  subject: "Verify your email address",
  text: "Testing for myself",
  html: "<h1> Hello World</h1>",
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log("Error occurred: " + error.message);
  } else {
    console.log("Email sent: " + info.response);
  }
});
module.exports = transporter;
