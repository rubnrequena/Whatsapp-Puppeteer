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
router.get("enviar/:num/:msg",async (req,res) => {
  let sent = await ws.send(req.params.num,req.params.msg).catch(e=>{
    console.error(e);
  });
  res.send("Mensaje enviado...")
});

module.exports = router;