import { Stack } from 'expo-router'
import { useThemeStore } from '../../store/themeStore'

export default function AuthLayout() {
  const { palette } = useThemeStore()
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.bg },
      }}
    />
  )
}
