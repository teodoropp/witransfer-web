/** @format */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarRange,
  ArrowLeft,
  Clock,
  MapPin,
  Car,
  User,
  Plane,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Briefcase,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  X,
  Play,
  Check,
  UserCheck,
  Award,
  Activity,
  Trash2,
  Mail,
  Phone,
  ExternalLink,
  Shield,
  CreditCard,
  Package,
  Star,
  MessageSquare,
  ChevronRight,
  CircleDot,
  Navigation,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/* ─── Tipos ───────────────────────────────────────────────────── */

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
  foto_url: string | null;
  preco_base: number;
}

interface Extra {
  id: string;
  nome: string;
  preco: number;
  icone: string | null;
}

interface ReservaExtra {
  id: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  extras: Extra | null;
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
  valor_base: number;
  valor_extras: number;
  status: string;
  criado_em: string;
  numero_voo: string | null;
  passageiros: number;
  malas: number;
  observacoes: string | null;
  pago_em: string | null;
  iniciado_em: string | null;
  concluido_em: string | null;
  cancelado_em: string | null;
  avaliacao: number | null;
  comentario_avaliacao: string | null;
  perfis: Perfil | null;
  viaturas: Viatura | null;
  motoristas: Motorista | null;
}

/* ─── Componente Principal ────────────────────────────────────── */

export default function ReservaDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [reservaExtras, setReservaExtras] = useState<ReservaExtra[]>([]);
  const [motoristasDisponiveis, setMotoristasDisponiveis] = useState<Motorista[]>([]);
  const [viaturasDisponiveis, setViaturasDisponiveis] = useState<Viatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [motoristaSelecionado, setMotoristaSelecionado] = useState("");
  const [viaturaSelecionada, setViaturaSelecionada] = useState("");

  /* ─── Data Fetching ─────────────────────────────────────────── */

  const fetchReservaDetalhes = useCallback(async () => {
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
            foto_url,
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
        .eq("id", id)
        .single();

      if (error) throw error;

      const formattedReserva = {
        ...data,
        perfis: Array.isArray(data.perfis) ? data.perfis[0] : data.perfis,
        viaturas: Array.isArray(data.viaturas) ? data.viaturas[0] : data.viaturas,
        motoristas: data.motoristas ? {
          id: data.motoristas.id,
          perfil_id: data.motoristas.perfil_id,
          perfis: Array.isArray(data.motoristas.perfis) ? data.motoristas.perfis[0] : data.motoristas.perfis
        } : null
      } as Reserva;

      setReserva(formattedReserva);
      setMotoristaSelecionado(formattedReserva.motorista_id || "");
      setViaturaSelecionada(formattedReserva.viatura_id || "");

      const { data: extData, error: extError } = await supabase
        .from("reserva_extras")
        .select(`
          id,
          quantidade,
          preco_unitario,
          preco_total,
          extras:extra_id (
            id,
            nome,
            preco,
            icone
          )
        `)
        .eq("reserva_id", id);

      if (!extError && extData) {
        const formattedExtras = extData.map((e: any) => ({
          ...e,
          extras: Array.isArray(e.extras) ? e.extras[0] : e.extras
        })) as ReservaExtra[];
        setReservaExtras(formattedExtras);
      }
    } catch (err) {
      console.error("Erro ao carregar detalhes da reserva:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchRecursos = useCallback(async () => {
    try {
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

      const { data: viatData } = await supabase
        .from("viaturas")
        .select("id, marca, modelo, matricula, foto_url, preco_base")
        .eq("ativo", true);

      setViaturasDisponiveis(viatData || []);
    } catch (err) {
      console.error("Erro ao buscar recursos:", err);
    }
  }, []);

  useEffect(() => {
    fetchReservaDetalhes();
    fetchRecursos();
  }, [fetchReservaDetalhes, fetchRecursos]);

  /* ─── Ações ─────────────────────────────────────────────────── */

  const handleUpdateStatus = async (novoStatus: string) => {
    if (!reserva) return;
    try {
      setUpdating(true);
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

      setReserva((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      alert("Erro ao atualizar o estado do serviço.");
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveAtribuicao = async () => {
    if (!reserva) return;
    try {
      setUpdating(true);
      
      const updates: Record<string, any> = {
        motorista_id: motoristaSelecionado || null,
        viatura_id: viaturaSelecionada || null,
      };

      if (motoristaSelecionado && viaturaSelecionada && reserva.status === "aguarda_pagamento") {
        updates.status = "confirmada";
      }

      const { error } = await supabase
        .from("reservas")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      await fetchReservaDetalhes();
      alert("Recursos operacionais atualizados com sucesso!");
    } catch (err) {
      alert("Erro ao salvar a atribuição de recursos.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Deseja eliminar permanentemente esta reserva? Esta ação não pode ser desfeita.")) return;
    try {
      setUpdating(true);
      const { error } = await supabase.from("reservas").delete().eq("id", id);
      if (error) throw error;
      router.push("/admin/reservas");
    } catch (err) {
      alert("Erro ao eliminar a reserva.");
    } finally {
      setUpdating(false);
    }
  };

  /* ─── Utilitários de Formatação ─────────────────────────────── */

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
      aguarda_pagamento: {
        label: "Aguardando Pagamento",
        bg: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-200/60",
        dot: "bg-amber-500",
      },
      confirmada: {
        label: "Confirmada",
        bg: "bg-blue-50",
        text: "text-blue-600",
        border: "border-blue-200/60",
        dot: "bg-blue-500",
      },
      pago: {
        label: "Pago & Pronto",
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-200/60",
        dot: "bg-emerald-500",
      },
      em_andamento: {
        label: "Em Viagem",
        bg: "bg-purple-50",
        text: "text-purple-600",
        border: "border-purple-200/60",
        dot: "bg-purple-500",
      },
      concluida: {
        label: "Concluída",
        bg: "bg-slate-50",
        text: "text-slate-600",
        border: "border-slate-200/60",
        dot: "bg-slate-400",
      },
      cancelada: {
        label: "Cancelada",
        bg: "bg-rose-50",
        text: "text-rose-600",
        border: "border-rose-200/60",
        dot: "bg-rose-500",
      },
    };
    return configs[status] || { label: status, bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200/60", dot: "bg-slate-400" };
  };

  const getStatusBadge = (status: string) => {
    const cfg = getStatusConfig(status);
    return (
      <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === "em_andamento" ? "animate-pulse" : ""}`} />
        {cfg.label}
      </span>
    );
  };

  const getTipoRotaName = (type: string) => {
    switch (type) {
      case "aeroporto_cidade": return "Aeroporto → Cidade";
      case "cidade_aeroporto": return "Cidade → Aeroporto";
      case "aeroporto_aeroporto": return "Aeroporto → Aeroporto";
      case "taxi": return "Táxi Personalizado";
      default: return type;
    }
  };

  const getTipoRotaSubtitle = (type: string) => {
    switch (type) {
      case "aeroporto_cidade": return "Chegada";
      case "cidade_aeroporto": return "Partida";
      case "aeroporto_aeroporto": return "Trânsito";
      case "taxi": return "Personalizado";
      default: return "";
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-AO") + " Kz";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const formatOnlyDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  /* ─── Estados de Carregamento e Erro ────────────────────────── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="relative">
          <div className="w-12 h-12 border-[3px] border-slate-100 rounded-full" />
          <div className="absolute inset-0 w-12 h-12 border-[3px] border-transparent border-t-[#902ad1] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!reserva) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm max-w-lg mx-auto p-8">
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-5">
          <AlertTriangle className="text-amber-500 w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Reserva não encontrada</h3>
        <p className="text-slate-400 mt-2 text-xs text-center font-medium max-w-xs leading-relaxed">
          O identificador da reserva não corresponde a nenhum registo ativo no sistema.
        </p>
        <Link
          href="/admin/reservas"
          className="mt-6 px-5 py-2.5 bg-slate-50 border border-slate-150 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={14} />
          Voltar às Reservas
        </Link>
      </div>
    );
  }

  /* ─── Renderização Principal ────────────────────────────────── */

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* ─── Cabeçalho ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/reservas"
            className="p-3 text-slate-400 hover:text-slate-700 bg-white/80 hover:bg-white rounded-2xl border border-slate-100/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300"
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Reservas</span>
              <ChevronRight size={10} className="text-slate-300" />
              <span className="text-[11px] font-bold text-[#902ad1] tracking-wide">{reserva.codigo}</span>
            </div>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Painel de Serviço
              </h1>
              {getStatusBadge(reserva.status)}
            </div>
          </div>
        </div>

        {/* Ações Rápidas de Estado Superior */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {reserva.status === "aguarda_pagamento" && (
            <button
              onClick={() => handleUpdateStatus("pago")}
              disabled={updating}
              className="px-5 py-2.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-emerald-500/15 flex items-center gap-2 active:scale-[0.97]"
            >
              <Check size={14} />
              Confirmar Pagamento
            </button>
          )}

          {reserva.status === "pago" && (
            <button
              onClick={() => handleUpdateStatus("em_andamento")}
              disabled={updating}
              className="px-5 py-2.5 text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-purple-500/15 flex items-center gap-2 active:scale-[0.97]"
            >
              <Play size={14} />
              Iniciar Viagem
            </button>
          )}

          {reserva.status === "em_andamento" && (
            <button
              onClick={() => handleUpdateStatus("concluida")}
              disabled={updating}
              className="px-5 py-2.5 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-blue-500/15 flex items-center gap-2 active:scale-[0.97]"
            >
              <CheckCircle2 size={14} />
              Marcar Concluída
            </button>
          )}

          {["aguarda_pagamento", "confirmada", "pago"].includes(reserva.status) && (
            <button
              onClick={() => handleUpdateStatus("cancelada")}
              disabled={updating}
              className="px-5 py-2.5 text-[11px] font-bold text-rose-500 hover:text-white bg-white hover:bg-rose-500 rounded-2xl border border-rose-200/60 hover:border-rose-500 transition-all duration-300 shadow-sm flex items-center gap-2 active:scale-[0.97]"
            >
              <X size={14} />
              Cancelar Serviço
            </button>
          )}
        </div>
      </div>

      {/* ─── Layout Enterprise (Main 8 Colunas / Sidebar 4 Colunas) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* =================================================================== */}
        {/* COLUNA PRINCIPAL (Workspace Operacional) - 8 Colunas                */}
        {/* =================================================================== */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* 1. Trip Timeline / Journey Card */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Itinerário Principal</span>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-none flex items-center gap-2">
                  <Compass size={18} className="text-[#902ad1]" />
                  {getTipoRotaSubtitle(reserva.tipo_rota) || "Serviço de Transfer"}
                </h3>
              </div>
              <div className="sm:text-right">
                <p className="text-[13px] font-bold text-[#902ad1]">{getTipoRotaName(reserva.tipo_rota)}</p>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">{formatOnlyDate(reserva.data_recolha)} às {reserva.hora_recolha}</p>
              </div>
            </div>
            
            <div className="p-6 sm:p-8 bg-slate-50/50">
              {/* Timeline Connector Design */}
              <div className="flex gap-5">
                <div className="flex flex-col items-center mt-1.5">
                  <div className="w-5 h-5 rounded-full border-[4px] border-white shadow-[0_2px_8px_rgba(144,42,209,0.3)] bg-[#902ad1] z-10" />
                  <div className="w-0.5 flex-1 bg-slate-200 my-1 rounded-full" />
                  <div className="w-5 h-5 rounded-full border-[4px] border-white shadow-[0_2px_8px_rgba(244,63,94,0.3)] bg-rose-500 z-10" />
                </div>
                <div className="flex-1 space-y-8">
                  {/* Recolha */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-2">Ponto de Recolha</span>
                    <p className="text-[15px] font-semibold text-slate-800 tracking-tight leading-snug">{reserva.local_partida}</p>
                    {reserva.numero_voo && reserva.tipo_rota.includes('aeroporto_cidade') && (
                      <p className="text-[12px] font-medium text-slate-500 mt-2 flex items-center gap-1.5">
                        <Plane size={14} className="text-slate-400" /> Voo de Chegada: <span className="font-bold text-slate-700">{reserva.numero_voo}</span>
                      </p>
                    )}
                  </div>
                  {/* Destino */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-2">Ponto de Destino</span>
                    <p className="text-[15px] font-semibold text-slate-800 tracking-tight leading-snug">{reserva.local_destino}</p>
                  </div>
                </div>
              </div>

              {/* Ocupação */}
              <div className="mt-8 pt-6 border-t border-slate-200/60 flex flex-wrap items-center gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                    <Users size={16} className="text-slate-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-1">Passageiros</span>
                    <span className="text-[14px] font-semibold text-slate-800">{reserva.passageiros} pax</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                    <Briefcase size={16} className="text-slate-500" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-1">Bagagens</span>
                    <span className="text-[14px] font-semibold text-slate-800">{reserva.malas} itens</span>
                  </div>
                </div>
              </div>
              
              {reserva.observacoes && (
                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle size={12} /> Notas Operacionais
                  </span>
                  <p className="text-[13px] text-amber-900/80 font-medium leading-relaxed">
                    "{reserva.observacoes}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 2. Operational Control Panel */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-none flex items-center gap-2">
                  <Car size={18} className="text-blue-600" />
                  Controlo de Atribuição
                </h3>
                <p className="text-[12px] font-medium text-slate-500 mt-1.5">Despacho de veículo e condutor para a rota</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                reserva.motorista_id && reserva.viatura_id 
                  ? "bg-blue-50 text-blue-600 border border-blue-200/60" 
                  : "bg-amber-50 text-amber-600 border border-amber-200/60"
              }`}>
                {reserva.motorista_id && reserva.viatura_id ? "Equipa Escalada" : "Alocação Pendente"}
              </span>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Select Motorista */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider ml-1">Motorista</label>
                <div className="relative group">
                  <select
                    value={motoristaSelecionado}
                    onChange={(e) => setMotoristaSelecionado(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 focus:bg-white focus:border-[#902ad1]/40 focus:ring-4 focus:ring-[#902ad1]/5 outline-none cursor-pointer transition-all duration-200 appearance-none pr-10 hover:bg-white"
                  >
                    <option value="">Selecione um condutor...</option>
                    {motoristasDisponiveis.map((m) => (
                      <option key={m.id} value={m.id}>{m.perfis?.nome_completo}</option>
                    ))}
                  </select>
                  <User size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
                </div>
              </div>

              {/* Select Viatura */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider ml-1">Viatura</label>
                <div className="relative group">
                  <select
                    value={viaturaSelecionada}
                    onChange={(e) => setViaturaSelecionada(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 focus:bg-white focus:border-[#902ad1]/40 focus:ring-4 focus:ring-[#902ad1]/5 outline-none cursor-pointer transition-all duration-200 appearance-none pr-10 hover:bg-white"
                  >
                    <option value="">Selecione uma viatura...</option>
                    {viaturasDisponiveis.map((v) => (
                      <option key={v.id} value={v.id}>{v.marca} {v.modelo} {v.matricula ? `(${v.matricula})` : ""}</option>
                    ))}
                  </select>
                  <Car size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSaveAtribuicao}
                disabled={updating}
                className="px-6 py-2.5 text-[12px] font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 active:scale-[0.98]"
              >
                <Check size={14} />
                Confirmar Atribuição
              </button>
            </div>
          </div>

          {/* 3. Status & Logs Horizontal */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden p-6 transition-all duration-300 hover:shadow-md">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-none flex items-center gap-2">
                  <Activity size={18} className="text-emerald-500" />
                  Monitoramento & Logs
                </h3>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <TimelineStepSlim label="Solicitada" date={formatDate(reserva.criado_em)} active={true} color="bg-slate-500" />
              <TimelineStepSlim label="Pago" date={formatDate(reserva.pago_em)} active={!!reserva.pago_em} color="bg-emerald-500" />
              <TimelineStepSlim label="Em Viagem" date={formatDate(reserva.iniciado_em)} active={!!reserva.iniciado_em} color="bg-[#902ad1]" />
              <TimelineStepSlim label="Concluída" date={formatDate(reserva.concluido_em)} active={!!reserva.concluido_em} color="bg-blue-500" />
            </div>

            {reserva.status === "cancelada" && (
              <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between text-rose-700 text-[12px] font-bold">
                <span>Serviço Cancelado em {formatDate(reserva.cancelado_em)}</span>
                <X size={16} className="text-rose-500" />
              </div>
            )}
          </div>

        </div>

        {/* =================================================================== */}
        {/* SIDEBAR CONTEXTUAL (Ações Secundárias) - 4 Colunas                  */}
        {/* =================================================================== */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* 1. Financial Summary */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden p-6 transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                <DollarSign size={14} className="text-emerald-600" />
                Resumo Financeiro
              </h3>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                reserva.status === "aguarda_pagamento" 
                  ? "bg-amber-50 text-amber-600 border border-amber-200/60" 
                  : "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
              }`}>
                {reserva.status === "aguarda_pagamento" ? "Pendente" : "Liquidado"}
              </span>
            </div>

            <h3 className="text-[32px] font-black text-slate-900 tracking-tight mb-6 leading-none">
              {formatCurrency(reserva.valor_total)}
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-[13px]">
                <span className="font-semibold text-slate-500">Tarifa Base</span>
                <span className="font-bold text-slate-800">{formatCurrency(reserva.valor_base)}</span>
              </div>
              
              {reservaExtras.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Serviços Adicionais</span>
                  {reservaExtras.map((re) => (
                    <div key={re.id} className="flex justify-between items-center text-[12px]">
                      <span className="font-medium text-slate-600">{re.extras?.nome} <span className="text-slate-400 font-bold ml-1">×{re.quantidade}</span></span>
                      <span className="font-bold text-slate-800">{formatCurrency(re.preco_total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {reserva.status === "aguarda_pagamento" && (
              <button
                onClick={() => handleUpdateStatus("pago")}
                disabled={updating}
                className="w-full py-3 text-[12px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
              >
                <Check size={14} />
                Registar Pagamento
              </button>
            )}
          </div>

          {/* 2. Client Profile */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden p-6 transition-all duration-300 hover:shadow-md">
             <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-5 uppercase tracking-wider">
                <User size={14} className="text-blue-600" />
                Perfil de Cliente
             </h3>

             <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-black border border-slate-200 shadow-sm">
                {reserva.perfis?.nome_completo.slice(0, 2).toUpperCase() || "CL"}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-800 truncate" title={reserva.perfis?.nome_completo}>
                  {reserva.perfis?.nome_completo || "Não Registado"}
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5 truncate">{reserva.perfis?.email || "Sem e-mail"}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center gap-3 text-[12px] text-slate-700 font-semibold">
                <Phone size={14} className="text-slate-400" />
                {reserva.perfis?.telefone || "Telefone não informado"}
              </div>
            </div>

            {reserva.perfis && (
              <Link
                href={`/admin/clientes/${reserva.perfis.id}`}
                className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
              >
                <ExternalLink size={14} />
                Aceder ao CRM
              </Link>
            )}
          </div>

          {/* 3. Administration & Feedback */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden p-6 transition-all duration-300 hover:shadow-md">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-5 uppercase tracking-wider">
                <Shield size={14} className="text-rose-600" />
                Administração
            </h3>

            {reserva.avaliacao !== null ? (
              <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-2">Feedback da Viagem</span>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className={i < (reserva.avaliacao || 0) ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                  ))}
                  <span className="text-[13px] font-bold text-slate-800 ml-1">{reserva.avaliacao}/5</span>
                </div>
                {reserva.comentario_avaliacao && (
                  <p className="text-[12px] text-slate-600 italic font-medium mt-1">"{reserva.comentario_avaliacao}"</p>
                )}
              </div>
            ) : (
              <div className="mb-6 py-4 text-center bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 block mb-0.5">Sem Feedback</span>
                <p className="text-[10px] text-slate-400 font-semibold">O passageiro não avaliou o serviço.</p>
              </div>
            )}

            <button
              onClick={handleDelete}
              disabled={updating}
              className="w-full py-2.5 text-[12px] font-bold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
            >
              <Trash2 size={14} />
              Eliminar Permanentemente
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─── Sub-Componente Horizontal de Timeline ─────── */

function TimelineStepSlim({
  label,
  date,
  active,
  color,
  isError = false,
}: {
  label: string;
  date: string;
  active: boolean;
  color: string;
  isError?: boolean;
}) {
  return (
    <div className="relative flex items-start gap-3 pl-5 py-2">
      {/* Ponto Indicador */}
      <div
        className={`absolute left-[-2px] top-[14px] w-[8px] h-[8px] rounded-full border-[2px] border-white z-10 transition-colors duration-300 shadow-sm ${
          active ? color : "bg-slate-200"
        }`}
      />
      <div className="min-w-0">
        <span
          className={`text-[12px] font-bold block truncate ${
            isError ? "text-rose-600" : active ? "text-slate-800" : "text-slate-400"
          }`}
        >
          {label}
        </span>
        <span className="text-[10px] text-slate-400 font-semibold block leading-none mt-1">
          {date}
        </span>
      </div>
    </div>
  );
}
