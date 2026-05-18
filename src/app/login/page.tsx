/** @format */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2, AlertCircle, Building2, ArrowLeft, QrCode, X } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

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
        {/* Botão de Voltar para o Site */}
        <button
          onClick={() => (window.location.href = "https://www.witransfer.org")}
          className="absolute top-6 right-6 lg:top-8 lg:right-8 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#902ad1] transition-all bg-slate-50 hover:bg-slate-100 px-4 h-9 rounded-full border border-slate-200 shadow-sm"
        >
          <ArrowLeft size={14} />
          <span>Voltar para o site</span>
        </button>

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
              type="button"
              onClick={() => setShowQRModal(true)}
              className="w-full h-14 bg-slate-50 border-2 border-slate-200 rounded-[5px] flex items-center justify-center gap-3 text-primary font-bold hover:bg-white hover:border-[#902ad1] transition-all group"
            >
              <Building2 size={20} className="text-primary/60 group-hover:text-[#902ad1] transition-colors" />
              <span>Seja um parceiro WiTransfer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal QR Code para Registo via App */}
      {showQRModal && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setShowQRModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão Fechar */}
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
            >
              <X size={18} />
            </button>

            {/* Ícone / Header */}
            <div className="w-16 h-16 bg-[#902ad1]/10 text-[#902ad1] rounded-full flex items-center justify-center mb-6">
              <QrCode size={32} />
            </div>

            <h3 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">
              Registo de Parceiros
            </h3>
            
            <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">
              Por motivos de segurança e facilidade na validação de documentos, a criação de contas de parceiros WiTransfer é realizada **exclusivamente através da nossa aplicação móvel**.
            </p>

            {/* QR Code Container */}
            <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 mb-6 flex flex-col items-center justify-center shadow-inner group hover:scale-[1.02] transition-all duration-300">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://www.witransfer.org/witransfer.apk"
                alt="QR Code de Download"
                className="w-48 h-48 object-contain rounded-lg"
              />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
                Aponte a câmara do telemóvel
              </span>
            </div>

            {/* Botão de Download Direto (Mobile fallback) */}
            <a
              href="https://www.witransfer.org/witransfer.apk"
              className="text-xs font-bold text-[#902ad1] hover:underline mb-2 block"
            >
              Está no telemóvel? Descarregue o APK diretamente aqui
            </a>

            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
              Disponível para Android
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
