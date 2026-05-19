/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Layers,
  Wallet,
  Percent,
  Calendar,
  XCircle,
  Plus,
  Trash2,
  ChevronRight,
  ShieldAlert,
  Building,
  Grid as GridIcon,
  HelpCircle,
  Eye,
  Check,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Interfaces
interface PagamentoItem {
  id: string;
  reserva_id: string;
  reserva_codigo: string;
  valor: number;
  valor_parceiro: number;
  valor_comissao: number;
  metodo: string | null;
  status: string;
  criado_em: string;
  cliente_nome: string;
  parceiro_id: string | null;
  parceiro_nome: string;
  comissao_percentual: number;
}

interface DadosFinanceiros {
  receitaHoje: number;
  receitaSemana: number;
  receitaMes: number;
  totalReservas: number;
  mediaReserva: number;
  crescimento: number;
}

interface ParceiroFinanceiro {
  id: string;
  nome: string;
  comissaoPercentual: number;
  totalFaturado: number;
  totalReservas: number;
  valorComissao: number;
  valorParceiro: number;
}

interface RegraComissao {
  id: string;
  entidade_tipo: string;
  entidade_id: string | null;
  percentual_comissao: number;
  taxa_servico_plataforma: number;
  prioridade: number;
  mostrar_detalhe_cliente: boolean;
  ativo: boolean;
  criado_em: string;
}

export default function FinanceiroGeralPage() {
  const [dados, setDados] = useState<DadosFinanceiros>({
    receitaHoje: 0,
    receitaSemana: 0,
    receitaMes: 0,
    totalReservas: 0,
    mediaReserva: 0,
    crescimento: 0,
  });

  const [parceiros, setParceiros] = useState<ParceiroFinanceiro[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoItem[]>([]);
  const [regras, setRegras] = useState<RegraComissao[]>([]);
  const [carteiraPlataforma, setCarteiraPlataforma] = useState({
    contabil: 0,
    disponivel: 0,
  });

  // Auxiliares para o modal de regras
  const [listaParceiros, setListaParceiros] = useState<{ id: string; nome: string }[]>([]);
  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>([]);

  // Estados de controlo
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<"geral" | "transacoes" | "parceiros" | "regras">("geral");
  const [dataSelecionada, setDataSelecionada] = useState<string>("");
  const [parceiroFiltroId, setParceiroFiltroId] = useState<string | null>(null);

  // Modais
  const [modalDetalhesVisivel, setModalDetalhesVisivel] = useState(false);
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState<PagamentoItem | null>(null);
  
  const [modalRegraVisivel, setModalRegraVisivel] = useState(false);
  const [salvandoRegra, setSalvandoRegra] = useState(false);
  const [novaRegra, setNovaRegra] = useState({
    entidade_tipo: "global",
    entidade_id: "",
    percentual_comissao: "20",
    taxa_servico_plataforma: "5",
    prioridade: "0",
    mostrar_detalhe_cliente: false,
  });

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const hoje = new Date();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - 7);
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      // 1. Carregar Reservas para Estatísticas gerais
      const { data: reservas, error: reservasError } = await supabase
        .from("reservas")
        .select("valor_total, valor_base, valor_taxa, valor_taxa_servico, criado_em, status")
        .in("status", ["confirmada", "em_andamento", "concluida", "pago"]);

      if (reservasError) throw reservasError;

      const hojeStr = hoje.toISOString().split("T")[0];
      const reservasArr = (reservas as any[]) || [];

      // Cálculo de Receita (Markup + Taxa de Serviço)
      let recHoje = reservasArr
        .filter((r) => r.criado_em?.startsWith(hojeStr))
        .reduce((acc, r) => acc + (r.valor_taxa || 0) + (r.valor_taxa_servico || 0), 0);
      let recSemana = reservasArr
        .filter((r) => new Date(r.criado_em) >= inicioSemana)
        .reduce((acc, r) => acc + (r.valor_taxa || 0) + (r.valor_taxa_servico || 0), 0);
      let recMes = reservasArr
        .filter((r) => new Date(r.criado_em) >= inicioMes)
        .reduce((acc, r) => acc + (r.valor_taxa || 0) + (r.valor_taxa_servico || 0), 0);
      let totalReservas = reservasArr.length;
      let mediaReserva = totalReservas > 0 ? recMes / totalReservas : 0;

      // Se houver filtro de data selecionada
      if (dataSelecionada) {
        const resData = reservasArr.filter((r) => r.criado_em?.startsWith(dataSelecionada));
        const recTotal = resData.reduce(
          (acc, r) => acc + (r.valor_taxa || 0) + (r.valor_taxa_servico || 0),
          0
        );

        recHoje = recTotal;
        recSemana = recTotal;
        recMes = recTotal;
        totalReservas = resData.length;
        mediaReserva = resData.length > 0 ? recTotal / resData.length : 0;
      }

      setDados({
        receitaHoje: recHoje,
        receitaSemana: recSemana,
        receitaMes: recMes,
        totalReservas,
        mediaReserva,
        crescimento: 0, // Apenas dados reais da BD
      });

      // 2. Buscar Saldo da Carteira da Plataforma
      const { data: carteiraPlat } = await supabase
        .from("carteiras")
        .select("saldo_contabil, saldo_disponivel")
        .eq("tipo", "plataforma")
        .single();

      if (carteiraPlat) {
        setCarteiraPlataforma({
          contabil: Number(carteiraPlat.saldo_contabil || 0),
          disponivel: Number(carteiraPlat.saldo_disponivel || 0),
        });
      }

      // 3. Buscar Regras de Comissão
      const { data: rData } = await supabase
        .from("configuracoes_comissao")
        .select("*")
        .order("prioridade", { ascending: false });
      setRegras(rData || []);

      // 4. Buscar lista de parceiros e categorias para dropdowns
      const { data: pData } = await supabase.from("parceiros").select("id, nome");
      setListaParceiros(pData || []);

      const { data: cData } = await supabase.from("categorias").select("id, nome");
      setCategorias(cData || []);

      // 5. Buscar parceiros e calcular ganhos dinamicamente a partir da BD
      const { data: parceirosData } = await supabase
        .from("parceiros")
        .select("id, nome, comissao_percentual, taxa_servico_plataforma");

      let queryParceiros = supabase.from("reservas").select(`
        valor_base,
        valor_taxa,
        valor_taxa_servico,
        status,
        criado_em,
        viatura_id,
        viaturas(parceiro_id)
      `);

      if (dataSelecionada) {
        queryParceiros = queryParceiros
          .gte("criado_em", `${dataSelecionada}T00:00:00`)
          .lte("criado_em", `${dataSelecionada}T23:59:59`);
      }

      const { data: reservasComViatura } = await queryParceiros;
      const resViatArr = (reservasComViatura as any[]) || [];

      const parceirosArr: ParceiroFinanceiro[] = (parceirosData || [])
        .map((p: any) => {
          const reservasParceiro = resViatArr.filter(
            (r: any) =>
              (r.viaturas?.parceiro_id === p.id || r.parceiro_id === p.id) &&
              ["confirmada", "em_andamento", "concluida", "pago"].includes(r.status)
          );

          const valorParceiro = reservasParceiro.reduce(
            (acc: number, r: any) => acc + (Number(r.valor_base) || 0) - (Number(r.valor_taxa_servico) || 0),
            0
          );
          const valorComissao = reservasParceiro.reduce(
            (acc: number, r: any) => acc + (Number(r.valor_taxa) || 0) + (Number(r.valor_taxa_servico) || 0),
            0
          );
          const totalFaturado = valorParceiro + valorComissao;

          return {
            id: p.id,
            nome: p.nome,
            comissaoPercentual: p.comissao_percentual || 0,
            totalFaturado,
            totalReservas: reservasParceiro.length,
            valorComissao,
            valorParceiro,
          };
        })
        .sort((a, b) => b.totalFaturado - a.totalFaturado);

      setParceiros(parceirosArr);

      // Se houver filtro de parceiro ativo
      if (parceiroFiltroId) {
        const resP = resViatArr.filter(
          (r) =>
            (r.viaturas?.parceiro_id === parceiroFiltroId || r.parceiro_id === parceiroFiltroId) &&
            ["confirmada", "em_andamento", "concluida", "pago"].includes(r.status)
        );

        let recH, recS, recM;
        if (dataSelecionada) {
          recH = recS = recM = resP.reduce((acc, r) => acc + (r.valor_taxa || 0) + (r.valor_taxa_servico || 0), 0);
        } else {
          recH = resP
            .filter((r) => r.criado_em?.startsWith(hojeStr))
            .reduce((acc, r) => acc + (r.valor_taxa || 0) + (r.valor_taxa_servico || 0), 0);
          recS = resP
            .filter((r) => new Date(r.criado_em) >= inicioSemana)
            .reduce((acc, r) => acc + (r.valor_taxa || 0) + (r.valor_taxa_servico || 0), 0);
          recM = resP
            .filter((r) => new Date(r.criado_em) >= inicioMes)
            .reduce((acc, r) => acc + (r.valor_taxa || 0) + (r.valor_taxa_servico || 0), 0);
        }

        setDados({
          receitaHoje: recH,
          receitaSemana: recS,
          receitaMes: recM,
          totalReservas: resP.length,
          mediaReserva: resP.length > 0 ? recM / resP.length : 0,
          crescimento: 0,
        });
      }

      // 6. Buscar pagamentos recentes para a aba transações
      const { data: pagData } = await supabase
        .from("pagamentos")
        .select(`
          *,
          reservas(
            id, 
            codigo, 
            criado_em,
            valor_base,
            valor_taxa,
            valor_taxa_servico,
            perfis:cliente_id(nome_completo),
            viaturas(parceiros:parceiro_id(id, nome, comissao_percentual, taxa_servico_plataforma))
          )
        `)
        .order("criado_em", { ascending: false })
        .limit(100);

      if (pagData) {
        const pagLista = (pagData as any[]).map((p) => {
          const res = p.reservas || {};
          const resPerfis = Array.isArray(res.perfis) ? res.perfis[0] : res.perfis;
          const resViaturas = Array.isArray(res.viaturas) ? res.viaturas[0] : res.viaturas;
          const resParceiros = resViaturas ? (Array.isArray(resViaturas.parceiros) ? resViaturas.parceiros[0] : resViaturas.parceiros) : null;

          const valorTotal = Number(p.valor || 0);
          const valorBase = Number(res.valor_base || 0);
          const valorTaxa = Number(res.valor_taxa || 0);
          const valorTaxaServico = Number(res.valor_taxa_servico || 0);
          const valorBaseLiquido = valorBase - valorTaxaServico;

          return {
            id: p.id,
            reserva_id: p.reserva_id,
            reserva_codigo: res.codigo || "N/A",
            valor: valorTotal,
            valor_parceiro: valorBaseLiquido,
            valor_comissao: valorTaxa + valorTaxaServico,
            metodo: p.metodo,
            status: p.status,
            criado_em: p.criado_em || res.criado_em,
            cliente_nome: resPerfis?.nome_completo || "Cliente WiTransfer",
            parceiro_id: resParceiros?.id || null,
            parceiro_nome: resParceiros?.nome || "Plataforma WiTransfer",
            comissao_percentual: Math.round(((valorTaxa + valorTaxaServico) / (valorBase || 1)) * 100) || 0,
          };
        });
        setPagamentos(pagLista);
      }

    } catch (err) {
      console.error("Erro geral na carga financeira:", err);
    } finally {
      setLoading(false);
    }
  }, [dataSelecionada, parceiroFiltroId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleSalvarRegra = async () => {
    try {
      setSalvandoRegra(true);
      const payload: any = {
        entidade_tipo: novaRegra.entidade_tipo,
        percentual_comissao: parseFloat(novaRegra.percentual_comissao),
        taxa_servico_plataforma: parseFloat(novaRegra.taxa_servico_plataforma),
        prioridade: Number(novaRegra.prioridade),
        mostrar_detalhe_cliente: novaRegra.mostrar_detalhe_cliente,
        ativo: true,
      };

      if (novaRegra.entidade_tipo !== "global") {
        if (!novaRegra.entidade_id) {
          alert("Selecione o parceiro ou categoria antes de salvar!");
          setSalvandoRegra(false);
          return;
        }
        payload.entidade_id = novaRegra.entidade_id;
      }

      const { error } = await supabase.from("configuracoes_comissao").insert(payload);
      if (error) throw error;

      alert("Regra de comissão guardada com sucesso!");
      setModalRegraVisivel(false);
      setNovaRegra({
        entidade_tipo: "global",
        entidade_id: "",
        percentual_comissao: "20",
        taxa_servico_plataforma: "5",
        prioridade: "0",
        mostrar_detalhe_cliente: false,
      });
      carregarDados();
    } catch (err: any) {
      alert("Falha ao guardar regra: " + (err.message || err));
    } finally {
      setSalvandoRegra(false);
    }
  };

  const handleDeletarRegra = async (id: string) => {
    if (!confirm("Deseja realmente remover permanentemente esta regra de comissão do sistema?")) return;

    try {
      const { error } = await supabase.from("configuracoes_comissao").delete().eq("id", id);
      if (error) throw error;
      alert("Regra removida com sucesso!");
      carregarDados();
    } catch (err: any) {
      alert("Erro ao remover regra: " + (err.message || err));
    }
  };

  const handleAprovarPagamento = async (item: PagamentoItem) => {
    if (item.status === "pago" || item.status === "aprovado") return;

    if (
      !confirm(
        `Confirma o recebimento físico do pagamento de ${item.valor.toLocaleString()} Kz referente à Reserva #${
          item.reserva_codigo
        }?`
      )
    ) {
      return;
    }

    try {
      const { error: pErr } = await supabase
        .from("pagamentos")
        .update({ status: "aprovado" })
        .eq("id", item.id);
      if (pErr) throw pErr;

      const { error: rErr } = await supabase
        .from("reservas")
        .update({ status: "pago", pago_em: new Date().toISOString() })
        .eq("id", item.reserva_id);
      if (rErr) throw rErr;

      alert("Pagamento aprovado e reserva liquidada com sucesso!");
      setModalDetalhesVisivel(false);
      carregarDados();
    } catch (err: any) {
      alert("Falha ao aprovar transação: " + (err.message || err));
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

  // Cálculo de totais gerais faturados para o donut chart a partir da BD real
  const analyticsTotals = useMemo(() => {
    const totalParceiros = parceiros.reduce((sum, p) => sum + p.valorParceiro, 0);
    const totalPlataforma = parceiros.reduce((sum, p) => sum + p.valorComissao, 0);
    const totalFaturado = totalParceiros + totalPlataforma;

    const pctParceiros = totalFaturado > 0 ? Math.round((totalParceiros / totalFaturado) * 100) : 0;
    const pctPlataforma = totalFaturado > 0 ? 100 - pctParceiros : 0;

    return {
      totalParceiros,
      totalPlataforma,
      totalFaturado,
      pctParceiros,
      pctPlataforma,
    };
  }, [parceiros]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            <Link href="/admin/dashboard" className="hover:text-[#902ad1] transition-all">
              Painel
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-605">Financeiro</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Geral</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
            Módulo Financeiro & Regras
          </h1>
        </div>

        {/* Date Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const ontem = new Date();
              ontem.setDate(ontem.getDate() - 1);
              setDataSelecionada(ontem.toISOString().split("T")[0]);
            }}
            className="px-3.5 py-2 bg-white border border-slate-100 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 shadow-sm"
          >
            Ontem
          </button>
          
          <button
            onClick={() => {
              const hoje = new Date();
              setDataSelecionada(hoje.toISOString().split("T")[0]);
            }}
            className="px-3.5 py-2 bg-white border border-slate-100 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 shadow-sm"
          >
            Hoje
          </button>

          <div className="flex items-center bg-white border border-slate-100 rounded-xl px-3 py-1.5 gap-1.5 shadow-sm text-xs font-bold">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="outline-none bg-transparent cursor-pointer font-bold text-slate-700"
            />
          </div>

          {dataSelecionada && (
            <button
              onClick={() => setDataSelecionada("")}
              className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-rose-600 rounded-xl transition-all"
              title="Limpar Data"
            >
              <XCircle size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Seção Filtro por Parceiro Ativo */}
      {parceiroFiltroId && (
        <div className="bg-[#902ad1]/5 border border-[#902ad1]/20 rounded-xl p-3.5 flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 text-xs font-bold text-[#902ad1]">
            <Building size={16} />
            <span>Filtrado pelo parceiro: {parceiros.find((p) => p.id === parceiroFiltroId)?.nome || "Parceiro Corporativo"}</span>
          </div>
          <button
            onClick={() => setParceiroFiltroId(null)}
            className="text-xs font-extrabold text-[#902ad1] hover:underline"
          >
            Limpar Filtro
          </button>
        </div>
      )}

      {/* Top 3 Stat Cards - Compact, Shorter and Rectangular */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Saldo Disponível */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Wallet size={16} />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                Saldo Disponível
              </span>
              <h3 className="text-sm font-black text-slate-800">
                {formatCurrency(carteiraPlataforma.disponivel)}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[8px] text-slate-450 font-bold uppercase block">
              Contábil
            </span>
            <span className="text-[9px] text-slate-650 font-extrabold">
              {formatCurrency(carteiraPlataforma.contabil)}
            </span>
          </div>
        </div>

        {/* Receita do Mês */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-[#902ad1] rounded-xl">
            <TrendingUp size={16} />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
              Receita Taxa (Mês)
            </span>
            <h3 className="text-sm font-black text-slate-800">
              {formatCurrency(dados.receitaMes)}
            </h3>
          </div>
        </div>

        {/* Média por Reserva */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Percent size={16} />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
              Média por Reserva
            </span>
            <h3 className="text-sm font-black text-slate-800">
              {formatCurrency(dados.mediaReserva)}
            </h3>
          </div>
        </div>
      </div>

      {/* Tabs Navigation styled like modern iOS Segment Control */}
      <div className="bg-slate-100/75 p-1 rounded-xl flex gap-1 self-start max-w-max border border-slate-200/50">
        {(["geral", "transacoes", "parceiros", "regras"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setAbaAtiva(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              abaAtiva === tab
                ? "bg-white text-[#902ad1] shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab === "transacoes" ? "Transações" : tab === "regras" ? "Regras" : tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#902ad1]/20 border-t-[#902ad1] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {abaAtiva === "geral" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Distribuição Financeira - Premium Circular SVG Donut Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
                <div>
                  <h3 className="text-xs font-black text-slate-855 uppercase tracking-widest">Distribuição Financeira</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Detalhamento de ganhos reais entre frotas parceiras e intermediação da plataforma.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
                  {/* SVG Circular Donut Chart */}
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="transparent"
                        stroke="#f1f5f9"
                        strokeWidth="10"
                      />
                      {analyticsTotals.totalFaturado > 0 ? (
                        <>
                          {/* Arco Parte Parceiro */}
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="transparent"
                            stroke="#10b981"
                            strokeWidth="10"
                            strokeDasharray={`${(314.16 * analyticsTotals.pctParceiros) / 100} 314.16`}
                            strokeDashoffset="0"
                          />
                          {/* Arco Parte Plataforma */}
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="transparent"
                            stroke="#902ad1"
                            strokeWidth="10"
                            strokeDasharray={`${(314.16 * analyticsTotals.pctPlataforma) / 100} 314.16`}
                            strokeDashoffset="0"
                            transform={`rotate(${(analyticsTotals.pctParceiros * 360) / 100} 60 60)`}
                          />
                        </>
                      ) : (
                        /* Arco Neutro Vazio se não houver faturação */
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="transparent"
                          stroke="#cbd5e1"
                          strokeWidth="10"
                        />
                      )}
                    </svg>
                    {/* Texto no centro */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[8px] text-slate-400 font-bold uppercase block tracking-wider">Faturado</span>
                      <span className="text-xs font-black text-slate-800">
                        {formatCurrency(analyticsTotals.totalFaturado)}
                      </span>
                    </div>
                  </div>

                  {/* Legenda Lateral com layout premium */}
                  <div className="space-y-3 flex-1 max-w-xs">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                        <div>
                          <span className="text-[10px] font-bold text-slate-700 block">Frotas & Parceiros</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">{analyticsTotals.pctParceiros}% do total</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-600">
                        {formatCurrency(analyticsTotals.totalParceiros)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#902ad1]" />
                        <div>
                          <span className="text-[10px] font-bold text-slate-700 block">Comissão WiTransfer</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">{analyticsTotals.pctPlataforma}% do total</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-[#902ad1]">
                        {formatCurrency(analyticsTotals.totalPlataforma)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Indicadores Adicionais (Vertical Column) */}
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest">Indicadores de Atividade</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Resumo reativo de movimentações diárias.</p>
                </div>

                <div className="space-y-3.5 pt-4 lg:pt-0">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-[10px] text-slate-450 font-bold uppercase">Receita Hoje</span>
                    <span className="text-xs font-black text-slate-700">{formatCurrency(dados.receitaHoje)}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-[10px] text-slate-450 font-bold uppercase">Receita Semana</span>
                    <span className="text-xs font-black text-slate-700">{formatCurrency(dados.receitaSemana)}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-[10px] text-slate-450 font-bold uppercase">Reservas Pagas</span>
                    <span className="text-xs font-black text-slate-700">{dados.totalReservas}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-[10px] text-slate-450 font-bold uppercase">Crescimento</span>
                    <span className="text-xs font-black text-emerald-600">0%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {abaAtiva === "transacoes" && (
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
              <div>
                <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest">Últimas Transações</h3>
                <p className="text-[10px] text-slate-400 font-bold">Auditoria geral de pagamentos e recebimentos.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Código</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Passageiro</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parceiro</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Cobrado</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pagamentos
                      .filter((p) => !parceiroFiltroId || p.parceiro_id === parceiroFiltroId)
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-xs font-bold text-[#902ad1] block">#{p.reserva_codigo}</span>
                            <span className="text-[8px] text-slate-400 font-semibold block">{formatDate(p.criado_em)}</span>
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-700">{p.cliente_nome}</td>
                          <td className="px-4 py-3 text-xs font-medium text-slate-500">{p.parceiro_nome}</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-800">{formatCurrency(p.valor)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-[10px] text-[8px] font-bold uppercase tracking-widest border ${
                                p.status === "aprovado" || p.status === "pago"
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-150"
                                  : "bg-amber-50 text-amber-600 border-amber-150"
                              }`}
                            >
                              {p.status === "aprovado" || p.status === "pago" ? "Confirmado" : "Pendente"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                setPagamentoSelecionado(p);
                                setModalDetalhesVisivel(true);
                              }}
                              className="p-1.5 text-slate-455 hover:text-[#902ad1] rounded-lg hover:bg-[#902ad1]/5 transition-all"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {abaAtiva === "parceiros" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-black text-slate-855 uppercase tracking-widest">Ganhos por Parceiro</h3>
                <p className="text-[10px] text-slate-400 font-bold">Detalhamento financeiro das frotas corporativas registadas.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parceiros.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setParceiroFiltroId(p.id === parceiroFiltroId ? null : p.id);
                      setAbaAtiva("geral");
                    }}
                    className={`bg-white p-5 rounded-xl border transition-all cursor-pointer hover:shadow-md relative ${
                      parceiroFiltroId === p.id
                        ? "border-[#902ad1] shadow-md shadow-[#902ad1]/5"
                        : "border-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#902ad1]/5 text-[#902ad1] rounded-xl">
                          <Building size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{p.nome}</h4>
                          <span className="text-[9px] font-bold text-slate-400 block mt-0.5">Comissão: {p.comissaoPercentual}%</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded-[10px]">
                        {p.totalReservas} reservas
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4 text-[10px] font-bold">
                      <div>
                        <span className="text-slate-400 block font-semibold">Parceiro (Líquido)</span>
                        <span className="text-emerald-600 block mt-0.5 text-xs">{formatCurrency(p.valorParceiro)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Taxa Plataforma</span>
                        <span className="text-[#902ad1] block mt-0.5 text-xs">{formatCurrency(p.valorComissao)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {abaAtiva === "regras" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest">Regras de Comissão</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Gerencie as alíquotas padrão de comissão para a plataforma.</p>
                </div>
                
                <button
                  onClick={() => setModalRegraVisivel(true)}
                  className="px-3.5 py-2 bg-[#902ad1] hover:bg-[#902ad1]/90 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-md shadow-[#902ad1]/5"
                >
                  <Plus size={14} />
                  Adicionar Regra
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {regras.map((r) => (
                  <div key={r.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative space-y-4">
                    <div className="flex justify-between items-start">
                      <span
                        className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-[10px] border ${
                          r.entidade_tipo === "global"
                            ? "bg-purple-50 text-purple-600 border-purple-150"
                            : "bg-slate-50 text-slate-600 border-slate-150"
                        }`}
                      >
                        {r.entidade_tipo}
                      </span>

                      <button
                        onClick={() => handleDeletarRegra(r.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-extrabold text-slate-800">
                        Comissão: +{r.percentual_comissao}%
                      </span>
                      <p className="text-[9px] font-bold text-slate-400">
                        Taxa de Serviço: {r.taxa_servico_plataforma}% | Prioridade: {r.prioridade}
                      </p>
                    </div>

                    {r.entidade_id && (
                      <div className="text-[9px] font-bold text-slate-455 bg-slate-50 p-2 rounded-lg truncate">
                        ID Entidade: {r.entidade_id}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Detalhes do Pagamento */}
      {modalDetalhesVisivel && pagamentoSelecionado && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-855 uppercase tracking-widest">
                Transação de Pagamento
              </h3>
              <button
                onClick={() => setModalDetalhesVisivel(false)}
                className="text-slate-455 hover:text-slate-650"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 text-center">
              {pagamentoSelecionado.status === "aprovado" || pagamentoSelecionado.status === "pago" ? (
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <Check size={32} />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner animate-pulse">
                  <Clock size={32} />
                </div>
              )}

              <div className="space-y-1">
                <h4 className="text-2xl font-black text-slate-800">
                  {formatCurrency(pagamentoSelecionado.valor)}
                </h4>
                <span
                  className={`text-[9px] font-black uppercase tracking-widest ${
                    pagamentoSelecionado.status === "aprovado" || pagamentoSelecionado.status === "pago"
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                >
                  {pagamentoSelecionado.status === "aprovado" || pagamentoSelecionado.status === "pago"
                    ? "PAGAMENTO CONFIRMADO"
                    : "AGUARDANDO APROVAÇÃO"}
                </span>
              </div>

              <div className="border-t border-b border-slate-50 py-4 text-xs text-left space-y-3 font-semibold text-slate-550">
                <div className="flex justify-between">
                  <span>Referência</span>
                  <span className="font-extrabold text-[#902ad1]">#{pagamentoSelecionado.reserva_codigo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Passageiro</span>
                  <span className="font-extrabold text-slate-700">{pagamentoSelecionado.cliente_nome}</span>
                </div>
                <div className="flex justify-between">
                  <span>Método</span>
                  <span className="font-extrabold text-slate-700">{pagamentoSelecionado.metodo || "Multicaixa Express"}</span>
                </div>

                <div className="border-t border-slate-50 pt-3 grid grid-cols-2 gap-4 text-[10px] font-bold">
                  <div>
                    <span className="text-slate-400 block font-semibold">Taxa Serviço ({pagamentoSelecionado.comissao_percentual}%)</span>
                    <span className="text-[#902ad1] block text-xs mt-0.5">{formatCurrency(pagamentoSelecionado.valor_comissao)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Parceiro ({100 - pagamentoSelecionado.comissao_percentual}%)</span>
                    <span className="text-emerald-600 block text-xs mt-0.5">{formatCurrency(pagamentoSelecionado.valor_parceiro)}</span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              {(pagamentoSelecionado.status !== "aprovado" && pagamentoSelecionado.status !== "pago") && (
                <button
                  onClick={() => handleAprovarPagamento(pagamentoSelecionado)}
                  className="w-full py-3 bg-[#902ad1] hover:bg-[#902ad1]/90 text-white font-bold text-xs rounded-xl shadow-lg shadow-[#902ad1]/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={16} />
                  Confirmar Recebimento (Aprovar)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Regra de Comissão */}
      {modalRegraVisivel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-855 uppercase tracking-widest">
                Nova Regra de Comissão
              </h3>
              <button
                onClick={() => setModalRegraVisivel(false)}
                className="text-slate-455 hover:text-slate-650"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
              {/* Tipo de Entidade */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Tipo de Entidade</label>
                <div className="grid grid-cols-3 gap-2">
                  {["global", "parceiro", "categoria"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNovaRegra({ ...novaRegra, entidade_tipo: t, entidade_id: "" })}
                      className={`py-2 text-[10px] font-extrabold rounded-lg border text-center transition-all ${
                        novaRegra.entidade_tipo === t
                          ? "bg-[#902ad1] text-white border-[#902ad1]"
                          : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
                      }`}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condicional Seleção Parceiro */}
              {novaRegra.entidade_tipo === "parceiro" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Selecionar Parceiro</label>
                  <select
                    value={novaRegra.entidade_id}
                    onChange={(e) => setNovaRegra({ ...novaRegra, entidade_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-[#902ad1]"
                  >
                    <option value="">Selecione um parceiro corporativo...</option>
                    {listaParceiros.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Condicional Seleção Categoria */}
              {novaRegra.entidade_tipo === "categoria" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Selecionar Categoria</label>
                  <select
                    value={novaRegra.entidade_id}
                    onChange={(e) => setNovaRegra({ ...novaRegra, entidade_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-[#902ad1]"
                  >
                    <option value="">Selecione uma categoria de viaturas...</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Comissão */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Percentual de Comissão (%)</label>
                <input
                  type="number"
                  value={novaRegra.percentual_comissao}
                  onChange={(e) => setNovaRegra({ ...novaRegra, percentual_comissao: e.target.value })}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-[#902ad1]"
                  placeholder="Ex: 20"
                />
              </div>

              {/* Taxa de Serviço */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Taxa de Serviço do Parceiro (%)</label>
                <input
                  type="number"
                  value={novaRegra.taxa_servico_plataforma}
                  onChange={(e) => setNovaRegra({ ...novaRegra, taxa_servico_plataforma: e.target.value })}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-[#902ad1]"
                  placeholder="Ex: 5"
                />
              </div>

              {/* Prioridade */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Prioridade (0-10)</label>
                <input
                  type="number"
                  value={novaRegra.prioridade}
                  onChange={(e) => setNovaRegra({ ...novaRegra, prioridade: e.target.value })}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-[#902ad1]"
                  placeholder="Ex: 1"
                />
              </div>

              {/* Decomposição Toggle */}
              <button
                type="button"
                onClick={() => setNovaRegra({ ...novaRegra, mostrar_detalhe_cliente: !novaRegra.mostrar_detalhe_cliente })}
                className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-2"
              >
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                    novaRegra.mostrar_detalhe_cliente
                      ? "bg-[#902ad1] border-[#902ad1] text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {novaRegra.mostrar_detalhe_cliente && <Check size={12} />}
                </div>
                <span>Mostrar decomposição de preço ao cliente</span>
              </button>

              {/* Ações Guardar */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalRegraVisivel(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-150 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSalvarRegra}
                  disabled={salvandoRegra}
                  className="flex-1 py-3 bg-[#902ad1] hover:bg-[#902ad1]/90 text-white text-xs font-bold rounded-xl shadow-lg shadow-[#902ad1]/5 transition-all"
                >
                  {salvandoRegra ? "A guardar..." : "Guardar Regra"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
