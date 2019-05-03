var express = require('express');
var router = express.Router();
const formatPhone = require('../config/formatPhone');
const ws = require('../titere/ws');

ws.init();

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
router.get("/reg",(req,res) => {
  let reg = /resultado (\w+) ([\w:]+)/gi;
  let msg = "resultado lotto 9:am"
  let m = reg.exec(msg);
  console.log(m);
  res.send("ok");
})

module.exports = router;