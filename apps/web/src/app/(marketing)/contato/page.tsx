"use client";

import { useState } from "react";

export default function ContatoPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", segment: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", company: "", segment: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="py-20 px-8">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-12">
          <p className="text-[10px] text-pierre uppercase tracking-skinners font-light mb-4">Contato</p>
          <h1 className="font-serif text-4xl text-carbone italic">Fale conosco</h1>
          <p className="text-pierre font-light mt-4">
            Preencha o formulario e entraremos em contato em ate 24 horas.
          </p>
        </div>

        {status === "sent" ? (
          <div className="p-8 bg-ivoire border border-sable/20 text-center">
            <h2 className="font-serif text-xl text-carbone">Mensagem enviada</h2>
            <p className="text-sm text-pierre font-light mt-2">
              Obrigado pelo interesse. Nossa equipe entrara em contato em breve.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-pierre uppercase tracking-wider font-light mb-2">Nome</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full px-4 py-3 border border-sable/40 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre"
              />
            </div>
            <div>
              <label className="block text-xs text-pierre uppercase tracking-wider font-light mb-2">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                className="w-full px-4 py-3 border border-sable/40 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre"
              />
            </div>
            <div>
              <label className="block text-xs text-pierre uppercase tracking-wider font-light mb-2">Empresa</label>
              <input
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                className="w-full px-4 py-3 border border-sable/40 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre"
              />
            </div>
            <div>
              <label className="block text-xs text-pierre uppercase tracking-wider font-light mb-2">Segmento</label>
              <select
                value={form.segment}
                onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))}
                className="w-full px-4 py-3 border border-sable/40 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre"
              >
                <option value="">Selecione...</option>
                <option value="laboratorio">Laboratorio / Marca</option>
                <option value="clinica">Clinica dermatologica</option>
                <option value="farmacia">Farmacia</option>
                <option value="spa">Spa / Estetica</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-pierre uppercase tracking-wider font-light mb-2">Mensagem</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-sable/40 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre"
              />
            </div>
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre disabled:opacity-50 transition-colors"
            >
              {status === "sending" ? "Enviando..." : "Enviar mensagem"}
            </button>
            {status === "error" && (
              <p className="text-sm text-terre font-light text-center">Erro ao enviar. Tente novamente.</p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
