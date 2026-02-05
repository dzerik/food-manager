import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const requestSchema = z.object({
  mealPlanIds: z.array(z.string()).min(1),
});

interface AggregatedItem {
  productId: string;
  productName: string;
  category: string;
  totalGrams: number;
  roundedGrams: number;
  packagesNeeded: number | null;
  packageSize: number | null;
  gramsPerPiece: number | null;
  unit: string;
  isAlwaysOwned: boolean;
  isExcluded: boolean;
  excludeReason?: string;
  allergens: string[];
  fromPlans: string[]; // IDs планов, где используется этот продукт
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { mealPlanIds } = requestSchema.parse(body);

    // Get all selected meal plans with their recipes and ingredients
    const mealPlans = await db.mealPlan.findMany({
      where: {
        id: { in: mealPlanIds },
        userId: session.user.id,
      },
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

    if (mealPlans.length === 0) {
      return NextResponse.json({ error: "No meal plans found" }, { status: 404 });
    }

    // Get all products with packageSize, isAlwaysOwned, gramsPerPiece
    const products = await db.product.findMany({
      select: {
        id: true,
        packageSize: true,
        isAlwaysOwned: true,
        gramsPerPiece: true,
      },
    });
    const productMetaMap = new Map(products.map((p) => [p.id, p]));

    // Get user allergies
    const userAllergies = await db.userAllergy.findMany({
      where: { userId: session.user.id },
      select: { allergen: true },
    });
    const allergensSet = new Set(userAllergies.map((a) => a.allergen));

    // Aggregate ingredients from all plans
    const itemsMap = new Map<string, AggregatedItem>();

    for (const mealPlan of mealPlans) {
      for (const planRecipe of mealPlan.recipes) {
        const servingRatio = planRecipe.servings / planRecipe.recipe.servings;

        for (const ingredient of planRecipe.recipe.ingredients) {
          const gramsNeeded = ingredient.amountInGrams * servingRatio;
          const existing = itemsMap.get(ingredient.productId);

          if (existing) {
            existing.totalGrams += gramsNeeded;
            if (!existing.fromPlans.includes(mealPlan.id)) {
              existing.fromPlans.push(mealPlan.id);
            }
          } else {
            const productMeta = productMetaMap.get(ingredient.productId);
            const productAllergens = ingredient.product.dietaryInfo?.allergens
              ? (JSON.parse(ingredient.product.dietaryInfo.allergens) as string[])
              : [];
            const hasAllergen = productAllergens.some((a) => allergensSet.has(a));

            itemsMap.set(ingredient.productId, {
              productId: ingredient.productId,
              productName: ingredient.product.name,
              category: ingredient.product.category,
              totalGrams: gramsNeeded,
              roundedGrams: gramsNeeded,
              packagesNeeded: null,
              packageSize: productMeta?.packageSize || null,
              gramsPerPiece: productMeta?.gramsPerPiece || null,
              unit: ingredient.product.defaultUnit,
              isAlwaysOwned: productMeta?.isAlwaysOwned || false,
              isExcluded: hasAllergen,
              excludeReason: hasAllergen ? "Аллергия" : undefined,
              allergens: productAllergens,
              fromPlans: [mealPlan.id],
            });
          }
        }
      }
    }

    // Apply rounding to package size
    for (const item of itemsMap.values()) {
      if (item.packageSize && item.packageSize > 0) {
        const packages = Math.ceil(item.totalGrams / item.packageSize);
        item.roundedGrams = packages * item.packageSize;
        item.packagesNeeded = packages;
      } else {
        item.roundedGrams = Math.ceil(item.totalGrams);
        item.packagesNeeded = null;
      }
    }

    const items = Array.from(itemsMap.values());

    // Sort by category
    const categoryOrder = [
      "vegetables", "fruits", "meat", "fish", "seafood", "dairy",
      "grains", "legumes", "oils", "spices", "herbs", "sauces",
      "canned", "baking", "sweeteners", "nuts", "seeds", "dried_fruits",
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
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, AggregatedItem[]>);

    // Calculate date range across all plans
    const allDates = mealPlans.flatMap((p) => [
      new Date(p.startDate),
      new Date(p.endDate),
    ]);
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    return NextResponse.json({
      mealPlanIds,
      mealPlans: mealPlans.map((p) => ({
        id: p.id,
        name: p.name,
        startDate: p.startDate,
        endDate: p.endDate,
      })),
      startDate: minDate,
      endDate: maxDate,
      totalItems: items.length,
      excludedItems: items.filter((i) => i.isExcluded).length,
      items,
      groupedByCategory: grouped,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error generating consolidated shopping list:", error);
    return NextResponse.json({ error: "Failed to generate shopping list" }, { status: 500 });
  }
}
