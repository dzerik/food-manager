import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

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
            },
          },
        },
      },
    },
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">План питания</h1>
            <p className="mt-2 text-muted-foreground">
              Планируйте меню на неделю
            </p>
          </div>
          <Button asChild>
            <Link href="/meal-plan/new">
              <Plus className="mr-2 h-4 w-4" />
              Новый план
            </Link>
          </Button>
        </div>

        {mealPlans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Нет планов питания</h3>
              <p className="mt-2 text-muted-foreground">
                Создайте первый план питания на неделю
              </p>
              <Button className="mt-4" asChild>
                <Link href="/meal-plan/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Создать план
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mealPlans.map((plan) => (
              <Link key={plan.id} href={`/meal-plan/${plan.id}`}>
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{plan.name || "План питания"}</span>
                      <Badge variant="secondary">
                        {plan.recipes.length} рецептов
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {format(plan.startDate, "d MMMM", { locale: ru })} -{" "}
                      {format(plan.endDate, "d MMMM yyyy", { locale: ru })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {plan.recipes.slice(0, 3).map((r) => (
                        <div key={r.id} className="truncate">
                          {r.recipe.name}
                        </div>
                      ))}
                      {plan.recipes.length > 3 && (
                        <div>и ещё {plan.recipes.length - 3}...</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
