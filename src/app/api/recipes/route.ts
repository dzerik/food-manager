import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const querySchema = z.object({
  cuisine: z.string().optional(),
  mealType: z.string().optional(),
  course: z.string().optional(),
  difficulty: z.coerce.number().min(1).max(5).optional(),
  maxTime: z.coerce.number().positive().optional(),
  search: z.string().optional(),
  isVegan: z.coerce.boolean().optional(),
  isVegetarian: z.coerce.boolean().optional(),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = querySchema.parse(searchParams);

    // SQLite не поддерживает mode: insensitive, фильтруем в JS
    const searchLower = query.search?.toLowerCase();

    const where = {
      ...(query.difficulty && { difficultyLevel: query.difficulty }),
      ...(query.maxTime && { totalTime: { lte: query.maxTime } }),
      ...(query.isVegan && { isVegan: true }),
      ...(query.isVegetarian && { isVegetarian: true }),
      ...(query.cuisine && {
        cuisines: {
          contains: query.cuisine,
        },
      }),
      ...(query.mealType && {
        mealTypes: {
          contains: query.mealType,
        },
      }),
      ...(query.course && {
        courses: {
          contains: query.course,
        },
      }),
    };

    // Загружаем рецепты
    const allRecipes = await db.recipe.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        prepTime: true,
        cookTime: true,
        totalTime: true,
        servings: true,
        difficultyLevel: true,
        mealTypes: true,
        courses: true,
        cuisines: true,
        allergens: true,
        isVegan: true,
        isVegetarian: true,
        caloriesPerServing: true,
        proteinPerServing: true,
        ingredients: {
          select: {
            product: {
              select: {
                dietaryInfo: {
                  select: {
                    allergens: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Фильтрация по имени (case-insensitive) на стороне JS
    const filteredRecipes = searchLower
      ? allRecipes.filter((r) => r.name.toLowerCase().includes(searchLower))
      : allRecipes;

    const total = filteredRecipes.length;

    // Пагинация
    const recipes = filteredRecipes.slice(
      (query.page - 1) * query.limit,
      query.page * query.limit
    );

    // Parse JSON fields and collect allergens from ingredients
    const parsedRecipes = recipes.map((recipe) => {
      // Collect allergens from recipe and all ingredients
      const recipeAllergens = recipe.allergens ? JSON.parse(recipe.allergens) as string[] : [];
      const ingredientAllergens = recipe.ingredients.flatMap((ing) => {
        if (ing.product.dietaryInfo?.allergens) {
          return JSON.parse(ing.product.dietaryInfo.allergens) as string[];
        }
        return [];
      });
      const allAllergens = [...new Set([...recipeAllergens, ...ingredientAllergens])];

      // Remove ingredients from response to reduce payload
      const { ingredients, ...recipeData } = recipe;

      return {
        ...recipeData,
        mealTypes: JSON.parse(recipe.mealTypes),
        courses: JSON.parse(recipe.courses),
        cuisines: recipe.cuisines ? JSON.parse(recipe.cuisines) : [],
        allergens: allAllergens,
      };
    });

    return NextResponse.json({
      recipes: parsedRecipes,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error fetching recipes:", error);
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 });
  }
}

const ingredientSchema = z.object({
  productId: z.string(),
  amount: z.number().min(0),
  unit: z.string(),
  amountInGrams: z.number().min(0),
  preparation: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  groupName: z.string().optional().nullable(),
  isOptional: z.boolean().default(false),
  sortOrder: z.number().default(0),
});

const stepSchema = z.object({
  stepNumber: z.number().positive(),
  instruction: z.string().min(1),
  durationMinutes: z.number().optional().nullable(),
  temperatureValue: z.number().optional().nullable(),
  temperatureUnit: z.enum(["C", "F"]).optional().nullable(),
  tips: z.array(z.string()).optional().nullable(),
});

const createRecipeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  author: z.string().optional(),
  sourceUrl: z.string().optional(),
  prepTime: z.number().min(0),
  cookTime: z.number().min(0),
  passiveTime: z.number().optional(),
  totalTime: z.number().min(0),
  servings: z.number().positive(),
  servingSize: z.string().optional(),
  difficultyLevel: z.number().min(1).max(5).default(3),
  mealTypes: z.array(z.string()).min(1),
  courses: z.array(z.string()).min(1),
  cuisines: z.array(z.string()).optional(),
  cookingMethods: z.array(z.string()).min(1),
  occasions: z.array(z.string()).optional(),
  seasons: z.array(z.string()).optional(),
  isVegan: z.boolean().default(false),
  isVegetarian: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  caloriesPerServing: z.number().optional(),
  proteinPerServing: z.number().optional(),
  fatPerServing: z.number().optional(),
  carbsPerServing: z.number().optional(),
  ingredients: z.array(ingredientSchema).min(1),
  steps: z.array(stepSchema).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createRecipeSchema.parse(body);

    const { ingredients, steps, mealTypes, courses, cuisines, cookingMethods, occasions, seasons, ...recipeData } = data;

    const recipe = await db.recipe.create({
      data: {
        ...recipeData,
        mealTypes: JSON.stringify(mealTypes),
        courses: JSON.stringify(courses),
        cuisines: cuisines ? JSON.stringify(cuisines) : null,
        cookingMethods: JSON.stringify(cookingMethods),
        occasions: occasions ? JSON.stringify(occasions) : null,
        seasons: seasons ? JSON.stringify(seasons) : null,
        ingredients: {
          create: ingredients.map((ing, index) => ({
            ...ing,
            sortOrder: ing.sortOrder || index,
          })),
        },
        steps: {
          create: steps.map((step) => ({
            ...step,
            tips: step.tips ? JSON.stringify(step.tips) : null,
          })),
        },
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

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error creating recipe:", error);
    return NextResponse.json({ error: "Failed to create recipe" }, { status: 500 });
  }
}
