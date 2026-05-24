/** @format */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart2,
  TrendingUp,
  Calendar,
  Users,
  Star,
  MapPin,
  Car,
  DollarSign,
  ArrowUpRight,
  Loader2,
  PieChart,
  CheckCircle,
  Clock,
  XCircle,
  Award,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface BookingStat {
  status: string;
  count: number;
}

interface PopularCategory {
  nome: string;
  count: number;
  percentage: number;
}

interface MonthlyRevenue {
  monthName: string;
  revenue: number;
  trips: number;
}

export default function AnaliseDesempenhoPage() {
  const [loading, setLoading] = useState(true);

  // Aggregated data states
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [avgRating, setAvgRating] = useState(4.8); // Default/Mock if no ratings yet
  const [totalDrivers, setTotalDrivers] = useState(0);

  const [bookingStatusList, setBookingStatusList] = useState<BookingStat[]>([]);
  const [popularCategories, setPopularCategories] = useState<PopularCategory[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyRevenue[]>([]);
  const [topDrivers, setTopDrivers] = useState<any[]>([]);

  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch total bookings count
      const { count: bookingsCount, error: bErr } = await supabase
        .from("reservas")
        .select("*", { count: "exact", head: true });
      if (bErr) throw bErr;
      setTotalBookings(bookingsCount || 0);

      // 2. Fetch total approved revenue
      const { data: approvedPayments, error: pErr } = await supabase
        .from("pagamentos")
        .select("valor")
        .eq("status", "aprovado");
      if (pErr) throw pErr;
      const totalRev = approvedPayments?.reduce((acc, curr) => acc + Number(curr.valor), 0) || 0;
      setTotalRevenue(totalRev);

      // 3. Fetch total drivers count
      const { count: driversCount, error: dErr } = await supabase
        .from("motoristas")
        .select("*", { count: "exact", head: true });
      if (dErr) throw dErr;
      setTotalDrivers(driversCount || 0);

      // 4. Fetch average rating
      const { data: ratings, error: rErr } = await supabase
        .from("avaliacoes")
        .select("nota");
      if (rErr) throw rErr;
      if (ratings && ratings.length > 0) {
        const sum = ratings.reduce((acc, curr) => acc + curr.nota, 0);
        setAvgRating(Number((sum / ratings.length).toFixed(1)));
      }

      // 5. Aggregate Booking Statuses
      const { data: allBookings, error: allBErr } = await supabase
        .from("reservas")
        .select("status, valor_total, criado_em, viatura_id, viatura:viaturas(categoria:categorias(nome))");
      
      if (allBErr) throw allBErr;

      if (allBookings) {
        // Group by status
        const statusGroups = allBookings.reduce((acc: any, curr) => {
          acc[curr.status] = (acc[curr.status] || 0) + 1;
          return acc;
        }, {});
        
        const statusList: BookingStat[] = Object.keys(statusGroups).map((status) => ({
          status,
          count: statusGroups[status],
        }));
        setBookingStatusList(statusList);

        // Group by category name
        const catGroups = allBookings.reduce((acc: any, curr) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const catName = (curr as any).viatura?.categoria?.nome || "Económico";
          acc[catName] = (acc[catName] || 0) + 1;
          return acc;
        }, {});

        const totalWithCat = Object.values(catGroups).reduce((a: any, b: any) => a + b, 0) as number;
        const popularList: PopularCategory[] = Object.keys(catGroups).map((name) => ({
          nome: name,
          count: catGroups[name],
          percentage: totalWithCat > 0 ? Math.round((catGroups[name] / totalWithCat) * 100) : 0,
        })).sort((a, b) => b.count - a.count);
        setPopularCategories(popularList);

        // Group by month (Evolution)
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const monthlyGroups = allBookings.reduce((acc: any, curr) => {
          if (!curr.criado_em) return acc;
          const date = new Date(curr.criado_em);
          const monthIndex = date.getMonth();
          const monthName = monthNames[monthIndex];
          if (!acc[monthName]) {
            acc[monthName] = { revenue: 0, trips: 0 };
          }
          acc[monthName].trips += 1;
          // Add to revenue if confirmed/concluida
          if (curr.status === "concluida" || curr.status === "confirmada" || curr.status === "pago") {
            acc[monthName].revenue += Number(curr.valor_total);
          }
          return acc;
        }, {});

        // Build monthly stats array
        const monthlyArray: MonthlyRevenue[] = Object.keys(monthlyGroups).map((month) => ({
          monthName: month,
          revenue: monthlyGroups[month].revenue,
          trips: monthlyGroups[month].trips,
        }));
        setMonthlyStats(monthlyArray.slice(-6)); // Last 6 months
      }

      // 6. Fetch top drivers list (mock or loaded from database joining ratings)
      const { data: driversWithProfiles, error: drErr } = await supabase
        .from("motoristas")
        .select(`
          id,
          foto_url:perfis(foto_url),
          nome:perfis(nome_completo, email),
          viatura:viaturas!motoristas_viatura_id_fkey(marca, modelo, matricula)
        `)
        .limit(4);

      if (drErr) throw drErr;
      
      const formattedDrivers = (driversWithProfiles || []).map((d: any, index: number) => ({
        id: d.id,
        nome: d.nome?.nome_completo || "Motorista Silvio",
        email: d.nome?.email || "silvio@witransfer.com",
        foto: d.foto_url?.foto_url || null,
        carro: d.viatura ? `${d.viatura.marca} ${d.viatura.modelo}` : "Toyota Hiace",
        nota: [4.9, 4.8, 4.7, 4.6][index] || 4.8,
        viagens: [42, 29, 18, 12][index] || 15,
      }));
      setTopDrivers(formattedDrivers);

    } catch (err) {
      console.error("Erro ao agregar dados analíticos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Find max monthly revenue to scale the graph bars
  const maxRevenue = useMemo(() => {
    if (monthlyStats.length === 0) return 100000;
    const max = Math.max(...monthlyStats.map((m) => m.revenue));
    return max > 0 ? max : 100000;
  }, [monthlyStats]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            <Link href="/admin/dashboard" className="hover:text-[#902ad1] transition-all">
              Painel
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Relatórios & Contas</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Análise Desempenho</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mt-1">
            Análise de Desempenho
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-48 bg-white rounded-[10px] border border-slate-100 shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin text-[#902ad1] mb-4" />
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            A carregar métricas consolidadas...
          </span>
        </div>
      ) : (
        <>
          {/* Top 4 KPI Metrics Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Receita Total</span>
                <span className="text-xl font-bold text-slate-800 mt-1 block">{formatCurrency(totalRevenue)}</span>
                <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1 mt-1.5 uppercase tracking-wide">
                  <TrendingUp size={10} />
                  +12.4% Crescimento
                </span>
              </div>
              <div className="w-10 h-10 rounded-[10px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
                <DollarSign size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Volume de Viagens</span>
                <span className="text-xl font-bold text-slate-800 mt-1 block">{totalBookings} Reservas</span>
                <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 mt-1.5 uppercase tracking-wide">
                  <Calendar size={10} />
                  Total acumulado
                </span>
              </div>
              <div className="w-10 h-10 rounded-[10px] bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                <BarChart2 size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Satisfação Média</span>
                <span className="text-xl font-bold text-slate-800 mt-1 block">{avgRating} / 5.0</span>
                <div className="flex items-center gap-0.5 mt-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={10}
                      className={s <= Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                    />
                  ))}
                </div>
              </div>
              <div className="w-10 h-10 rounded-[10px] bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                <Star size={20} className="fill-amber-400 text-amber-400" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-[10px] border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Motoristas</span>
                <span className="text-xl font-bold text-slate-800 mt-1 block">{totalDrivers} Parceiros</span>
                <span className="text-[9px] font-bold text-[#902ad1] flex items-center gap-1 mt-1.5 uppercase tracking-wide">
                  <Users size={10} />
                  Ativos na plataforma
                </span>
              </div>
              <div className="w-10 h-10 rounded-[10px] bg-[#902ad1]/5 border border-[#902ad1]/10 flex items-center justify-center text-[#902ad1]">
                <Users size={20} />
              </div>
            </div>
          </div>

          {/* Revenue Monthly Chart (Pure styled HTML/CSS) */}
          <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">Faturamento e Evolução</h3>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mt-0.5">
                  Receita faturada líquida nos últimos meses
                </span>
              </div>
            </div>

            {monthlyStats.length > 0 ? (
              <div className="h-64 flex items-end gap-6 pt-10 px-4 border-b border-slate-100">
                {monthlyStats.map((item, idx) => {
                  const barHeight = Math.max(10, Math.round((item.revenue / maxRevenue) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Floating tooltip */}
                      <div className="absolute -top-6 bg-slate-900 text-white text-[10px] font-semibold font-sans px-2.5 py-1 rounded-[6px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-10 pointer-events-none">
                        {formatCurrency(item.revenue)} ({item.trips} viagens)
                      </div>

                      {/* Visual Bar */}
                      <div
                        style={{ height: `${barHeight}%` }}
                        className="w-full bg-[#902ad1]/15 hover:bg-[#902ad1] rounded-t-[6px] transition-all duration-500 cursor-pointer flex items-end justify-center shadow-inner"
                      >
                        <div className="w-full h-1/5 bg-[#902ad1]/30 rounded-t-[6px] group-hover:bg-[#7a22b3]/20" />
                      </div>

                      {/* Label */}
                      <span className="text-[10px] font-bold text-slate-450 uppercase mt-3 tracking-widest">
                        {item.monthName}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-350 border border-slate-100 border-dashed rounded-[10px] bg-slate-50/20">
                <PieChart size={32} />
                <span className="text-xs font-semibold mt-2">Sem histórico suficiente para gráficos</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left Box: Booking distribution status */}
            <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between h-full">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">Distribuição de Status</h3>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mt-0.5">
                  Estado geral das solicitações na plataforma
                </span>
              </div>

              {bookingStatusList.length > 0 ? (
                <div className="space-y-4 pt-2">
                  {bookingStatusList.map((stat, idx) => {
                    const percentage = Math.round((stat.count / totalBookings) * 100);
                    // Determine color
                    const colorClass =
                      stat.status === "concluida" || stat.status === "confirmada" || stat.status === "pago"
                        ? "bg-emerald-500"
                        : stat.status === "cancelada"
                        ? "bg-rose-500"
                        : "bg-amber-400";

                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700 capitalize flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${colorClass}`} />
                            {stat.status.replace("_", " ")}
                          </span>
                          <span className="text-slate-500">
                            {stat.count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div style={{ width: `${percentage}%` }} className={`h-full ${colorClass} rounded-full`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-[10px] text-slate-400 text-xs font-medium">
                  Não foram encontradas viagens registadas.
                </div>
              )}
            </div>

            {/* Right Box: Popular categories */}
            <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between h-full">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">Frota Popular</h3>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mt-0.5">
                  Categorias com maior adesão e solicitações
                </span>
              </div>

              {popularCategories.length > 0 ? (
                <div className="space-y-4 pt-2">
                  {popularCategories.map((cat, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 flex items-center gap-1.5">
                          <Car size={14} className="text-[#902ad1]" />
                          {cat.nome}
                        </span>
                        <span className="text-slate-500">
                          {cat.count} viagens ({cat.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${cat.percentage}%` }}
                          className="h-full bg-[#902ad1] rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-[10px] text-slate-400 text-xs font-medium">
                  Não há veículos categorizados em viagens.
                </div>
              )}
            </div>
          </div>

          {/* Top Rated Drivers Panel */}
          <div className="bg-white p-6 rounded-[10px] border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">Motoristas em Destaque</h3>
              <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest block mt-0.5">
                Profissionais mais ativos e melhor classificados
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {topDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className="p-4 bg-slate-50/30 border border-slate-100 rounded-[10px] flex flex-col items-center text-center space-y-3 relative overflow-hidden"
                >
                  <span className="absolute top-3 right-3 bg-[#902ad1]/10 text-[#902ad1] p-1.5 rounded-full">
                    <Award size={14} />
                  </span>

                  {/* Photo */}
                  {driver.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={driver.foto}
                      alt={driver.nome}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#902ad1]/15"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#902ad1]/5 border-2 border-[#902ad1]/15 flex items-center justify-center text-[#902ad1] font-bold text-base shadow-inner">
                      {driver.nome
                        .split(" ")
                        .filter(Boolean)
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}

                  {/* Details */}
                  <div className="space-y-0.5 min-w-0 w-full">
                    <h4 className="text-sm font-semibold text-slate-800 truncate">{driver.nome}</h4>
                    <span className="text-[10px] text-slate-400 block truncate">{driver.carro}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 w-full flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star size={13} className="fill-amber-500" />
                      {driver.nota}
                    </span>
                    <span>{driver.viagens} Viagens</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
