const axios = require('axios');
const ping = require('ping');

var memo = {};

module.exports = (ws) => {
  ws.services.addListener("#eco",(num,msg)=>{
    ws.send(num,msg.toLowerCase().replace('#eco','dijiste:','gi'));
  });
  ws.services.addListener("#ping",(num,msg)=>{
    let host = msg.replace("#ping ","");
    ping.sys.probe(host, function(res) {
      if (res.alive) {
        let numip = /\[[\w.]+\]/.exec(res.output)[0];
        ws.send(num,`Haciendo ping a *${host} ${numip}* tiempo ${res.time}ms`);
      } else ws.send(num,`La solicitud de ping no pudo encontrar el host *${host}*. Compruebe el nombre y vuelva a intentarlo.`)
    });
  })
  ws.services.addListener("#hola",(num,msg)=>{
    ws.send(num,`Hola ${num}, como estas?`);
  });
  ws.services.addListener("#resultado",(num,msg)=>{
    let m = (/resultado (\w+) ([\w:]+)/gi).exec(msg);
    if (m) {
      let url = `http://srq.com.ve/prm/?dev&sorteo=${m[1]}&hora=${escape(m[2])}`;      
      axios.get(url).then(res=>{        
        ws.send(num,`>resultado ${m[1]}\n${JSON.stringify(res.data,null,2)}`);
      }).catch(e=>{
        ws.send(`>resultado: Error al obtener resultado :(`);
      })
    } else ws.send(num,">resultado Formato invalido!\nsorteo hora\nEj: lotto 9:00");
  });
  ws.services.addListener("@enviar",(num,msg) => {
    let m = /(\d+) ([\w\W]+)/.exec(msg);
    console.log("mensaje",m);
    ws.send(m[1],`Usted ha recibido un mensaje anonimo:\n${m[2]}`);
  })
  ws.services.addListener(":memo",(num,msg) => {
    let w = /:memo (?<name>[\w]+) (?<text>[\w\s]+)/;
    let r = /:memo (?<name>[\w]+)$/;
    let m = r.exec(msg);
    if (m) {
      let mem = memo[m.groups.name];
      if (mem) ws.send(num,`Recordando *${m.groups.name}*\n${mem}`);
      else ws.send(num,`No tengo recuerdos sobre: *${m.groups.name}*`)
    } else {
      if (m = w.exec(msg)) {
        memo[m.groups.name] = m.groups.text;
        ws.send(num,"Memorizado..!");
      } else ws.send(num,"Formato Invalido");      
    }
  })
  ws.init();
  console.log("ws inicializado");
}