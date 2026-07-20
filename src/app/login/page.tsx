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
  ArrowLeft,
  QrCode,
  X,
  Car,
  User,
  FileText,
  CreditCard,
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Por favor, introduza o seu e-mail e palavra-passe.");
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
          throw new Error("E-mail ou palavra-passe incorretos.");
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
        if (tipo === "admin") {
          router.replace("/admin/dashboard");
        } else if (tipo === "parceiro") {
          router.replace("/parceiro");
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(
        error.message || "Erro ao tentar iniciar sessão com o Google.",
      );
      console.error("Google Login Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen w-full bg-[#F1E9F7] text-slate-800 font-sans flex flex-col justify-between p-4 lg:p-6 overflow-y-auto lg:overflow-hidden select-none">
      {/* Cabeçalho com Link de Voltar */}
      <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-8 flex items-center justify-between z-10 mb-2">
        <button
          onClick={() => (window.location.href = "https://www.witransfer.org")}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#902AD1] transition-all cursor-pointer">
          <ArrowLeft size={16} />
          <span>Voltar para o Site</span>
        </button>
      </div>

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 lg:px-8 max-w-[1600px] mx-auto w-full items-center z-10 overflow-hidden">
        {/* Painel Esquerdo: Boas-vindas e Características */}
        <div className="lg:col-span-7 flex flex-col justify-between h-full pt-1 pb-0 relative overflow-hidden animate-in fade-in slide-in-from-left-6 duration-700">
          <div className="flex-1">
            {/* Logo do WiTransfer */}
            <div className="mb-2 lg:mb-3">
              <Image
                src="/imagem/logo_clean.png"
                alt="WiTransfer"
                width={120}
                height={38}
                className="object-contain"
                priority
              />
            </div>

            {/* Título de Boas-vindas */}
            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-1.5">
              Bem-vindo ao <br />
              <span className="text-[#902AD1]">WiTransfer</span>
            </h1>

            {/* Subtítulo Descritivo */}
            <p className="text-slate-600 font-medium text-[11px] lg:text-xs xl:text-sm leading-relaxed max-w-xl mb-4 lg:mb-5">
              Controle corridas, motoristas, passageiros e relatórios em tempo
              real através de uma plataforma moderna, segura e intuitiva.
            </p>

            {/* Grid de Características */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 lg:divide-x lg:divide-slate-300/50 mb-4">
              {/* Feature 1 */}
              <div className="flex flex-col items-start lg:px-3 lg:first:pl-0 lg:last:pr-0 group cursor-pointer">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#902AD1] bg-[#902AD1]/5 mb-1.5 shrink-0 transition-all duration-300 group-hover:bg-[#902AD1]/15 group-hover:scale-110">
                  <Car size={16} className="transition-transform duration-500 group-hover:rotate-[6deg]" />
                </div>
                <h3 className="text-[11px] font-bold text-slate-800 mb-0.5 leading-snug transition-colors duration-300 group-hover:text-[#902AD1]">
                  Gestão de Frotas
                </h3>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Acompanhe e Gerencie todas as tuas frotas em tempo real
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-start lg:px-3 group cursor-pointer">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#902AD1] bg-[#902AD1]/5 mb-1.5 shrink-0 transition-all duration-300 group-hover:bg-[#902AD1]/15 group-hover:scale-110">
                  <User size={16} className="transition-transform duration-500 group-hover:rotate-[6deg]" />
                </div>
                <h3 className="text-[11px] font-bold text-slate-800 mb-0.5 leading-snug transition-colors duration-300 group-hover:text-[#902AD1]">
                  Motoristas
                </h3>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Cadastre e gerencie seus motoristas com facilidade
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-start lg:px-3 group cursor-pointer">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#902AD1] bg-[#902AD1]/5 mb-1.5 shrink-0 transition-all duration-300 group-hover:bg-[#902AD1]/15 group-hover:scale-110">
                  <FileText size={16} className="transition-transform duration-500 group-hover:rotate-[6deg]" />
                </div>
                <h3 className="text-[11px] font-bold text-slate-800 mb-0.5 leading-snug transition-colors duration-300 group-hover:text-[#902AD1]">
                  Relatórios
                </h3>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Acompanhe e Gerencie todas as tuas frotas em tempo real
                </p>
              </div>

              {/* Feature 4 */}
              <div className="flex flex-col items-start lg:px-3 group cursor-pointer">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#902AD1] bg-[#902AD1]/5 mb-1.5 shrink-0 transition-all duration-300 group-hover:bg-[#902AD1]/15 group-hover:scale-110">
                  <CreditCard size={16} className="transition-transform duration-500 group-hover:rotate-[6deg]" />
                </div>
                <h3 className="text-[11px] font-bold text-slate-800 mb-0.5 leading-snug transition-colors duration-300 group-hover:text-[#902AD1]">
                  Gestão de Pagamentos
                </h3>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Controle pagamentos, receitas e histórico de transações
                </p>
              </div>
            </div>
          </div>

          {/* Ilustração no Rodapé do Painel Esquerdo */}
          <div className="mt-auto hidden lg:block w-full max-w-[1560px] max-h-[400px] relative overflow-hidden rounded-[20px] shadow-sm">
            <Image
              src="/imagem/tela_login.png"
              alt="Ilustração Carro e Telemóvel"
              width={800}
              height={240}
              className="w-full ml-18 h-auto max-h-[190px] object-contain transition-transform duration-700 ease-out hover:scale-[1.04] cursor-pointer"
              priority
            />
          </div>
        </div>

        {/* Painel Direito: Cartão de Login */}
        <div className="lg:col-span-5 flex justify-center items-center py-2 lg:py-4 animate-in fade-in slide-in-from-right-6 duration-700">
          <div
            className="w-full max-w-[400px] rounded-[24px] border border-white/20 p-5 lg:p-6 relative overflow-hidden transition-all duration-300 shrink-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.35) 10%, rgba(255, 255, 255, 0) 50%), rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              boxShadow:
                "0 20px 40px -12px rgba(144, 42, 209, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.4)",
            }}>
            {/* Logotipo Redondo Roxo Escuro */}
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-full bg-[#490977] flex items-center justify-center shadow-lg shadow-[#490977]/20 select-none relative overflow-hidden transition-transform duration-500 hover:scale-110 hover:rotate-[6deg] cursor-pointer">
                <Image
                  src="/imagem/icone_white.png"
                  alt="Badge Logo"
                  width={26}
                  height={26}
                  className="object-contain"
                />
              </div>
            </div>

            <h2 className="text-center text-base font-bold text-slate-800 mb-4 tracking-tight">
              Faça login para continuar
            </h2>

            {/* Mensagem de Erro */}
            {errorMsg && (
              <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-red-700 text-xs animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <p className="font-semibold leading-normal">{errorMsg}</p>
              </div>
            )}

            {/* Formulário de Login */}
            <form onSubmit={handleLogin} className="space-y-3">
              {/* E-mail */}
              <div className="space-y-0.5">
                <label className="text-[11px] font-semibold text-slate-600 pl-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 px-3 bg-white/50 border border-slate-300/80 rounded-[5px] outline-none transition-all text-slate-800 text-xs focus:border-[#902AD1] focus:bg-white focus:ring-1 focus:ring-[#902AD1]/30 placeholder:text-slate-400 disabled:opacity-50"
                  placeholder="Digite o seu e-mail"
                  disabled={loading}
                  required
                />
              </div>

              {/* Senha */}
              <div className="space-y-0.5">
                <label className="text-[11px] font-semibold text-slate-600 pl-1">
                  Palavra-passe
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-9 pl-3 pr-9 bg-white/50 border border-slate-300/80 rounded-[5px] outline-none transition-all text-slate-800 text-xs focus:border-[#902AD1] focus:bg-white focus:ring-1 focus:ring-[#902AD1]/30 placeholder:text-slate-400 disabled:opacity-50"
                    placeholder="Digite a sua palavra-passe"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-[#902AD1] transition-colors disabled:opacity-50 cursor-pointer"
                    disabled={loading}>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {/* Recuperação */}
                <div className="flex justify-end pt-0.5 pr-1">
                  <button
                    type="button"
                    onClick={() => router.push("/recuperar-password")}
                    className="text-[10px] font-semibold text-[#902AD1] hover:underline transition-all cursor-pointer">
                    Esqueceu a palavra-passe?
                  </button>
                </div>
              </div>

              {/* Botão Entrar */}
              <div className="pt-0.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-9 bg-[#902AD1] hover:bg-[#7a22b3] active:scale-[0.98] text-white rounded-[5px] font-bold text-xs transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-[#902AD1]/10 cursor-pointer">
                  {loading ? (
                    <Loader2 className="animate-spin text-white" size={14} />
                  ) : (
                    "Entrar"
                  )}
                </button>
              </div>
            </form>

            {/* Separador */}
            <div className="mt-3.5 space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-[1px] flex-1 bg-slate-300/60" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  ou
                </span>
                <div className="h-[1px] flex-1 bg-slate-300/60" />
              </div>

              {/* Botão Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-9  active:scale-[0.98] border border-slate-300/85 hover:border-slate-400/80 text-slate-700 rounded-[5px] font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.62 0 3.08.56 4.22 1.66l3.15-3.15C17.45 1.74 14.93 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.86 3C6.27 7.77 8.9 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.67 2.85c2.15-1.98 3.74-4.89 3.74-8.49z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.36 14.5A7.12 7.12 0 0 1 5 12c0-.87.16-1.7.43-2.5L1.5 6.5C.54 8.16 0 10.02 0 12c0 1.98.54 3.84 1.5 5.5l3.86-3z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.67-2.85c-1.02.68-2.33 1.09-4.29 1.09-3.1 0-5.73-2.73-6.66-5.46l-3.86 3C3.4 20.35 7.35 23 12 23z"
                  />
                </svg>
                <span>Entrar com o Google</span>
              </button>

              {/* Registro */}
              <div className="text-center">
                <span className="text-[11px] font-medium text-slate-500">
                  Ainda não é parceiro?{" "}
                </span>
                <button
                  type="button"
                  onClick={() => router.push("/parceiro/registo")}
                  className="text-[11px] font-bold text-[#902AD1] hover:underline transition-all cursor-pointer">
                  Cria conta!
                </button>
              </div>
            </div>

            {/* Direitos Reservados */}
            <div className="mt-4 text-center">
              <p className="text-[9px] font-medium text-slate-500">
                © 2026 witransfer. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal QR Code para Registo via App */}
      {showQRModal && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setShowQRModal(false)}>
          <div
            className="bg-white rounded-[32px] max-w-[395px] w-full p-6 max-h-[92vh] overflow-y-auto shadow-2xl relative border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200 no-scrollbar"
            onClick={(e) => e.stopPropagation()}>
            {/* Botão Fechar */}
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer">
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
              a criação de contas de parceiros WiTransfer é realizada{" "}
              <strong>exclusivamente através da nossa aplicação móvel</strong>.
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
                className="play-store-btn-custom scale-95">
                <svg
                  viewBox="0 0 512 512"
                  className="play-store-icon"
                  width="18"
                  height="18"
                  style={{ marginRight: "10px", fill: "currentColor" }}>
                  <path
                    fill="#ea4335"
                    d="M26.3 0c-4.9.5-8.7 3.5-10.4 7.9L242.4 256 26.3 0z"
                  />
                  <path
                    fill="#fbbc05"
                    d="M26.3 512l216.1-256L15.9 504.1c1.7 4.4 5.5 7.4 10.4 7.9z"
                  />
                  <path
                    fill="#4285f4"
                    d="M26.3 0L385.4 207c9 5.2 15.4 14.6 15.4 25.6s-6.4 20.4-15.4 25.6L26.3 512 242.4 256 26.3 0z"
                  />
                  <path
                    fill="#34a853"
                    d="M385.4 207L26.3 0 242.4 256 385.4 207z"
                  />
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
