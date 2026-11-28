import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

const TONES = {
  primary: { background: colors.primarySoft, text: colors.primaryPressed },
  success: { background: colors.successSoft, text: colors.successText },
  income: { background: colors.successSoft, text: colors.successText },
  active: { background: colors.successSoft, text: colors.successText },
  danger: { background: colors.dangerSoft, text: colors.dangerText },
  expense: { background: colors.dangerSoft, text: colors.dangerText },
  warning: { background: colors.dangerSoft, text: colors.dangerText },
  transfer: { background: colors.transferSoft, text: colors.transfer },
  neutral: { background: colors.neutralSoft, text: colors.neutral },
};

/** Badge label mengikuti mockup: 10px/700, radius 5, padding 2×7. */
export default function Badge({ label, tone = 'neutral', style, textStyle }) {
  const palette = TONES[tone] || TONES.neutral;

  return (
    <View style={[styles.badge, { backgroundColor: palette.background }, style]}>
      <Text style={[styles.label, { color: palette.text }, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.badge,
    paddingVertical: spacing.xxs,
    paddingHorizontal: 7,
    alignSelf: 'flex-start',
  },
  label: {
    ...typography.badge,
  },
});
