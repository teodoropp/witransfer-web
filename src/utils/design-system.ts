/**
 * WiTransfer Design System - Tokens de Estilo & Guia de Boas Práticas
 * 
 * =========================================================================
 * REGRAS ESTRITAS DE DESIGN E TIPOGRAFIA (PARA EVITAR ERROS VISUAIS):
 * =========================================================================
 * 1. ARREDONDAMENTO DE BORDAS:
 *    - Todas as bordas de cartões, botões e campos de formulário devem ter 
 *      o arredondamento padrão de exatamente 10px (`rounded-[10px]`).
 *    - NUNCA utilize `rounded-2xl`, `rounded-lg` ou `rounded-[40px]`.
 * 
 * 2. TIPOGRAFIA E PESOS DE TEXTO (EVITAR NEGRITO EM EXCESSO):
 *    - O utilizador detesta poluição visual por negritos excessivos.
 *    - NEGRITO FORTE (`font-bold`): Reservado ESTRICTAMENTE para títulos 
 *      relevantes de páginas principais ou títulos de secção de destaque.
 *    - NEGRITOS EXTREMOS (`font-black`, `font-extrabold`): Totalmente PROIBIDOS 
 *      em metadados, valores de tabela, filtros ou descrições.
 *    - TEXTO MÉDIO/SEMIBOLD (`font-medium` ou `font-semibold`): Utilizar para 
 *      métricas, valores numéricos, siglas (ex: "Kz", "KM"), marcas, matriculas,
 *      rótulos de campos e botões.
 * 
 * 3. MENU LATERAL (SIDEBAR):
 *    - Sem dropdowns/acordiões colapsáveis. Exibir todas as sub-opções de forma 
 *      plana sob os seus respetivos cabeçalhos.
 *    - SELEÇÃO ATIVA: Deve ser extremamente discreta, usando o fundo desbotado
 *      (`bg-[#902ad1]/8`) e texto violeta (`text-[#902ad1]`). NUNCA usar fundo 
 *      sólido roxo ou sombras carregadas.
 * =========================================================================
 */

// Base values for dynamic interpolation
const cardRounded = "rounded-[5px]";
const cardBorder = "border border-black/[0.22]";
const cardShadow = "shadow-sm hover:shadow-md hover:scale-[1.01] hover:shadow-[#902ad1]/3 transition-all duration-300 ease-out";
const cardBg = "bg-white";

export const THEME_TOKENS = {
  // Bordas e Parâmetros Estruturais dos Cards
  cardRounded,
  cardBorder,
  cardShadow,
  cardBg,

  // Classes Consolidadas de Cartão (Herda dinamicamente o arredondamento acima)
  cardStyle: `${cardBg} ${cardRounded} ${cardBorder}`,
  cardInteractive: `${cardBg} ${cardRounded} ${cardBorder}`,

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
  inputField: `w-full px-4 py-3 \${cardRounded} border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all`,

  // Itens de Menu Lateral (Seleção discreta com lilás suave/desbotado e texto de destaque)
  sidebarActive: "bg-[#902ad1]/8 text-[#902ad1] font-semibold",
  sidebarInactive: "text-slate-500 hover:bg-[#902ad1]/5 hover:text-[#902ad1]/90",
  sidebarIndicator: "bg-[#902ad1]",
};
