/** @format */

"use client";

import React, { use, useState, useEffect } from "react";
import {
  ArrowLeft,
  Edit2,
  Handshake,
  Mail,
  Phone,
  MapPin,
  Clock,
  Compass,
  Globe,
  Percent,
  Briefcase,
  User,
  Users,
  Car,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  Check,
  X,
  Star,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface Perfil {
  id: string;
  nome_completo: string;
  email: string | null;
  telefone: string | null;
  foto_url: string | null;
  ativo: boolean;
}

interface Motorista {
  id: string;
  perfil_id: string;
  carta_conducao: string | null;
  disponivel: boolean;
  total_viagens: number;
  avaliacao_media: number;
  experiencia_anos: number | null;
  status_aprovacao: string | null;
  perfis: Perfil | null;
}

interface Categoria {
  nome: string;
}

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
  foto_url: string | null;
  ativo: boolean;
  categorias: Categoria | null;
}

interface Parceiro {
  id: string;
  nome: string;
  nif: string | null;
  email: string | null;
  telefone: string | null;
  website: string | null;
  provincia: string | null;
  municipio: string | null;
  endereco: string | null;
  area_atividade: string | null;
  objetivo_parceria: string | null;
  responsavel_nome: string | null;
  responsavel_cargo: string | null;
  responsavel_email: string | null;
  responsavel_telefone: string | null;
  logo_url: string | null;
  comissao_percentual: number;
  ativo: boolean;
  status_aprovacao: string | null;
  observacoes_admin: string | null;
  criado_em: string;
}

interface ParceiroDetalhePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ParceiroDetalhePage({ params }: ParceiroDetalhePageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const parceiroId = resolvedParams.id;

  const [parceiro, setParceiro] = useState<Parceiro | null>(null);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [activeTab, setActiveTab] = useState<"geral" | "motoristas" | "viaturas">("geral");

  useEffect(() => {
    async function loadParceiroData() {
      try {
        setLoading(true);
        // 1. Carregar perfil do parceiro
        const { data: p, error: pError } = await supabase
          .from("parceiros")
          .select("*")
          .eq("id", parceiroId)
          .single();

        if (pError) throw pError;
        setParceiro(p);

        // 2. Carregar motoristas associados
        const { data: motData, error: mError } = await supabase
          .from("motoristas")
          .select(`
            id,
            perfil_id,
            carta_conducao,
            disponivel,
            total_viagens,
            avaliacao_media,
            experiencia_anos,
            status_aprovacao,
            perfis:perfil_id (
              id,
              nome_completo,
              email,
              telefone,
              foto_url,
              ativo
            )
          `)
          .eq("parceiro_id", parceiroId);

        if (mError) throw mError;
        
        // Conversão segura de tipo para perfis aninhados
        const formattedMotoristas = (motData || []).map((m: any) => ({
          id: m.id,
          perfil_id: m.perfil_id,
          carta_conducao: m.carta_conducao,
          disponivel: m.disponivel,
          total_viagens: m.total_viagens || 0,
          avaliacao_media: m.avaliacao_media || 5.0,
          experiencia_anos: m.experiencia_anos,
          status_aprovacao: m.status_aprovacao,
          perfis: Array.isArray(m.perfis) ? m.perfis[0] : m.perfis,
        })) as Motorista[];

        setMotoristas(formattedMotoristas);

        // 3. Carregar viaturas associadas
        const { data: viatData, error: vError } = await supabase
          .from("viaturas")
          .select(`
            id,
            modelo,
            marca,
            cor,
            matricula,
            ano,
            km,
            lugares,
            malas,
            preco_base,
            foto_url,
            ativo,
            categorias:categoria_id (
              nome
            )
          `)
          .eq("parceiro_id", parceiroId);

        if (vError) throw vError;

        // Conversão segura de tipo para categorias aninhadas
        const formattedViaturas = (viatData || []).map((v: any) => ({
          id: v.id,
          modelo: v.modelo,
          marca: v.marca,
          cor: v.cor,
          matricula: v.matricula,
          ano: v.ano,
          km: v.km,
          lugares: v.lugares || 4,
          malas: v.malas || 2,
          preco_base: v.preco_base || 0,
          foto_url: v.foto_url,
          ativo: v.ativo ?? true,
          categorias: Array.isArray(v.categorias) ? v.categorias[0] : v.categorias,
        })) as Viatura[];

        setViaturas(formattedViaturas);

      } catch (err) {
        console.error("Erro ao carregar dados do parceiro:", err);
      } finally {
        setLoading(false);
      }
    }

    loadParceiroData();
  }, [parceiroId]);

  const handleToggleStatus = async () => {
    if (!parceiro) return;
    try {
      setToggling(true);
      const newStatus = !parceiro.ativo;
      const { error } = await supabase
        .from("parceiros")
        .update({ ativo: newStatus })
        .eq("id", parceiro.id);

      if (error) throw error;
      setParceiro((prev) => (prev ? { ...prev, ativo: newStatus } : null));
    } catch (err) {
      alert("Erro ao atualizar estado de atividade.");
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!parceiro) return;
    if (!confirm("Tem a certeza absoluta que deseja eliminar permanentemente este parceiro e todo o seu histórico da plataforma?")) return;

    try {
      setToggling(true);
      const { error } = await supabase.from("parceiros").delete().eq("id", parceiro.id);
      if (error) throw error;
      router.push("/admin/parceiros");
    } catch (err) {
      alert("Erro ao eliminar parceiro da base de dados.");
    } finally {
      setToggling(false);
    }
  };

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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[10px] text-[8px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-150">
          Aprovado
        </span>
      );
    }
    if (s === "rejeitado") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[10px] text-[8px] font-bold uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-150">
          Rejeitado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[10px] text-[8px] font-bold uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-150">
        Pendente
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-[#902ad1] animate-spin" />
        <p className="text-slate-500 font-semibold text-sm uppercase tracking-widest">
          A carregar ficha do parceiro...
        </p>
      </div>
    );
  }

  if (!parceiro) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[10px] border border-slate-100 shadow-sm mx-0 md:mx-[80px]">
        <AlertTriangle className="text-rose-500 mb-4" size={48} />
        <h3 className="text-lg font-semibold text-slate-800">Parceiro Não Encontrado</h3>
        <p className="text-slate-400 mt-1 mb-6 text-sm">
          O parceiro que procura não existe ou foi removido do sistema.
        </p>
        <Link
          href="/admin/parceiros"
          className="bg-[#902ad1] text-white px-6 py-3 rounded-[10px] font-semibold transition-all shadow-md active:scale-95"
        >
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
              <Link href="/admin/parceiros" className="hover:text-[#902ad1] transition-all">
                Parceiros
              </Link>
              <span className="text-slate-300 font-medium">/</span>
              <span className="text-slate-600 font-bold">Ficha do Parceiro</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Ficha do Parceiro
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/admin/parceiros/${parceiro.id}/editar`}
            className="flex items-center gap-2 bg-white/85 hover:bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-sm hover:shadow-md hover:border-slate-300 active:scale-[0.98] text-[11px] uppercase tracking-wider"
          >
            <Edit2 size={13} />
            <span>Editar Informações</span>
          </Link>
        </div>
      </div>

      {/* Bento Grid Assimétrico (12 Colunas) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">

        {/* ── Card 1: Perfil Corporativo (4 cols) ── */}
        <div className="md:col-span-4 bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#902ad1]/20 transition-all duration-300 p-8 flex flex-col justify-between h-full relative overflow-hidden text-center">
          {/* Badges de Status */}
          <div className="absolute top-6 right-6 flex flex-col items-end gap-1.5">
            {getAprovacaoBadge(parceiro.status_aprovacao)}
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                parceiro.ativo
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200/60"
                  : "bg-rose-50 text-rose-600 border-rose-200/60"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${parceiro.ativo ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              {parceiro.ativo ? "Ativo" : "Suspenso"}
            </span>
          </div>

          <div className="pt-4">
            {/* Logo / Ícone */}
            <div className="relative w-28 h-28 rounded-3xl overflow-hidden border-4 border-[#902ad1]/10 mx-auto bg-gradient-to-br from-[#902ad1]/15 to-[#902ad1]/5 flex items-center justify-center mb-5 shadow-inner">
              {parceiro.logo_url ? (
                <Image src={parceiro.logo_url} alt={parceiro.nome} fill className="object-cover animate-in fade-in duration-300" />
              ) : (
                <Handshake size={48} className="text-[#902ad1] opacity-80" />
              )}
            </div>

            <h2 className="text-xl font-black text-slate-800 leading-tight tracking-tight px-2 truncate" title={parceiro.nome}>
              {parceiro.nome}
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-[#902ad1] uppercase tracking-wider mt-2 bg-purple-50 border border-purple-200/40">
              Parceiro Oficial • {parceiro.area_atividade || "Transportes"}
            </span>
          </div>

          {/* Separador */}
          <div className="h-px bg-slate-100 my-6" />

          <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
            <span>Membro desde:</span>
            <span className="text-slate-600 font-extrabold">{formatDate(parceiro.criado_em)}</span>
          </div>
        </div>

        {/* ── Card 2: Informações Corporativas (8 cols) ── */}
        <div className="md:col-span-8 bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#902ad1]/20 transition-all duration-300 p-8 flex flex-col justify-between h-full relative overflow-hidden">
          {/* Badge Superior */}
          <div className="absolute top-6 right-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-[#902ad1] border border-purple-200/60 shadow-sm">
              <Briefcase size={10} />
              CRM Corporativo
            </span>
          </div>

          <div>
            {/* Header */}
            <div className="mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Contactos Empresariais</span>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Informações Corporativas</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-1.5">Dados fiscais e canais de comunicação da empresa</p>
            </div>

            {/* Separador */}
            <div className="h-px bg-slate-100 my-4" />

            {/* Sub-grid de Contacto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 my-5">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-200/20">
                  <Phone size={14} className="text-[#902ad1]" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Telefone Geral</span>
                  <p className="text-[13px] font-extrabold text-slate-700">
                    {parceiro.telefone || "Sem telefone registado"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-200/20">
                  <Mail size={14} className="text-[#902ad1]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">E-mail de Contacto</span>
                  <p className="text-[13px] font-extrabold text-slate-700 break-all truncate" title={parceiro.email || ""}>
                    {parceiro.email || "Sem e-mail registado"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-200/20">
                  <Globe size={14} className="text-[#902ad1]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Website Oficial</span>
                  {parceiro.website ? (
                    <a
                      href={parceiro.website.startsWith("http") ? parceiro.website : `https://${parceiro.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13px] font-extrabold text-[#902ad1] hover:underline truncate block"
                    >
                      {parceiro.website}
                    </a>
                  ) : (
                    <p className="text-[13px] font-extrabold text-slate-700">Não registado</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-200/20">
                  <FileText size={14} className="text-[#902ad1]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">NIF / Contribuinte</span>
                  <p className="text-[13px] font-extrabold text-slate-700 truncate">
                    {parceiro.nif || "---"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-5 border-t border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Dados empresariais sincronizados via Cloud</span>
          </div>
        </div>

        {/* ── Card 3: Indicadores & Frota (8 cols) ── */}
        <div className="md:col-span-8 bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#902ad1]/20 transition-all duration-300 p-8 flex flex-col justify-between h-full relative overflow-hidden">
          {/* Badge Superior */}
          <div className="absolute top-6 right-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-sm">
              <Compass size={10} />
              Indicadores Operacionais
            </span>
          </div>

          <div>
            {/* Header */}
            <div className="mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Gestão de Frota</span>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Indicadores & Frota</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-1.5">Resumo dos ativos sob gestão deste parceiro comercial</p>
            </div>

            {/* Separador */}
            <div className="h-px bg-slate-100 my-4" />

            {/* Grid de Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 my-5">
              <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-4 hover:bg-slate-50 transition-colors duration-250">
                <div className="p-3 bg-[#902ad1]/5 text-[#902ad1] rounded-xl shrink-0">
                  <Users size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Motoristas</span>
                  <span className="text-xl font-extrabold text-slate-700">{motoristas.length}</span>
                </div>
              </div>

              <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-4 hover:bg-slate-50 transition-colors duration-250">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <Car size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Frota Viaturas</span>
                  <span className="text-xl font-extrabold text-slate-700">{viaturas.length}</span>
                </div>
              </div>

              <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-4 hover:bg-slate-50 transition-colors duration-250">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                  <Compass size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Total Viagens</span>
                  <span className="text-xl font-extrabold text-slate-700">
                    {motoristas.reduce((acc, curr) => acc + curr.total_viagens, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Estado Operacional</span>
            <span className="text-slate-700 font-extrabold">{parceiro.ativo ? "Parceiro Ativo" : "Parceiro Suspenso"}</span>
          </div>
        </div>

        {/* ── Card 4: Configurações Financeiras / Comissão (4 cols) ── */}
        <div className="md:col-span-4 bg-gradient-to-br from-[#902ad1]/90 to-[#7b22b8] rounded-[24px] border border-[#902ad1]/20 shadow-[0_4px_24px_rgba(144,42,209,0.25)] hover:shadow-[0_8px_40px_rgba(144,42,209,0.35)] transition-all duration-300 p-8 flex flex-col justify-between h-full relative overflow-hidden text-white">
          {/* Badge Superior */}
          <div className="absolute top-6 right-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/15 text-white border border-white/25 shadow-sm backdrop-blur-sm">
              <Percent size={10} />
              Financeiro
            </span>
          </div>

          {/* Brilho decorativo */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/5 blur-xl pointer-events-none" />

          <div>
            {/* Header */}
            <div className="mb-6">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest block mb-1">Regras de Liquidação</span>
              <h3 className="text-2xl font-black text-white tracking-tight leading-none">Comissão Contratada</h3>
              <p className="text-[11px] font-medium text-white/60 mt-1.5">Percentagem retida por cada serviço prestado</p>
            </div>

            {/* Separador */}
            <div className="h-px bg-white/15 my-4" />

            {/* Taxa de Comissão em Destaque */}
            <div className="my-6 flex flex-col items-center justify-center">
              <div className="relative">
                <span className="text-7xl font-black text-white leading-none tracking-tighter">
                  {parceiro.comissao_percentual}
                </span>
                <span className="text-3xl font-black text-white/80 absolute -top-1 -right-6">%</span>
              </div>
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-3">
                sobre cada transação
              </span>
            </div>
          </div>

          <div className="pt-5 border-t border-white/15 flex items-center justify-center text-[10px] font-bold text-white/50 uppercase tracking-wider">
            <span>Configuração Financeira Ativa</span>
          </div>
        </div>

        {/* ── Card 5: Central de Ativos / Tabs Dinâmicas (8 cols) ── */}
        <div className="md:col-span-8 bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#902ad1]/20 transition-all duration-300 p-8 flex flex-col h-full relative overflow-hidden">
          {/* Badge Superior */}
          <div className="absolute top-6 right-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-[#902ad1] border border-purple-200/60 shadow-sm">
              <Briefcase size={10} />
              Central de Ativos
            </span>
          </div>

          {/* Header */}
          <div className="mb-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Gestão Centralizada</span>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Ativos do Parceiro</h3>
            <p className="text-[11px] font-medium text-slate-400 mt-1.5">Informações gerais, motoristas e frota de viaturas</p>
          </div>

          {/* Separador */}
          <div className="h-px bg-slate-100 mb-5" />

          {/* Menu de Tabs */}
          <div className="flex border-b border-slate-100 gap-6 mb-5">
            <button
              onClick={() => setActiveTab("geral")}
              className={`pb-3 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === "geral"
                  ? "border-[#902ad1] text-[#902ad1]"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              Geral & Contacto
            </button>
            <button
              onClick={() => setActiveTab("motoristas")}
              className={`pb-3 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === "motoristas"
                  ? "border-[#902ad1] text-[#902ad1]"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              Motoristas ({motoristas.length})
            </button>
            <button
              onClick={() => setActiveTab("viaturas")}
              className={`pb-3 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === "viaturas"
                  ? "border-[#902ad1] text-[#902ad1]"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              Frota ({viaturas.length})
            </button>
          </div>

          {/* Conteúdo da Tab: Geral */}
          {activeTab === "geral" && (
            <div className="space-y-5 flex-1">
              {/* Sede e Endereço */}
              <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center gap-2 text-slate-700 font-bold uppercase tracking-widest text-[10px] border-b border-slate-100 pb-3">
                  <MapPin size={12} className="text-[#902ad1]" />
                  <span>Sede & Localização</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Província</span>
                    <span className="font-extrabold text-slate-700">{parceiro.provincia || "Luanda"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Município</span>
                    <span className="font-extrabold text-slate-700">{parceiro.municipio || "---"}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Endereço Completo</span>
                    <span className="font-extrabold text-slate-700">{parceiro.endereco || "Não especificado"}</span>
                  </div>
                </div>
              </div>

              {/* Responsável */}
              <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center gap-2 text-slate-700 font-bold uppercase tracking-widest text-[10px] border-b border-slate-100 pb-3">
                  <User size={12} className="text-[#902ad1]" />
                  <span>Pessoa de Contacto / Gestor</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Nome Completo</span>
                    <span className="font-extrabold text-slate-700">{parceiro.responsavel_nome || "---"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Cargo / Função</span>
                    <span className="font-extrabold text-slate-700">{parceiro.responsavel_cargo || "---"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">E-mail Direto</span>
                    <span className="font-extrabold text-slate-700 break-all">{parceiro.responsavel_email || "---"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Telefone Direto</span>
                    <span className="font-extrabold text-slate-700">{parceiro.responsavel_telefone || "---"}</span>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {parceiro.observacoes_admin && (
                <div className="p-5 bg-amber-50/40 rounded-2xl border border-amber-100/60 space-y-2">
                  <div className="flex items-center gap-2 text-slate-700 font-bold uppercase tracking-widest text-[10px]">
                    <FileText size={12} className="text-amber-500" />
                    <span>Observações Administrativas</span>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed italic">
                    {parceiro.observacoes_admin}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Conteúdo da Tab: Motoristas */}
          {activeTab === "motoristas" && (
            <div className="flex-1">
              {motoristas.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <th className="py-3 px-4">Motorista</th>
                        <th className="py-3 px-4">Contactos</th>
                        <th className="py-3 px-4 text-center">Avaliação</th>
                        <th className="py-3 px-4 text-center">Disponível</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
                      {motoristas.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/50 hover:shadow-[inset_4px_0_0_0_#902ad1] transition-all duration-200">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="relative w-8 h-8 bg-slate-50 rounded-full overflow-hidden border border-slate-200 shrink-0">
                                {m.perfis?.foto_url ? (
                                  <Image src={m.perfis.foto_url} alt={m.perfis.nome_completo} fill className="object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <Users size={14} />
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="block font-extrabold">{m.perfis?.nome_completo || "Sem Nome"}</span>
                                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                                  Exp: {m.experiencia_anos ? `${m.experiencia_anos} anos` : "N/A"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="block">{m.perfis?.telefone || "---"}</span>
                            <span className="text-[9px] text-slate-400 font-semibold block truncate max-w-[150px]">{m.perfis?.email || "---"}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              <Star size={12} className="text-amber-400 fill-amber-400" />
                              <span>{m.avaliacao_media.toFixed(1)}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">({m.total_viagens})</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                              m.disponivel ? "bg-emerald-50 text-emerald-600 border border-emerald-200/60" : "bg-slate-100 text-slate-500"
                            }`}>
                              {m.disponivel ? "Livre" : "Ocupado"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              href={`/admin/motoristas/${m.id}`}
                              className="text-[#902ad1] hover:underline font-extrabold text-[10px] uppercase tracking-wider"
                            >
                              Ver Ficha
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <Users className="text-slate-300 mx-auto mb-3" size={28} />
                  <p className="text-xs text-slate-400 font-bold italic">
                    Nenhum motorista associado a este parceiro.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Conteúdo da Tab: Viaturas */}
          {activeTab === "viaturas" && (
            <div className="flex-1">
              {viaturas.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <th className="py-3 px-4">Viatura</th>
                        <th className="py-3 px-4">Matrícula</th>
                        <th className="py-3 px-4">Categoria</th>
                        <th className="py-3 px-4 text-center">Especificações</th>
                        <th className="py-3 px-4 text-right">Preço Base</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
                      {viaturas.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50/50 hover:shadow-[inset_4px_0_0_0_#902ad1] transition-all duration-200">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="relative w-10 h-7 bg-slate-50 rounded border border-slate-200 overflow-hidden shrink-0">
                                {v.foto_url ? (
                                  <Image src={v.foto_url} alt={v.modelo} fill className="object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                                    <Car size={14} />
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="block font-extrabold">{v.modelo}</span>
                                <span className="text-[9px] text-slate-400 font-semibold uppercase">{v.marca || "Marca Indefinida"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded-lg text-[8px] font-bold tracking-wider border border-yellow-200 uppercase">
                              {v.matricula || "S/ MATRÍCULA"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-wider border border-slate-200">
                              {v.categorias?.nome || "Económica"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="text-[10px] font-semibold text-slate-500">
                              {v.lugares} Lug. • {v.malas} Malas
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right text-[#902ad1] font-extrabold">
                            {v.preco_base?.toLocaleString("pt-AO")} Kz
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <Car className="text-slate-300 mx-auto mb-3" size={28} />
                  <p className="text-xs text-slate-400 font-bold italic">
                    Nenhuma viatura registada na frota deste parceiro.
                  </p>
                </div>
              )}
            </div>
          )}
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
              <p className="text-[11px] font-medium text-slate-400 mt-1.5">Painel de controle de acesso e eliminação</p>
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
                Alterações nesta secção afetam o acesso do parceiro ao painel e à gestão da sua frota. A eliminação desvincula motoristas e viaturas permanentemente.
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
                parceiro.ativo
                  ? "bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border-rose-200"
                  : "bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border-emerald-200"
              }`}
            >
              {parceiro.ativo ? "Suspender Acesso" : "Reativar Acesso"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={toggling}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              Eliminar Parceiro
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
