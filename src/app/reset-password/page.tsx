/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        // Se não houver sessão (link expirado), mostrar erro amigável
        setErrorMsg(
          "Este link de recuperação expirou ou é inválido. Por favor, solicite um novo.",
        );
        setTimeout(() => {
          router.push("/recuperar-password");
        }, 5000);
      }
    };
    checkSession();
  }, [router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setErrorMsg("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("As palavras-passe não coincidem.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(
        error.message || "Não foi possível atualizar a palavra-passe.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F1E9F7] text-slate-800 font-sans flex flex-col justify-between p-4 lg:p-6 overflow-y-auto select-none">
      {/* Cabeçalho com Link de Voltar */}
      <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-8 flex items-center justify-between z-10 mb-2">
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-2 text-sm font-semibold text-slate-555 hover:text-[#902AD1] transition-all cursor-pointer bg-transparent border-none">
          <ArrowLeft size={16} />
          <span>Voltar para o Login</span>
        </button>
      </div>

      {/* Área de Conteúdo Principal Centralizada */}
      <div className="flex-1 flex justify-center items-center py-8 z-10 w-full">
        <div
          className="w-full max-w-[440px] rounded-[30px] border border-purple-200/40 p-8 lg:p-10 relative overflow-hidden transition-all duration-300 shrink-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255, 255, 255, 0.45) 10%, rgba(255, 255, 255, 0.15) 80%), rgba(255, 255, 255, 0.3)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow:
              "0 20px 40px -12px rgba(144, 42, 209, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.4)",
          }}>
          
          {/* Logo do WiTransfer */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#902AD1] flex items-center justify-center shadow-lg shadow-[#902AD1]/20 select-none relative overflow-hidden">
              <Image
                src="/imagem/icone_white.png"
                alt="WiTransfer Logo"
                width={34}
                height={34}
                className="object-contain"
              />
            </div>
          </div>

          {!success ? (
            <>
              {/* Título com Sublinhado */}
              <h2 className="text-center text-xl font-bold text-slate-800 mb-4 tracking-tight">
                <span className="relative pb-1">
                  Nova
                  <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#902AD1] rounded-full" />
                </span>{" "}
                Palavra-passe
              </h2>

              {/* Descrição */}
              <p className="text-slate-500 font-medium text-xs text-center leading-relaxed max-w-[260px] mx-auto mb-6">
                Escolha uma nova palavra-passe para aceder ao seu portal
              </p>

              {/* Mensagem de Erro */}
              {errorMsg && (
                <div
                  className={`mb-4 p-3 border rounded-2xl flex items-start gap-2.5 text-xs animate-in fade-in slide-in-from-top-1 ${
                    errorMsg.includes("expirou")
                      ? "bg-orange-500/10 border-orange-500/20 text-orange-850"
                      : "bg-red-500/10 border-red-500/20 text-red-750"
                  }`}>
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <p className="font-semibold leading-normal">{errorMsg}</p>
                </div>
              )}

              {/* Formulário */}
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                {/* Nova Palavra-passe */}
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-650 pl-1">
                    Nova Palavra-passe
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-10 pl-4 pr-11 bg-white/50 border border-slate-300/80 rounded-[5px] outline-none transition-all text-slate-800 text-[13.5px] focus:border-[#902AD1] focus:bg-white focus:ring-1 focus:ring-[#902AD1]/30 placeholder:text-slate-400 disabled:opacity-50"
                      placeholder="Introduza a nova palavra-passe"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-slate-400 hover:text-[#902AD1] transition-colors disabled:opacity-50 cursor-pointer"
                      disabled={loading}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Nova Palavra-passe */}
                <div className="space-y-1">
                  <label className="text-[12px] font-semibold text-slate-650 pl-1">
                    Confirmar Nova Palavra-passe
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-10 px-4 bg-white/50 border border-slate-300/80 rounded-[5px] outline-none transition-all text-slate-800 text-[13.5px] focus:border-[#902AD1] focus:bg-white focus:ring-1 focus:ring-[#902AD1]/30 placeholder:text-slate-400 disabled:opacity-50"
                    placeholder="Confirme a nova palavra-passe"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Botão Submeter */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 bg-[#902AD1] hover:bg-[#7a22b3] active:scale-[0.98] text-white rounded-[5px] font-bold text-sm transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-[#902AD1]/10 cursor-pointer">
                    {loading ? (
                      <Loader2 className="animate-spin text-white" size={16} />
                    ) : (
                      "Definir Palavra-passe"
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-2 animate-in fade-in duration-300">
              {/* Ícone de Sucesso */}
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <CheckCircle2 size={24} />
              </div>

              {/* Título de Sucesso */}
              <h2 className="text-lg font-bold text-slate-800 mb-2 tracking-tight">
                Palavra-passe Alterada!
              </h2>

              {/* Descrição de Sucesso */}
              <p className="text-slate-500 text-xs leading-relaxed max-w-[280px] mx-auto mb-6 font-medium">
                A sua palavra-passe foi redefinida com sucesso. Já pode iniciar sessão no seu portal.
              </p>

              {/* Botão Entrar Agora */}
              <button
                onClick={() => router.push("/login")}
                className="w-full h-10 bg-[#902AD1] hover:bg-[#7a22b3] text-white rounded-[5px] font-bold text-sm transition-all flex items-center justify-center cursor-pointer shadow-md shadow-[#902AD1]/10">
                Entrar Agora
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Direitos Reservados */}
      <div className="w-full text-center py-2 z-10">
        <p className="text-[10px] font-medium text-slate-450">
          © 2026 witransfer. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}

