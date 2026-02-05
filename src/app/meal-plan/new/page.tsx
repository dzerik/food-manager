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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { addDays, startOfWeek, format, differenceInDays } from "date-fns";
import { ru } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

export default function NewMealPlanPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const today = new Date();
  const defaultStart = startOfWeek(today, { weekStartsOn: 1 });
  const defaultEnd = addDays(defaultStart, 6);

  const [name, setName] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: defaultStart,
    to: defaultEnd,
  });

  const daysCount = dateRange.from && dateRange.to
    ? differenceInDays(dateRange.to, dateRange.from) + 1
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!dateRange.from || !dateRange.to) {
      toast.error("Выберите период плана");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/meal-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
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

  // Быстрый выбор периодов
  const quickSelections = [
    { label: "Эта неделя", days: 7, start: startOfWeek(today, { weekStartsOn: 1 }) },
    { label: "Следующая неделя", days: 7, start: startOfWeek(addDays(today, 7), { weekStartsOn: 1 }) },
    { label: "2 недели", days: 14, start: startOfWeek(today, { weekStartsOn: 1 }) },
    { label: "Месяц", days: 30, start: today },
  ];

  function handleQuickSelect(start: Date, days: number) {
    setDateRange({
      from: start,
      to: addDays(start, days - 1),
    });
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

        <Card className="mx-auto max-w-2xl">
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

              <div className="space-y-3">
                <Label>Период</Label>

                {/* Быстрый выбор */}
                <div className="flex flex-wrap gap-2">
                  {quickSelections.map((qs) => (
                    <Button
                      key={qs.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickSelect(qs.start, qs.days)}
                      className={cn(
                        dateRange.from?.getTime() === qs.start.getTime() &&
                        dateRange.to?.getTime() === addDays(qs.start, qs.days - 1).getTime()
                          ? "border-primary bg-primary/10"
                          : ""
                      )}
                    >
                      {qs.label}
                    </Button>
                  ))}
                </div>

                {/* Date Range Picker */}
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "d MMM", { locale: ru })} -{" "}
                            {format(dateRange.to, "d MMM yyyy", { locale: ru })}
                            <span className="ml-auto text-muted-foreground">
                              {daysCount} {daysCount === 1 ? "день" : daysCount < 5 ? "дня" : "дней"}
                            </span>
                          </>
                        ) : (
                          format(dateRange.from, "d MMMM yyyy", { locale: ru })
                        )
                      ) : (
                        "Выберите даты"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    {/* Mobile: 1 month */}
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => {
                        setDateRange(range || { from: undefined, to: undefined });
                        if (range?.from && range?.to) {
                          setIsCalendarOpen(false);
                        }
                      }}
                      numberOfMonths={1}
                      locale={ru}
                      weekStartsOn={1}
                      disabled={{ before: new Date(2020, 0, 1) }}
                      className="sm:hidden"
                    />
                    {/* Desktop: 2 months */}
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => {
                        setDateRange(range || { from: undefined, to: undefined });
                        if (range?.from && range?.to) {
                          setIsCalendarOpen(false);
                        }
                      }}
                      numberOfMonths={2}
                      locale={ru}
                      weekStartsOn={1}
                      disabled={{ before: new Date(2020, 0, 1) }}
                      className="hidden sm:block"
                    />
                  </PopoverContent>
                </Popover>

                {/* Информация о выбранном периоде */}
                {dateRange.from && dateRange.to && (
                  <div className="rounded-md border bg-muted/50 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Начало:</span>
                      <span className="font-medium">
                        {format(dateRange.from, "EEEE, d MMMM", { locale: ru })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-muted-foreground">Конец:</span>
                      <span className="font-medium">
                        {format(dateRange.to, "EEEE, d MMMM", { locale: ru })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      <span className="text-muted-foreground">Всего дней:</span>
                      <span className="font-medium">{daysCount}</span>
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !dateRange.from || !dateRange.to}
              >
                {isLoading ? "Создание..." : "Создать план"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
