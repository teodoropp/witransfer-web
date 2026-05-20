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

  // Reactive filtering
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

      {/* Summary Stat Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Aprovações Pendentes</span>
            <span className="text-2xl font-bold text-amber-500 mt-1 block">{loading ? "..." : solicitacoes.length}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Verificados no Aplicativo</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">Tudo OK</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
            <CheckCircle size={20} />
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="bg-white p-4 rounded-[10px] border border-slate-100 shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquise por empresa, NIF, responsável ou e-mail..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-semibold focus:bg-white focus:border-[#902ad1] transition-all outline-none"
          />
        </div>
      </div>

      {/* Requests Container */}
      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-[10px] border border-slate-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#902ad1]" />
        </div>
      ) : filteredSolicitacoes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSolicitacoes.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-[10px] border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md hover:border-slate-200 transition-all relative overflow-hidden"
            >
              <div>
                <div className="flex items-start gap-4">
                  {/* Company Initials Avatar */}
                  <div className="w-12 h-12 rounded-[10px] bg-[#902ad1]/5 border border-[#902ad1]/10 flex items-center justify-center text-[#902ad1] font-bold text-sm shrink-0">
                    {getIniciais(s.nome)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-800 text-sm truncate leading-snug">{s.nome}</h3>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400 font-medium">
                      <span>NIF:</span>
                      <span className="font-semibold text-slate-500">{s.nif || "Não informado"}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[10px] text-[8px] font-bold uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-150">
                    Pendente
                  </span>
                </div>

                <div className="mt-5 space-y-2 border-t border-slate-50 pt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{s.email || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <span>{s.telefone || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">
                      {s.provincia && s.municipio ? `${s.provincia}, ${s.municipio}` : "Endereço incompleto"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
                  <Clock size={12} className="text-slate-450" />
                  <span>{formatDate(s.criado_em)}</span>
                </div>

                <button
                  onClick={() => router.push(`/admin/solicitacoes/${s.id}`)}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#902ad1] hover:text-[#7a22b3] bg-[#902ad1]/5 hover:bg-[#902ad1]/10 px-3 py-1.5 rounded-[10px] transition-all"
                >
                  <Eye size={12} />
                  <span>Analisar Registo</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[10px] border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-350 mb-4 border border-slate-100">
            <ShieldCheck size={32} />
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
