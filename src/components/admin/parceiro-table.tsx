/** @format */

"use client";

import React from "react";
import {
  Handshake,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  Briefcase,
  Percent,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Parceiro {
  id: string;
  nome: string;
  nif: string | null;
  email: string | null;
  telefone: string | null;
  website: string | null;
  provincia: string | null;
  municipio: string | null;
  logo_url: string | null;
  comissao_percentual: number;
  ativo: boolean;
  status_aprovacao: string | null;
  responsavel_nome: string | null;
  responsavel_cargo: string | null;
  criado_em: string;
}

interface ParceiroTableProps {
  parceiros: Parceiro[];
  viewMode: "grid" | "table";
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, current: boolean) => void;
}

export default function ParceiroTable({
  parceiros,
  viewMode,
  onDelete,
  onToggleStatus,
}: ParceiroTableProps) {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "---";
    }
  };

  const getAprovacaoBadge = (status: string | null) => {
    const s = status || "pendente";
    if (s === "aprovado") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[10px] text-[8px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-150">
          Aprovado
        </span>
      );
    }
    if (s === "rejeitado") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[10px] text-[8px] font-bold uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-150">
          Rejeitado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[10px] text-[8px] font-bold uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-150">
        Pendente
      </span>
    );
  };

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {parceiros.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-[10px] border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden"
          >
            {/* Indicadores Flutuantes */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {getAprovacaoBadge(p.status_aprovacao)}
              <button
                type="button"
                onClick={() => onToggleStatus(p.id, p.ativo)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[10px] text-[8px] font-bold uppercase tracking-widest border transition-all ${
                  p.ativo
                    ? "bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-150"
                    : "bg-rose-50 text-rose-600 border-rose-150 hover:bg-slate-50 hover:text-slate-600 hover:border-slate-200"
                }`}
              >
                {p.ativo ? "Ativo" : "Suspenso"}
              </button>
            </div>

            {/* Logo & Nome */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0">
                {p.logo_url ? (
                  <Image src={p.logo_url} alt={p.nome} fill className="object-cover" />
                ) : (
                  <Handshake size={24} className="text-[#902ad1]" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 line-clamp-1">
                  {p.nome}
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                  NIF: {p.nif || "---"}
                </span>
              </div>
            </div>

            {/* Estatística Comissão */}
            <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between mb-4 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <Percent size={12} className="text-[#902ad1]" /> Taxa de Comissão
              </span>
              <span className="text-xs font-bold text-slate-700">
                {p.comissao_percentual}%
              </span>
            </div>

            {/* Informações Responsável */}
            <div className="space-y-2 border-t border-slate-50 pt-4 mb-6">
              <div className="flex items-center gap-2 text-slate-500">
                <Briefcase size={14} className="shrink-0 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700 truncate">
                  {p.responsavel_nome || "---"}{" "}
                  {p.responsavel_cargo ? `(${p.responsavel_cargo})` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Mail size={14} className="shrink-0 text-slate-400" />
                <span className="text-xs font-medium truncate">{p.email || "---"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Phone size={14} className="shrink-0 text-slate-400" />
                <span className="text-xs font-semibold">{p.telefone || "---"}</span>
              </div>
              {(p.provincia || p.municipio) && (
                <div className="flex items-center gap-2 text-slate-450">
                  <MapPin size={14} className="shrink-0 text-rose-500" />
                  <span className="text-[11px] font-medium truncate">
                    {p.municipio ? `${p.municipio}, ` : ""}
                    {p.provincia || ""}
                  </span>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex items-center justify-between border-t border-slate-50 pt-4">
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Calendar size={12} />
                Registo: {formatDate(p.criado_em)}
              </span>

              <div className="flex items-center gap-1.5">
                <Link
                  href={`/admin/parceiros/${p.id}`}
                  className="p-2 text-slate-500 hover:text-[#902ad1] bg-slate-50 hover:bg-[#902ad1]/5 rounded-lg border border-slate-100 transition-all"
                  title="Ficha do Parceiro"
                >
                  <Eye size={14} />
                </Link>
                <Link
                  href={`/admin/parceiros/${p.id}/editar`}
                  className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-100 transition-all"
                  title="Editar Ficha"
                >
                  <Edit2 size={14} />
                </Link>
                <button
                  type="button"
                  onClick={() => onDelete(p.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg border border-slate-100 transition-all"
                  title="Eliminar Parceiro"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Vista em Tabela
  return (
    <div className="bg-white rounded-[10px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Parceiro Oficial
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Responsável
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Taxa de Comissão
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Aprovação
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Estado
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {parceiros.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-100 bg-slate-150 flex items-center justify-center shrink-0">
                      {p.logo_url ? (
                        <Image src={p.logo_url} alt={p.nome} fill className="object-cover" />
                      ) : (
                        <Handshake size={18} className="text-[#902ad1]" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-800 block">
                        {p.nome}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                          NIF: {p.nif || "---"}
                        </span>
                        {p.website && (
                          <a
                            href={p.website.startsWith("http") ? p.website : `https://${p.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-[#902ad1] hover:underline flex items-center gap-0.5"
                          >
                            <Globe size={10} /> Site
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-700 block">
                      {p.responsavel_nome || "---"}{" "}
                      {p.responsavel_cargo ? `(${p.responsavel_cargo})` : ""}
                    </span>
                    <span className="text-[11px] text-slate-450 block truncate max-w-[180px]">
                      {p.email || p.telefone || "---"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-slate-700 text-xs">
                  {p.comissao_percentual}%
                </td>
                <td className="px-6 py-4">
                  {getAprovacaoBadge(p.status_aprovacao)}
                </td>
                <td className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(p.id, p.ativo)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-[10px] text-[8px] font-bold uppercase tracking-widest border transition-all ${
                      p.ativo
                        ? "bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-150"
                        : "bg-rose-50 text-rose-600 border-rose-150 hover:bg-slate-50 hover:text-slate-600 hover:border-slate-200"
                    }`}
                  >
                    {p.ativo ? "Ativo" : "Suspenso"}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/admin/parceiros/${p.id}`}
                      className="p-2 text-slate-500 hover:text-[#902ad1] bg-slate-50 hover:bg-[#902ad1]/5 rounded-lg border border-slate-100 transition-all"
                      title="Ficha do Parceiro"
                    >
                      <Eye size={14} />
                    </Link>
                    <Link
                      href={`/admin/parceiros/${p.id}/editar`}
                      className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-100 transition-all"
                      title="Editar Ficha"
                    >
                      <Edit2 size={14} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(p.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg border border-slate-100 transition-all"
                      title="Eliminar Parceiro"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
