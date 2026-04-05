export default function TenantDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="text-muted-foreground mt-2">
        Bem-vindo ao painel do seu negócio.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <p className="text-sm text-muted-foreground">Análises realizadas</p>
          <p className="text-3xl font-bold text-brand-600 mt-1">0</p>
        </div>
        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <p className="text-sm text-muted-foreground">Conversões</p>
          <p className="text-3xl font-bold text-brand-600 mt-1">0</p>
        </div>
        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <p className="text-sm text-muted-foreground">Produtos ativos</p>
          <p className="text-3xl font-bold text-brand-600 mt-1">0</p>
        </div>
        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <p className="text-sm text-muted-foreground">Créditos restantes</p>
          <p className="text-3xl font-bold text-brand-600 mt-1">200</p>
        </div>
      </div>
    </div>
  );
}
