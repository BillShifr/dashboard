import { Unbounded } from "next/font/google";

/** Display face for the login title and the reports list heading only. */
export const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: "600",
  variable: "--font-unbounded",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});
