import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMarket, butceDurum } from '../api/client';
import MarketCard from '../components/MarketCard';
import { colors, spacing, radius } from '../theme';

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [market, setMarket] = useState(null);
  const [durum, setDurum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [mRes, dRes] = await Promise.allSettled([getMarket(), butceDurum()]);
      if (mRes.status === 'fulfilled') setMarket(mRes.value.data);
      if (dRes.status === 'fulfilled') setDurum(dRes.value.data);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Baglaniyor...</Text>
      </View>
    );
  }

  // Backend BÜYÜK HARF key döndürüyor — bist100/usdtry değil, BIST30/USDTRY
  const overview = market?.overview || {};
  const bist30  = overview['BIST30'];
  const usdtry  = overview['USDTRY'];
  const eurtry  = overview['EURTRY'];
  const altin   = overview['ALTIN_USD'];
  const gumus   = overview['GUMUS_USD'];
  const petrol  = overview['PETROL_WTI'];
  const btc     = overview['BTC'];
  const eth     = overview['ETH'];

  const acilUyarilar = durum?.acil_uyarilar || [];
  const hasActivePlan = durum && !durum.error;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchData(); }}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>BIST AI ASISTAN</Text>
          <Text style={styles.headerTitle}>ATHENA</Text>
        </View>
        <View style={styles.liveTag}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>15DK</Text>
        </View>
      </View>

      {/* Acil Uyarilar */}
      {acilUyarilar.length > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertTitle}>⚠️ ACİL UYARI</Text>
          {acilUyarilar.map((u, i) => (
            <Text key={i} style={styles.alertText}>{u}</Text>
          ))}
        </View>
      )}

      {/* Piyasa kartları — yatay scroll */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>PİYASA</Text>
        <Text style={styles.sectionTime}>
          {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.marketRow}>
        {bist30  && <MarketCard label="BIST 30" price={bist30.price}    change={bist30.change_percent}  />}
        {usdtry  && <MarketCard label="USD/TRY" price={usdtry.rate}     change={usdtry.change_percent}  />}
        {eurtry  && <MarketCard label="EUR/TRY" price={eurtry.rate}     change={eurtry.change_percent}  />}
        {altin   && <MarketCard label="ALTIN"   price={altin.price}     change={altin.change_percent}   prefix="$" />}
        {gumus   && <MarketCard label="GÜMÜŞ"   price={gumus.price}     change={gumus.change_percent}   prefix="$" />}
        {petrol  && <MarketCard label="PETROL"  price={petrol.price}    change={petrol.change_percent}  prefix="$" />}
        {btc     && <MarketCard label="BTC"     price={btc.price_usd}   change={btc.change_percent}     prefix="$" />}
        {eth     && <MarketCard label="ETH"     price={eth.price_usd}   change={eth.change_percent}     prefix="$" />}
      </ScrollView>

      {/* Portfoy */}
      <Text style={styles.sectionLabel2}>PORTFÖY</Text>

      {hasActivePlan ? (
        <TouchableOpacity style={styles.planCard} onPress={() => navigation.navigate('Positions')}>
          <View style={styles.planTop}>
            <View>
              <Text style={styles.planSubLabel}>GÜNCEL DEĞER</Text>
              <Text style={styles.planValue}>
                {durum.toplam_guncel != null ? `${durum.toplam_guncel.toFixed(0)} TL` : '--'}
              </Text>
            </View>
            <View style={[styles.kzBox, {
              backgroundColor: (durum.toplam_kaz_kayip || 0) >= 0 ? colors.greenDim : colors.redDim,
            }]}>
              <Text style={[styles.kzVal, {
                color: (durum.toplam_kaz_kayip || 0) >= 0 ? colors.green : colors.red,
              }]}>
                {(durum.toplam_kaz_kayip || 0) >= 0 ? '+' : ''}{(durum.toplam_kaz_kayip_pct || 0).toFixed(2)}%
              </Text>
              <Text style={[styles.kzSub, {
                color: (durum.toplam_kaz_kayip || 0) >= 0 ? colors.green : colors.red,
              }]}>
                {(durum.toplam_kaz_kayip || 0) >= 0 ? '+' : ''}{(durum.toplam_kaz_kayip || 0).toFixed(0)} TL
              </Text>
            </View>
          </View>
          <View style={styles.planBottom}>
            <Text style={styles.planMeta}>{durum.acik_pozisyon_sayisi} açık pozisyon</Text>
            <Text style={styles.planArrow}>Detay ›</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.ctaCard} onPress={() => navigation.navigate('Budget')}>
          <Text style={styles.ctaLabel}>BAŞLAYALIM</Text>
          <Text style={styles.ctaTitle}>Bütçe oluştur, Athena{'\n'}80 hisse tarasın</Text>
          <View style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>BÜTÇE OLUŞTUR</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Yükselenler */}
      {market?.top_gainers?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel2}>EN ÇOK YÜKSELEN</Text>
          <View style={styles.stockList}>
            {market.top_gainers.map((s) => (
              <View key={s.symbol} style={styles.stockRow}>
                <Text style={styles.stockSymbol}>{s.symbol}</Text>
                <View style={styles.stockRight}>
                  <Text style={styles.stockPrice}>{s.price?.toFixed(2)} TL</Text>
                  <View style={[styles.changeBadge, { backgroundColor: colors.greenDim }]}>
                    <Text style={[styles.stockChange, { color: colors.green }]}>
                      +{s.change_percent?.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Düşenler */}
      {market?.top_losers?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel2}>EN ÇOK DÜŞEN</Text>
          <View style={styles.stockList}>
            {market.top_losers.map((s) => (
              <View key={s.symbol} style={styles.stockRow}>
                <Text style={styles.stockSymbol}>{s.symbol}</Text>
                <View style={styles.stockRight}>
                  <Text style={styles.stockPrice}>{s.price?.toFixed(2)} TL</Text>
                  <View style={[styles.changeBadge, { backgroundColor: colors.redDim }]}>
                    <Text style={[styles.stockChange, { color: colors.red }]}>
                      {s.change_percent?.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  loadingText: { color: colors.textSecondary, marginTop: 12, fontSize: 12, letterSpacing: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md,
  },
  headerLabel: { fontSize: 9, color: colors.textSecondary, letterSpacing: 2, fontWeight: '600' },
  headerTitle: { fontSize: 30, fontWeight: '900', color: colors.white, letterSpacing: -0.5, marginTop: 2 },
  liveTag: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: colors.border, gap: 5,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.green },
  liveText: { fontSize: 9, color: colors.textSecondary, letterSpacing: 1, fontWeight: '600' },
  alertBanner: {
    backgroundColor: colors.redDim,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.red,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginBottom: spacing.sm,
  },
  alertTitle: { fontSize: 9, color: colors.red, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  alertText: { color: colors.red, fontSize: 13, lineHeight: 20 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, marginBottom: 10,
  },
  sectionLabel: { fontSize: 9, color: colors.textSecondary, letterSpacing: 2, fontWeight: '700' },
  sectionTime: { fontSize: 9, color: colors.textMuted, letterSpacing: 1 },
  sectionLabel2: {
    fontSize: 9, color: colors.textSecondary, letterSpacing: 2,
    fontWeight: '700', paddingHorizontal: spacing.lg,
    marginTop: spacing.lg, marginBottom: 10,
  },
  // Yatay scroll için flex:1 OLMAZ, sabit genişlik lazım
  marketRow: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: 8 },
  planCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    marginHorizontal: spacing.md, padding: spacing.md,
  },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  planSubLabel: { fontSize: 9, color: colors.textSecondary, letterSpacing: 1.5, fontWeight: '600', marginBottom: 4 },
  planValue: { fontSize: 26, fontWeight: '800', color: colors.white },
  kzBox: { borderRadius: radius.md, padding: 10, alignItems: 'flex-end' },
  kzVal: { fontSize: 18, fontWeight: '800' },
  kzSub: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  planBottom: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10,
  },
  planMeta: { fontSize: 11, color: colors.textSecondary },
  planArrow: { fontSize: 11, color: colors.primary, fontWeight: '700' },
  ctaCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.primaryBorder,
    marginHorizontal: spacing.md, padding: spacing.lg,
  },
  ctaLabel: { fontSize: 9, color: colors.primary, letterSpacing: 2, fontWeight: '700', marginBottom: 8 },
  ctaTitle: { fontSize: 20, fontWeight: '800', color: colors.white, lineHeight: 28, marginBottom: 20 },
  ctaBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center' },
  ctaBtnText: { color: colors.black, fontWeight: '800', fontSize: 13, letterSpacing: 1.5 },
  section: { marginHorizontal: spacing.md },
  stockList: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  stockRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  stockSymbol: { fontSize: 14, fontWeight: '800', color: colors.white, letterSpacing: 0.5 },
  stockRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stockPrice: { fontSize: 13, color: colors.textSecondary },
  changeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  stockChange: { fontSize: 12, fontWeight: '700' },
});