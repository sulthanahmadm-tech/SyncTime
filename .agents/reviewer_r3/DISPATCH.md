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
> The UI responsiveness, Apple HIG compliance, touch targets, and modal lifecycles have been verified through automated multi-viewport headless Puppeteer testing, but physical iOS Safari hardware glassmorphism GPU shading and native touch haptics remain untestable in a headless environment.

## 1. What the prior attempt got wrong
1. **Action Sheet Data Loss on Short Viewports (<360px height)**:
   - **Input**: Opening "+ Tambah" Action Sheet on mobile devices in landscape orientation (e.g. 667x300) or on devices where an on-screen keyboard/browser address bar constrains vertical space.
   - **Expected**: Entire action sheet is visible and scrollable from top to bottom.
   - **Actual**: Action sheet used `justify-end` without scroll management. In CSS flexbox, `justify-content: flex-end` with overflowing content clips the top of the element out of view without allowing the user to scroll up, making the title and upper option ("Jadwal Rutin") completely unreachable.
   - **Root Cause**: Missing `overflow-y-auto` on backdrop and usage of `justify-end` instead of `mt-auto` on the inner card.

2. **Mobile Sheets Lingering on Device Rotation to Desktop (>=768px)**:
   - **Input**: User opens "+ Tambah" Action Sheet or "Filter" sheet in portrait (390x844) and rotates device to landscape (844x390, which exceeds `md` 768px).
   - **Expected**: Because the desktop sidebar appears and the mobile bottom navigation bar is hidden (`md:hidden`), the mobile sheet overlay should be hidden/dismissed.
   - **Actual**: Action Sheet and Filter Sheet remained rendered over the desktop sidebar and calendar because their backdrops lacked `md:hidden` and there was no viewport resize/media query listener.
   - **Root Cause**: Modal sheet backdrops were declared outside `md:hidden` without desktop dismissal handling.

3. **Missing Modal Background Scroll Lock (Rubber-Banding Passthrough)**:
   - **Input**: User swipes or scrolls while "+ Tambah" Action Sheet or "Filter" sheet is open.
   - **Expected**: Background calendar scroll is locked in place per Apple HIG modal presentation conventions.
   - **Actual**: Scrolling on the sheet or backdrop caused the underlying calendar to scroll and rubber-band.
   - **Root Cause**: `BottomNavigation.tsx` did not set `document.body.style.overflow = 'hidden'` during sheet presentation.

4. **Inconsistent Apple HIG Vibrancy (`backdrop-saturate-150`) and WebKit Corner Radii**:
   - **Input**: Inspecting glassmorphism styling and corner radius declarations across `BottomNavigation.tsx`, Action Sheet, and Filter Sheet.
   - **Expected**: Uniform Apple HIG glass vibrancy (`backdrop-saturate-150`) and continuous corner styles (`WebkitBorderRadius` / `WebkitBorderTop*Radius`) matching `UserProfilePopover.tsx`.
   - **Actual**: `BottomNavigation`, Action Sheet, and Filter Sheet lacked `backdrop-saturate-150`. The Filter Sheet lacked `WebkitBorderTopLeftRadius` and `WebkitBorderTopRightRadius`. The Action Sheet's "Batal" button had mismatched corner radius.
   - **Root Cause**: Inconsistent application of glass vibrancy utility classes and WebKit continuous corner radius properties.

5. **Tab Bar State Desynchronization for "Matkul" and "Jadwal"**:
   - **Input**: User taps "Matkul" tab in the bottom navigation bar.
   - **Expected**: "Matkul" tab is marked active with `aria-pressed="true"`, and dismissing the modal restores "Jadwal" as the active tab.
   - **Actual**: `BottomNavigation` had no awareness of `matkulWajibOpen` state; the "Jadwal" tab remained highlighted as active even when the Matkul Wajib modal was open.
   - **Root Cause**: `isMatkulWajibOpen` was not passed as a prop to `BottomNavigation`.

6. **Clipboard Copy Uncaught Promise Rejection on Insecure or Restricted Mobile WebKit**:
   - **Input**: User taps "Bagikan" tab on an HTTP or permission-restricted mobile browser context.
   - **Expected**: Fallback copy mechanism executes gracefully without crashing or throwing an unhandled rejection.
   - **Actual**: `navigator.clipboard.writeText(url)` had no error catch or fallback, causing an unhandled promise rejection.
   - **Root Cause**: Direct invocation of `navigator.clipboard.writeText` without try/catch or fallback.

7. **Timezone Discrepancy in Header Week Range**:
   - **Input**: Running the app in negative UTC offset timezones (e.g. America/New_York UTC-5).
   - **Expected**: Header date range matches the `WeeklyCalendar` date range.
   - **Actual**: `Header.tsx` parsed `currentWeekStart` via `new Date(currentWeekStart)` which parsed as UTC midnight and shifted by the timezone offset, displaying an off-by-one week range compared to `WeeklyCalendar`.
   - **Root Cause**: Use of `new Date(...)` instead of `parseLocalDate(...)` in `Header.tsx`.

8. **Missing Fallback for User Display Name in Popover**:
   - **Input**: User account with null/undefined email.
   - **Expected**: Popover renders a friendly fallback name and initial.
   - **Actual**: Popover rendered empty `<p>` tags and avatar initial defaulted unexpectedly.
   - **Root Cause**: Lack of fallback resolution for user display name in `UserProfilePopover.tsx`.

9. **Mobile Modal Form Overflow Clipping**:
   - **Input**: Opening "Tambah Jadwal Rutin" or "Tambah Jadwal Dinamis" on mobile in landscape mode or with virtual keyboard active.
   - **Expected**: Form can be scrolled to reach "Simpan" and "Batal" buttons.
   - **Actual**: Forms had `z-40` and `overflow-hidden` without `overflow-y-auto` on backdrop, causing bottom buttons to be clipped off-screen.
   - **Root Cause**: `RutinForm.tsx` and `DinamisForm.tsx` had `z-40` and no `overflow-y-auto` on the overlay container.

## 2. What I changed
- **`client/src/components/Layout/BottomNavigation.tsx`**:
  - Added body scroll locking (`document.body.style.overflow = 'hidden'`) during modal sheet presentation.
  - Fixed Action Sheet short viewport clipping using `mt-auto` on the sheet card and `overflow-y-auto` on the backdrop.
  - Added `md:hidden` and a resize listener (`window.innerWidth >= 768`) to automatically dismiss mobile sheets when rotating or resizing to desktop.
  - Added `backdrop-saturate-150` across the bottom nav bar, action sheet, and filter sheet for Apple HIG vibrancy.
  - Added WebKit continuous corner styles (`WebkitBorderTopLeftRadius`, `WebkitBorderTopRightRadius`, `WebkitBorderRadius: 20px`) to all sheets and buttons.
  - Integrated `isMatkulWajibOpen` and `onCloseMatkulWajib` props to synchronize tab active states and `aria-pressed`.
  - Added clipboard copy fallback (`document.execCommand('copy')`) wrapped in try/catch to avoid unhandled rejections on restricted mobile browsers.
- **`client/src/pages/Dashboard.tsx`**:
  - Connected `isMatkulWajibOpen={matkulWajibOpen}` and `onCloseMatkulWajib={() => setMatkulWajibOpen(false)}` to `BottomNavigation`.
- **`client/src/components/Layout/Header.tsx`**:
  - Replaced `new Date(currentWeekStart)` with `parseLocalDate(currentWeekStart)` to ensure timezone consistency with `WeeklyCalendar`.
  - Set `min-w-[44px] min-h-[44px]` on navigation controls to satisfy Apple HIG 44x44pt touch target standards.
- **`client/src/components/Layout/UserProfilePopover.tsx`**:
  - Added `displayName` fallback resolution (`user.email || user.user_metadata?.full_name || 'Pengguna SyncTime'`).
  - Added continuous corner radii (`style={{ borderRadius: '12px', WebkitBorderRadius: '12px' }}`) to inner logout button.
- **`client/src/components/Forms/MatkulWajibModal.tsx`**:
  - Added `Escape` key listener and backdrop click-to-dismiss.
  - Expanded close button touch target to 44x44pt (`min-w-[44px] min-h-[44px]`) with `aria-label="Tutup"`.
- **`client/src/components/Forms/RutinForm.tsx` & `DinamisForm.tsx` & `MagicPasteBox.tsx`**:
  - Raised modal z-index from `z-40` to `z-50` and added `overflow-y-auto` to the backdrop so forms are fully scrollable and sit cleanly above the bottom navigation bar on mobile viewports.
- **`client/verify-ui.cjs`**:
  - Expanded automated test suite from 5 to 6 suites, adding adversarial tests for scroll lock, orientation change dismissal, short viewports (667x300), tab active synchronization, and Apple HIG vibrancy.

## 3. Verification Record
- **Deep Verification (ran actual tests):**
  - `npm run build` (`tsc -b && vite build`): Succeeded with exit code 0.
  - `npm run lint` (`oxlint`): Succeeded with exit code 0.
  - `npm test` (`node verify-ui.cjs` Puppeteer automated suite): All 6 test suites passed cleanly (exit code 0):
    1. **Desktop Viewport (1280x800)**: Brand name visible, desktop sidebar visible, bottom nav hidden, popover opens with computed `backdropFilter: "blur(24px) saturate(1.5)"`, `borderRadius: "20px"`, logout button present, Escape key closes popover, outside click closes popover.
    2. **Mobile Viewport (390x844)**: Desktop sidebar hidden, bottom nav visible with frosted glass blur, all 5 nav item tap targets >= 44x44pt (each 74.8px x 47.0px), "+ Tambah" opens Action Sheet, body scroll locks (`overflow: hidden`), Escape dismisses sheet and unlocks body scroll, "Batal" dismisses sheet, "Filter" opens sheet and locks scroll, filter close button >= 44x44pt, Escape and close button dismiss sheet, "Matkul" activates tab, modal close restores "Jadwal" tab, header avatar opens popover bounded within 390px.
    3. **Orientation Change & Desktop Resize**: Action sheet opened in portrait (390x844), rotated to landscape desktop breakpoint (844x390), verified mobile sheet is dismissed/hidden and desktop sidebar is visible cleanly.
    4. **Short Viewport Overflow (667x300)**: Action sheet top position verified non-negative (top: 16px) and fully reachable in landscape view.
    5. **Narrow Mobile Viewports (360x740 and 320x568)**: Verified no horizontal document overflow (`scrollWidth <= viewportWidth`), popover cleanly bounded.
    6. **Apple HIG Meta & Safe Area**: Verified `<meta name="viewport">` has `viewport-fit=cover` and bottom nav bar includes `env(safe-area-inset-bottom)`.
- **Shallow Verification (manual only):**
  - Inspected generated screenshots: `screenshot-desktop-popover.png`, `screenshot-mobile-popover.png`, and `screenshot-mobile-bottomnav.png`.
- **Unverified aspects:**
  - Physical iOS hardware OLED screen color calibration for glassmorphism vibrancy.
  - Physical multi-touch gesture deceleration and Safari dynamic bottom URL bar scrolling on actual iOS device.

## 4. Known Issues
- `Minor Robustness Risk`: On viewport widths strictly between 768px and 844px in landscape mode, `md:flex` activates desktop mode (sidebar visible, bottom nav hidden), which is standard Tailwind CSS behavior for tablets and wide landscape phones.
- `Shallow Verification`: Chromium headless browser was used to emulate mobile viewports; physical iOS WebKit engine was not directly executed.

## 5. Remaining risk & next step
- Both R1 (User Profile Card Popover with glassmorphism and continuous corner radii) and R2 (Mobile Responsiveness, hidden desktop sidebar, Apple HIG Bottom Navigation with tap targets >= 44x44pt) are fully satisfied and hardened against adversarial edge cases.
- Next step: The changes are complete, robust, and verified. Ready for user demonstration and merge.
</prior_attempt>

Additional Context:
Open Issues Ledger:
- Native iOS Safari bottom browser bar rubber-banding effect (tested via Chromium headless emulation). [Raised in Implementer Round 1]
- Edge case: Test on physical iOS Safari device to confirm dynamic home indicator padding (env(safe-area-inset-bottom)). [Raised in Implementer Round 1]
- Physical iOS Safari device testing with active hardware Dynamic Island and interactive Safari address bar minimization on scroll. [Raised in Reviewer Round 1]
- WebKit rendering engine on physical Apple devices for exact GPU glassmorphism shader performance. [Raised in Reviewer Round 1]
- Minor Robustness Risk: On viewport widths strictly between 768px and 844px in landscape orientation, md:flex activates desktop mode (sidebar shown, bottom nav hidden) which is standard Tailwind behavior, though landscape phones in this narrow range have limited vertical height. [Raised in Reviewer Round 1]
- Shallow Verification: Chromium headless browser was used to emulate mobile viewports; physical iOS WebKit engine was not directly executed. [Raised in Reviewer Round 1]
- Physical iOS hardware OLED screen color calibration for glassmorphism vibrancy. [Raised in Reviewer Round 2]
- Physical multi-touch gesture deceleration and Safari dynamic bottom URL bar scrolling on actual iOS device. [Raised in Reviewer Round 2]

Working directory for this subagent: c:\utee\SyncTime\.agents\reviewer_r3
Repo root: c:\utee\SyncTime
Caller agent ID: 995b4b5b-0200-43b4-9513-fe474b5ed99c

As Reviewer Round 3 (final review round before victory audit), perform an exhaustive adversarial examination of the implementation and test suites. Check for any remaining subtle bugs, edge cases, accessibility omissions, CSS quirks, or unhandled states. Fix any issues discovered, run the full build and test suites, and provide your complete handoff report with an explicit Verification Record.
