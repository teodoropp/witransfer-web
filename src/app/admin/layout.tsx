/** @format */

"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
  FileText,
  Bell,
  Grid,
  PlusCircle,
  ShieldCheck,
  Megaphone,
  Plane,
  Download,
  Image as ImageIcon,
  ChevronRight,
  Activity,
  BarChart,
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
      className={`flex items-center gap-3 px-4 py-2.5 rounded-[10px] transition-all group relative ${
        isActive ? THEME_TOKENS.sidebarActive : THEME_TOKENS.sidebarInactive
      }`}>
      <Icon
        size={16}
        className={`${isActive ? "" : "group-hover:scale-110 opacity-70 group-hover:opacity-100"} transition-transform`}
      />
      <span className="text-[13px] font-medium">{item.name}</span>
      {isActive && (
        <div
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full animate-pulse ${THEME_TOKENS.sidebarIndicator}`}
        />
      )}
    </Link>
  );
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [adminName, setAdminName] = useState("Admin");
  const [adminPhoto, setAdminPhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
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
        }
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      }
    };
    fetchProfile();
  }, []);

  const menuStructure: { title: string; items: MenuItem[] }[] = [
    {
      title: "Visão Geral",
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
          name: "Solicitações",
          href: "/admin/solicitacoes",
          icon: ShieldCheck,
        },
        { name: "Aeroportos", href: "/admin/aeroportos", icon: Plane },
      ],
    },
    {
      title: "Gestão de Frota",
      items: [
        { name: "Viaturas", href: "/admin/viaturas", icon: Car },
        { name: "Categorias", href: "/admin/categorias", icon: Grid },
        { name: "Extras de Serviço", href: "/admin/extras", icon: PlusCircle },
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
      title: "Comunicação",
      items: [
        {
          name: "Notificações Push",
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
      title: "Relatórios & Contas",
      items: [
        { name: "Pagamentos", href: "/admin/pagamentos", icon: CreditCard },
        { name: "Financeiro Geral", href: "/admin/financeiro", icon: Activity },
        {
          name: "Análise Desempenho",
          href: "/admin/desempenho",
          icon: BarChart,
        },
        { name: "Exportação Dados", href: "/admin/exportar", icon: Download },
      ],
    },
    {
      title: "Configurações",
      items: [
        {
          name: "Definições Sistema",
          href: "/admin/configuracoes",
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white text-slate-600 flex flex-col hidden md:flex sticky top-0 h-screen overflow-hidden border-r border-slate-100 z-30 shadow-none">
        <div className="p-8 pb-6 flex flex-col items-center">
          <div className="relative w-full aspect-[3/1] mb-2">
            <Image
              src="/logo.png"
              alt="WiTransfer"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="h-[1px] w-full bg-slate-100 mt-4" />
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-2 no-scrollbar pb-10">
          {menuStructure.map((group, idx) => (
            <div key={idx} className="mb-6">
              <h3 className="px-4 text-[9px] font-semibold text-slate-400 uppercase tracking-[0.25em] mb-3">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item, itemIdx) => (
                  <SidebarItem key={itemIdx} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <Link
            href="/login"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-50 hover:text-white transition-all group">
            <LogOut size={18} />
            <span className="text-xs font-semibold uppercase tracking-widest">
              Sair do Sistema
            </span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white/85 backdrop-blur-md border-b border-slate-100/60 flex items-center justify-between px-6 shrink-0 z-20">
          <div />

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-slate-900">
                {adminName}
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                Administrador
              </span>
            </div>
            {adminPhoto ? (
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#902ad1]/15 shadow-inner shrink-0">
                <Image
                  src={adminPhoto}
                  alt={adminName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#902ad1]/5 border-2 border-[#902ad1]/10 flex items-center justify-center text-[#902ad1] font-semibold text-sm shadow-inner shrink-0">
                {adminName
                  ? adminName
                      .split(" ")
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "AD"}
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 bg-slate-50/30 no-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
