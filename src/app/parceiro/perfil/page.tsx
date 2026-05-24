/** @format */

"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  User,
  BadgeCheck,
  AlertCircle,
  Pencil,
  Save,
  X,
  Loader2,
  Percent,
  CalendarDays,
  CheckCircle2,
  XCircle,
  IdCard,
  UserCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ─────────────────────────────────────────── types ─── */
interface Parceiro {
  id: string;
  nome: string;
  logo_url?: string | null;
  email?: string | null;
  telefone?: string | null;
  website?: string | null;
  nif?: string | null;
  area_atividade?: string | null;
  provincia?: string | null;
  municipio?: string | null;
  endereco?: string | null;
  comissao_percentual?: number | null;
  status_aprovacao?: string | null;
  ativo?: boolean | null;
  criado_em?: string | null;
  responsavel_nome?: string | null;
  responsavel_email?: string | null;
  responsavel_telefone?: string | null;
  responsavel_cargo?: string | null;
}

interface Perfil {
  nome_completo?: string | null;
  email?: string | null;
  telefone?: string | null;
  foto_url?: string | null;
}

interface Toast {
  type: "success" | "error";
  message: string;
}

/* ─────────────────────────────────────────── helpers ─── */
function statusBadge(status?: string | null) {
  const map: Record<string, { label: string; color: string }> = {
    aprovado: { label: "Aprovado", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    pendente: { label: "Pendente", color: "bg-amber-100 text-amber-700 border-amber-200" },
    rejeitado: { label: "Rejeitado", color: "bg-rose-100 text-rose-700 border-rose-200" },
  };
  const s = map[status || ""] || { label: "Desconhecido", color: "bg-slate-100 text-slate-500 border-slate-200" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${s.color}`}>
      {status === "aprovado" ? <BadgeCheck size={12} /> : status === "rejeitado" ? <AlertCircle size={12} /> : null}
      {s.label}
    </span>
  );
}

function SectionCard({ title, icon, children, className = "" }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-6 ${className}`}>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-xl bg-[#902ad1]/10 flex items-center justify-center text-[#902ad1] shrink-0">
          {icon}
        </div>
        <h2 className="text-[14px] font-semibold text-slate-700">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-[14px] font-semibold text-slate-700">{value || "—"}</p>
    </div>
  );
}

function InputField({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#902ad1]/30 focus:border-[#902ad1] transition-all placeholder:text-slate-300"
      />
    </div>
  );
}

/* ─────────────────────────────────────────── page ─── */
export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [parceiro, setParceiro] = useState<Parceiro | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  /* edit states */
  const [editEmpresa, setEditEmpresa] = useState(false);
  const [editResponsavel, setEditResponsavel] = useState(false);
  const [editLocalizacao, setEditLocalizacao] = useState(false);
  const [saving, setSaving] = useState(false);

  /* form data */
  const [formEmpresa, setFormEmpresa] = useState({
    nome: "", email: "", telefone: "", website: "", area_atividade: "",
  });
  const [formResponsavel, setFormResponsavel] = useState({
    responsavel_nome: "", responsavel_cargo: "", responsavel_email: "", responsavel_telefone: "",
  });
  const [formLocalizacao, setFormLocalizacao] = useState({
    endereco: "",
  });

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: parceiroData } = await supabase
        .from("parceiros")
        .select(
          "id, nome, logo_url, email, telefone, website, nif, area_atividade, provincia, municipio, endereco, comissao_percentual, status_aprovacao, ativo, criado_em, responsavel_nome, responsavel_email, responsavel_telefone, responsavel_cargo"
        )
        .eq("usuario_id", user.id)
        .single();

      const { data: perfilData } = await supabase
        .from("perfis")
        .select("nome_completo, email, telefone, foto_url")
        .eq("id", user.id)
        .single();

      if (parceiroData) {
        setParceiro(parceiroData);
        setFormEmpresa({
          nome: parceiroData.nome || "",
          email: parceiroData.email || "",
          telefone: parceiroData.telefone || "",
          website: parceiroData.website || "",
          area_atividade: parceiroData.area_atividade || "",
        });
        setFormResponsavel({
          responsavel_nome: parceiroData.responsavel_nome || "",
          responsavel_cargo: parceiroData.responsavel_cargo || "",
          responsavel_email: parceiroData.responsavel_email || "",
          responsavel_telefone: parceiroData.responsavel_telefone || "",
        });
        setFormLocalizacao({ endereco: parceiroData.endereco || "" });
      }
      if (perfilData) setPerfil(perfilData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveEmpresa = async () => {
    if (!parceiro) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("parceiros")
        .update({
          nome: formEmpresa.nome,
          email: formEmpresa.email,
          telefone: formEmpresa.telefone,
          website: formEmpresa.website,
          area_atividade: formEmpresa.area_atividade,
        })
        .eq("id", parceiro.id);
      if (error) throw error;
      setParceiro((p) => p ? { ...p, ...formEmpresa } : p);
      setEditEmpresa(false);
      showToast("success", "Informações empresariais atualizadas!");
    } catch {
      showToast("error", "Erro ao guardar alterações.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveResponsavel = async () => {
    if (!parceiro) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("parceiros")
        .update({
          responsavel_nome: formResponsavel.responsavel_nome,
          responsavel_cargo: formResponsavel.responsavel_cargo,
          responsavel_email: formResponsavel.responsavel_email,
          responsavel_telefone: formResponsavel.responsavel_telefone,
        })
        .eq("id", parceiro.id);
      if (error) throw error;
      setParceiro((p) => p ? { ...p, ...formResponsavel } : p);
      setEditResponsavel(false);
      showToast("success", "Dados do responsável atualizados!");
    } catch {
      showToast("error", "Erro ao guardar alterações.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLocalizacao = async () => {
    if (!parceiro) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("parceiros")
        .update({ endereco: formLocalizacao.endereco })
        .eq("id", parceiro.id);
      if (error) throw error;
      setParceiro((p) => p ? { ...p, ...formLocalizacao } : p);
      setEditLocalizacao(false);
      showToast("success", "Localização atualizada!");
    } catch {
      showToast("error", "Erro ao guardar alterações.");
    } finally {
      setSaving(false);
    }
  };

  /* ── loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#902ad1]" />
          <p className="text-[13px] font-semibold text-slate-400">A carregar perfil...</p>
        </div>
      </div>
    );
  }

  const criado = parceiro?.criado_em
    ? new Date(parceiro.criado_em).toLocaleDateString("pt-PT", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-800 tracking-tight">Perfil do Parceiro</h1>
          <p className="text-[13px] text-slate-400 font-semibold mt-0.5">Gerir informações da empresa e conta</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          {statusBadge(parceiro?.status_aprovacao)}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${parceiro?.ativo ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
            {parceiro?.ativo ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {parceiro?.ativo ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-[13px] font-semibold border animate-in slide-in-from-top-2 ${
          toast.type === "success"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-rose-50 text-rose-600 border-rose-200"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-12 gap-5">

        {/* ── Card 1: Identidade (4 cols) ── */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-gradient-to-br from-[#902ad1] to-[#6d14b0] rounded-2xl p-6 shadow-[0_8px_32px_rgba(144,42,209,0.3)] text-white h-full">
            {/* Logo */}
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg bg-white/10 flex items-center justify-center">
                {parceiro?.logo_url ? (
                  <Image
                    src={parceiro.logo_url}
                    alt={parceiro.nome}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Building2 size={32} className="text-white/70" />
                )}
              </div>

              <div>
                <h2 className="text-[18px] font-semibold tracking-tight leading-tight">{parceiro?.nome || "—"}</h2>
                {parceiro?.area_atividade && (
                  <p className="text-[12px] text-white/70 font-semibold mt-1">{parceiro.area_atividade}</p>
                )}
              </div>

              {/* Badges mobile */}
              <div className="flex flex-wrap justify-center gap-2 sm:hidden">
                {statusBadge(parceiro?.status_aprovacao)}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${parceiro?.ativo ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-white/10 text-white/60 border-white/20"}`}>
                  {parceiro?.ativo ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  {parceiro?.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/15 my-5" />

            {/* Stats */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Percent size={14} className="text-white/80" />
                </div>
                <div>
                  <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider">Comissão</p>
                  <p className="text-[14px] font-semibold text-white">
                    {parceiro?.comissao_percentual != null ? `${parceiro.comissao_percentual}%` : "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <CalendarDays size={14} className="text-white/80" />
                </div>
                <div>
                  <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider">Membro desde</p>
                  <p className="text-[14px] font-semibold text-white">{criado}</p>
                </div>
              </div>

              {parceiro?.nif && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <IdCard size={14} className="text-white/80" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider">NIF</p>
                    <p className="text-[14px] font-semibold text-white">{parceiro.nif}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Foto pessoal */}
            {(perfil?.foto_url || perfil?.nome_completo) && (
              <>
                <div className="h-px bg-white/15 my-5" />
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                    {perfil?.foto_url ? (
                      <Image src={perfil.foto_url} alt="Perfil" width={36} height={36} className="object-cover w-full h-full" />
                    ) : (
                      <UserCircle size={16} className="text-white/70" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wider">Utilizador</p>
                    <p className="text-[13px] font-semibold text-white">{perfil?.nome_completo || "—"}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Card 2: Informações Empresariais (8 cols) ── */}
        <div className="col-span-12 lg:col-span-8">
          <SectionCard title="Informações Empresariais" icon={<Building2 size={16} />} className="h-full">
            <div className="flex items-center justify-between mb-5 -mt-1">
              <p className="text-[12px] text-slate-400 font-semibold">Nome, contactos e área de negócio</p>
              {!editEmpresa ? (
                <button
                  onClick={() => setEditEmpresa(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#902ad1]/10 text-[#902ad1] text-[12px] font-semibold hover:bg-[#902ad1]/20 transition-all"
                >
                  <Pencil size={12} /> Editar
                </button>
              ) : (
                <button
                  onClick={() => { setEditEmpresa(false); setFormEmpresa({ nome: parceiro?.nome || "", email: parceiro?.email || "", telefone: parceiro?.telefone || "", website: parceiro?.website || "", area_atividade: parceiro?.area_atividade || "" }); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-[12px] font-semibold hover:bg-slate-200 transition-all"
                >
                  <X size={12} /> Cancelar
                </button>
              )}
            </div>

            {editEmpresa ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Nome da empresa" value={formEmpresa.nome} onChange={(v) => setFormEmpresa((f) => ({ ...f, nome: v }))} placeholder="Nome da empresa" />
                  <InputField label="Email" value={formEmpresa.email} onChange={(v) => setFormEmpresa((f) => ({ ...f, email: v }))} placeholder="email@empresa.com" type="email" />
                  <InputField label="Telefone" value={formEmpresa.telefone} onChange={(v) => setFormEmpresa((f) => ({ ...f, telefone: v }))} placeholder="+244 9XX XXX XXX" />
                  <InputField label="Website" value={formEmpresa.website} onChange={(v) => setFormEmpresa((f) => ({ ...f, website: v }))} placeholder="https://empresa.co.ao" type="url" />
                </div>
                <InputField label="Área de atividade" value={formEmpresa.area_atividade} onChange={(v) => setFormEmpresa((f) => ({ ...f, area_atividade: v }))} placeholder="Ex: Transporte, Turismo, Logística..." />

                <button
                  onClick={handleSaveEmpresa}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#902ad1] text-white text-[13px] font-semibold shadow-[0_4px_14px_rgba(144,42,209,0.3)] hover:bg-[#7a23b2] transition-all disabled:opacity-60"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Guardar Alterações
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 size={14} className="text-slate-500" />
                  </div>
                  <Field label="Nome da empresa" value={parceiro?.nome} />
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail size={14} className="text-slate-500" />
                  </div>
                  <Field label="Email" value={parceiro?.email} />
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone size={14} className="text-slate-500" />
                  </div>
                  <Field label="Telefone" value={parceiro?.telefone} />
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Globe size={14} className="text-slate-500" />
                  </div>
                  <Field label="Website" value={parceiro?.website} />
                </div>
                <div className="flex items-start gap-3 sm:col-span-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Briefcase size={14} className="text-slate-500" />
                  </div>
                  <Field label="Área de atividade" value={parceiro?.area_atividade} />
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Card 3: Responsável (12 cols) ── */}
        <div className="col-span-12">
          <SectionCard title="Dados do Responsável" icon={<User size={16} />}>
            <div className="flex items-center justify-between mb-5 -mt-1">
              <p className="text-[12px] text-slate-400 font-semibold">Pessoa de contacto principal da empresa</p>
              {!editResponsavel ? (
                <button
                  onClick={() => setEditResponsavel(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#902ad1]/10 text-[#902ad1] text-[12px] font-semibold hover:bg-[#902ad1]/20 transition-all"
                >
                  <Pencil size={12} /> Editar
                </button>
              ) : (
                <button
                  onClick={() => { setEditResponsavel(false); setFormResponsavel({ responsavel_nome: parceiro?.responsavel_nome || "", responsavel_cargo: parceiro?.responsavel_cargo || "", responsavel_email: parceiro?.responsavel_email || "", responsavel_telefone: parceiro?.responsavel_telefone || "" }); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-[12px] font-semibold hover:bg-slate-200 transition-all"
                >
                  <X size={12} /> Cancelar
                </button>
              )}
            </div>

            {editResponsavel ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <InputField label="Nome completo" value={formResponsavel.responsavel_nome} onChange={(v) => setFormResponsavel((f) => ({ ...f, responsavel_nome: v }))} placeholder="Nome do responsável" />
                  <InputField label="Cargo" value={formResponsavel.responsavel_cargo} onChange={(v) => setFormResponsavel((f) => ({ ...f, responsavel_cargo: v }))} placeholder="Ex: Diretor, Gestor..." />
                  <InputField label="Email direto" value={formResponsavel.responsavel_email} onChange={(v) => setFormResponsavel((f) => ({ ...f, responsavel_email: v }))} placeholder="responsavel@empresa.com" type="email" />
                  <InputField label="Telefone direto" value={formResponsavel.responsavel_telefone} onChange={(v) => setFormResponsavel((f) => ({ ...f, responsavel_telefone: v }))} placeholder="+244 9XX XXX XXX" />
                </div>
                <button
                  onClick={handleSaveResponsavel}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#902ad1] text-white text-[13px] font-semibold shadow-[0_4px_14px_rgba(144,42,209,0.3)] hover:bg-[#7a23b2] transition-all disabled:opacity-60"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Guardar Alterações
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={14} className="text-slate-500" />
                  </div>
                  <Field label="Nome" value={parceiro?.responsavel_nome} />
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Briefcase size={14} className="text-slate-500" />
                  </div>
                  <Field label="Cargo" value={parceiro?.responsavel_cargo} />
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail size={14} className="text-slate-500" />
                  </div>
                  <Field label="Email direto" value={parceiro?.responsavel_email} />
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone size={14} className="text-slate-500" />
                  </div>
                  <Field label="Telefone direto" value={parceiro?.responsavel_telefone} />
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Card 4: Localização (12 cols) ── */}
        <div className="col-span-12">
          <SectionCard title="Localização" icon={<MapPin size={16} />}>
            <div className="flex items-center justify-between mb-5 -mt-1">
              <p className="text-[12px] text-slate-400 font-semibold">Endereço físico da empresa</p>
              {!editLocalizacao ? (
                <button
                  onClick={() => setEditLocalizacao(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#902ad1]/10 text-[#902ad1] text-[12px] font-semibold hover:bg-[#902ad1]/20 transition-all"
                >
                  <Pencil size={12} /> Editar
                </button>
              ) : (
                <button
                  onClick={() => { setEditLocalizacao(false); setFormLocalizacao({ endereco: parceiro?.endereco || "" }); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-[12px] font-semibold hover:bg-slate-200 transition-all"
                >
                  <X size={12} /> Cancelar
                </button>
              )}
            </div>

            {editLocalizacao ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Província</p>
                    <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-400 bg-slate-50 cursor-not-allowed">
                      {parceiro?.provincia || "—"}
                    </div>
                    <p className="text-[10px] text-slate-300 mt-1">Contacte o suporte para alterar</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Município</p>
                    <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-400 bg-slate-50 cursor-not-allowed">
                      {parceiro?.municipio || "—"}
                    </div>
                    <p className="text-[10px] text-slate-300 mt-1">Contacte o suporte para alterar</p>
                  </div>
                  <InputField
                    label="Endereço"
                    value={formLocalizacao.endereco}
                    onChange={(v) => setFormLocalizacao({ endereco: v })}
                    placeholder="Rua, número, bairro..."
                  />
                </div>
                <button
                  onClick={handleSaveLocalizacao}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#902ad1] text-white text-[13px] font-semibold shadow-[0_4px_14px_rgba(144,42,209,0.3)] hover:bg-[#7a23b2] transition-all disabled:opacity-60"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Guardar Alterações
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={14} className="text-slate-500" />
                  </div>
                  <Field label="Província" value={parceiro?.provincia} />
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={14} className="text-slate-500" />
                  </div>
                  <Field label="Município" value={parceiro?.municipio} />
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={14} className="text-slate-500" />
                  </div>
                  <Field label="Endereço" value={parceiro?.endereco} />
                </div>
              </div>
            )}
          </SectionCard>
        </div>

      </div>
    </div>
  );
}
