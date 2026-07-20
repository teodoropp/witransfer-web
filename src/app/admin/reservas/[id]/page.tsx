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
  X,
  Play,
  Check,
  UserCheck,
  Star,
  ExternalLink,
  ChevronRight,
  Settings,
  Bell,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
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
  foto_url: string | null;
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

export default function ReservaDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [motoristasDisponiveis, setMotoristasDisponiveis] = useState<Motorista[]>([]);
  const [viaturasDisponiveis, setViaturasDisponiveis] = useState<Viatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [motoristaSelecionado, setMotoristaSelecionado] = useState("");
  const [viaturaSelecionada, setViaturaSelecionada] = useState("");

  const fetchReservaDetalhes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reservas")
        .select(`
          *,
          perfis:cliente_id (id, nome_completo, email, telefone, foto_url),
          viaturas:viatura_id (id, marca, modelo, matricula, foto_url, preco_base),
          motoristas:motorista_id (
            id, perfil_id,
            perfis:perfil_id (nome_completo, telefone)
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
        .select(`id, perfil_id, perfis:perfil_id (nome_completo, telefone)`);

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

      const { error } = await supabase.from("reservas").update(updates).eq("id", id);
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

      const { error } = await supabase.from("reservas").update(updates).eq("id", id);
      if (error) throw error;

      await fetchReservaDetalhes();
      alert("Atribuição de recursos salva com sucesso!");
    } catch (err) {
      alert("Erro ao salvar atribuição.");
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-AO") + " Kz";
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }) + " às " + date.toLocaleTimeString("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const getInitials = (name?: string | null) =>
    name
      ? name.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase()
      : "CL";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-10 h-10 border-2 border-[#902ad1]/20 border-t-[#902ad1] rounded-full animate-spin" />
      </div>
    );
  }

  if (!reserva) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[5px] border border-black/[0.22] max-w-lg mx-auto p-8 text-center">
        <AlertTriangle className="text-amber-500 w-10 h-10 mb-4" />
        <h3 className="text-base font-semibold text-slate-800">Reserva não encontrada</h3>
        <Link href="/admin/reservas" className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-[5px] text-xs text-slate-600 transition-colors">
          Voltar às Reservas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Top Title & Header Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/reservas"
            className="p-1.5 text-slate-400 hover:text-[#902ad1] transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-normal text-slate-800 tracking-tight">
            Reserva {reserva.codigo}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {reserva.status === "pago" && (
            <button
              onClick={() => handleUpdateStatus("em_andamento")}
              disabled={updating}
              className="px-4 py-2 bg-[#902ad1] hover:bg-[#7a22b3] text-white text-xs font-normal rounded-[5px] transition-colors active:scale-95 cursor-pointer"
            >
              Iniciar viagem
            </button>
          )}
          {["aguarda_pagamento", "confirmada", "pago"].includes(reserva.status) && (
            <button
              onClick={() => handleUpdateStatus("cancelada")}
              disabled={updating}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-normal rounded-[5px] transition-colors active:scale-95 cursor-pointer"
            >
              cancelar viagem
            </button>
          )}
        </div>
      </div>

      {/* 3x2 Grid for Desktop, Responsive for Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* CARD 1: Trajeto */}
        <div className="bg-white border border-black/[0.22] rounded-[5px] p-5 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-normal text-slate-800">Trajeto</span>
              <span className="text-[9px] text-slate-400">{formatDateLabel(reserva.criado_em)}</span>
            </div>
            
            {/* Timeline recolha/destino */}
            <div className="space-y-4 pl-1">
              <div className="flex gap-3">
                <div className="flex flex-col items-center mt-1">
                  <div className="w-3 h-3 rounded-full bg-[#902ad1]" />
                  <div className="w-[1px] h-8 bg-slate-200" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block uppercase">Ponto de Recolha</span>
                  <span className="text-xs text-slate-700 font-normal truncate block">{reserva.local_partida}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col items-center mt-1">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block uppercase">Destino Final</span>
                  <span className="text-xs text-slate-700 font-normal truncate block">{reserva.local_destino}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-slate-400" />
              <div className="text-[10px] text-slate-500">
                <span className="block text-slate-400">Passageiros</span>
                <span className="text-xs font-normal text-slate-700">{reserva.passageiros}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase size={14} className="text-slate-400" />
              <div className="text-[10px] text-slate-500">
                <span className="block text-slate-400">Bagagens</span>
                <span className="text-xs font-normal text-slate-700">{reserva.malas}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: Valor da Reserva */}
        <div className="bg-white border border-black/[0.22] rounded-[5px] p-5 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CalendarRange size={16} className="text-slate-400" />
              <span className="text-sm font-normal text-slate-800">Valor da Reserva</span>
            </div>
            
            <div className="text-center py-4">
              <span className="text-2xl font-normal text-slate-800 tracking-tight">
                {formatCurrency(reserva.valor_total)}
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 mt-2">
              <span className="px-3 py-1 border border-slate-200 text-[10px] text-slate-500 rounded-full font-mono">
                {reserva.codigo}
              </span>
              <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider ${
                reserva.status === "pago" || reserva.status === "concluida" 
                  ? "bg-emerald-500 text-white" 
                  : "bg-amber-500 text-white"
              }`}>
                {reserva.status === "pago" || reserva.status === "concluida" ? "Paga" : "Pendente"}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-[10px]">
            <span className="text-slate-400">Método de pagamento</span>
            <span className="text-slate-700 font-normal">Multicaixa Express</span>
          </div>
        </div>

        {/* CARD 3: Cliente */}
        <div className="bg-white border border-black/[0.22] rounded-[5px] p-5 flex flex-col justify-between items-center text-center space-y-5">
          <div className="w-full text-left flex items-center gap-2 mb-1">
            <User size={16} className="text-slate-400" />
            <span className="text-sm font-normal text-slate-800">Cliente</span>
          </div>

          <div className="flex flex-col items-center">
            {reserva.perfis?.foto_url ? (
              <div className="w-14 h-14 rounded-full overflow-hidden relative border border-slate-100 mb-2">
                <Image src={reserva.perfis.foto_url} alt="Cliente" fill sizes="56px" className="object-cover" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#902ad1]/10 text-[#902ad1] flex items-center justify-center text-sm border border-[#902ad1]/15 mb-2">
                {getInitials(reserva.perfis?.nome_completo)}
              </div>
            )}
            <span className="text-xs font-normal text-slate-700 block">{reserva.perfis?.nome_completo || "Cliente"}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{reserva.perfis?.email || "Sem e-mail"}</span>
            <span className="text-[10px] text-slate-400 block">{reserva.perfis?.telefone || "Sem telefone"}</span>
          </div>

          {reserva.perfis && (
            <Link
              href={`/admin/clientes/${reserva.perfis.id}`}
              className="w-full py-1.5 border border-slate-200 hover:border-[#902ad1]/40 text-[10px] text-slate-500 hover:text-[#902ad1] rounded-[5px] transition-colors flex items-center justify-center gap-1.5"
            >
              ver Perfil ↗
            </Link>
          )}
        </div>

        {/* CARD 4: Motorista */}
        <div className="bg-white border border-black/[0.22] rounded-[5px] p-5 flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-normal text-slate-800">Motorista</span>
          </div>

          {reserva.motoristas ? (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#902ad1]/15 text-[#902ad1] border border-[#902ad1]/20 flex items-center justify-center text-sm font-normal shrink-0">
                {getInitials(reserva.motoristas.perfis?.nome_completo)}
              </div>
              <div className="min-w-0 flex-1 space-y-1 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase">Nome</span>
                  <span className="text-slate-700 font-normal truncate block">{reserva.motoristas.perfis?.nome_completo}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase">Parceiro</span>
                  <span className="text-slate-700 font-normal truncate block">Witransfer</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase">Veículo</span>
                  <span className="text-slate-700 font-normal truncate block">
                    {reserva.viaturas ? `${reserva.viaturas.marca} ${reserva.viaturas.modelo}` : "Pendente"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-400">
              Nenhum motorista alocado para esta reserva.
            </div>
          )}

          {reserva.motoristas && (
            <Link
              href={`/admin/motoristas/${reserva.motoristas.id}`}
              className="w-full py-1.5 border border-slate-200 hover:border-[#902ad1]/40 text-[10px] text-slate-500 hover:text-[#902ad1] rounded-[5px] transition-colors flex items-center justify-center gap-1.5"
            >
              ver Perfil ↗
            </Link>
          )}
        </div>

        {/* CARD 5: Veiculo */}
        <div className="bg-white border border-black/[0.22] rounded-[5px] p-5 flex flex-col justify-between space-y-5">
          <span className="text-sm font-normal text-slate-800 block mb-1">Veiculo</span>

          {reserva.viaturas ? (
            <div className="flex flex-col items-center">
              <div className="h-16 relative w-32 flex items-center justify-center">
                <Car size={36} className="text-[#902ad1] opacity-75" />
              </div>
              <div className="w-full border-t border-slate-100 mt-3 pt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                <div>
                  <span className="text-slate-400 block">Nome</span>
                  <span className="text-slate-700 font-normal block truncate">{reserva.viaturas.marca || "Suzuki"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Modelo</span>
                  <span className="text-slate-700 font-normal block truncate">{reserva.viaturas.modelo || "Alto"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Matrícula</span>
                  <span className="text-slate-700 font-normal block truncate font-mono">{reserva.viaturas.matricula || "LD-40-47-HD"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Cor</span>
                  <span className="text-slate-700 font-normal block truncate">Azul</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Nenhuma viatura atribuída.
            </div>
          )}
        </div>

        {/* CARD 6: Atribuir Motorista */}
        <div className="bg-white border border-black/[0.22] rounded-[5px] p-5 flex flex-col justify-between space-y-4">
          <span className="text-sm font-normal text-slate-800 block">Atribuir Motorista</span>

          <div className="space-y-3 flex-1 justify-center flex flex-col">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Motorista</label>
              <select
                value={motoristaSelecionado}
                onChange={(e) => setMotoristaSelecionado(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[4px] text-xs text-slate-700 focus:outline-none focus:border-[#902ad1]/60 cursor-pointer"
              >
                <option value="">Selecionar Motorista</option>
                {motoristasDisponiveis.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.perfis?.nome_completo}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Viatura</label>
              <select
                value={viaturaSelecionada}
                onChange={(e) => setViaturaSelecionada(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[4px] text-xs text-slate-700 focus:outline-none focus:border-[#902ad1]/60 cursor-pointer"
              >
                <option value="">Selecionar Viatura</option>
                {viaturasDisponiveis.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.marca} {v.modelo} {v.matricula ? `(${v.matricula})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSaveAtribuicao}
            disabled={updating}
            className="w-full py-2 bg-[#902ad1] hover:bg-[#7a22b3] text-white text-xs font-normal rounded-[5px] transition-colors cursor-pointer mt-1"
          >
            Confirmar Atribuição
          </button>
        </div>

      </div>
    </div>
  );
}
