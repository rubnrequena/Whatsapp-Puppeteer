const ws = require('../titere/ws');
const axios = require('axios');
const {Wit} = require('node-wit');
var wit = new Wit({accessToken:'HRLMDJW2M6GEBGPSWTG42WF5JRQKSUW4'});

module.exports = async (num,msg) => {
let http = msg.indexOf("http")
  if (http==0) msg = msg.replace("https://","http://");
  else msg = `http://${msg}`;
  msg = msg.replace("www.","");
  let w = await wit.message(msg);
  
  if (!w.entities.direccion) return ws.enviar(num,"No reconozco la direccion..");

  let url = w.entities.direccion[0].value;
  let ancho = 1024, alto = 768;
  if (w.entities.ancho) ancho = w.entities.ancho[0].value;
  if (w.entities.alto) alto = w.entities.alto[0].value;

  ws.enviar(num,`Estamos procesado tu solicitud.`);
  axios.get(`http://localhost:3000/pantalla?num=${num}&url=${url}&v=${ancho},${alto}`)    
    .catch(()=>ws.enviar(num,"Ocurrio un error al obtener la captura..."));  
}