import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { olusturButce, pozisyonAlindi } from '../api/client';
import { colors, spacing, radius } from '../theme';

const RISK_OPTIONS = [
  { key: 'dusuk', label: 'DÜŞÜK', sub: 'Stop -%4  /  Hedef +%8', desc: 'Güvenli, az risk' },
  { key: 'orta',  label: 'ORTA',  sub: 'Stop -%7  /  Hedef +%15', desc: 'Dengeli strateji' },
  { key: 'yuksek',label: 'YÜKSEK',sub: 'Stop -%10  /  Hedef +%25', desc: 'Agresif, yüksek kazanç' },
];

const LOADING_MESSAGES = [
  '80 hisse taranıyor...',
  'Teknik analiz hesaplanıyor...',
  'RSI, MACD, Bollinger hesaplanıyor...',
  'En iyi fırsatlar seçiliyor...',
  'Athena analizi yazılıyor...',
];

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const [butce, setButce] = useState('');
  const [risk, setRisk] = useState('orta');
  const [loading, setLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [sonuc, setSonuc] = useState(null);
  const [alindiIds, setAlindiIds] = useState([]);

  const handleOlustur = async () => {
    if (!butce || isNaN(parseFloat(butce))) {
      Alert.alert('Geçersiz Bütçe', 'Lütfen geçerli bir TL miktarı girin.');
      return;
    }
    setLoading(true);
    setSonuc(null);
    setAlindiIds([]);
    setLoadingMsgIdx(0);

    // Her 12 saniyede mesajı değiştir
    let idx = 0;
    const msgInterval = setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGES.length;
      setLoadingMsgIdx(idx);
    }, 12000);

    try {
      const res = await olusturButce({
        toplam_butce: parseFloat(butce),
        risk_profili: risk,
        // max_hisse_sayisi backend tarafından otomatik hesaplanıyor
      });
      setSonuc(res.data);
    } catch (e) {
      Alert.alert('Hata', e.message || 'Bir sorun oluştu.');
    } finally {
      clearInterval(msgInterval);
      setLoading(false);
      setLoadingMsgIdx(0);
    }
  };

  const handleAlindi = async (poz) => {
    try {
      await pozisyonAlindi(poz.id);
      setAlindiIds((p) => [...p, poz.id]);
      Alert.alert(
        '✅ Pozisyon Açıldı',
        `${poz.sembol} portföyünüze eklendi.\nStop: ${poz.stop_fiyat?.toFixed(2)} TL\nHedef: ${poz.hedef_fiyat?.toFixed(2)} TL`
      );
    } catch (e) {
      Alert.alert('Hata', e.message);
    }
  };

  // Bütçeye göre kaç hisse alınacağını göster
  const getHisseSayisi = () => {
    const b = parseFloat(butce);
    if (!b) return null;
    if (b < 1000) return 1;
    if (b < 3000) return 2;
    if (b < 10000) return 3;
    return 5;
  };
  const hisseSayisi = getHisseSayisi();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 20 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.headerLabel}>PLAN</Text>
        <Text style={styles.headerTitle}>Bütçe{'\n'}Oluştur</Text>
      </View>

      {/* Bütçe Input */}
      <View style={styles.block}>
        <Text style={styles.fieldLabel}>YATIRIM BÜTÇESİ (TL)</Text>
        <TextInput
          style={styles.input}
          value={butce}
          onChangeText={setButce}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
        />
        {hisseSayisi && (
          <Text style={styles.hisseHint}>
            Athena bu bütçe için <Text style={{ color: colors.primary }}>{hisseSayisi} hisse</Text> seçecek
          </Text>
        )}
      </View>

      {/* Risk */}
      <View style={styles.block}>
        <Text style={styles.fieldLabel}>RİSK PROFİLİ</Text>
        <View style={styles.riskRow}>
          {RISK_OPTIONS.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={[styles.riskBtn, risk === r.key && styles.riskBtnActive]}
              onPress={() => setRisk(r.key)}
            >
              <Text style={[styles.riskLabel, risk === r.key && { color: colors.primary }]}>{r.label}</Text>
              <Text style={styles.riskSub}>{r.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.mainBtn, loading && { opacity: 0.7 }]}
        onPress={handleOlustur}
        disabled={loading}
      >
        {loading ? (
          <View style={{ alignItems: 'center', gap: 8 }}>
            <ActivityIndicator color={colors.black} />
            <Text style={styles.mainBtnSub}>{LOADING_MESSAGES[loadingMsgIdx]}</Text>
            <Text style={[styles.mainBtnSub, { fontSize: 10, opacity: 0.7 }]}>~1 dakika sürebilir</Text>
          </View>
        ) : (
          <Text style={styles.mainBtnText}>TARAMA BAŞLAT</Text>
        )}
      </TouchableOpacity>

      {/* Hata */}
      {sonuc?.error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>SİNYAL BULUNAMADI</Text>
          <Text style={styles.errorText}>{sonuc.error}</Text>
          <Text style={styles.errorSub}>Taranan: {sonuc.taranan} hisse</Text>
        </View>
      )}

      {/* Sonuç */}
      {sonuc && !sonuc.error && (
        <View style={styles.resultWrap}>
          <View style={styles.resultSummary}>
            <Text style={styles.resultLabel}>TARAMA TAMAMLANDI</Text>
            <Text style={styles.resultDesc}>
              {sonuc.taranan_hisse} hisse tarandı, {sonuc.bulunan_aday} aday bulundu
            </Text>
            <View style={styles.budgetRow}>
              <View style={styles.budgetItem}>
                <Text style={styles.budgetVal}>{sonuc.kullanilan_butce?.toFixed(0)} TL</Text>
                <Text style={styles.budgetLbl}>KULLANILAN</Text>
              </View>
              <View style={styles.budgetSep} />
              <View style={styles.budgetItem}>
                <Text style={[styles.budgetVal, { color: colors.green }]}>{sonuc.kalan_nakit?.toFixed(0)} TL</Text>
                <Text style={styles.budgetLbl}>KALAN NAKİT</Text>
              </View>
            </View>
          </View>

          {sonuc.athena_analiz && !sonuc.athena_analiz.includes('alınamadı') && (
            <View style={styles.analizBox}>
              <Text style={styles.analizLabel}>ATHENA ANALİZ</Text>
              <Text style={styles.analizText}>{sonuc.athena_analiz}</Text>
            </View>
          )}

          {(sonuc.pozisyonlar || []).map((p) => {
            const alindi = alindiIds.includes(p.id);
            const sColor = p.sinyal?.includes('AL') ? colors.green : colors.red;
            return (
              <View key={p.id} style={styles.pozCard}>
                <View style={styles.pozTop}>
                  <Text style={styles.pozSembol}>{p.sembol}</Text>
                  <View style={[styles.signalBadge, { backgroundColor: sColor + '18', borderColor: sColor + '40' }]}>
                    <Text style={[styles.signalText, { color: sColor }]}>{p.sinyal}</Text>
                  </View>
                </View>

                <View style={styles.pozGrid}>
                  <View style={styles.pozGridItem}>
                    <Text style={styles.pozGridVal}>{p.giris_fiyat?.toFixed(2)}</Text>
                    <Text style={styles.pozGridLbl}>GİRİŞ TL</Text>
                  </View>
                  <View style={styles.pozGridItem}>
                    <Text style={[styles.pozGridVal, { color: colors.red }]}>{p.stop_fiyat?.toFixed(2)}</Text>
                    <Text style={styles.pozGridLbl}>STOP -%{p.stop_pct}</Text>
                  </View>
                  <View style={styles.pozGridItem}>
                    <Text style={[styles.pozGridVal, { color: colors.green }]}>{p.hedef_fiyat?.toFixed(2)}</Text>
                    <Text style={styles.pozGridLbl}>HEDEF +%{p.hedef_pct}</Text>
                  </View>
                  <View style={styles.pozGridItem}>
                    <Text style={styles.pozGridVal}>{p.adet}</Text>
                    <Text style={styles.pozGridLbl}>ADET</Text>
                  </View>
                </View>

                <View style={styles.pozMeta}>
                  <Text style={styles.pozMetaText}>RSI {p.rsi?.toFixed(1)}</Text>
                  <Text style={styles.pozMetaText}>{p.maliyet_tl?.toFixed(0)} TL maliyet</Text>
                  <Text style={styles.pozMetaText}>Skor {p.skor}/10</Text>
                </View>

                {(p.gerekceler || []).map((g, i) => (
                  <Text key={i} style={styles.gerekce}>{g}</Text>
                ))}

                <TouchableOpacity
                  style={[styles.alBtn, alindi && styles.alBtnDone]}
                  onPress={() => !alindi && handleAlindi(p)}
                  disabled={alindi}
                >
                  <Text style={[styles.alBtnText, alindi && { color: colors.green }]}>
                    {alindi ? '✅ POZİSYON AÇILDI' : 'ALDIM →'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  headerLabel: { fontSize: 9, color: colors.textSecondary, letterSpacing: 2, fontWeight: '700' },
  headerTitle: { fontSize: 30, fontWeight: '900', color: colors.white, letterSpacing: -0.5, marginTop: 4, lineHeight: 36 },
  block: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  fieldLabel: { fontSize: 9, color: colors.textSecondary, letterSpacing: 2, fontWeight: '700', marginBottom: 10 },
  input: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingVertical: 16, paddingHorizontal: 16,
    color: colors.white, fontSize: 28, fontWeight: '800',
  },
  hisseHint: { fontSize: 12, color: colors.textSecondary, marginTop: 8 },
  riskRow: { gap: 8 },
  riskBtn: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: 14,
  },
  riskBtnActive: { borderColor: colors.primary },
  riskLabel: { fontSize: 13, fontWeight: '800', color: colors.white, marginBottom: 3, letterSpacing: 1 },
  riskSub: { fontSize: 11, color: colors.textSecondary },
  mainBtn: {
    backgroundColor: colors.primary, marginHorizontal: spacing.lg,
    borderRadius: radius.md, paddingVertical: 18, alignItems: 'center', marginBottom: spacing.lg,
  },
  mainBtnText: { color: colors.black, fontWeight: '900', fontSize: 14, letterSpacing: 2 },
  mainBtnSub: { color: colors.black, fontSize: 12, letterSpacing: 0.5 },
  errorBox: {
    backgroundColor: colors.redDim, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.red, margin: spacing.lg, padding: spacing.md,
  },
  errorTitle: { fontSize: 9, color: colors.red, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  errorText: { fontSize: 13, color: colors.red, lineHeight: 20 },
  errorSub: { fontSize: 11, color: colors.textSecondary, marginTop: 8 },
  resultWrap: { paddingHorizontal: spacing.lg },
  resultSummary: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md,
  },
  resultLabel: { fontSize: 9, color: colors.green, letterSpacing: 2, fontWeight: '700', marginBottom: 6 },
  resultDesc: { fontSize: 13, color: colors.textSecondary, marginBottom: 14 },
  budgetRow: { flexDirection: 'row', alignItems: 'center' },
  budgetItem: { flex: 1, alignItems: 'center' },
  budgetVal: { fontSize: 18, fontWeight: '800', color: colors.white },
  budgetLbl: { fontSize: 9, color: colors.textSecondary, letterSpacing: 1.5, marginTop: 3 },
  budgetSep: { width: 1, height: 30, backgroundColor: colors.border },
  analizBox: {
    backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.primaryBorder, padding: spacing.md, marginBottom: spacing.md,
  },
  analizLabel: { fontSize: 9, color: colors.primary, letterSpacing: 2, fontWeight: '700', marginBottom: 8 },
  analizText: { fontSize: 13, color: colors.textSecondary, lineHeight: 21 },
  pozCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md,
  },
  pozTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  pozSembol: { fontSize: 22, fontWeight: '900', color: colors.white, letterSpacing: 0.5 },
  signalBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  signalText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  pozGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  pozGridItem: { alignItems: 'center' },
  pozGridVal: { fontSize: 15, fontWeight: '800', color: colors.white },
  pozGridLbl: { fontSize: 8, color: colors.textSecondary, letterSpacing: 1, marginTop: 3 },
  pozMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  pozMetaText: { fontSize: 10, color: colors.textSecondary },
  gerekce: { fontSize: 12, color: colors.textSecondary, marginBottom: 3, lineHeight: 18 },
  alBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 13, alignItems: 'center', marginTop: 14,
  },
  alBtnDone: { backgroundColor: colors.greenDim, borderWidth: 1, borderColor: colors.green },
  alBtnText: { color: colors.black, fontWeight: '900', fontSize: 13, letterSpacing: 1.5 },
});