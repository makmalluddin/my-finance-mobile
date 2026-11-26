import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { AutomationScheduler } from '@/modules/automation';
import { colors, spacing, typography } from '@/shared/theme';

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
    <>
      <AutomationScheduler />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingTop: spacing.xs,
          },
          tabBarLabelStyle: {
            ...typography.captionStrong,
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
        <Tabs.Screen
          name="notifications"
          options={{
            tabBarButton: () => null,
            tabBarItemStyle: { display: 'none', flex: 0, width: 0 },
            tabBarStyle: { display: 'none' },
          }}
        />
      </Tabs>
    </>
  );
}
