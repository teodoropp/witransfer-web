/** @format */

"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  User,
  ChevronDown,
  ChevronRight,
  Activity,
  BarChart,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface MenuItem {
  name: string;
  href?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  subItems?: MenuItem[];
}

const SidebarItem = ({ item }: { item: MenuItem }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const Icon = item.icon;

  if (!hasSubItems) {
    return (
      <Link
        href={item.href || "#"}
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-500 hover:bg-primary/5 hover:text-primary transition-all group relative">
        <Icon
          size={16}
          className="group-hover:scale-110 transition-transform"
        />
        <span className="text-[13px] font-semibold">{item.name}</span>
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-slate-500 hover:bg-primary/5 hover:text-primary transition-all group">
        <div className="flex items-center gap-3">
          <Icon
            size={16}
            className="group-hover:scale-110 transition-transform"
          />
          <span className="text-[13px] font-semibold">{item.name}</span>
        </div>
        <div className="text-slate-300 group-hover:text-primary transition-colors">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      {isOpen && (
        <div className="ml-6 space-y-1 border-l-2 border-slate-50 pl-4 animate-in slide-in-from-top-2 duration-200">
          {item.subItems?.map((sub, idx) => {
            const SubIcon = sub.icon;
            return (
              <Link
                key={idx}
                href={sub.href || "#"}
                className="flex items-center gap-3 py-2 rounded-md text-slate-400 hover:text-primary transition-all group">
                <SubIcon
                  size={14}
                  className="opacity-70 group-hover:opacity-100"
                />
                <span className="text-[12px] font-medium">{sub.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: perfil } = await supabase
            .from("perfis")
            .select("nome")
            .eq("id", user.id)
            .single();

          if (perfil?.nome) {
            setAdminName(perfil.nome.split(" ")[0]);
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
      title: "Gestão Operacional",
      items: [
        {
          name: "Reservas & Viagens",
          icon: CalendarRange,
          subItems: [
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
          name: "Gestão de Frota",
          icon: Car,
          subItems: [
            { name: "Viaturas", href: "/admin/viaturas", icon: Car },
            { name: "Categorias", href: "/admin/categorias", icon: Grid },
            {
              name: "Extras de Serviço",
              href: "/admin/extras",
              icon: PlusCircle,
            },
          ],
        },
        {
          name: "Comunidade",
          icon: Users,
          subItems: [
            { name: "Motoristas", href: "/admin/motoristas", icon: Users },
            { name: "Parceiros", href: "/admin/parceiros", icon: Handshake },
            { name: "Clientes", href: "/admin/clientes", icon: Users2 },
          ],
        },
      ],
    },
    {
      title: "Marketing & Finanças",
      items: [
        {
          name: "Comunicação",
          icon: Bell,
          subItems: [
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
          name: "Relatórios & Contas",
          icon: FileText,
          subItems: [
            { name: "Pagamentos", href: "/admin/pagamentos", icon: CreditCard },
            {
              name: "Financeiro Geral",
              href: "/admin/financeiro",
              icon: Activity,
            },
            {
              name: "Análise Desempenho",
              href: "/admin/desempenho",
              icon: BarChart,
            },
            {
              name: "Exportação Dados",
              href: "/admin/exportar",
              icon: Download,
            },
          ],
        },
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
      <aside className="w-64 bg-white text-slate-600 flex flex-col hidden md:flex sticky top-0 h-screen overflow-hidden border-r border-slate-200 z-30 shadow-sm">
        <div className="p-8 pb-10 flex flex-col items-center">
          <div className="relative w-full aspect-[3/1] mb-2">
            <Image
              src="/logo.png"
              alt="WiTransfer"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="h-[1px] w-full bg-slate-100 mt-6" />
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-2 no-scrollbar pb-10">
          {menuStructure.map((group, idx) => (
            <div key={idx} className="mb-6">
              <h3 className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">
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
            <span className="text-xs font-bold uppercase tracking-widest">
              Sair do Sistema
            </span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0 shadow-sm z-20">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
              Visão Administrativa
            </span>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">
              Olá, {adminName}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-900">
                {adminName}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                WiTransfer Global
              </span>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/5 border-2 border-primary/10 flex items-center justify-center text-primary font-black shadow-inner overflow-hidden">
              <User size={24} />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10 bg-slate-50/30 no-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
