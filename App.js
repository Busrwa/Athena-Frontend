import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import DashboardScreen from './src/screens/DashboardScreen';
import BudgetScreen from './src/screens/BudgetScreen';
import PositionsScreen from './src/screens/PositionsScreen';
import ChatScreen from './src/screens/ChatScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { colors } from './src/theme';
import { registerForPushNotifications } from './src/services/notificationService';

const Tab = createBottomTabNavigator();
const SCREEN_WIDTH = Dimensions.get('window').width;

function DashIcon({ color }) {
  return (
    <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 9, height: 9, borderWidth: 1.5, borderColor: color, transform: [{ rotate: '45deg' }] }} />
    </View>
  );
}
function BudgetIcon({ color }) {
  return (
    <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 13, height: 13, borderRadius: 6.5, borderWidth: 1.5, borderColor: color }} />
    </View>
  );
}
function PozIcon({ color }) {
  const s = { width: 4, height: 4, borderWidth: 1.5, borderColor: color };
  return (
    <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        <View style={s} /><View style={s} />
      </View>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        <View style={s} /><View style={s} />
      </View>
    </View>
  );
}
function ChatIcon({ color }) {
  return (
    <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 13, height: 13, borderRadius: 6.5, borderWidth: 1.5, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
      </View>
    </View>
  );
}
function HistoryIcon({ color }) {
  return (
    <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 10, height: 13, borderWidth: 1.5, borderColor: color, borderRadius: 2 }} />
    </View>
  );
}

const TAB_CONFIG = [
  { name: 'Dashboard', Icon: DashIcon,    label: 'BOARD' },
  { name: 'Budget',    Icon: BudgetIcon,  label: 'BÜTÇE' },
  { name: 'Positions', Icon: PozIcon,     label: 'POZİSYON' },
  { name: 'Chat',      Icon: ChatIcon,    label: 'ATHENA' },
  { name: 'History',   Icon: HistoryIcon, label: 'GEÇMİŞ' },
];

function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const itemWidth = SCREEN_WIDTH / TAB_CONFIG.length;

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: '#0A0A0A',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingBottom: insets.bottom,
      paddingTop: 8,
      height: 52 + insets.bottom,
    }}>
      {TAB_CONFIG.map((tab, index) => {
        const focused = state.index === index;
        const color = focused ? colors.primary : colors.textSecondary;
        const { Icon } = tab;

        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => navigation.navigate(tab.name)}
            style={{
              width: itemWidth,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
            activeOpacity={0.7}
          >
            <Icon color={color} />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 8,
                fontWeight: focused ? '700' : '500',
                color,
                letterSpacing: 0.3,
                textAlign: 'center',
                width: itemWidth - 4,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AppNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Budget"    component={BudgetScreen} />
      <Tab.Screen name="Positions" component={PositionsScreen} />
      <Tab.Screen name="Chat"      component={ChatScreen} />
      <Tab.Screen name="History"   component={HistoryScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Push notification setup
    registerForPushNotifications();

    // Bildirim geldiğinde (uygulama açıkken)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Bildirim alındı:', notification);
    });

    // Bildirime tıklandığında
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Bildirime tıklandı:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#000000" />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}