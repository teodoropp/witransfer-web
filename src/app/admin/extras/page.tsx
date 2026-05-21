/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
  Gift,
  Coins,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Extra {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  icone: string | null;
  por_dia: boolean;
  ativo: boolean;
  criado_em?: string;
}

export default function ExtrasPage() {
  const [extras, setExtras] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativos" | "inativos">("todos");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"criar" | "editar">("criar");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [formNome, setFormNome] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formPreco, setFormPreco] = useState(0);
  const [formIcone, setFormIcone] = useState("gift");
  const [formPorDia, setFormPorDia] = useState(false);
  const [formAtivo, setFormAtivo] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchExtras = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("extras")
        .select("*")
        .order("nome", { ascending: true });

      if (error) throw error;
      setExtras(data || []);
    } catch (err) {
      console.error("Erro ao carregar extras:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExtras();
  }, [fetchExtras]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = extras.length;
    const ativos = extras.filter((e) => e.ativo).length;
    const inativos = total - ativos;
    return { total, ativos, inativos };
  }, [extras]);

  // Filtered list
  const filteredExtras = useMemo(() => {
    return extras.filter((e) => {
      const matchesSearch =
        e.nome.toLowerCase().includes(search.toLowerCase()) ||
        e.descricao?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "ativos" && e.ativo) ||
        (statusFilter === "inativos" && !e.ativo);

      return matchesSearch && matchesStatus;
    });
  }, [extras, search, statusFilter]);

  // Open Modal for Creation
  const handleOpenCreate = () => {
    setModalMode("criar");
    setEditingId(null);
    setFormNome("");
    setFormDescricao("");
    setFormPreco(0);
    setFormIcone("gift");
    setFormPorDia(false);
    setFormAtivo(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (e: Extra) => {
    setModalMode("editar");
    setEditingId(e.id);
    setFormNome(e.nome);
    setFormDescricao(e.descricao || "");
    setFormPreco(e.preco);
    setFormIcone(e.icone || "gift");
    setFormPorDia(e.por_dia);
    setFormAtivo(e.ativo);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) {
      setFormError("O nome do extra é obrigatório.");
      return;
    }
    if (formPreco < 0) {
      setFormError("O preço do extra não pode ser negativo.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload = {
      nome: formNome.trim(),
      descricao: formDescricao.trim() || null,
      preco: Number(formPreco),
      icone: formIcone.trim() || "gift",
      por_dia: formPorDia,
      ativo: formAtivo,
    };

    try {
      if (modalMode === "criar") {
        const { data, error } = await supabase
          .from("extras")
          .insert([payload])
          .select();

        if (error) throw error;
        if (data) {
          setExtras((prev) => [...prev, data[0]].sort((a, b) => a.nome.localeCompare(b.nome)));
        }
      } else {
        const { error } = await supabase
          .from("extras")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
        setExtras((prev) =>
          prev
            .map((item) => (item.id === editingId ? { ...item, ...payload } : item))
            .sort((a, b) => a.nome.localeCompare(b.nome))
        );
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Erro ao salvar extra:", err);
      setFormError(err.message || "Ocorreu um erro ao salvar os dados.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Deletion
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem a certeza que deseja eliminar permanentemente o extra ${name}?`)) {
      return;
    }

    try {
      const { error } = await supabase.from("extras").delete().eq("id", id);
      if (error) throw error;
      setExtras((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      alert("Erro ao eliminar extra: " + (err.message || "Erro desconhecido"));
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("extras")
        .update({ ativo: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      setExtras((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ativo: !currentStatus } : e))
      );
    } catch (err) {
      alert("Erro ao atualizar o estado do extra.");
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
            <span className="text-slate-600">Gestão de Frota</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Extras de Serviço</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
            Extras de Serviço
          </h1>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-[#902ad1] hover:bg-[#7a22b3] text-white px-6 py-3 rounded-[10px] font-semibold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#902ad1]/20 active:scale-95 shrink-0"
        >
          <Plus size={16} strokeWidth={3} />
          <span>Adicionar Extra</span>
        </button>
      </div>

      {/* Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Total Extras</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">{loading ? "..." : stats.total}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <Gift size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Ativos</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">{loading ? "..." : stats.ativos}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Inativos</span>
            <span className="text-2xl font-bold text-rose-600 mt-1 block">{loading ? "..." : stats.inativos}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
            <XCircle size={20} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-[10px] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquise extras por nome ou descrição..."
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
            <option value="ativos">Apenas Ativos</option>
            <option value="inativos">Apenas Inativos</option>
          </select>
        </div>
      </div>

      {/* Grid or Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-[10px] border border-slate-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#902ad1]" />
        </div>
      ) : filteredExtras.length > 0 ? (
        <div className="bg-white rounded-[10px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Extra</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Preço / Cobrança</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ícone</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredExtras.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">{e.nome}</span>
                        {e.descricao && (
                          <span className="text-xs text-slate-400 font-medium truncate max-w-xs mt-0.5">{e.descricao}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Coins size={14} className="text-[#902ad1]" />
                        <span className="text-sm font-semibold text-slate-800">{formatCurrency(e.preco)}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-500">
                          {e.por_dia ? "Por Dia" : "Único"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-[6px] text-xs font-bold bg-slate-100 text-slate-600 tracking-wider">
                        {e.icone || "gift"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(e.id, e.ativo)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                          e.ativo
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100/50"
                            : "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100/50"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${e.ativo ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span>{e.ativo ? "Ativo" : "Inativo"}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleOpenEdit(e)}
                          className="p-1.5 text-slate-400 hover:text-[#902ad1] hover:bg-[#902ad1]/5 rounded-lg transition-all"
                          title="Editar Extra"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id, e.nome)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Eliminar Extra"
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
            <Gift size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Nenhum extra cadastrado</h3>
          <p className="text-slate-400 mt-1 mb-6 text-sm max-w-xs font-medium">
            Adicione serviços adicionais para que os clientes personalizem suas viagens.
          </p>
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 bg-[#902ad1] hover:bg-[#7a22b3] text-white px-6 py-2.5 rounded-[10px] font-semibold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Adicionar Novo</span>
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
                  {modalMode === "criar" ? "Novo Extra" : "Editar Extra"}
                </h3>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mt-0.5">
                  Serviços Opcionais e Conveniências
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
              >
                <X size={18} />
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

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Nome do Serviço <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Cadeira de Bebé, Água, Wi-Fi"
                  required
                  className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Descrição do Serviço
                </label>
                <textarea
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Descreva as especificações do extra"
                  rows={2}
                  className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Preço (AOA) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formPreco}
                    onChange={(e) => setFormPreco(Number(e.target.value))}
                    min={0}
                    required
                    className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Ícone Lucide
                  </label>
                  <input
                    type="text"
                    value={formIcone}
                    onChange={(e) => setFormIcone(e.target.value)}
                    placeholder="Ex: gift, wifi, coffee"
                    className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                  />
                </div>
              </div>

              {/* Billing Style Selector */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Cobrança Diária</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Se ativo, multiplica o preço pelos dias da reserva</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormPorDia(!formPorDia)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 focus:outline-none ${
                    formPorDia ? "bg-[#902ad1]" : "bg-slate-200"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-all duration-300 ${
                      formPorDia ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Active Toggle */}
              <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Extra Ativo</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Disponível para seleção nas reservas</span>
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
                    "Guardar"
                  ) : (
                    "Salvar"
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
