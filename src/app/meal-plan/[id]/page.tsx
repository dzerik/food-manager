"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalorieIndicator, WeeklyCalorieStats } from "@/components/meal-plan/calorie-indicator";
import { DayEditorDialog } from "@/components/meal-plan/day-editor-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, ShoppingCart, Calendar as CalendarIcon, AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format, eachDayOfInterval, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { use } from "react";

interface Recipe {
  id: string;
  name: string;
  imageUrl?: string;
  totalTime?: number;
  caloriesPerServing?: number;
  proteinPerServing?: number;
  fatPerServing?: number;
  carbsPerServing?: number;
  allergens?: string[];
}

interface UserProfile {
  dailyCalorieTarget: number | null;
}

interface UserAllergy {
  allergen: string;
}

interface MealPlanRecipe {
  id: string;
  date: string;
  mealType: string;
  servings: number;
  recipe: Recipe;
}

interface MealPlan {
  id: string;
  name?: string;
  startDate: string;
  endDate: string;
  recipes: MealPlanRecipe[];
}

const mealTypeLabels: Record<string, string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  dinner: "Ужин",
  snack: "Перекус",
};

export default function MealPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedMealType, setSelectedMealType] = useState<string>("lunch");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [servings, setServings] = useState<number>(2);
  const [isAdding, setIsAdding] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userAllergies, setUserAllergies] = useState<string[]>([]);
  const [hideAllergenRecipes, setHideAllergenRecipes] = useState(true);

  useEffect(() => {
    async function fetchMealPlan() {
      try {
        const res = await fetch(`/api/meal-plans/${id}`);
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Not found");
        }
        const data = await res.json();
        setMealPlan(data);
      } catch {
        toast.error("План не найден");
        router.push("/meal-plan");
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchRecipes() {
      try {
        const res = await fetch("/api/recipes?limit=100");
        if (res.ok) {
          const data = await res.json();
          setRecipes(data.recipes);
        }
      } catch (error) {
        console.error("Failed to fetch recipes:", error);
      }
    }

    async function fetchProfile() {
      try {
        const res = await fetch("/api/users/me/profile");
        if (res.ok) {
          const data = await res.json();
          setUserProfile({ dailyCalorieTarget: data.dailyCalorieTarget });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    }

    async function fetchAllergies() {
      try {
        const res = await fetch("/api/users/me/allergies");
        if (res.ok) {
          const data: UserAllergy[] = await res.json();
          setUserAllergies(data.map((a) => a.allergen));
        }
      } catch (error) {
        console.error("Failed to fetch allergies:", error);
      }
    }

    fetchMealPlan();
    fetchRecipes();
    fetchProfile();
    fetchAllergies();
  }, [id, router]);

  async function handleAddRecipe() {
    if (!selectedRecipeId || !selectedDate) {
      toast.error("Выберите рецепт и дату");
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch(`/api/meal-plans/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId: selectedRecipeId,
          date: selectedDate,
          mealType: selectedMealType,
          servings,
        }),
      });

      if (!res.ok) throw new Error("Failed to add recipe");

      const newRecipe = await res.json();
      setMealPlan((prev) =>
        prev ? { ...prev, recipes: [...prev.recipes, newRecipe] } : null
      );
      setIsAddDialogOpen(false);
      setSelectedRecipeId("");
      toast.success("Рецепт добавлен!");
    } catch {
      toast.error("Не удалось добавить рецепт");
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDeletePlan() {
    if (!confirm("Удалить план питания?")) return;

    try {
      const res = await fetch(`/api/meal-plans/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("План удалён");
      router.push("/meal-plan");
    } catch {
      toast.error("Не удалось удалить план");
    }
  }

  // Обработчики для DayEditorDialog
  function handleRecipeAdded(newRecipe: MealPlanRecipe) {
    setMealPlan((prev) =>
      prev ? { ...prev, recipes: [...prev.recipes, newRecipe] } : null
    );
  }

  function handleRecipeUpdated(updatedRecipe: MealPlanRecipe) {
    setMealPlan((prev) =>
      prev
        ? {
            ...prev,
            recipes: prev.recipes.map((r) =>
              r.id === updatedRecipe.id ? updatedRecipe : r
            ),
          }
        : null
    );
  }

  function handleRecipeDeleted(recipeId: string) {
    setMealPlan((prev) =>
      prev
        ? { ...prev, recipes: prev.recipes.filter((r) => r.id !== recipeId) }
        : null
    );
  }

  async function refreshMealPlan() {
    try {
      const res = await fetch(`/api/meal-plans/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMealPlan(data);
      }
    } catch (error) {
      console.error("Failed to refresh meal plan:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="mt-8 h-64 rounded bg-muted" />
          </div>
        </main>
      </div>
    );
  }

  if (!mealPlan) return null;

  const days = eachDayOfInterval({
    start: new Date(mealPlan.startDate),
    end: new Date(mealPlan.endDate),
  });

  // Calculate calories per day
  const dailyCalories = days.map((day) => {
    const dayRecipes = mealPlan.recipes.filter((r) =>
      isSameDay(new Date(r.date), day)
    );
    const calories = dayRecipes.reduce((sum, meal) => {
      const perServing = meal.recipe.caloriesPerServing || 0;
      return sum + perServing * meal.servings;
    }, 0);
    return {
      date: day.toISOString(),
      calories,
    };
  });

  const dailyTarget = userProfile?.dailyCalorieTarget || 2000;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/meal-plan">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {mealPlan.name || "План питания"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(mealPlan.startDate), "d MMMM", { locale: ru })} -{" "}
                {format(new Date(mealPlan.endDate), "d MMMM yyyy", { locale: ru })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/shopping-list">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Список покупок
              </Link>
            </Button>
            <Button variant="destructive" size="icon" onClick={handleDeletePlan}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Weekly calorie stats */}
        {userProfile?.dailyCalorieTarget && (
          <div className="mb-6">
            <WeeklyCalorieStats dailyStats={dailyCalories} target={dailyTarget} />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {days.map((day) => {
            const dayRecipes = mealPlan.recipes.filter((r) =>
              isSameDay(new Date(r.date), day)
            );

            // Calculate day calories
            const dayCalorieData = dailyCalories.find(
              (d) => d.date === day.toISOString()
            );
            const dayCalories = dayCalorieData?.calories || 0;

            return (
              <DayEditorDialog
                key={day.toISOString()}
                date={day}
                mealPlanId={id}
                dayRecipes={dayRecipes}
                allRecipes={recipes}
                dailyTarget={dailyTarget}
                userAllergies={userAllergies}
                mealPlanStartDate={new Date(mealPlan.startDate)}
                mealPlanEndDate={new Date(mealPlan.endDate)}
                onRecipeAdded={handleRecipeAdded}
                onRecipeUpdated={handleRecipeUpdated}
                onRecipeDeleted={handleRecipeDeleted}
                onDayCopied={refreshMealPlan}
                trigger={
                  <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {format(day, "EEEE", { locale: ru })}
                      </CardTitle>
                      <CardDescription>
                        {format(day, "d MMMM", { locale: ru })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {/* Day calorie indicator */}
                      {userProfile?.dailyCalorieTarget && dayCalories > 0 && (
                        <div className="mb-3">
                          <CalorieIndicator
                            current={dayCalories}
                            target={dailyTarget}
                            size="sm"
                          />
                        </div>
                      )}
                      {["breakfast", "lunch", "dinner", "snack"].map((mealType) => {
                        const meals = dayRecipes.filter(
                          (r) => r.mealType === mealType
                        );

                        return (
                          <div key={mealType}>
                            <div className="mb-1 text-xs font-medium text-muted-foreground">
                              {mealTypeLabels[mealType]}
                            </div>
                            {meals.length > 0 ? (
                              meals.map((meal) => (
                                <div
                                  key={meal.id}
                                  className="mb-1 flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-sm"
                                >
                                  <span className="truncate">{meal.recipe.name}</span>
                                  <Badge variant="outline" className="ml-2 shrink-0">
                                    {meal.servings} порц.
                                  </Badge>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-muted-foreground/50">—</div>
                            )}
                          </div>
                        );
                      })}
                      <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Plus className="h-3 w-3" />
                        Нажмите для редактирования
                      </div>
                    </CardContent>
                  </Card>
                }
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}
