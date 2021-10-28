const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const asyncHandler = require('../middleware/async');

exports.newSecret = (username) => {
  const secret = speakeasy.generateSecret({
    name: `Passave (${username})`,
  });
  return secret;
};

exports.getQRCode = asyncHandler(async (OTPAuthUrl) => {
  try {
    return await QRCode.toDataURL(OTPAuthUrl);
  } catch (err) {
    return err;
  }
});

exports.validateUser = asyncHandler(async (params) => {
  return speakeasy.totp.verify(params);
});
