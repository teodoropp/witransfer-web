/** @format */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Check,
  ChevronRight,
  Building2,
  User,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

const STEPS = [
  { id: 0, label: "Empresa", icon: Building2 },
  { id: 1, label: "Responsável", icon: User },
  { id: 2, label: "Acesso", icon: Lock },
];

export default function RegistoParceiroPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    nomeEmpresa: "",
    nif: "",
    telefone: "",
    website: "",
    provincia: "Luanda",
    municipio: "",
    morada: "",
    areaAtividade: "Transporte",
    objetivo: "Parceria WiTransfer",
    nomeResponsavel: "",
    cargo: "Diretor",
    emailResponsavel: "",
    telefoneResponsavel: "",
    email: "",
    password: "",
    confirmarPassword: "",
    aceitouTermos: false,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const handleNext = () => {
    if (step === 0) {
      if (!form.nomeEmpresa || !form.nif || !form.telefone) {
        setErrorMsg(
          "Por favor, preencha todos os campos obrigatórios da empresa.",
        );
        return;
      }
    } else if (step === 1) {
      if (!form.nomeResponsavel || !form.emailResponsavel) {
        setErrorMsg("Por favor, preencha os dados do responsável.");
        return;
      }
    }
    setErrorMsg(null);
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else router.back();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.aceitouTermos) {
      setErrorMsg("Deve aceitar os termos e condições.");
      return;
    }
    if (form.password !== form.confirmarPassword) {
      setErrorMsg("As passwords não coincidem.");
      return;
    }
    if (form.password.length < 6) {
      setErrorMsg("A password deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. SignUp
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            nome_completo: form.nomeEmpresa.trim(),
            telefone: form.telefone.trim(),
            tipo: "parceiro",
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("Erro ao criar utilizador.");

      const userId = data.user.id;

      // 2. Garantir que o perfil existe (fallback se o trigger falhar)
      await new Promise((resolve) => setTimeout(resolve, 800));

      const { data: perfilExistente } = await supabase
        .from("perfis")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (!perfilExistente) {
        await supabase.from("perfis").insert([
          {
            id: userId,
            email: form.email.trim(),
            nome_completo: form.nomeEmpresa.trim(),
            telefone: form.telefone.trim(),
            tipo: "parceiro",
            ativo: false,
          },
        ]);
      } else {
        await supabase.from("perfis").update({ ativo: false }).eq("id", userId);
      }

      // 3. Criar registro de parceiro
      const { error: parceiroError } = await supabase.from("parceiros").insert({
        id: userId,
        nome: form.nomeEmpresa.trim(),
        nif: form.nif.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim(),
        website: form.website,
        provincia: form.provincia,
        municipio: form.municipio,
        endereco: form.morada,
        area_atividade: form.areaAtividade,
        objetivo_parceria: form.objetivo,
        responsavel_nome: form.nomeResponsavel.trim(),
        responsavel_cargo: form.cargo,
        responsavel_email: form.emailResponsavel.trim(),
        responsavel_telefone: form.telefoneResponsavel.trim(),
        status_aprovacao: "pendente",
        ativo: false,
        usuario_id: userId,
      });

      if (parceiroError) throw parceiroError;

      // 4. Notificação
      await supabase.from("notificacoes").insert([
        {
          titulo: "Nova Solicitação de Parceiro",
          mensagem: `A empresa ${form.nomeEmpresa} solicitou adesão como parceiro via Web.`,
          tipo: "solicitacao_parceiro",
          data_referencia_id: userId,
        },
      ]);

      setSuccess(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMsg(err.message || "Ocorreu um erro ao processar o seu registo.");
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
            Candidatura Enviada!
          </h2>
          <p className="text-slate-500 mb-10 leading-relaxed font-medium">
            Obrigado por se juntar à WiTransfer. A sua candidatura foi recebida
            e será analisada. Receberá um email assim que for aprovada.
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
          <h2 className="text-4xl font-bold mb-8 tracking-tight leading-tight">
            Torne-se nosso parceiro
          </h2>

          <div className="space-y-10">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div key={s.id} className="flex items-center gap-6 group">
                  <div
                    className={`
                    w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-500
                    ${isActive ? "bg-white text-primary border-white scale-110 shadow-xl" : ""}
                    ${isDone ? "bg-green-400 text-white border-green-400" : ""}
                    ${!isActive && !isDone ? "border-white/30 text-white/60" : ""}
                  `}>
                    {isDone ? <Check size={28} /> : <Icon size={24} />}
                  </div>
                  <div className="transition-all duration-300">
                    <p
                      className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${isActive ? "text-white" : "text-white/40"}`}>
                      Passo {s.id + 1}
                    </p>
                    <p
                      className={`text-xl font-bold ${isActive ? "text-white" : "text-white/60"}`}>
                      {s.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-16 pt-8 border-t border-white/10">
            <p className="text-sm text-primary-foreground/60 leading-relaxed font-medium">
              Gestão de frota simplificada, relatórios detalhados e pagamentos
              pontuais. Junte-se à maior rede de transporte corporativo.
            </p>
          </div>
        </div>
      </div>

      {/* Painel Direito (Formulário) */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-24 bg-white relative">
        <div className="w-full max-w-sm">
          {/* Header Mobile / Voltar */}
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
              {STEPS[step].label}
            </h2>
            <p className="text-slate-400 font-medium">
              {step === 0 && "Dados básicos da sua organização."}
              {step === 1 && "Quem será o nosso ponto de contacto."}
              {step === 2 && "Defina as suas credenciais de acesso."}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 text-red-700 text-sm animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={18} className="shrink-0" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Nome da Empresa
                  </label>
                  <input
                    name="nomeEmpresa"
                    value={form.nomeEmpresa}
                    onChange={handleChange}
                    className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-200 rounded-[5px] outline-none transition-all text-slate-800 font-medium focus:bg-white focus:border-primary placeholder:text-slate-300"
                    placeholder="WiTransfer Lda"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      NIF
                    </label>
                    <input
                      name="nif"
                      value={form.nif}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-200 rounded-[5px] outline-none transition-all text-slate-800 font-medium focus:bg-white focus:border-primary placeholder:text-slate-300"
                      placeholder="000000000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Telefone
                    </label>
                    <input
                      name="telefone"
                      type="tel"
                      value={form.telefone}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-200 rounded-[5px] outline-none transition-all text-slate-800 font-medium focus:bg-white focus:border-primary placeholder:text-slate-300"
                      placeholder="9xx xxx xxx"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Morada Sede
                  </label>
                  <textarea
                    name="morada"
                    value={form.morada}
                    onChange={handleChange}
                    rows={2}
                    className="w-full h-14 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-[5px] outline-none transition-all text-slate-800 font-medium focus:bg-white focus:border-primary resize-none placeholder:text-slate-300"
                    placeholder="Rua, Bairro, Cidade"
                    required
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Nome do Responsável
                  </label>
                  <input
                    name="nomeResponsavel"
                    value={form.nomeResponsavel}
                    onChange={handleChange}
                    className="w-full h-14 px-4 bg-slate-50 border-2 border-slate-200 rounded-[5px] outline-none transition-all text-slate-800 font-medium focus:bg-white focus:border-primary"
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Email Profissional
                  </label>
                  <input
                    name="emailResponsavel"
                    type="email"
                    value={form.emailResponsavel}
                    onChange={handleChange}
                    className="w-full h-14 px-4 bg-slate-50 border-2 border-slate-200 rounded-[5px] outline-none transition-all text-slate-800 font-medium focus:bg-white focus:border-primary"
                    placeholder="email@empresa.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Telefone Directo
                  </label>
                  <input
                    name="telefoneResponsavel"
                    type="tel"
                    value={form.telefoneResponsavel}
                    onChange={handleChange}
                    className="w-full h-14 px-4 bg-slate-50 border-2 border-slate-200 rounded-[5px] outline-none transition-all text-slate-800 font-medium focus:bg-white focus:border-primary"
                    placeholder="9xx xxx xxx"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Email de Login
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full h-14 px-4 bg-slate-50 border-2 border-slate-200 rounded-[5px] outline-none transition-all text-slate-800 font-medium focus:bg-white focus:border-primary"
                    placeholder="admin@empresa.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full h-14 px-4 bg-slate-50 border-2 border-slate-200 rounded-[5px] outline-none transition-all text-slate-800 font-medium focus:bg-white focus:border-primary"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="pt-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      name="aceitouTermos"
                      type="checkbox"
                      checked={form.aceitouTermos}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div
                      className={`
                      w-5 h-5 rounded border-2 transition-all flex items-center justify-center mt-0.5
                      ${form.aceitouTermos ? "bg-primary border-primary" : "bg-slate-50 border-slate-300 group-hover:border-primary"}
                    `}>
                      {form.aceitouTermos && (
                        <Check
                          size={14}
                          className="text-white"
                          strokeWidth={4}
                        />
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-medium leading-relaxed">
                      Concordo com os{" "}
                      <a
                        href="#"
                        className="text-primary font-bold hover:underline">
                        Termos e Condições
                      </a>{" "}
                      e a{" "}
                      <a
                        href="#"
                        className="text-primary font-bold hover:underline">
                        Política de Privacidade
                      </a>
                      .
                    </span>
                  </label>
                </div>
              </div>
            )}

            <div className="pt-10 flex gap-4">
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 h-14 bg-white border-2 border-slate-200 text-slate-600 rounded-[5px] font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all">
                  Anterior
                </button>
              )}
              <button
                type={step === 2 ? "submit" : "button"}
                onClick={step === 2 ? undefined : handleNext}
                disabled={loading}
                className={`
                  h-14 bg-primary text-white rounded-[5px] font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/30 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2
                  ${step === 0 ? "w-full" : "flex-1"}
                  disabled:opacity-70
                `}>
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {step === 2 ? "Finalizar Registo" : "Próximo Passo"}
                    {step < 2 && <ChevronRight size={18} />}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-12 text-center">
            <p className="text-sm text-slate-400 font-medium">
              Já tem conta?{" "}
              <a
                href="/login"
                className="font-bold text-primary hover:underline underline-offset-4">
                Fazer Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
