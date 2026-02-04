import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createMealPlanSchema = z.object({
  name: z.string().optional(),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)),
  recipes: z.array(z.object({
    recipeId: z.string(),
    date: z.string().transform((s) => new Date(s)),
    mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
    servings: z.number().positive(),
  })).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mealPlans = await db.mealPlan.findMany({
      where: { userId: session.user.id },
      include: {
        recipes: {
          include: {
            recipe: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                totalTime: true,
                caloriesPerServing: true,
              },
            },
          },
        },
        _count: {
          select: { recipes: true },
        },
      },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json(mealPlans);
  } catch (error) {
    console.error("Error fetching meal plans:", error);
    return NextResponse.json({ error: "Failed to fetch meal plans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createMealPlanSchema.parse(body);

    const mealPlan = await db.mealPlan.create({
      data: {
        userId: session.user.id,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        recipes: data.recipes ? {
          create: data.recipes.map((r) => ({
            recipeId: r.recipeId,
            date: r.date,
            mealType: r.mealType,
            servings: r.servings,
          })),
        } : undefined,
      },
      include: {
        recipes: {
          include: {
            recipe: true,
          },
        },
      },
    });

    return NextResponse.json(mealPlan, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating meal plan:", error);
    return NextResponse.json({ error: "Failed to create meal plan" }, { status: 500 });
  }
}
