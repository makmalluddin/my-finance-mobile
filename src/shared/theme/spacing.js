/**
 * Skala spacing 4pt dan radius mengikuti mockup Fase 7B.
 */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 13,
  lg: 16,
  xl: 24,
  pill: 999,
  input: 9,
  badge: 5,
  chip: 8,
  tab: 9,
  button: 10,
};

export const borderWidth = {
  hairline: 1,
  thick: 2,
};

/**
 * Jarak standar untuk kerangka layar dan kartu. Turunan dari `spacing`
 * supaya seluruh layar memakai skala yang sama tanpa angka hard-coded.
 */
export const layout = {
  screenPadding: spacing.xl,
  screenBottomPadding: spacing.xxxl,
  sectionGap: spacing.lg,
  cardPadding: radius.md,
};
