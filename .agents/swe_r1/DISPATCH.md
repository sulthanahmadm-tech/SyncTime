## 2026-09-18T17:42:54Z
Update the SyncTime React application's UI to comply with Apple HIG principles:
1. User Profile Card Popover: Dropdown/popover when clicking user's email/avatar in Header.tsx with glassmorphism background (e.g. Tailwind backdrop-blur) and continuous corner radii.
2. Mobile Web Responsiveness & Bottom Navigation: Responsive layout for mobile devices (Android and iOS). Hide desktop sidebar on mobile viewports (< 768px / e.g. 390px), show Bottom Navigation Bar for main navigation actions following Apple HIG mobile patterns. Ensure tap targets >= 44x44pt.
3. Run test suites and verify all acceptance criteria.
