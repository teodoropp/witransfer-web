/** @format */

import React from "react";
import { Search, Grid, List, SlidersHorizontal, ChevronDown } from "lucide-react";

interface ViaturaFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  statusFilter: "todos" | "ativos" | "inativos";
  setStatusFilter: (val: "todos" | "ativos" | "inativos") => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  partnerFilter: string;
  setPartnerFilter: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  viewMode: "grid" | "table";
  setViewMode: (val: "grid" | "table") => void;
  categories: { id: string; nome: string }[];
  partners: { id: string; nome: string }[];
}

export default function ViaturaFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  partnerFilter,
  setPartnerFilter,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  categories,
  partners,
}: ViaturaFiltersProps) {
  return (
    <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-sm space-y-4">
      {/* Linha Principal: Pesquisa + Modo de Visualização */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Barra de Pesquisa */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Pesquisar por modelo, marca ou matrícula..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-[12px] text-sm font-medium focus:bg-white focus:border-[#902ad1] transition-all outline-none text-slate-800 placeholder:text-slate-400 shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter + Grid/Table Toggle */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-[12px] border border-slate-100">
            {(["todos", "ativos", "inativos"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-2 rounded-[8px] text-[10px] font-black uppercase tracking-wider transition-all ${
                  statusFilter === f
                    ? "bg-white text-[#902ad1] shadow-sm border border-slate-100"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {f === "todos" ? "Todos" : f === "ativos" ? "Ativos" : "Inativos"}
              </button>
            ))}
          </div>

          {/* Grid/Table Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-[12px] border border-slate-100">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-[8px] transition-all ${
                viewMode === "grid"
                  ? "bg-white text-[#902ad1] shadow-sm border border-slate-100"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Visualizar em Grelha"
            >
              <Grid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-[8px] transition-all ${
                viewMode === "table"
                  ? "bg-white text-[#902ad1] shadow-sm border border-slate-100"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Visualizar em Tabela"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Linha Secundária: Filtros Avançados e Ordenação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-50">
        {/* Filtro de Categoria */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Categoria
          </label>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-[#902ad1] transition-all cursor-pointer"
            >
              <option value="todas">Todas as Categorias</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.nome}>
                  {cat.nome}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Filtro de Parceiro */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Parceiro / Fornecedor
          </label>
          <div className="relative">
            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-[#902ad1] transition-all cursor-pointer"
            >
              <option value="todos">Todos os Parceiros</option>
              {partners.map((part) => (
                <option key={part.id} value={part.nome}>
                  {part.nome}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Ordenação */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Ordenar Por
          </label>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-[#902ad1] transition-all cursor-pointer"
            >
              <option value="recente">Mais Recentes</option>
              <option value="preco-crescente">Preço: Menor para Maior</option>
              <option value="preco-decrescente">Preço: Maior para Menor</option>
              <option value="modelo-az">Modelo: A a Z</option>
              <option value="ano-recente">Ano: Mais Recente</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
