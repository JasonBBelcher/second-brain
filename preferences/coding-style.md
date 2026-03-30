# Coding Style & Workflow Preferences

## Testing & Development

**TDD Workflow (Test-Driven Development)**
- Write tests first, then implementation
- Use **Vitest** for TypeScript/Svelte projects
- Aim for **80%+ test coverage** (statements, branches, functions, lines)
- Integration tests: Use **real dependencies**, minimal mocking
- Unit tests: Mock at service boundaries where appropriate

**Why:**
- Ensures code quality and maintainability
- Catches edge cases early
- Provides living documentation
- Supports refactoring with confidence

## Git & Commits

**Commit Strategy: Atomic, Single-Responsibility**
- Each commit should address one logical unit of change
- Format: `type: short description (Recommended)`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `build`, `chore`
- Example: `feat: YouTube import as sidebar tab with metadata filenames`

**Co-Author Attribution**
- Include in commit message footer when appropriate:
  ```
  Co-Authored-By: Claude <model> <noreply@anthropic.com>
  ```

**Branching**
- Keep main/master clean and production-ready
- Feature branches for major work
- Rebase before merging (squash related commits if appropriate)

## Code Quality Standards

**Strict TypeScript**
- `strict: true` in tsconfig.json
- No `any` types unless absolutely necessary (with JSDoc explanation)
- Type-safe IPC bridges and API boundaries

**Svelte Components**
- Use `export let` for props (make them explicit)
- Reactive declarations where appropriate (`$:` statements)
- Component-scoped styles (no global side effects)
- Avoid large components (>300 lines) — split into smaller pieces

**JavaScript/TypeScript**
- Use const by default, let when reassignment needed
- Arrow functions preferred for callbacks
- Descriptive variable/function names
- Comments for "why", not "what" (code should be self-documenting)
- ESLint with Prettier for formatting

**Error Handling**
- Use typed error responses (avoid silent failures)
- Include context in error messages (user action + technical detail)
- IPC errors marshal back to renderer as rejections
- Log errors to console in development, suppress in production

## Architecture Patterns

**Service Layer**
- Encapsulate domain logic in service classes
- Services accept dependencies via constructor
- One responsibility per service
- Clear naming: `AudioService`, `FileService`, `YouTubeService`

**IPC Bridge Pattern**
- Preload script exposes grouped API methods (`audio.*`, `files.*`, `projects.*`)
- Main process uses `ipcMain.handle()` for security
- Error handling at bridge layer
- Type-safe: export TypeScript interface for renderer

**Job Queue System**
- Long-running operations → background job queue
- Persist jobs to database (SQLite)
- Support retry, timeout, progress tracking
- Emit progress events over IPC (e.g., `job:progress`, `job:complete`)

**Reactive Stores**
- Use Svelte's `writable` and `derived` for state
- Automatic two-way binding in components
- Persist to database/localStorage as needed
- Computed stores for derived state

## Performance Considerations

**Audio Processing**
- Stream large files (>500MB) via ffmpeg subprocess
- Cache computed results (waveform peaks → DB)
- Background jobs for long operations

**UI Responsiveness**
- Async IPC calls (never block event loop)
- Offload heavy operations to job queue
- Use `requestAnimationFrame` for animations

**Database**
- WAL mode for concurrent reads
- Indexes on frequently-queried columns
- Foreign keys enforced
- Soft deletes (trashed_at timestamp)

## Testing Best Practices

**Unit Tests**
- Test pure functions, service methods
- Mock external dependencies (file I/O, HTTP, etc.)
- One assertion per test where possible
- Clear test names that describe behavior

**Integration Tests**
- Use real dependencies (actual database, file system)
- Test workflows end-to-end
- Cover happy path + error scenarios
- Minimal setup/teardown

**Test Utilities**
- Create reusable fixtures and helpers
- Mock at module level, not in every test
- Use descriptive test data

## Documentation

**Code Comments**
- Explain "why" not "what"
- Document non-obvious algorithms
- Explain workarounds and their limitations
- Link to related issues/PRs

**Project Documentation**
- README with setup, build, test instructions
- Architecture overview in dedicated files
- Deployment procedures
- Troubleshooting guides

**Memory/Knowledge Base**
- Keep this second-brain up-to-date
- Document major design decisions
- Record lessons learned
- Share with any AI assistant via raw markdown URL

## CSS & Styling

**Theme System**
- Use CSS custom properties for theming
- Define design tokens at `:root`
- Avoid hardcoded colors/values
- Support multiple themes (light, dark, custom)

**Organization**
- Separate structure (base.css) from theme (theme-*.css)
- Component-scoped styles where applicable
- Responsive design (mobile-first)
- Accessibility first (WCAG AA, focus states)

## External Tool Integration

**CLI Tools**
- Wrap in Node.js service layer
- Use `runProcess()` helper for subprocess management
- Handle errors gracefully
- Log stdout/stderr for debugging

**Subprocess Management**
- Set timeouts (prevent hanging processes)
- Capture output for error reporting
- Handle signals (SIGTERM, SIGKILL)
- Thread pools for concurrent operations (avoid overload)

## Performance Budgets

**Bundle Size**
- No heavy frameworks (React, Vue) — vanilla JS preferred
- Minimize external dependencies
- Tree-shake unused code
- Code-split for large features (e.g., drum machine via Parcel)

**Runtime Performance**
- Audio playback: <50ms latency
- UI response: <100ms (P95)
- Initial load: <3s (3G)
- Analysis operations: background jobs

---

**Questions?** Refer to specific projects for implementation examples (AudioForge, Xalpheric).
