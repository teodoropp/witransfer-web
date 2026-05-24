/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  Search,
  Star,
  Car,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Loader2,
  UserX,
  Filter,
  Activity,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface Motorista {
  id: string;
  perfil_id: string;
  nome_completo: string;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  foto_url: string | null;
  avaliacao_media: number;
  total_viagens: number;
  disponivel: boolean;
  viatura_modelo?: string | null;
  viatura_matricula?: string | null;
}

type FilterType = "todos" | "ativos" | "inativos";

export default function ParceiroMotoristasPage() {
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("todos");
  const [pendentesCount, setPendentesCount] = useState(0);

  const carregarMotoristas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obter o parceiro autenticado
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

      const parceiroId = parceiroData.id;

      // Passo 1: Buscar motoristas do parceiro com viatura
      const { data: motoristasData, error: mError } = await supabase
        .from("motoristas")
        .select(
          "id, perfil_id, viatura_id, avaliacao_media, total_viagens, disponivel, status_aprovacao, viaturas!motoristas_viatura_id_fkey(modelo, matricula)"
        )
        .eq("parceiro_id", parceiroId);

      if (mError) throw mError;

      // Filtrar aprovados
      const aprovados =
        motoristasData?.filter(
          (m: any) =>
            !m.status_aprovacao || m.status_aprovacao === "aprovado"
        ) || [];

      if (aprovados.length === 0) {
        setMotoristas([]);
        return;
      }

      // Passo 2: Buscar perfis
      const perfilIds = aprovados.map((m: any) => m.perfil_id);
      const { data: perfisData, error: pError } = await supabase
        .from("perfis")
        .select("id, nome_completo, telefone, email, ativo, foto_url")
        .in("id", perfilIds);

      if (pError) throw pError;

      // Combinar dados
      const combined: Motorista[] = aprovados.map((m: any) => {
        const perfil = perfisData?.find((p: any) => p.id === m.perfil_id);
        const viatura = Array.isArray(m.viaturas) ? m.viaturas[0] : m.viaturas;
        return {
          id: m.id,
          perfil_id: m.perfil_id,
          nome_completo: perfil?.nome_completo || "Sem nome",
          telefone: perfil?.telefone || null,
          email: perfil?.email || null,
          ativo: perfil?.ativo ?? true,
          foto_url: perfil?.foto_url || null,
          avaliacao_media: m.avaliacao_media || 0,
          total_viagens: m.total_viagens || 0,
          disponivel: m.disponivel ?? false,
          viatura_modelo: viatura?.modelo || null,
          viatura_matricula: viatura?.matricula || null,
        };
      });

      // Passo 3: Buscar total de solicitações pendentes
      const { count: pendingCount } = await supabase
        .from("motoristas")
        .select("id", { count: "exact", head: true })
        .eq("parceiro_id", parceiroId)
        .eq("status_aprovacao", "pendente");

      setPendentesCount(pendingCount || 0);
      setMotoristas(combined);
    } catch (err: any) {
      console.error("Erro ao carregar motoristas:", err);
      setError("Não foi possível carregar os motoristas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarMotoristas();
  }, [carregarMotoristas]);

  const filtrados = useMemo(() => {
    return motoristas.filter((m) => {
      const matchSearch =
        m.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase()) ||
        m.telefone?.toLowerCase().includes(search.toLowerCase());

      const matchFilter =
        filter === "todos" ||
        (filter === "ativos" && m.ativo) ||
        (filter === "inativos" && !m.ativo);

      return matchSearch && matchFilter;
    });
  }, [motoristas, search, filter]);

  const totalAtivos = motoristas.filter((m) => m.ativo).length;
  const totalInativos = motoristas.filter((m) => !m.ativo).length;
  const totalDisponiveis = motoristas.filter((m) => m.disponivel).length;

  const filterOptions: { label: string; value: FilterType }[] = [
    { label: "Todos", value: "todos" },
    { label: "Ativos", value: "ativos" },
    { label: "Inativos", value: "inativos" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Portal Parceiro / Motoristas
          </p>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight mt-1">
            Os Meus Motoristas
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-0.5">
            Gerencie a frota de condutores associados ao seu parceiro
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/parceiro/solicitacoes"
            className="inline-flex items-center gap-2 bg-[#902ad1] hover:bg-[#7b22b8] text-white px-5 py-2.5 rounded-2xl font-semibold text-xs transition-all shadow-md shadow-[#902ad1]/25 active:scale-95 shrink-0"
          >
            <ClipboardList size={14} />
            <span>Solicitações Pendentes</span>
            {pendentesCount > 0 && (
              <span className="ml-1 bg-amber-400 text-amber-950 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                {pendentesCount}
              </span>
            )}
          </Link>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200/60 rounded-2xl text-emerald-600 text-xs font-semibold">
            <Activity size={14} className="animate-pulse" />
            <span>{totalDisponiveis} disponíveis agora</span>
          </div>
        </div>
      </div>

      {/* ── KPI Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Motoristas",
            value: motoristas.length,
            icon: Users,
            color: "bg-purple-50 text-[#902ad1]",
            border: "border-purple-100",
          },
          {
            label: "Motoristas Ativos",
            value: totalAtivos,
            icon: CheckCircle2,
            color: "bg-emerald-50 text-emerald-600",
            border: "border-emerald-100",
          },
          {
            label: "Motoristas Inativos",
            value: totalInativos,
            icon: XCircle,
            color: "bg-rose-50 text-rose-500",
            border: "border-rose-100",
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
              <p className="text-2xl font-semibold text-slate-800 mt-0.5">
                {kpi.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Pesquisar por nome, email ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <Filter size={13} className="text-slate-400 ml-2 shrink-0" />
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                filter === opt.value
                  ? "bg-white text-[#902ad1] shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {opt.label}
              {opt.value === "todos" && (
                <span className="ml-1.5 text-[9px] font-semibold text-slate-400">
                  ({motoristas.length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lista ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={32} className="animate-spin text-[#902ad1]" />
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
            A carregar motoristas...
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-rose-100 shadow-sm">
          <XCircle size={40} className="text-rose-400 mb-3" />
          <p className="text-sm font-semibold text-slate-700">{error}</p>
          <button
            onClick={carregarMotoristas}
            className="mt-4 px-6 py-2.5 bg-[#902ad1] text-white rounded-xl text-xs font-semibold hover:bg-[#7b22b8] transition-all"
          >
            Tentar novamente
          </button>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-4">
            <UserX size={32} className="text-slate-300" />
          </div>
          <h3 className="text-base font-semibold text-slate-700">
            Nenhum motorista encontrado
          </h3>
          <p className="text-sm text-slate-400 font-medium mt-1 max-w-xs text-center">
            {search || filter !== "todos"
              ? "Tente ajustar os filtros ou a pesquisa."
              : "Ainda não tem motoristas associados ao seu parceiro."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  <th className="py-3.5 px-5">Motorista</th>
                  <th className="py-3.5 px-5">Contacto</th>
                  <th className="py-3.5 px-5">Viatura</th>
                  <th className="py-3.5 px-5 text-center">Viagens</th>
                  <th className="py-3.5 px-5 text-center">Avaliação</th>
                  <th className="py-3.5 px-5 text-center">Estado</th>
                  <th className="py-3.5 px-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtrados.map((motorista) => (
                  <tr
                    key={motorista.id}
                    className="text-[13px] font-medium text-slate-700 hover:bg-slate-50/60 hover:shadow-[inset_4px_0_0_0_#902ad1] transition-all duration-200"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-br from-[#902ad1]/15 to-[#902ad1]/5 border border-[#902ad1]/10 flex items-center justify-center">
                            {motorista.foto_url ? (
                              <Image
                                src={motorista.foto_url}
                                alt={motorista.nome_completo}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[#902ad1] font-semibold text-[12px]">
                                {motorista.nome_completo.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                              motorista.disponivel ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                            title={motorista.disponivel ? "Disponível" : "Indisponível"}
                          />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-800 block">
                            {motorista.nome_completo}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal block">
                            {motorista.disponivel ? "🟢 Disponível" : "⚫ Indisponível"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="space-y-0.5">
                        {motorista.email && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Mail size={11} className="text-slate-400 shrink-0" />
                            <span className="truncate max-w-[160px] font-normal">{motorista.email}</span>
                          </div>
                        )}
                        {motorista.telefone && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Phone size={11} className="text-slate-400 shrink-0" />
                            <span className="font-mono font-normal">{motorista.telefone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      {motorista.viatura_modelo ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-600 truncate max-w-[120px]">
                            {motorista.viatura_modelo}
                          </span>
                          {motorista.viatura_matricula && (
                            <span className="bg-yellow-50 text-yellow-850 border border-yellow-250/60 px-2 py-0.5 rounded-md text-[9px] font-medium uppercase">
                              {motorista.viatura_matricula}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-normal">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-center text-xs font-medium text-slate-500 font-mono">
                      {motorista.total_viagens}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <div className="inline-flex items-center gap-1">
                        <Star size={11} className="text-amber-400 fill-amber-400" />
                        <span className="text-xs font-semibold text-slate-700">
                          {motorista.avaliacao_media?.toFixed(1) || "0.0"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                          motorista.ativo
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200/60"
                            : "bg-slate-100 text-slate-400 border-slate-200"
                        }`}
                      >
                        {motorista.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/parceiro/motoristas/${motorista.id}`}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#902ad1]/5 hover:bg-[#902ad1] text-[#902ad1] hover:text-white border border-[#902ad1]/20 hover:border-[#902ad1] rounded-xl text-[11px] font-semibold transition-all duration-200"
                      >
                        Ver Ficha
                        <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
