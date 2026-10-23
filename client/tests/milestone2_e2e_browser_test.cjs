const puppeteer = require('puppeteer');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

async function runBrowserE2E() {
  console.log('====================================================');
  console.log('CHALLENGER M2-1: EMPIRICAL PUPPETEER BROWSER E2E TEST');
  console.log('====================================================\n');

  const PORT = 4176;
  const previewProcess = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
    stdio: 'pipe'
  });

  const isServerReady = () => new Promise(resolve => {
    const check = () => {
      http.get(`http://localhost:${PORT}`, res => {
        if (res.statusCode === 200) resolve(true);
        else setTimeout(check, 150);
      }).on('error', () => setTimeout(check, 150));
    };
    check();
  });

  await isServerReady();
  console.log(`✓ Vite preview server is live on http://localhost:${PORT}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let allPassed = true;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      allPassed = false;
    }
  }

  try {
    const createMockSession = (userId, email) => JSON.stringify({
      access_token: `token_for_${userId}`,
      token_type: 'bearer',
      expires_at: Math.floor(Date.now() / 1000) + 7200,
      refresh_token: `refresh_for_${userId}`,
      user: {
        id: userId,
        aud: 'authenticated',
        role: 'authenticated',
        email: email
      }
    });

    const setupInterceptions = (page, currentUser, profileData, profileLatencyMs = 0) => {
      page.on('request', req => {
        const url = req.url();

        // Mock Supabase Auth REST endpoints
        if (url.includes('placeholder.supabase.co')) {
          if (url.includes('/auth/v1/signup')) {
            req.respond({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                id: 'usr-new-004',
                aud: 'authenticated',
                role: 'authenticated',
                email: 'newbie@kampus.ac.id'
              })
            });
            return;
          }
          if (url.includes('/auth/v1/user') || url.includes('/auth/v1/token')) {
            req.respond({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(currentUser || {})
            });
            return;
          }
          req.respond({ status: 200, contentType: 'application/json', body: '{}' });
          return;
        }

        // Mock Application API endpoints
        if (url.includes('/api/auth/profile')) {
          if (profileLatencyMs > 0) {
            setTimeout(() => {
              req.respond({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(profileData)
              });
            }, profileLatencyMs);
          } else {
            req.respond({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(profileData)
            });
          }
          return;
        }

        if (url.includes('/api/kategori')) {
          req.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ id: 1, nama_kategori: 'Kuliah', warna: '#3b82f6' }])
          });
          return;
        }

        if (url.includes('/api/calendar')) {
          req.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ blocks: [] })
          });
          return;
        }

        if (url.includes('/api/')) {
          req.respond({ status: 200, contentType: 'application/json', body: '[]' });
          return;
        }

        req.continue();
      });
    };

    // =========================================================================
    // TEST SUITE 1: Unauthenticated Visitor Flow & Route Guards
    // =========================================================================
    console.log('--- TEST SUITE 1: Unauthenticated Visitor Flow & Route Guards ---');
    {
      const page = await browser.newPage();
      await page.setRequestInterception(true);
      setupInterceptions(page, null, null);

      await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
      assert(page.url().endsWith('/'), `Root route stays at "/" (got: ${page.url()})`);

      const brandHeader = await page.$eval('h1', el => el.textContent.trim()).catch(() => null);
      assert(brandHeader === 'SyncTime', `LoginPage brand header "SyncTime" displayed (got: "${brandHeader}")`);

      const loginButtonText = await page.$eval('button[type="submit"]', el => el.textContent.trim()).catch(() => null);
      assert(loginButtonText === 'Masuk', `Submit button is "Masuk" (got: "${loginButtonText}")`);

      await page.goto(`http://localhost:${PORT}/dashboard`, { waitUntil: 'networkidle0' });
      assert(page.url().endsWith('/'), `Direct /dashboard redirects unauthenticated visitor to "/" (got: ${page.url()})`);

      await page.goto(`http://localhost:${PORT}/onboarding`, { waitUntil: 'networkidle0' });
      assert(page.url().endsWith('/'), `Direct /onboarding redirects unauthenticated visitor to "/" (got: ${page.url()})`);

      await page.close();
    }

    // =========================================================================
    // TEST SUITE 2: Authenticated with Incomplete Onboarding Flow
    // =========================================================================
    console.log('\n--- TEST SUITE 2: Authenticated with Incomplete Onboarding Flow ---');
    {
      const page = await browser.newPage();
      await page.setRequestInterception(true);

      const mockUser = { id: 'usr-fresh-001', email: 'freshman@kampus.ac.id' };
      const mockProfile = { id: mockUser.id, onboarding_completed: false, semester_start: null, semester_end: null };
      setupInterceptions(page, mockUser, mockProfile);

      await page.evaluateOnNewDocument((storageKey, sessionVal, userVal) => {
        localStorage.clear();
        localStorage.setItem(storageKey, sessionVal);
        localStorage.setItem('synctime_user', userVal);
      }, 'sb-placeholder-auth-token', createMockSession(mockUser.id, mockUser.email), JSON.stringify(mockUser));

      await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
      assert(page.url().endsWith('/onboarding'), `Visiting "/" routes to "/onboarding" when onboarding_completed=false (got: ${page.url()})`);

      await page.goto(`http://localhost:${PORT}/dashboard`, { waitUntil: 'networkidle0' });
      assert(page.url().endsWith('/onboarding'), `Direct /dashboard guards and redirects to "/onboarding" (got: ${page.url()})`);

      await page.close();
    }

    // =========================================================================
    // TEST SUITE 3: Authenticated with Completed Onboarding Flow
    // =========================================================================
    console.log('\n--- TEST SUITE 3: Authenticated with Completed Onboarding Flow ---');
    {
      const page = await browser.newPage();
      await page.setRequestInterception(true);

      const mockSenior = { id: 'usr-senior-002', email: 'senior@kampus.ac.id' };
      const mockProfile = { id: mockSenior.id, onboarding_completed: true, semester_start: '2026-09-01', semester_end: '2026-12-31' };
      setupInterceptions(page, mockSenior, mockProfile);

      await page.evaluateOnNewDocument((storageKey, sessionVal, userVal) => {
        localStorage.clear();
        localStorage.setItem(storageKey, sessionVal);
        localStorage.setItem('synctime_user', userVal);
      }, 'sb-placeholder-auth-token', createMockSession(mockSenior.id, mockSenior.email), JSON.stringify(mockSenior));

      await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
      assert(page.url().endsWith('/dashboard'), `Visiting "/" routes to "/dashboard" when onboarding_completed=true (got: ${page.url()})`);

      await page.goto(`http://localhost:${PORT}/dashboard`, { waitUntil: 'networkidle0' });
      assert(page.url().endsWith('/dashboard'), `Direct /dashboard remains on "/dashboard" (got: ${page.url()})`);

      const brandElem = await page.$('[data-testid="brand-name"]');
      assert(brandElem !== null, 'Dashboard brand element is mounted and visible');

      await page.close();
    }

    // =========================================================================
    // TEST SUITE 4: Race Condition & Flash of Dashboard Prevention
    // =========================================================================
    console.log('\n--- TEST SUITE 4: Race Condition & Flash of Dashboard Prevention ---');
    {
      const page = await browser.newPage();
      await page.setRequestInterception(true);

      const mockLagUser = { id: 'usr-lag-003', email: 'lagged@kampus.ac.id' };
      const mockLagProfile = { id: mockLagUser.id, onboarding_completed: false };
      // 500ms delay on profile
      setupInterceptions(page, mockLagUser, mockLagProfile, 500);

      // Do NOT set synctime_user so loading stays true until getSession + fetchUserProfile complete
      await page.evaluateOnNewDocument((storageKey, sessionVal) => {
        localStorage.clear();
        localStorage.setItem(storageKey, sessionVal);
      }, 'sb-placeholder-auth-token', createMockSession(mockLagUser.id, mockLagUser.email));

      const navPromise = page.goto(`http://localhost:${PORT}/dashboard`);

      // Probe DOM at 200ms while profile request is in-flight
      await new Promise(r => setTimeout(r, 200));

      const probe = await page.evaluate(() => {
        return {
          hasSpinner: !!document.querySelector('.animate-spin'),
          hasHeader: !!document.querySelector('header'),
          hasSidebar: !!document.querySelector('[data-testid="desktop-sidebar"]'),
          hasCalendar: !!document.querySelector('.weekly-calendar')
        };
      });

      console.log('  [Mid-flight probe at 200ms]:', probe);
      assert(probe.hasSpinner, 'Full-page loading spinner is active while profile fetch is in-flight');
      assert(!probe.hasHeader, 'Header is NOT rendered during loading (zero content flash)');
      assert(!probe.hasSidebar, 'Sidebar is NOT rendered during loading (zero content flash)');
      assert(!probe.hasCalendar, 'Calendar is NOT rendered during loading (zero content flash)');

      await navPromise;
      await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
      assert(page.url().endsWith('/onboarding'), `Seamlessly transitioned to "/onboarding" without flashing dashboard (got: ${page.url()})`);

      await page.close();
    }

    // =========================================================================
    // TEST SUITE 5: Registration Guidance Feedback Banner in LoginPage
    // =========================================================================
    console.log('\n--- TEST SUITE 5: Registration Guidance Feedback Banner in LoginPage ---');
    {
      const page = await browser.newPage();
      await page.setRequestInterception(true);
      setupInterceptions(page, null, null);

      await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });

      // Click "Daftar" button tab
      const daftarClicked = await page.$$eval('button', btns => {
        const btn = btns.find(b => b.textContent?.trim() === 'Daftar');
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      assert(daftarClicked, 'Clicked "Daftar" tab on LoginPage');

      const submitText = await page.$eval('button[type="submit"]', el => el.textContent.trim());
      assert(submitText === 'Daftar', `Submit button updated to "Daftar" (got: "${submitText}")`);

      await page.type('input[type="email"]', 'newbie@kampus.ac.id');
      await page.type('input[type="password"]', 'Password123!');

      await page.click('button[type="submit"]');

      await page.waitForSelector('[data-testid="registration-info-banner"]', { timeout: 3000 });
      const bannerText = await page.$eval('[data-testid="registration-info-banner"]', el => el.textContent.trim());
      console.log('  [Registration Info Banner]:', bannerText);

      assert(
        bannerText.includes('Akun kamu berhasil dibuat') && bannerText.includes('onboarding'),
        `Informative onboarding alert banner displayed upon registration (got: "${bannerText}")`
      );

      await page.close();
    }

  } catch (err) {
    console.error('Browser E2E Execution Error:', err);
    allPassed = false;
  } finally {
    await browser.close();
    previewProcess.kill();
  }

  console.log('\n====================================================');
  if (allPassed) {
    console.log('🎉 ALL BROWSER E2E VERIFICATIONS AND ADVERSARIAL CHECKS PASSED!');
    process.exit(0);
  } else {
    console.error('❌ SOME CHECKS FAILED');
    process.exit(1);
  }
}

runBrowserE2E();
