import Link from "next/link";

const navLinks = [
  { label: "Produto", href: "/como-funciona" },
  { label: "Segmentos", href: "/segmentos" },
  { label: "Resultados", href: "/demo" },
  { label: "Planos", href: "/planos" },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-blanc-casse flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-blanc-casse/85 backdrop-blur-sm border-b border-sable/30">
        <div className="max-w-[1200px] mx-auto px-8 py-[18px] flex items-center justify-between gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/brand/logo-primary.png" alt="Skinner" className="h-8 object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] text-terre hover:text-carbone transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-[18px]">
            <Link
              href="/login"
              className="text-[13px] text-terre hover:text-carbone hidden md:block"
            >
              Entrar
            </Link>
            <Link
              href="/contato"
              className="px-[22px] py-3 bg-carbone text-blanc-casse text-[13px] tracking-[0.02em] border border-carbone hover:bg-terre hover:translate-y-[-1px] transition-all"
            >
              Solicitar demo
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-carbone text-blanc-casse pt-20 pb-6">
        <div className="max-w-[1200px] mx-auto px-8 grid grid-cols-1 md:grid-cols-5 gap-12">
          <div className="md:col-span-1">
            <img src="/brand/logo-primary.png" alt="Skinner" className="h-8 object-contain brightness-0 invert" />
            <p className="font-serif italic text-lg text-blanc-casse mt-4 mb-1">
              A pele e dados.<br />Nos lemos.
            </p>
            <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-sable mt-2">
              Sao Paulo, Brasil
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-sable mb-2">Produto</p>
            <Link href="/como-funciona" className="text-[13px] text-blanc-casse font-light hover:text-sable">Como funciona</Link>
            <Link href="/demo" className="text-[13px] text-blanc-casse font-light hover:text-sable">Resultados</Link>
            <Link href="/planos" className="text-[13px] text-blanc-casse font-light hover:text-sable">Planos</Link>
            <Link href="/contato" className="text-[13px] text-blanc-casse font-light hover:text-sable">Demo</Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-sable mb-2">Segmentos</p>
            <Link href="/laboratorios" className="text-[13px] text-blanc-casse font-light hover:text-sable">Laboratorios</Link>
            <Link href="/clinicas" className="text-[13px] text-blanc-casse font-light hover:text-sable">Clinicas</Link>
            <Link href="/farmacias" className="text-[13px] text-blanc-casse font-light hover:text-sable">Farmacias</Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-sable mb-2">Empresa</p>
            <Link href="/contato" className="text-[13px] text-blanc-casse font-light hover:text-sable">Contato</Link>
            <Link href="/contato" className="text-[13px] text-blanc-casse font-light hover:text-sable">Imprensa</Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-sable mb-2">Legal</p>
            <Link href="/privacidade" className="text-[13px] text-blanc-casse font-light hover:text-sable">Privacidade</Link>
            <Link href="/termos" className="text-[13px] text-blanc-casse font-light hover:text-sable">Termos</Link>
            <Link href="/contato" className="text-[13px] text-blanc-casse font-light hover:text-sable">LGPD</Link>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto px-8 mt-20 pt-6 border-t border-sable/[0.18] flex justify-between">
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-sable">
            2026 Skinner Tecnologia
          </span>
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-sable">
            v 1.0 · pt-BR
          </span>
        </div>
      </footer>
    </div>
  );
}
