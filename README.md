# SqueekWheel: Hamster-Powered Mining

A complete, guest-first idle game in a single `index.html`. Mined by hamsters. Secured by squeaks.

## Run, preview and rebuild

**No installation is needed to play.** Open `index.html` in a modern browser, or serve the included `dist/` directory with any static host. The application has no runtime packages, framework, external fonts, asset CDN, backend or required wallet. The package manifest and lockfile describe a dependency-free project.

For a local HTTP preview, use Node.js 20 or newer:

```sh
npm run build
npm run preview
```

Open `http://localhost:4173/preview/`. The preview stays in the foreground; stop it with Ctrl+C. `npm run build` validates the embedded JavaScript and metadata, then copies the complete source page and local social image into `dist/`. It is packaging, not a required compilation step. Source and export are both included. Relative URLs and hash links work under a static hosting subpath.

## What is included

- Animated SVG hamster and wheel, passive earnings, Turbo by button or Space, cooldown, floating rewards and number tweening.
- Rising block difficulty, four rarities, illustrative hashes, timestamps, rewards and an inspectable chain.
- Twelve Wheel/Fuel/Crew upgrades with exponential costs, owned counts, effect previews and Buy ×1/×10/Max.
- Golden Seed, Cat Nearby with an actionable laser, Lucky Block and timed Power Surge events.
- Levels 1–50, six titles, confetti, 25 badges, daily/weekly quests, a seven-day check-in streak and four season milestones.
- Confirmed rebirth with a permanent multiplier; permanent SP, XP, chain, badges and streaks survive.
- Nicknames, deterministic avatars, a local leaderboard with explicit Demo players, referral copying and a downloadable personal hamster card.
- Light/dark themes, reduced motion, an animation pause control, remembered opt-in synthesized sound, keyboard tabs, skip link, live notifications and labeled native dialogs/forms.
- Ten-second autosaves, versioned migration, import/export, confirmed reset and an eight-hour offline earning cap. Blocked localStorage falls back to session memory and explains how to export.

## Optional wallets

Guest play is complete. There is no wallet prompt on load. The header and Profile offer **Connect Wallet (optional)**. EIP-1193 browser providers and EIP-6963 announcements are supported, alongside installation and wallet-browser opening links. No relay, project ID or wallet SDK is needed.

Linking requires confirmation and carries current progress to the address save. A pre-existing address save is replaced only after an explicit warning in that confirmation. Export first to retain both. Disconnect copies current progress back to the guest save. Account changes load an existing address profile or carry current progress into a new one. Reconnection uses `eth_accounts` silently and respects an explicit disconnect.

Connecting unlocks address avatars, hats, wheel colors, the Verified Miner profile title, three optional badges, and a **one-time 5% addition to current SP**. It does not multiply later SP earnings. The checkmark requires a separate optional `personal_sign` message. Its EIP-191 signature is recovered locally with Keccak-256 and secp256k1 and must match the connected address. Verification is local profile decoration, not server authentication.

`CHAIN_CONFIG` is at the beginning of the embedded script. Its five empty fields intentionally leave the game network-independent. An owner can set a name, hexadecimal chain ID, public HTTPS RPC URL, native symbol and HTTPS explorer to enable the optional Switch/Add Network control. Wrong-network hints are dismissible. No chain configuration or credential is needed to run the game. No private key, approval or transaction is requested.

## Saves and local data

Saves use `squeekwheel:v3:<guest-id-or-address>` in browser storage. Guest identity, preferences and local leaderboard records use separate namespaced keys. The importer accepts the versioned `SQW1.`, `SQW2.` and `SQW3.` envelopes and validates every supported field; imports clear verification. Daily/weekly counters reset in UTC. Secret time badges use the player’s local hour. Offline rewards are collected into the current period and use base production plus the permanent rebirth multiplier, without temporary event effects.

The leaderboard is **on this device only**. Eight seeded competitors are labeled Demo. `leaderboardAdapter.getLeaderboard()` and `.submitScore()` are the commented replacement points for a future API. Wallets do not provide cloud saves. Export a backup before clearing browser data or moving devices. Referral codes are local sharing text; they do not track visitors or grant fabricated rewards.

## Validation

The production build, TypeScript `checkJs` pass and **122 interaction assertions passed**. The interaction suite exercises the production export using Happy DOM, including guest play, purchases, mining, events, quest claims, streaks, offline caps, rebirth, import/export, nickname changes, wallet rejection/locking/discovery/linking, signature recovery, account switching, silent reconnection, blocked storage, keyboard focus and accessible button names. Eighteen declared solid-color contrast pairs passed their applicable thresholds.

To reproduce the optional development checks, use Python 3 and Node.js 24:

```sh
python3 scripts/setup-checks.py
npm run build
npm run typecheck
npm test
```

The setup helper verifies package integrity and unpacks pinned validation tools only into disposable `test/scratch/tools/`, without creating `node_modules`. These are not application dependencies and are not part of the export. A globally available TypeScript compiler can also run the typecheck.

**Rendered checks remain unperformed.** The assigned browser could not launch; independent Chromium and WebKit attempts also could not open a page. The pinned taste@1 probe was attempted against the production export and exited 2 before measurement. No mobile or desktop screenshots, rendered contrast/overflow measurements, native zoom or screen-reader results are claimed. Canvas PNG downloads, clipboard permissions, audio output and real wallet/mobile-app behavior still need a functioning browser. See [VALIDATION.md](./VALIDATION.md) for coverage, findings and exact commands.

## Files and design references

- `index.html`: all application HTML, CSS, JavaScript and inline art.
- `dist/index.html`, `dist/social-card.svg`: finished static export.
- `social-card.svg`: local Open Graph/Twitter image.
- [DESIGN.md](./DESIGN.md): implemented tokens, type, components and breakpoints.
- [VALIDATION.md](./VALIDATION.md): actual results and limitations.
- `scripts/`: build, foreground preview and optional validation utilities.

Design guidance was adapted from Jakub Krehel’s **Better Interface** (MIT), commit `267330e1adfc66a718fb65fa6918c1f06d0a689e`, and documentation guidance from Paul Bakaus’s **Impeccable** (Apache-2.0), commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`. Their notices and license texts are preserved in [DESIGN-GUIDANCE-LICENSE.txt](./DESIGN-GUIDANCE-LICENSE.txt).
