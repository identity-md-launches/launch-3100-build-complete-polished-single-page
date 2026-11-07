# SqueekWheel: Hamster-Powered Mining

Browse freely. Connect your wallet to start mining.

The existing hamster workshop, clicker loop, upgrades, chain, events and versioned save format are preserved. Playing now requires a connected address and a free sign-in signature. The full static production export is in `dist/`.

## Install, preview and rebuild

Use Node.js 22 or newer. This project has no application dependencies, so there is no package installation step. The existing package manifest and lockfile are included unchanged.

```sh
npm run build
npm run preview
```

Open `http://localhost:4173/preview/`. Stop the preview with Ctrl+C. `npm run build` checks the embedded JavaScript and metadata, then exports `index.html` and `social-card.svg` to `dist/`. Serve that directory on any static host, including a subpath. All assets are relative or inline; no CDN, external font, runtime package, backend or credential is required. Use HTTPS for a hosted wallet connection.

## Wallet and browse mode

Every management panel, upgrade price, badge requirement, quest, season milestone, collection breed, cosmetic, statistic, help page and FAQ is available before connecting. The wheel overlay and locked game actions open the same connect sheet. Locked controls remain focusable, show a lock and explain “Connect your wallet to play.” Taps, Space, Turbo, purchases, claims, check-in, challenges, spin, save import and reset also check sign-in in their action handlers.

The native EIP-1193 / EIP-6963 picker supports MetaMask, Rabby, Coinbase Wallet, OKX and Trust. Discovery waits 1.5 seconds before showing installation links when no wallet is found. Mobile visitors can use the provided MetaMask, Coinbase and Trust app links, or paste the copied page URL into Rabby or OKX’s wallet browser. No relay, project ID or SDK account is used.

Connecting requests `eth_requestAccounts`, then one `personal_sign` of “Sign in to SqueekWheel,” including address, nonce, timestamp and site origin. Standard 65-byte EIP-191 account signatures are recovered locally and must match the address. There is no transaction, token approval or gas request. Contract/passkey account signatures requiring EIP-1271 are outside this native account connector’s support.

SqueekWheel only reads your address. It never moves your funds. Balance and network are also read for header display; neither controls the economy. `CHAIN_CONFIG` prefers Ethereum and supplies public Switch/Add Network parameters. A different network produces a dismissible hint and keeps mining available.

Only one wallet request can be pending. Rejection, locked wallets, an existing request, missing balance/network reads and disconnection have calm recovery messages. Account and network versions prevent late responses from affecting another address or labeling an old balance with a new chain. Disconnect pauses play and returns to browse mode. Reload uses `eth_accounts` silently; a locally verified sign-in younger than seven days resumes without another prompt. An expired sign-in waits for the player to sign again.

## Harder game and claims

- Starting production: **0.4 squeeks/sec**. Twelve original upgrades retain their effects; starting prices are 3× the earlier prices and rise by **23% per owned unit**. Buy one, ten or Max.
- First block: **240 squeeks**. Difficulty rises by **20% per run block**, with the current target and multiplier beside the wheel. Original block rarities, illustrative hashes and inspectable records remain.
- Turbo: at least six squeeks, every three seconds. Each boost adds 24% heat; reaching 100% jams production and taps for five seconds. Passive cooling removes 1%/sec. The fan removes 35% heat every two seconds and cannot bypass the jam timer.
- **74 badges**, including Bronze, Silver and Gold tiers, hard time-window secrets and three challenge badges. Most Bronze thresholds are 4× the earlier requirement. Existing unlock dates are preserved and labeled when the new threshold has not yet been reached. All locked badges show their exact requirements and live progress. The wardrobe tiers require 3, 5 and all 6 cosmetics.
- Badge Claim signs a readable message naming the badge, tier, address, nonce and time. Claims shows the saved date, expandable receipt and copy control. **Claim all ready** uses one signature for the complete named batch. **Receipts are signed by your wallet.** They are local game records, not NFTs or contract attestations.
- Daily/weekly quest requirements are 4× higher. Season targets are 1,000 / 4,000 / 10,000 / 20,000 lifetime SP. Timed challenges are five blocks in 60 seconds, twelve Turbos in 60 seconds without a jam, and 100 wheel taps in 30 seconds; each awards 150 SP and a claimable badge once.
- Rebirth unlocks at 25 run blocks. It resets squeeks, upgrades, block progress and run difficulty, while retaining SP, lifetime earnings, XP, badges, receipts, collection, cosmetics, streaks and the chain.

SP balance is spendable on cosmetics. **Lifetime SP** records all SP earned, drives season milestones and ranks, and is never reduced by cosmetic spending. SP and squeeks are game points without monetary value.

## Added local features

| Feature | Behavior |
| --- | --- |
| Hamster collection | Cheddar starts available. One / five Epic or Legendary lucky blocks unlock Silver Dwarf / Winter Floof. One / three Rebirths unlock Golden Syrian / Cosmic Campbell. Only the active breed’s disclosed speed, cooling or block-SP perk applies; its fur and name appear on the wheel. |
| Cosmetics | Top hat, crown, mint/violet wheels and cheese/circuit block skins cost 100–500 SP. Owned items can be equipped without paying again. Earlier owned cosmetics remain available. |
| Daily Lucky Spin | One free spin per UTC day. 45% awards 30/60/90 SP equally; 45% awards 200 squeeks; 10% awards an Epic block. The result and used day are saved. |
| Market events | A ten-minute game cycle: three minutes of Bull Run (1.5× block SP), two minutes of Cheese Crash (0.65×), then five steady minutes. The stationary ticker shows the current multiplier and remaining time. These are game events, not financial market data. |
| Stats | Two accessible inline-SVG charts use actual local samples every ten seconds, retaining 120 samples. Blocks/hour is computed between adjacent observations. Empty charts explain when samples will appear. |
| Comfort settings | Remembered sound/music volume, light/dark theme, reduced motion, animation pause and export/import. Audio is synthesized, muted by default, and starts only after interaction. Audio failure cannot stop the game. |

## Saves and earlier progress

Profiles and leaderboard entries are keyed by the lowercase wallet address. A focused nickname draft survives refreshes for the same signed-in session; switching accounts or disconnecting replaces that form immediately. Stale nickname submissions cannot change another profile. Account changes load that address’s own profile; a new address never inherits the previous player’s progress. The deterministic hamster avatar also uses the address. The leaderboard is explicitly local to this browser, with seeded competitors labeled **Demo**; there is no online ranking or cloud save.

The existing `squeekwheel:v3:<address>` keys and `SQW3.` export format remain. Import also accepts earlier SQW1/SQW2 envelopes with validated defaults for newer fields. Importing an address-bound backup requires that same signed-in address. Sign-in credentials are separate from the game export, so importing progress cannot sign someone in. Game saves are editable local data and do not establish a verified competitive score.

An earlier save from before wallet-gated play remains on the device. The signed-in Profile offers an explicit, confirmed one-time import. It replaces the destination progress after a warning and retains the original backup. Existing address profiles load directly.

Autosave runs every ten seconds and on page hide. Offline income is applied **after sign-in**, capped at eight hours, using base speed, permanent multiplier and the active breed’s speed perk. Temporary events and market bonuses are excluded. Daily/weekly counters and spin availability use UTC; time-window badges use local time. Challenges reset on reload, account change or a background pause.

Every storage operation is caught. Blocked storage or quota failures preserve fresh session data in memory and show “Session only · export to keep.” Export before closing when storage is unavailable. Save export handles large batches of signed receipts without overflowing the JavaScript argument stack. Import/reset confirmations cannot mutate a profile after the account changes.

## Validation

The production build and TypeScript `checkJs` typecheck passed. **188 browser assertions passed with zero console, page or resource errors**, and taste@1 passed **16/16 checks**. The Chromium interaction suite exercises the production export with simulated EIP-1193 providers and fresh ephemeral test signers. It covers wallet errors, real signature recovery, gameplay, claims, account/network races, persistence, migration, large saves, storage/audio denial and responsive layouts. No real wallet account or funds are used. The revision adds regression coverage for focused nickname edits during account changes/disconnect and music-only playback after reload. Final counts and the six-domain design review are recorded in [VALIDATION.md](./VALIDATION.md).

```sh
python3 scripts/setup-checks.py
npm run build
npm run typecheck
TMPDIR=/tmp IMD_PLAYWRIGHT=/opt/imd-tools/playwright-mcp/node_modules/playwright/index.mjs PLAYWRIGHT_BROWSERS_PATH=/opt/imd-tools/ms-playwright npm test
```

The setup helper prepares validation-only tooling in disposable `test/scratch/`. A global TypeScript compiler also works. For another development machine, provide an installed Playwright module through `IMD_PLAYWRIGHT` and its browser location through `PLAYWRIGHT_BROWSERS_PATH`; those tools are not production dependencies.

The pinned taste@1 probe was run against the export at 320, 390 and 1440 widths, including reduced motion. Direct screenshots and interaction checks also cover 820px and a connected mobile header. Physical wallet extensions, wallet app links, audible sound, a screen reader, native browser zoom and Safari were not tested. The application’s local signing scheme is not server authentication.

## Source and attribution

`index.html` holds the application, styles and inline art. `dist/` holds the complete static export. `scripts/validate.mjs` owns browser interaction checks; no test hooks ship in the application. [DESIGN.md](./DESIGN.md) documents the final tokens, typography, components and responsive behavior.

Guidance: Jakub Krehel’s Better Interface (MIT), commit `267330e1adfc66a718fb65fa6918c1f06d0a689e`; documentation method: Paul Bakaus’s Impeccable (Apache-2.0), commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`. Notices and license texts remain in [DESIGN-GUIDANCE-LICENSE.txt](./DESIGN-GUIDANCE-LICENSE.txt). Mobile link references: [MetaMask](https://docs.metamask.io/metamask-connect/evm/guides/metamask-exclusive/use-deeplinks), [Coinbase](https://docs.cdp.coinbase.com/wallet-sdk/docs/deep-link), [Trust](https://developer.trustwallet.com/developer/develop-for-trust/deeplinking).
