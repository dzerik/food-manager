import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default async function ShoppingListPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get the most recent meal plan
  const latestPlan = await db.mealPlan.findFirst({
    where: { userId: session.user.id },
    orderBy: { startDate: "desc" },
    include: {
      recipes: {
        include: {
          recipe: {
            include: {
              ingredients: {
                where: { isOptional: false },
                include: {
                  product: {
                    include: {
                      dietaryInfo: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!latestPlan) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-8 text-3xl font-bold">Список покупок</h1>
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Нет плана питания</h3>
              <p className="mt-2 text-muted-foreground">
                Создайте план питания, чтобы получить список покупок
              </p>
              <Button className="mt-4" asChild>
                <Link href="/meal-plan/new">
                  <Calendar className="mr-2 h-4 w-4" />
                  Создать план
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Get user allergies
  const userAllergies = await db.userAllergy.findMany({
    where: { userId: session.user.id },
    select: { allergen: true },
  });
  const allergensSet = new Set(userAllergies.map((a) => a.allergen));

  // Aggregate ingredients
  const itemsMap = new Map<string, {
    productId: string;
    productName: string;
    category: string;
    totalGrams: number;
    unit: string;
    allergens: string[];
  }>();

  for (const planRecipe of latestPlan.recipes) {
    const servingRatio = planRecipe.servings / planRecipe.recipe.servings;

    for (const ingredient of planRecipe.recipe.ingredients) {
      const gramsNeeded = ingredient.amountInGrams * servingRatio;
      const existing = itemsMap.get(ingredient.productId);

      const productAllergens = ingredient.product.dietaryInfo?.allergens
        ? JSON.parse(ingredient.product.dietaryInfo.allergens) as string[]
        : [];

      if (existing) {
        existing.totalGrams += gramsNeeded;
      } else {
        itemsMap.set(ingredient.productId, {
          productId: ingredient.productId,
          productName: ingredient.product.name,
          category: ingredient.product.category,
          totalGrams: gramsNeeded,
          unit: ingredient.product.defaultUnit,
          allergens: productAllergens,
        });
      }
    }
  }

  const items = Array.from(itemsMap.values()).map((item) => ({
    ...item,
    isExcluded: item.allergens.some((a) => allergensSet.has(a)),
  }));

  // Group by category
  const categoryLabels: Record<string, string> = {
    vegetables: "Овощи",
    fruits: "Фрукты",
    meat: "Мясо",
    fish: "Рыба",
    seafood: "Морепродукты",
    dairy: "Молочные продукты",
    grains: "Крупы и макароны",
    legumes: "Бобовые",
    oils: "Масла",
    spices: "Специи",
    herbs: "Зелень",
    sauces: "Соусы",
    canned: "Консервы",
    baking: "Для выпечки",
    sweeteners: "Сладкое",
    nuts: "Орехи",
    seeds: "Семена",
  };

  const grouped = items.reduce((acc, item) => {
    const category = categoryLabels[item.category] || item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const sortedCategories = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Список покупок</h1>
          <p className="mt-2 text-muted-foreground">
            На основе плана:{" "}
            {format(latestPlan.startDate, "d MMMM", { locale: ru })} -{" "}
            {format(latestPlan.endDate, "d MMMM", { locale: ru })}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedCategories.map((category) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {grouped[category].map((item) => (
                    <li
                      key={item.productId}
                      className={`flex items-center justify-between text-sm ${
                        item.isExcluded ? "text-muted-foreground line-through" : ""
                      }`}
                    >
                      <span>{item.productName}</span>
                      <span className="font-medium">
                        {Math.round(item.totalGrams)} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {items.some((i) => i.isExcluded) && (
          <p className="mt-6 text-sm text-muted-foreground">
            Зачёркнутые продукты исключены из-за аллергий
          </p>
        )}
      </main>
    </div>
  );
}
