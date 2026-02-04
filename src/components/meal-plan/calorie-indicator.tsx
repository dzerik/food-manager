"use client";

import { cn } from "@/lib/utils";

interface CalorieIndicatorProps {
  current: number;
  target: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function CalorieIndicator({
  current,
  target,
  showLabel = true,
  size = "md",
}: CalorieIndicatorProps) {
  const percentage = target > 0 ? (current / target) * 100 : 0;

  // Color based on percentage
  const getColor = () => {
    if (percentage <= 100) return "bg-green-500";
    if (percentage <= 110) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getTextColor = () => {
    if (percentage <= 100) return "text-green-600 dark:text-green-400";
    if (percentage <= 110) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className={cn("flex justify-between", textSizeClasses[size])}>
          <span className="text-muted-foreground">Калории</span>
          <span className={cn("font-medium", getTextColor())}>
            {current} / {target} ккал
          </span>
        </div>
      )}
      <div className={cn("w-full overflow-hidden rounded-full bg-muted", sizeClasses[size])}>
        <div
          className={cn("h-full transition-all duration-300", getColor())}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {percentage > 100 && (
        <p className={cn("text-right", textSizeClasses[size], getTextColor())}>
          +{Math.round(current - target)} ккал
        </p>
      )}
    </div>
  );
}

interface WeeklyCalorieStatsProps {
  dailyStats: Array<{
    date: string;
    calories: number;
  }>;
  target: number;
}

export function WeeklyCalorieStats({ dailyStats, target }: WeeklyCalorieStatsProps) {
  const totalCalories = dailyStats.reduce((sum, day) => sum + day.calories, 0);
  const weeklyTarget = target * dailyStats.length;
  const avgCalories = dailyStats.length > 0 ? Math.round(totalCalories / dailyStats.length) : 0;

  const percentage = weeklyTarget > 0 ? (totalCalories / weeklyTarget) * 100 : 0;

  const getStatusColor = () => {
    if (percentage <= 100) return "text-green-600 dark:text-green-400";
    if (percentage <= 110) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 font-semibold">Статистика недели</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Всего калорий</p>
          <p className={cn("text-2xl font-bold", getStatusColor())}>
            {totalCalories.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            из {weeklyTarget.toLocaleString()} ккал
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Среднее в день</p>
          <p className="text-2xl font-bold">{avgCalories}</p>
          <p className="text-xs text-muted-foreground">
            норма: {target} ккал
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Выполнение</p>
          <p className={cn("text-2xl font-bold", getStatusColor())}>
            {Math.round(percentage)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {percentage <= 100 ? "В норме" : percentage <= 110 ? "Чуть выше" : "Превышение"}
          </p>
        </div>
      </div>
    </div>
  );
}
