/** @format */

"use client";

import { ReactNode, useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  Users,
  CalendarRange,
  TrendingUp,
  UserCheck,
  Bell,
  Settings,
  User,
  LogOut,
  Loader2,
  Handshake,
  ClipboardList,
  Menu,
  X,
  History,
  Wallet,
  CreditCard,
  Search,
  Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/parceiro/dashboard", icon: LayoutDashboard },
  { name: "Viaturas", href: "/parceiro/viaturas", icon: Car },
  { name: "Motoristas", href: "/parceiro/motoristas", icon: Users },
  { name: "Reservas", href: "/parceiro/reservas", icon: CalendarRange },
  { name: "Histórico Viagens", href: "/parceiro/viagens", icon: History },
  { name: "Financeiro", href: "/parceiro/financeiro", icon: TrendingUp },
  { name: "Saldo e Carteira", href: "/parceiro/carteira", icon: Wallet },
  { name: "Faturas e Taxas", href: "/parceiro/faturas", icon: CreditCard },
  { name: "Clientes", href: "/parceiro/clientes", icon: UserCheck },
  { name: "Solicitações", href: "/parceiro/solicitacoes", icon: ClipboardList },
  { name: "Notificações", href: "/parceiro/notificacoes", icon: Bell },
];

const BOTTOM_NAV: NavItem[] = [
  { name: "Perfil", href: "/parceiro/perfil", icon: User },
  { name: "Configurações", href: "/parceiro/configuracoes", icon: Settings },
];

const NO_LAYOUT_PATHS = ["/parceiro/registo"];

function SidebarLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive =
    pathname === item.href ||
    (pathname.startsWith(item.href + "/") && item.href !== "/parceiro");

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all group relative ${
        isActive
          ? "bg-[#902ad1] text-white shadow-[0_4px_14px_rgba(144,42,209,0.3)]"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      }`}
    >
      <Icon
        size={16}
        className={`shrink-0 ${
          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-650"
        }`}
      />
      <span className="text-[13px] font-semibold truncate">{item.name}</span>
      {item.badge && item.badge > 0 && (
        <span className="ml-auto bg-rose-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
      {isActive && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
      )}
    </Link>
  );
}

interface SidebarContentProps {
  parceiro: { nome: string; logo_url?: string | null } | null;
  perfil: { nome_completo?: string; foto_url?: string | null } | null;
  navItemsWithBadge: NavItem[];
  onLogout: () => void;
}

function SidebarContent({
  parceiro,
  perfil,
  navItemsWithBadge,
  onLogout,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo / Partner header */}
      {parceiro && (
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            {parceiro.logo_url ? (
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                <Image
                  src={parceiro.logo_url}
                  alt={parceiro.nome}
                  width={36}
                  height={36}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[#902ad1]/10 flex items-center justify-center shrink-0">
                <Handshake size={18} className="text-[#902ad1]" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#902ad1] uppercase tracking-widest leading-none">
                Parceiro
              </p>
              <p className="text-[13px] font-semibold text-slate-700 truncate mt-0.5">
                {parceiro.nome}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nav Principal */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-0.5 no-scrollbar">
        <p className="px-3.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          Gestão
        </p>
        {navItemsWithBadge.slice(0, 10).map((item) => (
          <SidebarLink key={item.href} item={item} />
        ))}

        <div className="h-px bg-slate-100 my-3" />

        <p className="px-3.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          Comunicação
        </p>
        {navItemsWithBadge.slice(10).map((item) => (
          <SidebarLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom Nav */}
      <div className="px-3 py-3 border-t border-slate-100 space-y-0.5">
        {BOTTOM_NAV.map((item) => (
          <SidebarLink key={item.href} item={item} />
        ))}

        {/* Perfil do utilizador */}
        <div className="mt-2 p-2 rounded-xl flex items-center gap-3 bg-slate-50">
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-[#902ad1]/10 flex items-center justify-center shrink-0 border border-[#902ad1]/15">
            {perfil?.foto_url ? (
              <Image
                src={perfil.foto_url}
                alt="Perfil"
                width={32}
                height={32}
                className="object-cover w-full h-full"
              />
            ) : (
              <User size={14} className="text-[#902ad1]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-slate-750 truncate">
              {perfil?.nome_completo?.split(" ")[0] || "Parceiro"}
            </p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mt-0.5">
              Parceiro
            </p>
          </div>

          <button
            onClick={onLogout}
            title="Sair"
            className="p-2 rounded-lg text-slate-450 hover:text-rose-500 hover:bg-rose-50 transition-all border-none bg-transparent cursor-pointer"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ParceiroLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [verificando, setVerificando] = useState(true);
  const [parceiro, setParceiro] = useState<{
    id: string;
    nome: string;
    logo_url?: string | null;
  } | null>(null);
  const [perfil, setPerfil] = useState<{
    nome_completo?: string;
    foto_url?: string | null;
  } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  // Dropdowns and Modal states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");
  const [dbSearchResults, setDbSearchResults] = useState<any[]>([]);

  // Live database notifications
  const [notificationsList, setNotificationsList] = useState<any[]>([]);

  // Command palette standard routes
  const searchRoutes = [
    { name: "Painel Geral", href: "/parceiro/dashboard", category: "Dashboard", icon: LayoutDashboard },
    { name: "Minhas Viaturas", href: "/parceiro/viaturas", category: "Frota", icon: Car },
    { name: "Gestão Motoristas", href: "/parceiro/motoristas", category: "Comunidade", icon: Users },
    { name: "Reservas Atribuídas", href: "/parceiro/reservas", category: "Serviços", icon: CalendarRange },
    { name: "Histórico Viagens", href: "/parceiro/viagens", category: "Serviços", icon: History },
    { name: "Relatório Financeiro", href: "/parceiro/financeiro", category: "Financeiro", icon: TrendingUp },
    { name: "Saldo & Carteira", href: "/parceiro/carteira", category: "Financeiro", icon: Wallet },
    { name: "Faturas e Taxas", href: "/parceiro/faturas", category: "Financeiro", icon: CreditCard },
    { name: "Gestão Clientes", href: "/parceiro/clientes", category: "Gestão", icon: UserCheck },
    { name: "Notificações Alertas", href: "/parceiro/notificacoes", category: "Portal", icon: Bell },
  ];

  const semLayout = useMemo(
    () => NO_LAYOUT_PATHS.includes(pathname),
    [pathname]
  );

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const clickOutside = () => {
      setShowNotifications(false);
      setShowProfileMenu(false);
    };
    window.addEventListener("click", clickOutside);
    return () => window.removeEventListener("click", clickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K
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

  // Fechar sidebar mobile ao navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Carregar Notificações do Banco de dados
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
      console.error("Erro ao buscar notificações do parceiro:", err);
    }
  }, []);

  const verificarAutenticacao = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // Buscar dados do parceiro
      const { data: parceiroData } = await supabase
        .from("parceiros")
        .select("id, nome, logo_url, ativo")
        .eq("usuario_id", user.id)
        .single();

      if (!parceiroData || !parceiroData.ativo) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      // Buscar perfil
      const { data: perfilData } = await supabase
        .from("perfis")
        .select("nome_completo, foto_url")
        .eq("id", user.id)
        .single();

      setParceiro(parceiroData);
      setPerfil(perfilData);

      // Carregar notificações iniciais
      await fetchNotifications(user.id);
    } catch (err) {
      console.error("Erro de autenticação:", err);
      router.replace("/login");
    } finally {
      setVerificando(false);
    }
  }, [router, fetchNotifications]);

  useEffect(() => {
    if (!semLayout) {
      verificarAutenticacao();
    } else {
      setVerificando(false);
    }
  }, [verificarAutenticacao, semLayout]);

  // Escuta de banco de dados em Tempo Real para Notificações & Perfil
  useEffect(() => {
    if (!parceiro?.id) return;

    // Realtime notificações
    const notifChannel = supabase
      .channel(`parceiro-notifs-${parceiro.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notificacoes", filter: `usuario_id=eq.${parceiro.id}` },
        () => {
          fetchNotifications(parceiro.id);
        }
      )
      .subscribe();

    // Realtime atualizações de perfil
    const profileChannel = supabase
      .channel(`parceiro-profile-${parceiro.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "perfis", filter: `id=eq.${parceiro.id}` },
        (payload) => {
          if (payload.new.nome_completo) {
            setPerfil((prev: any) => prev ? { ...prev, nome_completo: payload.new.nome_completo } : prev);
          }
          if (payload.new.foto_url) {
            setPerfil((prev: any) => prev ? { ...prev, foto_url: payload.new.foto_url } : prev);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [parceiro?.id, fetchNotifications]);

  // Debounced database search query para o Parceiro (Somente seus próprios dados)
  useEffect(() => {
    if (searchQuery.trim().length < 2 || !parceiro?.id) {
      setDbSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const parceiroId = parceiro.id;

        // Buscar viaturas do parceiro
        const { data: vehicles } = await supabase
          .from("viaturas")
          .select("id, marca, modelo, matricula")
          .eq("parceiro_id", parceiroId)
          .or(`marca.ilike.%${searchQuery}%,modelo.ilike.%${searchQuery}%,matricula.ilike.%${searchQuery}%`)
          .limit(3);

        const viaturaIds = (vehicles || []).map((v) => v.id);

        // Buscar motoristas do parceiro
        const { data: drivers } = await supabase
          .from("motoristas")
          .select(`
            id,
            perfis:perfil_id (
              nome_completo
            )
          `)
          .eq("parceiro_id", parceiroId);

        const formattedDrivers = (drivers || [])
          .map((d: any) => ({
            id: d.id,
            nome: Array.isArray(d.perfis) ? d.perfis[0]?.nome_completo : d.perfis?.nome_completo,
          }))
          .filter((d) => d.nome && d.nome.toLowerCase().includes(searchQuery.toLowerCase()))
          .slice(0, 3);

        const motoristaIds = (drivers || []).map((d) => d.id);

        // Buscar reservas atribuídas a essas viaturas/motoristas do parceiro
        let bookings: any[] = [];
        if (viaturaIds.length > 0 || motoristaIds.length > 0) {
          const orClause = [
            viaturaIds.length > 0 ? `viatura_id.in.(${viaturaIds.join(",")})` : null,
            motoristaIds.length > 0 ? `motorista_id.in.(${motoristaIds.join(",")})` : null,
          ]
            .filter(Boolean)
            .join(",");

          const { data: resData } = await supabase
            .from("reservas")
            .select("id, codigo, local_partida, local_destino")
            .or(orClause)
            .ilike("codigo", `%${searchQuery}%`)
            .limit(3);

          bookings = resData || [];
        }

        const results = [
          ...bookings.map((b) => ({
            name: `Reserva ${b.codigo}`,
            subtitle: `${b.local_partida} → ${b.local_destino}`,
            href: `/parceiro/reservas`,
            category: "Reservas (BD)",
            icon: CalendarRange,
          })),
          ...(vehicles || []).map((v) => ({
            name: `Viatura ${v.marca} ${v.modelo}`,
            subtitle: `Matrícula: ${v.matricula || "S/M"}`,
            href: `/parceiro/viaturas`,
            category: "Frota (BD)",
            icon: Car,
          })),
          ...formattedDrivers.map((d) => ({
            name: `Motorista ${d.nome}`,
            subtitle: "Perfil de Motorista",
            href: `/parceiro/motoristas`,
            category: "Motoristas (BD)",
            icon: Users,
          })),
        ];

        setDbSearchResults(results);
      } catch (err) {
        console.error("Erro na busca de banco parceiro:", err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, parceiro]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  }, [router]);

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
      console.error("Erro ao ler notificações:", err);
    }
  };

  const handleNotificationClick = async (e: React.MouseEvent, id: string, lida: boolean) => {
    e.stopPropagation();
    if (!lida) {
      try {
        await supabase
          .from("notificacoes")
          .update({ lida: true })
          .eq("id", id);

        setNotifCount((c) => Math.max(0, c - 1));
        setNotificationsList((prev) =>
          prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
        );
      } catch (err) {
        console.error("Erro ao ler notificação:", err);
      }
    }
    router.push("/parceiro/notificacoes");
    setShowNotifications(false);
  };

  const navItemsWithBadge: NavItem[] = useMemo(
    () =>
      NAV_ITEMS.map((item) =>
        item.href === "/parceiro/notificacoes"
          ? { ...item, badge: notifCount }
          : item
      ),
    [notifCount]
  );

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
      return "há pouco";
    }
  };

  if (semLayout) {
    return <>{children}</>;
  }

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-[#902ad1]" />
          <p className="text-[13px] font-semibold text-slate-400">
            A verificar acesso...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* ── Command Palette (Ctrl+K Modal com busca de Banco de Dados) ── */}
      {showSearchModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh] p-4 animate-in fade-in duration-200"
          onClick={() => setShowSearchModal(false)}
        >
          <div
            className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Pesquisar páginas ou dados reais do parceiro (ex: reservas, veículos, motoristas)..."
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
              {/* Páginas do Painel */}
              <div className="px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                {searchQuery ? "Páginas do Painel" : "Atalhos Sugeridos"}
              </div>

              {filteredRoutes.map((route, i) => {
                const RouteIcon = route.icon;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      router.push(route.href);
                      setShowSearchModal(false);
                      setSearchQuery("");
                    }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-650 hover:bg-[#902ad1]/5 hover:text-[#902ad1] transition-all cursor-pointer group"
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

              {/* Resultados em Tempo Real do Banco de Dados (Sincronizado) */}
              {dbSearchResults.length > 0 && (
                <>
                  <div className="px-3 py-1.5 mt-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-50 pt-2">
                    Resultados do Banco de Dados (Sincronizado)
                  </div>
                  {dbSearchResults.map((item, i) => {
                    const ItemIcon = item.icon;
                    return (
                      <div
                        key={`db-${i}`}
                        onClick={() => {
                          router.push(item.href);
                          setShowSearchModal(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-650 hover:bg-[#902ad1]/5 hover:text-[#902ad1] transition-all cursor-pointer group"
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
                  Nenhum registro correspondente a "{searchQuery}" sob a sua frota ou painel.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 shrink-0 z-40 sticky top-0 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02),0_4px_6px_-2px_rgba(0,0,0,0.01)]">
        {/* Left Side: Logo */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger menu */}
          <button
            onClick={() => setMobileOpen(true)}
            title="Abrir menu"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer lg:hidden shrink-0"
          >
            <Menu size={20} />
          </button>

          <Link href="/parceiro/dashboard" className="flex items-center">
            <div className="relative w-36 h-10 hover:scale-[1.02] transition-transform duration-200">
              <Image
                src="/logo.png"
                alt="WiTransfer"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Middle Side: Command-style Search Bar */}
        <div
          onClick={() => setShowSearchModal(true)}
          className="hidden md:flex items-center relative w-72 lg:w-[380px] group cursor-pointer"
        >
          <Search size={14} className="absolute left-3.5 text-slate-400 group-hover:text-[#902ad1] transition-colors" />
          <input
            type="text"
            readOnly
            placeholder="Pesquisar no portal (Ctrl+K)..."
            className="w-full pl-10 pr-12 py-2 bg-slate-50/60 hover:bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-455 focus:bg-white focus:border-[#902ad1]/60 focus:ring-4 focus:ring-[#902ad1]/5 transition-all outline-none cursor-pointer"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-bold text-slate-400 select-none shadow-sm pointer-events-none">
            Ctrl+K
          </kbd>
        </div>

        {/* Right Side: Notification Bell + Avatar */}
        <div className="flex items-center gap-5">
          
          {/* Notifications bell with dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative p-2 text-slate-450 hover:text-[#902ad1] hover:bg-[#902ad1]/5 rounded-xl border border-slate-100 hover:border-[#902ad1]/10 transition-all cursor-pointer block"
            >
              <Bell size={16} />
              {notifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div
                className="absolute right-0 mt-3.5 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100/90 py-3 z-50 animate-in fade-in slide-in-from-top-3 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-800 tracking-tight">Notificações</span>
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
                      className={`px-4 py-3.5 hover:bg-slate-50/50 transition-colors text-left w-full cursor-pointer flex gap-3 relative ${
                        !notif.lida ? "bg-[#902ad1]/3" : ""
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!notif.lida ? "bg-[#902ad1]" : "bg-transparent"}`} />
                      <div className="space-y-1 pr-4">
                        <p className="text-xs font-bold text-slate-750 leading-tight">
                          {notif.titulo}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                          {notif.mensagem}
                        </p>
                        <span className="text-[9px] text-slate-400 font-medium block flex items-center gap-1">
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
                    href="/parceiro/notificacoes"
                    onClick={() => setShowNotifications(false)}
                    className="text-[10px] font-bold text-[#902ad1] hover:underline block"
                  >
                    Ver todas as notificações
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-[1px] bg-slate-100" />

          {/* Partner User Profile Card with Dropdown */}
          <div className="relative">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2.5 p-1.5 hover:bg-slate-50/70 hover:shadow-sm rounded-xl border border-transparent hover:border-slate-100/80 transition-all cursor-pointer group"
            >
              <div className="flex flex-col items-end hidden sm:flex pr-1">
                <span className="text-[12px] font-bold text-slate-800 tracking-tight leading-none group-hover:text-[#902ad1] transition-colors">
                  {perfil?.nome_completo?.split(" ")[0] || "Parceiro"}
                </span>
                <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">
                  {parceiro?.nome || "Portal"}
                </span>
              </div>

              <div className="relative">
                {perfil?.foto_url ? (
                  <div className="relative w-8.5 h-8.5 rounded-full overflow-hidden ring-2 ring-slate-100 group-hover:ring-[#902ad1]/20 transition-all shrink-0">
                    <Image src={perfil.foto_url} alt="Perfil" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-8.5 h-8.5 rounded-full bg-[#902ad1]/8 border border-[#902ad1]/15 group-hover:border-[#902ad1]/30 flex items-center justify-center text-[#902ad1] font-bold text-xs shrink-0 transition-colors">
                    {perfil?.nome_completo
                      ? perfil.nome_completo
                          .split(" ")
                          .filter(Boolean)
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "PA"}
                  </div>
                )}
                {/* Active green status dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
            </div>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div
                className="absolute right-0 mt-3.5 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100/90 py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 py-2.5 border-b border-slate-50">
                  <p className="text-xs font-bold text-slate-800 leading-none">{perfil?.nome_completo || "Parceiro"}</p>
                  <p className="text-[10px] text-slate-400 font-semibold block mt-1">
                    {parceiro?.nome || "Portal do Parceiro"}
                  </p>
                </div>

                <div className="flex flex-col py-1.5">
                  <Link
                    href="/parceiro/perfil"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-650 hover:bg-[#902ad1]/5 hover:text-[#902ad1] transition-all cursor-pointer"
                  >
                    <User size={13} />
                    <span>Meu Perfil</span>
                  </Link>
                  <Link
                    href="/parceiro/configuracoes"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-650 hover:bg-[#902ad1]/5 hover:text-[#902ad1] transition-all cursor-pointer"
                  >
                    <Settings size={13} />
                    <span>Configurações</span>
                  </Link>

                  <div className="h-[1px] bg-slate-50 my-1.5" />

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50/50 hover:text-rose-700 transition-all cursor-pointer border-none bg-transparent w-full text-left"
                  >
                    <LogOut size={13} />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Main Workspace (Sidebar + Page content) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white border-r border-slate-100 shadow-[1px_0_0_0_rgba(0,0,0,0.03)] z-30">
          <SidebarContent
            parceiro={parceiro}
            perfil={perfil}
            navItemsWithBadge={navItemsWithBadge}
            onLogout={handleLogout}
          />
        </aside>

        {/* Overlay Mobile Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar Mobile Overlay drawer */}
        <aside
          className={`fixed left-0 top-0 bottom-0 w-[240px] bg-white border-r border-slate-100 z-50 lg:hidden transform transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>
          <SidebarContent
            parceiro={parceiro}
            perfil={perfil}
            navItemsWithBadge={navItemsWithBadge}
            onLogout={handleLogout}
          />
        </aside>

        {/* Content Page area */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/30 no-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
