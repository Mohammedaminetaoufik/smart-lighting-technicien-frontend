import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { LayoutDashboard, ClipboardList, Map as MapIcon, User } from 'lucide-react-native'
import { useThemeStore } from '../../store/themeStore'
import { useSyncStore } from '../../store/syncStore'

type Tab = 'dashboard' | 'workorders' | 'map' | 'profile'

interface TabBarProps {
  active: Tab
}

const TABS: { key: Tab; label: string; Icon: any; route: string }[] = [
  { key: 'dashboard',  label: 'Accueil',       Icon: LayoutDashboard, route: '/dashboard' },
  { key: 'workorders', label: 'Interventions',  Icon: ClipboardList,   route: '/workorders' },
  { key: 'map',        label: 'Carte',          Icon: MapIcon,         route: '/map' },
  { key: 'profile',    label: 'Profil',         Icon: User,            route: '/profile' },
]

export function TabBar({ active }: TabBarProps) {
  const router = useRouter()
  const { palette } = useThemeStore()
  const { pendingActions } = useSyncStore()

  const s = styles(palette)

  return (
    <View style={s.wrapper}>
      <View style={s.bar}>
        {TABS.map(({ key, label, Icon, route }) => {
          const isActive = active === key
          const showBadge = key === 'workorders' && pendingActions.length > 0
          return (
            <TouchableOpacity
              key={key}
              style={s.tab}
              onPress={() => !isActive && router.push(route as never)}
              activeOpacity={0.7}
            >
              {/* Active indicator glow */}
              {isActive && <View style={[s.activeGlow, { backgroundColor: palette.accent + '20' }]} />}

              {/* Icon container */}
              <View style={[s.iconWrap, isActive && { backgroundColor: palette.accent + '18' }]}>
                <Icon
                  size={22}
                  color={isActive ? palette.accent : palette.textMuted}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {showBadge && (
                  <View style={[s.badge, { backgroundColor: palette.warning }]}>
                    <Text style={s.badgeText}>
                      {pendingActions.length > 9 ? '9+' : pendingActions.length}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[s.label, { color: isActive ? palette.accent : palette.textMuted }]}>
                {label}
              </Text>

              {/* Bottom active dot */}
              {isActive && <View style={[s.activeDot, { backgroundColor: palette.accent }]} />}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = (p: ReturnType<typeof useThemeStore.getState>['palette']) =>
  StyleSheet.create({
    wrapper: {
      paddingHorizontal: 16,
      paddingBottom: Platform.OS === 'ios' ? 28 : 12,
      paddingTop: 8,
      backgroundColor: p.tabBar,
      borderTopWidth: 1,
      borderTopColor: p.tabBarBorder,
    },
    bar: {
      flexDirection: 'row',
      borderRadius: 20,
      overflow: 'hidden',
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 6,
      position: 'relative',
    },
    activeGlow: {
      position: 'absolute',
      top: 0, left: 4, right: 4, bottom: 0,
      borderRadius: 16,
    },
    iconWrap: {
      width: 44,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    label: {
      fontSize: 10,
      fontWeight: '600',
      marginTop: 2,
      letterSpacing: 0.2,
    },
    activeDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      marginTop: 3,
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: -2,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeText: {
      color: '#fff',
      fontSize: 9,
      fontWeight: '700',
    },
  })
