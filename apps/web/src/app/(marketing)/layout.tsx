import { resolveLocale } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/client";
import { MarketingChrome } from "./_chrome";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await resolveLocale();
  return (
    <I18nProvider locale={locale}>
      <MarketingChrome>{children}</MarketingChrome>
    </I18nProvider>
  );
}
