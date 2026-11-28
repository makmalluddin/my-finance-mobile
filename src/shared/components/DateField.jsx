import { useState } from 'react';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, shadows, spacing, borderWidth, typography } from '../theme';
import { formatDate } from '../utils/date';
import AppButton from './AppButton';

/**
 * Pemilih tanggal kalender lokal.
 *
 * Android memakai dialog native. iOS memakai modal dengan spinner agar
 * konsisten di Expo Go maupun development build.
 */
export default function DateField({
  label,
  value,
  onChange,
  placeholder = 'Pilih tanggal',
  helperText,
  error,
  required = false,
  disabled = false,
  minimumDate,
  maximumDate,
  containerStyle,
}) {
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState(value || new Date());
  const hasError = Boolean(error);

  const openPicker = () => {
    if (disabled) {
      return;
    }
    const initial = value || new Date();

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initial,
        mode: 'date',
        display: 'default',
        minimumDate,
        maximumDate,
        onChange: (event, date) => {
          if (event.type === 'set' && date) {
            onChange?.(date);
          }
        },
      });
      return;
    }

    setDraft(initial);
    setIosOpen(true);
  };

  const confirmIos = () => {
    onChange?.(draft);
    setIosOpen(false);
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
        onPress={openPicker}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${value ? formatDate(value) : placeholder}` : placeholder}
        accessibilityState={{ disabled, expanded: iosOpen }}
        style={({ pressed }) => [
          styles.field,
          pressed && !disabled && styles.fieldPressed,
          hasError && styles.fieldError,
          disabled && styles.fieldDisabled,
        ]}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
      </Pressable>

      {hasError ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal
          visible={iosOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIosOpen(false)}
        >
          <View style={styles.backdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setIosOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Tutup pemilih tanggal"
            />
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>{label || 'Pilih tanggal'}</Text>
              <DateTimePicker
                value={draft}
                mode="date"
                display="spinner"
                themeVariant="light"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                onChange={(event, date) => {
                  if (date) {
                    setDraft(date);
                  }
                }}
              />
              <View style={styles.actions}>
                <AppButton
                  title="Batal"
                  variant="secondary"
                  size="sm"
                  onPress={() => setIosOpen(false)}
                  style={styles.actionButton}
                />
                <AppButton
                  title="Pilih"
                  size="sm"
                  onPress={confirmIos}
                  style={styles.actionButton}
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
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
    minHeight: 45,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: borderWidth.hairline,
    borderColor: colors.borderStrong,
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
    ...shadows.floating,
  },
  sheetTitle: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
  actionButton: {
    minWidth: 96,
    marginLeft: spacing.sm,
  },
});
