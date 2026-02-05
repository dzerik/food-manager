"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Pencil, Trash2, Package, Flame, Droplet, Wheat as WheatIcon, Zap } from "lucide-react";
import { toast } from "sonner";
import { getCategoryConfig, productCategories } from "@/lib/product-categories";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  defaultUnit: string;
  nutrition?: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
  };
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function ProductsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (category && category !== "all") params.set("category", category);
        params.set("page", page.toString());
        params.set("limit", "20");

        const res = await fetch(`/api/products?${params}`);
        if (res.ok) {
          const data: ProductsResponse = await res.json();
          setProducts(data.products);
          setTotalPages(data.pagination.pages);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        toast.error("Не удалось загрузить продукты");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, [search, category, page]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Удалить продукт "${name}"?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
        toast.success("Продукт удалён");
      } else {
        throw new Error("Failed to delete");
      }
    } catch {
      toast.error("Не удалось удалить продукт");
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="mt-8 h-96 rounded bg-muted" />
          </div>
        </main>
      </div>
    );
  }

  // Build categories list with icons
  const categoriesWithIcons = [
    { value: "all", label: "Все категории", icon: Package },
    ...Object.entries(productCategories).map(([value, config]) => ({
      value,
      label: config.label,
      icon: config.icon,
    })),
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header with gradient */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold">Продукты</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Управление каталогом продуктов
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="sm:size-default">
            <Link href="/products/new">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Добавить продукт</span>
            </Link>
          </Button>
        </div>

        {/* Filters with improved styling */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск продуктов..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
              <Select
                value={category}
                onValueChange={(value) => {
                  setCategory(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoriesWithIcons.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {cat.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Продукты не найдены</h3>
              <p className="mt-2 text-muted-foreground">
                Добавьте первый продукт в каталог
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить продукт
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile: Card view */}
            <div className="space-y-3 sm:hidden">
              {products.map((product) => {
                const catConfig = getCategoryConfig(product.category);
                const CatIcon = catConfig.icon;
                return (
                  <Card key={product.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex">
                        {/* Category color strip */}
                        <div className={cn("w-1.5 shrink-0", catConfig.bgColor)} />
                        <div className="flex-1 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <CatIcon className={cn("h-4 w-4 shrink-0", catConfig.color)} />
                                <p className="font-medium truncate">{product.name}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge variant="secondary" className={cn("text-xs", catConfig.bgColor, catConfig.color)}>
                                  {catConfig.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{product.defaultUnit}</span>
                              </div>
                              {product.nutrition && (
                                <div className="flex items-center gap-3 mt-2 text-xs">
                                  <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                    <Flame className="h-3 w-3" />
                                    {product.nutrition.calories}
                                  </span>
                                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                    <Zap className="h-3 w-3" />
                                    Б{product.nutrition.protein}
                                  </span>
                                  <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                    <Droplet className="h-3 w-3" />
                                    Ж{product.nutrition.fat}
                                  </span>
                                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <WheatIcon className="h-3 w-3" />
                                    У{product.nutrition.carbohydrates}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                <Link href={`/products/${product.id}/edit`}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(product.id, product.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Desktop: Enhanced Table view */}
            <Card className="hidden sm:block overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Название</TableHead>
                    <TableHead className="font-semibold">Категория</TableHead>
                    <TableHead className="font-semibold">Единица</TableHead>
                    <TableHead className="text-right font-semibold">
                      <span className="flex items-center justify-end gap-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        Ккал/100г
                      </span>
                    </TableHead>
                    <TableHead className="text-right font-semibold">БЖУ</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, index) => {
                    const catConfig = getCategoryConfig(product.category);
                    const CatIcon = catConfig.icon;
                    return (
                      <TableRow
                        key={product.id}
                        className={cn(
                          "transition-colors",
                          index % 2 === 0 ? "bg-background" : "bg-muted/20"
                        )}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={cn("flex h-8 w-8 items-center justify-center rounded-md", catConfig.bgColor)}>
                              <CatIcon className={cn("h-4 w-4", catConfig.color)} />
                            </div>
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn("font-normal", catConfig.bgColor, catConfig.color)}
                          >
                            {catConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="rounded bg-muted px-2 py-1 text-sm">
                            {product.defaultUnit}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {product.nutrition ? (
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              {product.nutrition.calories}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.nutrition ? (
                            <div className="flex items-center justify-end gap-2 text-sm">
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                {product.nutrition.protein}
                              </span>
                              <span className="text-muted-foreground">/</span>
                              <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                                {product.nutrition.fat}
                              </span>
                              <span className="text-muted-foreground">/</span>
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                {product.nutrition.carbohydrates}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                              asChild
                            >
                              <Link href={`/products/${product.id}/edit`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                              onClick={() => handleDelete(product.id, product.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>

            {totalPages > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Назад
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Страница {page} из {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Вперёд
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
