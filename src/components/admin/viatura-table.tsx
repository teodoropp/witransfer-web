/** @format */

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Car,
  Edit2,
  Trash2,
  Users,
  Briefcase,
  Eye,
  Check,
  X
} from "lucide-react";

interface Viatura {
  id: string;
  modelo: string;
  marca: string | null;
  cor: string | null;
  matricula: string | null;
  ano: number | null;
  km: number | null;
  lugares: number;
  malas: number;
  preco_base: number;
  foto_url?: string | null;
  ativo?: boolean;
  categorias?: { nome: string };
  parceiros?: { id: string; nome: string };
}

interface ViaturaTableProps {
  viaturas: Viatura[];
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, status: boolean) => void;
}

export default function ViaturaTable({
  viaturas,
  onDelete,
  onToggleStatus,
}: ViaturaTableProps) {
  return (
    <div className="bg-white rounded-[10px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="py-4 px-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                Viatura
              </th>
              <th className="py-4 px-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                Matrícula & Ano
              </th>
              <th className="py-4 px-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                Categoria
              </th>
              <th className="py-4 px-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                Parceiro
              </th>
              <th className="py-4 px-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                Especificações
              </th>
              <th className="py-4 px-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                Preço Base
              </th>
              <th className="py-4 px-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center">
                Estado
              </th>
              <th className="py-4 px-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {viaturas.map((viatura) => (
              <tr key={viatura.id} className="hover:bg-slate-50/50 transition-colors group">
                {/* Viatura (Foto + Nome) */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-10 bg-slate-50 rounded-[10px] overflow-hidden border border-slate-200 shrink-0">
                      {viatura.foto_url ? (
                        <Image
                          src={viatura.foto_url}
                          alt={viatura.modelo}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Car size={20} />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="block text-[9px] font-medium text-slate-400 uppercase tracking-wide">
                        {viatura.marca}
                      </span>
                      <span className="text-sm font-semibold text-slate-700 leading-tight">
                        {viatura.modelo}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Matrícula & Ano */}
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className="inline-block bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded-[10px] text-[9px] font-semibold tracking-wider border border-yellow-200 w-fit">
                      {viatura.matricula || "S/ MATRÍCULA"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                      Ano {viatura.ano || "2024"} • {viatura.km?.toLocaleString() || "0"} KM
                    </span>
                  </div>
                </td>

                {/* Categoria */}
                <td className="py-4 px-6 whitespace-nowrap">
                  <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-[10px] text-[9px] font-semibold uppercase tracking-wider border border-slate-200">
                    {viatura.categorias?.nome || "Económica"}
                  </span>
                </td>

                {/* Parceiro */}
                <td className="py-4 px-6 whitespace-nowrap">
                  <span className="text-xs font-medium text-slate-600">
                    {viatura.parceiros?.nome || "WiTransfer Official"}
                  </span>
                </td>

                {/* Especificações (Lugares & Malas) */}
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="flex items-center gap-3 text-slate-500">
                    <div className="flex items-center gap-1.5" title="Lugares">
                      <Users size={14} className="text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">{viatura.lugares}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Capacidade de Malas">
                      <Briefcase size={14} className="text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">{viatura.malas}</span>
                    </div>
                  </div>
                </td>

                {/* Preço Base */}
                <td className="py-4 px-6 whitespace-nowrap">
                  <span className="text-sm font-semibold text-[#902ad1]">
                    {viatura.preco_base?.toLocaleString("pt-AO")}{" "}
                    <small className="text-[10px] font-medium">Kz</small>
                  </span>
                </td>

                {/* Estado (Ativo/Inativo Interativo) */}
                <td className="py-4 px-6 text-center whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(viatura.id, !!viatura.ativo)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-[10px] text-[9px] font-semibold uppercase tracking-widest transition-all ${
                      viatura.ativo
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                    }`}
                  >
                    {viatura.ativo ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                    <span>{viatura.ativo ? "Ativo" : "Inativo"}</span>
                  </button>
                </td>

                {/* Ações */}
                <td className="py-4 px-6 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/admin/viaturas/${viatura.id}`}
                      className="p-2 text-slate-400 hover:text-[#902ad1] hover:bg-slate-100 rounded-[10px] transition-all"
                      title="Visualizar Viatura"
                    >
                      <Eye size={16} />
                    </Link>
                    <Link
                      href={`/admin/viaturas/${viatura.id}/editar`}
                      className="p-2 text-slate-400 hover:text-[#902ad1] hover:bg-slate-100 rounded-[10px] transition-all"
                      title="Editar Viatura"
                    >
                      <Edit2 size={16} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(viatura.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-[10px] transition-all"
                      title="Eliminar Viatura"
                    >
                      <Trash2 size={16} />
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
