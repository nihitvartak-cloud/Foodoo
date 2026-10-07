export const goals = [
  { label: "🥗 General Healthy Eating", value: "General Healthy Eating" },
  { label: "🔥 Fat Loss", value: "Fat Loss" },
  { label: "💪 Weight Gain", value: "Weight Gain" },
  { label: "🏋️ Muscle Building", value: "Muscle Building" },
  { label: "💪 High Protein", value: "High Protein" },
  { label: "🔥 Low Calorie", value: "Low Calorie" },
  { label: "🌾 High Fiber", value: "High Fiber" },
  { label: "🥑 Lower Fat", value: "Lower Fat" },
  { label: "🍬 Lower Sugar", value: "Lower Sugar" },
  { label: "🌱 Vegetarian", value: "Vegetarian" },
  { label: "🌿 Vegan", value: "Vegan" },
  { label: "🔄 Veg → Non-Veg", value: "Veg → Non-Veg" },
  { label: "🥬 Non-Veg → Veg", value: "Non-Veg → Veg" },
] as const;

export type Goal = (typeof goals)[number]["value"];

export const transformationModes = [
  "Healthy transformation",
  "Veg → Non-Veg",
  "Non-Veg → Veg",
] as const;

export const dietaryPreferences = [
  "No preference",
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Gluten-free",
  "Dairy-free",
] as const;

export interface TransformationInput {
  dishName: string;
  recipe: string;
  transformationMode: (typeof transformationModes)[number];
  dietaryPreference: (typeof dietaryPreferences)[number];
  primaryGoal: Goal | "";
  secondaryGoal: Goal | "";
  calorieTarget: number | null;
  proteinTarget: number | null;
  servings: number;
}

export interface Nutrition {
  calories: number;
  proteinGrams: number;
  carbohydratesGrams: number;
  fatGrams: number;
  fiberGrams: number;
}

export interface CalorieChange {
  direction: "reduction" | "increase" | "similar" | "unknown";
  amount: number | null;
  percentage: number | null;
}

export interface RecipeTransformation {
  originalDish: string;
  transformedDish: string;
  summary: string;
  servings: number;
  recommendedServingSize: string;
  nutrition: Nutrition;
  calorieChange: CalorieChange;
  changes: string[];
  ingredients: string[];
  instructions: string[];
  whyItWorks: string;
  estimateNote: string;
}
