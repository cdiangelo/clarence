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
  { name: 'index', title: 'Home', icon: 'home-outline', activeIcon: 'home', color: colors.primary },
  { name: 'chat', title: 'Chat', icon: 'chatbubble-outline', activeIcon: 'chatbubble', color: colors.chat },
  { name: 'schedule', title: 'Schedule', icon: 'calendar-outline', activeIcon: 'calendar', color: colors.primary },
  { name: 'health', title: 'Health', icon: 'heart-outline', activeIcon: 'heart', color: colors.health },
  { name: 'finance', title: 'Finance', icon: 'wallet-outline', activeIcon: 'wallet', color: colors.finance },
  { name: 'trips', title: 'Trips', icon: 'airplane-outline', activeIcon: 'airplane', color: colors.trips },
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
          height: 80,
          paddingBottom: 16,
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
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? tab.activeIcon : tab.icon}
                size={22}
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
