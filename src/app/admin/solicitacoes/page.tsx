/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  MapPin,
  Mail,
  Phone,
  Check,
  X,
  FileText,
  ShieldCheck,
  Briefcase,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Search,
  Building,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Info,
  Loader2,
  Globe,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { THEME_TOKENS } from "@/utils/design-system";

/* ─────────────────────────────────────────── types ─── */
interface ParceiroSolicitacao {
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
  responsavel_nome: string | null;
  responsavel_cargo: string | null;
  responsavel_telefone: string | null;
  responsavel_email: string | null;
  status_aprovacao: string | null;
  criado_em: string;
  documentos_urls: any;
  objetivo_parceria?: string | null;
}

interface Toast {
  type: "success" | "error";
  message: string;
}

const REJECTION_PRESETS = [
  "Documento de Identidade Caducado",
  "Imagem do Comprovativo Ilegível / desfocada",
  "NIF Inválido ou Inexistente",
  "Registo Comercial Incompleto",
  "Falta de Comprovativos Obrigatórios",
];

export default function SolicitacoesModeracaoPage() {
  const [requests, setRequests] = useState<ParceiroSolicitacao[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ParceiroSolicitacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  // Document Viewer Zoom, Rotate & Active Index
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [activeDocIndex, setActiveDocIndex] = useState(0);

  // Preset rejection motifs dropdown trigger
  const [showRejectPresets, setShowRejectPresets] = useState(false);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch pending partner requests from real Supabase database
  const fetchSolicitacoes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("parceiros")
        .select("*")
        .eq("status_aprovacao", "pendente")
        .order("criado_em", { ascending: false });

      if (error) throw error;

      const results = data || [];
      setRequests(results);

      // Auto-select first request by default
      if (results.length > 0) {
        setSelectedRequest(results[0]);
      } else {
        setSelectedRequest(null);
      }
    } catch (err) {
      console.error("Erro ao carregar solicitações:", err);
      showToast("error", "Erro ao carregar solicitações da base de dados.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSolicitacoes();
  }, [fetchSolicitacoes]);

  // Robust document URL parser matching mobile logic
  const parseDocumentos = (raw: any): string[] => {
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
  };

  // Filter requests reatively
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      return (
        r.nome.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        (r.responsavel_nome || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.nif || "").toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [requests, search]);

  // SLA Warnings counts (visual metrics based on creation date)
  const stats = useMemo(() => {
    const pendentes = requests.length;
    
    // SLA simulation: creation date older than 1 hour is warning, older than 2 hours is critical
    const critical = requests.filter((r) => {
      const diffMs = new Date().getTime() - new Date(r.criado_em).getTime();
      return diffMs > 2 * 60 * 60 * 1000; // > 2 hours
    }).length;

    return { pendentes, critical };
  }, [requests]);

  // Handle Selection Sync
  const handleSelectRequest = (req: ParceiroSolicitacao) => {
    setSelectedRequest(req);
    setZoomLevel(100);
    setRotationAngle(0);
    setActiveDocIndex(0);
    setShowRejectPresets(false);
  };

  // Handle Approve Action in real Database
  const handleApprove = async (id: string) => {
    if (!confirm("Tem a certeza que deseja APROVAR este parceiro? O acesso será concedido na hora.")) {
      return;
    }

    setProcessing(true);
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

      showToast("success", `Parceiro aprovado e ativado com sucesso!`);
      
      // Update local state dynamically
      setRequests((prev) => {
        const remaining = prev.filter((r) => r.id !== id);
        setSelectedRequest(remaining.length > 0 ? remaining[0] : null);
        return remaining;
      });
    } catch (err: any) {
      console.error("Erro na aprovação:", err);
      showToast("error", err.message || "Falha ao aprovar o parceiro.");
    } finally {
      setProcessing(false);
    }
  };

  // Handle Reject Action in real Database
  const handleReject = async (id: string, reason: string) => {
    setProcessing(true);
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

      showToast("error", `Solicitação rejeitada. Motivo: "${reason}".`);
      
      // Update local state dynamically
      setRequests((prev) => {
        const remaining = prev.filter((r) => r.id !== id);
        setSelectedRequest(remaining.length > 0 ? remaining[0] : null);
        return remaining;
      });
      setShowRejectPresets(false);
    } catch (err: any) {
      console.error("Erro na rejeição:", err);
      showToast("error", err.message || "Falha ao rejeitar solicitação.");
    } finally {
      setProcessing(false);
    }
  };

  // Keyboard hotkey listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedRequest || processing) return;

      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        return;
      }

      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        handleApprove(selectedRequest.id);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        setShowRejectPresets((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRequest, processing]);

  // Format creation time
  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = new Date().getTime() - new Date(dateStr).getTime();
      const diffMins = Math.max(1, Math.floor(diffMs / 60000));
      if (diffMins < 60) return `há ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `há ${diffHours}h`;
      return new Date(dateStr).toLocaleDateString("pt-PT");
    } catch {
      return "—";
    }
  };

  // Check if URL is image
  const isImage = (url: string) => {
    return /\.(png|jpg|jpeg|webp|gif)/i.test(url) || url.includes("images") || url.startsWith("data:image");
  };

  const currentDocs = selectedRequest ? parseDocumentos(selectedRequest.documentos_urls) : [];
  const activeDocUrl = currentDocs.length > 0 ? currentDocs[activeDocIndex] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-4 font-sans h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            <Link href="/admin/dashboard" className="hover:text-[#902ad1] transition-all">
              Painel
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Serviços</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Solicitações de Parceiros</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
            Moderação de Parceiros
          </h1>
        </div>

        {/* Dynamic counters */}
        <div className="flex gap-3">
          <div className="bg-white px-4 py-2 border border-slate-100/90 rounded-[5px] shadow-sm flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#902ad1] animate-pulse" />
            <div className="text-[10px] font-semibold text-slate-500 leading-none">
              <span className="font-bold text-slate-750 block">{stats.pendentes} Pendentes</span>
              <span className="text-[9px] text-slate-400">Total na fila</span>
            </div>
          </div>
          
          <div className="bg-white px-4 py-2 border border-slate-100/90 rounded-[5px] shadow-sm flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <div className="text-[10px] font-semibold text-slate-500 leading-none">
              <span className="font-bold text-rose-600 block">{stats.critical} Críticos</span>
              <span className="text-[9px] text-slate-400">Registados &gt; 2h</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Alert (Toast) ── */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-[13px] font-semibold border animate-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-600 border-rose-200"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Main Split View ── */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0 items-stretch">
        
        {/* COLUNA ESQUERDA: Triagem / Lista (35% de largura) */}
        <div className="w-[35%] flex flex-col gap-4 min-h-0 bg-white border border-slate-100/90 shadow-sm rounded-[5px] p-4">
          
          <div className="space-y-3 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar empresa, NIF ou responsável..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-[5px] text-xs font-semibold text-slate-750 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#902ad1]/80 focus:ring-2 focus:ring-[#902ad1]/5 transition-all"
              />
            </div>

            <div className="px-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-left">
              Fila de Triagem Ativa
            </div>
          </div>

          {/* List items (Scrollable) */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar min-h-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-[#902ad1] animate-spin" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">A carregar registos...</span>
              </div>
            ) : filteredRequests.map((req) => {
              const isSelected = selectedRequest?.id === req.id;
              const hasDocs = parseDocumentos(req.documentos_urls).length > 0;

              return (
                <div
                  key={req.id}
                  onClick={() => handleSelectRequest(req)}
                  className={`p-4 border rounded-[5px] transition-all cursor-pointer text-left relative flex flex-col justify-between min-h-[110px] ${
                    isSelected
                      ? "bg-[#902ad1]/8 border-[#902ad1]/30 shadow-sm"
                      : "bg-white border-slate-100 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-800 tracking-tight truncate leading-snug">
                        {req.nome}
                      </h3>
                      {req.responsavel_nome && (
                        <p className="text-[9.5px] text-slate-500 font-semibold truncate mt-0.5">
                          Resp: {req.responsavel_nome}
                        </p>
                      )}
                      {req.nif && (
                        <p className="text-[9px] font-bold font-mono text-[#902ad1] mt-1 block">
                          NIF: {req.nif}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {hasDocs ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase bg-emerald-500/8 text-emerald-700 border border-emerald-500/10">
                          Com Anexos
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase bg-slate-100 text-slate-450">
                          Sem Anexos
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-2 border-t border-slate-100/50">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Clock size={10} />
                      {formatTimeAgo(req.criado_em)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                      {req.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              );
            })}

            {!loading && filteredRequests.length === 0 && (
              <div className="py-16 text-center text-slate-400 text-xs font-semibold">
                Nenhuma solicitação pendente encontrada.
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: Decision Viewport (65% de largura) */}
        <div className="w-[65%] min-h-0 bg-white border border-slate-100/90 shadow-sm rounded-[5px] p-6 flex flex-col justify-between">
          
          {selectedRequest ? (
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Header inside right panel */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-[#902ad1] bg-[#902ad1]/8 px-2.5 py-0.5 rounded border border-[#902ad1]/15">
                      ID: {selectedRequest.id.slice(0, 8)}...
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/8 text-[#902ad1] border border-[#902ad1]/10">
                      <Building size={9} />
                      Solicitação de Parceiro
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-800 tracking-tight mt-2.5">
                    Análise Cadastral: {selectedRequest.nome}
                  </h2>
                </div>

                <div className="text-right">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Data de Entrada</span>
                  <span className="text-xs font-semibold text-slate-700 block mt-1">
                    {new Date(selectedRequest.criado_em).toLocaleString("pt-PT")}
                  </span>
                </div>
              </div>

              {/* Viewport Content Splitter */}
              <div className="flex-1 overflow-y-auto py-5 grid grid-cols-1 md:grid-cols-12 gap-5 no-scrollbar min-h-0">
                
                {/* Left Side: Credentials and Audits (5/12 cols) */}
                <div className="md:col-span-5 space-y-4 text-left">
                  
                  {/* Trust Audit */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-[5px] space-y-3">
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <ShieldCheck size={11} className="text-[#902ad1]" />
                      Auditoria cadastral
                    </h4>
                    
                    <div className="space-y-2 text-[10px] font-semibold text-slate-500 leading-normal">
                      <div className="flex items-center gap-2 text-emerald-650">
                        <CheckCircle2 size={11} />
                        <span>Email verificado</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-650">
                        <CheckCircle2 size={11} />
                        <span>Contacto móvel validado</span>
                      </div>
                    </div>
                  </div>

                  {/* Fields data */}
                  <div className="space-y-3.5 pr-2">
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Ficha da Empresa
                    </h4>

                    {selectedRequest.nif && (
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">NIF Oficial</span>
                        <span className="text-xs font-mono font-bold text-slate-700 block mt-0.5">{selectedRequest.nif}</span>
                      </div>
                    )}

                    {selectedRequest.responsavel_nome && (
                      <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-[5px] space-y-2 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Responsável Oficial</span>
                          <span className="font-bold text-slate-750 block mt-0.5">
                            {selectedRequest.responsavel_nome} {selectedRequest.responsavel_cargo ? `(${selectedRequest.responsavel_cargo})` : ""}
                          </span>
                        </div>
                        {selectedRequest.responsavel_email && (
                          <div className="flex items-center gap-1.5 text-slate-500 mt-1.5">
                            <Mail size={11} className="text-slate-400 shrink-0" />
                            <span className="truncate">{selectedRequest.responsavel_email}</span>
                          </div>
                        )}
                        {selectedRequest.responsavel_telefone && (
                          <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                            <Phone size={11} className="text-slate-400 shrink-0" />
                            <span>{selectedRequest.responsavel_telefone}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 text-xs font-semibold text-slate-655">
                      <div className="flex items-center gap-2.5">
                        <Mail size={13} className="text-[#902ad1] shrink-0" />
                        <span className="truncate">{selectedRequest.email || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Phone size={13} className="text-[#902ad1] shrink-0" />
                        <span>{selectedRequest.telefone || "—"}</span>
                      </div>
                      {selectedRequest.website && (
                        <div className="flex items-center gap-2.5">
                          <Globe size={13} className="text-[#902ad1] shrink-0" />
                          <span className="truncate text-[#902ad1]">{selectedRequest.website}</span>
                        </div>
                      )}
                      {selectedRequest.provincia && (
                        <div className="flex items-center gap-2.5">
                          <MapPin size={13} className="text-[#902ad1] shrink-0" />
                          <span>{selectedRequest.provincia}, {selectedRequest.municipio}</span>
                        </div>
                      )}
                    </div>

                    {selectedRequest.area_atividade && (
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Área de Atividade</span>
                        <span className="text-xs font-bold text-slate-700 block mt-0.5">{selectedRequest.area_atividade}</span>
                      </div>
                    )}

                    {selectedRequest.objetivo_parceria && (
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Objetivo</span>
                        <p className="text-[10.5px] font-semibold text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-[5px] border border-slate-100/50 mt-0.5">
                          "{selectedRequest.objetivo_parceria}"
                        </p>
                      </div>
                    )}

                  </div>
                </div>

                {/* Right Side: Document Viewer Viewport (7/12 cols) */}
                <div className="md:col-span-7 flex flex-col gap-3 text-left min-h-[300px]">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Documento Enviado / Comprovativo
                    </h4>

                    {/* Cycle through multiple files if there are more than 1 */}
                    {currentDocs.length > 1 && (
                      <div className="flex gap-1">
                        {currentDocs.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setActiveDocIndex(i);
                              setZoomLevel(100);
                              setRotationAngle(0);
                            }}
                            className={`px-2 py-0.5 rounded text-[8.5px] font-bold border transition-colors cursor-pointer ${
                              activeDocIndex === i
                                ? "bg-[#902ad1] text-white border-[#902ad1]"
                                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            Doc {i + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 bg-slate-900 border border-slate-950/20 rounded-[5px] relative overflow-hidden flex items-center justify-center p-6 shadow-inner min-h-[260px]">
                    {activeDocUrl ? (
                      /* If document is image, render it! */
                      isImage(activeDocUrl) ? (
                        <div
                          style={{
                            transform: `scale(${zoomLevel / 100}) rotate(${rotationAngle}deg)`,
                            transition: "transform 0.15s ease-out",
                          }}
                          className="relative max-h-[340px] max-w-[280px] w-full aspect-[3/4] flex items-center justify-center select-none shrink-0"
                        >
                          <img
                            src={activeDocUrl}
                            alt="Documento Anexado"
                            className="object-contain w-full h-full rounded shadow-2xl"
                          />
                        </div>
                      ) : (
                        /* Non-image files (PDF or other documents rendered inline via iframe!) */
                        <div className="w-full h-full min-h-[350px] flex flex-col p-1 bg-white rounded">
                          <iframe
                            src={`${activeDocUrl}#toolbar=0&navpanes=0`}
                            className="w-full h-full border-none rounded-[5px] bg-slate-50 flex-1 min-h-[320px]"
                            title="Visualização do Documento"
                          />
                          <div className="mt-2 text-center shrink-0 flex items-center justify-center gap-4">
                            <a
                              href={activeDocUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-[#902ad1] hover:underline flex items-center gap-1"
                            >
                              <ExternalLink size={10} /> Abrir Documento em Nova Aba
                            </a>
                          </div>
                        </div>
                      )
                    ) : (
                      /* Fallback Mock Document if none is uploaded (incorporates NIF/Company details dynamically) */
                      <div
                        style={{
                          transform: `scale(${zoomLevel / 100}) rotate(${rotationAngle}deg)`,
                          transition: "transform 0.15s ease-out",
                        }}
                        className="w-full max-w-[200px] h-[260px] bg-slate-100/95 border-2 border-slate-300 rounded shadow-2xl relative flex flex-col justify-between p-4 text-slate-400 select-none shrink-0"
                      >
                        <div className="flex justify-between items-start">
                          <div className="w-10 h-1 bg-slate-300 rounded" />
                          <ShieldCheck size={28} className="text-[#902ad1] opacity-45 shrink-0" />
                        </div>
                        
                        <div className="space-y-4 my-auto text-center px-1">
                          <Building size={36} className="text-[#902ad1] opacity-30 mx-auto" />
                          <div className="space-y-1">
                            <p className="text-[8px] font-extrabold text-[#902ad1]/60 uppercase tracking-wider block">
                              Registo WiTransfer
                            </p>
                            <p className="text-[9.5px] font-extrabold text-slate-750 truncate max-w-[170px] mx-auto block leading-tight">
                              {selectedRequest.nome}
                            </p>
                            <p className="text-[7.5px] font-bold font-mono text-slate-500 mt-1 block">
                              NIF: {selectedRequest.nif || "S/N"}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-end border-t border-slate-200 pt-2 text-[6.5px] font-bold uppercase tracking-widest text-slate-350">
                          <span>WiTransfer Audit</span>
                          <span>Mockup</span>
                        </div>
                      </div>
                    )}

                    {/* Viewport Control Tools Overlay */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-slate-950/85 backdrop-blur-sm border border-white/10 rounded-[5px] p-1 shadow-2xl z-10 shrink-0">
                      <button
                        onClick={() => setZoomLevel((z) => Math.max(50, z - 20))}
                        className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded transition-all active:scale-90"
                        title="Zoom Out"
                      >
                        <ZoomOut size={13} />
                      </button>
                      <span className="text-[9.5px] font-bold text-white/90 px-1.5 select-none font-mono">
                        {zoomLevel}%
                      </span>
                      <button
                        onClick={() => setZoomLevel((z) => Math.min(200, z + 20))}
                        className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded transition-all active:scale-90"
                        title="Zoom In"
                      >
                        <ZoomIn size={13} />
                      </button>
                      <div className="h-4 w-[1px] bg-white/10 mx-1" />
                      <button
                        onClick={() => setRotationAngle((r) => (r + 90) % 360)}
                        className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded transition-all active:scale-90"
                        title="Rodar Documento"
                      >
                        <RotateCw size={12} />
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons Panel inside Detail Viewport */}
              <div className="border-t border-slate-100 pt-4 flex justify-between items-center relative shrink-0">
                
                {/* Keyboard hotkey hint bubble */}
                <div className="hidden md:flex items-center gap-2 text-[10.5px] font-semibold text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#902ad1] animate-pulse" />
                  <span>Teclado: Pressione</span>
                  <span className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-bold font-mono text-[9px] text-slate-500 shadow-sm">
                    A
                  </span>
                  <span>Aprovar</span>
                  <span className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-bold font-mono text-[9px] text-slate-500 shadow-sm">
                    R
                  </span>
                  <span>Rejeitar</span>
                </div>

                <div className="flex gap-3 ml-auto relative">
                  
                  {/* Reject button with Motif dropdown presets */}
                  <div className="relative">
                    <button
                      onClick={() => setShowRejectPresets((prev) => !prev)}
                      disabled={processing}
                      className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-650 border border-rose-100 hover:border-rose-650 rounded-[5px] transition-all flex items-center gap-1.5 active:scale-97 cursor-pointer disabled:opacity-50"
                    >
                      <X size={14} strokeWidth={2.5} />
                      <span>Rejeitar (R)</span>
                    </button>

                    {/* Canned Presets Dropdown */}
                    {showRejectPresets && (
                      <div className="absolute right-0 bottom-full mb-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-150 py-2.5 z-40 animate-in fade-in slide-in-from-bottom-2 duration-200 text-left">
                        <div className="px-3 pb-2 border-b border-slate-50">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Motivo de Exclusão Rápida
                          </p>
                        </div>
                        
                        <div className="max-h-56 overflow-y-auto no-scrollbar py-1">
                          {REJECTION_PRESETS.map((reason, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleReject(selectedRequest.id, reason)}
                              className="w-full text-left px-3.5 py-2 text-[11px] font-semibold text-slate-650 hover:bg-rose-50 hover:text-rose-700 transition-colors block border-none bg-transparent cursor-pointer"
                            >
                              {reason}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Approve button */}
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={processing}
                    className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-white bg-[#902ad1] hover:bg-[#7a22b3] rounded-[5px] transition-all flex items-center gap-1.5 active:scale-97 cursor-pointer shadow-md shadow-[#902ad1]/15 disabled:opacity-75"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check size={14} strokeWidth={2.5} />
                        <span>Aprovar Parceiro (A)</span>
                      </>
                    )}
                  </button>

                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
              <ShieldCheck size={48} className="text-slate-200 animate-pulse mb-3" />
              <p className="text-sm font-semibold">Sem solicitações ativas na fila</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs font-medium">
                Excelente trabalho! Todos os registos pendentes de parceiros comerciais foram analisados.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
