/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
} from "lucide-react";
import Link from "next/link";
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

  // Estados dos seletores de re-atribuição rápida
  const [motoristaSelecionado, setMotoristaSelecionado] = useState("");
  const [viaturaSelecionada, setViaturaSelecionada] = useState("");

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

      // Conversão e limpeza de tipos para joins de tabelas Supabase
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

      // Carregar os extras associados à reserva
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

  // Atualizar Status da Reserva
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

  // Salvar Atribuições de Motorista e Viatura
  const handleSaveAtribuicao = async () => {
    if (!reserva) return;
    try {
      setUpdating(true);
      
      const updates: Record<string, any> = {
        motorista_id: motoristaSelecionado || null,
        viatura_id: viaturaSelecionada || null,
      };

      // Se passou a ter motorista e veículo e estava em aguarda_pagamento/indefinido, muda para confirmada
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

  // Eliminar reserva
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aguarda_pagamento":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-150">
            Aguardando Pagamento
          </span>
        );
      case "confirmada":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-150">
            Confirmada
          </span>
        );
      case "pago":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-150">
            Pago & Pronto
          </span>
        );
      case "em_andamento":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-150 animate-pulse">
            Em Viagem
          </span>
        );
      case "concluida":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-200">
            Concluída
          </span>
        );
      case "cancelada":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-150">
            Cancelada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const getTipoRotaName = (type: string) => {
    switch (type) {
      case "aeroporto_cidade":
        return "Aeroporto → Cidade (Chegada)";
      case "cidade_aeroporto":
        return "Cidade → Aeroporto (Partida)";
      case "aeroporto_aeroporto":
        return "Aeroporto → Aeroporto (Trânsito)";
      case "taxi":
        return "Serviço Táxi Personalizado";
      default:
        return type;
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-AO") + " Kz";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "---";
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
      return "---";
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
      return "---";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-10 h-10 border-4 border-[#902ad1]/20 border-t-[#902ad1] rounded-full animate-spin" />
      </div>
    );
  }

  if (!reserva) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-100 shadow-sm max-w-lg mx-auto">
        <AlertTriangle className="text-amber-500 w-12 h-12 mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Reserva não encontrada</h3>
        <p className="text-slate-400 mt-1 text-xs text-center font-medium max-w-xs">
          O identificador da reserva não corresponde a nenhum registo ativo no sistema.
        </p>
        <Link
          href="/admin/reservas"
          className="mt-6 px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-[10px] text-xs font-bold text-slate-650 hover:bg-slate-100 transition-all flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          Voltar às Reservas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header com voltar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/reservas"
            className="p-3 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 rounded-xl border border-slate-100 shadow-sm transition-all"
            title="Voltar"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              <span>Reservas</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#902ad1]">{reserva.codigo}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight mt-1 flex items-center gap-3">
              Ficha do Serviço
              {getStatusBadge(reserva.status)}
            </h1>
          </div>
        </div>

        {/* Zona de Ações de Estado Rápidas */}
        <div className="flex items-center gap-2">
          {reserva.status === "aguarda_pagamento" && (
            <button
              onClick={() => handleUpdateStatus("pago")}
              disabled={updating}
              className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-[10px] transition-all shadow-sm flex items-center gap-1.5"
            >
              <Check size={14} />
              Confirmar Pagamento
            </button>
          )}

          {reserva.status === "pago" && (
            <button
              onClick={() => handleUpdateStatus("em_andamento")}
              disabled={updating}
              className="px-4 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-[10px] transition-all shadow-sm flex items-center gap-1.5"
            >
              <Play size={14} />
              Iniciar Viagem / Corrida
            </button>
          )}

          {reserva.status === "em_andamento" && (
            <button
              onClick={() => handleUpdateStatus("concluida")}
              disabled={updating}
              className="px-4 py-2.5 text-xs font-bold text-white bg-blue-650 hover:bg-blue-600 rounded-[10px] transition-all shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} />
              Marcar como Concluída
            </button>
          )}

          {["aguarda_pagamento", "confirmada", "pago"].includes(reserva.status) && (
            <button
              onClick={() => handleUpdateStatus("cancelada")}
              disabled={updating}
              className="px-4 py-2.5 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-500 rounded-[10px] border border-rose-100 hover:border-rose-500 transition-all shadow-sm flex items-center gap-1.5"
            >
              <X size={14} />
              Cancelar Serviço
            </button>
          )}
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Central e Informações Gerais da Viagem (2/3 de largura) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Detalhes da Rota e Viagem */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-50">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Itinerário & Dados da Rota
              </span>
              <span className="text-[10px] font-bold text-[#902ad1] bg-[#902ad1]/5 px-2.5 py-1 rounded-[10px] uppercase">
                {getTipoRotaName(reserva.tipo_rota)}
              </span>
            </div>

            {/* Rota (Partida -> Destino) */}
            <div className="relative pl-6 space-y-6">
              {/* Linha vertical decorativa conectora */}
              <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 border-l-2 border-dashed border-slate-200" />
              
              <div className="relative flex gap-3">
                <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-[3px] border-[#902ad1] bg-white z-10" />
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Local de Recolha (Partida)</span>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{reserva.local_partida}</p>
                </div>
              </div>

              <div className="relative flex gap-3">
                <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-[3px] border-emerald-500 bg-white z-10" />
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Destino Final</span>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{reserva.local_destino}</p>
                </div>
              </div>
            </div>

            {/* Datas, Horas, Passageiros, Bagagem, Voo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-50">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Data da Recolha</span>
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <CalendarRange size={12} className="text-[#902ad1]" />
                  {formatOnlyDate(reserva.data_recolha)}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Hora do Serviço</span>
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Clock size={12} className="text-[#902ad1]" />
                  {reserva.hora_recolha}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Especificações</span>
                <span className="text-xs font-bold text-slate-700 flex items-center gap-3">
                  <span className="flex items-center gap-1" title="Passageiros">
                    <Users size={12} className="text-slate-400" />
                    {reserva.passageiros}
                  </span>
                  <span className="flex items-center gap-1" title="Malas">
                    <Briefcase size={12} className="text-slate-400" />
                    {reserva.malas}
                  </span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Número do Voo</span>
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Plane size={12} className="text-slate-400" />
                  {reserva.numero_voo || "Não indicado"}
                </span>
              </div>
            </div>

            {/* Observações do Passageiro */}
            {reserva.observacoes && (
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Observações / Notas do Passageiro</span>
                <p className="text-xs text-slate-650 font-medium italic">"{reserva.observacoes}"</p>
              </div>
            )}
          </div>

          {/* Atribuição Operacional (Painel de Gestão) */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block border-b border-slate-50 pb-4">
              Atribuição Operacional & Recursos do Parceiro
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Select Motorista */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">
                  Motorista Selecionado
                </label>
                <select
                  value={motoristaSelecionado}
                  onChange={(e) => setMotoristaSelecionado(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-semibold focus:bg-white focus:border-[#902ad1] outline-none cursor-pointer"
                >
                  <option value="">Sem Motorista Atribuído</option>
                  {motoristasDisponiveis.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.perfis?.nome_completo} ({m.perfis?.telefone || "S/T"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Viatura */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">
                  Viatura / Veículo Operacional
                </label>
                <select
                  value={viaturaSelecionada}
                  onChange={(e) => setViaturaSelecionada(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-semibold focus:bg-white focus:border-[#902ad1] outline-none cursor-pointer"
                >
                  <option value="">Sem Viatura Atribuída</option>
                  {viaturasDisponiveis.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} ({v.matricula || "Sem Matrícula"})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <span className="text-[10px] text-slate-400 font-semibold max-w-xs block leading-relaxed">
                * Ao guardar, se ambos os recursos estiverem configurados e o status for pendente, o status mudará automaticamente para "Confirmada".
              </span>
              <button
                onClick={handleSaveAtribuicao}
                disabled={updating}
                className="px-5 py-3 text-xs font-bold text-white bg-[#902ad1] hover:bg-[#902ad1]/90 rounded-[10px] transition-all flex items-center gap-1.5 shadow-md shadow-[#902ad1]/10"
              >
                <UserCheck size={14} />
                Guardar Configurações
              </button>
            </div>
          </div>

          {/* Histórico / Timeline */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block border-b border-slate-50 pb-4">
              Histórico Operacional do Serviço
            </span>

            <div className="relative pl-6 space-y-6">
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-100" />

              {/* Criado em */}
              <div className="relative flex gap-3">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white" />
                <div>
                  <span className="text-[10px] font-bold text-slate-700">Reserva Submetida pelo Cliente</span>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">{formatDate(reserva.criado_em)}</span>
                </div>
              </div>

              {/* Pago em */}
              <div className="relative flex gap-3">
                <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${reserva.pago_em ? "bg-emerald-500" : "bg-slate-200"}`} />
                <div>
                  <span className={`text-[10px] font-bold ${reserva.pago_em ? "text-slate-700" : "text-slate-400"}`}>
                    Confirmação do Pagamento / Reserva
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">{formatDate(reserva.pago_em)}</span>
                </div>
              </div>

              {/* Iniciado em */}
              <div className="relative flex gap-3">
                <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${reserva.iniciado_em ? "bg-purple-500" : "bg-slate-200"}`} />
                <div>
                  <span className={`text-[10px] font-bold ${reserva.iniciado_em ? "text-slate-700" : "text-slate-400"}`}>
                    Transfer Iniciado (Em Curso)
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">{formatDate(reserva.iniciado_em)}</span>
                </div>
              </div>

              {/* Concluido em */}
              <div className="relative flex gap-3">
                <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${reserva.concluido_em ? "bg-blue-500" : "bg-slate-200"}`} />
                <div>
                  <span className={`text-[10px] font-bold ${reserva.concluido_em ? "text-slate-700" : "text-slate-400"}`}>
                    Viatura Chegou ao Destino / Serviço Concluído
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">{formatDate(reserva.concluido_em)}</span>
                </div>
              </div>

              {/* Cancelado em */}
              {reserva.status === "cancelada" && (
                <div className="relative flex gap-3">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white" />
                  <div>
                    <span className="text-[10px] font-bold text-rose-600">Serviço Cancelado Administativamente</span>
                    <span className="text-[9px] text-slate-450 font-semibold block mt-0.5">{formatDate(reserva.cancelado_em)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Painel Lateral - Clientes, Faturas, Viaturas (1/3 de largura) */}
        <div className="space-y-6">
          {/* Card Resumo Financeiro */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block border-b border-slate-50 pb-4">
              Configurações & Valores do Serviço
            </span>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400">Preço Base Viagem</span>
                <span className="font-bold text-slate-700">{formatCurrency(reserva.valor_base)}</span>
              </div>

              {reservaExtras.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-50">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Serviços Extra Adquiridos</span>
                  {reservaExtras.map((re) => (
                    <div key={re.id} className="flex items-center justify-between text-xs pl-2 border-l border-slate-100">
                      <span className="font-medium text-slate-500">
                        {re.extras?.nome} <span className="text-[10px] text-slate-400">x{re.quantidade}</span>
                      </span>
                      <span className="font-bold text-slate-600">{formatCurrency(re.preco_total)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700">Total Faturado</span>
                <span className="text-base font-extrabold text-[#902ad1]">{formatCurrency(reserva.valor_total)}</span>
              </div>
            </div>
          </div>

          {/* Card Perfil do Cliente */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block border-b border-slate-50 pb-2">
              Cliente
            </span>

            {reserva.perfis ? (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#902ad1]/5 flex items-center justify-center text-[#902ad1] text-sm font-bold shrink-0">
                  {reserva.perfis.nome_completo.slice(0, 2).toUpperCase()}
                </div>
                <div className="space-y-1 overflow-hidden">
                  <span className="text-xs font-bold text-slate-700 block truncate">
                    {reserva.perfis.nome_completo}
                  </span>
                  <span className="text-[10px] text-slate-450 font-medium block truncate">
                    E-mail: {reserva.perfis.email || "Não registado"}
                  </span>
                  <span className="text-[10px] text-slate-450 font-medium block">
                    Telefone: {reserva.perfis.telefone || "Sem contacto"}
                  </span>
                  <Link
                    href={`/admin/clientes/${reserva.perfis.id}`}
                    className="text-[9px] font-bold text-[#902ad1] hover:underline block pt-1"
                  >
                    Ver Ficha de Cliente →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-xs font-medium text-slate-400 italic">
                Sem detalhes do perfil de cliente.
              </div>
            )}
          </div>

          {/* Card Avaliação do Cliente */}
          {reserva.avaliacao !== null && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block border-b border-slate-50 pb-2">
                Feedback & Avaliação
              </span>
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Award
                      key={i}
                      size={14}
                      className={
                        i < (reserva.avaliacao || 0)
                          ? "text-amber-500 fill-amber-500"
                          : "text-slate-200"
                      }
                    />
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-1.5">
                    {reserva.avaliacao}/5 Estrelas
                  </span>
                </div>
                {reserva.comentario_avaliacao && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    "{reserva.comentario_avaliacao}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6 space-y-4">
            <span className="text-xs font-bold text-red-650 uppercase tracking-wider block border-b border-red-50 pb-2">
              Zona de Perigo
            </span>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
              As ações abaixo eliminam a reserva permanentemente da plataforma.
            </p>
            <button
              onClick={handleDelete}
              disabled={updating}
              className="w-full py-2.5 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-[10px] border border-rose-100 hover:border-rose-600 transition-all flex items-center justify-center gap-1.5 active:scale-95"
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
