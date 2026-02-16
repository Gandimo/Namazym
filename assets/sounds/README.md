# NAMAZYM Notification Sound Assets

## 🎵 Calm Spiritual Identity

These sound files provide the audio identity for NAMAZYM notifications.

**Philosophy**: Mindfulness-grade chimes — calm spiritual invitations, not alarms.

---

## Files

### `namaz_chime.wav`
- **Purpose**: Main prayer time notifications
- **Tone**: 400Hz sine wave (deep, calming)
- **Duration**: 0.8 seconds
- **Envelope**: Gentle fade-in (100ms), fade-out (200ms)
- **Volume**: 70% (calm presence)
- **Channel**: PRAYER (`prayer-alerts`)

### `reminder_soft.wav`
- **Purpose**: Pre-prayer reminders & daily verse
- **Tone**: 600Hz sine wave (soft, clear)
- **Duration**: 0.6 seconds
- **Envelope**: Gentle fade-in (100ms), fade-out (200ms)
- **Volume**: 70% (subtle presence)
- **Channel**: REMINDER (`reminder-soft`)

---

## Technical Specifications

**Format**: WAV (RIFF)  
**Sample Rate**: 48kHz  
**Bit Depth**: 16-bit  
**Channels**: Mono  
**File Size**: ~77KB each  

---

## Android Integration

**Automatic**: Expo/EAS builds include these files in APK.

**Channel Configuration**:
```typescript
// PRAYER channel
sound: "namaz_chime.wav"

// REMINDER channel  
sound: "reminder_soft.wav"
```

**⚠️ Important**: Android notification channel settings (including sounds) are **immutable** after creation. To apply sound changes:
1. Uninstall app completely
2. Reinstall
3. Grant notification permissions again

Or programmatically delete channels (requires code change).

---

## iOS Integration

**Dev-Client**: Custom sounds not supported (uses system default)  
**Release Builds**: Requires native configuration

**For iOS Release**:
```bash
# Convert WAV to CAF format
afconvert -f caff -d LEI16 namaz_chime.wav namaz_chime.caf
afconvert -f caff -d LEI16 reminder_soft.wav reminder_soft.caf
```

Then add `.caf` files to iOS bundle via `app.json` or native project.

---

## Sound Quality

**Current**: Simple sine wave tones with smooth envelopes

**Production Enhancement** (Optional):
- Replace with professionally recorded spiritual chimes
- Use organic instruments (bells, singing bowls, chimes)
- Maintain same duration and volume characteristics
- Keep file sizes small (<200KB)

**Requirements for replacement files**:
- WAV format, 48kHz, 16-bit, mono
- Duration: 0.5-1.2 seconds
- Gentle attack/release (no sharp transients)
- Normalized to -3dB peak
- No clipping or distortion

---

## Testing Sounds

**Play locally** (macOS):
```bash
afplay assets/sounds/namaz_chime.wav
afplay assets/sounds/reminder_soft.wav
```

**Verify**:
- ✅ Calm, non-alarming tone
- ✅ Smooth fade-in/out
- ✅ No clicks or pops
- ✅ Appropriate volume

---

## File Integrity

```bash
# Verify WAV format
file assets/sounds/*.wav

# Check file info
afinfo assets/sounds/namaz_chime.wav
```

Expected output:
```
File type: WAVE
Data format: 1 ch, 48000 Hz, 16-bit little-endian signed integer
```

---

**Status**: ✅ Production-ready placeholder tones  
**Next**: Replace with premium spiritual chimes (optional)
