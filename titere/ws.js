const titere = require('../titere/index');
const chalk = require('chalk');
const log = require('single-line-log').stdout;
const formatPhone = require('../config/formatPhone');
const config = require('../config/index');
const services = require('../titere/BotHandler');
const path = require('path');
const wget = require('node-wget-promise');

const clerror = chalk.red;
const clgreen = chalk.green;
const clwarn = chalk.yellow;
var page;
var queueMsg = [];
var isSending;
var mensajes={};

async function init() {
  if (!page) {
    page = await titere.newPage();      
    
    await page.goto('https://web.whatsapp.com/',{waitUntil:"networkidle2"});
    console.log("WS: Cargando...");    
    while (!await page.$('._1FKgS .app')) {
      page.waitFor(500);
      if (await page.$('.landing-main')) {
        log("Esperando validacion QR http://127.0.0.1/ws/qr");
        await page.screenshot({path:"public/images/lastQR.jpg"});
        page.waitFor(5000);
      }
    }
    console.log("WS: Ready...");    
    initPage();
  }  
  setInterval(msgCheck,config.MSG_CHECK_DELAY);
}
async function initPage() {
  page.exposeFunction('msgCheck',onMsgSent);
  page.exposeFunction('newMsg',onMsgReceived);
  await page.evaluate(()=>{
    let mut = new MutationObserver((muts) => {
      muts.forEach(node => {
        let span = node.target;
        let uDiv = span.closest('._2EXPL');
        let eNumero = uDiv.querySelector('._3TEwt > span:nth-child(1)');
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
function onMsgSent (num,status) {
  delete mensajes[num];
  switch (status) {
    case selector.statusCheck: 
      console.log(clwarn(`Enviado: ${num}`)); 
      break;
    case selector.statusCheckDbl: 
      console.log(clwarn(`Recibido: ${num}`)); 
      break;
    case selector.statusCheckAck: 
      console.log(clwarn(`Leido: ${num}`));
      break;
  }
}
function onMsgReceived (num,msg,n) {
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
function msgCheck() {
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
      let msg = msgSpan.innerText;
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
  services.dispatch(num,msg);
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

  isSending=false;
}
async function send(user,msg) { 
  if (isSending) return queueMsg.push({user,msg});
  isSending=true;
  if (await findUser(user)) {
    await typeMsg(user,msg);
    nextPending();
  } else await sendToNumber(user,msg);
}
async function sendToNumber(num,msg) {
  let apiPage = await titere.newPage();
  console.log("WS: Enviando msg a travez de api.whatsapp.com");
  await apiPage.goto(`https://api.whatsapp.com/send?phone=${num}&text=${encodeURI(msg)}&source=&data=`,{timeout:config.PAGE_LOAD_TIMEOUT});  
  await apiPage.click("#action-button");
  await apiPage.waitForSelector('._35EW6',{timeout:config.PAGE_LOAD_TIMEOUT});
  await apiPage.waitFor(500);
  await apiPage.click("._35EW6");

  page.close();
  page = apiPage;
  await initPage();

  isSending=false;
}
async function findUser (num) {
  let search = await page.$(selector.searchInput);
  await search.click();
  await page.keyboard.type(num);  
  let sel = selector.userNum(formatPhone(num));
  let user = await page.$(sel);
  if (user) {
    await page.keyboard.press('Enter');
    return true;
  }
  return false;
}
async function nextPending() {
  if (queueMsg.length>0) {
    let msg = queueMsg.shift();
    await send(msg.user,msg.msg);
  }
}
async function getScreen(name="lastQR",_page) {
  _page = _page || page;
  await _page.screenshot({path:`public/images/${name}.jpg`});
}
/**
 * @param {String} num Numero de destino
 * @param {String} uri Uri del archivo a enviar
 * @param {String} msg Opcional: mensaje adjuntado a la imagen
 */
async function sendPicture(num,uri,msg='') {
  if (uri.match(/http/)) {
    let name = uri.split("/").pop();
    let output = `./public/${name}`;    
    await wget(uri,{output});
    uri = output;
  }

  if (findUser(num)) {
    await page.waitForSelector(selector.btnSendAssets);
    await page.click(selector.btnSendAssets);
    await page.waitForSelector(selector.btnSelectImg);    
    let upload = await page.$(selector.inputSendImg);
    let file = path.relative(process.cwd(),uri);
    await upload.uploadFile(file);
    await page.waitForSelector('._3hV1n.yavlE');
    //TODO: writte if msg
    await page.keyboard.press("Enter");
  }
}
const selector = {
  mainPanel:"#pane-side",
  mainPanelInner:'.RLfQR',
  searchInput:".jN-F5",
  userDiv:'._2EXPL',
  userPic:(num='') => `#pane-side img[src*="${num}%40"]`,
  userNum:(num='') => `#pane-side span[title*="${num}"]`,
  chatInput:'#main > footer div.selectable-text[contenteditable]',
  imgSendInput:'#app div._2S1VP.copyable-text.selectable-text',
  msgSending:'span[data-icon="status-time"]',
  msgCheck:'span[data-icon="status-dblcheck-ack"]',
  msgDblCheck:'span[data-icon="status-check"]',
  newChat:'#side > header > div._20NlL > div > span > div:nth-child(2) > div',
  newChatPanel:'._2fq0t',
  statusCheck:'status-check',
  statusCheckAck:'status-dblcheck-ack',
  statusCheckDbl:'status-dblcheck',
  activarApp:'.landing-main',
  btnSendAssets:'#main > header > div.YmSrp > div > div:nth-child(2) > div',
  btnSelectImg:'#main > header > div.YmSrp > div > div.rAUz7._3TbsN > span > div > div > ul > li:nth-child(1) > button',
  inputSendImg:'#main > header > div.YmSrp > div > div.rAUz7._3TbsN > span > div > div > ul > li:nth-child(1) > button > input[type=file]'
}
async function currentPage(params) {
  return page;
}
module.exports = {
  init,findUser,send,sendPicture,isSending,currentPage,getScreen,services
}