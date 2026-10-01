<original_task>
# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Small, focused team

This is a single self-contained fix; keep it small and focused. Update the SyncTime React application's UI to comply with Apple HIG principles. This includes creating a user profile card popover with glassmorphism and continuous corner radius, and making the mobile web layout responsive with a bottom navigation bar for iOS and Android.

Working directory: c:\utee\SyncTime
Integrity mode: development

## Requirements

### R1. User Profile Card Popover
Create a user profile card that appears as a dropdown/popover when clicking the user's email/avatar in the `Header.tsx`. The card must feature a glassmorphism background (e.g., using Tailwind's `backdrop-blur`) and continuous corner radii to match Apple HIG aesthetics.

### R2. Mobile Web Responsiveness & Bottom Navigation
Update the web application layout to be fully responsive on mobile devices (Android and iOS). On mobile viewports, hide the desktop sidebar and implement a Bottom Navigation Bar for the main navigation actions to follow standard Apple HIG mobile patterns. Ensure tap targets in the bottom navigation are at least 44x44pt.

## Acceptance Criteria

### UI / UX Verification
- [ ] Clicking the user email/avatar in the Header opens a popover card with a visible frosted glass effect and rounded corners.
- [ ] On a mobile viewport (e.g., 390px width), the desktop sidebar is hidden, and a Bottom Navigation Bar is visible and functional at the bottom of the screen.
- [ ] Tap targets on the bottom navigation items are a minimum of 44x44 CSS pixels (pt).
</original_task>

<prior_attempt>
> [!WARNING] **Skepticism Disclaimer**
> I am confident that the Apple HIG compliance, responsiveness, and touch targets meet requirements, verified via headless Chromium and automated Puppeteer viewport suites; however, physical touch screen gesture friction and real WebKit-specific glassmorphism rendering on hardware OLED displays remain untested without physical Apple hardware.

## 1. What the prior attempt got wrong
1. **Desktop Brand Name Invisibility**:
   - **Input**: Viewport width 1280px (Desktop).
   - **Expected**: Header displays the "SyncTime" brand name next to the clock icon.
   - **Actual**: Brand name "SyncTime" was completely hidden (`display: none`).
   - **Root Cause**: `Header.tsx` used `<span className="hidden xs:inline">SyncTime</span>`. Tailwind CSS v4 does not define an `xs` breakpoint by default, so `xs:inline` was not generated, leaving `hidden` active across all screens including desktop.
2. **Missing `viewport-fit=cover` for Apple HIG Safe Area Insets**:
   - **Input**: Viewing mobile web app on iOS Safari / WebKit with notch or home indicator.
   - **Expected**: `env(safe-area-inset-bottom)` dynamically evaluates to hardware insets (e.g., 34px) for the bottom navigation bar.
   - **Actual**: `env(safe-area-inset-bottom)` evaluated to `0px` because `client/index.html` lacked `viewport-fit=cover`.
   - **Root Cause**: Apple WebKit specification requires `<meta name="viewport" content="..., viewport-fit=cover">` to activate safe area environment variables and prevent letterboxing.
3. **Broken Flexbox Truncation on Narrow Viewports (<=360px)**:
   - **Input**: Viewport width 320px – 360px (e.g., Samsung Galaxy S, iPhone SE).
   - **Expected**: Week navigator truncates date text cleanly without causing layout overflow.
   - **Actual**: The week navigator outer flex container lacked `min-w-0`, defaulting to `min-width: auto` and preventing child text truncation.
   - **Root Cause**: Omission of `min-w-0` on `<div className="flex items-center gap-1 sm:gap-3 min-w-0">`.
4. **Auth Lifecycle Bypass & Race Condition in `AuthContext.tsx`**:
   - **Input**: Launching application with cached or offline user session.
   - **Expected**: User session initializes and `supabase.auth.onAuthStateChange` listener is registered with cleanup.
   - **Actual**: `if (storedUser) { ... return; }` returned early, leaving `onAuthStateChange` completely unattached and returning `undefined` instead of cleanup. When listener was attached without synchronous state initialization, `INITIAL_SESSION: null` prematurely redirected `/dashboard` to `/`.
   - **Root Cause**: Lack of synchronous `useState` initialization from storage and flawed lifecycle branch logic in `AuthContext.tsx`.
5. **Filter Bottom Sheet Header Loss on Scroll**:
   - **Input**: Open "Filter & Analisis" bottom sheet and scroll down to inspect categories and CategoryChart.
   - **Expected**: Header and close button ("X") remain pinned and accessible.
   - **Actual**: Header scrolled off-screen with the content.
   - **Root Cause**: Header was positioned statically rather than `sticky top-0`.
6. **Missing Keyboard Escape Dismissal in Bottom Navigation**:
   - **Input**: Pressing `Escape` when "+ Tambah" Action Sheet or "Filter" Bottom Sheet is open.
   - **Expected**: Sheet dismisses per Apple HIG and modal accessibility conventions.
   - **Actual**: Key press was ignored.
   - **Root Cause**: `BottomNavigation.tsx` lacked a `keydown` listener for `Escape`.
7. **Weekly Calendar Bottom Slot Occlusion**:
   - **Input**: Scroll to bottom of WeeklyCalendar on mobile.
   - **Expected**: The 23:00 time block is fully visible above the fixed bottom navigation bar.
   - **Actual**: Bottom padding was only `pb-16` (64px), which is shorter than the fixed bottom bar height + safe area inset (~86px+).
   - **Root Cause**: Insufficient bottom padding in `WeeklyCalendar.tsx`.

## 2. What I changed
- **`client/index.html`**: Added `viewport-fit=cover` to `<meta name="viewport">` to ensure proper safe-area-inset support on iOS Safari.
- **`client/src/components/Layout/Header.tsx`**:
  - Restored "SyncTime" brand visibility on desktop viewports (`<span data-testid="brand-name" className="hidden sm:inline">SyncTime</span>`).
  - Added `min-w-0` to the week navigator container to enable flex truncation on narrow screens (<360px).
  - Raised header stacking context to `relative z-50` so popovers float above all calendar elements.
  - Increased button touch targets on navigation controls (`min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px]`).
- **`client/src/components/Layout/UserProfilePopover.tsx`**:
  - Added `max-w-[calc(100vw-1.5rem)]` bounding constraint so popover fits within any viewport width down to 320px.
  - Added `backdrop-saturate-150` for authentic Apple HIG glass vibrancy.
  - Explicitly declared continuous corner radius: `rounded-[20px]` and `style={{ borderRadius: '20px', WebkitBorderRadius: '20px' }}`.
- **`client/src/components/Layout/BottomNavigation.tsx`**:
  - Added `Escape` key listener to dismiss both the Action Sheet and Filter Sheet.
  - Made the Filter Sheet header `sticky -top-5` with backdrop blur and border so the close button is always accessible while scrolling through categories and charts.
  - Applied continuous corner radii to the Action Sheet (`borderRadius: 24px`) and Filter Sheet (`borderTopLeftRadius: 24px, borderTopRightRadius: 24px`).
- **`client/src/components/Calendar/WeeklyCalendar.tsx`**:
  - Increased mobile bottom padding to `pb-28 md:pb-0` (~112px) to prevent the bottom navigation bar and home indicator from obscuring bottom schedule blocks.
- **`client/src/contexts/AuthContext.tsx`**:
  - Initialized `user` and `session` synchronously via `useState(() => ...)` from localStorage to eliminate mount-time redirect flickers.
  - Preserved `supabase.auth.onAuthStateChange` subscription and cleanup without premature returns.
- **`client/package.json` & `client/verify-ui.cjs`**:
  - Added `"test": "node verify-ui.cjs"` script.
  - Fixed oxlint unused variable warnings.
  - Added adversarial verification suites testing desktop brand visibility, popover continuous corner radius (>=20px), Escape key dismissals, narrow mobile viewports (360x740 and 320x568) with no horizontal overflow, landscape mobile (667x375), and `viewport-fit=cover`.

## 3. Verification Record
- **Deep Verification (ran actual tests):**
  - `npm run build` (`tsc -b && vite build`): Succeeded with exit code 0.
  - `npm run lint` (`oxlint`): Succeeded with exit code 0 (no warnings in modified code).
  - `npm test` (`node verify-ui.cjs` Puppeteer suite): All 5 test suites passed (exit code 0):
    1. **Desktop Viewport (1280x800)**: Brand name "SyncTime" visible, desktop sidebar visible, bottom nav hidden, profile popover opens with computed `backdropFilter: "blur(24px) saturate(1.5)"`, `borderRadius: "20px"`, logout button present, Escape key closes popover, outside-click closes popover.
    2. **Mobile Viewport (390x844)**: Sidebar hidden, bottom nav visible, all 5 nav item tap targets >= 44x44pt (each 74.8px x 47.0px), "+ Tambah" opens action sheet, action options >= 44pt, Escape key dismisses action sheet, "Batal" dismisses action sheet, "Filter" opens filter sheet, close button >= 44x44pt, Escape key dismisses filter sheet, close button dismisses filter sheet, header avatar opens popover, popover fits within mobile width (x: 90, width: 288), Escape key dismisses popover.
    3. **Narrow Mobile Viewports (360x740 & 320x568)**: Verified no horizontal document overflow (`scrollWidth <= viewportWidth`) and popover card cleanly bounded within viewport.
    4. **Landscape Mobile Viewport (667x375)**: Verified Action Sheet opens and dismisses cleanly in landscape orientation.
    5. **Apple HIG Meta & Safe Area**: Verified `<meta name="viewport">` has `viewport-fit=cover` and bottom nav includes `env(safe-area-inset-bottom)`.
- **Shallow Verification (manual only):**
  - Inspected generated screenshots: `client/screenshot-desktop-popover.png`, `client/screenshot-mobile-popover.png`, and `client/screenshot-mobile-bottomnav.png`.
- **Unverified aspects:**
  - Physical iOS Safari device testing with active hardware Dynamic Island and interactive Safari address bar minimization on scroll.
  - WebKit rendering engine on physical Apple devices for exact GPU glassmorphism shader performance.

## 4. Known Issues
- `Minor Robustness Risk`: On viewport widths strictly between 768px and 844px in landscape orientation, `md:flex` activates desktop mode (sidebar shown, bottom nav hidden) which is standard Tailwind behavior, though landscape phones in this narrow range have limited vertical height.
- `Shallow Verification`: Chromium headless browser was used to emulate mobile viewports; physical iOS WebKit engine was not directly executed.

## 5. Remaining risk & next step
- Both R1 (User Profile Card Popover with glassmorphism and continuous corner radii) and R2 (Mobile Responsiveness, hidden sidebar on mobile, Apple HIG bottom navigation with tap targets >= 44x44pt) are fully satisfied and hardened against adversarial edge cases.
- Next step: Run complete end-to-end integration tests with the live backend/database if required, or submit for user review.
</prior_attempt>

Additional Context:
Open Issues Ledger:
- Native iOS Safari bottom browser bar rubber-banding effect (tested via Chromium headless emulation). [Raised in Implementer Round 1]
- Edge case: Test orientation change from portrait (390x844) to landscape (844x390) while the "+ Tambah" action sheet or "Filter" sheet is open. [Raised in Implementer Round 1]
- Edge case: Test on physical iOS Safari device to confirm the dynamic home indicator padding (env(safe-area-inset-bottom)). [Raised in Implementer Round 1]
- Physical iOS Safari device testing with active hardware Dynamic Island and interactive Safari address bar minimization on scroll. [Raised in Reviewer Round 1]
- WebKit rendering engine on physical Apple devices for exact GPU glassmorphism shader performance. [Raised in Reviewer Round 1]
- Minor Robustness Risk: On viewport widths strictly between 768px and 844px in landscape orientation, md:flex activates desktop mode (sidebar shown, bottom nav hidden) which is standard Tailwind behavior, though landscape phones in this narrow range have limited vertical height. [Raised in Reviewer Round 1]
- Shallow Verification: Chromium headless browser was used to emulate mobile viewports; physical iOS WebKit engine was not directly executed. [Raised in Reviewer Round 1]
- Run complete end-to-end integration tests with the live backend/database if required, or submit for user review. [Raised in Reviewer Round 1]

Working directory for this subagent: c:\utee\SyncTime\.agents\reviewer_r2
Repo root: c:\utee\SyncTime
Caller agent ID: 995b4b5b-0200-43b4-9513-fe474b5ed99c

As Reviewer Round 2, independently inspect the code and test suite, actively try to break remaining edge cases (e.g. landscape sheet behaviors, accessibility, contrast, animations, responsiveness across different mobile dimensions), fix any issues discovered, run the build and test suite, and provide a full handoff report with an explicit Verification Record.
