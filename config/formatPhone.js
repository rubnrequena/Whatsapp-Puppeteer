const libphone = require('libphonenumber-js');

function formatPhone (num='') {
  num = libphone.parsePhoneNumberFromString(`+${num}`).formatInternational();
  if (num.indexOf("+58")>-1) {
    let n = num.split("");
    n[7] = "-";
    num = n.join("");
  }
  return num;
}
module.exports = formatPhone;