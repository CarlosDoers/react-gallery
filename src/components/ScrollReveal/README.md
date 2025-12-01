# ScrollReveal Component

A React component that implements a scroll-driven animation where text scales down to reveal the background image, inspired by the GTA VI website.

## 1. Installation

This component requires `prop-types`.

```bash
npm install prop-types
```

## 2. Integration

1.  Copy the `ScrollReveal.jsx` and `ScrollReveal.css` files into your project (e.g., `src/components/ScrollReveal/`).
2.  Import the component where you want to use it.

## 3. Usage

```jsx
import ScrollReveal from './ScrollReveal';

function MyComponent() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ScrollReveal
        svgSrc="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg"
        imageSrc="https://images.unsplash.com/photo-1534239143101-1b1c627395c5?q=80&w=2560&auto=format&fit=crop"
        zoomLevel={100}
        damping={0.05}
      />
    </div>
  );
}
```

## 4. Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `svgSrc` | `string` | (React Icon URL) | The URL of the SVG to display and scale. |
| `imageSrc` | `string` | (Unsplash URL) | The background image URL. |
| `overlayColor` | `string` | `'rgba(0, 0, 0, 0.5)'` | Color of the overlay on top of the image. |
| `zoomLevel` | `number` | `100` | How much the logo scales up (1 = original size). |
| `damping` | `number` | `0.05` | The smoothness of the animation (0.01 - 0.1). Lower is smoother/heavier. |
| `opacityStart` | `number` | `0.2` | Scroll progress (0-1) when background starts fading in. |
| `opacityEnd` | `number` | `0.6` | Scroll progress (0-1) when background is fully visible. |
