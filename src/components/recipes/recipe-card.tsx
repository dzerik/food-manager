import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Flame, ChefHat, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getDifficultyIndicator,
  getTimeIndicator,
  getCalorieIndicator,
  formatTime,
} from "@/lib/recipe-indicators";

interface RecipeCardProps {
  recipe: {
    id: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    totalTime: number;
    servings: number;
    difficultyLevel: number;
    caloriesPerServing?: number | null;
    mealTypes: string[];
    cuisines: string[];
    isVegan: boolean;
    isVegetarian: boolean;
  };
}

const cuisineLabels: Record<string, string> = {
  russian: "Русская",
  italian: "Итальянская",
  asian: "Азиатская",
  french: "Французская",
  mexican: "Мексиканская",
  indian: "Индийская",
  mediterranean: "Средиземноморская",
  japanese: "Японская",
  chinese: "Китайская",
  thai: "Тайская",
  middle_eastern: "Ближневосточная",
  american: "Американская",
  other: "Другая",
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  const diffIndicator = getDifficultyIndicator(recipe.difficultyLevel);
  const timeIndicator = getTimeIndicator(recipe.totalTime);
  const calorieIndicator = recipe.caloriesPerServing
    ? getCalorieIndicator(recipe.caloriesPerServing)
    : null;

  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02]">
        <CardHeader className="p-0">
          {recipe.imageUrl ? (
            <div className="relative">
              <img
                src={recipe.imageUrl}
                alt={recipe.name}
                className="h-48 w-full rounded-t-lg object-cover"
              />
              {/* Overlay badges */}
              <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                {recipe.isVegan && (
                  <Badge className="bg-green-600 text-white text-xs">
                    Веган
                  </Badge>
                )}
                {recipe.isVegetarian && !recipe.isVegan && (
                  <Badge className="bg-emerald-600 text-white text-xs">
                    Вегетарианское
                  </Badge>
                )}
              </div>
              {/* Difficulty badge */}
              <div className="absolute top-2 right-2">
                <Badge
                  className={cn(
                    "text-xs border",
                    diffIndicator.bgColor,
                    diffIndicator.color,
                    diffIndicator.borderColor
                  )}
                >
                  <Gauge className="h-3 w-3 mr-1" />
                  {diffIndicator.label}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="relative flex h-48 items-center justify-center rounded-t-lg bg-gradient-to-br from-muted to-muted/50">
              <ChefHat className="h-16 w-16 text-muted-foreground/50" />
              {/* Overlay badges for no-image */}
              <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                {recipe.isVegan && (
                  <Badge className="bg-green-600 text-white text-xs">
                    Веган
                  </Badge>
                )}
                {recipe.isVegetarian && !recipe.isVegan && (
                  <Badge className="bg-emerald-600 text-white text-xs">
                    Вегетарианское
                  </Badge>
                )}
              </div>
              {/* Difficulty badge */}
              <div className="absolute top-2 right-2">
                <Badge
                  className={cn(
                    "text-xs border",
                    diffIndicator.bgColor,
                    diffIndicator.color,
                    diffIndicator.borderColor
                  )}
                >
                  <Gauge className="h-3 w-3 mr-1" />
                  {diffIndicator.label}
                </Badge>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="font-semibold leading-tight line-clamp-2">{recipe.name}</h3>
          {recipe.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {recipe.description}
            </p>
          )}
          {recipe.cuisines.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {recipe.cuisines.slice(0, 2).map((cuisine) => (
                <Badge key={cuisine} variant="outline" className="text-xs">
                  {cuisineLabels[cuisine] || cuisine}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap items-center gap-2 p-4 pt-0">
          {/* Time indicator */}
          <div
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
              timeIndicator.bgColor,
              timeIndicator.color
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{formatTime(recipe.totalTime)}</span>
          </div>

          {/* Servings */}
          <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{recipe.servings} порц.</span>
          </div>

          {/* Calories indicator */}
          {calorieIndicator && (
            <div
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
                calorieIndicator.bgColor,
                calorieIndicator.color
              )}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>{recipe.caloriesPerServing} ккал</span>
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
