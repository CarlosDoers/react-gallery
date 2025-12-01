# LiquidCrystalBackground

A WebGL2-based liquid crystal shader background that features smooth, merging blobs and mouse interaction.

## Features
- **Liquid Simulation**: Uses Signed Distance Functions (SDF) and smooth unions to create a merging liquid effect.
- **Mouse Interaction**: A liquid blob follows the mouse cursor and merges with the other elements.
- **Responsive**: Automatically adjusts to the container size.
- **Customizable**: Control speed, blob radii, and smoothness via props.

## Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `speed` | `number` | `0.5` | Animation speed multiplier. |
| `radii` | `number[]` | `[0.2, 0.15, 0.22]` | Array of 3 radii for the orbiting blobs. |
| `smoothK` | `number[]` | `[0.2, 0.25]` | Array of 2 smoothness factors for the union operations. |
| `className` | `string` | `""` | Additional CSS classes for the container. |

## Usage

```jsx
import LiquidCrystalBackground from './LiquidCrystalBackground';

function MyComponent() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <LiquidCrystalBackground 
        speed={0.5}
        radii={[0.2, 0.15, 0.22]}
        smoothK={[0.2, 0.25]}
      />
    </div>
  );
}
```
