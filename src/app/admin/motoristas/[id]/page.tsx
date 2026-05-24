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
  Mail,
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-3 text-slate-400 hover:text-slate-700 bg-white/80 hover:bg-white rounded-2xl border border-slate-100/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300"
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Link href="/admin/dashboard" className="hover:text-[#902ad1] transition-all">
                Painel
              </Link>
              <span className="text-slate-300 font-medium">/</span>
              <Link href="/admin/motoristas" className="hover:text-[#902ad1] transition-all">
                Motoristas
              </Link>
              <span className="text-slate-300 font-medium">/</span>
              <span className="text-slate-600 font-bold">Ficha de Motorista</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Ficha do Motorista
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/admin/motoristas/${motorista.id}/editar`}
            className="flex items-center gap-2 bg-white/85 hover:bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-sm hover:shadow-md hover:border-slate-300 active:scale-[0.98] text-[11px] uppercase tracking-wider"
          >
            <Edit2 size={13} />
            <span>Editar Informações</span>
          </Link>
        </div>
      </div>

      {/* Bento Grid Assimétrico (12 Colunas) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        
        {/* ── Card 1: Ficha do Condutor & Rating (4 cols) ── */}
        <div className="md:col-span-4 bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#902ad1]/20 transition-all duration-300 p-8 flex flex-col justify-between h-full relative overflow-hidden text-center">
          {/* Badge de Status Superior */}
          <div className="absolute top-6 right-6">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                motorista.perfis.ativo
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200/60"
                  : "bg-rose-50 text-rose-600 border-rose-200/60"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${motorista.perfis.ativo ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              {motorista.perfis.ativo ? "Ativo" : "Suspenso"}
            </span>
          </div>

          <div className="pt-4">
            {/* Foto de Perfil */}
            <div className="relative w-28 h-28 rounded-3xl overflow-hidden border-4 border-[#902ad1]/10 mx-auto bg-gradient-to-br from-[#902ad1]/15 to-[#902ad1]/5 flex items-center justify-center mb-5 shadow-inner">
              {motorista.perfis.foto_url ? (
                <Image src={motorista.perfis.foto_url} alt={motorista.perfis.nome_completo} fill className="object-cover animate-in fade-in duration-300" />
              ) : (
                <User size={48} className="text-[#902ad1] opacity-80" />
              )}
            </div>

            <h2 className="text-xl font-black text-slate-800 leading-tight tracking-tight px-2 truncate" title={motorista.perfis.nome_completo}>
              {motorista.perfis.nome_completo}
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-[#902ad1] uppercase tracking-wider mt-2 bg-purple-50 border border-purple-200/40">
              {motorista.parceiros?.nome || "WiTransfer Official"}
            </span>

            {/* Classificação Média */}
            <div className="flex items-center justify-center gap-1.5 mt-5 bg-slate-50/60 py-2.5 px-4 rounded-xl border border-slate-100 w-fit mx-auto shadow-sm">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <span className="text-xs font-black text-slate-700">
                {motorista.avaliacao_media?.toFixed(1) || "5.0"}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                ({motorista.total_viagens || 0} Viagens)
              </span>
            </div>
          </div>

          {/* Separador */}
          <div className="h-px bg-slate-100 my-6" />

          <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
            <span>Categoria de Cadastro:</span>
            <span className="text-slate-600 font-extrabold">Motorista Parceiro</span>
          </div>
        </div>

        {/* ── Card 2: Contactos & Estado de Cadastro (8 cols) ── */}
        <div className="md:col-span-8 bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#902ad1]/20 transition-all duration-300 p-8 flex flex-col justify-between h-full relative overflow-hidden">
          {/* Badge Superior */}
          <div className="absolute top-6 right-6">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                motorista.status_aprovacao === "aprovado" || motorista.status_aprovacao === "Aprovado"
                  ? "bg-blue-50 text-blue-600 border-blue-200/60"
                  : "bg-amber-50 text-amber-600 border-amber-200/60"
              }`}
            >
              {motorista.status_aprovacao || "Aprovado"}
            </span>
          </div>

          <div>
            {/* Header */}
            <div className="mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Canais de Comunicação</span>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Contacto & Registo</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-1.5">Meios corporativos para contacto e validação legal</p>
            </div>

            {/* Separador */}
            <div className="h-px bg-slate-100 my-4" />

            {/* Sub-grid de Contacto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 my-5">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-200/20">
                  <User size={14} className="text-[#902ad1] shrink-0" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Telefone Principal</span>
                  <p className="text-[13px] font-extrabold text-slate-700">
                    {motorista.perfis.telefone || "Nenhum telefone registado"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-200/20">
                  <Mail size={14} className="text-[#902ad1] shrink-0" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Endereço de E-mail</span>
                  <p className="text-[13px] font-extrabold text-slate-700 break-all truncate" title={motorista.perfis.email || ""}>
                    {motorista.perfis.email || "Nenhum e-mail registado"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-200/20">
                  <FileText size={14} className="text-[#902ad1] shrink-0" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Nº Carta de Condução</span>
                  <p className="text-[13px] font-extrabold text-slate-700 truncate">
                    {motorista.carta_conducao || "Não especificado"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-200/20">
                  <FileText size={14} className="text-[#902ad1] shrink-0" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">ID de Utilizador</span>
                  <p className="text-[13px] font-extrabold text-slate-700 truncate break-all" title={motorista.id}>
                    {motorista.id.substring(0, 18)}...
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-5 border-t border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Última atualização de dados sincronizada via Cloud</span>
          </div>
        </div>

        {/* ── Card 3: Métricas Operacionais (8 cols) ── */}
        <div className="md:col-span-8 bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#902ad1]/20 transition-all duration-300 p-8 flex flex-col justify-between h-full relative overflow-hidden">
          {/* Badge Superior */}
          <div className="absolute top-6 right-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-sm">
              <Activity size={10} />
              Operação Ativa
            </span>
          </div>

          <div>
            {/* Header */}
            <div className="mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Indicadores e Performance</span>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Métricas Operacionais</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-1.5">Resumo consolidado do desempenho e disponibilidade</p>
            </div>

            {/* Separador */}
            <div className="h-px bg-slate-100 my-4" />

            {/* Grid de Estatísticas Rápidas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-5">
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-3 hover:bg-slate-50 transition-colors duration-250">
                <div className="p-2.5 bg-[#902ad1]/5 text-[#902ad1] rounded-xl shrink-0">
                  <Activity size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Viagens</span>
                  <span className="text-sm font-extrabold text-slate-700">{motorista.total_viagens || 0}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-3 hover:bg-slate-50 transition-colors duration-250">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                  <CheckCircle size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Disponível</span>
                  <span className="text-sm font-extrabold text-slate-700">{motorista.disponivel ? "Sim" : "Não"}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-3 hover:bg-slate-50 transition-colors duration-250">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <Briefcase size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Experiência</span>
                  <span className="text-sm font-extrabold text-slate-700 truncate block">
                    {motorista.experiencia_anos ? `${motorista.experiencia_anos} anos` : "N/A"}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-3 hover:bg-slate-50 transition-colors duration-250">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                  <Globe size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Idiomas</span>
                  <span className="text-xs font-extrabold text-slate-700 truncate block" title={motorista.idiomas?.join(", ") || "Português"}>
                    {motorista.idiomas?.join(", ") || "Português"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Disponibilidade na Plataforma</span>
            <span className="text-slate-700 font-extrabold">{motorista.disponivel ? "Livre para Serviço" : "Ocupado / Offline"}</span>
          </div>
        </div>

        {/* ── Card 4: Viatura Atribuída (4 cols) ── */}
        <div className="md:col-span-4 bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#902ad1]/20 transition-all duration-300 p-8 flex flex-col justify-between h-full relative overflow-hidden">
          {/* Badge Superior */}
          <div className="absolute top-6 right-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-[#902ad1] border border-purple-200/60 shadow-sm">
              <Car size={10} />
              Frota
            </span>
          </div>

          <div>
            {/* Header */}
            <div className="mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Viatura Ativa</span>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Veículo</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-1.5">Informações do automóvel ativo no sistema</p>
            </div>

            {/* Separador */}
            <div className="h-px bg-slate-100 my-4" />

            {/* Conteúdo do Veículo */}
            <div className="my-5">
              {motorista.viaturas ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3.5 p-3 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors duration-200">
                    <div className="relative w-16 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200/60 shrink-0">
                      {motorista.viaturas.foto_url ? (
                        <Image src={motorista.viaturas.foto_url} alt={motorista.viaturas.modelo} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-350 bg-slate-100">
                          <Car size={20} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-extrabold text-slate-700 block truncate">
                        {motorista.viaturas.marca} {motorista.viaturas.modelo}
                      </span>
                      <span className="inline-block mt-1 bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded-lg text-[8px] font-bold border border-yellow-200 uppercase tracking-wider">
                        {motorista.viaturas.matricula || "SEM MATRÍCULA"}
                      </span>
                    </div>
                  </div>
                  
                  <Link
                    href={`/admin/viaturas/${motorista.viaturas.id}`}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#902ad1] hover:text-[#7b22b8] hover:underline uppercase tracking-wider transition-all w-fit mt-1"
                  >
                    <span>Ver Detalhes do Veículo</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              ) : (
                <div className="py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/80 text-center flex flex-col items-center justify-center">
                  <Car className="text-slate-300 mb-2 animate-pulse" size={28} />
                  <p className="text-xs text-slate-450 font-bold italic px-2">
                    Nenhum veículo atribuído a este motorista.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-5 border-t border-slate-100 flex items-center justify-center text-[10px] font-bold text-[#902ad1] uppercase tracking-wider">
            <span>Vinculação Ativa</span>
          </div>
        </div>

        {/* ── Card 5: Documentos Regulamentares (8 cols) ── */}
        <div className="md:col-span-8 bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#902ad1]/20 transition-all duration-300 p-8 flex flex-col justify-between h-full relative overflow-hidden">
          {/* Badge Superior */}
          <div className="absolute top-6 right-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-[#902ad1] border border-purple-200/60 shadow-sm">
              <FileText size={10} />
              Regulamentar
            </span>
          </div>

          <div>
            {/* Header */}
            <div className="mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Conformidade Legal</span>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Documentos Regulamentares</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-1.5">Ficheiros de identificação e habilitação profissional</p>
            </div>

            {/* Separador */}
            <div className="h-px bg-slate-100 my-4" />

            {/* Anexos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 my-5">
              {/* Carta de condução */}
              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 gap-3 hover:bg-slate-50 hover:border-slate-200 transition-all duration-200">
                <div className="flex items-center gap-3 truncate">
                  <div className="p-2.5 bg-purple-50 text-[#902ad1] rounded-xl shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-slate-700 block leading-tight">
                      Carta de Condução
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                      Ficheiro Profissional
                    </span>
                  </div>
                </div>
                {motorista.carta_conducao_url ? (
                  <a
                    href={motorista.carta_conducao_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-white hover:bg-slate-100 text-[#902ad1] rounded-xl shadow-sm border border-slate-200 transition-colors shrink-0 flex items-center justify-center"
                    title="Abrir Documento"
                  >
                    <ExternalLink size={13} />
                  </a>
                ) : (
                  <span className="text-[9px] text-slate-450 font-bold italic shrink-0">
                    Sem anexo
                  </span>
                )}
              </div>

              {/* BI */}
              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 gap-3 hover:bg-slate-50 hover:border-slate-200 transition-all duration-200">
                <div className="flex items-center gap-3 truncate">
                  <div className="p-2.5 bg-purple-50 text-[#902ad1] rounded-xl shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-slate-700 block leading-tight">
                      Bilhete de Identidade
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                      Identificação Pessoal
                    </span>
                  </div>
                </div>
                {motorista.documento_bi_url ? (
                  <a
                    href={motorista.documento_bi_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-white hover:bg-slate-100 text-[#902ad1] rounded-xl shadow-sm border border-slate-200 transition-colors shrink-0 flex items-center justify-center"
                    title="Abrir Documento"
                  >
                    <ExternalLink size={13} />
                  </a>
                ) : (
                  <span className="text-[9px] text-slate-450 font-bold italic shrink-0">
                    Sem anexo
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Sincronização e Validação</span>
            <span className="text-emerald-600 font-extrabold flex items-center gap-1">
              <CheckCircle size={10} />
              Verificados
            </span>
          </div>
        </div>

        {/* ── Card 6: Administração & Segurança (4 cols) ── */}
        <div className="md:col-span-4 bg-white/80 backdrop-blur-sm rounded-[24px] border border-rose-100/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-rose-300 transition-all duration-300 p-8 flex flex-col justify-between h-full relative overflow-hidden">
          {/* Badge Superior */}
          <div className="absolute top-6 right-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200/60 shadow-sm">
              <ShieldAlert size={10} />
              Controle Crítico
            </span>
          </div>

          <div>
            {/* Header */}
            <div className="mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Zona Administrativa</span>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Segurança</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-1.5">Painel destrutivo e controle de bloqueio</p>
            </div>

            {/* Separador */}
            <div className="h-px bg-slate-100 my-4" />

            {/* Alerta de Segurança */}
            <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 flex flex-col gap-2.5 my-5">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle size={15} />
                <span className="text-[10.5px] font-bold uppercase tracking-wider">Atenção Crítica</span>
              </div>
              <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed">
                Alterações nesta secção afetam o acesso do motorista ao aplicativo móvel. A eliminação é irreversível e apagará o histórico da base de dados.
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="space-y-3 mt-6">
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={toggling}
              className={`w-full py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border flex items-center justify-center gap-2 active:scale-[0.98] ${
                motorista.perfis.ativo
                  ? "bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border-rose-200"
                  : "bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border-emerald-200"
              }`}
            >
              {motorista.perfis.ativo ? "Bloquear Acesso" : "Reativar Acesso"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={toggling}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              Eliminar Motorista
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
