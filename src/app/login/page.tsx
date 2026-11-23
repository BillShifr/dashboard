import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { unbounded } from "@/app/display-font";
import { currentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await currentUser()) redirect("/presets");
  const { error } = await searchParams;
  return (
    <main
      className={`${unbounded.variable} grid min-h-svh lg:grid-cols-[1.1fr_0.9fr]`}
    >
      <section className="flex flex-col justify-end gap-6 bg-primary px-10 py-12 text-primary-foreground">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            ТФОМС Югры
          </h1>
          <p className="mt-2 max-w-sm text-sm text-primary-foreground/80">
            Карты округа, территорий и диспансеризации для докладов
          </p>
        </div>
      </section>
      <section className="grid place-items-center p-8">
        <Card className="w-full max-w-sm py-6 shadow-sm">
          <CardHeader className="px-6">
            <h1 className="text-base leading-snug font-medium">Вход</h1>
            <CardDescription>Служебный доступ к редактору карт</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" action="/api/auth/login" method="post">
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  Неверный логин или пароль
                </p>
              ) : null}
              <div className="grid gap-2">
                <Label htmlFor="login">Логин</Label>
                <Input
                  id="login"
                  name="login"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" className="mt-1 w-full">
                Войти
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
