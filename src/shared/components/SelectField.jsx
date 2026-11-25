import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../theme';

/**
 * Pemilih satu nilai dari daftar opsi.
 *
 * `options` berbentuk `{ label, value, description?, disabled? }`.
 */
export default function SelectField({
  label,
  value,
  options = [],
  onChange,
  placeholder = 'Pilih salah satu',
  helperText,
  error,
  required = false,
  disabled = false,
  containerStyle,
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const hasError = Boolean(error);

  const handleSelect = (option) => {
    if (option.disabled) {
      return;
    }
    onChange?.(option.value, option);
    setOpen(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}

      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${selected?.label ?? placeholder}` : placeholder}
        accessibilityState={{ disabled, expanded: open }}
        style={({ pressed }) => [
          styles.field,
          pressed && !disabled && styles.fieldPressed,
          hasError && styles.fieldError,
          disabled && styles.fieldDisabled,
        ]}
      >
        <Text
          style={[styles.value, !selected && styles.placeholder]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      {hasError ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Tutup pilihan"
          />
          <View style={styles.sheet} accessibilityViewIsModal>
            <Text style={styles.sheetTitle} accessibilityRole="header">
              {label || 'Pilih'}
            </Text>
            <ScrollView style={styles.optionList} keyboardShouldPersistTaps="handled">
              {options.length === 0 ? (
                <Text style={styles.emptyText}>Belum ada pilihan.</Text>
              ) : (
                options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <Pressable
                      key={String(option.value)}
                      onPress={() => handleSelect(option)}
                      disabled={option.disabled}
                      accessibilityRole="button"
                      accessibilityLabel={
                        option.description
                          ? `${option.label}, ${option.description}`
                          : option.label
                      }
                      accessibilityState={{
                        selected: isSelected,
                        disabled: option.disabled,
                      }}
                      style={({ pressed }) => [
                        styles.option,
                        pressed && !option.disabled && styles.optionPressed,
                      ]}
                    >
                      <View style={styles.optionText}>
                        <Text
                          style={[
                            styles.optionLabel,
                            option.disabled && styles.optionLabelDisabled,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {option.description ? (
                          <Text style={styles.optionDescription}>
                            {option.description}
                          </Text>
                        ) : null}
                      </View>
                      {isSelected ? (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      ) : null}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.danger,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  fieldDisabled: {
    backgroundColor: colors.surfaceMuted,
  },
  value: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    marginRight: spacing.sm,
  },
  placeholder: {
    color: colors.textSubtle,
  },
  helperText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '75%',
    ...shadows.floating,
  },
  sheetTitle: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: spacing.md,
  },
  optionList: {
    flexGrow: 0,
    flexShrink: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionPressed: {
    backgroundColor: colors.primarySoft,
  },
  optionText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  optionLabel: {
    ...typography.body,
    color: colors.text,
  },
  optionLabelDisabled: {
    color: colors.textSubtle,
  },
  optionDescription: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
});
