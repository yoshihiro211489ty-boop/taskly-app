import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TasksScreen } from '../screens/TasksScreen';
import { RoutinesScreen } from '../screens/RoutinesScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { palette } from '../lib/designTokens';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Tasks', label: 'タスク', icon: '📋', component: TasksScreen },
  { name: 'Routines', label: 'ルーティン', icon: '🔁', component: RoutinesScreen },
  { name: 'Account', label: 'アカウント', icon: '👤', component: AccountScreen },
] as const;

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const pb =
    Platform.OS === 'web'
      ? { paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' as unknown as number }
      : { paddingBottom: Math.max(insets.bottom, 6) };

  return (
    <View style={[styles.tabBar, pb]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const tab = TABS.find((t) => t.name === route.name);

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={[styles.tabItem, isFocused && styles.tabItemActive]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 18, opacity: isFocused ? 1 : 0.5 }}>{tab?.icon}</Text>
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {tab?.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function AppTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {TABS.map((tab) => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: palette.bgCard,
    borderTopWidth: 1,
    borderTopColor: palette.borderLight,
    paddingTop: 8,
    paddingHorizontal: 8,
    shadowColor: palette.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
    gap: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabItemActive: {
    backgroundColor: palette.primaryMuted,
    borderColor: '#CFE0FF',
  },
  tabLabel: { fontSize: 11, fontWeight: '700', color: palette.textSubtle, marginTop: 2 },
  tabLabelActive: { color: palette.primary },
});
