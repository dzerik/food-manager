"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, GripVertical, Calculator } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ProductCombobox } from "./product-combobox";

interface ProductNutrition {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
}

interface Product {
  id: string;
  name: string;
  defaultUnit: string;
  gramsPerPiece?: number;
  nutrition?: ProductNutrition | null;
}

interface Ingredient {
  productId: string;
  amount: number;
  unit: string;
  amountInGrams: number;
  preparation?: string;
  isOptional: boolean;
  sortOrder: number;
}

interface Step {
  stepNumber: number;
  instruction: string;
  durationMinutes?: number;
  temperatureValue?: number;
  temperatureUnit?: "C" | "F";
}

interface RecipeFormData {
  name: string;
  description: string;
  imageUrl: string;
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
  ingredients: Ingredient[];
  steps: Step[];
}

interface RecipeFormProps {
  initialData?: Partial<RecipeFormData>;
  recipeId?: string;
  mode: "create" | "edit";
}

const mealTypeOptions = [
  { value: "breakfast", label: "Завтрак" },
  { value: "lunch", label: "Обед" },
  { value: "dinner", label: "Ужин" },
  { value: "snack", label: "Перекус" },
];

const courseOptions = [
  { value: "appetizer", label: "Закуска" },
  { value: "soup", label: "Суп" },
  { value: "salad", label: "Салат" },
  { value: "main", label: "Основное блюдо" },
  { value: "side", label: "Гарнир" },
  { value: "dessert", label: "Десерт" },
  { value: "beverage", label: "Напиток" },
];

const cuisineOptions = [
  { value: "russian", label: "Русская" },
  { value: "italian", label: "Итальянская" },
  { value: "asian", label: "Азиатская" },
  { value: "french", label: "Французская" },
  { value: "american", label: "Американская" },
  { value: "mediterranean", label: "Средиземноморская" },
  { value: "mexican", label: "Мексиканская" },
  { value: "other", label: "Другая" },
];

const cookingMethodOptions = [
  { value: "boiling", label: "Варка" },
  { value: "frying", label: "Жарка" },
  { value: "baking", label: "Запекание" },
  { value: "grilling", label: "Гриль" },
  { value: "steaming", label: "Варка на пару" },
  { value: "stewing", label: "Тушение" },
  { value: "roasting", label: "Жарка в духовке" },
  { value: "raw", label: "Без термообработки" },
];

const difficultyLabels: Record<number, string> = {
  1: "Очень легко",
  2: "Легко",
  3: "Средне",
  4: "Сложно",
  5: "Очень сложно",
};

const defaultFormData: RecipeFormData = {
  name: "",
  description: "",
  imageUrl: "",
  prepTime: 0,
  cookTime: 0,
  totalTime: 0,
  servings: 4,
  difficultyLevel: 3,
  mealTypes: [],
  courses: [],
  cuisines: [],
  cookingMethods: [],
  isVegan: false,
  isVegetarian: false,
  isGlutenFree: false,
  ingredients: [],
  steps: [],
};

export function RecipeForm({ initialData, recipeId, mode }: RecipeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [formData, setFormData] = useState<RecipeFormData>({
    ...defaultFormData,
    ...initialData,
  });
  const [isAutoCalculated, setIsAutoCalculated] = useState(false);

  // Функция расчёта калорийности на основе ингредиентов
  function calculateNutrition() {
    if (products.length === 0 || formData.ingredients.length === 0) return null;

    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;

    for (const ingredient of formData.ingredients) {
      const product = products.find((p) => p.id === ingredient.productId);
      if (!product?.nutrition) continue;

      const factor = ingredient.amountInGrams / 100;
      totalCalories += product.nutrition.calories * factor;
      totalProtein += product.nutrition.protein * factor;
      totalFat += product.nutrition.fat * factor;
      totalCarbs += product.nutrition.carbohydrates * factor;
    }

    const servings = formData.servings || 1;
    return {
      caloriesPerServing: Math.round(totalCalories / servings),
      proteinPerServing: Math.round((totalProtein / servings) * 10) / 10,
      fatPerServing: Math.round((totalFat / servings) * 10) / 10,
      carbsPerServing: Math.round((totalCarbs / servings) * 10) / 10,
    };
  }

  // Автоматический пересчёт калорий при изменении ингредиентов
  function applyAutoCalculation() {
    const nutrition = calculateNutrition();
    if (nutrition) {
      setFormData((prev) => ({
        ...prev,
        caloriesPerServing: nutrition.caloriesPerServing,
        proteinPerServing: nutrition.proteinPerServing,
        fatPerServing: nutrition.fatPerServing,
        carbsPerServing: nutrition.carbsPerServing,
      }));
      setIsAutoCalculated(true);
    }
  }

  useEffect(() => {
    async function fetchProducts() {
      setIsLoadingProducts(true);
      try {
        const res = await fetch("/api/products?limit=500");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoadingProducts(false);
      }
    }
    fetchProducts();
  }, []);

  // Auto-calculate total time
  useEffect(() => {
    const total = formData.prepTime + formData.cookTime;
    if (total !== formData.totalTime) {
      setFormData((prev) => ({ ...prev, totalTime: total }));
    }
  }, [formData.prepTime, formData.cookTime, formData.totalTime]);

  function handleMultiSelect(field: keyof RecipeFormData, value: string) {
    const current = formData[field] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFormData({ ...formData, [field]: updated });
  }

  function addIngredient() {
    setFormData({
      ...formData,
      ingredients: [
        ...formData.ingredients,
        {
          productId: "",
          amount: 0,
          unit: "g",
          amountInGrams: 0,
          isOptional: false,
          sortOrder: formData.ingredients.length,
        },
      ],
    });
  }

  function updateIngredient(index: number, data: Partial<Ingredient>) {
    const updated = [...formData.ingredients];
    updated[index] = { ...updated[index], ...data };

    // Auto-calculate amountInGrams
    if (data.productId || data.amount || data.unit) {
      const product = products.find((p) => p.id === (data.productId || updated[index].productId));
      const amount = data.amount ?? updated[index].amount;
      const unit = data.unit ?? updated[index].unit;

      if (product) {
        let grams = amount;
        if (unit === "pcs" && product.gramsPerPiece) {
          grams = amount * product.gramsPerPiece;
        } else if (unit === "ml") {
          grams = amount; // Assuming 1ml = 1g for simplicity
        }
        updated[index].amountInGrams = grams;
      }
    }

    setFormData({ ...formData, ingredients: updated });
  }

  function removeIngredient(index: number) {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  }

  function addStep() {
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        {
          stepNumber: formData.steps.length + 1,
          instruction: "",
        },
      ],
    });
  }

  function updateStep(index: number, data: Partial<Step>) {
    const updated = [...formData.steps];
    updated[index] = { ...updated[index], ...data };
    setFormData({ ...formData, steps: updated });
  }

  function removeStep(index: number) {
    const updated = formData.steps
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, stepNumber: i + 1 }));
    setFormData({ ...formData, steps: updated });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validation
    if (!formData.name) {
      toast.error("Введите название рецепта");
      return;
    }
    if (formData.mealTypes.length === 0) {
      toast.error("Выберите тип приёма пищи");
      return;
    }
    if (formData.courses.length === 0) {
      toast.error("Выберите категорию блюда");
      return;
    }
    if (formData.cookingMethods.length === 0) {
      toast.error("Выберите способ приготовления");
      return;
    }
    if (formData.ingredients.length === 0) {
      toast.error("Добавьте хотя бы один ингредиент");
      return;
    }
    if (formData.steps.length === 0) {
      toast.error("Добавьте хотя бы один шаг приготовления");
      return;
    }

    // Validate ingredients
    for (const ing of formData.ingredients) {
      if (!ing.productId || ing.amount <= 0) {
        toast.error("Заполните все ингредиенты корректно");
        return;
      }
    }

    // Validate steps
    for (const step of formData.steps) {
      if (!step.instruction.trim()) {
        toast.error("Заполните все шаги приготовления");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        // Only include nutrition fields if they have actual values (typeof check preserves 0)
        caloriesPerServing: typeof formData.caloriesPerServing === "number" ? formData.caloriesPerServing : undefined,
        proteinPerServing: typeof formData.proteinPerServing === "number" ? formData.proteinPerServing : undefined,
        fatPerServing: typeof formData.fatPerServing === "number" ? formData.fatPerServing : undefined,
        carbsPerServing: typeof formData.carbsPerServing === "number" ? formData.carbsPerServing : undefined,
      };

      console.log("Saving recipe:", payload);

      const url = mode === "create" ? "/api/recipes" : `/api/recipes/${recipeId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Recipe save error:", error);
        throw new Error(error.error || "Failed to save recipe");
      }

      toast.success(mode === "create" ? "Рецепт создан" : "Рецепт обновлён");
      router.push("/recipes");
    } catch (error) {
      console.error("Recipe save exception:", error);
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить рецепт");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 gap-1 h-auto p-1 sm:grid-cols-5">
          <TabsTrigger value="basic" className="text-xs px-2 py-1.5 sm:text-sm sm:px-3">Основное</TabsTrigger>
          <TabsTrigger value="classification" className="text-xs px-2 py-1.5 sm:text-sm sm:px-3">Тип</TabsTrigger>
          <TabsTrigger value="ingredients" className="text-xs px-2 py-1.5 sm:text-sm sm:px-3">Ингредиенты</TabsTrigger>
          <TabsTrigger value="steps" className="text-xs px-2 py-1.5 sm:text-sm sm:px-3">Шаги</TabsTrigger>
          <TabsTrigger value="nutrition" className="text-xs px-2 py-1.5 sm:text-sm sm:px-3">Питание</TabsTrigger>
        </TabsList>

        {/* Basic Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>Название, описание и параметры рецепта</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Например: Борщ украинский"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Краткое описание блюда"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL изображения</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="prepTime">Подготовка (мин)</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    min="0"
                    value={formData.prepTime}
                    onChange={(e) => setFormData({ ...formData, prepTime: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cookTime">Готовка (мин)</Label>
                  <Input
                    id="cookTime"
                    type="number"
                    min="0"
                    value={formData.cookTime}
                    onChange={(e) => setFormData({ ...formData, cookTime: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalTime">Всего (мин)</Label>
                  <Input
                    id="totalTime"
                    type="number"
                    min="0"
                    value={formData.totalTime}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="servings">Порций</Label>
                  <Input
                    id="servings"
                    type="number"
                    min="1"
                    value={formData.servings}
                    onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Сложность</Label>
                <Select
                  value={formData.difficultyLevel.toString()}
                  onValueChange={(value) => setFormData({ ...formData, difficultyLevel: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        {level} - {difficultyLabels[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classification Tab */}
        <TabsContent value="classification">
          <Card>
            <CardHeader>
              <CardTitle>Классификация</CardTitle>
              <CardDescription>Тип, категория и особенности блюда</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Тип приёма пищи *</Label>
                <div className="flex flex-wrap gap-2">
                  {mealTypeOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={formData.mealTypes.includes(option.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleMultiSelect("mealTypes", option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Категория блюда *</Label>
                <div className="flex flex-wrap gap-2">
                  {courseOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={formData.courses.includes(option.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleMultiSelect("courses", option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Кухня</Label>
                <div className="flex flex-wrap gap-2">
                  {cuisineOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={formData.cuisines.includes(option.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleMultiSelect("cuisines", option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Способ приготовления *</Label>
                <div className="flex flex-wrap gap-2">
                  {cookingMethodOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={formData.cookingMethods.includes(option.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleMultiSelect("cookingMethods", option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Диетические особенности</Label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.isVegetarian}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isVegetarian: checked as boolean })
                      }
                    />
                    <span>Вегетарианское</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.isVegan}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isVegan: checked as boolean })
                      }
                    />
                    <span>Веганское</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.isGlutenFree}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isGlutenFree: checked as boolean })
                      }
                    />
                    <span>Без глютена</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ingredients Tab */}
        <TabsContent value="ingredients">
          <Card>
            <CardHeader>
              <CardTitle>Ингредиенты</CardTitle>
              <CardDescription>Список продуктов для рецепта</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Загрузка продуктов...</div>
                </div>
              ) : products.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="text-muted-foreground">Нет доступных продуктов</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Сначала добавьте продукты в разделе &quot;Продукты&quot;
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => window.open("/products/new", "_blank")}
                  >
                    Добавить продукт
                  </Button>
                </div>
              ) : (
                <>
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="rounded-lg border p-3">
                  <div className="flex items-start gap-2">
                    <GripVertical className="mt-2 h-5 w-5 shrink-0 text-muted-foreground hidden sm:block" />
                    <div className="flex-1 space-y-2 sm:space-y-0 sm:grid sm:gap-2 sm:grid-cols-5">
                      <div className="sm:col-span-2">
                        <ProductCombobox
                          products={products}
                          value={ingredient.productId}
                          onChange={(value) => updateIngredient(index, { productId: value })}
                          placeholder="Выберите продукт"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:contents">
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="Кол-во"
                          value={ingredient.amount || ""}
                          onChange={(e) =>
                            updateIngredient(index, { amount: parseFloat(e.target.value) || 0 })
                          }
                        />
                        <Select
                          value={ingredient.unit}
                          onValueChange={(value) => updateIngredient(index, { unit: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="g">г</SelectItem>
                            <SelectItem value="ml">мл</SelectItem>
                            <SelectItem value="pcs">шт</SelectItem>
                            <SelectItem value="tbsp">ст.л.</SelectItem>
                            <SelectItem value="tsp">ч.л.</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between sm:justify-start gap-2">
                        <label className="flex items-center gap-1 text-sm">
                          <Checkbox
                            checked={ingredient.isOptional}
                            onCheckedChange={(checked) =>
                              updateIngredient(index, { isOptional: checked as boolean })
                            }
                          />
                          <span>Опциональный</span>
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => removeIngredient(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addIngredient}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить ингредиент
              </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Steps Tab */}
        <TabsContent value="steps">
          <Card>
            <CardHeader>
              <CardTitle>Приготовление</CardTitle>
              <CardDescription>Пошаговая инструкция</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.steps.map((step, index) => (
                <div key={index} className="rounded-lg border p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                      {step.stepNumber}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Описание шага..."
                        value={step.instruction}
                        onChange={(e) => updateStep(index, { instruction: e.target.value })}
                      />
                      <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2">
                        <Input
                          type="number"
                          min="0"
                          placeholder="Мин"
                          className="sm:w-28"
                          value={step.durationMinutes || ""}
                          onChange={(e) =>
                            updateStep(index, { durationMinutes: parseInt(e.target.value) || undefined })
                          }
                        />
                        <Input
                          type="number"
                          placeholder="°"
                          className="sm:w-20"
                          value={step.temperatureValue || ""}
                          onChange={(e) =>
                            updateStep(index, { temperatureValue: parseInt(e.target.value) || undefined })
                          }
                        />
                        <Select
                          value={step.temperatureUnit || "C"}
                          onValueChange={(value) => updateStep(index, { temperatureUnit: value as "C" | "F" })}
                        >
                          <SelectTrigger className="sm:w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="C">°C</SelectItem>
                            <SelectItem value="F">°F</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => removeStep(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addStep}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить шаг
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nutrition Tab */}
        <TabsContent value="nutrition">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
                    Пищевая ценность
                    {isAutoCalculated && (
                      <Badge variant="secondary" className="font-normal">
                        <Calculator className="mr-1 h-3 w-3" />
                        авторасчёт
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">На одну порцию (опционально)</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={applyAutoCalculation}
                  disabled={formData.ingredients.length === 0 || isLoadingProducts}
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Рассчитать
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="calories">Калории (ккал)</Label>
                  <Input
                    id="calories"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.caloriesPerServing || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, caloriesPerServing: parseFloat(e.target.value) || undefined });
                      setIsAutoCalculated(false);
                    }}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protein">Белки (г)</Label>
                  <Input
                    id="protein"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.proteinPerServing || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, proteinPerServing: parseFloat(e.target.value) || undefined });
                      setIsAutoCalculated(false);
                    }}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fat">Жиры (г)</Label>
                  <Input
                    id="fat"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.fatPerServing || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, fatPerServing: parseFloat(e.target.value) || undefined });
                      setIsAutoCalculated(false);
                    }}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs">Углеводы (г)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.carbsPerServing || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, carbsPerServing: parseFloat(e.target.value) || undefined });
                      setIsAutoCalculated(false);
                    }}
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end gap-4">
        <Button type="button" variant="outline" asChild>
          <Link href="/recipes">Отмена</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Сохранение..." : mode === "create" ? "Создать рецепт" : "Сохранить изменения"}
        </Button>
      </div>
    </form>
  );
}
