/**
 * WiTransfer Design System - Tokens de Estilo
 * Sistema de design centralizado para manter a hierarquia visual, espaçamentos
 * e uniformidade de estilo em todos os componentes administrativos da plataforma.
 */

export const THEME_TOKENS = {
  // Bordas e Parâmetros Estruturais dos Cards (Arredondamento estrito de 10px)
  cardRounded: "rounded-[10px]",
  cardBorder: "border border-slate-100",
  cardShadow: "shadow-sm hover:shadow-xl hover:shadow-[#902ad1]/5 transition-all duration-300",
  cardBg: "bg-white",

  // Classes Consolidadas de Cartão (Garante bordas arredondadas exatamente de 10px)
  cardStyle: "bg-white rounded-[10px] border border-slate-100 shadow-sm",
  cardInteractive: "bg-white rounded-[10px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-[#902ad1]/5 transition-all duration-300",

  // Espaçamentos
  cardPadding: "p-5 md:p-6",
  gridGap: "gap-6",

  // Pesos Tipográficos (Reserva pesos bold/black estritamente APENAS para títulos relevantes)
  // Títulos de Páginas e Secções (Negrito moderado, não agressivo)
  titleMain: "font-bold text-slate-800 tracking-tight",
  titleCard: "font-semibold text-slate-800 tracking-tight",
  
  // Corpo de Texto Regular e Detalhes (Sem negritos em números, unidades ou descrições)
  textBody: "font-normal text-slate-600 text-sm",
  textMedium: "font-medium text-slate-600 text-xs md:text-sm",
  textSemibold: "font-semibold text-slate-700",
  
  // Micro Metadados e Rótulos de Formulários
  labelMicro: "text-[9px] font-medium text-slate-400 uppercase tracking-widest",
  valueMicro: "text-[10px] font-medium text-slate-600 truncate",
  
  // Crachás e Indicadores de Status (Leves e compactos)
  badgeText: "text-[9px] font-medium uppercase tracking-widest",
  
  // Elementos Interativos e Ações
  buttonText: "font-bold text-xs uppercase tracking-wider",
  inputField: "w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all",

  // Itens de Menu Lateral (Seleção discreta com lilás suave/desbotado e texto de destaque)
  sidebarActive: "bg-[#902ad1]/8 text-[#902ad1] font-semibold",
  sidebarInactive: "text-slate-500 hover:bg-[#902ad1]/5 hover:text-[#902ad1]/90",
  sidebarIndicator: "bg-[#902ad1]",
};
