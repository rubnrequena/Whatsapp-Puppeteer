/* eslint-disable no-console */
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

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
