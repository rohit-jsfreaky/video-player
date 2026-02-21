# Mobile Video Player

A mobile-first React video player app built with Vite + TypeScript. It includes a home feed grouped by category, a full player page, in-player related list drawer, mini-player dock behavior, and auto-play next with countdown + cancel.

## Features

### Playback & Player UX
- Custom player controls (play/pause, seek bar, skip ±10s, mute, optional PiP support).
- Single global player surface shared between full player and mini-player for continuity.
- Drag down to minimize from player view.
- Resume playback state while switching between routes.

### Auto-Play Next
- Detects video end and opens a 2-second “Up Next” countdown.
- Cancel option to stop auto-advance.
- Navigates to the next video in the same category after countdown.

### Video Browsing
- Home feed grouped by categories.
- Category badges and duration labels.
- “Up Next / More in category” section on player page.
- Slide-up in-player video list drawer with now-playing highlight.

### App Architecture
- React + TypeScript strict mode.
- Vite build tooling with path alias `@ -> src`.
- Centralized player store for playback state sync.
- Feature-based folder structure under `src/features`.

## Tech Stack
- React 19
- React Router
- React Player
- TypeScript
- Tailwind CSS 4
- Vite
- ESLint

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

## Prerequisites
- Node.js 18+ (recommended: latest LTS)
- npm 9+

## Setup Instructions

### 1) Clone the repository
```bash
git clone <your-repository-url>
cd mobile_video_player
```

### 2) Install dependencies
```bash
npm install
```

### 3) Start development server
```bash
npm run dev
```

Open the URL printed in terminal (default: `http://localhost:5173`).

### 4) Build for production
```bash
npm run build
```

### 5) Preview production build locally
```bash
npm run preview
```

### 6) Run lint checks
```bash
npm run lint
```

## Scripts
- `npm run dev` — starts Vite dev server.
- `npm run build` — runs TypeScript build + Vite production build.
- `npm run preview` — serves production build locally.
- `npm run lint` — runs ESLint.

## Configuration Notes
- Path aliases are configured in `tsconfig.app.json` and `vite.config.ts`.
- Global design tokens are defined in `src/index.css`.
- Animations and transitions are defined in `src/styles/animations.css`.

## Known Development Console Noise
- You may see YouTube `postMessage` origin warnings from `www-widgetapi.js` while developing on localhost.
- These are emitted by the embedded YouTube widget internals and do not necessarily indicate a playback logic failure.

## Troubleshooting

### Player not loading
- Confirm `npm install` completed without errors.
- Verify internet access for YouTube-hosted media URLs.

### Route renders but video doesn’t play
- Check browser autoplay permissions and tab audio settings.
- Confirm selected video has a valid `mediaUrl` in `src/features/videos/data/videos.ts`.

### Build failures
- Delete `node_modules` and `package-lock.json`, reinstall, then retry:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  npm run build
  ```

## Future Improvements (Optional)
- Add unit tests for player store and autoplay transitions.
- Add end-to-end tests for route + player lifecycle.
- Add optional analytics hooks for watch progress.
