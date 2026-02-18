# AccessiReader

Browser extension focused on accessibility that reads web page content aloud using Text-to-Speech. Works even when you switch tabs, intelligently classifies content (text, headings, code, ads, navigation), and offers a selector mode to read specific sections.

Built for people with low vision and anyone who wants a more intuitive browsing experience.

## Features

- **Full Page Reading** - Extracts and reads all text content from any web page
- **Content Selector** - Click specific elements to read only what you want
- **Smart Filtering** - Automatically skips ads, navigation, and code blocks (configurable)
- **Background Playback** - Keeps reading even when you switch to another tab
- **Hybrid TTS** - Free Web Speech API (offline) + premium OpenAI TTS / ElevenLabs voices
- **Draggable Overlay** - Floating control widget with play/pause/stop/skip controls
- **Keyboard Shortcuts** - OS-aware shortcuts (Ctrl on Mac, Alt on Windows/Linux)
- **3 Themes** - Dark, Light, and High Contrast for maximum accessibility
- **Multi-browser** - Chrome and Firefox support
- **Accessibility First** - Full ARIA labels, keyboard navigation, screen reader announcements

## Tech Stack

- [Plasmo](https://www.plasmo.com/) - Browser extension framework
- React 18 + TypeScript
- Zustand - State management with chrome.storage persistence
- Tailwind CSS - Shadow DOM isolated styling

## Interface

<img width="1307" height="783" alt="Captura de Tela 2026-02-18 às 09 59 57" src="https://github.com/user-attachments/assets/7db2c885-9616-4e59-a929-bb352ab602e7" />

### Settings

<img width="282" height="561" alt="Captura de Tela 2026-02-18 às 10 00 59" src="https://github.com/user-attachments/assets/b6882499-e42d-419b-be0a-88ec500bfa2b" />

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)

### Clone and Install

```bash
git clone https://github.com/CyberSecurityUP/AccessiReader.git
cd AccessiReader
pnpm install
```

### Chrome

#### Option A: Development Mode (with hot reload)

```bash
pnpm dev
```

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the folder: `AccessiReader/build/chrome-mv3-dev`
5. The extension icon will appear in your toolbar
6. Navigate to any web page and click the extension icon or use the floating overlay

#### Option B: Production Build

```bash
pnpm build
```

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the folder: `AccessiReader/build/chrome-mv3-prod`
5. The extension is ready to use

### Firefox

#### Option A: Development Mode

```bash
pnpm dev --target=firefox-mv3
```

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on...**
3. Navigate to `AccessiReader/build/firefox-mv3-dev`
4. Select the `manifest.json` file inside that folder
5. The extension will be loaded temporarily (removed on browser restart)

#### Option B: Production Build

```bash
pnpm build --target=firefox-mv3
```

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on...**
3. Navigate to `AccessiReader/build/firefox-mv3-prod`
4. Select the `manifest.json` file inside that folder
5. The extension is ready to use

> **Note:** For permanent Firefox installation, you need to package the extension as an `.xpi` file and submit it to [Firefox Add-ons](https://addons.mozilla.org/).

## Usage

### Reading a Full Page

1. Navigate to any web page
2. Click the **Play** button on the floating overlay (or press `Ctrl+F` / `Alt+F`)
3. The extension will extract text content, skip ads/nav/code, and start reading
4. Use **Pause**, **Stop**, **Previous/Next block** controls as needed

### Selecting Specific Content

1. Click **Select Content** on the overlay (or press `Ctrl+C` / `Alt+C`)
2. Hover over elements on the page - they highlight in blue
3. Click elements to add them to the reading queue (green flash = added)
4. Click the **Play** button or **Read Selection** to start reading your selection
5. Press `Escape` to exit selector mode

### Keyboard Shortcuts

| Shortcut (Mac) | Shortcut (Win/Linux) | Action |
|---|---|---|
| `Ctrl+R` | `Alt+R` | Play / Pause |
| `Ctrl+S` | `Alt+S` | Stop |
| `Ctrl+F` | `Alt+F` | Read full page |
| `Ctrl+C` | `Alt+C` | Toggle content selector |
| `Ctrl+Left/Right` | `Alt+Left/Right` | Previous / Next block |
| `Ctrl+Up/Down` | `Alt+Up/Down` | Speed up / down |
| `Ctrl+H` | `Alt+H` | Show / Hide overlay |

### Settings

Click the gear icon on the overlay to access:

- **TTS Engine** - Switch between Free (Web Speech), OpenAI, or ElevenLabs
- **API Keys** - Configure OpenAI or ElevenLabs API keys for premium voices
- **Theme** - Dark, Light, or High Contrast
- **Content Filters** - Toggle skip ads, skip navigation, skip code blocks
- **Language** - Portuguese, English, Spanish, French, German, Italian, Japanese, Chinese
- **Speed, Volume, Pitch** - Fine-tune the reading experience

## Project Structure

```
src/
├── types/index.ts              # TypeScript type definitions
├── style.css                   # Tailwind directives
├── store/index.ts              # Zustand store with chrome.storage persistence
├── services/
│   ├── content-extractor.ts    # DOM parsing and content classification
│   ├── reading-queue.ts        # Reading queue management
│   └── tts/
│       ├── tts-engine.ts       # TTS engine factory
│       ├── web-speech-tts.ts   # Web Speech API engine (free)
│       └── ai-tts.ts           # OpenAI + ElevenLabs engine
├── hooks/
│   ├── useReader.ts            # Main orchestration hook
│   ├── useContentSelector.ts   # Element selection mode
│   └── useKeyboardShortcuts.ts # OS-aware keyboard shortcuts
├── components/
│   ├── ReaderOverlay.tsx       # Floating draggable control widget
│   ├── ContentHighlighter.tsx  # Visual highlight on current element
│   ├── ProgressBar.tsx         # Reading progress bar
│   ├── SpeedControl.tsx        # Speed control slider
│   ├── VoiceSelector.tsx       # Voice/language selector
│   └── SettingsPanel.tsx       # Settings panel
├── contents/
│   ├── reader-overlay.tsx      # Plasmo CSUI entry point
│   └── selector.ts             # Content script for selector messages
├── background/index.ts         # Service worker (message routing)
├── popup.tsx                   # Extension popup
└── utils/
    ├── dom-classifier.ts       # Ad/code/nav detection
    ├── text-processor.ts       # Text cleaning and formatting
    ├── platform.ts             # OS detection for shortcuts
    └── a11y-helpers.ts         # Accessibility utilities
```

## License

MIT
