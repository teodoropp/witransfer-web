/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarRange,
  Search,
  Plus,
  Filter,
  Eye,
  Check,
  X,
  Trash2,
  AlertTriangle,
  Play,
  CheckCircle2,
  DollarSign,
  User,
  Car,
  Compass,
  ArrowRight,
  UserCheck,
  TrendingUp,
  MapPin,
  Clock,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
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

export default function ReservasAdminPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [motoristasDisponiveis, setMotoristasDisponiveis] = useState<Motorista[]>([]);
  const [viaturasDisponiveis, setViaturasDisponiveis] = useState<Viatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [sortBy, setSortBy] = useState("recente");

  // Filtros Avançados
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [routeTypeFilter, setRouteTypeFilter] = useState("todas");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [minPriceFilter, setMinPriceFilter] = useState("");
  const [maxPriceFilter, setMaxPriceFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("todos");
  const [vehicleFilter, setVehicleFilter] = useState("todas");

  // Modal atribuição
  const [atribuicaoModal, setAtribuicaoModal] = useState<{
    reservaId: string;
    motoristaId: string;
    viaturaId: string;
  } | null>(null);

  // Buscar dados das reservas
  const fetchReservas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reservas")
        .select(`
          *,
          perfis:cliente_id (
            id,
            nome_completo,
            email,
            telefone,
            foto_url
          ),
          viaturas:viatura_id (
            id,
            marca,
            modelo,
            matricula,
            preco_base
          ),
          motoristas:motorista_id (
            id,
            perfil_id,
            perfis:perfil_id (
              nome_completo,
              telefone
            )
          )
        `)
        .order("criado_em", { ascending: false });

      if (error) throw error;

      // Conversão e limpeza de tipos para joins de tabelas Supabase
      const formattedReservas = (data || []).map((r: any) => ({
        ...r,
        perfis: Array.isArray(r.perfis) ? r.perfis[0] : r.perfis,
        viaturas: Array.isArray(r.viaturas) ? r.viaturas[0] : r.viaturas,
        motoristas: r.motoristas ? {
          id: r.motoristas.id,
          perfil_id: r.motoristas.perfil_id,
          perfis: Array.isArray(r.motoristas.perfis) ? r.motoristas.perfis[0] : r.motoristas.perfis
        } : null
      })) as Reserva[];

      setReservas(formattedReservas);
    } catch (err) {
      console.error("Erro ao carregar reservas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar motoristas e viaturas para atribuição rápida
  const fetchRecursosDisponiveis = useCallback(async () => {
    try {
      // Motoristas
      const { data: motData } = await supabase
        .from("motoristas")
        .select(`
          id,
          perfil_id,
          perfis:perfil_id (
            nome_completo,
            telefone
          )
        `);

      const formattedMotoristas = (motData || []).map((m: any) => ({
        id: m.id,
        perfil_id: m.perfil_id,
        perfis: Array.isArray(m.perfis) ? m.perfis[0] : m.perfis
      })) as Motorista[];

      setMotoristasDisponiveis(formattedMotoristas);

      // Viaturas
      const { data: viatData } = await supabase
        .from("viaturas")
        .select("id, marca, modelo, matricula, preco_base")
        .eq("ativo", true);

      setViaturasDisponiveis(viatData || []);
    } catch (err) {
      console.error("Erro ao buscar recursos disponíveis:", err);
    }
  }, []);

  useEffect(() => {
    fetchReservas();
    fetchRecursosDisponiveis();
  }, [fetchReservas, fetchRecursosDisponiveis]);

  // Atualizar Status da Reserva
  const handleUpdateStatus = async (id: string, novoStatus: string) => {
    try {
      setActionLoading(id);
      const updates: Record<string, any> = { status: novoStatus };
      
      const nowString = new Date().toISOString();
      if (novoStatus === "pago") updates.pago_em = nowString;
      if (novoStatus === "em_andamento") updates.iniciado_em = nowString;
      if (novoStatus === "concluida") updates.concluido_em = nowString;
      if (novoStatus === "cancelada") updates.cancelado_em = nowString;

      const { error } = await supabase
        .from("reservas")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setReservas((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
      );
    } catch (err) {
      alert("Erro ao atualizar estado da reserva.");
    } finally {
      setActionLoading(null);
    }
  };

  // Salvar Atribuição de Motorista/Viatura
  const handleSaveAtribuicao = async () => {
    if (!atribuicaoModal) return;
    try {
      setActionLoading(atribuicaoModal.reservaId);
      const { error } = await supabase
        .from("reservas")
        .update({
          motorista_id: atribuicaoModal.motoristaId || null,
          viatura_id: atribuicaoModal.viaturaId || null,
          status: "confirmada" // Muda automaticamente para confirmada ao atribuir recursos
        })
        .eq("id", atribuicaoModal.reservaId);

      if (error) throw error;

      // Atualizar localmente
      const motoristaEscolhido = motoristasDisponiveis.find(m => m.id === atribuicaoModal.motoristaId) || null;
      const viaturaEscolhida = viaturasDisponiveis.find(v => v.id === atribuicaoModal.viaturaId) || null;

      setReservas((prev) =>
        prev.map((r) =>
          r.id === atribuicaoModal.reservaId
            ? {
                ...r,
                motorista_id: atribuicaoModal.motoristaId || null,
                viatura_id: atribuicaoModal.viaturaId || null,
                status: "confirmada",
                motoristas: motoristaEscolhido,
                viaturas: viaturaEscolhida
              }
            : r
        )
      );

      setAtribuicaoModal(null);
    } catch (err) {
      alert("Erro ao atribuir recursos à reserva.");
    } finally {
      setActionLoading(null);
    }
  };

  // Eliminar Reserva
  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que deseja eliminar permanentemente esta reserva? Esta ação é irreversível!")) return;
    try {
      setActionLoading(id);
      const { error } = await supabase.from("reservas").delete().eq("id", id);
      if (error) throw error;
      setReservas((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert("Erro ao eliminar a reserva da base de dados.");
    } finally {
      setActionLoading(null);
    }
  };

  // Estatísticas calculadas dinamicamente
  const stats = useMemo(() => {
    const total = reservas.length;
    const ativas = reservas.filter(r => ["confirmada", "pago", "em_andamento"].includes(r.status)).length;
    const concluidas = reservas.filter(r => r.status === "concluida").length;
    const canceladas = reservas.filter(r => r.status === "cancelada").length;
    const faturamento = reservas
      .filter(r => ["pago", "concluida", "em_andamento"].includes(r.status))
      .reduce((sum, r) => sum + r.valor_total, 0);

    return { total, ativas, concluidas, canceladas, faturamento };
  }, [reservas]);

  // Filtragem e ordenação reativa
  const filteredAndSortedReservas = useMemo(() => {
    const filtered = reservas.filter((r) => {
      const matchesSearch =
        r.codigo.toLowerCase().includes(search.toLowerCase()) ||
        r.perfis?.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
        r.local_partida.toLowerCase().includes(search.toLowerCase()) ||
        r.local_destino.toLowerCase().includes(search.toLowerCase()) ||
        r.numero_voo?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "todos" || r.status === statusFilter;

      const matchesRouteType =
        routeTypeFilter === "todas" || r.tipo_rota === routeTypeFilter;

      const matchesStartDate =
        !startDateFilter || r.data_recolha >= startDateFilter;

      const matchesEndDate =
        !endDateFilter || r.data_recolha <= endDateFilter;

      const matchesMinPrice =
        !minPriceFilter || r.valor_total >= Number(minPriceFilter);

      const matchesMaxPrice =
        !maxPriceFilter || r.valor_total <= Number(maxPriceFilter);

      const matchesDriver =
        driverFilter === "todos" ||
        (driverFilter === "sem_motorista" && !r.motorista_id) ||
        r.motorista_id === driverFilter;

      const matchesVehicle =
        vehicleFilter === "todas" ||
        (vehicleFilter === "sem_viatura" && !r.viatura_id) ||
        r.viatura_id === vehicleFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesRouteType &&
        matchesStartDate &&
        matchesEndDate &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesDriver &&
        matchesVehicle
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "valor-desc") return b.valor_total - a.valor_total;
      if (sortBy === "valor-asc") return a.valor_total - b.valor_total;
      if (sortBy === "antiga") return a.criado_em.localeCompare(b.criado_em);
      return b.criado_em.localeCompare(a.criado_em); // "recente"
    });
  }, [
    reservas,
    search,
    statusFilter,
    routeTypeFilter,
    startDateFilter,
    endDateFilter,
    minPriceFilter,
    maxPriceFilter,
    driverFilter,
    vehicleFilter,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("todos");
    setRouteTypeFilter("todas");
    setStartDateFilter("");
    setEndDateFilter("");
    setMinPriceFilter("");
    setMaxPriceFilter("");
    setDriverFilter("todos");
    setVehicleFilter("todas");
    setSortBy("recente");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aguarda_pagamento":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[10px] text-[8px] font-bold uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-150">
            Pendente Pagamento
          </span>
        );
      case "confirmada":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[10px] text-[8px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-150">
            Confirmada
          </span>
        );
      case "pago":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[10px] text-[8px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-150">
            Pago / Pronto
          </span>
        );
      case "em_andamento":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[10px] text-[8px] font-bold uppercase tracking-widest bg-purple-50 text-purple-600 border border-purple-150 animate-pulse">
            Em Viagem
          </span>
        );
      case "concluida":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[10px] text-[8px] font-bold uppercase tracking-widest bg-slate-50 text-slate-600 border border-slate-200">
            Concluída
          </span>
        );
      case "cancelada":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[10px] text-[8px] font-bold uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-150">
            Cancelada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[10px] text-[8px] font-bold uppercase tracking-widest bg-slate-50 text-slate-500 border border-slate-200">
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            <Link href="/admin/dashboard" className="hover:text-[#902ad1] transition-all">
              Painel
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Serviços</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Reservas</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
            Gestão de Reservas
          </h1>
        </div>
      </div>

      {/* Estatísticas e Resultados Gerais */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-[10px] border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <CalendarRange size={18} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Total Reservas
            </span>
            <span className="text-base font-bold text-slate-800">{stats.total}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[10px] border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-[#902ad1] rounded-xl">
            <TrendingUp size={18} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Ativas
            </span>
            <span className="text-base font-bold text-slate-800">{stats.ativas}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[10px] border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign size={18} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Faturado (Pago)
            </span>
            <span className="text-xs font-bold text-slate-800 truncate max-w-[110px]" title={formatCurrency(stats.faturamento)}>
              {formatCurrency(stats.faturamento)}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[10px] border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-slate-50 text-slate-500 rounded-xl">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Concluídas
            </span>
            <span className="text-base font-bold text-slate-800">{stats.concluidas}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[10px] border border-slate-100 shadow-sm flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl">
            <X size={18} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              Canceladas
            </span>
            <span className="text-base font-bold text-slate-800">{stats.canceladas}</span>
          </div>
        </div>
      </div>

      {/* Filtros de Pesquisa */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-[10px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar código, cliente, aeroporto, número de voo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-semibold focus:bg-white focus:border-[#902ad1] transition-all outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-2.5 rounded-[10px] text-xs font-bold transition-all flex items-center gap-1.5 border ${
                showAdvancedFilters
                  ? "bg-[#902ad1]/5 text-[#902ad1] border-[#902ad1]/20"
                  : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
              }`}
            >
              <Filter size={14} />
              Filtros Avançados
            </button>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-semibold focus:bg-white focus:border-[#902ad1] outline-none cursor-pointer"
            >
              <option value="todos">Todos os Estados</option>
              <option value="aguarda_pagamento">Aguardando Pagamento</option>
              <option value="confirmada">Confirmada</option>
              <option value="pago">Pago / Pronto</option>
              <option value="em_andamento">Em Viagem</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-semibold focus:bg-white focus:border-[#902ad1] outline-none cursor-pointer"
            >
              <option value="recente">Mais Recentes</option>
              <option value="antiga">Mais Antigas</option>
              <option value="valor-desc">Maior Valor</option>
              <option value="valor-asc">Menor Valor</option>
            </select>
          </div>
        </div>

        {/* Painel de Filtros Avançados */}
        {showAdvancedFilters && (
          <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top duration-300">
            {/* Tipo de Rota */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                Tipo de Rota
              </label>
              <select
                value={routeTypeFilter}
                onChange={(e) => setRouteTypeFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-[#902ad1] transition-all cursor-pointer"
              >
                <option value="todas">Todas as Rotas</option>
                <option value="aeroporto_cidade">Aeroporto → Cidade</option>
                <option value="cidade_aeroporto">Cidade → Aeroporto</option>
                <option value="aeroporto_aeroporto">Aeroporto → Aeroporto</option>
                <option value="taxi">Serviço Táxi</option>
              </select>
            </div>

            {/* Motorista */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                Motorista Atribuído
              </label>
              <select
                value={driverFilter}
                onChange={(e) => setDriverFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-[#902ad1] transition-all cursor-pointer"
              >
                <option value="todos">Todos os Motoristas</option>
                <option value="sem_motorista">Sem Motorista Atribuído</option>
                {motoristasDisponiveis.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.perfis?.nome_completo}
                  </option>
                ))}
              </select>
            </div>

            {/* Viatura */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                Viatura Atribuída
              </label>
              <select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-[#902ad1] transition-all cursor-pointer"
              >
                <option value="todas">Todas as Viaturas</option>
                <option value="sem_viatura">Sem Viatura Atribuída</option>
                {viaturasDisponiveis.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.marca} {v.modelo}
                  </option>
                ))}
              </select>
            </div>

            {/* Botão de Limpar */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-[10px] text-xs font-bold text-slate-650 transition-all flex items-center justify-center gap-1.5"
              >
                Limpar Filtros
              </button>
            </div>

            {/* Filtros de Data */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                Data de Recolha (Intervalo)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-medium outline-none focus:bg-white focus:border-[#902ad1] transition-all"
                  placeholder="De"
                />
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-medium outline-none focus:bg-white focus:border-[#902ad1] transition-all"
                  placeholder="Até"
                />
              </div>
            </div>

            {/* Filtros de Preço */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest ml-1">
                Intervalo de Preço (Kz)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={minPriceFilter}
                  onChange={(e) => setMinPriceFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-medium outline-none focus:bg-white focus:border-[#902ad1] transition-all"
                  placeholder="Mínimo"
                />
                <input
                  type="number"
                  value={maxPriceFilter}
                  onChange={(e) => setMaxPriceFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-medium outline-none focus:bg-white focus:border-[#902ad1] transition-all"
                  placeholder="Máximo"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Reservas */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#902ad1]/20 border-t-[#902ad1] rounded-full animate-spin" />
        </div>
      ) : filteredAndSortedReservas.length > 0 ? (
        <div className="bg-white rounded-[10px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    ID / Código
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Recolha & Viagem
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Motorista & Frota
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Valor Total
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                    Ações Administrativas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-55">
                {filteredAndSortedReservas.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Código Reserva */}
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-[#902ad1] block">
                          {r.codigo}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium block">
                          Criada: {formatDate(r.criado_em)}
                        </span>
                      </div>
                    </td>

                    {/* Cliente */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#902ad1]/5 flex items-center justify-center text-[#902ad1] text-xs font-bold">
                          {r.perfis?.nome_completo.slice(0, 2).toUpperCase() || "CL"}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">
                            {r.perfis?.nome_completo || "Utilizador WiTransfer"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            {r.perfis?.telefone || "Sem telefone"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Recolha & Viagem */}
                    <td className="px-6 py-4">
                      <div className="space-y-1.5 max-w-[200px]">
                        <div className="flex items-center gap-1.5 text-xs text-slate-650 font-bold">
                          <Clock size={12} className="text-slate-400" />
                          <span>{formatDate(r.data_recolha)} às {r.hora_recolha}</span>
                        </div>
                        <div className="text-[10px] font-medium text-slate-500 flex items-center gap-1 truncate" title={`${r.local_partida} → ${r.local_destino}`}>
                          <MapPin size={10} className="text-[#902ad1] shrink-0" />
                          <span className="truncate">{r.local_partida.slice(0, 15)}... → {r.local_destino.slice(0, 15)}...</span>
                        </div>
                      </div>
                    </td>

                    {/* Recursos Atribuídos (Motorista e Viatura) */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {r.motoristas ? (
                          <span className="text-[10px] font-semibold text-slate-700 flex items-center gap-1">
                            <UserCheck size={12} className="text-blue-500" />
                            {r.motoristas.perfis?.nome_completo}
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              setAtribuicaoModal({
                                reservaId: r.id,
                                motoristaId: r.motorista_id || "",
                                viaturaId: r.viatura_id || "",
                              })
                            }
                            className="text-[9px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                          >
                            + Atribuir Motorista
                          </button>
                        )}

                        {r.viaturas ? (
                          <span className="text-[10px] font-semibold text-[#902ad1] flex items-center gap-1">
                            <Car size={12} className="text-[#902ad1]" />
                            {r.viaturas.modelo} ({r.viaturas.matricula || "S/M"})
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              setAtribuicaoModal({
                                reservaId: r.id,
                                motoristaId: r.motorista_id || "",
                                viaturaId: r.viatura_id || "",
                              })
                            }
                            className="text-[9px] font-bold text-[#902ad1] hover:underline flex items-center gap-0.5 block"
                          >
                            + Atribuir Viatura
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Preço Reserva */}
                    <td className="px-6 py-4 font-bold text-slate-700 text-xs">
                      {formatCurrency(r.valor_total)}
                    </td>

                    {/* Estado Badge */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {getStatusBadge(r.status)}
                    </td>

                    {/* Ações Rápidas */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Ver Ficha Reserva */}
                        <Link
                          href={`/admin/reservas/${r.id}`}
                          className="p-2 text-slate-500 hover:text-[#902ad1] bg-slate-50 hover:bg-[#902ad1]/5 rounded-lg border border-slate-100 transition-all"
                          title="Ficha Detalhada"
                        >
                          <Eye size={14} />
                        </Link>

                        {/* Ações de Estado Rápidas */}
                        {r.status === "aguarda_pagamento" && (
                          <button
                            onClick={() => handleUpdateStatus(r.id, "pago")}
                            disabled={actionLoading === r.id}
                            className="p-2 text-emerald-600 hover:text-white bg-slate-50 hover:bg-emerald-500 rounded-lg border border-slate-100 hover:border-emerald-500 transition-all"
                            title="Confirmar Pagamento / Confirmar Reserva"
                          >
                            <Check size={14} />
                          </button>
                        )}

                        {r.status === "pago" && (
                          <button
                            onClick={() => handleUpdateStatus(r.id, "em_andamento")}
                            disabled={actionLoading === r.id}
                            className="p-2 text-purple-600 hover:text-white bg-slate-50 hover:bg-purple-500 rounded-lg border border-slate-100 hover:border-purple-500 transition-all"
                            title="Iniciar Viagem"
                          >
                            <Play size={14} />
                          </button>
                        )}

                        {r.status === "em_andamento" && (
                          <button
                            onClick={() => handleUpdateStatus(r.id, "concluida")}
                            disabled={actionLoading === r.id}
                            className="p-2 text-blue-600 hover:text-white bg-slate-50 hover:bg-blue-500 rounded-lg border border-slate-100 hover:border-blue-500 transition-all"
                            title="Concluir Viagem"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}

                        {/* Botão Cancelar */}
                        {["aguarda_pagamento", "confirmada", "pago"].includes(r.status) && (
                          <button
                            onClick={() => handleUpdateStatus(r.id, "cancelada")}
                            disabled={actionLoading === r.id}
                            className="p-2 text-rose-600 hover:text-white bg-slate-50 hover:bg-rose-500 rounded-lg border border-slate-100 hover:border-rose-500 transition-all"
                            title="Cancelar Reserva"
                          >
                            <X size={14} />
                          </button>
                        )}

                        {/* Botão Eliminar */}
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={actionLoading === r.id}
                          className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg border border-slate-100 transition-all"
                          title="Eliminar Reserva"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[10px] border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
            <CalendarRange size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">
            Nenhuma reserva encontrada
          </h3>
          <p className="text-slate-400 mt-1 text-sm max-w-xs text-center font-medium">
            Tente redefinir os filtros ou aguarde por novas reservas enviadas pelos utilizadores.
          </p>
        </div>
      )}

      {/* Modal de Atribuição Rápida de Recursos */}
      {atribuicaoModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white rounded-xl border border-slate-100 shadow-2xl p-6 w-full max-w-md space-y-6 mx-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Atribuir Motorista & Frota
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Selecione os recursos operacionais a atribuir a esta reserva comercial.
              </p>
            </div>

            <div className="space-y-4">
              {/* Motorista select */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest ml-1">
                  Motorista Associado
                </label>
                <select
                  value={atribuicaoModal.motoristaId}
                  onChange={(e) =>
                    setAtribuicaoModal((prev) =>
                      prev ? { ...prev, motoristaId: e.target.value } : null
                    )
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-[10px] text-xs font-semibold focus:bg-white focus:border-[#902ad1] outline-none cursor-pointer"
                >
                  <option value="">Nenhum Motorista Selecionado</option>
                  {motoristasDisponiveis.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.perfis?.nome_completo} ({m.perfis?.telefone || "Sem contacto"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Viatura select */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest ml-1">
                  Viatura / Veículo da Frota
                </label>
                <select
                  value={atribuicaoModal.viaturaId}
                  onChange={(e) =>
                    setAtribuicaoModal((prev) =>
                      prev ? { ...prev, viaturaId: e.target.value } : null
                    )
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-150 rounded-[10px] text-xs font-semibold focus:bg-white focus:border-[#902ad1] outline-none cursor-pointer"
                >
                  <option value="">Nenhuma Viatura Selecionada</option>
                  {viaturasDisponiveis.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} - Matrícula: {v.matricula || "S/M"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setAtribuicaoModal(null)}
                className="flex-1 py-3 text-xs font-bold text-slate-550 bg-slate-50 hover:bg-slate-100 rounded-[10px] border border-slate-150 transition-all active:scale-95"
              >
                Voltar / Cancelar
              </button>
              <button
                onClick={handleSaveAtribuicao}
                disabled={actionLoading != null}
                className="flex-1 py-3 text-xs font-bold text-white bg-[#902ad1] hover:bg-[#902ad1]/90 rounded-[10px] transition-all active:scale-95 shadow-md shadow-[#902ad1]/10 flex items-center justify-center gap-1.5"
              >
                {actionLoading != null ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserCheck size={14} />
                )}
                <span>Salvar Atribuição</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icone Loader local rápido
function Loader2({ className }: { className?: string }) {
  return (
    <div className={`w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin ${className}`} />
  );
}
