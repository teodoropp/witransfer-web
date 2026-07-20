/** @format */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Loader2,
  CheckCheck,
  ArrowLeft,
  Info,
  AlertTriangle,
  Car,
  CreditCard,
  Star,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criado_em: string;
  tipo: string | null;
}

function getIconePorTipo(tipo: string | null) {
  switch (tipo) {
    case 'reserva':
      return <Car size={16} className="text-[#902ad1]" />;
    case 'pagamento':
      return <CreditCard size={16} className="text-emerald-500" />;
    case 'avaliacao':
      return <Star size={16} className="text-amber-500" />;
    case 'alerta':
      return <AlertTriangle size={16} className="text-rose-500" />;
    case 'aprovacao':
      return <ShieldCheck size={16} className="text-emerald-500" />;
    case 'mensagem':
      return <MessageSquare size={16} className="text-blue-500" />;
    default:
      return <Info size={16} className="text-slate-400" />;
  }
}

function formatDataRelativa(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const agora = new Date();
    const diffMs = agora.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Agora mesmo';
    if (diffMin < 60) return `Há ${diffMin} min`;
    if (diffHour < 24) return `Há ${diffHour}h`;
    if (diffDay === 1) return 'Ontem';
    if (diffDay < 7) return `Há ${diffDay} dias`;

    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [marcandoTodas, setMarcandoTodas] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const fetchNotificacoes = useCallback(async () => {
    try {
      setLoading(true);

      // Buscar utilizador atual
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Buscar notificações
      const { data: notifs } = await supabase
        .from('notificacoes')
        .select('id, titulo, mensagem, lida, criado_em, tipo')
        .eq('usuario_id', user.id)
        .order('criado_em', { ascending: false });

      setNotificacoes(notifs || []);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  const marcarLida = async (id: string) => {
    // Atualizar UI imediatamente (optimistic update)
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );

    await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
  };

  const marcarTodasLidas = async () => {
    if (!userId || naoLidas === 0) return;

    try {
      setMarcandoTodas(true);

      // Atualizar UI imediatamente
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));

      await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('usuario_id', userId)
        .eq('lida', false);
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
      // Reverter em caso de erro
      fetchNotificacoes();
    } finally {
      setMarcandoTodas(false);
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
              <span className="text-slate-600">Notificações</span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Notificações</h1>
              {naoLidas > 0 && (
                <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-[#902ad1] text-white text-[11px] font-semibold rounded-full shadow-[0_2px_8px_rgba(144,42,209,0.4)]">
                  {naoLidas > 99 ? '99+' : naoLidas}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Botão Marcar todas como lidas */}
        {naoLidas > 0 && (
          <button
            onClick={marcarTodasLidas}
            disabled={marcandoTodas}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#902ad1]/8 hover:bg-[#902ad1] text-[#902ad1] hover:text-white rounded-2xl text-[12px] font-semibold uppercase tracking-wide border border-[#902ad1]/20 hover:border-[#902ad1] transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            {marcandoTodas ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCheck size={14} />
            )}
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Lista de notificações */}
      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-[#902ad1]" />
            <p className="text-[13px] font-semibold text-slate-400">A carregar notificações...</p>
          </div>
        </div>
      ) : notificacoes.length > 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
          {notificacoes.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.lida && marcarLida(notif.id)}
              className={`flex items-start gap-4 px-5 py-4 transition-all duration-200 relative ${
                notif.lida
                  ? 'bg-white hover:bg-slate-50/60 cursor-default'
                  : 'bg-[#902ad1]/[0.03] hover:bg-[#902ad1]/[0.06] cursor-pointer'
              }`}
            >
              {/* Ponto indicador não lida */}
              {!notif.lida && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#902ad1]" />
              )}

              {/* Ícone tipo */}
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                  notif.lida
                    ? 'bg-slate-50 border-slate-100'
                    : 'bg-[#902ad1]/8 border-[#902ad1]/10'
                }`}
              >
                {getIconePorTipo(notif.tipo)}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <p
                    className={`text-[13px] leading-snug truncate ${
                      notif.lida ? 'font-semibold text-slate-600' : 'font-semibold text-slate-850'
                    }`}
                  >
                    {notif.titulo}
                  </p>
                  <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap shrink-0 mt-0.5">
                    {formatDataRelativa(notif.criado_em)}
                  </span>
                </div>
                <p
                  className={`text-[12px] mt-0.5 leading-relaxed line-clamp-2 ${
                    notif.lida ? 'text-slate-400' : 'text-slate-500 font-medium'
                  }`}
                >
                  {notif.mensagem}
                </p>
                {notif.tipo && (
                  <span
                    className={`inline-block mt-1.5 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      notif.lida
                        ? 'bg-slate-100 text-slate-400'
                        : 'bg-[#902ad1]/8 text-[#902ad1] border border-[#902ad1]/10'
                    }`}
                  >
                    {notif.tipo}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Estado vazio */
        <div className="flex flex-col items-center justify-center py-24 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="w-20 h-20 rounded-3xl bg-[#902ad1]/8 flex items-center justify-center mb-5 border border-[#902ad1]/10">
            <Bell size={36} className="text-[#902ad1] opacity-60" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Nenhuma notificação</h3>
          <p className="text-slate-400 mt-2 text-[13px] max-w-xs font-medium">
            Está tudo em ordem! Não tem notificações de momento.
          </p>
        </div>
      )}
    </div>
  );
}
