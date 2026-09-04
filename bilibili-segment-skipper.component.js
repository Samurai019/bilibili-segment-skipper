// ==Bilibili-Evolved Component==
// @name         videoSegmentSkipper
// @displayName  视频片段标记与自动跳过
// @description  为视频标记指定片段（如片头、片尾、广告赞助等），在播放时自动跳过。设置无缝集成进 Bilibili-Evolved 面板，控制按钮内嵌至播放器控制栏。
// @author       Antigravity
// ==/Bilibili-Evolved Component==

const component = {
  name: 'videoSegmentSkipper',
  displayName: '视频片段标记与自动跳过',
  description: '标记视频中的特定片段并在播放时自动跳过，支持控制栏原生按钮、快捷键打点与进度条可视化标记。',
  tags: typeof componentsTags !== 'undefined' && componentsTags.video ? [componentsTags.video] : [],
  // Bilibili-Evolved 设置面板中的选项定义
  options: {
    autoSkip: {
      defaultValue: true,
      displayName: '启用自动跳过',
    },
    showToast: {
      defaultValue: true,
      displayName: '跳过时显示提示框 (支持撤销)',
    },
    enableShortcuts: {
      defaultValue: true,
      displayName: '启用打点快捷键 ([ 起点, ] 终点, \\ 保存)',
    },
    highlightProgressBar: {
      defaultValue: true,
      displayName: '在进度条上高亮显示跳过片段',
    },
  },
  entry: async ({ metadata, settings }) => {
    // 注入组件专用 CSS 样式 (自适应常规模式、网页全屏与窗口全屏模式)
    const STYLES = `
      /* 播放器控制栏内嵌按钮 (常规模式：22px 顶端对齐) */
      .bvss-ctrl-btn {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        align-self: flex-start !important;
        height: 22px !important;
        line-height: 22px !important;
        min-width: 30px !important;
        padding: 0 4px !important;
        margin: 0 10px 0 0 !important;
        box-sizing: border-box !important;
        cursor: pointer;
        color: #fff;
        fill: currentColor;
        opacity: 0.85;
        transition: opacity 0.2s ease, transform 0.15s ease, color 0.2s ease;
        position: relative;
        user-select: none;
      }
      .bvss-ctrl-btn:hover {
        opacity: 1;
        color: var(--theme-color, #00aeec);
      }
      .bvss-ctrl-btn svg {
        width: 18px !important;
        height: 18px !important;
        display: block !important;
        margin: auto !important;
        pointer-events: none;
      }

      /* 网页全屏 (web) 与 桌面全屏 (full) 模式自适应：B 站控件在此模式下高度为 32px */
      .bpx-player-container[data-screen="web"] .bvss-ctrl-btn,
      .bpx-player-container[data-screen="full"] .bvss-ctrl-btn {
        height: 32px !important;
        line-height: 32px !important;
        min-width: 36px !important;
      }
      .bpx-player-container[data-screen="web"] .bvss-ctrl-btn svg,
      .bpx-player-container[data-screen="full"] .bvss-ctrl-btn svg {
        width: 22px !important;
        height: 22px !important;
      }

      /* 控制栏弹出面板 (嵌入式下拉菜单风格) */
      #bvss-popup-panel {
        position: absolute;
        bottom: 50px;
        right: 0;
        width: 330px;
        max-height: 480px;
        background: var(--bg2, rgba(24, 25, 28, 0.95));
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        color: var(--text-color, #fff);
        border-radius: 8px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 12px;
        display: none;
        flex-direction: column;
        border: 1px solid rgba(255, 255, 255, 0.12);
        overflow: hidden;
        box-sizing: border-box;
      }
      #bvss-popup-panel * { box-sizing: border-box; }

      .bvss-pop-header {
        padding: 10px 14px;
        background: rgba(255, 255, 255, 0.05);
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .bvss-pop-title {
        font-weight: 600;
        color: var(--theme-color, #00aeec);
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .bvss-pop-close {
        background: transparent;
        border: none;
        color: #888;
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
        padding: 2px 4px;
        border-radius: 4px;
      }
      .bvss-pop-close:hover { color: #fff; background: rgba(255,255,255,0.1); }

      .bvss-pop-body {
        padding: 12px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 380px;
      }

      .bvss-section {
        background: rgba(255, 255, 255, 0.04);
        border-radius: 6px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        border: 1px solid rgba(255, 255, 255, 0.04);
      }
      .bvss-row {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .bvss-input {
        flex: 1;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #fff;
        padding: 5px 8px;
        border-radius: 4px;
        font-size: 12px;
        outline: none;
      }
      .bvss-input:focus {
        border-color: var(--theme-color, #00aeec);
      }
      .bvss-btn {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: #eee;
        padding: 5px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
        white-space: nowrap;
      }
      .bvss-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
      }
      .bvss-btn-primary {
        background: var(--theme-color, #00aeec);
        color: #fff;
        font-weight: 500;
      }
      .bvss-btn-primary:hover {
        filter: brightness(1.1);
      }
      .bvss-btn-danger {
        background: rgba(255, 77, 79, 0.15);
        color: #ff4d4f;
      }
      .bvss-btn-danger:hover {
        background: rgba(255, 77, 79, 0.25);
      }

      .bvss-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: 180px;
        overflow-y: auto;
      }
      .bvss-item {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 4px;
        padding: 6px 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-left: 3px solid var(--theme-color, #00aeec);
      }
      .bvss-item.disabled {
        border-left-color: #555;
        opacity: 0.5;
      }
      .bvss-item-name {
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 140px;
      }
      .bvss-item-time {
        font-size: 10px;
        color: var(--theme-color, #00aeec);
        font-family: monospace;
      }

      /* 播放器进度条高亮色块 */
      .bvss-progress-marker {
        position: absolute;
        top: 0;
        height: 100%;
        background: rgba(251, 114, 153, 0.75);
        border-radius: 1px;
        pointer-events: none;
        z-index: 5;
      }

      /* 悬浮 Toast 提示 */
      #bvss-toast {
        position: fixed;
        top: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--bg2, rgba(24, 25, 28, 0.95));
        backdrop-filter: blur(8px);
        color: #fff;
        padding: 8px 16px;
        border-radius: 20px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
        z-index: 100000;
        font-size: 12px;
        display: none;
        align-items: center;
        gap: 10px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        animation: bvssFadeIn 0.2s ease;
      }
      .bvss-toast-undo {
        color: var(--theme-color, #00aeec);
        cursor: pointer;
        text-decoration: underline;
        font-weight: 500;
      }
      @keyframes bvssFadeIn {
        from { opacity: 0; transform: translate(-50%, -8px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
    `;

    if (typeof bilibiliEvolved !== 'undefined' && bilibiliEvolved.addStyle) {
      bilibiliEvolved.addStyle(STYLES, 'bvss-component-style');
    } else {
      const styleEl = document.createElement('style');
      styleEl.id = 'bvss-component-style';
      styleEl.textContent = STYLES;
      document.head.appendChild(styleEl);
    }

    const STORAGE_PREFIX = 'BVSS_EVOLVED_';

    function getCurrentVideoKey() {
      const url = new URL(window.location.href);
      const epMatch = url.pathname.match(/\/bangumi\/play\/(ep\d+)/);
      if (epMatch) return `EP_${epMatch[1]}`;

      const ssMatch = url.pathname.match(/\/bangumi\/play\/(ss\d+)/);
      if (ssMatch) {
        const epId = url.searchParams.get('ep_id') || 'ss_default';
        return `BANGUMI_${ssMatch[1]}_${epId}`;
      }

      const bvMatch = url.pathname.match(/\/(BV[a-zA-Z0-9]+)/);
      if (bvMatch) {
        const p = url.searchParams.get('p') || '1';
        return `${bvMatch[1]}_p${p}`;
      }

      return url.pathname.replace(/\/$/, '').replace(/\//g, '_');
    }

    function loadSegments() {
      const key = STORAGE_PREFIX + getCurrentVideoKey();
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    function saveSegments(segments) {
      const key = STORAGE_PREFIX + getCurrentVideoKey();
      localStorage.setItem(key, JSON.stringify(segments));
      updateProgressMarkers();
    }

    function formatTime(sec) {
      if (isNaN(sec) || sec < 0) sec = 0;
      const total = Math.floor(sec);
      const m = Math.floor(total / 60);
      const s = total % 60;
      const ms = Math.floor((sec % 1) * 10);
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
    }

    function parseTime(str) {
      if (typeof str === 'number') return str;
      if (!str) return 0;
      const parts = str.trim().split(':');
      if (parts.length === 1) return parseFloat(parts[0]) || 0;
      if (parts.length === 2) return (parseFloat(parts[0]) || 0) * 60 + (parseFloat(parts[1]) || 0);
      if (parts.length === 3) return (parseFloat(parts[0]) || 0) * 3600 + (parseFloat(parts[1]) || 0) * 60 + (parseFloat(parts[2]) || 0);
      return 0;
    }

    function getActiveVideo() {
      const videos = Array.from(document.querySelectorAll('video'));
      if (videos.length === 0) return null;
      if (videos.length === 1) return videos[0];
      const playing = videos.find(v => !v.paused && v.duration > 0);
      return playing || videos.find(v => v.duration > 0) || videos[0];
    }

    let toastTimeout = null;
    let isTemporarilyDisabled = false;
    let tempDisableTimeout = null;
    let lastSkippedSegmentId = null;

    function showToast(msg, undoCallback = null) {
      let toast = document.getElementById('bvss-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'bvss-toast';
        document.body.appendChild(toast);
      }

      toast.innerHTML = `<span>⏭️ ${msg}</span>`;
      if (undoCallback) {
        const undoBtn = document.createElement('span');
        undoBtn.className = 'bvss-toast-undo';
        undoBtn.innerText = '撤销跳过';
        undoBtn.onclick = () => {
          undoCallback();
          toast.style.display = 'none';
        };
        toast.appendChild(undoBtn);
      }

      toast.style.display = 'flex';
      if (toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        toast.style.display = 'none';
      }, 4500);
    }

    function checkAndExecuteSkip(video) {
      const opts = (settings && settings.options) || {};
      const autoSkip = opts.autoSkip !== false;
      const showNotice = opts.showToast !== false;

      if (!autoSkip || isTemporarilyDisabled) return;
      if (!video || video.paused || video.seeking) return;

      const currentTime = video.currentTime;
      const segments = loadSegments();

      for (const seg of segments) {
        if (!seg.enabled) continue;

        if (currentTime >= seg.start && currentTime < (seg.end - 0.2)) {
          if (lastSkippedSegmentId === seg.id && Math.abs(currentTime - seg.end) < 0.8) {
            continue;
          }

          const prevTime = currentTime;
          video.currentTime = seg.end;
          lastSkippedSegmentId = seg.id;

          if (showNotice) {
            const desc = seg.name ? `「${seg.name}」` : '';
            showToast(`已自动跳过 ${desc} (${formatTime(seg.start)} - ${formatTime(seg.end)})`, () => {
              video.currentTime = prevTime;
              isTemporarilyDisabled = true;
              if (tempDisableTimeout) clearTimeout(tempDisableTimeout);
              tempDisableTimeout = setTimeout(() => {
                isTemporarilyDisabled = false;
              }, 12000);
              showToast('已撤销，跳过检测休眠 12 秒');
            });
          }
          break;
        }
      }
    }

    function updateProgressMarkers() {
      document.querySelectorAll('.bvss-progress-marker').forEach(el => el.remove());

      const opts = (settings && settings.options) || {};
      if (opts.highlightProgressBar === false) return;

      const video = getActiveVideo();
      if (!video || !video.duration || isNaN(video.duration)) return;

      const progressTrack = document.querySelector(
        '.bpx-player-progress-schedule, .bilibili-player-video-progress-bar, .bpx-player-progress-slider'
      );
      if (!progressTrack) return;

      const duration = video.duration;
      const segments = loadSegments();

      segments.forEach(seg => {
        if (!seg.enabled) return;
        const startPct = Math.max(0, Math.min(100, (seg.start / duration) * 100));
        const endPct = Math.max(0, Math.min(100, (seg.end / duration) * 100));
        const widthPct = Math.max(0.3, endPct - startPct);

        const marker = document.createElement('div');
        marker.className = 'bvss-progress-marker';
        marker.style.left = `${startPct}%`;
        marker.style.width = `${widthPct}%`;
        marker.title = `跳过片段: ${seg.name || '未命名'} (${formatTime(seg.start)} - ${formatTime(seg.end)})`;
        progressTrack.appendChild(marker);
      });
    }

    let popupPanel = null;

    function renderPanel() {
      if (!popupPanel) return;

      const segments = loadSegments();
      const listContainer = popupPanel.querySelector('#bvss-pop-list');
      const countLabel = popupPanel.querySelector('#bvss-pop-count');
      if (countLabel) countLabel.innerText = `${segments.length} 个`;

      if (!listContainer) return;
      listContainer.innerHTML = '';

      if (segments.length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; color:#777; padding:12px 0;">暂无标记片段</div>';
        return;
      }

      segments.sort((a, b) => a.start - b.start);

      segments.forEach((seg, idx) => {
        const item = document.createElement('div');
        item.className = `bvss-item ${seg.enabled ? '' : 'disabled'}`;
        item.innerHTML = `
          <div>
            <div class="bvss-item-name" title="${seg.name}">${seg.name || '片段 ' + (idx + 1)}</div>
            <div class="bvss-item-time">${formatTime(seg.start)} ➔ ${formatTime(seg.end)}</div>
          </div>
          <div style="display: flex; gap: 4px;">
            <button class="bvss-btn" data-act="seek" data-time="${seg.start}" title="定位起点">▶</button>
            <button class="bvss-btn" data-act="toggle" data-id="${seg.id}" title="${seg.enabled ? '已启用' : '已禁用'}">${seg.enabled ? '✓' : '✗'}</button>
            <button class="bvss-btn bvss-btn-danger" data-act="del" data-id="${seg.id}" title="删除">✕</button>
          </div>
        `;
        listContainer.appendChild(item);
      });

      listContainer.onclick = (e) => {
        const btn = e.target.closest('button[data-act]');
        if (!btn) return;
        const act = btn.getAttribute('data-act');
        const id = btn.getAttribute('data-id');
        const video = getActiveVideo();

        if (act === 'seek' && video) {
          video.currentTime = parseFloat(btn.getAttribute('data-time'));
        } else if (act === 'toggle') {
          const target = segments.find(s => s.id === id);
          if (target) {
            target.enabled = !target.enabled;
            saveSegments(segments);
            renderPanel();
          }
        } else if (act === 'del') {
          const filtered = segments.filter(s => s.id !== id);
          saveSegments(filtered);
          renderPanel();
        }
      };
    }

    function createPopupPanel(parentContainer) {
      if (document.getElementById('bvss-popup-panel')) return;

      popupPanel = document.createElement('div');
      popupPanel.id = 'bvss-popup-panel';
      popupPanel.innerHTML = `
        <div class="bvss-pop-header">
          <span class="bvss-pop-title">✂️ 视频片段标记</span>
          <button class="bvss-pop-close" id="bvss-pop-close">✕</button>
        </div>
        <div class="bvss-pop-body">
          <div class="bvss-section">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:600;">添加片段</span>
              <span id="bvss-pop-current-time" style="font-family:monospace; color:var(--theme-color,#00aeec);">00:00.0</span>
            </div>
            <div class="bvss-row">
              <input class="bvss-input" id="bvss-pop-start" placeholder="起点 00:00.0">
              <button class="bvss-btn" id="bvss-pop-get-start">当前</button>
            </div>
            <div class="bvss-row">
              <input class="bvss-input" id="bvss-pop-end" placeholder="终点 00:00.0">
              <button class="bvss-btn" id="bvss-pop-get-end">当前</button>
            </div>
            <input class="bvss-input" id="bvss-pop-name" placeholder="片段标签/名称 (可选)">
            <button class="bvss-btn bvss-btn-primary" id="bvss-pop-save">➕ 保存片段 (快捷键 \\)</button>
          </div>

          <div class="bvss-section">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:600;">已保存片段</span>
              <span id="bvss-pop-count" style="color:#888;">0 个</span>
            </div>
            <div class="bvss-list" id="bvss-pop-list"></div>
          </div>
        </div>
        <div style="padding: 8px 12px; background: rgba(0,0,0,0.2); display: flex; justify-content: flex-end; gap: 6px; border-top: 1px solid rgba(255,255,255,0.06);">
          <button class="bvss-btn" id="bvss-pop-export" style="font-size:10px;">导出</button>
          <button class="bvss-btn" id="bvss-pop-import" style="font-size:10px;">导入</button>
          <button class="bvss-btn bvss-btn-danger" id="bvss-pop-clear" style="font-size:10px;">清空</button>
        </div>
      `;

      parentContainer.appendChild(popupPanel);

      popupPanel.querySelector('#bvss-pop-close').onclick = () => {
        popupPanel.style.display = 'none';
      };

      popupPanel.querySelector('#bvss-pop-get-start').onclick = () => {
        const v = getActiveVideo();
        if (v) popupPanel.querySelector('#bvss-pop-start').value = formatTime(v.currentTime);
      };

      popupPanel.querySelector('#bvss-pop-get-end').onclick = () => {
        const v = getActiveVideo();
        if (v) popupPanel.querySelector('#bvss-pop-end').value = formatTime(v.currentTime);
      };

      popupPanel.querySelector('#bvss-pop-save').onclick = () => {
        const startVal = popupPanel.querySelector('#bvss-pop-start').value;
        const endVal = popupPanel.querySelector('#bvss-pop-end').value;
        const nameVal = popupPanel.querySelector('#bvss-pop-name').value.trim();

        const startSec = parseTime(startVal);
        const endSec = parseTime(endVal);

        if (endSec <= startSec) {
          alert('结束时间必须大于起始时间！');
          return;
        }

        const segments = loadSegments();
        segments.push({
          id: 'seg_' + Date.now(),
          start: startSec,
          end: endSec,
          name: nameVal || `片段 ${segments.length + 1}`,
          enabled: true,
        });

        saveSegments(segments);
        renderPanel();

        popupPanel.querySelector('#bvss-pop-start').value = '';
        popupPanel.querySelector('#bvss-pop-end').value = '';
        popupPanel.querySelector('#bvss-pop-name').value = '';
      };

      popupPanel.querySelector('#bvss-pop-export').onclick = () => {
        const data = JSON.stringify(loadSegments(), null, 2);
        navigator.clipboard.writeText(data).then(() => alert('已复制到剪贴板！')).catch(() => prompt('配置内容：', data));
      };

      popupPanel.querySelector('#bvss-pop-import').onclick = () => {
        const raw = prompt('请粘贴片段 JSON 数组：');
        if (!raw) return;
        try {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            saveSegments(list);
            renderPanel();
          }
        } catch (e) {
          alert('格式错误，解析失败');
        }
      };

      popupPanel.querySelector('#bvss-pop-clear').onclick = () => {
        if (confirm('确认清空当前视频的所有标记片段吗？')) {
          saveSegments([]);
          renderPanel();
        }
      };
    }

    function togglePopup() {
      if (!popupPanel) return;
      if (popupPanel.style.display === 'flex') {
        popupPanel.style.display = 'none';
      } else {
        popupPanel.style.display = 'flex';
        renderPanel();
      }
    }

    // 挂载到播放器控制栏 (带有核心控件锚点等待逻辑)
    function injectControlBarButton() {
      const ctrlRight = document.querySelector(
        '.bpx-player-control-bottom-right, .bilibili-player-video-control-bottom-right'
      );
      if (!ctrlRight) return;

      // 必须等待播放器核心按钮（清晰度/倍速/设置）之一出现，防止在播放器未初始化的骨架期孤立居中显示
      const anchor = ctrlRight.querySelector('.bpx-player-ctrl-quality') ||
                     ctrlRight.querySelector('.bpx-player-ctrl-playbackrate') ||
                     ctrlRight.querySelector('.bpx-player-ctrl-setting');
      if (!anchor) return;

      let btn = document.getElementById('bvss-control-btn');
      if (!btn) {
        btn = document.createElement('div');
        btn.id = 'bvss-control-btn';
        btn.className = 'bpx-player-ctrl-btn bvss-ctrl-btn';
        btn.setAttribute('role', 'button');
        btn.setAttribute('tabindex', '0');
        btn.setAttribute('aria-label', '视频片段跳过');
        btn.title = '片段标记与跳过 (Evolved)';

        btn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 6.5v11l7-5.5L5 6.5zm7.5 0v11l7-5.5-7-5.5zM20 6.5h2v11h-2v-11z"/>
          </svg>
        `;

        btn.onclick = (e) => {
          e.stopPropagation();
          togglePopup();
        };

        ctrlRight.insertBefore(btn, anchor);

        const playerWrap = document.querySelector('.bpx-player-container, .bilibili-player-area') || ctrlRight;
        createPopupPanel(playerWrap);
      } else if (btn.parentElement !== ctrlRight || btn.nextElementSibling !== anchor) {
        ctrlRight.insertBefore(btn, anchor);
      }
    }

    window.addEventListener('keydown', (e) => {
      const opts = (settings && settings.options) || {};
      if (opts.enableShortcuts === false) return;

      const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || document.activeElement.isContentEditable) return;

      const video = getActiveVideo();
      if (!video) return;

      if (e.key === '[') {
        if (!popupPanel || popupPanel.style.display !== 'flex') togglePopup();
        if (popupPanel) popupPanel.querySelector('#bvss-pop-start').value = formatTime(video.currentTime);
        showToast(`已设起点: ${formatTime(video.currentTime)}`);
      } else if (e.key === ']') {
        if (!popupPanel || popupPanel.style.display !== 'flex') togglePopup();
        if (popupPanel) popupPanel.querySelector('#bvss-pop-end').value = formatTime(video.currentTime);
        showToast(`已设终点: ${formatTime(video.currentTime)}`);
      } else if (e.key === '\\') {
        if (popupPanel) popupPanel.querySelector('#bvss-pop-save').click();
      }
    });

    let currentVideo = null;
    let lastUrl = window.location.href;

    function bindVideo() {
      const v = getActiveVideo();
      if (!v || v === currentVideo) return;
      currentVideo = v;

      v.addEventListener('timeupdate', () => {
        checkAndExecuteSkip(v);
        if (popupPanel && popupPanel.style.display === 'flex') {
          const curTimeEl = popupPanel.querySelector('#bvss-pop-current-time');
          if (curTimeEl) curTimeEl.innerText = formatTime(v.currentTime);
        }
      });

      v.addEventListener('loadedmetadata', updateProgressMarkers);
      v.addEventListener('durationchange', updateProgressMarkers);
      updateProgressMarkers();
    }

    setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        lastSkippedSegmentId = null;
        if (popupPanel && popupPanel.style.display === 'flex') renderPanel();
        updateProgressMarkers();
      }

      injectControlBarButton();
      bindVideo();
    }, 800);

    injectControlBarButton();
    bindVideo();
    console.log('[Bilibili-Evolved] 视频片段标记与自动跳过组件已载入');
  },
};

// 适配 Bilibili-Evolved 沙箱加载规范
if (typeof exports !== 'undefined') {
  exports.default = component;
}
component;
