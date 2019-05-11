var express = require('express');
var router = express.Router();
const ws = require('../titere/ws');
//ws.init();

router.get("/", (req,res) => {
  res.render('index');
})
router.get("/enviar",(req,res) => {
  res.render('enviar');
})

module.exports = router;