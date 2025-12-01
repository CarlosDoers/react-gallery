import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import PropTypes from 'prop-types';
import "./LayeredText.css";

export default function LayeredText({
  text = "",
  hoverText = "",
  lines = [
    { top: "\u00A0", bottom: "INFINITE" },
    { top: "INFINITE", bottom: "PROGRESS" },
    { top: "PROGRESS", bottom: "INNOVATION" },
    { top: "INNOVATION", bottom: "FUTURE" },
    { top: "FUTURE", bottom: "DREAMS" },
    { top: "DREAMS", bottom: "ACHIEVEMENT" },
    { top: "ACHIEVEMENT", bottom: "\u00A0" },
  ],
  fontSize = "72px",
  fontSizeMd = "36px",
  lineHeight = 60,
  lineHeightMd = 35,
  className = "",
}) {
  const containerRef = useRef(null);
  const timelineRef = useRef(null);

  // If text prop is provided, generate lines from it
  const displayLines = React.useMemo(() => {
    if (!text) return lines;
    const words = text.split(" ").filter(Boolean);
    const hoverWords = hoverText ? hoverText.split(" ").filter(Boolean) : [];
    
    if (words.length === 0) return lines;

    return words.map((word, i) => ({
      top: word,
      bottom: hoverWords.length > 0 
        ? hoverWords[i % hoverWords.length] 
        : words[(i + 1) % words.length],
    }));
  }, [text, hoverText, lines]);

  const calculateTranslateX = (index) => {
    const baseOffset = 35;
    const baseOffsetMd = 20;
    const centerIndex = Math.floor(displayLines.length / 2);
    return {
      desktop: (index - centerIndex) * baseOffset,
      mobile: (index - centerIndex) * baseOffsetMd,
    };
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const paragraphs = container.querySelectorAll("p");

    timelineRef.current = gsap.timeline({ paused: true });

    timelineRef.current.to(paragraphs, {
      y: window.innerWidth >= 768 ? -60 : -35,
      duration: 0.8,
      ease: "power2.out",
      stagger: 0.08,
    });

    const handleMouseEnter = () => {
      timelineRef.current?.play();
    };

    const handleMouseLeave = () => {
      timelineRef.current?.reverse();
    };

    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
      timelineRef.current?.kill();
    };
  }, [displayLines]);

  return (
    <div
      ref={containerRef}
      className={`layered-text-container ${className}`}
      style={{ 
        fontSize, 
        "--md-font-size": fontSizeMd,
        "--line-height": `${lineHeight}px`,
        "--line-height-md": `${lineHeightMd}px`
      }}
    >
      <ul className="layered-text-list">
        {displayLines.map((line, index) => {
          const translateX = calculateTranslateX(index);
          const isEven = index % 2 === 0;
          return (
            <li
              key={index}
              className={`layered-text-item ${isEven ? "skew-even" : "skew-odd"}`}
              style={{
                height: `${lineHeight}px`,
                transform: `translateX(${translateX.desktop}px) skew(${isEven ? "60deg, -30deg" : "0deg, -30deg"}) scaleY(${isEven ? "0.66667" : "1.33333"})`,
                "--md-height": `${lineHeightMd}px`,
                "--md-translate-x": `${translateX.mobile}px`,
              }}
            >
              <p
                className="layered-text-content"
                style={{
                  height: `${lineHeight}px`,
                  lineHeight: `${lineHeight - 5}px`,
                }}
              >
                {line.top}
              </p>
              <p
                className="layered-text-content"
                style={{
                  height: `${lineHeight}px`,
                  lineHeight: `${lineHeight - 5}px`,
                }}
              >
                {line.bottom}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

LayeredText.propTypes = {
  text: PropTypes.string,
  hoverText: PropTypes.string,
  lines: PropTypes.arrayOf(PropTypes.shape({
    top: PropTypes.string,
    bottom: PropTypes.string
  })),
  fontSize: PropTypes.string,
  fontSizeMd: PropTypes.string,
  lineHeight: PropTypes.number,
  lineHeightMd: PropTypes.number,
  className: PropTypes.string
};
