/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Users2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ClienteTable from "@/components/admin/cliente-table";
import ClienteFilters from "@/components/admin/cliente-filters";

interface Cliente {
  id: string;
  nome_completo: string;
  email: string | null;
  telefone: string | null;
  foto_url: string | null;
  morada: string | null;
  nif: string | null;
  ativo: boolean;
  criado_em: string;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativos" | "inativos">("todos");
  const [sortBy, setSortBy] = useState("recente");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("perfis")
        .select("*")
        .eq("tipo", "cliente");

      if (error) throw error;
      setClientes(data || []);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que deseja eliminar permanentemente este cliente e todo o seu histórico da plataforma?")) return;

    try {
      const { error } = await supabase.from("perfis").delete().eq("id", id);
      if (error) throw error;
      setClientes((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert("Erro ao eliminar cliente da base de dados.");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("perfis")
        .update({ ativo: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      setClientes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ativo: !currentStatus } : c))
      );
    } catch (err) {
      alert("Erro ao atualizar o estado de atividade do cliente.");
    }
  };

  // Filtragem e ordenação reativa no cliente para máxima rapidez
  const filteredAndSortedClientes = useMemo(() => {
    const filtered = clientes.filter((c) => {
      const matchesSearch =
        c.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.telefone?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "ativos" && c.ativo) ||
        (statusFilter === "inativos" && !c.ativo);

      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "nome-az") {
        return a.nome_completo.localeCompare(b.nome_completo);
      }
      if (sortBy === "nome-za") {
        return b.nome_completo.localeCompare(a.nome_completo);
      }
      // "recente"
      return b.criado_em.localeCompare(a.criado_em);
    });
  }, [clientes, search, statusFilter, sortBy]);

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
            <span className="text-slate-600">Comunidade</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Clientes</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
            Clientes
          </h1>
        </div>
        <Link
          href="/admin/clientes/novo"
          className="flex items-center justify-center gap-2 bg-[#902ad1] hover:bg-[#902ad1]/90 text-white px-6 py-3 rounded-[10px] font-semibold transition-all shadow-lg shadow-[#902ad1]/20 active:scale-95 shrink-0"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Adicionar Cliente</span>
        </Link>
      </div>

      {/* Filtros */}
      <ClienteFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Tabela ou Vista Grelha */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#902ad1]/20 border-t-[#902ad1] rounded-full animate-spin" />
        </div>
      ) : filteredAndSortedClientes.length > 0 ? (
        <ClienteTable
          clientes={filteredAndSortedClientes}
          viewMode={viewMode}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[10px] border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
            <Users2 size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">
            Nenhum cliente encontrado
          </h3>
          <p className="text-slate-400 mt-1 mb-8 text-sm max-w-xs text-center font-medium">
            Tente redefinir ou limpar os filtros de pesquisa ou registe um novo cliente.
          </p>
          <Link
            href="/admin/clientes/novo"
            className="flex items-center gap-2 bg-[#902ad1] text-white px-8 py-3 rounded-[10px] font-semibold transition-all shadow-lg shadow-[#902ad1]/20 active:scale-95"
          >
            <Plus size={20} strokeWidth={3} />
            <span>Adicionar Novo Cliente</span>
          </Link>
        </div>
      )}
    </div>
  );
}
