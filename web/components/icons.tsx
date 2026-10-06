// 24px stroke 아이콘 (currentColor)
const Svg = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-full">
    {children}
  </svg>
);

export const HomeIcon = () => <Svg><path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" /></Svg>;
export const ChatIcon = () => <Svg><path d="M5 18l-1 3 4-2h9a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v9" /><path d="M9 10h6M9 13h4" /></Svg>;
export const ArchiveIcon = () => <Svg><rect x="3" y="4" width="18" height="5" rx="1" /><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4" /></Svg>;
export const ChartIcon = () => <Svg><path d="M4 20V4M4 20h16" /><path d="M8 15l4-5 3 3 5-6" /></Svg>;
export const UserIcon = () => <Svg><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>;
export const AlertIcon = () => <Svg><path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17v.5" /></Svg>;
export const UsersIcon = () => <Svg><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" /></Svg>;
export const BookIcon = () => <Svg><path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5M9 7h7" /></Svg>;
export const ReportIcon = () => <Svg><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 16v-3M12 16V9M16 16v-5" /></Svg>;
export const BuildingIcon = () => <Svg><path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3" /></Svg>;
export const ShieldCheckIcon = () => <Svg><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></Svg>;
