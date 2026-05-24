/** @format */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Search,
  Loader2,
  UserCheck,
  ChevronRight,
  Mail,
  Phone,
  ArrowLeft,
  TrendingUp,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface ClienteInfo {
  id: string;
  nome_completo: string;
  email: string | null;
  telefone: string | null;
  foto_url: string | null;
  totalReservas: number;
  totalGasto: number;
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

function formatKz(value: number): string {
  return value.toLocaleString('pt-PT') + ' Kz';
}

export default function ParceiroClientesPage() {
  const [clientes, setClientes] = useState<ClienteInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchClientes = useCallback(async () => {
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

      // 3. Buscar viatura IDs do parceiro
      const { data: viaturasData } = await supabase
        .from('viaturas')
        .select('id')
        .eq('parceiro_id', parceiroId);

      const viaturaIds = (viaturasData || []).map((v: { id: string }) => v.id);
      if (viaturaIds.length === 0) {
        setClientes([]);
        return;
      }

      // 4. Buscar reservas das viaturas do parceiro
      const { data: reservasData } = await supabase
        .from('reservas')
        .select('cliente_id, criado_em, valor_total, status')
        .in('viatura_id', viaturaIds);

      if (!reservasData || reservasData.length === 0) {
        setClientes([]);
        return;
      }

      // 5. Agrupar por cliente
      const clientesMap = new Map<string, { totalReservas: number; totalGasto: number }>();
      reservasData.forEach((r: { cliente_id: string; valor_total: number | null }) => {
        if (!clientesMap.has(r.cliente_id)) {
          clientesMap.set(r.cliente_id, { totalReservas: 0, totalGasto: 0 });
        }
        const c = clientesMap.get(r.cliente_id)!;
        c.totalReservas++;
        c.totalGasto += r.valor_total || 0;
      });

      // 6. Buscar perfis dos clientes
      const clienteIds = [...clientesMap.keys()];
      const { data: perfisData } = await supabase
        .from('perfis')
        .select('id, nome_completo, telefone, email, foto_url')
        .in('id', clienteIds);

      const result: ClienteInfo[] = (perfisData || []).map(
        (p: { id: string; nome_completo: string; email: string | null; telefone: string | null; foto_url: string | null }) => ({
          id: p.id,
          nome_completo: p.nome_completo,
          email: p.email,
          telefone: p.telefone,
          foto_url: p.foto_url,
          totalReservas: clientesMap.get(p.id)?.totalReservas || 0,
          totalGasto: clientesMap.get(p.id)?.totalGasto || 0,
        })
      );

      // Ordenar por total gasto decrescente
      result.sort((a, b) => b.totalGasto - a.totalGasto);
      setClientes(result);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clientes;
    const q = search.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nome_completo.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.telefone?.toLowerCase().includes(q)
    );
  }, [clientes, search]);

  const totalGasto = useMemo(() => clientes.reduce((acc, c) => acc + c.totalGasto, 0), [clientes]);

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
              <span className="text-slate-600">Clientes</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight mt-0.5">
              Os Meus Clientes
            </h1>
          </div>
        </div>

        {/* KPI Total */}
        <div className="flex items-center gap-3">
          <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-[#902ad1]/10 flex items-center justify-center">
              <Users size={16} className="text-[#902ad1]" />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Total Clientes</p>
              <p className="text-lg font-semibold text-slate-800 leading-none">{clientes.length}</p>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Volume Total</p>
              <p className="text-sm font-semibold text-emerald-600 leading-none">{formatKz(totalGasto)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, email ou telefone..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50/70 border border-slate-100 rounded-xl text-[13px] font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-[#902ad1]/80 focus:ring-4 focus:ring-[#902ad1]/5 transition-all outline-none"
          />
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-[#902ad1]" />
            <p className="text-[13px] font-semibold text-slate-400">A carregar clientes...</p>
          </div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  <th className="py-3.5 px-5">Cliente</th>
                  <th className="py-3.5 px-5">Contacto</th>
                  <th className="py-3.5 px-5 text-center">Reservas</th>
                  <th className="py-3.5 px-5 text-right">Total Gasto</th>
                  <th className="py-3.5 px-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="text-[13px] font-medium text-slate-700 hover:bg-slate-50/60 hover:shadow-[inset_4px_0_0_0_#902ad1] transition-all duration-200"
                  >
                    {/* Avatar + Nome */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl overflow-hidden bg-[#902ad1]/8 flex items-center justify-center shrink-0 border border-[#902ad1]/10">
                          {c.foto_url ? (
                            <Image
                              src={c.foto_url}
                              alt={c.nome_completo}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <span className="text-[#902ad1] font-semibold text-[11px]">
                              {getIniciais(c.nome_completo)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate text-[13px]">
                            {c.nome_completo}
                          </p>
                          <p className="text-[11px] text-slate-400 font-normal">ID: {c.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>

                    {/* Contacto */}
                    <td className="py-3.5 px-5">
                      <div className="space-y-1">
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Mail size={11} className="text-[#902ad1] shrink-0" />
                            <span className="truncate max-w-[180px] font-normal">{c.email}</span>
                          </div>
                        )}
                        {c.telefone && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Phone size={11} className="text-[#902ad1] shrink-0" />
                            <span className="font-mono font-normal">{c.telefone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Reservas */}
                    <td className="py-3.5 px-5 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#902ad1]/8 text-[#902ad1] rounded-full text-[11px] font-semibold border border-[#902ad1]/10">
                        <ShoppingBag size={11} />
                        {c.totalReservas}
                      </div>
                    </td>

                    {/* Total Gasto */}
                    <td className="py-3.5 px-5 text-right">
                      <span className="text-[13px] font-semibold text-slate-800">
                        {formatKz(c.totalGasto)}
                      </span>
                    </td>

                    {/* Ação */}
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/parceiro/clientes/${c.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-[#902ad1] text-slate-500 hover:text-white rounded-xl text-[11px] font-medium uppercase tracking-wide border border-slate-100 hover:border-[#902ad1] transition-all duration-200 active:scale-95"
                      >
                        Ver
                        <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Estado Vazio */
        <div className="flex flex-col items-center justify-center py-24 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm text-center">
          <div className="w-20 h-20 rounded-3xl bg-[#902ad1]/8 flex items-center justify-center mb-5 border border-[#902ad1]/10">
            <UserCheck size={36} className="text-[#902ad1] opacity-70" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">
            {search ? 'Nenhum cliente encontrado' : 'Ainda não tem clientes'}
          </h3>
          <p className="text-slate-400 mt-2 text-[13px] max-w-xs font-medium">
            {search
              ? 'Tente alterar os termos de pesquisa.'
              : 'Os clientes que fizerem reservas nas suas viaturas aparecerão aqui.'}
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-5 px-5 py-2.5 bg-[#902ad1] text-white rounded-xl text-[12px] font-semibold transition-all hover:bg-[#902ad1]/90 active:scale-95"
            >
              Limpar pesquisa
            </button>
          )}
        </div>
      )}
    </div>
  );
}
