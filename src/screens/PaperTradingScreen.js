import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  paperAc, paperPozisyonlar, paperHepsiGuncelle,
  paperIstatistik, paperKapat, paperBacktest,
} from '../api/client';
import { colors, spacing, radius } from '../theme';
import AthenaModal from '../components/AthenaModal';

const TABS = ['POZİSYONLAR', 'YENİ İŞLEM', 'BACKTEST', 'İSTATİSTİK'];
const emptyModal = { visible: false, title: '', message: '', icon: '', buttons: [] };

export default function PaperTradingScreen({ onClose }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState(0);
  const [modal, setModal] = useState(emptyModal);

  const closeModal = () => setModal(emptyModal);
  const showModal = (title, message, icon, buttons) =>
    setModal({ visible: true, title, message, icon, buttons });

  // ── Tab 0: Pozisyonlar ──────────────────────────────────────────────────
  const [pozisyonlar, setPozisyonlar] = useState([]);
  const [pozLoading, setPozLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [guncelleniyor, setGuncelleniyor] = useState(false);
  const [kapatModal, setKapatModal] = useState(null);
  const [kapatFiyat, setKapatFiyat] = useState('');
  const [kapatiyor, setKapatiyor] = useState(false);

  // ── Tab 1: Yeni İşlem ───────────────────────────────────────────────────
  const [sembol, setSembol] = useState('');
  const [butce, setButce] = useState('');
  const [stopPct, setStopPct] = useState('7');
  const [hedefPct, setHedefPct] = useState('15');
  const [aciliyor, setAciliyor] = useState(false);

  // ── Tab 2: Backtest ─────────────────────────────────────────────────────
  const [btSembol, setBtSembol] = useState('');
  const [btStop, setBtStop] = useState('7');
  const [btHedef, setBtHedef] = useState('15');
  const [btPeriod, setBtPeriod] = useState('1y');
  const [btLoading, setBtLoading] = useState(false);
  const [btSonuc, setBtSonuc] = useState(null);

  // ── Tab 3: İstatistik ───────────────────────────────────────────────────
  const [istat, setIstat] = useState(null);
  const [istatLoading, setIstatLoading] = useState(false);

  const fetchPozisyonlar = useCallback(async () => {
    try {
      const res = await paperPozisyonlar('hepsi');
      setPozisyonlar(res.data.pozisyonlar || []);
    } catch { }
    setPozLoading(false);
    setRefreshing(false);
  }, []);

  const fetchIstatistik = useCallback(async () => {
    setIstatLoading(true);
    try {
      const res = await paperIstatistik();
      setIstat(res.data);
    } catch { }
    setIstatLoading(false);
  }, []);

  useEffect(() => { fetchPozisyonlar(); }, []);
  useEffect(() => { if (tab === 3) fetchIstatistik(); }, [tab]);

  const handleGuncelle = async () => {
    setGuncelleniyor(true);
    try {
      const res = await paperHepsiGuncelle();
      const tetik = res.data.tetiklenenler || [];
      fetchPozisyonlar();
      showModal(
        tetik.length > 0 ? '🔔 Güncelleme' : '✅ Kontrol Edildi',
        tetik.length > 0 ? tetik.join('\n') : 'Tüm pozisyonlar kontrol edildi. Tetiklenen yok.',
        tetik.length > 0 ? '🔔' : '✅',
        [{ text: 'Tamam', style: 'confirm', onPress: closeModal }]
      );
    } catch (e) {
      showModal('Hata', e.message, '❌', [{ text: 'Tamam', style: 'primary', onPress: closeModal }]);
    }
    setGuncelleniyor(false);
  };

  const handleAc = async () => {
    if (!sembol.trim()) {
      return showModal('Hata', 'Hisse sembolü girin (örn: THYAO)', '⚠️',
        [{ text: 'Tamam', style: 'primary', onPress: closeModal }]);
    }
    if (!butce || parseFloat(butce) <= 0) {
      return showModal('Hata', 'Geçerli bir bütçe girin', '⚠️',
        [{ text: 'Tamam', style: 'primary', onPress: closeModal }]);
    }
    setAciliyor(true);
    try {
      const res = await paperAc({
        sembol: sembol.toUpperCase().trim(),
        sanal_butce: parseFloat(butce),
        strateji: 'kisa',
        stop_pct: parseFloat(stopPct) || 7,
        hedef_pct: parseFloat(hedefPct) || 15,
      });
      const poz = res.data.pozisyon;
      setSembol(''); setButce('');
      fetchPozisyonlar();
      setTab(0);
      showModal(
        '✅ Pozisyon Açıldı',
        `${poz.sembol} — ${poz.giris_fiyat} TL\nStop: ${poz.stop_fiyat?.toFixed(2)} TL\nHedef: ${poz.hedef_fiyat?.toFixed(2)} TL\n\nSinyal: ${poz.giris_sinyali}`,
        '📊',
        [{ text: 'Harika!', style: 'confirm', onPress: closeModal }]
      );
    } catch (e) {
      showModal('Hata', e?.response?.data?.error || e.message, '❌',
        [{ text: 'Tamam', style: 'primary', onPress: closeModal }]);
    }
    setAciliyor(false);
  };

  const handleKapat = async () => {
    if (!kapatModal) return;
    setKapatiyor(true);
    try {
      const body = kapatFiyat ? { fiyat: parseFloat(kapatFiyat) } : {};
      const res = await paperKapat(kapatModal.id, body);
      setKapatModal(null); setKapatFiyat('');
      fetchPozisyonlar();
      const poz = res.data.pozisyon;
      const kz = parseFloat(poz?.kaz_kayip_tl || 0);
      showModal(
        kz >= 0 ? '💰 Kapatıldı — Kâr!' : '📉 Kapatıldı — Zarar',
        `${poz?.sembol}\nGiriş: ${poz?.giris_fiyat} TL → Çıkış: ${poz?.cikis_fiyat} TL\nSonuç: ${kz >= 0 ? '+' : ''}${kz.toFixed(2)} TL (${parseFloat(poz?.kaz_kayip_pct || 0).toFixed(2)}%)`,
        kz >= 0 ? '💰' : '📉',
        [{ text: 'Tamam', style: 'confirm', onPress: closeModal }]
      );
    } catch (e) {
      showModal('Hata', e.message, '❌', [{ text: 'Tamam', style: 'primary', onPress: closeModal }]);
    }
    setKapatiyor(false);
  };

  const handleBacktest = async () => {
    if (!btSembol.trim()) {
      return showModal('Hata', 'Sembol girin', '⚠️',
        [{ text: 'Tamam', style: 'primary', onPress: closeModal }]);
    }
    setBtLoading(true); setBtSonuc(null);
    try {
      const res = await paperBacktest({
        sembol: btSembol.toUpperCase().trim(),
        stop_pct: parseFloat(btStop) || 7,
        hedef_pct: parseFloat(btHedef) || 15,
        period: btPeriod,
      });
      setBtSonuc(res.data);
    } catch (e) {
      showModal('Hata', e?.response?.data?.error || e.message, '❌',
        [{ text: 'Tamam', style: 'primary', onPress: closeModal }]);
    }
    setBtLoading(false);
  };

  const acikPoz = pozisyonlar.filter(p => p.durum === 'acik');
  const kapaliPoz = pozisyonlar.filter(p => p.durum !== 'acik');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>SANAL İŞLEM</Text>
          <Text style={styles.headerTitle}>Paper Trading</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={i}
            style={[styles.tabBtn, tab === i && styles.tabBtnActive]}
            onPress={() => setTab(i)}>
            <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── TAB 0: Pozisyonlar ── */}
      {tab === 0 && (
        <ScrollView showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchPozisyonlar(); }}
            tintColor={colors.primary} />}>

          <TouchableOpacity style={styles.guncelleBtn} onPress={handleGuncelle} disabled={guncelleniyor}>
            {guncelleniyor
              ? <ActivityIndicator color={colors.primary} size="small" />
              : <Text style={styles.guncelleBtnText}>🔄 Stop/Hedef Kontrol Et</Text>}
          </TouchableOpacity>

          {pozLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : pozisyonlar.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>Henüz işlem yok</Text>
              <Text style={styles.emptySub}>Yeni İşlem sekmesinden başla</Text>
            </View>
          ) : (
            <>
              {acikPoz.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>AÇık ({acikPoz.length})</Text>
                  {acikPoz.map(p => {
                    const kzPos = (p.anlık_kz_tl || 0) >= 0;
                    return (
                      <View key={p.id} style={styles.pozCard}>
                        <View style={styles.pozTop}>
                          <View>
                            <Text style={styles.pozSembol}>{p.sembol}</Text>
                            <Text style={styles.pozMeta}>
                              {p.adet?.toFixed(2)} adet · {p.sanal_butce} TL sanal
                            </Text>
                          </View>
                          <View style={[styles.kzBadge,
                            { backgroundColor: kzPos ? colors.greenDim : colors.redDim }]}>
                            <Text style={[styles.kzBadgeText,
                              { color: kzPos ? colors.green : colors.red }]}>
                              {kzPos ? '+' : ''}{(p.anlık_kz_tl || 0).toFixed(2)} TL
                            </Text>
                            <Text style={[styles.kzPct,
                              { color: kzPos ? colors.green : colors.red }]}>
                              {(p.anlık_kz_pct || 0).toFixed(2)}%
                            </Text>
                          </View>
                        </View>

                        <View style={styles.fiyatRow}>
                          {[
                            { l: 'GİRİŞ', v: p.giris_fiyat?.toFixed(2) },
                            { l: 'GÜNCEL', v: p.guncel_fiyat?.toFixed(2), c: colors.primary },
                            { l: 'STOP', v: p.stop_fiyat?.toFixed(2), c: colors.red },
                            { l: 'HEDEF', v: p.hedef_fiyat?.toFixed(2), c: colors.green },
                          ].map((f, i) => (
                            <View key={i} style={styles.fiyatItem}>
                              <Text style={styles.fiyatLbl}>{f.l}</Text>
                              <Text style={[styles.fiyatVal, f.c && { color: f.c }]}>{f.v}</Text>
                            </View>
                          ))}
                        </View>

                        {p.not_alani ? (
                          <Text style={styles.notText} numberOfLines={2}>{p.not_alani}</Text>
                        ) : null}

                        <TouchableOpacity style={styles.kapatBtn}
                          onPress={() => { setKapatModal(p); setKapatFiyat(''); }}>
                          <Text style={styles.kapatBtnText}>POZISYONU KAPAT</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </>
              )}

              {kapaliPoz.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>KAPALI ({kapaliPoz.length})</Text>
                  {kapaliPoz.map(p => {
                    const kzPos = (p.kaz_kayip_tl || 0) >= 0;
                    return (
                      <View key={p.id} style={[styles.pozCard, { opacity: 0.75 }]}>
                        <View style={styles.pozTop}>
                          <View>
                            <Text style={styles.pozSembol}>{p.sembol}</Text>
                            <Text style={styles.pozMeta}>
                              {p.durum === 'hedef' ? '🎯 Hedef' : p.durum === 'stop' ? '⛔ Stop' : '✋ Manuel'}
                              {p.cikis_tarihi ? ` · ${p.cikis_tarihi.slice(0, 10)}` : ''}
                            </Text>
                          </View>
                          <View style={[styles.kzBadge,
                            { backgroundColor: kzPos ? colors.greenDim : colors.redDim }]}>
                            <Text style={[styles.kzBadgeText,
                              { color: kzPos ? colors.green : colors.red }]}>
                              {kzPos ? '+' : ''}{(p.kaz_kayip_tl || 0).toFixed(2)} TL
                            </Text>
                            <Text style={[styles.kzPct,
                              { color: kzPos ? colors.green : colors.red }]}>
                              {(p.kaz_kayip_pct || 0).toFixed(2)}%
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.pozMeta}>
                          Giriş: {p.giris_fiyat} → Çıkış: {p.cikis_fiyat || '-'} TL
                        </Text>
                      </View>
                    );
                  })}
                </>
              )}
            </>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* ── TAB 1: Yeni İşlem ── */}
      {tab === 1 && (
        <ScrollView showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.lg }}
          keyboardShouldPersistTaps="handled">

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              🔬 Sanal işlem — gerçek para kullanılmaz.{'\n'}
              Athena teknik analiz yapar, gerçek fiyatla girer.{'\n'}
              Stop veya hedefe ulaşınca otomatik kapanır.
            </Text>
          </View>

          <Text style={styles.fieldLabel}>HİSSE SEMBOLÜ</Text>
          <TextInput style={styles.input} value={sembol}
            onChangeText={t => setSembol(t.toUpperCase())}
            placeholder="THYAO" placeholderTextColor={colors.textMuted}
            autoCapitalize="characters" />

          <Text style={styles.fieldLabel}>SANAL BÜTÇE (TL)</Text>
          <TextInput style={styles.input} value={butce}
            onChangeText={setButce} placeholder="1000"
            placeholderTextColor={colors.textMuted} keyboardType="numeric" />

          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>STOP %</Text>
              <TextInput style={styles.input} value={stopPct}
                onChangeText={setStopPct} keyboardType="numeric" />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>HEDEF %</Text>
              <TextInput style={styles.input} value={hedefPct}
                onChangeText={setHedefPct} keyboardType="numeric" />
            </View>
          </View>

          <TouchableOpacity style={[styles.mainBtn, aciliyor && { opacity: 0.7 }]}
            onPress={handleAc} disabled={aciliyor}>
            {aciliyor
              ? <ActivityIndicator color={colors.black} />
              : <Text style={styles.mainBtnText}>📊 SANAL POZİSYON AÇ</Text>}
          </TouchableOpacity>
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* ── TAB 2: Backtest ── */}
      {tab === 2 && (
        <ScrollView showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.lg }}
          keyboardShouldPersistTaps="handled">

          <Text style={styles.infoText2}>
            Geçmiş veride Athena'nın sinyali kaç kez doğru çalıştı?{'\n'}
            AL sinyallerini simüle et, stop/hedef ile çık.
          </Text>

          <Text style={styles.fieldLabel}>HİSSE SEMBOLÜ</Text>
          <TextInput style={styles.input} value={btSembol}
            onChangeText={t => setBtSembol(t.toUpperCase())}
            placeholder="KRDMD" placeholderTextColor={colors.textMuted}
            autoCapitalize="characters" />

          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>STOP %</Text>
              <TextInput style={styles.input} value={btStop}
                onChangeText={setBtStop} keyboardType="numeric" />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>HEDEF %</Text>
              <TextInput style={styles.input} value={btHedef}
                onChangeText={setBtHedef} keyboardType="numeric" />
            </View>
          </View>

          <Text style={styles.fieldLabel}>DÖNEM</Text>
          <View style={styles.periodRow}>
            {[['6mo', '6 Ay'], ['1y', '1 Yıl'], ['2y', '2 Yıl']].map(([key, label]) => (
              <TouchableOpacity key={key}
                style={[styles.periodBtn, btPeriod === key && styles.periodBtnActive]}
                onPress={() => setBtPeriod(key)}>
                <Text style={[styles.periodText, btPeriod === key && { color: colors.primary }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.mainBtn, btLoading && { opacity: 0.7 }]}
            onPress={handleBacktest} disabled={btLoading}>
            {btLoading
              ? <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <ActivityIndicator color={colors.black} size="small" />
                  <Text style={styles.mainBtnText}>Hesaplanıyor...</Text>
                </View>
              : <Text style={styles.mainBtnText}>🔬 BACKTEST BAŞLAT</Text>}
          </TouchableOpacity>

          {btSonuc && !btSonuc.error && (
            <View style={styles.btSonucWrap}>
              <Text style={styles.btTitle}>
                {btSonuc.sembol} — {btSonuc.period} Backtest
              </Text>

              <View style={styles.btGrid}>
                {[
                  { l: 'İşlem', v: btSonuc.ozet.toplam_islem },
                  { l: 'Kazanan', v: btSonuc.ozet.kazananlar, c: colors.green },
                  { l: 'Kaybeden', v: btSonuc.ozet.kaybedenler, c: colors.red },
                  { l: 'Başarı %', v: `%${btSonuc.ozet.kazanma_orani_pct}`,
                    c: btSonuc.ozet.kazanma_orani_pct >= 50 ? colors.green : colors.red },
                  { l: 'Ort K/Z', v: `${btSonuc.ozet.ortalama_kz_pct > 0 ? '+' : ''}${btSonuc.ozet.ortalama_kz_pct}%`,
                    c: btSonuc.ozet.ortalama_kz_pct >= 0 ? colors.green : colors.red },
                  { l: '1000 TL →', v: `${btSonuc.ozet.bitis_tl} TL`,
                    c: btSonuc.ozet.bitis_tl >= 1000 ? colors.green : colors.red },
                  { l: 'Stop', v: btSonuc.ozet.stop_tetiklenen, c: colors.red },
                  { l: 'Hedef', v: btSonuc.ozet.hedef_tutan, c: colors.green },
                ].map((item, i) => (
                  <View key={i} style={styles.btStatCard}>
                    <Text style={[styles.btStatVal, item.c && { color: item.c }]}>
                      {item.v}
                    </Text>
                    <Text style={styles.btStatLbl}>{item.l}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.btWarning}>{btSonuc.uyari}</Text>
            </View>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* ── TAB 3: İstatistik ── */}
      {tab === 3 && (
        <ScrollView showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.lg }}>
          {istatLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : istat ? (
            <>
              <View style={styles.istatGrid}>
                {[
                  { l: 'Toplam', v: istat.ozet.toplam_islem },
                  { l: 'Açık', v: istat.ozet.acik_pozisyon },
                  { l: 'Kazanan', v: istat.ozet.kazananlar, c: colors.green },
                  { l: 'Kaybeden', v: istat.ozet.kaybedenler, c: colors.red },
                  { l: 'Başarı %',
                    v: `%${istat.ozet.kazanma_orani_pct}`,
                    c: istat.ozet.kazanma_orani_pct >= 50 ? colors.green : colors.red },
                  { l: 'Ort K/Z',
                    v: `${istat.ozet.ort_kz_pct > 0 ? '+' : ''}${istat.ozet.ort_kz_pct}%`,
                    c: istat.ozet.ort_kz_pct >= 0 ? colors.green : colors.red },
                ].map((item, i) => (
                  <View key={i} style={styles.istatCard}>
                    <Text style={[styles.istatVal, item.c && { color: item.c }]}>{item.v}</Text>
                    <Text style={styles.istatLbl}>{item.l}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.totalCard, {
                borderColor: istat.ozet.toplam_kz_tl >= 0
                  ? colors.green + '40' : colors.red + '40'
              }]}>
                <Text style={styles.totalLabel}>TOPLAM KAPALI K/Z</Text>
                <Text style={[styles.totalVal, {
                  color: istat.ozet.toplam_kz_tl >= 0 ? colors.green : colors.red
                }]}>
                  {istat.ozet.toplam_kz_tl >= 0 ? '+' : ''}{istat.ozet.toplam_kz_tl} TL
                </Text>
                {istat.ozet.acik_anlık_kz_tl !== 0 && (
                  <Text style={[styles.totalSub, {
                    color: istat.ozet.acik_anlık_kz_tl >= 0 ? colors.green : colors.red
                  }]}>
                    Açık pozisyonlar: {istat.ozet.acik_anlık_kz_tl >= 0 ? '+' : ''}
                    {istat.ozet.acik_anlık_kz_tl} TL (anlık)
                  </Text>
                )}
              </View>

              {istat.en_iyi_islem && (
                <View style={[styles.enCard, { borderColor: colors.green + '40' }]}>
                  <Text style={styles.enLabel}>🏆 EN İYİ İŞLEM</Text>
                  <Text style={styles.enSembol}>{istat.en_iyi_islem.sembol}</Text>
                  <Text style={[styles.enVal, { color: colors.green }]}>
                    +{istat.en_iyi_islem.kz_pct}% · +{istat.en_iyi_islem.kz_tl} TL
                  </Text>
                </View>
              )}

              {istat.en_kotu_islem && (
                <View style={[styles.enCard, { borderColor: colors.red + '40' }]}>
                  <Text style={styles.enLabel}>📉 EN KÖTÜ İŞLEM</Text>
                  <Text style={styles.enSembol}>{istat.en_kotu_islem.sembol}</Text>
                  <Text style={[styles.enVal, { color: colors.red }]}>
                    {istat.en_kotu_islem.kz_pct}% · {istat.en_kotu_islem.kz_tl} TL
                  </Text>
                </View>
              )}

              <Text style={styles.btWarning}>{istat.uyari}</Text>
            </>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>İstatistik yok</Text>
              <Text style={styles.emptySub}>Önce işlem aç ve kapat</Text>
            </View>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* Kapat Modal (Bottom Sheet) */}
      <Modal visible={!!kapatModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.modalTitle}>Pozisyonu Kapat</Text>
            <Text style={styles.modalSub}>{kapatModal?.sembol} — sanal işlem</Text>
            <Text style={styles.inputLabel}>ÇIKIŞ FİYATI (boş = anlık fiyat)</Text>
            <TextInput style={styles.modalInput} value={kapatFiyat}
              onChangeText={setKapatFiyat} keyboardType="numeric"
              placeholder="0.00" placeholderTextColor={colors.textMuted} />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setKapatModal(null)}>
                <Text style={styles.cancelText}>İPTAL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleKapat} disabled={kapatiyor}>
                {kapatiyor
                  ? <ActivityIndicator color={colors.white} />
                  : <Text style={styles.confirmText}>KAPAT</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AthenaModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        icon={modal.icon}
        buttons={modal.buttons}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerLabel: { fontSize: 9, color: colors.textSecondary, letterSpacing: 2, fontWeight: '700' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: colors.white, marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 16, color: colors.textSecondary, fontWeight: '700' },
  tabScroll: { maxHeight: 44, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabContent: { paddingHorizontal: spacing.md, paddingVertical: 8, gap: 8, alignItems: 'center' },
  tabBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
  },
  tabBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  tabText: { fontSize: 10, color: colors.textSecondary, fontWeight: '700', letterSpacing: 0.5 },
  tabTextActive: { color: colors.primary },
  guncelleBtn: {
    margin: spacing.md, padding: spacing.md, backgroundColor: colors.bgCard,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  guncelleBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 16, color: colors.white, fontWeight: '700' },
  emptySub: { fontSize: 12, color: colors.textMuted },
  sectionLabel: {
    fontSize: 9, color: colors.textSecondary, letterSpacing: 2,
    fontWeight: '700', paddingHorizontal: spacing.lg, marginTop: 12, marginBottom: 8,
  },
  pozCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, marginHorizontal: spacing.md,
    marginBottom: spacing.sm, padding: spacing.md,
  },
  pozTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  pozSembol: { fontSize: 18, fontWeight: '900', color: colors.white },
  pozMeta: { fontSize: 10, color: colors.textSecondary, marginTop: 3 },
  kzBadge: { borderRadius: radius.md, padding: 8, alignItems: 'flex-end', minWidth: 80 },
  kzBadgeText: { fontSize: 14, fontWeight: '800' },
  kzPct: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  fiyatRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  fiyatItem: { alignItems: 'center' },
  fiyatLbl: { fontSize: 8, color: colors.textSecondary, letterSpacing: 1, marginBottom: 3 },
  fiyatVal: { fontSize: 12, fontWeight: '700', color: colors.white },
  notText: { fontSize: 11, color: colors.textSecondary, marginBottom: 8, lineHeight: 16 },
  kapatBtn: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingVertical: 10, alignItems: 'center', marginTop: 8,
  },
  kapatBtnText: { color: colors.textSecondary, fontWeight: '700', fontSize: 11, letterSpacing: 1.5 },
  infoBox: {
    backgroundColor: colors.primaryDim, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.primaryBorder, padding: spacing.md, marginBottom: spacing.lg,
  },
  infoText: { fontSize: 12, color: colors.primary, lineHeight: 18 },
  infoText2: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.lg },
  fieldLabel: { fontSize: 9, color: colors.textSecondary, letterSpacing: 2, fontWeight: '700', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 14,
    color: colors.white, fontSize: 18, fontWeight: '700',
  },
  rowInputs: { flexDirection: 'row' },
  mainBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 16, alignItems: 'center', marginTop: 24,
  },
  mainBtnText: { color: colors.black, fontWeight: '900', fontSize: 14, letterSpacing: 1.5 },
  periodRow: { flexDirection: 'row', gap: 8 },
  periodBtn: {
    flex: 1, paddingVertical: 12, borderRadius: radius.md,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  periodBtnActive: { borderColor: colors.primary },
  periodText: { fontSize: 13, color: colors.textSecondary, fontWeight: '700' },
  btSonucWrap: {
    marginTop: 20, backgroundColor: colors.bgCard, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  btTitle: { fontSize: 14, color: colors.white, fontWeight: '800', marginBottom: 16 },
  btGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  btStatCard: {
    backgroundColor: colors.bg, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, padding: 10, alignItems: 'center', minWidth: '22%',
  },
  btStatVal: { fontSize: 15, fontWeight: '800', color: colors.white },
  btStatLbl: { fontSize: 8, color: colors.textSecondary, letterSpacing: 1, marginTop: 3 },
  btWarning: { fontSize: 10, color: colors.textMuted, lineHeight: 15, marginTop: 8 },
  istatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  istatCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, padding: 14, alignItems: 'center', minWidth: '30%', flex: 1,
  },
  istatVal: { fontSize: 20, fontWeight: '800', color: colors.white },
  istatLbl: { fontSize: 9, color: colors.textSecondary, letterSpacing: 1, marginTop: 4 },
  totalCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1,
    padding: 20, marginBottom: 12, alignItems: 'center',
  },
  totalLabel: { fontSize: 9, color: colors.textSecondary, letterSpacing: 2, fontWeight: '700', marginBottom: 6 },
  totalVal: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  totalSub: { fontSize: 12, marginTop: 6 },
  enCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1,
    padding: spacing.md, marginBottom: 10,
  },
  enLabel: { fontSize: 9, color: colors.textSecondary, letterSpacing: 2, fontWeight: '700', marginBottom: 6 },
  enSembol: { fontSize: 18, fontWeight: '900', color: colors.white },
  enVal: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#111111', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    borderTopWidth: 1, borderColor: colors.border, padding: spacing.lg,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.white, marginBottom: 4 },
  modalSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 20 },
  inputLabel: { fontSize: 9, color: colors.textSecondary, letterSpacing: 2, marginBottom: 8 },
  modalInput: {
    backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: 14, color: colors.white, fontSize: 18, fontWeight: '700', marginBottom: 20,
  },
  modalBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingVertical: 14, alignItems: 'center',
  },
  cancelText: { color: colors.textSecondary, fontWeight: '700', fontSize: 12 },
  confirmBtn: { flex: 2, backgroundColor: colors.red, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  confirmText: { color: colors.white, fontWeight: '800', fontSize: 13 },
});