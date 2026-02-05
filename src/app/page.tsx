import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UtensilsCrossed,
  Calendar,
  ShoppingCart,
  Leaf,
  ChefHat,
  Clock,
  Heart,
  Sparkles,
  TrendingUp,
  Users,
  Apple,
  Carrot,
  Beef,
  Fish,
  Egg,
  Wheat,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const stats = [
  { value: "150+", label: "Продуктов", icon: Apple },
  { value: "50+", label: "Рецептов", icon: ChefHat },
  { value: "7+", label: "Кухонь мира", icon: UtensilsCrossed },
  { value: "∞", label: "Планов питания", icon: Calendar },
];

const features = [
  {
    icon: UtensilsCrossed,
    title: "Каталог рецептов",
    description: "50+ проверенных рецептов русской, итальянской, азиатской и других кухонь",
    color: "bg-orange-500",
  },
  {
    icon: Calendar,
    title: "Планирование меню",
    description: "Составляйте меню на неделю или месяц с учётом завтраков, обедов и ужинов",
    color: "bg-blue-500",
  },
  {
    icon: ShoppingCart,
    title: "Умный список покупок",
    description: "Автоматическое объединение ингредиентов и округление до размера упаковки",
    color: "bg-green-500",
  },
  {
    icon: Leaf,
    title: "Учёт аллергий",
    description: "Безопасное планирование с исключением аллергенных продуктов",
    color: "bg-emerald-500",
  },
  {
    icon: TrendingUp,
    title: "Подсчёт калорий",
    description: "Автоматический расчёт КБЖУ на основе пищевой ценности продуктов",
    color: "bg-purple-500",
  },
  {
    icon: Heart,
    title: "Персонализация",
    description: "Индивидуальная дневная норма калорий по формуле Миффлина-Сан Жеора",
    color: "bg-pink-500",
  },
];

const benefits = [
  "Экономия времени на планировании",
  "Оптимизация расходов на продукты",
  "Сбалансированное питание",
  "Контроль калорий и БЖУ",
  "Исключение аллергенов",
  "Удобный экспорт списков",
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-orange-500/5" />

          {/* Decorative icons */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <Carrot className="absolute top-20 left-10 h-16 w-16 text-orange-200 dark:text-orange-900/30 rotate-12" />
            <Beef className="absolute top-40 right-20 h-20 w-20 text-red-200 dark:text-red-900/30 -rotate-12" />
            <Fish className="absolute bottom-20 left-1/4 h-14 w-14 text-blue-200 dark:text-blue-900/30 rotate-6" />
            <Apple className="absolute top-1/3 right-1/4 h-12 w-12 text-green-200 dark:text-green-900/30" />
            <Wheat className="absolute bottom-1/3 right-10 h-16 w-16 text-amber-200 dark:text-amber-900/30 -rotate-6" />
            <Egg className="absolute bottom-40 left-20 h-10 w-10 text-yellow-200 dark:text-yellow-900/30 rotate-12" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-28 sm:px-6 lg:px-8">
            <div className="text-center">
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
                <Sparkles className="mr-2 h-4 w-4" />
                Умное планирование питания
              </Badge>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Планируйте питание.
                <br />
                <span className="bg-gradient-to-r from-primary via-orange-500 to-red-500 bg-clip-text text-transparent">
                  Экономьте время.
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Food Manager помогает составить меню на неделю и автоматически формирует список
                покупок. Учитывает ваши предпочтения, считает калории и исключает аллергены.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" asChild className="group">
                  <Link href="/recipes">
                    <ChefHat className="mr-2 h-5 w-5" />
                    Смотреть рецепты
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/meal-plan">
                    <Calendar className="mr-2 h-5 w-5" />
                    Создать план
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center">
                    <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-3">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Всё для идеального планирования</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Современные инструменты для организации питания вашей семьи
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                  <div className={`absolute top-0 right-0 w-24 h-24 ${feature.color} opacity-10 rounded-bl-full`} />
                  <CardHeader>
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.color} text-white mb-4`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-muted/30 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Почему Food Manager?</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {benefits.map((benefit) => (
                    <div key={benefit} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
                  <CardContent className="p-6 text-center">
                    <Clock className="h-10 w-10 mx-auto mb-3 opacity-90" />
                    <div className="text-2xl font-bold">2-3 часа</div>
                    <div className="text-sm opacity-90">экономии в неделю</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-90" />
                    <div className="text-2xl font-bold">20-30%</div>
                    <div className="text-sm opacity-90">меньше трат</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  <CardContent className="p-6 text-center">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-90" />
                    <div className="text-2xl font-bold">1-8</div>
                    <div className="text-sm opacity-90">членов семьи</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <CardContent className="p-6 text-center">
                    <Heart className="h-10 w-10 mx-auto mb-3 opacity-90" />
                    <div className="text-2xl font-bold">100%</div>
                    <div className="text-sm opacity-90">персонализация</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Card className="relative overflow-hidden bg-gradient-to-r from-primary via-primary to-orange-600 text-primary-foreground">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <CardContent className="relative flex flex-col items-center py-12 text-center">
              <Sparkles className="h-12 w-12 mb-4 opacity-90" />
              <h2 className="text-3xl font-bold">Начните планировать сегодня</h2>
              <p className="mt-4 max-w-lg opacity-90">
                Зарегистрируйтесь бесплатно и получите доступ ко всем функциям Food Manager.
                Никаких скрытых платежей.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/register">
                    Создать аккаунт бесплатно
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="ghost" className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/20" asChild>
                  <Link href="/help">Узнать больше</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
                <span className="font-semibold">Food Manager</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <Link href="/help" className="hover:text-foreground transition-colors">Справка</Link>
                <Link href="/settings" className="hover:text-foreground transition-colors">Настройки</Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
