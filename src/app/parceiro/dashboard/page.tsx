/** @format */

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Car,
  Users,
  CalendarRange,
  TrendingUp,
  UserCheck,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Handshake,
  ClipboardList,
  Wallet,
  ChevronRight,
  BarChart3,
  Sparkles,
  Zap,
  MapPin,
  Clock,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { THEME_TOKENS } from "@/utils/design-system";

// ─── Types ────────────────────────────────────────────────────────────────────

type Periodo = "hoje" | "semana" | "mes";

interface Perfil {
  nome_completo: string | null;
  foto_url: string | null;
}

interface KPIData {
  reservas: number;
  reservasAnterior: number;
  receita: number;
  receitaAnterior: number;
  viaturasAtivas: number;
  motoristas: number;
}

interface ReservaItem {
  id: string;
  codigo: string;
  criado_em: string;
  valor_total: number | null;
  status: string;
  local_partida: string;
  local_destino: string;
  data_recolha: string | null;
  hora_recolha: string | null;
  perfis: {
    nome_completo: string;
  } | null;
}

interface AlertaRealTime {
  id: string;
  mensagem: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeriodoDates(periodo: Periodo): { inicio: string; fim: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (periodo === "hoje") {
    const today = fmt(now);
    return { inicio: today, fim: today };
  }
  if (periodo === "semana") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { inicio: fmt(monday), fim: fmt(sunday) };
  }
  // mes
  const inicio = new Date(now.getFullYear(), now.getMonth(), 1);
  const fim = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { inicio: fmt(inicio), fim: fmt(fim) };
}

function getPeriodoAnteriorDates(periodo: Periodo): { inicio: string; fim: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (periodo === "hoje") {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const d = fmt(yesterday);
    return { inicio: d, fim: d };
  }
  if (periodo === "semana") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const thisMonday = new Date(now);
    thisMonday.setDate(diff);
    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    return { inicio: fmt(lastMonday), fim: fmt(lastSunday) };
  }
  // mes anterior
  const inicio = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const fim = new Date(now.getFullYear(), now.getMonth(), 0);
  return { inicio: fmt(inicio), fim: fmt(fim) };
}

function formatKz(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M Kz`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K Kz`;
  return `${value.toLocaleString("pt-AO")} Kz`;
}

function calcVariacao(atual: number, anterior: number): number {
  if (anterior === 0) return atual > 0 ? 100 : 0;
  return Math.round(((atual - anterior) / anterior) * 100);
}

// ─── Quick Access Links ────────────────────────────────────────────────────────

const QUICK_ACCESS = [
  { label: "Viaturas", href: "/parceiro/viaturas", icon: Car, color: "bg-violet-50 hover:bg-violet-100/80 text-violet-600 border-violet-100/40" },
  { label: "Reservas", href: "/parceiro/reservas", icon: CalendarRange, color: "bg-blue-50 hover:bg-blue-100/80 text-blue-600 border-blue-100/40" },
  { label: "Motoristas", href: "/parceiro/motoristas", icon: Users, color: "bg-emerald-50 hover:bg-emerald-100/80 text-emerald-650 border-emerald-100/40" },
  { label: "Financeiro", href: "/parceiro/financeiro", icon: Wallet, color: "bg-amber-50 hover:bg-amber-100/80 text-amber-600 border-amber-100/40" },
  { label: "Clientes", href: "/parceiro/clientes", icon: UserCheck, color: "bg-rose-50 hover:bg-rose-100/80 text-rose-600 border-rose-100/40" },
  { label: "Solicitações", href: "/parceiro/solicitacoes", icon: ClipboardList, color: "bg-cyan-50 hover:bg-cyan-100/80 text-cyan-600 border-cyan-100/40" },
];

// ─── KPI Card with Inline Trend Sparkline ───

interface KPICardProps {
  label: string;
  value: string;
  variacao?: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  loading: boolean;
  sparkType?: "up" | "down" | "flat";
}

function KPICard({
  label,
  value,
  variacao,
  icon: Icon,
  iconBg,
  iconColor,
  loading,
  sparkType = "flat",
}: KPICardProps) {
  const showVariacao = variacao !== undefined;
  const positive = (variacao ?? 0) >= 0;
  const neutral = variacao === 0;

  return (
    <div
      className={`bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-200/50 hover:border-[#902ad1]/30 hover:shadow-[0_8px_30px_rgba(144,42,209,0.06)] hover:scale-[1.01] transition-all duration-300 group flex flex-col justify-between h-full min-h-[160px]`}
    >
      <div className="flex items-start justify-between mb-2 w-full">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-inner ${iconBg}`}
        >
          <Icon size={20} className={`${iconColor}`} />
        </div>
        {showVariacao && !loading && (
          <div
            className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all duration-300 ${
              neutral
                ? "bg-slate-50 text-slate-500 border-slate-100"
                : positive
                ? "bg-emerald-50/70 text-emerald-700 border-emerald-100/70"
                : "bg-rose-50/70 text-rose-700 border-rose-100/70"
            }`}
          >
            {neutral ? (
              <Minus size={9} />
            ) : positive ? (
              <ArrowUpRight size={9} />
            ) : (
              <ArrowDownRight size={9} />
            )}
            {Math.abs(variacao ?? 0)}%
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-6 w-24 bg-slate-100 rounded" />
          <div className="h-3 w-16 bg-slate-50 rounded" />
        </div>
      ) : (
        <div className="space-y-1 mt-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-800 tracking-tight transition-colors duration-300 group-hover:text-slate-900 mt-1.5">
            {value}
          </p>
        </div>
      )}

      {/* Mini Trend Sparkline inside each Card */}
      {!loading && (
        <div className="h-6 w-full mt-4 flex items-end opacity-40 group-hover:opacity-85 transition-opacity duration-300">
          <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
            {sparkType === "up" ? (
              <>
                <path
                  d="M0,20 Q20,16 40,18 T80,4 T100,2"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M0,20 Q20,16 40,18 T80,4 T100,2 L100,25 L0,25 Z"
                  fill="url(#spark-up-grad)"
                  opacity="0.1"
                />
              </>
            ) : sparkType === "down" ? (
              <>
                <path
                  d="M0,4 Q25,6 50,15 T75,12 T100,22"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M0,4 Q25,6 50,15 T75,12 T100,22 L100,25 L0,25 Z"
                  fill="url(#spark-down-grad)"
                  opacity="0.1"
                />
              </>
            ) : (
              <>
                <path
                  d="M0,12 L20,13 L40,11 L65,13 L80,12 L100,12"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </>
            )}
            <defs>
              <linearGradient id="spark-up-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="spark-down-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [kpi, setKpi] = useState<KPIData>({
    reservas: 0,
    reservasAnterior: 0,
    receita: 0,
    receitaAnterior: 0,
    viaturasAtivas: 0,
    motoristas: 0,
  });
  const [recentReservations, setRecentReservations] = useState<ReservaItem[]>([]);
  const [realTimeAlerts, setRealTimeAlerts] = useState<AlertaRealTime[]>([]);
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [loadingKpi, setLoadingKpi] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // ── Buscar KPIs & Recent Bookings ───────────────────────────────────────────
  const buscarKpis = useCallback(async (parceiroId: string, per: Periodo) => {
    setLoadingKpi(true);
    try {
      const { inicio, fim } = getPeriodoDates(per);
      const { inicio: inicioAnt, fim: fimAnt } = getPeriodoAnteriorDates(per);

      // Viaturas ativas
      const { count: viaturasCount } = await supabase
        .from("viaturas")
        .select("id", { count: "exact", head: true })
        .eq("parceiro_id", parceiroId)
        .eq("ativo", true);

      // Motoristas
      const { count: motoristasCount } = await supabase
        .from("motoristas")
        .select("id", { count: "exact", head: true })
        .eq("parceiro_id", parceiroId);

      // IDs de viaturas do parceiro
      const { data: viaturasData } = await supabase
        .from("viaturas")
        .select("id")
        .eq("parceiro_id", parceiroId);

      const viaturaIds = (viaturasData ?? []).map((v: { id: string }) => v.id);

      // IDs de motoristas do parceiro
      const { data: motoristasData } = await supabase
        .from("motoristas")
        .select("id")
        .eq("parceiro_id", parceiroId);

      const motoristaIds = (motoristasData ?? []).map((m: { id: string }) => m.id);

      let reservasAtuais: any[] = [];
      let reservasAnteriores: any[] = [];
      let recentData: any[] = [];

      if (viaturaIds.length > 0 || motoristaIds.length > 0) {
        const orClause = [
          viaturaIds.length > 0 ? `viatura_id.in.(${viaturaIds.join(",")})` : null,
          motoristaIds.length > 0 ? `motorista_id.in.(${motoristaIds.join(",")})` : null,
        ]
          .filter(Boolean)
          .join(",");

        // Reservas atuais
        const { data: resAtual } = await supabase
          .from("reservas")
          .select("valor_total, status, data_recolha")
          .or(orClause)
          .gte("data_recolha", inicio)
          .lte("data_recolha", fim);

        // Reservas anteriores
        const { data: resAnt } = await supabase
          .from("reservas")
          .select("valor_total, status, data_recolha")
          .or(orClause)
          .gte("data_recolha", inicioAnt)
          .lte("data_recolha", fimAnt);

        // 5 Reservas mais recentes
        const { data: recentRes } = await supabase
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
            )
          `)
          .or(orClause)
          .order("criado_em", { ascending: false })
          .limit(5);

        reservasAtuais = resAtual ?? [];
        reservasAnteriores = resAnt ?? [];
        recentData = recentRes ?? [];
      }

      const receita = reservasAtuais
        .filter((r) => r.status === "pago")
        .reduce((acc, r) => acc + (r.valor_total ?? 0), 0);

      const receitaAnt = reservasAnteriores
        .filter((r) => r.status === "pago")
        .reduce((acc, r) => acc + (r.valor_total ?? 0), 0);

      setKpi({
        reservas: reservasAtuais.length,
        reservasAnterior: reservasAnteriores.length,
        receita,
        receitaAnterior: receitaAnt,
        viaturasAtivas: viaturasCount ?? 0,
        motoristas: motoristasCount ?? 0,
      });

      // Limpeza de tipos do join de tabelas
      const formattedRecent = recentData.map((r: any) => ({
        ...r,
        perfis: Array.isArray(r.perfis) ? r.perfis[0] : r.perfis,
      })) as ReservaItem[];

      setRecentReservations(formattedRecent);
    } catch (err) {
      console.error("Erro ao buscar KPIs do parceiro:", err);
    } finally {
      setLoadingKpi(false);
    }
  }, []);

  // ── Inicialização ────────────────────────────────────────────────────────────
  const inicializar = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErro("Utilizador não autenticado.");
        return;
      }

      // Perfil
      const { data: perfilData } = await supabase
        .from("perfis")
        .select("nome_completo, foto_url")
        .eq("id", user.id)
        .single();

      setPerfil(perfilData as Perfil | null);

      // Parceiro ID
      const { data: parceiroData } = await supabase
        .from("parceiros")
        .select("id")
        .eq("usuario_id", user.id)
        .single();

      if (!parceiroData) {
        setErro("Parceiro não encontrado.");
        return;
      }

      setLoadingPerfil(false);
      await buscarKpis(parceiroData.id as string, periodo);
    } catch (err) {
      console.error("Erro ao inicializar:", err);
      setErro("Erro ao carregar dados do dashboard.");
    } finally {
      setLoadingPerfil(false);
    }
  }, [buscarKpis, periodo]);

  useEffect(() => {
    inicializar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quando período muda, re-buscar KPIs
  useEffect(() => {
    const recarregar = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: parceiroData } = await supabase
        .from("parceiros")
        .select("id")
        .eq("usuario_id", user.id)
        .single();
      if (parceiroData) {
        await buscarKpis(parceiroData.id as string, periodo);
      }
    };
    recarregar();
  }, [periodo, buscarKpis]);

  // Real-Time Postgres listener for changes on bookings assigned to this partner
  useEffect(() => {
    let channel: any;
    let active = true;

    const setupRealTime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;

      const { data: parceiroData } = await supabase
        .from("parceiros")
        .select("id")
        .eq("usuario_id", user.id)
        .single();

      if (parceiroData && active) {
        channel = supabase
          .channel("parceiro-realtime-dashboard")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "reservas" },
            (payload) => {
              buscarKpis(parceiroData.id as string, periodo);

              const msg =
                payload.eventType === "INSERT"
                  ? `Novo serviço adicionado!`
                  : `Estado de serviço atualizado: ${(payload.new as any).codigo}`;

              const novoAlerta = {
                id: String(Math.random()),
                mensagem: msg,
              };

              setRealTimeAlerts((prev) => [novoAlerta, ...prev].slice(0, 3));
              setTimeout(() => {
                if (active) {
                  setRealTimeAlerts((prev) => prev.filter((a) => a.id !== novoAlerta.id));
                }
              }, 4000);
            }
          )
          .subscribe();
      }
    };

    setupRealTime();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [periodo, buscarKpis]);

  // ── Erro ─────────────────────────────────────────────────────────────────────
  if (erro) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <Handshake size={28} className="text-rose-400" />
          </div>
          <p className="text-slate-650 font-semibold">{erro}</p>
        </div>
      </div>
    );
  }

  const primeiroNome = perfil?.nome_completo?.split(" ")[0] ?? "Parceiro";
  const variacaoReservas = calcVariacao(kpi.reservas, kpi.reservasAnterior);
  const variacaoReceita = calcVariacao(kpi.receita, kpi.receitaAnterior);

  const periodoLabel: Record<Periodo, string> = {
    hoje: "hoje",
    semana: "esta semana",
    mes: "este mês",
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "---";
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aguarda_pagamento":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
            Pendente
          </span>
        );
      case "confirmada":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 border border-blue-500/20">
            Confirmado
          </span>
        );
      case "pago":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            Pago
          </span>
        );
      case "em_andamento":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-650 border border-purple-500/25 animate-pulse">
            Viagem
          </span>
        );
      case "concluida":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-600 border border-slate-500/20">
            Concluída
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-500/5 text-slate-500">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Real-time Alert Toast Feed */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-xs pointer-events-none">
        {realTimeAlerts.map((alerta) => (
          <div
            key={alerta.id}
            className="flex items-center gap-3 p-3.5 bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-xl border border-white/10 animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
          >
            <div className="w-7 h-7 bg-[#902ad1]/20 border border-[#902ad1]/40 rounded-lg flex items-center justify-center text-[#902ad1]">
              <Zap size={13} className="animate-bounce" />
            </div>
            <div>
              <p className="text-[9px] text-purple-200 font-bold uppercase tracking-widest leading-none">
                Sincronismo
              </p>
              <p className="text-[11px] font-semibold text-slate-100 mt-1">{alerta.mensagem}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Header & Period Selector ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#902ad1]/10 flex items-center justify-center shrink-0 shadow-[0_2px_10px_rgba(144,42,209,0.15)] border border-[#902ad1]/10">
            {loadingPerfil ? (
              <Loader2 size={20} className="animate-spin text-[#902ad1]" />
            ) : perfil?.foto_url ? (
              <Image
                src={perfil.foto_url}
                alt="Perfil"
                width={56}
                height={56}
                className="object-cover w-full h-full"
              />
            ) : (
              <Handshake size={24} className="text-[#902ad1]" />
            )}
          </div>
          <div>
            {loadingPerfil ? (
              <div className="space-y-2">
                <div className="h-6 w-44 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-slate-800 leading-tight">
                  Olá, {primeiroNome}! 👋
                </h1>
                <p className="text-[13px] text-slate-400 font-semibold mt-0.5">
                  Bem-vindo ao seu painel de gestão do portal do parceiro.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Seletor de Período */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-xl p-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          {(["hoje", "semana", "mes"] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150 cursor-pointer ${
                periodo === p
                  ? "bg-[#902ad1] text-white shadow-[0_2px_8px_rgba(144,42,209,0.3)]"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {p === "hoje" ? "Hoje" : p === "semana" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Grid (12-Column Responsive Layout) ─────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Reservas */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <KPICard
            label={`Reservas ${periodoLabel[periodo]}`}
            value={loadingKpi ? "—" : String(kpi.reservas)}
            variacao={variacaoReservas}
            icon={CalendarRange}
            iconBg="bg-violet-50 text-violet-600 border border-violet-100/30"
            iconColor="text-violet-600"
            loading={loadingKpi}
            sparkType={variacaoReservas > 0 ? "up" : variacaoReservas < 0 ? "down" : "flat"}
          />
        </div>

        {/* Receita */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <KPICard
            label={`Receita ${periodoLabel[periodo]}`}
            value={loadingKpi ? "—" : formatKz(kpi.receita)}
            variacao={variacaoReceita}
            icon={BarChart3}
            iconBg="bg-emerald-50 text-emerald-600 border border-emerald-100/30"
            iconColor="text-emerald-650"
            loading={loadingKpi}
            sparkType={variacaoReceita > 0 ? "up" : variacaoReceita < 0 ? "down" : "flat"}
          />
        </div>

        {/* Viaturas */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <KPICard
            label="Viaturas Ativas"
            value={loadingKpi ? "—" : String(kpi.viaturasAtivas)}
            icon={Car}
            iconBg="bg-blue-50 text-blue-600 border border-blue-100/30"
            iconColor="text-blue-600"
            loading={loadingKpi}
            sparkType="flat"
          />
        </div>

        {/* Motoristas */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <KPICard
            label="Motoristas"
            value={loadingKpi ? "—" : String(kpi.motoristas)}
            icon={Users}
            iconBg="bg-amber-50 text-amber-600 border border-amber-100/30"
            iconColor="text-amber-600"
            loading={loadingKpi}
            sparkType="flat"
          />
        </div>

      </div>

      {/* ── Acesso Rápido (Dynamic Hover Cards) ────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#902ad1]" />
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Acesso Rápido
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {QUICK_ACCESS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group bg-white rounded-2xl p-5 flex flex-col items-center justify-center gap-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-200/50 hover:border-[#902ad1]/20 hover:shadow-[0_8px_24px_rgba(144,42,209,0.05)] hover:scale-[1.02] transition-all duration-300 text-center"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border ${item.color} group-hover:scale-105`}
                >
                  <Icon size={20} className="transition-transform duration-300 group-hover:scale-105" />
                </div>
                <span className="text-[12px] font-bold text-slate-700 group-hover:text-[#902ad1] transition-colors leading-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Banner de Boas-Vindas & Ações ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#902ad1] via-[#7b22b8] to-[#5c1a8a] p-8 shadow-[0_8px_30px_rgba(144,42,209,0.12)] border border-[#902ad1]/20">
        {/* Efeitos visuais */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5 blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-white/5 blur-xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-white/80" />
              <p className="text-[11px] font-bold text-white/80 uppercase tracking-widest">
                Portal do Parceiro
              </p>
            </div>
            <h3 className="text-xl font-bold text-white leading-tight">
              Gerencie o seu negócio com eficiência
            </h3>
            <p className="text-[13px] text-white/75 font-medium max-w-xl leading-relaxed">
              Acompanhe as suas reservas, viaturas, motoristas e receita em tempo real num único lugar de forma centralizada e sem atritos.
            </p>
          </div>
          <Link
            href="/parceiro/reservas"
            className="inline-flex items-center gap-1.5 bg-white text-[#902ad1] text-xs font-bold px-6 py-3.5 rounded-xl hover:bg-white/95 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.05)] shrink-0 active:scale-95 duration-200"
          >
            Ver Reservas
            <ChevronRight size={13} strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      {/* ── Bottom Section: Recent Bookings assigned to Partner ── */}
      <div className={`bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-200/50`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
              Últimas Reservas Atribuídas
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Lista de serviços recentes delegados para a sua frota.
            </p>
          </div>
          <Link
            href="/parceiro/reservas"
            className="px-4 py-2 bg-slate-50 border border-slate-150 hover:bg-slate-100 hover:border-slate-200 rounded-[10px] text-[11px] font-bold text-slate-700 transition-all flex items-center gap-1.5 w-fit"
          >
            <CalendarRange size={13} />
            Gerir Serviços
          </Link>
        </div>

        {loadingKpi ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 bg-slate-50 rounded-xl border border-slate-100" />
            ))}
          </div>
        ) : recentReservations.length > 0 ? (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Código
                  </th>
                  <th className="pb-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Cliente
                  </th>
                  <th className="pb-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Viagem
                  </th>
                  <th className="pb-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Valor
                  </th>
                  <th className="pb-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentReservations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3.5 pr-4 text-xs font-mono font-bold text-[#902ad1]">
                      {r.codigo}
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="text-xs font-semibold text-slate-750">
                        {r.perfis?.nome_completo || "Utilizador WiTransfer"}
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium block">
                        Recolha: {formatDate(r.data_recolha)} às {r.hora_recolha || "00:00"}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 max-w-[200px]">
                      <div className="text-xs font-medium text-slate-650 truncate flex items-center gap-1">
                        <MapPin size={10} className="text-[#902ad1] shrink-0" />
                        <span className="truncate">{r.local_partida}</span>
                        <ArrowRight size={8} className="text-slate-400" />
                        <span className="truncate">{r.local_destino}</span>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-xs font-mono font-semibold text-slate-800">
                      {r.valor_total ? formatKz(r.valor_total) : "0 Kz"}
                    </td>
                    <td className="py-3.5 text-center">{getStatusBadge(r.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs font-semibold">
            Nenhuma reserva atribuída recentemente.
          </div>
        )}
      </div>

    </div>
  );
}
