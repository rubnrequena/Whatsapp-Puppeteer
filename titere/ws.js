/* eslint-disable no-cond-assign */
/* eslint-disable no-console */
const titere = require('../titere/index');
const chalk = require('chalk');

const formatPhone = require('../config/formatPhone');
const config = require('../config/index');
const services = require('../titere/BotHandler');
const path = require('path');
const wget = require('node-wget-promise');

const chat = require('../model/Chat');

const clerror = chalk.red;
const clgreen = chalk.green;
const clwarn = chalk.yellow;
var page;
var listoEnviar=false;
var mensajes={};
var queue=[];

var msgCheckInt;
function setCheck(activo) {
  if (activo) msgCheckInt = setInterval(msgCheck,config.MSG_CHECK_DELAY);
  else clearInterval(msgCheckInt);
}

async function init() {
  if (!page) {
    page = await titere.newPage();      
    
    await page.goto('https://web.whatsapp.com/',{waitUntil:"networkidle2"});    
    await initPage();
    await leerMensajes();
    nextPending();
  }  
  setCheck(true);
}
async function initPage() {
  console.log("WS: Cargando...");    
  while (!await page.$('.app')) {
    await page.waitFor(500);
    if (await page.$('.landing-main')) {
      console.log("Esperando validacion QR http://127.0.0.1/activar");
      await page.screenshot({path:"public/pantallas/lastQR.jpg"});
      await page.waitFor(5000);
    }
  }
  console.log("WS: Ready...");    
  page.on("dialog", (dialog) => dialog.accept());
  await page.exposeFunction('msgCheck',onMensajeEnviado);
  await page.exposeFunction('newMsg',onMsgReceived);
  await initMonitorEnviados();
  listoEnviar=true;
}
async function initMonitorEnviados () {
	await page.waitForSelector("#pane-side");
    await page.evaluate(()=>{    
    let mut = new MutationObserver((muts) => {
      muts.forEach(node => {
        let span = node.target;
        let uDiv = span.offsetParent;
        let eNumero = uDiv.querySelector('span[title]');
        if (eNumero) {
          let nombre = eNumero.title;
          let num = nombre.match(/(\d{1,3}) (\d{1,3})-(\d+)/);
          if (num) {
            num = num[1]+num[2]+num[3];
          } else if (eNumero = uDiv.querySelector('img')) {        
            if (num = /t=s&u=(\d+)/.exec(eNumero.src)) num = num[1];
          } else num = nombre;
          window.msgCheck(num,span.dataset.icon)
          console.log(`Mensaje cambio de ${num}`);
        }
      })
    })
    let element = document.getElementById('pane-side');
    mut.observe(element,{attributeFilter:["data-icon"],subtree:true});
    
  })
}
async function leerMensajes() {
  queue = await chat.find({enviado:{$exists:false}});
  console.log(`WS: ${queue.length} mensajes por enviar`);
  nextPending();
}
async function onMensajeEnviado (num,status) {
  num = num.replace(/[+\s]+/g,"");
  //delete mensajes[num];
  switch (status) {
    case selector.msgEnviado:
      await chat.updateMany({numero:num,enviado:{$exists:false}},{$currentDate:{enviado:true}});      
      console.log(clwarn(`Enviado: ${num}`));
      break;
    case selector.msgLeido: 
      await chat.updateMany({numero:num,recibido:{$exists:false}},{$currentDate:{recibido:true}});
      console.log(clwarn(`Recibido: ${num}`)); 
      break;
    case selector.msgRecibido: 
      await chat.updateMany({numero:num,leido:{$exists:false}},{$currentDate:{leido:true,recibido:true}});
      console.log(clwarn(`Leido: ${num}`));
      break;
  }
}
function onMsgReceived (num,msg,n) {
  let oldMsg = mensajes[num];
  if (oldMsg) {
    if (oldMsg!=(n+msg)) {
      mensajes[num] = n+msg;
      messageRcv(num,msg);
    }
  } else {
    mensajes[num] = n+msg;
    messageRcv(num,msg);
  }
}
function msgCheck() {  
  page.evaluate(() => {
    //check mensajes
    let nodes = document.querySelectorAll('.P6z4j');
    nodes.forEach(e => {
      let uDiv = e.closest('._2WP9Q');
      let nMsg = e.innerText;
	  console.log("msg",nMsg);
      //let salida = uDiv.querySelector('._1VfKB');
      //if (salida) {return;} //usuario esta 

      let msgSpan = uDiv.querySelector('._19RFN._1ovWX');	  
      if (!msgSpan) return; //usuario esta escribiendo
	  console.log("msgSpan",msgSpan.innerText);
      let msg = msgSpan.innerText;
      let eNumero = uDiv.querySelector('span[title]');
      if (eNumero) {
        let nombre = eNumero.title;
        let num = nombre.match(/(\d{1,3}) (\d{1,3})-(\d+)/);
        if (num) {
          num = num[1]+num[2]+num[3];
        } else if (eNumero = uDiv.querySelector('img')) {        
          if (num = /t=s&u=(\d+)/.exec(eNumero.src)) num = num[1];
        } else num = nombre;

        let asset;
        asset = document.querySelector('.status-image')?"pic":false;
        console.log(`Mensaje encontrado de ${num} dice ${msg}`);
        window.newMsg(num,msg,{nMsg,asset});
      }
    },300);
  }).catch(e=>console.log(clerror(e.name),e));
}
function messageRcv (num,msg) {
  console.log(clgreen(`${num} dice: ${msg}`));
  let hook = /^#(\w+) ([\w\W]+)/.exec(msg);
  console.log("hook",hook[1]);
  require(`../handler/${hook[1]}`)(num,hook[2]);
}
async function typeMsg(msg,input) {
  await page.waitForSelector(input);
  await page.click(input,{timeout:config.PAGE_LOAD_TIMEOUT});
  
  await page.evaluate(msg=>{
    let textarea = document.createElement("textarea");
    textarea.value = msg;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  },msg);
  
  await page.click(input,{timeout:config.PAGE_LOAD_TIMEOUT});
  await page.keyboard.down("ControlLeft");
  await page.keyboard.press("KeyV");
  await page.keyboard.up("ControlLeft");

}
async function enviar(numero,texto) {
  var msg = new chat({
    numero,texto
  });
  await msg.save();    
  queue.push(msg);
  nextPending();
  return msg;
}
async function _enviar (mensaje) {
  listoEnviar=false;
  if (await findUser(mensaje.numero)) {
    await typeMsg(mensaje.texto,selector.chatInput);    
    await page.keyboard.press("Enter");
  } else {    
    await enviarNumero(mensaje.numero,mensaje.texto);    
  }

  listoEnviar=true;
  await nextPending();
}
async function enviarNumero(num,msg) {
  console.log(`WS: APIWS ${num} > ${msg}`);
  setCheck(false);
  await page.goto(`https://web.whatsapp.com/send?phone=${num}&text=${encodeURI(msg)}&source=&data=`,{waitUntil:"networkidle2",timeout:config.PAGE_LOAD_TIMEOUT});
 console.log("WS: Cargando..."); 
  while (!await page.$('#app')) {
    await page.waitFor(500);
    if (await page.$('.landing-main')) {
      console.log("Esperando validacion QR http://127.0.0.1/ws/qr");
      await getScreen();
      await page.waitFor(5000);
    }
  }
  console.log("WS: Ready..."); 
  await initMonitorEnviados();   
  await enviarMensaje();  
  setCheck(true);
  
  async function enviarMensaje () {
    await page.waitForSelector('._3M-N-',{timeout:config.PAGE_LOAD_TIMEOUT}).catch(enviarMensaje);
    await page.waitFor(500);
    await page.click("._3M-N-",{timeout:config.PAGE_LOAD_TIMEOUT}); 
    await page.waitFor(500);
  }
}
async function findUser (num) {
  await typeMsg(num,selector.searchInput);
  await page.waitFor (200);
  let sel = selector.userNum( formatPhone(num));
  let user = await page.$(sel);
  if (user) {
    await page.keyboard.press('Enter');
    return true;
  }
  return false;
}
async function nextPending() {
  if (listoEnviar) {
    if (queue.length>0) {      
      let msg = queue.shift();//await chat.findOne({ enviado : { $exists: false } });
      await _enviar(msg);
    } else console.log(clerror(new Date().toLocaleTimeString()));
  }
}
async function getScreen(name="lastQR",_page) {
  _page = _page || page;
  await _page.screenshot({path:`public/pantallas/${name}.jpg`});
}
async function enviarImagen(num,uri,msg='') {
  if (uri.match(/http/)) {
    let name = uri.split("/").pop();
    let output = `./public/images/ws/${name}`;    
    await wget(uri,{output});
    uri = output;
  }
  if (await findUser(num)) {	
    let clip = await page.waitForSelector(selector.btnSendAssets); //boton adjuntar "clip"
    await page.click(selector.btnSendAssets);           //boton adjuntar "clip"
    await page.waitForSelector(selector.btnSelectImg);
    let upload = await page.$(selector.inputSetImg);
    // eslint-disable-next-line no-undef
    let file = path.relative(process.cwd(),uri);
    await upload.uploadFile(file);
    await page.waitForSelector(selector.imgSendInput);
    console.log(`imagen txt: ${msg}`);
    await typeMsg(msg,selector.imgSendInput);
    await page.keyboard.press("Enter");
  }
}
const selector = {
  mainPanel:"#pane-side",
  mainPanelInner:'.RLfQR',
  searchInput:"._2zCfw",
  userDiv:'._2EXPL',
  userPic:(num='') => `#pane-side img[src*="${num}%40"]`,
  userNum:(num='') => `#pane-side span[title*="${num}"]`,
  chatInput:'#main > footer div.selectable-text[contenteditable]',
  msgSending:'span[data-icon="status-time"]',
  msgCheck:'span[data-icon="status-dblcheck-ack"]',
  msgDblCheck:'span[data-icon="status-check"]',
  newChat:'#side > header > div._20NlL > div > span > div:nth-child(2) > div',
  newChatPanel:'._2fq0t',
  msgEnviando:'status-time',
  msgEnviado:'status-check',
  msgRecibido:'status-dblcheck-ack',
  msgLeido:'status-dblcheck',
  activarApp:'.landing-main',
  imgSendInput:'#app > div > div > div._37f_5 > div._3HZor._2rI9W > span > div > span > div > div > div.rK2ei.USE1O > div > span > div > div._3cDQo > div > div._3ogpF > div._3FeAD._2YgjU._1pSqv > div._3u328.copyable-text.selectable-text',
  btnSendAssets:'div[title="Adjuntar"]',
  btnSelectImg:'._3z3lc',
  inputSetImg:`#main input[accept^='image']`
}
async function currentPage() {
  return page;
}

function mensajesEnCola() {
  return queue;
}

module.exports = {
  init,findUser,enviar,enviarImagen,currentPage,getScreen,services,
  mensajesEnCola
}