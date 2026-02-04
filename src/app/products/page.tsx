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
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

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

const categories = [
  { value: "all", label: "Все категории" },
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

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Продукты</h1>
          <Button asChild>
            <Link href="/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Добавить продукт
            </Link>
          </Button>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
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
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
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

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">Продукты не найдены</p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/products/new">Добавить первый продукт</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Единица</TableHead>
                    <TableHead className="text-right">Ккал/100г</TableHead>
                    <TableHead className="text-right">Б/Ж/У</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categories.find((c) => c.value === product.category)?.label ||
                            product.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.defaultUnit}</TableCell>
                      <TableCell className="text-right">
                        {product.nutrition?.calories ?? "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {product.nutrition
                          ? `${product.nutrition.protein}/${product.nutrition.fat}/${product.nutrition.carbohydrates}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link href={`/products/${product.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id, product.name)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

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
                  {page} / {totalPages}
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
