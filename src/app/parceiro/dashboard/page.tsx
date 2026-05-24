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
} from "lucide-react";
import { supabase } from "@/lib/supabase";

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

interface Reserva {
  valor_total: number | null;
  status: string;
  data_recolha: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeriodoDates(periodo: Periodo): { inicio: string; fim: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (periodo === "hoje") {
    const today = fmt(now);
    return { inicio: today, fim: today };
  }
  if (periodo === "semana") {
    const day = now.getDay(); // 0=Sun
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
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

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
  { label: "Viaturas", href: "/parceiro/viaturas", icon: Car, color: "bg-violet-100 text-violet-600" },
  { label: "Reservas", href: "/parceiro/reservas", icon: CalendarRange, color: "bg-blue-100 text-blue-600" },
  { label: "Motoristas", href: "/parceiro/motoristas", icon: Users, color: "bg-emerald-100 text-emerald-600" },
  { label: "Financeiro", href: "/parceiro/financeiro", icon: Wallet, color: "bg-amber-100 text-amber-600" },
  { label: "Clientes", href: "/parceiro/clientes", icon: UserCheck, color: "bg-rose-100 text-rose-600" },
  { label: "Solicitações", href: "/parceiro/solicitacoes", icon: ClipboardList, color: "bg-cyan-100 text-cyan-600" },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: string;
  variacao?: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  loading: boolean;
}

function KPICard({ label, value, variacao, icon: Icon, iconBg, iconColor, loading }: KPICardProps) {
  const showVariacao = variacao !== undefined;
  const positive = (variacao ?? 0) >= 0;
  const neutral = variacao === 0;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-200/50 hover:border-[#902ad1]/30 hover:shadow-[0_8px_30px_rgba(144,42,209,0.08)] hover:-translate-y-0.5 transition-all duration-300 group flex flex-col justify-between h-full min-h-[148px]">
      <div className="flex items-start justify-between mb-4 w-full">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-inner ${iconBg}`}>
          <Icon size={22} className={`${iconColor} transition-transform duration-300 group-hover:rotate-3`} />
        </div>
        {showVariacao && !loading && (
          <div
            className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-all duration-300 ${
              neutral
                ? "bg-slate-50 text-slate-500 border-slate-100"
                : positive
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-rose-50 text-rose-700 border-rose-100"
            }`}
          >
            {neutral ? (
              <Minus size={10} />
            ) : positive ? (
              <ArrowUpRight size={10} />
            ) : (
              <ArrowDownRight size={10} />
            )}
            {Math.abs(variacao ?? 0)}%
          </div>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-8 w-32 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-4 w-20 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-2xl font-bold text-slate-800 tracking-tight transition-colors duration-300 group-hover:text-slate-900">{value}</p>
          <p className="text-[12px] font-medium text-slate-400">{label}</p>
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
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [loadingKpi, setLoadingKpi] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // ── Buscar KPIs ─────────────────────────────────────────────────────────────
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

      // Reservas período atual
      let reservasAtuais: Reserva[] = [];
      let reservasAnteriores: Reserva[] = [];

      if (viaturaIds.length > 0 || motoristaIds.length > 0) {
        const orClause = [
          viaturaIds.length > 0 ? `viatura_id.in.(${viaturaIds.join(",")})` : null,
          motoristaIds.length > 0 ? `motorista_id.in.(${motoristaIds.join(",")})` : null,
        ]
          .filter(Boolean)
          .join(",");

        const { data: resAtual } = await supabase
          .from("reservas")
          .select("valor_total, status, data_recolha")
          .or(orClause)
          .gte("data_recolha", inicio)
          .lte("data_recolha", fim);

        const { data: resAnt } = await supabase
          .from("reservas")
          .select("valor_total, status, data_recolha")
          .or(orClause)
          .gte("data_recolha", inicioAnt)
          .lte("data_recolha", fimAnt);

        reservasAtuais = (resAtual as Reserva[]) ?? [];
        reservasAnteriores = (resAnt as Reserva[]) ?? [];
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
    } catch (err) {
      console.error("Erro ao buscar KPIs:", err);
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
      console.error("Erro ao inicializar dashboard:", err);
      setErro("Erro ao carregar dados.");
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

  // ── Erro ─────────────────────────────────────────────────────────────────────
  if (erro) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <Handshake size={28} className="text-rose-400" />
          </div>
          <p className="text-slate-600 font-semibold">{erro}</p>
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

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#902ad1]/10 flex items-center justify-center shrink-0 shadow-[0_2px_10px_rgba(144,42,209,0.15)]">
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
                <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-4 w-32 bg-slate-100 rounded-lg animate-pulse" />
              </div>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-slate-800 leading-tight">
                  Olá, {primeiroNome}! 👋
                </h1>
                <p className="text-[13px] text-slate-400 font-semibold mt-0.5">
                  Bem-vindo ao seu painel de gestão.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Seletor de período */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-xl p-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          {(["hoje", "semana", "mes"] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150 ${
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

      {/* ── KPI Grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label={`Reservas ${periodoLabel[periodo]}`}
          value={loadingKpi ? "—" : String(kpi.reservas)}
          variacao={variacaoReservas}
          icon={CalendarRange}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          loading={loadingKpi}
        />
        <KPICard
          label={`Receita ${periodoLabel[periodo]}`}
          value={loadingKpi ? "—" : formatKz(kpi.receita)}
          variacao={variacaoReceita}
          icon={BarChart3}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          loading={loadingKpi}
        />
        <KPICard
          label="Viaturas Ativas"
          value={loadingKpi ? "—" : String(kpi.viaturasAtivas)}
          icon={Car}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          loading={loadingKpi}
        />
        <KPICard
          label="Motoristas"
          value={loadingKpi ? "—" : String(kpi.motoristas)}
          icon={Users}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          loading={loadingKpi}
        />
      </div>

      {/* ── Acesso Rápido ───────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#902ad1]" />
          <h2 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">
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
                className="group bg-white rounded-2xl p-5 flex flex-col items-center justify-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-200/50 hover:border-[#902ad1]/30 hover:shadow-[0_8px_24px_rgba(144,42,209,0.06)] hover:-translate-y-0.5 transition-all duration-300 text-center"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${item.color} group-hover:scale-105 group-hover:shadow-inner`}
                >
                  <Icon size={24} className="transition-transform duration-300 group-hover:scale-105" />
                </div>
                <span className="text-[13px] font-bold text-slate-700 group-hover:text-[#902ad1] transition-colors leading-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Card de boas-vindas ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#902ad1] via-[#7b22b8] to-[#5c1a8a] p-8 shadow-[0_8px_30px_rgba(144,42,209,0.15)] border border-[#902ad1]/20">
        {/* Decoração */}
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
            <p className="text-[13px] text-white/70 font-medium max-w-xl leading-relaxed">
              Acompanhe as suas reservas, viaturas, motoristas e receita em tempo real num único lugar.
            </p>
          </div>
          <Link
            href="/parceiro/reservas"
            className="inline-flex items-center gap-2 bg-white text-[#902ad1] text-xs font-bold px-6 py-3.5 rounded-xl hover:bg-white/95 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)] shrink-0 active:scale-95 duration-200"
          >
            Ver Reservas
            <ChevronRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}
