---
name: Focus Precision
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-xs:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-xxs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  container-padding: 1rem
  element-gap: 0.5rem
---

## Brand & Style
The design system is engineered for high-density information management and cognitive clarity. It targets power users who manage dozens of tabs and windows simultaneously. The emotional goal is "calm productivity"—reducing the visual noise of the web to allow the user to focus on organization and task completion.

The style is **Modern Minimalist** with a focus on structural integrity. It utilizes a refined palette of deep slates and charcoals to recede into the background, while using precision-targeted color and subtle elevation to highlight active states. There is an emphasis on "Information Density" where padding is intentional but compact, ensuring maximum data visibility without feeling crowded.

## Colors
This design system defaults to a **Dark Mode** to reduce eye strain during long sessions.
- **Primary (Productivity Blue):** Used for primary actions, active tab indicators, and focus states. It is a vibrant, high-contrast blue that cuts through the dark background.
- **Secondary (Success Green):** Reserved for saved states, "Done" indicators, and successful sync confirmations.
- **Neutral/Surface:** A range of deep charcoals (#0F172A) and slates (#1E293B) are used to create structural hierarchy. The deepest shade is the backdrop, with lighter slates used for "Window" cards.
- **Border:** A consistent, low-contrast slate (#334155) is used for all structural separation, ensuring clarity without the harshness of pure white or black lines.

## Typography
The system relies on **Inter** for its exceptional legibility at small sizes and its neutral, systematic feel. 
- **Hierarchy:** Window titles use `headline-sm` to provide clear anchors. 
- **Density:** Tab titles use `body-sm` to allow for more text visibility in narrow list items. 
- **Metadata:** Tab counts, keyboard shortcuts, and group tags use `label-md` or `label-xs` to differentiate "data about data" from the content itself.
- **Micro-copy:** To maintain a high-density look, letter spacing is slightly increased on uppercase labels for readability.

## Layout & Spacing
The layout follows a **Fluid Grid** model designed to adapt to various browser sidebar widths or popup dimensions. 
- **Spacing Logic:** We use a tight 4px-based scale. `space-sm` (8px) is the standard gap between related elements, while `space-md` (12px) separates distinct functional groups.
- **Density Controls:** The vertical rhythm is kept tight to ensure as many tabs as possible are visible above the fold. 
- **Adaptive Reflow:** On narrower widths, metadata (like timestamps) should hide to prioritize the Tab Title. Window cards stretch to fill the 100% width of the extension container.

## Elevation & Depth
Depth is achieved through a combination of **Tonal Layers** and **Ambient Shadows**.
- **Level 0 (Base):** The darkest slate, used for the main application background.
- **Level 1 (Cards):** Slightly lighter slate with a 1px solid border. This is used for "Window" containers.
- **Level 2 (Active/Overlays):** Elements that are being dragged or hovered receive a soft, extra-diffused shadow (`0px 4px 12px rgba(0,0,0,0.4)`) and a brighter border color.
- **Separation:** Tab groups are separated by subtle horizontal rules rather than large gaps to maintain vertical density.

## Shapes
The design system uses **Soft** geometry (4px/0.25rem) to maintain a professional, organized feel. 
- **Small Elements:** Buttons and Checkboxes use the base 4px radius.
- **Large Elements:** Window cards and Tab Groups use `rounded-lg` (8px) to create a clear "container" feel.
- **Tags:** Group tags use a "semi-pill" look (6px) to distinguish them from standard buttons.

## Components
- **Window Cards:** Large containers with `space-md` internal padding and a `headline-sm` title bar. These group tab lists together.
- **Tab List Items:** High-density rows (32px-36px height) featuring a favicon, `body-sm` title, and a hidden-until-hover "Close" button. The active tab uses a 2px Primary Blue left-border highlight.
- **Group Tags:** Small, colored badges with `label-xs` typography. They use a low-opacity background of the group color and a high-opacity border of the same color.
- **Action Buttons:** Subtle ghost buttons for secondary actions, turning to solid Primary Blue for the main "New Tab" or "Save Session" triggers.
- **Input Fields:** Search bars are flush with the top of the interface, using a subtle bottom-border and a search icon, minimizing vertical space usage.
- **Checkboxes:** Used for multi-tab selection; they should be small (14px) and appear only on hover or when one is already selected to reduce visual clutter.