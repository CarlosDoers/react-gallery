import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, shaderMaterial, Html } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import PropTypes from 'prop-types';
import './Fake3DImage.css';

// Shader Material
const Fake3DMaterial = shaderMaterial(
  {
    uImage: new THREE.Texture(),
    uDepthMap: new THREE.Texture(),
    uMouse: new THREE.Vector2(0, 0),
    uStrength: new THREE.Vector2(0.02, 0.02),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform sampler2D uImage;
    uniform sampler2D uDepthMap;
    uniform vec2 uMouse;
    uniform vec2 uStrength;
    varying vec2 vUv;

    void main() {
      vec4 depthDistortion = texture2D(uDepthMap, vUv);
      float parallaxMult = depthDistortion.r;

      vec2 parallax = (uMouse) * parallaxMult * uStrength;

      vec2 uv = vUv + parallax;
      
      vec4 original = texture2D(uImage, uv);
      gl_FragColor = original;
    }
  `
);

extend({ Fake3DMaterial });

const ImagePlane = ({ imageSrc, depthMapSrc, xStrength, yStrength, backgroundSize }) => {
  const mesh = useRef();
  const { viewport } = useThree();
  
  // Load textures
  const [image, depth] = useTexture([imageSrc, depthMapSrc]);
  
  // Configure textures
  useMemo(() => {
    image.minFilter = THREE.LinearFilter;
    image.magFilter = THREE.LinearFilter;
    depth.minFilter = THREE.LinearFilter;
    depth.magFilter = THREE.LinearFilter;
    // Clamp to edge to avoid artifacts
    image.wrapS = THREE.ClampToEdgeWrapping;
    image.wrapT = THREE.ClampToEdgeWrapping;
    depth.wrapS = THREE.ClampToEdgeWrapping;
    depth.wrapT = THREE.ClampToEdgeWrapping;
  }, [image, depth]);

  // Calculate scale to cover or contain the viewport while maintaining aspect ratio
  const scale = useMemo(() => {
    const imageAspect = image.image.width / image.image.height;
    const viewportAspect = viewport.width / viewport.height;
    
    if (backgroundSize === 'cover') {
      if (imageAspect > viewportAspect) {
        return [viewport.height * imageAspect, viewport.height, 1];
      } else {
        return [viewport.width, viewport.width / imageAspect, 1];
      }
    } else if (backgroundSize === 'stretch') {
      return [viewport.width, viewport.height, 1];
    } else {
      // 'contain'
      if (imageAspect > viewportAspect) {
        return [viewport.width, viewport.width / imageAspect, 1];
      } else {
        return [viewport.height * imageAspect, viewport.height, 1];
      }
    }
  }, [image, viewport, backgroundSize]);

  useFrame((state) => {
    if (mesh.current) {
      // Smooth mouse interpolation
      // Normalize mouse from -1..1
      const targetX = state.mouse.x;
      const targetY = state.mouse.y;
      
      mesh.current.material.uMouse.lerp(new THREE.Vector2(targetX, targetY), 0.1);
      mesh.current.material.uStrength.set(xStrength, yStrength);
    }
  });

  return (
    <mesh ref={mesh} scale={scale}>
      <planeGeometry args={[1, 1]} />
      {/* @ts-ignore */}
      <fake3DMaterial uImage={image} uDepthMap={depth} />
    </mesh>
  );
};

function Loader() {
  return <Html center>Loading...</Html>;
}

export default function Fake3DImage({
  imageSrc = "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  depthMapSrc = "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
  xStrength = 0.02,
  yStrength = 0.02,
  backgroundSize = "contain",
  className = ""
}) {
  return (
    <div className={`fake-3d-image-container ${className}`}>
      <Canvas>
        <Suspense fallback={<Loader />}>
          <ImagePlane 
            imageSrc={imageSrc} 
            depthMapSrc={depthMapSrc} 
            xStrength={xStrength} 
            yStrength={yStrength} 
            backgroundSize={backgroundSize}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

Fake3DImage.propTypes = {
  imageSrc: PropTypes.string,
  depthMapSrc: PropTypes.string,
  xStrength: PropTypes.number,
  yStrength: PropTypes.number,
  backgroundSize: PropTypes.oneOf(['cover', 'contain', 'stretch']),
  className: PropTypes.string
};
