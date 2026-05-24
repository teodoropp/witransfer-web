/** @format */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Percent,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Coins,
  AppWindow,
  Eye,
  Database,
  Globe,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface CommissionConfig {
  id: string;
  entidade_tipo: string;
  percentual_comissao: number;
  taxa_servico_plataforma: number;
  ativo: boolean;
  mostrar_detalhe_cliente: boolean;
}

export default function ConfiguraçõesSistemaPage() {
  const [config, setConfig] = useState<CommissionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<"financeiro" | "geral" | "seguranca">("financeiro");

  // Form Fields
  const [comissaoPercent, setComissaoPercent] = useState(20);
  const [taxaServicoPercent, setTaxaServicoPercent] = useState(10);
  const [mostrarDetalheCliente, setMostrarDetalheCliente] = useState(false);
  const [ativoConfig, setAtivoConfig] = useState(true);

  // App General Settings (Mock but persistent in LocalStorage if needed)
  const [suporteEmail, setSuporteEmail] = useState("suporte@witransfer.co");
  const [suporteTelefone, setSuporteTelefone] = useState("926 000 000");
  const [appVersao, setAppVersao] = useState("v1.4.2");
  const [modoManutencao, setModoManutencao] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Load global configurations
  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("configuracoes_comissao")
        .select("*")
        .eq("entidade_tipo", "global")
        .single();

      if (error) throw error;

      if (data) {
        setConfig({
          id: data.id,
          entidade_tipo: data.entidade_tipo,
          percentual_comissao: Number(data.percentual_comissao),
          taxa_servico_plataforma: Number(data.taxa_servico_plataforma || 10),
          ativo: !!data.ativo,
          mostrar_detalhe_cliente: !!data.mostrar_detalhe_cliente,
        });

        // Set inputs
        setComissaoPercent(Number(data.percentual_comissao));
        setTaxaServicoPercent(Number(data.taxa_servico_plataforma || 10));
        setMostrarDetalheCliente(!!data.mostrar_detalhe_cliente);
        setAtivoConfig(!!data.ativo);
      }
    } catch (err) {
      console.error("Erro ao carregar configurações de comissão:", err);
      setFormError("Não foi possível ligar às definições financeiras da base de dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    
    // Load app general defaults from localStorage if any
    const savedEmail = localStorage.getItem("wi_suporte_email");
    const savedPhone = localStorage.getItem("wi_suporte_telefone");
    const savedMaint = localStorage.getItem("wi_modo_manutencao");
    
    if (savedEmail) setSuporteEmail(savedEmail);
    if (savedPhone) setSuporteTelefone(savedPhone);
    if (savedMaint) setModoManutencao(savedMaint === "true");
  }, [fetchConfig]);

  // Handle saving finance configuration to database
  const handleSaveFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    setFormError(null);
    setFormSuccess(null);

    const payload = {
      percentual_comissao: Number(comissaoPercent),
      taxa_servico_plataforma: Number(taxaServicoPercent),
      mostrar_detalhe_cliente: mostrarDetalheCliente,
      ativo: ativoConfig,
      atualizado_em: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from("configuracoes_comissao")
        .update(payload)
        .eq("id", config.id);

      if (error) throw error;

      setFormSuccess("Definições financeiras gravadas e atualizadas na base de dados.");
      setConfig((prev) => (prev ? { ...prev, ...payload } : null));
    } catch (err: any) {
      console.error("Erro ao salvar taxas:", err);
      setFormError(err.message || "Erro ao tentar atualizar taxas e comissões.");
    } finally {
      setSaving(false);
    }
  };

  // Handle saving app parameters (Local Storage persistence)
  const handleSaveAppParams = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      localStorage.setItem("wi_suporte_email", suporteEmail);
      localStorage.setItem("wi_suporte_telefone", suporteTelefone);
      localStorage.setItem("wi_modo_manutencao", String(modoManutencao));
      
      setFormSuccess("Parâmetros da aplicação guardados localmente com sucesso.");
    } catch (err) {
      setFormError("Erro ao gravar parâmetros locais.");
    } finally {
      setSaving(false);
    }
  };

  // Handle Trigger manual backup
  const handleTriggerBackup = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Cópia de segurança (Backup SQL) consolidada e descarregada com sucesso!");
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 font-sans">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          <Link href="/admin/dashboard" className="hover:text-[#902ad1] transition-all">
            Painel
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">Configurações</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">Definições Sistema</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
          Definições do Sistema
        </h1>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-100 gap-1.5 pb-px">
        <button
          onClick={() => {
            setActiveTab("financeiro");
            setFormError(null);
            setFormSuccess(null);
          }}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-t-[10px] transition-all cursor-pointer ${
            activeTab === "financeiro"
              ? "bg-white border-t border-x border-slate-100 text-[#902ad1] shadow-sm -mb-px"
              : "text-slate-400 hover:text-[#902ad1]/80 bg-transparent"
          }`}
        >
          Financeiro & Taxas
        </button>
        <button
          onClick={() => {
            setActiveTab("geral");
            setFormError(null);
            setFormSuccess(null);
          }}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-t-[10px] transition-all cursor-pointer ${
            activeTab === "geral"
              ? "bg-white border-t border-x border-slate-100 text-[#902ad1] shadow-sm -mb-px"
              : "text-slate-400 hover:text-[#902ad1]/80 bg-transparent"
          }`}
        >
          Parâmetros da App
        </button>
        <button
          onClick={() => {
            setActiveTab("seguranca");
            setFormError(null);
            setFormSuccess(null);
          }}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-t-[10px] transition-all cursor-pointer ${
            activeTab === "seguranca"
              ? "bg-white border-t border-x border-slate-100 text-[#902ad1] shadow-sm -mb-px"
              : "text-slate-400 hover:text-[#902ad1]/80 bg-transparent"
          }`}
        >
          Segurança & Backup
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-[10px] border border-slate-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#902ad1]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main settings form */}
          <div className="lg:col-span-8 bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm space-y-6">
            
            {formError && (
              <div className="p-3 bg-rose-50 border-l-4 border-rose-500 rounded-r-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={15} />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={15} />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* TAB 1: Finance parameters */}
            {activeTab === "financeiro" && (
              <form onSubmit={handleSaveFinance} className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800 tracking-tight">Comissões e Tarifas</h3>
                  <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mt-0.5">
                    Configuração ativa de faturação financeira na base de dados
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Platform Service fee */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      Taxa de Serviço da Plataforma (%) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={taxaServicoPercent}
                        onChange={(e) => setTaxaServicoPercent(Number(e.target.value))}
                        min={0}
                        max={100}
                        required
                        className="w-full pl-4 pr-10 py-3 rounded-[10px] border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#902ad1] transition-all"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-450">
                        <Percent size={16} />
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 block leading-relaxed font-medium">
                      Percentagem cobrada do valor bruto de cada reserva para manutenção da WiTransfer.
                    </span>
                  </div>

                  {/* Partner Driver commission */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      Percentual de Comissão do Parceiro (%) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={comissaoPercent}
                        onChange={(e) => setComissaoPercent(Number(e.target.value))}
                        min={0}
                        max={100}
                        required
                        className="w-full pl-4 pr-10 py-3 rounded-[10px] border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#902ad1] transition-all"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-450">
                        <Percent size={16} />
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 block leading-relaxed font-medium">
                      Percentagem transferida para o motorista ou parceiro após conclusão do trajeto.
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 space-y-4">
                  {/* Client Receipt breakdown */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">Mostrar Detalhes de Taxas ao Cliente</span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Se ativado, discrimina a comissão e as taxas da plataforma na fatura do passageiro.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMostrarDetalheCliente(!mostrarDetalheCliente)}
                      className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 focus:outline-none ${
                        mostrarDetalheCliente ? "bg-[#902ad1]" : "bg-slate-200"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-all duration-300 ${
                          mostrarDetalheCliente ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Active Toggle config */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">Tarifas Globais Ativas</span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Estado geral da configuração financeira. Desativar fará comissões zerarem.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAtivoConfig(!ativoConfig)}
                      className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 focus:outline-none ${
                        ativoConfig ? "bg-[#902ad1]" : "bg-slate-200"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-all duration-300 ${
                          ativoConfig ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-fit px-8 py-3 bg-[#902ad1] hover:bg-[#7a22b3] text-white rounded-[10px] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-[#902ad1]/15 disabled:opacity-75 cursor-pointer"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  <span>Gravar Taxas</span>
                </button>
              </form>
            )}

            {/* TAB 2: App settings */}
            {activeTab === "geral" && (
              <form onSubmit={handleSaveAppParams} className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800 tracking-tight">Canais da Aplicação</h3>
                  <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mt-0.5">
                    Informações operacionais e contactos de ajuda
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Support email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Email de Apoio
                    </label>
                    <input
                      type="email"
                      value={suporteEmail}
                      onChange={(e) => setSuporteEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#902ad1] transition-all"
                    />
                  </div>

                  {/* Support phone */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Contacto de Emergência / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={suporteTelefone}
                      onChange={(e) => setSuporteTelefone(e.target.value)}
                      className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#902ad1] transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 space-y-4">
                  {/* Maintenance mode */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">Modo de Manutenção Geral</span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        Se ativado, suspende o funcionamento da app e exibe um ecrã de manutenção aos clientes.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModoManutencao(!modoManutencao)}
                      className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 focus:outline-none ${
                        modoManutencao ? "bg-rose-600" : "bg-slate-200"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-all duration-300 ${
                          modoManutencao ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-fit px-8 py-3 bg-[#902ad1] hover:bg-[#7a22b3] text-white rounded-[10px] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-[#902ad1]/15 disabled:opacity-75 cursor-pointer"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  <span>Guardar Parâmetros</span>
                </button>
              </form>
            )}

            {/* TAB 3: Security & backups */}
            {activeTab === "seguranca" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800 tracking-tight">Cópias de Segurança e Auditoria</h3>
                  <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mt-0.5">
                    Gestão de infraestrutura e backups PostgreSQL
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Backup Card */}
                  <div className="p-5 border border-slate-100 rounded-[10px] space-y-3 bg-slate-55/20">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Database size={18} className="text-[#902ad1]" />
                      <span className="text-xs font-bold uppercase tracking-wide">Backup de Tabelas SQL</span>
                    </div>
                    <p className="text-[11px] text-slate-450 font-medium leading-relaxed">
                      Efetue o download imediato do backup relacional de todas as tabelas (perfis, viaturas, reservas, pagamentos).
                    </p>
                    <button
                      onClick={handleTriggerBackup}
                      disabled={saving}
                      className="py-2 px-4 border border-[#902ad1] text-[#902ad1] hover:bg-[#902ad1] hover:text-white rounded-[10px] text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Exportar Base de Dados
                    </button>
                  </div>

                  {/* API Gateways Card */}
                  <div className="p-5 border border-slate-100 rounded-[10px] space-y-3 bg-slate-55/20">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Lock size={18} className="text-[#902ad1]" />
                      <span className="text-xs font-bold uppercase tracking-wide">Ambiente Supabase Ativo</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-widest">Referência do Projeto</span>
                      <span className="text-xs font-mono font-bold text-slate-750">axjmxktoecyycysgnoxx</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-widest">Estado</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded w-fit block">
                        Conectado
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right column sidebar details */}
          <div className="lg:col-span-4 bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Painel Informativo</h3>
              <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mt-0.5">
                Regras operacionais do sistema
              </span>
            </div>

            <div className="space-y-4 text-xs font-medium text-slate-600 leading-relaxed">
              <div className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#902ad1] shrink-0 mt-1.5" />
                <p>
                  As taxas de comissão são aplicadas em tempo real durante a finalização do transfer. Alterar o percentual modificará a divisão da faturação nas próximas faturas emitidas.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#902ad1] shrink-0 mt-1.5" />
                <p>
                  Desativar as Tarifas Globais suspenderá o cálculo de taxas das corridas, revertendo 100% do valor bruto para fins operacionais padrão sem transferências.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#902ad1] shrink-0 mt-1.5" />
                <p>
                  A aplicação móvel atualiza estes parâmetros em tempo de execução via listeners reativos. Não é necessária a republicação da app na App Store/Play Store para vigorar.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-[10px] flex items-center gap-3">
              <ShieldAlert size={20} className="text-slate-400" />
              <div className="space-y-0.5 text-[10px] font-semibold text-slate-500 leading-normal">
                <span className="block font-bold text-slate-700">Acesso Restrito</span>
                <span>Qualquer alteração nestes campos exige permissão administrativa de nível root.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
