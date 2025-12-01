import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import './ScrollExpandMedia.css';

const ScrollExpandMedia = ({
  mediaType = 'video',
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand,
  textBlend,
  children,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isMobileState, setIsMobileState] = useState(false);

  // Refs for smooth scrolling
  const targetScrollProgress = useRef(0);
  const currentScrollProgress = useRef(0);
  const animationFrameId = useRef(null);

  const sectionRef = useRef(null);

  useEffect(() => {
    setScrollProgress(0);
    targetScrollProgress.current = 0;
    currentScrollProgress.current = 0;
    setShowContent(false);
    setMediaFullyExpanded(false);
  }, [mediaType]);

  // Smooth scroll animation loop
  useEffect(() => {
    const updateScroll = () => {
      const target = targetScrollProgress.current;
      const current = currentScrollProgress.current;
      
      // Lerp factor (0.1 for smooth, 0.2 for faster)
      const lerpFactor = 0.08;
      
      if (Math.abs(target - current) > 0.0001) {
        const newProgress = current + (target - current) * lerpFactor;
        currentScrollProgress.current = newProgress;
        setScrollProgress(newProgress);
        
        // Check thresholds based on interpolated value
        if (newProgress >= 0.99) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
          // Only unlock if we pulled back significantly
          if (mediaFullyExpanded && newProgress < 0.9) {
             setMediaFullyExpanded(false);
          }
        }
      }
      
      animationFrameId.current = requestAnimationFrame(updateScroll);
    };

    animationFrameId.current = requestAnimationFrame(updateScroll);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [mediaFullyExpanded]); // Re-run if expansion state changes logic

  useEffect(() => {
    const handleWheel = (e) => {
      if (mediaFullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
        // Allow unlocking if scrolling up at top
        setMediaFullyExpanded(false);
        targetScrollProgress.current = 0.95; // Nudge back to start animation
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollDelta = e.deltaY * 0.0009;
        
        // Update target instead of state directly
        const newTarget = Math.min(
          Math.max(targetScrollProgress.current + scrollDelta, 0),
          1
        );
        targetScrollProgress.current = newTarget;
      }
    };

    const handleTouchStart = (e) => {
      setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e) => {
      if (!touchStartY) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      if (mediaFullyExpanded && deltaY < -20 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        targetScrollProgress.current = 0.95;
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
        const scrollDelta = deltaY * scrollFactor;
        
        const newTarget = Math.min(
          Math.max(targetScrollProgress.current + scrollDelta, 0),
          1
        );
        targetScrollProgress.current = newTarget;

        setTouchStartY(touchY);
      }
    };

    const handleTouchEnd = () => {
      setTouchStartY(0);
    };

    const handleScroll = () => {
      if (!mediaFullyExpanded) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [mediaFullyExpanded, touchStartY]);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileState(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const mediaWidth = 300 + scrollProgress * (isMobileState ? 650 : 1250);
  const mediaHeight = 400 + scrollProgress * (isMobileState ? 200 : 400);
  const textTranslateX = scrollProgress * (isMobileState ? 180 : 150);

  const firstWord = title ? title.split(' ')[0] : '';
  const restOfTitle = title ? title.split(' ').slice(1).join(' ') : '';

  return (
    <div ref={sectionRef} className="sem-container">
      <section className="sem-section">
        <div className="sem-wrapper">
          <motion.div
            className="sem-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 - scrollProgress }}
            transition={{ duration: 0.1 }}
          >
            <img
              src={bgImageSrc}
              alt="Background"
              className="sem-bg-image"
            />
            <div className="sem-bg-overlay" />
          </motion.div>

          <div className="sem-content-container">
            <div className="sem-sticky-wrapper">
              <div
                className="sem-media-container"
                style={{
                  width: `${mediaWidth}px`,
                  height: `${mediaHeight}px`,
                  maxWidth: '95vw',
                  maxHeight: '85vh',
                }}
              >
                {mediaType === 'video' ? (
                  mediaSrc.includes('youtube.com') ? (
                    <div className="sem-media-element-wrapper" style={{width: '100%', height: '100%', position: 'relative'}}>
                      <iframe
                        width="100%"
                        height="100%"
                        src={
                          mediaSrc.includes('embed')
                            ? mediaSrc +
                              (mediaSrc.includes('?') ? '&' : '?') +
                              'autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1'
                            : mediaSrc.replace('watch?v=', 'embed/') +
                              '?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=' +
                              mediaSrc.split('v=')[1]
                        }
                        className="sem-media-element"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <div className="sem-media-overlay-blocker" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}></div>
                      <motion.div
                        className="sem-media-overlay"
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 0.5 - scrollProgress * 0.3 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  ) : (
                    <div className="sem-media-element-wrapper" style={{width: '100%', height: '100%', position: 'relative'}}>
                      <video
                        src={mediaSrc}
                        poster={posterSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className="sem-media-element"
                        controls={false}
                        disablePictureInPicture
                        disableRemotePlayback
                      />
                      <motion.div
                        className="sem-media-overlay"
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 0.5 - scrollProgress * 0.3 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  )
                ) : (
                  <div className="sem-media-element-wrapper" style={{width: '100%', height: '100%', position: 'relative'}}>
                    <img
                      src={mediaSrc}
                      alt={title || 'Media content'}
                      className="sem-media-element"
                    />
                    <motion.div
                      className="sem-media-overlay"
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 0.7 - scrollProgress * 0.3 }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                )}

                <div className="sem-info-text">
                  {date && (
                    <p
                      className="sem-date"
                      style={{ transform: `translateX(-${textTranslateX}vw)` }}
                    >
                      {date}
                    </p>
                  )}
                  {scrollToExpand && (
                    <p
                      className="sem-scroll-hint"
                      style={{ transform: `translateX(${textTranslateX}vw)` }}
                    >
                      {scrollToExpand}
                    </p>
                  )}
                </div>
              </div>

              <div className={`sem-title-container ${textBlend ? 'blend-mode' : ''}`}>
                <motion.h2
                  className="sem-title"
                  style={{ transform: `translateX(-${textTranslateX}vw)` }}
                >
                  {firstWord}
                </motion.h2>
                <motion.h2
                  className="sem-title"
                  style={{ transform: `translateX(${textTranslateX}vw)` }}
                >
                  {restOfTitle}
                </motion.h2>
              </div>
            </div>

            <motion.section
              className="sem-children-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.7 }}
            >
              {children || (
                <div>
                  <h3 style={{fontSize: '2rem', marginBottom: '1rem'}}>Expanded Content</h3>
                  <p style={{fontSize: '1.2rem', lineHeight: '1.6'}}>
                    This content appears when you scroll down and the media expands. 
                    You can put any React components here.
                  </p>
                </div>
              )}
            </motion.section>
          </div>
        </div>
      </section>
    </div>
  );
};

ScrollExpandMedia.propTypes = {
  mediaType: PropTypes.oneOf(['video', 'image']),
  mediaSrc: PropTypes.string.isRequired,
  posterSrc: PropTypes.string,
  bgImageSrc: PropTypes.string.isRequired,
  title: PropTypes.string,
  date: PropTypes.string,
  scrollToExpand: PropTypes.string,
  textBlend: PropTypes.bool,
  children: PropTypes.node,
};

export default ScrollExpandMedia;
