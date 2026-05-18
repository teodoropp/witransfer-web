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
  Lock
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Se não houver sessão (link expirado), mostrar erro amigável
        setErrorMsg("Este link de recuperação expirou ou é inválido. Por favor, solicite um novo.");
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
      setErrorMsg("A password deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("As passwords não coincidem.");
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
      setErrorMsg(error.message || "Não foi possível atualizar a password.");
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
          <h2 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">Password Atualizada!</h2>
          <p className="text-slate-500 mb-10 leading-relaxed font-medium">
            A sua password foi alterada com sucesso. Já pode aceder à sua conta com as novas credenciais.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full h-14 bg-primary text-white rounded-[5px] font-bold uppercase tracking-widest text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary/20"
          >
            Entrar Agora
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
        </div>

        <div className="relative z-10 text-white max-w-md w-full text-center lg:text-left">
          <div className="mb-12 flex justify-center lg:justify-start">
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
            Defina uma nova password segura
          </h2>
          <p className="text-lg text-primary-foreground/70 font-medium leading-relaxed">
            A segurança da sua conta é a nossa prioridade. Escolha uma password forte que não tenha usado anteriormente.
          </p>
        </div>
      </div>

      {/* Painel Direito (Formulário) */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-24 bg-white relative">
        <div className="w-full max-w-sm">
          
          <div className="lg:hidden mb-12 flex justify-center">
            <Image
              src="/logo.png"
              alt="WiTransfer"
              width={160}
              height={50}
              className="object-contain"
              style={{ height: "auto" }}
            />
          </div>

          <div className="mb-10">
            <h2 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">
              Nova Password
            </h2>
            <p className="text-slate-400 font-medium">
              Escolha uma nova password para aceder ao seu portal.
            </p>
          </div>

          {errorMsg && (
            <div className={`mb-8 p-4 flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-1 rounded-r-md ${errorMsg.includes('expirou') ? 'bg-orange-50 border-l-4 border-orange-500 text-orange-700' : 'bg-red-50 border-l-4 border-red-500 text-red-700'}`}>
              <AlertCircle size={18} className="shrink-0" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nova Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors border-r border-slate-200 pr-3">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-14 pr-12 bg-slate-50 border-2 border-slate-200 rounded-[5px] outline-none transition-all text-slate-800 font-medium focus:bg-white focus:border-primary placeholder:text-slate-300"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirmar Nova Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors border-r border-slate-200 pr-3">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-14 pl-14 pr-12 bg-slate-50 border-2 border-slate-200 rounded-[5px] outline-none transition-all text-slate-800 font-medium focus:bg-white focus:border-primary placeholder:text-slate-300"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-primary text-white rounded-[5px] font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/30 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  "Guardar Nova Password"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
