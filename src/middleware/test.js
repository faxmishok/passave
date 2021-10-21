const QRCode = require('qrcode');

QRCode.toDataURL('worshipme', (err, dataURL) => {
  if (err) {
    console.log(err);
  } else {
    console.log(dataURL);
  }
});
