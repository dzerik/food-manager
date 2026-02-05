"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductEditDialog } from "@/components/products/product-edit-dialog";
import { DeliveryServices } from "@/components/shopping/delivery-services";
import {
  ShoppingCart,
  Calendar,
  Download,
  FileText,
  FileJson,
  Copy,
  Check,
  ChevronDown,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import { getCategoryConfig } from "@/lib/product-categories";
import { cn } from "@/lib/utils";

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
  fromPlans?: string[];
}

interface ShoppingListData {
  mealPlanIds: string[];
  mealPlans: MealPlanSummary[];
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
  bakery: "Выпечка",
  sweeteners: "Сладкое",
  nuts: "Орехи",
  seeds: "Семена",
  dried_fruits: "Сухофрукты",
  condiments: "Приправы",
  liquids: "Жидкости",
  dairy_alternatives: "Растительные альтернативы",
  protein: "Белок",
  sweets: "Сладости",
  beverages: "Напитки",
  other: "Другое",
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

function getPlanLabel(plan: MealPlanSummary, includeDates = false): string {
  const name = plan.name || "План питания";
  if (includeDates) {
    const dates = `${format(new Date(plan.startDate), "d MMM", { locale: ru })} - ${format(new Date(plan.endDate), "d MMM", { locale: ru })}`;
    return `${name} (${dates})`;
  }
  return name;
}

function generateShoppingListText(
  shoppingData: ShoppingListData,
  checkedItems: Set<string>
): string {
  const uncheckedItems = shoppingData.items.filter(
    (i) => !checkedItems.has(i.productId) && !i.isExcluded
  );

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
      lines.push(`- ${item.productName}: ${amount}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export default function ShoppingListPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [allPlans, setAllPlans] = useState<MealPlanSummary[]>([]);
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(new Set());
  const [shoppingData, setShoppingData] = useState<ShoppingListData | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [isPlansDropdownOpen, setIsPlansDropdownOpen] = useState(false);

  // Product edit dialog
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

  // Fetch all available plans (current and future)
  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/meal-plans?limit=50");
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = "/login";
            return;
          }
          throw new Error("Failed to fetch plans");
        }

        const data = await res.json();
        const plans: MealPlanSummary[] = data.mealPlans || [];

        // Filter to current and future plans only
        const today = startOfDay(new Date());
        const relevantPlans = plans.filter((p) => {
          const endDate = new Date(p.endDate);
          return !isBefore(endDate, today);
        });

        setAllPlans(relevantPlans);

        // Auto-select the first (most recent) plan
        if (relevantPlans.length > 0) {
          setSelectedPlanIds(new Set([relevantPlans[0].id]));
        }
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        toast.error("Не удалось загрузить планы питания");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlans();
  }, []);

  // Fetch consolidated shopping list when selected plans change
  const fetchShoppingList = useCallback(async () => {
    if (selectedPlanIds.size === 0) {
      setShoppingData(null);
      return;
    }

    try {
      const res = await fetch("/api/shopping-list/consolidated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealPlanIds: Array.from(selectedPlanIds) }),
      });

      if (!res.ok) throw new Error("Failed to fetch shopping list");

      const listData: ShoppingListData = await res.json();
      setShoppingData(listData);

      // Load checked items from localStorage
      const storageKey = `shopping-list-checked-${Array.from(selectedPlanIds).sort().join("-")}`;
      const stored = localStorage.getItem(storageKey);
      let initialChecked = new Set<string>();

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            initialChecked = new Set(parsed);
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
    }
  }, [selectedPlanIds]);

  useEffect(() => {
    if (!isLoading && selectedPlanIds.size > 0) {
      fetchShoppingList();
    }
  }, [isLoading, selectedPlanIds, fetchShoppingList]);

  // Save checked items to localStorage
  useEffect(() => {
    if (selectedPlanIds.size > 0 && shoppingData) {
      const storageKey = `shopping-list-checked-${Array.from(selectedPlanIds).sort().join("-")}`;
      localStorage.setItem(storageKey, JSON.stringify(Array.from(checkedItems)));
    }
  }, [checkedItems, selectedPlanIds, shoppingData]);

  function togglePlanSelection(planId: string) {
    setSelectedPlanIds((prev) => {
      const next = new Set(prev);
      if (next.has(planId)) {
        next.delete(planId);
      } else {
        next.add(planId);
      }
      return next;
    });
  }

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
      setCheckedItems(
        new Set(shoppingData.items.filter((i) => i.isAlwaysOwned).map((i) => i.productId))
      );
    }
  }

  function handleProductClick(productId: string) {
    setEditProductId(productId);
    setIsProductDialogOpen(true);
  }

  function handleProductSaved() {
    // Refresh shopping list to get updated product data
    fetchShoppingList();
  }

  async function handleExport(format: "txt" | "csv" | "json") {
    if (!shoppingData || selectedPlanIds.size === 0) return;

    // Use first plan for export (or implement multi-plan export)
    const planId = Array.from(selectedPlanIds)[0];

    try {
      const res = await fetch(`/api/meal-plans/${planId}/shopping-list/export?format=${format}`);
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

  if (allPlans.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-8 text-3xl font-bold">Список покупок</h1>
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Нет актуальных планов питания</h3>
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

  const grouped = shoppingData?.groupedByCategory || {};
  const sortedCategories = Object.keys(grouped).sort();

  const totalItems = shoppingData?.items.filter((i) => !i.isExcluded).length || 0;
  const checkedCount = shoppingData?.items.filter(
    (i) => !i.isExcluded && checkedItems.has(i.productId)
  ).length || 0;
  const remainingCount = totalItems - checkedCount;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold">Список покупок</h1>

            {/* Actions - desktop */}
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={!shoppingData}>
                {copiedToClipboard ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {copiedToClipboard ? "Скопировано" : "Копировать"}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!shoppingData}>
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
                disabled={!shoppingData}
              >
                {remainingCount > 0 ? "Отметить все" : "Сбросить"}
              </Button>
            </div>

            {/* Actions - mobile */}
            <div className="flex sm:hidden items-center gap-1">
              <Button variant="outline" size="icon" onClick={copyToClipboard} disabled={!shoppingData}>
                {copiedToClipboard ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" disabled={!shoppingData}>
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport("txt")}>
                    <FileText className="mr-2 h-4 w-4" />
                    Текст
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("csv")}>
                    <FileText className="mr-2 h-4 w-4" />
                    CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("json")}>
                    <FileJson className="mr-2 h-4 w-4" />
                    JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Plan selector */}
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu open={isPlansDropdownOpen} onOpenChange={setIsPlansDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Calendar className="mr-2 h-4 w-4 sm:hidden" />
                  <span className="hidden sm:inline">Выбрать планы</span>
                  <span className="sm:hidden">Планы</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] sm:w-80 max-w-80">
                {allPlans.map((plan) => (
                  <DropdownMenuItem
                    key={plan.id}
                    className="flex items-center gap-2"
                    onSelect={(e) => {
                      e.preventDefault();
                      togglePlanSelection(plan.id);
                    }}
                  >
                    <Checkbox
                      checked={selectedPlanIds.has(plan.id)}
                      className="pointer-events-none"
                    />
                    <div className="flex-1 truncate">
                      <div className="font-medium truncate">{plan.name || "План питания"}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(plan.startDate), "d MMM", { locale: ru })} -{" "}
                        {format(new Date(plan.endDate), "d MMM yyyy", { locale: ru })}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Selected plans badges - scrollable on mobile */}
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {Array.from(selectedPlanIds).map((planId) => {
                const plan = allPlans.find((p) => p.id === planId);
                if (!plan) return null;
                return (
                  <Badge key={planId} variant="secondary" className="gap-1 text-xs sm:text-sm">
                    <span className="hidden sm:inline">{getPlanLabel(plan, true)}</span>
                    <span className="sm:hidden">{getPlanLabel(plan, false)}</span>
                    <button
                      onClick={() => togglePlanSelection(planId)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>

            {/* Toggle all - mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleAll(remainingCount > 0)}
              disabled={!shoppingData}
              className="sm:hidden ml-auto"
            >
              {remainingCount > 0 ? "Все" : "Сброс"}
            </Button>
          </div>

          {shoppingData && (
            <p className="text-sm text-muted-foreground">
              {remainingCount > 0
                ? `Осталось купить: ${remainingCount} из ${totalItems}`
                : "Все продукты куплены!"}
            </p>
          )}
        </div>

        {selectedPlanIds.size === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Выберите план питания</h3>
              <p className="mt-2 text-muted-foreground">
                Нажмите &quot;Выбрать планы&quot; чтобы сформировать список покупок
              </p>
            </CardContent>
          </Card>
        ) : shoppingData ? (
          <>
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
                const catConfig = getCategoryConfig(category);
                const CatIcon = catConfig.icon;
                const isComplete = categoryChecked === categoryTotal && categoryTotal > 0;

                return (
                  <Card key={category} className={cn(isComplete && "opacity-60")}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-lg">
                        <div className="flex items-center gap-2">
                          <div className={cn("rounded-lg p-1.5", catConfig.bgColor)}>
                            <CatIcon className={cn("h-4 w-4", catConfig.color)} />
                          </div>
                          <span>{categoryLabels[category] || catConfig.label}</span>
                        </div>
                        <Badge variant={isComplete ? "default" : "secondary"} className="text-xs">
                          {categoryChecked}/{categoryTotal}
                        </Badge>
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
                              <button
                                className="flex-1 text-left hover:underline cursor-pointer"
                                onClick={() => handleProductClick(item.productId)}
                              >
                                {item.productName}
                              </button>
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

            {/* Delivery services */}
            <DeliveryServices
              shoppingListText={generateShoppingListText(shoppingData, checkedItems)}
              itemsCount={remainingCount}
            />
          </>
        ) : (
          <div className="flex justify-center py-12">
            <div className="animate-pulse h-8 w-32 rounded bg-muted" />
          </div>
        )}
      </main>

      <ProductEditDialog
        productId={editProductId}
        open={isProductDialogOpen}
        onOpenChange={setIsProductDialogOpen}
        onSaved={handleProductSaved}
      />
    </div>
  );
}
