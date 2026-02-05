import {
  Carrot,
  Apple,
  Beef,
  Fish,
  Milk,
  Wheat,
  Croissant,
  Flame,
  Droplets,
  Soup,
  Coffee,
  Package,
  LucideIcon,
} from "lucide-react";

export interface CategoryConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const productCategories: Record<string, CategoryConfig> = {
  vegetables: {
    label: "Овощи",
    icon: Carrot,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  fruits: {
    label: "Фрукты",
    icon: Apple,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  meat: {
    label: "Мясо",
    icon: Beef,
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  fish: {
    label: "Рыба",
    icon: Fish,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  dairy: {
    label: "Молочные",
    icon: Milk,
    color: "text-sky-600 dark:text-sky-400",
    bgColor: "bg-sky-100 dark:bg-sky-900/30",
  },
  grains: {
    label: "Крупы",
    icon: Wheat,
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  bakery: {
    label: "Выпечка",
    icon: Croissant,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  spices: {
    label: "Специи",
    icon: Flame,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
  },
  oils: {
    label: "Масла",
    icon: Droplets,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  sauces: {
    label: "Соусы",
    icon: Soup,
    color: "text-red-500 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  beverages: {
    label: "Напитки",
    icon: Coffee,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  other: {
    label: "Другое",
    icon: Package,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-900/30",
  },
};

export function getCategoryConfig(category: string): CategoryConfig {
  return productCategories[category] || productCategories.other;
}
