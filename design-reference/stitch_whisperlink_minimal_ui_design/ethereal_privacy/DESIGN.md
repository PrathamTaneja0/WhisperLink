---
name: Ethereal Privacy
colors:
  surface: '#faf9fb'
  surface-dim: '#dadadc'
  surface-bright: '#faf9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f6'
  surface-container: '#eeedf0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e5'
  on-surface: '#1a1c1e'
  on-surface-variant: '#42474d'
  inverse-surface: '#2f3033'
  inverse-on-surface: '#f1f0f3'
  outline: '#72787e'
  outline-variant: '#c2c7ce'
  surface-tint: '#3f627e'
  primary: '#3c5f7b'
  on-primary: '#ffffff'
  primary-container: '#557895'
  on-primary-container: '#fcfcff'
  inverse-primary: '#a7cbeb'
  secondary: '#615b6e'
  on-secondary: '#ffffff'
  secondary-container: '#e8dff5'
  on-secondary-container: '#686174'
  tertiary: '#785527'
  on-tertiary: '#ffffff'
  tertiary-container: '#946d3d'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cbe6ff'
  primary-fixed-dim: '#a7cbeb'
  on-primary-fixed: '#001e30'
  on-primary-fixed-variant: '#254a65'
  secondary-fixed: '#e8dff5'
  secondary-fixed-dim: '#cbc3d8'
  on-secondary-fixed: '#1e1929'
  on-secondary-fixed-variant: '#494455'
  tertiary-fixed: '#ffddb7'
  tertiary-fixed-dim: '#edbe86'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#604014'
  background: '#faf9fb'
  on-background: '#1a1c1e'
  surface-variant: '#e2e2e5'
  mist-pink: '#F3E1E1'
  soft-cyan: '#D1E8E4'
  dusk-slate: '#334155'
  surface-cream: '#FCF9F7'
typography:
  display:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1120px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
---

## Brand & Style

The brand personality is ephemeral, secure, and weightless. It aims to evoke a sense of digital serenity—a "safe harbor" for conversation where data exists only in the moment. The target audience includes privacy-conscious individuals, spontaneous collaborators, and anyone seeking a low-friction alternative to heavy communication suites.

The design style is a blend of **Minimalism** and **Soft Glassmorphism**. It utilizes expansive white space to denote clarity and a "breathable" UI, paired with delicate pastel gradients that mimic the shifting colors of a twilight sky. High-contrast typography ensures that while the aesthetics are soft, the utility remains sharp and professional. The "privacy-first" aesthetic is achieved through a reduction of traditional UI "noise" (no sidebars, no profile pictures, no persistent footers), focusing entirely on the active session.

## Colors

The palette is derived from the soft, diffused tones of a sunset, signifying the "fading" nature of ephemeral messages. 

- **Primary:** A muted slate blue used for key instructional text and primary branding, providing a stable anchor for the eyes.
- **Secondary:** A soft lavender used for interactive highlights and secondary surfaces.
- **Neutral:** A warm, near-white cream serves as the primary canvas to avoid the clinical feel of pure white, enhancing the "airy" quality of the interface.
- **Named Colors:** These pastels (Pink and Cyan) are used sparingly as background washes or container borders to categorize different session states or UI zones without adding visual weight.

## Typography

This design system uses a sophisticated typographic pairing to balance authority with modern speed. 

- **Headlines:** **Libre Caslon Text** provides a literary, established feel. Its high-contrast serifs suggest the "trust" and "security" of a private letter.
- **UI & Body:** **Hanken Grotesk** is used for all functional elements. Its clean, sharp metrics ensure high legibility at small sizes and convey the technical efficiency of the platform.
- **Scale:** Large display type is used for landing states to emphasize the "privacy" value proposition, while functional labels use increased letter spacing and semi-bold weights for instant recognition during fast-paced interactions.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for desktop to maintain a centered, intimate reading experience, while transitioning to a **Fluid Grid** for mobile devices. 

- **Rhythm:** A 4px baseline grid ensures vertical consistency. 
- **Margins:** Generous external margins (64px on desktop) are used to "squeeze" the content toward the center, reinforcing the feeling of a private, focused conversation.
- **Breakpoints:** 
  - **Mobile (<640px):** Single column, reduced padding, 20px side margins.
  - **Tablet (640px - 1024px):** 8-column grid with 24px gutters.
  - **Desktop (>1024px):** 12-column grid within a 1120px container.

## Elevation & Depth

Depth in the design system is achieved through **Tonal Layers** and **Soft Shadows** rather than heavy skeuomorphism.

- **Surfaces:** The primary background is the neutral cream. Active elements (like the chat window or video cards) sit on a pure white surface with a very subtle, light-grey 1px border.
- **Backdrop Blurs:** When modals or overlays appear, a "Glassmorphism" effect is applied to the background with a 12px blur, maintaining the "airy" feel while directing focus.
- **Shadows:** Use "Ambient Shadows"—extremely soft, multi-layered shadows with low opacity (e.g., `y: 4, blur: 20, color: rgba(0,0,0, 0.04)`) to make elements appear to float gently above the surface.

## Shapes

The shape language is consistently **Rounded**, avoiding sharp corners to maintain a friendly and approachable atmosphere. 

- **Standard Elements:** Buttons and input fields use a 0.5rem (8px) radius. 
- **Large Containers:** Cards and session windows use a 1.5rem (24px) radius to emphasize the "enclosed" and "private" nature of the session.
- **Icons:** Use rounded caps and joins to match the soft UI curvature.

## Components

- **Buttons:** Primary buttons are solid `dusk-slate` with high-contrast white text. Secondary buttons use a ghost style with a 1px border of the primary color. Use "hover" states that subtly shift the background color to a lighter pastel variant.
- **Cards:** Content cards use a thin border colored by the `named_colors` (e.g., a light pink border for "Privacy" cards) to provide soft categorization without heavy fills.
- **Input Fields:** Minimalist design with only a bottom border that expands to a full-outline focus ring in lavender when active. 
- **Chips/Status Indicators:** Use the `soft-cyan` and `mist-pink` for "Online" or "System" messages, respectively.
- **Ephemeral Timer:** A distinctive component—a thin, circular progress ring around the "End Session" button that visually counts down the remaining time of the room.