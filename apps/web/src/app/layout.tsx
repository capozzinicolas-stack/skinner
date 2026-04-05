import type { Metadata } from "next";
import { Poppins, Lora } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-poppins",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-lora",
});

export const metadata: Metadata = {
  title: "Skinners — Skin Intelligence",
  description:
    "Plataforma de inteligencia dermatologica com IA para analise facial e recomendacao personalizada de tratamentos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} ${lora.variable}`}>
      <body className="font-sans bg-blanc-casse text-carbone antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
