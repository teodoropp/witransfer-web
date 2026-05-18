import { Users, CreditCard, Activity, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
          <p className="text-slate-500 text-sm">Bem-vindo ao centro de controlo do WiTransfer.</p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 flex items-center gap-2 shadow-sm">
            <Activity size={16} className="text-primary" />
            Sistema Online
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Activity size={64} className="text-primary" />
          </div>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Reservas Ativas</p>
          <div className="flex items-end gap-3 mt-4">
            <p className="text-4xl font-black text-slate-800 tracking-tight">24</p>
            <span className="text-xs font-bold text-success mb-1 flex items-center gap-1">
              <TrendingUp size={12} /> +12%
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <CreditCard size={64} className="text-primary" />
          </div>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Receita Hoje</p>
          <div className="flex items-end gap-3 mt-4">
            <p className="text-4xl font-black text-slate-800 tracking-tight">142k <span className="text-xl font-medium text-slate-400">Kz</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Users size={64} className="text-primary" />
          </div>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Motoristas Online</p>
          <div className="flex items-end gap-3 mt-4">
            <p className="text-4xl font-black text-slate-800 tracking-tight">8</p>
            <span className="text-xs font-bold text-slate-400 mb-1">de 15 total</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 tracking-tight">Atividade em Tempo Real</h3>
          <button className="text-xs font-bold text-primary hover:underline">Ver tudo</button>
        </div>
        <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
             <Activity size={32} />
          </div>
          <div>
            <p className="font-bold text-slate-800">Sem atividade crítica</p>
            <p className="text-sm text-slate-400">As novas reservas aparecerão aqui automaticamente.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
