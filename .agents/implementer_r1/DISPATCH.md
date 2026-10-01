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

Working directory for this subagent: c:\utee\SyncTime\.agents\implementer_r1
Repo directory: c:\utee\SyncTime
Integrity mode: development
Parent conversation ID: 995b4b5b-0200-43b4-9513-fe474b5ed99c

Please inspect the codebase, run tests, implement all required changes adhering to Apple HIG principles, add or update tests to thoroughly verify the acceptance criteria, run the test suite, and provide a full handoff report with an explicit Verification Record.
