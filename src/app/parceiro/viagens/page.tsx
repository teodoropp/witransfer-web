/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarRange,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  User,
  MapPin,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Perfil {
  nome_completo: string | null;
}

interface Viatura {
  modelo: string | null;
  matricula: string | null;
}

interface MotoristaInner {
  perfil: Perfil | null;
}

interface Reserva {
  id: string;
  codigo: string | null;
  status: "aguarda_pagamento" | "pago" | "em_andamento" | "concluida" | "cancelada";
  data_recolha: string | null;
  local_partida: string | null;
  local_destino: string | null;
  valor_total: number | null;
  observacoes: string | null;
  cliente: Perfil | null;
  viaturas: Viatura | null;
  motorista: MotoristaInner | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function formatKz(value: number | null): string {
  if (value == null) return "—";
  return `${value.toLocaleString("pt-AO")} Kz`;
}

export default function ViagensHistoricoPage() {
  const [viagens, setViagens] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todas" | "concluida" | "cancelada">("todas");

  const carregarViagens = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar parceiroId
      const { data: parceiroData } = await supabase
        .from("parceiros")
        .select("id")
        .eq("usuario_id", user.id)
        .single();

      if (!parceiroData) {
        setErro("Parceiro não encontrado.");
        return;
      }

      // Buscar viaturas do parceiro
      const { data: viaturasData } = await supabase
        .from("viaturas")
        .select("id")
        .eq("parceiro_id", parceiroData.id);

      const viaturaIds = (viaturasData ?? []).map((v) => v.id);

      if (viaturaIds.length === 0) {
        setViagens([]);
        return;
      }

      // Buscar reservas concluídas ou canceladas
      const { data, error } = await supabase
        .from("reservas")
        .select(`
          id, codigo, status, data_recolha, local_partida, local_destino, valor_total, observacoes,
          cliente:perfis!reservas_cliente_id_fkey(nome_completo),
          viaturas!reservas_viatura_id_fkey(modelo, matricula),
          motorista:motoristas!reservas_motorista_id_fkey(perfil:perfis!motoristas_perfil_id_fkey(nome_completo))
        `)
        .in("viatura_id", viaturaIds)
        .in("status", ["concluida", "cancelada"])
        .order("data_recolha", { ascending: false });

      if (error) throw error;

      setViagens((data as unknown as Reserva[]) ?? []);
    } catch (err) {
      console.error("Erro ao carregar histórico de viagens:", err);
      setErro("Erro ao carregar o histórico de viagens.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarViagens();
  }, [carregarViagens]);

  const viagensFiltradas = useMemo(() => {
    return viagens.filter((v) => {
      const matchStatus = filtroStatus === "todas" || v.status === filtroStatus;
      const term = search.toLowerCase();
      const matchSearch =
        !term ||
        v.codigo?.toLowerCase().includes(term) ||
        v.cliente?.nome_completo?.toLowerCase().includes(term) ||
        v.viaturas?.modelo?.toLowerCase().includes(term) ||
        v.local_partida?.toLowerCase().includes(term) ||
        v.local_destino?.toLowerCase().includes(term);

      return matchStatus && matchSearch;
    });
  }, [viagens, search, filtroStatus]);

  const totalConcluidas = useMemo(() => viagens.filter((v) => v.status === "concluida").length, [viagens]);
  const totalCanceladas = useMemo(() => viagens.filter((v) => v.status === "cancelada").length, [viagens]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/parceiro/dashboard"
            className="p-2.5 text-slate-400 hover:text-slate-700 bg-white/80 hover:bg-white rounded-2xl border border-slate-100/80 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              <Link href="/parceiro/dashboard" className="hover:text-[#902ad1] transition-all">
                Dashboard
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">Histórico de Viagens</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight mt-0.5">
              Histórico de Viagens
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-emerald-50 px-3.5 py-2 rounded-2xl border border-emerald-100">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Concluídas</span>
            <span className="text-[13px] font-semibold text-emerald-700">{totalConcluidas}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-rose-50 px-3.5 py-2 rounded-2xl border border-rose-100">
            <XCircle size={13} className="text-rose-500" />
            <span className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider">Canceladas</span>
            <span className="text-[13px] font-semibold text-rose-600">{totalCanceladas}</span>
          </div>
          <button
            onClick={carregarViagens}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl text-slate-500 transition-all hover:text-[#902ad1]"
            title="Recarregar"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Pesquisa e Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por código, cliente, veículo ou rota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#902ad1]/20 focus:border-[#902ad1] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0 w-fit">
          {(["todas", "concluida", "cancelada"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                filtroStatus === status
                  ? "bg-white text-[#902ad1] shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {status === "todas" ? "Todas" : status === "concluida" ? "Concluídas" : "Canceladas"}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-[#902ad1]" />
            <p className="text-[13px] font-semibold text-slate-400">A carregar histórico…</p>
          </div>
        </div>
      ) : erro ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
          <XCircle size={40} className="text-rose-400 mb-3" />
          <p className="text-sm font-semibold text-slate-700">{erro}</p>
          <button
            onClick={carregarViagens}
            className="mt-4 px-6 py-2.5 bg-[#902ad1] text-white rounded-xl text-xs font-semibold hover:bg-[#7b22b8] transition-all"
          >
            Tentar novamente
          </button>
        </div>
      ) : viagensFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Car size={28} className="text-slate-300" />
          </div>
          <h3 className="text-base font-semibold text-slate-700">Nenhuma viagem registada</h3>
          <p className="text-sm text-slate-400 font-medium mt-1 max-w-xs">
            {search || filtroStatus !== "todas"
              ? "Tente ajustar os critérios de pesquisa ou os filtros."
              : "As viagens concluídas ou canceladas da sua frota aparecerão aqui."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  <th className="py-3.5 px-5">Código</th>
                  <th className="py-3.5 px-5">Data / Hora</th>
                  <th className="py-3.5 px-5">Cliente</th>
                  <th className="py-3.5 px-5">Veículo / Motorista</th>
                  <th className="py-3.5 px-5">Rota</th>
                  <th className="py-3.5 px-5 text-right">Valor Líquido</th>
                  <th className="py-3.5 px-5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {viagensFiltradas.map((v) => {
                  const ganhoLiquido = v.valor_total ? v.valor_total / 1.1 : 0;
                  return (
                    <tr
                      key={v.id}
                      className="text-[12px] font-semibold text-slate-700 hover:bg-slate-50/50 hover:shadow-[inset_3px_0_0_0_#902ad1] transition-all duration-150"
                    >
                      <td className="py-3.5 px-5 font-semibold text-[#902ad1]">
                        {v.codigo || `#${v.id.slice(0, 8)}`}
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap text-slate-500">
                        {formatDate(v.data_recolha)}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#902ad1]/10 flex items-center justify-center text-[#902ad1] text-[10px] font-semibold shrink-0">
                            <User size={12} />
                          </div>
                          <span className="truncate max-w-[120px]" title={v.cliente?.nome_completo || ""}>
                            {v.cliente?.nome_completo || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="space-y-0.5">
                          {v.viaturas?.modelo && (
                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                              <Car size={11} className="text-slate-400" />
                              <span>{v.viaturas.modelo}</span>
                              {v.viaturas.matricula && (
                                <span className="bg-yellow-100 text-yellow-800 text-[9px] font-semibold px-1.5 py-0.2 rounded uppercase">
                                  {v.viaturas.matricula}
                                </span>
                              )}
                            </div>
                          )}
                          {v.motorista?.perfil?.nome_completo && (
                            <p className="text-[10px] text-slate-400 font-semibold truncate pl-4">
                              Condutor: {v.motorista.perfil.nome_completo.split(" ")[0]}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 max-w-[200px]">
                        <div className="flex flex-col gap-0.5 text-slate-500 font-medium">
                          <span className="truncate text-slate-700">{v.local_partida}</span>
                          <span className="truncate text-slate-400 text-[10px]">{v.local_destino}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right font-semibold text-[#902ad1]">
                        {v.status === "concluida" ? (
                          <>
                            <span className="text-emerald-600 font-semibold">{formatKz(ganhoLiquido)}</span>
                            <span className="block text-[9px] text-slate-400 font-semibold">Base: {formatKz(v.valor_total)}</span>
                          </>
                        ) : (
                          <span className="text-rose-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider border ${
                            v.status === "concluida"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200/60"
                              : "bg-rose-50 text-rose-500 border-rose-200/60"
                          }`}
                        >
                          {v.status === "concluida" ? "Concluída" : "Cancelada"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
