"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";

export default function MinhaContaPage() {
  const utils = trpc.useUtils();
  const me = trpc.user.me.useQuery();

  const [profile, setProfile] = useState({ name: "", email: "" });
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (me.data) {
      setProfile({ name: me.data.name, email: me.data.email });
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

      {/* Senha */}
      <section>
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
    </div>
  );
}
