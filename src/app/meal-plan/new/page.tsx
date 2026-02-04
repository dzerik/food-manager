"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { addDays, startOfWeek, format } from "date-fns";
import { ru } from "date-fns/locale";

export default function NewMealPlanPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const today = new Date();
  const defaultStart = startOfWeek(today, { weekStartsOn: 1 });
  const defaultEnd = addDays(defaultStart, 6);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<Date>(defaultStart);
  const [endDate, setEndDate] = useState<Date>(defaultEnd);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/meal-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create meal plan");
      }

      const data = await res.json();
      toast.success("План создан!");
      router.push(`/meal-plan/${data.id}`);
    } catch {
      toast.error("Не удалось создать план");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" className="mb-4" asChild>
          <Link href="/meal-plan">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Link>
        </Button>

        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle>Новый план питания</CardTitle>
            <CardDescription>
              Выберите период и начните добавлять рецепты
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Название (необязательно)</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Неделя здорового питания"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label>Период</Label>
                <div className="rounded-md border p-4 text-center">
                  <div className="text-lg font-medium">
                    {format(startDate, "d MMMM", { locale: ru })} -{" "}
                    {format(endDate, "d MMMM yyyy", { locale: ru })}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} дней
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Создание..." : "Создать план"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
