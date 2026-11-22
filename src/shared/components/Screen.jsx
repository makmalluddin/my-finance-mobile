import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

/**
 * Kerangka layar dengan safe area dan padding standar.
 * Gunakan `scroll={false}` untuk layar yang mengelola scroll sendiri
 * (misalnya daftar panjang dengan FlatList).
 */
export default function Screen({
  children,
  scroll = true,
  padded = true,
  style,
  contentContainerStyle,
  refreshControl,
  ...rest
}) {
  const contentStyle = [padded && styles.padded, contentContainerStyle];

  return (
    <SafeAreaView style={[styles.safe, style]} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={contentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          {...rest}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contentStyle]} {...rest}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
});
