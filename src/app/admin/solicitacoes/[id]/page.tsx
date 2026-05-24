/** @format */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
  Briefcase,
  FileText,
  Check,
  X,
  Loader2,
  ExternalLink,
  Download,
  AlertTriangle,
  Award,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SolicitacaoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [parceiro, setParceiro] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchParceiro = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("parceiros")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setParceiro(data);
    } catch (err: any) {
      console.error("Erro ao carregar detalhes do parceiro:", err);
      setErrorMessage("Não foi possível carregar os detalhes desta solicitação.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchParceiro();
  }, [fetchParceiro]);

  // Robust document URL parser matching mobile logic
  const documentos: string[] = React.useMemo(() => {
    if (!parceiro) return [];
    const raw = parceiro.documentos_urls;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
        if (parsed && typeof parsed === "object") {
          return Object.values(parsed).filter((v) => typeof v === "string") as string[];
        }
      } catch {
        return [raw];
      }
    }
    if (typeof raw === "object") {
      return Object.values(raw).filter((v) => typeof v === "string") as string[];
    }
    return [];
  }, [parceiro]);

  const handleApprove = async () => {
    if (!confirm("Tem a certeza que deseja APROVAR este parceiro? O acesso ao sistema será concedido imediatamente.")) {
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Update status_aprovacao and active status in parceiros table
      const { error: pErr } = await supabase
        .from("parceiros")
        .update({
          status_aprovacao: "aprovado",
          ativo: true,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", id);

      if (pErr) throw pErr;

      // 2. Activate user profile in perfis table
      const { error: uErr } = await supabase
        .from("perfis")
        .update({ ativo: true })
        .eq("id", id);

      if (uErr) throw uErr;

      alert("Parceiro aprovado com sucesso! O registo foi concluído.");
      router.push("/admin/solicitacoes");
    } catch (err: any) {
      console.error("Erro na aprovação:", err);
      setErrorMessage(err.message || "Falha ao aprovar o parceiro.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Tem a certeza que deseja REJEITAR esta solicitação de registo?")) {
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase
        .from("parceiros")
        .update({
          status_aprovacao: "rejeitado",
          ativo: false,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      alert("Solicitação rejeitada com sucesso.");
      router.push("/admin/solicitacoes");
    } catch (err: any) {
      console.error("Erro na rejeição:", err);
      setErrorMessage(err.message || "Falha ao rejeitar a solicitação.");
    } finally {
      setProcessing(false);
    }
  };

  const isImage = (url: string) => {
    return /\.(png|jpg|jpeg|webp|gif)/i.test(url) || url.includes("images") || url.startsWith("data:image");
  };

  const getIniciais = (name: string) => {
    if (!name) return "P";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#902ad1]" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">A carregar detalhes...</span>
      </div>
    );
  }

  if (errorMessage && !parceiro) {
    return (
      <div className="bg-white p-8 rounded-[10px] border border-slate-100 shadow-sm max-w-md mx-auto text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Falha na leitura</h3>
        <p className="text-slate-500 text-sm font-medium">{errorMessage}</p>
        <Link
          href="/admin/solicitacoes"
          className="inline-flex items-center justify-center gap-2 bg-[#902ad1] text-white px-6 py-2.5 rounded-[10px] font-semibold text-xs uppercase tracking-wider transition-all"
        >
          <ArrowLeft size={14} />
          <span>Voltar às solicitações</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 bg-white border border-slate-100 text-slate-400 hover:text-[#902ad1] hover:border-[#902ad1]/20 rounded-[10px] shadow-sm flex items-center justify-center transition-all active:scale-95 shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            <Link href="/admin/dashboard" className="hover:text-[#902ad1] transition-all">
              Painel
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/admin/solicitacoes" className="hover:text-[#902ad1] transition-all">
              Solicitações
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Detalhes</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight mt-0.5">
            Análise de Registo de Parceiro
          </h1>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-[10px] text-rose-700 text-xs font-semibold flex items-center gap-2.5">
          <AlertTriangle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Columns - Details (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Hero Profile */}
          <div className="bg-white rounded-[10px] border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="w-16 h-16 rounded-[10px] bg-[#902ad1]/5 border border-[#902ad1]/10 flex items-center justify-center text-[#902ad1] font-bold text-xl shrink-0 shadow-inner">
              {getIniciais(parceiro.nome)}
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">{parceiro.nome}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-slate-400 font-semibold">
                <span className="bg-slate-100 px-2 py-0.5 rounded-[6px] text-[10px] text-slate-500 uppercase">
                  NIF: {parceiro.nif || "N/A"}
                </span>
                <span className="bg-amber-55/65 text-amber-700 border border-amber-500/15 px-2 py-0.5 rounded-[6px] text-[9px] uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-550 shrink-0" />
                  Aprovação Pendente
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium pt-1">
                Solicitado em: {new Date(parceiro.criado_em).toLocaleString("pt-PT")}
              </p>
            </div>
          </div>

          {/* Section: Enterprise Data */}
          <div className="bg-white rounded-[10px] border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
              <Building2 className="w-4 h-4 text-[#902ad1]" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Dados Corporativos</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Telefone</span>
                <span className="text-sm font-semibold text-slate-700 block">{parceiro.telefone || "—"}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">E-mail Corporativo</span>
                <span className="text-sm font-semibold text-slate-700 block">{parceiro.email || "—"}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Website Oficial</span>
                <span className="text-sm font-semibold text-[#902ad1] hover:underline flex items-center gap-1">
                  {parceiro.website ? (
                    <a href={parceiro.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                      <span>{parceiro.website}</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-slate-700">—</span>
                  )}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Localização Completa</span>
                <span className="text-sm font-semibold text-slate-700 block">
                  {parceiro.provincia} / {parceiro.municipio}
                </span>
              </div>
            </div>

            <div className="space-y-0.5 pt-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Endereço Físico</span>
              <span className="text-sm font-medium text-slate-600 block bg-slate-50 p-3 rounded-[10px] border border-slate-100/50">
                {parceiro.endereco || "Não informado"}
              </span>
            </div>
          </div>

          {/* Section: Activity & Purpose */}
          <div className="bg-white rounded-[10px] border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
              <Award className="w-4 h-4 text-[#902ad1]" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Atividade & Finalidade</h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Área de Atividade Comercial</span>
                <span className="text-sm font-semibold text-slate-750 block">{parceiro.area_atividade || "—"}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Objetivo com a Parceria</span>
                <span className="text-sm font-medium text-slate-650 block bg-slate-50 p-3 rounded-[10px] border border-slate-100/50 leading-relaxed">
                  {parceiro.objetivo_parceria || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Responsible Person */}
          <div className="bg-white rounded-[10px] border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
              <User className="w-4 h-4 text-[#902ad1]" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pessoa de Contacto Responsável</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Nome do Responsável</span>
                <span className="text-sm font-semibold text-slate-700 block">{parceiro.responsavel_nome || "—"}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Cargo / Função</span>
                <span className="text-sm font-semibold text-slate-700 block">{parceiro.responsavel_cargo || "—"}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Telefone Directo</span>
                <span className="text-sm font-semibold text-slate-700 block">{parceiro.responsavel_telefone || "—"}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">E-mail Pessoal</span>
                <span className="text-sm font-semibold text-slate-700 block">{parceiro.responsavel_email || "—"}</span>
              </div>
            </div>
          </div>

          {/* Section: Documents / Attachments */}
          <div className="bg-white rounded-[10px] border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
              <FileText className="w-4 h-4 text-[#902ad1]" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Documentação Enviada</h3>
            </div>

            {documentos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documentos.map((doc, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-50 rounded-[10px] border border-slate-100 flex flex-col justify-between space-y-3 hover:shadow-md hover:bg-white hover:border-[#902ad1]/15 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-[10px] bg-slate-100 flex items-center justify-center shrink-0">
                        <FileText size={18} className="text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">Anexo {index + 1}</span>
                        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest block truncate">
                          Ficheiro de Validação
                        </span>
                      </div>
                    </div>

                    {isImage(doc) ? (
                      <div className="relative w-full aspect-video rounded-[10px] overflow-hidden border border-slate-150 group">
                        <img src={doc} alt={`Documento ${index + 1}`} className="object-cover w-full h-full" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all gap-2">
                          <a
                            href={doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-white text-slate-800 rounded-full hover:bg-slate-100"
                            title="Ver em tamanho completo"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-100 rounded-[10px] text-center text-xs font-medium text-slate-400 flex items-center justify-center">
                        Ficheiro não imprimível (PDF ou outro)
                      </div>
                    )}

                    <a
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 hover:border-[#902ad1] hover:bg-white text-slate-600 hover:text-[#902ad1] rounded-[10px] text-[10px] font-bold uppercase tracking-wider transition-all"
                    >
                      <Download size={12} />
                      <span>Abrir / Descarregar</span>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-[10px] text-xs font-medium text-slate-400 border border-slate-100">
                Nenhum ficheiro ou comprovativo foi anexado a este registo.
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Actions Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-[10px] border border-slate-100 shadow-sm p-6 space-y-5 sticky top-24 hover:shadow-md hover:border-[#902ad1]/10 transition-all duration-300">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-50">
              Decisão de Auditoria
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Analise atentamente os dados cadastrais e documentos fornecidos pela empresa. A aprovação dará permissão imediata de acesso à plataforma WiTransfer para gestão de frotas e motoristas.
            </p>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleApprove}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 bg-[#902ad1] hover:bg-[#7a22b3] text-white py-3.5 rounded-[10px] text-xs font-bold uppercase tracking-widest transition-all shadow-md shadow-[#902ad1]/15 active:scale-97 hover:scale-[1.01] duration-200 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    <Check size={16} strokeWidth={2.5} />
                    <span>Aprovar Parceiro</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReject}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-rose-50 border-2 border-rose-200 hover:border-rose-300 text-rose-600 py-3 rounded-[10px] text-xs font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <Loader2 size={15} className="animate-spin text-rose-500" />
                ) : (
                  <>
                    <X size={16} strokeWidth={2.5} />
                    <span>Rejeitar Registo</span>
                  </>
                )}
              </button>
            </div>

            <div className="h-[1px] bg-slate-50" />
            <Link
              href="/admin/solicitacoes"
              className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#902ad1] transition-all py-1"
            >
              <ArrowLeft size={12} />
              <span>Voltar à Listagem</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
