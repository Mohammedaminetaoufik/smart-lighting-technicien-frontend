import { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Animated, ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { Zap, Eye, EyeOff, Mail, Lock, ChevronRight } from 'lucide-react-native'
import { useThemeStore } from '../../store/themeStore'
import { useAuthStore } from '../../store/authStore'
import { loginApi } from '../../api/auth'

export default function LoginScreen() {
  const { palette } = useThemeStore()
  const { login }   = useAuthStore()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [emailFocus, setEmailFocus] = useState(false)
  const [pwdFocus,   setPwdFocus]   = useState(false)

  const shakeAnim = useRef(new Animated.Value(0)).current

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start()
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.')
      shake()
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await loginApi(email.trim().toLowerCase(), password)
      await login(res.user, res.token)
      router.replace('/dashboard')
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? 'Identifiants invalides'
      setError(msg)
      shake()
    } finally {
      setLoading(false)
    }
  }

  const isDark = palette.bg === '#0a0f1e' || palette.bg.startsWith('#0')

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: palette.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Background decoration circles */}
        <View style={s.bgCircle1} pointerEvents="none" />
        <View style={s.bgCircle2} pointerEvents="none" />
        <View style={[s.bgCircle3, { borderColor: palette.accent + '18' }]} pointerEvents="none" />

        {/* Logo section */}
        <View style={s.logoSection}>
          {/* Outer glow ring */}
          <View style={[s.logoRingOuter, { borderColor: palette.accent + '25' }]}>
            <View style={[s.logoRingInner, { borderColor: palette.accent + '50' }]}>
              <View style={[s.logoBox, { backgroundColor: palette.accent }]}>
                <Zap size={28} color="#fff" strokeWidth={2.5} />
              </View>
            </View>
          </View>

          {/* Brand name */}
          <Text style={[s.brandName, { color: palette.text }]}>Lamalif Télégestion</Text>
          <View style={[s.brandBadge, { backgroundColor: palette.accentSoft, borderColor: palette.accent + '40' }]}>
            <View style={[s.brandDot, { backgroundColor: palette.accent }]} />
            <Text style={[s.brandBadgeText, { color: palette.accent }]}>Espace Technicien</Text>
          </View>
        </View>

        {/* Card */}
        <Animated.View style={[s.card, { backgroundColor: palette.surface, borderColor: palette.border, transform: [{ translateX: shakeAnim }] }]}>

          {/* Card header line */}
          <View style={[s.cardAccentBar, { backgroundColor: palette.accent }]} />

          <View style={s.cardBody}>
            <Text style={[s.cardTitle, { color: palette.text }]}>Connexion</Text>
            <Text style={[s.cardSub, { color: palette.textMuted }]}>Entrez vos identifiants pour accéder à votre espace</Text>

            {/* Email field */}
            <View style={s.fieldGroup}>
              <Text style={[s.fieldLabel, { color: palette.textMuted }]}>ADRESSE EMAIL</Text>
              <View style={[
                s.inputRow,
                { backgroundColor: palette.surface2, borderColor: emailFocus ? palette.accent : palette.border },
              ]}>
                <Mail size={16} color={emailFocus ? palette.accent : palette.textMuted} style={s.inputIcon} />
                <TextInput
                  style={[s.input, { color: palette.text }]}
                  placeholder="technicien@lamalif.ma"
                  placeholderTextColor={palette.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password field */}
            <View style={s.fieldGroup}>
              <Text style={[s.fieldLabel, { color: palette.textMuted }]}>MOT DE PASSE</Text>
              <View style={[
                s.inputRow,
                { backgroundColor: palette.surface2, borderColor: pwdFocus ? palette.accent : palette.border },
              ]}>
                <Lock size={16} color={pwdFocus ? palette.accent : palette.textMuted} style={s.inputIcon} />
                <TextInput
                  style={[s.input, { color: palette.text, flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor={palette.textMuted}
                  secureTextEntry={!showPwd}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPwdFocus(true)}
                  onBlur={() => setPwdFocus(false)}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={s.eyeBtn}>
                  {showPwd
                    ? <EyeOff size={16} color={palette.textMuted} />
                    : <Eye    size={16} color={palette.textMuted} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Error */}
            {!!error && (
              <View style={[s.errorBox, { backgroundColor: palette.dangerSoft, borderColor: palette.danger + '50' }]}>
                <View style={[s.errorDot, { backgroundColor: palette.danger }]} />
                <Text style={[s.errorText, { color: palette.danger }]}>{error}</Text>
              </View>
            )}

            {/* Submit button */}
            <TouchableOpacity
              style={[s.btn, { backgroundColor: palette.accent }, loading && s.btnLoading]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={s.btnText}>Se connecter</Text>
                  <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Footer */}
        <Text style={[s.footer, { color: palette.textMuted }]}>
          Système de gestion de l'éclairage public
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    position: 'relative',
  },

  // Background decorations
  bgCircle1: {
    position: 'absolute', top: -80, right: -80,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: '#3b82f608',
  },
  bgCircle2: {
    position: 'absolute', bottom: 40, left: -100,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: '#06b6d406',
  },
  bgCircle3: {
    position: 'absolute', top: '30%', left: '50%',
    width: 320, height: 320, borderRadius: 160,
    borderWidth: 1, marginLeft: -160, marginTop: -160,
  },

  // Logo
  logoSection: { alignItems: 'center', marginBottom: 36 },
  logoRingOuter: {
    width: 100, height: 100, borderRadius: 50, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  logoRingInner: {
    width: 84, height: 84, borderRadius: 42, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  logoBox: {
    width: 68, height: 68, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 16, elevation: 12,
  },
  brandName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  brandBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginTop: 8,
  },
  brandDot: { width: 6, height: 6, borderRadius: 3 },
  brandBadgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  // Card
  card: {
    borderRadius: 20, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 12,
  },
  cardAccentBar: { height: 3 },
  cardBody: { padding: 24 },
  cardTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, marginBottom: 4 },
  cardSub:   { fontSize: 13, lineHeight: 18, marginBottom: 22 },

  // Fields
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1.5, paddingRight: 4,
  },
  inputIcon: { marginLeft: 12, marginRight: 4 },
  input: { flex: 1, paddingHorizontal: 8, paddingVertical: 13, fontSize: 14 },
  eyeBtn: { padding: 10 },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14,
  },
  errorDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  errorText: { fontSize: 12, flex: 1 },

  // Button
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 12, paddingVertical: 14, marginTop: 4,
    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  btnLoading: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Footer
  footer: { textAlign: 'center', fontSize: 11, marginTop: 28 },
})
