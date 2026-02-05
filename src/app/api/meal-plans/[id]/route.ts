import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

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

    const mealPlan = await db.mealPlan.findUnique({
      where: { id, userId: session.user.id },
      include: {
        recipes: {
          include: {
            recipe: {
              include: {
                ingredients: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
          orderBy: [{ date: "asc" }, { mealType: "asc" }],
        },
        shoppingList: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!mealPlan) {
      return NextResponse.json({ error: "Meal plan not found" }, { status: 404 });
    }

    return NextResponse.json(mealPlan);
  } catch (error) {
    console.error("Error fetching meal plan:", error);
    return NextResponse.json({ error: "Failed to fetch meal plan" }, { status: 500 });
  }
}

const addRecipeSchema = z.object({
  recipeId: z.string(),
  date: z.string().transform((s) => new Date(s)),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  servings: z.number().positive(),
});

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
    const data = addRecipeSchema.parse(body);

    // Verify ownership
    const mealPlan = await db.mealPlan.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!mealPlan) {
      return NextResponse.json({ error: "Meal plan not found" }, { status: 404 });
    }

    const mealPlanRecipe = await db.mealPlanRecipe.create({
      data: {
        mealPlanId: id,
        recipeId: data.recipeId,
        date: data.date,
        mealType: data.mealType,
        servings: data.servings,
      },
      include: {
        recipe: true,
      },
    });

    return NextResponse.json(mealPlanRecipe, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error adding recipe to meal plan:", error);
    return NextResponse.json({ error: "Failed to add recipe" }, { status: 500 });
  }
}

const updateMealPlanSchema = z.object({
  name: z.string().optional(),
  startDate: z.string().transform((s) => new Date(s)).optional(),
  endDate: z.string().transform((s) => new Date(s)).optional(),
});

export async function PATCH(
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
    const data = updateMealPlanSchema.parse(body);

    // Verify ownership
    const existingPlan = await db.mealPlan.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Meal plan not found" }, { status: 404 });
    }

    const mealPlan = await db.mealPlan.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.startDate && { startDate: data.startDate }),
        ...(data.endDate && { endDate: data.endDate }),
      },
      include: {
        recipes: {
          include: {
            recipe: true,
          },
          orderBy: [{ date: "asc" }, { mealType: "asc" }],
        },
      },
    });

    return NextResponse.json(mealPlan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error updating meal plan:", error);
    return NextResponse.json({ error: "Failed to update meal plan" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const mealPlan = await db.mealPlan.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!mealPlan) {
      return NextResponse.json({ error: "Meal plan not found" }, { status: 404 });
    }

    await db.mealPlan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meal plan:", error);
    return NextResponse.json({ error: "Failed to delete meal plan" }, { status: 500 });
  }
}
