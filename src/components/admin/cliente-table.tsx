/** @format */

"use client";

import React from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  MapPin,
  FileText,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Cliente {
  id: string;
  nome_completo: string;
  email: string | null;
  telefone: string | null;
  foto_url: string | null;
  morada: string | null;
  nif: string | null;
  ativo: boolean;
  criado_em: string;
}

interface ClienteTableProps {
  clientes: Cliente[];
  viewMode: "grid" | "table";
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, current: boolean) => void;
}

export default function ClienteTable({
  clientes,
  viewMode,
  onDelete,
  onToggleStatus,
}: ClienteTableProps) {
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

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientes.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-[10px] border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden h-full"
          >
            {/* Indicador de Estado Ativo */}
            <div className="absolute top-4 right-4">
              <button
                type="button"
                onClick={() => onToggleStatus(c.id, c.ativo)}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[10px] text-[8px] font-bold uppercase tracking-widest border transition-all ${
                  c.ativo
                    ? "bg-emerald-50 text-emerald-600 border-emerald-150 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-150"
                    : "bg-rose-50 text-rose-600 border-rose-150 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-150"
                }`}
              >
                {c.ativo ? "Ativo" : "Suspenso"}
              </button>
            </div>

            {/* Avatar & Nome */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0">
                {c.foto_url ? (
                  <Image src={c.foto_url} alt={c.nome_completo} fill className="object-cover" />
                ) : (
                  <User size={24} className="text-slate-350" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 line-clamp-1">
                  {c.nome_completo}
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                  NIF: {c.nif || "---"}
                </span>
              </div>
            </div>

            {/* Informações de Contacto */}
            <div className="space-y-2 border-t border-slate-50 pt-4 mb-6">
              <div className="flex items-center gap-2 text-slate-500">
                <Mail size={14} className="shrink-0 text-[#902ad1]" />
                <span className="text-xs font-medium truncate">{c.email || "---"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Phone size={14} className="shrink-0 text-emerald-500" />
                <span className="text-xs font-semibold">{c.telefone || "---"}</span>
              </div>
              {c.morada && (
                <div className="flex items-center gap-2 text-slate-450">
                  <MapPin size={14} className="shrink-0 text-rose-500" />
                  <span className="text-[11px] font-medium truncate">{c.morada}</span>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex items-center justify-between border-t border-slate-50 pt-4">
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Calendar size={12} />
                Registo: {formatDate(c.criado_em)}
              </span>

              <div className="flex items-center gap-1.5">
                <Link
                  href={`/admin/clientes/${c.id}`}
                  className="p-2 text-slate-500 hover:text-[#902ad1] bg-slate-50 hover:bg-[#902ad1]/5 rounded-lg border border-slate-100 transition-all"
                  title="Ver Detalhes"
                >
                  <Eye size={14} />
                </Link>
                <Link
                  href={`/admin/clientes/${c.id}/editar`}
                  className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-100 transition-all"
                  title="Editar Ficha"
                >
                  <Edit2 size={14} />
                </Link>
                <button
                  type="button"
                  onClick={() => onDelete(c.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg border border-slate-100 transition-all"
                  title="Eliminar Cliente"
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

  // Vista em Tabela (Padrão)
  return (
    <div className="bg-white rounded-[10px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto no-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50 z-10 shadow-[0_1px_0_0_rgba(241,245,249,1)]">
            <tr className="bg-slate-50/90 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Cliente
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Contactos
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Documentação & NIF
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Registo
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
            {clientes.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-100 bg-slate-150 flex items-center justify-center shrink-0">
                      {c.foto_url ? (
                        <Image src={c.foto_url} alt={c.nome_completo} fill className="object-cover" />
                      ) : (
                        <User size={18} className="text-slate-400" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-800 block">
                        {c.nome_completo}
                      </span>
                      {c.morada && (
                        <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[200px]">
                          {c.morada}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-700 block">
                      {c.telefone || "---"}
                    </span>
                    <span className="text-[11px] text-slate-450 block truncate max-w-[180px]">
                      {c.email || "---"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-700 block">
                      NIF: {c.nif || "---"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                      Perfis / Cliente
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                  {formatDate(c.criado_em)}
                </td>
                <td className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(c.id, c.ativo)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-[10px] text-[8px] font-bold uppercase tracking-widest border transition-all ${
                      c.ativo
                        ? "bg-emerald-50 text-emerald-600 border-emerald-150 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-150"
                        : "bg-rose-50 text-rose-600 border-rose-150 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-150"
                    }`}
                  >
                    {c.ativo ? "Ativo" : "Suspenso"}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/admin/clientes/${c.id}`}
                      className="p-2 text-slate-500 hover:text-[#902ad1] bg-slate-50 hover:bg-[#902ad1]/5 rounded-lg border border-slate-100 transition-all"
                      title="Ficha do Cliente"
                    >
                      <Eye size={14} />
                    </Link>
                    <Link
                      href={`/admin/clientes/${c.id}/editar`}
                      className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-100 transition-all"
                      title="Editar Ficha"
                    >
                      <Edit2 size={14} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg border border-slate-100 transition-all"
                      title="Eliminar Cliente"
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
