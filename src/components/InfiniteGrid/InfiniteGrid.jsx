import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import PropTypes from 'prop-types';
import * as THREE from 'three';
import './InfiniteGrid.css';

// Classic Perlin 3D Noise 
const noiseFunction = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    //   x0 = x0 - 0.0 + 0.0 * C.xxx;
    //   x1 = x0 - i1  + 1.0 * C.xxx;
    //   x2 = x0 - i2  + 2.0 * C.xxx;
    //   x3 = x0 - 1.0 + 3.0 * C.xxx;
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
    vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

    // Permutations
    i = mod289(i);
    vec4 p = permute( permute( permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    // Gradients: 7x7 points over a square, mapped onto an octahedron.
    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
    float n_ = 0.142857142857; // 1.0/7.0
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
    //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    //Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                  dot(p2,x2), dot(p3,x3) ) );
  }
`;

const vertexShader = `
  uniform float uTime;
  uniform float uBigWavesElevation;
  uniform vec2 uBigWavesFrequency;
  uniform float uBigWavesSpeed;
  uniform float uSmallWavesElevation;
  uniform float uSmallWavesFrequency;
  uniform float uSmallWavesSpeed;
  uniform float uSmallIterations;

  // Mouse Interaction Uniforms
  uniform float uMouseRadius;
  uniform float uMouseStrength;
  uniform float uMouseRippleFrequency;
  uniform float uMouseRippleSpeed;
  uniform float uMouseNoiseStrength;

  uniform float uMouseEnabled;

  varying float vElevation;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  uniform vec2 uMouse;

  ${noiseFunction}

  float waveElevation(vec3 position) {
    // Base sine waves
    float elevation = sin(position.x * uBigWavesFrequency.x + uTime * uBigWavesSpeed) *
                      sin(position.z * uBigWavesFrequency.y + uTime * uBigWavesSpeed) *
                      uBigWavesElevation;
    
    // Add randomness to big waves using noise to break the grid pattern
    // We use a low frequency noise added to the sine wave
    elevation += snoise(vec3(position.xz * uBigWavesFrequency.x * 0.8, uTime * uBigWavesSpeed * 0.8)) * (uBigWavesElevation * 0.5);

    // Small waves (Texture/Detail)
    for(float i = 1.0; i <= uSmallIterations; i++) {
      elevation -= abs(snoise(vec3(position.xz * uSmallWavesFrequency * i, uTime * uSmallWavesSpeed)) * uSmallWavesElevation / i);
    }
    
    // Mouse Interaction
    if (uMouseEnabled > 0.5) {
      // Calculate distance from vertex to mouse position (in world space xz plane)
      float dist = distance(position.xz, uMouse);
      
      // Create a ripple effect (organic and smooth)
      if(dist < uMouseRadius) {
        // Smooth falloff from center using smoothstep for softness
        float falloff = smoothstep(uMouseRadius, 0.0, dist);
        
        // Add noise to the distance to make ripples irregular/distorted
        float noiseVal = snoise(vec3(position.xz * 2.0, uTime * 1.0)) * uMouseNoiseStrength;
        float distortedDist = dist + noiseVal;

        // Ripples that move outward from the mouse (using uTime)
        // sin(dist * frequency - time * speed)
        float ripples = sin(distortedDist * uMouseRippleFrequency - uTime * uMouseRippleSpeed) * 0.2;
        
        // Combine with a subtle depression to "push" the water down slightly
        float depression = -0.3 * uMouseStrength;
        
        // Mix them: mostly ripples, slight depression
        float mouseEffect = (depression + ripples) * falloff;
        
        elevation += mouseEffect;
      }
    }

    return elevation;
  }

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    float elevation = waveElevation(modelPosition.xyz);
    modelPosition.y += elevation;

    // Compute Normals using Finite Difference
    float shift = 0.01;
    vec3 modelPositionA = modelPosition.xyz + vec3(shift, 0.0, 0.0);
    vec3 modelPositionB = modelPosition.xyz + vec3(0.0, 0.0, -shift);
    
    float elevationA = waveElevation(modelPositionA);
    modelPositionA.y += elevationA;
    
    float elevationB = waveElevation(modelPositionB);
    modelPositionB.y += elevationB;

    vec3 toA = normalize(modelPositionA - modelPosition.xyz);
    vec3 toB = normalize(modelPositionB - modelPosition.xyz);
    vec3 computedNormal = cross(toA, toB);

    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    vElevation = elevation;
    vUv = uv;
    vNormal = computedNormal;
    vPosition = modelPosition.xyz;
  }
`;

const fragmentShader = `
  uniform vec3 uDepthColor;
  uniform vec3 uMidColor;
  uniform vec3 uSurfaceColor;
  uniform float uColorOffset;
  uniform float uColorMultiplier;
  uniform vec3 uCameraPosition;

  varying float vElevation;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    // Base Color Mixing
    float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
    
    // 3-Color Gradient
    // We mix from Depth -> Mid -> Surface
    // mixStrength is roughly 0.0 to 1.0 (clamped ideally)
    
    vec3 color = uDepthColor;
    
    // First transition: Depth to Mid (0.0 to 0.5)
    float midMix = smoothstep(0.0, 0.5, mixStrength);
    color = mix(uDepthColor, uMidColor, midMix);
    
    // Second transition: Mid to Surface (0.5 to 1.0)
    float surfaceMix = smoothstep(0.5, 1.0, mixStrength);
    color = mix(color, uSurfaceColor, surfaceMix);
    
    // Specular Highlight (Sun reflection)
    vec3 viewDirection = normalize(uCameraPosition - vPosition);
    vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0)); // Directional light source
    vec3 reflectionDirection = reflect(-lightDirection, normalize(vNormal));
    
    // Specular intensity
    float specular = pow(max(dot(viewDirection, reflectionDirection), 0.0), 30.0);
    
    // Add specular to color
    color += specular * 0.5; // Adjust intensity

    // Foam / Texture at peaks
    float foam = smoothstep(0.1, 0.2, vElevation); // Simple foam based on height
    color += foam * 0.1;

    // Circular fade mask
    float distance = distance(vUv, vec2(0.5));
    float alpha = 1.0 - smoothstep(0.3, 0.5, distance);

    gl_FragColor = vec4(color, alpha);
  }
`;

// Configuration for Water Shader
// Tweak these values to adjust the water look and feel
const WATER_PARAMS = {
  // Big Waves (General shape)
  uBigWavesElevation: 0.25, // Height of the main waves (lower = calmer)
  uBigWavesFrequency: new THREE.Vector2(0.4, 0.2), // Frequency X/Z (higher = more ripples)
  uBigWavesSpeed: 0.7, // Speed of the main waves

  // Small Waves (Texture/Noise)
  uSmallWavesElevation: 0.1, // Height of the small noise waves (lower = smoother surface)
  uSmallWavesFrequency: 5.0, // Frequency of the noise (higher = finer texture)
  uSmallWavesSpeed: 0.2, // Speed of the noise movement
  uSmallIterations: 5.0, // Number of noise layers (lower = smoother/less detailed, higher = sharper/rockier)

  // Color & Lighting
  uColorOffset: 0.25, // Offset for color mixing (higher = more surface color)
  uColorMultiplier: 2, // Contrast of the color mix

  // Mouse Interaction (Ripples)
  uMouseRadius: 6.0, // Radius of the mouse effect area
  uMouseStrength: 1.0, // Strength of the depression/push effect
  uMouseRippleFrequency: 4.0, // How many ripples appear in the radius
  uMouseRippleSpeed: 3.0, // How fast the ripples move outward
  uMouseNoiseStrength: 0.5, // How irregular/distorted the ripples are (0 = perfect circles)
};

const WaterPlane = ({ waterColor, waterColorMid, waterColorDeep, enableMouseInteraction }) => {
  const materialRef = useRef();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBigWavesElevation: { value: WATER_PARAMS.uBigWavesElevation },
      uBigWavesFrequency: { value: WATER_PARAMS.uBigWavesFrequency },
      uBigWavesSpeed: { value: WATER_PARAMS.uBigWavesSpeed },
      uSmallWavesElevation: { value: WATER_PARAMS.uSmallWavesElevation },
      uSmallWavesFrequency: { value: WATER_PARAMS.uSmallWavesFrequency },
      uSmallWavesSpeed: { value: WATER_PARAMS.uSmallWavesSpeed },
      uSmallIterations: { value: WATER_PARAMS.uSmallIterations },
      uDepthColor: { value: new THREE.Color(waterColorDeep) },
      uMidColor: { value: new THREE.Color(waterColorMid) },
      uSurfaceColor: { value: new THREE.Color(waterColor) },
      uColorOffset: { value: WATER_PARAMS.uColorOffset },
      uColorMultiplier: { value: WATER_PARAMS.uColorMultiplier },
      uCameraPosition: { value: new THREE.Vector3() },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseEnabled: { value: enableMouseInteraction ? 1.0 : 0.0 },
      // Mouse interaction uniforms
      uMouseRadius: { value: WATER_PARAMS.uMouseRadius },
      uMouseStrength: { value: WATER_PARAMS.uMouseStrength },
      uMouseRippleFrequency: { value: WATER_PARAMS.uMouseRippleFrequency },
      uMouseRippleSpeed: { value: WATER_PARAMS.uMouseRippleSpeed },
      uMouseNoiseStrength: { value: WATER_PARAMS.uMouseNoiseStrength },
    }),
    [waterColor, waterColorMid, waterColorDeep]
  );

  // Update uMouseEnabled when prop changes
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uMouseEnabled.value = enableMouseInteraction ? 1.0 : 0.0;
    }
  }, [enableMouseInteraction]);

  useFrame((state) => {
    const { clock, camera } = state;
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      materialRef.current.uniforms.uDepthColor.value.set(waterColorDeep);
      materialRef.current.uniforms.uMidColor.value.set(waterColorMid);
      materialRef.current.uniforms.uSurfaceColor.value.set(waterColor);
      materialRef.current.uniforms.uCameraPosition.value.copy(camera.position);
    }
  });

  const handlePointerMove = (e) => {
    if (materialRef.current && enableMouseInteraction) {
      // e.point is the intersection point in world space
      materialRef.current.uniforms.uMouse.value.set(e.point.x, e.point.z);
    }
  };

  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -1, 0]}
      onPointerMove={handlePointerMove}
    >
      <planeGeometry args={[200, 200, 48, 48]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        transparent={true}
      />
    </mesh>
  );
};

const CameraController = ({ position }) => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(...position);
  }, [camera, position]);

  return null;
};

const Scene = ({ 
  backgroundColor,
  autoRotateSpeed,
  cameraPosition,
  waterColor,
  waterColorMid,
  waterColorDeep,
  enableMouseInteraction
}) => {
  const controlsRef = useRef();

  useEffect(() => {
    const handleWheel = (event) => {
      if (controlsRef.current) {
        // Rotate the camera based on scroll
        // Adjust sensitivity as needed
        const rotationSpeed = 0.001;
        const delta = event.deltaY * rotationSpeed;
        
        // Update azimuthal angle (horizontal rotation)
        const currentAngle = controlsRef.current.getAzimuthalAngle();
        controlsRef.current.setAzimuthalAngle(currentAngle + delta);
      }
    };

    window.addEventListener('wheel', handleWheel);

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <>
      <CameraController position={cameraPosition} />
      <color attach="background" args={[backgroundColor]} />
      <fog attach="fog" args={[backgroundColor, 1, 30]} />
      
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      <WaterPlane 
        waterColor={waterColor} 
        waterColorMid={waterColorMid}
        waterColorDeep={waterColorDeep}
        enableMouseInteraction={enableMouseInteraction}
      />
      
      <OrbitControls 
        ref={controlsRef}
        makeDefault 
        autoRotate={false} // Disable auto rotate to let user control it
        maxPolarAngle={Math.PI / 2 - 0.1}
        minPolarAngle={0}
        enableZoom={false} // Disable zoom as requested
        enablePan={false}
        enableRotate={true} // Allow drag rotation as well? User said "con el scroll rote", implying scroll is the primary method, but drag is usually expected too. Keeping it enabled.
      />
    </>
  );
};

export default function InfiniteGrid({
  backgroundColor = '#050505',
  autoRotateSpeed = 0.5,
  cameraX = 2,
  cameraY = 2,
  cameraZ = 2,
  waterColor = '#9bd8ff',
  waterColorMid = '#4287f5',
  waterColorDeep = '#186691',
  enableMouseInteraction = true
}) {
  return (
    <div className="infinite-grid-container">
      <Canvas camera={{ position: [cameraX, cameraY, cameraZ], fov: 50 }}>
        <Scene 
          backgroundColor={backgroundColor}
          autoRotateSpeed={autoRotateSpeed}
          cameraPosition={[cameraX, cameraY, cameraZ]}
          waterColor={waterColor}
          waterColorMid={waterColorMid}
          waterColorDeep={waterColorDeep}
          enableMouseInteraction={enableMouseInteraction}
        />
      </Canvas>
    </div>
  );
}

InfiniteGrid.propTypes = {
  backgroundColor: PropTypes.string,
  autoRotateSpeed: PropTypes.number,
  cameraX: PropTypes.number,
  cameraY: PropTypes.number,
  cameraZ: PropTypes.number,
  waterColor: PropTypes.string,
  waterColorMid: PropTypes.string,
  waterColorDeep: PropTypes.string,
  enableMouseInteraction: PropTypes.bool
};
