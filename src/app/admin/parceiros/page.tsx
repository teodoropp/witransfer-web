/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Handshake } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ParceiroTable from "@/components/admin/parceiro-table";
import ParceiroFilters from "@/components/admin/parceiro-filters";

interface Parceiro {
  id: string;
  nome: string;
  nif: string | null;
  email: string | null;
  telefone: string | null;
  website: string | null;
  provincia: string | null;
  municipio: string | null;
  logo_url: string | null;
  comissao_percentual: number;
  ativo: boolean;
  status_aprovacao: string | null;
  responsavel_nome: string | null;
  responsavel_cargo: string | null;
  criado_em: string;
}

export default function ParceirosPage() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativos" | "inativos">("todos");
  const [aprovacaoFilter, setAprovacaoFilter] = useState<"todos" | "pendente" | "aprovado" | "rejeitado">("todos");
  const [sortBy, setSortBy] = useState("recente");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  const fetchParceiros = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("parceiros")
        .select("*");

      if (error) throw error;
      setParceiros(data || []);
    } catch (err) {
      console.error("Erro ao carregar parceiros:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParceiros();
  }, [fetchParceiros]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que deseja eliminar permanentemente este parceiro e todo o seu histórico da plataforma?")) return;

    try {
      const { error } = await supabase.from("parceiros").delete().eq("id", id);
      if (error) throw error;
      setParceiros((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert("Erro ao eliminar parceiro da base de dados.");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("parceiros")
        .update({ ativo: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      setParceiros((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ativo: !currentStatus } : p))
      );
    } catch (err) {
      alert("Erro ao atualizar o estado de atividade do parceiro.");
    }
  };

  // Filtragem e ordenação reativa no cliente para máxima rapidez
  const filteredAndSortedParceiros = useMemo(() => {
    const filtered = parceiros.filter((p) => {
      const matchesSearch =
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        p.nif?.toLowerCase().includes(search.toLowerCase()) ||
        p.responsavel_nome?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "ativos" && p.ativo) ||
        (statusFilter === "inativos" && !p.ativo);

      const matchesAprovacao =
        aprovacaoFilter === "todos" ||
        (p.status_aprovacao || "pendente") === aprovacaoFilter;

      return matchesSearch && matchesStatus && matchesAprovacao;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "nome-az") {
        return a.nome.localeCompare(b.nome);
      }
      if (sortBy === "nome-za") {
        return b.nome.localeCompare(a.nome);
      }
      if (sortBy === "comissao-desc") {
        return b.comissao_percentual - a.comissao_percentual;
      }
      // "recente"
      return b.criado_em.localeCompare(a.criado_em);
    });
  }, [parceiros, search, statusFilter, aprovacaoFilter, sortBy]);

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
            <span className="text-slate-600">Parceiros</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
            Parceiros de Negócio
          </h1>
        </div>
        <Link
          href="/admin/parceiros/novo"
          className="flex items-center justify-center gap-2 bg-[#902ad1] hover:bg-[#902ad1]/90 text-white px-6 py-3 rounded-[10px] font-semibold transition-all shadow-lg shadow-[#902ad1]/20 active:scale-95 shrink-0"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Registar Parceiro</span>
        </Link>
      </div>

      {/* Filtros */}
      <ParceiroFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        aprovacaoFilter={aprovacaoFilter}
        setAprovacaoFilter={setAprovacaoFilter}
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
      ) : filteredAndSortedParceiros.length > 0 ? (
        <ParceiroTable
          parceiros={filteredAndSortedParceiros}
          viewMode={viewMode}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[10px] border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
            <Handshake size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">
            Nenhum parceiro encontrado
          </h3>
          <p className="text-slate-400 mt-1 mb-8 text-sm max-w-xs text-center font-medium">
            Tente redefinir ou limpar os filtros de pesquisa ou registe um novo parceiro.
          </p>
          <Link
            href="/admin/parceiros/novo"
            className="flex items-center gap-2 bg-[#902ad1] text-white px-8 py-3 rounded-[10px] font-semibold transition-all shadow-lg shadow-[#902ad1]/20 active:scale-95"
          >
            <Plus size={20} strokeWidth={3} />
            <span>Registar Novo Parceiro</span>
          </Link>
        </div>
      )}
    </div>
  );
}
