/** @format */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Car } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ViaturaCard from "@/components/admin/viatura-card";
import ViaturaTable from "@/components/admin/viatura-table";
import ViaturaFilters from "@/components/admin/viatura-filters";

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

  // Estados para filtros avançados
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [partnerFilter, setPartnerFilter] = useState("todos");
  const [sortBy, setSortBy] = useState("recente");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  // Dados dinâmicos carregados do Supabase para os filtros
  const [categories, setCategories] = useState<{ id: string; nome: string }[]>(
    [],
  );
  const [partners, setPartners] = useState<{ id: string; nome: string }[]>([]);

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
    fetchViaturas();
  }, [fetchViaturas]);

  // Carregar dados de categorias e parceiros para alimentar os filtros dinâmicos
  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        const { data: catData } = await supabase
          .from("categorias")
          .select("id, nome");
        const { data: partData } = await supabase
          .from("parceiros")
          .select("id, nome");
        if (catData) setCategories(catData);
        if (partData) setPartners(partData);
      } catch (err) {
        console.error("Erro ao carregar dados auxiliares de filtros:", err);
      }
    };
    fetchFiltersData();
  }, []);

  // Lógica reativa de filtragem e ordenação avançada
  const filteredAndSortedViaturas = useMemo(() => {
    const filtered = viaturas.filter((v) => {
      const matchesSearch =
        v.modelo.toLowerCase().includes(search.toLowerCase()) ||
        v.marca?.toLowerCase().includes(search.toLowerCase()) ||
        v.matricula?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        filter === "todos" ||
        (filter === "ativos" && v.ativo) ||
        (filter === "inativos" && !v.ativo);

      const matchesCategory =
        categoryFilter === "todas" ||
        v.categorias?.nome.toLowerCase() === categoryFilter.toLowerCase();

      const matchesPartner =
        partnerFilter === "todos" ||
        v.parceiros?.nome.toLowerCase() === partnerFilter.toLowerCase();

      return (
        matchesSearch && matchesStatus && matchesCategory && matchesPartner
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "preco-crescente") {
        return a.preco_base - b.preco_base;
      }
      if (sortBy === "preco-decrescente") {
        return b.preco_base - a.preco_base;
      }
      if (sortBy === "modelo-az") {
        return a.modelo.localeCompare(b.modelo);
      }
      if (sortBy === "ano-recente") {
        return (b.ano || 0) - (a.ano || 0);
      }
      // "recente" (padrão)
      return b.id.localeCompare(a.id);
    });
  }, [viaturas, search, filter, categoryFilter, partnerFilter, sortBy]);

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
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header com Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          {/* Caminho / Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            <Link href="/admin/dashboard" className="hover:text-[#902ad1] transition-all">
              Painel
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Viaturas</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
            Viaturas
          </h1>
        </div>
        <Link
          href="/admin/viaturas/nova"
          className="flex items-center justify-center gap-2 bg-[#902ad1] hover:bg-[#902ad1]/90 text-white px-6 py-3 rounded-[10px] font-semibold transition-all shadow-lg shadow-[#902ad1]/20 active:scale-95 shrink-0">
          <Plus size={20} strokeWidth={3} />
          <span>Nova Viatura</span>
        </Link>
      </div>

      {/* Filtros Avançados e Modos de Visualização */}
      <ViaturaFilters
        search={search}
        setSearch={setSearch}
        statusFilter={filter}
        setStatusFilter={setFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        partnerFilter={partnerFilter}
        setPartnerFilter={setPartnerFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        viewMode={viewMode}
        setViewMode={setViewMode}
        categories={categories}
        partners={partners}
      />

      {/* Renderização em Grelha ou Tabela */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#902ad1]/20 border-t-[#902ad1] rounded-full animate-spin" />
        </div>
      ) : filteredAndSortedViaturas.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-stretch">
            {filteredAndSortedViaturas.map((viatura) => (
              <ViaturaCard
                key={viatura.id}
                viatura={viatura}
                onDelete={handleDelete}
                onToggleStatus={toggleStatus}
              />
            ))}
          </div>
        ) : (
          <ViaturaTable
            viaturas={filteredAndSortedViaturas}
            onDelete={handleDelete}
            onToggleStatus={toggleStatus}
          />
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[10px] border-2 border-dashed border-slate-100">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
            <Car size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">
            Nenhuma viatura encontrada
          </h3>
          <p className="text-slate-400 mt-1 mb-8 text-sm max-w-xs text-center font-medium">
            Tente ajustar os seus filtros avançados ou adicione uma nova
            viatura.
          </p>
          <Link
            href="/admin/viaturas/nova"
            className="flex items-center gap-2 bg-[#902ad1] text-white px-8 py-3 rounded-[10px] font-semibold transition-all shadow-lg shadow-[#902ad1]/20 active:scale-95">
            <Plus size={20} strokeWidth={3} />
            <span>Adicionar Primeira Viatura</span>
          </Link>
        </div>
      )}
    </div>
  );
}
