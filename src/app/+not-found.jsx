import { router } from 'expo-router';
import { View } from 'react-native';
import { AppButton, EmptyState, PageHeader, Screen } from '@/shared/components';
import { spacing } from '@/shared/theme';

export default function NotFoundScreen() {
  return (
    <Screen>
      <PageHeader title="Udin's" />
      <View style={styles.wrap}>
        <EmptyState
          icon="compass-outline"
          title="Halaman tidak ditemukan"
          message="Halaman yang Anda cari tidak tersedia."
          action={
            <View style={styles.action}>
              <AppButton
                title="Kembali ke Dashboard"
                onPress={() => router.replace('/')}
              />
            </View>
          }
        />
      </View>
    </Screen>
  );
}

const styles = {
  wrap: {
    flex: 1,
    justifyContent: 'center',
  },
  action: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
};
