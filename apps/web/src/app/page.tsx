export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-5xl font-bold text-brand-900 tracking-tight">
          Skinner
        </h1>
        <p className="text-xl text-brand-700 max-w-md mx-auto">
          Skin Intelligence Platform
        </p>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Plataforma de inteligência dermatológica com IA para análise facial
          instantânea e recomendação personalizada de tratamentos.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <a
            href="/login"
            className="px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            Entrar
          </a>
          <a
            href="/demo"
            className="px-6 py-3 border border-brand-300 text-brand-700 rounded-lg font-medium hover:bg-brand-50 transition-colors"
          >
            Demo
          </a>
        </div>
      </div>
    </main>
  );
}
