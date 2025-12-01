# Scroll Expand Media Component

A React component that creates an immersive scroll-based expansion effect for video or image media. As the user scrolls, the media expands from a card-like view to fill the entire screen, revealing additional content.

## Features

- **Smooth Expansion**: Uses linear interpolation for fluid animation during scroll.
- **Media Support**: Supports both Video (including YouTube embeds) and Images.
- **Responsive**: Adapts to mobile and desktop layouts.
- **Text Blending**: Optional mix-blend-mode for text overlay effects.
- **Touch Support**: Optimized for touch devices.

## Installation

This component requires `framer-motion` for animations.

```bash
npm install framer-motion
```

## Usage

Import the component and use it in your page or layout.

```jsx
import ScrollExpandMedia from './components/ScrollExpandMedia/ScrollExpandMedia';

function App() {
  return (
    <ScrollExpandMedia
      mediaType="video"
      mediaSrc="https://example.com/video.mp4"
      posterSrc="https://example.com/poster.jpg"
      bgImageSrc="https://example.com/background.jpg"
      title="Immersive Experience"
      date="2024"
      scrollToExpand="Scroll to Explore"
      textBlend={true}
    >
      <div className="content">
        <h2>More Content Here</h2>
        <p>This content appears after the media expands.</p>
      </div>
    </ScrollExpandMedia>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mediaType` | `'video' \| 'image'` | `'video'` | The type of media to display. |
| `mediaSrc` | `string` | (Required) | Source URL for the video or image. Supports YouTube URLs. |
| `posterSrc` | `string` | `undefined` | Poster image URL for videos. |
| `bgImageSrc` | `string` | (Required) | Background image URL that fades out as media expands. |
| `title` | `string` | `undefined` | Large title text displayed over the media. |
| `date` | `string` | `undefined` | Subtitle or date text. |
| `scrollToExpand` | `string` | `undefined` | Hint text encouraging user to scroll. |
| `textBlend` | `boolean` | `false` | If true, applies `mix-blend-mode: difference` to the title text. |
| `children` | `ReactNode` | `undefined` | Content to display below the expanded media. |

## Customization

The component uses a CSS file `ScrollExpandMedia.css` for styling. You can modify the CSS variables or classes to adjust colors, spacing, and typography.
