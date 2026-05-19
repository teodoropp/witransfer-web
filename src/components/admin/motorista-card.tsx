/** @format */

"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Edit2,
  Trash2,
  Eye,
  Star,
  Car,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { THEME_TOKENS } from "@/utils/design-system";

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

interface MotoristaCardProps {
  motorista: Motorista;
  onDelete: (id: string, perfilId: string) => void;
  onToggleDisponivel: (id: string, status: boolean) => void;
}

export default function MotoristaCard({
  motorista,
  onDelete,
  onToggleDisponivel,
}: MotoristaCardProps) {
  const m = motorista;

  return (
    <div className={`group overflow-hidden flex flex-col h-full w-full ${THEME_TOKENS.cardInteractive}`}>
      {/* Avatar, Status e Quick Actions */}
      <div className="relative h-48 w-full bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center border-b border-slate-100">
        {m.perfis.foto_url ? (
          <Image
            src={m.perfis.foto_url}
            alt={m.perfis.nome_completo}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50/50">
            <Users size={56} strokeWidth={1} />
          </div>
        )}

        {/* Badges de Disponibilidade no topo esquerdo */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          <button
            type="button"
            onClick={() => onToggleDisponivel(m.id, m.disponivel)}
            className={`px-3 py-1 flex items-center gap-1.5 shadow-sm transition-all border ${THEME_TOKENS.cardRounded} ${THEME_TOKENS.badgeText} ${
              m.disponivel
                ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                m.disponivel ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            <span>{m.disponivel ? "Livre" : "Ocupado"}</span>
          </button>
        </div>

        {/* Quick Actions no topo direito */}
        <div className="absolute top-3 right-3 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity translate-y-[-5px] group-hover:translate-y-0 duration-300">
          <Link
            href={`/admin/motoristas/${m.id}`}
            className={`p-1.5 bg-white hover:bg-slate-50 ${THEME_TOKENS.cardRounded} text-slate-500 hover:text-[#902ad1] shadow-md border border-slate-100 transition-colors`}
            title="Visualizar Ficha"
          >
            <Eye size={14} />
          </Link>
          <Link
            href={`/admin/motoristas/${m.id}/editar`}
            className={`p-1.5 bg-white hover:bg-slate-50 ${THEME_TOKENS.cardRounded} text-slate-500 hover:text-[#902ad1] shadow-md border border-slate-100 transition-colors`}
            title="Editar Motorista"
          >
            <Edit2 size={14} />
          </Link>
          <button
            onClick={() => onDelete(m.id, m.perfil_id)}
            className={`p-1.5 bg-white hover:bg-slate-50 ${THEME_TOKENS.cardRounded} text-slate-500 hover:text-rose-500 shadow-md border border-slate-100 transition-colors`}
            title="Eliminar Motorista"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Informações */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        {/* Nome, Avaliação e Parceiro */}
        <div className="space-y-3">
          <div className="truncate">
            <span className={THEME_TOKENS.labelMicro}>
              {m.parceiros?.nome || "WiTransfer Official"}
            </span>
            <h3 className={`text-base leading-tight truncate mt-0.5 ${THEME_TOKENS.titleCard}`} title={m.perfis.nome_completo}>
              {m.perfis.nome_completo}
            </h3>
          </div>

          {/* Avaliação e Viagens */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-[10px]">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-bold text-amber-700">
                {m.avaliacao_media?.toFixed(1) || "5.0"}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              • {m.total_viagens || 0} viagens
            </span>
          </div>

          {/* Email e Telefone */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center gap-2 text-slate-500">
              <Mail size={12} className="text-slate-400 shrink-0" />
              <span className="text-xs truncate" title={m.perfis.email || "Sem e-mail"}>
                {m.perfis.email || "Sem e-mail"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Phone size={12} className="text-slate-400 shrink-0" />
              <span className="text-xs truncate">
                {m.perfis.telefone || "Sem telefone"}
              </span>
            </div>
          </div>
        </div>

        {/* Viatura Associada no Rodapé */}
        <div className="mt-5 pt-3 border-t border-slate-50">
          <span className={`block leading-none mb-1.5 ${THEME_TOKENS.labelMicro}`}>
            Viatura Atribuída
          </span>
          {m.viaturas ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[#902ad1] font-semibold uppercase tracking-tight flex items-center gap-1 truncate">
                <Car size={12} className="shrink-0" />
                {m.viaturas.modelo}
              </span>
              <span className="bg-yellow-50 text-yellow-800 px-1.5 py-0.5 rounded-[10px] text-[8px] font-bold tracking-wider border border-yellow-200 uppercase shrink-0">
                {m.viaturas.matricula || "S/ MAT"}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-medium italic block">
              Sem viatura
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
