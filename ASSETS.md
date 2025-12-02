# 📁 Estructura de Assets

Este proyecto usa una estructura de dos carpetas para manejar los assets según el entorno.

## 📂 Carpetas

### `src/assets/` - Assets de Desarrollo (🚫 NO en Git)
- **Propósito**: Pruebas locales y experimentación
- **Git**: Completamente ignorada por `.gitignore`
- **Uso**: Pon aquí cualquier archivo para probar localmente
- **Ventajas**: 
  - Prueba con archivos grandes sin afectar el repositorio
  - Experimenta sin hacer commits
  - No afecta el tamaño del repositorio

### `public/models/` - Assets de Producción (✅ SÍ en Git)
- **Propósito**: Archivos que se despliegan a producción
- **Git**: Incluida en el repositorio
- **Uso**: Solo archivos optimizados y necesarios para producción
- **Ventajas**:
  - Control de versiones de assets en producción
  - Asegura que el despliegue tenga los archivos necesarios

## 🔧 Cómo funciona

### 1. Configuración automática
El archivo `src/config/assets.js` detecta el entorno automáticamente:

```javascript
// En desarrollo (npm run dev)
MODELS.butterfly → '/src/assets/butterfly1.glb'

// En producción (npm run build / Netlify)
MODELS.butterfly → '/models/butterfly1.glb'
```

### 2. Uso en componentes
```javascript
import { MODELS } from '../../config/assets';

// Automáticamente usa la ruta correcta
loader.load(MODELS.butterfly, (gltf) => {
  // ...
});
```

## 📝 Workflow

### Para desarrollo local:
1. Pon tus archivos de prueba en `src/assets/`
2. Ejecuta `npm run dev`
3. Los archivos se cargan desde `src/assets/`
4. No se subirán a Git automáticamente

### Para producción:
1. Optimiza el archivo que quieres usar
2. Cópialo a `public/models/`
3. Agrega la referencia en `src/config/assets.js`
4. Haz commit y push
5. Netlify lo desplegará automáticamente

## ➕ Agregar un nuevo modelo

### Paso 1: Agregar a la configuración
Edita `src/config/assets.js`:

```javascript
export const MODELS = {
  butterfly: getAssetPath('/src/assets/butterfly1.glb', '/models/butterfly1.glb'),
  // Agrega tu nuevo modelo aquí
  myModel: getAssetPath('/src/assets/my-model.glb', '/models/my-model.glb'),
};
```

### Paso 2: Para desarrollo
Pon `my-model.glb` en `src/assets/`

### Paso 3: Para producción
Copia `my-model.glb` a `public/models/` y haz commit

### Paso 4: Usar en el código
```javascript
import { MODELS } from '../../config/assets';

loader.load(MODELS.myModel, (gltf) => {
  // Tu código aquí
});
```

## ⚠️ Importante

- **NUNCA** hagas commit de `src/assets/` (está en `.gitignore`)
- **SIEMPRE** copia los archivos finales a `public/models/` antes de desplegar
- Asegúrate de que ambos archivos (dev y prod) existan para evitar errores

## 🎯 Beneficios

✅ Separa archivos de prueba de archivos de producción  
✅ No contamina el repositorio con archivos temporales  
✅ Mantiene el tamaño del repositorio pequeño  
✅ Cambio automático entre entornos  
✅ Facilita el testing local sin afectar producción  
