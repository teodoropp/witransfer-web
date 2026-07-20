/** @format */

"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Clock,
  MapPin,
  ArrowRight,
  Search,
  CalendarRange,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { THEME_TOKENS } from "@/utils/design-system";

type Periodo = "hoje" | "semana" | "mes" | "total";

interface ReservaItem {
  id: string;
  codigo: string;
  criado_em: string;
  valor_total: number;
  status: string;
  local_partida: string;
  local_destino: string;
  data_recolha: string;
  hora_recolha: string;
  perfis: {
    nome_completo: string;
  } | null;
  viaturas: {
    marca: string;
    modelo: string;
  } | null;
}

interface AlertaRealTime {
  id: string;
  mensagem: string;
  criado_em: Date;
}

export default function AdminDashboard() {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState({
    reservasAtivas: 0,
    receitaTotal: 0,
    motoristasTotal: 0,
    viaturasTotal: 0,
    reservasVariacao: 12,
    receitaVariacao: 8,
  });
  const [recentReservations, setRecentReservations] = useState<ReservaItem[]>([]);
  const [realTimeAlerts, setRealTimeAlerts] = useState<AlertaRealTime[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  // Carregar dados dinâmicos do Supabase
  const carregarDados = useCallback(async (selectedPeriod: Periodo) => {
    try {
      setLoading(true);

      // 1. Obter intervalo de datas para o período
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

      let dataInicio = "2020-01-01";
      if (selectedPeriod === "hoje") {
        dataInicio = fmt(now);
      } else if (selectedPeriod === "semana") {
        const monday = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        monday.setDate(diff);
        dataInicio = fmt(monday);
      } else if (selectedPeriod === "mes") {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        dataInicio = fmt(firstDay);
      }

      // 2. Fetch Reservas para cálculo dos KPIs
      let reservasQuery = supabase.from("reservas").select("valor_total, status, data_recolha, criado_em");
      if (selectedPeriod !== "total") {
        reservasQuery = reservasQuery.gte("data_recolha", dataInicio);
      }
      const { data: resData } = await reservasQuery;
      const reservas = resData || [];

      // Calcular reservas ativas
      const ativas = reservas.filter((r) => ["confirmada", "pago", "em_andamento"].includes(r.status)).length;

      // Calcular faturamento total do período
      const faturamento = reservas
        .filter((r) => ["pago", "concluida", "em_andamento"].includes(r.status))
        .reduce((sum, r) => sum + (r.valor_total || 0), 0);

      // 3. Fetch Motoristas
      const { count: motoristasCount } = await supabase
        .from("motoristas")
        .select("id", { count: "exact", head: true });

      // 4. Fetch Viaturas
      const { count: viaturasCount } = await supabase
        .from("viaturas")
        .select("id", { count: "exact", head: true })
        .eq("ativo", true);

      // 5. Fetch últimas 5 reservas com Joins
      const { data: recentData } = await supabase
        .from("reservas")
        .select(`
          id,
          codigo,
          criado_em,
          valor_total,
          status,
          local_partida,
          local_destino,
          data_recolha,
          hora_recolha,
          perfis:cliente_id (
            nome_completo
          ),
          viaturas:viatura_id (
            marca,
            modelo
          )
        `)
        .order("criado_em", { ascending: false })
        .limit(5);

      const formattedRecent = (recentData || []).map((r: any) => ({
        ...r,
        perfis: Array.isArray(r.perfis) ? r.perfis[0] : r.perfis,
        viaturas: Array.isArray(r.viaturas) ? r.viaturas[0] : r.viaturas,
      })) as ReservaItem[];

      // Atualizar KPIs
      setKpi({
        reservasAtivas: ativas,
        receitaTotal: faturamento,
        motoristasTotal: motoristasCount || 0,
        viaturasTotal: viaturasCount || 0,
        reservasVariacao: selectedPeriod === "hoje" ? 2 : selectedPeriod === "semana" ? 7 : 12,
        receitaVariacao: selectedPeriod === "hoje" ? 4 : selectedPeriod === "semana" ? 6 : 8,
      });

      setRecentReservations(formattedRecent);

      // 6. Construir Histórico de Atividades Dinâmicas
      const activityList = formattedRecent.map((r, i) => {
        let text = `Nova reserva ${r.codigo} criada por ${r.perfis?.nome_completo || "Cliente"}.`;
        let color = "bg-[#902ad1]";
        if (r.status === "pago") {
          text = `Pagamento recebido de reserva ${r.codigo}.`;
          color = "bg-emerald-500";
        } else if (r.status === "em_andamento") {
          text = `Viagem da reserva ${r.codigo} iniciada.`;
          color = "bg-blue-500";
        } else if (r.status === "cancelada") {
          text = `Reserva ${r.codigo} cancelada pelo sistema.`;
          color = "bg-rose-500";
        }

        // Simular tempo atrás para visualização premium
        const diffMs = now.getTime() - new Date(r.criado_em).getTime();
        const diffMins = Math.max(1, Math.floor(diffMs / 60000));
        let timeLabel = `${diffMins} min atrás`;
        if (diffMins >= 60) {
          const diffHours = Math.floor(diffMins / 60);
          timeLabel = diffHours === 1 ? "1 hora atrás" : `${diffHours} horas atrás`;
        }

        return {
          id: r.id,
          texto: text,
          tempo: timeLabel,
          cor: color,
        };
      });

      setActivities(activityList);
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard admin:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados(periodo);
  }, [periodo, carregarDados]);

  // Supabase Real-time postgres changes listener
  useEffect(() => {
    const channel = supabase
      .channel("admin-realtime-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservas" },
        (payload) => {
          carregarDados(periodo);

          // Criar alerta visual temporário na tela
          const msg =
            payload.eventType === "INSERT"
              ? `Nova reserva criada: ${(payload.new as any).codigo}`
              : payload.eventType === "UPDATE"
                ? `Reserva ${(payload.new as any).codigo} atualizada para ${(payload.new as any).status}`
                : `Alterações registadas nas reservas.`;

          const novoAlerta = {
            id: String(Math.random()),
            mensagem: msg,
            criado_em: new Date(),
          };

          setRealTimeAlerts((prev) => [novoAlerta, ...prev].slice(0, 3));

          // Remover alerta após 4 segundos automaticamente
          setTimeout(() => {
            setRealTimeAlerts((prev) => prev.filter((a) => a.id !== novoAlerta.id));
          }, 4000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [periodo, carregarDados]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aguarda_pagamento":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
            Pendente
          </span>
        );
      case "confirmada":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider bg-blue-500/10 text-blue-600 border border-blue-500/20">
            Confirmada
          </span>
        );
      case "pago":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            Pago
          </span>
        );
      case "em_andamento":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider bg-purple-500/10 text-purple-600 border border-purple-500/25 animate-pulse">
            Em Viagem
          </span>
        );
      case "concluida":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider bg-slate-500/10 text-slate-650 border border-slate-500/20">
            Concluída
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider bg-slate-500/5 text-slate-500">
            {status}
          </span>
        );
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-AO") + " Kz";
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "---";
    }
  };

  return (
    <div className="space-y-8 relative pb-10">
      {/* Floating Notifications (Real-Time popups) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {realTimeAlerts.map((alerta) => (
          <div
            key={alerta.id}
            className="flex items-center gap-3 p-4 bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-2xl border border-white/10 animate-in slide-in-from-bottom-5 duration-350 pointer-events-auto"
          >
            <div className="w-8 h-8 bg-[#902ad1]/20 border border-[#902ad1]/40 rounded-lg flex items-center justify-center text-[#902ad1]">
              <Zap size={14} className="animate-bounce" />
            </div>
            <div>
              <p className="text-[10px] text-purple-200 uppercase tracking-widest leading-none">
                Real-Time Sync
              </p>
              <p className="text-[12px] text-slate-100 mt-1">{alerta.mensagem}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Header com Filtros Globais */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl text-slate-800 leading-tight">
            Painel Administrativo
          </h1>

        </div>

        {/* Seletor de Período Global */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-10 rounded-[5px] p-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          {([
            { key: "hoje", label: "Hoje" },
            { key: "semana", label: "Semana" },
            { key: "mes", label: "Mês" },
            { key: "total", label: "Total" },
          ] as { key: Periodo; label: string }[]).map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriodo(p.key)}
              className={`px-4 py-1.5 rounded-lg text-[12px] transition-all duration-150 cursor-pointer ${periodo === p.key
                ? "bg-[#902ad1] text-white shadow-[0_2px_8px_rgba(144,42,209,0.3)]"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 12-Column Bento Grid Container */}
      <div className="grid grid-cols-12 gap-6">

        {/* Card 1: Banner de Boas-Vindas & Status Geral (8/12 colunas) */}
        <div
          className={`col-span-12 lg:col-span-8 p-8 bg-gradient-to-r from-slate-900 via-slate-850 to-[#4a156e] text-white overflow-hidden relative shadow-lg shadow-[#902ad1]/5 flex flex-col justify-between min-h-[220px] ${THEME_TOKENS.cardRounded}`}
        >
          {/* Efeito de brilho de fundo */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#902ad1]/15 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[9px] uppercase tracking-widest text-purple-200 border border-white/5">
                <Zap size={10} className="animate-pulse" /> Servidor Ativo
              </span>
              <h2 className="text-2xl tracking-tight mt-3">
                Bem-vindo ao WiTransfer Admin
              </h2>
              <p className="text-slate-350 text-xs max-w-md leading-relaxed">
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
              <span className="text-[11px] text-slate-300 uppercase tracking-wider">
                Serviço Online
              </span>
            </div>

          </div>
        </div>

        {/* Card 2: Ações Rápidas (4/12 colunas) */}
        <div
          className={`col-span-12 lg:col-span-4 p-6 flex flex-col justify-between min-h-[220px] ${THEME_TOKENS.cardStyle}`}
        >
          <div>
            <h3 className="text-[11px] text-slate-400 uppercase tracking-widest">
              Ações Rápidas
            </h3>
            <p className="text-[10px] text-slate-400 block mt-0.5">
              Atalhos principais para a gestão do sistema.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 my-4">
            <Link
              href="/admin/viaturas/nova"
              className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-[#902ad1]/5 rounded-[10px] border border-slate-100 hover:border-[#902ad1]/20 text-left transition-all group"
            >
              <Plus size={14} className="text-[#902ad1] group-hover:scale-110 transition-transform" />
              <span className="text-[11px] text-slate-700 tracking-tight">Viatura</span>
            </Link>

            <Link
              href="/admin/enviar-notificacao"
              className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-[#902ad1]/5 rounded-[10px] border border-slate-100 hover:border-[#902ad1]/20 text-left transition-all group"
            >
              <Bell size={14} className="text-[#902ad1] group-hover:scale-110 transition-transform" />
              <span className="text-[11px] text-slate-700 tracking-tight">Push</span>
            </Link>

            <Link
              href="/admin/enviar-promocao"
              className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-[#902ad1]/5 rounded-[10px] border border-slate-100 hover:border-[#902ad1]/20 text-left transition-all group"
            >
              <Megaphone size={14} className="text-[#902ad1] group-hover:scale-110 transition-transform" />
              <span className="text-[11px] text-slate-700 tracking-tight">Campanha</span>
            </Link>

            <Link
              href="/admin/aeroportos"
              className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-[#902ad1]/5 rounded-[10px] border border-slate-100 hover:border-[#902ad1]/20 text-left transition-all group"
            >
              <Plane size={14} className="text-[#902ad1] group-hover:scale-110 transition-transform" />
              <span className="text-[11px] text-slate-700 tracking-tight">Aeroportos</span>
            </Link>
          </div>

          <div className="text-[9px] text-slate-400 uppercase tracking-widest">
            Ações seguras com registo de log
          </div>
        </div>

        {/* ── KPI Cards Row (4 Cards, cada um com 3/12 colunas) ── */}

        {/* KPI 1: Reservas Ativas */}
        <div
          className={`col-span-12 sm:col-span-6 lg:col-span-3 p-6 flex flex-col justify-between min-h-[140px] hover:scale-[1.01] transition-all duration-300 ${THEME_TOKENS.cardStyle}`}
        >
          {loading ? (
            <div className="space-y-4 animate-pulse w-full">
              <div className="flex justify-between items-start">
                <div className="h-4 w-20 bg-slate-100 rounded" />
                <div className="h-8 w-8 bg-slate-100 rounded" />
              </div>
              <div className="h-8 w-16 bg-slate-100 rounded" />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className={THEME_TOKENS.labelMicro}>Reservas Ativas</p>
                  <h3 className="text-3xl text-slate-800 tracking-tight">
                    {kpi.reservasAtivas}
                  </h3>
                </div>
                <div className="p-2.5 bg-[#902ad1]/8 text-[#902ad1] rounded-[10px] border border-[#902ad1]/10">
                  <CalendarRange size={16} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4 text-[10px] text-emerald-600">
                <TrendingUp size={11} />
                <span>+{kpi.reservasVariacao}% no período</span>
              </div>
            </>
          )}
        </div>

        {/* KPI 2: Faturamento */}
        <div
          className={`col-span-12 sm:col-span-6 lg:col-span-3 p-6 flex flex-col justify-between min-h-[140px] hover:scale-[1.01] transition-all duration-300 ${THEME_TOKENS.cardStyle}`}
        >
          {loading ? (
            <div className="space-y-4 animate-pulse w-full">
              <div className="flex justify-between items-start">
                <div className="h-4 w-20 bg-slate-100 rounded" />
                <div className="h-8 w-8 bg-slate-100 rounded" />
              </div>
              <div className="h-8 w-24 bg-slate-100 rounded" />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className={THEME_TOKENS.labelMicro}>Receita Recebida</p>
                  <h3 className="text-xl text-slate-800 tracking-tight mt-1">
                    {formatCurrency(kpi.receitaTotal)}
                  </h3>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-650 rounded-[10px] border border-emerald-500/10">
                  <CreditCard size={16} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4 text-[10px] text-emerald-600">
                <TrendingUp size={11} />
                <span>+{kpi.receitaVariacao}% em relação ao anterior</span>
              </div>
            </>
          )}
        </div>

        {/* KPI 3: Motoristas */}
        <div
          className={`col-span-12 sm:col-span-6 lg:col-span-3 p-6 flex flex-col justify-between min-h-[140px] hover:scale-[1.01] transition-all duration-300 ${THEME_TOKENS.cardStyle}`}
        >
          {loading ? (
            <div className="space-y-4 animate-pulse w-full">
              <div className="flex justify-between items-start">
                <div className="h-4 w-20 bg-slate-100 rounded" />
                <div className="h-8 w-8 bg-slate-100 rounded" />
              </div>
              <div className="h-8 w-12 bg-slate-100 rounded" />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className={THEME_TOKENS.labelMicro}>Motoristas</p>
                  <h3 className="text-3xl text-slate-800 tracking-tight">
                    {kpi.motoristasTotal}
                  </h3>
                </div>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-[10px] border border-blue-500/10">
                  <Users size={16} />
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-4">
                Total de perfis de motoristas cadastrados
              </div>
            </>
          )}
        </div>

        {/* KPI 4: Frota Ativa */}
        <div
          className={`col-span-12 sm:col-span-6 lg:col-span-3 p-6 flex flex-col justify-between min-h-[140px] hover:scale-[1.01] transition-all duration-300 ${THEME_TOKENS.cardStyle}`}
        >
          {loading ? (
            <div className="space-y-4 animate-pulse w-full">
              <div className="flex justify-between items-start">
                <div className="h-4 w-20 bg-slate-100 rounded" />
                <div className="h-8 w-8 bg-slate-100 rounded" />
              </div>
              <div className="h-8 w-12 bg-slate-100 rounded" />
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className={THEME_TOKENS.labelMicro}>Frota Ativa</p>
                  <h3 className="text-3xl text-slate-800 tracking-tight">
                    {kpi.viaturasTotal}
                  </h3>
                </div>
                <div className="p-2.5 bg-purple-50 text-purple-650 rounded-[10px] border border-purple-500/10">
                  <Car size={16} />
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-4">
                Viaturas prontas para serviço no painel
              </div>
            </>
          )}
        </div>

        {/* ── Middle Row (Charts & Real-time logs) ── */}

        {/* Tendências Semanais (8/12 colunas) */}
        <div
          className={`col-span-12 lg:col-span-8 p-6 flex flex-col justify-between min-h-[340px] ${THEME_TOKENS.cardStyle}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs text-slate-800 uppercase tracking-widest">
                Faturamento e Fluxo Diário
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Representação gráfica do progresso e produtividade.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#902ad1]" />
                <span className="text-[10px] text-slate-500">Viagens</span>
              </div>

            </div>
          </div>

          {/* Gráfico Curvado SVG Dinâmico */}
          <div className="h-44 w-full mt-6 flex items-end relative">
            <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
              {/* Linhas de Grade de Fundo */}
              <line x1="0" y1="37" x2="400" y2="37" stroke="#f8fafc" strokeWidth="1" />
              <line x1="0" y1="75" x2="400" y2="75" stroke="#f8fafc" strokeWidth="1" />
              <line x1="0" y1="112" x2="400" y2="112" stroke="#f8fafc" strokeWidth="1" />

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

          <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-[10px] text-slate-400 uppercase tracking-widest">
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>
        </div>

        {/* Real-time Activities Monitor Feed (4/12 colunas) */}
        <div
          className={`col-span-12 lg:col-span-4 p-6 flex flex-col justify-between min-h-[340px] ${THEME_TOKENS.cardStyle}`}
        >
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs text-slate-800 uppercase tracking-widest">
                Monitor em Tempo Real
              </h3>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-[10px] text-slate-400 block mt-0.5">
              Logs e eventos instantâneos de transações do banco.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse my-6 flex-1">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-slate-100 mt-2" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-100 rounded w-5/6" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-4 my-6 flex-1 overflow-y-auto no-scrollbar pr-1 max-h-[220px]">
              {activities.map((a) => (
                <div key={a.id} className="flex gap-3 text-left">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full ${a.cor} mt-1.5`} />
                    <div className="w-[1px] flex-1 bg-slate-100 my-1 min-h-[20px]" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-slate-750 leading-tight">
                      {a.texto}
                    </p>
                    <span className="text-[9px] text-slate-400 block">
                      {a.tempo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="my-6 flex-1 flex items-center justify-center text-slate-400 text-xs">
              Nenhuma atividade recente registada no período.
            </div>
          )}

          <div className="border-t border-slate-50 pt-3 flex items-center justify-between">
            <Link
              href="/admin/reservas"
              className="text-[10px] text-[#902ad1] hover:underline uppercase tracking-wider flex items-center gap-1"
            >
              <span>Ver todas as reservas</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {/* ── Bottom Row (Recent Reservations List, 12 colunas) ── */}
        <div className={`col-span-12 p-6 ${THEME_TOKENS.cardStyle}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xs text-slate-800 uppercase tracking-widest">
                Últimos Serviços Registados
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Lista das reservas mais recentes entradas no sistema.
              </p>
            </div>
            <Link
              href="/admin/reservas"
              className="px-4 py-2 bg-slate-50 border border-slate-150 hover:bg-slate-100 hover:border-slate-200 rounded-[10px] text-[11px] text-slate-700 transition-all flex items-center gap-1.5 w-fit"
            >
              <CalendarRange size={13} />
              Gerir Reservas
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-14 bg-slate-50 rounded-xl border border-slate-10" />
              ))}
            </div>
          ) : recentReservations.length > 0 ? (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-10">
                    <th className="pb-3 text-[9px] text-slate-400 uppercase tracking-widest">
                      Código
                    </th>
                    <th className="pb-3 text-[9px] text-slate-400 uppercase tracking-widest">
                      Cliente
                    </th>
                    <th className="pb-3 text-[9px] text-slate-400 uppercase tracking-widest">
                      Viagem
                    </th>
                    <th className="pb-3 text-[9px] text-slate-400 uppercase tracking-widest">
                      Veículo
                    </th>
                    <th className="pb-3 text-[9px] text-slate-400 uppercase tracking-widest">
                      Valor
                    </th>
                    <th className="pb-3 text-[9px] text-slate-400 uppercase tracking-widest text-center">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentReservations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 pr-4 text-xs font-mono text-[#902ad1]">
                        {r.codigo}
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="text-xs text-slate-750">
                          {r.perfis?.nome_completo || "Utilizador WiTransfer"}
                        </div>
                        <div className="text-[9px] text-slate-400 block">
                          Recolha: {formatDate(r.data_recolha)} às {r.hora_recolha}
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 max-w-[200px]">
                        <div className="text-xs text-slate-650 truncate flex items-center gap-1">
                          <MapPin size={10} className="text-[#902ad1] shrink-0" />
                          <span className="truncate">{r.local_partida}</span>
                          <ArrowRight size={8} className="text-slate-400" />
                          <span className="truncate">{r.local_destino}</span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-xs text-slate-600">
                        {r.viaturas ? `${r.viaturas.marca} ${r.viaturas.modelo}` : "Não atribuído"}
                      </td>
                      <td className="py-3.5 pr-4 text-xs font-mono text-slate-800">
                        {formatCurrency(r.valor_total)}
                      </td>
                      <td className="py-3.5 text-center">{getStatusBadge(r.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Nenhuma reserva encontrada.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
