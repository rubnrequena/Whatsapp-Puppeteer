const mongoose = require('mongoose');

const chat = new mongoose.Schema({
  origen:String,
  destino:String,
  text:String,
  enviado:Date,
  recibido:Date,
  leido:Date,
  hilo:Number
});

module.exports = mongoose.model("Chat",chat);