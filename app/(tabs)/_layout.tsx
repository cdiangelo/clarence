import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconName;
  activeIcon: IoniconName;
  color: string;
}

const TABS: TabConfig[] = [
  { name: 'index', title: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid', color: colors.primary },
  { name: 'chat', title: 'Analyst', icon: 'chatbubble-ellipses-outline', activeIcon: 'chatbubble-ellipses', color: colors.primary },
  { name: 'research', title: 'Research', icon: 'document-text-outline', activeIcon: 'document-text', color: colors.gold },
  { name: 'markets', title: 'Markets', icon: 'trending-up-outline', activeIcon: 'trending-up', color: colors.gain },
  { name: 'reports', title: 'Reports', icon: 'bar-chart-outline', activeIcon: 'bar-chart', color: colors.primaryLight },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 76,
          paddingBottom: 14,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? tab.activeIcon : tab.icon}
                size={21}
                color={focused ? tab.color : colors.textMuted}
              />
            ),
            tabBarActiveTintColor: tab.color,
          }}
        />
      ))}
    </Tabs>
  );
}
