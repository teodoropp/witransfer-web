/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Image as ImageIcon,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Link as LinkIcon,
  Calendar,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Anuncio {
  id: string;
  imagem_url: string;
  data_criacao: string | null;
  status: string; // 'ativo' | 'inativo'
  ordem: number;
  data_expiracao: string | null;
}

export default function BannersPublicidadePage() {
  const [banners, setBanners] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"criar" | "editar">("criar");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [formImagemUrl, setFormImagemUrl] = useState("");
  const [formOrdem, setFormOrdem] = useState(1);
  const [formStatus, setFormStatus] = useState("ativo");
  const [formDataExpiracao, setFormDataExpiracao] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("anuncio")
        .select("*")
        .order("ordem", { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (err) {
      console.error("Erro ao carregar banners de publicidade:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = banners.length;
    const ativos = banners.filter((b) => b.status === "ativo").length;
    const inativos = total - ativos;
    return { total, ativos, inativos };
  }, [banners]);

  // Filtered list
  const filteredBanners = useMemo(() => {
    return banners.filter((b) => {
      const matchesSearch = b.imagem_url.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "todos" ||
        b.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [banners, search, statusFilter]);

  // Open Modal for Creation
  const handleOpenCreate = () => {
    setModalMode("criar");
    setEditingId(null);
    
    // Suggest a placeholder premium travel background in case they don't have one ready
    setFormImagemUrl("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=600");
    setFormOrdem(banners.length + 1);
    setFormStatus("ativo");
    
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setFormDataExpiracao(nextMonth.toISOString().split("T")[0]);
    
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (b: Anuncio) => {
    setModalMode("editar");
    setEditingId(b.id);
    setFormImagemUrl(b.imagem_url);
    setFormOrdem(b.ordem);
    setFormStatus(b.status);
    setFormDataExpiracao(b.data_expiracao ? b.data_expiracao.split("T")[0] : "");
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formImagemUrl.trim()) {
      setFormError("A URL da imagem do banner é obrigatória.");
      return;
    }

    setSubmitting(true);

    const payload = {
      imagem_url: formImagemUrl.trim(),
      ordem: Number(formOrdem),
      status: formStatus,
      data_expiracao: formDataExpiracao ? new Date(formDataExpiracao).toISOString() : null,
    };

    try {
      if (modalMode === "criar") {
        const { data, error } = await supabase
          .from("anuncio")
          .insert([payload])
          .select();

        if (error) throw error;
        if (data) {
          setBanners((prev) => [...prev, data[0]].sort((a, b) => a.ordem - b.ordem));
        }
      } else {
        const { error } = await supabase
          .from("anuncio")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
        setBanners((prev) =>
          prev
            .map((item) => (item.id === editingId ? { ...item, ...payload } : item))
            .sort((a, b) => a.ordem - b.ordem)
        );
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Erro ao salvar banner:", err);
      setFormError(err.message || "Erro ao guardar banner de anúncio.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Deletion
  const handleDelete = async (id: string) => {
    if (!confirm("Deseja eliminar este banner publicitário permanentemente?")) return;

    try {
      const { error } = await supabase.from("anuncio").delete().eq("id", id);
      if (error) throw error;
      setBanners((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      alert("Erro ao eliminar banner: " + (err.message || "Erro desconhecido"));
    }
  };

  // Toggle active status
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ativo" ? "inativo" : "ativo";
    try {
      const { error } = await supabase
        .from("anuncio")
        .update({ status: nextStatus })
        .eq("id", id);

      if (error) throw error;
      setBanners((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: nextStatus } : b))
      );
    } catch (err) {
      alert("Erro ao atualizar o estado do anúncio.");
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
            <span className="text-slate-600">Comunicação</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Banners Publicidade</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
            Banners de Publicidade
          </h1>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-[#902ad1] hover:bg-[#7a22b3] text-white px-6 py-3 rounded-[10px] font-semibold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#902ad1]/20 active:scale-95 shrink-0"
        >
          <Plus size={16} strokeWidth={3} />
          <span>Novo Banner</span>
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Total Banners</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">{loading ? "..." : stats.total}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <ImageIcon size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Banners Ativos</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">{loading ? "..." : stats.ativos}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Banners Inativos</span>
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
            placeholder="Pesquise por URL de imagem de banner..."
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
            <option value="ativo">Apenas Ativos</option>
            <option value="inativo">Apenas Inativos</option>
          </select>
        </div>
      </div>

      {/* Grid or Cards Layout */}
      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-[10px] border border-slate-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#902ad1]" />
        </div>
      ) : filteredBanners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanners.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-slate-100 rounded-[10px] shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300"
            >
              {/* Image Preview Box */}
              <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden border-b border-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.imagem_url}
                  alt="Banner"
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    // Fallback visual
                    (e.target as any).src = "https://placehold.co/600x337/e2e8f0/94a3b8?text=Sem+Imagem+Disponível";
                  }}
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-slate-900/75 text-white tracking-widest uppercase">
                  Ordem #{b.ordem}
                </span>
              </div>

              {/* Banner Details */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                    <LinkIcon size={12} className="shrink-0" />
                    <span className="truncate max-w-[200px]" title={b.imagem_url}>
                      {b.imagem_url}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <Calendar size={12} className="shrink-0 text-slate-400" />
                    <span>
                      Expira:{" "}
                      {b.data_expiracao
                        ? new Date(b.data_expiracao).toLocaleDateString("pt-AO")
                        : "Sem expiração"}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleStatus(b.id, b.status)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                      b.status === "ativo"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100/50"
                        : "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100/50"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${b.status === "ativo" ? "bg-emerald-500" : "bg-rose-500"}`} />
                    <span>{b.status === "ativo" ? "Ativo" : "Inativo"}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="p-1.5 text-slate-400 hover:text-[#902ad1] hover:bg-[#902ad1]/5 rounded-lg transition-all"
                      title="Editar Banner"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Eliminar Banner"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[10px] border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-350 mb-4 border border-slate-100">
            <ImageIcon size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Nenhum banner cadastrado</h3>
          <p className="text-slate-400 mt-1 mb-6 text-sm max-w-xs font-medium">
            Gerencie imagens publicitárias que ficam rodando na página inicial do app.
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
                  {modalMode === "criar" ? "Novo Banner Publicitário" : "Editar Banner Publicitário"}
                </h3>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mt-0.5">
                  Anúncios e Campanhas no Aplicativo
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

              {/* Image URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  URL da Imagem <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formImagemUrl}
                  onChange={(e) => setFormImagemUrl(e.target.value)}
                  placeholder="Ex: https://dominio.com/banner.png"
                  required
                  className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                />
              </div>

              {/* Image Preview Box inside Form */}
              {formImagemUrl.trim() && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pré-visualização</span>
                  <div className="relative aspect-[16/9] w-full rounded-[10px] border border-slate-100 overflow-hidden bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formImagemUrl}
                      alt="Preview"
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        (e.target as any).src = "https://placehold.co/600x337/e2e8f0/94a3b8?text=Imagem+Inválida+ou+Erro+no+Link";
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Order and Expiration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    value={formOrdem}
                    onChange={(e) => setFormOrdem(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Data de Expiração
                  </label>
                  <input
                    type="date"
                    value={formDataExpiracao}
                    onChange={(e) => setFormDataExpiracao(e.target.value)}
                    className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Banner Ativo</span>
                  <span className="text-[10px] text-slate-400 block font-medium">Os clientes verão este banner no aplicativo</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormStatus(formStatus === "ativo" ? "inativo" : "ativo")}
                  className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 focus:outline-none ${
                    formStatus === "ativo" ? "bg-[#902ad1]" : "bg-slate-200"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-all duration-300 ${
                      formStatus === "ativo" ? "translate-x-5" : "translate-x-0"
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
                    "Adicionar"
                  ) : (
                    "Guardar"
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
