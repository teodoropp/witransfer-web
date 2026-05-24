/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Megaphone,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Gift,
  Coins,
  Calendar,
  Percent,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Promocao {
  id: string;
  codigo: string;
  descricao: string;
  tipo: string;
  valor: number;
  data_inicio: string | null;
  data_fim: string | null;
  limite_uso: number | null;
  uso_atual: number | null;
  ativo: boolean | null;
  criado_em?: string;
}

export default function CampanhasPromoPage() {
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativos" | "inativos">("todos");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"criar" | "editar">("criar");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [formCodigo, setFormCodigo] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formTipo, setFormTipo] = useState("percentual"); // 'percentual' ou 'fixo'
  const [formValor, setFormValor] = useState(0);
  const [formDataInicio, setFormDataInicio] = useState("");
  const [formDataFim, setFormDataFim] = useState("");
  const [formLimiteUso, setFormLimiteUso] = useState(100);
  const [formAtivo, setFormAtivo] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchPromocoes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("promocoes")
        .select("*")
        .order("criado_em", { ascending: false });

      if (error) throw error;
      setPromocoes(data || []);
    } catch (err) {
      console.error("Erro ao carregar promoções:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromocoes();
  }, [fetchPromocoes]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = promocoes.length;
    const ativos = promocoes.filter((p) => p.ativo).length;
    const totalUsos = promocoes.reduce((acc, curr) => acc + (curr.uso_atual || 0), 0);
    return { total, ativos, totalUsos };
  }, [promocoes]);

  // Filtered list
  const filteredPromocoes = useMemo(() => {
    return promocoes.filter((p) => {
      const matchesSearch =
        p.codigo.toLowerCase().includes(search.toLowerCase()) ||
        p.descricao.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "ativos" && p.ativo) ||
        (statusFilter === "inativos" && !p.ativo);

      return matchesSearch && matchesStatus;
    });
  }, [promocoes, search, statusFilter]);

  // Helper to generate a random promo code
  const handleGenerateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "WI-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormCodigo(code);
  };

  // Open Modal for Creation
  const handleOpenCreate = () => {
    setModalMode("criar");
    setEditingId(null);
    setFormCodigo("");
    setFormDescricao("");
    setFormTipo("percentual");
    setFormValor(10);
    
    // Set default dates (today and one month from now)
    const today = new Date().toISOString().split("T")[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const endStr = nextMonth.toISOString().split("T")[0];
    
    setFormDataInicio(today);
    setFormDataFim(endStr);
    setFormLimiteUso(100);
    setFormAtivo(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (p: Promocao) => {
    setModalMode("editar");
    setEditingId(p.id);
    setFormCodigo(p.codigo);
    setFormDescricao(p.descricao);
    setFormTipo(p.tipo);
    setFormValor(p.valor);
    setFormDataInicio(p.data_inicio ? p.data_inicio.split("T")[0] : "");
    setFormDataFim(p.data_fim ? p.data_fim.split("T")[0] : "");
    setFormLimiteUso(p.limite_uso || 100);
    setFormAtivo(!!p.ativo);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCodigo.trim()) {
      setFormError("O código promocional é obrigatório.");
      return;
    }
    if (!formDescricao.trim()) {
      setFormError("A descrição do cupão é obrigatória.");
      return;
    }
    if (formValor <= 0) {
      setFormError("O valor do desconto deve ser maior que zero.");
      return;
    }

    setSubmitting(true);

    const payload = {
      codigo: formCodigo.trim().toUpperCase(),
      descricao: formDescricao.trim(),
      tipo: formTipo,
      valor: Number(formValor),
      data_inicio: formDataInicio ? new Date(formDataInicio).toISOString() : null,
      data_fim: formDataFim ? new Date(formDataFim).toISOString() : null,
      limite_uso: formLimiteUso ? Number(formLimiteUso) : null,
      ativo: formAtivo,
    };

    try {
      if (modalMode === "criar") {
        // Add new campaign
        const { data, error } = await supabase
          .from("promocoes")
          .insert([{ ...payload, uso_atual: 0 }])
          .select();

        if (error) throw error;
        if (data) {
          setPromocoes((prev) => [data[0], ...prev]);
        }

        // Proactively insert a system notification to announce the new promotion code!
        await supabase.from("notificacoes").insert([
          {
            usuario_id: "361e688f-7c4a-4fe9-9050-ca2016d92a13", // Silvio admin / fallback
            tipo: "promocao",
            titulo: `Nova Campanha Ativa: ${payload.codigo}`,
            mensagem: `${payload.descricao}. Utilize o cupão e ganhe ${
              payload.tipo === "percentual" ? `${payload.valor}%` : `${payload.valor} AOA`
            } de desconto na sua próxima viagem.`,
            prioridade: "HIGH",
            lida: false,
          },
        ]);
      } else {
        // Update existing campaign
        const { error } = await supabase
          .from("promocoes")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
        setPromocoes((prev) =>
          prev.map((item) => (item.id === editingId ? { ...item, ...payload } : item))
        );
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Erro ao salvar promoção:", err);
      setFormError(err.message || "Erro ao guardar promoção na base de dados.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Deletion
  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Deseja eliminar a campanha promocional ${code}?`)) return;

    try {
      const { error } = await supabase.from("promocoes").delete().eq("id", id);
      if (error) throw error;
      setPromocoes((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert("Erro ao eliminar código promocional: " + (err.message || "Erro interno"));
    }
  };

  // Toggle active switch
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("promocoes")
        .update({ ativo: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      setPromocoes((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ativo: !currentStatus } : p))
      );
    } catch (err) {
      alert("Erro ao atualizar o estado da promoção.");
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
    }).format(val);
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
            <span className="text-slate-600">Comunicação</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Campanhas Promo</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
            Campanhas Promocionais
          </h1>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-[#902ad1] hover:bg-[#7a22b3] text-white px-6 py-3 rounded-[10px] font-semibold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#902ad1]/20 active:scale-95 shrink-0"
        >
          <Plus size={16} strokeWidth={3} />
          <span>Nova Campanha</span>
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Total Campanhas</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">{loading ? "..." : stats.total}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <Megaphone size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Campanhas Ativas</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">{loading ? "..." : stats.ativos}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Usos de Cupões</span>
            <span className="text-2xl font-bold text-[#902ad1] mt-1 block">{loading ? "..." : stats.totalUsos}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-[#902ad1]/5 border border-[#902ad1]/10 flex items-center justify-center text-[#902ad1]">
            <Gift size={20} />
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-4 rounded-[10px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquise por código ou descrição do cupão..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-semibold focus:bg-white focus:border-[#902ad1] transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-semibold focus:bg-white focus:border-[#902ad1] transition-all outline-none cursor-pointer"
          >
            <option value="todos">Todos os Estados</option>
            <option value="ativos">Apenas Ativas</option>
            <option value="inativos">Apenas Inativas</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-[10px] border border-slate-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#902ad1]" />
        </div>
      ) : filteredPromocoes.length > 0 ? (
        <div className="bg-white rounded-[10px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-[0_1px_0_0_rgba(241,245,249,1)]">
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Cupão</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Desconto</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Período de Validade</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Uso (Atual / Limite)</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPromocoes.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold bg-[#902ad1]/10 text-[#902ad1] px-2.5 py-1 rounded-[6px] w-fit font-mono tracking-wider">
                          {p.codigo}
                        </span>
                        <span className="text-xs text-slate-400 font-medium max-w-xs mt-1 block truncate">
                          {p.descricao}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-slate-800 font-semibold">
                        {p.tipo === "percentual" ? (
                          <>
                            <Percent size={14} className="text-slate-500" />
                            <span>{p.valor}%</span>
                          </>
                        ) : (
                          <>
                            <Coins size={14} className="text-emerald-500" />
                            <span>{formatCurrency(p.valor)}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs text-slate-600 font-medium space-y-0.5">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Início: {p.data_inicio ? new Date(p.data_inicio).toLocaleDateString("pt-AO") : "Imediato"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Fim: {p.data_fim ? new Date(p.data_fim).toLocaleDateString("pt-AO") : "Indeterminado"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                          <span>{p.uso_atual || 0} de {p.limite_uso || "∞"}</span>
                        </div>
                        {p.limite_uso && (
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, (((p.uso_atual || 0) / p.limite_uso) * 100))}%` }}
                              className="h-full bg-[#902ad1] rounded-full"
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(p.id, !!p.ativo)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                          p.ativo
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100/50"
                            : "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100/50"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${p.ativo ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span>{p.ativo ? "Ativa" : "Inativa"}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-400 hover:text-[#902ad1] hover:bg-[#902ad1]/5 rounded-[10px] transition-all"
                          title="Editar Campanha"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.codigo)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-[10px] transition-all"
                          title="Eliminar Campanha"
                        >
                          <Trash2 size={15} />
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
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[10px] border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-350 mb-4 border border-slate-100">
            <Megaphone size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Sem campanhas ativas</h3>
          <p className="text-slate-400 mt-1 mb-6 text-sm max-w-xs font-medium">
            Desenvolva ofertas atrativas e fidelize utilizadores lançando cupões de desconto.
          </p>
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 bg-[#902ad1] hover:bg-[#7a22b3] text-white px-6 py-2.5 rounded-[10px] font-semibold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Criar Nova Oferta</span>
          </button>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[10px] border border-slate-100 w-full max-w-md shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">
                  {modalMode === "criar" ? "Nova Campanha Promo" : "Editar Campanha Promo"}
                </h3>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mt-0.5">
                  Cupões de desconto e fidelização
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border-l-4 border-rose-500 rounded-r-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Code */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Código do Cupão <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value.toUpperCase())}
                    placeholder="Ex: WI-DISCOUNT"
                    required
                    className="flex-1 px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-semibold tracking-wider font-mono focus:outline-none focus:border-[#902ad1] transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="px-3 bg-slate-50 hover:bg-slate-150 border border-slate-200 rounded-[10px] flex items-center justify-center text-slate-500 hover:text-[#902ad1] transition-all"
                    title="Gerar código aleatório"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Descrição / Oferta <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Ex: 10% de desconto na primeira viagem de van"
                  required
                  className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                />
              </div>

              {/* Type and Value */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Tipo de Desconto
                  </label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value)}
                    className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] bg-white transition-all"
                  >
                    <option value="percentual">Percentual (%)</option>
                    <option value="fixo">Fixo (AOA)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Valor do Desconto <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formValor}
                    onChange={(e) => setFormValor(Number(e.target.value))}
                    min={0.01}
                    step="any"
                    required
                    className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={formDataInicio}
                    onChange={(e) => setFormDataInicio(e.target.value)}
                    className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Data de Expiração
                  </label>
                  <input
                    type="date"
                    value={formDataFim}
                    onChange={(e) => setFormDataFim(e.target.value)}
                    className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                  />
                </div>
              </div>

              {/* Limit of uses */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Limite Máximo de Utilizações (Cupões)
                </label>
                <input
                  type="number"
                  value={formLimiteUso}
                  onChange={(e) => setFormLimiteUso(Number(e.target.value))}
                  min={1}
                  className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                />
              </div>

              {/* Active Toggle */}
              <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Campanha Ativa</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Os utilizadores podem validar este cupão</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormAtivo(!formAtivo)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 focus:outline-none ${
                    formAtivo ? "bg-[#902ad1]" : "bg-slate-200"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-all duration-300 ${
                      formAtivo ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-[10px] text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-[#902ad1] hover:bg-[#7a22b3] text-white rounded-[10px] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-[#902ad1]/15 disabled:opacity-75"
                >
                  {submitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : modalMode === "criar" ? (
                    "Criar"
                  ) : (
                    "Atualizar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
