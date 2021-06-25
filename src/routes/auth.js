const express = require('express');
const router = express.Router();
const {
  createUser,
  loginUser,
  activateAccount,
  forgetPassword,
  postForget,
  resetPassword,
  postEmailResend,
  postSignOut,
} = require('../controllers/authController');

router.post('/register', createUser);
router.post('/login', loginUser);
router.get('/verify/:token', activateAccount);
router.post('/forget', forgetPassword);
router.post('/reset', postForget);
router.post('/reset/:token', resetPassword);
router.post('/resend', postEmailResend);
router.post('/signout', postSignOut);

module.exports = router;
