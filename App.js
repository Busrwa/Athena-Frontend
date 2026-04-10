import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import DashboardScreen from './src/screens/DashboardScreen';
import BudgetScreen from './src/screens/BudgetScreen';
import PositionsScreen from './src/screens/PositionsScreen';
import ChatScreen from './src/screens/ChatScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();

// SVG-style minimal icons using text/symbols — no emoji
const ICONS = {
  Dashboard: { icon: '◈', label: 'Dashboard' },
  Budget:    { icon: '◎', label: 'Butce' },
  Positions: { icon: '▦', label: 'Pozisyon' },
  Chat:      { icon: '◉', label: 'Athena' },
  History:   { icon: '◫', label: 'Gecmis' },
};

function TabIcon({ iconKey, focused }) {
  const item = ICONS[iconKey];
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 3 }}>
      <Text style={{
        fontSize: 18,
        color: focused ? colors.primary : colors.textMuted,
        lineHeight: 20,
      }}>
        {item.icon}
      </Text>
      <Text style={{
        fontSize: 9,
        fontWeight: focused ? '700' : '400',
        color: focused ? colors.primary : colors.textMuted,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
      }}>
        {item.label}
      </Text>
    </View>
  );
}

function AppNavigator() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 50 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: ({ focused }) => {
          const keyMap = {
            'Dashboard': 'Dashboard',
            'Budget': 'Budget',
            'Positions': 'Positions',
            'Chat': 'Chat',
            'History': 'History',
          };
          return <TabIcon iconKey={keyMap[route.name]} focused={focused} />;
        },
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: insets.bottom,
          paddingTop: 6,
          elevation: 0,
          shadowOpacity: 0,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Positions" component={PositionsScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#000000" />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}