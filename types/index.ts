export type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive'

export type Goal = 'loseWeight' | 'conceive' | 'buildMuscle' | 'energy'

export type CalorieTargetMode = 'recommended' | 'custom'

export interface AuthUser {
  id: number
  email: string
  createdAt: string
}

export type DietPreference = 'balanced' | 'vegetarian' | 'vegan' | 'pescatarian'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface UserProfile {
  name: string
  age: number
  heightCm: number
  weightKg: number
  activityLevel: ActivityLevel
  goal: Goal
  dietPreference: DietPreference
  calorieMode: CalorieTargetMode
  customCalories: number
  customProtein: number
  customCarbs: number
  customFat: number
}

export interface CycleEntry {
  start: string
  duration: number
}

export interface CycleSettings {
  entries: CycleEntry[]
  cycleLength: number
  periodLength: number
  predictionsEnabled: boolean
}

export interface FoodEntry {
  id: string
  date: string
  meal: MealType
  name: string
  serving: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface PresetFood {
  id: string
  name: string
  serving: string
  grams: number
  calories: number
  protein: number
  carbs: number
  fat: number
  tags: string[]
  per100g?: boolean
}

export type FoodSource = 'usda' | 'off'

export interface OffFood {
  code: string
  name: string
  brand: string
  quantity: string
  calories: number
  protein: number
  carbs: number
  fat: number
  source?: FoodSource
}

export interface CustomFoodInput {
  name: string
  serving: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface DailyLog {
  waterMl: number
}

export interface AppState {
  version: 2
  profile: UserProfile
  cycle: CycleSettings
  foods: FoodEntry[]
  logs: Record<string, DailyLog>
}

export interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface MealPlanMeal {
  slot: MealType
  title: string
  description: string
  calories: number
  protein: number
  carbs: number
  fat: number
  tags: string[]
}

export interface MealPlanSuggestion {
  phase: Phase | null
  targetCalories: number
  totals: MacroTotals
  items: MealPlanMeal[]
  note: string
}
