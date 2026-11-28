import { Stack } from 'expo-router';
import { colors } from '@/shared/theme';

/**
 * Navigator bersarang untuk tab Pocket. Tanpa layout ini, rute `pockets/[id]`
 * dianggap sebagai rute tab yang tidak dideklarasikan sehingga Expo Router
 * menggantinya dengan tab awal (Dashboard). Stack ini membuat halaman detail
 * di-push di dalam tab Pocket dan tombol kembali bekerja seperti biasa.
 */
export default function PocketsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
