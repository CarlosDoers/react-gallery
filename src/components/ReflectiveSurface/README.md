# Reflective Surface

A stunning 3D scene featuring a reflective water-like surface with wave animations and a floating 3D model. Built with Three.js and React.

## Features

- **🌊 Reflective Water Surface**: A plane with real-time reflections that mimics water behavior
- **🦆 3D Model Animation**: Floating 3D model with smooth vertical motion and dual-axis rotation
- **🎨 Multiple Background Types**: Choose between solid color, custom image, or animated shader
- **✨ Wave Animation**: Dynamic wave effects on the reflective surface
- **🎬 Shader Background**: Mesmerizing animated concentric circles with RGB color effects
- **⚙️ Highly Customizable**: Control every aspect through props
- **📱 Responsive**: Automatically adjusts to window size changes
- **🧹 Performant**: Efficient Three.js implementation with proper cleanup

## Background Types

### 1. Solid Color (`backgroundType: 'color'`)
A simple light gray background that provides a clean backdrop for the reflections.

### 2. Custom Image (`backgroundType: 'image'`)
Load any image as the background. The image will be reflected on the water surface, creating stunning visual effects.

### 3. Animated Shader (`backgroundType: 'shader'`)
A dynamic shader animation featuring:
- Animated concentric circles
- RGB color separation effects
- Continuous smooth animation
- Perfect for eye-catching presentations

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| **Background** |
| `backgroundType` | `'color' \| 'image' \| 'shader'` | `'shader'` | Type of background to use |
| `backgroundImage` | `string` | `null` | URL to background image (only used when `backgroundType='image'`) |
| **Model** |
| `modelScale` | `number` | `90` | Scale of the 3D model |
| `modelPositionX` | `number` | `0` | X position of the model |
| `modelPositionY` | `number` | `200` | Y position of the model (base height for floating) |
| `modelPositionZ` | `number` | `-900` | Z position of the model |
| `modelRotationSpeed` | `number` | `0.01` | Speed of model rotation |
| **Surface** |
| `surfaceColor` | `string` | `'#c8c8c8'` | Color tint of the reflective surface |
| `planeOpacity` | `number` | `0.6` | Opacity of the surface (0-1) |
| **Waves** |
| `waveSpeed` | `number` | `0.1` | Speed of wave animation |
| `waveAmplitude` | `number` | `50` | Height of wave peaks |
| `gridSpacing` | `number` | `150` | Distance between grid points |
| `gridSizeX` | `number` | `40` | Grid resolution in X direction |
| `gridSizeY` | `number` | `60` | Grid resolution in Y direction |

## Usage

### Basic Usage with Shader Background
```jsx
import ReflectiveSurface from './components/ReflectiveSurface/ReflectiveSurface';

function App() {
  return (
    <ReflectiveSurface 
      backgroundType="shader"
      modelRotationSpeed={0.02}
    />
  );
}
```

### With Custom Image Background
```jsx
<ReflectiveSurface 
  backgroundType="image"
  backgroundImage="/path/to/your/image.jpg"
  planeOpacity={0.7}
  waveAmplitude={30}
/>
```

### With Solid Color Background
```jsx
<ReflectiveSurface 
  backgroundType="color"
  surfaceColor="#ffffff"
/>
```

## Animation Details

### Model Animation
- **Floating Effect**: The 3D model smoothly moves up and down using a sine wave function with an amplitude of 30 pixels
- **Dual-Axis Rotation**: 
  - Y-axis: Full rotation speed (controlled by `modelRotationSpeed`)
  - X-axis: Half rotation speed for a subtle tumbling effect

### Wave Animation
The reflective surface animates with procedural wave patterns using sine functions, creating organic water-like movement.

### Shader Animation
The shader background (when enabled) features:
- Time-based animation continuously updating
- Mathematical patterns creating concentric circles
- RGB color channels calculated separately for chromatic effects

## Technical Details

- **Renderer**: Three.js WebGLRenderer with antialiasing
- **Reflector**: Custom Reflector object for real-time reflections
- **Model Loader**: GLTFLoader for 3D model support (.glb format)
- **Shader**: Custom GLSL fragment shader for background animation
- **Lighting**: Strategic ambient and directional lights for optimal visibility
- **Memory Management**: Proper cleanup of geometries, materials, and render targets on unmount
- **Responsive**: Automatic camera and renderer adjustments on window resize

## Model Requirements

The component expects a 3D model file at `/src/assets/duck.glb`. You can replace this with any GLTF/GLB model by updating the path in the component.

## Performance Considerations

- Shader background renders to a separate render target for efficiency
- Wave animation uses efficient BufferGeometry updates
- Proper disposal of Three.js resources prevents memory leaks
- Optimized for smooth 60fps animation

## Browser Support

Requires WebGL support. Works best on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
