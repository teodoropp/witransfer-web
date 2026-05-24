/** @format */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Info,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  HeadphonesIcon,
  ExternalLink,
  ChevronRight,
  Smartphone,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ─────────────────────────────────────────── types ─── */
interface Toast {
  type: "success" | "error";
  message: string;
}

/* ─────────────────────────────────────────── helpers ─── */
function SectionCard({
  title,
  subtitle,
  icon,
  children,
  danger = false,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-6">
      <div className="flex items-start gap-3 mb-5">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            danger ? "bg-rose-100 text-rose-500" : "bg-[#902ad1]/10 text-[#902ad1]"
          }`}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-slate-800">{title}</h2>
          {subtitle && <p className="text-[12px] text-slate-400 font-semibold mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
      <div className="relative">
        <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "••••••••"}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#902ad1]/30 focus:border-[#902ad1] transition-all placeholder:text-slate-300"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

/* password strength indicator */
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    { label: "Mínimo 6 caracteres", ok: password.length >= 6 },
    { label: "Letra maiúscula", ok: /[A-Z]/.test(password) },
    { label: "Número", ok: /[0-9]/.test(password) },
    { label: "Caracter especial", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const barColor = score <= 1 ? "bg-rose-400" : score === 2 ? "bg-amber-400" : score === 3 ? "bg-blue-400" : "bg-emerald-400";
  const label = score <= 1 ? "Fraca" : score === 2 ? "Razoável" : score === 3 ? "Boa" : "Forte";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${(score / 4) * 100}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold text-slate-500">{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {checks.map((c) => (
          <div key={c.label} className={`flex items-center gap-1.5 text-[11px] font-semibold ${c.ok ? "text-emerald-600" : "text-slate-400"}`}>
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${c.ok ? "bg-emerald-100" : "bg-slate-100"}`}>
              {c.ok ? <CheckCircle2 size={9} /> : <div className="w-1 h-1 rounded-full bg-slate-300" />}
            </div>
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── page ─── */
export default function ConfiguracoesPage() {
  const router = useRouter();

  /* password state */
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [showNova, setShowNova] = useState(false);
  const [showConfirma, setShowConfirma] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  /* logout confirm */
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  /* toast */
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }, []);

  /* ── handlers ── */
  const handleChangePassword = async () => {
    if (novaSenha.length < 6) {
      showToast("error", "A password deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmaSenha) {
      showToast("error", "As passwords não coincidem.");
      return;
    }

    setSavingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;
      setNovaSenha("");
      setConfirmaSenha("");
      showToast("success", "Password alterada com sucesso!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao alterar password.";
      showToast("error", msg);
    } finally {
      setSavingPass(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.replace("/login");
    } catch {
      showToast("error", "Erro ao terminar sessão.");
      setLoggingOut(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-[22px] font-semibold text-slate-800 tracking-tight">Configurações</h1>
        <p className="text-[13px] text-slate-400 font-semibold mt-0.5">Segurança, sessão e informações do portal</p>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-[13px] font-semibold border animate-in slide-in-from-top-2 max-w-sm ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-600 border-rose-200"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── LEFT COL ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Card 1: Segurança */}
          <SectionCard
            title="Segurança da Conta"
            subtitle="Atualize a sua password de acesso"
            icon={<Lock size={20} />}
          >
            <div className="space-y-4">
              <PasswordInput
                label="Nova Password"
                value={novaSenha}
                onChange={setNovaSenha}
                show={showNova}
                onToggle={() => setShowNova((v) => !v)}
                placeholder="Mínimo 6 caracteres"
              />

              {/* strength meter */}
              {novaSenha && <PasswordStrength password={novaSenha} />}

              <PasswordInput
                label="Confirmar Nova Password"
                value={confirmaSenha}
                onChange={setConfirmaSenha}
                show={showConfirma}
                onToggle={() => setShowConfirma((v) => !v)}
                placeholder="Repetir password"
              />

              {/* match indicator */}
              {confirmaSenha && (
                <div className={`flex items-center gap-2 text-[12px] font-semibold ${novaSenha === confirmaSenha ? "text-emerald-600" : "text-rose-500"}`}>
                  {novaSenha === confirmaSenha ? (
                    <><CheckCircle2 size={14} /> As passwords coincidem</>
                  ) : (
                    <><AlertCircle size={14} /> As passwords não coincidem</>
                  )}
                </div>
              )}

              {/* regras */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#902ad1]/5 border border-[#902ad1]/10">
                <ShieldCheck size={14} className="text-[#902ad1] mt-0.5 shrink-0" />
                <p className="text-[12px] font-semibold text-[#902ad1]/80 leading-relaxed">
                  Use pelo menos <strong>6 caracteres</strong>. Para maior segurança, combine letras maiúsculas, números e símbolos.
                </p>
              </div>

              <button
                onClick={handleChangePassword}
                disabled={savingPass || !novaSenha || !confirmaSenha}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#902ad1] text-white text-[13px] font-semibold shadow-[0_4px_14px_rgba(144,42,209,0.3)] hover:bg-[#7a23b2] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingPass ? (
                  <><Loader2 size={15} className="animate-spin" /> A alterar...</>
                ) : (
                  <><KeyRound size={15} /> Alterar Password</>
                )}
              </button>
            </div>
          </SectionCard>

          {/* Card 2: Sessão */}
          <SectionCard
            title="Sessão"
            subtitle="Gerir o acesso ao portal"
            icon={<LogOut size={20} />}
            danger
          >
            {!showLogoutConfirm ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-700">Sessão ativa</p>
                    <p className="text-[11px] text-slate-400 font-semibold">Está autenticado no Portal Parceiro WiTransfer</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-[13px] font-semibold hover:bg-rose-100 transition-all"
                >
                  <LogOut size={15} /> Terminar Sessão
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-amber-700">Tem a certeza?</p>
                    <p className="text-[12px] text-amber-600 font-semibold mt-0.5">
                      Irá sair do portal. Precisará de iniciar sessão novamente para aceder.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-[13px] font-semibold hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500 text-white text-[13px] font-semibold hover:bg-rose-600 transition-all disabled:opacity-60 shadow-[0_4px_14px_rgba(239,68,68,0.3)]"
                  >
                    {loggingOut ? (
                      <><Loader2 size={14} className="animate-spin" /> A sair...</>
                    ) : (
                      <><LogOut size={14} /> Confirmar saída</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── RIGHT COL ── */}
        <div className="space-y-5">

          {/* Card 3: Sobre o Portal */}
          <SectionCard
            title="Sobre o Portal"
            subtitle="Informações e recursos"
            icon={<Info size={20} />}
          >
            <div className="space-y-4">
              {/* version */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#902ad1]/5 to-[#902ad1]/10 border border-[#902ad1]/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone size={14} className="text-[#902ad1]" />
                    <p className="text-[11px] font-semibold text-[#902ad1] uppercase tracking-widest">Portal Web</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#902ad1]/15 text-[#902ad1]">v1.0.0</span>
                </div>
                <p className="text-[18px] font-semibold text-slate-800 tracking-tight">WiTransfer</p>
                <p className="text-[11px] text-slate-500 font-semibold">Portal do Parceiro · Angola</p>
              </div>

              {/* links */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Recursos</p>

                {[
                  { label: "Suporte Técnico", href: "mailto:suporte@witransfer.ao", icon: <HeadphonesIcon size={13} /> },
                  { label: "Termos de Parceria", href: "#", icon: <Info size={13} /> },
                  { label: "Política de Privacidade", href: "#", icon: <ShieldCheck size={13} /> },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-[13px] font-semibold transition-all group"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-slate-400 group-hover:text-[#902ad1] transition-colors">{link.icon}</span>
                      {link.label}
                    </span>
                    <ExternalLink size={11} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </a>
                ))}
              </div>

              {/* contact */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Contacto de Suporte</p>
                <a
                  href="mailto:suporte@witransfer.ao"
                  className="flex items-center gap-2 text-[13px] font-semibold text-[#902ad1] hover:underline"
                >
                  <HeadphonesIcon size={13} />
                  suporte@witransfer.ao
                </a>
                <p className="text-[11px] text-slate-400 font-semibold">
                  Horário: Seg–Sex, 08h–18h (WAT)
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Dica de Segurança */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#902ad1] to-[#6d14b0] text-white shadow-[0_8px_32px_rgba(144,42,209,0.25)]">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-white/80" />
              <p className="text-[12px] font-semibold uppercase tracking-widest text-white/70">Dica de Segurança</p>
            </div>
            <p className="text-[13px] font-semibold text-white/90 leading-relaxed">
              Nunca partilhe a sua password com ninguém. A WiTransfer nunca pedirá a sua password por email ou telefone.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-white/60">
              <ChevronRight size={12} />
              Saiba mais sobre segurança
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
