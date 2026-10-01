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
> I am confident that the UI changes comply with Apple HIG styling and pass automated Puppeteer viewport checks, though long-term responsive behavior on non-standard folding screens or landscape mobile orientations has not been exhaustively tested.

## 1. What I changed
- **`client/src/components/Layout/UserProfilePopover.tsx`**: Created an Apple HIG user profile component with a continuous corner radius (`rounded-2xl`, 20px / 1.25rem), frosted glass background (`backdrop-blur-xl bg-gray-900/80 border border-white/15 shadow-2xl ring-1 ring-white/10`), avatar with gradient, account details, and an accessible logout button. Included outside-click and Escape key handlers to close the popover.
- **`client/src/components/Layout/BottomNavigation.tsx`**: Created a mobile-only Bottom Navigation Bar (`md:hidden fixed bottom-0 left-0 right-0`) with Apple HIG frosted glass material (`backdrop-blur-xl bg-gray-950/85 border-t border-white/10`) and safe-area padding. Implemented 5 main action tabs (Jadwal, + Tambah, Matkul, Filter, Bagikan). Ensured all touch targets meet or exceed 44x44 CSS pixels (pt). Added mobile Action Sheet for "+ Tambah" (Rutin, Dinamis, Magic Paste AI) and Bottom Sheet for "Filter & Analisis" (Rutin/Dinamis toggles, Kategori list, and CategoryChart).
- **`client/src/components/Layout/Header.tsx`**: Replaced the static email text and raw logout button with `UserProfilePopover`, made the header navigation responsive for mobile viewports (e.g., 390px) to prevent layout wrapping or overflow, and added ARIA accessibility attributes.
- **`client/src/components/Layout/Sidebar.tsx`**: Added `hidden md:flex` to hide the desktop sidebar on mobile viewports (< 768px).
- **`client/src/pages/Dashboard.tsx`**: Integrated `BottomNavigation` into the dashboard layout, wiring actions to the existing schedule form state (`onAddRutin`, `onAddDinamis`, `onAddMagicPaste`, `onOpenMatkulWajib`, filters, and categories).
- **`client/src/components/Calendar/WeeklyCalendar.tsx`**: Added `pb-16 md:pb-0` so calendar content at the bottom of the day columns is not obstructed by the fixed mobile bottom navigation bar.
- **`client/src/contexts/AuthContext.tsx` & `client/src/lib/supabase.ts`**: Made environment configuration and session handling resilient against offline/mock states during automated test runs.
- **`client/verify-ui.cjs`**: Created an automated Puppeteer test suite that validates desktop viewports (1280x800) and mobile viewports (390x844), checking visibility, computed styles (`backdropFilter`, `borderRadius`), tap target dimensions (>= 44x44pt), action sheet / filter sheet toggling, and saving screenshots.

## 2. Why
- **R1 (User Profile Card Popover)**: Required a popover dropdown when clicking user email/avatar in `Header.tsx`, with glassmorphism (`backdrop-blur`) and continuous corner radii to follow Apple HIG aesthetics.
- **R2 (Mobile Web Responsiveness & Bottom Navigation)**: Required hiding desktop sidebar on mobile devices (e.g. 390px viewport width) and providing an Apple HIG bottom navigation bar with tap targets of at least 44x44pt for main actions.

## 3. Verification Record
- **Deep Verification (ran actual tests):**
  - Ran `npm run build` (`tsc -b && vite build`): Succeeded with exit code 0.
  - Ran `npm run lint` (`oxlint`): Succeeded with exit code 0 and no errors/warnings in modified code.
  - Ran automated Puppeteer test suite (`node verify-ui.cjs`):
    - Desktop (1280x800): Verified sidebar is visible, bottom nav is hidden, clicking profile trigger opens popover card with computed `backdropFilter: "blur(24px)"`, `borderRadius: "20px"`, semi-transparent background, and logout button; outside-click closes popover.
    - Mobile (390x844): Verified desktop sidebar is hidden (`display: none`), bottom navigation bar is visible, all 5 nav items have tap targets >= 44x44pt (each measured 74.8px x 47.0px), "+ Tambah" opens action sheet with Rutin/Dinamis/Magic Paste options, "Filter" opens bottom sheet with toggles/categories/chart, and clicking header avatar opens popover fitted within 390px bounds.
- **Shallow Verification (manual run only):**
  - Inspected generated screenshots: `client/screenshot-desktop-popover.png`, `client/screenshot-mobile-popover.png`, and `client/screenshot-mobile-bottomnav.png`. Confirmed visual fidelity of blur, borders, typography, and contrast.
- **Untested aspects:**
  - Native iOS Safari bottom browser bar rubber-banding effect (tested via Chromium headless emulation).
  - Landscape orientation on mobile devices with viewport height < 500px.

## 4. Known Issues
- `Minor Robustness Risk` — In extremely low-height landscape viewports on mobile phones (< 450px height), the open bottom sheet for Filter & Analisis might require scrolling inside the sheet due to modal height limits (`max-h-[85vh]`).

## 5. Untested Edge Cases & Next Step
- **Edge cases to attack first:**
  1. Test orientation change from portrait (390x844) to landscape (844x390) while the "+ Tambah" action sheet or "Filter" sheet is open.
  2. Test on physical iOS Safari device to confirm the dynamic home indicator padding (`env(safe-area-inset-bottom)`).
</prior_attempt>

Additional Context:
Open Issues Ledger:
- Native iOS Safari bottom browser bar rubber-banding effect (tested via Chromium headless emulation). [Raised in Implementer Round 1]
- Landscape orientation on mobile devices with viewport height < 500px. [Raised in Implementer Round 1]
- Minor Robustness Risk — In extremely low-height landscape viewports on mobile phones (< 450px height), the open bottom sheet for Filter & Analisis might require scrolling inside the sheet due to modal height limits (max-h-[85vh]). [Raised in Implementer Round 1]
- Edge case: Test orientation change from portrait (390x844) to landscape (844x390) while the "+ Tambah" action sheet or "Filter" sheet is open. [Raised in Implementer Round 1]
- Edge case: Test on physical iOS Safari device to confirm the dynamic home indicator padding (env(safe-area-inset-bottom)). [Raised in Implementer Round 1]

Working directory for this subagent: c:\utee\SyncTime\.agents\reviewer_r1
Repo root: c:\utee\SyncTime
Caller agent ID: 995b4b5b-0200-43b4-9513-fe474b5ed99c

As Reviewer Round 1, independently re-derive the requirements, actively attempt to break the existing diff with adversarial tests/checks, inspect and repair any issues or edge cases found, re-run builds and tests, and report back with a full handoff report and verification record.
