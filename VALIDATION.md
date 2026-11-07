# SqueekWheel implementation validation

Reviewed on 2026-11-07 against the production export served under `/preview/`. This is worker-side evidence, not independent certification. The existing standalone HTML/CSS/JavaScript stack, art, root package manifest, lockfile and build configuration were preserved.

## Results

| Check | Actual result |
| --- | --- |
| Production build | `npm run build` passed; complete relative-path export in `dist/` |
| Typecheck | `npm run typecheck` passed using TypeScript 5.9.3 `allowJs` + `checkJs` + `noEmit` |
| Browser interactions | **188 assertions passed** in Chromium with simulated EIP-1193 providers and ephemeral account signers |
| Runtime failures | **0** collected browser console errors, page errors or failed resource requests in the interaction suite |
| Responsive checks | No page overflow at **320, 390, 820 and 1440px**, including connected headers and the tested management panels |
| First phone screen | Product, illustrated wheel and **Connect Wallet to Start Mining** visible at 390px; checked in rendered screenshots |
| taste@1 | **16/16 passed** on the export, including 320/390/1440 and reduced-motion measurement |
| Static metadata | Title, inline favicon, description, og:title and relative local og:image present |
| Source/export | Production HTML and social image match their source copies |
| Delivery constraints | Existing package files/build scripts unchanged; no ignore file or dependency directory added to the submission; tracked delivery tree is approximately 570 KB, below 8 MiB |

Commands run:

```sh
python3 scripts/setup-checks.py
npm run build
npm run typecheck
TMPDIR=/tmp IMD_PLAYWRIGHT=/opt/imd-tools/playwright-mcp/node_modules/playwright/index.mjs PLAYWRIGHT_BROWSERS_PATH=/opt/imd-tools/ms-playwright npm test
TMPDIR=/tmp IMD_PLAYWRIGHT=/opt/imd-tools/playwright-mcp/node_modules/playwright/index.mjs PLAYWRIGHT_BROWSERS_PATH=/opt/imd-tools/ms-playwright node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste --offline
```

The supplied browser connector could not launch. Direct Playwright Chromium successfully rendered the actual export, ran the interactions and produced screenshots. Rendered observations below come from those screenshots and browser measurements, not source inference. The development preview was owned by each bounded verification script and closed afterward.

## Revision verification

Both reported defects were reproduced in Chromium at 1440×900 against the unchanged export before editing application source. After signing into two simulated accounts and saving Alice/Bob, switching from a focused “Alice draft” to Bob left Bob in state but Alice’s address/draft in the form; Save renamed Bob. Separately, saved effects volume 0 and music volume 0.5 left `audio` null after reload, a pointer gesture and 3.3 seconds. Both reproductions collected zero browser errors.

| Severity / source | Targeted change | Recheck |
| --- | --- | --- |
| High / `index.html:5234`, `index.html:5283` | Preserve a focused draft only when its editable form matches the current address and wallet request ID. Account activation/disconnect replaces it. Bind submission to the rendered address/session and read its own form input; reject detached/stale forms. | The original Alice/Bob reproduction now displays Bob’s address/name immediately and Save retains Bob. Added checks cover same-session background reads, cached sign-in restoring editability/focus, stale form submission, keyboard Save, separate stored names, switch-back and focused disconnect. |
| Medium / `index.html:5045` | Invoke `playMusic` directly every three seconds so its existing guards and caught lazy audio initialization work independently of effects volume. | After the original reload/gesture sequence, effects stay 0, music stays 0.5 and AudioContext is running. The regression suite additionally verifies no initialization before interaction and at least four scheduled music oscillators afterwards. |

The final interaction suite passes **188 assertions**, including **19 added regression assertions**. Production build, TypeScript checkJs and all 16 taste@1 checks passed again. The suite serves the actual export under `/preview/`; no test hooks are included in the production files. Original reproduction and corrected-state checks used a disposable `test/scratch/revision/reproduce.mjs`; maintained regressions are in `scripts/validate.mjs`.

Revision design coverage: accessibility checked native form submission with Enter, retained nickname focus, read-only browse state and the visible focus ring; layout/typography checked the 390px first screen and switched desktop profile screenshot; writing checked the calm stale-form message; colors and UI checked the retained tokens, measured solid-text contrast, component states and reduced-motion probe. The final 390px screenshot still shows the product and start action above the fixed navigation. No styling, gameplay, save-format, dependency or build-configuration changes were needed. Physical wallets, screen readers, native zoom, WebKit, forced colors and audible speaker output remain unverified. WebAudio initialization/scheduling was measured, rather than judged by listening.

The account-switch screenshot is `test/scratch/interaction/switched-profile-1440.png`; it was opened to confirm the new name/address and visible nickname focus ring. These screenshots and results are disposable validation evidence. Both findings are answered as fixed in `.imd-responses.json`.

## Requirement coverage

| Requested behavior | Status and evidence |
| --- | --- |
| Browse the complete site without a wallet | Met: all ten management panels and Help/FAQ/Settings have working readable content; all game mutations stay gated |
| Wheel overlay and locked actions | Met: lock icons, exact tooltip, connect modal, Space and tap gating; no passive income before sign-in |
| EIP-1193 / EIP-6963 picker | Met: generic injection and five named providers; 1.5-second discovery; five install links and supported phone-browser paths |
| Free sign-in with nonce/time | Met: readable personal_sign; signatures recover to the active address; malformed and declined signatures keep the overlay |
| Wallet failure and lifecycle states | Met in simulation: rejection, locked wallet, pending provider request, one-request concurrency, accountsChanged, chainChanged, disconnect and failed network/balance reads |
| Seven-day sign-in and silent reload | Met: eth_accounts reconnects without permission/sign prompts; expired signatures wait for explicit re-signing; explicit disconnect survives reload |
| Address-specific profile/header/rank | Met: separate saves, nicknames and receipts; deterministic address avatar; balance/network header; new accounts start separately; switching back restores the prior save |
| Preferred network switch/add | Met in simulation: wrong-network hint is dismissible and does not pause play; 4902 falls back to wallet_addEthereumChain; stale cross-chain balance responses are discarded |
| Required browse/mining and funds copy | Met in website metadata, intro, connect sheet, banner, FAQ and footer context; obsolete wallet-choice copy removed from the served UI |
| Badge claims without a contract | Met: Ready/Locked/Claimed states, dates, individual claims, one-signature batch claim, signature recovery, expandable receipt and blocked-clipboard copy fallback |
| Harder badges/secrets/challenges | Met: 74 badges with three tiers, harder secret counters, exact requirements, live progress and three timed challenges; wardrobe Gold is attainable with all six cosmetics |
| Slower economy and rising difficulty | Met: 0.4 starting rate, 3× initial upgrade prices, 23% repeat price growth, 240 starting block target and 20% difficulty growth |
| Harder quests and season | Met: daily/weekly requirements 4× higher; once-only claims; UTC reset; 1K/4K/10K/20K lifetime SP milestones |
| Overheat and fan | Met: 100% heat jams for five seconds; fan reduces heat without bypassing jam; production and taps pause during jam |
| Hamster collection | Met: lucky-block and Rebirth unlocks, active passive perks, active wheel name/fur; locked requirements visible |
| SP cosmetics | Met: purchase/equip, visible hat/wheel/block styles, once-only cost, lifetime SP preserved |
| Daily Lucky Spin | Met: saved result/day, one free spin per UTC day, displayed reward probabilities and next reset |
| Market events | Met: deterministic local Bull Run/Cheese Crash cycle, reward multiplier and remaining-time ticker; explicitly game events |
| Two stats charts | Met: inline SVG polylines, accessible labels/descriptions, actual local sampling, computed blocks/hour and an honest empty state |
| Settings and save portability | Met: audio/music volume, reduced motion, export/import, large receipt-rich save, invalid import errors, same-address restriction and confirmed reset |
| Storage/audio/provider absence | Met: no provider, throwing provider getter, blocked storage, quota failure and unavailable AudioContext all keep the UI usable |
| Keep the existing game/save logic | Met: original art, upgrades, event types, chain, check-in, Rebirth and v3 keys preserved; explicit earlier-save migration keeps its original backup |
| Full source/static output/documentation | Met: source, unchanged lockfile, complete dist, README, DESIGN and this report included |

## Interaction evidence

`npm test` runs `scripts/validate.mjs` against `dist/index.html`, using a temporary HTTP server and Chromium. Its signer generates fresh secp256k1 keys and signing points with Node crypto; no fixed private key is shipped. Known empty/abc Keccak vectors also pass. Test providers expose only the methods needed for account reads, signatures and network changes. The suite asserts that no transaction or approval method is requested and that maximum simultaneous provider requests stays at one.

The 188 assertions cover: focused nickname isolation on account switch/disconnect; same-session draft preservation and stale-form rejection; independent saved music after reload; no-wallet browsing and locked actions; install/discovery states; connect rejection and locking; rejected and malformed signatures; successful sign-in; taps and keyboard Turbo; original Cat/laser, Surge, Golden Seed and Lucky Block events; overheating/fan; harder upgrade prices and ×10 purchase; rising difficulty; individual, declined, duplicate and batch badge claims; independently generated signature recovery; receipt copy fallback; cosmetics and collection; daily spin/check-in and duplicate prevention; harder quest claims; skill success, timeout and jam failure; two chart paths; nickname changes; wrong-network hint/dismissal/Switch/Add; silent reload; stale pending claims during account change; switching back; disconnect/reload; expired authentication; invalid/valid import; failed reads; storage/audio denial; malformed injection; five named EIP-6963 wallets; offline cap; Rebirth; visible wheel/block cosmetics; UTC reset; market multipliers; quota fallback; large batch export/import; stale destructive confirmations; and one-time earlier-save migration.

Timed completion, long offline gaps, high-tier progress and large saves use controlled test state. They do not represent hours of manual play. Routine interaction paths use actual rendered controls, native dialogs and browser keyboard events. Locked controls are intentionally `aria-disabled` while remaining clickable to explain sign-in; the test explicitly activates that explanatory path.

Screenshot/results paths created during verification (disposable, regenerated by the checks):

- `test/scratch/taste/shots/390.png`, `390-full.png`, `1440.png`, `1440-full.png`
- `test/scratch/taste/taste.json`
- `test/scratch/interaction/browse-320.png`, `browse-390.png`, `browse-820.png`, `browse-1440.png`
- `test/scratch/interaction/signed-in-390.png`, `signed-in-1440.png`, `switched-profile-1440.png`
- `test/scratch/interaction/results.json`

The 390px browse and signed-in screenshots and the desktop game screenshot were opened and visually inspected. Screenshot paths are validation scratch output, not required runtime assets.

## Six-domain Better Interface review

The pinned workflow and core principles of all six domains were read and applied during implementation. [DESIGN.md](./DESIGN.md) records the final source values and reusable patterns.

| Domain | Coverage and result | Limits |
| --- | --- | --- |
| Accessibility | Checked: native buttons/dialogs/fields, named wallet and chart controls, skip link, focus rules, keyboard Space and tabs, locked-action explanations, progress roles, import error associations, Escape, reduced motion and measured target spacing. No remaining applicable blocker observed. | No screen-reader session, physical touch, forced-colors browser session or native zoom test |
| Layout | Checked: game-first 390px screen, source order, wrapping navigation, connected headers, all requested browse panels, exact requirements, expandable receipts and no overflow at 320/390/820/1440. Initial collisions fixed and probe rechecked. | Other browser engines and localized/RTL layouts not inspected |
| Writing | Checked: one short retained headline, plain browse/sign-in copy, explicit free signatures and local receipts, SP balance vs lifetime SP, honest Demo/local ranking, clear errors and destructive confirmations. Repeated slogan stack removed. | No external editorial/localization study |
| Typography | Checked: original six-size tokens, one computed family and two weights in the probe, 16px inputs, tabular data, wrapped addresses/receipt text, exact badge/quest counts. | Native iOS font/input behavior not inspected |
| Colors | Checked: existing light/dark source tokens, explicit text status cues and solid-pair probe contrast. All measured pairs meet 4.5:1 or 3:1 large. | Probe excludes two text boxes over artwork/gradients; every translucent/artwork pair and every active cosmetic variant was not exhaustively measured |
| UI | Checked: original surface language, pending/error/retry flows, account-bound confirmations, usable clipboard fallback, five original navigation shortcuts plus ten management tabs, visible cosmetics, progress states and reduced-motion stop. No transition:all, nested-card or repeated chrome finding in the probe. | No audible music quality, physical app handoff or slowed animation review |

## Findings fixed and rechecked

| Severity / area | Final source location and defect | Fix and evidence |
| --- | --- | --- |
| High / wallet gate | `index.html:4463` `isPlaying()` and `index.html:5151` `applyActionLocks()`: earlier implementation mined and mutated saves without signing | Unified browse state, visible locks and handler guards. No-provider and signature-failure tests prove no earnings or purchases before sign-in |
| High / profile isolation | `index.html:4574` `activateAccount()`: earlier account changes could carry another profile’s progress | Load only the new address’s save. Race/switch-back tests preserve separate names, balances and receipts |
| High / stale wallet results | `index.html:4324` `claimBadges()` and `index.html:4686` `refreshWallet()`: a late signature or balance could affect a new account/network | Account and network versions discard stale results. Pending-claim account switch and delayed cross-chain balance tests pass |
| High / layout | `index.html:2223` `.start-overlay`, `index.html:2272` phone wheelhouse: first probe observed text beneath the overlay and new status text beneath fixed navigation | Hide covered scene labels in browse mode; fit the scene and reserve the first phone surface. Screenshot inspection and final layout probe show no overlap, clipping or floating-control coverage |
| High / save fallback | `index.html:2998` storage get priority: failed quota writes could be followed by reads of stale stored data | Prefer the fresh session value and preserve removal tombstones. Quota test reloads the newer in-memory nickname |
| Medium / keyboard | `index.html:3926` Space handler: an unanchored editable-tag regex matched MAIN because it contained “A” | Match complete tag names and include the focused wheel’s keyboard path. Actual browser Space test passes |
| Medium / migration | `index.html:4938` `renderProfile()`: a strict zero-earnings check hid migration as soon as passive mining started | Offer explicit once-only migration regardless of incidental starter earnings, with replacement warning and original backup. Browser migration test passes |
| Medium / badge attainability | `index.html:4297` tier goals: generic multipliers exceeded the six-item wardrobe | Wardrobe tiers use 3/5/6 known cosmetics. Attainability and large-batch tests pass |
| Medium / large saves | `index.html:5590` `exportString()`: spreading a receipt-rich save into one function call could overflow the argument stack | Encode in 8,192-byte chunks. A save larger than 100K characters exports and imports with over 60 signed receipts |
| Medium / confirmation | `index.html:3470` `confirmAction()`: account changes could leave an old destructive callback open | Bind confirmation to the account/connection that opened it. Switching accounts while Reset is open cannot alter the new profile |
| Medium / copy | `index.html:3731` shop and page strings: several two-beat slogans repeated across the interface | Retain the established main headline and replace secondary slogans with task information. Final probe reports one such line |

No source, test, dependency or configuration was changed outside the authorized repository work. No ignore-file change or staging/commit was performed; the worker owns submission.

## Remaining limits and completion

Complete for the stated repository implementation scope. The native connector supports standard EIP-191 account signatures, not contract/passkey signatures requiring EIP-1271. Real MetaMask/Rabby/Coinbase/OKX/Trust extension prompts and physical mobile app links were **not** exercised; simulated provider integration does not certify vendor behavior. Native Safari/WebKit, screen readers, browser-native zoom, audible output and social-platform SVG preview support remain unverified.

The game intentionally has no backend, cloud save, online competitive ranking, NFT mint or contract claim. Signed receipts are local records; editable saves are not independent proof of game achievements. These limitations are disclosed in the UI and README. Nothing was published or deployed by this task.
