const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../utils/mailHandler");

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
    next(new ErrorResponse("Passwords are not matched!", 400));
  }

  const newUser = new User({
    first_name,
    last_name,
    username,
    password,
    passwordConfirmation,
    email,
  });

  await newUser.save();

  const token = newUser.getSignedJWTToken();

  await sendMail({
    mailTo: email,
    mailType: "REGISTRATION",
    options: { username, id: newUser._id, token },
  });

  return res
    .status(201)
    .json({ success: true, message: "You successfully created a user!" });
});

//@desc   Activate account
//@route  POST /auth/verify/:token
//@access PUBLIC
exports.activateAccount = asyncHandler(async (req, res, next) => {
  const token = req.params.token;
  const decoded = await jwt.verify(token, process.env.JWT_SECRET_KEY);
  console.log(decoded);

  await User.updateOne({ _id: decoded.userId }, { status: "VERIFIED" });

  return res
    .status(201)
    .json({ success: true, message: "Account activated. You can log in now." });
});

//@desc   login for users
//@route  POST /auth/login
//@access PUBLIC
exports.loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse("Please provide email and password!", 400));
  }

  const user = await User.findOne({ email }).select("email password status");

  if (!user) {
    return next(new ErrorResponse("Provided email is not correct!", 400));
  }

  if (user.status === "PENDING") {
    return next(new ErrorResponse("Please verify your account!", 401));
  }

  const isMatch = user.isMatchedPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Password is incorrect!", 401));
  }

  const token = user.getSignedJWTToken();
  sendTokenInCookie(token, 200, res);
});

//@desc   Forget password
//@route  POST /auth/forget
//@access PUBLIC
exports.forgetPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).select(
    "username email reset_token reset_expires"
  );

  if (!user) {
    return next(new ErrorResponse("User by that email does not exist!", 404));
  }

  user.setResetToken();

  await user.save();

  sendMail({
    mailTo: user.email,
    mailType: "USER_PASSWORD_RESET",
    options: { username: user.username, token: user.reset_token },
  });

  return res.status(200).json({
    success: true,
    message: "Reset token has been sent to your email address!",
  });
});

// @desc   Reset password
// @route  POST /auth/reset/:token
// @access PUBLIC
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { password, passwordConfirmation } = req.body;

  const reset_token = req.params.token;

  if (password !== passwordConfirmation) {
    return next(new ErrorResponse("Passwords do not match!", 400));
  }

  const user = await User.findOne({
    reset_token,
    reset_expires: { $gt: Date.now() },
  }).select("reset_token reset_expires");

  if (!user) {
    return next(new ErrorResponse("Token is invalid or has expired!", 401));
  }

  user.password = password;
  user.reset_token = null;
  user.reset_expires = null;

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Your password has been changed!",
  });
});

//@desc   Email resend route
//@route  POST /auth/resend
//@access PUBLIC
exports.postEmailResend = asyncHandler(async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, status: "PENDING" }).select(
      "username"
    );

    if (!user) {
      return next(new ErrorResponse(""));
    }
    const options = { username: user.username, id: user._id };

    options["token"] = user.getSignedJWTToken();
    sendMail({
      mailTo: email,
      mailType,
      options,
    });
  } catch (err) {}
  return res.status(200).json({ success: true, message: "Email sent!" });
});

//@desc   Sign out route
//@route  POST /auth/signout
//@access PUBLIC
exports.postSignOut = asyncHandler(async (req, res, next) => {
  res
    .clearCookie("token")
    .status(200)
    .json({ success: true, message: "Signed out successfully!" });
});

// Sent token in cookie
const sendTokenInCookie = (token, statusCode, res, optional) => {
  const options = {
    expires: new Date(Date.now() + 3600000),
    httpOnly: true,
  };

  const response = {
    success: true,
    message: "Logged in!",
    optional,
  };

  return res.status(statusCode).cookie("token", token, options).json(response);
};
