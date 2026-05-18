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
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-3 bg-white hover:bg-slate-50 rounded-[10px] border border-slate-100 text-slate-600 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              <Link href="/admin/dashboard" className="hover:text-[#902ad1] transition-all">
                Painel
              </Link>
              <span className="text-slate-300">/</span>
              <Link href="/admin/clientes" className="hover:text-[#902ad1] transition-all">
                Clientes
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">Ficha do Cliente</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
              Ficha de Cliente
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <Link
            href={`/admin/clientes/${cliente.id}/editar`}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-[10px] font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-xs"
          >
            <Edit2 size={14} />
            <span>Editar Informações</span>
          </Link>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mx-0 md:mx-[80px]">
        {/* Lado Esquerdo: Ficha e Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card Principal */}
          <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-[10px] text-[8px] font-bold uppercase tracking-widest border ${
                  cliente.ativo
                    ? "bg-emerald-50 text-emerald-600 border-emerald-150"
                    : "bg-rose-50 text-rose-600 border-rose-150"
                }`}
              >
                {cliente.ativo ? "Ativo" : "Suspenso"}
              </span>
            </div>

            <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-[#902ad1]/10 mx-auto bg-slate-50 flex items-center justify-center mb-4">
              {cliente.foto_url ? (
                <Image src={cliente.foto_url} alt={cliente.nome_completo} fill className="object-cover" />
              ) : (
                <User size={44} className="text-slate-300" />
              )}
            </div>

            <h2 className="text-lg font-bold text-slate-800 leading-tight">
              {cliente.nome_completo}
            </h2>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1 block">
              Utilizador Oficial
            </span>

            <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-slate-50">
              <span className="text-xs text-slate-450 font-medium">
                Registado em: {formatDate(cliente.criado_em)}
              </span>
            </div>
          </div>

          {/* Contacto e Detalhes */}
          <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-semibold text-slate-700 uppercase tracking-widest text-[10px] border-b border-slate-50 pb-3">
              Informações de Contacto
            </h4>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">
                  Telefone Principal
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {cliente.telefone || "Nenhum telefone registado"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">
                  Endereço de E-mail
                </span>
                <span className="text-xs font-semibold text-slate-700 break-all">
                  {cliente.email || "Nenhum e-mail registado"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">
                  Morada de Residência
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {cliente.morada || "Sem residência registada"}
                </span>
              </div>
            </div>
          </div>

          {/* Dados Legais */}
          <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-semibold text-slate-700 uppercase tracking-widest text-[10px] border-b border-slate-50 pb-3">
              Documentação e NIF
            </h4>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">
                  Número de Identificação Fiscal (NIF)
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {cliente.nif || "---"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">
                  Nº Documento (BI / Passaporte)
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {cliente.documento_numero || "---"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">
                  Nacionalidade
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {cliente.nacionalidade || "---"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Métricas, Reservas e Danger Zone */}
        <div className="lg:col-span-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Estatísticas Rápidas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-[10px] border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-[#902ad1]/5 text-[#902ad1] rounded-xl">
                  <Clock size={18} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                    Reservas
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    {reservas.length}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-[10px] border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Compass size={18} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                    Total Gasto
                  </span>
                  <span className="text-sm font-bold text-slate-700 truncate max-w-[120px]">
                    {formatCurrency(reservas.reduce((acc, curr) => acc + curr.valor_total, 0))}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-[10px] border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Calendar size={18} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                    Status Conta
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    {cliente.ativo ? "Ativa" : "Suspensa"}
                  </span>
                </div>
              </div>
            </div>

            {/* Histórico de Reservas */}
            <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm space-y-4">
              <h4 className="font-semibold text-slate-700 uppercase tracking-widest text-[10px] border-b border-slate-50 pb-3">
                Histórico de Reservas & Viagens
              </h4>

              {reservas.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <th className="py-3 px-2">Código</th>
                        <th className="py-3 px-2">Data/Hora</th>
                        <th className="py-3 px-2">Rota</th>
                        <th className="py-3 px-2">Valor</th>
                        <th className="py-3 px-2 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {reservas.map((r) => (
                        <tr key={r.id} className="text-xs font-semibold text-slate-700">
                          <td className="py-3 px-2 text-[#902ad1]">
                            {r.codigo}
                          </td>
                          <td className="py-3 px-2">
                            <span className="block">{formatDate(r.data_recolha)}</span>
                            <span className="text-[9px] text-slate-400 font-medium">{r.hora_recolha}</span>
                          </td>
                          <td className="py-3 px-2 truncate max-w-[200px]" title={`${r.local_partida} → ${r.local_destino}`}>
                            {r.local_partida} → {r.local_destino}
                          </td>
                          <td className="py-3 px-2">
                            {formatCurrency(r.valor_total)}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                                r.status === "concluido" || r.status === "concluida"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : r.status === "cancelada"
                                  ? "bg-rose-50 text-rose-600"
                                  : "bg-amber-50 text-amber-600"
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-[10px] border border-slate-100 text-center">
                  <p className="text-xs text-slate-400 font-medium italic">
                    Este cliente ainda não efetuou qualquer reserva na plataforma.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50/20 p-6 rounded-[10px] border border-red-100 shadow-sm mt-8 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert size={20} />
              <h4 className="font-semibold uppercase tracking-widest text-[10px]">
                Zona de Perigo (Danger Zone)
              </h4>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-[10px] border border-red-50">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Suspender ou Reativar Cliente</span>
                <span className="text-[10px] text-slate-400">
                  Bloquear temporariamente o acesso do cliente ao painel e aplicações de reserva.
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={toggling}
                className={`px-6 py-2.5 rounded-[10px] text-xs font-semibold uppercase tracking-wider transition-all border ${
                  cliente.ativo
                    ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                {cliente.ativo ? "Suspender Acesso" : "Reativar Acesso"}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-[10px] border border-red-50">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Eliminar Registos Permanente</span>
                <span className="text-[10px] text-slate-400">
                  Apaga todos os dados pessoais do cliente da nossa base de dados.
                </span>
              </div>
              <button
                type="button"
                onClick={handleDelete}
                disabled={toggling}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-[10px] text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                Eliminar Cliente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
