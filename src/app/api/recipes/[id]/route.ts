import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const recipe = await db.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: {
            product: {
              include: {
                nutrition: true,
                dietaryInfo: true,
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
        steps: {
          orderBy: { stepNumber: "asc" },
        },
      },
    });

    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    // Parse JSON fields
    const parsedRecipe = {
      ...recipe,
      mealTypes: JSON.parse(recipe.mealTypes),
      courses: JSON.parse(recipe.courses),
      cuisines: recipe.cuisines ? JSON.parse(recipe.cuisines) : [],
      cookingMethods: JSON.parse(recipe.cookingMethods),
      occasions: recipe.occasions ? JSON.parse(recipe.occasions) : [],
      seasons: recipe.seasons ? JSON.parse(recipe.seasons) : [],
      requiredEquipment: recipe.requiredEquipment ? JSON.parse(recipe.requiredEquipment) : [],
      allergens: recipe.allergens ? JSON.parse(recipe.allergens) : [],
      steps: recipe.steps.map((step) => ({
        ...step,
        tips: step.tips ? JSON.parse(step.tips) : [],
      })),
    };

    return NextResponse.json(parsedRecipe);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return NextResponse.json({ error: "Failed to fetch recipe" }, { status: 500 });
  }
}

const ingredientSchema = z.object({
  productId: z.string(),
  amount: z.number().min(0),
  unit: z.string(),
  amountInGrams: z.number().min(0),
  preparation: z.string().optional(),
  notes: z.string().optional(),
  groupName: z.string().optional(),
  isOptional: z.boolean().default(false),
  sortOrder: z.number().default(0),
});

const stepSchema = z.object({
  stepNumber: z.number().positive(),
  instruction: z.string().min(1),
  durationMinutes: z.number().optional(),
  temperatureValue: z.number().optional(),
  temperatureUnit: z.enum(["C", "F"]).optional(),
  tips: z.array(z.string()).optional(),
});

const updateRecipeSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
  prepTime: z.number().min(0).optional(),
  cookTime: z.number().min(0).optional(),
  passiveTime: z.number().optional().nullable(),
  totalTime: z.number().min(0).optional(),
  servings: z.number().positive().optional(),
  servingSize: z.string().optional().nullable(),
  difficultyLevel: z.number().min(1).max(5).optional(),
  mealTypes: z.array(z.string()).min(1).optional(),
  courses: z.array(z.string()).min(1).optional(),
  cuisines: z.array(z.string()).optional().nullable(),
  cookingMethods: z.array(z.string()).min(1).optional(),
  occasions: z.array(z.string()).optional().nullable(),
  seasons: z.array(z.string()).optional().nullable(),
  isVegan: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  caloriesPerServing: z.number().optional().nullable(),
  proteinPerServing: z.number().optional().nullable(),
  fatPerServing: z.number().optional().nullable(),
  carbsPerServing: z.number().optional().nullable(),
  ingredients: z.array(ingredientSchema).min(1).optional(),
  steps: z.array(stepSchema).min(1).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateRecipeSchema.parse(body);

    const { ingredients, steps, mealTypes, courses, cuisines, cookingMethods, occasions, seasons, ...recipeData } = data;

    // Build update data with JSON serialization
    const updateData: Record<string, unknown> = { ...recipeData };
    if (mealTypes) updateData.mealTypes = JSON.stringify(mealTypes);
    if (courses) updateData.courses = JSON.stringify(courses);
    if (cuisines !== undefined) updateData.cuisines = cuisines ? JSON.stringify(cuisines) : null;
    if (cookingMethods) updateData.cookingMethods = JSON.stringify(cookingMethods);
    if (occasions !== undefined) updateData.occasions = occasions ? JSON.stringify(occasions) : null;
    if (seasons !== undefined) updateData.seasons = seasons ? JSON.stringify(seasons) : null;

    // Use transaction for ingredients/steps replacement
    const recipe = await db.$transaction(async (tx) => {
      // Delete old ingredients and steps if new ones provided
      if (ingredients) {
        await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
      }
      if (steps) {
        await tx.recipeStep.deleteMany({ where: { recipeId: id } });
      }

      // Update recipe with new data
      return tx.recipe.update({
        where: { id },
        data: {
          ...updateData,
          ...(ingredients && {
            ingredients: {
              create: ingredients.map((ing, index) => ({
                ...ing,
                sortOrder: ing.sortOrder || index,
              })),
            },
          }),
          ...(steps && {
            steps: {
              create: steps.map((step) => ({
                ...step,
                tips: step.tips ? JSON.stringify(step.tips) : null,
              })),
            },
          }),
        },
        include: {
          ingredients: {
            include: { product: true },
            orderBy: { sortOrder: "asc" },
          },
          steps: {
            orderBy: { stepNumber: "asc" },
          },
        },
      });
    });

    return NextResponse.json(recipe);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error updating recipe:", error);
    return NextResponse.json({ error: "Failed to update recipe" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.recipe.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    return NextResponse.json({ error: "Failed to delete recipe" }, { status: 500 });
  }
}
