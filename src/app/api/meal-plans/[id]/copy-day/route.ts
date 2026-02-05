import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const copyDaySchema = z.object({
  sourceDate: z.string().transform((s) => new Date(s)),
  targetDates: z.array(z.string().transform((s) => new Date(s))).min(1),
  replaceExisting: z.boolean().default(false),
});

// POST - копирование плана на день в другие дни
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { sourceDate, targetDates, replaceExisting } = copyDaySchema.parse(body);

    // Verify ownership
    const mealPlan = await db.mealPlan.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!mealPlan) {
      return NextResponse.json({ error: "Meal plan not found" }, { status: 404 });
    }

    // Normalize source date to start of day
    const sourceDayStart = new Date(sourceDate);
    sourceDayStart.setHours(0, 0, 0, 0);
    const sourceDayEnd = new Date(sourceDayStart);
    sourceDayEnd.setDate(sourceDayEnd.getDate() + 1);

    // Get recipes for source day
    const sourceRecipes = await db.mealPlanRecipe.findMany({
      where: {
        mealPlanId: id,
        date: {
          gte: sourceDayStart,
          lt: sourceDayEnd,
        },
      },
    });

    if (sourceRecipes.length === 0) {
      return NextResponse.json({ error: "No recipes found for source date" }, { status: 400 });
    }

    const createdRecipes: Array<{ targetDate: Date; count: number }> = [];

    for (const targetDate of targetDates) {
      // Normalize target date to start of day
      const targetDayStart = new Date(targetDate);
      targetDayStart.setHours(0, 0, 0, 0);
      const targetDayEnd = new Date(targetDayStart);
      targetDayEnd.setDate(targetDayEnd.getDate() + 1);

      // Optionally delete existing recipes for target day
      if (replaceExisting) {
        await db.mealPlanRecipe.deleteMany({
          where: {
            mealPlanId: id,
            date: {
              gte: targetDayStart,
              lt: targetDayEnd,
            },
          },
        });
      }

      // Create copies of recipes for target day
      const recipesToCreate = sourceRecipes.map((recipe) => ({
        mealPlanId: id,
        recipeId: recipe.recipeId,
        date: targetDayStart,
        mealType: recipe.mealType,
        servings: recipe.servings,
      }));

      await db.mealPlanRecipe.createMany({
        data: recipesToCreate,
      });

      createdRecipes.push({
        targetDate: targetDayStart,
        count: recipesToCreate.length,
      });
    }

    return NextResponse.json({
      success: true,
      copied: {
        sourceDate: sourceDayStart,
        sourceRecipesCount: sourceRecipes.length,
        targets: createdRecipes,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error copying day:", error);
    return NextResponse.json({ error: "Failed to copy day" }, { status: 500 });
  }
}
