/** @format */

"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, Edit2, Trash2, Eye, Check, X, Star, Car } from "lucide-react";

interface Motorista {
  id: string;
  perfil_id: string;
  parceiro_id: string;
  carta_conducao: string | null;
  carta_conducao_url: string | null;
  documento_bi_url: string | null;
  disponivel: boolean;
  total_viagens: number;
  avaliacao_media: number;
  experiencia_anos: number | null;
  status_aprovacao: string | null;
  perfis: {
    id: string;
    nome_completo: string;
    email: string | null;
    telefone: string | null;
    foto_url: string | null;
    ativo: boolean;
  };
  parceiros?: {
    id: string;
    nome: string;
  } | null;
  viaturas?: {
    id: string;
    modelo: string;
    marca: string | null;
    matricula: string | null;
    categorias?: {
      nome: string;
    } | null;
  } | null;
}

interface MotoristaTableProps {
  motoristas: Motorista[];
  onDelete: (id: string, perfilId: string) => void;
  onToggleStatus: (perfilId: string, currentStatus: boolean) => void;
  onToggleDisponivel: (id: string, currentStatus: boolean) => void;
}

export default function MotoristaTable({
  motoristas,
  onDelete,
  onToggleStatus,
  onToggleDisponivel,
}: MotoristaTableProps) {
  return (
    <div className="bg-white rounded-[0px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="py-4 px-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                Motorista
              </th>
              <th className="py-4 px-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                Parceiro
              </th>
              <th className="py-4 px-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                E-mail
              </th>
              <th className="py-4 px-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                Contacto
              </th>
              <th className="py-4 px-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                Viatura
              </th>
              <th className="py-4 px-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center">
                Disponível
              </th>
              <th className="py-4 px-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {motoristas.map((m) => (
              <tr
                key={m.id}
                className="hover:bg-slate-50/50 transition-colors group">
                {/* Motorista (Foto + Nome + Avaliação) */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 bg-slate-50 rounded-full overflow-hidden border border-slate-200 shrink-0">
                      {m.perfis.foto_url ? (
                        <Image
                          src={m.perfis.foto_url}
                          alt={m.perfis.nome_completo}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Users size={18} />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-700 leading-tight block">
                        {m.perfis.nome_completo}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star
                          size={12}
                          className="text-amber-400 fill-amber-400"
                        />
                        <span className="text-[10px] font-semibold text-slate-500">
                          {m.avaliacao_media?.toFixed(1) || "5.0"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({m.total_viagens || 0} viagens)
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Parceiro */}
                <td className="py-4 px-6 whitespace-nowrap">
                  <span
                    className="text-xs font-semibold text-slate-600 truncate max-w-[140px] block"
                    title={m.parceiros?.nome || "WiTransfer Official"}>
                    {m.parceiros?.nome || "WiTransfer Official"}
                  </span>
                </td>

                {/* E-mail */}
                <td className="py-4 px-6 whitespace-nowrap">
                  <span className="text-xs font-medium text-slate-600">
                    {m.perfis.email || "Sem e-mail"}
                  </span>
                </td>

                {/* Contacto */}
                <td className="py-4 px-6 whitespace-nowrap">
                  <span className="text-xs font-medium text-slate-600">
                    {m.perfis.telefone || "Sem telefone"}
                  </span>
                </td>

                {/* Carro (Viatura) */}
                <td className="py-4 px-6 whitespace-nowrap">
                  {m.viaturas ? (
                    <span className="text-xs text-[#902ad1] font-semibold uppercase tracking-tight flex items-center gap-1">
                      <Car size={12} />
                      {m.viaturas.modelo} ({m.viaturas.matricula})
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium italic">
                      Sem viatura
                    </span>
                  )}
                </td>

                {/* Disponível */}
                <td className="py-4 px-6 text-center whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onToggleDisponivel(m.id, m.disponivel)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-[9px] font-semibold uppercase tracking-widest transition-all ${
                      m.disponivel
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                    }`}>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        m.disponivel
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-slate-400"
                      }`}
                    />
                    <span>{m.disponivel ? "Livre" : "Ocupado"}</span>
                  </button>
                </td>

                {/* Ações */}
                <td className="py-4 px-6 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/admin/motoristas/${m.id}`}
                      className="p-2 text-slate-400 hover:text-[#902ad1] hover:bg-slate-100 rounded-[10px] transition-all"
                      title="Ficha do Motorista">
                      <Eye size={16} />
                    </Link>
                    <Link
                      href={`/admin/motoristas/${m.id}/editar`}
                      className="p-2 text-slate-400 hover:text-[#902ad1] hover:bg-slate-100 rounded-[10px] transition-all"
                      title="Editar Perfil">
                      <Edit2 size={16} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(m.id, m.perfil_id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-[10px] transition-all"
                      title="Eliminar Motorista">
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
