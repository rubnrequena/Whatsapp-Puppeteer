const mongoose = require('mongoose');

const chat = new mongoose.Schema({
  numero:{
    type:String,
    required:true
  },
  texto:{
    type:String,
    required:true
  },
  registrado:{
    type:Date,
    default:new Date
  },
  programado:Date,
  enviado:Date,
  recibido:Date,
  leido:Date,
  hilo:Number
});

module.exports = mongoose.model("Chat",chat);