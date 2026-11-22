import { colors } from './colors';
import { spacing, radius, borderWidth } from './spacing';
import { typography } from './typography';

export { colors, spacing, radius, borderWidth, typography };

/**
 * Shadow ringan untuk kartu. Android memakai `elevation`, iOS memakai
 * `shadow*`. Keduanya aman untuk React Native 0.88.
 */
export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  floating: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
};

export const theme = {
  colors,
  spacing,
  radius,
  borderWidth,
  typography,
  shadows,
};

export default theme;
