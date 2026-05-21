/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CreditCard,
  Search,
  Check,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  DollarSign,
  TrendingUp,
  FileText,
  User,
  MapPin,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface PaymentLog {
  id: string;
  reserva_id: string;
  valor: number;
  metodo: string | null;
  referencia_externa: string | null;
  status: string | null; // 'pendente' | 'processando' | 'aprovado' | 'rejeitado' | 'reembolsado'
  detalhes: any | null;
  criado_em: string | null;
  atualizado_em: string | null;
  reserva?: {
    codigo: string;
    local_partida: string;
    local_destino: string;
    status: string;
    valor_total: string;
    cliente?: {
      nome_completo: string;
      email: string;
      id: string;
    } | null;
  } | null;
}

export default function HistóricoPagamentosPage() {
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [methodFilter, setMethodFilter] = useState<string>("todos");

  // Audit Modal State
  const [selectedPayment, setSelectedPayment] = useState<PaymentLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      // Nesting join: pagamentos -> reservas -> perfis
      const { data, error } = await supabase
        .from("pagamentos")
        .select(`
          id,
          reserva_id,
          valor,
          metodo,
          referencia_externa,
          status,
          detalhes,
          criado_em,
          atualizado_em,
          reserva:reservas(
            codigo,
            local_partida,
            local_destino,
            status,
            valor_total,
            cliente:perfis(id, nome_completo, email)
          )
        `)
        .order("criado_em", { ascending: false });

      if (error) throw error;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPayments((data as any) || []);
    } catch (err) {
      console.error("Erro ao carregar pagamentos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalCount = payments.length;
    const aprovados = payments.filter((p) => p.status === "aprovado");
    const pendentesCount = payments.filter((p) => p.status === "pendente" || p.status === "processando").length;
    
    const receitaTotal = aprovados.reduce((acc, curr) => acc + Number(curr.valor), 0);
    const taxaAprovacao = totalCount > 0 ? (aprovados.length / totalCount) * 100 : 100;

    return { receitaTotal, pendentesCount, taxaAprovacao };
  }, [payments]);

  // Filtered Payments List
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch =
        p.referencia_externa?.toLowerCase().includes(search.toLowerCase()) ||
        p.reserva?.codigo?.toLowerCase().includes(search.toLowerCase()) ||
        p.reserva?.cliente?.nome_completo?.toLowerCase().includes(search.toLowerCase()) ||
        p.reserva?.cliente?.email?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "todos" ||
        p.status === statusFilter;

      const matchesMethod =
        methodFilter === "todos" ||
        p.metodo?.toLowerCase() === methodFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [payments, search, statusFilter, methodFilter]);

  // Handle Payment Approval
  const handleApprovePayment = async (payment: PaymentLog) => {
    if (!confirm(`Deseja aprovar o pagamento de ${formatCurrency(payment.valor)} da reserva #${payment.reserva?.codigo}?`)) {
      return;
    }

    setProcessingAction(true);

    try {
      // 1. Update pagamentos table status to 'aprovado'
      const { error: payErr } = await supabase
        .from("pagamentos")
        .update({ status: "aprovado", atualizado_em: new Date().toISOString() })
        .eq("id", payment.id);

      if (payErr) throw payErr;

      // 2. Update reservas table status to 'pago' (or 'confirmada')
      const { error: resErr } = await supabase
        .from("reservas")
        .update({ status: "confirmada", pago_em: new Date().toISOString() })
        .eq("id", payment.reserva_id);

      if (resErr) throw resErr;

      // 3. Inject notification for the client if they exist
      if (payment.reserva?.cliente?.id) {
        await supabase.from("notificacoes").insert([
          {
            usuario_id: payment.reserva.cliente.id,
            tipo: "pagamento_confirmado",
            titulo: "Pagamento Confirmado!",
            mensagem: `O pagamento da sua reserva #${payment.reserva.codigo} foi validado e aprovado com sucesso! A sua viagem está agora confirmada.`,
            reserva_id: payment.reserva_id,
            prioridade: "HIGH",
            lida: false,
          },
        ]);
      }

      // Update state local list
      setPayments((prev) =>
        prev.map((p) =>
          p.id === payment.id
            ? {
                ...p,
                status: "aprovado",
                reserva: p.reserva ? { ...p.reserva, status: "confirmada" } : null,
              }
            : p
        )
      );

      setIsModalOpen(false);
      alert("Pagamento aprovado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao aprovar pagamento:", err);
      alert("Erro ao aprovar pagamento: " + (err.message || "Erro desconhecido"));
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle Payment Rejection
  const handleRejectPayment = async (payment: PaymentLog) => {
    if (!confirm(`Deseja rejeitar o pagamento da reserva #${payment.reserva?.codigo}?`)) {
      return;
    }

    setProcessingAction(true);

    try {
      // 1. Update pagamentos status to 'rejeitado'
      const { error: payErr } = await supabase
        .from("pagamentos")
        .update({ status: "rejeitado", atualizado_em: new Date().toISOString() })
        .eq("id", payment.id);

      if (payErr) throw payErr;

      // 2. Update reservas status back to 'aguarda_pagamento' or similar
      const { error: resErr } = await supabase
        .from("reservas")
        .update({ status: "aguarda_pagamento" })
        .eq("id", payment.reserva_id);

      if (resErr) throw resErr;

      // 3. Inject notification for the client
      if (payment.reserva?.cliente?.id) {
        await supabase.from("notificacoes").insert([
          {
            usuario_id: payment.reserva.cliente.id,
            tipo: "alerta",
            titulo: "Problema com Pagamento",
            mensagem: `O comprovativo de pagamento enviado para a reserva #${payment.reserva.codigo} foi rejeitado pela administração. Por favor, reveja os dados ou carregue um novo comprovativo.`,
            reserva_id: payment.reserva_id,
            prioridade: "URGENT",
            lida: false,
          },
        ]);
      }

      setPayments((prev) =>
        prev.map((p) =>
          p.id === payment.id
            ? {
                ...p,
                status: "rejeitado",
                reserva: p.reserva ? { ...p.reserva, status: "aguarda_pagamento" } : null,
              }
            : p
        )
      );

      setIsModalOpen(false);
      alert("Pagamento rejeitado e utilizador notificado.");
    } catch (err: any) {
      console.error("Erro ao rejeitar pagamento:", err);
      alert("Erro ao processar rejeição: " + (err.message || "Erro"));
    } finally {
      setProcessingAction(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
    }).format(val);
  };

  // Open Receipt Modal
  const handleOpenAudit = (p: PaymentLog) => {
    setSelectedPayment(p);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          <Link href="/admin/dashboard" className="hover:text-[#902ad1] transition-all">
            Painel
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">Relatórios & Contas</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">Pagamentos</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
          Histórico de Pagamentos
        </h1>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Receita Total (Aprovado)</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">{loading ? "..." : formatCurrency(stats.receitaTotal)}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Pagamentos Pendentes</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">{loading ? "..." : stats.pendentesCount}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 animate-pulse">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Taxa de Validação</span>
            <span className="text-2xl font-bold text-[#902ad1] mt-1 block">{loading ? "..." : `${stats.taxaAprovacao.toFixed(1)}%`}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-[#902ad1]/5 border border-[#902ad1]/10 flex items-center justify-center text-[#902ad1]">
            <CreditCard size={20} />
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-[10px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquise por código de reserva, cliente, email ou referência..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-semibold focus:bg-white focus:border-[#902ad1] transition-all outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-semibold focus:bg-white focus:border-[#902ad1] transition-all outline-none cursor-pointer"
          >
            <option value="todos">Todos os Estados</option>
            <option value="aprovado">Aprovado</option>
            <option value="pendente">Pendente</option>
            <option value="processando">Em Processamento</option>
            <option value="rejeitado">Rejeitado</option>
            <option value="reembolsado">Reembolsado</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-semibold focus:bg-white focus:border-[#902ad1] transition-all outline-none cursor-pointer"
          >
            <option value="todos">Todos os Métodos</option>
            <option value="transferencia">Transferência</option>
            <option value="multicaixa_express">Express / MCX</option>
            <option value="dinheiro">Dinheiro</option>
          </select>
        </div>
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-[10px] border border-slate-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#902ad1]" />
        </div>
      ) : filteredPayments.length > 0 ? (
        <div className="bg-white rounded-[10px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Reserva</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Cliente</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Rota / Trajeto</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Valor / Método</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Referência</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-bold bg-[#902ad1]/8 text-[#902ad1] px-2 py-0.5 rounded-md">
                        {p.reserva?.codigo || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-800">
                          {p.reserva?.cliente?.nome_completo || "Cliente desconhecido"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {p.reserva?.cliente?.email || ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {p.reserva ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-650 max-w-[200px] truncate">
                          <span className="truncate">{p.reserva.local_partida.split(",")[0]}</span>
                          <ArrowRight size={10} className="text-slate-400 shrink-0" />
                          <span className="truncate">{p.reserva.local_destino.split(",")[0]}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Sem viagem associada</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-800">
                          {formatCurrency(p.valor)}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          {p.metodo || "Outro"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-slate-500">
                        {p.referencia_externa || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                        p.status === "aprovado"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : p.status === "pendente" || p.status === "processando"
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : p.status === "reembolsado"
                          ? "bg-purple-50 text-purple-600 border-purple-100"
                          : "bg-rose-50 text-rose-600 border-rose-100"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          p.status === "aprovado"
                            ? "bg-emerald-500"
                            : p.status === "pendente" || p.status === "processando"
                            ? "bg-amber-500"
                            : p.status === "reembolsado"
                            ? "bg-purple-500"
                            : "bg-rose-500"
                        }`} />
                        <span>{p.status || "Pendente"}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenAudit(p)}
                        className="p-1.5 text-slate-400 hover:text-[#902ad1] hover:bg-[#902ad1]/5 rounded-lg transition-all"
                        title="Ver Comprovativo e Auditar"
                      >
                        <FileText size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[10px] border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-350 mb-4 border border-slate-100">
            <CreditCard size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Sem registos financeiros</h3>
          <p className="text-slate-400 mt-1 mb-6 text-sm max-w-xs font-medium">
            Nenhuma transação financeira foi registada ou encontrada sob os filtros atuais.
          </p>
        </div>
      )}

      {/* Audit and Receipt Modal */}
      {isModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[10px] border border-slate-100 w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">
                  Auditoria de Pagamento
                </h3>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mt-0.5 font-sans">
                  Validação de Comprovativo de Reserva #{selectedPayment.reserva?.codigo}
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto pr-2 no-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-[10px] border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Valor Recebido</span>
                  <span className="text-lg font-bold text-slate-800 mt-0.5 block">{formatCurrency(selectedPayment.valor)}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-[10px] border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Método Escolhido</span>
                  <span className="text-xs font-bold text-slate-700 mt-1.5 block uppercase tracking-wider">{selectedPayment.metodo || "Desconhecido"}</span>
                </div>
              </div>

              {/* Booking & Route details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Informações da Viagem</h4>
                <div className="p-4 border border-slate-100 rounded-[10px] space-y-3 bg-slate-50/20">
                  <div className="flex items-center gap-2.5 text-xs">
                    <User size={14} className="text-slate-400" />
                    <span className="font-semibold text-slate-800">{selectedPayment.reserva?.cliente?.nome_completo}</span>
                    <span className="text-slate-350">|</span>
                    <span className="text-slate-500 font-medium">{selectedPayment.reserva?.cliente?.email}</span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100/50">
                    <div className="flex items-start gap-2 text-xs">
                      <MapPin size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Ponto de Partida</span>
                        <span className="font-medium text-slate-700">{selectedPayment.reserva?.local_partida}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-xs pt-2">
                      <MapPin size={14} className="text-rose-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Destino</span>
                        <span className="font-medium text-slate-700">{selectedPayment.reserva?.local_destino}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Receipt details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detalhes do Comprovativo</h4>
                <div className="p-4 border border-slate-100 rounded-[10px] space-y-2.5 font-sans bg-slate-50/20 text-xs text-slate-700 font-medium leading-relaxed">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Referência Externa</span>
                    <span className="font-mono font-bold text-slate-800">{selectedPayment.referencia_externa || "Não informada"}</span>
                  </div>
                  {selectedPayment.detalhes?.comprovativo_url && (
                    <div className="pt-2">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-2">Imagem de Comprovativo</span>
                      <a
                        href={selectedPayment.detalhes.comprovativo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#902ad1] hover:underline font-bold"
                      >
                        <FileText size={14} />
                        <span>Abrir comprovativo em novo separador</span>
                      </a>
                      <div className="mt-2 border border-slate-100 rounded-[10px] overflow-hidden bg-slate-100 max-h-52">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedPayment.detalhes.comprovativo_url}
                          alt="Recibo"
                          className="object-contain w-full h-full max-h-52"
                          onError={(e) => {
                            (e.target as any).src = "https://placehold.co/600x337/e2e8f0/94a3b8?text=Recibo+PDF+ou+Doc";
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-100/50">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Data do Registo</span>
                    <span>
                      {selectedPayment.criado_em
                        ? new Date(selectedPayment.criado_em).toLocaleString("pt-AO")
                        : "Não informada"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Pending payments */}
              {(selectedPayment.status === "pendente" || selectedPayment.status === "processando") && (
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleRejectPayment(selectedPayment)}
                    disabled={processingAction}
                    className="flex-1 py-3 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-[10px] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-70"
                  >
                    <X size={14} strokeWidth={3} />
                    Rejeitar Comprovativo
                  </button>
                  <button
                    onClick={() => handleApprovePayment(selectedPayment)}
                    disabled={processingAction}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[10px] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 active:scale-95 disabled:opacity-70"
                  >
                    <Check size={14} strokeWidth={3} />
                    Validar & Aprovar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
