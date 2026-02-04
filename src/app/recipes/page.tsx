import Link from "next/link";
import { db } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { Plus } from "lucide-react";

export default async function RecipesPage() {
  const recipes = await db.recipe.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      totalTime: true,
      servings: true,
      difficultyLevel: true,
      mealTypes: true,
      cuisines: true,
      isVegan: true,
      isVegetarian: true,
      caloriesPerServing: true,
    },
    orderBy: { name: "asc" },
  });

  const parsedRecipes = recipes.map((recipe) => ({
    ...recipe,
    mealTypes: JSON.parse(recipe.mealTypes) as string[],
    cuisines: recipe.cuisines ? (JSON.parse(recipe.cuisines) as string[]) : [],
  }));

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Рецепты</h1>
            <p className="mt-2 text-muted-foreground">
              {recipes.length} рецептов в каталоге
            </p>
          </div>
          <Button asChild>
            <Link href="/recipes/new">
              <Plus className="mr-2 h-4 w-4" />
              Добавить рецепт
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {parsedRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </main>
    </div>
  );
}
