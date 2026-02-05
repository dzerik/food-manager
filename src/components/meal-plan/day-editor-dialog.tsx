"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { CalorieIndicator } from "./calorie-indicator";
import { Plus, Trash2, Copy, AlertTriangle, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, eachDayOfInterval, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { mealTypes, mealTypeOrder } from "@/lib/meal-types";
import { cn } from "@/lib/utils";

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

interface MealPlanRecipe {
  id: string;
  date: string;
  mealType: string;
  servings: number;
  recipe: Recipe;
}

interface DayEditorDialogProps {
  date: Date;
  mealPlanId: string;
  dayRecipes: MealPlanRecipe[];
  allRecipes: Recipe[];
  dailyTarget?: number;
  userAllergies?: string[];
  mealPlanStartDate: Date;
  mealPlanEndDate: Date;
  onRecipeAdded: (recipe: MealPlanRecipe) => void;
  onRecipeUpdated: (recipe: MealPlanRecipe) => void;
  onRecipeDeleted: (recipeId: string) => void;
  onDayCopied: () => void;
  trigger?: React.ReactNode;
}


export function DayEditorDialog({
  date,
  mealPlanId,
  dayRecipes,
  allRecipes,
  dailyTarget = 2000,
  userAllergies = [],
  mealPlanStartDate,
  mealPlanEndDate,
  onRecipeAdded,
  onRecipeUpdated,
  onRecipeDeleted,
  onDayCopied,
  trigger,
}: DayEditorDialogProps) {
  const [open, setOpen] = useState(false);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string>("lunch");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [servings, setServings] = useState(2);
  const [hideAllergenRecipes, setHideAllergenRecipes] = useState(true);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [copyTargetDates, setCopyTargetDates] = useState<Date[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [updatingRecipeId, setUpdatingRecipeId] = useState<string | null>(null);
  const [deletingRecipeId, setDeletingRecipeId] = useState<string | null>(null);

  // Calculate calories by meal type
  const caloriesByMealType = mealTypeOrder.reduce((acc, mealType) => {
    const meals = dayRecipes.filter((r) => r.mealType === mealType);
    acc[mealType] = meals.reduce((sum, meal) => {
      return sum + (meal.recipe.caloriesPerServing || 0) * meal.servings;
    }, 0);
    return acc;
  }, {} as Record<string, number>);

  const totalDayCalories = Object.values(caloriesByMealType).reduce((a, b) => a + b, 0);

  // Available days for copying (within meal plan range, excluding current day)
  const availableDays = eachDayOfInterval({
    start: mealPlanStartDate,
    end: mealPlanEndDate,
  }).filter((d) => !isSameDay(d, date));

  async function handleAddRecipe() {
    if (!selectedRecipeId) {
      toast.error("Выберите рецепт");
      return;
    }

    setIsAddingRecipe(true);
    try {
      const res = await fetch(`/api/meal-plans/${mealPlanId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId: selectedRecipeId,
          date: date.toISOString(),
          mealType: selectedMealType,
          servings,
        }),
      });

      if (!res.ok) throw new Error("Failed to add recipe");

      const newRecipe = await res.json();
      onRecipeAdded(newRecipe);
      setSelectedRecipeId("");
      setServings(2);
      toast.success("Рецепт добавлен!");
    } catch {
      toast.error("Не удалось добавить рецепт");
    } finally {
      setIsAddingRecipe(false);
    }
  }

  async function handleUpdateServings(recipeId: string, newServings: number) {
    if (newServings < 1) return;

    setUpdatingRecipeId(recipeId);
    try {
      const res = await fetch(`/api/meal-plans/${mealPlanId}/recipes/${recipeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servings: newServings }),
      });

      if (!res.ok) throw new Error("Failed to update");

      const updated = await res.json();
      onRecipeUpdated(updated);
    } catch {
      toast.error("Не удалось обновить порции");
    } finally {
      setUpdatingRecipeId(null);
    }
  }

  async function handleDeleteRecipe(recipeId: string) {
    setDeletingRecipeId(recipeId);
    try {
      const res = await fetch(`/api/meal-plans/${mealPlanId}/recipes/${recipeId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      onRecipeDeleted(recipeId);
      toast.success("Рецепт удалён");
    } catch {
      toast.error("Не удалось удалить рецепт");
    } finally {
      setDeletingRecipeId(null);
    }
  }

  async function handleCopyDay() {
    if (copyTargetDates.length === 0) {
      toast.error("Выберите дни для копирования");
      return;
    }

    setIsCopying(true);
    try {
      const res = await fetch(`/api/meal-plans/${mealPlanId}/copy-day`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceDate: date.toISOString(),
          targetDates: copyTargetDates.map((d) => d.toISOString()),
          replaceExisting,
        }),
      });

      if (!res.ok) throw new Error("Failed to copy");

      toast.success(`Скопировано в ${copyTargetDates.length} ${copyTargetDates.length === 1 ? "день" : "дней"}`);
      setIsCopyDialogOpen(false);
      setCopyTargetDates([]);
      onDayCopied();
    } catch {
      toast.error("Не удалось скопировать");
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            Редактировать
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-4 sm:p-6 sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <DialogTitle className="text-base sm:text-lg">{format(date, "EEEE, d MMMM", { locale: ru })}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">Редактирование плана на день</DialogDescription>
            </div>
            <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={dayRecipes.length === 0} className="w-full sm:w-auto">
                  <Copy className="mr-2 h-4 w-4" />
                  Копировать
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">Копировать в другие дни</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Выберите дни для копирования плана
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                    {availableDays.map((day) => {
                      const isSelected = copyTargetDates.some((d) => isSameDay(d, day));
                      return (
                        <Button
                          key={day.toISOString()}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="text-xs sm:text-sm"
                          onClick={() => {
                            setCopyTargetDates((prev) =>
                              isSelected
                                ? prev.filter((d) => !isSameDay(d, day))
                                : [...prev, day]
                            );
                          }}
                        >
                          {format(day, "EE d", { locale: ru })}
                        </Button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="replace"
                      checked={replaceExisting}
                      onCheckedChange={(checked) => setReplaceExisting(checked as boolean)}
                    />
                    <Label htmlFor="replace" className="text-xs sm:text-sm">
                      Заменить существующие рецепты
                    </Label>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleCopyDay}
                    disabled={isCopying || copyTargetDates.length === 0}
                  >
                    {isCopying ? "Копирование..." : `Скопировать в ${copyTargetDates.length} ${copyTargetDates.length === 1 ? "день" : "дней"}`}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Daily calorie indicator */}
          <CalorieIndicator current={totalDayCalories} target={dailyTarget} />

          {/* Meal type sections */}
          {mealTypeOrder.map((mealType) => {
            const meals = dayRecipes.filter((r) => r.mealType === mealType);
            const mealCalories = caloriesByMealType[mealType];
            const mealConfig = mealTypes[mealType];
            const MealIcon = mealConfig.icon;

            return (
              <div key={mealType} className={cn("rounded-lg border p-3", mealConfig.borderColor)}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("rounded-lg p-1.5", mealConfig.bgColor)}>
                      <MealIcon className={cn("h-4 w-4", mealConfig.color)} />
                    </div>
                    <h4 className="font-medium">{mealConfig.label}</h4>
                  </div>
                  {mealCalories > 0 && (
                    <Badge variant="secondary" className={cn(mealConfig.bgColor, mealConfig.color, "border-0")}>
                      {mealCalories} ккал
                    </Badge>
                  )}
                </div>

                {meals.length > 0 ? (
                  <div className="space-y-2">
                    {meals.map((meal) => (
                      <div
                        key={meal.id}
                        className="flex flex-col gap-2 rounded bg-muted/50 p-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{meal.recipe.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(meal.recipe.caloriesPerServing || 0) * meal.servings} ккал
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-2 sm:justify-end">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min={1}
                              value={meal.servings}
                              onChange={(e) => handleUpdateServings(meal.id, parseInt(e.target.value) || 1)}
                              className="h-8 w-14 text-center sm:w-16"
                              disabled={updatingRecipeId === meal.id}
                            />
                            <span className="text-xs text-muted-foreground">порц.</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => handleDeleteRecipe(meal.id)}
                            disabled={deletingRecipeId === meal.id}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Нет блюд</p>
                )}

                {/* Quick add for this meal type */}
                <div className="mt-2 space-y-2">
                  <Select
                    value={selectedMealType === mealType ? selectedRecipeId : ""}
                    onValueChange={(value) => {
                      setSelectedMealType(mealType);
                      setSelectedRecipeId(value);
                    }}
                  >
                    <SelectTrigger className="h-9 w-full text-sm">
                      <SelectValue placeholder="+ Добавить рецепт" />
                    </SelectTrigger>
                    <SelectContent>
                      {allRecipes
                        .filter((recipe) => {
                          if (!hideAllergenRecipes || userAllergies.length === 0) return true;
                          const recipeAllergens = recipe.allergens || [];
                          return !recipeAllergens.some((a) => userAllergies.includes(a));
                        })
                        .map((recipe) => {
                          const hasAllergen = (recipe.allergens || []).some((a) =>
                            userAllergies.includes(a)
                          );
                          return (
                            <SelectItem key={recipe.id} value={recipe.id}>
                              <span className="flex items-center gap-2">
                                <span className="truncate">{recipe.name}</span>
                                {recipe.caloriesPerServing && (
                                  <span className="shrink-0 text-muted-foreground">
                                    ({recipe.caloriesPerServing} ккал)
                                  </span>
                                )}
                                {hasAllergen && (
                                  <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-500" />
                                )}
                              </span>
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                  {selectedMealType === mealType && selectedRecipeId && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        value={servings}
                        onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                        className="h-9 w-20"
                        placeholder="Порции"
                      />
                      <span className="text-xs text-muted-foreground shrink-0">порций</span>
                      <Button
                        size="sm"
                        className="h-9 flex-1"
                        onClick={handleAddRecipe}
                        disabled={isAddingRecipe}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Добавить
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Allergen filter */}
          {userAllergies.length > 0 && (
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="hideAllergens"
                checked={hideAllergenRecipes}
                onCheckedChange={(checked) => setHideAllergenRecipes(checked as boolean)}
              />
              <Label htmlFor="hideAllergens" className="text-sm text-muted-foreground">
                Скрыть рецепты с аллергенами
              </Label>
            </div>
          )}

          {/* Total summary */}
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4 sm:gap-2">
              <div>
                <p className="text-lg font-bold sm:text-xl">{totalDayCalories}</p>
                <p className="text-xs text-muted-foreground">ккал</p>
              </div>
              <div>
                <p className="text-lg font-bold sm:text-xl">
                  {dayRecipes.reduce((sum, r) => sum + (r.recipe.proteinPerServing || 0) * r.servings, 0).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">белки (г)</p>
              </div>
              <div>
                <p className="text-lg font-bold sm:text-xl">
                  {dayRecipes.reduce((sum, r) => sum + (r.recipe.fatPerServing || 0) * r.servings, 0).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">жиры (г)</p>
              </div>
              <div>
                <p className="text-lg font-bold sm:text-xl">
                  {dayRecipes.reduce((sum, r) => sum + (r.recipe.carbsPerServing || 0) * r.servings, 0).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">углеводы (г)</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
