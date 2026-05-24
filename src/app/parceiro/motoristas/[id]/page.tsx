/** @format */

"use client";

import React, { use, useState, useEffect } from "react";
import {
  ArrowLeft,
  User,
  Star,
  Car,
  FileText,
  Loader2,
  ExternalLink,
  Activity,
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Clock,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface MotoristaDetalhe {
  id: string;
  perfil_id: string;
  carta_conducao: string | null;
  carta_conducao_url: string | null;
  documento_bi_url: string | null;
  disponivel: boolean;
  total_viagens: number;
  avaliacao_media: number;
  experiencia_anos: number | null;
  status_aprovacao: string | null;
  perfis: {
    id: string;
    nome_completo: string;
    email: string | null;
    telefone: string | null;
    foto_url: string | null;
    ativo: boolean;
  };
  viaturas?: {
    id: string;
    modelo: string;
    marca: string | null;
    matricula: string | null;
    foto_url?: string | null;
  } | null;
}

interface ReservaResumida {
  id: string;
  codigo: string | null;
  status: string;
  data_recolha: string | null;
  valor_total: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  confirmada: {
    label: "Confirmada",
    className: "bg-blue-50 text-blue-600 border-blue-200",
  },
  em_andamento: {
    label: "Em Andamento",
    className: "bg-amber-50 text-amber-600 border-amber-200",
  },
  concluida: {
    label: "Concluída",
    className: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
  cancelada: {
    label: "Cancelada",
    className: "bg-rose-50 text-rose-500 border-rose-200",
  },
};

const formatCurrency = (val: number) =>
  val.toLocaleString("pt-AO", { maximumFractionDigits: 0 }) + " Kz";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

export default function ParceiroMotoristaDetalhePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const motoristaId = resolvedParams.id;

  const [motorista, setMotorista] = useState<MotoristaDetalhe | null>(null);
  const [reservas, setReservas] = useState<ReservaResumida[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function carregarMotorista() {
      try {
        setLoading(true);
        setError(null);

        // Buscar motorista com perfil e viatura
        const { data, error: mError } = await supabase
          .from("motoristas")
          .select(
            "*, perfis!motoristas_perfil_id_fkey(*), viaturas!motoristas_viatura_id_fkey(*)"
          )
          .eq("id", motoristaId)
          .single();

        if (mError) throw mError;
        setMotorista((data as any) || null);

        // Buscar últimas reservas do motorista
        const { data: reservasData } = await supabase
          .from("reservas")
          .select("id, codigo, status, data_recolha, valor_total")
          .eq("motorista_id", motoristaId)
          .order("criado_em", { ascending: false })
          .limit(10);

        setReservas((reservasData as any[]) || []);
      } catch (err: any) {
        console.error("Erro ao carregar motorista:", err);
        setError("Não foi possível carregar a ficha do motorista.");
      } finally {
        setLoading(false);
      }
    }

    carregarMotorista();
  }, [motoristaId]);

  const handleToggleDisponivel = async () => {
    if (!motorista || toggling) return;
    try {
      setToggling(true);
      const novoEstado = !motorista.disponivel;
      const { error } = await supabase
        .from("motoristas")
        .update({ disponivel: novoEstado })
        .eq("id", motorista.id);

      if (error) throw error;
      setMotorista((prev) =>
        prev ? { ...prev, disponivel: novoEstado } : null
      );
    } catch (err) {
      alert("Erro ao atualizar disponibilidade.");
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 size={32} className="animate-spin text-[#902ad1]" />
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
          A carregar ficha do motorista...
        </p>
      </div>
    );
  }

  if (error || !motorista) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-rose-100 shadow-sm">
        <AlertTriangle size={40} className="text-rose-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-700">
          {error || "Motorista não encontrado"}
        </h3>
        <p className="text-sm text-slate-400 font-medium mt-1">
          O motorista pode não existir ou não pertencer ao seu parceiro.
        </p>
        <Link
          href="/parceiro/motoristas"
          className="mt-5 px-6 py-2.5 bg-[#902ad1] text-white rounded-xl text-xs font-semibold hover:bg-[#7b22b8] transition-all"
        >
          Voltar para a Lista
        </Link>
      </div>
    );
  }

  const { perfis: perfil, viaturas: viatura } = motorista;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-3 text-slate-400 hover:text-slate-700 bg-white/80 hover:bg-white rounded-2xl border border-slate-100/80 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              Portal Parceiro /{" "}
              <Link
                href="/parceiro/motoristas"
                className="hover:text-[#902ad1] transition-colors"
              >
                Motoristas
              </Link>{" "}
              / Ficha
            </p>
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight mt-1">
              Ficha do Motorista
            </h1>
          </div>
        </div>

        {/* Toggle Disponibilidade */}
        <button
          onClick={handleToggleDisponivel}
          disabled={toggling}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-sm font-semibold border transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 ${
            motorista.disponivel
              ? "bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white border-emerald-200"
              : "bg-slate-100 hover:bg-slate-500 text-slate-500 hover:text-white border-slate-200"
          }`}
        >
          {toggling ? (
            <Loader2 size={16} className="animate-spin" />
          ) : motorista.disponivel ? (
            <ToggleRight size={18} />
          ) : (
            <ToggleLeft size={18} />
          )}
          {motorista.disponivel ? "Disponível — Tornar Indisponível" : "Indisponível — Tornar Disponível"}
        </button>
      </div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">

        {/* ── Card 1: Perfil do Motorista (4 cols) ── */}
        <div className="md:col-span-4 bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#902ad1]/20 transition-all duration-300 p-8 flex flex-col items-center text-center relative overflow-hidden">
          {/* Status badge */}
          <div className="absolute top-5 right-5">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                perfil.ativo
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200/60"
                  : "bg-rose-50 text-rose-500 border-rose-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${perfil.ativo ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
              />
              {perfil.ativo ? "Ativo" : "Suspenso"}
            </span>
          </div>

          {/* Foto */}
          <div className="relative w-28 h-28 rounded-3xl overflow-hidden bg-gradient-to-br from-[#902ad1]/15 to-[#902ad1]/5 border-4 border-[#902ad1]/10 flex items-center justify-center mt-4 mb-5 shadow-inner">
            {perfil.foto_url ? (
              <Image
                src={perfil.foto_url}
                alt={perfil.nome_completo}
                fill
                className="object-cover"
              />
            ) : (
              <User size={48} className="text-[#902ad1] opacity-70" />
            )}
            {/* Disponibilidade dot */}
            <div
              className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white shadow-sm ${
                motorista.disponivel ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
          </div>

          <h2 className="text-xl font-semibold text-slate-800 leading-tight tracking-tight">
            {perfil.nome_completo}
          </h2>

          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold text-[#902ad1] uppercase tracking-wider mt-2 bg-purple-50 border border-purple-200/40">
            Motorista Parceiro
          </span>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-5 bg-slate-50 py-2.5 px-5 rounded-xl border border-slate-100 shadow-sm">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <span className="text-sm font-semibold text-slate-700">
              {motorista.avaliacao_media?.toFixed(1) || "0.0"}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              ({motorista.total_viagens || 0} Viagens)
            </span>
          </div>

          <div className="h-px bg-slate-100 w-full my-5" />

          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            <span className="text-slate-500">Disponível agora: </span>
            <span
              className={motorista.disponivel ? "text-emerald-600" : "text-slate-500"}
            >
              {motorista.disponivel ? "Sim" : "Não"}
            </span>
          </div>
        </div>

        {/* ── Card 2: Contacto & Documentos (8 cols) ── */}
        <div className="md:col-span-8 bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#902ad1]/20 transition-all duration-300 p-8 flex flex-col gap-6">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1">
              Canais de Comunicação
            </span>
            <h3 className="text-2xl font-semibold text-slate-800 tracking-tight">
              Contacto & Registo
            </h3>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Contactos grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: Phone,
                label: "Telefone",
                value: perfil.telefone || "Não registado",
              },
              {
                icon: Mail,
                label: "Email",
                value: perfil.email || "Não registado",
              },
              {
                icon: FileText,
                label: "Carta de Condução",
                value: motorista.carta_conducao || "Não especificado",
              },
              {
                icon: Activity,
                label: "Experiência",
                value: motorista.experiencia_anos
                  ? `${motorista.experiencia_anos} anos`
                  : "Não especificado",
              },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 border border-purple-200/20 flex items-center justify-center shrink-0">
                  <item.icon size={14} className="text-[#902ad1]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                    {item.label}
                  </span>
                  <p className="text-[13px] font-semibold text-slate-700 truncate">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Documentos */}
          <div className="h-px bg-slate-100" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                label: "Carta de Condução",
                sub: "Ficheiro Profissional",
                url: motorista.carta_conducao_url,
              },
              {
                label: "Bilhete de Identidade",
                sub: "Identificação Pessoal",
                url: motorista.documento_bi_url,
              },
            ].map((doc) => (
              <div
                key={doc.label}
                className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="p-2.5 bg-purple-50 text-[#902ad1] rounded-xl shrink-0">
                    <FileText size={15} />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-semibold text-slate-700 block truncate">
                      {doc.label}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">
                      {doc.sub}
                    </span>
                  </div>
                </div>
                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-white hover:bg-slate-100 text-[#902ad1] rounded-xl shadow-sm border border-slate-200 transition-colors shrink-0"
                    title="Abrir"
                  >
                    <ExternalLink size={13} />
                  </a>
                ) : (
                  <span className="text-[9px] text-slate-400 font-semibold italic shrink-0">
                    Sem anexo
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Card 3: Métricas Operacionais (8 cols) ── */}
        <div className="md:col-span-8 bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#902ad1]/20 transition-all duration-300 p-8 flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-6 right-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-sm">
              <Activity size={10} />
              Operação
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1">
              Indicadores e Performance
            </span>
            <h3 className="text-2xl font-semibold text-slate-800 tracking-tight">
              Métricas Operacionais
            </h3>
          </div>

          <div className="h-px bg-slate-100" />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              {
                icon: Activity,
                color: "bg-[#902ad1]/5 text-[#902ad1]",
                label: "Total Viagens",
                value: String(motorista.total_viagens || 0),
              },
              {
                icon: Star,
                color: "bg-amber-50 text-amber-500",
                label: "Avaliação",
                value: `${motorista.avaliacao_media?.toFixed(1) || "0.0"} / 5.0`,
              },
              {
                icon: CheckCircle,
                color: "bg-emerald-50 text-emerald-600",
                label: "Disponível",
                value: motorista.disponivel ? "Sim" : "Não",
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${metric.color}`}>
                  <metric.icon size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">
                    {metric.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    {metric.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Disponibilidade na Plataforma</span>
            <span
              className={
                motorista.disponivel
                  ? "text-emerald-600 font-semibold"
                  : "text-slate-500 font-semibold"
              }
            >
              {motorista.disponivel ? "Livre para Serviço" : "Ocupado / Offline"}
            </span>
          </div>
        </div>

        {/* ── Card 4: Viatura Atribuída (4 cols) ── */}
        <div className="md:col-span-4 bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#902ad1]/20 transition-all duration-300 p-8 flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-6 right-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-purple-50 text-[#902ad1] border border-purple-200/60 shadow-sm">
              <Car size={10} />
              Frota
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1">
              Viatura Ativa
            </span>
            <h3 className="text-2xl font-semibold text-slate-800 tracking-tight">
              Veículo
            </h3>
          </div>

          <div className="h-px bg-slate-100" />

          {viatura ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3.5 p-3 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="relative w-16 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200/60 shrink-0 flex items-center justify-center">
                  {(viatura as any).foto_url ? (
                    <Image
                      src={(viatura as any).foto_url}
                      alt={viatura.modelo}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Car size={20} className="text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-slate-700 block truncate">
                    {viatura.marca} {viatura.modelo}
                  </span>
                  <span className="inline-block mt-1 bg-yellow-50 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider">
                    {viatura.matricula || "SEM MATRÍCULA"}
                  </span>
                </div>
              </div>

              <Link
                href={`/parceiro/viaturas/${viatura.id}`}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#902ad1] hover:underline uppercase tracking-wider transition-all w-fit"
              >
                <span>Ver Detalhes do Veículo</span>
                <ExternalLink size={11} />
              </Link>
            </div>
          ) : (
            <div className="py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-2">
              <Car size={28} className="text-slate-300 animate-pulse" />
              <p className="text-xs text-slate-400 font-semibold italic">
                Nenhum veículo atribuído
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-center text-[10px] font-semibold text-[#902ad1] uppercase tracking-wider">
            <span>Vinculação Ativa</span>
          </div>
        </div>

        {/* ── Card 5: Últimas Reservas (12 cols) ── */}
        <div className="md:col-span-12 bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#902ad1]/20 transition-all duration-300 p-8 flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-6 right-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200 shadow-sm">
              <Clock size={10} />
              Últimas 10
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1">
              Histórico de Atividade
            </span>
            <h3 className="text-2xl font-semibold text-slate-800 tracking-tight">
              Últimas Reservas
            </h3>
          </div>

          <div className="h-px bg-slate-100" />

          {reservas.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                <Car size={26} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">
                Nenhuma reserva encontrada
              </p>
              <p className="text-xs text-slate-400 font-medium">
                Este motorista ainda não tem reservas registadas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[520px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      Código
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      Data Recolha
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      Valor
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reservas.map((r) => {
                    const badge = STATUS_BADGE[r.status] || {
                      label: r.status,
                      className: "bg-slate-50 text-slate-500 border-slate-200",
                    };
                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/60 hover:shadow-[inset_3px_0_0_0_#902ad1] transition-all duration-200"
                      >
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-semibold text-slate-600">
                            {r.codigo ? `#${r.codigo}` : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                            <Clock size={11} className="text-slate-400" />
                            {formatDate(r.data_recolha)}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-semibold text-[#902ad1]">
                            {formatCurrency(r.valor_total)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Back button ── */}
      <div className="flex items-center justify-start pt-2">
        <Link
          href="/parceiro/motoristas"
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-[#902ad1] transition-colors uppercase tracking-wider"
        >
          <ArrowLeft size={14} />
          <span>Voltar para a lista de motoristas</span>
        </Link>
      </div>
    </div>
  );
}
