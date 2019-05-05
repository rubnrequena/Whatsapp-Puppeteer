const puppeteer = require('puppeteer-core');

var browser;
async function init() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless:true,
      executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      userDataDir:"C:\\chromeuser",
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
  }
  return browser;
}

async function waitForNewPage() {
  await browser.once('targetcreated', target => {
    return target.page();
  })
}

async function newPage() {
  if (!browser) await init();
  let newPage = await browser.newPage();
  await newPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3641.0 Safari/537.36');
  return newPage;
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