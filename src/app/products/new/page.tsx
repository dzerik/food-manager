"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Package,
  Tag,
  Scale,
  Flame,
  Zap,
  Droplet,
  Wheat,
  AlertTriangle,
  Home,
  Box,
  Milk,
  Egg,
  Fish,
  Nut,
  Bean,
  Leaf,
} from "lucide-react";
import { toast } from "sonner";
import { getCategoryConfig, productCategories } from "@/lib/product-categories";
import { cn } from "@/lib/utils";

const allergenOptions = [
  { value: "milk", label: "Молоко", icon: Milk },
  { value: "eggs", label: "Яйца", icon: Egg },
  { value: "fish", label: "Рыба", icon: Fish },
  { value: "shellfish", label: "Моллюски", icon: Fish },
  { value: "tree_nuts", label: "Орехи", icon: Nut },
  { value: "peanuts", label: "Арахис", icon: Nut },
  { value: "wheat", label: "Пшеница/Глютен", icon: Wheat },
  { value: "soybeans", label: "Соя", icon: Bean },
  { value: "sesame", label: "Кунжут", icon: Leaf },
  { value: "celery", label: "Сельдерей", icon: Leaf },
  { value: "mustard", label: "Горчица", icon: Leaf },
];

const units = [
  { value: "g", label: "граммы (г)", icon: Scale },
  { value: "ml", label: "миллилитры (мл)", icon: Droplet },
  { value: "pcs", label: "штуки (шт)", icon: Box },
];

export default function NewProductPage() {
  const { status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subcategory: "",
    defaultUnit: "g",
    gramsPerPiece: "",
    packageSize: "",
    isAlwaysOwned: false,
    description: "",
    calories: "",
    protein: "",
    fat: "",
    carbohydrates: "",
    allergens: [] as string[],
  });

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name || !formData.category) {
      toast.error("Заполните обязательные поля");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        category: formData.category,
        defaultUnit: formData.defaultUnit,
      };

      if (formData.subcategory) payload.subcategory = formData.subcategory;
      if (formData.description) payload.description = formData.description;
      if (formData.gramsPerPiece) payload.gramsPerPiece = parseFloat(formData.gramsPerPiece);
      if (formData.packageSize) payload.packageSize = parseFloat(formData.packageSize);
      payload.isAlwaysOwned = formData.isAlwaysOwned;

      // Add nutrition if any field is filled
      if (formData.calories || formData.protein || formData.fat || formData.carbohydrates) {
        payload.nutrition = {
          calories: parseFloat(formData.calories) || 0,
          protein: parseFloat(formData.protein) || 0,
          fat: parseFloat(formData.fat) || 0,
          carbohydrates: parseFloat(formData.carbohydrates) || 0,
        };
      }

      // Add dietary info with allergens
      if (formData.allergens.length > 0) {
        payload.dietaryInfo = {
          allergens: formData.allergens,
        };
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create product");
      }

      toast.success("Продукт создан");
      router.push("/products");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось создать продукт");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Get selected category config for preview
  const selectedCatConfig = formData.category ? getCategoryConfig(formData.category) : null;
  const SelectedCatIcon = selectedCatConfig?.icon;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/products">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Новый продукт</h1>
              <p className="text-sm text-muted-foreground">Добавление в каталог</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Main Info Card */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Основная информация</CardTitle>
                    <CardDescription>Название и категория продукта</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    Название <Badge variant="secondary" className="text-xs">обязательно</Badge>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Например: Куриная грудка"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Категория <Badge variant="secondary" className="text-xs">обязательно</Badge>
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(productCategories).map(([value, config]) => {
                          const Icon = config.icon;
                          return (
                            <SelectItem key={value} value={value}>
                              <span className="flex items-center gap-2">
                                <Icon className={cn("h-4 w-4", config.color)} />
                                {config.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Подкатегория</Label>
                    <Input
                      id="subcategory"
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      placeholder="Например: Птица"
                    />
                  </div>
                </div>

                {/* Category preview */}
                {selectedCatConfig && SelectedCatIcon && (
                  <div className={cn("flex items-center gap-3 rounded-lg p-3", selectedCatConfig.bgColor)}>
                    <SelectedCatIcon className={cn("h-6 w-6", selectedCatConfig.color)} />
                    <div>
                      <p className={cn("font-medium", selectedCatConfig.color)}>{selectedCatConfig.label}</p>
                      <p className="text-xs text-muted-foreground">Выбранная категория</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Краткое описание продукта"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Units Card */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <Scale className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Единицы измерения</CardTitle>
                    <CardDescription>Как измеряется продукт</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Единица измерения</Label>
                    <Select
                      value={formData.defaultUnit}
                      onValueChange={(value) => setFormData({ ...formData, defaultUnit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => {
                          const Icon = unit.icon;
                          return (
                            <SelectItem key={unit.value} value={unit.value}>
                              <span className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                {unit.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.defaultUnit === "pcs" && (
                    <div className="space-y-2">
                      <Label htmlFor="gramsPerPiece">Граммов в штуке</Label>
                      <Input
                        id="gramsPerPiece"
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.gramsPerPiece}
                        onChange={(e) => setFormData({ ...formData, gramsPerPiece: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="packageSize" className="flex items-center gap-2">
                      <Box className="h-4 w-4 text-muted-foreground" />
                      Размер упаковки (г)
                    </Label>
                    <Input
                      id="packageSize"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.packageSize}
                      onChange={(e) => setFormData({ ...formData, packageSize: e.target.value })}
                      placeholder="1000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Для округления в списке покупок
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 pt-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                    <Checkbox
                      id="isAlwaysOwned"
                      checked={formData.isAlwaysOwned}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isAlwaysOwned: checked === true })
                      }
                    />
                    <div>
                      <Label htmlFor="isAlwaysOwned" className="cursor-pointer flex items-center gap-2">
                        <Home className="h-4 w-4 text-amber-600" />
                        Всегда есть дома
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Автоматически отмечается в списке
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nutrition Card */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                    <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Пищевая ценность</CardTitle>
                    <CardDescription>На 100 грамм продукта (опционально)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="calories" className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      Калории
                    </Label>
                    <Input
                      id="calories"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.calories}
                      onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                      placeholder="ккал"
                      className="border-orange-200 focus:border-orange-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="protein" className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      Белки (г)
                    </Label>
                    <Input
                      id="protein"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.protein}
                      onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                      placeholder="0"
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fat" className="flex items-center gap-2">
                      <Droplet className="h-4 w-4 text-yellow-500" />
                      Жиры (г)
                    </Label>
                    <Input
                      id="fat"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.fat}
                      onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                      placeholder="0"
                      className="border-yellow-200 focus:border-yellow-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carbohydrates" className="flex items-center gap-2">
                      <Wheat className="h-4 w-4 text-green-500" />
                      Углеводы (г)
                    </Label>
                    <Input
                      id="carbohydrates"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.carbohydrates}
                      onChange={(e) => setFormData({ ...formData, carbohydrates: e.target.value })}
                      placeholder="0"
                      className="border-green-200 focus:border-green-400"
                    />
                  </div>
                </div>

                {/* Nutrition summary if filled */}
                {(formData.calories || formData.protein || formData.fat || formData.carbohydrates) && (
                  <div className="mt-4 flex flex-wrap gap-3 p-3 rounded-lg bg-muted/50">
                    {formData.calories && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                        <Flame className="mr-1 h-3 w-3" />
                        {formData.calories} ккал
                      </Badge>
                    )}
                    {formData.protein && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        <Zap className="mr-1 h-3 w-3" />
                        Б: {formData.protein}г
                      </Badge>
                    )}
                    {formData.fat && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                        <Droplet className="mr-1 h-3 w-3" />
                        Ж: {formData.fat}г
                      </Badge>
                    )}
                    {formData.carbohydrates && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        <Wheat className="mr-1 h-3 w-3" />
                        У: {formData.carbohydrates}г
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Allergens Card */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Содержит аллергены</CardTitle>
                    <CardDescription>Отметьте, какие аллергены содержит этот продукт</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Selected allergens */}
                {formData.allergens.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {formData.allergens.map((allergenId) => {
                      const allergen = allergenOptions.find((a) => a.value === allergenId);
                      const Icon = allergen?.icon || AlertTriangle;
                      return (
                        <Badge
                          key={allergenId}
                          variant="secondary"
                          className="gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        >
                          <Icon className="h-3 w-3" />
                          {allergen?.label}
                        </Badge>
                      );
                    })}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {allergenOptions.map((allergen) => {
                    const Icon = allergen.icon;
                    const isSelected = formData.allergens.includes(allergen.value);
                    return (
                      <label
                        key={allergen.value}
                        className={cn(
                          "flex items-center gap-3 cursor-pointer rounded-lg border p-3 transition-colors",
                          isSelected
                            ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                            : "border-transparent bg-muted/50 hover:bg-muted"
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                allergens: [...formData.allergens, allergen.value],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                allergens: formData.allergens.filter((a) => a !== allergen.value),
                              });
                            }
                          }}
                        />
                        <Icon className={cn("h-4 w-4", isSelected ? "text-red-600" : "text-muted-foreground")} />
                        <span className={cn("text-sm", isSelected && "font-medium text-red-700 dark:text-red-300")}>
                          {allergen.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/products">Отмена</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Сохранение..." : "Создать продукт"}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
