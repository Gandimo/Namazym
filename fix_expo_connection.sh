#!/bin/bash
echo "🚀 Starting Expo Connection Fix..."

# 1. Stop Metro
echo "🛑 Stopping running processes on ports 8081 & 8083..."
lsof -ti:8081 | xargs kill -9 2>/dev/null
lsof -ti:8083 | xargs kill -9 2>/dev/null

# 2. Clear Cache
echo "🧹 Clearing Metro cache..."
rm -rf $TMPDIR/metro-*
rm -rf node_modules/.cache/babel-loader

# 3. Check IP
LOCAL_IP=$(ipconfig getifaddr en0)
echo "📡 Your Local IP: $LOCAL_IP"

# 4. Instructions
echo "
✅ CLEANUP COMPLETE.

👉 NEXT STEPS (Run these manually):

OPTION A (Best for Local Network):
   npx expo start --clear --host lan

OPTION B (If Option A fails):
   npx expo start --clear --tunnel

📱 ON YOUR iPHONE:
1. Ensure Wi-Fi is ON and connected to the SAME network as this Mac.
2. Turn OFF any VPN on the iPhone.
3. Turn OFF 'iCloud Private Relay' (Settings -> Apple ID -> iCloud -> Private Relay).
"
