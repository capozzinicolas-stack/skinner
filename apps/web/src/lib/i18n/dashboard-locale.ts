// Dashboard-specific locale resolution. Used by the (dashboard)/layout server
// component to feed the I18nProvider.
//
// Priority (first non-null wins):
//   1. User.locale — explicit pick from /dashboard/conta.
//   2. Tenant.defaultLocale — org-level fallback from /dashboard/organizacao.
//   3. Cookie / Accept-Language — same generic resolver as the marketing site.
//
// Why staff prefs over tenant: a multi-locale team (e.g. Mexican analyst at a
// Brazilian clinic) can each work in their own language without the admin
// having to pick a "least bad" default. Patient flow is decoupled — channel
// → tenant → browser, never user.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@skinner/db";
import { resolveLocale as resolveGenericLocale } from "./server";
import { LOCALES, DEFAULT_LOCALE } from "./types";
import type { Locale } from "./types";

export async function resolveDashboardLocale(): Promise<Locale> {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          locale: true,
          tenant: { select: { defaultLocale: true } },
        },
      });
      const userLocale = user?.locale;
      if (
        userLocale &&
        (LOCALES as readonly string[]).includes(userLocale)
      ) {
        return userLocale as Locale;
      }
      const tenantLocale = user?.tenant?.defaultLocale;
      if (
        tenantLocale &&
        (LOCALES as readonly string[]).includes(tenantLocale)
      ) {
        return tenantLocale as Locale;
      }
    }
  } catch {
    // Best-effort. Falls through to the generic cookie/header resolver.
  }
  try {
    return await resolveGenericLocale();
  } catch {
    return DEFAULT_LOCALE;
  }
}
