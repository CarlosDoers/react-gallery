# InteractiveNebulaShader

A full-screen, ray-marched nebula shader that reacts to mouse movement and application state.

## Features
- **Volumetric Nebula**: Uses ray-marching to create a deep, cloud-like nebula effect.
- **Dynamic Palette**: Changes color themes based on active or upcoming reminders (or any boolean state).
- **Mouse Interaction**: The nebula distorts and shifts based on mouse position.
- **Center Dimming**: Optional vignette effect to focus attention on the center.

## Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `hasActiveReminders` | `boolean` | `false` | Switches to the "Active" color palette (Blue/Purple). |
| `hasUpcomingReminders` | `boolean` | `false` | Switches to the "Upcoming" color palette (Green/Teal). |
| `disableCenterDimming` | `boolean` | `false` | Disables the central vignette effect. |
| `className` | `string` | `""` | Additional CSS classes for the container. |

## Installation

Requires `three` as a peer dependency.

```bash
npm install three
```

## Usage

```jsx
import InteractiveNebulaShader from './InteractiveNebulaShader';

function MyComponent() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <InteractiveNebulaShader 
        hasActiveReminders={true}
        disableCenterDimming={false}
      />
    </div>
  );
}
```
