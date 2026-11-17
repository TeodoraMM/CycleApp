import type { Phase } from '~/types'

export interface PhaseDetail {
  timing: string
  hormones: string
  energy: string
  nutrition: string
  workouts: string[]
  takeaway: string
}

export interface PhaseMeta {
  key: Phase
  label: string
  tagline: string
  summary: string
  description: string
  focus: string[]
  foods: string[]
  nutrients: string[]
  habits: string[]
  tip: string
  accent: string
  soft: string
  dotClass: string
  textClass: string
  badgeClass: string
  macroSplit: { protein: number; carbs: number; fat: number }
  calorieAdjustment: number
}

export const PHASE_LIST: Phase[] = ['menstrual', 'follicular', 'ovulation', 'luteal']

export const PHASE_META: Record<Phase, PhaseMeta> = {
  menstrual: {
    key: 'menstrual',
    label: 'Menstrual',
    tagline: 'Rest, replenish, soften',
    summary: 'Your body is shedding and rebuilding. Warmth, iron and gentle nourishment help.',
    description:
      'Energy often dips during these days, and that is completely valid. Focus on warming, iron-rich meals, vitamin C to help absorption, and permission to slow down.',
    focus: ['Iron & vitamin C', 'Warm, grounding meals', 'Gentle movement'],
    foods: ['Lentil soup', 'Spinach', 'Dark chocolate', 'Salmon', 'Berries', 'Ginger tea', 'Pumpkin seeds', 'Beetroot'],
    nutrients: ['Iron', 'Vitamin C', 'Magnesium', 'Omega-3'],
    habits: [
      'Keep meals warm and regular',
      'Pair iron with vitamin C',
      'Choose rest without guilt',
      'Sip warm tea through the day',
    ],
    tip: 'Iron-rich foods pair beautifully with vitamin C. A lentil bowl with citrus or berries is a lovely place to start.',
    accent: '#E86A8A',
    soft: '#FFF0F4',
    dotClass: 'bg-blush-400',
    textClass: 'text-blush-600',
    badgeClass: 'bg-blush-100 text-blush-700',
    macroSplit: { protein: 25, carbs: 45, fat: 30 },
    calorieAdjustment: 50,
  },
  follicular: {
    key: 'follicular',
    label: 'Follicular',
    tagline: 'Rise, refresh, build',
    summary: 'Energy tends to climb. Fresh, colourful food and steady protein support your momentum.',
    description:
      'As estrogen rises, many people feel more energetic and creative. This is a supportive time for fresh vegetables, lean protein, fibre and trying new recipes.',
    focus: ['Fresh & colourful', 'Lean protein', 'Fibre & B vitamins'],
    foods: ['Leafy greens', 'Eggs', 'Oats', 'Berries', 'Citrus', 'Chicken', 'Quinoa', 'Greek yogurt'],
    nutrients: ['B vitamins', 'Folate', 'Fibre', 'Protein'],
    habits: [
      'Try a new colourful recipe',
      'Front-load protein at breakfast',
      'Move in ways that feel fun',
      'Hydrate alongside caffeine',
    ],
    tip: 'A breakfast with protein and fibre, like oats with yogurt and berries, can support steady energy through a busy morning.',
    accent: '#9A7CCB',
    soft: '#F7F4FC',
    dotClass: 'bg-lavender-400',
    textClass: 'text-lavender-600',
    badgeClass: 'bg-lavender-100 text-lavender-700',
    macroSplit: { protein: 25, carbs: 50, fat: 25 },
    calorieAdjustment: 0,
  },
  ovulation: {
    key: 'ovulation',
    label: 'Ovulation',
    tagline: 'Glow, connect, nourish',
    summary: 'A vibrant window. Antioxidants, zinc and hydration help you feel your best.',
    description:
      'Energy and confidence often peak around ovulation. Support it with antioxidant-rich produce, zinc-containing foods, fibre and plenty of water.',
    focus: ['Antioxidants', 'Zinc & hydration', 'Colourful produce'],
    foods: ['Salmon', 'Avocado', 'Seeds', 'Whole grains', 'Peppers', 'Tomatoes', 'Tuna', 'Oranges'],
    nutrients: ['Zinc', 'Vitamin E', 'Antioxidants', 'Omega-3'],
    habits: [
      'Add colour to every plate',
      'Keep water nearby',
      'Enjoy social energy',
      'Include a handful of seeds',
    ],
    tip: 'A bowl with whole grains, salmon and roasted peppers brings antioxidants, zinc and omega-3 together in one comforting meal.',
    accent: '#D88F55',
    soft: '#FDF7F0',
    dotClass: 'bg-peach-400',
    textClass: 'text-peach-500',
    badgeClass: 'bg-peach-100 text-peach-500',
    macroSplit: { protein: 30, carbs: 45, fat: 25 },
    calorieAdjustment: 0,
  },
  luteal: {
    key: 'luteal',
    label: 'Luteal',
    tagline: 'Soothe, steady, support',
    summary: 'Cravings and energy shifts are common. Steady meals and magnesium-rich foods help.',
    description:
      'Progesterone rises and appetite can too. That is physiology, not a lack of willpower. Regular meals, complex carbohydrates and magnesium-rich foods can support mood and calm.',
    focus: ['Magnesium', 'Complex carbs', 'Steady meals'],
    foods: ['Sweet potato', 'Dark chocolate', 'Nuts', 'Yogurt', 'Banana', 'Oats', 'Chickpeas', 'Tofu'],
    nutrients: ['Magnesium', 'Calcium', 'Vitamin B6', 'Complex carbs'],
    habits: [
      'Eat regularly rather than skip',
      'Pair cravings with fibre and protein',
      'Choose magnesium-rich snacks',
      'Lower intensity if you feel tired',
    ],
    tip: 'A snack with complex carbs, protein and a little magnesium, like yogurt with oats and a square of dark chocolate, can feel both satisfying and steady.',
    accent: '#946A96',
    soft: '#F8F2F7',
    dotClass: 'bg-plum-400',
    textClass: 'text-plum-600',
    badgeClass: 'bg-plum-100 text-plum-700',
    macroSplit: { protein: 25, carbs: 40, fat: 35 },
    calorieAdjustment: 120,
  },
}

export const PHASE_DETAILS: Record<Phase, PhaseDetail> = {
  menstrual: {
    timing: 'Usually the first days of a cycle',
    hormones:
      'Oestrogen and progesterone are at their lowest as the uterine lining sheds. Prostaglandins help the uterus contract, which can bring cramps, heavy days and tiredness.',
    energy:
      'Energy, focus and motivation may feel lower. That is a normal part of this phase, not a lack of effort. Gentle plans and permission to rest can feel especially good.',
    nutrition:
      'Lean into iron-rich foods with vitamin C to support absorption, plus magnesium and omega-3s. Warm, regular meals and plenty of fluids may help you feel more comfortable.',
    workouts: [
      'Easy walks or gentle cycling',
      'Restorative yoga and slow stretching',
      'Light mobility sessions',
      'Rest, if that is what you need',
    ],
    takeaway: 'This is a rebuilding week, not a performance week.',
  },
  follicular: {
    timing: 'After bleeding, leading up to ovulation',
    hormones:
      'Oestrogen rises steadily while follicle-stimulating hormone supports egg development. Progesterone stays low until ovulation approaches.',
    energy:
      'Many people notice energy, creativity and sociability climbing. It can be a good window for new ideas, bigger tasks and trying something different.',
    nutrition:
      'Fresh colourful produce, lean protein, fibre and B vitamins support energy and cell repair. Starting the day with protein and fibre can help keep you steady.',
    workouts: [
      'Strength training or progressive lifts',
      'Running, cycling or dancing',
      'Intervals, if you feel up for them',
      'A new class or a different route',
    ],
    takeaway: 'A supportive time to build, explore and gently challenge yourself.',
  },
  ovulation: {
    timing: 'Around the middle of a typical cycle',
    hormones:
      'A surge of luteinising hormone triggers the release of an egg. Oestrogen peaks and progesterone begins to rise afterwards.',
    energy:
      'Confidence, communication and energy often feel brightest during this short window. Some people also notice a lift in appetite for fresh, bright foods.',
    nutrition:
      'Antioxidant-rich fruit and vegetables, zinc-containing foods such as seeds and seafood, and steady hydration support a high-energy phase.',
    workouts: [
      'Team sports or group classes',
      'Dynamic strength sessions',
      'Sprints or a faster run',
      'Balance and mobility work',
    ],
    takeaway: 'Bright, social energy can be a lovely thing to use.',
  },
  luteal: {
    timing: 'After ovulation, before your next period',
    hormones:
      'Progesterone becomes dominant after ovulation while oestrogen dips and then rises slightly. If a period does not arrive, both hormones fall.',
    energy:
      'Energy can taper and appetite or cravings may increase. That is common physiology, not a lack of willpower. A slower pace can feel right.',
    nutrition:
      'Complex carbohydrates, magnesium, calcium and vitamin B6 can support steadier mood and energy. Eating regularly rather than skipping meals often helps.',
    workouts: [
      'Steady walking or an easy jog',
      'Pilates and gentle strength work',
      'Slow yoga and long stretches',
      'Lower intensity as your period nears',
    ],
    takeaway: 'Soothe, steady and make room for a gentler rhythm.',
  },
}
