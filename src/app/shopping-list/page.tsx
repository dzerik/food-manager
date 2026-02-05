"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShoppingCart, Calendar, Download, FileText, FileJson, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ShoppingItem {
  productId: string;
  productName: string;
  category: string;
  totalGrams: number;
  roundedGrams: number;
  packagesNeeded: number | null;
  packageSize: number | null;
  gramsPerPiece: number | null;
  unit: string;
  isAlwaysOwned: boolean;
  isExcluded: boolean;
  excludeReason?: string;
  allergens: string[];
  isChecked: boolean;
}

interface ShoppingListData {
  mealPlanId: string;
  mealPlanName: string | null;
  startDate: string;
  endDate: string;
  totalItems: number;
  excludedItems: number;
  items: ShoppingItem[];
  groupedByCategory: Record<string, ShoppingItem[]>;
}

interface MealPlanSummary {
  id: string;
  name: string | null;
  startDate: string;
  endDate: string;
}

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
  dried_fruits: "Сухофрукты",
  condiments: "Приправы",
  liquids: "Жидкости",
  dairy_alternatives: "Растительные альтернативы",
  protein: "Белок",
  sweets: "Сладости",
};

function formatAmount(grams: number, unit: string, gramsPerPiece?: number | null): string {
  if (unit === "pcs" && gramsPerPiece && gramsPerPiece > 0) {
    const pieces = Math.ceil(grams / gramsPerPiece);
    return `${pieces} шт`;
  }
  if (unit === "ml") {
    return grams >= 1000 ? `${(grams / 1000).toFixed(1)} л` : `${Math.round(grams)} мл`;
  }
  return grams >= 1000 ? `${(grams / 1000).toFixed(1)} кг` : `${Math.round(grams)} г`;
}

export default function ShoppingListPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [mealPlan, setMealPlan] = useState<MealPlanSummary | null>(null);
  const [shoppingData, setShoppingData] = useState<ShoppingListData | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Load checked items from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("shopping-list-checked");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.mealPlanId && parsed.items) {
          setCheckedItems(new Set(parsed.items));
        }
      } catch {
        // Ignore invalid data
      }
    }
  }, []);

  // Fetch latest meal plan and shopping list
  useEffect(() => {
    async function fetchData() {
      try {
        // Get latest meal plan
        const plansRes = await fetch("/api/meal-plans?limit=1");
        if (!plansRes.ok) {
          if (plansRes.status === 401) {
            window.location.href = "/login";
            return;
          }
          throw new Error("Failed to fetch plans");
        }

        const plansData = await plansRes.json();
        const plans = plansData.mealPlans || [];

        if (plans.length === 0) {
          setIsLoading(false);
          return;
        }

        const plan = plans[0];
        setMealPlan(plan);

        // Fetch shopping list
        const listRes = await fetch(`/api/meal-plans/${plan.id}/shopping-list`);
        if (!listRes.ok) throw new Error("Failed to fetch shopping list");

        const listData = await listRes.json();
        setShoppingData(listData);

        // Initialize checked items with isAlwaysOwned products
        const stored = localStorage.getItem("shopping-list-checked");
        let initialChecked = new Set<string>();

        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.mealPlanId === plan.id && parsed.items) {
              initialChecked = new Set(parsed.items);
            }
          } catch {
            // Ignore
          }
        }

        // Add isAlwaysOwned items to checked
        for (const item of listData.items) {
          if (item.isAlwaysOwned) {
            initialChecked.add(item.productId);
          }
        }

        setCheckedItems(initialChecked);
      } catch (error) {
        console.error("Failed to fetch shopping list:", error);
        toast.error("Не удалось загрузить список покупок");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Save checked items to localStorage
  useEffect(() => {
    if (mealPlan) {
      localStorage.setItem(
        "shopping-list-checked",
        JSON.stringify({
          mealPlanId: mealPlan.id,
          items: Array.from(checkedItems),
        })
      );
    }
  }, [checkedItems, mealPlan]);

  function toggleItem(productId: string) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    if (!shoppingData) return;

    if (checked) {
      setCheckedItems(new Set(shoppingData.items.map((i) => i.productId)));
    } else {
      // Keep isAlwaysOwned items checked
      setCheckedItems(
        new Set(shoppingData.items.filter((i) => i.isAlwaysOwned).map((i) => i.productId))
      );
    }
  }

  async function handleExport(format: "txt" | "csv" | "json") {
    if (!mealPlan) return;

    try {
      const res = await fetch(`/api/meal-plans/${mealPlan.id}/shopping-list/export?format=${format}`);
      if (!res.ok) throw new Error("Export failed");

      if (format === "json") {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        downloadBlob(blob, "shopping-list.json");
      } else {
        const text = await res.text();
        const mimeType = format === "csv" ? "text/csv" : "text/plain";
        const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
        downloadBlob(blob, `shopping-list.${format}`);
      }

      toast.success("Список экспортирован");
    } catch {
      toast.error("Не удалось экспортировать список");
    }
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function copyToClipboard() {
    if (!shoppingData) return;

    const uncheckedItems = shoppingData.items.filter(
      (i) => !checkedItems.has(i.productId) && !i.isExcluded
    );

    // Group by category
    const grouped = uncheckedItems.reduce((acc, item) => {
      const cat = categoryLabels[item.category] || item.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, ShoppingItem[]>);

    const lines: string[] = [];
    lines.push("Список покупок:");
    lines.push("");

    for (const [category, items] of Object.entries(grouped)) {
      lines.push(`${category}:`);
      for (const item of items) {
        const amount = formatAmount(item.roundedGrams, item.unit, item.gramsPerPiece);
        const packageInfo = item.packagesNeeded ? ` (${item.packagesNeeded} уп.)` : "";
        lines.push(`  - ${item.productName}: ${amount}${packageInfo}`);
      }
      lines.push("");
    }

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedToClipboard(true);
      toast.success("Скопировано в буфер обмена");
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch {
      toast.error("Не удалось скопировать");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-lg bg-muted" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!mealPlan || !shoppingData) {
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

  const grouped = shoppingData.groupedByCategory;
  const sortedCategories = Object.keys(grouped).sort();

  const totalItems = shoppingData.items.filter((i) => !i.isExcluded).length;
  const checkedCount = shoppingData.items.filter(
    (i) => !i.isExcluded && checkedItems.has(i.productId)
  ).length;
  const remainingCount = totalItems - checkedCount;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Список покупок</h1>
            <p className="mt-2 text-muted-foreground">
              На основе плана:{" "}
              {format(new Date(shoppingData.startDate), "d MMMM", { locale: ru })} -{" "}
              {format(new Date(shoppingData.endDate), "d MMMM", { locale: ru })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {remainingCount > 0
                ? `Осталось купить: ${remainingCount} из ${totalItems}`
                : "Все продукты куплены!"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              {copiedToClipboard ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copiedToClipboard ? "Скопировано" : "Копировать"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Экспорт
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport("txt")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Текст (.txt)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  <FileText className="mr-2 h-4 w-4" />
                  CSV (.csv)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("json")}>
                  <FileJson className="mr-2 h-4 w-4" />
                  JSON (.json)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleAll(remainingCount > 0)}
            >
              {remainingCount > 0 ? "Отметить все" : "Сбросить"}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedCategories.map((category) => {
            const items = grouped[category];
            const categoryChecked = items.filter(
              (i) => !i.isExcluded && checkedItems.has(i.productId)
            ).length;
            const categoryTotal = items.filter((i) => !i.isExcluded).length;

            return (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>{categoryLabels[category] || category}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {categoryChecked}/{categoryTotal}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {items.map((item) => {
                      const isChecked = checkedItems.has(item.productId);
                      const isDisabled = item.isAlwaysOwned;

                      return (
                        <li
                          key={item.productId}
                          className={`flex items-center gap-3 text-sm ${
                            item.isExcluded
                              ? "text-muted-foreground line-through opacity-50"
                              : isChecked
                                ? "text-muted-foreground line-through"
                                : ""
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => !item.isExcluded && toggleItem(item.productId)}
                            disabled={item.isExcluded || isDisabled}
                          />
                          <span className="flex-1">{item.productName}</span>
                          <span className="shrink-0 font-medium">
                            {formatAmount(item.roundedGrams, item.unit, item.gramsPerPiece)}
                            {item.packagesNeeded && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({item.packagesNeeded} уп.)
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {shoppingData.excludedItems > 0 && (
          <p className="mt-6 text-sm text-muted-foreground">
            {shoppingData.excludedItems} продуктов исключено из-за аллергий
          </p>
        )}
      </main>
    </div>
  );
}
