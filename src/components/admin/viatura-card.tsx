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
  CheckCircle2,
  XCircle,
  Eye
} from "lucide-react";
import { THEME_TOKENS } from "@/utils/design-system";

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

interface ViaturaCardProps {
  viatura: Viatura;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, status: boolean) => void;
}

export default function ViaturaCard({
  viatura,
  onDelete,
  onToggleStatus,
}: ViaturaCardProps) {
  return (
    <div className={`group overflow-hidden flex flex-col h-full w-full ${THEME_TOKENS.cardInteractive}`}>
      {/* Imagem, Status e Tags */}
      <div className="relative h-52 w-full bg-slate-50 overflow-hidden shrink-0">
        {viatura.foto_url ? (
          <Image
            src={viatura.foto_url}
            alt={viatura.modelo}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Car size={48} strokeWidth={1.5} />
          </div>
        )}

        {/* Badges de Status no topo */}
        <div className="absolute top-3 left-3 flex gap-1.5 z-10">
          <span
            className={`px-3 py-1 ${THEME_TOKENS.cardRounded} ${THEME_TOKENS.badgeText} shadow-sm text-white ${
              viatura.ativo ? "bg-emerald-500" : "bg-rose-500"
            }`}
          >
            {viatura.ativo ? "Ativo" : "Inativo"}
          </span>
          <span className={`bg-white/95 backdrop-blur px-3 py-1 ${THEME_TOKENS.cardRounded} ${THEME_TOKENS.badgeText} text-slate-600 shadow-sm border border-slate-200`}>
            {viatura.categorias?.nome || "Económica"}
          </span>
        </div>

        {/* Hover Quick Action Buttons (Compact Overlay) */}
        <div className="absolute top-3 right-3 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-5px] group-hover:translate-y-0 duration-300">
          <button
            onClick={() => onToggleStatus(viatura.id, !!viatura.ativo)}
            className={`p-1.5 bg-white hover:bg-slate-50 ${THEME_TOKENS.cardRounded} text-slate-500 hover:text-[#902ad1] shadow-md border border-slate-100 transition-colors`}
            title={viatura.ativo ? "Desativar" : "Ativar"}
          >
            {viatura.ativo ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
          </button>
          <Link
            href={`/admin/viaturas/${viatura.id}/editar`}
            className={`p-1.5 bg-white hover:bg-slate-50 ${THEME_TOKENS.cardRounded} text-slate-500 hover:text-[#902ad1] shadow-md border border-slate-100 transition-colors`}
            title="Editar Viatura"
          >
            <Edit2 size={14} />
          </Link>
          <button
            onClick={() => onDelete(viatura.id)}
            className={`p-1.5 bg-white hover:bg-slate-50 ${THEME_TOKENS.cardRounded} text-slate-500 hover:text-rose-500 shadow-md border border-slate-100 transition-colors`}
            title="Eliminar Viatura"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Informações da Viatura */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        {/* Modelo, Marca, Matrícula e Preço */}
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-2">
            <div className="truncate">
              <span className={THEME_TOKENS.labelMicro}>
                {viatura.marca || "Sem Marca"}
              </span>
              <h3 className={`text-base leading-tight truncate ${THEME_TOKENS.titleCard}`}>
                {viatura.modelo}
              </h3>
            </div>
            <div className="text-right shrink-0">
              <span className={`block ${THEME_TOKENS.labelMicro}`}>
                Preço Base
              </span>
              <span className="text-base font-bold text-[#902ad1] leading-none">
                {viatura.preco_base?.toLocaleString("pt-AO")}{" "}
                <small className="text-[9px] font-medium">Kz</small>
              </span>
            </div>
          </div>

          {/* Matrícula e KM */}
          <div className="flex items-center gap-2">
            <span className={`bg-yellow-50 text-yellow-800 px-2 py-0.5 ${THEME_TOKENS.cardRounded} ${THEME_TOKENS.badgeText} border border-yellow-200`}>
              {viatura.matricula || "S/ MATRÍCULA"}
            </span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
              {viatura.ano || "2024"} • {viatura.km?.toLocaleString() || "0"} KM
            </span>
          </div>
        </div>

        {/* Detalhes Técnicos e Parceiro */}
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-slate-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1" title="Lugares">
              <Users size={12} className="text-slate-400" />
              <span className="text-[11px] font-medium text-slate-500">{viatura.lugares}</span>
            </div>
            <div className="flex items-center gap-1" title="Capacidade de Malas">
              <Briefcase size={12} className="text-slate-400" />
              <span className="text-[11px] font-medium text-slate-500">{viatura.malas}</span>
            </div>
          </div>

          <div className="text-right max-w-[50%]">
            <span className={`block leading-none mb-0.5 ${THEME_TOKENS.labelMicro}`}>
              Parceiro
            </span>
            <p className={`text-[10px] text-slate-600 truncate ${THEME_TOKENS.textSemibold}`}>
              {viatura.parceiros?.nome || "WiTransfer Official"}
            </p>
          </div>
        </div>
      </div>

      {/* Ação de Detalhes no Rodapé (Compacta) */}
      <div className="px-5 pb-5 shrink-0">
        <Link
          href={`/admin/viaturas/${viatura.id}`}
          className={`w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 hover:bg-[#902ad1]/5 text-slate-500 hover:text-[#902ad1] ${THEME_TOKENS.cardRounded} font-semibold text-[11px] transition-all border border-transparent hover:border-[#902ad1]/10`}
        >
          <Eye size={14} />
          <span>Ver Detalhes</span>
        </Link>
      </div>
    </div>
  );
}
