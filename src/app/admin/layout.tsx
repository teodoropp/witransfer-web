/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/** @format */

"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Car,
  CalendarRange,
  Handshake,
  Users2,
  Bell,
  Grid,
  PlusCircle,
  ShieldCheck,
  Megaphone,
  Plane,
  Download,
  Image as ImageIcon,
  Activity,
  BarChart,
  Search,
  User,
  Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { THEME_TOKENS } from "@/utils/design-system";

interface MenuItem {
  name: string;
  href: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
}

const SidebarItem = ({ item }: { item: MenuItem }) => {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] transition-all group relative ${isActive ? THEME_TOKENS.sidebarActive : THEME_TOKENS.sidebarInactive
        }`}
    >
      <Icon
        size={16}
        className={`${isActive ? "" : "group-hover:scale-110 opacity-70 group-hover:opacity-100"} transition-transform shrink-0`}
      />
      <span className="text-[13px] font-medium truncate">{item.name}</span>
      {isActive && (
        <div
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full animate-pulse ${THEME_TOKENS.sidebarIndicator}`}
        />
      )}
    </Link>
  );
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [adminName, setAdminName] = useState("Admin");
  const [adminPhoto, setAdminPhoto] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);

  // Dropdown & Modal states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [dbSearchResults, setDbSearchResults] = useState<any[]>([]);

  // Database active notifications
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [notifCount, setNotifCount] = useState(0);

  // Command palette standard routes
  const searchRoutes = [
    { name: "Painel Geral", href: "/admin/dashboard", category: "Visão Geral", icon: LayoutDashboard },
    { name: "Gerir Reservas", href: "/admin/reservas", category: "Reservas", icon: CalendarRange },
    { name: "Solicitações de Parceiros", href: "/admin/solicitacoes", category: "Reservas", icon: ShieldCheck },
    { name: "Adicionar Viatura", href: "/admin/viaturas/nova", category: "Ações Rápidas", icon: PlusCircle },
    { name: "Gerir Viaturas", href: "/admin/viaturas", category: "Frota", icon: Car },
    { name: "Gerir Categorias", href: "/admin/categorias", category: "Frota", icon: Grid },
    { name: "Notificações Push", href: "/admin/enviar-notificacao", category: "Comunicação", icon: Bell },
    { name: "Campanhas Promo", href: "/admin/enviar-promocao", category: "Comunicação", icon: Megaphone },
    { name: "Banners Publicidade", href: "/admin/publicidade", category: "Comunicação", icon: ImageIcon },
    { name: "Relatório Pagamentos", href: "/admin/pagamentos", category: "Financeiro", icon: CreditCard },
    { name: "Análise Desempenho", href: "/admin/desempenho", category: "Financeiro", icon: BarChart },
  ];

  // 1. Carregar Notificações do Banco
  const fetchNotifications = useCallback(async (userId: string) => {
    try {
      const { count } = await supabase
        .from("notificacoes")
        .select("id", { count: "exact", head: true })
        .eq("usuario_id", userId)
        .eq("lida", false);

      const { data: list } = await supabase
        .from("notificacoes")
        .select("id, titulo, mensagem, lida, criado_em")
        .eq("usuario_id", userId)
        .order("criado_em", { ascending: false })
        .limit(5);

      setNotifCount(count || 0);
      setNotificationsList(list || []);
    } catch (err) {
      console.error("Erro ao carregar notificações admin:", err);
    }
  }, []);

  // 2. Teclado Ctrl+K / Cmd+K para abrir pesquisa
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 3. Fechar dropdowns ao clicar na janela
  useEffect(() => {
    const clickOutside = () => {
      setShowNotifications(false);
      setShowProfileMenu(false);
    };
    window.addEventListener("click", clickOutside);
    return () => window.removeEventListener("click", clickOutside);
  }, []);

  // 4. Carregar Perfil & Notificações Inicial
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setAdminId(user.id);
          // Perfil
          const { data: perfil } = await supabase
            .from("perfis")
            .select("nome_completo, foto_url")
            .eq("id", user.id)
            .single();

          if (perfil?.nome_completo) {
            setAdminName(perfil.nome_completo);
          }
          if (perfil?.foto_url) {
            setAdminPhoto(perfil.foto_url);
          }

          // Notificações
          await fetchNotifications(user.id);
        }
      } catch (err) {
        console.error("Erro ao carregar perfil/dados:", err);
      }
    };
    fetchProfile();
  }, [fetchNotifications]);

  // 5. Escuta Real-Time para Notificações & Perfil
  useEffect(() => {
    if (!adminId) return;

    // Realtime notificações
    const notifChannel = supabase
      .channel(`admin-notifs-${adminId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notificacoes", filter: `usuario_id=eq.${adminId}` },
        () => {
          fetchNotifications(adminId);
        }
      )
      .subscribe();

    // Realtime atualizações de perfil do usuário atual
    const profileChannel = supabase
      .channel(`admin-profile-${adminId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "perfis", filter: `id=eq.${adminId}` },
        (payload) => {
          if (payload.new.nome_completo) setAdminName(payload.new.nome_completo);
          if (payload.new.foto_url) setAdminPhoto(payload.new.foto_url);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [adminId, fetchNotifications]);

  // 6. Debounced Database Search query
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setDbSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        // Pesquisar Reservas (Codigo ou partida/destino)
        const { data: bookings } = await supabase
          .from("reservas")
          .select("id, codigo, local_partida, local_destino")
          .or(`codigo.ilike.%${searchQuery}%,local_partida.ilike.%${searchQuery}%,local_destino.ilike.%${searchQuery}%`)
          .limit(3);

        // Pesquisar Viaturas (Marca, modelo, matricula)
        const { data: vehicles } = await supabase
          .from("viaturas")
          .select("id, marca, modelo, matricula")
          .or(`marca.ilike.%${searchQuery}%,modelo.ilike.%${searchQuery}%,matricula.ilike.%${searchQuery}%`)
          .limit(3);

        // Pesquisar Motoristas (Unindo perfis por nome_completo)
        const { data: drivers } = await supabase
          .from("motoristas")
          .select(`
            id,
            perfis:perfil_id (
              nome_completo
            )
          `);

        const matchedDrivers = (drivers || [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((d: any) => ({
            id: d.id,
            nome: Array.isArray(d.perfis) ? d.perfis[0]?.nome_completo : d.perfis?.nome_completo,
          }))
          .filter((d) => d.nome && d.nome.toLowerCase().includes(searchQuery.toLowerCase()))
          .slice(0, 3);

        const results = [
          ...(bookings || []).map((b) => ({
            name: `Reserva ${b.codigo}`,
            subtitle: `${b.local_partida} â†’ ${b.local_destino}`,
            href: `/admin/reservas`,
            category: "Reservas (BD)",
            icon: CalendarRange,
          })),
          ...(vehicles || []).map((v) => ({
            name: `Viatura ${v.marca} ${v.modelo}`,
            subtitle: `Matri­cula: ${v.matricula || "S/M"}`,
            href: `/admin/viaturas/${v.id}/editar`,
            category: "Frota (BD)",
            icon: Car,
          })),
          ...matchedDrivers.map((d) => ({
            name: `Motorista ${d.nome}`,
            subtitle: "Perfil de Motorista",
            href: `/admin/motoristas/${d.id}/editar`,
            category: "Motoristas (BD)",
            icon: Users,
          })),
        ];

        setDbSearchResults(results);
      } catch (err) {
        console.error("Erro na busca de banco de dados:", err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true })
        .eq("usuario_id", user.id)
        .eq("lida", false);

      if (error) throw error;

      setNotifCount(0);
      setNotificationsList((prev) => prev.map((n) => ({ ...n, lida: true })));
    } catch (err) {
      console.error("Erro ao ler notificaÃ§Ãµes:", err);
    }
  };

  const handleNotificationClick = async (e: React.MouseEvent, id: string, lida: boolean) => {
    e.stopPropagation();
    if (!lida) {
      try {
        await supabase.from("notificacoes").update({ lida: true }).eq("id", id);
        setNotifCount((c) => Math.max(0, c - 1));
        setNotificationsList((prev) =>
          prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
        );
      } catch (err) {
        console.error("Erro ao ler notificação:", err);
      }
    }
    router.push("/admin/reservas");
    setShowNotifications(false);
  };

  const menuStructure: { title: string; items: MenuItem[] }[] = [
    {
      title: "VisÃ£o Geral",
      items: [
        {
          name: "Painel Geral",
          href: "/admin/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Reservas & Viagens",
      items: [
        { name: "Reservas", href: "/admin/reservas", icon: CalendarRange },
        {
          name: "SolicitaÃ§Ãµes de Parceiros",
          href: "/admin/solicitacoes",
          icon: ShieldCheck,
        },
        { name: "Aeroportos", href: "/admin/aeroportos", icon: Plane },
      ],
    },
    {
      title: "GestÃ£o de Frota",
      items: [
        { name: "Viaturas", href: "/admin/viaturas", icon: Car },
        { name: "Categorias", href: "/admin/categorias", icon: Grid },
        { name: "Extras de ServiÃ§o", href: "/admin/extras", icon: PlusCircle },
      ],
    },
    {
      title: "Comunidade",
      items: [
        { name: "Motoristas", href: "/admin/motoristas", icon: Users },
        { name: "Parceiros", href: "/admin/parceiros", icon: Handshake },
        { name: "Clientes", href: "/admin/clientes", icon: Users2 },
      ],
    },
    {
      title: "ComunicaÃ§Ã£o",
      items: [
        {
          name: "NotificaÃ§Ãµes Push",
          href: "/admin/enviar-notificacao",
          icon: Bell,
        },
        {
          name: "Campanhas Promo",
          href: "/admin/enviar-promocao",
          icon: Megaphone,
        },
        {
          name: "Banners Publicidade",
          href: "/admin/publicidade",
          icon: ImageIcon,
        },
      ],
    },
    {
      title: "RelatÃ³rios & Contas",
      items: [
        { name: "Pagamentos", href: "/admin/pagamentos", icon: CreditCard },
        { name: "Financeiro Geral", href: "/admin/financeiro", icon: Activity },
        {
          name: "AnÃ¡lise Desempenho",
          href: "/admin/desempenho",
          icon: BarChart,
        },
        { name: "ExportaÃ§Ã£o Dados", href: "/admin/exportar", icon: Download },
      ],
    },
    {
      title: "ConfiguraÃ§Ãµes",
      items: [
        {
          name: "DefiniÃ§Ãµes Sistema",
          href: "/admin/configuracoes",
          icon: Settings,
        },
      ],
    },
  ];

  // CombinaÃ§Ã£o de buscas estÃ¡ticas e dinÃ¢micas
  const filteredRoutes = searchQuery
    ? searchRoutes.filter((r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : searchRoutes.slice(0, 4);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "agora";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F4FB] font-sans">

      {/* â”€â”€ Command Palette (Ctrl+K) â”€â”€ */}
      {showSearchModal && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh] p-4 animate-in fade-in duration-200"
          onClick={() => setShowSearchModal(false)}
        >
          <div
            className="bg-white w-full max-w-xl rounded-[14px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Pesquisar pÃ¡ginas ou dados reais do banco..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none border-none py-1"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="px-2 py-1 text-[10px] bg-slate-100 border border-slate-200 rounded font-semibold text-slate-400 hover:bg-slate-200 transition-colors"
              >
                ESC
              </button>
            </div>
            <div className="p-2 max-h-[360px] overflow-y-auto space-y-0.5 no-scrollbar">
              <div className="px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                {searchQuery ? "PÃ¡ginas do Painel" : "Atalhos Sugeridos"}
              </div>
              {filteredRoutes.map((route, i) => {
                const RouteIcon = route.icon;
                return (
                  <div
                    key={i}
                    onClick={() => { router.push(route.href); setShowSearchModal(false); setSearchQuery(""); }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-600 hover:bg-[#902ad1]/5 hover:text-[#902ad1] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <RouteIcon size={14} className="opacity-70 group-hover:opacity-100" />
                      <span className="text-xs font-semibold">{route.name}</span>
                    </div>
                    <span className="text-[10px] bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-slate-400 group-hover:bg-transparent group-hover:border-[#902ad1]/20 group-hover:text-[#902ad1]">
                      {route.category}
                    </span>
                  </div>
                );
              })}
              {dbSearchResults.length > 0 && (
                <>
                  <div className="px-3 py-1.5 mt-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-50 pt-2">
                    Resultados do Banco de Dados
                  </div>
                  {dbSearchResults.map((item, i) => {
                    const ItemIcon = item.icon;
                    return (
                      <div
                        key={`db-${i}`}
                        onClick={() => { router.push(item.href); setShowSearchModal(false); setSearchQuery(""); }}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-600 hover:bg-[#902ad1]/5 hover:text-[#902ad1] transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <ItemIcon size={14} className="text-[#902ad1] opacity-80" />
                          <div className="text-left">
                            <p className="text-xs font-semibold">{item.name}</p>
                            {item.subtitle && (
                              <p className="text-[9px] text-slate-400 mt-0.5 font-medium">{item.subtitle}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] bg-purple-50 text-[#902ad1] rounded px-1.5 py-0.5 border border-[#902ad1]/15 font-semibold">
                          {item.category}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}
              {searchQuery.length >= 2 && filteredRoutes.length === 0 && dbSearchResults.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                  Nenhum registro correspondente a &ldquo;{searchQuery}&rdquo;
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          SIDEBAR â€” Full height, flush left, white
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <aside className="w-[280px] shrink-0 flex flex-col bg-white border-r border-slate-200/70 z-30 shadow-[2px_0_20px_-4px_rgba(144,42,209,0.08)]">

        {/* Logo header */}
        <div className="h-20 flex items-center justify-center px-4 shrink-0 border-b border-slate-100">
          <Link href="/admin/dashboard" className="flex items-center justify-center">
            <div className="relative w-44 h-12">
              <Image
                src="/logo.png"
                alt="WiTransfer"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Nav items â€” scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 no-scrollbar">
          {menuStructure.map((group, idx) => (
            <div key={idx} className="mb-5">
              <h3 className="px-3 text-[8px] font-bold text-slate-400 uppercase tracking-[0.28em] mb-2">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item, itemIdx) => (
                  <SidebarItem key={itemIdx} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom logout */}
        <div className="p-3 border-t border-slate-100 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-[10px] text-slate-500 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 transition-all group font-medium text-xs cursor-pointer"
          >
            <LogOut size={14} className="shrink-0 group-hover:translate-x-0.5 transition-transform" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          RIGHT COLUMN â€” Topbar + Content
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Topbar â€” transparent, no background, no border */}
        <header className="h-16 shrink-0 flex items-center justify-between px-6 pt-3 z-20">

          {/* Search bar */}
          <div
            onClick={() => setShowSearchModal(true)}
            className="flex items-center relative w-80 lg:w-[460px] group cursor-pointer"
          >
            <Search size={14} className="absolute left-3.5 text-slate-400 group-hover:text-[#902ad1] transition-colors z-10" />
            <input
              type="text"
              readOnly
              placeholder="Pesquisar... (Ctrl+K)"
              className="w-full pl-9 pr-20 py-2.5 bg-white border border-slate-200 rounded-[4px] text-xs font-medium text-slate-600 placeholder:text-slate-400 focus:outline-none hover:border-[#902ad1]/40 hover:shadow-sm transition-all cursor-pointer shadow-sm"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-bold text-slate-400 select-none pointer-events-none">
              Ctrl+K
            </kbd>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">

            {/* Settings */}
            <Link
              href="/admin/configuracoes"
              className="p-2.5 text-slate-500 hover:text-[#902ad1] hover:bg-white/80 rounded-[10px] transition-all"
            >
              <Settings size={18} />
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="relative p-2.5 text-slate-500 hover:text-[#902ad1] hover:bg-white/80 rounded-[10px] transition-all cursor-pointer"
              >
                <Bell size={18} />
                {notifCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#F8F4FB] animate-pulse" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-white rounded-[14px] shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-3 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-800">NotificaÃ§Ãµes</span>
                    {notifCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] font-bold text-[#902ad1] hover:underline cursor-pointer border-none bg-transparent"
                      >
                        Marcar como lidas
                      </button>
                    )}
                  </div>
                  <div className="max-h-[260px] overflow-y-auto divide-y divide-slate-50 no-scrollbar">
                    {notificationsList.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={(e) => handleNotificationClick(e, notif.id, notif.lida)}
                        className={`px-4 py-3.5 hover:bg-slate-50/50 transition-colors text-left w-full cursor-pointer flex gap-3 ${!notif.lida ? "bg-[#902ad1]/[0.03]" : ""}`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!notif.lida ? "bg-[#902ad1]" : "bg-transparent"}`} />
                        <div className="space-y-1 pr-4">
                          <p className="text-xs font-semibold text-slate-700 leading-tight">{notif.titulo}</p>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{notif.mensagem}</p>
                          <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock size={9} />
                            {formatDate(notif.criado_em)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {notificationsList.length === 0 && (
                      <div className="py-8 text-center text-slate-400 text-xs font-medium">
                        Nenhuma notificação disponível.
                      </div>
                    )}
                  </div>
                  <div className="border-t border-slate-50 pt-2 px-4 text-center">
                    <Link
                      href="/admin/enviar-notificacao"
                      onClick={() => setShowNotifications(false)}
                      className="text-[10px] font-bold text-[#902ad1] hover:underline block"
                    >
                      Ver todas as notificações
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* User Profile */}
            <div className="relative">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-[10px] hover:bg-white/80 transition-all cursor-pointer group"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {adminPhoto ? (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#902ad1]/15 group-hover:ring-[#902ad1]/30 transition-all">
                      <Image src={adminPhoto} alt={adminName} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#902ad1] to-[#c97ff5] flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {adminName
                        ? adminName.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                        : "AD"}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#F8F4FB]" />
                </div>

                {/* Name + role */}
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-[12px] font-semibold text-slate-800 leading-none group-hover:text-[#902ad1] transition-colors">
                    {adminName}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                    Administrador
                  </span>
                </div>
              </div>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-[14px] shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-2.5 border-b border-slate-50">
                    <p className="text-xs font-bold text-slate-800 leading-none">{adminName}</p>
                    <p className="text-[10px] text-slate-400 font-medium block mt-1">Painel do Administrador</p>
                  </div>
                  <div className="flex flex-col py-1.5">
                    <Link
                      href="/admin/perfil"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-[#902ad1]/5 hover:text-[#902ad1] transition-all cursor-pointer"
                    >
                      <User size={13} />
                      <span>Meu Perfil</span>
                    </Link>
                    <Link
                      href="/admin/configuracoes"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-[#902ad1]/5 hover:text-[#902ad1] transition-all cursor-pointer"
                    >
                      <Settings size={13} />
                      <span>DefiniÃ§Ãµes do Sistema</span>
                    </Link>
                    <div className="h-px bg-slate-50 my-1.5" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50/50 hover:text-rose-700 transition-all cursor-pointer border-none bg-transparent w-full text-left"
                    >
                      <LogOut size={13} />
                      <span>Sair do Sistema</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-6 pt-8 pb-6 no-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}

