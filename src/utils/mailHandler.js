const nodemailer = require('nodemailer');

exports.sendMail = ({ mailTo, mailType, options }) => {
  try {
    const mailOptions = setOptions(mailTo, mailType, options);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });
    transporter.sendMail(mailOptions);
  } catch (err) {
    console.log(err);
    throw new ErrorResponse('Error occured while sending email :(', 500);
  }
};

const setOptions = (mailTo, mailType, options) => {
  const result = {
    from: `Passave ${process.env.EMAIL}`,
    to: mailTo,
  };

  switch (mailType) {
    case 'REGISTRATION':
      result.subject = `Welcome ${options.username}!`;
      result.html = `
        <h3>You have succesfully created your account.</h3></br>
        <p>Dear User,</p>
        <p>Please <a href='${process.env.WEBSITE_URL}/auth/verify/${options.token}'>click</a> to activate your account.</p>
      `;
      break;

    case 'USER_PASSWORD_RESET':
      result.subject = `Reset Password`;
      result.html = `
              <h3>You have requested a reset of your password.</h3></br>
              <p>Dear <i>${options.username}</i>,</p>
              <p>Copy this token and paste into your application! <b>${options.token}</b></p>
            `;
      break;
  }

  return result;
};
