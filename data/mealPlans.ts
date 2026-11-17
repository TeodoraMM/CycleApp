import type { DietPreference, MealType } from '~/types'

export interface MealTemplate {
  title: string
  description: string
  tags: string[]
}

export interface MealIngredient {
  name: string
  grams: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

export const MEAL_SLOT_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

export const MEAL_SLOT_ICONS: Record<MealType, string> = {
  breakfast: 'sun',
  lunch: 'bowl',
  dinner: 'moon',
  snack: 'sparkles',
}

export const MEAL_SLOT_SHARE: Record<MealType, number> = {
  breakfast: 0.25,
  lunch: 0.3,
  dinner: 0.35,
  snack: 0.1,
}

export const DIET_LABELS: Record<DietPreference, string> = {
  balanced: 'Balanced',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  pescatarian: 'Pescatarian',
}

export const MEAL_TEMPLATES: Record<DietPreference, Record<MealType, MealTemplate>> = {
  balanced: {
    breakfast: {
      title: 'Oats with Greek yogurt and berries',
      description: 'Creamy oats, Greek yogurt, berries and a spoon of seeds for steady morning energy.',
      tags: ['fibre', 'protein'],
    },
    lunch: {
      title: 'Chicken quinoa bowl',
      description: 'Quinoa, roasted vegetables, chicken and a lemon-tahini drizzle.',
      tags: ['lean protein', 'colourful'],
    },
    dinner: {
      title: 'Salmon with sweet potato',
      description: 'Baked salmon, sweet potato and greens with olive oil.',
      tags: ['omega-3', 'complex carbs'],
    },
    snack: {
      title: 'Apple with almond butter',
      description: 'A crisp apple with almond butter and a few walnuts.',
      tags: ['healthy fats', 'fibre'],
    },
  },
  vegetarian: {
    breakfast: {
      title: 'Spinach and feta egg toast',
      description: 'Wholegrain toast, eggs, wilted spinach and feta.',
      tags: ['protein', 'iron'],
    },
    lunch: {
      title: 'Lentil and roasted vegetable bowl',
      description: 'Lentils, roasted vegetables, feta and a bright lemon dressing.',
      tags: ['fibre', 'iron'],
    },
    dinner: {
      title: 'Tofu peanut noodles',
      description: 'Tofu, wholewheat noodles, crunchy vegetables and peanut sauce.',
      tags: ['plant protein', 'complex carbs'],
    },
    snack: {
      title: 'Cottage cheese with peach',
      description: 'Cottage cheese, sliced peach and pumpkin seeds.',
      tags: ['protein', 'magnesium'],
    },
  },
  vegan: {
    breakfast: {
      title: 'Overnight oats with soy yogurt',
      description: 'Oats, soy yogurt, chia seeds and berries.',
      tags: ['fibre', 'plant protein'],
    },
    lunch: {
      title: 'Chickpea and quinoa bowl',
      description: 'Chickpeas, quinoa, roasted vegetables and tahini.',
      tags: ['fibre', 'plant protein'],
    },
    dinner: {
      title: 'Lentil coconut curry',
      description: 'Red lentils, coconut milk, spinach and brown rice.',
      tags: ['iron', 'complex carbs'],
    },
    snack: {
      title: 'Hummus with vegetable sticks',
      description: 'Hummus, carrots, cucumber and wholemeal crackers.',
      tags: ['fibre', 'healthy fats'],
    },
  },
  pescatarian: {
    breakfast: {
      title: 'Smoked salmon and egg toast',
      description: 'Wholegrain toast, eggs, smoked salmon and rocket.',
      tags: ['omega-3', 'protein'],
    },
    lunch: {
      title: 'Tuna and white bean salad',
      description: 'Tuna, white beans, tomatoes, cucumber and olive oil.',
      tags: ['protein', 'fibre'],
    },
    dinner: {
      title: 'Cod with potatoes and greens',
      description: 'Baked cod, baby potatoes and tenderstem broccoli.',
      tags: ['lean protein', 'complex carbs'],
    },
    snack: {
      title: 'Greek yogurt with walnuts',
      description: 'Greek yogurt, a little honey and walnuts.',
      tags: ['protein', 'magnesium'],
    },
  },
}

export const MEAL_INGREDIENTS: Record<DietPreference, Record<MealType, MealIngredient[]>> = {
  balanced: {
    breakfast: [
      { name: 'Rolled oats', grams: 40, calories: 150, protein: 5, carbs: 27, fat: 3 },
      { name: 'Greek yogurt', grams: 170, calories: 100, protein: 17, carbs: 6, fat: 0 },
      { name: 'Mixed berries', grams: 100, calories: 57, protein: 1, carbs: 14, fat: 0 },
      { name: 'Chia seeds', grams: 12, calories: 58, protein: 2, carbs: 5, fat: 4 },
    ],
    lunch: [
      { name: 'Chicken breast', grams: 120, calories: 198, protein: 37, carbs: 0, fat: 4 },
      { name: 'Quinoa, cooked', grams: 185, calories: 222, protein: 8, carbs: 39, fat: 4 },
      { name: 'Broccoli', grams: 91, calories: 55, protein: 4, carbs: 11, fat: 0 },
      { name: 'Tahini drizzle', grams: 20, calories: 112, protein: 3, carbs: 4, fat: 10 },
    ],
    dinner: [
      { name: 'Salmon fillet', grams: 120, calories: 250, protein: 26, carbs: 0, fat: 15 },
      { name: 'Sweet potato', grams: 130, calories: 112, protein: 2, carbs: 26, fat: 0 },
      { name: 'Spinach, cooked', grams: 180, calories: 41, protein: 5, carbs: 7, fat: 0 },
      { name: 'Olive oil', grams: 10, calories: 89, protein: 0, carbs: 0, fat: 10 },
    ],
    snack: [
      { name: 'Apple', grams: 182, calories: 95, protein: 0, carbs: 25, fat: 0 },
      { name: 'Almond butter', grams: 24, calories: 140, protein: 5, carbs: 5, fat: 12 },
      { name: 'Walnuts', grams: 15, calories: 98, protein: 2, carbs: 2, fat: 10 },
    ],
  },
  vegetarian: {
    breakfast: [
      { name: 'Whole grain bread', grams: 80, calories: 160, protein: 8, carbs: 28, fat: 2 },
      { name: 'Eggs', grams: 100, calories: 143, protein: 13, carbs: 1, fat: 10 },
      { name: 'Spinach, cooked', grams: 100, calories: 23, protein: 3, carbs: 4, fat: 0 },
      { name: 'Feta', grams: 40, calories: 106, protein: 6, carbs: 2, fat: 8 },
    ],
    lunch: [
      { name: 'Lentils, cooked', grams: 200, calories: 230, protein: 18, carbs: 40, fat: 1 },
      { name: 'Roasted vegetables', grams: 180, calories: 90, protein: 3, carbs: 16, fat: 2 },
      { name: 'Feta', grams: 40, calories: 106, protein: 6, carbs: 2, fat: 8 },
      { name: 'Lemon dressing', grams: 15, calories: 60, protein: 0, carbs: 2, fat: 6 },
    ],
    dinner: [
      { name: 'Firm tofu', grams: 150, calories: 216, protein: 24, carbs: 5, fat: 14 },
      { name: 'Wholewheat noodles, cooked', grams: 180, calories: 250, protein: 10, carbs: 48, fat: 2 },
      { name: 'Broccoli', grams: 91, calories: 55, protein: 4, carbs: 11, fat: 0 },
      { name: 'Peanut sauce', grams: 30, calories: 150, protein: 5, carbs: 8, fat: 12 },
    ],
    snack: [
      { name: 'Cottage cheese', grams: 150, calories: 150, protein: 19, carbs: 5, fat: 6 },
      { name: 'Peach', grams: 150, calories: 59, protein: 1, carbs: 14, fat: 0 },
      { name: 'Pumpkin seeds', grams: 28, calories: 158, protein: 9, carbs: 3, fat: 14 },
    ],
  },
  vegan: {
    breakfast: [
      { name: 'Rolled oats', grams: 50, calories: 188, protein: 6, carbs: 34, fat: 3 },
      { name: 'Soy yogurt', grams: 170, calories: 110, protein: 8, carbs: 8, fat: 4 },
      { name: 'Chia seeds', grams: 12, calories: 58, protein: 2, carbs: 5, fat: 4 },
      { name: 'Mixed berries', grams: 100, calories: 57, protein: 1, carbs: 14, fat: 0 },
    ],
    lunch: [
      { name: 'Chickpeas, cooked', grams: 164, calories: 269, protein: 15, carbs: 45, fat: 4 },
      { name: 'Quinoa, cooked', grams: 150, calories: 180, protein: 7, carbs: 32, fat: 3 },
      { name: 'Roasted vegetables', grams: 180, calories: 90, protein: 3, carbs: 16, fat: 2 },
      { name: 'Tahini drizzle', grams: 20, calories: 112, protein: 3, carbs: 4, fat: 10 },
    ],
    dinner: [
      { name: 'Red lentils, cooked', grams: 200, calories: 230, protein: 18, carbs: 40, fat: 1 },
      { name: 'Coconut milk', grams: 100, calories: 180, protein: 2, carbs: 3, fat: 18 },
      { name: 'Spinach, cooked', grams: 180, calories: 41, protein: 5, carbs: 7, fat: 0 },
      { name: 'Brown rice, cooked', grams: 150, calories: 166, protein: 4, carbs: 35, fat: 2 },
    ],
    snack: [
      { name: 'Hummus', grams: 60, calories: 140, protein: 4, carbs: 12, fat: 10 },
      { name: 'Carrot sticks', grams: 100, calories: 41, protein: 1, carbs: 10, fat: 0 },
      { name: 'Cucumber sticks', grams: 120, calories: 18, protein: 1, carbs: 4, fat: 0 },
      { name: 'Wholemeal crackers', grams: 30, calories: 120, protein: 4, carbs: 20, fat: 3 },
    ],
  },
  pescatarian: {
    breakfast: [
      { name: 'Whole grain bread', grams: 80, calories: 160, protein: 8, carbs: 28, fat: 2 },
      { name: 'Eggs', grams: 100, calories: 143, protein: 13, carbs: 1, fat: 10 },
      { name: 'Smoked salmon', grams: 70, calories: 140, protein: 18, carbs: 0, fat: 7 },
      { name: 'Rocket', grams: 30, calories: 6, protein: 1, carbs: 1, fat: 0 },
    ],
    lunch: [
      { name: 'Tuna', grams: 100, calories: 132, protein: 28, carbs: 0, fat: 1 },
      { name: 'White beans', grams: 150, calories: 190, protein: 13, carbs: 34, fat: 1 },
      { name: 'Tomatoes', grams: 100, calories: 18, protein: 1, carbs: 4, fat: 0 },
      { name: 'Cucumber', grams: 100, calories: 15, protein: 1, carbs: 4, fat: 0 },
      { name: 'Olive oil', grams: 10, calories: 89, protein: 0, carbs: 0, fat: 10 },
    ],
    dinner: [
      { name: 'Cod fillet', grams: 140, calories: 140, protein: 30, carbs: 0, fat: 1 },
      { name: 'Baby potatoes', grams: 180, calories: 140, protein: 4, carbs: 30, fat: 1 },
      { name: 'Tenderstem broccoli', grams: 120, calories: 72, protein: 5, carbs: 14, fat: 0 },
      { name: 'Olive oil', grams: 10, calories: 89, protein: 0, carbs: 0, fat: 10 },
    ],
    snack: [
      { name: 'Greek yogurt', grams: 170, calories: 100, protein: 17, carbs: 6, fat: 0 },
      { name: 'Walnuts', grams: 20, calories: 131, protein: 3, carbs: 3, fat: 13 },
      { name: 'Honey', grams: 12, calories: 36, protein: 0, carbs: 10, fat: 0 },
    ],
  },
}
