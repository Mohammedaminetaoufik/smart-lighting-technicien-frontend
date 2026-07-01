import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator, Platform,
} from 'react-native'
import { router } from 'expo-router'
import {
  User, Mail, Shield, LogOut, KeyRound, Eye, EyeOff,
  ChevronRight, CheckCircle2, Lock, Zap,
} from 'lucide-react-native'
import { useThemeStore } from '../store/themeStore'
import { useAuthStore } from '../store/authStore'
import { useSyncStore } from '../store/syncStore'
import { changePasswordApi } from '../api/auth'
import { TabBar } from '../components/ui/TabBar'
import { Palette } from '../constants/theme'

const ROLE_META: Record<string, { label: string; color: string }> = {
  admin:    { label: 'Administrateur', color: '#ef4444' },
  operator: { label: 'Technicien',     color: '#3b82f6' },
}

export default function ProfileScreen() {
  const { palette, mode, toggleTheme } = useThemeStore()
  const { user, logout } = useAuthStore()
  const { pendingActions } = useSyncStore()

  const [changePwdOpen, setChangePwdOpen] = useState(false)
  const [currentPwd,  setCurrentPwd]  = useState('')
  const [newPwd,      setNewPwd]      = useState('')
  const [confirmPwd,  setConfirmPwd]  = useState('')
  const [showCur,     setShowCur]     = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [showConf,    setShowConf]    = useState(false)
  const [pwdLoading,  setPwdLoading]  = useState(false)
  const [pwdSuccess,  setPwdSuccess]  = useState(false)
  const [pwdError,    setPwdError]    = useState('')

  const s = styles(palette)
  const roleMeta = ROLE_META[user?.role ?? ''] ?? ROLE_META.operator
  const initials = (user?.name ?? 'T')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function handleLogout() {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            await logout()
            router.replace('/(auth)/login')
          },
        },
      ],
    )
  }

  async function handleChangePassword() {
    setPwdError('')
    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdError('Tous les champs sont requis.')
      return
    }
    if (newPwd.length < 8) {
      setPwdError('Le nouveau mot de passe doit faire au moins 8 caractères.')
      return
    }
    if (newPwd !== confirmPwd) {
      setPwdError('Les mots de passe ne correspondent pas.')
      return
    }
    setPwdLoading(true)
    try {
      await changePasswordApi(currentPwd, newPwd)
      setPwdSuccess(true)
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
      setTimeout(() => { setPwdSuccess(false); setChangePwdOpen(false) }, 2000)
    } catch (err: any) {
      setPwdError(err?.response?.data?.error ?? 'Erreur lors du changement de mot de passe')
    } finally {
      setPwdLoading(false)
    }
  }

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Profil</Text>
        </View>

        {/* Avatar + user info */}
        <View style={s.avatarSection}>
          {/* Glow ring */}
          <View style={[s.avatarGlowOuter, { borderColor: roleMeta.color + '40' }]}>
            <View style={[s.avatarGlowInner, { borderColor: roleMeta.color + '80' }]}>
              <View style={[s.avatar, { backgroundColor: roleMeta.color + '22' }]}>
                <Text style={[s.avatarText, { color: roleMeta.color }]}>{initials}</Text>
              </View>
            </View>
          </View>

          <Text style={s.userName}>{user?.name ?? '—'}</Text>
          <View style={[s.roleBadge, { backgroundColor: roleMeta.color + '18', borderColor: roleMeta.color + '40' }]}>
            <Shield size={11} color={roleMeta.color} />
            <Text style={[s.roleText, { color: roleMeta.color }]}>{roleMeta.label}</Text>
          </View>
        </View>

        {/* Info card */}
        <View style={s.card}>
          <View style={s.infoRow}>
            <View style={[s.infoIcon, { backgroundColor: palette.accentSoft }]}>
              <User size={15} color={palette.accent} />
            </View>
            <View style={s.infoContent}>
              <Text style={s.infoLabel}>Nom complet</Text>
              <Text style={s.infoValue}>{user?.name ?? '—'}</Text>
            </View>
          </View>
          <View style={s.divider} />
          <View style={s.infoRow}>
            <View style={[s.infoIcon, { backgroundColor: palette.successSoft }]}>
              <Mail size={15} color={palette.success} />
            </View>
            <View style={s.infoContent}>
              <Text style={s.infoLabel}>Adresse email</Text>
              <Text style={s.infoValue}>{user?.email ?? '—'}</Text>
            </View>
          </View>
          <View style={s.divider} />
          <View style={s.infoRow}>
            <View style={[s.infoIcon, { backgroundColor: palette.warningSoft }]}>
              <Zap size={15} color={palette.warning} />
            </View>
            <View style={s.infoContent}>
              <Text style={s.infoLabel}>Actions en attente</Text>
              <Text style={[s.infoValue, pendingActions.length > 0 && { color: palette.warning }]}>
                {pendingActions.length > 0 ? `${pendingActions.length} action${pendingActions.length > 1 ? 's' : ''}` : 'Aucune'}
              </Text>
            </View>
          </View>
        </View>

        {/* Change password */}
        <View style={s.sectionLabel}>
          <Lock size={12} color={palette.textMuted} />
          <Text style={s.sectionLabelText}>SÉCURITÉ</Text>
        </View>
        <View style={s.card}>
          <TouchableOpacity
            style={s.actionRow}
            onPress={() => { setChangePwdOpen(v => !v); setPwdError(''); setPwdSuccess(false) }}
            activeOpacity={0.7}
          >
            <View style={[s.infoIcon, { backgroundColor: palette.accentSoft }]}>
              <KeyRound size={15} color={palette.accent} />
            </View>
            <Text style={s.actionText}>Changer le mot de passe</Text>
            <ChevronRight
              size={16}
              color={palette.textMuted}
              style={{ transform: [{ rotate: changePwdOpen ? '90deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {changePwdOpen && (
            <View style={s.pwdForm}>
              <View style={s.divider} />

              {pwdSuccess ? (
                <View style={s.successBox}>
                  <CheckCircle2 size={18} color={palette.success} />
                  <Text style={[s.successText, { color: palette.success }]}>Mot de passe modifié !</Text>
                </View>
              ) : (
                <>
                  <PwdField
                    label="Mot de passe actuel"
                    value={currentPwd}
                    onChange={setCurrentPwd}
                    show={showCur}
                    onToggle={() => setShowCur(v => !v)}
                    palette={palette}
                  />
                  <PwdField
                    label="Nouveau mot de passe"
                    value={newPwd}
                    onChange={setNewPwd}
                    show={showNew}
                    onToggle={() => setShowNew(v => !v)}
                    palette={palette}
                    hint="Min. 8 caractères"
                  />
                  <PwdField
                    label="Confirmer le nouveau mot de passe"
                    value={confirmPwd}
                    onChange={setConfirmPwd}
                    show={showConf}
                    onToggle={() => setShowConf(v => !v)}
                    palette={palette}
                  />

                  {!!pwdError && (
                    <View style={[s.errorBox, { backgroundColor: palette.dangerSoft, borderColor: palette.danger + '40' }]}>
                      <Text style={[s.errorText, { color: palette.danger }]}>{pwdError}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[s.savePwdBtn, { backgroundColor: palette.accent }, pwdLoading && { opacity: 0.7 }]}
                    onPress={handleChangePassword}
                    disabled={pwdLoading}
                    activeOpacity={0.8}
                  >
                    {pwdLoading
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={s.savePwdBtnText}>Enregistrer</Text>}
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>

        {/* Theme toggle */}
        <View style={s.sectionLabel}>
          <Text style={s.sectionLabelText}>APPARENCE</Text>
        </View>
        <View style={s.card}>
          <TouchableOpacity style={s.actionRow} onPress={toggleTheme} activeOpacity={0.7}>
            <View style={[s.infoIcon, { backgroundColor: palette.purple + '18' }]}>
              <Zap size={15} color={palette.purple} />
            </View>
            <Text style={s.actionText}>
              Thème {mode === 'dark' ? 'sombre' : 'clair'}
            </Text>
            <View style={[s.themeToggleTrack, { backgroundColor: mode === 'dark' ? palette.accent : palette.border }]}>
              <View style={[s.themeToggleThumb, mode === 'dark' && s.themeToggleThumbOn]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={18} color={palette.danger} />
          <Text style={[s.logoutText, { color: palette.danger }]}>Se déconnecter</Text>
        </TouchableOpacity>

        <Text style={s.version}>Lamalif Télégestion — Technicien v1.0</Text>
      </ScrollView>

      <TabBar active="profile" />
    </View>
  )
}

function PwdField({
  label, value, onChange, show, onToggle, palette, hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  palette: Palette
  hint?: string
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: palette.textMuted, fontSize: 10, fontWeight: '600', marginBottom: 5, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: palette.surface2, borderRadius: 10,
        borderWidth: 1, borderColor: palette.border,
      }}>
        <TextInput
          style={{ flex: 1, color: palette.text, fontSize: 14, paddingHorizontal: 12, paddingVertical: 11 }}
          secureTextEntry={!show}
          value={value}
          onChangeText={onChange}
          placeholder="••••••••"
          placeholderTextColor={palette.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={onToggle} style={{ padding: 10 }}>
          {show ? <EyeOff size={16} color={palette.textMuted} /> : <Eye size={16} color={palette.textMuted} />}
        </TouchableOpacity>
      </View>
      {hint && <Text style={{ color: palette.textMuted, fontSize: 10, marginTop: 3 }}>{hint}</Text>}
    </View>
  )
}

const styles = (p: Palette) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: p.bg },
  scroll:       { paddingBottom: 20 },
  header:       { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 24, paddingBottom: 4 },
  headerTitle:  { color: p.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },

  avatarSection:    { alignItems: 'center', paddingVertical: 28 },
  avatarGlowOuter:  { width: 100, height: 100, borderRadius: 50, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarGlowInner:  { width: 88, height: 88, borderRadius: 44, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatar:           { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  avatarText:       { fontSize: 28, fontWeight: '800', letterSpacing: 1 },
  userName:         { color: p.text, fontSize: 20, fontWeight: '700', marginTop: 14, letterSpacing: -0.3 },
  roleBadge:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, marginTop: 6 },
  roleText:         { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  sectionLabel:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, marginTop: 20, marginBottom: 8 },
  sectionLabelText: { color: p.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  card:      { marginHorizontal: 16, backgroundColor: p.surface, borderRadius: 16, borderWidth: 1, borderColor: p.border, overflow: 'hidden' },
  divider:   { height: 1, backgroundColor: p.border, marginHorizontal: 16 },

  infoRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  infoIcon:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoContent: { flex: 1 },
  infoLabel:   { color: p.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  infoValue:   { color: p.text, fontSize: 14, fontWeight: '600' },

  actionRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  actionText: { flex: 1, color: p.text, fontSize: 14, fontWeight: '600' },

  pwdForm: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },

  successBox:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  successText: { fontSize: 14, fontWeight: '700' },

  errorBox:  { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  errorText: { fontSize: 12 },

  savePwdBtn:     { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4, marginBottom: 6 },
  savePwdBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  themeToggleTrack: { width: 40, height: 22, borderRadius: 11, justifyContent: 'center', paddingHorizontal: 2 },
  themeToggleThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff', alignSelf: 'flex-start' },
  themeToggleThumbOn: { alignSelf: 'flex-end' },

  logoutBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 16, marginTop: 20, borderRadius: 14, borderWidth: 1.5, borderColor: p.danger + '50', paddingVertical: 14, backgroundColor: p.dangerSoft },
  logoutText: { fontSize: 15, fontWeight: '700' },

  version: { color: p.textMuted, fontSize: 11, textAlign: 'center', marginTop: 24, marginBottom: 8 },
})
