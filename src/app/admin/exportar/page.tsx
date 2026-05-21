/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Download,
  Users,
  CreditCard,
  CalendarRange,
  Handshake,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Calendar,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface ExportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  tableName: string;
  filterType?: string;
  onExport: (tableName: string, startDate?: string, endDate?: string, filterType?: string) => Promise<void>;
}

const ExportCard = ({ title, description, icon, tableName, filterType, onExport }: ExportCardProps) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exporting, setExporting] = useState(false);

  const handleTriggerExport = async () => {
    setExporting(true);
    try {
      await onExport(tableName, startDate, endDate, filterType);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm flex flex-col justify-between gap-5 group hover:shadow-md transition-all duration-300">
      <div className="space-y-3">
        <div className="w-12 h-12 rounded-[10px] bg-[#902ad1]/5 border border-[#902ad1]/10 flex items-center justify-center text-[#902ad1] group-hover:scale-105 transition-transform duration-300">
          {icon}
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-450 font-medium leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Date Range Inputs */}
      <div className="space-y-2 pt-2 border-t border-slate-50">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Filtrar por Período (Opcional)</span>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-150 rounded-[10px] text-[10px] font-semibold text-slate-600 focus:outline-none focus:border-[#902ad1] transition-all cursor-pointer"
            />
          </div>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-150 rounded-[10px] text-[10px] font-semibold text-slate-600 focus:outline-none focus:border-[#902ad1] transition-all cursor-pointer"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleTriggerExport}
        disabled={exporting}
        className="w-full py-2.5 bg-[#902ad1] hover:bg-[#7a22b3] disabled:bg-slate-350 text-white rounded-[10px] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-[#902ad1]/15 disabled:opacity-75 cursor-pointer"
      >
        {exporting ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            <span>A Gerar Relatório...</span>
          </>
        ) : (
          <>
            <Download size={13} />
            <span>Exportar CSV</span>
          </>
        )}
      </button>
    </div>
  );
};

export default function ExportacaoDadosPage() {
  const [perfisCount, setPerfisCount] = useState(0);
  const [reservasCount, setReservasCount] = useState(0);
  const [pagamentosCount, setPagamentosCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  // Load estimate count
  const loadEstimates = useCallback(async () => {
    try {
      setLoadingStats(true);
      const { count: perfCount } = await supabase.from("perfis").select("*", { count: "exact", head: true });
      const { count: resCount } = await supabase.from("reservas").select("*", { count: "exact", head: true });
      const { count: payCount } = await supabase.from("pagamentos").select("*", { count: "exact", head: true });
      
      setPerfisCount(perfCount || 0);
      setReservasCount(resCount || 0);
      setPagamentosCount(payCount || 0);
    } catch (err) {
      console.error("Erro ao carregar totais de registos:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    loadEstimates();
  }, [loadEstimates]);

  // General CSV conversion and download handler
  const handleExportData = async (tableName: string, startDate?: string, endDate?: string, filterType?: string) => {
    try {
      let query = supabase.from(tableName).select("*");

      // Apply type filtering for profiles (clientes, motoristas, etc.)
      if (tableName === "perfis" && filterType) {
        query = query.eq("tipo", filterType);
      }

      // Apply Date ranges if defined
      if (startDate) {
        const fieldMap = {
          reservas: "criado_em",
          pagamentos: "criado_em",
          perfis: "criado_em",
          parceiros: "criado_em",
        };
        const dateField = fieldMap[tableName as keyof typeof fieldMap] || "criado_em";
        query = query.gte(dateField, new Date(startDate).toISOString());
      }
      if (endDate) {
        const fieldMap = {
          reservas: "criado_em",
          pagamentos: "criado_em",
          perfis: "criado_em",
          parceiros: "criado_em",
        };
        const dateField = fieldMap[tableName as keyof typeof fieldMap] || "criado_em";
        // End of the day
        const endIso = new Date(endDate);
        endIso.setHours(23, 59, 59, 999);
        query = query.lte(dateField, endIso.toISOString());
      }

      const { data, error } = await query.order("criado_em", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        alert("Sem registos encontrados para o período e filtros selecionados.");
        return;
      }

      // Transform raw data into flat CSV format
      const csvHeaders = Object.keys(data[0]);
      const csvRows = data.map((row: any) =>
        csvHeaders
          .map((header) => {
            const val = row[header];
            if (val === null || val === undefined) return '""';
            if (typeof val === "object") return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(",")
      );

      const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");

      // Trigger browser download
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      const fileNameSuffix = filterType ? `${filterType}_` : "";
      const dateString = new Date().toISOString().split("T")[0];
      
      link.setAttribute("href", url);
      link.setAttribute("download", `witransfer_${fileNameSuffix}${tableName}_${dateString}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err: any) {
      console.error("Erro na exportação de dados:", err);
      alert("Erro ao tentar exportar o relatório: " + (err.message || "Erro desconhecido"));
    }
  };

  const estimatedTotalRegistos = useMemo(() => {
    return perfisCount + reservasCount + pagamentosCount;
  }, [perfisCount, reservasCount, pagamentosCount]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          <Link href="/admin/dashboard" className="hover:text-[#902ad1] transition-all">
            Painel
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">Relatórios & Contas</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">Exportação Dados</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
          Exportação de Dados
        </h1>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Registos Totais</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">{loadingStats ? "..." : estimatedTotalRegistos}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <Database size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Total de Reservas</span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block">{loadingStats ? "..." : reservasCount}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
            <CalendarRange size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Pagamentos Concluídos</span>
            <span className="text-2xl font-bold text-[#902ad1] mt-1 block">{loadingStats ? "..." : pagamentosCount}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-[#902ad1]/5 border border-[#902ad1]/10 flex items-center justify-center text-[#902ad1]">
            <CreditCard size={20} />
          </div>
        </div>
      </div>

      {/* Warning/Best practices alert */}
      <div className="p-4 bg-[#902ad1]/5 border border-[#902ad1]/10 rounded-[10px] text-xs font-semibold text-[#902ad1] flex items-start gap-3">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <span className="block font-bold">Instruções de Auditoria e Segurança de Dados</span>
          <p className="font-medium text-slate-600">
            Todas as exportações são registadas nos logs de auditoria do sistema. A descarga de informações pessoais de clientes (nomes, contactos, endereços) deve estar estritamente justificada para fins operacionais da plataforma. Os ficheiros CSV gerados são compatíveis com Excel, Google Sheets e softwares de BI.
          </p>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ExportCard
          title="Relatório de Clientes"
          description="Contém a lista de todos os utilizadores da categoria 'cliente' registados, incluindo nome, telefone, email, morada e data de adesão."
          icon={<Users size={22} />}
          tableName="perfis"
          filterType="cliente"
          onExport={handleExportData}
        />

        <ExportCard
          title="Relatório de Motoristas"
          description="Ficheiro com o cadastro de motoristas da plataforma, incluindo documento de identificação (BI/NIF), género e estado de atividade."
          icon={<Users size={22} />}
          tableName="perfis"
          filterType="motorista"
          onExport={handleExportData}
        />

        <ExportCard
          title="Relatório de Parceiros"
          description="Contém os parceiros registados associados aos motoristas, taxas de comissão correspondentes e volumes de frotas ativas."
          icon={<Handshake size={22} />}
          tableName="parceiros"
          onExport={handleExportData}
        />

        <ExportCard
          title="Relatório de Reservas"
          description="Planilha detalhada de transfer, contendo códigos de viagem, pontos de recolha/entrega, motoristas atribuídos, passageiros e status."
          icon={<CalendarRange size={22} />}
          tableName="reservas"
          onExport={handleExportData}
        />

        <ExportCard
          title="Histórico Financeiro (Pagamentos)"
          description="Ledger completo com valores, métodos de pagamento, referências bancárias de transferências e status de aprovação de receitas."
          icon={<CreditCard size={22} />}
          tableName="pagamentos"
          onExport={handleExportData}
        />
      </div>
    </div>
  );
}
