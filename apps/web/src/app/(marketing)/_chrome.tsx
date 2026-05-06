"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

export function MarketingChrome({ children }: { children: React.ReactNode }) {
  const { t, locale } = useI18n();
  const navLinks = [
    { label: t.nav.product, href: "/como-funciona" },
    { label: t.nav.segments, href: "/segmentos" },
    { label: t.nav.results, href: "/demo" },
    { label: t.nav.plans, href: "/planos" },
  ];
  return (
    <div className="min-h-screen bg-blanc-casse flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-blanc-casse/85 backdrop-blur-sm border-b border-sable/30">
        <div className="max-w-[1200px] mx-auto px-8 py-[18px] flex items-center justify-between gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/brand/logo-primary.png" alt="Skinner" className="h-28 object-contain" />
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
            <LanguageSwitcher />
            <Link
              href="/login"
              className="text-[13px] text-terre hover:text-carbone hidden md:block"
            >
              {t.nav.login}
            </Link>
            <Link
              href="/contato"
              className="px-[22px] py-3 bg-carbone text-blanc-casse text-[13px] tracking-[0.02em] border border-carbone hover:bg-terre hover:translate-y-[-1px] transition-all"
            >
              {t.nav.cta}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-carbone text-blanc-casse pt-20 pb-6">
        <div className="max-w-[1200px] mx-auto px-8 grid grid-cols-1 md:grid-cols-5 gap-12">
          <div className="md:col-span-1">
            <img src="/brand/logo-primary.png" alt="Skinner" className="h-16 object-contain brightness-0 invert" />
            <p className="font-serif italic text-lg text-blanc-casse mt-4 mb-1">
              {t.footer.tagline_line1}<br />{t.footer.tagline_line2}
            </p>
            <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-sable mt-2">
              {t.footer.location}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-sable mb-2">{t.footer.section_product}</p>
            <Link href="/como-funciona" className="text-[13px] text-blanc-casse font-light hover:text-sable">{t.footer.link_how_it_works}</Link>
            <Link href="/demo" className="text-[13px] text-blanc-casse font-light hover:text-sable">{t.footer.link_results}</Link>
            <Link href="/planos" className="text-[13px] text-blanc-casse font-light hover:text-sable">{t.footer.link_plans}</Link>
            <Link href="/contato" className="text-[13px] text-blanc-casse font-light hover:text-sable">{t.footer.link_demo}</Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-sable mb-2">{t.footer.section_segments}</p>
            <Link href="/laboratorios" className="text-[13px] text-blanc-casse font-light hover:text-sable">{t.footer.link_labs}</Link>
            <Link href="/clinicas" className="text-[13px] text-blanc-casse font-light hover:text-sable">{t.footer.link_clinics}</Link>
            <Link href="/farmacias" className="text-[13px] text-blanc-casse font-light hover:text-sable">{t.footer.link_pharmacies}</Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-sable mb-2">{t.footer.section_company}</p>
            <Link href="/contato" className="text-[13px] text-blanc-casse font-light hover:text-sable">{t.footer.link_contact}</Link>
            <Link href="/contato" className="text-[13px] text-blanc-casse font-light hover:text-sable">{t.footer.link_press}</Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-sable mb-2">{t.footer.section_legal}</p>
            <Link href="/privacidade" className="text-[13px] text-blanc-casse font-light hover:text-sable">{t.footer.link_privacy}</Link>
            <Link href="/termos" className="text-[13px] text-blanc-casse font-light hover:text-sable">{t.footer.link_terms}</Link>
            <Link href="/contato" className="text-[13px] text-blanc-casse font-light hover:text-sable">{t.footer.link_lgpd}</Link>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto px-8 mt-20 pt-6 border-t border-sable/[0.18] flex justify-between">
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-sable">
            {t.footer.copyright}
          </span>
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-sable">
            v 1.0 · {locale}
          </span>
        </div>
      </footer>
    </div>
  );
}
