import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme';

export default function MarketCard({ label, price, change, prefix = '' }) {
  const isPositive = parseFloat(change) >= 0;
  const changeColor = isPositive ? colors.green : colors.red;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.price}>
        {prefix}
        {typeof price === 'number'
          ? price.toLocaleString('tr-TR', { maximumFractionDigits: 2 })
          : (price ?? '--')}
      </Text>
      <View style={[styles.changePill, { backgroundColor: isPositive ? colors.greenDim : colors.redDim }]}>
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
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginHorizontal: 3,
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