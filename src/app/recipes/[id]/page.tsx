import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeActions } from "@/components/recipes/recipe-actions";
import { Clock, Users, Flame, ChefHat, Thermometer, ArrowLeft, Gauge, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getDifficultyIndicator,
  getTimeIndicator,
  getCalorieIndicator,
  formatTime,
} from "@/lib/recipe-indicators";

interface RecipePageProps {
  params: Promise<{ id: string }>;
}

const cuisineLabels: Record<string, string> = {
  russian: "Русская",
  italian: "Итальянская",
  asian: "Азиатская",
  french: "Французская",
  mexican: "Мексиканская",
  indian: "Индийская",
  mediterranean: "Средиземноморская",
  japanese: "Японская",
  chinese: "Китайская",
  thai: "Тайская",
  middle_eastern: "Ближневосточная",
  american: "Американская",
  other: "Другая",
};

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;

  const recipe = await db.recipe.findUnique({
    where: { id },
    include: {
      ingredients: {
        include: {
          product: true,
        },
        orderBy: { sortOrder: "asc" },
      },
      steps: {
        orderBy: { stepNumber: "asc" },
      },
    },
  });

  if (!recipe) {
    notFound();
  }

  const cuisines = recipe.cuisines ? (JSON.parse(recipe.cuisines) as string[]) : [];
  const mealTypes = JSON.parse(recipe.mealTypes) as string[];

  const diffIndicator = getDifficultyIndicator(recipe.difficultyLevel);
  const timeIndicator = getTimeIndicator(recipe.totalTime);
  const calorieIndicator = recipe.caloriesPerServing
    ? getCalorieIndicator(recipe.caloriesPerServing)
    : null;

  // Group ingredients by groupName
  const groupedIngredients = recipe.ingredients.reduce((acc, ing) => {
    const group = ing.groupName || "Основные ингредиенты";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(ing);
    return acc;
  }, {} as Record<string, typeof recipe.ingredients>);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header with actions */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/recipes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <RecipeActions recipeId={recipe.id} recipeName={recipe.name} />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold">{recipe.name}</h1>
            {recipe.description && (
              <p className="mt-2 text-lg text-muted-foreground">{recipe.description}</p>
            )}

            {/* Meta Info Cards */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Time Card */}
              <Card className={cn("border-2", timeIndicator.borderColor)}>
                <CardContent className="p-3">
                  <div className={cn("flex items-center gap-2", timeIndicator.color)}>
                    <Clock className="h-5 w-5" />
                    <span className="text-sm font-medium">Время</span>
                  </div>
                  <p className="mt-1 text-lg font-bold">{formatTime(recipe.totalTime)}</p>
                  <p className="text-xs text-muted-foreground">
                    {recipe.prepTime > 0 && `${recipe.prepTime} мин подгот.`}
                    {recipe.prepTime > 0 && recipe.cookTime > 0 && " + "}
                    {recipe.cookTime > 0 && `${recipe.cookTime} мин готовка`}
                  </p>
                </CardContent>
              </Card>

              {/* Difficulty Card */}
              <Card className={cn("border-2", diffIndicator.borderColor)}>
                <CardContent className="p-3">
                  <div className={cn("flex items-center gap-2", diffIndicator.color)}>
                    <Gauge className="h-5 w-5" />
                    <span className="text-sm font-medium">Сложность</span>
                  </div>
                  <p className="mt-1 text-lg font-bold">{diffIndicator.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Уровень {recipe.difficultyLevel}/5
                  </p>
                </CardContent>
              </Card>

              {/* Servings Card */}
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-5 w-5" />
                    <span className="text-sm font-medium">Порции</span>
                  </div>
                  <p className="mt-1 text-lg font-bold">{recipe.servings}</p>
                  <p className="text-xs text-muted-foreground">человек</p>
                </CardContent>
              </Card>

              {/* Calories Card */}
              {calorieIndicator && (
                <Card className={cn("border-2", calorieIndicator.borderColor)}>
                  <CardContent className="p-3">
                    <div className={cn("flex items-center gap-2", calorieIndicator.color)}>
                      <Flame className="h-5 w-5" />
                      <span className="text-sm font-medium">Калории</span>
                    </div>
                    <p className="mt-1 text-lg font-bold">{recipe.caloriesPerServing} ккал</p>
                    <p className="text-xs text-muted-foreground">на порцию</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              {recipe.isVegan && (
                <Badge className="bg-green-600 text-white">Веган</Badge>
              )}
              {recipe.isVegetarian && !recipe.isVegan && (
                <Badge className="bg-emerald-600 text-white">Вегетарианское</Badge>
              )}
              {recipe.isGlutenFree && (
                <Badge className="bg-amber-600 text-white">Без глютена</Badge>
              )}
              {cuisines.map((c) => (
                <Badge key={c} variant="outline">
                  {cuisineLabels[c] || c}
                </Badge>
              ))}
            </div>

            {/* Steps */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-primary" />
                  Приготовление
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-6">
                  {recipe.steps.map((step) => (
                    <li key={step.id} className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                        {step.stepNumber}
                      </span>
                      <div className="flex-1">
                        <p>{step.instruction}</p>
                        {(step.durationMinutes || step.temperatureValue) && (
                          <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                            {step.durationMinutes && (
                              <span className="flex items-center gap-1 rounded bg-muted px-2 py-0.5">
                                <Clock className="h-4 w-4" />
                                {step.durationMinutes} мин
                              </span>
                            )}
                            {step.temperatureValue && (
                              <span className="flex items-center gap-1 rounded bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 text-orange-700 dark:text-orange-400">
                                <Thermometer className="h-4 w-4" />
                                {step.temperatureValue}°{step.temperatureUnit}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            {/* Nutrition Card */}
            {recipe.caloriesPerServing && (
              <Card className="mb-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-500" />
                    Пищевая ценность
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">На порцию:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white dark:bg-background p-3 text-center">
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{recipe.caloriesPerServing}</p>
                      <p className="text-xs text-muted-foreground">ккал</p>
                    </div>
                    {recipe.proteinPerServing && (
                      <div className="rounded-lg bg-white dark:bg-background p-3 text-center">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{recipe.proteinPerServing}</p>
                        <p className="text-xs text-muted-foreground">г белка</p>
                      </div>
                    )}
                    {recipe.fatPerServing && (
                      <div className="rounded-lg bg-white dark:bg-background p-3 text-center">
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{recipe.fatPerServing}</p>
                        <p className="text-xs text-muted-foreground">г жиров</p>
                      </div>
                    )}
                    {recipe.carbsPerServing && (
                      <div className="rounded-lg bg-white dark:bg-background p-3 text-center">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{recipe.carbsPerServing}</p>
                        <p className="text-xs text-muted-foreground">г углев.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ingredients Card */}
            <Card>
              <CardHeader>
                <CardTitle>Ингредиенты</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(groupedIngredients).map(([group, ingredients]) => (
                  <div key={group} className="mb-4 last:mb-0">
                    {Object.keys(groupedIngredients).length > 1 && (
                      <h4 className="mb-2 font-medium text-primary">{group}</h4>
                    )}
                    <ul className="space-y-2">
                      {ingredients.map((ing) => (
                        <li
                          key={ing.id}
                          className={cn(
                            "flex justify-between text-sm py-1 border-b border-dashed last:border-0",
                            ing.isOptional && "text-muted-foreground"
                          )}
                        >
                          <span>
                            {ing.product.name}
                            {ing.preparation && (
                              <span className="text-muted-foreground"> ({ing.preparation})</span>
                            )}
                            {ing.isOptional && (
                              <Badge variant="outline" className="ml-2 text-xs">опц.</Badge>
                            )}
                          </span>
                          <span className="ml-2 shrink-0 font-medium">
                            {ing.amount} {ing.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
