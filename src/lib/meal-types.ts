import { Sun, Utensils, Moon, Coffee, LucideIcon } from "lucide-react";

export interface MealTypeConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const mealTypes: Record<string, MealTypeConfig> = {
  breakfast: {
    label: "Завтрак",
    icon: Sun,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  lunch: {
    label: "Обед",
    icon: Utensils,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  dinner: {
    label: "Ужин",
    icon: Moon,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  snack: {
    label: "Перекус",
    icon: Coffee,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-200 dark:border-green-800",
  },
};

export const mealTypeOrder = ["breakfast", "lunch", "dinner", "snack"];

export function getMealTypeConfig(mealType: string): MealTypeConfig {
  return mealTypes[mealType] || mealTypes.lunch;
}
