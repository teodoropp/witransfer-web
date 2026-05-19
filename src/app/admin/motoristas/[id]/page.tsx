/** @format */

"use client";

import React, { use, useState, useEffect } from "react";
import {
  ArrowLeft,
  Edit2,
  User,
  Star,
  Car,
  FileText,
  ShieldAlert,
  Loader2,
  ExternalLink,
  Briefcase,
  Globe,
  Activity,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
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
  idiomas: string[] | null;
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
    foto_url: string | null;
    categorias?: {
      nome: string;
    } | null;
  } | null;
}

interface MotoristaDetalhePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function MotoristaDetalhePage({
  params,
}: MotoristaDetalhePageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const motoristaId = resolvedParams.id;

  const [motorista, setMotorista] = useState<Motorista | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    async function loadMotorista() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("motoristas")
          .select(
            `
            *,
            perfis:perfil_id(id, nome_completo, email, telefone, foto_url, ativo),
            parceiros(id, nome),
            viaturas!motoristas_viatura_id_fkey(id, modelo, marca, matricula, foto_url, categorias(nome))
          `,
          )
          .eq("id", motoristaId)
          .single();

        if (error) throw error;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setMotorista((data as any) || null);
      } catch (err) {
        console.error("Erro ao carregar motorista:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMotorista();
  }, [motoristaId]);

  const handleToggleStatus = async () => {
    if (!motorista) return;
    try {
      setToggling(true);
      const newStatus = !motorista.perfis.ativo;
      const { error } = await supabase
        .from("perfis")
        .update({ ativo: newStatus })
        .eq("id", motorista.perfil_id);

      if (error) throw error;
      setMotorista((prev) =>
        prev
          ? {
              ...prev,
              perfis: { ...prev.perfis, ativo: newStatus },
            }
          : null,
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert("Erro ao atualizar estado de atividade.");
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!motorista) return;
    if (
      !confirm(
        "Tem a certeza absoluta que deseja eliminar este motorista da plataforma? Esta ação é irreversível.",
      )
    )
      return;

    try {
      setToggling(true);
      // 1. Eliminar registo do motorista
      const { error: mError } = await supabase
        .from("motoristas")
        .delete()
        .eq("id", motorista.id);
      if (mError) throw mError;

      // 2. Eliminar perfil do motorista
      const { error: pError } = await supabase
        .from("perfis")
        .delete()
        .eq("id", motorista.perfil_id);
      if (pError) throw pError;

      router.push("/admin/motoristas");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert("Erro ao eliminar motorista da base de dados.");
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-[#902ad1] animate-spin" />
        <p className="text-slate-500 font-semibold text-sm uppercase tracking-widest">
          A carregar ficha do motorista...
        </p>
      </div>
    );
  }

  if (!motorista) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[10px] border border-slate-100 shadow-sm mx-0 md:mx-[80px]">
        <AlertTriangle className="text-rose-500 mb-4" size={48} />
        <h3 className="text-lg font-semibold text-slate-800">
          Motorista Não Encontrado
        </h3>
        <p className="text-slate-400 mt-1 mb-6 text-sm">
          O motorista que procura não existe ou foi removido do sistema.
        </p>
        <Link
          href="/admin/motoristas"
          className="bg-[#902ad1] text-white px-6 py-3 rounded-[10px] font-semibold transition-all shadow-md active:scale-95">
          Voltar para Lista
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      {/* Header com Ações e Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-[30px]">
        <div className="flex items-center">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              <button
                type="button"
                onClick={() => router.back()}
                className="hover:text-[#902ad1] text-slate-500 transition-colors flex items-center shrink-0 mr-1"
                title="Voltar">
                <ArrowLeft size={12} strokeWidth={2.5} />
              </button>
              <Link
                href="/admin/dashboard"
                className="hover:text-[#902ad1] transition-all">
                Painel
              </Link>
              <span className="text-slate-300">/</span>
              <Link
                href="/admin/motoristas"
                className="hover:text-[#902ad1] transition-all">
                Motoristas
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">Detalhes do Motorista</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <Link
            href={`/admin/motoristas/${motorista.id}/editar`}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-[5px] hover:bg-slate-50 transition-all active:scale-95 text-xs">
            <Edit2 size={14} />
            <span>Editar Informações</span>
          </Link>
        </div>
      </div>

      {/* Grid de Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Lado Esquerdo: Ficha Básica, Contacto e Detalhes */}
        <div className="lg:col-span-4 flex flex-col">
          <div
            className={`${THEME_TOKENS.cardStyle} divide-y divide-slate-100 flex-1 flex flex-col justify-between h-full`}>
            {/* Card Principal do Perfil */}
            <div className="p-6 text-center relative overflow-hidden shrink-0">
              {/* Indicador Flutuante de Atividade */}
              <div className="absolute top-4 right-4">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 border ${THEME_TOKENS.cardRounded} ${THEME_TOKENS.badgeText} font-semibold uppercase tracking-widest ${
                    motorista.perfis.ativo
                      ? "bg-emerald-50 text-emerald-600 border-emerald-150"
                      : "bg-rose-50 text-rose-600 border-rose-150"
                  }`}>
                  {motorista.perfis.ativo ? "Ativo" : "Suspenso"}
                </span>
              </div>

              {/* Foto de Perfil */}
              <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-[#902ad1]/10 mx-auto bg-slate-50 flex items-center justify-center mb-4">
                {motorista.perfis.foto_url ? (
                  <Image
                    src={motorista.perfis.foto_url}
                    alt={motorista.perfis.nome_completo}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User size={44} className="text-slate-300" />
                )}
              </div>

              <h2 className="text-lg font-bold text-slate-800 leading-tight">
                {motorista.perfis.nome_completo}
              </h2>
              <span className="text-[10px] font-semibold text-[#902ad1] uppercase tracking-widest mt-1 block">
                {motorista.parceiros?.nome || "WiTransfer Official"}
              </span>

              {/* Classificação Média */}
              <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-slate-50">
                <Star size={16} className="text-amber-400 fill-amber-400" />
                <span className="text-sm font-semibold text-slate-700">
                  {motorista.avaliacao_media?.toFixed(1) || "5.0"}
                </span>
                <span className="text-xs text-slate-400">
                  ({motorista.total_viagens || 0} Viagens)
                </span>
              </div>
            </div>

            {/* Informações de Contacto */}
            <div className="p-6 space-y-4 flex-1">
              <h4 className="font-semibold text-slate-700 uppercase tracking-widest text-[10px] pb-1">
                Informações de Contacto
              </h4>
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block leading-none">
                    Telefone Principal
                  </span>
                  <span className="text-xs font-semibold text-slate-700 mt-1 block">
                    {motorista.perfis.telefone || "Nenhum telefone registado"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block leading-none">
                    Endereço de E-mail
                  </span>
                  <span className="text-xs font-semibold text-slate-700 break-all mt-1 block">
                    {motorista.perfis.email || "Nenhum e-mail registado"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block leading-none">
                    Nº Carta de Condução
                  </span>
                  <span className="text-xs font-semibold text-slate-700 mt-1 block">
                    {motorista.carta_conducao || "Não especificado"}
                  </span>
                </div>
              </div>
            </div>

            {/* Estado Administrativo (Disponibilidade e Validação de Cadastro) */}
            <div className="p-5 bg-slate-50/50 space-y-0 shrink-0 mt-auto">
              <h4 className="font-semibold text-slate-700 uppercase tracking-widest text-[10px] leading-none">
                Estado Administrativo
              </h4>
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs text-slate-500 font-semibold leading-none">
                    Aprovação do Registo
                  </span>
                  <span
                    className={`px-3 py-1 flex items-center gap-1  border ${THEME_TOKENS.cardRounded} ${THEME_TOKENS.badgeText} uppercase tracking-wider font-semibold ${
                      motorista.status_aprovacao === "aprovado" ||
                      motorista.status_aprovacao === "Aprovado"
                        ? "bg-blue-50 text-blue-600 border-blue-200"
                        : "bg-amber-50 text-amber-600 border-amber-200"
                    }`}>
                    {motorista.status_aprovacao || "Aprovado"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Estatísticas, Viatura, Documentos e Zona de Perigo */}
        <div className="lg:col-span-8 space-y-6">
          {/* Grid de Estatísticas Rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div
              className={`p-4 flex items-center gap-3 ${THEME_TOKENS.cardStyle}`}>
              <div className="p-2.5 bg-[#902ad1]/5 text-[#902ad1] rounded-xl shrink-0">
                <Activity size={18} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Viagens
                </span>
                <span className="text-sm text-slate-700">
                  {motorista.total_viagens || 0}
                </span>
              </div>
            </div>

            <div
              className={`p-4 flex items-center gap-3 ${THEME_TOKENS.cardStyle}`}>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <CheckCircle size={18} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Disponível
                </span>
                <span className="text-sm text-slate-700">
                  {motorista.disponivel ? "Sim" : "Não"}
                </span>
              </div>
            </div>

            <div
              className={`p-4 flex items-center gap-3 ${THEME_TOKENS.cardStyle}`}>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <Briefcase size={18} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Experiência
                </span>
                <span className="text-sm  text-slate-700">
                  {motorista.experiencia_anos
                    ? `${motorista.experiencia_anos} anos`
                    : "N/A"}
                </span>
              </div>
            </div>

            <div
              className={`p-4 flex items-center gap-3 ${THEME_TOKENS.cardStyle}`}>
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                <Globe size={18} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Idiomas
                </span>
                <span
                  className="text-xs text-slate-700 truncate max-w-[80px]"
                  title={motorista.idiomas?.join(", ") || "Português"}>
                  {motorista.idiomas?.join(", ") || "Português"}
                </span>
              </div>
            </div>
          </div>

          {/* Grid de Informação Detalhada: Viatura & Documentos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Card da Viatura Atribuída */}
            <div
              className={`p-6 flex flex-col justify-between ${THEME_TOKENS.cardStyle}`}>
              <div>
                <h4 className="font-semibold text-slate-700 uppercase tracking-widest text-[10px] border-b border-slate-50 pb-3">
                  Viatura Atribuída
                </h4>
                <div className="mt-4">
                  {motorista.viaturas ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-16 h-12 rounded-lg bg-slate-50 overflow-hidden border border-slate-100 shrink-0">
                          {motorista.viaturas.foto_url ? (
                            <Image
                              src={motorista.viaturas.foto_url}
                              alt={motorista.viaturas.modelo}
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
                          <span className="text-sm font-bold text-slate-700 block">
                            {motorista.viaturas.marca}{" "}
                            {motorista.viaturas.modelo}
                          </span>
                          <span className="text-[10px] font-semibold text-[#902ad1] uppercase tracking-wider block mt-0.5">
                            Matrícula: {motorista.viaturas.matricula}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/admin/viaturas/${motorista.viaturas.id}`}
                        className="text-xs text-[#902ad1] hover:underline font-semibold flex items-center gap-1 whitespace-nowrap self-start mt-1">
                        Ver Detalhes do Veículo
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  ) : (
                    <div className="py-6 text-center bg-slate-50/50 rounded-[10px] border border-dashed border-slate-200">
                      <Car
                        className="text-slate-300 mx-auto mb-2 animate-pulse"
                        size={24}
                      />
                      <p className="text-xs text-slate-400 font-medium italic">
                        Nenhum veículo atribuído a este motorista.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Documentação e Anexos */}
            <div
              className={`p-6 flex flex-col justify-between ${THEME_TOKENS.cardStyle}`}>
              <div>
                <h4 className="font-semibold text-slate-700 uppercase tracking-widest text-[10px] border-b border-slate-50 pb-3">
                  Documentos Regulamentares
                </h4>
                <div className="space-y-3 mt-4">
                  {/* Carta de condução */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-[10px] border border-slate-100 gap-2">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="text-[#902ad1] shrink-0" size={16} />
                      <div className="truncate">
                        <span className="text-xs font-semibold text-slate-700 block leading-tight">
                          Carta de Condução
                        </span>
                        <span className="text-[9px] text-slate-400">
                          Anexo regulamentar
                        </span>
                      </div>
                    </div>
                    {motorista.carta_conducao_url ? (
                      <a
                        href={motorista.carta_conducao_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-white hover:bg-slate-100 text-[#902ad1] rounded-lg shadow-sm border border-slate-150 transition-colors shrink-0"
                        title="Abrir Documento">
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-[9px] text-slate-400 italic shrink-0">
                        Sem anexo
                      </span>
                    )}
                  </div>

                  {/* BI */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-[10px] border border-slate-100 gap-2">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="text-[#902ad1] shrink-0" size={16} />
                      <div className="truncate">
                        <span className="text-xs font-semibold text-slate-700 block leading-tight">
                          Bilhete de Identidade
                        </span>
                        <span className="text-[9px] text-slate-400">
                          Anexo regulamentar
                        </span>
                      </div>
                    </div>
                    {motorista.documento_bi_url ? (
                      <a
                        href={motorista.documento_bi_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-white hover:bg-slate-100 text-[#902ad1] rounded-lg shadow-sm border border-slate-150 transition-colors shrink-0"
                        title="Abrir Documento">
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-[9px] text-slate-400 italic shrink-0">
                        Sem anexo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Zona de Perigo (Danger Zone) */}
          <div className="bg-red-50/20 p-6 rounded-[0px] border border-red-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert size={20} />
              <h4 className="font-semibold uppercase tracking-widest text-[10px]">
                Zona de Perigo (Danger Zone)
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-[0px] border border-red-50 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Bloquear ou Reativar Acesso
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Alternar o acesso do motorista ao aplicativo móvel
                    WiTransfer.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={toggling}
                  className={`w-fit px-3 py-2 rounded-[5px] text-[10px] uppercase tracking-wider transition-all border ${
                    motorista.perfis.ativo
                      ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                      : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                  }`}>
                  {motorista.perfis.ativo
                    ? "Bloquear Acesso"
                    : "Reativar Acesso"}
                </button>
              </div>

              <div className="bg-white p-4 rounded-[0px] border border-red-50 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Eliminar Conta Definitivamente
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Remove os dados e histórico permanentemente da plataforma.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={toggling}
                  className="w-fit px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-[5px] text-[10px] uppercase tracking-wider transition-all shadow-md shadow-rose-600/10 active:scale-95">
                  Eliminar Motorista
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
