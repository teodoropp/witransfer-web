/** @format */

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Building2, ArrowLeft, QrCode } from "lucide-react";

export default function RegistoParceiroPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans bg-white overflow-hidden text-slate-800">
      {/* Lado Esquerdo: Painel de Marca */}
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
          <h2 className="text-4xl font-bold mb-6 tracking-tight leading-tight">
            Torne-se nosso parceiro
          </h2>
          <p className="text-lg text-primary-foreground/70 font-medium leading-relaxed mb-8">
            Faça a gestão da sua frota de transporte corporativo de forma profissional, com relatórios em tempo real e total transparência.
          </p>
          <div className="pt-8 border-t border-white/10">
            <p className="text-sm text-primary-foreground/60 leading-relaxed font-medium">
              Junte-se à rede líder de mobilidade executiva. Tudo na ponta dos seus dedos.
            </p>
          </div>
        </div>
      </div>

      {/* Lado Direito: Mensagem de Registo Exclusivo na App */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-24 bg-white relative">
        {/* Botão de Voltar para o Site */}
        <button
          onClick={() => (window.location.href = "https://www.witransfer.org")}
          className="absolute top-6 left-6 lg:top-8 lg:left-8 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#902ad1] transition-all"
        >
          <ArrowLeft size={16} />
          <span>Voltar para o site</span>
        </button>

        <div className="w-full max-w-sm flex flex-col items-center text-center">
          <div className="lg:hidden mb-8">
            <Image
              src="/logo.png"
              alt="WiTransfer"
              width={160}
              height={50}
              className="object-contain"
              style={{ height: "auto" }}
            />
          </div>

          {/* Ícone Redondo */}
          <div className="w-16 h-16 bg-[#902ad1]/10 text-[#902ad1] rounded-full flex items-center justify-center mb-6">
            <Building2 size={30} />
          </div>

          <h2 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">
            Registo de Parceiros
          </h2>

          <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
            Por motivos de segurança e facilidade na validação de documentos, a criação de contas de parceiros WiTransfer é efetuada **exclusivamente através da nossa aplicação móvel**.
          </p>

          {/* QR Code Container */}
          <div className="w-full bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 mb-6 flex flex-col items-center justify-center shadow-inner group hover:scale-[1.02] transition-all duration-300">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://www.witransfer.org/witransfer.apk"
              alt="QR Code de Download"
              className="w-44 h-44 object-contain rounded-lg"
            />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 flex items-center gap-2">
              <QrCode size={14} />
              Aponte a câmara do telemóvel
            </span>
          </div>

          {/* Botão de Download Direto (Mobile fallback) */}
          <a
            href="https://www.witransfer.org/witransfer.apk"
            className="text-xs font-bold text-[#902ad1] hover:underline mb-8 block"
          >
            Está no telemóvel? Descarregue o APK diretamente aqui
          </a>

          {/* Botões de Ação Secundários */}
          <div className="w-full space-y-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => router.push("/login")}
              className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[5px] font-bold uppercase tracking-widest text-[10px] transition-all"
            >
              Fazer Login no Portal
            </button>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Disponível para Android
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
