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
          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
        }`}
      />
      <span className="text-[13px] font-semibold truncate">{item.name}</span>
      {item.badge && item.badge > 0 && (
        <span className="ml-auto bg-rose-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
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
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {parceiro?.logo_url ? (
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
              {parceiro?.nome || "Portal"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav Principal */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-3.5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Gestão
        </p>
        {navItemsWithBadge.slice(0, 10).map((item) => (
          <SidebarLink key={item.href} item={item} />
        ))}

        <div className="h-px bg-slate-100 my-3" />

        <p className="px-3.5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
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
        <div className="mt-2 p-3 bg-slate-50 rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#902ad1]/10 flex items-center justify-center shrink-0">
            {perfil?.foto_url ? (
              <Image
                src={perfil.foto_url}
                alt="Perfil"
                width={36}
                height={36}
                className="object-cover w-full h-full"
              />
            ) : (
              <User size={16} className="text-[#902ad1]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-slate-700 truncate">
              {perfil?.nome_completo?.split(" ")[0] || "Parceiro"}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold">
              Portal Parceiro
            </p>
          </div>
          <button
            onClick={onLogout}
            title="Sair"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
          >
            <LogOut size={14} />
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

  const semLayout = useMemo(
    () => NO_LAYOUT_PATHS.includes(pathname),
    [pathname]
  );

  // Fechar sidebar mobile ao navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const verificarAutenticacao = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // Buscar dados do parceiro (vinculado pelo usuario_id)
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

      // Buscar perfil do utilizador
      const { data: perfilData } = await supabase
        .from("perfis")
        .select("nome_completo, foto_url")
        .eq("id", user.id)
        .single();

      // Contar notificações não lidas
      const { count } = await supabase
        .from("notificacoes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("lida", false);

      setParceiro(parceiroData);
      setPerfil(perfilData);
      setNotifCount(count || 0);
    } catch (err) {
      console.error("Erro de autenticação:", err);
      router.replace("/login");
    } finally {
      setVerificando(false);
    }
  }, [router]);

  useEffect(() => {
    if (!semLayout) {
      verificarAutenticacao();
    } else {
      setVerificando(false);
    }
  }, [verificarAutenticacao, semLayout]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  }, [router]);

  const navItemsWithBadge: NavItem[] = useMemo(
    () =>
      NAV_ITEMS.map((item) =>
        item.href === "/parceiro/notificacoes"
          ? { ...item, badge: notifCount }
          : item
      ),
    [notifCount]
  );

  // ── RENDERIZAÇÃO ÚNICA (sem early returns) ─────────────────────────────────

  // Páginas sem sidebar (login, registo) → renderizar apenas children
  if (semLayout) {
    return <>{children}</>;
  }

  // Loading state
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

  // Layout principal autenticado
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-[240px] shrink-0 bg-white border-r border-slate-100 shadow-[1px_0_0_0_rgba(0,0,0,0.03)]">
        <SidebarContent
          parceiro={parceiro}
          perfil={perfil}
          navItemsWithBadge={navItemsWithBadge}
          onLogout={handleLogout}
        />
      </aside>

      {/* Overlay Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Mobile */}
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

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar Mobile */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
          <Image
            src="/logo.png"
            alt="WiTransfer"
            width={110}
            height={34}
            className="object-contain"
            style={{ height: "auto" }}
          />
          <div className="w-9" />
        </header>

        {/* Página */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
