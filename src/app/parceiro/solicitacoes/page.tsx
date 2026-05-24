/** @format */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  User,
  ArrowLeft,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface MotoristaPerfil {
  nome_completo: string;
  email: string | null;
  telefone: string | null;
  foto_url: string | null;
}

interface Motorista {
  id: string;
  perfil_id: string;
  criado_em: string;
  status_aprovacao: string;
  perfis: MotoristaPerfil | null;
}

interface KPIs {
  pendentes: number;
  aprovados: number;
  rejeitados: number;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function getIniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function SolicitacoesPage() {
  const [pendentes, setPendentes] = useState<Motorista[]>([]);
  const [kpis, setKpis] = useState<KPIs>({ pendentes: 0, aprovados: 0, rejeitados: 0 });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Obter utilizador atual
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 2. Obter parceiroId
      const { data: parceiroData } = await supabase
        .from('parceiros')
        .select('id')
        .eq("usuario_id", user.id)
        .single();

      if (!parceiroData) return;
      const parceiroId = parceiroData.id;

      // 3. Buscar motoristas pendentes
      const { data: pendentesData } = await supabase
        .from('motoristas')
        .select(
          'id, perfil_id, criado_em, status_aprovacao, perfis!motoristas_perfil_id_fkey(nome_completo, email, telefone, foto_url)'
        )
        .eq('parceiro_id', parceiroId)
        .eq('status_aprovacao', 'pendente')
        .order('criado_em', { ascending: false });

      // 4. Buscar KPIs (contagens)
      const { count: aprovadosCount } = await supabase
        .from('motoristas')
        .select('id', { count: 'exact', head: true })
        .eq('parceiro_id', parceiroId)
        .eq('status_aprovacao', 'aprovado');

      const { count: rejeitadosCount } = await supabase
        .from('motoristas')
        .select('id', { count: 'exact', head: true })
        .eq('parceiro_id', parceiroId)
        .eq('status_aprovacao', 'rejeitado');

      const parsedPendentes: Motorista[] = (pendentesData || []).map((m: {
        id: string;
        perfil_id: string;
        criado_em: string;
        status_aprovacao: string;
        perfis: MotoristaPerfil | MotoristaPerfil[] | null;
      }) => ({
        ...m,
        perfis: Array.isArray(m.perfis) ? m.perfis[0] ?? null : m.perfis,
      }));

      setPendentes(parsedPendentes);
      setKpis({
        pendentes: parsedPendentes.length,
        aprovados: aprovadosCount || 0,
        rejeitados: rejeitadosCount || 0,
      });
    } catch (err) {
      console.error('Erro ao carregar solicitações:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAprovar = async (motorista: Motorista) => {
    try {
      setProcessingId(motorista.id);
      const { error } = await supabase
        .from('motoristas')
        .update({ status_aprovacao: 'aprovado', ativo: true })
        .eq('id', motorista.id);

      if (error) throw error;

      setPendentes((prev) => prev.filter((m) => m.id !== motorista.id));
      setKpis((prev) => ({
        ...prev,
        pendentes: prev.pendentes - 1,
        aprovados: prev.aprovados + 1,
      }));
    } catch (err) {
      console.error('Erro ao aprovar motorista:', err);
      alert('Erro ao aprovar motorista. Tente novamente.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejeitar = async (motorista: Motorista) => {
    const nome = motorista.perfis?.nome_completo || 'este motorista';
    if (!window.confirm(`Tem a certeza que deseja rejeitar a solicitação de ${nome}? Esta ação pode ser revertida posteriormente.`)) return;

    try {
      setProcessingId(motorista.id);
      const { error } = await supabase
        .from('motoristas')
        .update({ status_aprovacao: 'rejeitado', ativo: false })
        .eq('id', motorista.id);

      if (error) throw error;

      setPendentes((prev) => prev.filter((m) => m.id !== motorista.id));
      setKpis((prev) => ({
        ...prev,
        pendentes: prev.pendentes - 1,
        rejeitados: prev.rejeitados + 1,
      }));
    } catch (err) {
      console.error('Erro ao rejeitar motorista:', err);
      alert('Erro ao rejeitar motorista. Tente novamente.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/parceiro/dashboard"
            className="p-2.5 text-slate-400 hover:text-slate-700 bg-white/80 hover:bg-white rounded-2xl border border-slate-100/80 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              <Link href="/parceiro/dashboard" className="hover:text-[#902ad1] transition-all">
                Dashboard
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">Solicitações</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight mt-0.5">
              Solicitações de Motoristas
            </h1>
          </div>
        </div>

        {/* Badge pendentes */}
        {kpis.pendentes > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/60 rounded-2xl px-4 py-2.5">
            <Clock size={15} className="text-amber-600 animate-pulse" />
            <span className="text-[13px] font-semibold text-amber-700">
              {kpis.pendentes} {kpis.pendentes === 1 ? 'pendente' : 'pendentes'}
            </span>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pendentes */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-100 shadow-sm p-5 flex items-center justify-between hover:shadow-md hover:border-amber-200 transition-all duration-300">
          <div>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Aguardando Aprovação</p>
            <p className="text-2xl font-semibold text-amber-600 mt-0.5">{loading ? '—' : kpis.pendentes}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100">
            <Clock size={20} className="text-amber-600" />
          </div>
        </div>

        {/* Aprovados */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-100 shadow-sm p-5 flex items-center justify-between hover:shadow-md hover:border-emerald-200 transition-all duration-300">
          <div>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Aprovados Total</p>
            <p className="text-2xl font-semibold text-emerald-600 mt-0.5">{loading ? '—' : kpis.aprovados}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
            <ShieldCheck size={20} className="text-emerald-600" />
          </div>
        </div>

        {/* Rejeitados */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-rose-100 shadow-sm p-5 flex items-center justify-between hover:shadow-md hover:border-rose-200 transition-all duration-300">
          <div>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Rejeitados Total</p>
            <p className="text-2xl font-semibold text-rose-500 mt-0.5">{loading ? '—' : kpis.rejeitados}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-100">
            <ShieldX size={20} className="text-rose-500" />
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-[#902ad1]" />
            <p className="text-[13px] font-semibold text-slate-400">A carregar solicitações...</p>
          </div>
        </div>
      ) : pendentes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendentes.map((motorista) => {
            const perfil = motorista.perfis;
            const isProcessing = processingId === motorista.id;

            return (
              <div
                key={motorista.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-5 hover:shadow-lg hover:border-[#902ad1]/20 transition-all duration-300 relative overflow-hidden"
              >
                {/* Faixa decorativa */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-t-2xl" />

                {/* Perfil */}
                <div className="flex items-start gap-4 pt-1">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#902ad1]/8 flex items-center justify-center shrink-0 border border-[#902ad1]/10">
                    {perfil?.foto_url ? (
                      <Image
                        src={perfil.foto_url}
                        alt={perfil.nome_completo || ''}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-[#902ad1] font-semibold text-[13px]">
                        {perfil?.nome_completo ? getIniciais(perfil.nome_completo) : <User size={20} />}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 text-[15px] truncate leading-snug">
                      {perfil?.nome_completo || 'Motorista sem nome'}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60">
                      <Clock size={9} className="animate-pulse" />
                      Pendente
                    </span>
                  </div>
                </div>

                {/* Info de contacto */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  {perfil?.email && (
                    <div className="flex items-center gap-2 text-[12px] text-slate-600 font-medium">
                      <Mail size={13} className="text-[#902ad1] shrink-0" />
                      <span className="truncate">{perfil.email}</span>
                    </div>
                  )}
                  {perfil?.telefone && (
                    <div className="flex items-center gap-2 text-[12px] text-slate-600 font-medium">
                      <Phone size={13} className="text-[#902ad1] shrink-0" />
                      <span className="font-mono">{perfil.telefone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                    <Clock size={12} className="shrink-0" />
                    <span>Solicitado em {formatDate(motorista.criado_em)}</span>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => handleAprovar(motorista)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white rounded-xl text-[12px] font-semibold uppercase tracking-wide border border-emerald-200/60 hover:border-emerald-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    Aprovar
                  </button>

                  <button
                    onClick={() => handleRejeitar(motorista)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white rounded-xl text-[12px] font-semibold uppercase tracking-wide border border-rose-200/60 hover:border-rose-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <XCircle size={14} />
                    )}
                    Rejeitar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Estado vazio */
        <div className="flex flex-col items-center justify-center py-24 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-5 border border-emerald-100">
            <ShieldCheck size={36} className="text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Sem solicitações pendentes</h3>
          <p className="text-slate-400 mt-2 text-[13px] max-w-xs font-medium">
            Excelente! Todas as solicitações de motoristas foram processadas.
          </p>
        </div>
      )}
    </div>
  );
}
