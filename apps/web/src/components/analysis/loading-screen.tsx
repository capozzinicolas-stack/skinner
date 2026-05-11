"use client";

import { useState, useEffect, useMemo } from "react";
import { useI18n } from "@/lib/i18n/client";

export function LoadingScreen() {
  const { t } = useI18n();
  const messages = useMemo(
    () => [
      t.patient.loading_msg_1,
      t.patient.loading_msg_2,
      t.patient.loading_msg_3,
      t.patient.loading_msg_4,
      t.patient.loading_msg_5,
      t.patient.loading_msg_6,
      t.patient.loading_msg_7,
    ],
    [t],
  );
  const tips = useMemo(
    () => [
      t.patient.loading_tip_1,
      t.patient.loading_tip_2,
      t.patient.loading_tip_3,
      t.patient.loading_tip_4,
      t.patient.loading_tip_5,
    ],
    [t],
  );
  const [msgIdx, setMsgIdx] = useState(0);
  const [tipIdx] = useState(() => Math.floor(Math.random() * tips.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % messages.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="w-full max-w-lg mx-auto px-4 text-center">
      <div className="flex justify-center gap-3 mb-10">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-carbone animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      <h2 className="font-serif text-xl text-carbone mb-2">
        {t.patient.loading_title}
      </h2>
      <p className="text-sm text-pierre font-light min-h-[20px]">
        {messages[msgIdx]}
      </p>

      <div className="mt-8 w-full h-px bg-sable/30 overflow-hidden">
        <div className="h-full bg-carbone animate-pulse" style={{ width: "80%" }} />
      </div>

      <div className="mt-12 p-6 bg-ivoire border border-sable/20">
        <p className="text-[10px] text-pierre uppercase tracking-skinners font-light mb-2">
          {t.patient.loading_did_you_know}
        </p>
        <p className="text-sm text-terre font-light italic">{tips[tipIdx]}</p>
      </div>
    </div>
  );
}
