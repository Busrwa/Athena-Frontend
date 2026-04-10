import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { butceGecmis } from '../api/client';
import { colors, spacing, radius } from '../theme';

const DURUM_COLOR = {
  hedef: colors.green,
  stop: colors.red,
  kapali: colors.textSecondary,
};

const DURUM_LABEL = {
  hedef: 'HEDEF',
  stop: 'STOP',
  kapali: 'MANUEL',
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await butceGecmis();
      setData(res.data);
    } catch (e) {
      setData({ error: e.message });
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const hasPoz = data?.pozisyonlar?.length > 0;

  if (!data || data.error || !hasPoz) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.emptyIcon}>[ / ]</Text>
        <Text style={styles.emptyText}>Gecmis islem yok</Text>
        <Text style={styles.emptySub}>Pozisyon kapattiktan sonra burada gorunur</Text>
      </View>
    );
  }

  const brRenk = data.basari_orani >= 60 ? colors.green : data.basari_orani >= 40 ? colors.yellow : colors.red;
  const totalPos = data.toplam_kaz_kayip_tl >= 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 20 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerLabel}>PERFORMANS</Text>
        <Text style={styles.headerTitle}>Gecmis</Text>
      </View>

      {/* Istatistik */}
      <View style={styles.statCard}>
        <View style={styles.statGrid}>
          {[
            { val: data.toplam_islem, lbl: 'ISLEM', color: null },
            { val: `${data.basari_orani?.toFixed(0)}%`, lbl: 'BASARI', color: brRenk },
            { val: data.kazanan, lbl: 'KAZANAN', color: colors.green },
            { val: data.kaybeden, lbl: 'KAYBEDEN', color: colors.red },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={[styles.statVal, s.color && { color: s.color }]}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLbl}>TOPLAM K/Z</Text>
          <Text style={[styles.totalVal, { color: totalPos ? colors.green : colors.red }]}>
            {totalPos ? '+' : ''}{data.toplam_kaz_kayip_tl?.toFixed(2)} TL
          </Text>
        </View>
      </View>

      {/* Islemler */}
      {data.pozisyonlar.map((p, i) => {
        const renk = DURUM_COLOR[p.durum] || colors.textSecondary;
        const label = DURUM_LABEL[p.durum] || 'KAPALI';
        const kzPos = p.kaz_kayip_tl >= 0;

        return (
          <View key={i} style={styles.islemCard}>
            <View style={styles.islemTop}>
              <View>
                <Text style={styles.islemSembol}>{p.sembol}</Text>
                <View style={[styles.durumBadge, { borderColor: renk + '40', backgroundColor: renk + '12' }]}>
                  <Text style={[styles.durumText, { color: renk }]}>{label}</Text>
                </View>
              </View>
              <View style={styles.islemKZBox}>
                <Text style={[styles.islemKZ, { color: kzPos ? colors.green : colors.red }]}>
                  {kzPos ? '+' : ''}{p.kaz_kayip_tl?.toFixed(2)} TL
                </Text>
                <Text style={[styles.islemKZPct, { color: kzPos ? colors.green : colors.red }]}>
                  {kzPos ? '+' : ''}{p.kaz_kayip_pct?.toFixed(2)}%
                </Text>
              </View>
            </View>

            <View style={styles.islemMeta}>
              <Text style={styles.metaItem}>Giris: {p.giris_fiyat?.toFixed(2)} TL</Text>
              <Text style={styles.metaItem}>Cikis: {p.cikis_fiyat?.toFixed(2)} TL</Text>
              <Text style={styles.metaItem}>{p.adet} adet</Text>
            </View>

            {p.kapanis && (
              <Text style={styles.islemTarih}>
                {new Date(p.kapanis).toLocaleDateString('tr-TR', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg, gap: 8 },
  emptyIcon: { fontSize: 22, color: colors.textMuted, marginBottom: 8, fontWeight: '300', letterSpacing: 2 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  emptySub: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },

  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  headerLabel: { fontSize: 9, color: colors.textSecondary, letterSpacing: 2, fontWeight: '700' },
  headerTitle: { fontSize: 30, fontWeight: '900', color: colors.white, letterSpacing: -0.5, marginTop: 4 },

  statCard: {
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  statGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '900', color: colors.white },
  statLbl: { fontSize: 8, color: colors.textSecondary, letterSpacing: 1.5, marginTop: 4 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
  },
  totalLbl: { fontSize: 10, color: colors.textSecondary, letterSpacing: 2, fontWeight: '700' },
  totalVal: { fontSize: 18, fontWeight: '800' },

  islemCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginBottom: 8,
    padding: spacing.md,
  },
  islemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  islemSembol: { fontSize: 18, fontWeight: '900', color: colors.white, marginBottom: 6 },
  durumBadge: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  durumText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  islemKZBox: { alignItems: 'flex-end' },
  islemKZ: { fontSize: 17, fontWeight: '800' },
  islemKZPct: { fontSize: 12, fontWeight: '700', marginTop: 2 },

  islemMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metaItem: { fontSize: 11, color: colors.textSecondary },
  islemTarih: { fontSize: 10, color: colors.textMuted, textAlign: 'right' },
});