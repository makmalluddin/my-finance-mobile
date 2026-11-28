import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '@/shared/theme';

/**
 * Daftar email yang pernah dipakai login. Muncul saat field Email difokus
 * pada halaman Sign In. Hanya menampilkan email; kata sandi tidak disimpan.
 */
export default function EmailSuggestionsModal({
  visible,
  entries = [],
  query = '',
  onSelect,
  onRemove,
  onClear,
  onClose,
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = entries
    .map((entry) => (typeof entry === 'string' ? { email: entry } : entry))
    .filter((entry) => entry?.email)
    .filter((entry) => entry.email.toLowerCase().includes(normalizedQuery));

  const handleClose = () => onClose?.();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Tutup daftar email"
        />
        <View style={styles.dialog} accessibilityViewIsModal>
          <Text style={styles.title}>Email yang pernah dipakai</Text>
          <Text style={styles.subtitle}>
            Pilih email untuk mengisinya otomatis, atau hapus dari riwayat perangkat ini.
          </Text>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="always">
            {filtered.length === 0 ? (
              <Text style={styles.empty}>
                {entries.length === 0
                  ? 'Belum ada riwayat email di perangkat ini.'
                  : 'Tidak ada email yang cocok.'}
              </Text>
            ) : (
              filtered.map((entry) => (
                <View key={entry.email} style={styles.row}>
                  <Pressable
                    style={styles.select}
                    onPress={() => onSelect?.(entry.email)}
                    accessibilityRole="button"
                    accessibilityLabel={`Gunakan ${entry.email}`}
                  >
                    <Ionicons name="person-outline" size={18} color={colors.iconMuted} />
                    <Text style={styles.email} numberOfLines={1}>
                      {entry.email}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.remove}
                    onPress={() => onRemove?.(entry.email)}
                    accessibilityRole="button"
                    accessibilityLabel={`Hapus ${entry.email} dari riwayat`}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              onPress={() => onClear?.()}
              accessibilityRole="button"
              accessibilityLabel="Hapus semua riwayat email"
            >
              <Text style={styles.clearText}>Hapus semua</Text>
            </Pressable>
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Tutup daftar email"
            >
              <Text style={styles.closeText}>Selesai</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '75%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.floating,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  list: {
    maxHeight: 260,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  select: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  email: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  remove: {
    padding: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  clearText: {
    ...typography.bodyStrong,
    color: colors.danger,
  },
  closeText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
});
