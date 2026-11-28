import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppButton, ErrorBanner, TextField } from '@/shared/components';
import { colors, radius, shadows, spacing, typography } from '@/shared/theme';

/**
 * Dialog edit nama tampilan. Nama kosong diperbolehkan dan akan kembali ke
 * fallback `User` lewat `getDisplayName`.
 */
export default function ProfileNameDialog({
  visible,
  name = '',
  onChangeName,
  loading = false,
  error = null,
  onSave,
  onClose,
}) {
  const handleClose = () => {
    if (!loading) {
      onClose?.();
    }
  };

  const handleSave = () => {
    if (!loading) {
      onSave?.(name);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Tutup dialog nama"
          />
          <View style={styles.dialog} accessibilityViewIsModal>
            <Text style={styles.title}>Ubah nama</Text>
            <Text style={styles.message}>
              Nama ini tampil di Dashboard. Kosongkan untuk memakai “User”.
            </Text>

            <ErrorBanner message={error} />

            <TextField
              label="Nama"
              value={name}
              onChangeText={onChangeName}
              placeholder="Nama Anda"
              maxLength={50}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
              editable={!loading}
              containerStyle={styles.field}
            />

            <View style={styles.actions}>
              <AppButton
                title="Batal"
                variant="secondary"
                size="sm"
                onPress={handleClose}
                disabled={loading}
                style={styles.actionButton}
              />
              <AppButton
                title="Simpan"
                size="sm"
                onPress={handleSave}
                loading={loading}
                style={styles.actionButton}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.floating,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  message: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  field: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
  },
  actionButton: {
    minWidth: 92,
    marginLeft: spacing.sm,
  },
});
