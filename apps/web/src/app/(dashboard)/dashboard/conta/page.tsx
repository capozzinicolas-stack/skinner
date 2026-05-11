"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { useI18n } from "@/lib/i18n/client";

export default function MinhaContaPage() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const me = trpc.user.me.useQuery();

  const [profile, setProfile] = useState({ name: "", email: "" });
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [locale, setLocale] = useState<"pt-BR" | "es" | "en" | "">("");
  const [localeMsg, setLocaleMsg] = useState<string | null>(null);
  const updateLocale = trpc.user.updateLocale.useMutation({
    onSuccess: () => {
      setLocaleMsg("Preferencia salva. Recarregando...");
      // Hard reload so server-rendered i18n picks up the new locale on next nav.
      // Wired in Commit 3 — for now persists the choice but UI stays in pt-BR.
      setTimeout(() => window.location.reload(), 800);
    },
    onError: (err) => setLocaleMsg(err.message),
  });

  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

  const requestDataDeletion = trpc.user.requestDataDeletion.useMutation({
    onSuccess: () => {
      setDeleteMsg("Solicitacao processada. Sua sessao sera encerrada em instantes.");
      setTimeout(() => signOut({ callbackUrl: "/login" }), 2000);
    },
    onError: (err) => setDeleteMsg(err.message),
  });

  useEffect(() => {
    if (me.data) {
      setProfile({ name: me.data.name, email: me.data.email });
      const ml = me.data.locale;
      if (ml === "pt-BR" || ml === "es" || ml === "en") setLocale(ml);
      else setLocale("");
    }
  }, [me.data]);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      setProfileMsg({ type: "ok", text: "Dados atualizados." });
      utils.user.me.invalidate();
    },
    onError: (err) => {
      setProfileMsg({ type: "err", text: err.message });
    },
  });

  const changePassword = trpc.user.changePassword.useMutation({
    onSuccess: () => {
      setPwdMsg({ type: "ok", text: "Senha alterada com sucesso." });
      setPwd({ current: "", next: "", confirm: "" });
      utils.user.me.invalidate();
    },
    onError: (err) => {
      setPwdMsg({ type: "err", text: err.message });
    },
  });

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    updateProfile.mutate(profile);
  }

  function handlePwdSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);
    if (pwd.next !== pwd.confirm) {
      setPwdMsg({ type: "err", text: "As senhas novas nao coincidem." });
      return;
    }
    if (pwd.next.length < 8) {
      setPwdMsg({ type: "err", text: "A nova senha deve ter ao menos 8 caracteres." });
      return;
    }
    changePassword.mutate({ currentPassword: pwd.current, newPassword: pwd.next });
  }

  if (me.isLoading) {
    return <p className="p-8 text-sm text-pierre font-light">{t.dashboardPages.common_loading}</p>;
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="border-b border-sable/20 pb-6 mb-8">
        <h1 className="font-serif text-xl md:text-2xl text-carbone">{t.dashboardPages.acct_title}</h1>
        <p className="text-sm text-pierre font-light mt-1">
          {t.dashboardPages.acct_subtitle}
        </p>
      </div>

      {/* Dados pessoais */}
      <section className="mb-12">
        <h2 className="font-serif text-base text-carbone mb-4">{t.dashboardPages.acct_section_profile}</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4 bg-white border border-sable/20 p-6">
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              {t.dashboardPages.acct_name_label}
            </label>
            <input
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              required
              minLength={2}
              className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
            />
          </div>
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              {t.dashboardPages.acct_email_label}
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide disabled:opacity-50"
            >
              {updateProfile.isPending ? t.dashboardPages.common_saving : t.dashboardPages.common_save}
            </button>
            {profileMsg && (
              <p className={`text-sm font-light ${profileMsg.type === "ok" ? "text-carbone" : "text-pierre"}`}>
                {profileMsg.text}
              </p>
            )}
          </div>
        </form>
      </section>

      {/* Idioma da interface */}
      <section className="mb-12">
        <h2 className="font-serif text-base text-carbone mb-4">{t.dashboardPages.acct_section_locale}</h2>
        <div className="bg-white border border-sable/20 p-6 space-y-4">
          <p className="text-sm text-pierre font-light">
            {t.dashboardPages.acct_locale_section_text}
          </p>
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              {t.dashboardPages.acct_locale_label}
            </label>
            <select
              value={locale}
              onChange={(e) => {
                const v = e.target.value as "pt-BR" | "es" | "en" | "";
                setLocale(v);
                setLocaleMsg(null);
                updateLocale.mutate({ locale: v === "" ? null : v });
              }}
              className="w-full max-w-xs px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
            >
              <option value="">{t.dashboardPages.acct_locale_default_org}</option>
              <option value="pt-BR">Portugues (Brasil)</option>
              <option value="es">Espanol</option>
              <option value="en">English</option>
            </select>
            <p className="text-[10px] text-pierre/70 font-light mt-2">
              {t.dashboardPages.acct_locale_hint}
            </p>
          </div>
          {localeMsg && (
            <p className="text-sm text-pierre font-light">{localeMsg}</p>
          )}
        </div>
      </section>

      {/* Senha */}
      <section className="mb-12">
        <h2 className="font-serif text-base text-carbone mb-4">{t.dashboardPages.acct_section_password}</h2>
        {me.data?.passwordChangedAt === null && (
          <div className="mb-4 px-4 py-3 bg-ivoire border border-sable/30 text-sm text-carbone font-light">
            {t.dashboardPages.acct_pwd_temp_warning}
          </div>
        )}
        <form onSubmit={handlePwdSubmit} className="space-y-4 bg-white border border-sable/20 p-6">
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              {t.dashboardPages.acct_pwd_current}
            </label>
            <input
              type="password"
              value={pwd.current}
              onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
            />
          </div>
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              {t.dashboardPages.acct_pwd_new}
            </label>
            <input
              type="password"
              value={pwd.next}
              onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
            />
            <p className="text-[10px] text-pierre font-light mt-1">{t.dashboardPages.acct_pwd_min}</p>
          </div>
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              {t.dashboardPages.acct_pwd_confirm}
            </label>
            <input
              type="password"
              value={pwd.confirm}
              onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={changePassword.isPending}
              className="px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide disabled:opacity-50"
            >
              {changePassword.isPending ? t.dashboardPages.acct_pwd_changing : t.dashboardPages.acct_pwd_change}
            </button>
            {pwdMsg && (
              <p className={`text-sm font-light ${pwdMsg.type === "ok" ? "text-carbone" : "text-pierre"}`}>
                {pwdMsg.text}
              </p>
            )}
          </div>
        </form>
      </section>

      {/* Zona de risco — soft-delete + anonimizacao da conta (LGPD).
          Visivel apenas para b2b_admin do tenant. */}
      {me.data?.role === "b2b_admin" && (
        <section>
          <h2 className="font-serif text-base text-carbone mb-4">{t.dashboardPages.acct_section_delete}</h2>
          <div className="bg-white border border-terre/40 p-6 space-y-4">
            <p className="text-sm text-pierre font-light">
              {t.dashboardPages.acct_delete_body}
              <strong className="block mt-2 text-terre">{t.dashboardPages.acct_delete_warn}</strong>
            </p>
            <p className="text-xs text-pierre font-light">
              {t.dashboardPages.acct_delete_confirm_intro} <code className="bg-ivoire px-1.5 py-0.5">DELETAR</code>.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETAR"
              className="w-full max-w-xs px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-terre"
            />
            <div className="flex items-center gap-4">
              <button
                type="button"
                disabled={
                  deleteConfirmText !== "DELETAR" || requestDataDeletion.isPending
                }
                onClick={() => {
                  if (deleteConfirmText !== "DELETAR") return;
                  setDeleteMsg(null);
                  requestDataDeletion.mutate({ confirm: "DELETAR" });
                }}
                className="px-4 py-2 bg-terre text-blanc-casse text-sm font-light tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {requestDataDeletion.isPending ? t.dashboardPages.acct_delete_processing : t.dashboardPages.acct_delete_cta}
              </button>
              {deleteMsg && (
                <p className="text-sm text-pierre font-light">{deleteMsg}</p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
