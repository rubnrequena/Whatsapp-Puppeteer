const ws = require('../titere/ws');
module.exports = async (num,msg) => {
  ws.enviar(num,`Dijiste: ${msg}`);
};