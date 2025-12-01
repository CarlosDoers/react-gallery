# LayeredText

A kinetic typography component where text layers slide and skew on hover, creating a 3D stacked effect.

## Features
- **Kinetic Animation**: Uses GSAP to animate text layers vertically on hover.
- **Skewed Perspective**: Alternating skew transforms create a 3D structural look.
- **Responsive**: Adapts font size and offsets for mobile devices.
- **Customizable**: Configurable text lines, font sizes, and line heights.

## Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `lines` | `Array<{top, bottom}>` | (Default List) | Array of objects with `top` and `bottom` text for each layer. |
| `fontSize` | `string` | `"72px"` | Font size for desktop. |
| `fontSizeMd` | `string` | `"36px"` | Font size for mobile. |
| `lineHeight` | `number` | `60` | Line height for desktop. |
| `lineHeightMd` | `number` | `35` | Line height for mobile. |
| `className` | `string` | `""` | Additional CSS classes. |

## Installation

Requires `gsap`.

```bash
npm install gsap
```

## Usage

```jsx
import LayeredText from './LayeredText';

<LayeredText 
  lines={[
    { top: "HELLO", bottom: "WORLD" },
    { top: "REACT", bottom: "GALLERY" }
  ]}
  fontSize="60px"
/>
```
