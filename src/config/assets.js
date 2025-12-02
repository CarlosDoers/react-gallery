/**
 * Asset Configuration
 * 
 * En DESARROLLO (npm run dev):
 * - Usa archivos de src/assets/ (no están en Git)
 * - Puedes probar con cualquier archivo sin subirlo
 * 
 * En PRODUCCIÓN (npm run build):
 * - Usa archivos de public/models/ (sí están en Git)
 * - Solo los archivos necesarios para producción
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Obtiene la ruta correcta de un asset según el entorno
 * @param {string} devPath - Ruta en desarrollo (src/assets/)
 * @param {string} prodPath - Ruta en producción (public/models/)
 * @returns {string} La ruta correcta según el entorno
 */
export const getAssetPath = (devPath, prodPath) => {
  return isDevelopment ? devPath : prodPath;
};

// Rutas de modelos 3D
export const MODELS = {
  butterfly: getAssetPath(
    '/src/assets/butterfly1.glb',  // Desarrollo: prueba local
    '/models/butterfly1.glb'        // Producción: desplegado
  ),
};

// Agregar más modelos aquí según sea necesario
// Ejemplo:
// export const MODELS = {
//   butterfly: getAssetPath('/src/assets/butterfly1.glb', '/models/butterfly1.glb'),
//   cube: getAssetPath('/src/assets/cube.glb', '/models/cube.glb'),
// };
