import { useRef, useState } from 'react';
import { Link } from 'expo-router';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { AppButton, ErrorBanner, Screen, TextField } from '@/shared/components';
import { colors, spacing, typography } from '@/shared/theme';
import { toAppError } from '@/shared/utils/errors';
import { useAuth } from '../AuthProvider';

/**
 * Form masuk dan pendaftaran. Keduanya memakai layanan Auth yang sama,
 * sehingga UI tidak pernah mengimpor Supabase client.
 */
export default function AuthForm({ mode }) {
  const isSignUp = mode === 'sign-up';
  const { signIn, signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);

  const handleSubmit = async () => {
    if (loading) {
      return;
    }

    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const data = await signUp({ email, password });
        if (!data?.session) {
          setInfo('Akun berhasil dibuat. Konfirmasi email terlebih dahulu sebelum masuk.');
        }
      } else {
        await signIn({ email, password });
      }
    } catch (submittedError) {
      setError(toAppError(submittedError).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <View style={styles.hero}>
          <Text style={styles.brand}>My Finance</Text>
          <Text style={styles.title}>
            {isSignUp ? 'Buat akun baru' : 'Selamat datang kembali'}
          </Text>
          <Text style={styles.subtitle}>
            {isSignUp
              ? 'Mulai mencatat keuangan dengan akun Anda sendiri.'
              : 'Masuk untuk mengelola Fund, Pocket, dan transaksi Anda.'}
          </Text>
        </View>

        <ErrorBanner message={error} onDismiss={() => setError(null)} />
        <ErrorBanner message={info} tone="info" onDismiss={() => setInfo(null)} />

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="nama@contoh.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef.current?.focus()}
          required
        />
        <TextField
          label="Kata sandi"
          value={password}
          onChangeText={setPassword}
          placeholder={isSignUp ? 'Minimal 6 karakter' : 'Masukkan kata sandi'}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          autoCorrect={false}
          ref={passwordRef}
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
          helperText={isSignUp ? 'Gunakan kata sandi minimal 6 karakter.' : undefined}
          required
        />

        <AppButton
          title={isSignUp ? 'Daftar' : 'Masuk'}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submit}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isSignUp ? 'Sudah punya akun? ' : 'Belum punya akun? '}
          </Text>
          <Link
            href={isSignUp ? '/sign-in' : '/sign-up'}
            style={styles.footerLink}
            accessibilityRole="link"
            accessibilityLabel={isSignUp ? 'Masuk' : 'Daftar'}
          >
            {isSignUp ? 'Masuk' : 'Daftar'}
          </Link>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  hero: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  brand: {
    ...typography.brand,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  submit: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    ...typography.body,
    color: colors.textMuted,
  },
  footerLink: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
});
