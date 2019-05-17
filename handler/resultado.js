const ws = require('../titere/ws');
const axios = require('axios'); 
const {Wit} = require('node-wit');
var cliente = new Wit({accessToken:'TORQSEXZJK7Q5AOYLNUVX7XCNSDMG2AM'})

module.exports = async function (num,msg) {
  let w = await cliente.message(msg);
  let errores = [];
  if (!w.entities.sorteo) errores.push("-No se reconoce el sorteo");
  if (!w.entities.datetime) errores.push("-No se reconoce el horario");
  if (errores.length>0) return ws.enviar(num,`Lo siento, no te endiendo\n${errores.join('\n')}`);

  let sorteo = w.entities.sorteo.pop().value;
  let hora = new Date(w.entities.datetime.pop().value).toLocaleTimeString();
  hora = hora.split(":");
  hora.pop();
  if (parseInt(hora[0]>12)) hora[0] = parseInt(hora[0]-12);
  hora = hora.join(":");
  console.log(sorteo,hora);
  
  let url = `http://srq.com.ve/prm/?dev&sorteo=${sorteo}&hora=${hora}`;
  axios.get(url).then(res=>{ 
    let data = JSON.stringify(res.data,null,2);
    ws.enviar(num,`>resultado ${sorteo}\n${data}`);
  }).catch(()=>{
    return `>resultado: Error al obtener resultado :(`;
  });
}