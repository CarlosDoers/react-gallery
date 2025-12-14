# 🎬 Model3DViewer - Documentación Completa

Un componente React para visualizar modelos 3D GLB/GLTF con hotspots interactivos y animaciones de cámara personalizables.

---

## 📋 Índice

1. [Instalación y Requisitos](#instalación-y-requisitos)
2. [Uso Básico](#uso-básico)
3. [Props del Componente](#props-del-componente)
4. [Configuración de Hotspots](#configuración-de-hotspots)
5. [Tipos de Transición de Cámara](#tipos-de-transición-de-cámara)
6. [Cómo Ubicar Hotspots](#cómo-ubicar-hotspots)
7. [Añadir un Nuevo Modelo](#añadir-un-nuevo-modelo)
8. [Ejemplos Avanzados](#ejemplos-avanzados)
9. [Solución de Problemas](#solución-de-problemas)

---

## 📦 Instalación y Requisitos

### Dependencias necesarias

```bash
npm install @react-three/fiber @react-three/drei three
```

### Requisitos del proyecto

- React 18+ o 19+
- Three.js compatible
- Modelos en formato `.glb` o `.gltf`

---

## 🚀 Uso Básico

### Ejemplo mínimo

```jsx
import Model3DViewer from './components/Model3DViewer';

function App() {
  return (
    <Model3DViewer modelPath="/models/tu-modelo.glb" />
  );
}
```

### Ejemplo con hotspots personalizados

```jsx
import Model3DViewer from './components/Model3DViewer';

const misHotspots = [
  {
    id: 'punto-1',
    label: 'Mi Primer Punto',
    position: [1, 0.5, 0],
    cameraTarget: [1, 0.3, 0],
    cameraPosition: [2, 1, 2],
    transition: 'smooth'
  }
];

function App() {
  return (
    <Model3DViewer 
      modelPath="/models/mi-modelo.glb"
      hotspots={misHotspots}
      showHotspots={true}
      showLabels={true}
    />
  );
}
```

---

## ⚙️ Props del Componente

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `modelPath` | `string` | `'/models/isla.glb'` | Ruta al archivo del modelo 3D |
| `backgroundColor` | `string` | `'#1a1a2e'` | Color de fondo del visor |
| `autoRotate` | `boolean` | `false` | Rotación automática del modelo |
| `rotationSpeed` | `number` | `0.5` | Velocidad de rotación (0-2) |
| `scale` | `number` | `1` | Escala del modelo |
| `position` | `[x, y, z]` | `[0, 0, 0]` | Posición del modelo |
| `cameraPosition` | `[x, y, z]` | `[5, 3, 5]` | Posición inicial de la cámara |
| `enableZoom` | `boolean` | `true` | Permitir zoom con scroll |
| `enablePan` | `boolean` | `false` | Permitir desplazamiento lateral |
| `ambientIntensity` | `number` | `0.5` | Intensidad de luz ambiental |
| `showEnvironment` | `boolean` | `true` | Mostrar entorno HDR |
| `environmentPreset` | `string` | `'sunset'` | Preset de entorno |
| `hotspots` | `array` | Ver abajo | Array de hotspots |
| `showHotspots` | `boolean` | `true` | Mostrar puntos interactivos |
| `showLabels` | `boolean` | `true` | Mostrar etiquetas |
| `defaultTransition` | `string` | `'smooth'` | Transición por defecto |

### Presets de Entorno Disponibles

```
'sunset', 'dawn', 'night', 'warehouse', 'forest', 
'apartment', 'studio', 'city', 'park', 'lobby'
```

---

## 📍 Configuración de Hotspots

Cada hotspot es un objeto con la siguiente estructura:

```javascript
{
  id: 'identificador-unico',      // ID único del hotspot
  label: 'Nombre Visible',        // Texto que se muestra
  position: [x, y, z],            // Posición del punto en el espacio 3D
  cameraTarget: [x, y, z],        // Punto hacia donde mira la cámara
  cameraPosition: [x, y, z],      // Posición final de la cámara
  transition: 'smooth'            // Tipo de transición (opcional)
}
```

### Ejemplo completo de hotspots

```javascript
const hotspots = [
  {
    id: 'entrada',
    label: 'Entrada Principal',
    position: [2, 0.5, 0],         // Donde aparece el punto
    cameraTarget: [2, 0.3, 0],     // Hacia donde mira
    cameraPosition: [3, 1.5, 2],   // Donde se coloca la cámara
    transition: 'smooth'           // Movimiento suave
  },
  {
    id: 'torre',
    label: 'Torre del Castillo',
    position: [0, 3, 0],
    cameraTarget: [0, 2.8, 0],
    cameraPosition: [2, 4, 3],
    transition: 'arc'              // Movimiento en arco
  },
  {
    id: 'jardin',
    label: 'Jardín Secreto',
    position: [-1.5, 0.2, 1],
    cameraTarget: [-1.5, 0.1, 1],
    cameraPosition: [-0.5, 0.8, 2.5],
    transition: 'zoomPull'         // Zoom out y luego in
  }
];
```

---

## 🎥 Tipos de Transición de Cámara

| Tipo | Descripción | Mejor uso |
|------|-------------|-----------|
| `smooth` | Movimiento suave con aceleración y desaceleración | General, por defecto |
| `linear` | Movimiento constante sin variación de velocidad | Transiciones cortas |
| `bounce` | Efecto de rebote al llegar al destino | Puntos de interés divertidos |
| `elastic` | Efecto elástico con pequeño overshoot | Elementos destacados |
| `zoomPull` | Aleja primero, luego acerca (efecto cinematográfico) | Vistas panorámicas |
| `arc` | Movimiento en arco pasando por arriba | Transiciones entre puntos distantes |
| `spiral` | Movimiento en espiral descendente | Aproximaciones dramáticas |

### Visualización de transiciones

```
smooth:    ────────╮     (suave entrada/salida)
                   ╰────

linear:    ────────────── (velocidad constante)

bounce:    ────────╮ ︵   (rebote al final)
                   ╰─╯

elastic:   ────────╮ ~   (elástico con overshoot)
                   ╰─~

zoomPull:      ╭───╮     (aleja primero)
            ───╯   ╰───

arc:           ╭───╮     (pasa por arriba)
            ───╯   ╰───

spiral:      ⟲ ╮         (espiral descendente)
            ───╰─────
```

---

## 🎯 Cómo Ubicar Hotspots

### Método 1: Usando las herramientas de desarrollo

1. **Abre la consola del navegador** (F12)
2. **Añade este código temporal** al componente para ver las coordenadas del click:

```jsx
// Dentro del Canvas, añade este componente temporal:
function DebugClicker() {
  const { camera, raycaster, pointer } = useThree();
  
  useFrame(() => {
    raycaster.setFromCamera(pointer, camera);
  });

  return (
    <mesh 
      visible={false}
      onClick={(e) => {
        console.log('Posición clickeada:', e.point.toArray());
        console.log('Posición cámara:', camera.position.toArray());
      }}
    >
      <sphereGeometry args={[100]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}
```

3. **Haz click en el modelo** donde quieras el hotspot
4. **Copia las coordenadas** de la consola

### Método 2: Estimación visual

Usa el sistema de coordenadas 3D:
- **X**: Izquierda (-) / Derecha (+)
- **Y**: Abajo (-) / Arriba (+)
- **Z**: Atrás (-) / Adelante (+)

```
        Y+
        |
        |
        +-------- X+
       /
      /
     Z+
```

### Método 3: Usando Blender

1. Abre tu modelo en Blender
2. Coloca el cursor 3D donde quieras el hotspot
3. En el panel N, verás las coordenadas XYZ
4. Usa esas coordenadas en tu configuración

### Tips para posicionar la cámara

```javascript
// La cámara debe estar FUERA del modelo mirando hacia el target
{
  position: [1, 0.5, 0],           // Punto visible
  cameraTarget: [1, 0.3, 0],       // Ligeramente más bajo que position
  cameraPosition: [2, 1, 2],       // Cámara alejada, mirando al target
}

// Regla general:
// cameraPosition debe estar más lejos del centro que cameraTarget
// cameraTarget suele estar cerca del hotspot.position
```

---

## 🎨 Añadir un Nuevo Modelo

### Paso 1: Preparar el modelo

1. **Coloca el archivo** `.glb` en la carpeta `/public/models/`
2. **Verifica el tamaño**: El modelo debería caber en un cubo de ±5 unidades

### Paso 2: Configurar el componente

```jsx
<Model3DViewer
  modelPath="/models/mi-nuevo-modelo.glb"
  scale={1}              // Ajusta si es muy grande/pequeño
  position={[0, 0, 0]}   // Centra el modelo
  cameraPosition={[5, 3, 5]}  // Ajusta según el tamaño
/>
```

### Paso 3: Ajustar la escala y posición

Si el modelo es muy grande o pequeño:

```jsx
// Modelo muy grande (100 unidades)
<Model3DViewer
  modelPath="/models/modelo-grande.glb"
  scale={0.05}  // Reducir a 5% del tamaño
/>

// Modelo muy pequeño (0.1 unidades)
<Model3DViewer
  modelPath="/models/modelo-pequeño.glb"
  scale={10}    // Aumentar 10x
/>

// Modelo descentrado
<Model3DViewer
  modelPath="/models/modelo-off-center.glb"
  position={[-2, 0, 1]}  // Moverlo al centro visual
/>
```

### Paso 4: Crear hotspots para el nuevo modelo

```javascript
const hotspotsParaMiModelo = [
  {
    id: 'punto-1',
    label: 'Punto de Interés 1',
    position: [0, 0, 0],      // Ajustar según tu modelo
    cameraTarget: [0, 0, 0],
    cameraPosition: [3, 2, 3],
    transition: 'smooth'
  },
  // ... más hotspots
];

<Model3DViewer
  modelPath="/models/mi-modelo.glb"
  hotspots={hotspotsParaMiModelo}
/>
```

---

## 💡 Ejemplos Avanzados

### Visor de producto con zoom

```jsx
const productoHotspots = [
  {
    id: 'logo',
    label: 'Logo de la Marca',
    position: [0, 1.2, 0.5],
    cameraTarget: [0, 1.2, 0.5],
    cameraPosition: [0, 1.2, 1.5],
    transition: 'smooth'
  },
  {
    id: 'detalle',
    label: 'Detalle del Producto',
    position: [0.5, 0.5, 0.3],
    cameraTarget: [0.5, 0.5, 0.3],
    cameraPosition: [0.8, 0.6, 0.8],
    transition: 'elastic'
  }
];

<Model3DViewer
  modelPath="/models/zapatilla.glb"
  hotspots={productoHotspots}
  autoRotate={true}
  rotationSpeed={0.2}
  backgroundColor="#f5f5f5"
  environmentPreset="studio"
/>
```

### Tour virtual con múltiples puntos

```jsx
const tourHotspots = [
  {
    id: 'recepcion',
    label: '🏠 Recepción',
    position: [0, 1, 5],
    cameraTarget: [0, 1, 0],
    cameraPosition: [0, 1.5, 6],
    transition: 'smooth'
  },
  {
    id: 'sala',
    label: '🛋️ Sala de Estar',
    position: [-3, 1, 0],
    cameraTarget: [-5, 1, 0],
    cameraPosition: [-2, 1.5, 0],
    transition: 'arc'
  },
  {
    id: 'jardin',
    label: '🌳 Jardín',
    position: [0, 0.5, -5],
    cameraTarget: [0, 0.5, -8],
    cameraPosition: [0, 2, -3],
    transition: 'zoomPull'
  }
];

<Model3DViewer
  modelPath="/models/casa.glb"
  hotspots={tourHotspots}
  cameraPosition={[8, 5, 8]}
  showLabels={true}
/>
```

---

## 🔧 Solución de Problemas

### El modelo no se ve

```jsx
// 1. Verifica la ruta
modelPath="/models/archivo.glb"  // ✅ Comienza con /

// 2. Ajusta la escala
scale={0.01}  // Si es muy grande
scale={100}   // Si es muy pequeño

// 3. Mueve la cámara
cameraPosition={[100, 50, 100]}  // Si está muy lejos
```

### Los hotspots están en posiciones incorrectas

```jsx
// 1. Verifica que el modelo esté centrado
position={[0, 0, 0]}

// 2. Los hotspots usan coordenadas relativas al mundo,
//    no al modelo. Si mueves el modelo, los hotspots no se mueven.

// 3. Usa el debugger para encontrar las coordenadas correctas
```

### La animación del modelo no funciona

```jsx
// Asegúrate de que el modelo GLB incluye animaciones
// Las animaciones se reproducen automáticamente en bucle
// Verifica en Blender que las animaciones estén integradas en el GLB
```

### El ambiente no se carga

```jsx
// Usa uno de los presets válidos
environmentPreset="sunset"  // ✅
environmentPreset="mi-ambiente"  // ❌ No existe
```

---

## 📁 Estructura de Archivos

```
src/components/Model3DViewer/
├── Model3DViewer.jsx    # Componente principal
├── Model3DViewer.css    # Estilos
├── index.js             # Exportación
└── README.md            # Esta documentación

public/models/
├── isla.glb             # Modelo por defecto
└── tu-modelo.glb        # Tus modelos personalizados
```

---

## 🤝 Contribuir

Para añadir nuevos tipos de transición:

1. Añade la función de easing en `EASING_FUNCTIONS`
2. Añade la velocidad en `TRANSITION_SPEEDS`
3. Implementa la lógica en `CameraController`
4. Actualiza los PropTypes

---

**¡Disfruta creando experiencias 3D interactivas!** 🎮
