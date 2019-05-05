const libphone = require('libphonenumber-js');

const parseNumbers = /[\s+]+/g;
function formatPhone (num='') {
  num = num.replace(parseNumbers,"");
  num = libphone.parsePhoneNumberFromString(`+${num}`).formatInternational();
  if (num.indexOf("+58")>-1) {
    let n = num.split("");
    n[7] = "-";
    num = n.join("");
  }
  return num;
}
module.exports = formatPhone;