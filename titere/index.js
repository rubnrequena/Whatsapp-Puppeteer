const puppeteer = require('puppeteer-core');

var browser;
async function init() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless:false,
      executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      userDataDir:"chrome",
      args: [
        '--no-default-browser-check',
        '--disable-infobars',
        '--disable-web-security',
        '--disable-site-isolation-trials',
        '--no-experiments',
        '--ignore-gpu-blacklist',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-default-apps',
        '--enable-features=NetworkService',
        '--disable-setuid-sandbox',
        '--no-sandbox'
        ],
      ignoreDefaultArgs: ['--disable-extensions']
    });
    browser.on("close",e => console.log("navegador cerrado por usuario"));
  }
  return browser;
}

async function waitForNewPage(params) {
  await browser.once('targetcreated', target => {
    console.log("NUEVA PAGINA");
    return target.page();
  })
}

async function newPage() {
  if (!browser) await init();
  return await browser.newPage();
}

async function numPages() {
  return (await browser.pages()).length;
}

async function pages() {
  return await browser.pages();
}

module.exports = {
  init,
  newPage,
  numPages,
  pages,
  waitForNewPage
}