import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Platform,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  ClipboardText,
  ArrowsClockwise,
  UserCircle,
} from 'phosphor-react-native';
import { TasksScreen } from '../screens/TasksScreen';
import { RoutinesScreen } from '../screens/RoutinesScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { palette, motion, shadows } from '../lib/designTokens';

const Tab = createBottomTabNavigator();

// ─── Tab definitions ──────────────────────────────────────────────────────────

type TabDef = {
  name: string;
  labelKey: 'tabs.tasks' | 'tabs.routines' | 'tabs.account';
  Icon: React.ComponentType<{ size: number; color: string; weight: 'regular' | 'bold' | 'fill' }>;
  component: React.ComponentType;
};

const TABS: TabDef[] = [
  { name: 'Tasks',    labelKey: 'tabs.tasks',    Icon: ClipboardText,  component: TasksScreen },
  { name: 'Routines', labelKey: 'tabs.routines', Icon: ArrowsClockwise, component: RoutinesScreen },
  { name: 'Account',  labelKey: 'tabs.account',  Icon: UserCircle,     component: AccountScreen },
];

// ─── Animated tab item ────────────────────────────────────────────────────────

function TabItem({
  tab,
  isFocused,
  label,
  onPress,
  accessibilityLabel,
  accessibilityState,
}: {
  tab: TabDef;
  isFocused: boolean;
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityState?: object;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconColor = isFocused ? palette.primary : palette.textSubtle;
  const iconWeight = isFocused ? 'fill' : 'regular';

  return (
    <Pressable
      style={styles.tabItem}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.85, motion.spring); }}
      onPressOut={() => { scale.value = withSpring(1, motion.spring); }}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[styles.tabInner, isFocused && styles.tabInnerActive, animStyle]}>
        <tab.Icon size={22} color={iconColor} weight={iconWeight} />
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Custom tab bar ───────────────────────────────────────────────────────────

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const pb =
    Platform.OS === 'web'
      ? { paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' as unknown as number }
      : { paddingBottom: Math.max(insets.bottom, 6) };

  return (
    <View style={[styles.tabBar, pb]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TabItem
            key={route.key}
            tab={tab}
            isFocused={isFocused}
            label={t(tab.labelKey)}
            onPress={onPress}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            accessibilityState={isFocused ? { selected: true } : {}}
          />
        );
      })}
    </View>
  );
}

// ─── Navigator ────────────────────────────────────────────────────────────────

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: palette.bgCard,
    borderTopWidth: 1,
    borderTopColor: palette.borderLight,
    paddingTop: 6,
    paddingHorizontal: 6,
    ...shadows.sm,
    shadowOffset: { width: 0, height: -2 },
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 3,
    minWidth: 64,
  },
  tabInnerActive: {
    backgroundColor: palette.primaryMuted,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.textSubtle,
  },
  tabLabelActive: {
    color: palette.primary,
  },
});
