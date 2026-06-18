import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppTabs } from './AppTabs';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';
import { TeamMembersScreen } from '../screens/team/TeamMembersScreen';
import { RoutineStatsScreen } from '../screens/RoutineStatsScreen';
import { PremiumScreen } from '../screens/PremiumScreen';
import type { Task } from '../screens/CreateTaskModal';
import { palette } from '../lib/designTokens';

export type RootStackParamList = {
  Main: undefined;
  TaskDetail: { task: Task };
  TeamMembers: undefined;
  RoutineStats: undefined;
  Premium: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.bgPage },
      }}
    >
      <Stack.Screen name="Main" component={AppTabs} />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{
          headerShown: true,
          title: 'タスク詳細',
          headerBackTitle: '戻る',
          headerTintColor: palette.primary,
          headerStyle: { backgroundColor: palette.bgCard },
          headerShadowVisible: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="TeamMembers"
        component={TeamMembersScreen}
        options={{
          headerShown: true,
          title: 'チームメンバー',
          headerBackTitle: '戻る',
          headerTintColor: palette.primary,
          headerStyle: { backgroundColor: palette.bgCard },
          headerShadowVisible: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="RoutineStats"
        component={RoutineStatsScreen}
        options={{
          headerShown: true,
          title: '達成状況',
          headerBackTitle: '戻る',
          headerTintColor: palette.primary,
          headerStyle: { backgroundColor: palette.bgCard },
          headerShadowVisible: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="Premium"
        component={PremiumScreen}
        options={{ presentation: 'modal', headerShown: false }}
      />
    </Stack.Navigator>
  );
}
