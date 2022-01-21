import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import { User } from "../models/User.js";

//LOADING ENVIRONMENT VARIABLE
dotenv.config();

const JWT_CONFIRM_ACCOUNT = process.env.JWT_CONFIRM_ACCOUNT;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE;
const CLIENT_URL = process.env.CLIENT_URL;
const SGMAIL_API_KEY = process.env.SGMAIL_API_KEY;
const JWT_RESET_PASSWORD = process.env.JWT_RESET_PASSWORD;
const JWT_EMAIL_FROM = process.env.JWT_EMAIL_FROM;

//SETTING SGMAIL APIKEY
sgMail.setApiKey(SGMAIL_API_KEY);

//SIGN-UP
export const signUp = async (req, res) => {
  const { username, email, password1, password2 } = req.body;

  try {
    const alreadyExists = await User.findOne({ email });
    if (alreadyExists) {
      return res.status(409).json({ errorMessage: "User already exists" });
    }
    if (!username || !email || !password1 || !password2) {
      return res.status(400).json({ errorMessage: "All fields are required" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ errorMessage: "Invalid email" });
    }
    if (!validator.isLength(password1, { min: 6 })) {
      return res
        .status(400)
        .json({ errorMessage: "Password must be at least 6 characters" });
    }
    if (!validator.equals(password1, password2)) {
      return res.status(400).json({ errorMessage: `Passwords don't match` });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password1, salt);
    if (!hashPassword) {
      return res
        .status(500)
        .json({ ErrorMessage: "Problems with password hashing" });
    }

    const payload = {
      username,
      hashPassword,
      email,
    };

    const token = jwt.sign(payload, JWT_CONFIRM_ACCOUNT, { expiresIn: "15m" });

    const emailData = {
      from: JWT_EMAIL_FROM,
      to: email,
      subject: "Confirm your account - Tea Store",
      html: `
                <h1>Hi ${username}! Click below to confirm your account:</h1>
                <p>${CLIENT_URL}/account-authentication/${token}</p>
                <p style = {{fontWeight : 'bold'}}>This link will expire after 15 minutes. To request another verification
                link, please log-in to prompt a re-send link.</p>
                <hr/>
                <p>This email contains sensitive info</p>
                <p>${CLIENT_URL}</p>
            `,
    };

    const emailSent = await sgMail.send(emailData);
    if (!emailSent) {
      return res.json({ errorMessage: `${err}` });
    } else {
      console.log("sent");
      return res.status(200).json({
        successMessage: "Check your mailbox to confirm your account",
      });
    }
  } catch (error) {
    return res.status(500).json({ errorMessage: `${error}` });
  }
};

//ACCOUNT CONFIRMATION

export const accountAuth = async (req, res) => {
  const { token } = req.body;

  try {
    if (token) {
      jwt.verify(token, JWT_CONFIRM_ACCOUNT, (err, decoded) => {
        if (err) {
          return res
            .status(401)
            .json({ errorMessage: "Incorrect or expired link" });
        }
        const { username, email, hashPassword } = decoded;
        const user = new User({
          username,
          email,
          password: hashPassword,
        });

        const newUser = user.save((err, success) => {
          if (err) {
            return res.status(400).json({ errorMessage: "Sign-up error" });
          }
          return res.status(200).json({
            successMessage: "Account confirmed successfully!",
            username,
          });
        });
      });
    }
  } catch (error) {
    res.status(500).json({ errorMessage: "Something went wrong: try again" });
  }
};

//SIGN-IN
export const signIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ errorMessage: "Invalid credentials" });
    }

    if (!email || !password) {
      return res.status(400).json({ errorMessage: "All fields are required" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ errorMessage: "Invalid email" });
    }

    //JWT
    const payload = {
      user: {
        _id: user._id,
      },
    };

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ errorMessage: "Invalid credentials" });
    } else {
      jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE }, (err, token) => {
        if (err) console.log("Jwt error: ", err);

        const { _id, username, email, role } = user;

        res.json({
          token,
          user: { _id, username, email, role },
        });
      });
    }
  } catch (error) {
    return res.status(500).json({ errorMessage: `${error}` });
  }
};

//GOOGLE LOGIN

export const googleLogin = (req, res) => {
  const { token } = req.body;

  const client = new OAuth2Client(
    "203822999175-ic2e949ccriqa983otoa5949dodi7iif.apps.googleusercontent.com"
  );
  client
    .verifyIdToken({
      idToken: token,
      audience:
        "203822999175-ic2e949ccriqa983otoa5949dodi7iif.apps.googleusercontent.com",
    })
    .then((response) => {
      const {
        email_verified,
        name,
        email,
        picture: userImage,
        given_name: firstName,
        family_name: lastName,
      } = response.payload;

      if (email_verified) {
        User.findOne({ email }).exec((err, user) => {
          if (user) {
            user.image = userImage;
            const payload = {
              user: {
                _id: user._id,
              },
            };
            const token = jwt.sign(payload, JWT_SECRET, {
              expiresIn: JWT_EXPIRE,
            });
            const { _id, email, username, role } = user;
            return res.json({
              token,
              user: {
                _id,
                email,
                username,
                role,
                userImage,
                firstName,
                lastName,
              },
            });
          } else {
            let password = email + JWT_SECRET;
            user = new User({
              username: firstName,
              email,
              password,
              image: userImage,
            });
            user.save((err, save) => {
              if (err) {
                return res.status(400).json({ errorMessage: `${err}` });
              }
              const token = jwt.sign({ _id: user._id }, JWT_SECRET, {
                expiresIn: JWT_EXPIRE,
              });
              const { _id, email, username, role } = user;

              const emailData = {
                from: JWT_EMAIL_FROM,
                to: email,
                subject: "Account created - Tea Store",
                html: `
                                <h1>Hi ${user.username}! Your account has been created</h1>
                                <p style = {{fontWeight : 'bold'}}>Thanks for logging in with google. 
                                To access the site via our custom sign-in form, choose a password for your account at the following link:
                                <a href = "${CLIENT_URL}/user/password/forgot-password">FORGOT PASSWORD</a></p>
                                <hr/>
                                <p>${CLIENT_URL}</p>
                            `,
              };

              sgMail.send(emailData, (err, sent) => {
                if (err) {
                  return res.json({ errorMessage: `${err}` });
                }
              });

              return res.status(200).json({
                token,
                user: {
                  _id,
                  email,
                  username,
                  role,
                  userImage,
                  firstName,
                  lastName,
                },
                successMessage:
                  "Account successfully created! Check your mailbox",
              });
            });
          }
        });
      } else {
        return res.status(400).json({ errorMessage: "Google login failed" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ errorMessage: "Server Error" });
    });
};

//FORGOT PASSWORD

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ errorMessage: "All fields are required" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ errorMessage: "Invalid email" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ errorMessage: "Invalid credentials" });
    }

    const payload = {
      user: {
        _id: user._id,
      },
    };

    const token = jwt.sign(payload, JWT_RESET_PASSWORD, { expiresIn: "15m" });

    user.resetPwdToken = token;
    user.expirePwdToken = Date.now() + 900000;

    const updateUser = await user.save();

    const emailData = {
      from: JWT_EMAIL_FROM,
      to: email,
      subject: "Reset Password - Tea Store",
      html: `
                <h1>Hi ${user.username}! Click below to reset your account password:</h1>
                <p>${CLIENT_URL}/user/password/reset-password/${token}</p>
                <p style = {{fontWeight : 'bold'}}>This link will expire after 15 minutes. To request another verification
                link, please navigate to forgot-password page to prompt a re-send link.</p>
                <hr/>
                <p>This email contains sensitive info</p>
                <p>${CLIENT_URL}</p>
            `,
    };

    if (updateUser) {
      const emailSent = await sgMail.send(emailData);
      if (!emailSent) {
        return res.json({ errorMessage: `${err}` });
      } else {
        console.log("sent");
        return res.status(200).json({
          successMessage: "Check your mailbox to reset your password",
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      errorMessage: "Something gone wrong. Try again",
    });
  }
};

//RESET PASSWORD

export const resetPassword = async (req, res) => {
  const { password, token } = req.body;

  try {
    if (!password) {
      return res.status(400).json({ errorMessage: "All fields are required" });
    }

    if (!validator.isLength(password, { min: 6 })) {
      return res
        .status(400)
        .json({ errorMessage: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({
      resetPwdToken: token,
      expirePwdToken: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(401)
        .json({ errorMessage: "Incorrect or expired link" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    user.password = hashPassword;
    user.resetPwdToken = undefined;
    user.expirePwdToken = undefined;

    const updateUser = await user.save();

    if (updateUser) {
      return res.status(200).json({
        successMessage:
          "Password resetted sucessfully! Redirect to Sign-in page...",
      });
    } else {
      return res
        .status(400)
        .json({ errorMessage: "Something goes wrong: try again" });
    }
  } catch (error) {
    return res.status(500).json({ errorMessage: "Server error: try again" });
  }
};

/** GET USER BY EMAIL ****/

export const getUserByEmail = async (req, res) => {
  let { email } = req.body;
  console.log(email);

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(200).json({ successMessage: "You can use this email" });
    } else {
      res.status(409).json({ errorMessage: "This email already exist" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ errorMessage: "Something goes wrong: try again" });
  }
};

export const updateEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const alreadyExists = await User.findOne({ email });

    if (alreadyExists) {
      return res
        .status(409)
        .json({ errorMessage: "This email address already exists" });
    }
    if (!email) {
      return res.status(400).json({ errorMessage: "Email field is required" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ errorMessage: "Invalid email" });
    }

    User.findOneAndUpdate(
      {
        _id: req.user._id,
      },
      { $set: { email: email } },
      async function (err, result) {
        if (err) {
          return res.status(400).json({ errorMessage: `${err}` });
        } else {
          const emailData = {
            from: JWT_EMAIL_FROM,
            to: email,
            subject: "Email successfully updated! - Tea Store",
            html: `
                      <h1>Hi ${req.user.username}! Your Tea Store account email address has been successfully updated.</h1>
                      <p>Your new email address is ${email}<p>
                      <p>${CLIENT_URL}</p>
                  `,
          };

          const emailSent = await sgMail.send(emailData);
          if (!emailSent) {
            return res.json({ errorMessage: `${err}` });
          } else {
            return res.status(200).json({
              successMessage:
                "Email address successfully updated! We have sent you an email with the new account data. Log-in again!",
            });
          }
        }
      }
    );
  } catch (error) {
    return res
      .status(500)
      .json({ errorMessage: "Something goes wrong: try again" });
  }
};

export const updateUserName = async (req, res) => {
  const { username } = req.body;

  try {
    if (!username) {
      return res
        .status(400)
        .json({ errorMessage: "Username field is required" });
    } else {
      User.findOneAndUpdate(
        {
          _id: req.user._id,
        },
        { $set: { username: username } },
        async function (err, result) {
          if (err) {
            return res.status(400).json({ errorMessage: `${err}` });
          } else {
            const emailData = {
              from: JWT_EMAIL_FROM,
              to: req.user.email,
              subject: "Username successfully updated! - Tea Store",
              html: `
                        <h1>Hi ${username}! Your Tea Store account username has been successfully updated.</h1>
                        <p>Your new username is ${username}<p>
                        <p>${CLIENT_URL}</p>
                    `,
            };

            const emailSent = await sgMail.send(emailData);
            if (!emailSent) {
              return res.json({ errorMessage: `${err}` });
            } else {
              return res.status(200).json({
                successMessage:
                  "Username successfully updated! We have sent you an email with the new account data. Log-in again! ",
              });
            }
          }
        }
      );
    }
  } catch (error) {
    return res
      .status(500)
      .json({ errorMessage: "Something goes wrong: try again" });
  }
};
