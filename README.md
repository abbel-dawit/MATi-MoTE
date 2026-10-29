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
| TV | Samsung Tizen · LG webOS · Roku OS · Android TV / Google TV* · Fire TV* · IR bridge* |
| Streaming box / stick | Roku OS · Android TV / Google TV* · Fire TV* |
| Speaker | Spotify Connect · Sonos · Bose SoundTouch |
| Soundbar | Sonos · Bose SoundTouch · Spotify Connect · IR bridge* |
| AV receiver | Denon / Marantz · Yamaha MusicCast · Spotify Connect · IR bridge* |
| DVD / Blu-ray, Cable box | IR bridge* |

\* **Needs MATi Bridge.** Android TV, Google TV and Fire TV are controlled with ADB (raw TCP on port 5555 with key pairing). Broadlink RM4 and Global Caché IR hubs accept only raw UDP/TCP packets. **No web browser, on any phone, can open raw TCP/UDP connections**, so a web app can't reach these on its own. They're listed so users can see them, but can't be saved until a bridge exists.

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

## Typing & search — how it works (and why)

TV apps accept text in two different ways, so MATi has two tabs under **Type & search**:

**1. Type on TV** — for text boxes that use the TV's *own* keyboard: Roku search and Roku's keyboard, the LG/Samsung system keyboard (TV browser, settings, and apps that use it). Each key goes straight to the TV.
- **LG and Samsung** tell MATi when one of those text boxes is open, so the tab shows a green "text box is open — type away" or tells you to select one first.
- **Roku** can't report that, so MATi explains where typing works. It also offers **Search all of Roku**, which runs Roku's own search across channels.

**2. YouTube** — YouTube, Netflix, Prime Video and Disney+ draw their *own* keyboards on every TV brand and ignore text sent from outside. Roku, LG and Samsung remote apps can't type into them either. So for YouTube, MATi searches on the phone and opens the chosen video directly on the TV:
- Roku: `POST /launch/837?contentId=<id>&mediaType=movie`
- LG: `ssap://system.launcher/launch` with `{ id: "youtube.leanback.v4", contentId: "v=<id>" }`
- Samsung: DIAL (`POST :8080/ws/apps/YouTube`, body `v=<id>`) in Chrome on Android, otherwise `ed.apps.launch` with `metaTag: "v=<id>"`. The Samsung route can vary by model.

Ways to pick a video:
- **Paste a link** (always works, no setup): in the YouTube phone app tap *Share › Copy link*, then paste into MATi.
- **Share to MATi** (Android): YouTube app › *Share* › **MATi** opens MATi with the video ready to play. iPhone doesn't let web apps appear in the share sheet.
- **Search inside MATi** (needs a YouTube API key, see below), by typing or by voice.

When the TV is showing YouTube (LG reports this; on other TVs, when MATi opened YouTube last), the keyboard and mic go to the YouTube tab automatically.

Netflix, Prime Video and Disney+ have no public way to search or open a title from outside, so there's no reliable fix for typing into them. Use the D-pad on their on-screen keyboard, or *Search all of Roku* on a Roku.

### YouTube search setup (owner, optional)
1. In Google Cloud Console, create a project and enable **YouTube Data API v3**.
2. Create an **API key**. Restrict it to *HTTP referrers* → `https://<you>.github.io/*`, and to the YouTube Data API v3 only.
3. Paste it into `index.html` → `const YOUTUBE_API_KEY = '…'`, then upload.

Quota: the free daily quota is 10,000 units and each search costs 100, so about **100 searches per day across all users**. Google offers more quota through its free API audit form. Pasting or sharing links doesn't use quota.

## Spotify setup (owner, one time)

1. Go to <https://developer.spotify.com/dashboard> → **Create app**. Choose **Web API**.
2. Add a **Redirect URI** exactly matching your site, e.g. `https://<you>.github.io/mati-mote/` (and `…/index.html` if you open that URL directly).
3. Copy the **Client ID** and paste it into `index.html` → `const SPOTIFY_CLIENT_ID = '…'`.
4. Upload. In MATi: **Add a remote → Type: Speaker → Platform: Spotify Connect → Connect Spotify account**, then pick the speaker.

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
- **Type & search:** on-screen keyboard for the TV's own text boxes (with live "text box ready" status on LG/Samsung), plus YouTube search/paste/share → plays on the TV. On Spotify speakers it becomes search-and-play.
- **Voice:** phone speech recognition → typed into the TV text box, searched on YouTube, or played on Spotify, depending on what's on screen.
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
- App IDs for launching are in the `APPS` array in `index.html`; IDs can differ by region or model.
- LG pairing sends an unsigned manifest. Most webOS versions accept it.
- Remotes and the Spotify sign-in are stored in the browser's `localStorage` on that phone only.
