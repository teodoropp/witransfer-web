/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Grid,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
  Car,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Categoria {
  id: string;
  nome: string;
  descricao: string | null;
  icone: string | null;
  lugares_min: number;
  lugares_max: number;
  malas_min: number;
  malas_max: number;
  ordem: number;
  ativo: boolean;
  criado_em?: string;
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
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
  const [formIcone, setFormIcone] = useState("");
  const [formLugaresMin, setFormLugaresMin] = useState(1);
  const [formLugaresMax, setFormLugaresMax] = useState(4);
  const [formMalasMin, setFormMalasMin] = useState(0);
  const [formMalasMax, setFormMalasMax] = useState(4);
  const [formOrdem, setFormOrdem] = useState(1);
  const [formAtivo, setFormAtivo] = useState(true);
  
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCategorias = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("ordem", { ascending: true });

      if (error) throw error;
      setCategorias(data || []);
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = categorias.length;
    const ativos = categorias.filter((c) => c.ativo).length;
    const inativos = total - ativos;
    return { total, ativos, inativos };
  }, [categorias]);

  // Filtered list
  const filteredCategorias = useMemo(() => {
    return categorias.filter((c) => {
      const matchesSearch =
        c.nome.toLowerCase().includes(search.toLowerCase()) ||
        c.descricao?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "ativos" && c.ativo) ||
        (statusFilter === "inativos" && !c.ativo);

      return matchesSearch && matchesStatus;
    });
  }, [categorias, search, statusFilter]);

  // Open Modal for Creation
  const handleOpenCreate = () => {
    setModalMode("criar");
    setEditingId(null);
    setFormNome("");
    setFormDescricao("");
    setFormIcone("car");
    setFormLugaresMin(1);
    setFormLugaresMax(4);
    setFormMalasMin(0);
    setFormMalasMax(4);
    setFormOrdem(categorias.length + 1);
    setFormAtivo(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (c: Categoria) => {
    setModalMode("editar");
    setEditingId(c.id);
    setFormNome(c.nome);
    setFormDescricao(c.descricao || "");
    setFormIcone(c.icone || "car");
    setFormLugaresMin(c.lugares_min);
    setFormLugaresMax(c.lugares_max);
    setFormMalasMin(c.malas_min);
    setFormMalasMax(c.malas_max);
    setFormOrdem(c.ordem);
    setFormAtivo(c.ativo);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) {
      setFormError("O nome da categoria é obrigatório.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload = {
      nome: formNome.trim(),
      descricao: formDescricao.trim() || null,
      icone: formIcone.trim() || "car",
      lugares_min: Number(formLugaresMin),
      lugares_max: Number(formLugaresMax),
      malas_min: Number(formMalasMin),
      malas_max: Number(formMalasMax),
      ordem: Number(formOrdem),
      ativo: formAtivo,
    };

    try {
      if (modalMode === "criar") {
        const { data, error } = await supabase
          .from("categorias")
          .insert([payload])
          .select();

        if (error) throw error;
        if (data) {
          setCategorias((prev) => [...prev, data[0]].sort((a, b) => a.ordem - b.ordem));
        }
      } else {
        const { error } = await supabase
          .from("categorias")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
        setCategorias((prev) =>
          prev
            .map((item) => (item.id === editingId ? { ...item, ...payload } : item))
            .sort((a, b) => a.ordem - b.ordem)
        );
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Erro ao salvar categoria:", err);
      setFormError(err.message || "Ocorreu um erro ao salvar os dados.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Deletion
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem a certeza que deseja eliminar permanentemente a categoria ${name}?`)) {
      return;
    }

    try {
      const { error } = await supabase.from("categorias").delete().eq("id", id);
      if (error) throw error;
      setCategorias((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert("Erro ao eliminar categoria: " + (err.message || "Erro desconhecido"));
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("categorias")
        .update({ ativo: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      setCategorias((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ativo: !currentStatus } : c))
      );
    } catch (err) {
      alert("Erro ao atualizar o estado da categoria.");
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
            <span className="text-slate-600">Gestão de Frota</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Categorias</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
            Categorias de Veículos
          </h1>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-[#902ad1] hover:bg-[#7a22b3] text-white px-6 py-3 rounded-[10px] font-semibold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#902ad1]/20 active:scale-95 shrink-0"
        >
          <Plus size={16} strokeWidth={3} />
          <span>Adicionar Categoria</span>
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Total Categorias</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">{loading ? "..." : stats.total}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <Grid size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Ativas</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">{loading ? "..." : stats.ativos}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Inativas</span>
            <span className="text-2xl font-bold text-rose-600 mt-1 block">{loading ? "..." : stats.inativos}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
            <XCircle size={20} />
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
            placeholder="Pesquise por nome ou descrição..."
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

      {/* Table Container */}
      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-[10px] border border-slate-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#902ad1]" />
        </div>
      ) : filteredCategorias.length > 0 ? (
        <div className="bg-white rounded-[10px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-[0_1px_0_0_rgba(241,245,249,1)]">
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ordem</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Categoria</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Capacidade (Pax / Malas)</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ícone</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCategorias.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-500">#{c.ordem}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">{c.nome}</span>
                        {c.descricao && (
                          <span className="text-xs text-slate-400 font-medium truncate max-w-xs mt-0.5">{c.descricao}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-slate-600 font-semibold">
                        <span>{c.lugares_min}-{c.lugares_max} lugares</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-450 font-normal">{c.malas_min}-{c.malas_max} malas</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500 uppercase">
                        {c.icone || "car"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(c.id, c.ativo)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                          c.ativo
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100/50"
                            : "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100/50"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${c.ativo ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span>{c.ativo ? "Ativo" : "Inativo"}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-slate-400 hover:text-[#902ad1] hover:bg-[#902ad1]/5 rounded-[10px] transition-all"
                          title="Editar Categoria"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.nome)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-[10px] transition-all"
                          title="Eliminar Categoria"
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
            <Grid size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Nenhuma categoria encontrada</h3>
          <p className="text-slate-400 mt-1 mb-6 text-sm max-w-xs font-medium">
            Tente ajustar a sua pesquisa ou adicione uma nova categoria de veículo.
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
                  {modalMode === "criar" ? "Nova Categoria" : "Editar Categoria"}
                </h3>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mt-0.5">
                  Parametrização de Frotas e Capacidades
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
                  Nome da Categoria <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Económico, Premium, Van"
                  required
                  className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Descrição
                </label>
                <textarea
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Descreva a finalidade ou os tipos de carros dessa categoria"
                  rows={2}
                  className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Pax Mínimo
                  </label>
                  <input
                    type="number"
                    value={formLugaresMin}
                    onChange={(e) => setFormLugaresMin(Number(e.target.value))}
                    min={1}
                    max={20}
                    className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Pax Máximo
                  </label>
                  <input
                    type="number"
                    value={formLugaresMax}
                    onChange={(e) => setFormLugaresMax(Number(e.target.value))}
                    min={1}
                    max={20}
                    className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Malas Mínimo
                  </label>
                  <input
                    type="number"
                    value={formMalasMin}
                    onChange={(e) => setFormMalasMin(Number(e.target.value))}
                    min={0}
                    max={20}
                    className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Malas Máximo
                  </label>
                  <input
                    type="number"
                    value={formMalasMax}
                    onChange={(e) => setFormMalasMax(Number(e.target.value))}
                    min={0}
                    max={20}
                    className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Ícone Lucide
                  </label>
                  <input
                    type="text"
                    value={formIcone}
                    onChange={(e) => setFormIcone(e.target.value)}
                    placeholder="Ex: car, grid"
                    className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    value={formOrdem}
                    onChange={(e) => setFormOrdem(Number(e.target.value))}
                    min={1}
                    className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Categoria Ativa</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Disponível para cadastro de viaturas</span>
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
