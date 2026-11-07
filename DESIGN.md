# SqueekWheel design system

## Product and visual idea

SqueekWheel is a cozy idle mining game carried by one visual idea: a small illustrated hamster workshop above a navy chain of earned blocks. Warm orange identifies the main Turbo action; cream surfaces keep the dense game controls approachable. The game appears directly below a short heading, with no marketing hero separating players from the wheel.

The implementation is `index.html`. CSS starts at line 30; the inline symbol library, hamster illustration and embedded application follow it. This document describes the implemented source. Browser rendering was unavailable; responsive behavior below is established from source, not screenshots.

## Colors

All UI components use semantic custom properties from `:root` and `:root[data-theme="dark"]`. A single data attribute controls the theme. The initial choice follows `prefers-color-scheme`; explicit changes are remembered.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--bg` | `#faf7f0` | `#1b1e27` | Page and input background |
| `--surface` | `#fffefa` | `#242834` | Cards, dialogs, header utilities |
| `--soft` | `#f3efe6` | `#2e323e` | Neutral controls and tracks |
| `--ink` | `#292d3b` | `#f8f2e7` | Primary text |
| `--muted` | `#706d66` | `#bcb7af` | Supporting text |
| `--line` | `#e6e1d6` | `#41444e` | Structural dividers |
| `--accent` | `#ff8b3d` | `#ff9c58` | Turbo and emphasized action fills |
| `--accent-ink` | `#703309` | `#ffbd8e` | Accent text on soft surfaces |
| `--accent-soft` | `#fff0dd` | `#432f25` | Accent control/category surfaces |
| `--progress-fill` | `#b45c25` | `#ff9c58` | Progress fill with stronger contrast |
| `--green` | `#347553` | `#9bd9ac` | Success/status text |
| `--green-soft` | `#e9f3e8` | `#263c33` | Success/status background |
| `--scene` | `#fff4df` | `#373027` | Wheelhouse scene |
| `--scene-dot` | `#e6cfa4` | `#69513c` | Decorative scene pattern |
| `--focus` | `#3066b2` | `#8ebeff` | Keyboard focus ring |
| `--danger` | `#a53c31` | `#ffb4a9` | Reset and cat/laser cues |
| `--navy` | `#282f43` | inherited light token | Permanent chain surface |
| `--navy-muted` | `#bfc7da` | inherited light token | Text on navy |

The main orange button uses `#42240f` text. The mining track uses `#a64f1c` on `#dfcfaf`. Rare block tiles use green, Epic purple and Legendary gold, with explicit rarity labels. Glows are reserved for rare earned blocks, as requested. Original warm SVG fur and wheel colors remain consistent between themes; wallet cosmetics can change the wheel gradient to mint or violet.

Measured **from declared opaque sRGB pairs**, body/surface contrast is 13.58:1 light and 13.20:1 dark; secondary text/surface is 5.11:1 and 7.37:1; accent text/soft accent is 8.66:1 and 7.73:1. Primary action contrast is 6.04:1. The progress token pairs are 4.07:1 and 6.18:1; the mining progress pair is 3.64:1. These are calculated source-token ratios, not measurements of rendered gradients or composited pixels.

## Typography

The family is `ui-rounded, "Trebuchet MS", Arial, sans-serif`; no font files or CDNs are needed. Regular text uses weight 400 and emphasis uses 800. The six sizes are:

| Token | Size | Use |
| --- | --- | --- |
| `--xs` | `.75rem` / 12px | Data labels, compact controls, captions |
| `--sm` | `.875rem` / 14px | Shop titles, buttons, dialog copy |
| `--body` | `1rem` / 16px | Body, forms, subordinate headings |
| `--lg` | `1.25rem` / 20px | Card titles and key statistics |
| `--xl` | `2rem` / 32px | Compact heading and modal reward |
| `--display` | `2.75rem` / 44px | Desktop page heading |

Headings use tight tracking within `-.05em` at display size; body tracking stays natural. The brand uses `-.04em`. Body line-height is 1.5, page heading 1.1, card heading 1.3 and dialog copy 1.65. Changing numbers use tabular numerals. Mobile form inputs remain 16px. Names and full addresses wrap rather than being clipped; short wallet/hash previews have accessible full-value destinations. Shared-card names wrap into two SVG lines when needed.

## Layout and responsive behavior

The page wrapper is at most 1312px with 36px inline padding. At 1500px and wider it grows to 1400px. Main content uses a `1.45fr / 1fr` game/management grid with a 24px gap. The scene and chain share the left edge; the tabbed management panel occupies the right. The lower row contains check-in, season and compact profile cards.

Spacing uses 4, 8, 12, 16, 20, 24, 26, 28, 32 and 36px according to component density. Main sections have 20–24px separation; related fields typically have 6–10px internal gaps. Text containers can grow. Only the illustration stage has an intentional fixed height.

| Breakpoint | Source behavior |
| --- | --- |
| Above 1500px | Wider wrapper; 327px illustration stage |
| At/below 1100px | 26px outer padding, narrower column ratio/gap, secondary header links hidden; lower row has two cards |
| At/below 820px | Single column; 32px page heading; game/chain precede management; bottom quick navigation appears; footer has bottom-bar clearance |
| At/below 520px | 16px outer padding; 67px header; only the two principal currencies stay in the top stat row; illustration is 253px high; management stays below the game; lower cards stack |
| At/below 359px | 12px outer padding; smaller brand/controls; scene note hidden; header sound control moves to the existing settings flow |

The 390px design keeps the heading, currencies, wheel and Turbo control in the first viewport by reducing chrome and the illustration stage. This intended first-screen placement has **not** been confirmed in a rendered screenshot. The mobile wallet label retains “Connect Wallet (optional)”. Navigation and dialogs account for safe-area insets; wallet dialogs become bottom sheets under 520px. The general page never uses overflow hiding to conceal layout failures. Only the chain itself is a deliberately scrollable horizontal sequence.

## Surfaces, shapes and components

- **Cards:** 24px radius; `0 8px 32px #30271809` shadow in light and `0 8px 32px #00000016` in dark. Lower utility cards use a structural border and no shadow. The wheelhouse uses its scene fill rather than an extra shadow.
- **Buttons:** `.btn` has a 44px minimum height and 12px radius. `.turbo-btn` is the primary 49px action, reduced to 46px on phones, with a cooldown fill and a text countdown. Compact secondary controls are at least 24px tall and separated. Disabled purchases retain their cost and clear inactive appearance.
- **Management tabs:** `.tabs` / `.tab` use native buttons, selected underline, icon and text. Arrow keys, Home and End navigate a roving tab stop. Five panels share `#panel-content`. Re-rendering restores focus to the corresponding control or the panel.
- **Shop:** a segmented category picker, quantity controls, and four upgrade rows per category. Each row aligns icon, title, production preview, owned count and purchase cost. ×10 is a batch purchase; Max quotes every affordable item within the validated ownership bound.
- **Progress:** a 7px rounded track; 5px and 4px variants support quests and badges. Labels and numeric values accompany progress. The block bar has a progressbar role with current value.
- **Avatars:** inline deterministic hamster SVGs. Guest identity is stable; linked wallets use the address seed. Cosmetics alter only the game illustration.
- **Blocks:** 105px tiles with number, short hash and rarity. The newest five are visible in the chain; clicking a tile reveals the full illustrative hash, timestamp and SP reward. Fifty recent block records are retained; lifetime counts remain permanent.
- **Dialogs:** native `<dialog>`, 25px radius, 28px padding, at most 460px wide and 85dvh tall. The dim backdrop has 5px blur. There is a named close control and focus return. Destructive confirmations repeat the action consequence.
- **Notifications:** stable polite live region, explicit icon, text and dismiss control. Routine messages expire after 5.5 seconds; actionable errors persist. Toasts clear the mobile bottom navigation.
- **Profile/leaderboard/badges:** wrapping identities, clearly marked Demo rows, a pinned player row, text rarity/unlock dates, progress and category buttons with `aria-pressed` state.

## Motion and accessibility

Interactive transitions target explicit properties at 140ms; pressing a button scales it to `.96`. CSS bobbing, wheel rotation, particles and confetti all stop for reduced motion or the remembered animation pause preference. Numbers and mining progress remain readable without animation. Theme changes temporarily suppress transitions. Sounds use Web Audio and begin muted; no audio files are downloaded.

Native links, buttons, forms, details and dialog provide semantics. A skip link precedes the header. Focus uses a 3px ring with 4px offset; navy-chain controls use a pale gold ring and toast controls use the contrasting background token. Forced-colors overrides preserve visible control boundaries. Optional features never gate the game, and wallet/network errors include a guest-safe recovery message.

Screen-reader navigation, native focus trapping/return, 200% zoom, rendered reflow, real reduced-motion output and physical touch have not been verified. DOM tests establish event behavior and labels, not those rendered qualities.

## Extending the page

Use the existing `.wrap`, `.card`, `.panel-heading`, `.between`, `.stack`, `.btn`, `.field` and `.progress` primitives. Start a new management feature as a panel, with a plain task heading and one main action. Keep normal text on `--ink`/`--muted`, reserve `--accent-ink` for its matching soft surfaces, and use `--progress-fill` for tracks. Reuse the `icon()` SVG symbols and deterministic `avatar()` function. Add keyboard state and reduced-motion handling alongside any new behavior. Keep gameplay available before, during and after optional wallet actions.

Guidance attribution and licenses: see [DESIGN-GUIDANCE-LICENSE.txt](./DESIGN-GUIDANCE-LICENSE.txt) and the README. This design inventory records actual source decisions; remaining verification gaps are tracked in [VALIDATION.md](./VALIDATION.md).
