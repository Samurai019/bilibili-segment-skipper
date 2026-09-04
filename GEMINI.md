# Project Guidelines: Bilibili Video Segment Skipper

## Browser Remote Debugging
- User's browser: **Helium** (Chromium-based), remote debugging enabled on port 9222.
- **Rule**: Do not use short-lived one-off CDP connections. Always communicate via the persistent CDP bridge daemon on `http://127.0.0.1:9224` (`C:\Users\Astla\.gemini\antigravity\bin\cdp_daemon.py`) to prevent "是否允许远程调试" authorization popups from interrupting the user.

## Bilibili-Evolved Component Structure
- Component export syntax:
  ```javascript
  if (typeof exports !== 'undefined') exports.default = component;
  component;
  ```
  *(Never use `export default` as Bilibili-Evolved's `Function` loader will throw SyntaxError).*
- When releasing updates, always increment `@version` in header and `version` in component metadata.
- Player control bar responsive metrics:
  - Normal mode: `.bvss-ctrl-btn` height `22px`, `align-self: flex-start`, margin `0 10px 0 0`.
  - Fullscreen / Web-fullscreen (`.bpx-player-container[data-screen="web"]`, `.bpx-player-container[data-screen="full"]`): `.bvss-ctrl-btn` height `32px`, min-width `36px`, SVG `22px x 22px`.
