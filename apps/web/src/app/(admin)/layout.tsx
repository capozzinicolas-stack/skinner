import { resolveDashboardLocale } from "@/lib/i18n/dashboard-locale";
import { I18nProvider } from "@/lib/i18n/client";
import { AdminChrome } from "./_chrome";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Same resolver as the B2B dashboard: User.locale → Tenant.defaultLocale →
  // cookie. For skinner_admin users there's typically no tenant, so the chain
  // falls through to cookie/header and then DEFAULT_LOCALE.
  const locale = await resolveDashboardLocale();
  return (
    <I18nProvider locale={locale}>
      <AdminChrome>{children}</AdminChrome>
    </I18nProvider>
  );
}
