import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

interface AggregatedItem {
  productId: string;
  productName: string;
  category: string;
  totalGrams: number;
  roundedGrams: number;      // Округлённое до кратности
  packagesNeeded: number | null; // Количество упаковок (если указана кратность)
  packageSize: number | null; // Размер упаковки
  gramsPerPiece: number | null; // Граммов в штуке (для unit="pcs")
  unit: string;
  isAlwaysOwned: boolean;    // Продукт всегда есть дома
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    console.log("GET shopping-list - session:", session?.user?.id);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    console.log("GET shopping-list - mealPlanId:", id);

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

    if (!mealPlan) {
      console.log("GET shopping-list - meal plan not found for user:", session.user.id);
      // Check if plan exists but belongs to different user
      const planExists = await db.mealPlan.findUnique({ where: { id }, select: { userId: true } });
      console.log("GET shopping-list - plan exists with userId:", planExists?.userId);
      return NextResponse.json({ error: "Meal plan not found" }, { status: 404 });
    }

    console.log("GET shopping-list - found plan with", mealPlan.recipes.length, "recipes");

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
          const productMeta = productMetaMap.get(ingredient.productId);
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
          });
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
        isChecked: item.isAlwaysOwned, // По умолчанию отмечены продукты, которые всегда есть дома
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
