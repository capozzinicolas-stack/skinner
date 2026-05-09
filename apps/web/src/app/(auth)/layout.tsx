import { resolveLocale } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/client";

// Auth pages (login / forgot-password / reset-password) live outside the
// (marketing) route group, so they don't inherit its I18nProvider. This
// layout reads the same cookie-driven locale and provides the context so
// each auth page's useI18n() hook resolves correctly.
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await resolveLocale();
  return <I18nProvider locale={locale}>{children}</I18nProvider>;
}
