const mongoose = require('mongoose');

const usuario = new mongoose.Schema({
  numero:String,
  nombre:String,
  correo:String,
  registrado:Date,
  meta:mongoose.Schema.Types.Mixed
})

module.exports = mongoose.model("Usuario",usuario);