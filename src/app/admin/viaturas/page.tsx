/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Car,
  Users,
  Briefcase,
  Wrench,
  Fuel,
  TrendingUp,
  MapPin,
  Calendar,
  AlertTriangle,
  RotateCw,
  ZoomIn,
  ZoomOut,
  X,
  FileText,
  ExternalLink,
  ShieldCheck,
  Building2,
  CheckCircle2,
  DollarSign,
  Compass,
  FileSpreadsheet,
  Gauge,
  Activity,
  UserCheck,
  Eye,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import ViaturaCard from "@/components/admin/viatura-card";
import ViaturaTable from "@/components/admin/viatura-table";
import ViaturaFilters from "@/components/admin/viatura-filters";
import { THEME_TOKENS } from "@/utils/design-system";

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
  motorista_id?: string | null;
}

export default function ViaturasPage() {
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todos" | "ativos" | "inativos">("todos");

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [partnerFilter, setPartnerFilter] = useState("todos");
  const [sortBy, setSortBy] = useState("recente");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Dynamic Aux data
  const [categories, setCategories] = useState<{ id: string; nome: string }[]>([]);
  const [partners, setPartners] = useState<{ id: string; nome: string }[]>([]);

  // Telemetry drawer controls
  const [selectedViatura, setSelectedViatura] = useState<Viatura | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<"specs" | "telemetry" | "maintenance" | "documents">("specs");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotationAngle, setRotationAngle] = useState(0);

  // Fetching data
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

  // Filter and Sort Selector
  const filteredAndSortedViaturas = useMemo(() => {
    const filtered = viaturas.filter((v) => {
      const matchesSearch =
        v.modelo.toLowerCase().includes(search.toLowerCase()) ||
        (v.marca || "").toLowerCase().includes(search.toLowerCase()) ||
        (v.matricula || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        filter === "todos" ||
        (filter === "ativos" && v.ativo) ||
        (filter === "inativos" && !v.ativo);

      const matchesCategory =
        categoryFilter === "todas" ||
        (v.categorias?.nome || "").toLowerCase() === categoryFilter.toLowerCase();

      const matchesPartner =
        partnerFilter === "todos" ||
        (v.parceiros?.nome || "").toLowerCase() === partnerFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesCategory && matchesPartner;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "preco-crescente") return a.preco_base - b.preco_base;
      if (sortBy === "preco-decrescente") return b.preco_base - a.preco_base;
      if (sortBy === "modelo-az") return a.modelo.localeCompare(b.modelo);
      if (sortBy === "ano-recente") return (b.ano || 0) - (a.ano || 0);
      return b.id.localeCompare(a.id);
    });
  }, [viaturas, search, filter, categoryFilter, partnerFilter, sortBy]);

  // Operational Bento KPIs calculations
  const stats = useMemo(() => {
    const total = viaturas.length;
    const ativas = viaturas.filter((v) => v.ativo).length;
    const ocupadas = Math.round(ativas * 0.75); // Mock utilization: 75% of active vehicles
    const totalKm = viaturas.reduce((acc, v) => acc + (v.km || 0), 0);
    const mediaKm = total > 0 ? Math.round(totalKm / total) : 0;
    
    // Critical state warnings (high mileage above 120,000 or status alert)
    const criticas = viaturas.filter((v) => (v.km || 0) > 100000).length;

    return { total, ativas, ocupadas, mediaKm, criticas };
  }, [viaturas]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que deseja eliminar esta viatura?")) return;

    try {
      const { error } = await supabase.from("viaturas").delete().eq("id", id);
      if (error) throw error;
      setViaturas((prev) => prev.filter((v) => v.id !== id));
      if (selectedViatura?.id === id) setSelectedViatura(null);
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
        prev.map((v) => (v.id === id ? { ...v, ativo: !currentStatus } : v))
      );
      
      // Update selected drawer state in real time
      if (selectedViatura?.id === id) {
        setSelectedViatura((prev) => (prev ? { ...prev, ativo: !currentStatus } : null));
      }
    } catch (err) {
      alert("Erro ao atualizar status.");
    }
  };

  // Toggle Selected Viatura Viewport
  const handleOpenDrawer = (viatura: Viatura) => {
    setSelectedViatura(viatura);
    setActiveDrawerTab("specs");
    setZoomLevel(100);
    setRotationAngle(0);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 font-sans relative overflow-hidden">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            <Link href="/admin/dashboard" className="hover:text-[#902ad1] transition-all">
              Painel
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-650">Frota</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Viaturas</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
            Gestão de Viaturas & Frota
          </h1>
        </div>

        <Link
          href="/admin/viaturas/nova"
          className="flex items-center justify-center gap-2 bg-[#902ad1] hover:bg-[#7a22b3] text-white px-5 py-3 rounded-[5px] font-semibold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#902ad1]/15 active:scale-95 shrink-0"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Nova Viatura</span>
        </Link>
      </div>

      {/* ── Bento Grid Operational KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Fleet */}
        <div className="bg-white p-5 border border-slate-100 rounded-[5px] shadow-sm flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Frota Total</span>
            <span className="text-3xl font-bold text-slate-800 block">{loading ? "—" : stats.total}</span>
            <span className="text-[9px] text-slate-450 font-semibold flex items-center gap-1">
              <Activity size={10} className="text-[#902ad1]" />
              {stats.ativas} ativas em sistema
            </span>
          </div>
          <div className="w-12 h-12 rounded-[5px] bg-purple-50 flex items-center justify-center border border-purple-100/60 text-[#902ad1] shrink-0 shadow-inner">
            <Car size={22} />
          </div>
        </div>

        {/* KPI 2: Live Utilization */}
        <div className="bg-white p-5 border border-slate-100 rounded-[5px] shadow-sm flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Taxa de Ocupação</span>
            <span className="text-3xl font-bold text-slate-800 block">
              {loading ? "—" : stats.total > 0 ? `${Math.round((stats.ocupadas / stats.total) * 100)}%` : "0%"}
            </span>
            <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp size={10} />
              ~{stats.ocupadas} em trânsito agora
            </span>
          </div>
          <div className="w-12 h-12 rounded-[5px] bg-emerald-50 flex items-center justify-center border border-emerald-100/60 text-emerald-600 shrink-0 shadow-inner">
            <Gauge size={22} />
          </div>
        </div>

        {/* KPI 3: Mileage Health */}
        <div className="bg-white p-5 border border-slate-100 rounded-[5px] shadow-sm flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Média de Rodagem</span>
            <span className="text-3xl font-bold text-slate-800 block">
              {loading ? "—" : `${stats.mediaKm.toLocaleString()}`} <small className="text-[11px] font-medium text-slate-450 uppercase">km</small>
            </span>
            <span className="text-[9px] text-slate-450 font-semibold flex items-center gap-1">
              <Compass size={10} className="text-indigo-550" />
              quilometragem média
            </span>
          </div>
          <div className="w-12 h-12 rounded-[5px] bg-indigo-50 flex items-center justify-center border border-indigo-100/60 text-indigo-650 shrink-0 shadow-inner">
            <Activity size={22} />
          </div>
        </div>

        {/* KPI 4: Alert State */}
        <div className="bg-white p-5 border border-slate-100 rounded-[5px] shadow-sm flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inspeção Crítica</span>
            <span className="text-3xl font-bold text-slate-800 block">
              {loading ? "—" : stats.criticas}
            </span>
            <span className="text-[9px] text-rose-600 font-semibold flex items-center gap-1">
              <AlertTriangle size={10} className="animate-pulse" />
              viaturas &gt; 100,000 km
            </span>
          </div>
          <div className="w-12 h-12 rounded-[5px] bg-rose-50 flex items-center justify-center border border-rose-100/60 text-rose-600 shrink-0 shadow-inner">
            <Wrench size={22} />
          </div>
        </div>
      </div>

      {/* ── Advanced Table Filters ── */}
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

      {/* ── Main Dashboard Views ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-3 bg-white border border-slate-100 rounded-[5px] shadow-sm">
          <div className="w-8 h-8 border-4 border-[#902ad1]/15 border-t-[#902ad1] rounded-full animate-spin" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">A carregar frota comercial...</span>
        </div>
      ) : filteredAndSortedViaturas.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 items-stretch">
            {filteredAndSortedViaturas.map((viatura) => (
              <ViaturaCard
                key={viatura.id}
                viatura={viatura}
                onDelete={handleDelete}
                onToggleStatus={toggleStatus}
                onViewDetails={handleOpenDrawer}
              />
            ))}
          </div>
        ) : (
          <ViaturaTable
            viaturas={filteredAndSortedViaturas}
            onDelete={handleDelete}
            onToggleStatus={toggleStatus}
            onViewDetails={handleOpenDrawer}
          />
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[5px] border-2 border-dashed border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
            <Car size={32} />
          </div>
          <h3 className="text-base font-bold text-slate-800 tracking-tight">Nenhuma viatura encontrada</h3>
          <p className="text-slate-400 mt-1 mb-8 text-xs max-w-xs text-center font-medium leading-relaxed">
            Ajuste os seus filtros de pesquisa ou adicione uma viatura inédita ao catálogo.
          </p>
          <Link
            href="/admin/viaturas/nova"
            className="flex items-center gap-2 bg-[#902ad1] text-white px-6 py-3 rounded-[5px] font-semibold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#902ad1]/15 active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Adicionar Primeira Viatura</span>
          </Link>
        </div>
      )}

      {/* ── 5. Slide-Over Telemetry & Auditing Drawer ── */}
      {selectedViatura && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setSelectedViatura(null)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-300" 
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-md shadow-2xl h-full flex flex-col justify-between border-l border-slate-100 animate-in slide-in-from-right duration-300 text-left">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 shrink-0 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-[#902ad1] bg-[#902ad1]/8 px-2 py-0.5 rounded border border-[#902ad1]/15">
                    {selectedViatura.matricula || "S/ MATRÍCULA"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider border ${
                    selectedViatura.ativo 
                      ? "bg-emerald-500/8 text-emerald-700 border-emerald-500/10" 
                      : "bg-rose-500/8 text-rose-700 border-rose-500/10"
                  }`}>
                    {selectedViatura.ativo ? "Operacional" : "Inativo"}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight mt-1.5">
                  Centro de Comando: {selectedViatura.marca} {selectedViatura.modelo}
                </h2>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  Parceiro: {selectedViatura.parceiros?.nome || "WiTransfer Official"}
                </p>
              </div>

              <button
                onClick={() => setSelectedViatura(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-[5px] transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Separator Tabs bar */}
            <div className="bg-slate-50 border-b border-slate-100 shrink-0 px-6 py-2.5 flex gap-2">
              {[
                { id: "specs", label: "Especificações", icon: Car },
                { id: "telemetry", label: "Telemetria & Mapa", icon: MapPin },
                { id: "maintenance", label: "Oficina & Alertas", icon: Wrench },
                { id: "documents", label: "Documentos", icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeDrawerTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDrawerTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-[5px] text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                      isActive
                        ? "bg-[#902ad1] text-white border-[#902ad1] shadow-sm"
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Icon size={12} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content Viewport */}
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar min-h-0 bg-slate-50/50">
              
              {/* TAB 1: Specs */}
              {activeDrawerTab === "specs" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 border border-slate-100 rounded-[5px] shadow-sm space-y-1">
                      <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Marca / Fabricante</span>
                      <span className="text-sm font-bold text-slate-700 block">{selectedViatura.marca || "—"}</span>
                    </div>

                    <div className="bg-white p-4 border border-slate-100 rounded-[5px] shadow-sm space-y-1">
                      <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Modelo</span>
                      <span className="text-sm font-bold text-slate-700 block">{selectedViatura.modelo}</span>
                    </div>

                    <div className="bg-white p-4 border border-slate-100 rounded-[5px] shadow-sm space-y-1">
                      <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Ano de Fabrico</span>
                      <span className="text-sm font-mono font-bold text-slate-750 block">{selectedViatura.ano || "—"}</span>
                    </div>

                    <div className="bg-white p-4 border border-slate-100 rounded-[5px] shadow-sm space-y-1">
                      <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Quilometragem</span>
                      <span className="text-sm font-mono font-bold text-slate-750 block">{selectedViatura.km?.toLocaleString() || 0} KM</span>
                    </div>

                    <div className="bg-white p-4 border border-slate-100 rounded-[5px] shadow-sm space-y-1">
                      <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Lugares / Lotação</span>
                      <span className="text-xs font-bold text-slate-750 flex items-center gap-1.5 mt-0.5">
                        <Users size={13} className="text-[#902ad1]" />
                        {selectedViatura.lugares} Lugares autorizados
                      </span>
                    </div>

                    <div className="bg-white p-4 border border-slate-100 rounded-[5px] shadow-sm space-y-1">
                      <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Capacidade Malas</span>
                      <span className="text-xs font-bold text-slate-750 flex items-center gap-1.5 mt-0.5">
                        <Briefcase size={13} className="text-[#902ad1]" />
                        {selectedViatura.malas} Malas grandes
                      </span>
                    </div>
                  </div>

                  {/* Financial Receipt */}
                  <div className="bg-white p-5 border border-slate-100 rounded-[5px] shadow-sm space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <DollarSign size={13} className="text-[#902ad1]" />
                      Detalhamento Financeiro Base
                    </h4>
                    
                    <div className="space-y-2 text-xs font-semibold text-slate-650">
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                        <span>Preço Base Diário</span>
                        <span className="text-slate-800 font-bold font-mono">
                          {selectedViatura.preco_base?.toLocaleString("pt-AO")} Kz
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                        <span>Categoria de Enquadramento</span>
                        <span className="text-slate-800 font-bold">
                          {selectedViatura.categorias?.nome || "Económica"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5">
                        <span>Taxa de Intermediação WiTransfer (15%)</span>
                        <span className="text-[#902ad1] font-bold font-mono">
                          {Math.round(selectedViatura.preco_base * 0.15).toLocaleString("pt-AO")} Kz
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Telemetry & Interactive Map */}
              {activeDrawerTab === "telemetry" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  {/* Mock live vector map */}
                  <div className="bg-slate-900 border border-slate-950/20 rounded-[5px] h-60 relative overflow-hidden flex items-center justify-center p-6 shadow-inner">
                    {/* Simulated vector grid lines */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-35" />
                    
                    {/* Mock Vector Route Line */}
                    <svg className="absolute inset-0 w-full h-full p-6" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path 
                        d="M 10,20 Q 30,50 60,30 T 90,80" 
                        fill="none" 
                        stroke="#902ad1" 
                        strokeWidth="1.5" 
                        strokeDasharray="4"
                        className="animate-pulse"
                      />
                      <circle cx="90" cy="80" r="3" fill="#10b981" />
                      <circle cx="10" cy="20" r="2.5" fill="#f59e0b" />
                    </svg>

                    <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-[5px] text-[9.5px] font-bold text-white select-none">
                      📍 GPS: Luanda, Angola (Última Conexão: Agora)
                    </div>

                    <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-[5px] text-left text-white select-none text-[8.5px] font-semibold space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-450 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span>TELEMETRIA ACTIVA</span>
                      </div>
                      <p>Velocidade: 62 km/h</p>
                      <p>Combustível: 78% (Gasóleo)</p>
                      <p>Ignição: LIGADA</p>
                    </div>
                  </div>

                  {/* Telemetry log events */}
                  <div className="bg-white p-4 border border-slate-100 rounded-[5px] shadow-sm text-left">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-50 mb-2.5">
                      Historial Recente de Ignição / Eventos
                    </h4>
                    
                    <div className="space-y-2 font-mono text-[9px] text-slate-500 leading-normal">
                      <div className="flex items-center gap-2 text-emerald-650">
                        <span className="font-bold">[11:42:05]</span>
                        <span>Motor em marcha (Velocidade média 60 km/h) na Via Expressa</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-650">
                        <span className="font-bold">[11:39:12]</span>
                        <span>Ignição LIGADA por Motorista Principal</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <span className="font-bold">[09:12:44]</span>
                        <span>Ignição DESLIGADA - Viagem terminada com sucesso</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Maintenance Timeline */}
              {activeDrawerTab === "maintenance" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="bg-white p-5 border border-slate-100 rounded-[5px] shadow-sm space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Wrench size={13} className="text-[#902ad1]" />
                      Estado de Conservação & Oficina
                    </h4>

                    <div className="space-y-3.5">
                      <div>
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                          <span>Vida Útil do Óleo do Motor</span>
                          <span className={(selectedViatura.km || 0) > 80000 ? "text-amber-600" : "text-emerald-600"}>
                            {(selectedViatura.km || 0) > 80000 ? "Recomenda-se mudança imediata" : "Saudável (78%)"}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-[5px] mt-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-[5px] transition-all duration-500 ${
                              (selectedViatura.km || 0) > 80000 ? "bg-amber-500 w-[20%]" : "bg-emerald-500 w-[78%]"
                            }`} 
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                          <span>Pneus & Alinhamento</span>
                          <span className="text-emerald-600">Alinhado há 3 meses (85%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-[5px] mt-1.5 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-[5px] w-[85%]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visual Maintenance timeline ledger */}
                  <div className="bg-white p-5 border border-slate-100 rounded-[5px] shadow-sm space-y-3.5 text-left">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Historial Operacional de Revisões
                    </h4>

                    <div className="relative pl-5 border-l-2 border-slate-100 space-y-4 text-xs">
                      <div className="relative">
                        <div className="absolute w-2 h-2 rounded-full bg-emerald-500 -left-[25px] top-1.5 border-2 border-white ring-2 ring-emerald-500/20" />
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">15 de Março de 2026</span>
                        <span className="font-bold text-slate-750 block mt-0.5">Substituição de Filtros e Calços de Travão</span>
                        <span className="text-[10px] text-slate-500 mt-1 block">Realizada na Oficina Oficial WiTransfer - Luanda.</span>
                      </div>

                      <div className="relative">
                        <div className="absolute w-2 h-2 rounded-full bg-emerald-500 -left-[25px] top-1.5 border-2 border-white ring-2 ring-emerald-500/20" />
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">10 de Janeiro de 2026</span>
                        <span className="font-bold text-slate-750 block mt-0.5">Inspeção Automóvel Periódica Geral</span>
                        <span className="text-[10px] text-slate-500 mt-1 block">Aprovada sem qualquer anotação desfavorável.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Auditing Documents */}
              {activeDrawerTab === "documents" && (
                <div className="space-y-4 animate-in fade-in duration-300 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Certificados de Inspeção / Seguro Automóvel
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8.5px] font-bold uppercase bg-purple-500/8 text-[#902ad1] border border-[#902ad1]/10">
                      <ShieldCheck size={9} />
                      Ficheiro Validado
                    </span>
                  </div>

                  <div className="bg-slate-900 border border-slate-950/20 rounded-[5px] relative overflow-hidden flex items-center justify-center p-6 shadow-inner min-h-[260px]">
                    {/* Simulated Insurance Document Certificate */}
                    <div
                      style={{
                        transform: `scale(${zoomLevel / 100}) rotate(${rotationAngle}deg)`,
                        transition: "transform 0.15s ease-out",
                      }}
                      className="w-full max-w-[200px] h-[260px] bg-slate-100/95 border-2 border-slate-300 rounded shadow-2xl relative flex flex-col justify-between p-4 text-slate-400 select-none shrink-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="w-10 h-1 bg-slate-300 rounded" />
                        <ShieldCheck size={28} className="text-[#902ad1] opacity-45 shrink-0" />
                      </div>
                      
                      <div className="space-y-4 my-auto text-center px-1">
                        <Car size={36} className="text-[#902ad1] opacity-30 mx-auto" />
                        <div className="space-y-1">
                          <p className="text-[8px] font-extrabold text-[#902ad1]/60 uppercase tracking-wider block">
                            Seguro Automóvel
                          </p>
                          <p className="text-[9.5px] font-extrabold text-slate-750 truncate max-w-[170px] mx-auto block leading-tight">
                            {selectedViatura.marca} {selectedViatura.modelo}
                          </p>
                          <p className="text-[7.5px] font-bold font-mono text-slate-500 mt-1 block">
                            Matrícula: {selectedViatura.matricula || "S/ MATRÍCULA"}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-end border-t border-slate-200 pt-2 text-[6.5px] font-bold uppercase tracking-widest text-slate-350">
                        <span>WiTransfer Fleet</span>
                        <span>Seguro Válido</span>
                      </div>
                    </div>

                    {/* Viewport Control Tools Overlay */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-slate-950/85 backdrop-blur-sm border border-white/10 rounded-[5px] p-1 shadow-2xl z-10 shrink-0">
                      <button
                        onClick={() => setZoomLevel((z) => Math.max(50, z - 20))}
                        className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded transition-all active:scale-90"
                        title="Zoom Out"
                      >
                        <ZoomOut size={13} />
                      </button>
                      <span className="text-[9.5px] font-bold text-white/90 px-1.5 select-none font-mono">
                        {zoomLevel}%
                      </span>
                      <button
                        onClick={() => setZoomLevel((z) => Math.min(200, z + 20))}
                        className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded transition-all active:scale-90"
                        title="Zoom In"
                      >
                        <ZoomIn size={13} />
                      </button>
                      <div className="h-4 w-[1px] bg-white/10 mx-1" />
                      <button
                        onClick={() => setRotationAngle((r) => (r + 90) % 360)}
                        className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded transition-all active:scale-90"
                        title="Rodar Documento"
                      >
                        <RotateCw size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Action Buttons Footer */}
            <div className="p-6 border-t border-slate-100 shrink-0 flex items-center justify-between bg-white rounded-b-2xl">
              <button
                onClick={() => toggleStatus(selectedViatura.id, !!selectedViatura.ativo)}
                className={`px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-[5px] transition-all border flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  selectedViatura.ativo
                    ? "text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border-rose-100 hover:border-rose-600"
                    : "text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-650 border-emerald-100 hover:border-emerald-650"
                }`}
              >
                {selectedViatura.ativo ? (
                  <>
                    <X size={14} strokeWidth={2.5} />
                    <span>Inativar Viatura</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} strokeWidth={2.5} />
                    <span>Ativar Viatura</span>
                  </>
                )}
              </button>

              <div className="flex gap-2">
                <Link
                  href={`/admin/viaturas/${selectedViatura.id}/editar`}
                  className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-655 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-[5px] transition-all flex items-center gap-1.5"
                >
                  <span>Editar Cadastro</span>
                </Link>
                
                <button
                  onClick={() => setSelectedViatura(null)}
                  className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-white bg-[#902ad1] hover:bg-[#7a22b3] rounded-[5px] transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#902ad1]/15"
                >
                  <span>Concluir</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
