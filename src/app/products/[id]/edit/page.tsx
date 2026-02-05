"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { use } from "react";

const allergenOptions = [
  { value: "milk", label: "Молоко" },
  { value: "eggs", label: "Яйца" },
  { value: "fish", label: "Рыба" },
  { value: "shellfish", label: "Моллюски" },
  { value: "tree_nuts", label: "Орехи" },
  { value: "peanuts", label: "Арахис" },
  { value: "wheat", label: "Пшеница/Глютен" },
  { value: "soybeans", label: "Соя" },
  { value: "sesame", label: "Кунжут" },
  { value: "celery", label: "Сельдерей" },
  { value: "mustard", label: "Горчица" },
];

const categories = [
  { value: "vegetables", label: "Овощи" },
  { value: "fruits", label: "Фрукты" },
  { value: "meat", label: "Мясо" },
  { value: "fish", label: "Рыба" },
  { value: "dairy", label: "Молочные" },
  { value: "grains", label: "Крупы" },
  { value: "bakery", label: "Выпечка" },
  { value: "spices", label: "Специи" },
  { value: "oils", label: "Масла" },
  { value: "sauces", label: "Соусы" },
  { value: "beverages", label: "Напитки" },
  { value: "other", label: "Другое" },
];

const units = [
  { value: "g", label: "граммы (г)" },
  { value: "ml", label: "миллилитры (мл)" },
  { value: "pcs", label: "штуки (шт)" },
];

interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  defaultUnit: string;
  gramsPerPiece?: number | null;
  packageSize?: number | null;
  isAlwaysOwned?: boolean;
  nutrition?: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
  } | null;
  dietaryInfo?: {
    allergens?: string;
  } | null;
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
          toast.error("Продукт не найден");
          router.push("/products");
          return;
        }

        const product: Product = await res.json();
        const allergens = product.dietaryInfo?.allergens
          ? JSON.parse(product.dietaryInfo.allergens) as string[]
          : [];
        setFormData({
          name: product.name,
          category: product.category,
          subcategory: product.subcategory || "",
          defaultUnit: product.defaultUnit,
          gramsPerPiece: product.gramsPerPiece?.toString() || "",
          packageSize: product.packageSize?.toString() || "",
          isAlwaysOwned: product.isAlwaysOwned || false,
          description: product.description || "",
          calories: product.nutrition?.calories?.toString() || "",
          protein: product.nutrition?.protein?.toString() || "",
          fat: product.nutrition?.fat?.toString() || "",
          carbohydrates: product.nutrition?.carbohydrates?.toString() || "",
          allergens,
        });
      } catch {
        toast.error("Не удалось загрузить продукт");
        router.push("/products");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProduct();
  }, [id, router]);

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
        subcategory: formData.subcategory || null,
        description: formData.description || null,
        gramsPerPiece: formData.gramsPerPiece ? parseFloat(formData.gramsPerPiece) : null,
        packageSize: formData.packageSize ? parseFloat(formData.packageSize) : null,
        isAlwaysOwned: formData.isAlwaysOwned,
      };

      // Add nutrition if any field is filled
      if (formData.calories || formData.protein || formData.fat || formData.carbohydrates) {
        payload.nutrition = {
          calories: parseFloat(formData.calories) || 0,
          protein: parseFloat(formData.protein) || 0,
          fat: parseFloat(formData.fat) || 0,
          carbohydrates: parseFloat(formData.carbohydrates) || 0,
        };
      } else {
        payload.nutrition = null;
      }

      // Add dietary info with allergens
      if (formData.allergens.length > 0) {
        payload.dietaryInfo = {
          allergens: formData.allergens,
        };
      } else {
        payload.dietaryInfo = null;
      }

      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update product");
      }

      toast.success("Продукт обновлён");
      router.push("/products");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось обновить продукт");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="mt-8 space-y-6">
              <div className="h-64 rounded bg-muted" />
              <div className="h-32 rounded bg-muted" />
              <div className="h-32 rounded bg-muted" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/products">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Редактирование продукта</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
                <CardDescription>Название и категория продукта</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Название *</Label>
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
                    <Label>Категория *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
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

            <Card>
              <CardHeader>
                <CardTitle>Единицы измерения</CardTitle>
                <CardDescription>Как измеряется продукт</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                        {units.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
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
                    <Label htmlFor="packageSize">Размер упаковки (г)</Label>
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
                      Используется для округления в списке покупок
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id="isAlwaysOwned"
                      checked={formData.isAlwaysOwned}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isAlwaysOwned: checked === true })
                      }
                    />
                    <Label htmlFor="isAlwaysOwned" className="cursor-pointer">
                      Всегда есть дома
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Пищевая ценность</CardTitle>
                <CardDescription>На 100 грамм продукта (опционально)</CardDescription>
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
                      value={formData.calories}
                      onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
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
                      value={formData.protein}
                      onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
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
                      value={formData.fat}
                      onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carbohydrates">Углеводы (г)</Label>
                    <Input
                      id="carbohydrates"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.carbohydrates}
                      onChange={(e) => setFormData({ ...formData, carbohydrates: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Содержит аллергены</CardTitle>
                <CardDescription>Отметьте, какие аллергены содержит этот продукт</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {allergenOptions.map((allergen) => (
                    <label key={allergen.value} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.allergens.includes(allergen.value)}
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
                      <span className="text-sm">{allergen.label}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/products">Отмена</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
