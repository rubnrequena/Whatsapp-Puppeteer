const titere = require('../titere/index');
const chalk = require('chalk');
const log = require('single-line-log').stdout;
const formatPhone = require('../config/formatPhone');
const config = require('../config/index');

const clerror = chalk.red;
const clgreen = chalk.green;
const clwarn = chalk.yellow;
var page;
var queueMsg = [];
var isSending;
var isOnline=false;
var userPicNum = /t=s&u=(\d+)/;
var mensajes={};

async function init() {
  let startUp;
  if (!page) {
    page = await titere.newPage();      
    initPage();
    await page.goto('https://web.whatsapp.com/',{waitUntil:"networkidle2"});
    console.log("WS: Cargando...");    
    while (await page.$('#startup')) page.waitFor(500);
    console.log("WS: Ready...");
    if (await page.$('._1FKgS .app')) startUp = "app"
    if (await page.$(selector.activarApp)) startUp = "login";
    console.log("WS: Init",startUp);
  }  
  if (startUp=="login") {
    console.log("SE NECESITA VALIDAR QR: http://127.0.0.1/ws/qr");
  } else if (startUp=="app") {
    console.log("WS: Iniciado exitosamente!");
    setInterval(verificarMensajes,config.MSG_CHECK_DELAY);
  }
}
async function initPage() {
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3641.0 Safari/537.36');
  page.exposeFunction('msgCheck',mensajesEnviados);
  page.exposeFunction('newMsg',mensajesNuevos);
}
function mensajesEnviados (num,msg,status) {
  switch (status) {
    case selector.statusCheck: 
      console.log(clwarn(`Enviado: ${num} > ${msg}`)); 
      break;
    case selector.statusCheckDbl: 
      console.log(clwarn(`Recibido: ${num} > ${msg}`)); 
      break;
    case selector.statusCheckAck: 
      console.log(clwarn(`Leido: ${num} > ${msg}`));
      break;
  }
}
function mensajesNuevos (num,msg,n) {
  let oldMsg = mensajes[num];
  if (oldMsg) {
    if (oldMsg!=(nvmsg = n+msg)) {
      mensajes[num] = n+msg;
      messageRcv(num,msg);
    }
  } else {
    mensajes[num] = n+msg;
    messageRcv(num,msg);
  }
}
function verificarMensajes() {
  page.evaluate(() => {
    //check mensajes
    let nodes = document.querySelectorAll('.OUeyt');
    nodes.forEach(e => {
      let uDiv = e.closest('._2EXPL');
      let nMsg = e.innerText;
      let salida = uDiv.querySelector('._1VfKB');
      if (salida) {return;} //usuario esta 

      let msgSpan = uDiv.querySelector('._2_LEW');
      if (!msgSpan) return; //usuario esta escribiendo
      let msg = msgSpan.title;
      let eNumero = uDiv.querySelector('._3TEwt > span:nth-child(1)');
      if (eNumero) {
        let nombre = eNumero.title;
        let num = nombre.match(/(\d{1,3}) (\d{1,3})-(\d+)/);
        if (num) {
          num = num[1]+num[2]+num[3];
        } else if (eNumero = uDiv.querySelector('img')) {        
          if (num = /t=s&u=(\d+)/.exec(eNumero.src)) num = num[1];
        } else num = nombre;
        console.log(`Mensaje encontrado de ${num} dice ${msg}`);
        window.newMsg(num,msg,nMsg);
      }
    },300);
  }).catch(e=>console.log(clerror(e.name),e));
}
function messageRcv (num,msg) {  
  console.log(clgreen(`${num} dice: ${msg}`));
  if (msg.toLowerCase().indexOf("eco:")>-1) send(num,msg.toLowerCase().replace('eco:','dijiste:','gi'));
  if (msg.match(/hola/gi)) send(num,`Hello ${num}, como estas?`);
}
async function typeMsg(num,msg) {
  console.log("preparando mensaje");
  await page.waitForSelector(selector.chatInput);
  await page.click(selector.chatInput);
  await page.keyboard.type(msg);
  await page.keyboard.press('Enter');
  sentMsg(num);
}
async function sentMsg(num) {  
  page.evaluate(num => {
    let sending = document.querySelector('span[data-icon="status-time"]');      
    sending.setAttribute("num",`${num}`);
    var obs = new MutationObserver((mutations,observer) => {
      let span = mutations[0].target;
      let msg = span.parentElement.parentElement.title;
      window.msgCheck(num,msg,span.dataset.icon);
      if (span.dataset.icon=='status-dblcheck-ack') observer.disconnect();
    })
    obs.observe(sending,{attributes:true,subtree:true});
  },num).catch(e=>{
    console.log(clerror(e));
    isSending=false;
  });
  isSending=false;
}
async function send(user,msg) {  
  if (isSending) {
    console.log(`Queue: ${user} ${msg}`);
    queueMsg.push({user,msg});
    return {
      status:"pending",
      time:new Date().toISOString()
    }
  }
  isSending=true;
  console.log(clwarn(`Enviando: ${user} ${msg}`));
  //if (!page) await init();
  if (await findUser(user)) {
    await typeMsg(user,msg);
    nextPending();
    return {
      status:"sent",
      time:new Date().toISOString()
    };
  } else await sendToNumber(user,msg);
}
async function sendToNumber(num,msg) {
  let apiPage = await titere.newPage();
  console.log("WS: Enviando msg a travez de api.whatsapp.com");
  await apiPage.goto(`https://api.whatsapp.com/send?phone=${num}&text=${msg}&source=&data=`,{timeout:config.PAGE_LOAD_TIMEOUT});  
  await apiPage.click("#action-button");
  await apiPage.waitForSelector('._35EW6',{timeout:config.PAGE_LOAD_TIMEOUT});
  await apiPage.waitFor(500);
  await apiPage.click("._35EW6");

  page.close();
  page = apiPage;
  initPage();

  sentMsg(num);
}
async function findUser (num) {  
  //await page.click(selector.newChat);
  let search = await page.$(selector.searchInput);
  await search.click();
  await page.keyboard.type(num);  
  let img = await page.$(selector.userNum(formatPhone(num)));
  if (img) {
    await img.click();
    return true;
  }
  return false;
}
async function verifySent() {
  let enviando = await page.$('[data-icon="msg-time"]');
  while (enviando) {
    await page.waitFor(500);
    enviando = await page.$('[data-icon="msg-time"]');
  }
  return true;
}

function nextPending() {
  console.log(`${queueMsg.length} mensajes en cola`);
  if (queueMsg.length>0) {
    let msg = queueMsg.shift();
    send(msg.user,msg.msg);
  }
}

async function getQR() {
  await page.screenshot({path:"public/images/lastQR.jpg"});
}

const selector = {
  mainPanel:"#pane-side",
  mainPanelInner:'.RLfQR',
  searchInput:".jN-F5",
  userDiv:'._2EXPL',
  userPic:(num='') => `#pane-side img[src*="${num}%40"]`,
  userNum:(num='') => `#pane-side span[title*="${num}"]`,
  chatInput:'#main > footer div.selectable-text[contenteditable]',
  msgSending:'span[data-icon="status-time"]',
  msgCheck:'span[data-icon="status-dblcheck-ack"]',
  msgDblCheck:'span[data-icon="status-check"]',
  newChat:'#side > header > div._20NlL > div > span > div:nth-child(2) > div',
  newChatPanel:'._2fq0t',
  statusCheck:'status-check',
  statusCheckAck:'status-dblcheck-ack',
  statusCheckDbl:'status-dblcheck',
  activarApp:'._2U_Zc'
}
async function currentPage(params) {
  return page;
}
module.exports = {
  init,findFreqUser: findUser,send,isSending,currentPage,getQR
}