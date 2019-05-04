const axios = require('axios');
module.exports = (ws) => {
  ws.services.addListener("#eco",(num,msg)=>{
    ws.send(num,msg.toLowerCase().replace('#eco','dijiste:','gi'));
  });
  ws.services.addListener("#ping",(num,msg)=>{
    ws.send(num,"p0ng..!");
  })
  ws.services.addListener("#hola",(num,msg)=>{
    ws.send(num,`Hello ${num}, como estas?`);
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
  })
  ws.init();
  console.log("ws inicializado");
}