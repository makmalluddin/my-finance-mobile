import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton, SelectField, TextField } from '@/shared/components';
import { colors, radius, spacing, typography } from '@/shared/theme';

const TYPE_OPTIONS = [
  { label: 'Income', value: 'income', description: 'Kumpulkan item Income sebelum dikonfirmasi.' },
  { label: 'Expense', value: 'expense', description: 'Rencanakan pengeluaran dan alokasinya.' },
  { label: 'Transfer', value: 'transfer', description: 'Catat perpindahan dana antar-Fund.' },
];

/**
 * Form Pocket baru atau ubah Pocket. Tipe dikunci setelah Pocket pernah
 * memiliki item karena RPC menegakkan POCKET_TYPE_IMMUTABLE.
 */
export default function PocketForm({ visible, pocket = null, saving = false, onSubmit, onCancel }) {
  const isEditing = Boolean(pocket);
  const [name, setName] = useState(pocket?.name ?? '');
  const [description, setDescription] = useState(pocket?.description ?? '');
  const [type, setType] = useState(pocket?.type ?? 'expense');
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    const nextErrors = {};
    if (name.trim() === '') {
      nextErrors.name = 'Nama Pocket wajib diisi.';
    }
    if (!TYPE_OPTIONS.some((option) => option.value === type)) {
      nextErrors.type = 'Tipe Pocket wajib dipilih.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit?.({ name: name.trim(), description: description.trim(), type });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => !saving && onCancel?.()}>
      <View style={styles.container} accessibilityViewIsModal>
        <View style={styles.header}>
          <Text style={styles.title}>{isEditing ? 'Ubah Pocket' : 'Pocket Baru'}</Text>
          <Pressable
            onPress={() => !saving && onCancel?.()}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Tutup form Pocket"
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TextField
            label="Nama Pocket"
            value={name}
            onChangeText={setName}
            placeholder="Misalnya: Liburan, Dapur, Tabungan"
            autoCorrect={false}
            returnKeyType="next"
            blurOnSubmit={false}
            error={errors.name}
            required
          />
          <TextField
            label="Deskripsi"
            value={description}
            onChangeText={setDescription}
            placeholder="Opsional"
            multiline
            autoCapitalize="sentences"
            returnKeyType="done"
          />
          <SelectField
            label="Tipe"
            value={type}
            options={TYPE_OPTIONS}
            onChange={setType}
            error={errors.type}
            disabled={isEditing && pocket?.hasEverHadItem}
            helperText={
              isEditing && pocket?.hasEverHadItem
                ? 'Tipe tidak dapat diubah setelah Pocket memiliki item.'
                : undefined
            }
            required
          />

          <View style={styles.actions}>
            <AppButton
              title="Batal"
              variant="secondary"
              onPress={onCancel}
              disabled={saving}
              style={styles.cancelButton}
            />
            <AppButton
              title={isEditing ? 'Simpan Perubahan' : 'Buat Pocket'}
              onPress={handleSubmit}
              loading={saving}
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    marginRight: spacing.sm,
    borderRadius: radius.md,
  },
  submitButton: {
    flex: 2,
    borderRadius: radius.md,
  },
});
