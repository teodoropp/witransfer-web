/** @format */

"use client";

import React from "react";
import {
  Users,
  CreditCard,
  Activity,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Plane,
  Car,
  Bell,
  Megaphone,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { THEME_TOKENS } from "@/utils/design-system";

export default function AdminDashboard() {
  // Dados simulados de alta fidelidade
  const motoristasOnline = [
    { nome: "João Miguel", foto: null, status: "livre" },
    { nome: "António Costa", foto: null, status: "em_transito" },
    { nome: "Francisco Silva", foto: null, status: "livre" },
    { nome: "Manuel D.", foto: null, status: "ocupado" },
  ];

  const atividadesRecentes = [
    {
      id: "1",
      tipo: "reserva",
      texto: "Nova reserva #WT-8942 de Maria A. aprovada.",
      tempo: "5 min atrás",
      cor: "bg-emerald-500",
    },
    {
      id: "2",
      tipo: "motorista",
      texto: "Motorista António Costa iniciou viagem para Aeroporto.",
      tempo: "14 min atrás",
      cor: "bg-[#902ad1]",
    },
    {
      id: "3",
      tipo: "pagamento",
      texto: "Pagamento de 45.000 Kz recebido de reserva #WT-8939.",
      tempo: "1 hora atrás",
      cor: "bg-emerald-500",
    },
    {
      id: "4",
      tipo: "alerta",
      texto: "Nova viatura Ford Transit adicionada à frota.",
      tempo: "2 horas atrás",
      cor: "bg-blue-500",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Banner de Boas-Vindas & Status Geral (Espande 2 colunas no desktop) */}
        <div className={`md:col-span-2 p-8 bg-gradient-to-r from-slate-900 via-slate-850 to-[#4a156e] text-white overflow-hidden relative glowing-border-hover shadow-lg shadow-[#902ad1]/5 flex flex-col justify-between min-h-[220px] ${THEME_TOKENS.cardRounded}`}>
          {/* Efeito de brilho de fundo */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#902ad1]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-bold uppercase tracking-widest text-purple-200 border border-white/5">
                <Zap size={10} className="animate-pulse" /> Servidor Ativo
              </span>
              <h1 className="text-2xl font-bold tracking-tight mt-3">
                Bem-vindo ao WiTransfer Admin
              </h1>
              <p className="text-slate-350 text-xs max-w-md font-medium">
                Gestão simplificada, frota ativa e operações integradas em tempo real. Veja o progresso da plataforma hoje.
              </p>
            </div>
            
            <div className="w-10 h-10 rounded-[10px] bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-purple-200">
              <Activity size={18} className="animate-pulse" />
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-6 border-t border-white/10 pt-4 mt-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Serviço de Reservas Online</span>
            </div>
            <div className="h-3 w-[1px] bg-white/10" />
            <span className="text-[11px] text-slate-400 font-medium">Latência de BD: 14ms</span>
          </div>
        </div>

        {/* Card 2: Estatística Reservas Ativas (1x1) */}
        <div className={`p-6 relative overflow-hidden group glowing-border-hover ${THEME_TOKENS.cardStyle}`}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className={THEME_TOKENS.labelMicro}>Reservas Ativas</p>
              <h3 className="text-3xl font-bold text-slate-800 tracking-tight">24</h3>
            </div>
            <div className="p-2.5 bg-[#902ad1]/5 text-[#902ad1] rounded-[10px]">
              <Users size={16} />
            </div>
          </div>

          {/* Mini Sparkline SVG (Representa gráfico rápido de tendências) */}
          <div className="h-12 w-full mt-4 flex items-end">
            <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path
                d="M0,25 Q15,10 30,22 T60,5 T90,15 T100,8"
                fill="none"
                stroke="#902ad1"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M0,25 Q15,10 30,22 T60,5 T90,15 T100,8 L100,30 L0,30 Z"
                fill="url(#sparkline-grad)"
                opacity="0.08"
              />
              <defs>
                <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#902ad1" />
                  <stop offset="100%" stopColor="#902ad1" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="flex items-center gap-1.5 mt-4 text-[10px] font-bold text-emerald-600">
            <TrendingUp size={12} />
            <span>+12% esta semana</span>
          </div>
        </div>

        {/* Card 3: Estatística Receita Hoje (1x1) */}
        <div className={`p-6 relative overflow-hidden group glowing-border-hover ${THEME_TOKENS.cardStyle}`}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className={THEME_TOKENS.labelMicro}>Receita Hoje</p>
              <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
                142k <span className="text-lg font-semibold text-slate-400">Kz</span>
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-[10px]">
              <CreditCard size={16} />
            </div>
          </div>

          <div className="h-12 w-full mt-4 flex items-end">
            {/* Sparkline de crescimento financeiro */}
            <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path
                d="M0,28 L20,20 L40,25 L60,12 L80,15 L100,5"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M0,28 L20,20 L40,25 L60,12 L80,15 L100,5 L100,30 L0,30 Z"
                fill="url(#sparkline-grad-green)"
                opacity="0.08"
              />
              <defs>
                <linearGradient id="sparkline-grad-green" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="flex items-center gap-1.5 mt-4 text-[10px] font-bold text-emerald-600">
            <TrendingUp size={12} />
            <span>+8% em relação a ontem</span>
          </div>
        </div>

        {/* Card 4: Motoristas Ativos Online (1x1) */}
        <div className={`p-6 relative overflow-hidden group glowing-border-hover flex flex-col justify-between ${THEME_TOKENS.cardStyle}`}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className={THEME_TOKENS.labelMicro}>Motoristas Online</p>
              <h3 className="text-3xl font-bold text-slate-800 tracking-tight">8</h3>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-[10px]">
              <Car size={16} />
            </div>
          </div>

          {/* Avatares Empilhados Dinâmicos */}
          <div className="flex items-center gap-1.5 my-4">
            <div className="flex -space-x-3">
              {motoristasOnline.map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-slate-150 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm"
                >
                  M{i + 1}
                </div>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block ml-2">
              +4 em serviço
            </span>
          </div>

          <div className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">
            Total de 15 registados no painel
          </div>
        </div>

        {/* Card 5: Atalhos e Ações Rápidas (1x1) */}
        <div className={`p-6 glowing-border-hover flex flex-col justify-between ${THEME_TOKENS.cardStyle}`}>
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ações Rápidas</h3>
            <p className="text-[10px] text-slate-400 font-semibold block mt-0.5">Atalhos principais para a gestão do sistema.</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 my-4">
            <Link
              href="/admin/viaturas/nova"
              className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-[#902ad1]/5 rounded-[10px] border border-slate-100 hover:border-[#902ad1]/20 text-left transition-all group"
            >
              <Plus size={14} className="text-[#902ad1] group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-slate-700 tracking-tight">Viatura</span>
            </Link>

            <Link
              href="/admin/enviar-notificacao"
              className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-[#902ad1]/5 rounded-[10px] border border-slate-100 hover:border-[#902ad1]/20 text-left transition-all group"
            >
              <Bell size={14} className="text-[#902ad1] group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-slate-700 tracking-tight">Push</span>
            </Link>

            <Link
              href="/admin/enviar-promocao"
              className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-[#902ad1]/5 rounded-[10px] border border-slate-100 hover:border-[#902ad1]/20 text-left transition-all group"
            >
              <Megaphone size={14} className="text-[#902ad1] group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-slate-700 tracking-tight">Campanha</span>
            </Link>

            <Link
              href="/admin/aeroportos"
              className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-[#902ad1]/5 rounded-[10px] border border-slate-100 hover:border-[#902ad1]/20 text-left transition-all group"
            >
              <Plane size={14} className="text-[#902ad1] group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-slate-700 tracking-tight">Aeroportos</span>
            </Link>
          </div>

          <div className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">
            Ações seguras com registo de log
          </div>
        </div>

        {/* Card 6: Painel Gráfico de Tendências Semanais (Espande 2 colunas horizontal / vertical no grid) */}
        <div className={`md:col-span-2 p-6 glowing-border-hover flex flex-col justify-between min-h-[300px] ${THEME_TOKENS.cardStyle}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Tendências Semanais</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Histórico comparativo do fluxo de viagens diárias.</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#902ad1]" />
                <span className="text-[10px] text-slate-500 font-semibold">Viagens</span>
              </div>
              <span className="text-xs font-bold text-[#902ad1] bg-[#902ad1]/5 px-2.5 py-1 rounded-[10px]">
                Média: 18/dia
              </span>
            </div>
          </div>

          {/* Gráfico Curvado SVG Profissional */}
          <div className="h-44 w-full mt-4 flex items-end relative">
            <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
              {/* Linhas de Grade de Fundo */}
              <line x1="0" y1="37" x2="400" y2="37" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="75" x2="400" y2="75" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="112" x2="400" y2="112" stroke="#f1f5f9" strokeWidth="1" />
              
              {/* Degradê de área sob a curva */}
              <path
                d="M 0 130 C 50 110, 80 50, 130 60 C 180 70, 220 20, 270 30 C 320 40, 350 120, 400 90 L 400 150 L 0 150 Z"
                fill="url(#trend-gradient)"
                opacity="0.08"
              />
              {/* Curva principal */}
              <path
                d="M 0 130 C 50 110, 80 50, 130 60 C 180 70, 220 20, 270 30 C 320 40, 350 120, 400 90"
                fill="none"
                stroke="url(#stroke-gradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Definição dos gradientes */}
              <defs>
                <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#902ad1" />
                  <stop offset="100%" stopColor="#902ad1" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="stroke-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6b46c1" />
                  <stop offset="100%" stopColor="#902ad1" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>
        </div>

        {/* Card 7: Timeline de Atividades em Tempo Real (1x2 / Duplo vertical) */}
        <div className={`p-6 glowing-border-hover flex flex-col justify-between ${THEME_TOKENS.cardStyle}`}>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Monitor em Tempo Real</h3>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-[10px] text-slate-400 font-semibold block mt-0.5">Logs e eventos instantâneos de transações.</p>
          </div>

          <div className="space-y-4 my-6 flex-1 overflow-y-auto no-scrollbar pr-1 max-h-[220px]">
            {atividadesRecentes.map((a) => (
              <div key={a.id} className="flex gap-3 text-left">
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full ${a.cor} mt-1.5`} />
                  <div className="w-[1px] flex-1 bg-slate-100 my-1 min-h-[20px]" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-700 leading-tight">
                    {a.texto}
                  </p>
                  <span className="text-[9px] text-slate-400 font-medium block">
                    {a.tempo}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-50 pt-3 flex items-center justify-between">
            <Link
              href="/admin/reservas"
              className="text-[10px] font-bold text-[#902ad1] hover:underline uppercase tracking-wider flex items-center gap-1"
            >
              <span>Ver todas as reservas</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
