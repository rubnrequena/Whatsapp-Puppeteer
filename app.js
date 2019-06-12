/* eslint-disable no-console */
var logger = require('morgan');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var indexRouter = require('./routes/index');

const mongoose = require('mongoose');
mongoose.connect("mongodb://dario:dario123@ds223685.mlab.com:23685/wapi",{useNewUrlParser: true,useCreateIndex:true},(err)=> {
  if (err) console.log("Error al conectar con Mongo");
  else console.log("Conectado exitosamente con Mongo");
});

var app = express();

// view engine setup
// eslint-disable-next-line no-undef
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = createError(404,"Esta pagina no existe :'(")
  return next(err);
});

// eslint-disable-next-line no-unused-vars
app.use(function(err, req, res, next) {    
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);  
  res.render('error',{err});
});

module.exports = app;
