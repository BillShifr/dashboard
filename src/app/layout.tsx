import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { AppShell } from "@/components/shell/AppShell";
import { currentUser } from "@/lib/auth";
import "@/styles/globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "ТФОМС Югры",
  description: "Редактор карт и диспансеризации Югры",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUser();
  return (
    <html lang="ru" className={`${manrope.variable} h-full`}>
      <body>
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
