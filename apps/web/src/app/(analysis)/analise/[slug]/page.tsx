export default function AnalysisPage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white">
      <div className="text-center space-y-4 px-4">
        <h1 className="text-3xl font-bold text-brand-900">
          Análise de Pele
        </h1>
        <p className="text-muted-foreground">
          Tenant: <span className="font-medium">{params.slug}</span>
        </p>
        <p className="text-sm text-muted-foreground max-w-md">
          Descubra o tipo da sua pele e receba recomendações personalizadas
          de tratamento em menos de 3 minutos.
        </p>
        <button className="px-8 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors">
          Iniciar Análise
        </button>
      </div>
    </main>
  );
}
