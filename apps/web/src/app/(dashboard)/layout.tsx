import { resolveDashboardLocale } from "@/lib/i18n/dashboard-locale";
import { I18nProvider } from "@/lib/i18n/client";
import { DashboardChrome } from "./_chrome";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await resolveDashboardLocale();
  return (
    <I18nProvider locale={locale}>
      <DashboardChrome>{children}</DashboardChrome>
    </I18nProvider>
  );
}
