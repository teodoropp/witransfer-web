/** @format */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Search,
  Car,
  Edit2,
  Trash2,
  Eye,
  Users,
  Briefcase,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface Viatura {
  id: string;
  modelo: string;
  marca: string | null;
  cor: string | null;
  matricula: string | null;
  ano: number | null;
  km: number | null;
  lugares: number;
  malas: number;
  preco_base: number;
  foto_url?: string | null;
  ativo?: boolean;
  categorias?: { nome: string };
  parceiros?: { id: string; nome: string };
}

export default function ViaturasPage() {
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todos" | "ativos" | "inativos">(
    "todos",
  );

  const fetchViaturas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("viaturas").select(`
          *,
          categorias(nome),
          parceiros(nome)
        `);

      if (error) throw error;
      setViaturas(data || []);
    } catch (err) {
      console.error("Erro ao carregar viaturas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchViaturas();
    };
    load();
  }, [fetchViaturas]);

  const filteredViaturas = useMemo(() => {
    return viaturas.filter((v) => {
      const matchesSearch =
        v.modelo.toLowerCase().includes(search.toLowerCase()) ||
        v.marca?.toLowerCase().includes(search.toLowerCase()) ||
        v.matricula?.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "todos" ||
        (filter === "ativos" && v.ativo) ||
        (filter === "inativos" && !v.ativo);

      return matchesSearch && matchesFilter;
    });
  }, [viaturas, search, filter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que deseja eliminar esta viatura?")) return;

    try {
      const { error } = await supabase.from("viaturas").delete().eq("id", id);

      if (error) throw error;
      setViaturas((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      alert("Erro ao eliminar viatura.");
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("viaturas")
        .update({ ativo: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      setViaturas((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ativo: !currentStatus } : v)),
      );
    } catch (err) {
      alert("Erro ao atualizar status.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header com Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            Gestão de Frota
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Gira as viaturas disponíveis para reservas e parceiros.
          </p>
        </div>
        <Link
          href="/admin/viaturas/nova"
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 active:scale-95">
          <Plus size={20} strokeWidth={3} />
          <span>Nova Viatura</span>
        </Link>
      </div>

      {/* Filtros e Pesquisa */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Pesquisar por modelo, marca ou matrícula..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-2xl w-full lg:w-auto">
          {(["todos", "ativos", "inativos"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 lg:flex-none px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${filter === f ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Viaturas */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredViaturas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredViaturas.map((viatura) => (
            <div
              key={viatura.id}
              className="group bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden flex flex-col">
              {/* Imagem e Status */}
              <div className="relative h-48 w-full bg-slate-50 overflow-hidden">
                {viatura.foto_url ? (
                  <Image
                    src={viatura.foto_url}
                    alt={viatura.modelo}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Car size={64} strokeWidth={1} />
                  </div>
                )}

                <div className="absolute top-4 left-4 flex gap-2">
                  <span
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${viatura.ativo ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
                    {viatura.ativo ? "Ativo" : "Inativo"}
                  </span>
                  <span className="bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-sm border border-slate-200">
                    {viatura.categorias?.nome || "Económica"}
                  </span>
                </div>

                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-10px] group-hover:translate-y-0 duration-300">
                  <button
                    onClick={() => toggleStatus(viatura.id, !!viatura.ativo)}
                    className="p-2 bg-white rounded-full text-slate-600 hover:text-primary shadow-lg transition-colors"
                    title={viatura.ativo ? "Desativar" : "Ativar"}>
                    {viatura.ativo ? (
                      <XCircle size={18} />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                  </button>
                  <Link
                    href={`/admin/viaturas/${viatura.id}/editar`}
                    className="p-2 bg-white rounded-full text-slate-600 hover:text-primary shadow-lg transition-colors">
                    <Edit2 size={18} />
                  </Link>
                  <button
                    onClick={() => handleDelete(viatura.id)}
                    className="p-2 bg-white rounded-full text-slate-600 hover:text-rose-500 shadow-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Informações */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 leading-tight mb-1">
                      {viatura.marca} {viatura.modelo}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest border border-yellow-200">
                        {viatura.matricula || "S/ MATRÍCULA"}
                      </span>
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">
                        {viatura.ano || "2024"} •{" "}
                        {viatura.km?.toLocaleString() || "0"} KM
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Preço Base
                    </span>
                    <span className="text-lg font-black text-primary leading-none">
                      {viatura.preco_base?.toLocaleString("pt-AO")}{" "}
                      <small className="text-[10px]">Kz</small>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-50 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <Users size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">
                      {viatura.lugares} Lugares
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">
                      {viatura.malas} Malas
                    </span>
                  </div>
                  <div className="ml-auto">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      Parceiro
                    </span>
                    <p className="text-[11px] font-bold text-slate-700 truncate max-w-[100px]">
                      {viatura.parceiros?.nome || "WiTransfer Official"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Ações */}
              <div className="px-6 pb-6 pt-2">
                <Link
                  href={`/admin/viaturas/${viatura.id}`}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-primary/5 text-slate-600 hover:text-primary rounded-2xl font-bold text-xs transition-all border border-transparent hover:border-primary/20">
                  <Eye size={16} />
                  Visualizar Detalhes
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
            <Car size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            Nenhuma viatura encontrada
          </h3>
          <p className="text-slate-500 mt-1 mb-8">
            Tente ajustar os seus filtros ou adicionar uma nova viatura.
          </p>
          <Link
            href="/admin/viaturas/nova"
            className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 active:scale-95">
            <Plus size={20} strokeWidth={3} />
            <span>Adicionar Primeira Viatura</span>
          </Link>
        </div>
      )}
    </div>
  );
}
