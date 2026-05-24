/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Car,
  Plus,
  Search,
  Loader2,
  Users,
  Briefcase,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Tag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Viatura {
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
  categorias?: { nome: string } | null;
  ar_condicionado?: boolean;
  transmissao?: string;
}

export default function ViaturasParceiroPage() {
  const router = useRouter();
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: parceiroData } = await supabase
        .from("parceiros")
        .select("id")
        .eq("usuario_id", user.id)
        .single();

      if (!parceiroData?.id) return;

      setParceiroId(parceiroData.id);

      const { data, error } = await supabase
        .from("viaturas")
        .select(
          "id, modelo, marca, matricula, ano, lugares, malas, foto_url, ativo, preco_base, ar_condicionado, transmissao, categorias!viaturas_categoria_id_fkey(nome)"
        )
        .eq("parceiro_id", parceiroData.id)
        .order("criado_em", { ascending: false });

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setViaturas((data as any) || []);
    } catch (err) {
      console.error("Erro ao carregar viaturas:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = async (viatura: Viatura) => {
    setToggling(viatura.id);
    try {
      const { error } = await supabase
        .from("viaturas")
        .update({ ativo: !viatura.ativo })
        .eq("id", viatura.id);

      if (error) throw error;

      setViaturas((prev) =>
        prev.map((v) => (v.id === viatura.id ? { ...v, ativo: !v.ativo } : v))
      );
    } catch {
      alert("Erro ao atualizar estado da viatura.");
    } finally {
      setToggling(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return viaturas;
    return viaturas.filter(
      (v) =>
        v.modelo.toLowerCase().includes(q) ||
        v.marca?.toLowerCase().includes(q) ||
        v.matricula?.toLowerCase().includes(q)
    );
  }, [viaturas, search]);

  const totalAtivas = viaturas.filter((v) => v.ativo).length;
  const totalInativas = viaturas.filter((v) => !v.ativo).length;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
            <Link href="/parceiro/dashboard" className="hover:text-[#902ad1] transition-all">
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Viaturas</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
            As Minhas Viaturas
          </h1>
        </div>

        <Link
          href="/parceiro/viaturas/nova"
          className="inline-flex items-center gap-2 bg-[#902ad1] hover:bg-[#902ad1]/90 text-white px-6 py-3 rounded-2xl font-semibold text-sm transition-all shadow-lg shadow-[#902ad1]/25 active:scale-95 shrink-0"
        >
          <Plus size={18} strokeWidth={2.5} />
          Nova Viatura
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total",
            value: viaturas.length,
            color: "bg-[#902ad1]/10 text-[#902ad1]",
            icon: Car,
          },
          {
            label: "Ativas",
            value: totalAtivas,
            color: "bg-emerald-50 text-emerald-600",
            icon: CheckCircle2,
          },
          {
            label: "Inativas",
            value: totalInativas,
            color: "bg-rose-50 text-rose-500",
            icon: XCircle,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${kpi.color}`}>
              <kpi.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-800 leading-none">{kpi.value}</p>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                {kpi.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por modelo, marca ou matrícula…"
          className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-slate-200 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#902ad1]/25 focus:border-[#902ad1]/50 transition-all shadow-sm"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-28">
          <Loader2 size={36} className="animate-spin text-[#902ad1]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 bg-white rounded-2xl border-2 border-dashed border-slate-100">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
            <Car size={30} />
          </div>
          {search ? (
            <>
              <h3 className="text-base font-semibold text-slate-700">Nenhuma viatura encontrada</h3>
              <p className="text-sm text-slate-400 mt-1">Tente com outros termos de pesquisa.</p>
            </>
          ) : (
            <>
              <h3 className="text-base font-semibold text-slate-700">Sem viaturas registadas</h3>
              <p className="text-sm text-slate-400 mt-1 mb-6">
                Adicione a sua primeira viatura para começar.
              </p>
              <Link
                href="/parceiro/viaturas/nova"
                className="inline-flex items-center gap-2 bg-[#902ad1] text-white px-6 py-3 rounded-2xl font-semibold text-sm shadow-lg shadow-[#902ad1]/25 hover:bg-[#902ad1]/90 active:scale-95 transition-all"
              >
                <Plus size={18} />
                Adicionar Viatura
              </Link>
            </>
          )}
        </div>
      ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    <th className="py-3.5 px-5">Viatura</th>
                    <th className="py-3.5 px-5">Matrícula</th>
                    <th className="py-3.5 px-5">Categoria</th>
                    <th className="py-3.5 px-5">Especificações</th>
                    <th className="py-3.5 px-5">Preço Base</th>
                    <th className="py-3.5 px-5 text-center">Estado</th>
                    <th className="py-3.5 px-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((viatura) => (
                    <tr key={viatura.id} className="text-[13px] font-medium text-slate-700 hover:bg-slate-50/60 hover:shadow-[inset_4px_0_0_0_#902ad1] transition-all duration-200">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 relative">
                            {viatura.foto_url ? (
                              <Image
                                src={viatura.foto_url}
                                alt={`${viatura.marca} ${viatura.modelo}`}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <Car size={16} className="text-slate-350" />
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-800 block">
                              {viatura.modelo}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal block">
                              {viatura.marca || "—"} {viatura.ano && `· ${viatura.ano}`}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        {viatura.matricula ? (
                          <span className="bg-yellow-50 text-yellow-800 border border-yellow-200 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm">
                            {viatura.matricula}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-normal">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        {viatura.categorias?.nome ? (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] font-medium px-2.5 py-0.5 rounded-full">
                            <Tag size={10} />
                            {viatura.categorias.nome}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-normal">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-normal">
                          <span className="flex items-center gap-0.5 text-slate-400 font-medium text-[11px]" title="Lugares">
                            👤 {viatura.lugares}
                          </span>
                          <span className="flex items-center gap-0.5 text-slate-400 font-medium text-[11px]" title="Malas">
                            💼 {viatura.malas}
                          </span>
                          {viatura.transmissao && (
                            <span className="capitalize text-slate-400 text-[10px] font-medium">
                              {viatura.transmissao}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-[#902ad1] text-xs font-mono">
                        {viatura.preco_base.toLocaleString("pt-AO")} Kz
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleToggle(viatura)}
                            disabled={toggling === viatura.id}
                            title={viatura.ativo ? "Desativar" : "Ativar"}
                            className={`p-1.5 rounded-xl transition-all ${
                              viatura.ativo
                                ? "text-emerald-500 hover:bg-emerald-50"
                                : "text-slate-400 hover:bg-slate-100"
                            }`}
                          >
                            {toggling === viatura.id ? (
                              <Loader2 size={16} className="animate-spin text-[#902ad1]" />
                            ) : viatura.ativo ? (
                              <ToggleRight size={20} />
                            ) : (
                              <ToggleLeft size={20} />
                            )}
                          </button>
                          <span
                            className={`text-[10px] font-medium uppercase tracking-wider rounded-full px-2 py-0.5 ${
                              viatura.ativo
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : "bg-rose-50 text-rose-600 border border-rose-100"
                            }`}
                          >
                            {viatura.ativo ? "Ativa" : "Inativa"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/parceiro/viaturas/${viatura.id}`}
                          className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-[#902ad1] text-slate-500 hover:text-white rounded-xl text-[11px] font-medium uppercase tracking-wide border border-slate-100 hover:border-[#902ad1] transition-all duration-200 active:scale-95 px-3.5 py-1.5"
                        >
                          Ver Ficha
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      )}
    </div>
  );
}

/* ─── Card Component ─── */
function ViaturaCard({
  viatura,
  toggling,
  onToggle,
}: {
  viatura: Viatura;
  toggling: boolean;
  onToggle: (v: Viatura) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
      {/* Photo */}
      <div className="relative h-44 bg-slate-50 overflow-hidden">
        {viatura.foto_url ? (
          <Image
            src={viatura.foto_url}
            alt={`${viatura.marca} ${viatura.modelo}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-200">
            <Car size={64} strokeWidth={1} />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full ${
              viatura.ativo
                ? "bg-emerald-500 text-white"
                : "bg-rose-500 text-white"
            }`}
          >
            {viatura.ativo ? "Ativa" : "Inativa"}
          </span>
        </div>

        {/* Matricula */}
        {viatura.matricula && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-yellow-400 text-yellow-900 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-lg shadow">
              {viatura.matricula}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Title + Category */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {viatura.marca || "—"}
            </p>
            <h3 className="text-base font-semibold text-slate-800 leading-tight">
              {viatura.modelo}
            </h3>
          </div>
          {viatura.categorias?.nome && (
            <span className="shrink-0 flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] font-semibold px-2.5 py-1 rounded-full">
              <Tag size={10} />
              {viatura.categorias.nome}
            </span>
          )}
        </div>

        {/* Specs row */}
        <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold">
          <span className="flex items-center gap-1">
            <Users size={13} className="text-slate-400" />
            {viatura.lugares} lug.
          </span>
          <span className="flex items-center gap-1">
            <Briefcase size={13} className="text-slate-400" />
            {viatura.malas} malas
          </span>
          {viatura.ano && (
            <span className="text-slate-400 font-medium">{viatura.ano}</span>
          )}
          {viatura.transmissao && (
            <span className="capitalize text-slate-400">{viatura.transmissao}</span>
          )}
        </div>

        {/* Price + Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-50">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Preço base
            </p>
            <p className="text-lg font-semibold text-[#902ad1] leading-tight">
              {viatura.preco_base.toLocaleString("pt-AO")}{" "}
              <span className="text-xs font-semibold text-slate-400">Kz</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle */}
            <button
              onClick={() => onToggle(viatura)}
              disabled={toggling}
              title={viatura.ativo ? "Desativar" : "Ativar"}
              className={`p-2 rounded-xl transition-all ${
                viatura.ativo
                  ? "text-emerald-500 hover:bg-emerald-50"
                  : "text-slate-400 hover:bg-slate-100"
              }`}
            >
              {toggling ? (
                <Loader2 size={18} className="animate-spin" />
              ) : viatura.ativo ? (
                <ToggleRight size={22} />
              ) : (
                <ToggleLeft size={22} />
              )}
            </button>

            {/* Edit */}
            <Link
              href={`/parceiro/viaturas/${viatura.id}`}
              className="flex items-center gap-1.5 bg-[#902ad1]/10 hover:bg-[#902ad1]/20 text-[#902ad1] px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            >
              <Edit2 size={13} />
              Editar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
