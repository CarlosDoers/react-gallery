# Dotted Surface

A mesmerizing 3D particle wave surface effect using Three.js. Creates an animated grid of particles that move in smooth wave patterns.

## Features

- **3D Particle Grid**: Creates a large grid of animated particles in 3D space
- **Wave Animation**: Particles move in beautiful sine wave patterns
- **Customizable**: Adjust particle colors, sizes, wave speed, and grid dimensions
- **Performant**: Efficient Three.js implementation with proper cleanup
- **Responsive**: Automatically adjusts to window size changes

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `particleColor` | `string` | `'#c8c8c8'` | Hex color for particles |
| `particleSize` | `number` | `8` | Size of each particle |
| `particleOpacity` | `number` | `0.8` | Opacity of particles (0-1) |
| `waveSpeed` | `number` | `0.1` | Speed of wave animation |
| `waveAmplitude` | `number` | `50` | Height of wave peaks |
| `gridSpacing` | `number` | `150` | Distance between particles |
| `gridSizeX` | `number` | `40` | Number of particles in X direction |
| `gridSizeY` | `number` | `60` | Number of particles in Y direction |

## Usage

```jsx
import DottedSurface from './components/DottedSurface/DottedSurface';

function App() {
  return (
    <DottedSurface 
      particleColor="#ffffff"
      waveSpeed={0.15}
      waveAmplitude={60}
    />
  );
}
```

## Technical Details

- Uses Three.js for 3D rendering
- Implements BufferGeometry for efficient particle management
- Sine wave mathematics for smooth, organic motion
- Proper memory cleanup on unmount
- Responsive camera and renderer setup
