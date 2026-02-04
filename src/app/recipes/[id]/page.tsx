import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecipeActions } from "@/components/recipes/recipe-actions";
import { Clock, Users, Flame, ChefHat, Thermometer, ArrowLeft } from "lucide-react";

interface RecipePageProps {
  params: Promise<{ id: string }>;
}

const difficultyLabels = ["", "Очень легко", "Легко", "Средне", "Сложно", "Очень сложно"];

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

            {/* Meta Info */}
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span>
                  {recipe.prepTime > 0 && `${recipe.prepTime} мин подготовка`}
                  {recipe.prepTime > 0 && recipe.cookTime > 0 && " + "}
                  {recipe.cookTime > 0 && `${recipe.cookTime} мин готовка`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span>{recipe.servings} порций</span>
              </div>
              <div className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-muted-foreground" />
                <span>{difficultyLabels[recipe.difficultyLevel]}</span>
              </div>
            </div>

            {/* Badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              {recipe.isVegan && <Badge>Веган</Badge>}
              {recipe.isVegetarian && !recipe.isVegan && <Badge>Вегетарианское</Badge>}
              {cuisines.map((c) => (
                <Badge key={c} variant="outline">{c}</Badge>
              ))}
            </div>

            {/* Steps */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Приготовление</CardTitle>
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
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {step.durationMinutes} мин
                              </span>
                            )}
                            {step.temperatureValue && (
                              <span className="flex items-center gap-1">
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
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5" />
                    Пищевая ценность
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">На порцию:</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>Калории</div>
                    <div className="font-medium">{recipe.caloriesPerServing} ккал</div>
                    {recipe.proteinPerServing && (
                      <>
                        <div>Белки</div>
                        <div className="font-medium">{recipe.proteinPerServing} г</div>
                      </>
                    )}
                    {recipe.fatPerServing && (
                      <>
                        <div>Жиры</div>
                        <div className="font-medium">{recipe.fatPerServing} г</div>
                      </>
                    )}
                    {recipe.carbsPerServing && (
                      <>
                        <div>Углеводы</div>
                        <div className="font-medium">{recipe.carbsPerServing} г</div>
                      </>
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
                      <h4 className="mb-2 font-medium">{group}</h4>
                    )}
                    <ul className="space-y-2">
                      {ingredients.map((ing) => (
                        <li
                          key={ing.id}
                          className={`flex justify-between text-sm ${ing.isOptional ? "text-muted-foreground" : ""}`}
                        >
                          <span>
                            {ing.product.name}
                            {ing.preparation && (
                              <span className="text-muted-foreground"> ({ing.preparation})</span>
                            )}
                            {ing.isOptional && (
                              <span className="text-muted-foreground"> (опц.)</span>
                            )}
                          </span>
                          <span className="ml-2 shrink-0">
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
