/** @format */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Building2,
  ArrowLeft,
  QrCode,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [userType, setUserType] = useState<"admin" | "parceiro">("admin");
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
          if (userType === "admin" && tipo !== "admin") {
            await supabase.auth.signOut();
            throw new Error(
              "Esta conta não tem permissão de administrador. Por favor, selecione 'Utilizador-parceiro' se for um parceiro.",
            );
          }
          if (userType === "parceiro" && tipo !== "parceiro") {
            await supabase.auth.signOut();
            throw new Error(
              "Esta conta não tem permissão de parceiro. Por favor, selecione 'Utilizador-admin' se for um administrador.",
            );
          }

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
      <div className="flex-1 flex items-center justify-center p-8 lg:p-24 bg-slate-50 relative text-slate-800">
        {/* Botão de Voltar para o Site */}
        <button
          onClick={() => (window.location.href = "https://www.witransfer.org")}
          className="absolute top-6 left-6 lg:top-8 lg:left-8 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#902ad1] transition-all">
          <ArrowLeft size={16} />
          <span>Voltar para o site</span>
        </button>

        <div className="w-full max-w-[330px]">
          <div className="lg:hidden mb-6 flex justify-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={180}
              height={60}
              className="object-contain"
              style={{ height: "auto" }}
            />
          </div>

          {/* Card Container */}
          <div className="bg-white border border-slate-200 rounded-[4px] shadow-sm overflow-hidden">
            {/* Cabeçalho com Linha de Separação */}
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/20">
              <h2 className="text-[15px] font-bold text-slate-800 tracking-tight leading-none">
                Fazer login
              </h2>
            </div>

            {/* Conteúdo do Cartão */}
            <div className="px-5 py-4">
              <p className="text-slate-400 mb-3 text-[10px] font-medium leading-normal">
                Aceda à sua conta WiTransfer por tipo de utilizador.
              </p>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 flex items-center gap-2.5 text-red-700 text-xs animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={16} />
              <p>{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            {/* Seletor AWS-style */}
            <div className="space-y-1.5 mb-3">
              <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <span>Tipo de utilizador</span>
                <span className="text-[9.5px] font-normal text-[#902ad1] hover:underline cursor-help" title="Selecione Administrador para gerir a plataforma ou Parceiro se for proprietário de frota.">
                  (não tem certeza?)
                </span>
              </div>

              {/* Cartão Administrador */}
              <div
                onClick={() => setUserType("admin")}
                className={`flex items-start gap-2 p-2 border rounded-[4px] cursor-pointer transition-all duration-150 ${
                  userType === "admin"
                    ? "border-[#902ad1] bg-[#902ad1]/5 ring-1 ring-[#902ad1]"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="mt-0.5 flex items-center justify-center">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                    userType === "admin"
                      ? "border-[#902ad1]"
                      : "border-slate-300"
                  }`}>
                    {userType === "admin" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#902ad1]" />
                    )}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11.5px] font-bold text-slate-800 leading-none">
                    Utilizador-admin
                  </span>
                  <span className="text-[9.5px] text-slate-400 mt-0.5 leading-snug">
                    Controlo de operações e parametrizações da plataforma.
                  </span>
                </div>
              </div>

              {/* Cartão Parceiro */}
              <div
                onClick={() => setUserType("parceiro")}
                className={`flex items-start gap-2 p-2 border rounded-[4px] cursor-pointer transition-all duration-150 ${
                  userType === "parceiro"
                    ? "border-[#902ad1] bg-[#902ad1]/5 ring-1 ring-[#902ad1]"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="mt-0.5 flex items-center justify-center">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                    userType === "parceiro"
                      ? "border-[#902ad1]"
                      : "border-slate-300"
                  }`}>
                    {userType === "parceiro" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#902ad1]" />
                    )}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11.5px] font-bold text-slate-800 leading-none">
                    Utilizador-parceiro
                  </span>
                  <span className="text-[9.5px] text-slate-400 mt-0.5 leading-snug">
                    Gestão de motoristas, frotas e ganhos acumulados.
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Endereço de e-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-[4px] outline-none transition-all text-slate-800 text-[12.5px] focus:border-[#902ad1] focus:ring-1 focus:ring-[#902ad1]/30 placeholder:text-slate-300 disabled:opacity-50"
                  placeholder="nomeutilizador@example.com"
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Palavra-passe
                  </label>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-9 pl-2.5 pr-9 bg-white border border-slate-300 rounded-[4px] outline-none transition-all text-slate-800 text-[12.5px] focus:border-[#902ad1] focus:ring-1 focus:ring-[#902ad1]/30 placeholder:text-slate-300 disabled:opacity-50"
                    placeholder="••••••••"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 text-slate-400 hover:text-[#902ad1] transition-colors disabled:opacity-50"
                    disabled={loading}>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => router.push("/recuperar-password")}
                    className="text-[10px] font-medium text-[#902ad1] hover:underline transition-all">
                    Esqueceu a password?
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-9 bg-[#902ad1] hover:bg-[#7a22b3] text-white rounded-[4px] font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-[#902ad1]/10">
                {loading ? (
                  <Loader2 className="animate-spin text-white" size={14} />
                ) : (
                  "Entrar"
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="h-[1px] flex-1 bg-slate-200" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                ou
              </span>
              <div className="h-[1px] flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={() => setShowQRModal(true)}
              className="w-full h-8 bg-white border border-slate-300 hover:border-slate-400 rounded-[4px] flex items-center justify-center gap-2 text-slate-700 font-medium text-[10px] shadow-sm transition-all hover:bg-slate-50/50">
              <QrCode
                size={12}
                className="text-slate-400"
              />
              <span>A utilizar a WiTransfer pela primeira vez? Registe-se</span>
            </button>
          </div>
        </div> {/* Fim do Conteúdo do Cartão */}
      </div> {/* Fim do Card Container */}
      </div> {/* Fim do max-w-[330px] */}
      </div> {/* Fim do Lado Direito */}

      {/* Modal QR Code para Registo via App */}
      {showQRModal && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setShowQRModal(false)}>
          <div
            className="bg-white rounded-2xl max-w-[390px] w-full p-6 max-h-[92vh] overflow-y-auto shadow-2xl relative border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200 no-scrollbar"
            onClick={(e) => e.stopPropagation()}>
            {/* Botão Fechar */}
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center">
              <X size={18} />
            </button>

            {/* Ícone / Header */}
            <div className="w-12 h-12 bg-[#902ad1]/10 text-[#902ad1] rounded-full flex items-center justify-center mb-3">
              <QrCode size={24} />
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-1.5 tracking-tight">
              Registo de Parceiros
            </h3>

            <p className="text-slate-500 text-xs leading-relaxed mb-4 font-medium max-w-[300px]">
              Por motivos de segurança e facilidade na validação de documentos,
              a criação de contas de parceiros WiTransfer é realizada
              **exclusivamente através da nossa aplicação móvel**.
            </p>

            {/* QR Code Container */}
            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 mb-4 flex flex-col items-center justify-center shadow-inner group hover:scale-[1.01] transition-all duration-300">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://play.google.com/store/apps/details?id=witransfer.com"
                alt="QR Code de Download"
                className="w-36 h-36 object-contain rounded-lg"
              />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3">
                Aponte a câmara do telemóvel
              </span>
            </div>

            {/* Play Store Link */}
            <div className="mt-1 flex flex-col items-center gap-3 w-full">
              <a
                href="https://play.google.com/store/apps/details?id=witransfer.com"
                target="_blank"
                rel="noopener noreferrer"
                className="play-store-btn-custom scale-95"
              >
                <svg
                  viewBox="0 0 512 512"
                  className="play-store-icon"
                  width="18"
                  height="18"
                  style={{ marginRight: "10px", fill: "currentColor" }}
                >
                  <path fill="#ea4335" d="M26.3 0c-4.9.5-8.7 3.5-10.4 7.9L242.4 256 26.3 0z" />
                  <path fill="#fbbc05" d="M26.3 512l216.1-256L15.9 504.1c1.7 4.4 5.5 7.4 10.4 7.9z" />
                  <path fill="#4285f4" d="M26.3 0L385.4 207c9 5.2 15.4 14.6 15.4 25.6s-6.4 20.4-15.4 25.6L26.3 512 242.4 256 26.3 0z" />
                  <path fill="#34a853" d="M385.4 207L26.3 0 242.4 256 385.4 207z" />
                </svg>
                <div className="play-store-btn-text">
                  <span className="play-store-sub">DISPONÍVEL NO</span>
                  <span className="play-store-main">Google Play</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
