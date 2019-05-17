const mongoose = require('mongoose');

const hilo = new mongoose.Schema({
  nombre:String,
  usuario:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Usuario'
  }
})

module.exports = mongoose.model("Hilo",hilo);