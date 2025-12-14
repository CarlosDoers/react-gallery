import { useRef, useEffect, Suspense, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import PropTypes from 'prop-types';
import './Model3DViewer.css';

/**
 * TIPOS DE TRANSICIÓN DE CÁMARA DISPONIBLES
 * ==========================================
 * 
 * 'smooth'    - Transición suave con ease-in-out (por defecto)
 * 'linear'    - Movimiento lineal constante
 * 'bounce'    - Efecto de rebote al llegar al destino
 * 'elastic'   - Efecto elástico con overshoot
 * 'zoomPull'  - Zoom out primero, luego zoom in al destino
 * 'arc'       - Movimiento en arco elevado (pasa por arriba)
 * 'spiral'    - Movimiento en espiral descendente
 */

// Funciones de easing
const EASING_FUNCTIONS = {
    // Movimiento lineal
    linear: (t) => t,

    // Suave entrada y salida (por defecto)
    smooth: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

    // Efecto de rebote al final
    bounce: (t) => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },

    // Efecto elástico con overshoot
    elastic: (t) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 :
            Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },

    // Ease out exponencial (para zoomPull y arc)
    easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),

    // Ease in-out back (pequeño overshoot)
    easeInOutBack: (t) => {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        return t < 0.5
            ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
            : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    }
};

// Velocidades de transición por tipo
const TRANSITION_SPEEDS = {
    linear: 1.2,
    smooth: 0.8,
    bounce: 0.6,
    elastic: 0.5,
    zoomPull: 0.4,
    arc: 0.5,
    spiral: 0.3
};

// Hotspots por defecto para el modelo isla.glb
const DEFAULT_HOTSPOTS = [
    {
        id: 'barco',
        label: 'Barco',
        position: [1.5, 0.5, 0.5],
        cameraTarget: [1.5, 0.3, 0.5],
        cameraPosition: [2.5, 1, 2],
        transition: 'smooth' // Tipo de transición
    },
    {
        id: 'isla',
        label: 'Isla Principal',
        position: [0, 1, 0],
        cameraTarget: [0, 0.5, 0],
        cameraPosition: [3, 2, 3],
        transition: 'arc'
    },
    {
        id: 'playa',
        label: 'Playa',
        position: [-1, 0.2, 1],
        cameraTarget: [-1, 0.1, 1],
        cameraPosition: [-0.5, 0.8, 2.5],
        transition: 'zoomPull'
    }
];

function Model({ modelPath, autoRotate, rotationSpeed, scale, position, introAnimation, introComplete }) {
    const group = useRef();
    const { scene, animations } = useGLTF(modelPath);
    const { actions, names } = useAnimations(animations, group);
    const introProgress = useRef(0);
    const [isIntroComplete, setIsIntroComplete] = useState(false);

    useEffect(() => {
        if (names.length > 0) {
            names.forEach((name) => {
                const action = actions[name];
                if (action) {
                    action.reset().fadeIn(0.5).play();
                    action.setLoop(THREE.LoopRepeat, Infinity);
                }
            });
        }
    }, [actions, names]);

    useFrame((state, delta) => {
        if (!group.current) return;

        // Animación de entrada
        if (introAnimation && !isIntroComplete) {
            introProgress.current += delta * 0.5; // Velocidad de la intro
            const t = Math.min(introProgress.current, 1);

            // Easing suave
            const easeOutExpo = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

            // Escala: de 0.3 a scale final
            const currentScale = THREE.MathUtils.lerp(0.3, 1, easeOutExpo) * scale;
            group.current.scale.setScalar(currentScale);

            // Rotación: gira mientras entra
            const introRotation = (1 - easeOutExpo) * Math.PI * 0.5; // 90 grados de rotación
            group.current.rotation.y = introRotation;

            // Posición Y: sube ligeramente desde abajo
            const yOffset = (1 - easeOutExpo) * -0.5;
            group.current.position.y = position[1] + yOffset;

            if (t >= 1) {
                setIsIntroComplete(true);
                if (introComplete) introComplete();
            }
        } else {
            // Rotación automática normal después de la intro
            if (autoRotate) {
                group.current.rotation.y += delta * rotationSpeed;
            }
        }
    });

    return (
        <group
            ref={group}
            position={introAnimation && !isIntroComplete ? [position[0], position[1] - 0.5, position[2]] : position}
            scale={introAnimation && !isIntroComplete ? 0.3 * scale : scale}
        >
            <primitive object={scene} />
        </group>
    );
}

Model.propTypes = {
    modelPath: PropTypes.string.isRequired,
    autoRotate: PropTypes.bool,
    rotationSpeed: PropTypes.number,
    scale: PropTypes.number,
    position: PropTypes.arrayOf(PropTypes.number),
    introAnimation: PropTypes.bool,
    introComplete: PropTypes.func
};

function Hotspot({ hotspot, onClick, isActive, showLabels }) {
    const [hovered, setHovered] = useState(false);
    const meshRef = useRef();
    const ringRef = useRef();

    useFrame((state) => {
        if (meshRef.current) {
            const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
            meshRef.current.scale.setScalar(hovered ? scale * 1.3 : scale);
        }
        if (ringRef.current) {
            ringRef.current.rotation.z += 0.02;
        }
    });

    return (
        <group position={hotspot.position}>
            <mesh
                ref={meshRef}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick(hotspot);
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(true);
                    document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                    setHovered(false);
                    document.body.style.cursor = 'auto';
                }}
            >
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial
                    color={isActive ? '#00ff88' : hovered ? '#ffffff' : '#ff6b35'}
                    emissive={isActive ? '#00ff88' : hovered ? '#ffffff' : '#ff6b35'}
                    emissiveIntensity={hovered || isActive ? 1 : 0.5}
                />
            </mesh>

            <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.12, 0.15, 32]} />
                <meshBasicMaterial
                    color={isActive ? '#00ff88' : '#ff6b35'}
                    transparent
                    opacity={0.6}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {showLabels && (
                <Html
                    position={[0, 0.25, 0]}
                    center
                    distanceFactor={5}
                    style={{
                        pointerEvents: 'none',
                        userSelect: 'none'
                    }}
                >
                    <div className={`hotspot-label ${hovered || isActive ? 'active' : ''}`}>
                        {hotspot.label}
                    </div>
                </Html>
            )}
        </group>
    );
}

Hotspot.propTypes = {
    hotspot: PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        position: PropTypes.arrayOf(PropTypes.number).isRequired,
        cameraTarget: PropTypes.arrayOf(PropTypes.number).isRequired,
        cameraPosition: PropTypes.arrayOf(PropTypes.number).isRequired,
        transition: PropTypes.oneOf(['smooth', 'linear', 'bounce', 'elastic', 'zoomPull', 'arc', 'spiral'])
    }).isRequired,
    onClick: PropTypes.func.isRequired,
    isActive: PropTypes.bool,
    showLabels: PropTypes.bool
};

function CameraController({
    targetPosition,
    targetLookAt,
    isAnimating,
    onAnimationComplete,
    controlsRef,
    transitionType = 'smooth'
}) {
    const { camera } = useThree();
    const animationProgress = useRef(0);
    const startPosition = useRef(new THREE.Vector3());
    const startLookAt = useRef(new THREE.Vector3());
    const endPosition = useRef(new THREE.Vector3());
    const endLookAt = useRef(new THREE.Vector3());
    const midPoint = useRef(new THREE.Vector3());
    const spiralStartAngle = useRef(0);

    useEffect(() => {
        if (isAnimating && targetPosition && targetLookAt) {
            startPosition.current.copy(camera.position);

            if (controlsRef.current) {
                startLookAt.current.copy(controlsRef.current.target);
            } else {
                startLookAt.current.set(0, 0, 0);
            }

            endPosition.current.set(...targetPosition);
            endLookAt.current.set(...targetLookAt);
            animationProgress.current = 0;

            // Calcular punto medio para transiciones especiales
            midPoint.current.lerpVectors(startPosition.current, endPosition.current, 0.5);

            // Para arc: elevar el punto medio
            if (transitionType === 'arc') {
                const distance = startPosition.current.distanceTo(endPosition.current);
                midPoint.current.y += distance * 0.5;
            }

            // Para zoomPull: alejar el punto medio
            if (transitionType === 'zoomPull') {
                const center = new THREE.Vector3().lerpVectors(startLookAt.current, endLookAt.current, 0.5);
                const direction = midPoint.current.clone().sub(center).normalize();
                const distance = startPosition.current.distanceTo(endPosition.current);
                midPoint.current.add(direction.multiplyScalar(distance * 0.8));
                midPoint.current.y += distance * 0.3;
            }

            // Para spiral: guardar ángulo inicial
            if (transitionType === 'spiral') {
                spiralStartAngle.current = Math.atan2(
                    startPosition.current.x - endLookAt.current[0],
                    startPosition.current.z - endLookAt.current[2]
                );
            }
        }
    }, [isAnimating, targetPosition, targetLookAt, camera, controlsRef, transitionType]);

    useFrame((state, delta) => {
        if (!isAnimating) return;

        const speed = TRANSITION_SPEEDS[transitionType] || 0.8;
        animationProgress.current += delta * speed;
        const t = Math.min(animationProgress.current, 1);

        // Seleccionar función de easing según el tipo de transición
        let easingFn;
        switch (transitionType) {
            case 'linear':
                easingFn = EASING_FUNCTIONS.linear;
                break;
            case 'bounce':
                easingFn = EASING_FUNCTIONS.bounce;
                break;
            case 'elastic':
                easingFn = EASING_FUNCTIONS.elastic;
                break;
            case 'zoomPull':
            case 'arc':
                easingFn = EASING_FUNCTIONS.easeOutExpo;
                break;
            case 'spiral':
                easingFn = EASING_FUNCTIONS.easeInOutBack;
                break;
            default:
                easingFn = EASING_FUNCTIONS.smooth;
        }

        const easedT = easingFn(t);

        // Calcular posición según el tipo de transición
        let newPosition = new THREE.Vector3();

        switch (transitionType) {
            case 'arc':
            case 'zoomPull': {
                // Curva de Bezier cuadrática pasando por midPoint
                const oneMinusT = 1 - easedT;
                newPosition.x = oneMinusT * oneMinusT * startPosition.current.x +
                    2 * oneMinusT * easedT * midPoint.current.x +
                    easedT * easedT * endPosition.current.x;
                newPosition.y = oneMinusT * oneMinusT * startPosition.current.y +
                    2 * oneMinusT * easedT * midPoint.current.y +
                    easedT * easedT * endPosition.current.y;
                newPosition.z = oneMinusT * oneMinusT * startPosition.current.z +
                    2 * oneMinusT * easedT * midPoint.current.z +
                    easedT * easedT * endPosition.current.z;
                break;
            }
            case 'spiral': {
                // Movimiento en espiral descendente
                const targetCenter = new THREE.Vector3(...targetLookAt);
                const startRadius = startPosition.current.distanceTo(targetCenter);
                const endRadius = endPosition.current.distanceTo(targetCenter);
                const currentRadius = THREE.MathUtils.lerp(startRadius, endRadius, easedT);

                const totalRotation = Math.PI * 1.5; // 270 grados de rotación
                const endAngle = Math.atan2(
                    endPosition.current.x - targetCenter.x,
                    endPosition.current.z - targetCenter.z
                );
                const currentAngle = THREE.MathUtils.lerp(
                    spiralStartAngle.current,
                    spiralStartAngle.current + totalRotation,
                    easedT
                );

                newPosition.x = targetCenter.x + Math.sin(currentAngle) * currentRadius;
                newPosition.z = targetCenter.z + Math.cos(currentAngle) * currentRadius;
                newPosition.y = THREE.MathUtils.lerp(startPosition.current.y, endPosition.current.y, easedT);
                break;
            }
            default:
                // Interpolación lineal estándar
                newPosition.lerpVectors(startPosition.current, endPosition.current, easedT);
        }

        camera.position.copy(newPosition);

        // Interpolar target de OrbitControls
        if (controlsRef.current) {
            controlsRef.current.target.lerpVectors(startLookAt.current, endLookAt.current, easedT);
            controlsRef.current.update();
        }

        if (t >= 1) {
            onAnimationComplete();
        }
    });

    return null;
}

CameraController.propTypes = {
    targetPosition: PropTypes.arrayOf(PropTypes.number),
    targetLookAt: PropTypes.arrayOf(PropTypes.number),
    isAnimating: PropTypes.bool.isRequired,
    onAnimationComplete: PropTypes.func.isRequired,
    controlsRef: PropTypes.object,
    transitionType: PropTypes.oneOf(['smooth', 'linear', 'bounce', 'elastic', 'zoomPull', 'arc', 'spiral'])
};

function LoadingFallback() {
    return (
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#4a9eff" wireframe />
        </mesh>
    );
}

function Scene({
    modelPath,
    autoRotate,
    rotationSpeed,
    scale,
    position,
    enableZoom,
    enablePan,
    showEnvironment,
    environmentPreset,
    ambientIntensity,
    hotspots,
    showHotspots,
    showLabels,
    activeHotspot,
    onHotspotClick,
    isAnimating,
    cameraTarget,
    onAnimationComplete,
    controlsRef,
    transitionType,
    introAnimation
}) {
    return (
        <>
            <ambientLight intensity={ambientIntensity} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

            <Suspense fallback={<LoadingFallback />}>
                {showEnvironment && (
                    <Environment preset={environmentPreset} background={false} />
                )}
                <Model
                    modelPath={modelPath}
                    autoRotate={autoRotate && !isAnimating}
                    rotationSpeed={rotationSpeed}
                    scale={scale}
                    position={position}
                    introAnimation={introAnimation}
                />

                {showHotspots && hotspots.map((hotspot) => (
                    <Hotspot
                        key={hotspot.id}
                        hotspot={hotspot}
                        onClick={onHotspotClick}
                        isActive={activeHotspot?.id === hotspot.id}
                        showLabels={showLabels}
                    />
                ))}
            </Suspense>

            <CameraController
                targetPosition={cameraTarget?.position}
                targetLookAt={cameraTarget?.lookAt}
                isAnimating={isAnimating}
                onAnimationComplete={onAnimationComplete}
                controlsRef={controlsRef}
                transitionType={transitionType}
            />

            <OrbitControls
                ref={controlsRef}
                enableZoom={enableZoom}
                enablePan={enablePan}
                autoRotate={false}
                minPolarAngle={Math.PI / 6}
                maxPolarAngle={Math.PI / 1.5}
                enabled={!isAnimating}
            />
        </>
    );
}

Scene.propTypes = {
    modelPath: PropTypes.string.isRequired,
    autoRotate: PropTypes.bool,
    rotationSpeed: PropTypes.number,
    scale: PropTypes.number,
    position: PropTypes.arrayOf(PropTypes.number),
    enableZoom: PropTypes.bool,
    enablePan: PropTypes.bool,
    showEnvironment: PropTypes.bool,
    environmentPreset: PropTypes.string,
    ambientIntensity: PropTypes.number,
    hotspots: PropTypes.array,
    showHotspots: PropTypes.bool,
    showLabels: PropTypes.bool,
    activeHotspot: PropTypes.object,
    onHotspotClick: PropTypes.func,
    isAnimating: PropTypes.bool,
    cameraTarget: PropTypes.object,
    onAnimationComplete: PropTypes.func,
    controlsRef: PropTypes.object,
    transitionType: PropTypes.string,
    introAnimation: PropTypes.bool
};

export default function Model3DViewer({
    modelPath = '/models/isla.glb',
    backgroundColor = '#1a1a2e',
    autoRotate = false,
    rotationSpeed = 0.5,
    scale = 1,
    position = [0, 0, 0],
    cameraPosition = [5, 3, 5],
    enableZoom = true,
    enablePan = false,
    ambientIntensity = 0.5,
    showEnvironment = true,
    environmentPreset = 'sunset',
    hotspots = DEFAULT_HOTSPOTS,
    showHotspots = true,
    showLabels = true,
    defaultTransition = 'smooth',
    introAnimation = true
}) {
    const [activeHotspot, setActiveHotspot] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [cameraTarget, setCameraTarget] = useState(null);
    const [currentTransition, setCurrentTransition] = useState(defaultTransition);
    const controlsRef = useRef();

    const handleHotspotClick = useCallback((hotspot) => {
        if (isAnimating) return;

        setActiveHotspot(hotspot);
        setCameraTarget({
            position: hotspot.cameraPosition,
            lookAt: hotspot.cameraTarget
        });
        // Usar la transición específica del hotspot o la default
        setCurrentTransition(hotspot.transition || defaultTransition);
        setIsAnimating(true);
    }, [isAnimating, defaultTransition]);

    const handleAnimationComplete = useCallback(() => {
        setIsAnimating(false);
    }, []);

    const handleResetCamera = useCallback(() => {
        if (isAnimating) return;

        setActiveHotspot(null);
        setCameraTarget({
            position: cameraPosition,
            lookAt: [0, 0, 0]
        });
        setCurrentTransition(defaultTransition);
        setIsAnimating(true);
    }, [isAnimating, cameraPosition, defaultTransition]);

    return (
        <div className="model3d-viewer-container" style={{ backgroundColor }}>
            <Canvas
                camera={{ position: cameraPosition, fov: 45 }}
                shadows
                gl={{ antialias: true }}
            >
                <Scene
                    modelPath={modelPath}
                    autoRotate={autoRotate}
                    rotationSpeed={rotationSpeed}
                    scale={scale}
                    position={position}
                    enableZoom={enableZoom}
                    enablePan={enablePan}
                    showEnvironment={showEnvironment}
                    environmentPreset={environmentPreset}
                    ambientIntensity={ambientIntensity}
                    hotspots={hotspots}
                    showHotspots={showHotspots}
                    showLabels={showLabels}
                    activeHotspot={activeHotspot}
                    onHotspotClick={handleHotspotClick}
                    isAnimating={isAnimating}
                    cameraTarget={cameraTarget}
                    onAnimationComplete={handleAnimationComplete}
                    controlsRef={controlsRef}
                    transitionType={currentTransition}
                    introAnimation={introAnimation}
                />
            </Canvas>

            {activeHotspot && !isAnimating && (
                <button className="reset-camera-btn" onClick={handleResetCamera}>
                    ← Volver
                </button>
            )}

            {activeHotspot && (
                <div className="active-hotspot-indicator">
                    <span className="hotspot-dot"></span>
                    {activeHotspot.label}
                </div>
            )}
        </div>
    );
}

Model3DViewer.propTypes = {
    modelPath: PropTypes.string,
    backgroundColor: PropTypes.string,
    autoRotate: PropTypes.bool,
    rotationSpeed: PropTypes.number,
    scale: PropTypes.number,
    position: PropTypes.arrayOf(PropTypes.number),
    cameraPosition: PropTypes.arrayOf(PropTypes.number),
    enableZoom: PropTypes.bool,
    enablePan: PropTypes.bool,
    ambientIntensity: PropTypes.number,
    showEnvironment: PropTypes.bool,
    environmentPreset: PropTypes.string,
    hotspots: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        position: PropTypes.arrayOf(PropTypes.number).isRequired,
        cameraTarget: PropTypes.arrayOf(PropTypes.number).isRequired,
        cameraPosition: PropTypes.arrayOf(PropTypes.number).isRequired,
        transition: PropTypes.oneOf(['smooth', 'linear', 'bounce', 'elastic', 'zoomPull', 'arc', 'spiral'])
    })),
    showHotspots: PropTypes.bool,
    showLabels: PropTypes.bool,
    defaultTransition: PropTypes.oneOf(['smooth', 'linear', 'bounce', 'elastic', 'zoomPull', 'arc', 'spiral']),
    introAnimation: PropTypes.bool
};

// Exportar tipos de transición para uso externo
export const TRANSITION_TYPES = ['smooth', 'linear', 'bounce', 'elastic', 'zoomPull', 'arc', 'spiral'];
