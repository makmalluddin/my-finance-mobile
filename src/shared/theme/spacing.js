/**
 * Skala spacing 4pt. Gunakan token ini agar jarak antar layar konsisten.
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
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
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
  screenPadding: spacing.lg,
  screenBottomPadding: spacing.xxxl,
  sectionGap: spacing.xl,
  cardPadding: spacing.lg,
};
