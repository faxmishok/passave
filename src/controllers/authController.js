const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { sendMail } = require('../utils/mailHandler');

//@desc   registration for User
//@route  POST /auth/register
//@access PUBLIC
exports.createUser = asyncHandler(async (req, res, next) => {
  const {
    first_name,
    last_name,
    username,
    password,
    passwordConfirmation,
    email,
  } = req.body;

  if (password != passwordConfirmation) {
    return res.render('sign-up', {
      success: false,
      title: 'Passave | Sign up',
      message: 'Passwords are not matched!',
    });
  }

  const newUser = new User({
    first_name,
    last_name,
    username,
    password,
    passwordConfirmation,
    email,
  });

  var successFlag;
  await newUser
    .save()
    .then(() => {
      successFlag = true;
    })
    .catch((err) => {
      return res.render('sign-up', {
        success: false,
        title: 'Passave | Sign up',
        message: err,
      });
    });

  if (successFlag) {
    const token = newUser.getSignedJWTToken();

    await sendMail({
      mailTo: email,
      mailType: 'REGISTRATION',
      options: { username, id: newUser._id, token },
    });

    return await res.render('postSignup', { title: 'Passave | Post Sign-up' });
  }
});

//@desc   Activate account
//@route  GET /auth/verify/:token
//@access PUBLIC
exports.activateAccount = asyncHandler(async (req, res, next) => {
  const token = req.params.token;
  var decoded;
  await jwt.verify(token, process.env.JWT_SECRET_KEY, (err, result) => {
    if (err) {
      return res.render('verificationFailed', {
        success: false,
        title: 'Passave | Verification Failed',
        message: err,
      });
    } else {
      decoded = result;
    }
  });

  await User.updateOne({ _id: decoded.userId }, { status: 'VERIFIED' });

  return res.render('accountActivated', {
    title: 'Passave | Successful Activation',
  });
});

//@desc   login for users
//@route  POST /auth/login
//@access PUBLIC
exports.loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select(
    'email password username status'
  );

  if (!user) {
    return res.render('sign-in', {
      title: 'Passave | Sign in',
      code: 'red',
      message: 'Provided email is not registered.',
    });
  }

  if (user.status === 'PENDING') {
    return res.render('sign-in', {
      title: 'Passave | Sign in',
      code: 'red',
      message: 'Please verify your account!',
    });
  }

  const isMatch = user.isMatchedPassword(password);

  if (!isMatch) {
    return res.render('sign-in', {
      title: 'Passave | Sign in',
      code: 'red',
      message: 'Password is incorrect!',
    });
  }

  const token = user.getSignedJWTToken();

  return res
    .cookie('token', token, {
      expires: new Date(Date.now() + 3600000),
      httpOnly: true,
    })
    .redirect('/dashboard');
});

//@desc   Forget password
//@route  POST /auth/forget
//@access PUBLIC
exports.forgetPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).select(
    'username email reset_token reset_expires'
  );

  if (!user) {
    return res.render('forgot', {
      title: 'Passave | Forgot password',
      code: 'red',
      message: 'User by that email does not exist!',
    });
  }

  user.setResetToken();

  await user.save();

  sendMail({
    mailTo: user.email,
    mailType: 'USER_PASSWORD_RESET',
    options: { username: user.username, token: user.reset_token },
  });

  return res.render('preReset', {
    title: 'Passave | Reset Password',
    code: 'green',
    message: 'Reset token has been sent to your email address!',
  });
});

// @desc Post forget paste reset token
// @route POST /auth/reset
// @access PUBLIC
exports.postForget = asyncHandler(async (req, res, next) => {
  const { reset_token } = req.body;

  const user = await User.findOne({
    reset_token,
    reset_expires: { $gt: Date.now() },
  }).select('reset_token reset_expires');

  if (!user) {
    return res.render('preReset', {
      title: 'Passave | Reset Password',
      code: 'red',
      message: 'Token is invalid or has expired!',
    });
  }

  return res.render('reset', {
    title: 'Passave | Reset Password',
    code: 'green',
    resetURL: `/auth/reset/${reset_token}`,
    message: 'Activation token is verified. You can now reset your password.',
  });
});

// @desc   Reset password
// @route  POST /auth/reset/:token
// @access PUBLIC
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const reset_token = req.params.token;

  const user = await User.findOne({
    reset_token,
    reset_expires: { $gt: Date.now() },
  }).select('reset_token reset_expires');

  const { password, passwordConfirmation } = req.body;

  if (password !== passwordConfirmation) {
    return res.render('reset', {
      title: 'Passave | Reset Password',
      code: 'red',
      resetURL: `/auth/reset/${reset_token}`,
      message: 'Passwords do not match!',
    });
  }

  user.password = password;
  user.reset_token = null;
  user.reset_expires = null;

  await user
    .save()
    .then(() => {
      return res.render('sign-in', {
        title: 'Passave | Sign in',
        code: 'green',
        message: 'Your password has been successfully reset!',
      });
    })
    .catch((err) => {
      return res.render('forgot', {
        title: 'Passave | Forgot Password',
        code: 'red',
        message:
          'There has been an internal server error. Please try again later.',
      });
    });
});

//@desc   Email resend route
//@route  POST /auth/resend
//@access PUBLIC
exports.postEmailResend = asyncHandler(async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, status: 'PENDING' }).select(
      'username'
    );

    if (!user) {
      return next(new ErrorResponse(''));
    }
    const options = { username: user.username, id: user._id };

    options['token'] = user.getSignedJWTToken();
    sendMail({
      mailTo: email,
      mailType,
      options,
    });
  } catch (err) {}
  return res.status(200).json({ success: true, message: 'Email sent!' });
});

//@desc   Sign out route
//@route  POST /auth/signout
//@access PUBLIC
exports.postSignOut = asyncHandler(async (req, res, next) => {
  res.clearCookie('token').render('sign-in', {
    title: 'Passave | Sign in',
    code: 'green',
    message: 'Signed out successfully!',
  });
});
