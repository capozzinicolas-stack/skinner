import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { label: "Como funciona", href: "/como-funciona" },
  { label: "Planos", href: "/planos" },
  { label: "Demo", href: "/demo" },
  { label: "Contato", href: "/contato" },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-blanc-casse flex flex-col">
      {/* Nav */}
      <header className="py-5 px-8 flex items-center justify-between border-b border-sable/20">
        <Link href="/">
          <Image src="/brand/logo-primary.png" alt="Skinner" width={140} height={35} />
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-pierre font-light hover:text-carbone transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="px-6 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors"
          >
            Entrar
          </Link>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-sable/20 py-12 px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Image src="/brand/logo-primary.png" alt="Skinner" width={120} height={30} />
            <p className="text-xs text-pierre font-light mt-3 leading-relaxed">
              Inteligencia dermatologica com IA para analise facial e recomendacao personalizada.
            </p>
          </div>
          <div>
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-3">Produto</p>
            <div className="space-y-2">
              <Link href="/como-funciona" className="block text-sm text-pierre font-light hover:text-carbone">Como funciona</Link>
              <Link href="/planos" className="block text-sm text-pierre font-light hover:text-carbone">Planos</Link>
              <Link href="/demo" className="block text-sm text-pierre font-light hover:text-carbone">Demo</Link>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-3">Segmentos</p>
            <div className="space-y-2">
              <Link href="/laboratorios" className="block text-sm text-pierre font-light hover:text-carbone">Laboratorios</Link>
              <Link href="/clinicas" className="block text-sm text-pierre font-light hover:text-carbone">Clinicas</Link>
              <Link href="/farmacias" className="block text-sm text-pierre font-light hover:text-carbone">Farmacias</Link>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-3">Legal</p>
            <div className="space-y-2">
              <Link href="/privacidade" className="block text-sm text-pierre font-light hover:text-carbone">Privacidade</Link>
              <Link href="/termos" className="block text-sm text-pierre font-light hover:text-carbone">Termos de Uso</Link>
              <Link href="/contato" className="block text-sm text-pierre font-light hover:text-carbone">Contato</Link>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-8 pt-6 border-t border-sable/20 text-center">
          <p className="text-xs text-sable font-light">
            2026 Skinner. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
