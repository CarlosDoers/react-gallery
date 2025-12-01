# HolographicCard

A premium 3D card component with holographic gradient effects and mouse-tracking tilt.

## Features
- **3D Tilt**: Reacts to mouse movement with smooth physics.
- **Holographic Overlay**: Dynamic color-dodge gradients that shift with the mouse.
- **Glassmorphism**: Frosted glass aesthetics and border glow.
- **Depth**: Content pops out using `translateZ`.

## Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `content` | `ReactNode` | `null` | Custom content to display inside the card. |
| `imageSrc` | `string` | (Unsplash URL) | Background image URL. |
| `hologramColor` | `string` | `'#ff0080'` | Base color for the holographic effect (used in CSS vars). |
| `enableTilt` | `boolean` | `true` | Whether to enable the 3D tilt effect. |

## Usage

```jsx
import HolographicCard from './HolographicCard';

function MyComponent() {
  return (
    <HolographicCard 
      imageSrc="https://example.com/image.jpg"
      content={
        <div>
          <h2>My Card</h2>
          <p>Description here...</p>
        </div>
      }
    />
  );
}
```
