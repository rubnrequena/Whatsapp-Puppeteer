var express = require('express');
var router = express.Router();
const formatPhone = require('../config/formatPhone');
const ws = require('../titere/ws');
const wsconfig =require('../config/WSConfig')(ws);

router.get("/", (req,res) => {
  res.send("ws ready");
})
router.get('/pantalla',async (req,res) => {
  await ws.getScreen();
  res.render('login');
})
router.get("/enviar/:num",async (req,res) => {
  if (req.query.msg && req.query.msg!="") {
    await ws.send(req.params.num,req.query.msg).catch(e=>{
      console.error(e);
    });
    res.json({ok:"mensaje enviado"})
  } else res.json({error:"Campo mensaje obligatorio"});  
});
router.get("/difundir",(req,res) => {
  let numeros = (req.query.numeros).split(",");
  let msg = req.query.msg;
  if (!msg) return ws.send({error:"mensaje_invalido",msg:"Mensaje obligatorio"});
  if (!numeros && numeros.length==0) ws.send({error:"destino_invalido",msg:"Los destinos son obligatorios o estan mal formateados"})
  else {
    numeros.forEach(num => {
      ws.send(num,msg);
    });
    res.json({ok:"mensajes enviados"})
  }
})
router.get("/format/:num",(req,res) => {  
  
})

num = formatPhone("+56987702968");

module.exports = router;