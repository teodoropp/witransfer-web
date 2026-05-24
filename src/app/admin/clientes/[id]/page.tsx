/** @format */

"use client";

import React, { use, useState, useEffect } from "react";
import {
  ArrowLeft,
  Edit2,
  User,
  Calendar,
  FileText,
  ShieldAlert,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Clock,
  Compass,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface Reserva {
  id: string;
  codigo: string;
  data_recolha: string;
  hora_recolha: string;
  local_partida: string;
  local_destino: string;
  valor_total: number;
  status: string;
}

interface Cliente {
  id: string;
  nome_completo: string;
  email: string | null;
  telefone: string | null;
  foto_url: string | null;
  data_nascimento: string | null;
  documento_numero: string | null;
  morada: string | null;
  genero: string | null;
  nacionalidade: string | null;
  nif: string | null;
  ativo: boolean;
  criado_em: string;
}

interface ClienteDetalhePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ClienteDetalhePage({ params }: ClienteDetalhePageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const clienteId = resolvedParams.id;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    async function loadClienteData() {
      try {
        setLoading(true);
        // 1. Carregar perfil do cliente
        const { data: p, error: pError } = await supabase
          .from("perfis")
          .select("*")
          .eq("id", clienteId)
          .single();

        if (pError) throw pError;
        setCliente(p);

        // 2. Carregar histórico de reservas do cliente
        const { data: resData, error: rError } = await supabase
          .from("reservas")
          .select("id, codigo, data_recolha, hora_recolha, local_partida, local_destino, valor_total, status")
          .eq("cliente_id", clienteId)
          .order("data_recolha", { ascending: false });

        if (rError) throw rError;
        setReservas(resData || []);
      } catch (err) {
        console.error("Erro ao carregar dados do cliente:", err);
      } finally {
        setLoading(false);
      }
    }

    loadClienteData();
  }, [clienteId]);

  const handleToggleStatus = async () => {
    if (!cliente) return;
    try {
      setToggling(true);
      const newStatus = !cliente.ativo;
      const { error } = await supabase
        .from("perfis")
        .update({ ativo: newStatus })
        .eq("id", cliente.id);

      if (error) throw error;
      setCliente((prev) => (prev ? { ...prev, ativo: newStatus } : null));
    } catch (err) {
      alert("Erro ao atualizar estado de atividade.");
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!cliente) return;
    if (!confirm("Tem a certeza absoluta que deseja eliminar permanentemente este cliente e todo o seu histórico da plataforma?")) return;

    try {
      setToggling(true);
      const { error } = await supabase.from("perfis").delete().eq("id", cliente.id);
      if (error) throw error;
      router.push("/admin/clientes");
    } catch (err) {
      alert("Erro ao eliminar cliente da base de dados.");
    } finally {
      setToggling(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "---";
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-PT", { style: "currency", currency: "AOA" });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-[#902ad1] animate-spin" />
        <p className="text-slate-500 font-semibold text-sm uppercase tracking-widest">
          A carregar ficha do cliente...
        </p>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[10px] border border-slate-100 shadow-sm mx-0 md:mx-[80px]">
        <AlertTriangle className="text-rose-500 mb-4" size={48} />
        <h3 className="text-lg font-semibold text-slate-800">Cliente Não Encontrado</h3>
        <p className="text-slate-400 mt-1 mb-6 text-sm">
          O cliente que procura não existe ou foi removido do sistema.
        </p>
        <Link
          href="/admin/clientes"
          className="bg-[#902ad1] text-white px-6 py-3 rounded-[10px] font-semibold transition-all shadow-md active:scale-95"
        >
          Voltar para Lista
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-3 text-slate-400 hover:text-slate-700 bg-white/80 hover:bg-white rounded-2xl border border-slate-100/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300"
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Link href="/admin/dashboard" className="hover:text-[#902ad1] transition-all">
                Painel
              </Link>
              <span className="text-slate-355 font-medium">/</span>
              <Link href="/admin/clientes" className="hover:text-[#902ad1] transition-all">
                Clientes
              </Link>
              <span className="text-slate-355 font-medium">/</span>
              <span className="text-slate-600 font-bold">Ficha de Cliente</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Ficha do Cliente
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/admin/clientes/${cliente.id}/editar`}
            className="flex items-center gap-2 bg-white/85 hover:bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-2xl font-bold transition-all shadow-sm hover:shadow-md hover:border-slate-300 active:scale-[0.98] text-[11px] uppercase tracking-wider"
          >
            <Edit2 size={13} />
            <span>Editar Informações</span>
          </Link>
        </div>
      </div>

      {/* Bento Grid Assimétrico (12 Colunas) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        
        {/* ── Card 1: Perfil VIP e Status (4 cols) ── */}
        <div className="md:col-span-4 bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#902ad1]/20 transition-all duration-300 p-8 flex flex-col justify-between h-full relative overflow-hidden text-center">
          {/* Badge de Status Superior */}
          <div className="absolute top-6 right-6">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                cliente.ativo
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200/60"
                  : "bg-rose-50 text-rose-600 border-rose-200/60"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${cliente.ativo ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              {cliente.ativo ? "Ativo" : "Suspenso"}
            </span>
          </div>

          <div className="pt-4">
            {/* Foto de Perfil / Iniciais */}
            <div className="relative w-28 h-28 rounded-3xl overflow-hidden border-4 border-[#902ad1]/10 mx-auto bg-gradient-to-br from-[#902ad1]/15 to-[#902ad1]/5 flex items-center justify-center mb-5 shadow-inner">
              {cliente.foto_url ? (
                <Image src={cliente.foto_url} alt={cliente.nome_completo} fill className="object-cover animate-in fade-in duration-300" />
              ) : (
                <User size={48} className="text-[#902ad1] opacity-80" />
              )}
            </div>

            <h2 className="text-xl font-black text-slate-800 leading-tight tracking-tight px-2 truncate" title={cliente.nome_completo}>
              {cliente.nome_completo}
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-[#902ad1] uppercase tracking-wider mt-2 bg-purple-50 border border-purple-200/40">
              Utilizador Oficial
            </span>
          </div>

          {/* Separador */}
          <div className="h-px bg-slate-100 my-6" />

          <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
            <span>Membro desde:</span>
            <span className="text-slate-600 font-extrabold">{formatDate(cliente.criado_em)}</span>
          </div>
        </div>

        {/* ── Card 2: Informações de Contacto (8 cols) ── */}
        <div className="md:col-span-8 bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#902ad1]/20 transition-all duration-300 p-8 flex flex-col justify-between h-full relative overflow-hidden">
          {/* Badge Superior */}
          <div className="absolute top-6 right-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-[#902ad1] border border-purple-200/60 shadow-sm">
              <Mail size={10} />
              CRM Integrado
            </span>
          </div>

          <div>
            {/* Header */}
            <div className="mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Canais de Comunicação</span>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Contacto & Residência</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-1.5">Meios corporativos para contato e geolocalização</p>
            </div>

            {/* Separador */}
            <div className="h-px bg-slate-100 my-4" />

            {/* Sub-grid de Contacto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 my-5">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-200/20">
                  <Phone size={14} className="text-[#902ad1]" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Telefone Principal</span>
                  <p className="text-[13px] font-extrabold text-slate-700">
                    {cliente.telefone || "Nenhum telefone registado"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-200/20">
                  <Mail size={14} className="text-[#902ad1]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Endereço de E-mail</span>
                  <p className="text-[13px] font-extrabold text-slate-700 break-all truncate" title={cliente.email || ""}>
                    {cliente.email || "Nenhum e-mail registado"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 sm:col-span-2">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-200/20">
                  <MapPin size={14} className="text-[#902ad1]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Morada de Residência</span>
                  <p className="text-[13px] font-extrabold text-slate-700 truncate" title={cliente.morada || ""}>
                    {cliente.morada || "Sem residência registada no sistema"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-5 border-t border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Última atualização de dados sincronizada via Cloud</span>
          </div>
        </div>

        {/* ── Card 3: Indicadores e Métricas Rápidas (8 cols) ── */}
        <div className="md:col-span-8 bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#902ad1]/20 transition-all duration-300 p-8 flex flex-col justify-between h-full relative overflow-hidden">
          {/* Badge Superior */}
          <div className="absolute top-6 right-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-sm">
              <Compass size={10} />
              Métricas Operacionais
            </span>
          </div>

          <div>
            {/* Header */}
            <div className="mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Desempenho Comercial</span>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">KPIs & Finanças</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-1.5">Resumo consolidado do volume de gastos e serviços</p>
            </div>

            {/* Separador */}
            <div className="h-px bg-slate-100 my-4" />

            {/* Grid de Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 my-5">
              <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-4 hover:bg-slate-50 transition-colors duration-250">
                <div className="p-3 bg-[#902ad1]/5 text-[#902ad1] rounded-xl shrink-0">
                  <Clock size={16} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Reservas</span>
                  <span className="text-base font-extrabold text-slate-700">{reservas.length}</span>
                </div>
              </div>

              <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-4 hover:bg-slate-50 transition-colors duration-250 sm:col-span-2">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                  <Compass size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Faturamento Consolidado</span>
                  <span className="text-base font-extrabold text-[#902ad1] truncate block" title={formatCurrency(reservas.reduce((acc, curr) => acc + curr.valor_total, 0))}>
                    {formatCurrency(reservas.reduce((acc, curr) => acc + curr.valor_total, 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Categoria de Conta</span>
            <span className="text-slate-700 font-extrabold">{cliente.ativo ? "Ativa & Verificada" : "Bloqueada"}</span>
          </div>
        </div>

        {/* ── Card 4: Documentação Legal & NIF (4 cols) ── */}
        <div className="md:col-span-4 bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#902ad1]/20 transition-all duration-300 p-8 flex flex-col justify-between h-full relative overflow-hidden">
          {/* Badge Superior */}
          <div className="absolute top-6 right-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-[#902ad1] border border-purple-200/60 shadow-sm">
              <FileText size={10} />
              Identificação
            </span>
          </div>

          <div>
            {/* Header */}
            <div className="mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Legal e Tributário</span>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Documentos</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-1.5">Informações de registo legal do cliente</p>
            </div>

            {/* Separador */}
            <div className="h-px bg-slate-100 my-4" />

            {/* Detalhes de ID */}
            <div className="space-y-4 my-5">
              <div className="flex items-center justify-between py-1.5 border-b border-dashed border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">NIF</span>
                <span className="text-[12.5px] font-extrabold text-slate-700">{cliente.nif || "---"}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-dashed border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Documento (BI/Passaporte)</span>
                <span className="text-[12.5px] font-extrabold text-slate-700">{cliente.documento_numero || "---"}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-dashed border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nacionalidade</span>
                <span className="text-[12.5px] font-extrabold text-slate-700">{cliente.nacionalidade || "---"}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-5 border-t border-slate-100 flex items-center justify-center text-[10px] font-bold text-[#902ad1] uppercase tracking-wider">
            <span>Registo Centralizado</span>
          </div>
        </div>

        {/* ── Card 5: Histórico de Reservas & Viagens (8 cols) ── */}
        <div className="md:col-span-8 bg-white/80 backdrop-blur-sm rounded-[24px] border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-[#902ad1]/20 transition-all duration-300 p-8 flex flex-col justify-between h-full relative overflow-hidden">
          {/* Badge Superior */}
          <div className="absolute top-6 right-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-[#902ad1] border border-purple-200/60 shadow-sm">
              <Calendar size={10} />
              Histórico
            </span>
          </div>

          <div>
            {/* Header */}
            <div className="mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Rastreabilidade Operacional</span>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Reservas & Viagens</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-1.5">Histórico completo de transações e trajetos realizados</p>
            </div>

            {/* Separador */}
            <div className="h-px bg-slate-100 my-4" />

            {/* Tabela de Viagens */}
            <div className="my-5">
              {reservas.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                        <th className="py-3 px-4">Código</th>
                        <th className="py-3 px-4">Data & Hora</th>
                        <th className="py-3 px-4">Trajeto Principal</th>
                        <th className="py-3 px-4">Valor Total</th>
                        <th className="py-3 px-4 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {reservas.map((r) => (
                        <tr key={r.id} className="text-[12px] font-bold text-slate-700 hover:bg-slate-50/50 hover:shadow-[inset_4px_0_0_0_#902ad1] transition-all duration-200">
                          <td className="py-3.5 px-4 text-[#902ad1] font-extrabold">
                            {r.codigo}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="block">{formatDate(r.data_recolha)}</span>
                            <span className="text-[9.5px] text-slate-400 font-medium">{r.hora_recolha}</span>
                          </td>
                          <td className="py-3.5 px-4 truncate max-w-[200px]" title={`${r.local_partida} → ${r.local_destino}`}>
                            {r.local_partida} → {r.local_destino}
                          </td>
                          <td className="py-3.5 px-4 font-extrabold text-slate-800">
                            {formatCurrency(r.valor_total)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                r.status === "concluido" || r.status === "concluida"
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                                  : r.status === "cancelada"
                                  ? "bg-rose-50 text-rose-600 border-rose-100/50"
                                  : "bg-amber-50 text-amber-600 border-amber-100/50"
                              }`}
                            >
                              {r.status === "concluido" || r.status === "concluida" ? "Concluída" : r.status === "cancelada" ? "Cancelada" : r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-xs text-slate-400 font-bold italic">
                    Este cliente ainda não efetuou qualquer reserva na plataforma.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Volume Total</span>
            <span className="text-slate-450 font-extrabold">{reservas.length} serviços registados</span>
          </div>
        </div>

        {/* ── Card 6: Administração & Segurança (4 cols) ── */}
        <div className="md:col-span-4 bg-white/80 backdrop-blur-sm rounded-[24px] border border-rose-100/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-rose-300 transition-all duration-300 p-8 flex flex-col justify-between h-full relative overflow-hidden">
          {/* Badge Superior */}
          <div className="absolute top-6 right-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200/60 shadow-sm">
              <ShieldAlert size={10} />
              Controle Crítico
            </span>
          </div>

          <div>
            {/* Header */}
            <div className="mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Zona Administrativa</span>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Segurança</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-1.5">Painel destrutivo e controle de bloqueio</p>
            </div>

            {/* Separador */}
            <div className="h-px bg-slate-100 my-4" />

            {/* Alerta de Segurança */}
            <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 flex flex-col gap-2.5 my-5">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle size={15} />
                <span className="text-[10.5px] font-bold uppercase tracking-wider">Atenção Crítica</span>
              </div>
              <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed">
                Alterações nesta secção afetam o acesso direto do utilizador à sua conta. A eliminação é irreversível e apagará o histórico da base de dados.
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="space-y-3 mt-6">
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={toggling}
              className={`w-full py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border flex items-center justify-center gap-2 active:scale-[0.98] ${
                cliente.ativo
                  ? "bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border-rose-200"
                  : "bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border-emerald-200"
              }`}
            >
              {cliente.ativo ? "Suspender Acesso" : "Reativar Acesso"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={toggling}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              Eliminar Cliente
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
