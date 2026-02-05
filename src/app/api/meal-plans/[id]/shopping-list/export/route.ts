import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

interface ShoppingItem {
  productName: string;
  category: string;
  totalGrams: number;
  roundedGrams: number;
  packagesNeeded: number | null;
  unit: string;
  isExcluded: boolean;
  isAlwaysOwned: boolean;
}

const categoryLabels: Record<string, string> = {
  vegetables: "Овощи",
  fruits: "Фрукты",
  meat: "Мясо",
  fish: "Рыба",
  seafood: "Морепродукты",
  dairy: "Молочные продукты",
  grains: "Крупы и злаки",
  legumes: "Бобовые",
  oils: "Масла",
  spices: "Специи",
  herbs: "Зелень",
  sauces: "Соусы",
  canned: "Консервы",
  baking: "Для выпечки",
  sweeteners: "Сладкое",
  nuts: "Орехи",
  seeds: "Семена",
  dried_fruits: "Сухофрукты",
  condiments: "Приправы",
  liquids: "Жидкости",
  dairy_alternatives: "Растительные альтернативы",
  protein: "Белок",
  sweets: "Сладости",
};

function formatAmount(grams: number, unit: string): string {
  if (unit === "ml") {
    return grams >= 1000 ? `${(grams / 1000).toFixed(1)} л` : `${Math.round(grams)} мл`;
  }
  return grams >= 1000 ? `${(grams / 1000).toFixed(1)} кг` : `${Math.round(grams)} г`;
}

// GET - экспорт списка покупок
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
    const format = request.nextUrl.searchParams.get("format") || "txt";

    // Get shopping list data using internal API logic
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

    // Get product metadata
    const products = await db.product.findMany({
      select: { id: true, packageSize: true, isAlwaysOwned: true },
    });
    const productMetaMap = new Map(products.map((p) => [p.id, p]));

    // Get user allergies
    const userAllergies = await db.userAllergy.findMany({
      where: { userId: session.user.id },
      select: { allergen: true },
    });
    const allergensSet = new Set(userAllergies.map((a) => a.allergen));

    // Aggregate ingredients
    const itemsMap = new Map<string, ShoppingItem & { productId: string }>();

    for (const planRecipe of mealPlan.recipes) {
      const servingRatio = planRecipe.servings / planRecipe.recipe.servings;

      for (const ingredient of planRecipe.recipe.ingredients) {
        const gramsNeeded = ingredient.amountInGrams * servingRatio;
        const existing = itemsMap.get(ingredient.productId);

        if (existing) {
          existing.totalGrams += gramsNeeded;
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
            unit: ingredient.product.defaultUnit,
            isAlwaysOwned: productMeta?.isAlwaysOwned || false,
            isExcluded: hasAllergen,
          });
        }
      }
    }

    // Apply rounding
    for (const item of itemsMap.values()) {
      const productMeta = productMetaMap.get(item.productId);
      if (productMeta?.packageSize && productMeta.packageSize > 0) {
        const packages = Math.ceil(item.totalGrams / productMeta.packageSize);
        item.roundedGrams = packages * productMeta.packageSize;
        item.packagesNeeded = packages;
      } else {
        item.roundedGrams = Math.ceil(item.totalGrams);
      }
    }

    const items = Array.from(itemsMap.values()).filter((i) => !i.isExcluded && !i.isAlwaysOwned);

    // Group by category
    const grouped = items.reduce((acc, item) => {
      const category = item.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, typeof items>);

    // Format output based on requested format
    if (format === "json") {
      return NextResponse.json({
        mealPlanName: mealPlan.name,
        startDate: mealPlan.startDate,
        endDate: mealPlan.endDate,
        items: items.map(({ productId, ...rest }) => rest),
        groupedByCategory: Object.fromEntries(
          Object.entries(grouped).map(([cat, items]) => [
            cat,
            items.map(({ productId, ...rest }) => rest),
          ])
        ),
      });
    }

    if (format === "csv") {
      const csvLines = [
        "Продукт,Категория,Количество,Единица,Упаковок",
        ...items.map((item) =>
          `"${item.productName}","${categoryLabels[item.category] || item.category}",${item.roundedGrams},${item.unit},${item.packagesNeeded || ""}`
        ),
      ];
      const csv = csvLines.join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="shopping-list.csv"`,
        },
      });
    }

    // Default: plain text for messaging apps
    const lines: string[] = [];
    lines.push(`Список покупок: ${mealPlan.name || "План питания"}`);
    lines.push("");

    for (const [category, categoryItems] of Object.entries(grouped)) {
      lines.push(`${categoryLabels[category] || category}:`);
      for (const item of categoryItems) {
        const amount = formatAmount(item.roundedGrams, item.unit);
        const packageInfo = item.packagesNeeded ? ` (${item.packagesNeeded} уп.)` : "";
        lines.push(`  - ${item.productName}: ${amount}${packageInfo}`);
      }
      lines.push("");
    }

    const text = lines.join("\n");

    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error exporting shopping list:", error);
    return NextResponse.json({ error: "Failed to export shopping list" }, { status: 500 });
  }
}
