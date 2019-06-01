var express = require('express');
var router = express.Router();
const crypto = require('crypto');
const browser = require('../titere/index');
const ws = require('../titere/ws');
ws.init();

const Chat = require("../model/Chat");

router.get("/",(req,res) => {
  res.render("index");
})
router.get('/activar',async (req,res) => {
  await ws.getScreen();
  res.render('qr',{src:"lastQR"});
})
router.get('/pantalla',async (req,res) => { 
  let br = await browser.newPage();
  if (req.query.v) {
    let view = req.query.v.split(",");
    br.setViewport({width:parseInt(view[0]),height:parseInt(view[1])});
  }
  await br.goto(req.query.url,{waitUntil:"networkidle2",timeout:60000});
  let img = crypto.createHash('sha256').update(req.query.url).digest('hex');
  await ws.getScreen(img,br);
  if (req.query.num) {
    ws.enviarImagen(req.query.num,`./public/pantallas/${img}.jpg`,req.query.url);
    res.json({
      ok:"Mensaje enviado",
      url:`/pantallas/${img}.jpg`
    })
  } else res.render('pantalla',{src:img});  
  br.close();
})
router.get('/enviar/vid/:num/',async (req,res) => {
  res.json({ok:"mensaje enviado"});
});
router.get('/enviar/pic/:num/',async (req,res) => {
  let img = req.query.src;
  let msg = req.query.msg;
  let num = req.params.num;
  await ws.enviarImagen(num,img,msg).catch(()=>{
    return {error:"conection_timeout"};
  });
  res.json({ok:"mensaje enviado"})
})
router.get("/enviar/:num",async (req,res) => {
  if (req.query.texto && req.query.texto!="") {
    let num = req.params.num;
    let texto = req.query.texto;
    let programa = req.query.programa;
    let msg = await ws.enviar(num,texto,programa).catch(()=>{
      res.json({error:"Mensaje no enviado"});
    });
    res.json(msg);
  } else res.json({error:"Campo mensaje obligatorio"});  
});
router.get("/difundir",async (req,res) => {
  var numeros = (req.query.num).split(",");
  var texto = req.query.txt;
  if (!texto) return res.json({error:"mensaje_invalido",msg:"Mensaje obligatorio"});
  if (!numeros && numeros.length==0) res.json({error:"destino_invalido",msg:"Los destinos son obligatorios o estan mal formateados"})
  else {
    var r = [];
    for (const num of numeros) r.push(await ws.enviar(num,texto));
    res.json({ok:"mensajes enviados",r});
  }
});
router.get("/lote",(req,res) => {
  //TODO: respetar el orden de envio
  let lote;
  if (req.query.lote) {
    lote = JSON.parse(req.query.lote);    
  } else lote = crearLote(["584149970167","584148261242","56987702968","584126962202"],req.query.n || 40);  
  lote.forEach(async item => {
    await ws.enviar(item.numero,item.texto);
  });
  res.json({ok:`${lote.length} mensajes enviados`})
});
router.get("/msg/:id",async (req,res) => {
  res.json(await Chat.findById(req.params.id,'-__v'));
});

function crearLote (num,n=10) {
  let lote = [], len=num.length;
  for (let i = 0; i < n; i++) {
    let r = Math.floor(Math.random()*len);
    lote.push({numero:num[r],texto:`Mensaje #${i}`});
  }
  return lote;
}
module.exports = router;