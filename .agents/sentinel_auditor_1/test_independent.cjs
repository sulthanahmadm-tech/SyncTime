const puppeteer = require('c:/utee/SyncTime/client/node_modules/puppeteer');
const http = require('http');
const { spawn } = require('child_process');

async function run() {
  console.log('--- INDEPENDENT AUDITOR VERIFICATION RUN ---');
  const preview = spawn('npx', ['vite', 'preview', '--port', '4174', '--strictPort'], {
    cwd: 'c:/utee/SyncTime/client',
    shell: true,
    stdio: 'ignore'
  });

  const waitServer = () => new Promise(resolve => {
    const check = () => {
      http.get('http://localhost:4174', res => {
        if (res.statusCode === 200) resolve(true);
        else setTimeout(check, 200);
      }).on('error', () => setTimeout(check, 200));
    };
    check();
  });

  await waitServer();
  console.log('Server online on port 4174');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('synctime_user', JSON.stringify({
        id: 'usr_audit_indep_999',
        email: 'auditor@independent.gov'
      }));
    });

    // 1. Mobile 390x844
    await page.setViewport({ width: 390, height: 844 });
    await page.goto('http://localhost:4174/dashboard', { waitUntil: 'networkidle0' });

    // Sidebar hidden
    const sidebarDisplay = await page.$eval('[data-testid="desktop-sidebar"]', el => window.getComputedStyle(el).display);
    if (sidebarDisplay !== 'none') throw new Error('Sidebar not hidden on 390px mobile, got: ' + sidebarDisplay);
    console.log('PASS: Sidebar hidden on mobile (display: none)');

    // Bottom nav visible
    const bottomNavDisplay = await page.$eval('[data-testid="bottom-navigation-bar"]', el => window.getComputedStyle(el).display);
    if (bottomNavDisplay === 'none') throw new Error('Bottom nav hidden on 390px mobile');
    console.log('PASS: Bottom navigation bar visible on mobile');

    // Check tap targets >= 44x44
    const navButtons = await page.$$eval('[data-testid^="bottom-nav-"]', btns => btns.map(b => {
      const r = b.getBoundingClientRect();
      return {
        testid: b.getAttribute('data-testid'),
        w: r.width,
        h: r.height
      };
    }));

    for (const b of navButtons) {
      if (b.w < 44 || b.h < 44) throw new Error('Button ' + b.testid + ' tap target too small: ' + b.w + 'x' + b.h);
      console.log('PASS: ' + b.testid + ' tap target ' + b.w.toFixed(1) + 'x' + b.h.toFixed(1) + ' >= 44x44');
    }

    // Click user profile trigger on mobile
    await page.click('[data-testid="user-profile-trigger"]');
    await page.waitForSelector('[data-testid="user-profile-card"]', { timeout: 2000 });
    const popoverData = await page.$eval('[data-testid="user-profile-card"]', el => {
      const s = window.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        backdropFilter: s.backdropFilter || s.webkitBackdropFilter,
        borderRadius: s.borderRadius,
        box: { x: r.x, w: r.width, r: r.right }
      };
    });

    if (!popoverData.backdropFilter.includes('blur')) throw new Error('Popover missing frosted glass blur: ' + popoverData.backdropFilter);
    console.log('PASS: Popover frosted glass blur confirmed: ' + popoverData.backdropFilter);

    if (parseFloat(popoverData.borderRadius) < 20) throw new Error('Popover borderRadius < 20px: ' + popoverData.borderRadius);
    console.log('PASS: Popover continuous corner radius confirmed: ' + popoverData.borderRadius);

    if (popoverData.box.r > 390) throw new Error('Popover overflows 390px mobile viewport: ' + JSON.stringify(popoverData.box));
    console.log('PASS: Popover cleanly contained within 390px mobile viewport');

    // 2. Desktop 1280x800
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:4174/dashboard', { waitUntil: 'networkidle0' });

    const desktopSidebarDisplay = await page.$eval('[data-testid="desktop-sidebar"]', el => window.getComputedStyle(el).display);
    if (desktopSidebarDisplay === 'none') throw new Error('Sidebar hidden on desktop');
    console.log('PASS: Desktop sidebar visible on 1280px (display: ' + desktopSidebarDisplay + ')');

    const desktopBottomNavDisplay = await page.$eval('[data-testid="bottom-navigation-bar"]', el => window.getComputedStyle(el).display);
    if (desktopBottomNavDisplay !== 'none') throw new Error('Bottom nav visible on desktop');
    console.log('PASS: Bottom navigation hidden on desktop (display: none');

    console.log('### ALL INDEPENDENT AUDITOR CRITERIA VERIFIED 100% SUCCESSFULLY ###');
  } finally {
    await browser.close();
    preview.kill();
  }
}

run().catch(err => {
  console.error('INDEPENDENT AUDIT FAILED:', err);
  process.exit(1);
});