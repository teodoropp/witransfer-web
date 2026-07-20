/** @format */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Check,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const PROVINCIAS = [
  "Luanda",
  "Bengo",
  "Benguela",
  "Bié",
  "Cabinda",
  "Cuando Cubango",
  "Cuanza Norte",
  "Cuanza Sul",
  "Cunene",
  "Huambo",
  "Huíla",
  "Lunda Norte",
  "Lunda Sul",
  "Malanje",
  "Moxico",
  "Namibe",
  "Uíge",
  "Zaire",
];

export default function RegistoParceiroPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // --- Form State ---
  // Etapa 1: Empresa
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [nif, setNif] = useState("");
  const [telefone, setTelefone] = useState("");
  const [morada, setMorada] = useState("");
  const [provincia, setProvincia] = useState("Luanda");
  const [municipio, setMunicipio] = useState("");

  // Etapa 2: Responsável
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [cargo, setCargo] = useState("");
  const [emailResponsavel, setEmailResponsavel] = useState("");
  const [telefoneResponsavel, setTelefoneResponsavel] = useState("");

  // Etapa 3: Acesso
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);

  // --- Handlers ---
  const handleNext = () => {
    setErrorMsg(null);

    if (step === 0) {
      if (!nomeEmpresa.trim()) {
        setErrorMsg("Por favor, introduza o nome da empresa.");
        return;
      }
      if (!nif.trim()) {
        setErrorMsg("Por favor, introduza o NIF da empresa.");
        return;
      }
      if (!telefone.trim()) {
        setErrorMsg("Por favor, introduza o número de telefone.");
        return;
      }
      if (!morada.trim()) {
        setErrorMsg("Por favor, introduza o endereço.");
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (!nomeResponsavel.trim()) {
        setErrorMsg("Por favor, introduza o nome do responsável.");
        return;
      }
      if (!cargo.trim()) {
        setErrorMsg("Por favor, introduza o cargo do responsável.");
        return;
      }
      if (!emailResponsavel.trim() || !emailResponsavel.includes("@")) {
        setErrorMsg("Por favor, introduza um e-mail do responsável válido.");
        return;
      }
      if (!telefoneResponsavel.trim()) {
        setErrorMsg("Por favor, introduza o telefone do responsável.");
        return;
      }
      setStep(2);
    }
  };

  const handlePrev = () => {
    setErrorMsg(null);
    if (step > 0) {
      setStep(step - 1);
    } else {
      router.push("/login");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validações do último passo
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Por favor, introduza um e-mail de login válido.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmarPassword) {
      setErrorMsg("As palavras-passe não coincidem.");
      return;
    }
    if (!aceitouTermos) {
      setErrorMsg("É necessário aceitar os Termos e Condições para continuar.");
      return;
    }

    setLoading(true);

    try {
      // 1. Criar utilizador de autenticação no Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nome_completo: nomeEmpresa.trim(),
            telefone: telefone.trim(),
            tipo: "parceiro",
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!data.user) {
        throw new Error("Não foi possível criar o utilizador de parceiro.");
      }

      const userId = data.user.id;

      // 2. Criar ou atualizar perfil na tabela "perfis"
      // Aguardar uma fração para o trigger processar
      await new Promise((resolve) => setTimeout(resolve, 800));

      const { data: perfilExistente } = await supabase
        .from("perfis")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (!perfilExistente) {
        const { error: perfilError } = await supabase.from("perfis").insert([
          {
            id: userId,
            email: email.trim(),
            nome_completo: nomeEmpresa.trim(),
            telefone: telefone.trim(),
            tipo: "parceiro",
            ativo: false,
          },
        ]);
        if (perfilError) throw perfilError;
      } else {
        const { error: perfilUpdateError } = await supabase
          .from("perfis")
          .update({ ativo: false })
          .eq("id", userId);
        if (perfilUpdateError) throw perfilUpdateError;
      }

      // 3. Criar registro na tabela "parceiros"
      const { error: parceiroError } = await supabase.from("parceiros").insert({
        id: userId,
        nome: nomeEmpresa.trim(),
        nif: nif.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        website: "", // Opcional
        provincia: provincia,
        municipio: municipio.trim() || null,
        endereco: morada.trim(),
        area_atividade: "Transporte", // Padrão
        objetivo_parceria: "Colaboração", // Padrão
        responsavel_nome: nomeResponsavel.trim(),
        responsavel_cargo: cargo.trim(),
        responsavel_email: emailResponsavel.trim(),
        responsavel_telefone: telefoneResponsavel.trim(),
        status_aprovacao: "pendente",
        ativo: false,
        usuario_id: userId,
      });

      if (parceiroError) {
        throw parceiroError;
      }

      // 4. Criar notificação para o Admin (Operação de aviso e não crítica)
      try {
        const { error: notifError } = await supabase.from("notificacoes").insert([
          {
            titulo: "Nova Solicitação de Parceiro",
            mensagem: `A empresa ${nomeEmpresa} solicitou adesão como parceiro.`,
            tipo: "info",
            dados: { parceiro_id: userId },
          },
        ]);
        if (notifError) {
          console.warn("Erro ao criar notificação do Admin (não crítico):", notifError.message);
        }
      } catch (notifErr) {
        console.warn("Erro ao enviar notificação para o admin (não crítico):", notifErr);
      }

      setSuccess(true);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("SignUp Error:", err);
      setErrorMsg(
        error.message === "User already registered"
          ? "Este e-mail de login já se encontra registado no sistema."
          : error.message || "Ocorreu um erro ao submeter a sua candidatura.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F1E9F7] text-slate-800 font-sans flex flex-col lg:flex-row overflow-hidden lg:h-screen select-none">
      {/* Painel Esquerdo: Imagem da Candidatura e Mensagem */}
      <div className="hidden lg:flex lg:w-1/2 relative h-full flex flex-col items-center justify-center p-12 overflow-hidden bg-slate-900 select-none animate-in fade-in slide-in-from-left-6 duration-700">
        <Image
          src="/imagem/Gemini_Generated_Image_56njvn56njvn56nj.png"
          alt="Torne-se Parceiro da WiTransfer"
          fill
          className="object-cover opacity-85 transition-transform duration-[12000ms] hover:scale-[1.08]"
          priority
        />
        <div className="absolute inset-0 bg-black/10 z-0 pointer-events-none" />

        {/* Texto sobreposto na imagem (centralizado no meio) */}
        <div className="relative z-10 text-center max-w-lg flex flex-col items-center justify-center -translate-y-16">
          <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-[#1E1B4B] mb-3">
            Torne-se <br />
            Parceiro da <br />
            WiTransfer
          </h1>
          <p className="text-[#1E1B4B] font-bold text-sm mt-4 opacity-90">
            Colabore e cresça connosco
          </p>
        </div>
      </div>

      {/* Painel Direito: Cartão de Cadastro por Etapas */}
      <div className="flex-1 flex flex-col justify-center items-center p-3 lg:p-4 relative min-h-screen lg:h-full lg:overflow-hidden overflow-y-auto animate-in fade-in slide-in-from-right-6 duration-700">
        {/* Botão de Voltar no topo - Posicionado Absoluto */}
        <div className="absolute top-4 left-6 lg:top-6 lg:left-8 z-20">
          <button
            onClick={handlePrev}
            className="flex items-center gap-2 text-sm font-semibold text-slate-550 hover:text-[#902AD1] transition-all cursor-pointer bg-transparent border-none">
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </button>
        </div>

        {/* Card Centrado */}
        <div className="flex items-center justify-center w-full py-4 z-10">
          <div
            className="w-full max-w-[420px] rounded-[24px] border border-white/20 p-5 lg:p-6 relative overflow-hidden transition-all duration-300 shrink-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.35) 10%, rgba(255, 255, 255, 0) 50%), rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              boxShadow:
                "0 20px 40px -12px rgba(144, 42, 209, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.4)",
            }}>
            {/* Logo do WiTransfer */}
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-full bg-[#490977] flex items-center justify-center shadow-lg shadow-[#490977]/20 select-none relative overflow-hidden transition-transform duration-500 hover:scale-105">
                <Image
                  src="/imagem/icone_white.png"
                  alt="WiTransfer Badge Logo"
                  width={26}
                  height={26}
                  className="object-contain"
                />
              </div>
            </div>

            {!success ? (
              <>
                {/* Título de Cadastro */}
                <h2 className="text-center text-base font-bold text-slate-800 mb-1.5 tracking-tight">
                  <span className="relative pb-0.5">
                    Cadastre
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#902AD1]" />
                  </span>
                  -se
                </h2>

                {/* Barra de Progresso / Stepper */}
                <div className="flex items-center justify-center gap-1.5 mt-2.5 mb-4">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      step >= 0 ? "w-8 bg-[#902AD1]" : "w-2 bg-slate-300/60"
                    }`}
                  />
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      step >= 1 ? "w-8 bg-[#902AD1]" : "w-2 bg-slate-300/60"
                    }`}
                  />
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      step >= 2 ? "w-8 bg-[#902AD1]" : "w-2 bg-slate-300/60"
                    }`}
                  />
                </div>

                {/* Mensagem de Erro */}
                {errorMsg && (
                  <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-red-750 text-[11px] animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <p className="font-semibold leading-normal">{errorMsg}</p>
                  </div>
                )}

                {/* Formulário com as 3 Etapas */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* ETAPA 1: Dados da Empresa */}
                  {step === 0 && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      {/* Nome da Empresa */}
                      <div className="space-y-0.5">
                        <label className="text-[11px] font-semibold text-slate-600 pl-1">
                          Nome da Empresa
                        </label>
                        <input
                          type="text"
                          value={nomeEmpresa}
                          onChange={(e) => setNomeEmpresa(e.target.value)}
                          className="w-full h-9 px-3 bg-white/50 border border-slate-300/80 rounded-[5px] outline-none transition-all text-slate-800 text-xs focus:border-[#902AD1] focus:bg-white focus:ring-1 focus:ring-[#902AD1]/30 placeholder:text-slate-400/70"
                          placeholder="Ex: Witransfer LDA"
                          required
                        />
                      </div>

                      {/* NIF */}
                      <div className="space-y-0.5">
                        <label className="text-[11px] font-semibold text-slate-600 pl-1">
                          NIF
                        </label>
                        <input
                          type="text"
                          value={nif}
                          onChange={(e) => setNif(e.target.value)}
                          className="w-full h-9 px-3 bg-white/50 border border-slate-300/80 rounded-[5px] outline-none transition-all text-slate-800 text-xs focus:border-[#902AD1] focus:bg-white focus:ring-1 focus:ring-[#902AD1]/30 placeholder:text-slate-400/70"
                          placeholder="00000000000"
                          required
                        />
                      </div>

                      {/* Telefone */}
                      <div className="space-y-0.5">
                        <label className="text-[11px] font-semibold text-slate-600 pl-1">
                          Telefone
                        </label>
                        <div className="flex gap-2">
                          <span className="h-9 px-2 bg-white/60 border border-slate-300/80 rounded-[5px] flex items-center justify-center text-slate-800 text-xs font-semibold select-none">
                            +244
                          </span>
                          <input
                            type="tel"
                            value={telefone}
                            onChange={(e) => setTelefone(e.target.value)}
                            className="flex-1 h-9 px-3 bg-white/50 border border-slate-300/80 rounded-[5px] outline-none transition-all text-slate-800 text-xs focus:border-[#902AD1] focus:bg-white focus:ring-1 focus:ring-[#902AD1]/30 placeholder:text-slate-400/70"
                            placeholder="9xxxxxxxxx"
                            required
                          />
                        </div>
                      </div>

                      {/* Endereço */}
                      <div className="space-y-0.5">
                        <label className="text-[11px] font-semibold text-slate-600 pl-1">
                          Endereço
                        </label>
                        <input
                          type="text"
                          value={morada}
                          onChange={(e) => setMorada(e.target.value)}
                          className="w-full h-9 px-3 bg-white/50 border border-slate-300/80 rounded-[5px] outline-none transition-all text-slate-800 text-xs focus:border-[#902AD1] focus:bg-white focus:ring-1 focus:ring-[#902AD1]/30 placeholder:text-slate-400/70"
                          placeholder="Luanda, malange"
                          required
                        />
                      </div>

                      {/* Província e Município */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[11px] font-semibold text-slate-600 pl-1">
                            Província
                          </label>
                          <select
                            value={provincia}
                            onChange={(e) => setProvincia(e.target.value)}
                            className="w-full h-9 px-2 bg-white/60 border border-slate-300/80 rounded-[5px] outline-none text-slate-800 text-xs font-medium focus:border-[#902AD1] cursor-pointer">
                            {PROVINCIAS.map((prov) => (
                              <option key={prov} value={prov}>
                                {prov}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[11px] font-semibold text-slate-600 pl-1">
                            Município
                          </label>
                          <input
                            type="text"
                            value={municipio}
                            onChange={(e) => setMunicipio(e.target.value)}
                            className="w-full h-9 px-3 bg-white/50 border border-slate-300/80 rounded-[5px] outline-none transition-all text-slate-800 text-xs focus:border-[#902AD1] focus:bg-white focus:ring-1 focus:ring-[#902AD1]/30 placeholder:text-slate-400/70"
                            placeholder="Município"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ETAPA 2: Dados do Responsável */}
                  {step === 1 && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      {/* Nome do Responsável */}
                      <div className="space-y-0.5">
                        <label className="text-[11px] font-semibold text-slate-600 pl-1">
                          Nome do Responsável
                        </label>
                        <input
                          type="text"
                          value={nomeResponsavel}
                          onChange={(e) => setNomeResponsavel(e.target.value)}
                          className="w-full h-9 px-3 bg-white/50 border border-slate-300/80 rounded-[5px] outline-none transition-all text-slate-800 text-xs focus:border-[#902AD1] focus:bg-white focus:ring-1 focus:ring-[#902AD1]/30 placeholder:text-slate-400/70"
                          placeholder="Nome completo do Gestor"
                          required
                        />
                      </div>

                      {/* Cargo */}
                      <div className="space-y-0.5">
                        <label className="text-[11px] font-semibold text-slate-600 pl-1">
                          Cargo
                        </label>
                        <input
                          type="text"
                          value={cargo}
                          onChange={(e) => setCargo(e.target.value)}
                          className="w-full h-9 px-3 bg-white/50 border border-slate-300/80 rounded-[5px] outline-none transition-all text-slate-800 text-xs focus:border-[#902AD1] focus:bg-white focus:ring-1 focus:ring-[#902AD1]/30 placeholder:text-slate-400/70"
                          placeholder="Ex: Diretor de Operações"
                          required
                        />
                      </div>

                      {/* E-mail do Responsável */}
                      <div className="space-y-0.5">
                        <label className="text-[11px] font-semibold text-slate-600 pl-1">
                          E-mail do Responsável
                        </label>
                        <input
                          type="email"
                          value={emailResponsavel}
                          onChange={(e) => setEmailResponsavel(e.target.value)}
                          className="w-full h-9 px-3 bg-white/50 border border-slate-300/80 rounded-[5px] outline-none transition-all text-slate-800 text-xs focus:border-[#902AD1] focus:bg-white focus:ring-1 focus:ring-[#902AD1]/30 placeholder:text-slate-400/70"
                          placeholder="gestor@empresa.com"
                          required
                        />
                      </div>

                      {/* Telefone do Responsável */}
                      <div className="space-y-0.5">
                        <label className="text-[11px] font-semibold text-slate-600 pl-1">
                          Telefone do Responsável
                        </label>
                        <div className="flex gap-2">
                          <span className="h-9 px-2 bg-white/60 border border-slate-300/80 rounded-[5px] flex items-center justify-center text-slate-800 text-xs font-semibold select-none">
                            +244
                          </span>
                          <input
                            type="tel"
                            value={telefoneResponsavel}
                            onChange={(e) =>
                              setTelefoneResponsavel(e.target.value)
                            }
                            className="flex-1 h-9 px-3 bg-white/50 border border-slate-300/80 rounded-[5px] outline-none transition-all text-slate-800 text-xs focus:border-[#902AD1] focus:bg-white focus:ring-1 focus:ring-[#902AD1]/30 placeholder:text-slate-400/70"
                            placeholder="9xxxxxxxxx"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ETAPA 3: Acesso ao Portal */}
                  {step === 2 && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      {/* E-mail de Login */}
                      <div className="space-y-0.5">
                        <label className="text-[11px] font-semibold text-slate-600 pl-1">
                          E-mail de Login
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-9 px-3 bg-white/50 border border-slate-300/80 rounded-[5px] outline-none transition-all text-slate-800 text-xs focus:border-[#902AD1] focus:bg-white focus:ring-1 focus:ring-[#902AD1]/30 placeholder:text-slate-400/70"
                          placeholder="exemplo@email.com"
                          required
                        />
                      </div>

                      {/* Palavra-passe */}
                      <div className="space-y-0.5">
                        <label className="text-[11px] font-semibold text-slate-600 pl-1">
                          Palavra-passe
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full h-9 px-3 bg-white/50 border border-slate-300/80 rounded-[5px] outline-none transition-all text-slate-800 text-xs focus:border-[#902AD1] focus:bg-white focus:ring-1 focus:ring-[#902AD1]/30 placeholder:text-slate-400/70"
                          placeholder="Mínimo de 6 caracteres"
                          required
                        />
                      </div>

                      {/* Confirmar Palavra-passe */}
                      <div className="space-y-0.5">
                        <label className="text-[11px] font-semibold text-slate-600 pl-1">
                          Confirmar Palavra-passe
                        </label>
                        <input
                          type="password"
                          value={confirmarPassword}
                          onChange={(e) => setConfirmarPassword(e.target.value)}
                          className="w-full h-9 px-3 bg-white/50 border border-slate-300/80 rounded-[5px] outline-none transition-all text-slate-800 text-xs focus:border-[#902AD1] focus:bg-white focus:ring-1 focus:ring-[#902AD1]/30 placeholder:text-slate-400/70"
                          placeholder="Confirme a sua palavra-passe"
                          required
                        />
                      </div>

                      {/* Termos e Condições Checkbox */}
                      <label className="flex items-start gap-2.5 pt-1 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={aceitouTermos}
                          onChange={(e) => setAceitouTermos(e.target.checked)}
                          className="mt-0.5 rounded border-slate-300 text-[#902AD1] focus:ring-[#902AD1]/30 cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-600 font-medium group-hover:text-slate-800 transition-colors leading-normal">
                          Concordo com os{" "}
                          <strong>Termos e Condições de Parceiro</strong> da
                          WiTransfer.
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Botões de Ação */}
                  <div className="flex items-center justify-between pt-1.5">
                    {step > 0 ? (
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#902AD1] hover:underline cursor-pointer bg-transparent border-none p-1 transition-all">
                        <ArrowLeft size={14} />
                        <span>Anterior</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    {step < 2 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="flex items-center gap-1 text-xs font-bold text-[#902AD1] hover:underline cursor-pointer bg-transparent border-none p-1 transition-all">
                        <span>Seguinte</span>
                        <ArrowRight size={14} />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className="h-9 px-5 bg-[#902AD1] hover:bg-[#7a22b3] active:scale-[0.98] text-white rounded-[5px] font-bold text-xs transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-[#902AD1]/10 cursor-pointer">
                        {loading ? (
                          <Loader2
                            className="animate-spin text-white"
                            size={14}
                          />
                        ) : (
                          "Finalizar Cadastro"
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-4 animate-in fade-in duration-500">
                {/* Ícone de Sucesso */}
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-500/20">
                  <Check size={28} />
                </div>

                {/* Título */}
                <h2 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">
                  Candidatura Submetida!
                </h2>

                {/* Mensagem descritiva */}
                <p className="text-slate-500 text-xs leading-relaxed max-w-[320px] mx-auto mb-6 font-medium">
                  A candidatura de <strong>{nomeEmpresa}</strong> foi enviada
                  para validação. Analisaremos os dados e entraremos em contacto
                  por e-mail em breve.
                </p>

                {/* Botão de Conclusão */}
                <button
                  onClick={() => router.push("/login")}
                  className="w-full h-10 bg-[#902AD1] hover:bg-[#7a22b3] text-white rounded-[5px] font-bold text-sm transition-all flex items-center justify-center cursor-pointer shadow-md shadow-[#902AD1]/10">
                  Voltar ao Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
