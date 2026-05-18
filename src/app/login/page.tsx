/** @format */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2, AlertCircle, Building2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Por favor, introduza o seu email e palavra-passe.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message === "Invalid login credentials") {
          throw new Error("Email ou palavra-passe incorretos.");
        }
        throw error;
      }

      if (data.user) {
        // Verificar o tipo de perfil no Supabase
        const { data: perfil, error: perfilError } = await supabase
          .from("perfis")
          .select("tipo")
          .eq("id", data.user.id)
          .single();

        if (perfilError || !perfil) {
          await supabase.auth.signOut();
          throw new Error(
            "Não foi possível verificar as suas permissões de acesso.",
          );
        }

        const tipo = perfil.tipo;

        // Apenas admin e parceiro podem aceder ao portal web
        if (tipo === "admin" || tipo === "parceiro") {
          if (tipo === "admin") {
            router.replace("/admin/dashboard");
          } else {
            router.replace("/parceiro");
          }
        } else {
          await supabase.auth.signOut();
          throw new Error(
            "Esta conta não tem permissão para aceder ao portal de gestão. Use a aplicação mobile.",
          );
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Ocorreu um erro ao tentar iniciar sessão.");
      console.error("Login Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans bg-white overflow-hidden">
      {/* Lado Esquerdo: Painel de Boas-vindas */}
      <div className="hidden lg:flex flex-1 bg-primary relative items-center justify-center p-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] border-[2px] border-white rounded-full blur-3xl" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] border-[1px] border-white/40 rounded-full blur-2xl" />
          <div className="absolute top-[20%] right-[10%] w-2 h-2 bg-white rounded-full" />
          <div className="absolute bottom-[30%] left-[15%] w-3 h-3 bg-white/50 rounded-full" />
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

        <div className="relative z-10 text-white max-w-md">
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
            Bem-vindo ao portal de gestão
          </h2>
          <p className="text-lg text-primary-foreground/70 font-medium leading-relaxed">
            Inicie sessão para gerir a sua frota, acompanhar motoristas em tempo
            real e otimizar os seus ganhos.
          </p>
        </div>
      </div>

      {/* Lado Direito: Formulário de Login */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-24 bg-white relative text-slate-800">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-12 flex justify-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={180}
              height={60}
              className="object-contain"
              style={{ height: "auto" }}
            />
          </div>

          <h2 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">
            Login
          </h2>
          <p className="text-slate-400 mb-10 font-medium">
            Introduza as suas credenciais para continuar.
          </p>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 text-red-700 text-sm animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={18} />
              <p>{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Email do Utilizador
              </label>
              <div className="relative flex items-center group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 pl-4 pr-4 bg-slate-50 border-2 border-slate-200 rounded-[5px] outline-none transition-all text-slate-800 font-medium focus:bg-white focus:border-primary placeholder:text-slate-300 disabled:opacity-50"
                  placeholder="admin@witransfer.com"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Palavra-passe
                </label>
              </div>
              <div className="relative flex items-center group">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-4 pr-12 bg-slate-50 border-2 border-slate-200 rounded-[5px] outline-none transition-all text-slate-800 font-medium focus:bg-white focus:border-primary placeholder:text-slate-300 disabled:opacity-50"
                  placeholder="••••••••"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-300 hover:text-primary transition-colors disabled:opacity-50"
                  disabled={loading}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => router.push("/recuperar-password")}
                  className="text-xs font-bold text-primary hover:underline transition-all">
                  Esqueceu a password?
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#902ad1] text-white rounded-[5px] font-bold uppercase tracking-widest text-sm shadow-xl shadow-[#902ad1]/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  "Entrar"
                )}
              </button>
            </div>
          </form>

          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-[1px] flex-1 bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ou</span>
              <div className="h-[1px] flex-1 bg-slate-200" />
            </div>

            <button
              onClick={() => router.push("/parceiro/registo")}
              className="w-full h-14 bg-slate-50 border-2 border-slate-200 rounded-[5px] flex items-center justify-center gap-3 text-primary font-bold hover:bg-white hover:border-primary transition-all group"
            >
              <Building2 size={20} className="text-primary/60 group-hover:text-primary transition-colors" />
              <span>Seja um parceiro WiTransfer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
