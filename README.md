# Dino Ventures – Frontend Engineer Assignment
# Video Player Application

Mobile-first video player application inspired by YouTube mobile UX, focused on smooth playback, gesture interactions, clean UI, and responsive performance.

## Submission Links
- GitHub Repository: https://github.com/rohit-jsfreaky/video-player
- Live Demo: https://video-player-six-nu.vercel.app/

## Tech Stack
- React 19 + TypeScript
- React Router
- React Player
- Tailwind CSS 4
- Vite
- ESLint

## Implemented Requirements (Assignment Mapping)

### 1) Home Page – Video Feed ✅
- Scrollable video feed grouped by category.
- Video cards include:
  - Thumbnail
  - Title
  - Duration
  - Category badge
- Clicking a video opens full-page player route (`/player/:slug`).
- Smooth route transitions between feed and player views.

### 2) Full-Page Video Player ✅
- Video auto-plays on open.
- Custom controls implemented:
  - Play / Pause
  - Skip +10s / -10s
  - Seekable progress bar
  - Current time / total duration
  - Mute toggle
- Responsive layout for mobile and desktop.
- YouTube video playback is supported through dataset URLs.

### 3) In-Player Video List ✅
- In-player related video drawer available during playback.
- List is filtered by current video category.
- Selecting a video:
  - Switches immediately
  - Auto-plays selected video
  - Updates list as category/video context changes
- Includes smooth scrolling and drag-to-dismiss behavior.
- Drawer rendered via React Portal for stable mobile layering/performance.

### 4) Drag-to-Minimize Video Player ✅
- Drag down gesture minimizes player.
- Player docks into bottom mini-player.
- Mini-player includes:
  - Live video preview (continues playback)
  - Video title
  - Play / Pause control
  - Close button
- Mini-player persists while browsing home page.
- Tapping mini-player restores full player.

## Bonus Features Implemented ✅
- Auto-play Next in same category on end.
- 2-second countdown overlay with cancel option.
- Picture-in-Picture API support when available.
- Visual skip feedback animation for ±10s interactions.

## Performance / UX Notes
- Mobile-first UI and touch-friendly controls.
- Global player state store keeps playback continuity across routes.
- Stable route refresh handling on Vercel via SPA rewrite (`vercel.json`).
- Drawer moved to portal rendering to reduce mobile flicker/glitching.

## Project Structure

```text
src/
  app/
    providers/
    router/
    store/
  components/
    layout/
    transitions/
    ui/
  features/
    home/
    player/
    videos/
  lib/
  styles/
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm 9+

### 1) Clone
```bash
git clone https://github.com/rohit-jsfreaky/video-player
cd video-player
```

### 2) Install dependencies
```bash
npm install
```

### 3) Run locally
```bash
npm run dev
```
Open: `http://localhost:5173`

### 4) Build
```bash
npm run build
```

### 5) Preview production build
```bash
npm run preview
```

### 6) Lint
```bash
npm run lint
```

## Available Scripts
- `npm run dev` – start development server
- `npm run build` – TypeScript build + Vite production build
- `npm run preview` – preview production build
- `npm run lint` – run ESLint

## Notes for Evaluators
- Dataset is integrated under `src/features/videos/data/videos.ts`.
- Routing is handled as SPA for deep-link player URLs in deployment.
- Console may show YouTube widget-origin warnings in dev; these are from embed internals and do not block core functionality.
