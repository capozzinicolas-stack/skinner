import Link from "next/link";

// Branded 404 in Portuguese (replaces Next.js' default English page).
export default function NotFound() {
  return (
    <main className="min-h-screen bg-blanc-casse flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-[10px] text-pierre uppercase tracking-skinners font-light">Skinner</p>
        <h1 className="font-serif text-2xl text-carbone mt-4">Página não encontrada</h1>
        <div className="w-12 h-px bg-sable mx-auto my-5" />
        <p className="text-sm text-pierre font-light leading-relaxed">
          O endereço que você acessou não existe ou não está mais disponível. Confira o link
          recebido ou volte para a página inicial.
        </p>
        <Link
          href="/"
          className="inline-block mt-8 px-8 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
