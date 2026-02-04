import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, Calendar, ShoppingCart, Leaf } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Планируйте питание.
            <br />
            <span className="text-primary">Экономьте время.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Food Manager помогает составить меню на неделю и автоматически формирует список
            покупок. Учитывает ваши предпочтения и аллергии.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/recipes">Смотреть рецепты</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/meal-plan">Создать план</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <UtensilsCrossed className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">50+ рецептов</CardTitle>
                <CardDescription>
                  Каталог проверенных рецептов русской и международной кухни
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Calendar className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Планирование</CardTitle>
                <CardDescription>
                  Составьте меню на неделю с учётом завтраков, обедов и ужинов
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <ShoppingCart className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Список покупок</CardTitle>
                <CardDescription>
                  Автоматический расчёт и агрегация ингредиентов
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Leaf className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Учёт аллергий</CardTitle>
                <CardDescription>
                  Исключение продуктов с автоматическим пересчётом
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <h2 className="text-3xl font-bold">Начните планировать сегодня</h2>
              <p className="mt-4 max-w-lg opacity-90">
                Зарегистрируйтесь бесплатно и получите доступ ко всем функциям Food Manager
              </p>
              <Button size="lg" variant="secondary" className="mt-6" asChild>
                <Link href="/register">Создать аккаунт</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
