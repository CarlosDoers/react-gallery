import { cn } from '../../lib/utils';
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Reflector } from 'three/examples/jsm/objects/Reflector';
import './ReflectiveSurface.css';

export default function ReflectiveSurface({ 
  className,
  surfaceColor = '#c8c8c8',
  waveSpeed = 0.1,
  waveAmplitude = 50,
  gridSpacing = 150,
  gridSizeX = 40,
  gridSizeY = 60,
  planeOpacity = 0.6,
  modelScale = 150,
  modelPositionX = 0,
  modelPositionY = 200,
  modelPositionZ = 0,
  modelRotationSpeed = 0.01,
  backgroundType = 'color', // 'color', 'image', or 'shader'
  backgroundImage = null, // URL to background image
  // Filter out component-specific props
  imageSrc,
  depthMapSrc,
  xStrength,
  yStrength,
  backgroundSize,
  text,
  ...props 
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const animationRef = useRef({ count: 0, id: null });
  const wavePropsRef = useRef({ waveSpeed, waveAmplitude });
  const shaderSceneRef = useRef(null);
  const modelPropsRef = useRef({ modelScale, modelPositionX, modelPositionY, modelPositionZ, modelRotationSpeed });

  // Update wave properties ref when they change
  useEffect(() => {
    wavePropsRef.current = { waveSpeed, waveAmplitude };
  }, [waveSpeed, waveAmplitude]);

  // Update model properties ref when they change
  useEffect(() => {
    modelPropsRef.current = { modelScale, modelPositionX, modelPositionY, modelPositionZ, modelRotationSpeed };
    if (sceneRef.current?.model3D) {
      sceneRef.current.model3D.scale.set(modelScale, modelScale, modelScale);
      // Only update X and Z positions - Y is controlled by floating animation
      sceneRef.current.model3D.position.x = modelPositionX;
      sceneRef.current.model3D.position.z = modelPositionZ;
      // Don't update position.y here as it's animated in the animate loop
    }
  }, [modelScale, modelPositionX, modelPositionY, modelPositionZ, modelRotationSpeed]);

  // Update plane opacity when it changes
  useEffect(() => {
    if (sceneRef.current?.reflectorMirror) {
      sceneRef.current.reflectorMirror.material.opacity = planeOpacity;
      sceneRef.current.reflectorMirror.material.transparent = planeOpacity < 1;
      sceneRef.current.reflectorMirror.material.needsUpdate = true;
    }
  }, [planeOpacity]);

  // Setup scene once
  useEffect(() => {
    if (!containerRef.current) return;

    console.log('Setting up ReflectiveSurface scene');

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
    
    // Setup background based on type
    if (backgroundType === 'shader') {
      // Create shader background
      const shaderCamera = new THREE.Camera();
      shaderCamera.position.z = 1;
      
      const shaderScene = new THREE.Scene();
      const shaderGeometry = new THREE.PlaneGeometry(2, 2);
      
      const shaderUniforms = {
        time: { type: 'f', value: 1.0 },
        resolution: { type: 'v2', value: new THREE.Vector2() }
      };
      
      const vertexShader = `
        void main() {
          gl_Position = vec4( position, 1.0 );
        }
      `;
      
      const fragmentShader = `
        #define TWO_PI 6.2831853072
        #define PI 3.14159265359

        precision highp float;
        uniform vec2 resolution;
        uniform float time;

        void main(void) {
          vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
          float t = time*0.05;
          float lineWidth = 0.002;

          vec3 color = vec3(0.0);
          for(int j = 0; j < 3; j++){
            for(int i=0; i < 5; i++){
              color[j] += lineWidth*float(i*i) / abs(fract(t - 0.01*float(j)+float(i)*0.01)*5.0 - length(uv) + mod(uv.x+uv.y, 0.2));
            }
          }
          
          gl_FragColor = vec4(color[0],color[1],color[2],1.0);
        }
      `;
      
      const shaderMaterial = new THREE.ShaderMaterial({
        uniforms: shaderUniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
      });
      
      const shaderMesh = new THREE.Mesh(shaderGeometry, shaderMaterial);
      shaderScene.add(shaderMesh);
      
      // Create render target for shader (reduced resolution to prevent context loss)
      const renderTarget = new THREE.WebGLRenderTarget(
        Math.min(1024, Math.floor(window.innerWidth / 2)),
        Math.min(1024, Math.floor(window.innerHeight / 2))
      );
      
      shaderUniforms.resolution.value.x = Math.min(1024, Math.floor(window.innerWidth / 2));
      shaderUniforms.resolution.value.y = Math.min(1024, Math.floor(window.innerHeight / 2));
      
      // Store shader scene for animation
      shaderSceneRef.current = {
        camera: shaderCamera,
        scene: shaderScene,
        uniforms: shaderUniforms,
        renderTarget: renderTarget,
        material: shaderMaterial,
        geometry: shaderGeometry
      };
      
      // Use the render target as background
      scene.background = renderTarget.texture;
      
      console.log('Shader background initialized');
    } else if (backgroundType === 'image' && backgroundImage) {
      // Load background image
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        backgroundImage,
        (texture) => {
          scene.background = texture;
          console.log('Background image loaded successfully');
        },
        undefined,
        (error) => {
          console.error('Error loading background image:', error);
          // Fallback to color if image fails to load
          scene.background = new THREE.Color(0xe0e0e0);
        }
      );
    } else {
      // Use solid color background as default
      const bgColor = new THREE.Color(0xe0e0e0); // Light gray
      scene.background = bgColor;
    }

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      10000,
    );
    camera.position.set(0, 355, 1220);

    const renderer = new THREE.WebGLRenderer({
      alpha: false, // Changed to false since we have a background now
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Don't clear the color since we have a background
    // renderer.setClearColor(scene.fog.color, 0);

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
    const color = new THREE.Color(surfaceColor);
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

    // Don't create points, we'll use the reflective plane instead
    // const material = new THREE.PointsMaterial({
    //   size: particleSize,
    //   vertexColors: true,
    //   transparent: true,
    //   opacity: particleOpacity,
    //   sizeAttenuation: true,
    // });

    // const points = new THREE.Points(geometry, material);
    // scene.add(points);

    // Create reflective plane using Reflector
    const reflectorGeometry = new THREE.PlaneGeometry(
      AMOUNTX * SEPARATION * 1.5,
      AMOUNTY * SEPARATION * 1.5,
      AMOUNTX * 2,
      AMOUNTY * 2
    );
    
    const reflectorMirror = new Reflector(reflectorGeometry, {
      clipBias: 0.003,
      textureWidth: window.innerWidth * window.devicePixelRatio,
      textureHeight: window.innerHeight * window.devicePixelRatio,
      color: new THREE.Color(0xcccccc), // Lighter gray color for better visibility
      transparent: true,
      opacity: planeOpacity,
    });
    
    reflectorMirror.rotation.x = -Math.PI / 2; // Horizontal
    reflectorMirror.position.y = -100; // Below the duck
    scene.add(reflectorMirror);

    // Add lights for better reflections
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); // Increased intensity
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.position.set(5, 10, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-5, 10, -5);
    scene.add(directionalLight2);

    // Store references BEFORE loading model so the callback can access them
    sceneRef.current = {
      scene,
      camera,
      renderer,
      geometry,
      reflectorMirror,
      reflectorGeometry,
      model3D: null, // Will be set when model loads
    };

    // Load 3D model
    const loader = new GLTFLoader();
    let model3D = null;
    
    loader.load(
      '/src/assets/flower.glb',
      (gltf) => {
        model3D = gltf.scene;
        
        // Scale and position the model
        model3D.scale.set(modelScale, modelScale, modelScale);
        // Only set X and Z - Y will be controlled by floating animation
        model3D.position.x = modelPositionX;
        model3D.position.y = modelPositionY; // Set initial Y position
        model3D.position.z = modelPositionZ;
        
        // Make the model reflective
        model3D.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: child.material.color || 0xffffff,
              metalness: 0.5,
              roughness: 0.3,
              emissive: new THREE.Color(0x444444),
              emissiveIntensity: 0.3,
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        scene.add(model3D);
        sceneRef.current.model3D = model3D;
        console.log('3D model loaded and added to scene');
      },
      (progress) => {
        console.log('Loading model:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Error loading model:', error);
      }
    );

    console.log('Reflective plane and model loader added to scene, starting animation');

    let isAnimating = true;

    // Animation function
    const animate = () => {
      if (!isAnimating) return;
      
      animationRef.current.id = requestAnimationFrame(animate);

      // Update shader background if active
      if (shaderSceneRef.current) {
        shaderSceneRef.current.uniforms.time.value += 0.05;
        renderer.setRenderTarget(shaderSceneRef.current.renderTarget);
        renderer.render(shaderSceneRef.current.scene, shaderSceneRef.current.camera);
        renderer.setRenderTarget(null);
      }

      // Animate 3D model with floating and multi-axis rotation if loaded
      if (sceneRef.current?.model3D) {
        const model = sceneRef.current.model3D;
        const time = animationRef.current.count;
        
        // Floating effect: smooth up and down movement
        const floatAmplitude = 80; // How much it moves up and down (increased for visibility)
        const floatSpeed = 0.5; // Speed of floating
        const baseY = modelPropsRef.current.modelPositionY; // Original Y position
        model.position.y = baseY + Math.sin(time * floatSpeed) * floatAmplitude;
        
        // Dual-axis rotation for more dynamic movement
        model.rotation.x += modelPropsRef.current.modelRotationSpeed * 0.5; // Slower X rotation
        model.rotation.y += modelPropsRef.current.modelRotationSpeed; // Original Y rotation
      }

      // Animate reflective plane with waves
      const reflectorPositions = reflectorGeometry.attributes.position.array;
      const reflectorVertexCount = reflectorGeometry.attributes.position.count;
      
      for (let i = 0; i < reflectorVertexCount; i++) {
        const x = reflectorPositions[i * 3];
        const y = reflectorPositions[i * 3 + 1];
        
        reflectorPositions[i * 3 + 2] = 
          Math.sin((x * 0.005 + animationRef.current.count) * 0.5) * wavePropsRef.current.waveAmplitude * 0.5 +
          Math.sin((y * 0.005 + animationRef.current.count) * 0.3) * wavePropsRef.current.waveAmplitude * 0.5;
      }
      
      reflectorGeometry.attributes.position.needsUpdate = true;
      reflectorGeometry.computeVertexNormals();

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

    // Cleanup function
    return () => {
      console.log('Cleaning up ReflectiveSurface');
      isAnimating = false;
      window.removeEventListener('resize', handleResize);

      if (animationRef.current.id) {
        cancelAnimationFrame(animationRef.current.id);
        animationRef.current.id = null;
      }

      // Clean up shader scene if it exists
      if (shaderSceneRef.current) {
        shaderSceneRef.current.geometry.dispose();
        shaderSceneRef.current.material.dispose();
        shaderSceneRef.current.renderTarget.dispose();
        shaderSceneRef.current = null;
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
          if (object instanceof THREE.Mesh) {
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
  }, [gridSpacing, gridSizeX, gridSizeY, surfaceColor, planeOpacity, backgroundType, backgroundImage]);

  return (
    <div
      ref={containerRef}
      className={cn('reflective-surface', className)}
      {...props}
    />
  );
}

ReflectiveSurface.propTypes = {
  className: PropTypes.string,
  surfaceColor: PropTypes.string,
  waveSpeed: PropTypes.number,
  waveAmplitude: PropTypes.number,
  gridSpacing: PropTypes.number,
  gridSizeX: PropTypes.number,
  gridSizeY: PropTypes.number,
  planeOpacity: PropTypes.number,
  modelScale: PropTypes.number,
  modelPositionX: PropTypes.number,
  modelPositionY: PropTypes.number,
  modelPositionZ: PropTypes.number,
  modelRotationSpeed: PropTypes.number,
  backgroundType: PropTypes.oneOf(['color', 'image', 'shader']),
  backgroundImage: PropTypes.string, // URL to background image
  // Props from other components that need to be filtered
  imageSrc: PropTypes.string,
  depthMapSrc: PropTypes.string,
  xStrength: PropTypes.number,
  yStrength: PropTypes.number,
  backgroundSize: PropTypes.string,
  text: PropTypes.string,
};
