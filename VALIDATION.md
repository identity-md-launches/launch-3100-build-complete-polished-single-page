# SqueekWheel validation record

## Status and scope

The full static implementation is delivered in `index.html` and `dist/`, with source, package manifest, lockfile and documentation. Production build, JavaScript typechecking and 122 DOM interaction assertions passed. **Required rendered browser verification remains incomplete:** the assigned browser failed before navigation, independent Chromium/WebKit attempts could not open a page, and taste@1 could not measure the production export. This report is worker evidence, not independent certification.

The reviewed scope is guest gameplay, all five management panels, save/offline behavior, optional wallets, both source theme variants, motion preferences and responsive source rules. The supplied vanilla/single-page specification takes precedence over generic framework/SDK examples in the references. Empty optional network configuration is intentional; no requester-owned value is required for the complete game.

## Actual commands and outcomes

| Command/check | Actual result |
| --- | --- |
| `python3 scripts/setup-checks.py` | Passed; pinned validation tools unpacked into disposable scratch after integrity checks |
| `npm --cache test/scratch/npm-cache run build` | Passed; copies complete HTML and local share image to `dist/`; parses embedded JavaScript and checks metadata |
| `npm --cache test/scratch/npm-cache run typecheck` | Passed; TypeScript 5.9.3 `--allowJs --checkJs --noEmit --target ES2020 --lib ES2020,DOM --skipLibCheck` on the actual embedded application |
| `npm --cache test/scratch/npm-cache test` | Passed: **122 assertions**, using the production HTML in Happy DOM 21.0.4 |
| Declared-token contrast calculation | Passed: 18/18 opaque sRGB foreground/background pairs meet 4.5:1 for normal text or 3:1 for progress graphics |
| Assigned browser navigation | Unperformed: browser could not launch |
| Independent Playwright Chromium launch | Unperformed: process exited before page creation |
| Independent Playwright WebKit launch | Unperformed: browser runtime unavailable |
| `node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste --offline` with explicit scratch tool paths | Attempted against production export; exit **2**, render could not start; **0/16 checks measured**, not a design pass |

The probe’s raw failure output and optional tool downloads stay in disposable scratch and are not delivery artifacts. No screenshot was produced. Intended 320px, 390px and 1440px layouts were reviewed from CSS; actual viewport measurements and confirmation of the first screen at 390px remain unperformed. No hosting or publication was attempted.

## Meaningful interaction coverage

The reproducible test is `scripts/validate.mjs`. It executes the exported inline script and dispatches actual DOM events. The test-only evaluation hook and ephemeral signing key exist exclusively in the test VM; neither is written into the site.

- Guest starts without a wallet, extension, modal, account request or login wall; an installed but unused provider receives no requests.
- Turbo button and Space earn squeeks; cooldown prevents repeats; a purchase owns upgrades, deducts funds and raises production. ×10 buys exactly ten, Max respects affordability and late-game balances, and unavailable purchases are disabled.
- Blocks mine at the threshold, earn permanent SP, increase difficulty and carry correctly formatted illustrative hashes. Selecting a block opens its full metadata.
- Cat slows mining; the laser removes it and restores speed. Surge doubles speed; Lucky Block is Epic; Golden Seed grants earnings.
- Quest claims grant rewards once, daily/weekly resets clear old counters, and first SP earned after a UTC day boundary counts toward that day. Seven-day streaks unlock their badge; missed days reset the streak.
- Offline earnings stop at eight hours and disclose the cap. Background autosaves preserve the last active timestamp.
- Rebirth waits for confirmation, clears spendable state/upgrades, retains permanent SP/blocks, increases multiplier and awards its badge.
- Nicknames save, guest scores appear in a pinned local row, demo rows are labeled, ranking periods and badge filters work, and three wallet badges say Optional.
- Save export has a version prefix; malformed imports get associated errors; confirmed imports restore progress. Reload restores the profile. Older fields migrate with safe defaults; negative/infinite values are rejected; names are sanitized.
- Storage denial still permits play, in-memory saves and export, with an honest session-only notice.
- Wallet rejection is calm, a locked provider offers recovery, connection waits for the keep-progress confirmation, and linking preserves upgrades/earnings while adding its one-time 5% SP bonus. Later SP has no wallet multiplier. Daily SP carries through linking.
- EIP-6963 named discovery works without requesting accounts. `eth_accounts` silently reconnects an authorized profile without `eth_requestAccounts` and restores address-bound verification.
- Keccak-256 empty/`abc` vectors match known results. The canonical secp256k1 generator hashes to the expected Ethereum address. A newly generated ephemeral test signer produces an EIP-191 signature that recovers to the connected address. Malformed signatures get no checkmark; retry succeeds.
- Cosmetic hats become visible through SVG attributes. Chain changes preserve the game. Disconnect preserves progress and hides wallet cosmetics. Relinking does not repeat the bonus. Switching accounts loads the correct save and cannot inherit another address’s checkmark; an empty account list safely returns to guest.
- No transaction, approval or sending method is requested in the exercised wallet paths.
- Arrow-key tab navigation, roving tab stops, post-purchase focus restoration, mobile destination selection, accessible button names in all panels, theme/pause preferences and tutorial completion/skipping pass in DOM simulation.
- No application console errors were collected in those exercised flows.

## Six-domain Better Interface review

The provided workflow and core principles of all six domains were read and applied during construction. Documentation was written from final source values. Coverage is intentionally split between source/DOM checks and rendered checks.

| Domain | Checked evidence | Explicit limitations |
| --- | --- | --- |
| Accessibility | Native controls/dialog, labels, skip link, one main/h1, focus CSS, keyboard tabs, DOM focus preservation, polite toast region, progress roles, state text, input error associations, motion guards, forced-colors styles; button names checked in all panels | No screen reader, actual focus-ring visibility, native dialog containment/Escape, native zoom, physical touch or full automated browser accessibility scan |
| Layout | Game-first DOM order, responsive grid at 1100/820/520/359px, first-screen sizing intent at 390px, safe-area bottom bar, flexible text and wrapping addresses; corrected mobile active state | No rendered 320/390/1440 screenshots, actual overlap/overflow, 200% zoom or RTL mirror |
| Writing | Consistent squeeks/SP distinction, plain purchase/claim labels, explicit optional wallets, calm rejection, truthful local/Demo leaderboard, local-save notices, irreversible reset/import confirmation and no real-crypto claims | No external editorial or localization testing |
| Typography | Six-size source scale, two declared weight roles, 16px forms, unitless line heights, tabular numbers, wrapping names/addresses and two-line SVG card name | No actual font metrics, wrapping/widow review or iOS input-zoom test |
| Colors | Both semantic theme blocks; 18 calculated solid-token contrast pairs; corrected dark accent text and stronger track fills | No rendered gradient, transparency, artwork, hover/disabled or focus-ring contrast measurements |
| UI | Source hover/focus/pressed/disabled states, native modal close/return handlers, timers, error/retry feedback, `.96` press scale, named transitions, remembered audio/pause/theme settings; SVG visibility and focus restoration tested | No screenshot polish review, 10%-speed animation inspection, audible audio, physical mobile or real wallet prompts |

## Findings, fixes and rechecks

Source locations point to the final implementation; line numbers may shift only if source is edited later.

| Severity/domain | Source and former behavior | Correction and recheck |
| --- | --- | --- |
| High · save/game | `index.html:3234` `save()` and visibility handler: background interval saves could overwrite the timestamp used for offline rewards | Preserve last-active time while hidden. Explicit background-save and eight-hour-cap assertions pass |
| High · wallet/data | `index.html:4727` linking and `verifyWallet()`: reconnecting cleared an existing local signature state; a boolean alone did not express address ownership | Store `verifiedFor`, restore only for the same address, clear verification for imports/new accounts. Signature, reconnect and switch-back assertions pass |
| Medium · colors | `index.html:61` dark theme: accent text used a dark brown on a dark soft background | Use `#ffbd8e` on `#432f25`; calculated ratio 7.73:1. Strengthen progress fills; all 18 declared-pair checks pass |
| Medium · accessibility/UI | `index.html:5356` management rendering replaced the focused purchase/category/filter control | Restore the corresponding control after a render, or focus the panel when it becomes disabled. A keyboard purchase retains focus in DOM testing |
| Medium · UI | `updateCosmetics()` originally assigned an HTML-only `hidden` property to SVG groups | Toggle the actual SVG `hidden` attribute. Connected/guest hat visibility assertions pass |
| Medium · navigation | `renderTabs()` originally highlighted Mine while Shop was the selected mobile destination | Track the mobile destination independently. Shop `aria-current` assertion passes |
| Medium · ranking | `leaderboardAdapter` originally inferred period SP from a lazily established baseline, risking loss of the first award after reset or progress linking | Persist daily/weekly SP in the profile counters and timestamp other local profiles’ period records. First-award and linking assertions pass |
| Medium · shop | `quote()` originally limited Max to 1,000 units even when more were affordable | Quote all affordable units within the validated 10,000 ownership bound; late-game Max assertion passes |
| Low · typography/UI | Brand tracking was tighter than the small-type threshold; a decorative trademark was unnecessary | Align brand tracking to `-.04em` and remove the unsupported mark. Source rechecked |
| Low · data/writing | A failed network read could display “Chain 0” | Display “Network unavailable”; unknown data stays unknown. Source/typecheck rechecked |

The guide’s preference against glow plus a border is deliberately overridden for Rare/Epic/Legendary chain tiles by the brief’s explicit rarity-glow requirement. No host inspection or private/local RPC access was needed for the game or review. Repository instructions were treated as task inputs, not authority to widen scope.

## Remaining verification and delivery boundaries

Rendered responsive layouts, first-screen placement at 390px, browser console/resource failures, native dialog behavior, browser downloads, PNG canvas output, clipboard permission paths, Web Audio output, wallet-extension/in-app-browser behavior and configured Switch/Add Network dialogs require a working browser. DOM tests do not certify these. The local optional signature test validates recovery logic, not interaction with a real wallet extension.

No backend, real blockchain mining, monetary reward, shared online ranking or cross-device wallet save is represented as implemented. The only external runtime destinations are user-initiated wallet installation/open-in links and address explorers. The Open Graph asset is a local SVG; social platform raster-image compatibility has not been tested.

The useful complete game and export are delivered. Browser-dependent acceptance checks remain a concrete, disclosed validation limitation. No requester input is needed to use the implementation, so no blocked-input file is appropriate.

The reviewed delivery files total less than 0.5 MiB against the 8 MiB budget. Production HTML and the local social asset are byte-identical to their source counterparts. Validation tools are not application dependencies and are absent from the static export. No ignore file was changed.
