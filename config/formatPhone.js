const libphone = require('libphonenumber-js');

const parseNumbers = /\d+/g;
function formatPhone (num='') {
  let n = parseNumbers.exec(num);
  console.log("formatNumber",n);
  num = libphone.parsePhoneNumberFromString(`+${num}`).formatInternational();
  console.log("intNumber",num);
  if (num.indexOf("+58")>-1) {
    let n = num.split("");
    n[7] = "-";
    num = n.join("");
  } else {
    num = num.split(" ").join("")
  }
  return num;
}
module.exports = formatPhone;