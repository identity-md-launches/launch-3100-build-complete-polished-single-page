# SqueekWheel design system

## Overview

SqueekWheel remains a cozy hamster workshop: cream surfaces, orange actions, a locally illustrated running wheel and a navy chain of earned blocks. The existing artwork, brand, grid and playful headline stay. The new start overlay makes the wallet requirement clear without hiding the shop, quests, badges or other read-only content.

The canonical implementation is `index.html`. This inventory follows the final source and rendered Chromium screenshots. The six-domain review and its limits are in [VALIDATION.md](./VALIDATION.md).

## Colors

Reuse semantic variables in `:root` and `:root[data-theme="dark"]`; there is one theme mechanism. The existing hex palette is retained.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg` | `#faf7f0` | `#1b1e27` | Page and input background |
| `--surface` | `#fffefa` | `#242834` | Cards, sheets and header controls |
| `--soft` | `#f3efe6` | `#2e323e` | Neutral controls and tracks |
| `--ink` | `#292d3b` | `#f8f2e7` | Main text |
| `--muted` | `#706d66` | `#bcb7af` | Supporting text |
| `--line` | `#e6e1d6` | `#41444e` | Dividers |
| `--accent` | `#ff8b3d` | `#ff9c58` | Start and Turbo action fills |
| `--accent-ink` | `#703309` | `#ffbd8e` | Accent text on its matching soft surface |
| `--accent-soft` | `#fff0dd` | `#432f25` | Selected filters and purchase backgrounds |
| `--progress-fill` | `#b45c25` | `#ff9c58` | Progress and chart strokes |
| `--green` | `#347553` | `#9bd9ac` | Ready/success text |
| `--green-soft` | `#e9f3e8` | `#263c33` | Success backgrounds |
| `--scene` | `#fff4df` | `#373027` | Wheelhouse background |
| `--scene-dot` | `#e6cfa4` | `#69513c` | Scene pattern |
| `--focus` | `#3066b2` | `#8ebeff` | Keyboard focus ring |
| `--danger` | `#a53c31` | `#ffb4a9` | Destructive text and heat |
| `--navy` | `#282f43` | same | Chain background |
| `--navy-muted` | `#bfc7da` | same | Chain secondary text |

The primary orange fill uses `#42240f` text. Existing rarity colors remain text-labeled. Purchased cheese and circuit block backgrounds are `#554222` and `#244d47`. Breed fur and wheel palettes belong to the illustration; the UI keeps its established semantic colors. The start overlay composites 76% scene color over the illustration using `color-mix`; its button and text remain opaque.

The final taste probe reports that all resolved solid-background text pairs in its inspected states meet 4.5:1, or 3:1 for large text. Two text boxes over images/gradients remain outside that automated measurement. This is not a claim about every artwork or translucent pixel.

## Typography

Use `ui-rounded, "Trebuchet MS", Arial, sans-serif`, with regular 400 and emphasis 800. No font downloads are needed. The six-size source scale remains:

| Token | Size | Role |
| --- | --- | --- |
| `--xs` | 12px | Compact data, badge tiers, phone indicators |
| `--sm` | 14px | Buttons, secondary copy and dialog text |
| `--body` | 16px | Forms, body and subordinate headings |
| `--lg` | 20px | Card headings and key statistics |
| `--xl` | 32px | Phone headline and large modal values |
| `--display` | 44px | Desktop headline |

Headings use tight tracking at display size; content uses natural spacing. Body line-height is 1.5, the main headline 1.1, and modal copy 1.65. Numeric counters use tabular numerals. Exact badge and quest requirements use localized whole numbers; the main currency counters abbreviate large values and expose their full values in titles. Addresses, receipt text and long names wrap. Receipt blocks use the regular family rather than adding a third prose face. Inputs remain 16px on phones.

## Layout

Reuse `.wrap`, `.workspace`, `.card`, `.between`, `.stack`, `.field`, `.progress` and `.btn`. The wrapper is at most 1312px, extending to 1400px above 1500px. The desktop game/management grid uses a 1.45fr / 1fr split with a 24px gap. Spacing follows the existing 4–36px steps, with 8–12px within controls and 18–24px between major groups.

| Width | Implemented behavior |
| --- | --- |
| Above 1100px | Wheel/chain left; management right; utility cards below |
| 1100px and narrower | Outer padding reduces and secondary header links disappear |
| 820px and narrower | Single column, 32px headline, bottom quick navigation, game first |
| 520px and narrower | 16px outer padding; two principal currencies; 205px illustration stage; indicator text uses 12px; controls and wallet details wrap |
| Below 359px | 12px outer padding and compact brand/utilities; sound remains available in Settings |

At phone widths the wheelhouse has a minimum height of `calc(100svh - 230px)` so new status controls and the fixed quick navigation occupy distinct space on the first screen. The connect action appears over the wheel above the fold. The main management tabs wrap into rows and all ten destinations remain visible. The bottom navigation retains its five existing shortcuts; the other destinations are in the management tabs.

Chromium checks cover 320, 390, 820 and 1440px, including connected headers and every management surface at the tested widths. The pinned probe also checks 320/390/1440. The chain intentionally scrolls horizontally inside its own region; the page has no horizontal overflow in those checks. Receipt details expand in normal flow.

## Elevation & Depth

Cards use the existing `--shadow` (`0 8px 32px #30271809`, dark `#00000016`). Lower utility cards use a divider border without shadow. The wheel uses its warm scene fill; the start prompt overlays only the illustration stage, leaving the rest of the page browsable. Native `<dialog>` sheets use a dim blurred backdrop and contain their own scroll. Toasts sit above the page and clear the fixed phone navigation.

Rare block glows remain a deliberate part of the existing game’s rarity language. The probe reports no structural border-plus-shadow surface or nested-card finding in the reviewed page.

## Shapes

Keep 24px main card corners, 12px standard buttons and fields, 10px purchase buttons, rounded progress tracks and the circular wheel. Native dialogs retain their 25px corners. The large connect action has a 52px minimum height and wraps rather than clipping its label. Standard `.btn` targets are at least 44px; compact controls preserve the project’s denser layout and meet the measured 24px target/spacing baseline.

## Components

- **Start overlay / action gate:** `#start-overlay`, `.start-overlay`, `applyActionLocks()`, `requirePlay()`. Before sign-in, actions show a local lock SVG, `aria-disabled`, a matching tooltip and a connect-modal handler. They remain keyboard reachable. Gameplay functions independently enforce sign-in. The decorative scene text is hidden under the browse overlay to prevent collisions.
- **Wallet sheet and header:** `connectModal()`, `renderWalletList()`, `renderWalletButton()`. Local vector wallet marks, named EIP-6963 rows, 1.5-second discovery, install/app links, a free-signature explanation, pending labels and calm inline errors. Connected, the header shows an address-seeded avatar, short address, balance and network. Full address and disconnect are in Profile. Wrong-network hints have separate Switch/Add and Dismiss controls.
- **Management navigation:** `TABS`, `renderTabs()`, `openTab()`. Ten native tab buttons with selected state, roving tabindex, arrow keys, Home and End. Panels retain focus when content is replaced. Mobile quick links scroll to the appropriate region.
- **Badge and claims panels:** `renderBadges()`, `renderClaims()`. Bronze/Silver/Gold text, exact requirements, live numeric progress, Locked/Ready/Claimed actions, claim dates and expandable/copyable receipts. The copy fallback offers a selectable text area when clipboard access is blocked. Batch signing names every included badge.
- **Game indicators:** `.game-indicators`, `renderGameStatus()`. Difficulty, active breed, heat with a progressbar, a labeled fan button, jam countdown and a stationary market ticker. Every status has text; color and motion are supplementary.
- **Collection / cosmetics / spin:** `.feature-list`, `.feature-item`, `.spin-result`. Reuse simple divided rows, exact unlock/cost progress and native actions. Active/Equipped/Owned/Locked labels stay explicit. No nested decorative cards are added.
- **Stats charts:** `.stat-chart`, `renderLineChart()`. Two inline SVG polylines with local samples, labeled axes, title/description and a numeric latest-value caption. Empty charts explain the two-sample requirement.
- **Settings:** existing native dialog and fields, plus `.volume-field` ranges. Separate sound/music volume, reduced motion, export/import and confirmed reset. Destructive callbacks are bound to the account that opened the confirmation.
- **Feedback and focus:** native dialogs support Escape, return focus and provide a named close button. Existing 3px focus outlines remain. Toasts use a stable polite live region and a dismiss control. Inline import errors use `aria-invalid` and `aria-describedby`.

Motion honors the device’s reduced-motion preference and the saved pause setting. Wheel rotation, hamster animation, particles and confetti stop; data and actions remain usable. Synthesized audio is off initially and waits for interaction. Its availability never gates the UI.

## Do’s and Don’ts

Start another game panel with the existing panel heading and feature rows. Keep requirements next to the controls they govern. Use the established six-size scale and semantic colors. Preserve the warm illustration and navy chain.

Gate mutations through `requirePlay()` and the shared locked-action treatment. Keep content readable before sign-in, isolate address saves and reject stale wallet callbacks. Keep SP balance distinct from lifetime SP. Label local/Demo data honestly. Bundle art and icons locally, use native controls, wrap critical values, and preserve reduced motion.

Do not add a second palette or font, turn a local score into an online claim, or introduce transaction/approval flows. Do not attach decorative labels above every heading or put informational content behind wallet access.

Guidance notices and licenses remain in [DESIGN-GUIDANCE-LICENSE.txt](./DESIGN-GUIDANCE-LICENSE.txt).
