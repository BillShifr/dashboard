import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export default async function HomePage() {
  if (await currentUser()) redirect("/presets");
  redirect("/login");
}
