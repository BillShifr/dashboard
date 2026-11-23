import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { AppShell } from "@/components/shell/AppShell";
import { currentUser } from "@/lib/auth";
import "@/styles/globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-unbounded",
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
    <html
      lang="ru"
      className={`${manrope.variable} ${unbounded.variable} h-full`}
    >
      <body>
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
