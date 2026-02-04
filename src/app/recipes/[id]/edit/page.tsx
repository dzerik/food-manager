"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { use } from "react";

interface Recipe {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  difficultyLevel: number;
  mealTypes: string[];
  courses: string[];
  cuisines: string[];
  cookingMethods: string[];
  isVegan: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  caloriesPerServing?: number;
  proteinPerServing?: number;
  fatPerServing?: number;
  carbsPerServing?: number;
  ingredients: {
    productId: string;
    amount: number;
    unit: string;
    amountInGrams: number;
    preparation?: string;
    isOptional: boolean;
    sortOrder: number;
  }[];
  steps: {
    stepNumber: number;
    instruction: string;
    durationMinutes?: number;
    temperatureValue?: number;
    temperatureUnit?: "C" | "F";
  }[];
}

export default function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { status } = useSession();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchRecipe() {
      try {
        const res = await fetch(`/api/recipes/${id}`);
        if (!res.ok) {
          toast.error("Рецепт не найден");
          router.push("/recipes");
          return;
        }

        const data = await res.json();
        setRecipe(data);
      } catch {
        toast.error("Не удалось загрузить рецепт");
        router.push("/recipes");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecipe();
  }, [id, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="mt-8 h-96 rounded bg-muted" />
          </div>
        </main>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/recipes/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Редактирование рецепта</h1>
        </div>

        <RecipeForm mode="edit" recipeId={id} initialData={recipe} />
      </main>
    </div>
  );
}
