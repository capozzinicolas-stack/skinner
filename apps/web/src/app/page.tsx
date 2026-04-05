import Image from "next/image";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-blanc-casse">
      <div className="text-center space-y-8 px-4">
        <Image
          src="/brand/logo-primary.png"
          alt="Skinners"
          width={320}
          height={80}
          className="mx-auto"
          priority
        />
        <p className="text-pierre text-sm tracking-skinners uppercase font-light">
          Skin Intelligence Platform
        </p>
        <p className="text-pierre max-w-md mx-auto text-sm leading-relaxed font-light">
          Inteligencia dermatologica com IA para analise facial
          e recomendacao personalizada de tratamentos.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <a
            href="/login"
            className="px-8 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors"
          >
            Entrar
          </a>
          <a
            href="/demo"
            className="px-8 py-3 border border-sable text-terre text-sm font-light tracking-wide hover:bg-ivoire transition-colors"
          >
            Demo
          </a>
        </div>
      </div>
    </main>
  );
}
