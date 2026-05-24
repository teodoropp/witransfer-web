/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  Calendar,
  RefreshCw,
  XCircle,
  DollarSign,
  Car,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Reserva {
  id: string;
  codigo: string | null;
  status: string;
  criado_em: string;
  valor_total: number;
  local_partida: string | null;
  local_destino: string | null;
  cliente_nome: string | null;
}

type TabType = "geral" | "reservas";

const STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  confirmada: {
    label: "Confirmada",
    className: "bg-blue-50 text-blue-600 border-blue-200",
  },
  em_andamento: {
    label: "Em Andamento",
    className: "bg-amber-50 text-amber-600 border-amber-200",
  },
  concluida: {
    label: "Concluída",
    className: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
};

const ganho = (valor: number) => valor / 1.1;

const formatCurrency = (val: number) =>
  val.toLocaleString("pt-AO", { maximumFractionDigits: 0 }) + " Kz";

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

export default function ParceiroFinanceiroPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<TabType>("geral");
  const [dataSelecionada, setDataSelecionada] = useState("");

  const carregarDados = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Obter parceiro autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: parceiroData } = await supabase
        .from("parceiros")
        .select("id")
        .eq("usuario_id", user.id)
        .single();

      if (!parceiroData) return;

      // Buscar viaturas do parceiro
      const { data: viaturasData } = await supabase
        .from("viaturas")
        .select("id")
        .eq("parceiro_id", parceiroData.id);

      const viaturasIds = viaturasData?.map((v) => v.id) || [];

      if (viaturasIds.length === 0) {
        setReservas([]);
        return;
      }

      // Buscar reservas faturáveis
      let query = supabase
        .from("reservas")
        .select(
          "id, codigo, status, criado_em, valor_total, local_partida, local_destino, perfis!reservas_cliente_id_fkey(nome_completo)"
        )
        .in("viatura_id", viaturasIds)
        .in("status", ["confirmada", "em_andamento", "concluida"])
        .order("criado_em", { ascending: false });

      if (dataSelecionada) {
        query = query
          .gte("criado_em", `${dataSelecionada}T00:00:00`)
          .lte("criado_em", `${dataSelecionada}T23:59:59`);
      }

      const { data: reservasData, error: rError } = await query;
      if (rError) throw rError;

      const reservasFormatted: Reserva[] = (reservasData || []).map(
        (r: any) => ({
          id: r.id,
          codigo: r.codigo,
          status: r.status,
          criado_em: r.criado_em,
          valor_total: Number(r.valor_total) || 0,
          local_partida: r.local_partida,
          local_destino: r.local_destino,
          cliente_nome: Array.isArray(r.perfis)
            ? r.perfis[0]?.nome_completo
            : r.perfis?.nome_completo || null,
        })
      );

      setReservas(reservasFormatted);
    } catch (err: any) {
      console.error("Erro ao carregar financeiro:", err);
      setError("Não foi possível carregar os dados financeiros.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dataSelecionada]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // ── Cálculos ──
  const metricas = useMemo(() => {
    const hoje = new Date().toISOString().split("T")[0];
    const inicioSemana = new Date();
    inicioSemana.setDate(inicioSemana.getDate() - 7);
    const inicioMes = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    const receitaHoje = reservas
      .filter((r) => r.criado_em?.startsWith(hoje))
      .reduce((acc, r) => acc + ganho(r.valor_total), 0);

    const receitaSemana = reservas
      .filter((r) => new Date(r.criado_em) >= inicioSemana)
      .reduce((acc, r) => acc + ganho(r.valor_total), 0);

    const receitaMes = reservas
      .filter((r) => new Date(r.criado_em) >= inicioMes)
      .reduce((acc, r) => acc + ganho(r.valor_total), 0);

    const totalReservas = reservas.length;

    const ticketMedio =
      totalReservas > 0
        ? reservas.reduce((acc, r) => acc + ganho(r.valor_total), 0) /
          totalReservas
        : 0;

    return {
      receitaHoje,
      receitaSemana,
      receitaMes,
      totalReservas,
      ticketMedio,
    };
  }, [reservas]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Portal Parceiro / Financeiro
          </p>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight mt-1">
            Módulo Financeiro
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-0.5">
            Receitas e histórico de reservas da sua frota (comissão WiTransfer:
            10%)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Data ontem */}
          <button
            onClick={() => {
              const ontem = new Date();
              ontem.setDate(ontem.getDate() - 1);
              setDataSelecionada(ontem.toISOString().split("T")[0]);
            }}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 shadow-sm transition-all"
          >
            Ontem
          </button>

          {/* Data hoje */}
          <button
            onClick={() =>
              setDataSelecionada(new Date().toISOString().split("T")[0])
            }
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 shadow-sm transition-all"
          >
            Hoje
          </button>

          {/* Date picker */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 gap-2 shadow-sm text-xs font-semibold">
            <Calendar size={13} className="text-slate-400" />
            <input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="outline-none bg-transparent cursor-pointer font-semibold text-slate-700 text-xs"
            />
          </div>

          {/* Limpar data */}
          {dataSelecionada && (
            <button
              onClick={() => setDataSelecionada("")}
              className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-rose-600 rounded-xl transition-all"
              title="Limpar Data"
            >
              <XCircle size={15} />
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={() => carregarDados(true)}
            disabled={refreshing}
            className="p-2 bg-white border border-slate-200 hover:bg-[#902ad1]/5 text-slate-500 hover:text-[#902ad1] rounded-xl shadow-sm transition-all"
            title="Atualizar"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Receita do Mês",
            value: formatCurrency(metricas.receitaMes),
            icon: TrendingUp,
            color: "bg-purple-50 text-[#902ad1]",
            border: "border-purple-100",
          },
          {
            label: "Receita da Semana",
            value: formatCurrency(metricas.receitaSemana),
            icon: BarChart3,
            color: "bg-blue-50 text-blue-600",
            border: "border-blue-100",
          },
          {
            label: "Total de Reservas",
            value: String(metricas.totalReservas),
            icon: Car,
            color: "bg-emerald-50 text-emerald-600",
            border: "border-emerald-100",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`bg-white rounded-2xl border ${kpi.border} shadow-sm p-5 flex items-center gap-4`}
          >
            <div className={`p-3 rounded-xl shrink-0 ${kpi.color}`}>
              <kpi.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {kpi.label}
              </p>
              <p className="text-xl font-semibold text-slate-800 mt-0.5">
                {kpi.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="bg-slate-100/75 p-1 rounded-xl flex gap-1 self-start border border-slate-200/50 w-fit">
        {(["geral", "reservas"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setAbaAtiva(tab)}
            className={`px-5 py-2 rounded-[10px] text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              abaAtiva === tab
                ? "bg-white text-[#902ad1] shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab === "geral" ? "Geral" : `Reservas (${metricas.totalReservas})`}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={32} className="animate-spin text-[#902ad1]" />
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
            A carregar dados financeiros...
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-rose-100 shadow-sm">
          <XCircle size={40} className="text-rose-400 mb-3" />
          <p className="text-sm font-semibold text-slate-700">{error}</p>
          <button
            onClick={() => carregarDados()}
            className="mt-4 px-6 py-2.5 bg-[#902ad1] text-white rounded-xl text-xs font-semibold hover:bg-[#7b22b8] transition-all"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          {/* ── ABA GERAL ── */}
          {abaAtiva === "geral" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
              {/* Card principal - Receita de Hoje */}
              <div className="lg:col-span-2 rounded-2xl overflow-hidden relative shadow-[0_8px_30px_rgba(144,42,209,0.25)]">
                {/* Gradiente de fundo */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#902ad1] via-[#7b22b8] to-[#5c1a8a]" />
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl translate-x-16 -translate-y-16" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white blur-3xl -translate-x-8 translate-y-8" />
                </div>

                <div className="relative p-8 h-full flex flex-col justify-between min-h-[200px]">
                  <div>
                    <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">
                      Receita de Hoje
                    </p>
                    <p className="text-4xl font-semibold text-white mt-2 tracking-tight">
                      {formatCurrency(metricas.receitaHoje)}
                    </p>
                    <p className="text-white/50 text-xs font-semibold mt-1">
                      Após dedução de 10% de comissão WiTransfer
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-6">
                    <DollarSign size={14} className="text-white/40" />
                    <span className="text-white/50 text-[11px] font-semibold">
                      Receita líquida do parceiro
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 2x2 de métricas */}
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 content-start">
                {[
                  {
                    label: "Receita Semana",
                    value: formatCurrency(metricas.receitaSemana),
                    icon: TrendingUp,
                    iconColor: "text-blue-600",
                    bgColor: "bg-blue-50",
                  },
                  {
                    label: "Receita Mês",
                    value: formatCurrency(metricas.receitaMes),
                    icon: BarChart3,
                    iconColor: "text-[#902ad1]",
                    bgColor: "bg-purple-50",
                  },
                  {
                    label: "Ticket Médio",
                    value: formatCurrency(metricas.ticketMedio),
                    icon: DollarSign,
                    iconColor: "text-emerald-600",
                    bgColor: "bg-emerald-50",
                  },
                  {
                    label: "Total Reservas",
                    value: String(metricas.totalReservas),
                    icon: Car,
                    iconColor: "text-amber-600",
                    bgColor: "bg-amber-50",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3"
                  >
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${item.bgColor}`}
                    >
                      <item.icon
                        size={16}
                        className={item.iconColor}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ABA RESERVAS ── */}
          {abaAtiva === "reservas" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                  Histórico de Reservas
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Todas as reservas confirmadas, em andamento e concluídas
                </p>
              </div>

              {reservas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-4">
                    <Car size={28} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">
                    Nenhuma reserva encontrada
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    {dataSelecionada
                      ? "Sem reservas para a data selecionada."
                      : "As reservas da sua frota aparecerão aqui."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[640px]">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                          Data
                        </th>
                        <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                          Cliente
                        </th>
                        <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                          Rota
                        </th>
                        <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">
                          Valor (Líquido)
                        </th>
                        <th className="px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {reservas.map((r) => {
                        const badge =
                          STATUS_BADGE[r.status] || {
                            label: r.status,
                            className:
                              "bg-slate-50 text-slate-500 border-slate-200",
                          };
                        return (
                          <tr
                            key={r.id}
                            className="hover:bg-slate-50/60 hover:shadow-[inset_3px_0_0_0_#902ad1] transition-all duration-200"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                <Clock size={11} className="text-slate-400" />
                                {formatDate(r.criado_em)}
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px] block">
                                {r.cliente_nome || "—"}
                              </span>
                              {r.codigo && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  #{r.codigo}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-start gap-1.5 text-[11px] text-slate-500 font-medium max-w-[180px]">
                                <MapPin
                                  size={11}
                                  className="text-slate-400 shrink-0 mt-0.5"
                                />
                                <span className="truncate">
                                  {r.local_partida && r.local_destino
                                    ? `${r.local_partida} → ${r.local_destino}`
                                    : r.local_partida ||
                                      r.local_destino ||
                                      "—"}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <span className="text-sm font-semibold text-[#902ad1]">
                                {formatCurrency(ganho(r.valor_total))}
                              </span>
                              <span className="block text-[10px] text-slate-400 font-medium">
                                de {formatCurrency(r.valor_total)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${badge.className}`}
                              >
                                {r.status === "concluida" ? (
                                  <CheckCircle2 size={9} />
                                ) : r.status === "em_andamento" ? (
                                  <AlertTriangle size={9} />
                                ) : (
                                  <Clock size={9} />
                                )}
                                {badge.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
