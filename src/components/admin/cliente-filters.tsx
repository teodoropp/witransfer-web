/** @format */

"use client";

import React from "react";
import { Search, Grid, List, RotateCcw } from "lucide-react";

interface ClienteFiltersProps {
  search: string;
  setSearch: (s: string) => void;
  statusFilter: "todos" | "ativos" | "inativos";
  setStatusFilter: (s: "todos" | "ativos" | "inativos") => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  viewMode: "grid" | "table";
  setViewMode: (v: "grid" | "table") => void;
}

export default function ClienteFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
}: ClienteFiltersProps) {
  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("todos");
    setSortBy("recente");
  };

  return (
    <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Barra de Pesquisa */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquise por nome completo, e-mail ou telefone..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-semibold focus:bg-white focus:border-[#902ad1] transition-all outline-none"
          />
        </div>

        {/* Filtros e Seletores */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Estado */}
          <div className="flex flex-col gap-1">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-semibold focus:bg-white focus:border-[#902ad1] transition-all outline-none cursor-pointer"
            >
              <option value="todos">Todos os Estados</option>
              <option value="ativos">Apenas Ativos</option>
              <option value="inativos">Apenas Suspensos</option>
            </select>
          </div>

          {/* Ordenação */}
          <div className="flex flex-col gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-semibold focus:bg-white focus:border-[#902ad1] transition-all outline-none cursor-pointer"
            >
              <option value="recente">Registo Recente</option>
              <option value="nome-az">Nome (A - Z)</option>
              <option value="nome-za">Nome (Z - A)</option>
            </select>
          </div>

          {/* Alternador de Vista (Grid / Tabela) */}
          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-[10px] p-1">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "table"
                  ? "bg-white text-[#902ad1] shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Vista em Tabela"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-white text-[#902ad1] shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Vista em Grelha"
            >
              <Grid size={16} />
            </button>
          </div>

          {/* Limpar Filtros */}
          {(search || statusFilter !== "todos" || sortBy !== "recente") && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center justify-center gap-1.5 px-4 py-3 border border-slate-100 hover:bg-slate-50 rounded-[10px] text-xs font-semibold text-slate-500 hover:text-slate-700 transition-all"
            >
              <RotateCcw size={14} />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
