import validator from "validator";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

//LOADING ENVIRONMENT VARIABLE
dotenv.config();

const SGMAIL_API_KEY = process.env.SGMAIL_API_KEY;
const JWT_CONTACT_US_FROM = process.env.JWT_CONTACT_US_FROM;
const JWT_EMAIL_FROM = process.env.JWT_EMAIL_FROM;

//SETTING SGMAIL APIKEY
sgMail.setApiKey(SGMAIL_API_KEY);

export const contactUs = async (req, res) => {
  const { name, email, subject, message } = req.body;
  try {
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ errorMessage: "All fields are required" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ errorMessage: "Invalid email" });
    }
    if (!validator.isLength(subject, { max: 100 })) {
      return res
        .status(400)
        .json({ errorMessage: "Subject can't be more of 100 characters" });
    }

    const emailData = {
      from: JWT_CONTACT_US_FROM,
      to: JWT_EMAIL_FROM,
      subject: subject,
      html: `<p>${message}</p> <hr> <p>From : ${name} </p> <hr> <p>Reply to: ${email} </p> `,
    };

    const emailSent = await sgMail.send(emailData);
    if (!emailSent) {
      return res.json({ errorMessage: `${err}` });
    } else {
      return res.status(200).json({
        successMessage:
          "Thanks for contacting us! We will get back to you as soon as possible.",
      });
    }
  } catch (error) {
    return res.status(500).json({ errorMessage: `${error}` });
  }
};
