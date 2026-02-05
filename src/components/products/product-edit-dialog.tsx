"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

interface ProductEditDialogProps {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (product: Product) => void;
}

export function ProductEditDialog({
  productId,
  open,
  onOpenChange,
  onSaved,
}: ProductEditDialogProps) {
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
    if (!open || !productId) {
      setIsLoading(false);
      return;
    }

    async function fetchProduct() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) {
          toast.error("Продукт не найден");
          onOpenChange(false);
          return;
        }

        const product: Product = await res.json();
        const allergens = product.dietaryInfo?.allergens
          ? (JSON.parse(product.dietaryInfo.allergens) as string[])
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
        onOpenChange(false);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProduct();
  }, [productId, open, onOpenChange]);

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

      if (formData.allergens.length > 0) {
        payload.dietaryInfo = {
          allergens: formData.allergens,
        };
      } else {
        payload.dietaryInfo = null;
      }

      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update product");
      }

      const updated = await res.json();
      toast.success("Продукт обновлён");
      onSaved?.(updated);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось обновить продукт");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Редактирование продукта</DialogTitle>
          <DialogDescription>
            Измените параметры продукта для списка покупок
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs defaultValue="main" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="main">Основное</TabsTrigger>
                <TabsTrigger value="nutrition">Пищевая ценность</TabsTrigger>
                <TabsTrigger value="allergens">Аллергены</TabsTrigger>
              </TabsList>

              <TabsContent value="main" className="space-y-4 pt-4">
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
                        <SelectValue placeholder="Выберите" />
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
                      Для округления в списке покупок
                    </p>
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isAlwaysOwned"
                    checked={formData.isAlwaysOwned}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isAlwaysOwned: checked === true })
                    }
                  />
                  <Label htmlFor="isAlwaysOwned" className="cursor-pointer">
                    Всегда есть дома (автоматически отмечается как купленный)
                  </Label>
                </div>
              </TabsContent>

              <TabsContent value="nutrition" className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Пищевая ценность на 100 грамм продукта
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
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
              </TabsContent>

              <TabsContent value="allergens" className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Отметьте аллергены, которые содержит продукт
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
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
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  "Сохранить"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
