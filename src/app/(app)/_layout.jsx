import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { colors, typography } from '@/shared/theme';

const TABS = [
  {
    name: 'index',
    title: 'Dashboard',
    icon: 'home',
    iconOutline: 'home-outline',
  },
  {
    name: 'transactions',
    title: 'Transaksi',
    icon: 'swap-horizontal',
    iconOutline: 'swap-horizontal-outline',
  },
  {
    name: 'pockets',
    title: 'Pocket',
    icon: 'albums',
    iconOutline: 'albums-outline',
  },
  {
    name: 'funds',
    title: 'Fund',
    icon: 'wallet',
    iconOutline: 'wallet-outline',
  },
  {
    name: 'settings',
    title: 'Pengaturan',
    icon: 'settings',
    iconOutline: 'settings-outline',
  },
];

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          ...typography.caption,
          fontWeight: '600',
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? tab.icon : tab.iconOutline}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
