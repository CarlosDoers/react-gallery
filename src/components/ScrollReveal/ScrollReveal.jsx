import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './ScrollReveal.css';

const ScrollReveal = ({
  svgSrc = 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
  imageSrc = 'https://images.unsplash.com/photo-1534239143101-1b1c627395c5?q=80&w=2560&auto=format&fit=crop',
  overlayColor = 'rgba(0, 0, 0, 0.5)',
  zoomLevel = 30, // Reduced default for better performance
  damping = 0.05, // Lower is smoother/heavier (0.01 - 0.1)
  opacityStart = 0.2, // When background starts fading in (0-1 progress)
  opacityEnd = 0.6 // When background is fully visible (0-1 progress)
}) => {
  const containerRef = useRef(null);
  const logoRef = useRef(null);
  const bgRef = useRef(null);
  
  // Physics state
  const state = useRef({
    targetProgress: 0,
    currentProgress: 0,
    rafId: null
  });

  useEffect(() => {
    const container = containerRef.current;
    const logo = logoRef.current;
    const bg = bgRef.current;
    
    if (!container || !logo || !bg) return;

    const updatePhysics = () => {
      // Linear interpolation (Lerp) for smooth damping
      const diff = state.current.targetProgress - state.current.currentProgress;
      
      // If difference is very small, snap to target to stop RAF
      if (Math.abs(diff) < 0.0001) {
        state.current.currentProgress = state.current.targetProgress;
      } else {
        state.current.currentProgress += diff * damping;
      }

      const p = state.current.currentProgress;

      // Reverse logic: Start (p=0) = Zoomed In (Huge), End (p=1) = Zoomed Out (Normal)
      const revP = 1 - p;

      // Resolution Fix: "Start Big, Scale Down"
      // We set the base width of the SVG to 300vw (very large) to ensure high quality rasterization.
      // Then we scale it down to match the desired visual size.
      
      const baseWidthVw = 300; // The physical width in DOM
      const normalVisualWidthVw = 20; // The desired visual width at "End" state
      const zoomedVisualWidthVw = normalVisualWidthVw * zoomLevel; // The desired visual width at "Start" state

      // Calculate required scales to achieve visual widths from baseWidth
      const scaleAtEnd = normalVisualWidthVw / baseWidthVw; // e.g. 20 / 300 = 0.066
      const scaleAtStart = zoomedVisualWidthVw / baseWidthVw; // e.g. 600 / 300 = 2

      // Interpolate between Start and End scales
      // Using power curve for "zoom" feel
      // scale = scaleAtEnd + (progress * (scaleAtStart - scaleAtEnd))
      // But progress is revP (1 at start, 0 at end)
      const currentScale = scaleAtEnd + (Math.pow(revP, 3) * (scaleAtStart - scaleAtEnd));
      
      // 2. Logo Opacity:
      const logoOpacity = 1;

      // 3. Background Opacity:
      let bgOpacity = 0;
      if (p > opacityStart) {
        bgOpacity = (p - opacityStart) / (opacityEnd - opacityStart);
        bgOpacity = Math.min(Math.max(bgOpacity, 0), 1);
      }

      logo.style.transform = `scale(${currentScale})`;
      logo.style.opacity = logoOpacity;
      bg.style.opacity = bgOpacity;

      // Continue loop if we haven't reached target
      if (Math.abs(diff) > 0.0001) {
        state.current.rafId = requestAnimationFrame(updatePhysics);
      } else {
        state.current.rafId = null;
      }
    };

    const handleScroll = () => {
      const scrollY = container.scrollTop;
      const maxScroll = container.scrollHeight - container.clientHeight;
      
      if (maxScroll <= 0) return;

      // Update target progress based on scroll position
      state.current.targetProgress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
      
      // Start animation loop if not running
      if (!state.current.rafId) {
        state.current.rafId = requestAnimationFrame(updatePhysics);
      }
    };

    // Start loop once to init
    updatePhysics();

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (state.current.rafId) {
        cancelAnimationFrame(state.current.rafId);
      }
    };
  }, [zoomLevel, damping, opacityStart, opacityEnd]);

  return (
    <div className="scroll-reveal-wrapper" ref={containerRef}>
      <div className="scroll-reveal-sticky">
        
        {/* Background Layer */}
        <div className="scroll-reveal-layer background-layer" ref={bgRef}>
           <div 
            className="scroll-reveal-image" 
            style={{ backgroundImage: `url(${imageSrc})` }}
          />
          <div className="scroll-reveal-overlay" style={{ backgroundColor: overlayColor }}></div>
        </div>

        {/* Logo Layer */}
        <div className="scroll-reveal-layer logo-layer" ref={logoRef}>
          <img 
            src={svgSrc} 
            alt="Reveal Icon" 
            className="scroll-reveal-svg" 
            style={{ width: '300vw' }} 
          />
        </div>

      </div>
      
      {/* Spacer to create scrollable area */}
      <div className="scroll-reveal-spacer"></div>
    </div>
  );
};

ScrollReveal.propTypes = {
  svgSrc: PropTypes.string,
  imageSrc: PropTypes.string,
  overlayColor: PropTypes.string,
  zoomLevel: PropTypes.number,
  damping: PropTypes.number,
  opacityStart: PropTypes.number,
  opacityEnd: PropTypes.number
};

export default ScrollReveal;
