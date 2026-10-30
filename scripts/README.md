# Scripts

The scripts use `verb-object` names and are grouped by role:

- `commands/` — user-facing CLI entry points. The names and npm commands remain stable.
- `lib/` — shared command helpers, dependency discovery, renderer routing, and workflow validation.
- `tests/` — focused contract tests invoked by `npm test`.

Use the npm scripts in `package.json` instead of calling files by path. This keeps the command surface stable if the internal organization changes.

## Command groups

- **Project setup:** `doctor`, `setup:python`, `check-agent-harness`, `sync-agent-harness-skill`
- **Episode planning:** `create-episode`, `validate-episode-planning`, `approve-episode`, `episode-status`, `author-episode-shots`
- **Shot routing:** `validate-episode-shots`, `preview-episode-shots`, `render-episode-shots`
- **Asset and episode output:** `prepare-episode-assets`, `validate-episode`, `preview-episode`, `render-still-frame`, `render-episode`, `verify-episode-output`
- **Maintenance:** `generate-episode-registry`, `validate-all-episodes`, `remove-episode`, `generate-contact-sheet`, `compare-episode-visual-regression`

Shot commands route from each ShotBrief. Browser sources are checked and rendered by HyperFrames, Manim sources use the project `.venv`, and layered shots render each layer before FFmpeg composition. Remotion is only invoked for episode-level timing, captions, transitions, and final composition.

The project dependency resolver checks `.venv` for Python/Manim and `tools/ffmpeg/bin` (or `tools/ffmpeg`) for FFmpeg/FFprobe. It selects `Scripts/*.exe` on Windows and `bin/*` on Linux/macOS, so commands do not depend on a system-wide PATH installation.
