# Design system

Light-first, monochrome surfaces with one vermillion accent reserved for actions. Dark mode is derived (below).

## Color

| Token           | Light     | Dark      | Role                                                              |
| --------------- | --------- | --------- | ----------------------------------------------------------------- |
| `--accent`      | `#e42b0c` | `#ff5a3d` | Filled primary buttons, selected nav, one focal action per screen |
| `--ink`         | `#000000` | `#ffffff` | Hairlines, small icon strokes                                     |
| `--carbon`      | `#1f1f1f` | `#0b0b0c` | Inverted panels, footer, code blocks                              |
| `--text-strong` | `#101828` | `#f3f4f6` | Headings                                                          |
| `--text`        | `#364153` | `#d1d5db` | Nav text, secondary headings                                      |
| `--text-muted`  | `#4a5565` | `#9ca3af` | Body copy, icons, eyebrows                                        |
| `--text-faint`  | `#8a8a8a` | `#6b7280` | Helper text                                                       |
| `--placeholder` | `#99a1af` | `#6b7280` | Placeholders, disabled                                            |
| `--border`      | `#d4d4d4` | `#3a3a3d` | Buttons, inputs, dividers                                         |
| `--border-soft` | `#e5e7eb` | `#2a2a2d` | Card hairlines, nav border                                        |
| `--canvas`      | `#f5f5f5` | `#111113` | Page background                                                   |
| `--surface`     | `#ffffff` | `#18181b` | Cards and content                                                 |

The accent is never used for text links, decorative fills or illustrations. No second saturated color.

### Logo

Colors come from the ecosystem (Vue), not from the accent: `--logo-primary` `#42b883`, `--logo-secondary` `#35495e` (dark mode: `#6fd6a8` and `#9fb4c7`).

## Typography

- Font: Inter (variable, from `@fontsource-variable/inter`), `font-feature-settings: "case"`.
- Mono: JetBrains Mono (`@fontsource-variable/jetbrains-mono`).
- Scale (size / line height / tracking): micro 12/1.5/0.3px uppercase, caption 14/1.43, body-sm 16/1.5, body 18/1.5, body-lg 20/1.43, subheading 24/1.38, heading-sm 30/1.33, heading 48/1.2/-1.2px, heading-lg 60/1.0/-1.5px, display 72/1.0/-2.16px.
- Display and headings use weight 300 to 500. Weight 700 is not used for display text.
- Body text is never below 14px. 12px is only for uppercase eyebrows and micro labels.
- Letter spacing stays within -0.03em, -0.025em and 0.025em.

## Spacing and shape

- Base unit 8px: 8, 16, 24, 32, 40, 48, 64, 80, 96.
- Content width 1200px, section gap 64px, card padding 24 to 32px, element gap 16px.
- Radius is 8px everywhere (cards, buttons, inputs, tags, images). No other radii.
- Borders are 1px. Input focus is a 1px `--text-strong` border, no glow.
- One shadow only: `0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1)`; in dark mode borders replace shadows.

## Components

- **Primary button**: accent background, white text, 8px radius, 12px 24px padding, 14 to 16px weight 500, uppercase, 0.025em tracking, trailing arrow. At most one per screen.
- **Dark button**: carbon background, white text, same metrics.
- **Ghost button**: transparent, 1px `--border`.
- **Card**: surface background, 1px `--border-soft`, 8px radius, 32px padding.
- **Eyebrow badge**: transparent, 1px `--border`, 4px 12px padding, micro type, `--text-muted`.
- **Input**: surface background, 1px `--border`, 12px 16px padding, 48px height.
- **Nav**: sticky, surface background, 1px `--border-soft` bottom border, 64px tall.
- **Stat block**: 60px weight 300 number, 14px label, no card chrome.

## Layout

- Page canvas `--canvas`; sections alternate canvas and surface, no dark/light inversion between sections.
- Hero is one white card on the canvas, text left (~45%), product visual right.
- Feature grids use 3 equal columns with 32px gaps.

## Do

- Use the accent only for filled primary actions and 1 to 2px outlined action borders.
- Set headings in `--text-strong`; reserve pure black for hairlines and small icon marks.
- Keep shadows to the single stack above.

## Don't

- Don't use radii other than 8px, including pill shapes.
- Don't use the accent on text links or decorative fills.
- Don't place a carbon card on a surface section without a reason for the emphasis.
