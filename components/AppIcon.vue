<script setup lang="ts">
const props = withDefaults(defineProps<{ name: string; size?: number }>(), {
  size: 20,
})

const ICONS: Record<string, string[]> = {
  leaf: ['M20 4C10 4 4 9 4 15a5 5 0 0 0 5 5c6 0 11-6 11-16Z', 'M4.5 19.5C7 14 11 10 16 8'],
  home: ['M3 11.5 12 4l9 7.5', 'M5.5 10.5V20h13v-9.5', 'M9.5 20v-5.5h5V20'],
  book: ['M6 3h12v18H8a2 2 0 0 1-2-2V3Z', 'M9 3v18', 'M12 8h4', 'M12 12h4'],
  cycle: ['M20.5 12a8.5 8.5 0 1 1-2.5-6', 'M20.5 4.5V10h-5.5'],
  chart: ['M4 20V4', 'M4 20h16', 'M8.5 16v-4', 'M12.5 16V8', 'M16.5 16v-7'],
  user: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4.5 21a7.5 7.5 0 0 1 15 0'],
  plus: ['M12 5v14', 'M5 12h14'],
  minus: ['M5 12h14'],
  x: ['M6 6l12 12', 'M18 6 6 18'],
  check: ['M5 13l4 4L19 7'],
  'chevron-left': ['M14.5 5 8 12l6.5 7'],
  'chevron-right': ['M9.5 5 16 12l-6.5 7'],
  'arrow-right': ['M4 12h16', 'M14 6l6 6-6 6'],
  trash: ['M4 7h16', 'M9 7V5h6v2', 'M6.5 7l.8 13h9.4l.8-13', 'M10 11v5', 'M14 11v5'],
  droplet: ['M12 3.5s6 6 6 10a6 6 0 0 1-12 0c0-4 6-10 6-10Z'],
  flame: ['M12 3c1 3 5 4.5 5 9a5 5 0 0 1-10 0c0-2 1-3.5 2.5-5 0 1.5.5 2.5 1.5 3 0-2.5.5-5 1-7Z'],
  heart: ['M12 20.5S4 15.6 4 10.2A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 8 3.2c0 5.4-8 10.3-8 10.3Z'],
  sparkles: [
    'M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z',
    'M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z',
  ],
  calendar: [
    'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
    'M8 3v4',
    'M16 3v4',
    'M4 10h16',
  ],
  moon: ['M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7Z'],
  sun: [
    'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z',
    'M12 2v2.5',
    'M12 19.5V22',
    'M2 12h2.5',
    'M19.5 12H22',
    'M4.9 4.9l1.8 1.8',
    'M17.3 17.3l1.8 1.8',
    'M19.1 4.9l-1.8 1.8',
    'M6.7 17.3l-1.8 1.8',
  ],
  info: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 11v5', 'M12 7.5h.01'],
  bolt: ['M13 2 4.5 13.5H11L10 22l8.5-11.5H13L13 2Z'],
  pencil: ['M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z'],
  refresh: ['M20 11a8 8 0 0 0-14-4.5L4 9', 'M4 5v4h4', 'M4 13a8 8 0 0 0 14 4.5L20 15', 'M20 19v-4h-4'],
  bowl: ['M4 12h16a8 8 0 0 1-16 0Z', 'M8.5 12c.4-3.5 6.6-3.5 7 0'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7.5V12l3 2'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  settings: ['M4 8h6', 'M14 8h6', 'M12 8a2.5 2.5 0 1 0 0 .01', 'M4 16h10', 'M18 16h2', 'M16 16a2.5 2.5 0 1 0 0 .01'],
  target: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'],
}

const paths = computed(() => ICONS[props.name] ?? ICONS.sparkles ?? [])
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="(path, index) in paths" :key="index" :d="path" />
  </svg>
</template>
