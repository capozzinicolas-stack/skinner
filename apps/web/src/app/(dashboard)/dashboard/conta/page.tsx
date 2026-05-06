"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";

export default function MinhaContaPage() {
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
    return <p className="p-8 text-sm text-pierre font-light">Carregando...</p>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="border-b border-sable/20 pb-6 mb-8">
        <h1 className="font-serif text-2xl text-carbone">Minha Conta</h1>
        <p className="text-sm text-pierre font-light mt-1">
          Atualize seus dados pessoais e altere sua senha de acesso.
        </p>
      </div>

      {/* Dados pessoais */}
      <section className="mb-12">
        <h2 className="font-serif text-base text-carbone mb-4">Dados pessoais</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4 bg-white border border-sable/20 p-6">
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              Nome
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
              E-mail
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
              {updateProfile.isPending ? "Salvando..." : "Salvar dados"}
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
        <h2 className="font-serif text-base text-carbone mb-4">Idioma da interface</h2>
        <div className="bg-white border border-sable/20 p-6 space-y-4">
          <p className="text-sm text-pierre font-light">
            Defina o idioma do seu painel administrativo. Esta preferencia e
            individual e nao afeta o que seus pacientes veem nas analises.
          </p>
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              Idioma
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
              <option value="">Padrao da organizacao</option>
              <option value="pt-BR">Portugues (Brasil)</option>
              <option value="es">Espanol</option>
              <option value="en">English</option>
            </select>
            <p className="text-[10px] text-pierre/70 font-light mt-2">
              Em breve. A interface continua em portugues ate ativarmos as traducoes.
            </p>
          </div>
          {localeMsg && (
            <p className="text-sm text-pierre font-light">{localeMsg}</p>
          )}
        </div>
      </section>

      {/* Senha */}
      <section className="mb-12">
        <h2 className="font-serif text-base text-carbone mb-4">Alterar senha</h2>
        {me.data?.passwordChangedAt === null && (
          <div className="mb-4 px-4 py-3 bg-ivoire border border-sable/30 text-sm text-carbone font-light">
            Voce ainda esta usando uma senha temporaria. Recomendamos altera-la agora.
          </div>
        )}
        <form onSubmit={handlePwdSubmit} className="space-y-4 bg-white border border-sable/20 p-6">
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              Senha atual
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
              Nova senha
            </label>
            <input
              type="password"
              value={pwd.next}
              onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
            />
            <p className="text-[10px] text-pierre font-light mt-1">Minimo 8 caracteres.</p>
          </div>
          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              Confirmar nova senha
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
              {changePassword.isPending ? "Alterando..." : "Alterar senha"}
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
          <h2 className="font-serif text-base text-carbone mb-4">Excluir minha conta</h2>
          <div className="bg-white border border-terre/40 p-6 space-y-4">
            <p className="text-sm text-pierre font-light">
              Esta acao remove o acesso da sua clinica ao Skinner e anonimiza todos os dados
              dos pacientes (fotos, respostas e localizacao sao apagados; metricas agregadas
              sao preservadas para conformidade contabil). Usuarios da equipe sao despersonalizados.
              <strong className="block mt-2 text-terre">A acao nao pode ser desfeita por voce.</strong>
            </p>
            <p className="text-xs text-pierre font-light">
              Para confirmar, digite <code className="bg-ivoire px-1.5 py-0.5">DELETAR</code> abaixo.
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
                {requestDataDeletion.isPending ? "Processando..." : "Excluir conta definitivamente"}
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
