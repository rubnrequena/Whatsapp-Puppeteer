module.exports = (ws) => {
  ws.services.addListener("#eco",(num,msg)=>{
    ws.send(num,msg.toLowerCase().replace('eco:','dijiste:','gi'));
  });
  ws.services.addListener("#hola",(num,msg)=>{
    ws.send(num,`Hello ${num}, como estas?`);
  });
  ws.services.addListener("#resultado",(num,msg)=>{
    let m = (/resultado (\w+) ([\w:]+)/gi).exec(msg);
    if (m) {
      let url = `http://srq.com.ve/prm/?dev&sorteo=${m[1]}&hora=${escape(m[2])}`;
      axios.get(url).then(res=>{
        send(num,JSON.stringify(res.data,null,2));
      })
    } else ws.send(num,"Formato invalido!")
  })
  ws.init();
  console.log("ws inicializado");
}