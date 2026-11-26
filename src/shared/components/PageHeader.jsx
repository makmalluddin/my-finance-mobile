import { StyleSheet, Text, View } from 'react-native';
import { colors, layout, spacing, typography } from '../theme';

/**
 * Judul layar dengan subjudul opsional dan slot aksi di kanan.
 */
export default function PageHeader({ title, subtitle, right, style }) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.text}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: layout.sectionGap,
  },
  text: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  right: {
    paddingTop: spacing.xs,
  },
});
