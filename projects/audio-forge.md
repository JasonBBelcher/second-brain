# AudioForge — Unified Music Production Platform

**Repository**: [github.com/JasonBBelcher/audio-forge](https://github.com/JasonBBelcher/audio-forge)
**Status**: v1.1.0 (Production Ready)
**License**: Proprietary
**Last Updated**: March 28, 2025

---

## Quick Reference

| Aspect | Detail |
|--------|--------|
| **Type** | Electron desktop app |
| **Platform** | macOS, Windows, Linux |
| **Primary Language** | TypeScript, Svelte |
| **Database** | SQLite3 (better-sqlite3) with WAL mode |
| **UI Framework** | Svelte 5.0 |
| **Build Tools** | Vite (renderer), tsup (main process) |
| **Test Framework** | Vitest (80% coverage target) |
| **Packager** | electron-builder |
| **Node Version** | 20+ |
| **Electron** | 34.0.0 |

---

## Purpose & Features

AudioForge is a desktop music production workstation that bridges professional DAW functionality with creative hardware samplers, AI generation, and platform integrations.

### Core Features
- **Audio Editing** — Waveform editing with effects (trim, normalize, fade, reverse, pitch shift, time stretch, silence removal)
- **Hardware Sync** — Direct control of SP-404SX (Roland), EMX-1 (Elektron), Koala Kit (Teenage Engineering)
- **AI Audio Generation** — Text-to-speech via Stable Audio Open (≈3.3GB Hugging Face model)
- **Stem Separation** — Demucs-based vocals/drums/bass/other decomposition
- **Audio-to-MIDI** — Polyphonic transcription via basic-pitch
- **Library Management** — Asset organization, BPM/key detection, waveform visualization, collections
- **YouTube Import** — Direct video-to-WAV with metadata naming
- **Folder Watching** — Auto-import new audio files from watched folders
- **Platform Sync** — SoundCloud, YouTube Music, Spotify (via OAuth)
- **Mastering** — Loudness analysis, EQ chain, final optimization

### Hardware Support
- **Roland SP-404SX** — Waveform editing, pattern sequencing, MIDI sync
- **Elektron EMX-1** — Sampler control, live performance control
- **Teenage Engineering Koala** — Kit building & export
- **Generic MIDI devices** — Input/output enumeration, event handling
- **Audio I/O** — Enumerate capture devices, configure buffer sizes

---

## Architecture Overview

### High-Level Structure

```
Main Process (Node.js)
├── 35 Domain Services (audio, file, hardware, generation, etc.)
├── Job Queue System (persistent, with retries)
├── SQLite Database (8 tables, 8 migrations)
├── IPC Handlers (133+ channels via contextBridge)
└── External Process Management (ffmpeg, yt-dlp, aubio, etc.)
          ↕ (IPC bridge via preload.ts)
Renderer Process (Svelte + TypeScript)
├── 45+ Components
├── 5 Reactive Stores
├── Theme system (CSS custom properties)
└── Exclusive playback coordination (activePlayer store)
```

### Directory Layout

```
src/
├── main/
│   ├── main.ts              # App bootstrap, service init, IPC setup
│   ├── preload.ts           # Context-isolated IPC API bridge
│   ├── services/            # 35 service classes (business logic)
│   ├── ipc/                 # 26 handler files (133+ IPC channels)
│   ├── database/
│   │   ├── connection.ts    # SQLite connection pool
│   │   ├── schema.ts        # Table schemas
│   │   └── migrations/      # 8 versioned migrations
│   └── utils/               # process-runner, paths, helpers
├── renderer/
│   ├── App.svelte           # Root component
│   ├── components/          # 45+ .svelte files
│   ├── stores/              # 5 Svelte stores
│   ├── app.css              # Global styles with CSS variables
│   └── main.ts              # Renderer entry
├── shared/
│   └── types.ts             # Shared TypeScript interfaces
└── scripts/
    ├── generate_audio.py    # Stable Audio generation
    └── test_scheduler_recursion.py  # BrownianTreeNoiseSampler testing
```

---

## Tech Stack Details

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@julusian/midi` | ^3.6.1 | MIDI hardware communication |
| `better-sqlite3` | ^12.0.0 | Native SQLite database |
| `wavesurfer.js` | ^7.12.4 | Waveform rendering & playback |
| `archiver` | ^7.0.1 | ZIP creation for exports |
| `@tonejs/midi` | ^2.0.28 | MIDI file parsing |
| `electron-updater` | ^6.3.0 | Auto-update framework |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `electron` | ^34.0.0 | Desktop framework |
| `svelte` | ^5.0.0 | UI framework |
| `vite` | ^6.0.0 | Bundler & dev server |
| `vitest` | ^3.0.0 | Unit/integration tests |
| `typescript` | ^5.7.0 | Type safety |
| `electron-builder` | ^26.0.0 | App packaging |
| `@testing-library/svelte` | ^5.3.1 | Component testing |

### External Tools (Subprocess)

| Tool | Purpose | Installation |
|------|---------|--------------|
| **ffmpeg** / **ffprobe** | Audio/video format conversion, metadata extraction | Package manager (brew, apt, choco) |
| **aubio** | BPM detection, pitch analysis | Via `aubio tempo/pitch` CLI |
| **demucs** | Stem separation | Python venv at `~/.audioforge-venv/` |
| **yt-dlp** | YouTube/media downloads | Python venv |
| **basic-pitch** | Audio-to-MIDI conversion | Python venv at `~/.audioforge-venv/bin/basic-pitch` |
| **sox** | Audio manipulation | Package manager or auto-install via health checks |

### Python Environment

- **Location**: `~/.audioforge-venv/`
- **Created**: On first app run via health checks
- **Packages**: demucs, basic-pitch, aubio, yt-dlp, and dependencies
- **Python Version**: 3.9+

---

## Services (35 files in src/main/services/)

### Audio Processing
- **audio.service.ts** — Core: trim, normalize, analyze, pitch shift, time stretch, fade, reverse, silence removal
- **analysis-pipeline.service.ts** — Orchestrate BPM/key/duration analysis
- **audio-to-midi.service.ts** — basic-pitch CLI wrapper
- **mastering.service.ts** — Loudness analysis, EQ, final chain
- **loop-detector.service.ts** — Detect loop points

### File & Library Management
- **file.service.ts** — Asset import/export, metadata, waveform peaks, database persistence
- **folder-watcher.service.ts** — Monitor folders, auto-import audio files
- **video.service.ts** — Video metadata extraction, audio extraction via ffmpeg
- **media-sync.service.ts** — Audio-to-video sync by offset detection

### Hardware & MIDI
- **sp404.service.ts** — SP-404 kit export
- **sp404-midi.service.ts** — SP-404 MIDI event handling, transport control
- **sp404-companion.service.ts** — SP-404 waveform editor, pattern sequencing
- **emx1.service.ts** — Elektron EMX-1 sampler sync & MIDI
- **koala.service.ts** — Teenage Engineering Koala kit export
- **hardware.service.ts** — Audio device enumeration
- **midi.service.ts** — MIDI device discovery & control
- **midi-files.service.ts** — MIDI file I/O, metadata parsing

### AI & Generation
- **generation.service.ts** — Stable Audio text-to-speech integration
- **model-adapter.ts** — AI model registry (adapter pattern)
- **adapters/stable-audio.adapter.ts** — Subprocess management for `generate_audio.py`

### User Data & State
- **project.service.ts** — Project CRUD, track management
- **collection.service.ts** — Asset collections, ZIP export
- **settings.service.ts** — App settings (key-value store)
- **dashboard.service.ts** — Dashboard state management
- **sync.service.ts** — Cloud sync state tracking

### Platforms & Auth
- **platform.service.ts** — SoundCloud, YouTube Music, Spotify integration
- **oauth.service.ts** — OAuth 2.0 flow
- **plugin.service.ts** — VST/AU plugin discovery

### Infrastructure
- **health.service.ts** — Tool status checks, installation
- **os-integration.service.ts** — Native OS dialogs, notifications, tray
- **queue.service.ts** — Job queue with DB persistence
- **job-executor.ts** — Job dispatcher, timeout handling, orphan reset
- **navigation.service.ts** — Modal/UI navigation state
- **camelot.service.ts** — Harmonic key compatibility (Camelot wheel)

---

## IPC Channels (133+ total across 26 handlers)

### Grouping by Domain

**Audio** (audio:*, 16 channels)
- analyzeBPM, analyzeKey, convertFormat, trim, normalize, fadeIn, fadeOut, reverse, pitchShift, timeStretch, silenceRemove, getDuration, getMetadata, analyzeWaveform, fullAnalysis, separateStems

**Files** (files:*, 8 channels)
- showOpenDialog, showSaveDialog, writeFile, getMediaDir, readAsArrayBuffer, list, search, delete, import, listBySource, getYoutubeDir, scanFolder, analyzeAll, savePeaks, revealInFinder

**Jobs** (jobs:*, 4 channels)
- list, getStatus, cancel, retry

**YouTube** (youtube:*, 2 channels)
- getInfo, download

**Projects** (projects:*, 5 channels)
- getAll, create, update, delete, (state persistence)

**Collections** (collections:*, 7 channels)
- list, create, delete, rename, addAsset, removeAsset, listAssets, exportZip

**Settings** (settings:*, 3 channels)
- get, set, getAll

**Health** (health:*, 3 channels)
- getPlatform, getStatus, installTool

**MIDI** (midi:*, 8 channels)
- import, list, delete, linkToAsset, unlinkFromAsset, getForAsset, getAssetsForMidi, updateTags

**Hardware** (hardware:*, 4 channels)
- list, getStatus, initialize, teardown

**Video** (video:*, 2 channels)
- getMetadata, extractAudio

**AudioToMidi** (audioToMidi:*, 3 channels)
- convert, isInstalled, install

**Generation** (generation:*, 3 channels)
- listModels, isInstalled, install, generate

**Loop** (loop:*, 2 channels)
- detect, extract

**Mastering** (mastering:*, 3 channels)
- analyze, master, showSaveDialog

**MediaSync** (media-sync:*, 4 channels)
- findOffset, syncAudioWithVideo, alignRecordings, autoSync

**Watcher** (watcher:*, 3 channels)
- watchFolder, unwatchFolder, getWatchedFolders

**SP-404** (sp404:*, 18 channels)
- Waveform loading/analysis, pattern I/O, transport control, MIDI mapping, companion mode

**EMX-1** (emx1:*, 9 channels)
- Port listing, MIDI connect/disconnect, pattern selection, MIDI export

**Koala** (koala:*, 4 channels)
- Kit export, kit listing, kit deletion, finder open

**Platforms** (platforms:*, 4 channels)
- list, register, getHistory, soundcloud:connect

**Sync** (sync:*, 3 channels)
- listSessions, initializeSync, getStatus

**Harmonic** (harmonic:*, 2 channels)
- getCompatibleKeys, findCompatibleAssets, getCode

**Assets** (assets:*, 3 channels)
- list, search, delete, import

---

## Database Schema (SQLite3 with better-sqlite3)

### Tables (8 total with migrations)

**projects**
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- bpm (INTEGER)
- key (TEXT)
- timeSignature (TEXT)
- created_at, updated_at (TIMESTAMP)
- state (JSON for undo/redo)

**assets**
- id (INTEGER PRIMARY KEY)
- project_id (FOREIGN KEY)
- file_path (TEXT UNIQUE)
- file_type, file_size (TEXT/INTEGER)
- duration, bpm, key (REAL/INTEGER/TEXT)
- waveform_peaks (BLOB)
- analyzed_at (TIMESTAMP)
- source (TEXT) — tracks origin (e.g., 'youtube')
- created_at (TIMESTAMP)

**settings**
- key (TEXT PRIMARY KEY)
- value (TEXT)

**jobs**
- id (TEXT PRIMARY KEY)
- type (TEXT) — job type key
- status (TEXT) — pending/running/completed/failed
- priority (INTEGER)
- payload, result, error (JSON/TEXT)
- progress, stage (INTEGER/TEXT)
- created_at, started_at, completed_at (TIMESTAMP)
- timeout (INTEGER)

**platform_tokens**
- platform (TEXT PRIMARY KEY)
- access_token, refresh_token (TEXT)
- expires_at (TIMESTAMP)

**hardware_adapters**
- id (TEXT PRIMARY KEY)
- name (TEXT)
- capabilities (JSON)
- config (JSON)

**midi_devices**
- id (TEXT PRIMARY KEY)
- name (TEXT)
- adapter_id (FOREIGN KEY)
- direction (TEXT) — input/output

**midi_captures**
- id (TEXT PRIMARY KEY)
- adapter_id (FOREIGN KEY)
- asset_id (FOREIGN KEY, nullable)
- event_count (INTEGER)
- duration_ms (INTEGER)
- data (BLOB)

### Pragmas & Settings

```sqlite
PRAGMA foreign_keys = ON;       -- Enforce referential integrity
PRAGMA journal_mode = WAL;      -- Write-Ahead Logging for concurrent reads
PRAGMA synchronous = NORMAL;    -- Balance safety & performance
```

### Migrations (8 numbered)

1. **001_initial_schema** — Create base tables (projects, assets, settings, jobs)
2. **002_hardware_adapters** — MIDI hardware tracking
3. **003_midi_captures** — MIDI recording sessions
4. **004_platform_tokens** — OAuth token storage
5. **005_add_indexes** — Performance indexes on status, type, created_at
6. **006_asset_source** — Add `source` column to assets for origin tracking
7. **007_add_trashed_at** — Soft delete support
8. **008_add_foreign_keys** — Enforce referential integrity

---

## Renderer Components (45+ Svelte files)

### Layout & Navigation
- **App.svelte** — Root, theme binding, JobToasts integration
- **Sidebar.svelte** — Main nav with LIBRARY, ORGANIZE, GENERATE, CREATE, HARDWARE sections
- **ProjectEditor.svelte** — Project workspace, view routing
- **Dashboard.svelte** — Home view, project list

### Audio Editing & Playback
- **WaveEditor.svelte** — Full waveform editor with effects buttons, undo/redo
- **AudioPreview.svelte** — Playback widget (bottom bar) with seek/volume
- **WaveformSparkline.svelte** — Mini waveform preview
- **AudioToMidiView.svelte** — Audio-to-MIDI interface with settings
- **MasteringView.svelte** — Loudness analysis, EQ chain

### Hardware Interfaces
- **SP404CompanionView.svelte** — Waveform editor & syncing
- **SP404StepGrid.svelte** — 16-step sequencer UI
- **SP404TransportBar.svelte** — Play/stop/loop controls
- **SP404VelocityLane.svelte** — Per-step velocity editor
- **SP404ChopVisualizer.svelte** — Audio chopping preview
- **EMX1View.svelte** — Elektron EMX-1 control panel
- **KoalaView.svelte** — Koala sampler UI
- **KoalaKitBuilder.svelte** — Kit builder interface

### Library & Import
- **LibraryView.svelte** — Asset browser with filters (BPM range, key, type, source)
- **ImportView.svelte** — Drag-drop import, folder watching, activity feed
- **YouTubeView.svelte** — YouTube download with metadata and persistent history
- **MidiLibraryView.svelte** — MIDI file manager
- **FilesView.svelte** — File system browser

### Collections & Projects
- **ProjectEditor.svelte** — Main editor view switcher
- **NewProjectModal.svelte** — Create new project
- **CollectionsView.svelte** — Organize assets into collections
- **ExportModal.svelte** — Export dialog

### Admin & Tools
- **HealthPanel.svelte** — Tool status with Install buttons
- **JobToasts.svelte** — Live job progress notifications
- **Settings.svelte** — App settings (theme, shortcuts, paths)
- **SetupWizard.svelte** — First-run onboarding
- **PlatformsView.svelte** — OAuth platform setup (SoundCloud, YouTube, Spotify)
- **WatchFoldersView.svelte** — Folder watch management
- **AIGenerateView.svelte** — Stable Audio text-to-speech generator
- **LoopDetectorPanel.svelte** — Loop point detection UI

### Utility Components
- **Modal.svelte** — Modal dialog base
- **Button.svelte** — Styled button component
- **Fader.svelte** — Volume/gain slider
- **Waveform.svelte** — WaveSurfer.js wrapper

---

## Svelte Stores (5 files)

### playbackStore.ts
- `isPlaying`, `currentTime`, `duration`, `masterVolume`, `bpm`, `isMuted`
- Methods: `play()`, `pause()`, `stop()`, `seek()`, `setVolume()`, `setDuration()`, `setMuted()`, `setBpm()`

### projectStore.ts
- Current project, track list, modifications
- Two-way sync with database
- Derived stores for computed state

### settingsStore.ts
- App settings (theme, shortcuts, audio device)
- Persisted to database
- Theme binding in App.svelte: `$: document.documentElement.setAttribute('data-theme', $settingsStore.theme)`

### historyStore.ts
- Undo/redo history with deep copy of state
- Per-project scoped

### trackCommands.ts
- Track selection, deletion, reordering
- Action-based dispatch pattern

### activePlayer (in playbackStore.ts)
- Holds ID of currently playing player ('wave-editor', 'audio-preview', or null)
- Ensures exclusive playback — starting one player stops the other
- Both WaveEditor and AudioPreview subscribe and stop when another player claims ownership

---

## Key Architectural Patterns

### IPC Bridge Pattern

**Preload Isolation** (src/main/preload.ts)
- `contextBridge.exposeInMainWorld('audioforge', api)` exposes typed methods
- Grouped by domain: `api.audio.*`, `api.files.*`, `api.projects.*`, etc.
- Error handling at bridge: returns `{ error: message }` on IPC failure
- Type-safe: `AudioForgeAPI` exported for renderer TypeScript

**Handler Registration** (src/main/ipc/*.ts)
- Each handler file registers with `ipcMain.handle(channel, handler)`
- Handler receives event + arguments, returns result or throws
- Errors automatically marshaled back to renderer as rejection

### Service Layer Pattern

- 35 services encapsulate domain logic
- Services injected with DB connection, paths, other services
- Clear dependency graph: services depend on lower-level infrastructure

**Example**: AudioService
```typescript
constructor(private db: Database, private fileService: FileService) {}
async trim(filePath, startSec, endSec) {
  // Call ffmpeg via runProcess()
  // Update asset metadata via fileService
  // Return result
}
```

### Job Queue System

**Persistence**: Jobs stored in SQLite with status, progress, result
**Execution**: JobExecutor polls on interval, dispatches to registered handlers
**Handlers**: Map job type → async handler function
**Features**: Retry, timeout, priority, progress tracking, orphan reset on startup

**Job Types** (from queue.service.ts):
- download-youtube, convert-audio, separate-stems, analyze-audio, analyze-audio-all
- generate-audio, install-model, audio-to-midi, install-basic-pitch, and more

### Hardware Adapter Pattern

**Registry**: `ModelAdapter<T>` generic for different hardware types
**Separation**: Each hardware gets its own service (sp404.service.ts, emx1.service.ts, koala.service.ts)
**MIDI Events**: sp404-midi.service.ts listens on MIDI port, emits events over IPC to renderer
**Context Isolation**: Preload securely bridges hardware access to renderer

### Reactive Store Pattern

- Svelte `writable` and `derived` stores
- Automatic two-way binding in components
- Persistence: stores subscribe to DB changes, push back on save
- Computed stores derive from base stores (e.g., filtered asset list)

### Exclusive Playback

- `activePlayer` store tracks which player is active
- WaveEditor sets `activePlayer.set('wave-editor')` on play
- AudioPreview sets `activePlayer.set('audio-preview')` on play
- Both subscribe: if `activePlayer` changes to another ID, call `stop()`
- Ensures only one audio source plays at a time

---

## Build & Development

### Scripts

```json
{
  "dev": "electron src/main/main.ts",
  "build:main": "tsup src/main/main.ts src/main/preload.ts --outDir dist/main --format cjs",
  "build:renderer": "vite build",
  "build": "npm run build:main && npm run build:renderer",
  "package": "npm run build && electron-rebuild -f -w better-sqlite3 && electron-builder",
  "test": "vitest",
  "test:watch": "vitest --watch",
  "test:coverage": "vitest --coverage"
}
```

### Development Flow

1. `npm run dev` starts Vite dev server on `http://localhost:5173` + Electron app
2. Main process reloads on file changes (via electron-reload or manual restart)
3. Renderer auto-reloads from Vite HMR
4. Tests run with `npm test` (Vitest with JSDOM for Svelte components)
5. Coverage target: 80% statements, branches, functions, lines

### Production Build

1. `npm run build:main` — Compile main process to `dist/main/` (CommonJS, optimized)
2. `npm run build:renderer` — Compile renderer to `dist/renderer/` (ESM, tree-shaken)
3. `npm run package` — Call electron-builder to create DMG (macOS), NSIS (Windows), AppImage (Linux)
4. Output in `out/` directory

---

## Configuration Files

### TypeScript

- **tsconfig.json** — Base (ES2022, strict mode, path aliases)
- **tsconfig.main.json** — Main process (CommonJS output, Node types)
- **tsconfig.renderer.json** — Renderer (ESNext, Svelte preset)

### Vite (vite.config.ts)

- Plugins: @sveltejs/vite-plugin-svelte
- Test environment: jsdom
- Coverage thresholds: 80% (statements, branches, functions, lines)
- Alias: `@` → `src/`

### Electron Builder (electron-builder.yml)

- Output: DMG (macOS with code signing), NSIS (Windows), AppImage (Linux)
- asarUnpack: better-sqlite3, @julusian/midi (native modules need unpacking)
- Mac signing: identity set to null in dev (skips code signing)

### Code Quality

- **Prettier**: semi=true, singleQuote=true, printWidth=100
- **svelte.config.js**: Standard Svelte preprocess

---

## Known Issues & Workarounds

### BrownianTreeNoiseSampler Recursion (FIXED in v1.1.0)

**Problem**: torchsde's `BrownianInterval._split()` enters infinite recursion when sigma slightly exceeds tree bound (e.g., 500.00006 > 500.0)

**Solution**: Monkey-patch in `generate_audio.py` to clamp sigma to valid range before tree call; also run inference in 256MB stack thread

**Files**: `scripts/generate_audio.py`, `src/main/services/adapters/stable-audio.adapter.ts`, `scripts/test_scheduler_recursion.py` (diagnostic)

### Audio Loading in Electron Renderer (FIXED in v1.1.0)

**Problem**: `fetch('file://...')` blocked by CORS (http://localhost:5173 origin), `fetch('blob://...')` blocked by CSP missing `blob:` in `connect-src`

**Solution**: Use IPC `readAsArrayBuffer()` to read file in main process (full filesystem access), wrap bytes in Blob on renderer, pass blob:// URL to WaveSurfer

**Files**: `src/renderer/components/WaveEditor.svelte`, `src/renderer/components/AudioPreview.svelte`, `src/renderer/index.html` (CSP updated)

### Subprocess Overload (FIXED in v1.1.0)

**Problem**: Analyzing all assets in parallel spawns too many aubio/ffprobe processes

**Solution**: Batch analysis in groups of 3 using `Promise.allSettled()` to avoid system overload

**Files**: `src/main/services/analysis-pipeline.service.ts`

---

## Recent Release (v1.1.0 — March 28, 2025)

### Features Added
- YouTube import as standalone sidebar tab (dedicated media/youtube/ folder)
- Metadata-based filenames for downloaded audio (video title sanitized)
- Source tracking in assets DB (enables Library filtering by origin)
- Health panel Install button for missing tools
- Folder watching UI with live import activity feed
- Job queue toasts showing real-time progress
- CSS theme tokens for consistent dark mode palette

### Fixes
- WaveEditor now loads files clicked from Library
- Audio playback fixed (IPC-based file loading + CSP connect-src update)
- Exclusive playback prevents simultaneous audio sources
- Settings panel close button works correctly
- StableAudio recursion fixed (BrownianTreeNoiseSampler sigma clamping)
- Batch analysis prevents subprocess overload

### Breaking Changes
None — backward compatible

---

## Performance Considerations

### Audio Processing
- Large file operations (>500MB) stream via ffmpeg to avoid RAM overload
- Waveform peaks computed once, cached in DB (BLOB column)
- Stem separation runs in background job queue

### Database
- WAL mode allows concurrent reads while writes happen
- Foreign keys enforced; indexes on frequently-queried columns
- Soft deletes via `trashed_at` timestamp (no permanent deletion in DB)

### UI Responsiveness
- Long-running operations (analysis, generation) offloaded to job queue
- IPC calls are async; UI doesn't block
- Svelte reactive variables batch updates

### MIDI & Hardware
- MIDI event listeners run on separate thread (via @julusian/midi event emitter)
- Hardware enumeration cached and invalidated on device change detection

---

## Testing Strategy

### Test Organization (Vitest)

```
tests/
├── unit/
│   └── main/
│       ├── ipc/
│       ├── services/
│       └── utils/
└── integration/
    └── health.test.ts
```

### Coverage Target

- 80% statements, branches, functions, lines
- Integration tests use real dependencies (minimal mocking)
- Unit tests can mock at service boundaries

### Running Tests

```bash
npm test                 # Run once
npm run test:watch      # Watch mode
npm run test:coverage   # Generate report
```

---

## Deployment & Distribution

### macOS
- Creates `.dmg` (disk image) for distribution
- Code signing required for notarization (production)
- electron-builder handles signing if certificate available

### Windows
- Creates NSIS installer (`.exe`)
- Code signing optional but recommended
- Auto-update via electron-updater

### Linux
- Creates AppImage (universal, no installation needed)
- Also creates `.deb` packages

### Auto-Update

- electron-updater checks for updates on startup
- If new version available, downloads & prompts user
- Safe rollback if update fails

---

## External References

- [Electron Docs](https://www.electronjs.org/docs)
- [Svelte Docs](https://svelte.dev/docs)
- [WaveSurfer.js](https://wavesurfer.xyz/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [Stable Audio Open](https://huggingface.co/stabilityai/stable-audio-open-1.0)
- [demucs](https://github.com/facebookresearch/demucs)
- [basic-pitch](https://github.com/spotify/basic-pitch)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)

---

**Questions?** Refer to specific service files, component source code, or test suites for details. Ask any Claude instance with this file as context.
