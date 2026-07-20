/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarRange,
  Search,
  Eye,
  Check,
  X,
  Trash2,
  AlertTriangle,
  Play,
  CheckCircle2,
  DollarSign,
  Car,
  Compass,
  ArrowRight,
  UserCheck,
  TrendingUp,
  MapPin,
  Clock,
  ChevronDown,
  Plane,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface Perfil {
  id: string;
  nome_completo: string;
  email: string | null;
  telefone: string | null;
  foto_url: string | null;
}

interface Motorista {
  id: string;
  perfil_id: string;
  perfis: {
    nome_completo: string;
    telefone: string | null;
  } | null;
}

interface Viatura {
  id: string;
  modelo: string;
  marca: string | null;
  matricula: string | null;
  preco_base: number;
}

interface Reserva {
  id: string;
  codigo: string;
  cliente_id: string;
  viatura_id: string | null;
  motorista_id: string | null;
  tipo_rota: string;
  local_partida: string;
  local_destino: string;
  data_recolha: string;
  hora_recolha: string;
  valor_total: number;
  status: string;
  criado_em: string;
  numero_voo: string | null;
  passageiros: number;
  malas: number;
  observacoes: string | null;
  perfis: Perfil | null;
  viaturas: Viatura | null;
  motoristas: Motorista | null;
}

function AnimatedNumber({ value, isCurrency = false }: { value: number; isCurrency?: boolean }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const start = current;
    const end = value;
    if (start === end) return;

    const duration = 800; // ms
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (outQuad)
      const easeProgress = progress * (2 - progress);
      const nextVal = Math.round(start + (end - start) * easeProgress);
      
      setCurrent(nextVal);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  if (isCurrency) {
    return <span>{current.toLocaleString("pt-AO")} Kz</span>;
  }
  return <span>{current}</span>;
}

export default function ReservasAdminPage() {
  const router = useRouter();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [motoristasDisponiveis, setMotoristasDisponiveis] = useState<
    Motorista[]
  >([]);
  const [viaturasDisponiveis, setViaturasDisponiveis] = useState<Viatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [routeTypeFilter, setRouteTypeFilter] = useState("todas");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("todos");
  const [quickFilter, setQuickFilter] = useState<string>("todos");
  const [sortBy, setSortBy] = useState("recente");

  // Modal de atribuicao
  const [atribuicaoModal, setAtribuicaoModal] = useState<{
    reservaId: string;
    motoristaId: string;
    viaturaId: string;
  } | null>(null);

  const fetchReservas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reservas")
        .select(
          `
          *,
          perfis:cliente_id (id, nome_completo, email, telefone, foto_url),
          viaturas:viatura_id (id, marca, modelo, matricula, preco_base),
          motoristas:motorista_id (
            id, perfil_id,
            perfis:perfil_id (nome_completo, telefone)
          )
        `,
        )
        .order("criado_em", { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((r: any) => ({
        ...r,
        perfis: Array.isArray(r.perfis) ? r.perfis[0] : r.perfis,
        viaturas: Array.isArray(r.viaturas) ? r.viaturas[0] : r.viaturas,
        motoristas: r.motoristas
          ? {
              id: r.motoristas.id,
              perfil_id: r.motoristas.perfil_id,
              perfis: Array.isArray(r.motoristas.perfis)
                ? r.motoristas.perfis[0]
                : r.motoristas.perfis,
            }
          : null,
      })) as Reserva[];

      setReservas(formatted);

      if (selectedReserva) {
        const updated = formatted.find((r) => r.id === selectedReserva.id);
        if (updated) setSelectedReserva(updated);
      }
    } catch (err) {
      console.error("Erro ao carregar reservas:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedReserva]);

  const fetchRecursos = useCallback(async () => {
    try {
      const { data: motData } = await supabase
        .from("motoristas")
        .select(`id, perfil_id, perfis:perfil_id (nome_completo, telefone)`);

      setMotoristasDisponiveis(
        (motData || []).map((m: any) => ({
          id: m.id,
          perfil_id: m.perfil_id,
          perfis: Array.isArray(m.perfis) ? m.perfis[0] : m.perfis,
        })) as Motorista[],
      );

      const { data: viatData } = await supabase
        .from("viaturas")
        .select("id, marca, modelo, matricula, preco_base")
        .eq("ativo", true);

      setViaturasDisponiveis(viatData || []);
    } catch (err) {
      console.error("Erro ao buscar recursos:", err);
    }
  }, []);

  useEffect(() => {
    fetchReservas();
    fetchRecursos();
  }, [fetchRecursos]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-reservas-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservas" },
        () => {
          fetchReservas();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReservas]);

  const handleUpdateStatus = async (id: string, novoStatus: string) => {
    try {
      setActionLoading(id);
      const updates: Record<string, any> = { status: novoStatus };
      const now = new Date().toISOString();
      if (novoStatus === "pago") updates.pago_em = now;
      if (novoStatus === "em_andamento") updates.iniciado_em = now;
      if (novoStatus === "concluida") updates.concluido_em = now;
      if (novoStatus === "cancelada") updates.cancelado_em = now;

      const { error } = await supabase
        .from("reservas")
        .update(updates)
        .eq("id", id);
      if (error) throw error;

      setReservas((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      );
      if (selectedReserva && selectedReserva.id === id) {
        setSelectedReserva((prev) => (prev ? { ...prev, ...updates } : null));
      }
    } catch {
      alert("Erro ao atualizar estado da reserva.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveAtribuicao = async () => {
    if (!atribuicaoModal) return;
    try {
      setActionLoading(atribuicaoModal.reservaId);
      const { error } = await supabase
        .from("reservas")
        .update({
          motorista_id: atribuicaoModal.motoristaId || null,
          viatura_id: atribuicaoModal.viaturaId || null,
          status: "confirmada",
        })
        .eq("id", atribuicaoModal.reservaId);

      if (error) throw error;

      const motorista =
        motoristasDisponiveis.find(
          (m) => m.id === atribuicaoModal.motoristaId,
        ) || null;
      const viatura =
        viaturasDisponiveis.find((v) => v.id === atribuicaoModal.viaturaId) ||
        null;

      setReservas((prev) =>
        prev.map((r) =>
          r.id === atribuicaoModal.reservaId
            ? {
                ...r,
                motorista_id: atribuicaoModal.motoristaId || null,
                viatura_id: atribuicaoModal.viaturaId || null,
                status: "confirmada",
                motoristas: motorista,
                viaturas: viatura,
              }
            : r,
        ),
      );

      if (selectedReserva && selectedReserva.id === atribuicaoModal.reservaId) {
        setSelectedReserva((prev) =>
          prev
            ? {
                ...prev,
                motorista_id: atribuicaoModal.motoristaId || null,
                viatura_id: atribuicaoModal.viaturaId || null,
                status: "confirmada",
                motoristas: motorista,
                viaturas: viatura,
              }
            : null,
        );
      }
      setAtribuicaoModal(null);
    } catch {
      alert("Erro ao atribuir recursos.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que deseja eliminar esta reserva?")) return;
    try {
      setActionLoading(id);
      const { error } = await supabase.from("reservas").delete().eq("id", id);
      if (error) throw error;
      setReservas((prev) => prev.filter((r) => r.id !== id));
      if (selectedReserva && selectedReserva.id === id)
        setSelectedReserva(null);
    } catch {
      alert("Erro ao eliminar a reserva.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("todos");
    setRouteTypeFilter("todas");
    setStartDateFilter("");
    setDriverFilter("todos");
    setSortBy("recente");
    setQuickFilter("todos");
  };

  const today = new Date().toISOString().split("T")[0];

  // KPI stats
  const reservasHoje = reservas.filter((r) => r.data_recolha === today).length;
  const emAndamento = reservas.filter(
    (r) => r.status === "em_andamento",
  ).length;
  const aguardaMotorista = reservas.filter(
    (r) => !r.motorista_id && r.status !== "cancelada",
  ).length;
  const pagamentoPendente = reservas.filter(
    (r) => r.status === "aguarda_pagamento",
  ).length;
  const canceladas = reservas.filter((r) => r.status === "cancelada").length;
  const faturamentoHoje = reservas
    .filter(
      (r) =>
        r.data_recolha === today &&
        ["pago", "concluida", "em_andamento"].includes(r.status),
    )
    .reduce((s, r) => s + r.valor_total, 0);

  const filteredReservas = useMemo(() => {
    const filtered = reservas.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        r.codigo.toLowerCase().includes(q) ||
        (r.perfis?.nome_completo || "").toLowerCase().includes(q) ||
        r.local_partida.toLowerCase().includes(q) ||
        r.local_destino.toLowerCase().includes(q) ||
        (r.numero_voo || "").toLowerCase().includes(q);

      const matchStatus = statusFilter === "todos" || r.status === statusFilter;
      const matchRoute =
        routeTypeFilter === "todas" || r.tipo_rota === routeTypeFilter;
      const matchDate = !startDateFilter || r.data_recolha >= startDateFilter;
      const matchDriver =
        driverFilter === "todos" ||
        (driverFilter === "sem_motorista" && !r.motorista_id) ||
        r.motorista_id === driverFilter;

      const matchQuick =
        quickFilter === "todos" ||
        (quickFilter === "hoje" && r.data_recolha === today) ||
        (quickFilter === "andamento" && r.status === "em_andamento") ||
        (quickFilter === "pendentes" && r.status === "aguarda_pagamento") ||
        (quickFilter === "agendadas" && r.status === "confirmada");

      return (
        matchSearch &&
        matchStatus &&
        matchRoute &&
        matchDate &&
        matchDriver &&
        matchQuick
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "valor-desc") return b.valor_total - a.valor_total;
      if (sortBy === "valor-asc") return a.valor_total - b.valor_total;
      if (sortBy === "antiga") return a.criado_em.localeCompare(b.criado_em);
      return b.criado_em.localeCompare(a.criado_em);
    });
  }, [
    reservas,
    search,
    statusFilter,
    routeTypeFilter,
    startDateFilter,
    driverFilter,
    quickFilter,
    sortBy,
    today,
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aguarda_pagamento":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider bg-amber-500/8 text-amber-700 border border-amber-500/10">
            <Clock size={10} strokeWidth={2.5} className="animate-pulse" />{" "}
            Pendente
          </span>
        );
      case "confirmada":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider bg-blue-500/8 text-blue-700 border border-blue-500/10">
            <Check size={10} strokeWidth={2.5} /> Confirmada
          </span>
        );
      case "pago":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider bg-emerald-500/8 text-emerald-700 border border-emerald-500/10">
            <CheckCircle2 size={10} strokeWidth={2.5} /> Pago
          </span>
        );
      case "em_andamento":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider bg-purple-500/8 text-purple-700 border border-purple-500/15 animate-pulse">
            <Compass size={10} strokeWidth={2.5} /> Em Viagem
          </span>
        );
      case "concluida":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider bg-slate-500/8 text-slate-700 border border-slate-500/15">
            <Check size={10} strokeWidth={2.5} /> Concluida
          </span>
        );
      case "cancelada":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider bg-rose-500/8 text-rose-700 border border-rose-500/10">
            <X size={10} strokeWidth={2.5} /> Cancelada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider bg-slate-500/5 text-slate-500 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const getRotaLabel = (tipo: string) => {
    switch (tipo) {
      case "aeroporto_cidade":
        return "Aeroporto -> Cidade";
      case "cidade_aeroporto":
        return "Cidade -> Aeroporto";
      case "aeroporto_aeroporto":
        return "Aeroporto -> Aeroporto";
      case "taxi":
        return "Servico Taxi";
      default:
        return tipo;
    }
  };

  const formatCurrency = (val: number) => val.toLocaleString("pt-AO") + " Kz";

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "---";
    }
  };

  const getInitials = (name?: string | null) =>
    name
      ? name
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "CL";

  const hasActiveFilters =
    quickFilter !== "todos" ||
    search ||
    statusFilter !== "todos" ||
    driverFilter !== "todos" ||
    routeTypeFilter !== "todas" ||
    startDateFilter;

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-10">
      {/* Titulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-normal text-[#1a1a1a] tracking-tight">Gestão de Reservas</h1>
          <p className="text-xs text-slate-400 mt-1">Monitore, filtre e gerencie todas as solicitações de transfer de forma profissional.</p>
        </div>
      </div>

      {/* KPI Stats - Separated into Clean Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Reservas de Hoje */}
        <div className="bg-white border border-black/[0.22] rounded-[5px] p-4 flex flex-col items-center justify-center text-center gap-1.5 hover:shadow-sm transition-all duration-300">
          <CalendarRange size={18} strokeWidth={2} className="text-[#902ad1]" />
          <span className="text-[10px] text-slate-500 leading-tight font-medium">
            Reservas de Hoje
          </span>
          <span className="text-xl font-medium text-slate-800">
            <AnimatedNumber value={reservasHoje} />
          </span>
        </div>

        {/* Em andamento */}
        <div className="bg-white border border-black/[0.22] rounded-[5px] p-4 flex flex-col items-center justify-center text-center gap-1.5 hover:shadow-sm transition-all duration-300">
          <Compass size={18} strokeWidth={2} className="text-[#902ad1]" />
          <span className="text-[10px] text-slate-500 leading-tight font-medium">
            Em andamento
          </span>
          <span className="text-xl font-medium text-slate-800">
            <AnimatedNumber value={emAndamento} />
          </span>
        </div>

        {/* Aguardar Motorista */}
        <div className="bg-white border border-black/[0.22] rounded-[5px] p-4 flex flex-col items-center justify-center text-center gap-1.5 hover:shadow-sm transition-all duration-300">
          <UserCheck size={18} strokeWidth={2} className="text-[#902ad1]" />
          <span className="text-[10px] text-slate-500 leading-tight font-medium">
            Aguardar Motorista
          </span>
          <span className="text-xl font-medium text-slate-800">
            <AnimatedNumber value={aguardaMotorista} />
          </span>
        </div>

        {/* Pagamento pendente */}
        <div className="bg-white border border-black/[0.22] rounded-[5px] p-4 flex flex-col items-center justify-center text-center gap-1.5 hover:shadow-sm transition-all duration-300">
          <Clock size={18} strokeWidth={2} className="text-[#902ad1]" />
          <span className="text-[10px] text-slate-500 leading-tight font-medium">
            Pagamento pendente
          </span>
          <span className="text-xl font-medium text-slate-800">
            <AnimatedNumber value={pagamentoPendente} />
          </span>
        </div>

        {/* Canceladas */}
        <div className="bg-white border border-black/[0.22] rounded-[5px] p-4 flex flex-col items-center justify-center text-center gap-1.5 hover:shadow-sm transition-all duration-300">
          <X size={18} strokeWidth={2} className="text-[#902ad1]" />
          <span className="text-[10px] text-slate-500 leading-tight font-medium">
            Canceladas
          </span>
          <span className="text-xl font-medium text-slate-800">
            <AnimatedNumber value={canceladas} />
          </span>
        </div>

        {/* Faturamento Hoje */}
        <div className="bg-white border border-black/[0.22] rounded-[5px] p-4 flex flex-col items-center justify-center text-center gap-1.5 hover:shadow-sm transition-all duration-300">
          <DollarSign size={18} strokeWidth={2} className="text-[#902ad1]" />
          <span className="text-[10px] text-slate-500 leading-tight font-medium">
            Faturamento Hoje
          </span>
          <span className="text-lg font-medium text-slate-800 font-mono">
            <AnimatedNumber value={faturamentoHoje} isCurrency={true} />
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-black/[0.22] rounded-[5px] p-4 space-y-3">
        {/* Linha 1: Pesquisa + Filtros rapidos */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="relative flex-1 min-w-[200px] max-w-[360px]">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Pesquisar por codigo, cliente, telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-[4px] text-xs text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-[#902ad1]/60 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              Filtros rapidos:
            </span>
            {[
              { key: "hoje", label: "Apenas Hoje" },
              { key: "andamento", label: "Em Andamento" },
              { key: "pendentes", label: "Pendentes" },
              { key: "agendadas", label: "Agendadas" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() =>
                  setQuickFilter(quickFilter === f.key ? "todos" : f.key)
                }
                className={`px-3 py-1.5 rounded-[4px] text-[11px] font-medium border transition-all cursor-pointer ${
                  quickFilter === f.key
                    ? "bg-[#902ad1] text-white border-[#902ad1]"
                    : "bg-white text-slate-600 border-slate-200 hover:border-[#902ad1]/40"
                }`}>
                {f.label}
              </button>
            ))}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-[#902ad1] hover:underline cursor-pointer bg-transparent border-none">
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Linha 2: Dropdowns */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] text-slate-400 uppercase tracking-wider">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-[4px] text-xs text-slate-700 focus:outline-none focus:border-[#902ad1]/60 cursor-pointer transition-all">
              <option value="todos">Todos os status</option>
              <option value="aguarda_pagamento">Aguardando Pagamento</option>
              <option value="confirmada">Confirmada</option>
              <option value="pago">Pago</option>
              <option value="em_andamento">Em Viagem</option>
              <option value="concluida">Concluida</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] text-slate-400 uppercase tracking-wider">
              Data
            </label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-[4px] text-xs text-slate-700 focus:outline-none focus:border-[#902ad1]/60 transition-all"
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] text-slate-400 uppercase tracking-wider">
              Categoria
            </label>
            <select
              value={routeTypeFilter}
              onChange={(e) => setRouteTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-[4px] text-xs text-slate-700 focus:outline-none focus:border-[#902ad1]/60 cursor-pointer transition-all">
              <option value="todas">Todas as Categorias</option>
              <option value="aeroporto_cidade">Aeroporto - Cidade</option>
              <option value="cidade_aeroporto">Cidade - Aeroporto</option>
              <option value="aeroporto_aeroporto">Aeroporto - Aeroporto</option>
              <option value="taxi">Taxi</option>
            </select>
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] text-slate-400 uppercase tracking-wider">
              Parceiros
            </label>
            <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-[4px] text-xs text-slate-700 focus:outline-none cursor-pointer transition-all">
              <option>Todos os parceiros</option>
            </select>
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] text-slate-400 uppercase tracking-wider">
              Motoristas
            </label>
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-[4px] text-xs text-slate-700 focus:outline-none focus:border-[#902ad1]/60 cursor-pointer transition-all">
              <option value="todos">Todos os Motoristas</option>
              <option value="sem_motorista">Sem Motorista</option>
              {motoristasDisponiveis.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.perfis?.nome_completo}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-[5px] border border-black/[0.22]">
          <div className="w-8 h-8 border-2 border-[#902ad1]/20 border-t-[#902ad1] rounded-full animate-spin" />
        </div>
      ) : filteredReservas.length > 0 ? (
        <div className="bg-white border border-black/[0.22] rounded-[5px] overflow-hidden">
          <div className="overflow-x-auto">
            <div
              className="overflow-y-auto no-scrollbar"
              style={{ maxHeight: "402px" }}>
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3 text-[9px] font-medium text-slate-400 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-5 py-3 text-[9px] font-medium text-slate-400 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-5 py-3 text-[9px] font-medium text-slate-400 uppercase tracking-wider">
                      Trajeto
                    </th>
                    <th className="px-5 py-3 text-[9px] font-medium text-slate-400 uppercase tracking-wider">
                      Horario
                    </th>
                    <th className="px-5 py-3 text-[9px] font-medium text-slate-400 uppercase tracking-wider">
                      Motorista
                    </th>
                    <th className="px-5 py-3 text-[9px] font-medium text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3 text-[9px] font-medium text-slate-400 uppercase tracking-wider text-right">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredReservas.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => router.push(`/admin/reservas/${r.id}`)}
                      className="hover:bg-[#902ad1]/5 active:bg-[#902ad1]/10 border-l-[3px] border-l-transparent hover:border-l-[#902ad1] transition-all duration-150 cursor-pointer h-[60px]">
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-[#902ad1] font-mono font-semibold">
                          {r.codigo}
                        </span>
                      </td>

                      <td
                        className="px-5 py-3.5"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2.5">
                          {r.perfis?.foto_url ? (
                            <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-slate-100 shrink-0">
                              <Image
                                src={r.perfis.foto_url}
                                alt={r.perfis.nome_completo}
                                fill
                                sizes="28px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#902ad1]/10 text-[#902ad1] flex items-center justify-center text-[9px] font-bold border border-[#902ad1]/15 shrink-0">
                              {getInitials(r.perfis?.nome_completo)}
                            </div>
                          )}
                          <span className="text-xs text-slate-700 truncate max-w-[120px]">
                            {r.perfis?.nome_completo || "Cliente"}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 max-w-[200px]">
                          <span className="truncate">{r.local_partida}</span>
                          <ArrowRight
                            size={10}
                            className="text-slate-400 shrink-0"
                          />
                          <span className="truncate">{r.local_destino}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="text-xs text-slate-600">
                          {formatDate(r.data_recolha)}
                        </span>
                      </td>

                      <td
                        className="px-5 py-3.5"
                        onClick={(e) => e.stopPropagation()}>
                        {r.motoristas ? (
                          <span className="text-xs text-slate-700 truncate max-w-[120px] block">
                            {r.motoristas.perfis?.nome_completo}
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              setAtribuicaoModal({
                                reservaId: r.id,
                                motoristaId: "",
                                viaturaId: r.viatura_id || "",
                              })
                            }
                            className="text-[10px] text-[#902ad1] hover:underline cursor-pointer bg-transparent border-none">
                            + Atribuir
                          </button>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        {getStatusBadge(r.status)}
                      </td>

                      <td
                        className="px-5 py-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => router.push(`/admin/reservas/${r.id}`)}
                            className="p-1.5 text-slate-400 hover:text-[#902ad1] transition-colors"
                            title="Ver detalhes">
                            <Eye size={14} strokeWidth={2} />
                          </button>
                          {r.status === "pago" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(r.id, "em_andamento")
                              }
                              disabled={actionLoading === r.id}
                              className="p-1.5 text-slate-400 hover:text-[#902ad1] transition-colors disabled:opacity-50"
                              title="Iniciar viagem">
                              <Play size={14} strokeWidth={2} />
                            </button>
                          )}
                          {r.status === "aguarda_pagamento" && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, "pago")}
                              disabled={actionLoading === r.id}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors disabled:opacity-50"
                              title="Confirmar pagamento">
                              <Check size={14} strokeWidth={2} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(r.id)}
                            disabled={actionLoading === r.id}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-50"
                            title="Eliminar">
                            <X size={14} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[5px] border border-black/[0.22]">
          <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
            <CalendarRange size={28} />
          </div>
          <h3 className="text-base font-semibold text-slate-700">
            Nenhuma reserva encontrada
          </h3>
          <p className="text-slate-400 mt-1 text-sm max-w-xs text-center">
            Tente redefinir os filtros ou aguarde por novas reservas.
          </p>
        </div>
      )}

      {/* Drawer de detalhes */}
      {selectedReserva && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer"
            onClick={() => setSelectedReserva(null)}
          />
          <div className="absolute inset-y-0 right-0 flex pl-10 max-w-full">
            <div className="w-screen max-w-md bg-white border-l border-slate-200 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
              {/* Header do Drawer */}
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                <div>
                  <span className="text-[10px] bg-purple-50 text-[#902ad1] border border-[#902ad1]/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Reserva: {selectedReserva.codigo}
                  </span>
                  <h3 className="text-base text-slate-800 tracking-tight mt-1.5">
                    Detalhes do Agendamento
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedReserva(null)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer">
                  <X size={15} strokeWidth={2.5} />
                </button>
              </div>

              {/* Conteudo do Drawer */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
                {/* Progresso */}
                <div className="space-y-3">
                  <h4 className="text-[10px] text-slate-400 uppercase tracking-widest">
                    Progresso / Estado
                  </h4>
                  <div className="relative pt-2 pb-1 px-1">
                    <div className="absolute top-4 left-3 right-3 h-[2px] bg-slate-100 z-0" />
                    <div className="flex justify-between relative z-10">
                      {[
                        { key: "aguarda_pagamento", label: "Pendente" },
                        { key: "pago", label: "Pago" },
                        { key: "confirmada", label: "Confirmada" },
                        { key: "em_andamento", label: "Viagem" },
                        { key: "concluida", label: "Fim" },
                      ].map((step, idx) => {
                        const order = [
                          "aguarda_pagamento",
                          "pago",
                          "confirmada",
                          "em_andamento",
                          "concluida",
                        ];
                        const curIdx = order.indexOf(selectedReserva.status);
                        const stepIdx = order.indexOf(step.key);
                        const isDone =
                          stepIdx <= curIdx &&
                          selectedReserva.status !== "cancelada";
                        const isCurrent = step.key === selectedReserva.status;
                        return (
                          <div
                            key={idx}
                            className="flex flex-col items-center gap-1.5">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] border transition-all ${
                                isCurrent
                                  ? "bg-[#902ad1] text-white border-[#902ad1] ring-4 ring-[#902ad1]/15 scale-110"
                                  : isDone
                                    ? "bg-purple-100 text-[#902ad1] border-[#902ad1]/20"
                                    : "bg-white text-slate-400 border-slate-200"
                              }`}>
                              {isDone && !isCurrent ? (
                                <Check size={8} strokeWidth={3.5} />
                              ) : (
                                idx + 1
                              )}
                            </div>
                            <span
                              className={`text-[8.5px] tracking-tight uppercase ${isCurrent ? "text-[#902ad1]" : "text-slate-400"}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {selectedReserva.status === "cancelada" && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-[5px] text-rose-700 text-[10.5px] flex items-center gap-2">
                      <AlertTriangle size={13} />
                      <span>Este servico foi cancelado.</span>
                    </div>
                  )}
                </div>

                {/* Passageiro */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] text-slate-400 uppercase tracking-widest">
                    Passageiro
                  </h4>
                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 border border-slate-100 rounded-[5px]">
                    {selectedReserva.perfis?.foto_url ? (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-white">
                        <Image
                          src={selectedReserva.perfis.foto_url}
                          alt={selectedReserva.perfis.nome_completo}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#902ad1]/10 text-[#902ad1] flex items-center justify-center text-sm border border-[#902ad1]/15 shrink-0">
                        {getInitials(selectedReserva.perfis?.nome_completo)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-medium text-slate-800 block truncate">
                        {selectedReserva.perfis?.nome_completo || "Cliente"}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {selectedReserva.perfis?.telefone || "—"}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {selectedReserva.perfis?.email || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trajeto */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] text-slate-400 uppercase tracking-widest">
                    Trajeto
                  </h4>
                  <div className="flex flex-col gap-2 pl-2">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0 ring-2 ring-emerald-50" />
                      <span className="text-xs text-slate-700">
                        {selectedReserva.local_partida}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#902ad1] mt-1 shrink-0 ring-2 ring-purple-50" />
                      <span className="text-xs text-slate-700">
                        {selectedReserva.local_destino}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/50 border border-slate-100 p-3 rounded-[5px]">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                        Data
                      </span>
                      <span className="text-slate-700">
                        {formatDate(selectedReserva.data_recolha)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                        Hora
                      </span>
                      <span className="text-slate-700">
                        {selectedReserva.hora_recolha}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                        Passageiros
                      </span>
                      <span className="text-slate-700">
                        {selectedReserva.passageiros}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                        Malas
                      </span>
                      <span className="text-slate-700">
                        {selectedReserva.malas} Vol.
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                        Categoria
                      </span>
                      <span className="text-slate-700">
                        {getRotaLabel(selectedReserva.tipo_rota)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                        Numero Voo
                      </span>
                      <span className="text-slate-700">
                        {selectedReserva.numero_voo || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recursos */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] text-slate-400 uppercase tracking-widest">
                      Recursos
                    </h4>
                    <button
                      onClick={() =>
                        setAtribuicaoModal({
                          reservaId: selectedReserva.id,
                          motoristaId: selectedReserva.motorista_id || "",
                          viaturaId: selectedReserva.viatura_id || "",
                        })
                      }
                      className="text-[10px] text-[#902ad1] hover:underline bg-transparent border-none cursor-pointer">
                      Alterar
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 border border-slate-100 rounded-[5px] bg-slate-50/30 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <UserCheck size={13} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-slate-400 block">
                          Motorista
                        </span>
                        <span className="text-xs text-slate-700 truncate block">
                          {selectedReserva.motoristas?.perfis?.nome_completo ||
                            "Pendente"}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 border border-slate-100 rounded-[5px] bg-slate-50/30 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-50 text-[#902ad1] flex items-center justify-center shrink-0">
                        <Car size={13} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-slate-400 block">
                          Veiculo
                        </span>
                        <span className="text-xs text-slate-700 truncate block">
                          {selectedReserva.viaturas
                            ? `${selectedReserva.viaturas.marca} ${selectedReserva.viaturas.modelo}`
                            : "Pendente"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financeiro */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] text-slate-400 uppercase tracking-widest">
                    Financeiro
                  </h4>
                  <div className="border border-slate-100 rounded-[5px] p-4 bg-slate-50/20 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Valor Bruto</span>
                      <span className="font-mono">
                        {formatCurrency(selectedReserva.valor_total)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Taxa Plataforma (10%)</span>
                      <span className="font-mono text-rose-500">
                        -{formatCurrency(selectedReserva.valor_total * 0.1)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Comissao Motorista (20%)</span>
                      <span className="font-mono text-purple-600">
                        -{formatCurrency(selectedReserva.valor_total * 0.2)}
                      </span>
                    </div>
                    <div className="h-px bg-slate-100" />
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>Rendimento Liquido</span>
                      <span className="font-mono text-emerald-600">
                        {formatCurrency(selectedReserva.valor_total * 0.7)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer do Drawer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-2.5 shrink-0">
                {selectedReserva.status === "aguarda_pagamento" && (
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedReserva.id, "pago")
                    }
                    disabled={actionLoading === selectedReserva.id}
                    className="flex-1 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[5px] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all">
                    <Check size={13} /> Confirmar Pagamento
                  </button>
                )}
                {selectedReserva.status === "pago" && (
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedReserva.id, "em_andamento")
                    }
                    disabled={actionLoading === selectedReserva.id}
                    className="flex-1 py-2.5 text-xs font-semibold text-white bg-[#902ad1] hover:bg-[#7a22b3] rounded-[5px] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all">
                    <Play size={13} /> Iniciar Viagem
                  </button>
                )}
                {selectedReserva.status === "em_andamento" && (
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedReserva.id, "concluida")
                    }
                    disabled={actionLoading === selectedReserva.id}
                    className="flex-1 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-[5px] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all">
                    <CheckCircle2 size={13} /> Concluir Viagem
                  </button>
                )}
                {["aguarda_pagamento", "confirmada", "pago"].includes(
                  selectedReserva.status,
                ) && (
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedReserva.id, "cancelada")
                    }
                    disabled={actionLoading === selectedReserva.id}
                    className="py-2.5 px-4 text-xs font-semibold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-100 hover:border-rose-600 rounded-[5px] transition-all cursor-pointer shrink-0 disabled:opacity-50">
                    Cancelar
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selectedReserva.id)}
                  disabled={actionLoading === selectedReserva.id}
                  className="py-2.5 px-3 text-xs text-slate-500 hover:text-white bg-white hover:bg-rose-600 border border-slate-200 hover:border-rose-600 rounded-[5px] transition-all cursor-pointer flex items-center justify-center disabled:opacity-50">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Atribuicao */}
      {atribuicaoModal && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-md z-50 flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white rounded-[5px] border border-slate-100 shadow-2xl p-6 w-full max-w-md space-y-6 mx-4 animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                Atribuir Motorista e Frota
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Selecione os recursos a atribuir a esta reserva.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <UserCheck size={11} className="text-[#902ad1]" /> Motorista
                </label>
                <select
                  value={atribuicaoModal.motoristaId}
                  onChange={(e) =>
                    setAtribuicaoModal((prev) =>
                      prev ? { ...prev, motoristaId: e.target.value } : null,
                    )
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[4px] text-xs text-slate-700 focus:outline-none focus:border-[#902ad1]/60 cursor-pointer">
                  <option value="">Nenhum Motorista</option>
                  {motoristasDisponiveis.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.perfis?.nome_completo} ({m.perfis?.telefone || "—"})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Car size={11} className="text-[#902ad1]" /> Viatura
                </label>
                <select
                  value={atribuicaoModal.viaturaId}
                  onChange={(e) =>
                    setAtribuicaoModal((prev) =>
                      prev ? { ...prev, viaturaId: e.target.value } : null,
                    )
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[4px] text-xs text-slate-700 focus:outline-none focus:border-[#902ad1]/60 cursor-pointer">
                  <option value="">Nenhuma Viatura</option>
                  {viaturasDisponiveis.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} — {v.matricula || "S/M"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setAtribuicaoModal(null)}
                className="flex-1 py-3 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-[5px] border border-slate-200 transition-all cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={handleSaveAtribuicao}
                disabled={actionLoading != null}
                className="flex-1 py-3 text-xs font-semibold text-white bg-[#902ad1] hover:bg-[#902ad1]/90 rounded-[5px] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50">
                {actionLoading != null ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <UserCheck size={14} />
                )}
                Salvar Atribuicao
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
