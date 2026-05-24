/** @format */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  CalendarRange,
  Search,
  Loader2,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  PlayCircle,
  AlertCircle,
  ChevronRight,
  MapPin,
  Car,
  User,
  Banknote,
  Calendar,
  Hash,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusReserva =
  | "aguarda_pagamento"
  | "pago"
  | "em_andamento"
  | "concluida"
  | "cancelada";

interface Perfil {
  nome_completo: string | null;
}

interface Viatura {
  modelo: string | null;
  matricula: string | null;
}

interface MotoristaInner {
  perfil: Perfil | null;
}

interface Reserva {
  id: string;
  codigo: string | null;
  status: StatusReserva;
  data_recolha: string | null;
  local_partida: string | null;
  local_destino: string | null;
  valor_total: number | null;
  observacoes: string | null;
  cliente: Perfil | null;
  viaturas: Viatura | null;
  motorista: MotoristaInner | null;
}

// ─── Status Config ─────────────────────────────────────────────────────────────

interface StatusConfig {
  label: string;
  icon: React.ElementType;
  pill: string;
  badge: string;
}

const STATUS_CONFIG: Record<StatusReserva, StatusConfig> = {
  aguarda_pagamento: {
    label: "Pendente",
    icon: Clock,
    pill: "bg-amber-100 text-amber-700 border-amber-200",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  pago: {
    label: "Pago",
    icon: CheckCircle2,
    pill: "bg-emerald-100 text-emerald-700 border-emerald-200",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  em_andamento: {
    label: "Em Curso",
    icon: PlayCircle,
    pill: "bg-blue-100 text-blue-700 border-blue-200",
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  concluida: {
    label: "Concluída",
    icon: CheckCircle2,
    pill: "bg-slate-100 text-slate-600 border-slate-200",
    badge: "bg-slate-50 text-slate-600 border border-slate-200",
  },
  cancelada: {
    label: "Cancelada",
    icon: XCircle,
    pill: "bg-rose-100 text-rose-700 border-rose-200",
    badge: "bg-rose-50 text-rose-700 border border-rose-200",
  },
};

const ALL_STATUSES: StatusReserva[] = [
  "aguarda_pagamento",
  "pago",
  "em_andamento",
  "concluida",
  "cancelada",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatKz(value: number | null): string {
  if (value == null) return "—";
  return `${value.toLocaleString("pt-AO")} Kz`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StatusReserva }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["aguarda_pagamento"];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.badge}`}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ─── Reserva Card ─────────────────────────────────────────────────────────────

function ReservaCard({
  reserva,
  onClick,
}: {
  reserva: Reserva;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-[#902ad1]/30 hover:shadow-[0_4px_16px_rgba(144,42,209,0.1)] transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#902ad1]/10 flex items-center justify-center shrink-0">
            <Hash size={13} className="text-[#902ad1]" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-slate-700">
              {reserva.codigo ?? `#${reserva.id.slice(0, 8)}`}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold">
              {formatDate(reserva.data_recolha)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={reserva.status} />
          <ChevronRight
            size={14}
            className="text-slate-300 group-hover:text-[#902ad1] transition-colors"
          />
        </div>
      </div>

      {/* Rota */}
      <div className="bg-slate-50 rounded-xl p-3 mb-3 space-y-1.5">
        <div className="flex items-center gap-2 text-[12px] text-slate-600">
          <MapPin size={11} className="text-emerald-500 shrink-0" />
          <span className="truncate font-medium">
            {reserva.local_partida ?? "—"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-slate-600">
          <MapPin size={11} className="text-rose-500 shrink-0" />
          <span className="truncate font-medium">
            {reserva.local_destino ?? "—"}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <User size={11} className="text-slate-400" />
            <span className="font-semibold truncate max-w-[80px]">
              {reserva.cliente?.nome_completo?.split(" ")[0] ?? "—"}
            </span>
          </div>
          {reserva.viaturas?.modelo && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Car size={11} className="text-slate-400" />
              <span className="font-semibold">{reserva.viaturas.modelo}</span>
            </div>
          )}
        </div>
        <p className="text-[13px] font-semibold text-[#902ad1]">
          {formatKz(reserva.valor_total)}
        </p>
      </div>
    </div>
  );
}

// ─── Detail Drawer ─────────────────────────────────────────────────────────────

function DetailDrawer({
  reserva,
  onClose,
  onStatusUpdate,
}: {
  reserva: Reserva | null;
  onClose: () => void;
  onStatusUpdate: (id: string, status: StatusReserva) => Promise<void>;
}) {
  const [novoStatus, setNovoStatus] = useState<StatusReserva | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reserva) {
      setNovoStatus(reserva.status);
      setSucesso(false);
    }
  }, [reserva]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (reserva) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [reserva, onClose]);

  const handleConfirmar = async () => {
    if (!reserva || !novoStatus || novoStatus === reserva.status) return;
    setAtualizando(true);
    try {
      await onStatusUpdate(reserva.id, novoStatus);
      setSucesso(true);
      setTimeout(() => {
        setSucesso(false);
        onClose();
      }, 1200);
    } finally {
      setAtualizando(false);
    }
  };

  const isOpen = !!reserva;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 bottom-0 w-full max-w-[420px] bg-white z-50 shadow-[-8px_0_40px_rgba(0,0,0,0.1)] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {reserva ? (
          <>
            {/* Header do drawer */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <p className="text-[11px] font-semibold text-[#902ad1] uppercase tracking-widest">
                  Detalhes da Reserva
                </p>
                <p className="text-[15px] font-semibold text-slate-800">
                  {reserva.codigo ?? `#${reserva.id.slice(0, 8)}`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Conteúdo scrollável */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Status atual */}
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Status Atual
                </p>
                <StatusBadge status={reserva.status} />
              </div>

              {/* Info Cards */}
              <div className="space-y-3">
                {/* Datas */}
                <div className="bg-slate-50 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={13} className="text-[#902ad1]" />
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Data de Recolha
                    </p>
                  </div>
                  <p className="text-[14px] font-semibold text-slate-700">
                    {formatDate(reserva.data_recolha)}
                  </p>
                </div>

                {/* Rota */}
                <div className="bg-slate-50 rounded-xl p-3.5">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                    Rota
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5 shrink-0">
                        <MapPin size={10} className="text-emerald-600" />
                      </div>
                      <p className="text-[13px] font-semibold text-slate-600">
                        {reserva.local_partida ?? "—"}
                      </p>
                    </div>
                    <div className="ml-2.5 h-3 border-l-2 border-dashed border-slate-200" />
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center mt-0.5 shrink-0">
                        <MapPin size={10} className="text-rose-600" />
                      </div>
                      <p className="text-[13px] font-semibold text-slate-600">
                        {reserva.local_destino ?? "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cliente */}
                <div className="bg-slate-50 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <User size={13} className="text-[#902ad1]" />
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Cliente
                    </p>
                  </div>
                  <p className="text-[14px] font-semibold text-slate-700">
                    {reserva.cliente?.nome_completo ?? "—"}
                  </p>
                </div>

                {/* Viatura */}
                <div className="bg-slate-50 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Car size={13} className="text-[#902ad1]" />
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Viatura
                    </p>
                  </div>
                  <p className="text-[14px] font-semibold text-slate-700">
                    {reserva.viaturas?.modelo ?? "—"}
                  </p>
                  {reserva.viaturas?.matricula && (
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                      {reserva.viaturas.matricula}
                    </p>
                  )}
                </div>

                {/* Motorista */}
                {reserva.motorista?.perfil?.nome_completo && (
                  <div className="bg-slate-50 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-1">
                      <User size={13} className="text-blue-500" />
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Motorista
                      </p>
                    </div>
                    <p className="text-[14px] font-semibold text-slate-700">
                      {reserva.motorista.perfil.nome_completo}
                    </p>
                  </div>
                )}

                {/* Valor */}
                <div className="bg-[#902ad1]/5 rounded-xl p-3.5 border border-[#902ad1]/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote size={13} className="text-[#902ad1]" />
                    <p className="text-[10px] font-semibold text-[#902ad1] uppercase tracking-wider">
                      Valor Total
                    </p>
                  </div>
                  <p className="text-[20px] font-semibold text-[#902ad1]">
                    {formatKz(reserva.valor_total)}
                  </p>
                </div>

                {/* Observações */}
                {reserva.observacoes && (
                  <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-100">
                    <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1">
                      Observações
                    </p>
                    <p className="text-[13px] text-slate-600 font-medium">
                      {reserva.observacoes}
                    </p>
                  </div>
                )}
              </div>

              {/* Alterar Status */}
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Alterar Status
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {ALL_STATUSES.map((s) => {
                    const cfg = STATUS_CONFIG[s];
                    const Icon = cfg.icon;
                    const selected = novoStatus === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setNovoStatus(s)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all duration-150 ${
                          selected
                            ? `${cfg.pill} border-current shadow-sm`
                            : "bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200"
                        }`}
                      >
                        <Icon size={15} />
                        <span className="text-[13px] font-semibold">{cfg.label}</span>
                        {selected && (
                          <CheckCircle2 size={14} className="ml-auto opacity-70" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer — Confirmar */}
            <div className="px-5 py-4 border-t border-slate-100">
              {sucesso ? (
                <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 rounded-xl">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span className="text-[13px] font-semibold text-emerald-700">
                    Status atualizado!
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleConfirmar}
                  disabled={
                    atualizando ||
                    !novoStatus ||
                    novoStatus === reserva.status
                  }
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                    atualizando || novoStatus === reserva.status
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-[#902ad1] text-white shadow-[0_4px_14px_rgba(144,42,209,0.3)] hover:bg-[#7a23b3] active:scale-[0.98]"
                  }`}
                >
                  {atualizando ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <RefreshCw size={15} />
                  )}
                  {atualizando ? "A atualizar..." : "Confirmar Alteração"}
                </button>
              )}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<StatusReserva | "todas">(
    "todas"
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [reservaSelecionada, setReservaSelecionada] = useState<Reserva | null>(
    null
  );

  // ── Carregar Reservas ────────────────────────────────────────────────────────
  const carregarReservas = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErro("Utilizador não autenticado.");
        return;
      }

      // Parceiro ID
      const { data: parceiroData } = await supabase
        .from("parceiros")
        .select("id")
        .eq("usuario_id", user.id)
        .single();

      if (!parceiroData) {
        setErro("Parceiro não encontrado.");
        return;
      }

      const parceiroId = parceiroData.id as string;

      // IDs de viaturas do parceiro
      const { data: viaturasData } = await supabase
        .from("viaturas")
        .select("id")
        .eq("parceiro_id", parceiroId);

      const viaturaIds = (viaturasData ?? []).map((v: { id: string }) => v.id);

      if (viaturaIds.length === 0) {
        setReservas([]);
        return;
      }

      // Buscar reservas
      const { data, error } = await supabase
        .from("reservas")
        .select(
          `
          id, codigo, status, data_recolha, local_partida, local_destino, valor_total, observacoes,
          cliente:perfis!reservas_cliente_id_fkey(nome_completo),
          viaturas!reservas_viatura_id_fkey(modelo, matricula),
          motorista:motoristas!reservas_motorista_id_fkey(perfil:perfis!motoristas_perfil_id_fkey(nome_completo))
        `
        )
        .in("viatura_id", viaturaIds)
        .order("data_recolha", { ascending: false });

      if (error) {
        setErro("Erro ao carregar reservas.");
        return;
      }

      setReservas((data as unknown as Reserva[]) ?? []);
    } catch (err) {
      console.error("Erro ao carregar reservas:", err);
      setErro("Erro inesperado ao carregar reservas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarReservas();
  }, [carregarReservas]);

  // ── Atualizar Status ─────────────────────────────────────────────────────────
  const handleStatusUpdate = async (
    id: string,
    novoStatus: StatusReserva
  ): Promise<void> => {
    const { error } = await supabase
      .from("reservas")
      .update({ status: novoStatus })
      .eq("id", id);

    if (error) throw error;

    // Atualizar localmente
    setReservas((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: novoStatus } : r))
    );
    // Atualizar reserva selecionada
    setReservaSelecionada((prev) =>
      prev && prev.id === id ? { ...prev, status: novoStatus } : prev
    );
  };

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const reservasFiltradas = reservas.filter((r) => {
    const matchStatus =
      filtroStatus === "todas" || r.status === filtroStatus;
    const term = search.toLowerCase();
    const matchSearch =
      !term ||
      r.codigo?.toLowerCase().includes(term) ||
      r.cliente?.nome_completo?.toLowerCase().includes(term) ||
      r.local_partida?.toLowerCase().includes(term) ||
      r.local_destino?.toLowerCase().includes(term) ||
      r.viaturas?.modelo?.toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  // ── KPI Badges ───────────────────────────────────────────────────────────────
  const total = reservas.length;
  const pendentes = reservas.filter(
    (r) => r.status === "aguarda_pagamento"
  ).length;
  const pagas = reservas.filter((r) => r.status === "pago").length;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#902ad1]/10 flex items-center justify-center">
              <CalendarRange size={16} className="text-[#902ad1]" />
            </div>
            <h1 className="text-xl font-semibold text-slate-800">Reservas</h1>
          </div>
          <p className="text-[12px] text-slate-400 font-semibold ml-10">
            Gerencie todas as reservas das suas viaturas
          </p>
        </div>

        {/* KPI Badges */}
        {!loading && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total
              </span>
              <span className="text-[13px] font-semibold text-slate-700">
                {total}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
              <AlertCircle size={11} className="text-amber-600" />
              <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">
                Pendentes
              </span>
              <span className="text-[13px] font-semibold text-amber-700">
                {pendentes}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
              <CheckCircle2 size={11} className="text-emerald-600" />
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
                Pagas
              </span>
              <span className="text-[13px] font-semibold text-emerald-700">
                {pagas}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Search Bar ─────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Pesquisar por código, cliente, viatura ou rota…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#902ad1]/20 focus:border-[#902ad1] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Filtros por Status ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFiltroStatus("todas")}
          className={`px-4 py-1.5 rounded-xl text-[12px] font-semibold border transition-all duration-150 ${
            filtroStatus === "todas"
              ? "bg-[#902ad1] text-white border-[#902ad1] shadow-[0_2px_8px_rgba(144,42,209,0.3)]"
              : "bg-white text-slate-500 border-slate-200 hover:border-[#902ad1]/30 hover:text-[#902ad1]"
          }`}
        >
          Todas
        </button>
        {ALL_STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s];
          const Icon = cfg.icon;
          const active = filtroStatus === s;
          return (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[12px] font-semibold border transition-all duration-150 ${
                active
                  ? `${cfg.pill} shadow-sm`
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              }`}
            >
              <Icon size={12} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* ── Lista de Reservas ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={28} className="animate-spin text-[#902ad1]" />
            <p className="text-[13px] font-semibold text-slate-400">
              A carregar reservas…
            </p>
          </div>
        </div>
      ) : erro ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-rose-400" />
            </div>
            <p className="text-[14px] font-semibold text-slate-600 mb-1">{erro}</p>
            <button
              onClick={carregarReservas}
              className="text-[12px] font-semibold text-[#902ad1] hover:underline mt-2"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      ) : reservasFiltradas.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <CalendarRange size={28} className="text-slate-400" />
            </div>
            <p className="text-[14px] font-semibold text-slate-500 mb-1">
              {search || filtroStatus !== "todas"
                ? "Nenhuma reserva encontrada"
                : "Sem reservas ainda"}
            </p>
            <p className="text-[12px] text-slate-400 font-medium">
              {search || filtroStatus !== "todas"
                ? "Tente ajustar os filtros de pesquisa"
                : "As reservas das suas viaturas aparecerão aqui"}
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {reservasFiltradas.length} reserva
            {reservasFiltradas.length !== 1 ? "s" : ""}
          </p>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
            <div className="overflow-auto max-h-[600px] relative">
              <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 bg-slate-50 z-10 outline outline-1 outline-slate-100">
                  <tr className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    <th className="py-3.5 px-5">ID / Código</th>
                    <th className="py-3.5 px-5">Cliente</th>
                    <th className="py-3.5 px-5">Recolha & Viagem</th>
                    <th className="py-3.5 px-5">Motorista & Frota</th>
                    <th className="py-3.5 px-5">Valor</th>
                    <th className="py-3.5 px-5 text-center">Estado</th>
                    <th className="py-3.5 px-5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reservasFiltradas.map((r) => (
                    <tr key={r.id} className="text-[13px] font-medium text-slate-700 hover:bg-slate-50/60 hover:shadow-[inset_4px_0_0_0_#902ad1] transition-all duration-200">
                      <td className="py-3.5 px-5">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-[#902ad1] block font-mono">
                            {r.codigo ?? `#${r.id.slice(0, 8)}`}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#902ad1]/8 text-[#902ad1] flex items-center justify-center text-[10px] font-semibold border border-[#902ad1]/10">
                            {r.cliente?.nome_completo
                              ? r.cliente.nome_completo
                                  .split(" ")
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                              : "CL"}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-700 block">
                              {r.cliente?.nome_completo || "Utilizador WiTransfer"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="space-y-1 max-w-[240px]">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                            <Clock size={12} className="text-slate-400 shrink-0" />
                            <span>{formatDate(r.data_recolha)}</span>
                          </div>
                          <div className="text-[10px] font-normal text-slate-400 flex items-center gap-1 min-w-0" title={`${r.local_partida} → ${r.local_destino}`}>
                            <MapPin size={11} className="text-[#902ad1] shrink-0" />
                            <span className="truncate">{r.local_partida}</span>
                            <ChevronRight size={8} className="text-slate-300 shrink-0" />
                            <span className="truncate">{r.local_destino}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex flex-col gap-1 items-start">
                          {r.motorista?.perfil?.nome_completo ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-medium">
                              <User size={10} />
                              {r.motorista.perfil.nome_completo}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-normal">Sem motorista</span>
                          )}
                          {r.viaturas?.modelo ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#902ad1]/8 text-[#902ad1] border border-[#902ad1]/10 rounded-full text-[10px] font-medium">
                              <Car size={10} />
                              {r.viaturas.modelo} {r.viaturas.matricula && `(${r.viaturas.matricula})`}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-normal">Sem viatura</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-700 text-xs font-mono">
                        {formatKz(r.valor_total)}
                      </td>
                      <td className="py-3.5 px-5 text-center whitespace-nowrap">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setReservaSelecionada(r)}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-slate-50 hover:bg-[#902ad1] text-slate-500 hover:text-white rounded-xl text-[11px] font-medium uppercase tracking-wide border border-slate-100 hover:border-[#902ad1] transition-all duration-200 active:scale-95"
                        >
                          Gerir
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Detail Drawer ──────────────────────────────────────────────────── */}
      <DetailDrawer
        reserva={reservaSelecionada}
        onClose={() => setReservaSelecionada(null)}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}
