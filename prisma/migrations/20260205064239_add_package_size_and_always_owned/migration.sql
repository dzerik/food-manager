-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "servingsDefault" INTEGER NOT NULL DEFAULT 2,
    "gender" TEXT,
    "dailyCalorieTarget" INTEGER,
    "birthDate" DATETIME,
    "weightKg" REAL,
    "heightCm" REAL,
    "activityLevel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserAllergy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "allergen" TEXT NOT NULL,
    CONSTRAINT "UserAllergy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "preferenceType" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "barcode" TEXT,
    "imageUrl" TEXT,
    "usdaFdcId" TEXT,
    "openFoodFactsId" TEXT,
    "defaultUnit" TEXT NOT NULL DEFAULT 'g',
    "gramsPerPiece" REAL,
    "gramsPerCup" REAL,
    "packageSize" REAL,
    "isAlwaysOwned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductNutrition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "calories" REAL NOT NULL,
    "protein" REAL NOT NULL,
    "fat" REAL NOT NULL,
    "fatSaturated" REAL,
    "carbohydrates" REAL NOT NULL,
    "sugar" REAL,
    "fiberTotal" REAL,
    "fiberSoluble" REAL,
    "sodium" REAL,
    "glycemicIndex" REAL,
    "glycemicLoad" REAL,
    "vitaminA" REAL,
    "vitaminC" REAL,
    "vitaminD" REAL,
    "vitaminE" REAL,
    "vitaminK" REAL,
    "vitaminB1" REAL,
    "vitaminB2" REAL,
    "vitaminB6" REAL,
    "vitaminB12" REAL,
    "calcium" REAL,
    "iron" REAL,
    "magnesium" REAL,
    "potassium" REAL,
    "zinc" REAL,
    CONSTRAINT "ProductNutrition_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductStorage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "shelfLifePantry" INTEGER,
    "shelfLifeRefrigerator" INTEGER,
    "shelfLifeFreezer" INTEGER,
    "shelfLifeAfterOpening" INTEGER,
    "storageConditions" TEXT NOT NULL,
    "storageTempMin" REAL,
    "storageTempMax" REAL,
    "storageTips" TEXT,
    CONSTRAINT "ProductStorage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductSeasonality" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "isSeasonal" BOOLEAN NOT NULL DEFAULT false,
    "monthsAvailable" TEXT NOT NULL,
    "peakSeasonMonths" TEXT,
    "region" TEXT NOT NULL DEFAULT 'russia',
    CONSTRAINT "ProductSeasonality_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductDietaryInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "isVegan" BOOLEAN NOT NULL DEFAULT false,
    "isVegetarian" BOOLEAN NOT NULL DEFAULT false,
    "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
    "isDairyFree" BOOLEAN NOT NULL DEFAULT false,
    "isNutFree" BOOLEAN NOT NULL DEFAULT false,
    "allergens" TEXT,
    "novaGroup" INTEGER,
    "nutriScore" TEXT,
    CONSTRAINT "ProductDietaryInfo_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductSubstitute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromProductId" TEXT NOT NULL,
    "toProductId" TEXT NOT NULL,
    "ratio" REAL NOT NULL DEFAULT 1.0,
    "context" TEXT,
    "notes" TEXT,
    CONSTRAINT "ProductSubstitute_fromProductId_fkey" FOREIGN KEY ("fromProductId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductSubstitute_toProductId_fkey" FOREIGN KEY ("toProductId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "author" TEXT,
    "sourceUrl" TEXT,
    "prepTime" INTEGER NOT NULL,
    "cookTime" INTEGER NOT NULL,
    "passiveTime" INTEGER,
    "totalTime" INTEGER NOT NULL,
    "servings" INTEGER NOT NULL,
    "servingSize" TEXT,
    "yield" TEXT,
    "mealTypes" TEXT NOT NULL,
    "courses" TEXT NOT NULL,
    "cuisines" TEXT,
    "cookingMethods" TEXT NOT NULL,
    "occasions" TEXT,
    "seasons" TEXT,
    "difficultyLevel" INTEGER NOT NULL DEFAULT 3,
    "requiredEquipment" TEXT,
    "isVegan" BOOLEAN NOT NULL DEFAULT false,
    "isVegetarian" BOOLEAN NOT NULL DEFAULT false,
    "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
    "allergens" TEXT,
    "caloriesPerServing" REAL,
    "proteinPerServing" REAL,
    "fatPerServing" REAL,
    "carbsPerServing" REAL,
    "estimatedCost" REAL,
    "costPerServing" REAL,
    "budgetLevel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "amountInGrams" REAL NOT NULL,
    "preparation" TEXT,
    "notes" TEXT,
    "groupName" TEXT,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecipeIngredient_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecipeStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "instruction" TEXT NOT NULL,
    "durationMinutes" INTEGER,
    "imageUrl" TEXT,
    "tips" TEXT,
    "temperatureValue" REAL,
    "temperatureUnit" TEXT,
    CONSTRAINT "RecipeStep_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealPlanRecipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealPlanId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "mealType" TEXT NOT NULL,
    "servings" INTEGER NOT NULL,
    CONSTRAINT "MealPlanRecipe_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MealPlanRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealPlanId" TEXT,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShoppingList_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShoppingListItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shoppingListId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "storeSection" TEXT,
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "isExcluded" BOOLEAN NOT NULL DEFAULT false,
    "excludeNote" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ShoppingListItem_shoppingListId_fkey" FOREIGN KEY ("shoppingListId") REFERENCES "ShoppingList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShoppingListItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserAllergy_userId_allergen_key" ON "UserAllergy"("userId", "allergen");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "ProductNutrition_productId_key" ON "ProductNutrition"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductStorage_productId_key" ON "ProductStorage"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSeasonality_productId_key" ON "ProductSeasonality"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductDietaryInfo_productId_key" ON "ProductDietaryInfo"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingList_mealPlanId_key" ON "ShoppingList"("mealPlanId");
