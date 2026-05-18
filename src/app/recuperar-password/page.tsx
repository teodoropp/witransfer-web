/** @format */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function RecuperarPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Por favor, introduza o seu email.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );

      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(
        error.message || "Ocorreu um erro ao processar o seu pedido.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-[5px] border-2 border-slate-100 shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-green-100">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">
            Email Enviado!
          </h2>
          <p className="text-slate-500 mb-10 leading-relaxed font-medium">
            Verifique a sua caixa de entrada para redefinir a sua password. Se
            não vir o email, verifique a pasta de spam.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full h-14 bg-primary text-white rounded-[5px] font-bold uppercase tracking-widest text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary/20">
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans bg-white overflow-hidden text-slate-800">
      {/* Painel Esquerdo (Desktop) */}
      <div className="hidden lg:flex flex-1 bg-primary relative items-center justify-center p-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] border-[2px] border-white rounded-full blur-3xl" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] border-[1px] border-white/40 rounded-full blur-2xl" />
          <svg
            className="absolute top-10 left-10 w-32 h-32 text-white/20"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5">
            <path d="M10,10 Q50,90 90,10" />
            <path d="M10,30 Q50,110 90,30" />
          </svg>
        </div>

        <div className="relative z-10 text-white max-w-md w-full">
          <div className="mb-12">
            <Image
              src="/logo.png"
              alt="WiTransfer"
              width={220}
              height={70}
              className="brightness-0 invert object-contain"
              style={{ height: "auto" }}
            />
          </div>
          <h2 className="text-4xl font-bold mb-4 tracking-tight leading-tight">
            Recupere o acesso ao seu portal
          </h2>
          <p className="text-lg text-primary-foreground/70 font-medium leading-relaxed">
            Esqueceu a sua palavra-passe? Não se preocupe. Enviaremos instruções
            para o seu email para definir uma nova.
          </p>
        </div>
      </div>

      {/* Painel Direito (Formulário) */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-24 bg-white relative">
        <div className="w-full max-w-sm">
          {/* Voltar */}
          <div className="flex items-center justify-between mb-12">
            <div className="lg:hidden">
              <Image
                src="/logo.png"
                alt="WiTransfer"
                width={160}
                height={50}
                className="object-contain"
                style={{ height: "auto" }}
              />
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">
              Recuperar Password
            </h2>
            <p className="text-slate-400 font-medium">
              Introduza o seu email para receber o link de recuperação.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 text-red-700 text-sm animate-in fade-in slide-in-from-top-1 rounded-r-md">
              <AlertCircle size={18} className="shrink-0" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleRecuperar} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Email de Utilizador
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors border-r border-slate-200 pr-3">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 pl-14 pr-4 bg-slate-50 border-2 border-slate-200 rounded-[5px] outline-none transition-all text-slate-800 font-medium focus:bg-white focus:border-primary placeholder:text-slate-300"
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-primary text-white rounded-[5px] font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/30 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70">
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  "Enviar Instruções"
                )}
              </button>
            </div>
          </form>

          <div className="mt-12 text-center">
            <p className="text-sm text-slate-400 font-medium">
              Lembrou-se da password?{" "}
              <a
                href="/login"
                className="font-bold text-primary hover:underline underline-offset-4">
                Voltar ao Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
