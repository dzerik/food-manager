import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateRecipeSchema = z.object({
  servings: z.number().positive().optional(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  date: z.string().transform((s) => new Date(s)).optional(),
});

// PUT - обновление рецепта в плане (порции, тип приёма пищи, дата)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recipeId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, recipeId } = await params;
    const body = await request.json();
    const data = updateRecipeSchema.parse(body);

    // Verify ownership through meal plan
    const mealPlanRecipe = await db.mealPlanRecipe.findUnique({
      where: { id: recipeId },
      include: {
        mealPlan: {
          select: { userId: true },
        },
      },
    });

    if (!mealPlanRecipe || mealPlanRecipe.mealPlan.userId !== session.user.id) {
      return NextResponse.json({ error: "Recipe not found in meal plan" }, { status: 404 });
    }

    if (mealPlanRecipe.mealPlanId !== id) {
      return NextResponse.json({ error: "Recipe does not belong to this meal plan" }, { status: 400 });
    }

    const updated = await db.mealPlanRecipe.update({
      where: { id: recipeId },
      data: {
        ...(data.servings && { servings: data.servings }),
        ...(data.mealType && { mealType: data.mealType }),
        ...(data.date && { date: data.date }),
      },
      include: {
        recipe: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error updating meal plan recipe:", error);
    return NextResponse.json({ error: "Failed to update recipe" }, { status: 500 });
  }
}

// DELETE - удаление рецепта из плана
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recipeId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, recipeId } = await params;

    // Verify ownership through meal plan
    const mealPlanRecipe = await db.mealPlanRecipe.findUnique({
      where: { id: recipeId },
      include: {
        mealPlan: {
          select: { userId: true },
        },
      },
    });

    if (!mealPlanRecipe || mealPlanRecipe.mealPlan.userId !== session.user.id) {
      return NextResponse.json({ error: "Recipe not found in meal plan" }, { status: 404 });
    }

    if (mealPlanRecipe.mealPlanId !== id) {
      return NextResponse.json({ error: "Recipe does not belong to this meal plan" }, { status: 400 });
    }

    await db.mealPlanRecipe.delete({
      where: { id: recipeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meal plan recipe:", error);
    return NextResponse.json({ error: "Failed to delete recipe" }, { status: 500 });
  }
}
