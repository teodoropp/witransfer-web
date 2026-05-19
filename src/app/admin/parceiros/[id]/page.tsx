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
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-3 bg-white hover:bg-slate-50 rounded-[10px] border border-slate-100 text-slate-600 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              <Link href="/admin/dashboard" className="hover:text-[#902ad1] transition-all">
                Painel
              </Link>
              <span className="text-slate-300">/</span>
              <Link href="/admin/parceiros" className="hover:text-[#902ad1] transition-all">
                Parceiros
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">Ficha do Parceiro</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
              Ficha do Parceiro
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <Link
            href={`/admin/parceiros/${parceiro.id}/editar`}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-[10px] font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-xs"
          >
            <Edit2 size={14} />
            <span>Editar Informações</span>
          </Link>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mx-0 md:mx-[80px]">
        {/* Lado Esquerdo: Ficha Básica */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card Principal */}
          <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
              {getAprovacaoBadge(parceiro.status_aprovacao)}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-[10px] text-[8px] font-bold uppercase tracking-widest border ${
                  parceiro.ativo
                    ? "bg-emerald-50 text-emerald-600 border-emerald-150"
                    : "bg-rose-50 text-rose-600 border-rose-150"
                }`}
              >
                {parceiro.ativo ? "Ativo" : "Suspenso"}
              </span>
            </div>

            <div className="relative w-28 h-28 rounded-xl overflow-hidden border-4 border-[#902ad1]/10 mx-auto bg-slate-50 flex items-center justify-center mb-4">
              {parceiro.logo_url ? (
                <Image src={parceiro.logo_url} alt={parceiro.nome} fill className="object-cover" />
              ) : (
                <Handshake size={44} className="text-[#902ad1]" />
              )}
            </div>

            <h2 className="text-lg font-bold text-slate-800 leading-tight">
              {parceiro.nome}
            </h2>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1 block">
              Parceiro Oficial • {parceiro.area_atividade || "Transportes"}
            </span>

            <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-slate-50">
              <span className="text-xs text-slate-450 font-medium">
                Membro desde: {formatDate(parceiro.criado_em)}
              </span>
            </div>
          </div>

          {/* Taxa de Comissão */}
          <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h4 className="font-semibold text-slate-700 uppercase tracking-widest text-[10px]">
                Configurações Financeiras
              </h4>
              <Percent size={14} className="text-[#902ad1]" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">
                Comissão Contratada
              </span>
              <span className="text-xl font-bold text-slate-800">
                {parceiro.comissao_percentual}%
              </span>
              <span className="text-[9px] text-slate-400 font-medium block mt-1">
                Percentagem retida pela plataforma sobre cada viagem.
              </span>
            </div>
          </div>

          {/* Contacto e Detalhes */}
          <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-semibold text-slate-700 uppercase tracking-widest text-[10px] border-b border-slate-50 pb-3">
              Informações Corporativas
            </h4>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">
                  Telefone Geral
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {parceiro.telefone || "Sem telefone registado"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">
                  E-mail de Contacto
                </span>
                <span className="text-xs font-semibold text-slate-700 break-all">
                  {parceiro.email || "Sem e-mail registado"}
                </span>
              </div>
              {parceiro.website && (
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">
                    Website Oficial
                  </span>
                  <a
                    href={parceiro.website.startsWith("http") ? parceiro.website : `https://${parceiro.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[#902ad1] hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <Globe size={12} />
                    {parceiro.website}
                  </a>
                </div>
              )}
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">
                  Número de Contribuinte (NIF)
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {parceiro.nif || "---"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Tabs & Info Detalhada */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Indicadores Rápidos */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-[10px] border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-[#902ad1]/5 text-[#902ad1] rounded-xl">
                  <Users size={18} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                    Motoristas
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    {motoristas.length}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-[10px] border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Car size={18} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                    Frota Viaturas
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    {viaturas.length}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-[10px] border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Compass size={18} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                    Total Viagens
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    {motoristas.reduce((acc, curr) => acc + curr.total_viagens, 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu de Tabs */}
            <div className="flex border-b border-slate-100 gap-6">
              <button
                onClick={() => setActiveTab("geral")}
                className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                  activeTab === "geral"
                    ? "border-[#902ad1] text-[#902ad1]"
                    : "border-transparent text-slate-450 hover:text-slate-700"
                }`}
              >
                Geral & Contacto
              </button>
              <button
                onClick={() => setActiveTab("motoristas")}
                className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                  activeTab === "motoristas"
                    ? "border-[#902ad1] text-[#902ad1]"
                    : "border-transparent text-slate-450 hover:text-slate-700"
                }`}
              >
                Motoristas ({motoristas.length})
              </button>
              <button
                onClick={() => setActiveTab("viaturas")}
                className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                  activeTab === "viaturas"
                    ? "border-[#902ad1] text-[#902ad1]"
                    : "border-transparent text-slate-450 hover:text-slate-700"
                }`}
              >
                Frota ({viaturas.length})
              </button>
            </div>

            {/* Conteúdo da Tab */}
            {activeTab === "geral" && (
              <div className="space-y-6">
                {/* Sede e Endereço */}
                <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold uppercase tracking-widest text-[10px] border-b border-slate-50 pb-3">
                    <MapPin size={14} className="text-[#902ad1]" />
                    <span>Sede & Localização</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Província</span>
                      <span className="font-semibold text-slate-700">{parceiro.provincia || "Luanda"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Município</span>
                      <span className="font-semibold text-slate-700">{parceiro.municipio || "---"}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Endereço Completo</span>
                      <span className="font-semibold text-slate-700">{parceiro.endereco || "Não especificado"}</span>
                    </div>
                  </div>
                </div>

                {/* Responsável de Contacto */}
                <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold uppercase tracking-widest text-[10px] border-b border-slate-50 pb-3">
                    <User size={14} className="text-[#902ad1]" />
                    <span>Pessoa de Contacto / Gestor</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Nome Completo</span>
                      <span className="font-semibold text-slate-700">{parceiro.responsavel_nome || "---"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Cargo / Função</span>
                      <span className="font-semibold text-slate-700">{parceiro.responsavel_cargo || "---"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">E-mail Direto</span>
                      <span className="font-semibold text-slate-700 break-all">{parceiro.responsavel_email || "---"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Telefone Direto</span>
                      <span className="font-semibold text-slate-700">{parceiro.responsavel_telefone || "---"}</span>
                    </div>
                  </div>
                </div>

                {/* Notas / Observações Administrativas */}
                <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold uppercase tracking-widest text-[10px] border-b border-slate-50 pb-3">
                    <FileText size={14} className="text-[#902ad1]" />
                    <span>Observações do Administrador</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                    {parceiro.observacoes_admin || "Nenhuma nota administrativa adicionada para este parceiro."}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "motoristas" && (
              <div className="space-y-4">
                {motoristas.length > 0 ? (
                  <div className="bg-white rounded-[10px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
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
                        <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                          {motoristas.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-4">
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
                                    <span className="block">{m.perfis?.nome_completo || "Sem Nome"}</span>
                                    <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">
                                      Exp: {m.experiencia_anos ? `${m.experiencia_anos} anos` : "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="block">{m.perfis?.telefone || "---"}</span>
                                <span className="text-[9px] text-slate-400 font-medium block truncate max-w-[150px]">{m.perfis?.email || "---"}</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-0.5">
                                  <Star size={12} className="text-amber-400 fill-amber-400" />
                                  <span>{m.avaliacao_media.toFixed(1)}</span>
                                  <span className="text-[10px] text-slate-400 font-medium">({m.total_viagens})</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                                  m.disponivel ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                                }`}>
                                  {m.disponivel ? "Livre" : "Ocupado"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Link
                                  href={`/admin/motoristas/${m.id}`}
                                  className="text-[#902ad1] hover:underline font-bold text-[10px]"
                                >
                                  Ver Ficha
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 bg-slate-50 rounded-[10px] border border-slate-100 text-center">
                    <p className="text-xs text-slate-400 font-medium italic">
                      Nenhum motorista associado a este parceiro comercial.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "viaturas" && (
              <div className="space-y-4">
                {viaturas.length > 0 ? (
                  <div className="bg-white rounded-[10px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
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
                        <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                          {viaturas.map((v) => (
                            <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="relative w-10 h-7 bg-slate-50 rounded border border-slate-200 overflow-hidden shrink-0">
                                    {v.foto_url ? (
                                      <Image src={v.foto_url} alt={v.modelo} fill className="object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-350 bg-slate-50">
                                        <Car size={14} />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <span className="block">{v.modelo}</span>
                                    <span className="text-[9px] text-slate-400 font-medium uppercase">{v.marca || "Marca Indefinida"}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded-[10px] text-[8px] font-bold tracking-wider border border-yellow-200 uppercase">
                                  {v.matricula || "S/ MATRÍCULA"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-[10px] text-[8px] font-bold uppercase tracking-wider border border-slate-200">
                                  {v.categorias?.nome || "Económica"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="text-[10px] font-medium text-slate-500">
                                  {v.lugares} Lug. • {v.malas} Malas
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right text-[#902ad1] font-bold">
                                {v.preco_base?.toLocaleString("pt-AO")} Kz
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 bg-slate-50 rounded-[10px] border border-slate-100 text-center">
                    <p className="text-xs text-slate-400 font-medium italic">
                      Nenhuma viatura registada na frota deste parceiro.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50/20 p-6 rounded-[10px] border border-red-100 shadow-sm mt-8 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert size={20} />
              <h4 className="font-semibold uppercase tracking-widest text-[10px]">
                Zona de Perigo (Danger Zone)
              </h4>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-[10px] border border-red-50">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Suspender ou Reativar Parceiro</span>
                <span className="text-[10px] text-slate-400">
                  Bloquear temporariamente o acesso do parceiro ao seu painel e gestão da frota.
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={toggling}
                className={`px-6 py-2.5 rounded-[10px] text-xs font-semibold uppercase tracking-wider transition-all border ${
                  parceiro.ativo
                    ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                {parceiro.ativo ? "Suspender Acesso" : "Reativar Acesso"}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-[10px] border border-red-50">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Eliminar Parceiro Permanente</span>
                <span className="text-[10px] text-slate-400">
                  Apagar permanentemente a empresa e desvincular motoristas e frotas da plataforma.
                </span>
              </div>
              <button
                type="button"
                onClick={handleDelete}
                disabled={toggling}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-[10px] text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                Eliminar Parceiro
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
