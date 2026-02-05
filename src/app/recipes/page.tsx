"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RecipeCard } from "@/components/recipes/recipe-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, X, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface Recipe {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  totalTime: number;
  servings: number;
  difficultyLevel: number;
  mealTypes: string[];
  cuisines: string[];
  isVegan: boolean;
  isVegetarian: boolean;
  caloriesPerServing: number | null;
}

const mealTypeOptions = [
  { value: "breakfast", label: "Завтрак" },
  { value: "lunch", label: "Обед" },
  { value: "dinner", label: "Ужин" },
  { value: "snack", label: "Перекус" },
];

const cuisineOptions = [
  { value: "russian", label: "Русская" },
  { value: "italian", label: "Итальянская" },
  { value: "asian", label: "Азиатская" },
  { value: "french", label: "Французская" },
  { value: "mexican", label: "Мексиканская" },
  { value: "indian", label: "Индийская" },
  { value: "mediterranean", label: "Средиземноморская" },
  { value: "japanese", label: "Японская" },
  { value: "chinese", label: "Китайская" },
  { value: "thai", label: "Тайская" },
  { value: "middle_eastern", label: "Ближневосточная" },
  { value: "american", label: "Американская" },
];

const difficultyOptions = [
  { value: "1", label: "Очень легко" },
  { value: "2", label: "Легко" },
  { value: "3", label: "Средне" },
  { value: "4", label: "Сложно" },
  { value: "5", label: "Очень сложно" },
];

const timeOptions = [
  { value: "15", label: "До 15 минут" },
  { value: "30", label: "До 30 минут" },
  { value: "60", label: "До 1 часа" },
  { value: "120", label: "До 2 часов" },
];

function RecipesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Filter states
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [mealType, setMealType] = useState(searchParams.get("mealType") || "");
  const [cuisine, setCuisine] = useState(searchParams.get("cuisine") || "");
  const [difficulty, setDifficulty] = useState(searchParams.get("difficulty") || "");
  const [maxTime, setMaxTime] = useState(searchParams.get("maxTime") || "");
  const [isVegan, setIsVegan] = useState(searchParams.get("isVegan") === "true");
  const [isVegetarian, setIsVegetarian] = useState(searchParams.get("isVegetarian") === "true");

  const activeFiltersCount = [mealType, cuisine, difficulty, maxTime, isVegan, isVegetarian]
    .filter(Boolean).length;

  // Debounce search input
  const debouncedSearch = useDebounce(search, 300);

  const fetchRecipes = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (mealType) params.set("mealType", mealType);
      if (cuisine) params.set("cuisine", cuisine);
      if (difficulty) params.set("difficulty", difficulty);
      if (maxTime) params.set("maxTime", maxTime);
      if (isVegan) params.set("isVegan", "true");
      if (isVegetarian) params.set("isVegetarian", "true");
      params.set("limit", "100");

      const res = await fetch(`/api/recipes?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch recipes");

      const data = await res.json();
      setRecipes(data.recipes);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, mealType, cuisine, difficulty, maxTime, isVegan, isVegetarian]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (mealType) params.set("mealType", mealType);
    if (cuisine) params.set("cuisine", cuisine);
    if (difficulty) params.set("difficulty", difficulty);
    if (maxTime) params.set("maxTime", maxTime);
    if (isVegan) params.set("isVegan", "true");
    if (isVegetarian) params.set("isVegetarian", "true");

    const queryString = params.toString();
    router.replace(queryString ? `?${queryString}` : "/recipes", { scroll: false });
  }, [search, mealType, cuisine, difficulty, maxTime, isVegan, isVegetarian, router]);

  function clearFilters() {
    setSearch("");
    setMealType("");
    setCuisine("");
    setDifficulty("");
    setMaxTime("");
    setIsVegan(false);
    setIsVegetarian(false);
  }

  function removeFilter(filter: string) {
    switch (filter) {
      case "mealType": setMealType(""); break;
      case "cuisine": setCuisine(""); break;
      case "difficulty": setDifficulty(""); break;
      case "maxTime": setMaxTime(""); break;
      case "isVegan": setIsVegan(false); break;
      case "isVegetarian": setIsVegetarian(false); break;
    }
  }

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Приём пищи</Label>
        <Select value={mealType || "all"} onValueChange={(v) => setMealType(v === "all" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Все" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            {mealTypeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Кухня</Label>
        <Select value={cuisine || "all"} onValueChange={(v) => setCuisine(v === "all" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Все" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            {cuisineOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Сложность</Label>
        <Select value={difficulty || "all"} onValueChange={(v) => setDifficulty(v === "all" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Любая" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Любая</SelectItem>
            {difficultyOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Время приготовления</Label>
        <Select value={maxTime || "all"} onValueChange={(v) => setMaxTime(v === "all" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Любое" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Любое</SelectItem>
            {timeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Диета</Label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={isVegetarian}
              onCheckedChange={(checked) => setIsVegetarian(checked === true)}
            />
            <span className="text-sm">Вегетарианское</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={isVegan}
              onCheckedChange={(checked) => setIsVegan(checked === true)}
            />
            <span className="text-sm">Веганское</span>
          </label>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          Сбросить фильтры
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Рецепты</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoading ? "Загрузка..." : `${total} рецептов`}
            </p>
          </div>
          <Button asChild size="sm" className="sm:size-default">
            <Link href="/recipes/new">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Добавить рецепт</span>
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск рецептов..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Desktop Filters */}
          <div className="hidden gap-2 lg:flex">
            <Select value={mealType || "all"} onValueChange={(v) => setMealType(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Приём пищи" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                {mealTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={cuisine || "all"} onValueChange={(v) => setCuisine(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Кухня" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                {cuisineOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={maxTime || "all"} onValueChange={(v) => setMaxTime(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Время" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Любое</SelectItem>
                {timeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Filters Button */}
          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <Filter className="mr-2 h-4 w-4" />
                Фильтры
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Фильтры</SheetTitle>
                <SheetDescription>
                  Настройте параметры поиска рецептов
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filters Badges */}
        {activeFiltersCount > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {mealType && (
              <Badge variant="secondary" className="gap-1">
                {mealTypeOptions.find(o => o.value === mealType)?.label}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("mealType")} />
              </Badge>
            )}
            {cuisine && (
              <Badge variant="secondary" className="gap-1">
                {cuisineOptions.find(o => o.value === cuisine)?.label}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("cuisine")} />
              </Badge>
            )}
            {difficulty && (
              <Badge variant="secondary" className="gap-1">
                {difficultyOptions.find(o => o.value === difficulty)?.label}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("difficulty")} />
              </Badge>
            )}
            {maxTime && (
              <Badge variant="secondary" className="gap-1">
                {timeOptions.find(o => o.value === maxTime)?.label}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("maxTime")} />
              </Badge>
            )}
            {isVegetarian && (
              <Badge variant="secondary" className="gap-1">
                Вегетарианское
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("isVegetarian")} />
              </Badge>
            )}
            {isVegan && (
              <Badge variant="secondary" className="gap-1">
                Веганское
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("isVegan")} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Сбросить все
            </Button>
          </div>
        )}

        {/* Recipes Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : recipes.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              {search || activeFiltersCount > 0
                ? "Рецепты не найдены. Попробуйте изменить параметры поиска."
                : "Пока нет рецептов. Добавьте первый!"}
            </p>
            {(search || activeFiltersCount > 0) && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Сбросить фильтры
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen">
          <Header />
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Рецепты</h1>
              <p className="mt-1 text-muted-foreground">Загрузка...</p>
            </div>
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </main>
        </div>
      }
    >
      <RecipesContent />
    </Suspense>
  );
}
