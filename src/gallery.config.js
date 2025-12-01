import GridDistortion from './components/GridDistortion/GridDistortion';
import InteractiveNebulaShader from './components/InteractiveNebulaShader/InteractiveNebulaShader';
import LayeredText from './components/LayeredText/LayeredText';
import ScrollReveal from './components/ScrollReveal/ScrollReveal';
import HolographicCard from './components/HolographicCard/HolographicCard';
import LiquidCrystalBackground from './components/LiquidCrystal/LiquidCrystalBackground';
import Waves from './components/Waves/Waves';
import Fake3DImage from './components/Fake3DImage/Fake3DImage';
import InfiniteGrid from './components/InfiniteGrid/InfiniteGrid';
import ScrollExpandMedia from './components/ScrollExpandMedia/ScrollExpandMedia';

import cyberpunkImg4 from './assets/cyberpunk4.png';
import fake3dImg from './assets/fake3d.png';
import fake3dMapImg from './assets/fake3dmap.png';
import card1Img from './assets/card1.png';
import card1MapImg from './assets/card1map.png';

export const components = [
  {
    id: 'fake-3d-image',
    name: 'Fake 3D Image',
    component: Fake3DImage,
    defaultProps: {
      imageSrc: fake3dImg,
      depthMapSrc: fake3dMapImg,
      xStrength: 0.02,
      yStrength: 0.02,
      backgroundSize: 'cover'
    },
    controls: [
      { name: 'imageSrc', label: 'Image URL', type: 'text' },
      { name: 'depthMapSrc', label: 'Depth Map URL', type: 'text' },
      { name: 'xStrength', label: 'X Strength', type: 'range', min: 0, max: 0.1, step: 0.001 },
      { name: 'yStrength', label: 'Y Strength', type: 'range', min: 0, max: 0.1, step: 0.001 },
      { name: 'backgroundSize', label: 'Scaling', type: 'select', options: ['cover', 'contain', 'stretch'] }
    ]
  },
  {
    id: 'waves',
    name: 'Waves',
    component: Waves,
    defaultProps: {
      strokeColor: '#ffffff',
      backgroundColor: '#000000',
      pointerSize: 0.5
    },
    controls: [
      { name: 'strokeColor', label: 'Stroke Color', type: 'color' },
      { name: 'backgroundColor', label: 'Background Color', type: 'color' },
      { name: 'pointerSize', label: 'Pointer Size', type: 'range', min: 0.1, max: 2, step: 0.1 }
    ]
  },
  {
    id: 'liquid-crystal',
    name: 'Liquid Crystal',
    component: LiquidCrystalBackground,
    defaultProps: {
      speed: 0.5,
      radii: [0.2, 0.15, 0.22],
      smoothK: [0.2, 0.25]
    },
    controls: [
      { name: 'speed', label: 'Speed', type: 'range', min: 0, max: 2, step: 0.1 },
    ]
  },
  {
    id: 'grid-distortion',
    name: 'Grid Distortion',
    component: GridDistortion,
    defaultProps: {
      imageSrc: 'https://picsum.photos/1920/1080?grayscale',
      grid: 10,
      mouse: 0.1,
      strength: 0.15,
      relaxation: 0.9
    },
    controls: [
      { name: 'grid', label: 'Grid Size', type: 'range', min: 5, max: 20, step: 1 },
      { name: 'mouse', label: 'Mouse Influence', type: 'range', min: 0, max: 0.5, step: 0.01 },
      { name: 'strength', label: 'Distortion Strength', type: 'range', min: 0, max: 0.5, step: 0.01 },
      { name: 'relaxation', label: 'Relaxation', type: 'range', min: 0.5, max: 0.99, step: 0.01 }
    ]
  },
  {
    id: 'interactive-nebula',
    name: 'Interactive Nebula',
    component: InteractiveNebulaShader,
    defaultProps: {
      hasActiveReminders: false,
      hasUpcomingReminders: false,
      disableCenterDimming: false
    },
    controls: [
      { name: 'hasActiveReminders', label: 'Active Reminders', type: 'checkbox' },
      { name: 'hasUpcomingReminders', label: 'Upcoming Reminders', type: 'checkbox' },
      { name: 'disableCenterDimming', label: 'Disable Dimming', type: 'checkbox' }
    ]
  },
  {
    id: 'layered-text',
    name: 'Layered Text',
    component: LayeredText,
    defaultProps: {
      text: 'INFINITE PROGRESS INNOVATION FUTURE DREAMS ACHIEVEMENT',
      hoverText: 'UNLIMITED GROWTH CREATIVITY TOMORROW VISION SUCCESS',
      fontSize: '72px',
      lineHeight: 60
    },
    controls: [
      { name: 'text', label: 'Text', type: 'text' },
      { name: 'hoverText', label: 'Hover Text', type: 'text' },
      { name: 'fontSize', label: 'Font Size', type: 'text' },
      { name: 'lineHeight', label: 'Line Height', type: 'range', min: 30, max: 100, step: 1 }
    ]
  },
  {
    id: 'scroll-reveal',
    name: 'Scroll Reveal',
    component: ScrollReveal,
    defaultProps: {
      svgSrc: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
      imageSrc: 'https://images.unsplash.com/photo-1534239143101-1b1c627395c5?q=80&w=2560&auto=format&fit=crop',
      overlayColor: 'rgba(0, 0, 0, 0.5)',
      baseOpacity: 0.05,
      enableBlur: true,
      zoomLevel: 100,
      rotationRange: 20,
      damping: 0.05,
      opacityStart: 0.2,
      opacityEnd: 0.6
    },
    controls: [
      { name: 'baseOpacity', label: 'Base Opacity', type: 'range', min: 0, max: 1, step: 0.05 },
      { name: 'zoomLevel', label: 'Zoom Level', type: 'range', min: 1, max: 50, step: 1 },
      { name: 'rotationRange', label: 'Rotation Range', type: 'range', min: 0, max: 90, step: 5 },
      { name: 'enableBlur', label: 'Enable Blur', type: 'checkbox' },
      { name: 'damping', label: 'Smoothness (Damping)', type: 'range', min: 0.01, max: 0.2, step: 0.01 },
      { name: 'opacityStart', label: 'Fade Start', type: 'range', min: 0, max: 1, step: 0.05 },
      { name: 'opacityEnd', label: 'Fade End', type: 'range', min: 0, max: 1, step: 0.05 }
    ]
  },
  {
    id: 'holographic-card',
    name: 'Holographic Card',
    component: HolographicCard,
    defaultProps: {
      imageSrc: card1Img,
      depthMapSrc: card1MapImg,
      hologramColor: '#ff0080',
      enableTilt: true,
      title: 'Holographic',
      description: 'Interactive 3D Card'
    },
    controls: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'enableTilt', label: 'Enable Tilt', type: 'checkbox' },
      { name: 'imageSrc', label: 'Image URL', type: 'text' },
      { name: 'depthMapSrc', label: 'Depth Map URL', type: 'text' }
    ]
  },
  {
    id: 'infinite-grid',
    name: 'Infinite Grid',
    component: InfiniteGrid,
    defaultProps: {
      backgroundColor: '#050505',
      autoRotateSpeed: 0.5,
      cameraX: 2,
      cameraY: 0,
      cameraZ: 2,
      waterColor: '#9bd8ff',
      waterColorMid: '#4287f5',
      waterColorDeep: '#186691'
    },
    controls: [
      { name: 'backgroundColor', label: 'Background', type: 'color' },
      { name: 'autoRotateSpeed', label: 'Rotation Speed', type: 'range', min: 0, max: 5, step: 0.1 },
      { name: 'cameraX', label: 'Camera X', type: 'range', min: -50, max: 50, step: 0.1 },
      { name: 'cameraY', label: 'Camera Y', type: 'range', min: 0.1, max: 50, step: 0.1 },
      { name: 'cameraZ', label: 'Camera Z', type: 'range', min: -50, max: 50, step: 0.1 },
      { name: 'waterColor', label: 'Water Surface Color', type: 'color' },
      { name: 'waterColorMid', label: 'Water Middle Color', type: 'color' },
      { name: 'waterColorDeep', label: 'Water Deep Color', type: 'color' }
    ]
  },
  {
    id: 'scroll-expand-media',
    name: 'Scroll Expand Media',
    component: ScrollExpandMedia,
    defaultProps: {
      mediaType: 'video',
      mediaSrc: 'https://me7aitdbxq.ufs.sh/f/2wsMIGDMQRdYuZ5R8ahEEZ4aQK56LizRdfBSqeDMsmUIrJN1',
      posterSrc: 'https://images.pexels.com/videos/5752729/space-earth-universe-cosmos-5752729.jpeg',
      bgImageSrc: 'https://me7aitdbxq.ufs.sh/f/2wsMIGDMQRdYMNjMlBUYHaeYpxduXPVNwf8mnFA61L7rkcoS',
      title: 'Immersive Video Experience',
      date: 'Cosmic Journey',
      scrollToExpand: 'Scroll to Expand Demo',
      textBlend: true
    },
    controls: [
      { name: 'mediaType', label: 'Media Type', type: 'select', options: ['video', 'image'] },
      { name: 'mediaSrc', label: 'Media Source', type: 'text' },
      { name: 'bgImageSrc', label: 'Background Image', type: 'text' },
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'date', label: 'Date/Subtitle', type: 'text' },
      { name: 'textBlend', label: 'Blend Text', type: 'checkbox' }
    ]
  }
];
