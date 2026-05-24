/** @format */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Banknote,
  Send,
  Building,
  Plus,
  RefreshCw,
  Info,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Transacao {
  id: string;
  tipo: "saque" | "ganho";
  valor: number;
  data: string;
  status: "pendente" | "concluido" | "rejeitado";
  banco?: string;
  iban?: string;
  reserva_codigo?: string;
}

const BANCOS_ANGOLA = [
  "BAI - Banco Angolano de Investimentos",
  "BFA - Banco de Fomento Angola",
  "BIC - Banco BIC",
  "BPC - Banco de Poupança e Crédito",
  "SOL - Banco Sol",
  "ATLANTICO - Banco Millennium Atlântico",
  "KEVE - Banco Keve",
  "YETU - Banco Yetu",
];

function formatKz(value: number): string {
  return `${value.toLocaleString("pt-AO")} Kz`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("pt-PT", {
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

export default function CarteiraParceiroPage() {
  const [loading, setLoading] = useState(true);
  const [saldoDisponivel, setSaldoDisponivel] = useState(0);
  const [saldoPendente, setSaldoPendente] = useState(0);
  const [totalSacado, setTotalSacado] = useState(0);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  // Modal de saque
  const [modalSaque, setModalSaque] = useState(false);
  const [valorSaque, setValorSaque] = useState("");
  const [bancoSaque, setBancoSaque] = useState(BANCOS_ANGOLA[0]);
  const [ibanSaque, setIbanSaque] = useState("AO06.0000.");
  const [solicitando, setSolicitando] = useState(false);
  const [saqueSucesso, setSaqueSucesso] = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        setSaldoDisponivel(0);
        setSaldoPendente(0);
        setLoading(false);
        return;
      }

      // Buscar todas as reservas para calcular saldos
      const { data: reservasData, error: rError } = await supabase
        .from("reservas")
        .select("valor_total, status, criado_em, codigo")
        .in("viatura_id", viaturaIds);

      if (rError) throw rError;

      // Calcular ganhos do parceiro (10% comissão desconto)
      const ganho = (val: number) => val / 1.1;

      let disponivel = 0;
      let pendente = 0;
      const ganhosTransacoes: Transacao[] = [];

      (reservasData || []).forEach((r) => {
        const valLíquido = ganho(Number(r.valor_total) || 0);
        if (r.status === "concluida" || r.status === "pago") {
          disponivel += valLíquido;
          // Adicionar no histórico
          ganhosTransacoes.push({
            id: `g-${r.codigo || r.criado_em}`,
            tipo: "ganho",
            valor: valLíquido,
            data: r.criado_em,
            status: "concluido",
            reserva_codigo: r.codigo || "Reserva",
          });
        } else if (r.status === "em_andamento" || r.status === "aguarda_pagamento") {
          pendente += valLíquido;
        }
      });

      // Carregar saques simulados do localStorage para persistência local
      const saquesSalvosStr = localStorage.getItem(`saques_${parceiroData.id}`);
      const saquesSalvos: Transacao[] = saquesSalvosStr ? JSON.parse(saquesSalvosStr) : [];

      let sacado = 0;
      saquesSalvos.forEach((s) => {
        if (s.status === "concluido" || s.status === "pendente") {
          disponivel -= s.valor; // Deduzir do saldo
          if (s.status === "concluido") {
            sacado += s.valor;
          }
        }
      });

      // Combinar e ordenar todas as transações por data decrescente
      const todasTransacoes = [...ganhosTransacoes, ...saquesSalvos].sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      );

      setSaldoDisponivel(Math.max(0, disponivel));
      setSaldoPendente(pendente);
      setTotalSacado(sacado);
      setTransacoes(todasTransacoes);
    } catch (err) {
      console.error("Erro ao carregar carteira:", err);
      setErro("Não foi possível carregar os saldos e transações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleSolicitarSaque = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseFloat(valorSaque);

    if (isNaN(valor) || valor <= 0) {
      alert("Insira um valor válido de saque.");
      return;
    }

    if (valor > saldoDisponivel) {
      alert("Saldo disponível insuficiente para este saque.");
      return;
    }

    if (ibanSaque.replace(/[^A-Z0-9]/g, "").length < 21) {
      alert("Insira um IBAN válido contendo a estrutura angolana (mínimo de 21 caracteres úteis).");
      return;
    }

    setSolicitando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: parceiroData } = await supabase
        .from("parceiros")
        .select("id")
        .eq("usuario_id", user.id)
        .single();

      if (!parceiroData) return;

      // Criar nova transação de saque
      const novoSaque: Transacao = {
        id: `s-${Date.now()}`,
        tipo: "saque",
        valor,
        data: new Date().toISOString(),
        status: "pendente",
        banco: bancoSaque,
        iban: ibanSaque,
      };

      // Guardar no localStorage
      const saquesSalvosStr = localStorage.getItem(`saques_${parceiroData.id}`);
      const saquesSalvos: Transacao[] = saquesSalvosStr ? JSON.parse(saquesSalvosStr) : [];
      saquesSalvos.push(novoSaque);
      localStorage.setItem(`saques_${parceiroData.id}`, JSON.stringify(saquesSalvos));

      setSaqueSucesso(true);
      setTimeout(() => {
        setSaqueSucesso(false);
        setModalSaque(false);
        setValorSaque("");
        setIbanSaque("AO06.0000.");
        carregarDados();
      }, 1500);
    } catch (err) {
      alert("Erro ao registar solicitação de saque.");
    } finally {
      setSolicitando(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
            <Link href="/parceiro/dashboard" className="hover:text-[#902ad1] transition-all">
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Carteira</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
            Saldo e Carteira
          </h1>
        </div>

        <button
          onClick={() => carregarDados()}
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-600 px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold transition-all active:scale-95"
        >
          <RefreshCw size={13} />
          Recarregar dados
        </button>
      </div>

      {/* Grid de Saldos Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Saldo Disponível */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#902ad1] via-[#7b22b8] to-[#5c1a8a] text-white p-6 shadow-xl shadow-[#902ad1]/25 flex flex-col justify-between min-h-[160px]">
          {/* Decoração */}
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/5 blur-lg" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5 blur-lg" />

          <div className="relative">
            <div className="flex items-center gap-2 opacity-70">
              <Wallet size={14} />
              <span className="text-[10px] font-semibold uppercase tracking-widest">Saldo Disponível</span>
            </div>
            <p className="text-3xl font-semibold mt-3 leading-none tracking-tight">
              {loading ? "—" : formatKz(saldoDisponivel)}
            </p>
          </div>

          <div className="relative flex items-center justify-between mt-4">
            <span className="text-[10px] text-white/50 font-medium">Líquido (Pós comissão)</span>
            <button
              onClick={() => saldoDisponivel > 0 && setModalSaque(true)}
              disabled={loading || saldoDisponivel <= 0}
              className={`inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#902ad1] hover:bg-white/95 transition-all text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shrink-0`}
            >
              <ArrowUpRight size={13} strokeWidth={2.5} />
              Solicitar Saque
            </button>
          </div>
        </div>

        {/* Card 2: Saldo Pendente */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between min-h-[160px] hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2 text-slate-400 font-semibold">
              <Clock size={14} />
              <span className="text-[10px] font-semibold uppercase tracking-widest">Saldo Pendente</span>
            </div>
            <p className="text-2xl font-semibold text-slate-800 mt-4 leading-none tracking-tight">
              {loading ? "—" : formatKz(saldoPendente)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 p-2 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl text-[10px] font-medium">
            <Info size={11} className="shrink-0" />
            <span>Viagens em curso ou aguardando pagamento</span>
          </div>
        </div>

        {/* Card 3: Total Sacado */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between min-h-[160px] hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2 text-slate-400 font-semibold">
              <Banknote size={14} />
              <span className="text-[10px] font-semibold uppercase tracking-widest">Total Sacado</span>
            </div>
            <p className="text-2xl font-semibold text-slate-800 mt-4 leading-none tracking-tight">
              {loading ? "—" : formatKz(totalSacado)}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
            Montante de pagamentos transferido com sucesso para as suas contas bancárias registadas.
          </p>
        </div>
      </div>

      {/* Histórico de Transações */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-slate-700 uppercase tracking-widest">
            Histórico da Carteira
          </h2>
          <span className="text-[11px] font-medium text-slate-400">
            {transacoes.length} transações
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#902ad1]" />
          </div>
        ) : transacoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 text-slate-300 border border-slate-100">
              <Wallet size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-600">Sem transações registadas</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">As suas receitas de viagens e saques aparecerão aqui.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  <th className="py-3 px-5">Transação</th>
                  <th className="py-3 px-5">Data / Hora</th>
                  <th className="py-3 px-5">Detalhe</th>
                  <th className="py-3 px-5 text-right">Valor</th>
                  <th className="py-3 px-5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transacoes.map((t) => (
                  <tr
                    key={t.id}
                    className="text-[12px] font-semibold text-slate-700 hover:bg-slate-50/50 hover:shadow-[inset_3px_0_0_0_#902ad1] transition-all duration-150"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                            t.tipo === "saque"
                              ? "bg-rose-50 border-rose-100 text-rose-500"
                              : "bg-emerald-50 border-emerald-100 text-emerald-600"
                          }`}
                        >
                          {t.tipo === "saque" ? <Send size={12} /> : <Plus size={12} />}
                        </div>
                        <span className="font-semibold capitalize">
                          {t.tipo === "saque" ? "Levantamento / Saque" : "Ganho de Viagem"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap text-slate-500">
                      {formatDate(t.data)}
                    </td>
                    <td className="py-3.5 px-5 max-w-[220px]">
                      {t.tipo === "saque" ? (
                        <div className="space-y-0.5">
                          <p className="text-slate-600 font-semibold truncate flex items-center gap-1">
                            <Building size={11} className="text-slate-400" />
                            {t.banco}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono font-semibold truncate">
                            IBAN: {t.iban}
                          </p>
                        </div>
                      ) : (
                        <p className="text-slate-500 font-medium">
                          Faturamento da viagem código{" "}
                          <span className="font-semibold text-[#902ad1]">
                            {t.reserva_codigo}
                          </span>
                        </p>
                      )}
                    </td>
                    <td
                      className={`py-3.5 px-5 text-right font-semibold ${
                        t.tipo === "saque" ? "text-rose-500" : "text-emerald-600"
                      }`}
                    >
                      {t.tipo === "saque" ? "-" : "+"} {formatKz(t.valor)}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider border ${
                          t.status === "concluido"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200/60"
                            : t.status === "pendente"
                            ? "bg-amber-50 text-amber-600 border-amber-200/60"
                            : "bg-rose-50 text-rose-500 border-rose-200/60"
                        }`}
                      >
                        {t.status === "concluido" ? (
                          <CheckCircle2 size={10} />
                        ) : t.status === "pendente" ? (
                          <Clock size={10} />
                        ) : (
                          <XCircle size={10} />
                        )}
                        {t.status === "concluido" ? "Concluído" : t.status === "pendente" ? "Pendente" : "Rejeitado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Levantamento */}
      {modalSaque && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-[#902ad1] uppercase tracking-widest leading-none">Levantamento</p>
                <h3 className="text-base font-semibold text-slate-800 mt-1.5">Solicitar Saque de Saldo</h3>
              </div>
              <button
                onClick={() => !solicitando && setModalSaque(false)}
                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
              >
                <XCircle size={16} />
              </button>
            </div>

            {/* Form */}
            {saqueSucesso ? (
              <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-base font-semibold text-slate-800">Saque Solicitado!</h4>
                <p className="text-xs text-slate-400 font-medium">
                  A sua solicitação foi registada com sucesso e será processada pela equipa administrativa num prazo de 24h.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSolicitarSaque} className="p-5 space-y-4">
                <div className="bg-purple-50/50 p-4 border border-[#902ad1]/10 rounded-xl">
                  <span className="text-[10px] font-semibold text-[#902ad1]/60 uppercase tracking-widest block">Saldo Disponível</span>
                  <span className="text-2xl font-semibold text-[#902ad1] mt-1 block">{formatKz(saldoDisponivel)}</span>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Valor a Sacar (Kz) *</label>
                  <input
                    type="number"
                    value={valorSaque}
                    onChange={(e) => setValorSaque(e.target.value)}
                    placeholder="Ex: 50000"
                    min={100}
                    max={saldoDisponivel}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#902ad1]/20 focus:border-[#902ad1]/80 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Banco de Destino *</label>
                  <select
                    value={bancoSaque}
                    onChange={(e) => setBancoSaque(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#902ad1]/20 focus:border-[#902ad1]/80 transition-all cursor-pointer"
                  >
                    {BANCOS_ANGOLA.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">IBAN Angolano *</label>
                  <input
                    type="text"
                    value={ibanSaque}
                    onChange={(e) => setIbanSaque(e.target.value)}
                    placeholder="AO06.0000.XXXX.XXXX.XXXX.XXXX.X"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#902ad1]/20 focus:border-[#902ad1]/80 transition-all font-mono font-semibold"
                    required
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalSaque(false)}
                    disabled={solicitando}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={solicitando || !valorSaque || parseFloat(valorSaque) <= 0}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#902ad1] hover:bg-[#7b22b8] text-white rounded-xl text-xs font-semibold uppercase tracking-wide transition-all shadow-[0_4px_12px_rgba(144,42,209,0.3)] disabled:opacity-50"
                  >
                    {solicitando ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Send size={12} />
                    )}
                    Solicitar Saque
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
