import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import PropTypes from 'prop-types';

const GradientShader = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0.0, 0.0, 0.0) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;

    // Simplex 2D noise
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
               -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec2 uv = vUv;
      
      // Slow moving noise
      float noise1 = snoise(uv * 3.0 + uTime * 0.2);
      float noise2 = snoise(uv * 1.5 - uTime * 0.1);
      
      // Mix colors based on noise
      vec3 color1 = uColor;
      vec3 color2 = vec3(0.5, 0.0, 0.5); // Purple accent
      vec3 color3 = vec3(0.0, 0.8, 0.8); // Cyan accent
      
      vec3 finalColor = mix(color1, color2, noise1 * 0.5 + 0.5);
      finalColor = mix(finalColor, color3, noise2 * 0.3 + 0.3);
      
      // Add subtle vignette
      float dist = distance(uv, vec2(0.5));
      finalColor *= 1.0 - dist * 0.5;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

const ShaderPlane = ({ color }) => {
  const meshRef = useRef();
  
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) }
    }),
    [color]
  );

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
      meshRef.current.material.uniforms.uColor.value.set(color);
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={GradientShader.vertexShader}
        fragmentShader={GradientShader.fragmentShader}
      />
    </mesh>
  );
};

ShaderPlane.propTypes = {
  color: PropTypes.string
};

const ShaderBackground = ({ color = '#000000' }) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
      <Canvas camera={{ position: [0, 0, 1] }} dpr={[1, 2]}>
        <ShaderPlane color={color} />
      </Canvas>
    </div>
  );
};

ShaderBackground.propTypes = {
  color: PropTypes.string
};

export default ShaderBackground;
