import { colors } from './colors';
import { spacing, radius, borderWidth, layout } from './spacing';
import { typography } from './typography';

export { colors, spacing, radius, borderWidth, layout, typography };

/**
 * Shadow ringan untuk kartu. Android memakai `elevation`, iOS memakai
 * `shadow*`. Keduanya aman untuk React Native 0.88.
 */
export const shadows = {
  // Kartu mockup datar: hanya border, tanpa bayangan.
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  floating: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};

export const theme = {
  colors,
  spacing,
  radius,
  borderWidth,
  layout,
  typography,
  shadows,
};

export default theme;
