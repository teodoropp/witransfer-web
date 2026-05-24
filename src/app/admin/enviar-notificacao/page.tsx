/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Bell,
  Send,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  User,
  Search,
  ChevronRight,
  Info,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Perfil {
  id: string;
  nome_completo: string;
  email: string;
  tipo: string;
}

interface NotificationLog {
  id: string;
  usuario_id: string;
  tipo: string;
  titulo: string;
  mensagem: string | null;
  prioridade: string | null;
  role_contexto: string | null;
  lida: boolean | null;
  criado_em: string | null;
  perfil?: {
    nome_completo: string;
    email: string;
    tipo: string;
  } | null;
}

export default function EnviarNotificacaoPage() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [profiles, setProfiles] = useState<Perfil[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [targetType, setTargetType] = useState<"todos_clientes" | "todos_motoristas" | "todos_parceiros" | "usuario_especifico">("todos_clientes");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [notificationType, setNotificationType] = useState<"info" | "alerta">("info");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"todos" | "cliente" | "motorista" | "parceiro">("todos");

  // Fetch past notifications
  const fetchNotificationsHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      
      // Select notifications and join with perfis
      const { data, error } = await supabase
        .from("notificacoes")
        .select(`
          id,
          usuario_id,
          tipo,
          titulo,
          mensagem,
          prioridade,
          role_contexto,
          lida,
          criado_em,
          perfil:perfis(nome_completo, email, tipo)
        `)
        .order("criado_em", { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setNotifications((data as any) || []);
    } catch (err) {
      console.error("Erro ao carregar histórico de notificações:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Fetch profiles for target search
  const fetchProfiles = useCallback(async () => {
    try {
      setLoadingProfiles(true);
      const { data, error } = await supabase
        .from("perfis")
        .select("id, nome_completo, email, tipo")
        .order("nome_completo", { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error("Erro ao carregar perfis:", err);
    } finally {
      setLoadingProfiles(false);
    }
  }, []);

  useEffect(() => {
    fetchNotificationsHistory();
    fetchProfiles();
  }, [fetchNotificationsHistory, fetchProfiles]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = notifications.length;
    const lidas = notifications.filter((n) => n.lida).length;
    const naoLidas = total - lidas;
    return { total, lidas, naoLidas };
  }, [notifications]);

  // Filtered profiles for targeted selection
  const filteredProfiles = useMemo(() => {
    if (!searchUserQuery) return [];
    return profiles.filter(
      (p) =>
        p.nome_completo?.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchUserQuery.toLowerCase())
    ).slice(0, 5);
  }, [profiles, searchUserQuery]);

  // Selected profile display name
  const selectedProfileName = useMemo(() => {
    if (!selectedUserId) return "";
    const p = profiles.find((prof) => prof.id === selectedUserId);
    return p ? `${p.nome_completo} (${p.tipo === "cliente" ? "Cliente" : p.tipo === "motorista" ? "Motorista" : "Parceiro"})` : "";
  }, [profiles, selectedUserId]);

  // Filtered Notifications History
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchesSearch =
        n.titulo.toLowerCase().includes(historySearch.toLowerCase()) ||
        n.mensagem?.toLowerCase().includes(historySearch.toLowerCase()) ||
        n.perfil?.nome_completo?.toLowerCase().includes(historySearch.toLowerCase());

      const targetRole =
        n.role_contexto || n.perfil?.tipo;

      const matchesRole =
        roleFilter === "todos" ||
        targetRole === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [notifications, historySearch, roleFilter]);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!title.trim()) {
      setFormError("O título da notificação é obrigatório.");
      return;
    }
    if (!message.trim()) {
      setFormError("A mensagem da notificação é obrigatória.");
      return;
    }

    setSubmitting(true);

    try {
      let targets: string[] = [];
      let targetRole: string | null = null;

      // 1. Determine target user IDs
      if (targetType === "usuario_especifico") {
        if (!selectedUserId) {
          throw new Error("Por favor, selecione um utilizador para o disparo.");
        }
        targets = [selectedUserId];
      } else {
        const roleMap = {
          todos_clientes: "cliente",
          todos_motoristas: "motorista",
          todos_parceiros: "parceiro",
        };
        targetRole = roleMap[targetType as keyof typeof roleMap];
        
        // Fetch all active profiles matching this role
        const { data: matchedProfiles, error: fetchErr } = await supabase
          .from("perfis")
          .select("id")
          .eq("tipo", targetRole);

        if (fetchErr) throw fetchErr;
        
        if (!matchedProfiles || matchedProfiles.length === 0) {
          throw new Error(`Não foram encontrados perfis registados com a função ${targetRole}.`);
        }
        targets = matchedProfiles.map((p) => p.id);
      }

      // 2. Prepare notifications batch
      const payloads = targets.map((userId) => ({
        usuario_id: userId,
        tipo: notificationType,
        titulo: title.trim(),
        mensagem: message.trim(),
        prioridade: priority,
        role_contexto: targetRole,
        lida: false,
      }));

      // 3. Insert into Supabase in bulk
      const { error: insertErr } = await supabase
        .from("notificacoes")
        .insert(payloads);

      if (insertErr) throw insertErr;

      setFormSuccess(`Notificação enviada com sucesso para ${targets.length} destinatários.`);
      setTitle("");
      setMessage("");
      setSelectedUserId("");
      setSearchUserQuery("");
      
      // Reload history
      fetchNotificationsHistory();
    } catch (err: any) {
      console.error("Erro ao enviar notificações:", err);
      setFormError(err.message || "Erro desconhecido ao tentar disparar notificações.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Deletion of past notifications
  const handleDeleteNotification = async (id: string) => {
    if (!confirm("Deseja eliminar esta notificação do registo?")) return;
    try {
      const { error } = await supabase.from("notificacoes").delete().eq("id", id);
      if (error) throw error;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      alert("Erro ao eliminar notificação.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          <Link href="/admin/dashboard" className="hover:text-[#902ad1] transition-all">
            Painel
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">Comunicação</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">Notificações Push</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
          Notificações Push
        </h1>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Disparos (Histórico)</span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">{loadingHistory ? "..." : stats.total}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <Bell size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Lidas</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">{loadingHistory ? "..." : stats.lidas}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Não Lidas</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">{loadingHistory ? "..." : stats.naoLidas}</span>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
            <Clock size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Column */}
        <div className="lg:col-span-5 bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">Criar Disparo Push</h3>
            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mt-0.5">
              Envio em tempo real no aplicativo
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border-l-4 border-rose-500 rounded-r-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Target selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Público Alvo <span className="text-rose-500">*</span>
              </label>
              <select
                value={targetType}
                onChange={(e) => {
                  setTargetType(e.target.value as any);
                  setSelectedUserId("");
                  setSearchUserQuery("");
                }}
                className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] bg-white transition-all"
              >
                <option value="todos_clientes">Todos os Clientes</option>
                <option value="todos_motoristas">Todos os Motoristas</option>
                <option value="todos_parceiros">Todos os Parceiros</option>
                <option value="usuario_especifico">Utilizador Específico</option>
              </select>
            </div>

            {/* If specific user, search field */}
            {targetType === "usuario_especifico" && (
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Pesquisar Utilizador <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchUserQuery}
                    onChange={(e) => setSearchUserQuery(e.target.value)}
                    placeholder="Escreva o nome ou email..."
                    className="w-full pl-4 pr-10 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {loadingProfiles ? <Loader2 size={16} className="animate-spin text-[#902ad1]" /> : <Search size={16} />}
                  </div>
                </div>

                {/* Selected User Display */}
                {selectedUserId && (
                  <div className="mt-2 px-3 py-2 bg-[#902ad1]/5 border border-[#902ad1]/10 rounded-[10px] flex items-center justify-between text-xs text-[#902ad1] font-semibold">
                    <span className="flex items-center gap-1.5">
                      <User size={14} />
                      {selectedProfileName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUserId("");
                        setSearchUserQuery("");
                      }}
                      className="text-slate-400 hover:text-rose-600 font-bold"
                    >
                      Remover
                    </button>
                  </div>
                )}

                {/* Profiles Dropdown list */}
                {filteredProfiles.length > 0 && !selectedUserId && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-100 rounded-[10px] shadow-lg max-h-48 overflow-y-auto z-10 divide-y divide-slate-50">
                    {filteredProfiles.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedUserId(p.id);
                          setSearchUserQuery("");
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-700">{p.nome_completo}</span>
                          <span className="text-[10px] text-slate-400">{p.email}</span>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-550 uppercase tracking-widest font-bold font-sans">
                          {p.tipo === "cliente" ? "Cliente" : p.tipo === "motorista" ? "Motorista" : "Parceiro"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notification Type & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Tipo de Alerta <span className="text-rose-500">*</span>
                </label>
                <select
                  value={notificationType}
                  onChange={(e) => setNotificationType(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] bg-white transition-all"
                >
                  <option value="info">Informação (info)</option>
                  <option value="alerta">Crítico (alerta)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Prioridade <span className="text-rose-500">*</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] bg-white transition-all"
                >
                  <option value="LOW">Baixa (LOW)</option>
                  <option value="MEDIUM">Média (MEDIUM)</option>
                  <option value="HIGH">Alta (HIGH)</option>
                  <option value="URGENT">Urgente (URGENT)</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Título do Push <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Atualização importante sobre tarifas"
                required
                className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all"
              />
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Mensagem <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escreva aqui os detalhes da notificação push que o utilizador vai ler no telemóvel..."
                rows={4}
                required
                className="w-full px-4 py-3 rounded-[10px] border border-slate-200 text-sm font-medium focus:outline-none focus:border-[#902ad1] transition-all resize-none"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#902ad1] hover:bg-[#7a22b3] text-white rounded-[10px] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-[#902ad1]/15 disabled:opacity-75"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>A Processar Disparo...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Disparar Notificação</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* History Column */}
        <div className="lg:col-span-7 bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">Histórico de Disparos</h3>
              <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mt-0.5">
                Últimos logs registados no sistema
              </span>
            </div>
            {/* Filter */}
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-[10px] text-[11px] font-semibold focus:outline-none focus:border-[#902ad1] cursor-pointer"
              >
                <option value="todos">Todos</option>
                <option value="cliente">Clientes</option>
                <option value="motorista">Motoristas</option>
                <option value="parceiro">Parceiros</option>
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Filtrar histórico por título, conteúdo ou nome do destinatário..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-[10px] text-xs font-semibold focus:bg-white focus:border-[#902ad1] transition-all outline-none"
            />
          </div>

          {/* Log list */}
          {loadingHistory ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#902ad1]" />
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className="p-4 bg-slate-50/50 rounded-[10px] border border-slate-100 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all hover:bg-slate-50"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border ${
                        n.tipo === "alerta"
                          ? "bg-rose-50 text-rose-600 border-rose-100"
                          : "bg-blue-50 text-blue-600 border-blue-100"
                      }`}>
                        {n.tipo}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border ${
                        n.prioridade === "URGENT"
                          ? "bg-rose-100 text-rose-700 border-rose-200"
                          : n.prioridade === "HIGH"
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : "bg-slate-150 text-slate-500 border-slate-200"
                      }`}>
                        {n.prioridade || "MEDIUM"}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {n.criado_em ? new Date(n.criado_em).toLocaleString("pt-AO") : "..."}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-800 truncate">{n.titulo}</h4>
                    <p className="text-xs text-slate-500 font-medium whitespace-pre-wrap leading-relaxed">{n.mensagem}</p>

                    <div className="pt-2 border-t border-slate-100/50 flex items-center justify-between text-[10px] font-semibold text-slate-450">
                      <div className="flex items-center gap-1">
                        <User size={12} />
                        <span>Destinatário:</span>
                        <span className="text-slate-700">
                          {n.perfil?.nome_completo || "Sistema / Vários"}
                        </span>
                        {n.perfil?.tipo && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-500 uppercase tracking-widest font-normal">
                            {n.perfil.tipo === "cliente" ? "Cliente" : n.perfil.tipo === "motorista" ? "Motorista" : "Parceiro"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${n.lida ? "bg-emerald-500" : "bg-amber-400 animate-pulse"}`} />
                        <span>{n.lida ? "Lida" : "Pendente"}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteNotification(n.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-[10px] self-end md:self-start transition-all"
                    title="Eliminar Notificação"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[10px] border border-slate-100 border-dashed text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-350 mb-3 border border-slate-100">
                <Bell size={20} />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">Sem registos encontrados</h4>
              <p className="text-xs text-slate-400 mt-1 font-medium max-w-xs">
                Ajuste os filtros de pesquisa ou faça o primeiro disparo push no formulário ao lado.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
