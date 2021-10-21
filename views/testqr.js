const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const secret = speakeasy.generateSecret({
  name: 'Passave',
});

qrcode.toDataURL(secret.otpauth_url, (err, dataURL) => {
  if (err) {
    console.error(err);
  } else {
    console.log(dataURL);
  }
});

var verified = speakeasy.totp.verify({
  secret: 'eakjhdkj',
  encoding: 'ascii',
  token: '283792',
});

console.log(verified);
