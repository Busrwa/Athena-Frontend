import { Platform, StatusBar, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
export const screen = { width, height };

export const colors = {
  bg: '#000000',
  bgCard: '#0F0F0F',
  bgCardAlt: '#141414',
  bgInput: '#1A1A1A',
  border: '#1E1E1E',
  borderLight: '#2A2A2A',

  primary: '#00D4FF',
  primaryDim: 'rgba(0,212,255,0.08)',
  primaryBorder: 'rgba(0,212,255,0.22)',

  green: '#00E676',
  greenDim: 'rgba(0,230,118,0.08)',
  red: '#FF3B3B',
  redDim: 'rgba(255,59,59,0.08)',
  yellow: '#FFB800',
  yellowDim: 'rgba(255,184,0,0.08)',

  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textMuted: '#3A3A3A',

  white: '#FFFFFF',
  black: '#000000',
};

export const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;
export const TAB_HEIGHT = 56;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 6, md: 10, lg: 14, xl: 20 };

export const tavsiyeRenk = (t) => {
  if (!t) return colors.textSecondary;
  if (t === 'SAT') return colors.red;
  if (t.includes('AL')) return colors.green;
  if (t === 'TUT') return colors.yellow;
  if (t === 'DIKKAT' || t.includes('DIKKAT')) return colors.yellow;
  return colors.textSecondary;
};

export const signalRenk = (s) => {
  if (!s) return colors.textSecondary;
  if (s.includes('AL')) return colors.green;
  if (s.includes('SAT')) return colors.red;
  return colors.textSecondary;
};