/** @format */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  Lock,
  BadgeCheck,
  Loader2,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { THEME_TOKENS } from "@/utils/design-system";

interface PerfilData {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  foto_url: string | null;
  criado_em?: string;
}

interface Toast {
  type: "success" | "error";
  message: string;
}

export default function AdminPerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // Tabs State
  const [activeTab, setActiveTab] = useState<"perfil" | "seguranca">("perfil");

  // User Profile Data
  const [profile, setProfile] = useState<PerfilData | null>(null);

  // Form States
  const [formProfile, setFormProfile] = useState({
    nome_completo: "",
    email: "",
    telefone: "",
  });

  // Security Form States
  const [formSecurity, setFormSecurity] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Helper to show floating toasts
  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch admin profile
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        const profileData: PerfilData = {
          id: data.id,
          nome_completo: data.nome_completo || "Administrador",
          email: data.email || user.email || "",
          telefone: data.telefone || "",
          foto_url: data.foto_url,
          criado_em: data.criado_em,
        };

        setProfile(profileData);
        setFormProfile({
          nome_completo: profileData.nome_completo,
          email: profileData.email,
          telefone: profileData.telefone,
        });
      }
    } catch (err) {
      console.error("Erro ao carregar perfil do administrador:", err);
      showToast("error", "Não foi possível carregar as informações do perfil.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handle Saving Profile Info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!formProfile.nome_completo.trim()) {
      showToast("error", "O Nome Completo é obrigatório.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome_completo: formProfile.nome_completo.trim(),
        email: formProfile.email.trim(),
        telefone: formProfile.telefone.trim(),
        atualizado_em: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("perfis")
        .update(payload)
        .eq("id", profile.id);

      if (error) throw error;

      // Update local profile state
      setProfile((prev) => (prev ? { ...prev, ...payload } : null));
      showToast("success", "Perfil atualizado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar perfil:", err);
      showToast("error", err.message || "Erro ao tentar atualizar o perfil.");
    } finally {
      setSaving(false);
    }
  };

  // Handle Changing Password
  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formSecurity.newPassword.length < 6) {
      showToast("error", "A nova palavra-passe deve conter pelo menos 6 caracteres.");
      return;
    }

    if (formSecurity.newPassword !== formSecurity.confirmPassword) {
      showToast("error", "As palavras-passe introduzidas não coincidem.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formSecurity.newPassword,
      });

      if (error) throw error;

      showToast("success", "Palavra-passe alterada com sucesso!");
      setFormSecurity({ newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      console.error("Erro ao alterar palavra-passe:", err);
      showToast("error", err.message || "Erro ao tentar alterar a palavra-passe.");
    } finally {
      setSaving(false);
    }
  };

  // Handle Photo Avatar Upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !profile) return;

    setSaving(true);
    try {
      const file = files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `perfis/foto/${fileName}`;

      // Upload image to Supabase storage bucket "motoristas"
      const { error: uploadError } = await supabase.storage
        .from("motoristas")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("motoristas").getPublicUrl(filePath);

      // Update profile in DB with new photo url
      const { error: dbError } = await supabase
        .from("perfis")
        .update({ foto_url: publicUrl, atualizado_em: new Date().toISOString() })
        .eq("id", profile.id);

      if (dbError) throw dbError;

      setProfile((prev) => (prev ? { ...prev, foto_url: publicUrl } : null));
      showToast("success", "Foto de perfil atualizada!");
    } catch (err: any) {
      console.error("Erro ao carregar imagem de perfil:", err);
      showToast("error", "Erro ao carregar imagem de perfil para o servidor.");
    } finally {
      setSaving(false);
    }
  };

  // Handle Remove Photo Avatar
  const handleRemoveAvatar = async () => {
    if (!profile || !profile.foto_url) return;

    setSaving(true);
    try {
      const { error: dbError } = await supabase
        .from("perfis")
        .update({ foto_url: null, atualizado_em: new Date().toISOString() })
        .eq("id", profile.id);

      if (dbError) throw dbError;

      setProfile((prev) => (prev ? { ...prev, foto_url: null } : null));
      showToast("success", "Foto de perfil removida com sucesso!");
    } catch (err: any) {
      console.error("Erro ao remover foto de perfil:", err);
      showToast("error", "Erro ao tentar remover a foto de perfil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 min-h-[60vh] gap-4 font-sans">
        <Loader2 className="w-10 h-10 text-[#902ad1] animate-spin" />
        <p className="text-slate-500 font-semibold text-sm uppercase tracking-widest">
          A carregar perfil...
        </p>
      </div>
    );
  }

  // Format initials for default avatar
  const getInitials = (name: string) => {
    return name
      ? name
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "AD";
  };

  const formattedDate = profile?.criado_em
    ? new Date(profile.criado_em).toLocaleDateString("pt-PT", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 font-sans">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          <Link href="/admin/dashboard" className="hover:text-[#902ad1] transition-all">
            Painel
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">Administrador</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">Meu Perfil</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
          Perfil do Administrador
        </h1>
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

      {/* ── Tabs Selector ── */}
      <div className="flex border-b border-slate-100 gap-1.5 pb-px">
        <button
          onClick={() => {
            setActiveTab("perfil");
          }}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-t-[10px] transition-all cursor-pointer ${
            activeTab === "perfil"
              ? "bg-white border-t border-x border-slate-100 text-[#902ad1] shadow-sm -mb-px"
              : "text-slate-400 hover:text-[#902ad1]/85 bg-transparent"
          }`}
        >
          Informações do Perfil
        </button>
        <button
          onClick={() => {
            setActiveTab("seguranca");
          }}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-t-[10px] transition-all cursor-pointer ${
            activeTab === "seguranca"
              ? "bg-white border-t border-x border-slate-100 text-[#902ad1] shadow-sm -mb-px"
              : "text-slate-400 hover:text-[#902ad1]/85 bg-transparent"
          }`}
        >
          Palavra-passe & Segurança
        </button>
      </div>

      {/* ── Bento Grid Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Esquerda: Formulários */}
        <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-[10px] border border-slate-100 shadow-sm">
          
          {/* TAB 1: Profile Information */}
          {activeTab === "perfil" && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">Detalhes Pessoais</h3>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mt-0.5">
                  Edite os seus dados de contacto que são sincronizados em tempo real na plataforma
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-0.5">
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formProfile.nome_completo}
                      onChange={(e) => setFormProfile({ ...formProfile, nome_completo: e.target.value })}
                      placeholder="Ex: Manuel Silva"
                      required
                      className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#902ad1] transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Email address */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-0.5">
                    Endereço de E-mail
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formProfile.email}
                      onChange={(e) => setFormProfile({ ...formProfile, email: e.target.value })}
                      placeholder="admin@witransfer.co"
                      className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-semibold text-slate-750 focus:outline-none focus:border-[#902ad1] transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 block ml-0.5">
                    Utilizado para notificações e comunicações diretas da conta.
                  </span>
                </div>

                {/* Telephone */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-0.5">
                    Contacto Telefónico
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={formProfile.telefone}
                      onChange={(e) => setFormProfile({ ...formProfile, telefone: e.target.value })}
                      placeholder="+244 9XX XXX XXX"
                      className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#902ad1] transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-slate-50">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-fit px-8 py-3 bg-[#902ad1] hover:bg-[#7a22b3] text-white rounded-[10px] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-[#902ad1]/15 disabled:opacity-75 cursor-pointer"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>Gravar Perfil</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Password and Security */}
          {activeTab === "seguranca" && (
            <form onSubmit={handleSaveSecurity} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">Alterar Palavra-passe</h3>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mt-0.5">
                  Atualize a segurança da sua credencial de acesso root
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-0.5">
                    Nova Palavra-passe <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={formSecurity.newPassword}
                      onChange={(e) => setFormSecurity({ ...formSecurity, newPassword: e.target.value })}
                      placeholder="Mínimo de 6 caracteres"
                      required
                      className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#902ad1] transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-0.5">
                    Confirmar Nova Palavra-passe <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={formSecurity.confirmPassword}
                      onChange={(e) => setFormSecurity({ ...formSecurity, confirmPassword: e.target.value })}
                      placeholder="Repita a nova palavra-passe"
                      required
                      className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#902ad1] transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-slate-50">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-fit px-8 py-3 bg-[#902ad1] hover:bg-[#7a22b3] text-white rounded-[10px] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-[#902ad1]/15 disabled:opacity-75 cursor-pointer"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                  <span>Alterar Credenciais</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Direita: Preview Card */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Visual Avatar Card Preview */}
          <div className="bg-gradient-to-br from-[#902ad1] to-[#6d14b0] rounded-2xl p-6 shadow-[0_8px_32px_rgba(144,42,209,0.25)] text-white text-center space-y-5">
            <h4 className="font-semibold text-white/90 uppercase tracking-widest text-[9.5px]">
              Visualização de Conta
            </h4>

            {/* Avatar container with interactive Camera Upload overlay */}
            <div className="relative w-28 h-28 mx-auto group">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/20 shadow-xl bg-white/10 flex items-center justify-center relative shrink-0">
                {profile?.foto_url ? (
                  <Image
                    src={profile.foto_url}
                    alt={profile.nome_completo}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-3xl font-extrabold text-white">
                    {getInitials(profile?.nome_completo || "")}
                  </span>
                )}
              </div>

              {/* Upload Overlay */}
              <label className="absolute inset-0 w-28 h-28 rounded-full bg-slate-950/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[10px] font-semibold gap-1 shrink-0">
                <Camera size={18} />
                <span>Mudar Foto</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={saving}
                />
              </label>

              {/* Active Green status dot */}
              <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 ring-4 ring-white/10 flex items-center justify-center shrink-0 shadow-md" title="Ativo" />
            </div>

            {/* Details details */}
            <div className="space-y-1">
              <h3 className="text-[17px] font-bold tracking-tight leading-tight">
                {profile?.nome_completo || "—"}
              </h3>
              <p className="text-[9.5px] bg-white/15 px-3 py-0.5 rounded-full border border-white/20 font-bold uppercase tracking-wider inline-block">
                Administrador
              </p>
            </div>

            <div className="h-[1px] bg-white/15 my-4" />

            {/* Micro Details info */}
            <div className="space-y-3.5 text-left text-xs font-medium">
              
              {profile?.email && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Mail size={14} className="text-white/80" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider leading-none">Email Geral</p>
                    <p className="text-[12px] font-semibold text-white truncate mt-1">{profile.email}</p>
                  </div>
                </div>
              )}

              {profile?.telefone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Phone size={14} className="text-white/80" />
                  </div>
                  <div>
                    <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider leading-none">Contacto Direto</p>
                    <p className="text-[12px] font-semibold text-white mt-1">{profile.telefone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Clock size={14} className="text-white/80" />
                </div>
                <div>
                  <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider leading-none">Criado em</p>
                  <p className="text-[12px] font-semibold text-white mt-1">{formattedDate}</p>
                </div>
              </div>

            </div>

            {/* Remove photo action if photo exists */}
            {profile?.foto_url && (
              <div className="pt-2">
                <button
                  onClick={handleRemoveAvatar}
                  disabled={saving}
                  className="text-[10px] text-white/60 hover:text-white hover:underline transition-all cursor-pointer font-bold border-none bg-transparent"
                >
                  Remover Foto de Perfil
                </button>
              </div>
            )}

          </div>

          {/* Access Info Card */}
          <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 tracking-tight">Privilégios de Segurança</h3>
              <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mt-0.5">
                Nível de acesso do sistema
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-[10px] flex items-start gap-3">
              <ShieldAlert size={18} className="text-[#902ad1] mt-0.5 shrink-0" />
              <div className="space-y-1 text-[10px] font-semibold text-slate-500 leading-normal">
                <span className="block font-bold text-slate-700">Acesso Total (ROOT)</span>
                <span>
                  Esta conta tem permissão total para criar parceiros, excluir viaturas, e auditar pagamentos na base de dados global.
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
