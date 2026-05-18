export default function PartnerDashboard() {
  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Resumo da Frota</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-sm text-slate-500 font-medium">Ganhos da Frota (Mês)</p>
          <p className="text-3xl font-bold mt-2 text-blue-600">850.000 Kz</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-sm text-slate-500 font-medium">Viagens Concluídas</p>
          <p className="text-3xl font-bold mt-2 text-blue-600">124</p>
        </div>
      </div>
      
      {/* Placeholder para tabela recente */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Últimas Viagens dos Seus Motoristas</h3>
        </div>
        <div className="p-6 flex items-center justify-center h-48 text-slate-400">
          Nenhuma viagem registada recentemente.
        </div>
      </div>
    </div>
  );
}
