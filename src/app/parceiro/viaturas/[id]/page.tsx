/** @format */

"use client";

import React, { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Car,
  Edit2,
  Loader2,
  Wind,
  Users,
  Briefcase,
  DollarSign,
  Tag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  User,
  History,
  ShieldCheck,
  Navigation,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ViaturaDetalhe {
  id: string;
  modelo: string;
  marca: string | null;
  matricula: string | null;
  ano: number | null;
  lugares: number;
  malas: number;
  foto_url: string | null;
  ativo: boolean;
  preco_base: number;
  ar_condicionado: boolean | null;
  transmissao: string | null;
  categoria_id: string | null;
  categorias?: { nome: string } | null;
}

interface Condutor {
  id: string;
  avaliacao_media: number;
  disponivel: boolean;
  perfis: {
    nome_completo: string;
    telefone: string | null;
    foto_url: string | null;
  };
}

interface ReservaResumida {
  id: string;
  codigo: string | null;
  status: string;
  data_recolha: string | null;
  valor_total: number;
  cliente: {
    nome_completo: string;
  } | null;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  aguarda_pagamento: {
    label: "Pendente",
    className: "bg-amber-50 text-amber-600 border-amber-200",
  },
  pago: {
    label: "Pago",
    className: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
  em_andamento: {
    label: "Em Curso",
    className: "bg-blue-50 text-blue-600 border-blue-200",
  },
  concluida: {
    label: "Concluída",
    className: "bg-slate-50 text-slate-500 border-slate-200",
  },
  cancelada: {
    label: "Cancelada",
    className: "bg-rose-50 text-rose-500 border-rose-200",
  },
};

const formatCurrency = (val: number) =>
  val.toLocaleString("pt-AO", { maximumFractionDigits: 0 }) + " Kz";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

export default function ViaturaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [viatura, setViatura] = useState<ViaturaDetalhe | null>(null);
  const [condutores, setCondutores] = useState<Condutor[]>([]);
  const [reservas, setReservas] = useState<ReservaResumida[]>([]);
  const [notFound, setNotFound] = useState(false);

  const fetchViaturaDetalhes = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Obter viatura com categoria
      const { data: vData, error: vError } = await supabase
        .from("viaturas")
        .select("*, categorias!viaturas_categoria_id_fkey(nome)")
        .eq("id", id)
        .single();

      if (vError || !vData) {
        setNotFound(true);
        return;
      }

      setViatura(vData as any);

      // 2. Obter motoristas associados
      const { data: mData } = await supabase
        .from("motoristas")
        .select("id, avaliacao_media, disponivel, perfis!motoristas_perfil_id_fkey(nome_completo, telefone, foto_url)")
        .eq("viatura_id", id);

      setCondutores((mData as unknown as Condutor[]) || []);

      // 3. Obter últimas 10 reservas desta viatura
      const { data: rData } = await supabase
        .from("reservas")
        .select("id, codigo, status, data_recolha, valor_total, cliente:perfis!reservas_cliente_id_fkey(nome_completo)")
        .eq("viatura_id", id)
        .order("criado_em", { ascending: false })
        .limit(10);

      setReservas((rData as any[]) || []);

    } catch (err) {
      console.error("Erro ao carregar detalhes da viatura:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchViaturaDetalhes();
  }, [fetchViaturaDetalhes]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 size={36} className="animate-spin text-[#902ad1]" />
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
          A carregar ficha da viatura…
        </p>
      </div>
    );
  }

  if (notFound || !viatura) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-400 mb-4 border border-rose-100">
          <AlertTriangle size={28} />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">Viatura não encontrada</h3>
        <p className="text-sm text-slate-400 mt-1 mb-8 max-w-xs text-center">
          O veículo que procura não existe ou não pertence à sua empresa.
        </p>
        <Link
          href="/parceiro/viaturas"
          className="inline-flex items-center gap-2 bg-[#902ad1] text-white px-6 py-3 rounded-2xl font-semibold text-sm shadow-lg shadow-[#902ad1]/25 hover:bg-[#902ad1]/90 active:scale-95 transition-all"
        >
          <ArrowLeft size={16} />
          Voltar a Viaturas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/parceiro/viaturas"
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 transition-all shadow-sm shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
              <Link href="/parceiro/viaturas" className="hover:text-[#902ad1] transition-all">
                Viaturas
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">Detalhe da Viatura</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
                {viatura.marca} {viatura.modelo}
              </h1>
              <span
                className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${
                  viatura.ativo
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200/60"
                    : "bg-rose-50 text-rose-500 border-rose-200"
                }`}
              >
                {viatura.ativo ? "Ativa" : "Inativa"}
              </span>
            </div>
          </div>
        </div>

        <Link
          href={`/parceiro/viaturas/${id}/editar`}
          className="inline-flex items-center gap-2 bg-[#902ad1] hover:bg-[#7b22b8] text-white px-6 py-3 rounded-2xl font-semibold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#902ad1]/25 active:scale-95 shrink-0"
        >
          <Edit2 size={14} />
          Editar Viatura
        </Link>
      </div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Card Fotografia */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 flex flex-col gap-4 relative overflow-hidden group">
            <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm border border-slate-100 rounded-full px-3 py-1 text-[9px] font-semibold text-[#902ad1] uppercase tracking-wider shadow-sm">
              {viatura.categorias?.nome || "Frota WiTransfer"}
            </span>

            {/* Imagem */}
            <div className="relative aspect-[4/3] bg-slate-50 rounded-2xl overflow-hidden border border-slate-100/60 shadow-inner">
              {viatura.foto_url ? (
                <Image
                  src={viatura.foto_url}
                  alt={viatura.modelo}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-2">
                  <Car size={48} strokeWidth={1} />
                  <p className="text-[10px] font-semibold uppercase tracking-wider">Sem foto</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-800 leading-tight">
                {viatura.marca} {viatura.modelo}
              </h3>
              {viatura.matricula && (
                <span className="inline-block mt-2 bg-yellow-400 text-yellow-950 text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-xl shadow-sm border border-yellow-300/40 font-mono">
                  {viatura.matricula.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Card Motoristas Associados */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-0.5">
                Alocação de Escala
              </span>
              <h3 className="text-base font-semibold text-slate-800">
                Condutores Vinculados
              </h3>
            </div>

            <div className="h-px bg-slate-100" />

            {condutores.length > 0 ? (
              <div className="space-y-4">
                {condutores.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100/80">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#902ad1]/15 border border-[#902ad1]/10 flex items-center justify-center shrink-0 relative">
                      {c.perfis.foto_url ? (
                        <Image
                          src={c.perfis.foto_url}
                          alt={c.perfis.nome_completo}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <User size={16} className="text-[#902ad1]" />
                      )}
                      <div className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${c.disponivel ? "bg-emerald-500" : "bg-slate-400"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-slate-700 block truncate">
                        {c.perfis.nome_completo}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        {c.disponivel ? "🟢 Disponível" : "⚫ Indisponível"}
                      </span>
                    </div>
                    <Link
                      href={`/parceiro/motoristas/${c.id}`}
                      className="p-1.5 bg-white text-slate-400 hover:text-[#902ad1] border border-slate-200/60 rounded-xl hover:shadow-sm transition-all"
                    >
                      <ArrowLeft size={13} className="rotate-180" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl text-center flex flex-col items-center justify-center gap-2">
                <User size={24} className="text-slate-300" />
                <p className="text-[11px] text-slate-400 font-semibold italic">
                  Nenhum motorista alocado a este veículo
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Card Especificações Técnicas */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-8 flex flex-col gap-6">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-0.5">
                Detalhes do Modelo
              </span>
              <h3 className="text-xl font-semibold text-slate-800 tracking-tight">
                Especificações Técnicas
              </h3>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Bento de características */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: Users,
                  label: "Capacidade",
                  value: `${viatura.lugares} Lugares`,
                  color: "bg-purple-50 text-[#902ad1]",
                },
                {
                  icon: Briefcase,
                  label: "Bagageira",
                  value: `${viatura.malas} Malas grandes`,
                  color: "bg-purple-50 text-[#902ad1]",
                },
                {
                  icon: Wind,
                  label: "Climatização",
                  value: viatura.ar_condicionado ? "Ar Condicionado" : "Ventilador",
                  color: viatura.ar_condicionado ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-450",
                },
                {
                  icon: ShieldCheck,
                  label: "Transmissão",
                  value: viatura.transmissao ? viatura.transmissao.charAt(0).toUpperCase() + viatura.transmissao.slice(1) : "Manual",
                  color: "bg-purple-50 text-[#902ad1]",
                },
                {
                  icon: Calendar,
                  label: "Ano de Fabrico",
                  value: viatura.ano ? `${viatura.ano}` : "—",
                  color: "bg-purple-50 text-[#902ad1]",
                },
                {
                  icon: Tag,
                  label: "Matrícula",
                  value: viatura.matricula || "—",
                  color: "bg-yellow-50 text-yellow-800 border border-yellow-100",
                },
              ].map((spec) => (
                <div key={spec.label} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${spec.color}`}>
                    <spec.icon size={15} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                      {spec.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 block truncate">
                      {spec.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tarifa Base */}
            <div className="h-px bg-slate-100" />
            <div className="bg-[#902ad1]/5 border border-[#902ad1]/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold text-[#902ad1] uppercase tracking-wider">
                  Tarifário Base Configurado
                </p>
                <p className="text-2xl font-semibold text-[#902ad1] mt-0.5">
                  {formatCurrency(viatura.preco_base)} <span className="text-xs font-semibold opacity-70">/ Dia</span>
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold block max-w-xs sm:text-right leading-relaxed">
                Este valor serve de base tarifária inicial para o cálculo de transferes e percursos do cliente final.
              </span>
            </div>
          </div>

          {/* Card Histórico de Reservas */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-0.5">
                  Histórico Operacional
                </span>
                <h3 className="text-xl font-semibold text-slate-800 tracking-tight">
                  Últimas Reservas
                </h3>
              </div>
              <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                <History size={16} />
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {reservas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Código</th>
                      <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Data</th>
                      <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Cliente</th>
                      <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">Valor</th>
                      <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {reservas.map((r) => {
                      const badge = STATUS_BADGE[r.status] || {
                        label: r.status,
                        className: "bg-slate-50 text-slate-500 border-slate-200",
                      };
                      return (
                        <tr key={r.id} className="text-[12px] font-semibold text-slate-600 hover:bg-slate-50/60 hover:shadow-[inset_3px_0_0_0_#902ad1] transition-all duration-200">
                          <td className="px-4 py-3 font-semibold text-[#902ad1]">
                            {r.codigo ? `#${r.codigo}` : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Clock size={11} className="text-slate-400" />
                              {formatDate(r.data_recolha)}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-700">
                            {r.cliente?.nome_completo || "Cliente WiTransfer"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-800">
                            {formatCurrency(r.valor_total || 0)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-semibold border ${badge.className}`}>
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 bg-slate-50/50 border border-slate-100 rounded-2xl text-center flex flex-col items-center justify-center gap-2">
                <Navigation size={24} className="text-slate-300" />
                <p className="text-xs text-slate-400 font-semibold italic">
                  Sem histórico de reservas para esta viatura
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
