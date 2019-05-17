const libphone = require('libphonenumber-js');

const parseNumbers = /[\s+]+/g;
function formatPhone (num='') {
  num = num.replace(parseNumbers,"");
  num = libphone.parsePhoneNumberFromString(`+${num}`);
  if (num) {
    let fnum = num.formatInternational();
    if (fnum.indexOf("+58")>-1) {
      let n = fnum.split("");
      n[7] = "-";
      fnum = n.join("");
    }
    return fnum;
  } 
}
module.exports = formatPhone;