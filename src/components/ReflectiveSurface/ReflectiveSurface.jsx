import { cn } from '../../lib/utils';
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Reflector } from 'three/examples/jsm/objects/Reflector';
import { MODELS } from '../../config/assets';
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
  modelScale = 100,
  modelPositionX = 0,
  modelPositionY = 200,
  modelPositionZ = 0,
  modelRotationSpeed = 0.01,
  animationSpeed = 0.5, // Speed multiplier for GLTF animations
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
  const mixerRef = useRef(null); // AnimationMixer for GLTF animations
  const clockRef = useRef(new THREE.Clock()); // Clock for animation timing
  const animationSpeedRef = useRef(animationSpeed);
  const currentTimeRef = useRef(0); // Actual interpolated time applied to animation
  const targetTimeRef = useRef(0); // Target time set by scroll
  const animationActionsRef = useRef([]); // Store animation actions
  
  // Mouse parallax references
  const mouseRef = useRef({ x: 0, y: 0 }); // Current mouse position (lerped)
  const targetMouseRef = useRef({ x: 0, y: 0 }); // Target mouse position
  
  // Model rotation drag references
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const modelRotationRef = useRef({ x: 0, y: 0 }); // User-controlled rotation
  const targetRotationRef = useRef({ x: 0, y: 0 }); // Target rotation for smooth interpolation
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Update wave properties ref when they change
  useEffect(() => {
    wavePropsRef.current = { waveSpeed, waveAmplitude };
  }, [waveSpeed, waveAmplitude]);

  // Update model properties ref when they change
  useEffect(() => {
    modelPropsRef.current = { modelScale, modelPositionX, modelPositionY, modelPositionZ, modelRotationSpeed };
    if (sceneRef.current?.model3D) {
      const model = sceneRef.current.model3D;
      const normScale = model.userData.normalizationScale || 1;
      // 50 is the multiplier we established in the loader
      const finalScale = modelScale * normScale * 50;
      
      model.scale.set(finalScale, finalScale, finalScale);
      
      // Calculate offsets based on current scale
      const center = model.userData.originalCenter || new THREE.Vector3(0, 0, 0);
      const offsetX = center.x * finalScale;
      const offsetZ = center.z * finalScale;
      
      // Only update X and Z positions - Y is controlled by floating animation
      model.position.x = modelPositionX - offsetX;
      model.position.z = modelPositionZ - offsetZ;
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

  // Update animation speed when it changes
  useEffect(() => {
    animationSpeedRef.current = animationSpeed;
    if (mixerRef.current) {
      mixerRef.current.timeScale = animationSpeed;
    }
  }, [animationSpeed]);

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

    // Create Loading Manager
    const manager = new THREE.LoadingManager();
    
    manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = (itemsLoaded / itemsTotal) * 100;
      setLoadingProgress(progress);
      console.log(`Loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`);
    };

    manager.onLoad = () => {
      console.log('Loading complete!');
      setIsLoading(false);
    };

    manager.onError = (url) => {
      console.log('There was an error loading ' + url);
    };

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
        resolution: { type: 'v2', value: new THREE.Vector2() },
        mouse: { type: 'v2', value: new THREE.Vector2(0.0, 0.0) }
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
        uniform vec2 mouse;

        void main(void) {
          // Apply parallax offset based on mouse position
          vec2 parallaxOffset = mouse * 0.15; // Adjust multiplier for intensity
          vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
          
          // Apply the parallax effect
          uv += parallaxOffset;
          
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
      
      // Add mouse move listener for parallax effect and model rotation
      const handleMouseMove = (event) => {
        // Normalize mouse position to -1 to 1 range for parallax
        targetMouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        targetMouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Handle model rotation drag
        if (isDraggingRef.current) {
          const deltaX = event.clientX - dragStartRef.current.x;
          const deltaY = event.clientY - dragStartRef.current.y;
          
          // Update target rotation based on drag distance
          targetRotationRef.current.y = modelRotationRef.current.y + deltaX * 0.01;
          targetRotationRef.current.x = modelRotationRef.current.x + deltaY * 0.01;
          
          // Clamp X rotation to prevent flipping
          targetRotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotationRef.current.x));
        }
      };
      
      const handleMouseDown = (event) => {
        isDraggingRef.current = true;
        dragStartRef.current = { x: event.clientX, y: event.clientY };
        document.body.style.cursor = 'grabbing';
      };
      
      const handleMouseUp = () => {
        if (isDraggingRef.current) {
          isDraggingRef.current = false;
          // Reset rotation targets to return to original position
          targetRotationRef.current.x = 0;
          targetRotationRef.current.y = 0;
          document.body.style.cursor = '';
        }
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
      
      // Store cleanup function for mouse listeners
      const originalCleanup = sceneRef.current?.cleanupScroll;
      sceneRef.current = sceneRef.current || {};
      sceneRef.current.cleanupMouse = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = ''; // Reset cursor on cleanup
      };
      
      console.log('Shader background initialized');
    } else if (backgroundType === 'image' && backgroundImage) {
      // Load background image
      const textureLoader = new THREE.TextureLoader(manager);
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

    // We'll add lights after checking if the model has its own lights
    // Initial basic lighting (will be adjusted after model loads)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Store references BEFORE loading model so the callback can access them
    sceneRef.current = {
      scene,
      camera,
      renderer,
      geometry,
      reflectorMirror,
      reflectorGeometry,
      model3D: null, // Will be set when model loads
      ambientLight, // Store reference to adjust later
    };

    // Load 3D model
    const loader = new GLTFLoader(manager);
    let model3D = null;
    
    loader.load(
      MODELS.butterfly,
      (gltf) => {
        model3D = gltf.scene;
        
        // Compute bounding box to normalize scale and position
        const box = new THREE.Box3().setFromObject(model3D);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Calculate scale to normalize to unit size, then apply user scale
        const maxDim = Math.max(size.x, size.y, size.z);
        const normalizationScale = 1 / maxDim;
        const finalScale = modelScale * normalizationScale * 50; // Multiplier to match previous scale expectations
        
        // Store normalization data for updates
        model3D.userData.originalCenter = center;
        model3D.userData.normalizationScale = normalizationScale;
        
        model3D.scale.set(finalScale, finalScale, finalScale);
        
        // Center the model visually
        // We subtract the scaled center offset to align the visual center with the target position
        model3D.position.x = modelPositionX - center.x * finalScale;
        model3D.position.y = modelPositionY - center.y * finalScale;
        model3D.position.z = modelPositionZ - center.z * finalScale;
        
        // Check if model has lights and extract them
        let hasLights = false;
        const modelLights = [];
        
        model3D.traverse((child) => {
          if (child.isLight) {
            hasLights = true;
            modelLights.push(child);
            console.log(`Found light in model: ${child.type}, intensity: ${child.intensity}, color:`, child.color);
          }
          if (child.isMesh) {
            // Keep original material but enable shadows
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        // If model has lights, use them; otherwise, add our own enhanced lighting
        if (hasLights) {
          console.log(`Model has ${modelLights.length} light(s), using model's lighting`);
          // Optionally boost the ambient light slightly
          if (sceneRef.current.ambientLight) {
            sceneRef.current.ambientLight.intensity = 0.3;
          }
        } else {
          console.log('Model has no lights, adding custom lighting setup');
          // Remove the weak ambient light and add better lighting
          if (sceneRef.current.ambientLight) {
            scene.remove(sceneRef.current.ambientLight);
          }
          
          // Add enhanced lighting setup for vaporwave aesthetic
          const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
          scene.add(ambientLight);
          
          // Key light (main light, bright and from above-front)
          const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
          keyLight.position.set(5, 10, 5);
          keyLight.castShadow = true;
          scene.add(keyLight);
          
          // Fill light (softer, from the side)
          const fillLight = new THREE.DirectionalLight(0xff66ff, 0.6); // Pink/magenta for vaporwave
          fillLight.position.set(-5, 5, 0);
          scene.add(fillLight);
          
          // Rim/Back light (from behind, cyan for vaporwave aesthetic)
          const rimLight = new THREE.DirectionalLight(0x66ffff, 0.7); // Cyan
          rimLight.position.set(0, 5, -5);
          scene.add(rimLight);
          
          // Point light for additional highlights
          const pointLight = new THREE.PointLight(0xffffff, 1, 100);
          pointLight.position.set(0, 10, 0);
          scene.add(pointLight);
        }
        
        scene.add(model3D);
        sceneRef.current.model3D = model3D;
        
        // Check if the model has animations
        if (gltf.animations && gltf.animations.length > 0) {
          console.log(`Found ${gltf.animations.length} animation(s) in the model`);
          
          // Create AnimationMixer
          const mixer = new THREE.AnimationMixer(model3D);
          mixer.timeScale = 0; // Pause by default - scroll will control time
          mixerRef.current = mixer;
          
          // Store animation actions for scroll control
          const actions = [];
          
          // Play all animations but paused (we'll control time manually)
          gltf.animations.forEach((clip, index) => {
            const action = mixer.clipAction(clip);
            action.setLoop(THREE.LoopRepeat);
            action.clampWhenFinished = false;
            action.paused = false; // Not paused, but timeScale is 0
            action.play();
            actions.push({ action, duration: clip.duration });
            console.log(`Loaded animation ${index + 1}: ${clip.name || 'Unnamed'}, duration: ${clip.duration.toFixed(2)}s`);
          });
          
          animationActionsRef.current = actions;
          
          // Add scroll event listener to control animation timeline
          const handleScroll = (event) => {
            // event.preventDefault(); // Optional: uncomment if you want to block page scroll
            
            if (actions.length > 0) {
              // Update target time based on wheel delta
              // Normalize deltaY and multiply by speed factor
              const scrollDelta = event.deltaY * animationSpeedRef.current * 0.001;
              targetTimeRef.current += scrollDelta;
              
              // We don't clamp or loop here anymore. We let targetTime accumulate infinitely
              // and handle the looping via modulo in the render loop. This prevents jumps.
            }
          };
          
          // Add wheel event listener to window for better capture
          window.addEventListener('wheel', handleScroll, { passive: false });
          
          // Store cleanup function
          sceneRef.current.cleanupScroll = () => {
            window.removeEventListener('wheel', handleScroll);
          };
        } else {
          console.log('No animations found in the model');
        }
        
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
        
        // Smooth mouse parallax with lerp
        const mouseLerpFactor = 0.1;
        mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * mouseLerpFactor;
        mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * mouseLerpFactor;
        
        // Update shader uniform with smoothed mouse position
        shaderSceneRef.current.uniforms.mouse.value.x = mouseRef.current.x;
        shaderSceneRef.current.uniforms.mouse.value.y = mouseRef.current.y;
        
        renderer.setRenderTarget(shaderSceneRef.current.renderTarget);
        renderer.render(shaderSceneRef.current.scene, shaderSceneRef.current.camera);
        renderer.setRenderTarget(null);
      }

      // Update GLTF animations with Lerp for smoothness
      if (mixerRef.current && animationActionsRef.current.length > 0) {
        // Lerp factor - lower = smoother/slower, higher = more responsive
        const lerpFactor = 0.08; 
        
        // Smoothly interpolate current time towards target time
        currentTimeRef.current += (targetTimeRef.current - currentTimeRef.current) * lerpFactor;
        
        const maxDuration = animationActionsRef.current[0].duration;
        
        // Calculate looped time using modulo
        // We add maxDuration before modulo to handle negative numbers correctly
        let loopedTime = currentTimeRef.current % maxDuration;
        if (loopedTime < 0) loopedTime += maxDuration;
        
        // Apply smooth time to all actions
        animationActionsRef.current.forEach(({ action }) => {
          action.time = loopedTime;
        });
        
        mixerRef.current.update(0);
      }
      if (sceneRef.current?.model3D) {
        const model = sceneRef.current.model3D;
        const time = animationRef.current.count;
        
        // Floating effect: smooth up and down movement
        const floatAmplitude = 70; // How much it moves up and down (increased for visibility)
        const floatSpeed = 0.4; // Speed of floating
        
        // Calculate current Y offset based on scale
        const normScale = model.userData.normalizationScale || 1;
        const currentScale = modelPropsRef.current.modelScale * normScale * 50;
        const center = model.userData.originalCenter || new THREE.Vector3(0, 0, 0);
        const offsetY = center.y * currentScale;
        
        const baseY = modelPropsRef.current.modelPositionY - offsetY; // Adjusted Y position
        model.position.y = baseY + Math.sin(time * floatSpeed) * floatAmplitude;
        
        // Apply user-controlled rotation with smooth interpolation
        const rotationLerpFactor = 0.1;
        modelRotationRef.current.x += (targetRotationRef.current.x - modelRotationRef.current.x) * rotationLerpFactor;
        modelRotationRef.current.y += (targetRotationRef.current.y - modelRotationRef.current.y) * rotationLerpFactor;
        
        // Always use the original 30-degree oscillation
        const oscillationAmplitude = 30 * (Math.PI / 180); // 30 degrees in radians
        const oscillationSpeed = modelPropsRef.current.modelRotationSpeed * 20;
        const baseOscillation = Math.sin(time * oscillationSpeed) * oscillationAmplitude;
        
        // Apply the oscillation plus any user drag rotation
        model.rotation.y = baseOscillation + modelRotationRef.current.y;
        model.rotation.x = modelRotationRef.current.x;
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

      // Clean up scroll event listener
      if (sceneRef.current?.cleanupScroll) {
        sceneRef.current.cleanupScroll();
      }

      // Clean up mouse event listener
      if (sceneRef.current?.cleanupMouse) {
        sceneRef.current.cleanupMouse();
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
    <>
      {isLoading && (
        <div className="reflective-surface-loader">
          <div className="reflective-surface-spinner"></div>
          <div className="reflective-surface-progress">{Math.round(loadingProgress)}%</div>
        </div>
      )}
      <div
        ref={containerRef}
        className={cn('reflective-surface', className)}
        {...props}
      />
    </>
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
  animationSpeed: PropTypes.number,
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
