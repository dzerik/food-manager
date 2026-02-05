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

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

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
      ...(limit && { take: limit }),
    });

    return NextResponse.json({ mealPlans });
  } catch (error) {
    console.error("Error fetching meal plans:", error);
    return NextResponse.json({ error: "Failed to fetch meal plans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    console.log("POST /api/meal-plans - session:", session?.user?.id ? "authenticated" : "no session");

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("POST /api/meal-plans - body:", body);

    const data = createMealPlanSchema.parse(body);
    console.log("POST /api/meal-plans - parsed data:", data);

    // Check if user exists
    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      console.error("POST /api/meal-plans - user not found:", session.user.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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

    console.log("POST /api/meal-plans - created:", mealPlan.id);
    return NextResponse.json(mealPlan, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("POST /api/meal-plans - validation error:", error.issues);
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("POST /api/meal-plans - error:", error);
    return NextResponse.json({ error: "Failed to create meal plan" }, { status: 500 });
  }
}
