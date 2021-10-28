const asyncHandler = require('./async');
const jwt = require('jsonwebtoken');

exports.protect = (permissions) => {
  return asyncHandler(async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
      return res.render('sign-in', {
        title: 'Passave | Sign in',
        code: 'red',
        message:
          'Not authorized for this route. You have to sign in to proceed.',
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

      if (!permissions.find((element) => element === decoded.status)) {
        return res.render('sign-in', {
          title: 'Passave | Sign in',
          code: 'red',
          message:
            'Your user status does not match to any of the allowed. Please make sure you have verified your e-mail or try again later.',
        });
      }

      req.user = decoded;
    } catch (error) {
      return res.render('sign-in', {
        title: 'Passave | Sign in',
        code: 'red',
        message:
          'Error occured while processing your token. Please sign in again.',
      });
    }
    return next();
  });
};
