import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Flame, ChefHat } from "lucide-react";

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

const difficultyLabels = ["", "Очень легко", "Легко", "Средне", "Сложно", "Очень сложно"];

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader className="p-0">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="h-48 w-full rounded-t-lg object-cover"
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-t-lg bg-muted">
              <ChefHat className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="font-semibold leading-tight">{recipe.name}</h3>
          {recipe.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {recipe.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-1">
            {recipe.isVegan && (
              <Badge variant="secondary" className="text-xs">
                Веган
              </Badge>
            )}
            {recipe.isVegetarian && !recipe.isVegan && (
              <Badge variant="secondary" className="text-xs">
                Вегетарианское
              </Badge>
            )}
            {recipe.cuisines.slice(0, 2).map((cuisine) => (
              <Badge key={cuisine} variant="outline" className="text-xs">
                {cuisine}
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex items-center gap-4 p-4 pt-0 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{recipe.totalTime} мин</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{recipe.servings}</span>
          </div>
          {recipe.caloriesPerServing && (
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4" />
              <span>{recipe.caloriesPerServing} ккал</span>
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
