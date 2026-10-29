# MATi-MoTE (MATi)

A universal TV remote that runs as a Progressive Web App on iPhone and Android — no desktop bridge, no app store. Hosted as static files on GitHub Pages.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app: UI, Tailwind CSS (compiled and inlined), and all TV drivers |
| `manifest.json` | PWA manifest (name, icons, standalone display) |
| `sw.js` | Service worker: offline app shell; never touches TV traffic |
| `icons/` | App, maskable, Apple touch and favicon icons (mint) |
| `favicon.ico` | Browser-tab icon (16/32/48px) for browsers that look for an .ico |
| `icons/apps/` | Optional: drop official app logos here (see its README) |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |
| `build.sh`, `tailwind/` | Only needed if you change Tailwind classes (see below) |

## Deploy to GitHub Pages

1. Create a repo (e.g. `mati-mote`) and push these files to the root of `main`.
2. Repo **Settings → Pages → Build and deployment → Deploy from a branch → `main` / root**.
3. Open `https://<you>.github.io/mati-mote/` on your phone.
4. Install: **iPhone** — Safari → Share → *Add to Home Screen*. **Android** — Chrome menu → *Install app* (or Settings → Install MATi inside the app).

All paths are relative, so it works from a project sub-path. When you ship changes, bump `VERSION` in `sw.js` so installed copies update.

## What actually works where (read this)

Browsers deliberately limit what an HTTPS page can do on your home network, so support depends on TV brand **and** phone browser:

| TV | Android · Chrome 142+ | iPhone · Safari / any iOS browser |
|---|---|---|
| **Roku** (ECP, HTTP :8060) | ✅ Works. Chrome's *Local Network Access* lets an HTTPS page call a private IP with `fetch(url, { targetAddressSpace: 'local' })` after you tap **Allow**. | ❌ Not possible. iOS blocks HTTP requests from HTTPS pages, Roku only speaks HTTP, and GitHub Pages is HTTPS-only. |
| **Samsung Tizen 2016+** (WSS :8002) | ✅ After a one-time **Trust TV certificate** step, then approve MATi on the TV. | ⚠️ Best effort. Same trust step; Safari doesn't always reuse the certificate exception for WebSockets. |
| **LG webOS** (WSS :3001) | ✅ After **Trust TV certificate**, accept the pairing prompt on the TV. | ⚠️ Best effort, same caveat. |

Why not WebRTC or WebTransport? Both need software on the *other* end — a WebRTC peer or an HTTP/3 server. TVs don't run either for remote control, so neither can reach a TV without a bridge.

Also not possible from any browser: turning a Samsung/LG TV **on** (needs Wake-on-LAN UDP packets), true network discovery via SSDP/mDNS, Android/Google TV (TLS client-certificate pairing), Fire TV (ADB) and Sony (requires a custom header on plain HTTP).

### Discovery
- **Chrome 142+:** *Scan Wi-Fi for TVs* probes `x.x.x.1–254` on Roku 8060, Samsung 8001 and LG 3000 and offers to add what it finds.
- **Everywhere else:** enter the TV's IP (TV Settings → Network → Network status). Tip: give the TV a fixed IP / DHCP reservation in your router.

### TV-side settings
- **Roku:** Settings → System → Advanced system settings → *Control by mobile apps* → Enabled.
- **Samsung:** approve the prompt; if denied, re-allow under Settings → General → External Device Manager → Device Connection Manager.
- **LG:** enable Settings → General → *Mobile TV On* / *LG Connect Apps*.

## Features
- **Splash screen** on every launch, and an **animated landing page** with a color picker and **Start** button on first launch.
- **Logo:** a tilted remote with a smiley in the middle, in your theme color, inside the app.
- **App icon & browser-tab icon:** black square with a colored smiley and four white arrows. It follows your theme color for the tab and the iPhone home-screen icon (iOS captures the color at the moment you tap *Add to Home Screen*). The Android install icon comes from `manifest.json`, so it stays mint.
- **On-screen keyboard:** every key is sent to the TV as you tap it, so it types into the search box of whatever app is open.
- **Voice search:** tap the mic, speak, and MATi types what you said into the TV's search box. It uses your phone's speech recognition (Chrome on Android, Safari on iPhone). It can't feed live audio into a TV app's own mic button — no browser can.
- **Troubleshooting:** if a TV can't be reached for ~12 seconds (or 3 button presses fail), a popup walks through Wi-Fi, IP address and certificate checks.
- **Certificate trust with auto-return:** MATi opens the TV's certificate page and keeps retrying in the background; once it's trusted, MATi closes that page and finishes pairing. On iPhone, swipe back to MATi and it reconnects on its own.
- **Button sounds** with an on/off switch in Settings.
- **Immersive App cards** with light-follows-finger, 3D tilt and launch feedback. Official logos appear if you add them to `icons/apps/`.
- Remote layout matching the reference design: power, device pill, settings, back/home, D-pad with OK, volume and channel rockers, mute, play/pause, menu, input, and a big **App** button.
- **Touchpad mode:** swipe = arrows, tap = OK, long-press = Back. On LG it drives the real on-screen pointer.
- **Unlimited remotes**: name, platform, IP and an icon (TV, Monitor, Projector, Soundbar, Stick, Box, Console, Speaker). Edit, remove and switch from the device pill. Pairing tokens are saved per device, so you approve on the TV only once.
- **9 theme colors** (default **Mint**), saved on the device.
- App launcher (Netflix, YouTube, Prime Video, Disney+, Spotify), on-screen keyboard to type into TV search, and an input picker on Roku.
- Haptics (Android vibration; iOS 18+ system haptic), press-and-hold repeat, hardware keyboard shortcuts.

## Changing styles
Tailwind is compiled into `index.html` so the app works offline without a CDN. If you add or change Tailwind classes, rebuild:

```bash
TAILWIND=./tailwindcss-macos-arm64 ./build.sh   # standalone CLI from the Tailwind v3 GitHub releases
# or
./build.sh                                      # uses npx tailwindcss@3
```

Custom CSS (D-pad, sheet animations, etc.) lives in the second `<style>` block and needs no build.

## Notes
- App IDs for launching are set in the `APPS` array in `index.html`; IDs can differ by region or model.
- LG pairing sends an unsigned manifest. Most webOS versions accept it; if yours rejects the pairing, the TV shows an error and the app reports it.
- Your remotes are stored in the browser's `localStorage` on that phone only.
