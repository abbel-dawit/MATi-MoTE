# MATi-MoTE (MATi)

A universal remote for TVs, streaming boxes and speakers that runs as a Progressive Web App on iPhone and Android — no app store. Hosted as static files on GitHub Pages.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app: UI, Tailwind CSS (compiled and inlined), and all device drivers |
| `manifest.json` | PWA manifest (name, icons, standalone display) |
| `sw.js` | Service worker: always fetches the newest files, keeps an offline copy; never touches device traffic |
| `version.json` | Build number. Installed copies compare against it and update themselves |
| `icons/` | App, maskable, Apple touch and favicon icons (mint) |
| `favicon.ico` | Browser-tab icon (16/32/48px) |
| `icons/apps/` | Optional: drop official app logos here (see its README) |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |
| `build.sh`, `tailwind/` | Rebuilds CSS and stamps a new build number (see below) |

## Deploy to GitHub Pages

1. Create a repo (e.g. `mati-mote`) and upload these files to the root of `main`.
2. Repo **Settings → Pages → Build and deployment → Deploy from a branch → `main` / root**.
3. Open `https://<you>.github.io/mati-mote/` on your phone.
4. Install: **iPhone** — Safari → Share → *Add to Home Screen*. **Android** — Chrome menu → *Install app*.

## Updates (automatic)

Every release has a build number in `version.json` (and the same number inside `index.html`). After you upload new files to GitHub:

- Open copies notice within seconds of being opened or brought back to the front (and every 15 minutes), show "Updating MATi…", and reload. GitHub's CDN can take a couple of minutes to serve the new files.
- The service worker always asks GitHub for the newest files first, so a stale cached copy is only used when the phone is offline.
- **Home-screen icon:** Android Chrome refreshes an installed app's icon by itself (it can take up to a day, and Chrome may ask you to confirm). **iPhone never updates an icon after it's added** — to get a new icon there, delete MATi from the home screen and add it again.

**If you change files yourself**, run `./build.sh` before uploading so the build number changes (or edit the number by hand in `version.json`, `index.html` → `const BUILD`, `sw.js` → `VERSION`, and the `?v=` values in `manifest.json` and `index.html`). If the number doesn't change, installed copies won't know there's an update.

## Supported devices

Pick the **Type** first; MATi then shows only the platforms that fit it.

| Type | Platforms |
|---|---|
| TV | Samsung Tizen · LG webOS · Roku OS |
| Streaming box / stick | Roku OS |
| Speaker | Spotify Connect · Sonos · Bose SoundTouch |
| Soundbar | Sonos · Bose SoundTouch · Spotify Connect |
| AV receiver | Denon / Marantz · Yamaha MusicCast · Spotify Connect |

Not included in this launch: Android TV / Google TV, Fire TV (controlled over ADB), and regular TVs, DVD players or cable boxes through Broadlink / Global Caché IR hubs. All of these need raw TCP/UDP connections, which no phone browser allows, so they'd need a separate helper program running at home.

### What works where

| Platform | How MATi talks to it | Android · Chrome 142+ | iPhone |
|---|---|---|---|
| Samsung Tizen 2016+ | Secure WebSocket :8002 (SmartView remote protocol) | ✅ after one-time *Trust certificate* | ⚠️ best effort (Safari may not reuse the certificate exception) |
| LG webOS | Secure WebSocket :3001 (SSAP) | ✅ after *Trust certificate* | ⚠️ best effort |
| Roku OS | HTTP :8060 (ECP) | ✅ via Local Network Access | ❌ iOS blocks HTTP from HTTPS pages |
| Bose SoundTouch | HTTP :8090 local API | ✅ | ❌ (use Spotify Connect) |
| Denon / Marantz AVR | HTTP control (port 8080 / 80) | ✅ | ❌ |
| Yamaha MusicCast | HTTP Yamaha Extended Control | ✅ | ❌ |
| Spotify Connect / Sonos | Official Spotify Web API (cloud) | ✅ | ✅ |

Sonos is controlled through Spotify Connect because Sonos's own local API (UPnP/SOAP) needs request headers browsers won't send. Newer Bose Smart Speakers (not SoundTouch) have no public local API — use Spotify Connect for those too.

Also not possible from any browser: turning Samsung/LG TVs **on** (Wake-on-LAN UDP), SSDP/mDNS discovery, Onkyo/Pioneer receivers (raw TCP).

## Spotify setup (owner, one time)

1. Go to <https://developer.spotify.com/dashboard> → **Create app**. Choose **Web API**.
2. Add a **Redirect URI** exactly matching your site, e.g. `https://<you>.github.io/mati-mote/` (and `…/index.html` if you open that URL directly).
3. Copy the **Client ID** and paste it into `index.html` → `const SPOTIFY_CLIENT_ID = '…'`.
4. Upload. In MATi: **Add a remote → Type: Speaker → Platform: Spotify Connect → Connect Spotify account**, then pick the speaker. Controls: play/pause, next/previous, volume.

Limits from Spotify, not MATi:
- Playback control needs **Spotify Premium**.
- New Spotify apps run in **development mode, limited to 25 users** you add under *User Management* in the dashboard. Opening it to everyone requires Spotify's *extended access*, which Spotify currently only grants to registered businesses with at least 250,000 monthly active users.

## Device-side settings
- **Roku:** Settings → System → Advanced system settings → *Control by mobile apps* → Enabled.
- **Samsung:** approve the prompt; if denied, re-allow under Settings → General → External Device Manager → Device Connection Manager.
- **LG:** enable Settings → General → *Mobile TV On* / *LG Connect Apps*.
- **Denon / Marantz:** Setup → Network → Network Control → *Always On*.
- Give each device a fixed IP (DHCP reservation in your router) so its address doesn't change.

### Discovery
- **Chrome 142+:** *Scan Wi-Fi for TVs* probes `x.x.x.1–254` on Roku 8060, Samsung 8001 and LG 3000.
- **Everywhere else:** enter the IP from the device's network settings.

## Features
- **Splash screen** on every launch, and an **animated landing page** with a color picker and **Start** on first launch.
- **App icon & browser-tab icon:** black square, colored smiley, four white arrows; follows the theme color for the tab and the iPhone home-screen icon.
- **Troubleshooting popup** after ~12 s unreachable or 3 failed presses (Wi-Fi → IP → certificate / Spotify checks).
- **Certificate trust with auto-return** (Android closes the certificate page itself; on iPhone, swipe back and it reconnects).
- **Button sounds** (on/off in Settings). They follow the iPhone silent switch, like the system keyboard clicks.
- Buttons a device can't use are dimmed (e.g. channel keys on a speaker).
- **Unlimited remotes**, **9 theme colors** (default Mint), haptics, touchpad mode (real pointer on LG), press-and-hold repeat.

## Changing styles
Tailwind is compiled into `index.html` so the app works offline without a CDN. After changing classes:

```bash
TAILWIND=./tailwindcss-macos-arm64 ./build.sh   # standalone CLI from the Tailwind v3 GitHub releases
# or
./build.sh                                      # uses npx tailwindcss@3
```

## Notes
- App IDs for launching are in the `APPS` array in `index.html`. On Samsung and LG, MATi first asks the TV for its installed apps and matches by ID or name (Netflix, Prime Video and Disney+ use different IDs across Samsung model years and regions, and some are native apps that need a different launch type); the listed IDs are only a fallback.
- LG pairing sends an unsigned manifest. Most webOS versions accept it.
- Remotes and the Spotify sign-in are stored in the browser's `localStorage` on that phone only.
