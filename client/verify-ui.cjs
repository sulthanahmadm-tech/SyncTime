const puppeteer = require('puppeteer');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

async function runTests() {
  console.log('--- Starting UI / UX Verification ---');

  // Launch vite preview on port 4173
  const previewProcess = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    cwd: __dirname,
    shell: true,
    stdio: 'pipe'
  });

  previewProcess.stdout.on('data', () => {});
  previewProcess.stderr.on('data', () => {});

  // Wait for server to be ready
  const isServerReady = () => new Promise(resolve => {
    const check = () => {
      http.get('http://localhost:4173', res => {
        if (res.statusCode === 200) resolve(true);
        else setTimeout(check, 200);
      }).on('error', () => {
        setTimeout(check, 200);
      });
    };
    check();
  });

  await isServerReady();
  console.log('✓ Vite preview server is up on http://localhost:4173');

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
    const page = await browser.newPage();

    // Inject mock user before navigation so AuthContext picks it up immediately
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('synctime_user', JSON.stringify({
        id: 'usr_apple_hig_001',
        email: 'tim.apple@synctime.app'
      }));
    });

    // ----------------------------------------------------
    // TEST SUITE 1: Desktop Viewport (1280 x 800)
    // ----------------------------------------------------
    console.log('\n--- Test Suite 1: Desktop Viewport (1280x800) ---');
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:4173/dashboard', { waitUntil: 'networkidle0' });

    // 1. Brand name text visible on desktop
    const brandName = await page.$('[data-testid="brand-name"]');
    assert(brandName !== null, 'Brand name element exists');
    const isBrandVisible = await page.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && el.offsetWidth > 0;
    }, brandName);
    assert(isBrandVisible, 'Brand name "SyncTime" is visible on desktop viewport');

    // 2. Desktop sidebar visible
    const desktopSidebar = await page.$('[data-testid="desktop-sidebar"]');
    assert(desktopSidebar !== null, 'Desktop sidebar element exists in DOM');
    const isSidebarVisible = await page.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && el.offsetWidth > 0;
    }, desktopSidebar);
    assert(isSidebarVisible, 'Desktop sidebar is visible on 1280px viewport');

    // 3. Bottom navigation hidden on desktop
    const bottomNav = await page.$('[data-testid="bottom-navigation-bar"]');
    assert(bottomNav !== null, 'Bottom navigation element exists in DOM');
    const isBottomNavHidden = await page.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.display === 'none' || el.offsetHeight === 0;
    }, bottomNav);
    assert(isBottomNavHidden, 'Bottom navigation is hidden on 1280px viewport');

    // 4. User Profile Popover on Desktop
    const trigger = await page.$('[data-testid="user-profile-trigger"]');
    assert(trigger !== null, 'User profile trigger exists');

    // Popover card should not be open initially
    let popoverCard = await page.$('[data-testid="user-profile-card"]');
    assert(popoverCard === null, 'User profile popover card is closed initially');

    // Click trigger to open popover
    await trigger.click();
    await page.waitForSelector('[data-testid="user-profile-card"]', { timeout: 2000 });
    popoverCard = await page.$('[data-testid="user-profile-card"]');
    assert(popoverCard !== null, 'Clicking email/avatar opens the popover card');

    // Inspect popover card styling: Frosted glass effect & Continuous corner radius
    const popoverStyles = await page.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        backdropFilter: style.backdropFilter || style.webkitBackdropFilter,
        borderRadius: style.borderRadius,
        backgroundColor: style.backgroundColor,
        boxShadow: style.boxShadow
      };
    }, popoverCard);

    console.log('  [Popover Computed Styles]:', JSON.stringify(popoverStyles));
    assert(
      popoverStyles.backdropFilter.includes('blur'),
      `Visible frosted glass effect (backdropFilter has blur: "${popoverStyles.backdropFilter}")`
    );
    const radiusValue = parseFloat(popoverStyles.borderRadius);
    assert(
      radiusValue >= 20,
      `Continuous rounded corners (borderRadius >= 20px, got: ${popoverStyles.borderRadius})`
    );

    // Verify Logout button exists inside popover
    const logoutBtn = await page.$('[data-testid="logout-button"]');
    assert(logoutBtn !== null, 'Logout button is present inside user profile popover card');

    // Take screenshot of desktop popover
    await page.screenshot({ path: path.join(__dirname, 'screenshot-desktop-popover.png') });
    console.log('  [Screenshot saved]: screenshot-desktop-popover.png');

    // Test Escape key closes popover
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 200));
    popoverCard = await page.$('[data-testid="user-profile-card"]');
    assert(popoverCard === null, 'Pressing Escape closes the user profile popover card');

    // Re-open and test outside click closes popover
    await trigger.click();
    await page.waitForSelector('[data-testid="user-profile-card"]', { timeout: 2000 });
    await page.mouse.click(10, 10);
    await new Promise(r => setTimeout(r, 200));
    popoverCard = await page.$('[data-testid="user-profile-card"]');
    assert(popoverCard === null, 'Clicking outside closes the user profile popover card');

    // ----------------------------------------------------
    // TEST SUITE 2: Mobile Viewport (390 x 844) - iPhone 14/15
    // ----------------------------------------------------
    console.log('\n--- Test Suite 2: Mobile Viewport (390x844) ---');
    await page.setViewport({ width: 390, height: 844 });
    await page.goto('http://localhost:4173/dashboard', { waitUntil: 'networkidle0' });

    // 1. Desktop sidebar hidden on mobile
    const isSidebarHiddenMobile = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="desktop-sidebar"]');
      if (!el) return true;
      const style = window.getComputedStyle(el);
      return style.display === 'none' || el.offsetWidth === 0;
    });
    assert(isSidebarHiddenMobile, 'Desktop sidebar is hidden on 390px mobile viewport');

    // 2. Bottom navigation bar visible on mobile with Apple HIG Vibrancy
    const bottomNavStyles = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="bottom-navigation-bar"]');
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        display: style.display,
        height: el.offsetHeight,
        backdropFilter: style.backdropFilter || style.webkitBackdropFilter
      };
    });
    assert(bottomNavStyles && bottomNavStyles.display !== 'none' && bottomNavStyles.height > 0, 'Bottom navigation bar is visible on 390px mobile viewport');
    assert(bottomNavStyles.backdropFilter.includes('blur'), 'Bottom navigation bar features frosted glass blur');

    // 3. Bottom navigation tap targets >= 44x44pt
    const navItems = [
      'bottom-nav-jadwal',
      'bottom-nav-tambah',
      'bottom-nav-matkul',
      'bottom-nav-filter',
      'bottom-nav-share'
    ];

    for (const testId of navItems) {
      const btn = await page.$(`[data-testid="${testId}"]`);
      assert(btn !== null, `Nav item [${testId}] exists`);
      const bbox = await btn.boundingBox();
      const meetsSize = bbox.width >= 44 && bbox.height >= 44;
      assert(
        meetsSize,
        `Nav item [${testId}] tap target is >= 44x44pt (Width: ${bbox.width.toFixed(1)}px, Height: ${bbox.height.toFixed(1)}px)`
      );
    }

    // 4. Functional verification of Bottom Navigation:
    // 4a. "+ Tambah" opens action sheet & locks body scroll
    console.log('\n--- Testing Bottom Nav Action Sheet (+ Tambah) & Scroll Lock ---');
    await page.click('[data-testid="bottom-nav-tambah"]');
    await page.waitForSelector('[data-testid="action-sheet"]', { timeout: 2000 });
    let actionSheet = await page.$('[data-testid="action-sheet"]');
    assert(actionSheet !== null, 'Tapping "+ Tambah" opens Action Sheet');

    const isBodyLockedAction = await page.evaluate(() => document.body.style.overflow === 'hidden');
    assert(isBodyLockedAction, 'Body scroll is locked (overflow: hidden) when Action Sheet is open');

    const actionRutin = await page.$('[data-testid="action-add-rutin"]');
    const actionDinamis = await page.$('[data-testid="action-add-dinamis"]');
    const actionMagic = await page.$('[data-testid="action-add-magic-paste"]');
    assert(actionRutin !== null, 'Action Sheet contains "Jadwal Rutin" option');
    assert(actionDinamis !== null, 'Action Sheet contains "Jadwal Dinamis" option');
    assert(actionMagic !== null, 'Action Sheet contains "Magic Paste AI" option');

    // Test Escape key dismisses Action Sheet & restores scroll
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 200));
    actionSheet = await page.$('[data-testid="action-sheet"]');
    assert(actionSheet === null, 'Pressing Escape dismisses Action Sheet');

    const isBodyUnlockedAfterEscape = await page.evaluate(() => document.body.style.overflow !== 'hidden');
    assert(isBodyUnlockedAfterEscape, 'Body scroll is unlocked after dismissing Action Sheet');

    // Re-open and tap cancel to dismiss action sheet
    await page.click('[data-testid="bottom-nav-tambah"]');
    await page.waitForSelector('[data-testid="action-sheet"]', { timeout: 2000 });
    await page.click('[data-testid="action-cancel"]');
    await new Promise(r => setTimeout(r, 200));
    actionSheet = await page.$('[data-testid="action-sheet"]');
    assert(actionSheet === null, 'Tapping "Batal" dismisses Action Sheet');

    // 4b. "Filter" opens filter sheet & locks body scroll
    console.log('\n--- Testing Bottom Nav Filter & Analytics Sheet ---');
    await page.click('[data-testid="bottom-nav-filter"]');
    await page.waitForSelector('[data-testid="filter-sheet"]', { timeout: 2000 });
    let filterSheet = await page.$('[data-testid="filter-sheet"]');
    assert(filterSheet !== null, 'Tapping "Filter" opens Filter & Analytics Sheet');

    const isBodyLockedFilter = await page.evaluate(() => document.body.style.overflow === 'hidden');
    assert(isBodyLockedFilter, 'Body scroll is locked (overflow: hidden) when Filter Sheet is open');

    // Verify filter close button tap target >= 44x44pt
    const closeBtn = await page.$('[data-testid="filter-close"]');
    const closeBox = await closeBtn.boundingBox();
    assert(
      closeBox.width >= 44 && closeBox.height >= 44,
      `Filter close button tap target >= 44x44pt (Width: ${closeBox.width}px, Height: ${closeBox.height}px)`
    );

    // Test Escape key dismisses Filter Sheet
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 200));
    filterSheet = await page.$('[data-testid="filter-sheet"]');
    assert(filterSheet === null, 'Pressing Escape dismisses Filter Sheet');

    // Re-open and tap close button in filter sheet
    await page.click('[data-testid="bottom-nav-filter"]');
    await page.waitForSelector('[data-testid="filter-sheet"]', { timeout: 2000 });
    await page.click('[data-testid="filter-close"]');
    await new Promise(r => setTimeout(r, 200));
    filterSheet = await page.$('[data-testid="filter-sheet"]');
    assert(filterSheet === null, 'Tapping close button dismisses Filter Sheet');

    // 4c. "Matkul" tab opens Matkul modal and syncs tab states
    console.log('\n--- Testing Bottom Nav Tab Switching (Matkul <-> Jadwal) ---');
    await page.click('[data-testid="bottom-nav-matkul"]');
    await page.waitForSelector('[data-testid="matkul-modal-card"]', { timeout: 2000 });
    const isMatkulActive = await page.evaluate(() => {
      const matkulBtn = document.querySelector('[data-testid="bottom-nav-matkul"]');
      const jadwalBtn = document.querySelector('[data-testid="bottom-nav-jadwal"]');
      return {
        matkulPressed: matkulBtn?.getAttribute('aria-pressed') === 'true',
        jadwalPressed: jadwalBtn?.getAttribute('aria-pressed') === 'true'
      };
    });
    assert(isMatkulActive.matkulPressed && !isMatkulActive.jadwalPressed, 'Tapping "Matkul" activates Matkul tab and deselects Jadwal tab');

    // Close Matkul modal via close button
    await page.click('[data-testid="matkul-modal-close"]');
    await new Promise(r => setTimeout(r, 300));
    const isJadwalActive = await page.evaluate(() => {
      const matkulBtn = document.querySelector('[data-testid="bottom-nav-matkul"]');
      const jadwalBtn = document.querySelector('[data-testid="bottom-nav-jadwal"]');
      return {
        matkulPressed: matkulBtn?.getAttribute('aria-pressed') === 'true',
        jadwalPressed: jadwalBtn?.getAttribute('aria-pressed') === 'true'
      };
    });
    assert(!isJadwalActive.matkulPressed && isJadwalActive.jadwalPressed, 'Closing Matkul modal restores Jadwal tab as active');

    // 4d. "Bagikan" tab copies link and triggers Toast
    console.log('\n--- Testing Bottom Nav Share & Toast Notification ---');
    await page.click('[data-testid="bottom-nav-share"]');
    await page.waitForSelector('[data-testid="share-toast"]', { timeout: 2000 });
    const toast = await page.$('[data-testid="share-toast"]');
    assert(toast !== null, 'Tapping "Bagikan" displays Share Toast notification');
    const toastText = await page.evaluate(el => el.textContent, toast);
    assert(toastText.includes('Link jadwal berhasil disalin!'), `Toast displays correct message: "${toastText}"`);

    // 4e. Test Modal Form presentation & Escape / Backdrop dismissal
    console.log('\n--- Testing Modal Forms (+ Tambah -> RutinForm) & Apple HIG 44pt Touch Targets ---');
    await page.click('[data-testid="bottom-nav-tambah"]');
    await page.waitForSelector('[data-testid="action-add-rutin"]', { timeout: 2000 });
    await page.click('[data-testid="action-add-rutin"]');
    await page.waitForSelector('button[type="submit"]', { timeout: 2000 });

    const rutinButtons = await page.$$eval('button', btns => btns.filter(b => b.textContent?.includes('Simpan') || b.textContent?.includes('Batal')).map(b => {
      const r = b.getBoundingClientRect();
      return { text: b.textContent, width: r.width, height: r.height };
    }));
    for (const b of rutinButtons) {
      assert(b.height >= 44 && b.width >= 44, `Form button "${b.text?.trim()}" has tap target >= 44x44pt (${b.width}x${b.height}px)`);
    }

    // Dismiss RutinForm via Escape
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 300));
    const isRutinClosed = await page.$('button[type="submit"]');
    assert(isRutinClosed === null, 'Pressing Escape dismisses modal form');
    const isBodyUnlockedForm = await page.evaluate(() => document.body.style.overflow !== 'hidden');
    assert(isBodyUnlockedForm, 'Body scroll unlocked after dismissing modal form');

    // 5. Mobile User Profile Popover
    console.log('\n--- Testing User Profile Popover on Mobile ---');
    const mobileTrigger = await page.$('[data-testid="user-profile-trigger"]');
    await mobileTrigger.click();
    await page.waitForSelector('[data-testid="user-profile-card"]', { timeout: 2000 });
    const mobilePopover = await page.$('[data-testid="user-profile-card"]');
    assert(mobilePopover !== null, 'Clicking user avatar/email in header opens popover on mobile');

    const mobilePopoverBox = await mobilePopover.boundingBox();
    assert(
      mobilePopoverBox.x >= 0 && (mobilePopoverBox.x + mobilePopoverBox.width) <= 390,
      `Popover fits cleanly within mobile viewport width (x: ${mobilePopoverBox.x}, width: ${mobilePopoverBox.width})`
    );

    // Screenshot mobile view with popover
    await page.screenshot({ path: path.join(__dirname, 'screenshot-mobile-popover.png') });
    console.log('  [Screenshot saved]: screenshot-mobile-popover.png');

    // Close popover via Escape
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 200));

    // Screenshot mobile bottom navigation view
    await page.screenshot({ path: path.join(__dirname, 'screenshot-mobile-bottomnav.png') });
    console.log('  [Screenshot saved]: screenshot-mobile-bottomnav.png');

    // ----------------------------------------------------
    // TEST SUITE 3: Orientation Change & Desktop Resize Dismissal
    // ----------------------------------------------------
    console.log('\n--- Test Suite 3: Orientation Change & Desktop Resize ---');
    await page.setViewport({ width: 390, height: 844 });
    await page.click('[data-testid="bottom-nav-tambah"]');
    await page.waitForSelector('[data-testid="action-sheet"]', { timeout: 2000 });
    assert(await page.$('[data-testid="action-sheet"]') !== null, 'Action sheet opened in portrait');

    // Rotate to landscape 844x390 (exceeds md: 768px)
    await page.setViewport({ width: 844, height: 390 });
    await new Promise(r => setTimeout(r, 300));

    const stateAfterRotate = await page.evaluate(() => {
      const actionSheet = document.querySelector('[data-testid="action-sheet"]');
      const actionBackdrop = document.querySelector('[data-testid="action-sheet-backdrop"]');
      const bottomNav = document.querySelector('[data-testid="bottom-navigation-bar"]');
      const sidebar = document.querySelector('[data-testid="desktop-sidebar"]');
      return {
        actionSheetPresent: !!actionSheet,
        actionBackdropVisible: !!actionBackdrop && window.getComputedStyle(actionBackdrop).display !== 'none',
        bottomNavVisible: !!bottomNav && window.getComputedStyle(bottomNav).display !== 'none',
        sidebarVisible: !!sidebar && window.getComputedStyle(sidebar).display !== 'none'
      };
    });
    assert(!stateAfterRotate.actionBackdropVisible, 'Mobile Action Sheet is hidden/dismissed upon rotating to desktop breakpoint');
    assert(stateAfterRotate.sidebarVisible, 'Desktop sidebar is visible upon rotating to desktop breakpoint');

    // ----------------------------------------------------
    // TEST SUITE 4: Short Viewport Overflow (667 x 300 - Landscape Phone)
    // ----------------------------------------------------
    console.log('\n--- Test Suite 4: Short Viewport Overflow (667x300) ---');
    await page.setViewport({ width: 667, height: 300 });
    await page.goto('http://localhost:4173/dashboard', { waitUntil: 'networkidle0' });

    // Open action sheet in short viewport
    await page.click('[data-testid="bottom-nav-tambah"]');
    await page.waitForSelector('[data-testid="action-sheet"]', { timeout: 2000 });
    const shortSheetBox = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="action-sheet"]');
      const rect = el.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, height: rect.height, windowHeight: window.innerHeight };
    });
    console.log('  [Short Viewport Action Sheet Position]:', shortSheetBox);
    assert(shortSheetBox.top >= 0, `Action sheet top is non-negative and visible (top: ${shortSheetBox.top}px)`);
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 200));

    // ----------------------------------------------------
    // TEST SUITE 5: Narrow Mobile Viewports (360x740 and 320x568)
    // ----------------------------------------------------
    console.log('\n--- Test Suite 5: Narrow Mobile Viewports (360x740 and 320x568) ---');
    for (const [w, h] of [[360, 740], [320, 568]]) {
      console.log(`\nChecking narrow viewport ${w}x${h}...`);
      await page.setViewport({ width: w, height: h });
      await page.goto('http://localhost:4173/dashboard', { waitUntil: 'networkidle0' });

      // Check for horizontal overflow in page layout
      const overflow = await page.evaluate(viewportWidth => {
        return document.documentElement.scrollWidth <= viewportWidth;
      }, w);
      assert(overflow, `No horizontal document overflow at ${w}px viewport`);

      // Open popover and verify bounds
      const narrowTrigger = await page.$('[data-testid="user-profile-trigger"]');
      await narrowTrigger.click();
      await page.waitForSelector('[data-testid="user-profile-card"]', { timeout: 2000 });
      const card = await page.$('[data-testid="user-profile-card"]');
      const box = await card.boundingBox();
      assert(
        box.x >= 0 && (box.x + box.width) <= w + 1, // 1px tolerance for subpixel
        `Popover fits cleanly within ${w}px viewport (x: ${box.x}, width: ${box.width})`
      );
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 100));
    }

    // ----------------------------------------------------
    // TEST SUITE 6: Apple HIG Meta & Safe Area Verification
    // ----------------------------------------------------
    console.log('\n--- Test Suite 6: Apple HIG Meta & Safe Area Verification ---');
    const viewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta ? meta.getAttribute('content') : '';
    });
    assert(
      viewportMeta.includes('viewport-fit=cover'),
      `Viewport meta includes "viewport-fit=cover" for Apple HIG safe areas (got: "${viewportMeta}")`
    );

    const safeAreaClass = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="bottom-navigation-bar"] > div');
      return el ? el.className : '';
    });
    assert(
      safeAreaClass.includes('safe-area-inset-bottom') && safeAreaClass.includes('safe-area-inset-left'),
      `Bottom navigation includes env(safe-area-inset-bottom) and horizontal safe areas (class: "${safeAreaClass}")`
    );

    const headerSafeClass = await page.evaluate(() => {
      const el = document.querySelector('header');
      return el ? el.className : '';
    });
    assert(
      headerSafeClass.includes('safe-area-inset-top') && headerSafeClass.includes('safe-area-inset-left'),
      `Header includes env(safe-area-inset-top) and horizontal safe areas for notch/Dynamic Island (class: "${headerSafeClass}")`
    );

    const overscrollBehavior = await page.evaluate(() => {
      return window.getComputedStyle(document.body).overscrollBehaviorY || window.getComputedStyle(document.documentElement).overscrollBehaviorY;
    });
    assert(
      overscrollBehavior === 'none',
      `Overscroll behavior is "none" to prevent rubber-banding on iOS Safari (got: "${overscrollBehavior}")`
    );

  } catch (err) {
    console.error('Test execution error:', err);
    allPassed = false;
  } finally {
    await browser.close();
    previewProcess.kill();
  }

  console.log('\n======================================');
  if (allPassed) {
    console.log('🎉 ALL ACCEPTANCE CRITERIA AND ADVERSARIAL CHECKS PASSED!');
    process.exit(0);
  } else {
    console.error('❌ SOME CHECKS FAILED');
    process.exit(1);
  }
}

runTests();
