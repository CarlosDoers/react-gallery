# GridDistortion Component

A React component that creates a 3D grid distortion effect on an image using Three.js.

## 1. Installation

This component requires `three` and `prop-types`.

```bash
npm install three prop-types
```

## 2. Integration

1.  Copy the `GridDistortion.jsx` and `GridDistortion.css` files into your project (e.g., `src/components/GridDistortion/`).
2.  Import the component where you want to use it.

## 3. Usage

```jsx
import GridDistortion from './GridDistortion';

function MyComponent() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <GridDistortion
        imageSrc="https://picsum.photos/1920/1080"
        grid={10}
        mouse={0.1}
        strength={0.15}
        relaxation={0.9}
      />
    </div>
  );
}
```

## 4. Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `imageSrc` | `string` | (Required) | The URL of the image to display. |
| `grid` | `number` | `10` | The number of grid columns/rows (density of the distortion). |
| `mouse` | `number` | `0.1` | The radius of the mouse influence. |
| `strength` | `number` | `0.15` | The intensity of the distortion effect. |
| `relaxation` | `number` | `0.9` | How quickly the grid returns to its original state (0-1). |
| `className` | `string` | `''` | Additional CSS class for the container. |
