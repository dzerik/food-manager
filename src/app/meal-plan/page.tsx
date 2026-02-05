import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Calendar,
  ChefHat,
  Flame,
  Clock,
  CalendarDays,
  UtensilsCrossed,
  TrendingUp,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default async function MealPlanPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const mealPlans = await db.mealPlan.findMany({
    where: { userId: session.user.id },
    include: {
      recipes: {
        include: {
          recipe: {
            select: {
              name: true,
              totalTime: true,
              caloriesPerServing: true,
            },
          },
        },
      },
    },
    orderBy: { startDate: "desc" },
  });

  // Calculate stats for each plan
  const plansWithStats = mealPlans.map((plan) => {
    const totalRecipes = plan.recipes.length;
    const totalCalories = plan.recipes.reduce((sum, r) => {
      return sum + (r.recipe.caloriesPerServing || 0) * r.servings;
    }, 0);
    const avgCookTime = totalRecipes > 0
      ? Math.round(plan.recipes.reduce((sum, r) => sum + r.recipe.totalTime, 0) / totalRecipes)
      : 0;
    const daysCount = differenceInDays(plan.endDate, plan.startDate) + 1;
    const avgCaloriesPerDay = daysCount > 0 ? Math.round(totalCalories / daysCount) : 0;

    return {
      ...plan,
      totalRecipes,
      totalCalories,
      avgCookTime,
      daysCount,
      avgCaloriesPerDay,
    };
  });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">План питания</h1>
              <p className="text-muted-foreground">
                Планируйте меню на неделю
              </p>
            </div>
          </div>
          <Button asChild className="shadow-md">
            <Link href="/meal-plan/new">
              <Plus className="mr-2 h-4 w-4" />
              Новый план
            </Link>
          </Button>
        </div>

        {plansWithStats.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                <CalendarDays className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Нет планов питания</h3>
              <p className="mt-2 max-w-sm text-muted-foreground">
                Создайте первый план питания, чтобы организовать ваше меню на неделю
              </p>
              <Button className="mt-6" asChild>
                <Link href="/meal-plan/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Создать план
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plansWithStats.map((plan, index) => {
              const isActive =
                new Date() >= plan.startDate && new Date() <= plan.endDate;
              const progressValue = isActive
                ? Math.round(
                    ((differenceInDays(new Date(), plan.startDate) + 1) / plan.daysCount) * 100
                  )
                : new Date() > plan.endDate
                ? 100
                : 0;

              return (
                <Link key={plan.id} href={`/meal-plan/${plan.id}`}>
                  <Card
                    className={cn(
                      "h-full transition-all hover:shadow-lg hover:scale-[1.02]",
                      isActive && "ring-2 ring-primary ring-offset-2",
                      index === 0 && !isActive && "border-primary/50"
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {isActive && (
                              <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                              </span>
                            )}
                            {plan.name || "План питания"}
                          </CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {format(plan.startDate, "d MMM", { locale: ru })} —{" "}
                            {format(plan.endDate, "d MMM yyyy", { locale: ru })}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={isActive ? "default" : "secondary"}
                          className={cn(
                            isActive && "bg-green-500 hover:bg-green-500"
                          )}
                        >
                          {isActive
                            ? "Активный"
                            : new Date() > plan.endDate
                            ? "Завершён"
                            : "Запланирован"}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Progress bar for active plans */}
                      {(isActive || new Date() > plan.endDate) && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Прогресс</span>
                            <span>{progressValue}%</span>
                          </div>
                          <Progress value={progressValue} className="h-2" />
                        </div>
                      )}

                      {/* Stats grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2">
                          <ChefHat className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <div>
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {plan.totalRecipes}
                            </p>
                            <p className="text-xs text-muted-foreground">рецептов</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 p-2">
                          <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          <div>
                            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                              {plan.avgCaloriesPerDay}
                            </p>
                            <p className="text-xs text-muted-foreground">ккал/день</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/30 p-2">
                          <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              {plan.avgCookTime}
                            </p>
                            <p className="text-xs text-muted-foreground">мин готовка</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 p-2">
                          <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <div>
                            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                              {plan.daysCount}
                            </p>
                            <p className="text-xs text-muted-foreground">дней</p>
                          </div>
                        </div>
                      </div>

                      {/* Recipe preview */}
                      {plan.recipes.length > 0 && (
                        <div className="border-t pt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Рецепты:
                          </p>
                          <div className="space-y-1">
                            {plan.recipes.slice(0, 3).map((r) => (
                              <div
                                key={r.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                <UtensilsCrossed className="h-3 w-3 text-muted-foreground" />
                                <span className="truncate">{r.recipe.name}</span>
                                {r.recipe.caloriesPerServing && (
                                  <Badge variant="outline" className="ml-auto text-xs shrink-0">
                                    {r.recipe.caloriesPerServing} ккал
                                  </Badge>
                                )}
                              </div>
                            ))}
                            {plan.recipes.length > 3 && (
                              <p className="text-xs text-muted-foreground pl-5">
                                и ещё {plan.recipes.length - 3} рецептов...
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
