/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  Loader2,
  Clock,
  MapPin,
  Mail,
  Phone,
  Eye,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface SolicitacaoParceiro {
  id: string;
  nome: string;
  nif: string | null;
  email: string | null;
  telefone: string | null;
  responsavel_nome: string | null;
  provincia: string | null;
  municipio: string | null;
  status_aprovacao: string | null;
  criado_em: string;
}

export default function SolicitacoesPage() {
  const router = useRouter();
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoParceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchSolicitacoes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("parceiros")
        .select("id, nome, nif, email, telefone, responsavel_nome, provincia, municipio, status_aprovacao, criado_em")
        .eq("status_aprovacao", "pendente")
        .order("criado_em", { ascending: false });

      if (error) throw error;
      setSolicitacoes(data || []);
    } catch (err) {
      console.error("Erro ao carregar solicitações:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSolicitacoes();
  }, [fetchSolicitacoes]);

  // Filtragem reativa
  const filteredSolicitacoes = useMemo(() => {
    return solicitacoes.filter((s) => {
      return (
        s.nome.toLowerCase().includes(search.toLowerCase()) ||
        s.responsavel_nome?.toLowerCase().includes(search.toLowerCase()) ||
        s.nif?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [solicitacoes, search]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const getIniciais = (name: string) => {
    if (!name) return "P";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
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
            <span className="text-slate-600">Solicitações</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
            Solicitações de Parceiros
          </h1>
        </div>
      </div>

      {/* Summary Stat Card - Bento Box Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Aprovações Pendentes */}
        <div className="bg-white rounded-[10px] border border-slate-100/90 shadow-sm hover:shadow-md hover:scale-[1.01] hover:shadow-[#902ad1]/3 hover:border-amber-500/15 transition-all duration-300 ease-out p-5 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block">
              Aprovações Pendentes
            </span>
            <span className="text-lg font-semibold text-amber-600 tracking-tight mt-0.5 block">
              {loading ? "..." : solicitacoes.length}
            </span>
          </div>
          <div className="w-10 h-10 bg-amber-500/8 text-amber-550 rounded-[10px] flex items-center justify-center border border-amber-500/10">
            <Clock size={18} strokeWidth={2} />
          </div>
        </div>

        {/* Verificados no Aplicativo */}
        <div className="bg-white rounded-[10px] border border-slate-100/90 shadow-sm hover:shadow-md hover:scale-[1.01] hover:shadow-[#902ad1]/3 hover:border-emerald-500/15 transition-all duration-300 ease-out p-5 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block">
              Verificados no Aplicativo
            </span>
            <span className="text-lg font-semibold text-emerald-600 tracking-tight mt-0.5 block">
              Tudo OK
            </span>
          </div>
          <div className="w-10 h-10 bg-emerald-500/8 text-emerald-650 rounded-[10px] flex items-center justify-center border border-emerald-500/10">
            <ShieldCheck size={18} strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="bg-white p-4 rounded-[10px] border border-slate-100/90 shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquise por empresa, NIF, responsável ou e-mail..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50/70 border border-slate-100 rounded-[10px] text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-[#902ad1]/80 focus:ring-4 focus:ring-[#902ad1]/5 transition-all outline-none"
          />
        </div>
      </div>

      {/* Requests Container */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-[10px] border border-slate-100/90 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#902ad1]" />
        </div>
      ) : filteredSolicitacoes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {filteredSolicitacoes.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-[10px] border border-slate-100/90 shadow-sm p-6 flex flex-col justify-between hover:shadow-lg hover:scale-[1.01] hover:shadow-[#902ad1]/3 hover:border-[#902ad1]/15 transition-all duration-350 relative overflow-hidden h-full"
            >
              <div>
                <div className="flex items-start gap-4">
                  {/* Avatar com as iniciais da empresa */}
                  <div className="w-12 h-12 rounded-[10px] bg-[#902ad1]/8 text-[#902ad1] border border-[#902ad1]/10 flex items-center justify-center font-bold text-sm shrink-0">
                    {getIniciais(s.nome)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-800 text-sm truncate leading-snug">
                      {s.nome}
                    </h3>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400 font-medium">
                      <span>NIF:</span>
                      <span className="font-semibold font-mono text-slate-600">{s.nif || "Não informado"}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-amber-500/8 text-amber-700 border border-amber-500/10 shrink-0">
                    <Clock size={10} strokeWidth={2.5} className="shrink-0 animate-pulse text-amber-600" />
                    Pendente
                  </span>
                </div>

                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <Mail size={13} className="text-[#902ad1] shrink-0" />
                    <span className="truncate">{s.email || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <Phone size={13} className="text-[#902ad1] shrink-0" />
                    <span className="font-mono">{s.telefone || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <MapPin size={13} className="text-[#902ad1] shrink-0" />
                    <span className="truncate">
                      {s.provincia && s.municipio ? `${s.provincia}, ${s.municipio}` : "Endereço incompleto"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-semibold uppercase tracking-widest">
                  <Clock size={12} className="text-slate-450 shrink-0" />
                  <span>{formatDate(s.criado_em)}</span>
                </div>

                <button
                  onClick={() => router.push(`/admin/solicitacoes/${s.id}`)}
                  className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#902ad1] hover:text-white bg-[#902ad1]/8 hover:bg-[#902ad1] px-4 py-2.5 rounded-[10px] transition-all cursor-pointer active:scale-95 shadow-sm shadow-[#902ad1]/5 hover:scale-[1.01]"
                >
                  <Eye size={12} strokeWidth={2.5} />
                  <span>Analisar Registo</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[10px] border border-slate-100/90 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-350 mb-4 border border-slate-100 shadow-inner">
            <ShieldCheck size={32} className="text-[#902ad1]" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Sem solicitações pendentes</h3>
          <p className="text-slate-400 mt-1 text-sm max-w-xs font-medium">
            Excelente trabalho! Todos os registos de parceiros foram analisados e não existem pendências.
          </p>
        </div>
      )}
    </div>
  );
}
