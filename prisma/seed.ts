import { PrismaClient } from "@prisma/client";
import productsData from "./data/products.json";
import recipesData from "./data/recipes.json";

const prisma = new PrismaClient();

interface ProductData {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  defaultUnit: string;
  gramsPerPiece?: number;
  gramsPerCup?: number;
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
  };
  dietary: {
    isVegan: boolean;
    isVegetarian: boolean;
    isGlutenFree: boolean;
    isDairyFree: boolean;
    isNutFree: boolean;
    allergens?: string[];
  };
}

interface IngredientData {
  productId: string;
  amount: number;
  unit: string;
  amountInGrams: number;
  groupName?: string;
  preparation?: string;
  notes?: string;
  isOptional?: boolean;
}

interface StepData {
  stepNumber: number;
  instruction: string;
  durationMinutes?: number;
  temperatureValue?: number;
  temperatureUnit?: string;
}

interface RecipeData {
  id: string;
  name: string;
  description?: string;
  prepTime: number;
  cookTime: number;
  passiveTime?: number;
  totalTime: number;
  servings: number;
  mealTypes: string[];
  courses: string[];
  cuisines?: string[];
  cookingMethods: string[];
  difficultyLevel: number;
  isVegan?: boolean;
  isVegetarian?: boolean;
  ingredients: IngredientData[];
  steps: StepData[];
}

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  console.log("🗑️  Clearing existing data...");
  await prisma.mealPlanRecipe.deleteMany();
  await prisma.mealPlan.deleteMany();
  await prisma.recipeStep.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.productNutrition.deleteMany();
  await prisma.productDietaryInfo.deleteMany();
  await prisma.product.deleteMany();

  // Seed products
  console.log("📦 Seeding products...");
  const products = productsData as ProductData[];

  // Продукты, которые всегда есть дома (специи, базовые ингредиенты)
  const alwaysOwnedProductIds = new Set([
    "prod_salt",
    "prod_sugar",
    "prod_black_pepper",
    "prod_sunflower_oil",
    "prod_bay_leaf",
  ]);

  for (const product of products) {
    await prisma.product.create({
      data: {
        id: product.id,
        name: product.name,
        category: product.category,
        subcategory: product.subcategory,
        defaultUnit: product.defaultUnit,
        gramsPerPiece: product.gramsPerPiece,
        gramsPerCup: product.gramsPerCup,
        isAlwaysOwned: alwaysOwnedProductIds.has(product.id),
        nutrition: {
          create: {
            calories: product.nutrition.calories,
            protein: product.nutrition.protein,
            fat: product.nutrition.fat,
            carbohydrates: product.nutrition.carbohydrates,
          },
        },
        dietaryInfo: {
          create: {
            isVegan: product.dietary.isVegan,
            isVegetarian: product.dietary.isVegetarian,
            isGlutenFree: product.dietary.isGlutenFree,
            isDairyFree: product.dietary.isDairyFree,
            isNutFree: product.dietary.isNutFree,
            allergens: product.dietary.allergens
              ? JSON.stringify(product.dietary.allergens)
              : null,
          },
        },
      },
    });
  }
  console.log(`✅ Created ${products.length} products`);

  // Seed recipes
  console.log("🍳 Seeding recipes...");
  const recipes = recipesData as RecipeData[];

  for (const recipe of recipes) {
    // Check if all product IDs exist
    const productIds = recipe.ingredients.map((i) => i.productId);
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });
    const existingProductIds = new Set(existingProducts.map((p) => p.id));

    const missingProducts = productIds.filter((id) => !existingProductIds.has(id));
    if (missingProducts.length > 0) {
      console.warn(`⚠️  Recipe "${recipe.name}" has missing products: ${missingProducts.join(", ")}`);
      continue;
    }

    // Calculate nutrition per serving
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;

    for (const ingredient of recipe.ingredients) {
      const product = await prisma.product.findUnique({
        where: { id: ingredient.productId },
        include: { nutrition: true },
      });

      if (product?.nutrition) {
        const factor = ingredient.amountInGrams / 100;
        totalCalories += product.nutrition.calories * factor;
        totalProtein += product.nutrition.protein * factor;
        totalFat += product.nutrition.fat * factor;
        totalCarbs += product.nutrition.carbohydrates * factor;
      }
    }

    const caloriesPerServing = Math.round(totalCalories / recipe.servings);
    const proteinPerServing = Math.round(totalProtein / recipe.servings * 10) / 10;
    const fatPerServing = Math.round(totalFat / recipe.servings * 10) / 10;
    const carbsPerServing = Math.round(totalCarbs / recipe.servings * 10) / 10;

    await prisma.recipe.create({
      data: {
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        passiveTime: recipe.passiveTime,
        totalTime: recipe.totalTime,
        servings: recipe.servings,
        mealTypes: JSON.stringify(recipe.mealTypes),
        courses: JSON.stringify(recipe.courses),
        cuisines: recipe.cuisines ? JSON.stringify(recipe.cuisines) : null,
        cookingMethods: JSON.stringify(recipe.cookingMethods),
        difficultyLevel: recipe.difficultyLevel,
        isVegan: recipe.isVegan || false,
        isVegetarian: recipe.isVegetarian || false,
        caloriesPerServing,
        proteinPerServing,
        fatPerServing,
        carbsPerServing,
        ingredients: {
          create: recipe.ingredients.map((ing, index) => ({
            productId: ing.productId,
            amount: ing.amount,
            unit: ing.unit,
            amountInGrams: ing.amountInGrams,
            groupName: ing.groupName,
            preparation: ing.preparation,
            notes: ing.notes,
            isOptional: ing.isOptional || false,
            sortOrder: index,
          })),
        },
        steps: {
          create: recipe.steps.map((step) => ({
            stepNumber: step.stepNumber,
            instruction: step.instruction,
            durationMinutes: step.durationMinutes,
            temperatureValue: step.temperatureValue,
            temperatureUnit: step.temperatureUnit,
          })),
        },
      },
    });
  }
  console.log(`✅ Created ${recipes.length} recipes`);

  // Create a demo user
  console.log("👤 Creating demo user...");
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      password: "demo123", // In production, this should be hashed
      servingsDefault: 2,
    },
  });
  console.log(`✅ Created demo user: ${demoUser.email}`);

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
