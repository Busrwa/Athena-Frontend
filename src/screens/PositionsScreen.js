import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { butceDurum, pozisyonKapat } from '../api/client';
import { colors, spacing, radius, tavsiyeRenk } from '../theme';

export default function PositionsScreen() {
  const insets = useSafeAreaInsets();
  const [durum, setDurum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kapatModal, setKapatModal] = useState(null);
  const [cikisFiyat, setCikisFiyat] = useState('');
  const [kapatiyor, setKapatiyor] = useState(false);

  const fetchDurum = useCallback(async () => {
    try {
      const res = await butceDurum();
      setDurum(res.data);
    } catch (e) {
      setDurum({ error: e.message });
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchDurum();
    const interval = setInterval(fetchDurum, 90000);
    return () => clearInterval(interval);
  }, []);

  const handleKapat = async () => {
    if (!kapatModal) return;
    setKapatiyor(true);
    try {
      const body = {};
      if (cikisFiyat) body.cikis_fiyat = parseFloat(cikisFiyat);
      const res = await pozisyonKapat(kapatModal.id, body);
      Alert.alert('Kapatildi', res.data.mesaj);
      setKapatModal(null);
      setCikisFiyat('');
      fetchDurum();
    } catch (e) {
      Alert.alert('Hata', e.message);
    }
    setKapatiyor(false);
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!durum || durum.error) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.emptyIcon}>[ ]</Text>
        <Text style={styles.emptyText}>Aktif plan yok</Text>
        <Text style={styles.emptySub}>Butce sekmesinden plan olustur</Text>
      </View>
    );
  }

  const acil = durum.acil_uyarilar || [];

  return (
    <View style={[styles.container]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchDurum(); }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerLabel}>PORTFOY</Text>
          <Text style={styles.headerTitle}>Pozisyonlar</Text>
          <Text style={styles.headerSub}>Her 90 saniyede yenilenir</Text>
        </View>

        {/* Acil */}
        {acil.length > 0 && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertTitle}>ACIL UYARI</Text>
            {acil.map((u, i) => <Text key={i} style={styles.alertText}>{u}</Text>)}
          </View>
        )}

        {/* Ozet */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryGrid}>
            {[
              { val: `${durum.toplam_maliyet?.toFixed(0)} TL`, lbl: 'MALIYET' },
              { val: `${durum.toplam_guncel?.toFixed(0)} TL`, lbl: 'GUNCEL' },
              {
                val: `${durum.toplam_kaz_kayip >= 0 ? '+' : ''}${durum.toplam_kaz_kayip?.toFixed(0)} TL`,
                lbl: 'K/Z',
                color: durum.toplam_kaz_kayip >= 0 ? colors.green : colors.red,
              },
              {
                val: `${durum.toplam_kaz_kayip_pct >= 0 ? '+' : ''}${durum.toplam_kaz_kayip_pct?.toFixed(2)}%`,
                lbl: 'GETIRI',
                color: durum.toplam_kaz_kayip_pct >= 0 ? colors.green : colors.red,
              },
            ].map((item, i) => (
              <View key={i} style={styles.summaryItem}>
                <Text style={[styles.summaryVal, item.color && { color: item.color }]}>{item.val}</Text>
                <Text style={styles.summaryLbl}>{item.lbl}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pozisyonlar */}
        {(durum.pozisyonlar || []).map((p) => {
          const tavRenk = tavsiyeRenk(p.tavsiye);
          const kzPos = p.kaz_kayip_tl >= 0;

          return (
            <View key={p.id} style={styles.pozCard}>
              <View style={styles.pozTop}>
                <View>
                  <Text style={styles.pozSembol}>{p.sembol}</Text>
                  <Text style={styles.pozDurum}>{p.durum === 'acik' ? 'ACIK' : 'BEKLIYOR'} · {p.adet} adet</Text>
                </View>
                <View style={[styles.tavBadge, { borderColor: tavRenk + '50', backgroundColor: tavRenk + '12' }]}>
                  <Text style={[styles.tavText, { color: tavRenk }]}>{p.tavsiye}</Text>
                </View>
              </View>

              {/* Fiyat Grid */}
              <View style={styles.fiyatGrid}>
                {[
                  { lbl: 'GIRIS', val: `${p.giris_fiyat?.toFixed(2)}`, color: null },
                  { lbl: 'GUNCEL', val: `${p.guncel_fiyat?.toFixed(2)}`, color: colors.primary },
                  { lbl: 'STOP', val: `${p.stop_fiyat?.toFixed(2)}`, color: colors.red },
                  { lbl: 'HEDEF', val: `${p.hedef_fiyat?.toFixed(2)}`, color: colors.green },
                ].map((f, i) => (
                  <View key={i} style={styles.fiyatItem}>
                    <Text style={styles.fiyatLbl}>{f.lbl}</Text>
                    <Text style={[styles.fiyatVal, f.color && { color: f.color }]}>{f.val}</Text>
                  </View>
                ))}
              </View>

              {/* K/Z */}
              <View style={[styles.kzBar, { backgroundColor: kzPos ? colors.greenDim : colors.redDim }]}>
                <Text style={[styles.kzMain, { color: kzPos ? colors.green : colors.red }]}>
                  {kzPos ? '+' : ''}{p.kaz_kayip_tl?.toFixed(2)} TL
                </Text>
                <Text style={[styles.kzPct, { color: kzPos ? colors.green : colors.red }]}>
                  {kzPos ? '+' : ''}{p.kaz_kayip_pct?.toFixed(2)}%
                </Text>
              </View>

              {(p.gerekceler || []).map((g, i) => (
                <Text key={i} style={styles.gerekce}>{g}</Text>
              ))}

              {p.durum === 'acik' && (
                <TouchableOpacity
                  style={styles.kapatBtn}
                  onPress={() => { setKapatModal(p); setCikisFiyat(''); }}
                >
                  <Text style={styles.kapatBtnText}>POZISYONU KAPAT</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Kapat Modal */}
      <Modal visible={!!kapatModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.modalTitle}>Pozisyonu Kapat</Text>
            <Text style={styles.modalSub}>{kapatModal?.sembol} / {kapatModal?.adet} adet</Text>
            <Text style={styles.inputLabel}>CIKIS FIYATI (bos = anlik fiyat)</Text>
            <TextInput
              style={styles.input}
              value={cikisFiyat}
              onChangeText={setCikisFiyat}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setKapatModal(null)}>
                <Text style={styles.cancelText}>IPTAL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleKapat} disabled={kapatiyor}>
                {kapatiyor
                  ? <ActivityIndicator color={colors.white} />
                  : <Text style={styles.confirmText}>KAPAT</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg, gap: 8 },
  emptyIcon: { fontSize: 28, color: colors.textMuted, marginBottom: 8, fontWeight: '300' },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  emptySub: { fontSize: 12, color: colors.textMuted },

  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  headerLabel: { fontSize: 9, color: colors.textSecondary, letterSpacing: 2, fontWeight: '700' },
  headerTitle: { fontSize: 30, fontWeight: '900', color: colors.white, letterSpacing: -0.5, marginTop: 4 },
  headerSub: { fontSize: 11, color: colors.textMuted, marginTop: 4 },

  alertBanner: {
    backgroundColor: colors.redDim,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.red,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  alertTitle: { fontSize: 9, color: colors.red, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  alertText: { color: colors.red, fontSize: 13 },

  summaryCard: {
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
  },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryVal: { fontSize: 15, fontWeight: '800', color: colors.white },
  summaryLbl: { fontSize: 8, color: colors.textSecondary, letterSpacing: 1.5, marginTop: 4 },

  pozCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  pozTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  pozSembol: { fontSize: 20, fontWeight: '900', color: colors.white, letterSpacing: 0.5 },
  pozDurum: { fontSize: 10, color: colors.textSecondary, marginTop: 3, letterSpacing: 1 },
  tavBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  tavText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  fiyatGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  fiyatItem: { alignItems: 'center' },
  fiyatLbl: { fontSize: 8, color: colors.textSecondary, letterSpacing: 1, marginBottom: 4 },
  fiyatVal: { fontSize: 13, fontWeight: '700', color: colors.white },

  kzBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: 10,
  },
  kzMain: { fontSize: 16, fontWeight: '800' },
  kzPct: { fontSize: 14, fontWeight: '700' },

  gerekce: { fontSize: 12, color: colors.textSecondary, marginBottom: 3, lineHeight: 18 },

  kapatBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  kapatBtnText: { color: colors.textSecondary, fontWeight: '700', fontSize: 11, letterSpacing: 1.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#111111',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.white, marginBottom: 4 },
  modalSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 24 },
  inputLabel: { fontSize: 9, color: colors.textSecondary, letterSpacing: 2, marginBottom: 8 },
  input: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  modalBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: { color: colors.textSecondary, fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  confirmBtn: {
    flex: 2,
    backgroundColor: colors.red,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: { color: colors.white, fontWeight: '800', fontSize: 13, letterSpacing: 1.5 },
});