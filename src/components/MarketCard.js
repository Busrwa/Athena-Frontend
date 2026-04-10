import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

export default function MarketCard({ label, price, change, prefix = '' }) {
  const isPositive = change != null && parseFloat(change) > 0;
  const isZero = change == null || parseFloat(change) === 0;
  const changeColor = isZero ? colors.textMuted : (isPositive ? colors.green : colors.red);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.price} numberOfLines={1}>
        {prefix}
        {typeof price === 'number'
          ? price.toLocaleString('tr-TR', { maximumFractionDigits: 2 })
          : (price ?? '--')}
      </Text>
      <View style={[styles.changePill, {
        backgroundColor: isZero
          ? colors.bgCardAlt
          : (isPositive ? colors.greenDim : colors.redDim)
      }]}>
        <Text style={[styles.change, { color: changeColor }]}>
          {isPositive ? '+' : ''}
          {typeof change === 'number' ? change.toFixed(2) : (change ?? '0')}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 100,           // flex:1 değil, sabit genişlik — yatay scroll için şart
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  label: {
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 5,
  },
  changePill: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  change: {
    fontSize: 11,
    fontWeight: '700',
  },
});