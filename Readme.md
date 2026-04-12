# 🦉 Athena — BIST Yapay Zeka Yatırım Asistanı

> *"Harikalar Diyarı'nın Borsa Sihirbazı"*

Kişisel BIST yatırım asistanı. 80 hisseyi tarar, teknik analiz yapar, al/sat sinyali verir, portföyünü takip eder.

---

## 🏗 Mimari

```
┌─────────────────────┐     ┌──────────────────────────┐
│   React Native Expo │────▶│   Django REST Framework  │
│   (Android APK)     │     │   (Render.com Free)      │
└─────────────────────┘     └──────────┬───────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                   ▼
             yfinance             Groq API           Supabase
          (15dk gecikmeli)    (Llama 3.3 70B)     (PostgreSQL)
```

**Backend:** `xxx`  
**Frontend:** React Native Expo (Android)  
**Dil:** Türkçe

---

## 📱 Ekranlar

| Ekran | Açıklama |
|-------|----------|
| **Ana Sayfa** | BIST30, USD/TRY, Altın, BTC anlık verileri. Portföy özeti. Yükselenler/düşenler. |
| **Bütçe Oluştur** | Bütçe + risk profili gir → Athena 80 hisse tarar → En iyi 2-3 hisseyi önerir + AI analiz. Pull-to-refresh ile sıfırla. |
| **Pozisyonlar** | Açık pozisyonlar (K/Z takibi). Bekleyen öneriler (Al / Sil). 90 sn'de otomatik güncelleme. |
| **Athena Chat** | Groq Llama 3.3 70B ile serbest soru-cevap. Geçmiş bağlamı hatırlar. |
| **Geçmiş** | Kapalı pozisyonların performansı. Kazanma oranı. Toplam K/Z. |

---

## 🔄 Ana İş Akışı

```
1. Bütçe Oluştur ekranına git
2. TL miktarı gir (örn: 3000)
3. Risk profili seç (Düşük / Orta / Yüksek)
4. "TARAMI BAŞLAT" → ~60 saniye bekle
5. Athena 80 hisse tarar, 2-3 hisse önerir
6. Banka'dan gerçekten al
7. "ALDIM" butonuna bas → Athena takibe alır
8. Pozisyonlar ekranı 90 sn'de bir güncellenir
9. Stop veya hedefe ulaşınca uyarı alırsın
10. "POZISYONU KAPAT" → K/Z kaydedilir
```

---

## ⚙️ Risk Profilleri

| Profil | Stop-Loss | Hedef Kâr | Ne zaman? |
|--------|-----------|-----------|-----------|
| **Düşük** | -%4 | +%8 | Güvenli, uzun vadeli |
| **Orta** | -%7 | +%15 | Dengeli swing trading |
| **Yüksek** | -%10 | +%25 | Agresif, kısa vadeli |

---

## 📊 Teknik Analiz Göstergeleri

Athena her hisse için şunları hesaplar:

- **RSI** (14 günlük) — Aşırı alım/satım
- **MACD** (12/26/9) — Momentum ve kesiş sinyalleri
- **Bollinger Bands** (20 gün, 2σ) — Fiyat kanalı
- **EMA 20/50/200** — Trend yönü
- **Stochastic** — Kısa vadeli momentum
- **Williams %R** — Aşırı alım/satım
- **OBV** — Hacim akışı (akıllı para)
- **ATR** — Volatilite ölçümü
- **Mum formasyonları** — Çekiç, doji, asılan adam

**Skor sistemi:** -25 ile +25 arası. ≥6 = GÜÇLÜ_AL, ≥3 = AL, ≤-6 = GÜÇLÜ_SAT

---

## 🧪 Paper Trading (Sanal İşlem)

Gerçek para kullanmadan test et:

```bash
# Sanal pozisyon aç
POST /api/monitor/paper/ac/
{"sembol": "KRDMD", "sanal_butce": 1000, "stop_pct": 7, "hedef_pct": 15}

# Tüm pozisyonları kontrol et (stop/hedef)
POST /api/monitor/paper/hepsi-guncelle/

# Geçmiş backtest
POST /api/monitor/paper/backtest/
{"sembol": "KRDMD", "stop_pct": 7, "hedef_pct": 15, "period": "1y"}

# İstatistik
GET /api/monitor/paper/istatistik/
```

**Backtest Örneği (KRDMD, 1 yıl):**
- Giriş: 24.26 TL (RSI 27.6 — aşırı satım)
- Çıkış: 28.44 TL (8 günde hedef tuttu)
- Sonuç: **+%17.23** ✅

---

## 📡 API Referansı

### Bütçe Yönetimi
```
POST /api/monitor/butce/olustur/          — Piyasa tara, hisse öner
GET  /api/monitor/butce/durum/            — Anlık K/Z durumu
POST /api/monitor/butce/pozisyon/{id}/alindi/  — Pozisyonu aç
POST /api/monitor/butce/pozisyon/{id}/kapat/   — Pozisyonu kapat
DELETE /api/monitor/butce/pozisyon/{id}/sil/   — Öneriyi sil
GET  /api/monitor/butce/gecmis/           — Geçmiş işlemler
```

### Piyasa & Sinyal
```
GET  /api/monitor/market/                 — BIST, döviz, altın, kripto
GET  /api/monitor/scan/results/           — Tüm hisselerin skorları
GET  /api/advisor/signal/{SEMBOL}/        — Tek hisse hızlı sinyal
POST /api/advisor/ask/                    — Athena'ya soru sor
```

### Paper Trading
```
POST /api/monitor/paper/ac/              — Sanal pozisyon aç
GET  /api/monitor/paper/pozisyonlar/     — Pozisyonları listele
POST /api/monitor/paper/hepsi-guncelle/ — Stop/hedef kontrol
GET  /api/monitor/paper/istatistik/     — Performans özeti
POST /api/monitor/paper/backtest/       — Geçmiş simülasyon
```

---

## ⚠️ Önemli Notlar

- **yfinance 15 dakika gecikmeli veri** verir. Anlık fiyat için bankanın uygulamasına bak.
- **Groq rate limit** — AI analiz endpointleri 429 dönebilir. 1 dk bekle.
- **Free Render** — 15 dk hareketsizlikte uyur. İlk istek 30-60 sn sürebilir.
- **Bu uygulama yatırım tavsiyesi değildir.** Son karar daima kullanıcıya aittir.
- Teknik analiz geçmiş verilere bakar, geleceği garanti etmez.

---

## 💰 Servis Maliyetleri

| Servis | Plan | Ücret |
|--------|------|-------|
| Groq (Llama 3.3 70B) | Free | Ücretsiz (14.400 istek/gün) |
| Render Web Service | Free | Ücretsiz (750 saat/ay) |
| Render PostgreSQL | Free | Ücretsiz (90 gün) |
| yfinance | — | Ücretsiz (15dk gecikmeli) |
| Expo EAS Build | Free | Ücretsiz (30 build/ay) |

---

## 🐛 Bilinen Sınırlılıklar

- KOZAL, KOZAA, ANACM, KRSAN → Yahoo Finance'de delisted, taranmıyor
- Temettü verimi bazen yanlış gelir (yfinance sorunu), %30 üstü filtrelendi
- Backtest 1 yılda az sinyal bulabilir (çok katı koşullar)
- Free Render instance'ında tarama ~60-90 saniye sürer

---

## 🚀 Geliştirme Planı

- [ ] Paper trading frontend ekranı (Chat'ten açılacak)
- [ ] Momentum bozulması sinyali (hedefe ulaşmadan dön)
- [ ] Push notification (stop/hedef uyarıları)
- [ ] Daha fazla hisse tarama (BIST100 tam liste)
- [ ] Haftalık performans raporu

---

*Bu proje kişisel kullanım içindir. Resmi yatırım tavsiyesi değildir.*  
*🦉 Athena — Harikalar Diyarı'nın Borsa Sihirbazı*