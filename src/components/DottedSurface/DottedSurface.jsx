import { cn } from '../../lib/utils';
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';
import './DottedSurface.css';

export default function DottedSurface({ 
  className,
  particleColor = '#c8c8c8',
  particleSize = 8,
  particleOpacity = 0.8,
  waveSpeed = 0.1,
  waveAmplitude = 50,
  gridSpacing = 150,
  gridSizeX = 40,
  gridSizeY = 60,
  // Filter out component-specific props
  imageSrc,
  depthMapSrc,
  xStrength,
  yStrength,
  backgroundSize,
  ...props 
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const animationRef = useRef({ count: 0, id: null });
  const wavePropsRef = useRef({ waveSpeed, waveAmplitude });

  // Update wave properties ref when they change
  useEffect(() => {
    wavePropsRef.current = { waveSpeed, waveAmplitude };
  }, [waveSpeed, waveAmplitude]);

  // Setup scene once
  useEffect(() => {
    if (!containerRef.current) return;

    console.log('Setting up DottedSurface scene');

    // Clean up any existing canvases first
    const existingCanvases = containerRef.current.querySelectorAll('canvas');
    existingCanvases.forEach(canvas => {
      console.log('Removing existing canvas');
      canvas.remove();
    });

    // Reset animation counter on mount
    animationRef.current.count = 0;

    const SEPARATION = gridSpacing;
    const AMOUNTX = gridSizeX;
    const AMOUNTY = gridSizeY;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffffff, 2000, 10000);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      10000,
    );
    camera.position.set(0, 355, 1220);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(scene.fog.color, 0);

    // Important: append canvas to the container
    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    containerRef.current.appendChild(canvas);

    console.log('Canvas appended, creating particles');

    // Create particles
    const positions = [];
    const colors = [];

    // Create geometry for all particles
    const geometry = new THREE.BufferGeometry();

    // Parse color (hex string to RGB values 0-255)
    const color = new THREE.Color(particleColor);
    const r = color.r * 255;
    const g = color.g * 255;
    const b = color.b * 255;

    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        const y = 0; // Will be animated
        const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

        positions.push(x, y, z);
        colors.push(r, g, b);
      }
    }

    console.log(`Created ${AMOUNTX * AMOUNTY} particles`);

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Create material
    const material = new THREE.PointsMaterial({
      size: particleSize,
      vertexColors: true,
      transparent: true,
      opacity: particleOpacity,
      sizeAttenuation: true,
    });

    // Create points object
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    console.log('Points added to scene, starting animation');

    let isAnimating = true;

    // Animation function
    const animate = () => {
      if (!isAnimating) return;
      
      animationRef.current.id = requestAnimationFrame(animate);

      const positionAttribute = geometry.attributes.position;
      const positions = positionAttribute.array;

      let i = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          const index = i * 3;

          // Animate Y position with sine waves
          positions[index + 1] =
            Math.sin((ix + animationRef.current.count) * 0.3) * wavePropsRef.current.waveAmplitude +
            Math.sin((iy + animationRef.current.count) * 0.5) * wavePropsRef.current.waveAmplitude;

          i++;
        }
      }

      positionAttribute.needsUpdate = true;

      renderer.render(scene, camera);
      animationRef.current.count += wavePropsRef.current.waveSpeed;
    };

    // Start animation immediately
    animate();
    console.log('Animation started');

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Store references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      geometry,
      material,
      points,
    };

    // Cleanup function
    return () => {
      console.log('Cleaning up DottedSurface');
      isAnimating = false;
      window.removeEventListener('resize', handleResize);

      if (animationRef.current.id) {
        cancelAnimationFrame(animationRef.current.id);
        animationRef.current.id = null;
      }

      if (sceneRef.current) {
        // Clean up Three.js objects
        sceneRef.current.scene.traverse((object) => {
          if (object instanceof THREE.Points) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });

        sceneRef.current.renderer.dispose();

        if (containerRef.current && canvas) {
          try {
            containerRef.current.removeChild(canvas);
          } catch (e) {
            console.warn('Could not remove canvas', e);
          }
        }

        sceneRef.current = null;
      }
    };
  }, [gridSpacing, gridSizeX, gridSizeY, particleColor, particleSize, particleOpacity]);

  return (
    <div
      ref={containerRef}
      className={cn('dotted-surface', className)}
      {...props}
    >
      <div className="dotted-surface-content">
        <div className="dotted-surface-gradient" />
        <h1 className="dotted-surface-title">Dotted Surface</h1>
      </div>
    </div>
  );
}

DottedSurface.propTypes = {
  className: PropTypes.string,
  particleColor: PropTypes.string,
  particleSize: PropTypes.number,
  particleOpacity: PropTypes.number,
  waveSpeed: PropTypes.number,
  waveAmplitude: PropTypes.number,
  gridSpacing: PropTypes.number,
  gridSizeX: PropTypes.number,
  gridSizeY: PropTypes.number,
  // Props from other components that need to be filtered
  imageSrc: PropTypes.string,
  depthMapSrc: PropTypes.string,
  xStrength: PropTypes.number,
  yStrength: PropTypes.number,
  backgroundSize: PropTypes.string,
};
