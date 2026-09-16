const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new'
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('response', response => {
    if (!response.ok()) {
      console.log('FAILED REQUEST:', response.url(), response.status());
    }
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  const content = await page.content();
  console.log('HTML SNIPPET:', content.substring(0, 500));
  
  // take screenshot just in case
  await page.screenshot({ path: 'screenshot.png' });

  await browser.close();
})();
