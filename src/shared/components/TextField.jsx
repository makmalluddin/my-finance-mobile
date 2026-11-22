import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

/**
 * Input teks dengan label, pesan bantuan, dan pesan error.
 * Mendukung `prefix` (misalnya "Rp") dan `suffix` (misalnya "hari").
 */
export default function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  helperText,
  error,
  required = false,
  prefix,
  suffix,
  multiline = false,
  editable = true,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          focused && styles.fieldFocused,
          hasError && styles.fieldError,
          !editable && styles.fieldDisabled,
        ]}
      >
        {prefix ? <Text style={styles.affix}>{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSubtle}
          editable={editable}
          multiline={multiline}
          style={[styles.input, multiline && styles.inputMultiline, inputStyle]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...rest}
        />
        {suffix ? <Text style={styles.affix}>{suffix}</Text> : null}
      </View>

      {hasError ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
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
    minHeight: 48,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldMultiline: {
    alignItems: 'flex-start',
    minHeight: 96,
    paddingVertical: spacing.md,
  },
  fieldFocused: {
    borderColor: colors.primary,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  fieldDisabled: {
    backgroundColor: colors.surfaceMuted,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: 0,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  affix: {
    ...typography.bodyStrong,
    color: colors.textMuted,
    marginHorizontal: spacing.xs,
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
});
