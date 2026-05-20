/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plane,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  MapPin,
  X,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Aeroporto {
  id: string;
  nome: string;
  codigo_iata: string | null;
  cidade: string | null;
  ativo: boolean;
  criado_em?: string;
}

export default function AeroportosPage() {
  const [aeroportos, setAeroportos] = useState<Aeroporto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativos" | "inativos">("todos");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"criar" | "editar">("criar");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNome, setFormNome] = useState("");
  const [formIata, setFormIata] = useState("");
  const [formCidade, setFormCidade] = useState("");
  const [formAtivo, setFormAtivo] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchAeroportos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("aeroportos")
        .select("*")
        .order("nome", { ascending: true });

      if (error) throw error;
      setAeroportos(data || []);
    } catch (err) {
      console.error("Erro ao carregar aeroportos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAeroportos();
  }, [fetchAeroportos]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = aeroportos.length;
    const ativos = aeroportos.filter((a) => a.ativo).length;
    const inativos = total - ativos;
    return { total, ativos, inativos };
  }, [aeroportos]);

  // Filtered airports list
  const filteredAeroportos = useMemo(() => {
    return aeroportos.filter((a) => {
      const matchesSearch =
        a.nome.toLowerCase().includes(search.toLowerCase()) ||
        a.codigo_iata?.toLowerCase().includes(search.toLowerCase()) ||
        a.cidade?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "ativos" && a.ativo) ||
        (statusFilter === "inativos" && !a.ativo);

      return matchesSearch && matchesStatus;
    });
  }, [aeroportos, search, statusFilter]);

  // Open Modal for Creation
  const handleOpenCreate = () => {
    setModalMode("criar");
    setEditingId(null);
    setFormNome("");
    setFormIata("");
    setFormCidade("");
    setFormAtivo(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (a: Aeroporto) => {
    setModalMode("editar");
    setEditingId(a.id);
    setFormNome(a.nome);
    setFormIata(a.codigo_iata || "");
    setFormCidade(a.cidade || "");
    setFormAtivo(a.ativo);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Form Submission (Create or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) {
      setFormError("O nome do aeroporto é obrigatório.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload = {
      nome: formNome.trim(),
      codigo_iata: formIata.trim().toUpperCase() || null,
      cidade: formCidade.trim() || null,
      ativo: formAtivo,
    };

    try {
      if (modalMode === "criar") {
        const { data, error } = await supabase
          .from("aeroportos")
          .insert([payload])
          .select();

        if (error) throw error;
        if (data) {
          setAeroportos((prev) => [...prev, data[0]].sort((a, b) => a.nome.localeCompare(b.nome)));
        }
      } else {
        const { error } = await supabase
          .from("aeroportos")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
        setAeroportos((prev) =>
          prev
            .map((item) => (item.id === editingId ? { ...item, ...payload } : item))
            .sort((a, b) => a.nome.localeCompare(b.nome))
        );
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Erro ao salvar aeroporto:", err);
      setFormError(err.message || "Ocorreu um erro ao salvar os dados.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Airport Deletion
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem a certeza que deseja eliminar permanentemente o ${name}?`)) {
      return;
    }

    try {
      const { error } = await supabase.from("aeroportos").delete().eq("id", id);
      if (error) throw error;
      setAeroportos((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert("Erro ao eliminar aeroporto: " + (err.message || "Erro desconhecido"));
    }
  };

  // Quick Toggle Status directly from table
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("aeroportos")
        .update({ ativo: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      setAeroportos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ativo: !currentStatus } : a))
      );
    } catch (err) {
      alert("Erro ao atualizar o estado do aeroporto.");
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
            <span className="text-slate-600">Reservas & Viagens</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Aeroportos</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
            Gestão de Aeroportos
          </h1>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-[#902ad1] hover:bg-[#7a22b3] text-white px-6 py-3 rounded-[10px] font-semibold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#902ad1]/20 active:scale-95 shrink-0"
        >
          <Plus size={16} strokeWidth={3} />
          <span>Adicionar Aeroporto</span>
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Total Terminais</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">{loading ? "..." : stats.total}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <Plane size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Terminais Ativos</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">{loading ? "..." : stats.ativos}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Terminais Inativos</span>
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
            placeholder="Pesquise por nome, código IATA ou cidade..."
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
      ) : filteredAeroportos.length > 0 ? (
        <div className="bg-white rounded-[10px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Terminal</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Código IATA</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Cidade</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAeroportos.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#902ad1]/5 flex items-center justify-center text-[#902ad1] shrink-0">
                          <Plane size={16} />
                        </div>
                        <span className="text-sm font-semibold text-slate-800">{a.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-[6px] text-xs font-bold bg-slate-100 text-slate-600 tracking-wider">
                        {a.codigo_iata || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                        <MapPin size={13} className="text-slate-400" />
                        <span>{a.cidade || "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(a.id, a.ativo)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                          a.ativo
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100/50"
                            : "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100/50"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${a.ativo ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span>{a.ativo ? "Ativo" : "Inativo"}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleOpenEdit(a)}
                          className="p-1.5 text-slate-400 hover:text-[#902ad1] hover:bg-[#902ad1]/5 rounded-lg transition-all"
                          title="Editar Aeroporto"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id, a.nome)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Eliminar Aeroporto"
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
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
            <Plane size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Nenhum aeroporto encontrado</h3>
          <p className="text-slate-400 mt-1 mb-6 text-sm max-w-xs font-medium">
            Tente ajustar a sua pesquisa ou adicione um novo terminal ao sistema.
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

      {/* Modal - Elegant Side Drawer or Center Card */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[10px] border border-slate-100 w-full max-w-md shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">
                  {modalMode === "criar" ? "Novo Aeroporto" : "Editar Aeroporto"}
                </h3>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mt-0.5">
                  Dados do Terminal de Origem/Destino
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
                  Nome do Aeroporto <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Aeroporto Internacional 4 de Fevereiro"
                  required
                  className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Código IATA
                  </label>
                  <input
                    type="text"
                    value={formIata}
                    onChange={(e) => setFormIata(e.target.value.toUpperCase().slice(0, 3))}
                    placeholder="Ex: LAD"
                    maxLength={3}
                    className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formCidade}
                    onChange={(e) => setFormCidade(e.target.value)}
                    placeholder="Ex: Luanda"
                    className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                  />
                </div>
              </div>

              {/* Toggle switch for Ativo */}
              <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Aeroporto Ativo</span>
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

              {/* Form Actions */}
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
                  className="flex-1 py-3 bg-[#902ad1] hover:bg-[#7a22b3] text-white rounded-[10px] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-[#902ad1]/15 disabled:opacity-75 disabled:cursor-not-allowed"
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
