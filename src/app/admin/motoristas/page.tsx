/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Users, ShieldAlert, Check, Star, Car } from "lucide-react";
import Link from "next/link";
import { THEME_TOKENS } from "@/utils/design-system";
import { supabase } from "@/lib/supabase";
import MotoristaTable from "@/components/admin/motorista-table";
import MotoristaFilters from "@/components/admin/motorista-filters";
import MotoristaCard from "@/components/admin/motorista-card";

interface Motorista {
  id: string;
  perfil_id: string;
  parceiro_id: string;
  carta_conducao: string | null;
  carta_conducao_url: string | null;
  documento_bi_url: string | null;
  disponivel: boolean;
  total_viagens: number;
  avaliacao_media: number;
  experiencia_anos: number | null;
  status_aprovacao: string | null;
  perfis: {
    id: string;
    nome_completo: string;
    email: string | null;
    telefone: string | null;
    foto_url: string | null;
    ativo: boolean;
  };
  parceiros?: {
    id: string;
    nome: string;
  } | null;
  viaturas?: {
    id: string;
    modelo: string;
    marca: string | null;
    matricula: string | null;
    categorias?: {
      nome: string;
    } | null;
  } | null;
}

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
}

function AnimatedCounter({ value, duration = 1000, decimals = 0 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const elementRef = React.useRef<HTMLSpanElement>(null);
  const hasAnimated = React.useRef(false);

  useEffect(() => {
    setCount(0);
    hasAnimated.current = false;
  }, [value]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTimestamp: number | null = null;
          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setCount(progress * value);
            if (progress < 1) {
              window.requestAnimationFrame(step);
            }
          };
          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
      observer.disconnect();
    };
  }, [value, duration]);

  return (
    <span ref={elementRef}>
      {count.toFixed(decimals)}
    </span>
  );
}

export default function MotoristasPage() {
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todos" | "ativos" | "inativos">("todos");

  // Estados para filtros avançados
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [partnerFilter, setPartnerFilter] = useState("todos");
  const [sortBy, setSortBy] = useState("recente");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  // Dados carregados para alimentar filtros dinâmicos
  const [categories, setCategories] = useState<{ id: string; nome: string }[]>([]);
  const [partners, setPartners] = useState<{ id: string; nome: string }[]>([]);

  const fetchMotoristas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("motoristas").select(`
        *,
        perfis:perfil_id(id, nome_completo, email, telefone, foto_url, ativo),
        parceiros(id, nome),
        viaturas!motoristas_viatura_id_fkey(id, modelo, marca, matricula, categorias(nome))
      `);

      if (error) throw error;
      setMotoristas((data as any) || []);
    } catch (err) {
      console.error("Erro ao carregar motoristas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMotoristas();
  }, [fetchMotoristas]);

  // Carregar dados de categorias e parceiros para filtros
  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        const { data: catData } = await supabase.from("categorias").select("id, nome");
        const { data: partData } = await supabase.from("parceiros").select("id, nome");
        if (catData) setCategories(catData);
        if (partData) setPartners(partData);
      } catch (err) {
        console.error("Erro ao carregar dados auxiliares de filtros:", err);
      }
    };
    fetchFiltersData();
  }, []);

  // Lógica de filtragem e ordenação reativa
  const filteredAndSortedMotoristas = useMemo(() => {
    const filtered = motoristas.filter((m) => {
      if (!m.perfis) return false;

      const matchesSearch =
        m.perfis.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
        m.perfis.email?.toLowerCase().includes(search.toLowerCase()) ||
        m.perfis.telefone?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        filter === "todos" ||
        (filter === "ativos" && m.perfis.ativo) ||
        (filter === "inativos" && !m.perfis.ativo);

      const matchesCategory =
        categoryFilter === "todas" ||
        m.viaturas?.categorias?.nome.toLowerCase() === categoryFilter.toLowerCase();

      const matchesPartner =
        partnerFilter === "todos" ||
        m.parceiros?.nome.toLowerCase() === partnerFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesCategory && matchesPartner;
    });

    return [...filtered].sort((a, b) => {
      if (!a.perfis || !b.perfis) return 0;

      if (sortBy === "nome-az") {
        return a.perfis.nome_completo.localeCompare(b.perfis.nome_completo);
      }
      if (sortBy === "nome-za") {
        return b.perfis.nome_completo.localeCompare(a.perfis.nome_completo);
      }
      if (sortBy === "viagens-desc") {
        return (b.total_viagens || 0) - (a.total_viagens || 0);
      }
      if (sortBy === "avaliacao-desc") {
        return (b.avaliacao_media || 0) - (a.avaliacao_media || 0);
      }
      // "recente"
      return b.id.localeCompare(a.id);
    });
  }, [motoristas, search, filter, categoryFilter, partnerFilter, sortBy]);

  const handleDelete = async (id: string, perfilId: string) => {
    if (!confirm("Tem a certeza que deseja eliminar este motorista da plataforma?")) return;

    try {
      // 1. Eliminar registo do motorista
      const { error: mError } = await supabase.from("motoristas").delete().eq("id", id);
      if (mError) throw mError;

      // 2. Eliminar perfil correspondente
      const { error: pError } = await supabase.from("perfis").delete().eq("id", perfilId);
      if (pError) throw pError;

      setMotoristas((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert("Erro ao eliminar motorista da base de dados.");
    }
  };

  const toggleStatus = async (perfilId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("perfis")
        .update({ ativo: !currentStatus })
        .eq("id", perfilId);

      if (error) throw error;
      setMotoristas((prev) =>
        prev.map((m) =>
          m.perfil_id === perfilId
            ? { ...m, perfis: { ...m.perfis, ativo: !currentStatus } }
            : m
        )
      );
    } catch (err) {
      alert("Erro ao atualizar estado de atividade do perfil.");
    }
  };

  const toggleDisponivel = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("motoristas")
        .update({ disponivel: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      setMotoristas((prev) =>
        prev.map((m) => (m.id === id ? { ...m, disponivel: !currentStatus } : m))
      );
    } catch (err) {
      alert("Erro ao atualizar disponibilidade real-time.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header do Módulo com Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            <Link href="/admin/dashboard" className="hover:text-[#902ad1] transition-all">
              Painel
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Comunidade</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Motoristas</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
            Motoristas
          </h1>
        </div>
        <Link
          href="/admin/motoristas/novo"
          className="flex items-center justify-center gap-2 bg-[#902ad1] hover:bg-[#902ad1]/90 text-white px-6 py-3 rounded-[10px] font-semibold transition-all shadow-lg shadow-[#902ad1]/20 active:scale-95 shrink-0"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Novo Motorista</span>
        </Link>
      </div>

      {/* Barra de Estatísticas Coesa e Premium (Stats Bar) */}
      <div className={`p-5 flex flex-col md:flex-row items-center justify-around gap-6 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 ${THEME_TOKENS.cardStyle}`}>
        {/* Total de Motoristas */}
        <div className="flex items-center gap-4 w-full md:w-auto px-4 py-2 md:py-0 justify-center md:justify-start">
          <div className="p-3 bg-purple-50 text-[#902ad1] rounded-[10px] shrink-0">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-none">
              Total de Motoristas
            </span>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight mt-1 leading-none">
              <AnimatedCounter value={motoristas.length} />
            </h3>
          </div>
        </div>

        {/* Motoristas Disponíveis */}
        <div className="flex items-center gap-4 w-full md:w-auto px-4 py-2 md:py-0 justify-center md:justify-start pt-4 md:pt-0">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-[10px] shrink-0">
            <Check size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-none">
              Motoristas Livres
            </span>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight mt-1 leading-none">
              <AnimatedCounter value={motoristas.filter((m) => m.disponivel).length} />
            </h3>
          </div>
        </div>

        {/* Média de Avaliação */}
        <div className="flex items-center gap-4 w-full md:w-auto px-4 py-2 md:py-0 justify-center md:justify-start pt-4 md:pt-0">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-[10px] shrink-0">
            <Star size={20} className="fill-amber-400 text-amber-450" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-none">
              Avaliação Média
            </span>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight mt-1 leading-none">
              <AnimatedCounter
                value={Number(
                  (
                    motoristas.reduce((acc, m) => acc + (m.avaliacao_media || 5.0), 0) /
                    (motoristas.length || 1)
                  ).toFixed(1)
                )}
                decimals={1}
              />{" "}
              <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
            </h3>
          </div>
        </div>

        {/* Total de Viagens */}
        <div className="flex items-center gap-4 w-full md:w-auto px-4 py-2 md:py-0 justify-center md:justify-start pt-4 md:pt-0">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-[10px] shrink-0">
            <Car size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-none">
              Total de Viagens
            </span>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight mt-1 leading-none">
              <AnimatedCounter
                value={motoristas.reduce((acc, m) => acc + (m.total_viagens || 0), 0)}
              />
            </h3>
          </div>
        </div>
      </div>

      {/* Filtros Avançados */}
      <MotoristaFilters
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

      {/* Tabela ou Vista Dinâmica */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#902ad1]/20 border-t-[#902ad1] rounded-full animate-spin" />
        </div>
      ) : filteredAndSortedMotoristas.length > 0 ? (
        viewMode === "table" ? (
          <MotoristaTable
            motoristas={filteredAndSortedMotoristas}
            onDelete={handleDelete}
            onToggleStatus={toggleStatus}
            onToggleDisponivel={toggleDisponivel}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedMotoristas.map((motorista) => (
              <MotoristaCard
                key={motorista.id}
                motorista={motorista}
                onDelete={handleDelete}
                onToggleDisponivel={toggleDisponivel}
              />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[10px] border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">
            Nenhum motorista encontrado
          </h3>
          <p className="text-slate-400 mt-1 mb-8 text-sm max-w-xs text-center font-medium">
            Tente redefinir ou limpar os seus filtros avançados ou registe um novo motorista na plataforma.
          </p>
          <Link
            href="/admin/motoristas/novo"
            className="flex items-center gap-2 bg-[#902ad1] text-white px-8 py-3 rounded-[10px] font-semibold transition-all shadow-lg shadow-[#902ad1]/20 active:scale-95"
          >
            <Plus size={20} strokeWidth={3} />
            <span>Adicionar Novo Motorista</span>
          </Link>
        </div>
      )}
    </div>
  );
}
