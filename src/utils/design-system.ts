/**
 * WiTransfer Premium Design System Theme Tokens
 * Centralized design system to maintain visual hierarchy, layout spacing,
 * and style uniformity across all admin portal components.
 */

export const THEME_TOKENS = {
  // Border Radius & Structural Card Parameters (Strictly 10px radius)
  cardRounded: "rounded-[10px]",
  cardBorder: "border border-slate-100",
  cardShadow: "shadow-sm hover:shadow-xl hover:shadow-[#902ad1]/5 transition-all duration-300",
  cardBg: "bg-white",

  // Consolidated Card Container Classes (Enforces exactly 10px rounded borders)
  cardStyle: "bg-white rounded-[10px] border border-slate-100 shadow-sm",
  cardInteractive: "bg-white rounded-[10px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-[#902ad1]/5 transition-all duration-300",

  // Spacing
  cardPadding: "p-5 md:p-6",
  gridGap: "gap-6",

  // Typography Weights (Strictly reserves bold/black weights ONLY for relevant titles)
  // Page & Major Titles (Bold but not aggressive)
  titleMain: "font-bold text-slate-800 tracking-tight",
  titleCard: "font-semibold text-slate-800 tracking-tight",
  
  // Regular Body & Details (Uses Normal or Medium - NO bolding for numbers/units/labels)
  textBody: "font-normal text-slate-600 text-sm",
  textMedium: "font-medium text-slate-600 text-xs md:text-sm",
  textSemibold: "font-semibold text-slate-700",
  
  // Micro Metadata / Form Labels (Clean, medium weight uppercase tracking)
  labelMicro: "text-[9px] font-medium text-slate-400 uppercase tracking-widest",
  valueMicro: "text-[10px] font-medium text-slate-600 truncate",
  
  // Badge & Indicators (Compact, clean weights)
  badgeText: "text-[9px] font-medium uppercase tracking-widest",
  
  // Interactive Elements & Navigation
  buttonText: "font-bold text-xs uppercase tracking-wider",
  inputField: "w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all",

  // Sidebar Menu Items (Discrete selection with faded lilac and deep text)
  sidebarActive: "bg-[#902ad1]/8 text-[#682E8B] font-semibold",
  sidebarInactive: "text-slate-500 hover:bg-[#902ad1]/5 hover:text-[#902ad1]/90",
  sidebarIndicator: "bg-[#902ad1]",
};
