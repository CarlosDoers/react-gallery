# Waves Component

A WebGL-like wave simulation using SVG and Simplex Noise. The waves react to mouse movement and create a smooth, organic flow.

## Installation

Requires `simplex-noise`.

```bash
npm install simplex-noise
```

## Usage

```jsx
import Waves from './Waves';

<Waves 
  strokeColor="#ffffff"
  backgroundColor="#000000"
  pointerSize={0.5}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `strokeColor` | string | `#ffffff` | Color of the wave lines and cursor dot. |
| `backgroundColor` | string | `#000000` | Background color of the container. |
| `pointerSize` | number | `0.5` | Size of the cursor dot in rem. |
| `className` | string | `""` | Additional CSS classes. |

## Features

- **Simplex Noise**: Uses `simplex-noise` to generate organic wave patterns.
- **Mouse Interaction**: Waves react to mouse position and velocity.
- **Smooth Animation**: Uses `requestAnimationFrame` for high-performance rendering.
- **Responsive**: Automatically adjusts to container size.
