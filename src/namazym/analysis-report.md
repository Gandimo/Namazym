# Namazym İkon Audit Raporu

## Ekran Bazlı İkon Envanteri

### HomeScreen.tsx
- **Üst Header**:
  - `chevron-down` (Ionicons) - 14px - White (Konum seçici)
  - `settings-outline` (Ionicons) - 22px - White (Ayarlar butonu)
- **Günüň Aýady / Hadysy Kartları**:
  - `share-2` (Feather) - 18px - #666
- **Ramazan Kartı**:
  - `moon-outline` (Ionicons) - 24px - brandGold
  - `chevron-forward` (Ionicons) - 20px - brandGold
- **Gysga ýol (Shortcut) Kartları**:
  - `calendar` (Feather) - 22px - brandGold
  - `compass` (Feather) - 22px - brandGold
  - `book-open` (Feather) - 22px - brandGold
  - `book` (Feather) - 22px - brandGold
  - `activity` (Feather) - 22px - brandGold
- **Maglumat (Info) Kartları**:
  - `star-outline` (Ionicons) - 24px - brandGold
  - `calendar-outline` (Ionicons) - 24px - brandGold
  - `business-outline` (Ionicons) - 24px - brandGold
  - `hand-left-outline` (Ionicons) - 24px - brandGold

### HeroPrayerCard.tsx
- Şu an ikon kullanılmıyor (Stage 3'te `moon-outline` eklenecek).

### DailyPrayersList.tsx
- İkon kullanılmıyor (Namaz vakitleri için Watermark ve Dot kullanılıyor).

## Uyumluluk Sorunları
❌ **Stil**: İkonlar şu an düz (flat) tasarımda. 2026 "Soft 3D Gummy" estetiği (gölgeler, gradientler ve derinlik) eksik.
❌ **Boyut**: İkon boyutları düzensiz (14, 18, 20, 22, 24px). Material Design 3 standartlarına (18/24/36/48px) çekilmeli.
❌ **Hiyerarşi**: Kart gölgeleri ile ikon hiyerarşisi arasında görsel uyum senkronize değil.
❌ **Etkileşim**: İkonlarda haptic feedback ve etkileşimli scale animasyonları henüz `PremiumIcon` seviyesinde merkezi değil.
❌ **Kontrast**: İkonların aktif/pasif state renkleri ve opaklıkları Material Design 3 kurallarına göre optimize edilmeli.
