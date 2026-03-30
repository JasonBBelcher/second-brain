# Xalpheric Neocities — Interactive Music Artist Portfolio

**Repository**: [github.com/JasonBBelcher/xalpheric-neocities](https://github.com/JasonBBelcher/xalpheric-neocities)
**Live Site**: [xalpheric.neocities.org](https://xalpheric.neocities.org)
**Status**: v2.0.0 (Active Development)
**License**: See repository for details
**Last Updated**: March 28, 2025

---

## Quick Reference

| Aspect | Detail |
|--------|--------|
| **Type** | Static site portfolio + interactive web apps |
| **Hosting** | Neocities (supporter tier) |
| **Primary Language** | HTML5, CSS3, Vanilla JavaScript |
| **Audio Stack** | Web Audio API, HTML5 `<audio>` |
| **Build Tools** | Parcel.js (drum machine), Node.js CLI |
| **Test Framework** | Jest (409 tests, 86% coverage) |
| **Node Version** | 16+ |
| **CSS Framework** | Open Props (design tokens) |
| **Total Size** | ~760MB (677MB audio + 88MB assets) |

---

## Purpose & Identity

**Xalpheric Neocities** is a multimedia artist portfolio for **Xalpheric** (Jason Belcher), a Birmingham-based electronic music producer with 25+ years of experience in **downtempo psyhop, hip-hop, chillhop, ambient, and jazz-blues influenced electronic music**.

The site serves multiple functions:
1. **Music Distribution Hub** — 87 audio tracks in MP3/OGG, organized by release
2. **Interactive Showcase** — Web Audio drum sequencer, photo gallery, dynamic player
3. **Collaborative Platform** — MidiMob Collective member pages and joint projects
4. **Knowledge Base** — Blog posts ("musings") on music production, technology, and creative practice
5. **Creative Tool** — Drum machine, generative concepts, experimental web experiences
6. **Open Source Archive** — Koala Sampler projects (CC BY-SA 4.0) available for download

---

## Site Architecture

### Directory Structure

```
public/                              # Deployed website root
├── index.html                       # Home (release carousel, intro)
├── musings.html                     # Blog hub
├── gallery.html                     # Photo gallery
├── projects.html                    # Download projects & stems
├── drum-machine.html                # Drum machine launcher
├── drum-machine/                    # Parcel-compiled drum machine app
├── collective.html                  # MidiMob Collective info
├── carbilicon.html                  # Noah Richardson / Carbilicon profile
├── lower-hybrid.html                # Special project
├── who-we-back.html                 # Community & advocacy
├── joseph-deese.html                # Collaborator profile
├── links.html                       # Link directory
├── debug-sync.html                  # Developer debug utility
│
├── musings/                         # Blog posts (11 published + 2 test)
│   ├── A-I-Pink-Elephants.html
│   ├── Facing-the-shadow-Part-1.html
│   ├── How-to-spot-a-pysop.html
│   ├── Invisible-Chronic-Pain.html
│   ├── Love-affair-with-a-sampler.html
│   ├── mod-tracker-beginnings.html
│   └── [8 more posts]
│
├── js/                              # JavaScript (2,805 lines)
│   ├── main.js                      # Release carousel & main player
│   ├── radio-player.js              # Floating music player (43KB)
│   ├── gallery.js                   # Gallery controller
│   ├── lightbox.js                  # Lightbox modal (3.7KB)
│   ├── theme-switcher.js            # Theme toggle logic
│   ├── guestbook.js                 # Guestbook integration
│   ├── guestbook-wakeup.js          # Initialize guestbook
│   ├── notes.js                     # Notes utility
│   ├── utils.js                     # Shared utilities
│   ├── drum-machine/                # Parcel entry point
│   └── drum-machine-backup/         # Legacy version
│
├── css/                             # Stylesheets (4,912 lines)
│   ├── base.css                     # Structure & layout (2,169 lines)
│   ├── theme-cyberpunk.css          # Neon sci-fi theme (1,566 lines)
│   ├── theme-vintage.css            # Warm nostalgic theme (1,177 lines)
│   ├── drum-machine.css             # Drum sequencer UI
│   └── theme.css                    # Legacy monolithic (77.6KB, fallback)
│
├── config/
│   ├── releases.json                # Music catalog (title, year, duration, etc.)
│   └── gallery.json                 # Gallery images (filename, title, category, desc)
│
├── assets/                          # Images & logos (88 items, ~64MB)
│   ├── xalpheric_logo.jpeg
│   ├── xalpheric_favicon.png
│   ├── koala-album-art-default.jpg
│   ├── studio{1,4,6,9}.{jpg,png}
│   ├── saturn-oscillations-*.jpg    # MidiMob Oscillations 2025 event photos (11)
│   ├── album-art-*.png              # Music artwork (13 files)
│   ├── email_me.png, coffee_icon.png
│   ├── band-logos, project-art/
│   └── blog-images/                 # Blog post illustrations
│
└── music/                           # Audio library (677MB, 87 files)
    ├── *.mp3                        # Primary format
    ├── *.ogg                        # Alternative format
    └── [51+ Koala Sampler tracks + originals]

cli/                                 # Node.js CLI & build system
├── index.js                         # CLI entry point
├── commands/
│   ├── deploy/                      # Deployment commands
│   │   ├── music.js
│   │   ├── musings.js
│   │   ├── config.js
│   │   ├── recent.js                # Git-aware incremental
│   │   ├── full.js
│   │   └── all.js                   # Orchestrated workflow
│   ├── check/
│   │   ├── deps.js                  # Dependency verification
│   │   └── storage.js               # Neocities quota monitoring
│   └── cleanup.js                   # Remove orphaned files
├── lib/
│   ├── api/                         # Neocities API wrapper
│   ├── git/                         # Git operations
│   └── logger.js                    # Logging utilities
└── __tests__/                       # 409 passing tests (86% coverage)

package.json                         # Project metadata (v2.0.0)
jest.config.js                       # Test configuration
.env / .env.example                  # Environment setup
README.md                            # Project documentation
THEME-IMPLEMENTATION-SUMMARY.md      # Theme system docs
```

**Statistics:**
- 24 HTML pages
- 2,805 lines of JavaScript
- 4,912 lines of CSS (3 themes)
- 87 audio tracks (677MB)
- 88 images (64MB)
- 409 tests (86% coverage)
- 11 published blog posts

---

## Tech Stack

### Frontend

**Core:**
- HTML5 with semantic markup
- CSS3 with custom properties (Open Props tokens)
- Vanilla JavaScript (no frameworks)
- jQuery 3.7.1 for DOM manipulation

**Design System:**
- **Open Props** — CSS variable design token library (spacing, colors, typography)
- **Google Fonts** — Orbitron typeface (sci-fi aesthetic)
- **Web Audio API** — Native browser audio engine (drum machine)

**Libraries & Tools:**
- **Parcel.js** — Bundler for drum machine app
- **Marked / markdown-it** — Markdown to HTML conversion

### Backend / Deployment

- **Node.js** — CLI runtime
- **Commander.js** — CLI argument parsing
- **Chokidar** — File system watcher (media processing)
- **Neocities API** — Static hosting + file upload
- **Git** — Version control & history tracking

### Media Processing

- **ImageMagick** — Photo resizing/optimization
- **FFmpeg** — Video/audio conversion
- **jq** — JSON CLI processing

### Testing & Development

- **Jest** (v30.2.0) — Unit testing, 409 tests, 86% coverage
- **http-server** (v14.1.1) — Local development server
- **dotenv** — Environment variable management
- **node-fetch** — HTTP requests to Neocities API

---

## Key Pages & Features

### Main Pages

| Page | Purpose | Interactive Features |
|------|---------|---------------------|
| **index.html** | Home | Release carousel, player controls, intro text |
| **musings.html** | Blog hub | Post list, navigation, search (optional) |
| **gallery.html** | Photo gallery | Lightbox, navigation, category filters |
| **projects.html** | Downloads | Project files, stems, Koala kits (CC BY-SA) |
| **drum-machine.html** | Sequencer | Audio-based drum pattern creator |
| **collective.html** | Collaboration | MidiMob Collective overview |
| **links.html** | Directory | Curated external links |

### Interactive Features

#### 1. **Drum Machine** (Web Audio Sequencer)

**Architecture:**
- MVC pattern: Model (state) → View (UI) → Controller (logic)
- Web Audio API for audio generation (no external libraries)
- 8-track pattern sequencer with adjustable length

**Capabilities:**
- BPM control: 30–240 BPM
- Pattern length: 4–64 steps
- Per-track controls:
  - Volume: 0–100 dB
  - Pitch: ±12 semitones
  - Fine-tuning: ±100 cents
- Per-track effects:
  - Filter (lowpass/highpass)
  - Delay (feedback, time)
  - Reverb (decay)
- Pattern saving/loading to localStorage
- Custom sample upload
- Drag-to-adjust sliders

**Performance:**
- Removed 180KB Howler.js dependency
- Sample-accurate timing (<2ms jitter)
- Efficient oscillator scheduling

**Mobile:**
- Touch controls planned (in progress)
- Responsive grid layout
- Fullscreen mode option

---

#### 2. **Release Carousel Player**

**Features:**
- HTML5 audio element with standard controls
- Cover art display
- Metadata display: title, year, duration, description
- Previous/Next navigation buttons
- Download button per track
- Loaded from `releases.json` configuration

**Sync:**
- Syncs with floating radio player
- Shared playback state
- Persistent position (localStorage)

---

#### 3. **Floating Radio Player**

**Features:**
- Draggable widget (desktop only)
- Position saved to localStorage
- Auto-resume playback
- Synced with carousel on home page
- Hides on mobile (responsive)
- Persistent volume level

---

#### 4. **Photo Gallery with Lightbox**

**Features:**
- Dynamic gallery from `gallery.json`
- Lazy loading for performance
- Lightbox modal with zoom
- Previous/Next navigation in lightbox
- Image counter (X of Y)
- Keyboard navigation: arrow keys (←/→), Escape to close
- Optional category filtering
- Metadata: title, description, category, year
- Touch support for mobile

---

#### 5. **Dual-Theme System**

**Themes:**

1. **Cyberpunk** (Default)
   - Neon primary colors
   - Dark backgrounds
   - Glow effects
   - High contrast
   - Sci-fi/futuristic aesthetic

2. **Vintage Light**
   - Warm cream/sand palette
   - Serif typography
   - Nostalgic feel
   - High readability

3. **Vintage Dark**
   - Warm stone/orange
   - Dark backgrounds
   - Serif typography
   - Retro computer aesthetic

**Theme Features:**
- Toggle button (🎨) in header
- Keyboard shortcut: Ctrl+Shift+T
- Preference persisted to localStorage
- Smooth transitions
- WCAG AA color contrast compliance
- Supports `prefers-reduced-motion`
- Focus states for keyboard navigation

---

## Blog System

**Blog Hub:** `musings.html`

**Published Posts (11):**
1. A-I-Pink-Elephants
2. Facing-the-shadow-Part-1
3. How-to-spot-a-pysop
4. Invisible-Chronic-Pain
5. Love-affair-with-a-sampler
6. mod-tracker-beginnings
7. [5 more posts]

**Test Posts:** 2 (for preview/testing)

**Workflow:**
1. Write in Markdown (stored in `thoughts-and-musings/`)
2. Convert to HTML with `npm run build` or `npm run build:all`
3. Deploy with `npm run deploy:musings` or `npm run deploy:all`
4. Published pages in `public/musings/` directory

**Features:**
- Open Graph meta tags for social sharing
- Semantic HTML structure
- Responsive typography
- Code block support (optional)
- Related posts linking (optional)

---

## Collaborative Features

### MidiMob Collective

**Purpose:** Joint project showcasing collaborative electronic music

**Member Profiles:**
- **Carbilicon** (Noah Richardson) — Producer, sampler specialist
- **Joseph Deese** — Collaborator, artist profile
- Xalpheric — Primary artist/curator

**Pages:**
- `collective.html` — Collective overview
- `carbilicon.html` — Noah's page
- `joseph-deese.html` — Joseph's page

**Content:**
- Shared projects
- Collaborative releases
- Event history (e.g., MidiMob Oscillations 2025)
- Advocacy page (`who-we-back.html`)

---

## Asset Management

### Audio Library

**Location:** `/public/music/`
**Size:** 677MB
**Format:** MP3 (primary) + OGG (alternative)
**Count:** 87 tracks

**Organization:**
- Organized by release/project
- 51+ Koala Sampler projects included
- Extended original composition library
- Metadata in `releases.json`

### Image Assets

**Location:** `/public/assets/` + `/blog-images/`
**Size:** ~64MB
**Count:** 88+ images

**Categories:**
- Logo & branding (3)
- Album artwork (13)
- Studio photography (4)
- Live event photos (11, MidiMob Oscillations)
- Project artwork (8)
- UI assets (6)
- Miscellaneous (40+)

**Optimization:**
- ImageMagick for resizing
- Lazy loading on gallery
- Responsive image sizes

---

## Deployment Strategy

### Neocities Hosting

**Tier:** Supporter (50GB+ storage)
**URL:** xalpheric.neocities.org
**Upload Method:** Neocities API via Node.js CLI

### CLI Commands (Unified v2.0.0)

**Deploy Commands:**
```bash
npm run deploy              # Deploy blog posts (musings)
npm run deploy:music        # Deploy audio files
npm run deploy:config       # Deploy config & assets
npm run deploy:recent       # Git-aware incremental (24-hour window)
npm run deploy:full         # Complete site deployment
npm run deploy:all          # Orchestrated: config → musings → music
```

**Utility Commands:**
```bash
npm run check:deps         # Verify dependencies
npm run check:storage      # Monitor Neocities quota
npm run cleanup            # Remove orphaned files
npm run cleanup -- --dry-run  # Preview cleanup
```

**Media Processing:**
```bash
npm run media:photos -- 1920x1080 jpg photo{increment}  # Resize photos
npm run media:videos -- '[{"inputName":"x.mov","outputName":"y.mp3"}]'  # Video
npm run watch:photos       # Watch & auto-process photos
npm run watch:videos       # Watch & auto-process videos
```

**Development:**
```bash
npm run serve              # Start local dev server (http://localhost:8080)
npm run build              # Build blog posts (Markdown → HTML)
npm run build:all          # Build all content
npm test                   # Run all tests
npm test -- --coverage     # With coverage report
npm test -- --watch        # Watch mode
```

### Deployment Features

- **Git-Aware:** `deploy:recent` identifies changed files since time T
- **Incremental:** Only uploads changed files (saves bandwidth, faster)
- **Dry-Run Mode:** Preview changes without uploading
- **Quota Monitoring:** Check storage usage
- **Cleanup Tool:** Remove unwanted/orphaned files
- **Force Upload:** Re-sync all files if needed
- **Verbose Logging:** Debug deployment issues
- **Dependency Check:** Verify all tools installed

### Deployment Workflow

```
1. Make changes (edit HTML, add audio, write blog posts)
2. Test locally: npm run serve
3. Preview deploy: npm run deploy:recent -- --dry-run
4. Deploy: npm run deploy:recent
5. Verify: npm run check:storage
6. Monitor: Check site at xalpheric.neocities.org
```

---

## CSS Architecture

### Style Organization (Post-Refactor)

| File | Lines | Purpose |
|------|-------|---------|
| **base.css** | 2,169 | Structure, layout, components (theme-agnostic) |
| **theme-cyberpunk.css** | 1,566 | Neon colors, glow, sci-fi aesthetic |
| **theme-vintage.css** | 1,177 | Warm palette, nostalgic feel |
| **drum-machine.css** | 6.5KB | Drum sequencer UI |
| **theme.css** | 77.6KB | Legacy monolithic (preserved fallback) |

### Design Tokens

**Color System (Open Props):**
- Cyberpunk: Primary neon, dark backgrounds, bright accents
- Vintage Light: `var(--orange-8)` primary, `var(--sand-1)` background
- Vintage Dark: Warm stone/orange, dark backgrounds

**Typography:**
- **Header:** Orbitron (Google Fonts) — sci-fi aesthetic
- **Body:** System serif stack (vintage) or sans (cyberpunk)
- **Monospace:** System monospace for code

**Spacing, Shadows, Transitions:**
- Open Props variables for consistency
- Smooth 0.2–0.3s transitions
- Subtle shadows for depth

### Component Coverage

- Header & navigation (hamburger menu for mobile)
- Release carousel
- Radio player (floating, draggable)
- Photo gallery & lightbox
- Blog post styling
- Drum machine controls (sliders, buttons, grid)
- Footer & contact links
- Form elements & guestbook
- Responsive grid layouts
- Custom scrollbars (per theme)
- Print styles

---

## Development Workflow

### Local Development

1. **Setup:**
   ```bash
   git clone <repo>
   npm install
   cp .env.example .env
   # Add NEOCITIES_API_KEY to .env
   ```

2. **Start Server:**
   ```bash
   npm run serve
   # http://localhost:8080
   ```

3. **Edit Files:**
   - HTML in `/public/`
   - CSS in `/public/css/`
   - JavaScript in `/public/js/`
   - Blog posts in `thoughts-and-musings/` (Markdown)

4. **Build & Test:**
   ```bash
   npm run build              # Convert Markdown to HTML
   npm test                   # Run 409 tests
   npm test -- --coverage     # Coverage report (86%)
   ```

### Media Processing Workflow

**Photos:**
```bash
# Place originals in process_photos/input/
npm run media:photos -- 1920x1080 jpg photo{increment}
# Outputs to process_photos/output/, then move to assets/
```

**Videos:**
```bash
# Place videos in process_video/input/
npm run media:videos -- '[{"inputName":"video.mov","outputName":"audio.mp3"}]'
# Auto-compress video, extract audio, output to process_video/output/
```

### Testing

**Test Framework:** Jest

**Test Coverage:**
- 409 total tests
- 86% coverage
- Multiple test suites:
  - CLI commands (deploy, check, cleanup)
  - Neocities API wrapper
  - Git operations
  - Logger utilities
  - Media processing

**Run Tests:**
```bash
npm test                              # All tests
npm test -- --coverage                # With coverage report
npm test -- --watch                   # Watch mode
npm test -- cli/__tests__/commands/   # Specific suite
npm test -- --testNamePattern="deploy" # By name pattern
```

---

## Interactive Features & Patterns

### User Interactions

**Theme Switching:**
- Click 🎨 button → cycle themes
- Keyboard: Ctrl+Shift+T
- Preference saved to localStorage
- Custom event dispatch for component sync

**Music Playback:**
- Click track in carousel → play
- Use browser audio controls
- Download button → save audio
- Radio player drag → reposition

**Gallery Navigation:**
- Click image → open lightbox
- ← → (arrow keys) → browse
- Escape → close lightbox
- Previous/Next buttons

**Drum Machine:**
- Click grid → toggle hits
- Drag sliders → adjust BPM/length
- Volume controls → per-track
- Load/Save → manage patterns
- Play/Stop → control sequencer

**Navigation:**
- Hamburger menu (mobile)
- Top nav links
- Back-to-top smooth scroll
- Keyboard focus states

### State Management

- localStorage for theme preference
- localStorage for radio player position
- localStorage for drum patterns
- localStorage for guestbook state
- Session state for gallery pagination

---

## Performance & Optimization

- **No Heavy Frameworks:** Vanilla JS + jQuery only
- **Lazy Loading:** Gallery images load on scroll
- **Parcel Bundling:** Drum machine app minified & hashed
- **Minified Assets:** CSS/JS production builds
- **Web Audio:** Native browser audio (no external libraries)
- **Efficient localStorage:** Compressed pattern data
- **Responsive Images:** Multiple sizes served via CSS
- **Font Optimization:** One Google Font (Orbitron)

---

## Known Issues & Future Work

### Current Limitations

- Drum machine mobile optimization in progress
- MIDI support planned but not yet implemented
- Audio recording/export from drum machine (roadmap)
- Blog search feature optional
- Social media integrations pending

### Recent Achievements

- ✅ Unified CLI (v2.0.0)
- ✅ 86% test coverage (409 tests)
- ✅ Dual-theme system (Cyberpunk, Vintage)
- ✅ Web Audio drum machine
- ✅ Git-aware incremental deployment
- ✅ Media processing automation
- ✅ Storage quota monitoring

### In Development

- 🚀 Mobile-optimized drum machine
- 🚀 MIDI support for hardware integration
- 🚀 Enhanced blog metadata (tags, search)
- 🚀 Audio export from drum machine
- 🚀 Additional effect types (DSP)

---

## Project Statistics

| Metric | Value |
|--------|-------|
| **HTML Pages** | 24 |
| **JavaScript Lines** | 2,805 |
| **CSS Lines** | 4,912 (3 themes) |
| **Audio Files** | 87 (677MB) |
| **Image Assets** | 88+ (64MB) |
| **Blog Posts** | 11 published + 2 test |
| **Tests** | 409 (86% coverage) |
| **Site Size** | ~760MB total |
| **Version** | 2.0.0 |
| **Node Version** | 16+ |
| **npm Dependencies** | 31 (production + dev) |

---

## Accessibility & SEO

- Open Graph meta tags for social sharing
- Semantic HTML5 structure
- WCAG AA color contrast compliance
- Focus states for keyboard navigation
- Reduced motion support (`prefers-reduced-motion`)
- Image alt text throughout
- Structured data ready (JSON-LD schema)
- Fast page load times
- Mobile responsive design

---

## Community & Collaboration

- **MidiMob Collective** — Collaborative music group
- **Open-Source Projects** — 51+ Koala Sampler kits (CC BY-SA 4.0)
- **Member Pages** — Feature collaborative artists
- **Project Downloads** — Stems, samples, DAW files
- **Advocacy** — "Who We Back" community support page

---

## External References

- [Neocities](https://neocities.org/) — Hosting platform
- [Web Audio API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Open Props](https://open-props.style/) — CSS design tokens
- [Jest Documentation](https://jestjs.io/)
- [Parcel Bundler](https://parceljs.org/)
- [Commander.js](https://github.com/tj/commander.js/)

---

**Questions?** See `README.md` in the repository, or refer to `THEME-IMPLEMENTATION-SUMMARY.md` for theme system details. Ask any Claude instance with this file as context.
