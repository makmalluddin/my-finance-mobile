import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AutomationScheduler } from '@/modules/automation';
import { colors, radius, spacing, typography } from '@/shared/theme';

const TABS = [
  { name: 'index', title: 'Dashboard', icon: 'home', iconOutline: 'home-outline' },
  {
    name: 'transactions',
    title: 'Transaksi',
    icon: 'swap-horizontal',
    iconOutline: 'swap-horizontal-outline',
  },
  { name: 'pockets', title: 'Pocket', icon: 'albums', iconOutline: 'albums-outline' },
  { name: 'funds', title: 'Fund', icon: 'wallet', iconOutline: 'wallet-outline' },
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
          tabBarActiveTintColor: colors.primaryPressed,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabItem,
          tabBarLabel: ({ focused, children }) => (
            <Text
              style={[
                focused ? typography.tabLabelActive : typography.tabLabel,
                { color: focused ? colors.primaryPressed : colors.tabInactive },
                styles.tabLabel,
              ]}
            >
              {children}
            </Text>
          ),
        }}
      >
        {TABS.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ focused }) => (
                <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                  <Ionicons
                    name={focused ? tab.icon : tab.iconOutline}
                    size={20}
                    color={focused ? colors.primaryPressed : colors.tabInactive}
                  />
                </View>
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

const styles = StyleSheet.create({
  tabBar: {
    height: 65,
    paddingTop: spacing.sm + 1,
    paddingBottom: 0,
    backgroundColor: colors.surface,
    borderWidth: 0,
    borderTopWidth: 1,
    borderColor: colors.border,
    borderTopColor: colors.border,
  },
  tabItem: {
    paddingVertical: 0,
    gap: spacing.xxs,
  },
  tabLabel: {
    marginTop: 0,
    marginBottom: 0,
  },
  iconWrap: {
    width: 45,
    height: 29,
    borderRadius: radius.tab,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.primarySoft,
  },
});
