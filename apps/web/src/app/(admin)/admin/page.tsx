export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin Skinner</h1>
      <p className="text-muted-foreground mt-2">
        Painel de administração da plataforma.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <p className="text-sm text-muted-foreground">Tenants ativos</p>
          <p className="text-3xl font-bold text-brand-600 mt-1">0</p>
        </div>
        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <p className="text-sm text-muted-foreground">Análises este mês</p>
          <p className="text-3xl font-bold text-brand-600 mt-1">0</p>
        </div>
        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <p className="text-sm text-muted-foreground">MRR</p>
          <p className="text-3xl font-bold text-brand-600 mt-1">R$ 0</p>
        </div>
      </div>
    </div>
  );
}
