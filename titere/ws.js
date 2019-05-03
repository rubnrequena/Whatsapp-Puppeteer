const titere = require('../titere/index');
const chalk = require('chalk');
const log = require('single-line-log').stdout;
const formatPhone = require('../config/formatPhone');
const config = require('../config/index');
const axios = require('axios');

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
  if (!page) {
    page = await titere.newPage();      
    initPage();
    await page.goto('https://web.whatsapp.com/',{waitUntil:"networkidle2"});
    console.log("WS: Cargando...");    
    while (!await page.$('._1FKgS .app')) {
      page.waitFor(1000);
      if (await page.$('.landing-main')) {
        log("Esperando validacion QR http://127.0.0.1/ws/qr");
        await page.screenshot({path:"public/images/lastQR.jpg"});
        page.waitFor(5000);
      }
    }
    console.log("WS: Ready...");
  }  
  setInterval(verificarMensajes,config.MSG_CHECK_DELAY);
}
async function initPage() {
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
  let m;
  if (msg.toLowerCase().indexOf("eco:")>-1) send(num,msg.toLowerCase().replace('eco:','dijiste:','gi'));
  if (msg.match(/hola/gi)) send(num,`Hello ${num}, como estas?`);
  if (msg.match(/resultado (\w+) ([\w:]+)/gi)) {
    m = msg.split(" ");
    let h = escape(m[2]);
    let url = `http://srq.com.ve/prm/?sorteo=${m[1]}&hora=${h}`;
    console.log("fetching",url);
    axios.get(url).then(res=>{
      console.log("res",res);
      send(num,JSON.stringify(res.data));
    })
  }
}
async function typeMsg(num,msg) {
  await page.waitForSelector(selector.chatInput);
  console.log(clwarn(`Enviando: ${num} ${msg}`));
  
  await page.evaluate(msg=>{
    let textarea = document.createElement("textarea");
    textarea.value = msg;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  },msg);
  
  await page.click(selector.chatInput); 
  await page.keyboard.down("ControlLeft");
  await page.keyboard.press("KeyV");
  await page.keyboard.up("ControlLeft");
  await page.keyboard.press("Enter");

  sentMsg(num);
}
async function sentMsg(num) { 
  await page.waitForSelector('span[data-icon="status-time"]');
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
  }
  isSending=true;  
  //if (!page) await init();
  if (await findUser(user)) {
    await typeMsg(user,msg);
    //nextPending();
  } else await sendToNumber(user,msg);
}
async function sendToNumber(num,msg) {
  let apiPage = await titere.newPage();
  console.log("WS: Enviando msg a travez de api.whatsapp.com");
  await apiPage.goto(`https://api.whatsapp.com/send?phone=${num}&text=${msg}&source=&data=`,{timeout:config.PAGE_LOAD_TIMEOUT});  
  await apiPage.click("#action-button");
  getScreen("apiws",apiPage);
  await apiPage.waitForSelector('._35EW6',{timeout:config.PAGE_LOAD_TIMEOUT}).catch(e=>{
    getScreen("apiws2",apiPage);
  });
  await apiPage.waitFor(500);
  await apiPage.click("._35EW6");

  page.close();
  page = apiPage;
  initPage();

  sentMsg(num);
}
async function findUser (num) {
  let search = await page.$(selector.searchInput);
  await search.click();
  await page.keyboard.type(num);  
  let user = await page.$(selector.userNum(formatPhone(num)));
  if (user) {
    await page.keyboard.press('Enter');
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
  if (queueMsg.length>0) {
    let msg = queueMsg.shift();
    send(msg.user,msg.msg);
  }
}

async function getScreen(name="lastQR",_page) {
  _page = _page || page;
  await _page.screenshot({path:`public/images/${name}.jpg`});
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
  activarApp:'.landing-main'
}
async function currentPage(params) {
  return page;
}
module.exports = {
  init,findFreqUser: findUser,send,isSending,currentPage,getScreen
}