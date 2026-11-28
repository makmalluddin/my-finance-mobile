import { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, borderWidth, typography } from '../theme';

/**
 * Input teks dengan label, pesan bantuan, dan pesan error.
 * Mendukung `prefix` (misalnya "Rp") dan `suffix` (misalnya "hari").
 */
const TextField = forwardRef(function TextField({
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
}, ref) {
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
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSubtle}
          editable={editable}
          multiline={multiline}
          accessibilityLabel={label}
          accessibilityHint={helperText}
          accessibilityState={{ disabled: !editable }}
          returnKeyType={multiline ? 'default' : 'done'}
          blurOnSubmit={!multiline}
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
        <Text
          style={styles.errorText}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
});

export default TextField;

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
    minHeight: 45,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: borderWidth.hairline,
    borderColor: colors.borderStrong,
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
