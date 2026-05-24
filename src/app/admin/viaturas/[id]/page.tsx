/** @format */

"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Car,
  Users,
  Briefcase,
  Gauge,
  Calendar,
  MapPin,
  ShieldCheck,
  ExternalLink,
  Eye,
  FileText,
  AlertTriangle,
  History,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { THEME_TOKENS } from "@/utils/design-system";

interface ViaturaDetalhes {
  id: string;
  modelo: string;
  marca: string;
  cor: string;
  matricula: string;
  ano: number;
  lugares: number;
  malas: number;
  km: number;
  preco_base: number;
  foto_url: string | null;
  imagens_galeria: string[] | null;
  documentos_url: string[] | null;
  ativo: boolean;
  descricao: string;
  categorias?: { nome: string };
  parceiros?: { nome: string };
  motorista?: {
    id: string;
    perfis: {
      nome_completo: string;
      foto_url: string | null;
      telefone: string | null;
    };
  };
}

export default function ViaturaDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const router = useRouter();
  const [viatura, setViatura] = useState<ViaturaDetalhes | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchViatura = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("viaturas")
        .select(
          `
          *,
          categorias(nome),
          parceiros(nome),
          motorista:motoristas!viaturas_motorista_id_fkey(
            id,
            perfis(nome_completo, foto_url, telefone)
          )
        `,
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setViatura(data as any);
    } catch (err) {
      console.error("Erro ao carregar viatura:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchViatura();
  }, [fetchViatura]);

  const toggleStatus = async () => {
    if (!viatura) return;
    const currentStatus = viatura.ativo;

    try {
      const { error } = await supabase
        .from("viaturas")
        .update({ ativo: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      setViatura((prev) => (prev ? { ...prev, ativo: !currentStatus } : null));
    } catch (err) {
      alert("Erro ao atualizar o status da viatura.");
    }
  };

  const handleDelete = async () => {
    if (!viatura) return;
    if (
      !confirm(
        `Tem a certeza que deseja eliminar permanentemente a viatura ${viatura.marca} ${viatura.modelo}?`
      )
    )
      return;

    try {
      const { error } = await supabase.from("viaturas").delete().eq("id", id);

      if (error) throw error;
      router.push("/admin/viaturas");
    } catch (err) {
      alert("Erro ao eliminar a viatura.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!viatura) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[10px] border border-slate-100 shadow-sm mx-0 md:mx-[80px]">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-4 border border-rose-100">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">
          Viatura não encontrada
        </h3>
        <p className="text-slate-400 mt-1 mb-8 text-sm max-w-xs text-center font-medium">
          A viatura que está a tentar visualizar não existe ou foi eliminada do sistema.
        </p>
        <Link
          href="/admin/viaturas"
          className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-[10px] font-semibold text-sm transition-all hover:bg-primary/95 shadow-md"
        >
          <ArrowLeft size={16} />
          <span>Voltar para Viaturas</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700 mx-0 md:mx-[80px]">
      {/* Top Bar / Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className={`p-3 bg-white hover:bg-slate-50 border border-slate-100 text-slate-600 transition-all shadow-sm ${THEME_TOKENS.cardRounded}`}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col gap-0.5">
            {/* Caminho / Breadcrumb */}
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              <Link href="/admin/dashboard" className="hover:text-[#902ad1] transition-all">
                Painel
              </Link>
              <span className="text-slate-300">/</span>
              <Link href="/admin/viaturas" className="hover:text-[#902ad1] transition-all">
                Viaturas
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">Detalhes</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                {viatura.marca} {viatura.modelo}
              </h1>
              <span
                className={`px-3 py-1 text-[9px] font-semibold uppercase tracking-widest shadow-sm text-white ${THEME_TOKENS.cardRounded} ${viatura.ativo ? "bg-emerald-500" : "bg-rose-500"}`}
              >
                {viatura.ativo ? "Operacional" : "Suspenso"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleStatus}
            className={`flex items-center gap-2 px-6 py-3 rounded-[10px] font-semibold text-sm transition-all border-2 ${viatura.ativo ? "border-rose-100 text-rose-500 hover:bg-rose-50" : "border-emerald-100 text-emerald-500 hover:bg-emerald-50"}`}
          >
            {viatura.ativo ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{viatura.ativo ? "Suspender" : "Ativar"}</span>
          </button>
          <Link
            href={`/admin/viaturas/${id}/editar`}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-[10px] font-semibold text-sm transition-all shadow-lg shadow-primary/20"
          >
            <Edit2 size={18} />
            <span>Editar Viatura</span>
          </Link>
          <button
            onClick={handleDelete}
            className={`p-3 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 border border-slate-100 transition-all shadow-sm ${THEME_TOKENS.cardRounded}`}
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area (Esquerda) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Hero Section */}
          <div className={`overflow-hidden ${THEME_TOKENS.cardStyle}`}>
            <div className="relative h-[450px] w-full bg-slate-50">
              {viatura.foto_url ? (
                <Image
                  src={viatura.foto_url}
                  alt={viatura.modelo}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-200">
                  <Car size={120} strokeWidth={1} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-10 left-10 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`bg-yellow-400 text-black px-3 py-1 text-xs font-semibold tracking-widest uppercase ${THEME_TOKENS.cardRounded}`}>
                    {viatura.matricula || "SEM PLACA"}
                  </span>
                  <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-[10px] text-xs font-medium">
                    {viatura.categorias?.nome || "Padrão"}
                  </span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight">
                  {viatura.marca} {viatura.modelo}
                </h1>
                <p className="text-white/70 font-medium mt-1">
                  {viatura.parceiros?.nome || "WiTransfer Fleet"}
                </p>
              </div>
            </div>

            {/* Quick Specs Bar */}
            <div className="grid grid-cols-4 divide-x divide-slate-50 border-t border-slate-50">
              {[
                { icon: Users, label: "Lugares", value: viatura.lugares },
                { icon: Briefcase, label: "Malas", value: viatura.malas },
                { icon: Calendar, label: "Ano", value: viatura.ano },
                {
                  icon: Gauge,
                  label: "Quilometragem",
                  value: `${viatura.km?.toLocaleString()} KM`,
                },
              ].map((spec, i) => (
                <div
                  key={i}
                  className="p-8 flex flex-col items-center justify-center gap-2 group hover:bg-slate-50/50 transition-colors"
                >
                  <div className="p-3 bg-[#902ad1]/5 rounded-[10px] text-[#902ad1] group-hover:scale-110 transition-transform">
                    <spec.icon size={24} />
                  </div>
                  <span className={THEME_TOKENS.labelMicro}>
                    {spec.label}
                  </span>
                  <span className={`text-lg text-slate-800 ${THEME_TOKENS.textSemibold}`}>
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Galeria */}
          {viatura.imagens_galeria && viatura.imagens_galeria.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 ml-2">
                <div className="p-2 bg-[#902ad1]/5 rounded-[10px] text-[#902ad1]">
                  <Eye size={20} />
                </div>
                <h3 className="font-semibold text-slate-700 uppercase tracking-widest text-sm">
                  Galeria de Imagens
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {viatura.imagens_galeria.map((img, i) => (
                  <div
                    key={i}
                    className={`relative aspect-video overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${THEME_TOKENS.cardRounded}`}
                  >
                    <Image
                      src={img}
                      alt={`Viatura ${i}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Descrição */}
          <div className={`p-10 ${THEME_TOKENS.cardStyle}`}>
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-primary rounded-full" />
              Observações & Descrição
            </h3>
            <p className="text-slate-600 leading-relaxed font-medium text-sm">
              {viatura.descricao ||
                "Nenhuma descrição adicional fornecida para esta viatura."}
            </p>
          </div>
        </div>

        {/* Sidebar Area (Direita) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Card de Preço & Operação */}
          <div className={`p-8 space-y-8 ${THEME_TOKENS.cardStyle}`}>
            <div>
              <span className={THEME_TOKENS.labelMicro}>
                Tarifa Base Diária
              </span>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-bold text-[#902ad1] tracking-tight">
                  {viatura.preco_base?.toLocaleString("pt-AO")}
                </h2>
                <span className="text-slate-400 font-semibold">Kz</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[10px]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-[10px] flex items-center justify-center text-emerald-500 shadow-sm">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <span className={`${THEME_TOKENS.labelMicro} block leading-none mb-1`}>
                      Seguro
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      Ativo & Válido
                    </span>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[10px]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-[10px] flex items-center justify-center text-blue-500 shadow-sm">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <span className={`${THEME_TOKENS.labelMicro} block leading-none mb-1`}>
                      Localização
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      Luanda, Angola
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            </div>
          </div>

          {/* Motorista */}
          <div className={`p-8 ${THEME_TOKENS.cardStyle}`}>
            <h3 className="font-semibold text-slate-700 uppercase tracking-widest text-[11px] mb-6">
              Motorista Atribuído
            </h3>
            {viatura.motorista ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-[10px] overflow-hidden bg-slate-100 shadow-inner">
                    {viatura.motorista.perfis.foto_url ? (
                      <Image
                        src={viatura.motorista.perfis.foto_url}
                        alt="Motorista"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Users className="w-full h-full p-4 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <h4 className={`text-slate-800 leading-tight ${THEME_TOKENS.textSemibold}`}>
                      {viatura.motorista.perfis.nome_completo}
                    </h4>
                    <p className="text-[11px] font-semibold text-[#902ad1] uppercase tracking-tighter mt-1">
                      Motorista Especialista
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button className="flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-[#902ad1]/5 text-slate-500 hover:text-[#902ad1] rounded-[10px] font-semibold text-xs transition-all">
                    <Clock size={14} />
                    Horários
                  </button>
                  <button className="flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-[#902ad1]/5 text-slate-500 hover:text-[#902ad1] rounded-[10px] font-semibold text-xs transition-all">
                    <History size={14} />
                    Histórico
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 px-4 border-2 border-dashed border-slate-100 rounded-[10px] text-center">
                <p className="text-xs font-semibold text-slate-400">
                  Nenhum motorista vinculado a esta viatura.
                </p>
                <button className="mt-4 text-[10px] font-semibold text-[#902ad1] uppercase tracking-widest hover:underline">
                  Vincular Agora
                </button>
              </div>
            )}
          </div>

          {/* Documentação */}
          <div className={`p-8 space-y-6 ${THEME_TOKENS.cardStyle}`}>
            <h3 className="font-semibold text-slate-700 uppercase tracking-widest text-[11px]">
              Documentação Digital
            </h3>
            <div className="space-y-3">
              {viatura.documentos_url && viatura.documentos_url.length > 0 ? (
                viatura.documentos_url.map((doc, i) => (
                  <a
                    key={i}
                    href={doc}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-4 bg-slate-50 hover:bg-[#902ad1]/5 rounded-[10px] border border-slate-100 group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-[10px] flex items-center justify-center text-[#902ad1] shadow-sm group-hover:scale-110 transition-transform">
                        <FileText size={18} />
                      </div>
                      <div>
                        <span className={`${THEME_TOKENS.labelMicro} block leading-none mb-1`}>
                          Doc #{i + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          Digitalizado
                        </span>
                      </div>
                    </div>
                    <ExternalLink
                      size={16}
                      className="text-slate-300 group-hover:text-[#902ad1] transition-colors"
                    />
                  </a>
                ))
              ) : (
                <p className="text-xs font-semibold text-slate-400 text-center py-4 italic">
                  Sem documentos anexados.
                </p>
              )}
            </div>
          </div>

          {/* Controlo de Acesso */}
          <div className={`p-8 border-l-4 ${viatura.ativo ? "border-l-rose-500" : "border-l-emerald-500"} space-y-6 ${THEME_TOKENS.cardStyle}`}>
            <div>
              <h3 className={`font-semibold uppercase tracking-widest text-[11px] ${viatura.ativo ? "text-rose-500" : "text-emerald-500"} mb-1`}>
                Controlo de Acesso
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-2">
                {viatura.ativo ? "Suspender Viatura" : "Reativar Viatura"}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {viatura.ativo
                  ? "A viatura deixará de estar visível para novos clientes no portal e na aplicação móvel."
                  : "A viatura voltará a estar totalmente disponível no sistema para novas reservas."}
              </p>
            </div>
            
            <button
              onClick={toggleStatus}
              className={`w-full py-3.5 px-4 rounded-[10px] font-bold text-xs uppercase tracking-wider transition-all active:scale-95 ${
                viatura.ativo
                  ? "bg-rose-50 hover:bg-rose-100/70 text-rose-600"
                  : "bg-emerald-50 hover:bg-emerald-100/70 text-emerald-600"
              }`}
            >
              {viatura.ativo ? "Suspender Operações" : "Ativar Operações"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
