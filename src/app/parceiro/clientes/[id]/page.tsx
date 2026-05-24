/** @format */

'use client';

import React, { use, useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Loader2,
  Mail,
  Phone,
  AlertTriangle,
  MapPin,
  CalendarDays,
  ShoppingBag,
  TrendingUp,
  Car,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface PerfilCliente {
  id: string;
  nome_completo: string;
  email: string | null;
  telefone: string | null;
  foto_url: string | null;
  morada: string | null;
  criado_em: string;
}

interface ViaturaInfo {
  modelo: string | null;
  matricula: string | null;
}

interface Reserva {
  id: string;
  codigo: string;
  status: string;
  data_recolha: string;
  local_partida: string;
  local_destino: string;
  valor_total: number;
  viaturas: ViaturaInfo | null;
}

interface ClienteDetalhePageProps {
  params: Promise<{ id: string }>;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatKz(value: number): string {
  return value.toLocaleString('pt-PT') + ' Kz';
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

function getStatusStyle(status: string): string {
  if (status === 'concluido' || status === 'concluida')
    return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
  if (status === 'cancelada' || status === 'cancelado')
    return 'bg-rose-50 text-rose-600 border-rose-200/60';
  if (status === 'confirmada' || status === 'confirmado')
    return 'bg-blue-50 text-blue-600 border-blue-200/60';
  return 'bg-amber-50 text-amber-600 border-amber-200/60';
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    concluido: 'Concluída',
    concluida: 'Concluída',
    cancelada: 'Cancelada',
    cancelado: 'Cancelado',
    confirmada: 'Confirmada',
    confirmado: 'Confirmado',
    pendente: 'Pendente',
    em_curso: 'Em curso',
  };
  return map[status] || status;
}

export default function ClienteDetalhePage({ params }: ClienteDetalhePageProps) {
  const resolvedParams = use(params);
  const clienteId = resolvedParams.id;

  const [cliente, setCliente] = useState<PerfilCliente | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // 1. Obter utilizador atual e parceiroId
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: parceiroData } = await supabase
          .from('parceiros')
          .select('id')
          .eq("usuario_id", user.id)
          .single();

        if (!parceiroData) return;
        const parceiroId = parceiroData.id;

        // 2. Buscar perfil do cliente
        const { data: perfilData, error: perfilError } = await supabase
          .from('perfis')
          .select('id, nome_completo, email, telefone, foto_url, morada, criado_em')
          .eq('id', clienteId)
          .single();

        if (perfilError || !perfilData) {
          setNotFound(true);
          return;
        }
        setCliente(perfilData);

        // 3. Buscar viaturas do parceiro
        const { data: viaturasData } = await supabase
          .from('viaturas')
          .select('id')
          .eq('parceiro_id', parceiroId);

        const viaturaIds = (viaturasData || []).map((v: { id: string }) => v.id);

        if (viaturaIds.length === 0) {
          setReservas([]);
          return;
        }

        // 4. Buscar reservas do cliente com viaturas do parceiro
        const { data: reservasData } = await supabase
          .from('reservas')
          .select(
            'id, codigo, status, data_recolha, local_partida, local_destino, valor_total, viaturas!reservas_viatura_id_fkey(modelo, matricula)'
          )
          .eq('cliente_id', clienteId)
          .in('viatura_id', viaturaIds)
          .order('data_recolha', { ascending: false });

        const parsedReservas: Reserva[] = (reservasData || []).map((r: {
          id: string;
          codigo: string;
          status: string;
          data_recolha: string;
          local_partida: string;
          local_destino: string;
          valor_total: number;
          viaturas: ViaturaInfo | ViaturaInfo[] | null;
        }) => ({
          ...r,
          viaturas: Array.isArray(r.viaturas) ? r.viaturas[0] ?? null : r.viaturas,
        }));

        setReservas(parsedReservas);
      } catch (err) {
        console.error('Erro ao carregar dados do cliente:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [clienteId]);

  const totalGasto = reservas.reduce((acc, r) => acc + (r.valor_total || 0), 0);

  // Estado de loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-10 h-10 text-[#902ad1] animate-spin" />
        <p className="text-[13px] font-semibold text-slate-400 uppercase tracking-widest">
          A carregar ficha do cliente...
        </p>
      </div>
    );
  }

  // Estado não encontrado
  if (notFound || !cliente) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm text-center">
        <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center mb-5 border border-rose-100">
          <AlertTriangle size={36} className="text-rose-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">Cliente não encontrado</h3>
        <p className="text-slate-400 mt-2 text-[13px] max-w-xs font-medium">
          O cliente que procura não existe ou não pertence às suas viaturas.
        </p>
        <Link
          href="/parceiro/clientes"
          className="mt-6 px-6 py-2.5 bg-[#902ad1] text-white rounded-xl text-[12px] font-semibold transition-all hover:bg-[#902ad1]/90 active:scale-95 shadow-md shadow-[#902ad1]/20"
        >
          Voltar para a lista
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/parceiro/clientes"
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
            <Link href="/parceiro/clientes" className="hover:text-[#902ad1] transition-all">
              Clientes
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Detalhe</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight mt-0.5">
            Ficha do Cliente
          </h1>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

        {/* ── Card Perfil (4 cols) ── */}
        <div className="md:col-span-4 bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#902ad1]/20 transition-all duration-300 p-8 flex flex-col items-center text-center relative overflow-hidden">
          {/* Faixa decorativa */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#902ad1] to-purple-400 rounded-t-[24px]" />

          {/* Foto */}
          <div className="relative w-24 h-24 rounded-3xl overflow-hidden bg-gradient-to-br from-[#902ad1]/15 to-[#902ad1]/5 flex items-center justify-center border-4 border-[#902ad1]/10 shadow-inner mt-4">
            {cliente.foto_url ? (
              <Image
                src={cliente.foto_url}
                alt={cliente.nome_completo}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-[#902ad1] font-semibold text-2xl">
                {getIniciais(cliente.nome_completo)}
              </span>
            )}
          </div>

          <h2 className="text-xl font-semibold text-slate-800 mt-4 leading-tight tracking-tight px-2">
            {cliente.nome_completo}
          </h2>
          <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-purple-50 text-[#902ad1] border border-purple-200/40">
            <User size={9} />
            Cliente WiTransfer
          </span>

          <div className="w-full h-px bg-slate-100 my-5" />

          {/* Contactos */}
          <div className="w-full space-y-3 text-left">
            {cliente.email && (
              <div className="flex items-center gap-3 text-[12px]">
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                  <Mail size={13} className="text-[#902ad1]" />
                </div>
                <span className="text-slate-600 font-semibold truncate">{cliente.email}</span>
              </div>
            )}
            {cliente.telefone && (
              <div className="flex items-center gap-3 text-[12px]">
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                  <Phone size={13} className="text-[#902ad1]" />
                </div>
                <span className="text-slate-600 font-semibold font-mono">{cliente.telefone}</span>
              </div>
            )}
            {cliente.morada && (
              <div className="flex items-center gap-3 text-[12px]">
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                  <MapPin size={13} className="text-[#902ad1]" />
                </div>
                <span className="text-slate-600 font-semibold truncate">{cliente.morada}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-[12px]">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                <CalendarDays size={13} className="text-[#902ad1]" />
              </div>
              <span className="text-slate-500 font-medium">Desde {formatDate(cliente.criado_em)}</span>
            </div>
          </div>
        </div>

        {/* ── Coluna Direita (8 cols) ── */}
        <div className="md:col-span-8 flex flex-col gap-5">

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-between hover:shadow-md hover:border-[#902ad1]/20 transition-all duration-300">
              <div>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
                  Total de Reservas
                </p>
                <p className="text-2xl font-semibold text-[#902ad1] mt-0.5">{reservas.length}</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#902ad1]/8 flex items-center justify-center border border-[#902ad1]/10">
                <ShoppingBag size={20} className="text-[#902ad1]" />
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-between hover:shadow-md hover:border-emerald-200 transition-all duration-300">
              <div>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
                  Total Gasto
                </p>
                <p className="text-xl font-semibold text-emerald-600 mt-0.5">{formatKz(totalGasto)}</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                <TrendingUp size={20} className="text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Histórico de Reservas */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm flex-1 overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">
                  Histórico nas suas viaturas
                </p>
                <h3 className="text-[15px] font-semibold text-slate-800 mt-0.5">
                  Reservas & Viagens
                </h3>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#902ad1]/8 flex items-center justify-center border border-[#902ad1]/10">
                <Car size={16} className="text-[#902ad1]" />
              </div>
            </div>

            {reservas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/60 text-[10px] font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="py-3 px-5">Código</th>
                      <th className="py-3 px-5">Data</th>
                      <th className="py-3 px-5">Trajeto</th>
                      <th className="py-3 px-5">Viatura</th>
                      <th className="py-3 px-5 text-right">Valor</th>
                      <th className="py-3 px-5 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {reservas.map((r) => (
                      <tr
                        key={r.id}
                        className="text-[12px] font-semibold text-slate-700 hover:bg-slate-50/60 hover:shadow-[inset_4px_0_0_0_#902ad1] transition-all duration-200"
                      >
                        <td className="py-3.5 px-5 font-semibold text-[#902ad1]">
                          {r.codigo || '—'}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap text-slate-500">
                          {formatDate(r.data_recolha)}
                        </td>
                        <td className="py-3.5 px-5 max-w-[180px]">
                          <p className="truncate text-slate-700" title={`${r.local_partida} → ${r.local_destino}`}>
                            {r.local_partida} → {r.local_destino}
                          </p>
                        </td>
                        <td className="py-3.5 px-5 text-slate-500">
                          {r.viaturas ? (
                            <span className="font-mono text-[11px]">
                              {r.viaturas.modelo || '—'}{' '}
                              {r.viaturas.matricula ? `(${r.viaturas.matricula})` : ''}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right font-semibold text-slate-800">
                          {formatKz(r.valor_total)}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider border ${getStatusStyle(
                              r.status
                            )}`}
                          >
                            {getStatusLabel(r.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3 border border-slate-100">
                  <ShoppingBag size={24} className="text-slate-300" />
                </div>
                <p className="text-[13px] font-semibold text-slate-400">
                  Este cliente ainda não fez reservas nas suas viaturas.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
