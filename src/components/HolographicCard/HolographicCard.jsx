import React, { useRef, useEffect, useMemo, Suspense } from 'react';
import PropTypes from 'prop-types';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, shaderMaterial, Html } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import './HolographicCard.css';

// Shader Material (Same as Fake3DImage)
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

const ImagePlane = ({ imageSrc, depthMapSrc, xStrength = 0.02, yStrength = 0.02 }) => {
  const mesh = useRef();
  const { viewport } = useThree();
  
  const [image, depth] = useTexture([imageSrc, depthMapSrc]);
  
  useMemo(() => {
    image.minFilter = THREE.LinearFilter;
    image.magFilter = THREE.LinearFilter;
    depth.minFilter = THREE.LinearFilter;
    depth.magFilter = THREE.LinearFilter;
    image.wrapS = THREE.ClampToEdgeWrapping;
    image.wrapT = THREE.ClampToEdgeWrapping;
    depth.wrapS = THREE.ClampToEdgeWrapping;
    depth.wrapT = THREE.ClampToEdgeWrapping;
  }, [image, depth]);

  const scale = useMemo(() => {
    const imageAspect = image.image.width / image.image.height;
    const viewportAspect = viewport.width / viewport.height;
    
    // Cover logic
    if (imageAspect > viewportAspect) {
      return [viewport.height * imageAspect, viewport.height, 1];
    } else {
      return [viewport.width, viewport.width / imageAspect, 1];
    }
  }, [image, viewport]);

  useFrame((state) => {
    if (mesh.current) {
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
  return <Html center><div style={{color: 'white'}}>Loading...</div></Html>;
}

const defaultConfig = {
  hologramColor: '#ff0080',
  enableTilt: true,
  title: 'Holographic',
  description: 'Interactive 3D Card'
};

const HolographicCard = ({
  content,
  imageSrc,
  depthMapSrc,
  hologramColor = defaultConfig.hologramColor,
  enableTilt = defaultConfig.enableTilt,
  title = defaultConfig.title,
  description = defaultConfig.description
}) => {
  const cardRef = useRef(null);
  
  // Refs for physics state
  const state = useRef({
    mouseX: 50,
    mouseY: 50,
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    rafId: null
  });

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const lerp = (start, end, factor) => start + (end - start) * factor;

    const updatePhysics = () => {
      const { targetX, targetY, currentX, currentY } = state.current;
      
      const nextX = lerp(currentX, targetX, 0.1);
      const nextY = lerp(currentY, targetY, 0.1);

      state.current.currentX = nextX;
      state.current.currentY = nextY;

      if (Math.abs(nextX - currentX) > 0.01 || Math.abs(nextY - currentY) > 0.01) {
        card.style.transform = `rotateX(${nextX}deg) rotateY(${nextY}deg)`;
        card.style.setProperty('--mouse-x', `${state.current.mouseX}%`);
        card.style.setProperty('--mouse-y', `${state.current.mouseY}%`);
      }

      state.current.rafId = requestAnimationFrame(updatePhysics);
    };

    const handleMouseMove = (e) => {
      if (!enableTilt) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const xPct = (x / rect.width) * 100;
      const yPct = (y / rect.height) * 100;

      state.current.mouseX = xPct;
      state.current.mouseY = yPct;

      const rotY = ((xPct - 50) / 50) * 15; 
      const rotX = ((yPct - 50) / 50) * -15;

      state.current.targetX = rotX;
      state.current.targetY = rotY;
    };

    const handleMouseEnter = () => {
      card.classList.add('hovering');
      if (!state.current.rafId) {
        state.current.rafId = requestAnimationFrame(updatePhysics);
      }
    };
    
    const handleMouseLeave = () => {
      card.classList.remove('hovering');
      
      if (state.current.rafId) {
        cancelAnimationFrame(state.current.rafId);
        state.current.rafId = null;
      }

      state.current.targetX = 0;
      state.current.targetY = 0;
      state.current.currentX = 0;
      state.current.currentY = 0;
      
      card.style.transform = `rotateX(0deg) rotateY(0deg)`;
      card.style.setProperty('--mouse-x', `50%`);
      card.style.setProperty('--mouse-y', `50%`);
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
      if (state.current.rafId) {
        cancelAnimationFrame(state.current.rafId);
      }
    };
  }, [enableTilt]);

  return (
    <div className="holo-card-container">
      <div
        className="holo-card"
        ref={cardRef}
        style={{
          '--holo-color': hologramColor,
        }}
      >
        {/* Clipped Frame (Background & Effects) */}
        <div className="holo-card-frame">
          <div className="holo-card-bg">
             {/* Replaced ShaderBackground with Canvas + Fake3D */}
             <Canvas>
               <Suspense fallback={<Loader />}>
                 <ImagePlane 
                   imageSrc={imageSrc} 
                   depthMapSrc={depthMapSrc}
                 />
               </Suspense>
             </Canvas>
          </div>

          <div className="holo-card-overlay" />
          <div className="holo-card-shine" />
          <div className="holo-card-foil" />
        </div>

        {/* Content */}
        <div className="holo-card-content">
          {content || (
            <div className="holo-default-content">
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

HolographicCard.propTypes = {
  content: PropTypes.node,
  imageSrc: PropTypes.string,
  depthMapSrc: PropTypes.string,
  hologramColor: PropTypes.string,
  enableTilt: PropTypes.bool,
  title: PropTypes.string,
  description: PropTypes.string
};

export default HolographicCard;
