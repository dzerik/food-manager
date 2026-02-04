import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

interface AggregatedItem {
  productId: string;
  productName: string;
  category: string;
  totalGrams: number;
  unit: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get meal plan with all recipes and their ingredients
    const mealPlan = await db.mealPlan.findUnique({
      where: { id, userId: session.user.id },
      include: {
        recipes: {
          include: {
            recipe: {
              include: {
                ingredients: {
                  where: { isOptional: false },
                  include: {
                    product: {
                      include: {
                        dietaryInfo: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!mealPlan) {
      return NextResponse.json({ error: "Meal plan not found" }, { status: 404 });
    }

    // Get user allergies
    const userAllergies = await db.userAllergy.findMany({
      where: { userId: session.user.id },
      select: { allergen: true },
    });
    const allergensSet = new Set(userAllergies.map((a) => a.allergen));

    // Aggregate ingredients
    const itemsMap = new Map<string, AggregatedItem>();

    for (const planRecipe of mealPlan.recipes) {
      const servingRatio = planRecipe.servings / planRecipe.recipe.servings;

      for (const ingredient of planRecipe.recipe.ingredients) {
        const gramsNeeded = ingredient.amountInGrams * servingRatio;
        const existing = itemsMap.get(ingredient.productId);

        if (existing) {
          existing.totalGrams += gramsNeeded;
        } else {
          itemsMap.set(ingredient.productId, {
            productId: ingredient.productId,
            productName: ingredient.product.name,
            category: ingredient.product.category,
            totalGrams: gramsNeeded,
            unit: ingredient.product.defaultUnit,
          });
        }
      }
    }

    // Convert to array and check for allergens
    const items = Array.from(itemsMap.values()).map((item) => {
      const product = mealPlan.recipes
        .flatMap((r) => r.recipe.ingredients)
        .find((i) => i.productId === item.productId)?.product;

      const productAllergens = product?.dietaryInfo?.allergens
        ? JSON.parse(product.dietaryInfo.allergens) as string[]
        : [];

      const hasAllergen = productAllergens.some((a) => allergensSet.has(a));

      return {
        ...item,
        isExcluded: hasAllergen,
        excludeReason: hasAllergen ? "Аллергия" : undefined,
        allergens: productAllergens,
      };
    });

    // Sort by category for easier shopping
    const categoryOrder = [
      "vegetables",
      "fruits",
      "meat",
      "fish",
      "seafood",
      "dairy",
      "grains",
      "legumes",
      "oils",
      "spices",
      "herbs",
      "sauces",
      "canned",
      "baking",
      "sweeteners",
      "nuts",
      "seeds",
      "dried_fruits",
    ];

    items.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.category);
      const bIndex = categoryOrder.indexOf(b.category);
      if (aIndex !== bIndex) {
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      }
      return a.productName.localeCompare(b.productName, "ru");
    });

    // Group by category
    const grouped = items.reduce((acc, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, typeof items>);

    return NextResponse.json({
      mealPlanId: id,
      mealPlanName: mealPlan.name,
      startDate: mealPlan.startDate,
      endDate: mealPlan.endDate,
      totalItems: items.length,
      excludedItems: items.filter((i) => i.isExcluded).length,
      items,
      groupedByCategory: grouped,
    });
  } catch (error) {
    console.error("Error generating shopping list:", error);
    return NextResponse.json({ error: "Failed to generate shopping list" }, { status: 500 });
  }
}
