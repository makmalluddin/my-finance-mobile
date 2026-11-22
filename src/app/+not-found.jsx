import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppButton, EmptyState, PageHeader, Screen } from '@/shared/components';
import { spacing } from '@/shared/theme';

export default function NotFoundScreen() {
  return (
    <Screen>
      <PageHeader title="Halaman tidak ditemukan" />
      <EmptyState
        icon="compass-outline"
        title="Rute tidak tersedia"
        message="Alamat yang Anda tuju tidak ada di aplikasi ini."
        action={
          <View style={styles.action}>
            <AppButton
              title="Kembali ke Dashboard"
              onPress={() => router.replace('/')}
              fullWidth={false}
            />
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  action: {
    marginTop: spacing.sm,
  },
});
