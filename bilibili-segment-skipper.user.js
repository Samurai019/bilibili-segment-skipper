// ==UserScript==
// @name         Bilibili 视频片段标记与自动跳过助手 (Segment Skipper)
// @namespace    https://github.com/Samurai019/bilibili-segment-skipper
// @version      1.0.0
// @description  为 Bilibili 视频标记指定片段（如片头、片尾、广告赞助等），播放时自动跳过。支持多片段、按视频独立存储、快捷打点、进度条高亮及导入导出。
// @author       Samurai019
// @match        *://www.bilibili.com/video/*
// @match        *://www.bilibili.com/bangumi/play/*
// @match        *://www.bilibili.com/festival/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const STYLES = `
        #bvss-float-btn {
            position: fixed;
            bottom: 85px;
            right: 25px;
            z-index: 999990;
            background: #00aeec;
            color: #fff;
            padding: 8px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
            cursor: pointer;
            user-select: none;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
        }
        #bvss-float-btn:hover {
            background: #009cd6;
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        }

        #bvss-panel {
            position: fixed;
            top: 100px;
            right: 30px;
            width: 360px;
            max-height: 80vh;
            background: #18191c;
            color: #fff;
            border-radius: 10px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 13px;
            display: none;
            flex-direction: column;
            border: 1px solid rgba(255, 255, 255, 0.12);
            overflow: hidden;
            box-sizing: border-box;
        }
        #bvss-panel * { box-sizing: border-box; }

        .bvss-header {
            padding: 12px 16px;
            background: #222327;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            cursor: move;
        }
        .bvss-title {
            font-size: 14px;
            font-weight: 600;
            color: #00aeec;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .bvss-header-btns {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .bvss-icon-btn {
            background: transparent;
            border: none;
            color: #aaa;
            cursor: pointer;
            font-size: 15px;
            line-height: 1;
            padding: 4px;
            border-radius: 4px;
        }
        .bvss-icon-btn:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.1);
        }

        .bvss-toggle-wrap {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #ccc;
            cursor: pointer;
        }
        .bvss-toggle-wrap input[type="checkbox"] {
            cursor: pointer;
            accent-color: #00aeec;
        }

        .bvss-body {
            padding: 14px 16px;
            overflow-y: auto;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .bvss-card {
            background: #232429;
            border-radius: 8px;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .bvss-card-title {
            font-size: 12px;
            font-weight: 600;
            color: #aaa;
            display: flex;
            justify-content: space-between;
        }
        .bvss-time-inputs {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .bvss-input-group {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .bvss-label {
            font-size: 11px;
            color: #888;
        }
        .bvss-input {
            width: 100%;
            background: #121315;
            border: 1px solid #3a3b40;
            color: #fff;
            padding: 6px 8px;
            border-radius: 4px;
            font-size: 12px;
            outline: none;
        }
        .bvss-input:focus { border-color: #00aeec; }

        .bvss-btn-row { display: flex; gap: 6px; }
        .bvss-btn {
            background: #34363d;
            border: none;
            color: #eee;
            padding: 6px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            transition: background 0.15s;
        }
        .bvss-btn:hover {
            background: #444750;
            color: #fff;
        }
        .bvss-btn-primary {
            background: #00aeec;
            color: #fff;
            font-weight: 500;
        }
        .bvss-btn-primary:hover { background: #009cd6; }
        .bvss-btn-danger {
            background: #ff4d4f22;
            color: #ff4d4f;
        }
        .bvss-btn-danger:hover { background: #ff4d4f44; }

        .bvss-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 200px;
            overflow-y: auto;
        }
        .bvss-empty-tip {
            text-align: center;
            color: #666;
            font-size: 12px;
            padding: 16px 0;
        }
        .bvss-item {
            background: #1e1f23;
            border-radius: 6px;
            padding: 8px 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-left: 3px solid #00aeec;
            transition: all 0.2s;
        }
        .bvss-item.disabled {
            border-left-color: #555;
            opacity: 0.5;
        }
        .bvss-item-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
            overflow: hidden;
            margin-right: 8px;
        }
        .bvss-item-title {
            font-weight: 500;
            color: #eee;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .bvss-item-range {
            font-size: 11px;
            color: #00aeec;
            font-family: monospace;
        }
        .bvss-item-actions {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .bvss-footer {
            padding: 10px 16px;
            background: #202125;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #777;
        }

        #bvss-toast {
            position: fixed;
            top: 24px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(24, 25, 28, 0.95);
            color: #fff;
            padding: 10px 18px;
            border-radius: 30px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
            z-index: 1000000;
            font-size: 13px;
            display: none;
            align-items: center;
            gap: 12px;
            border: 1px solid rgba(0, 174, 236, 0.4);
            animation: bvssFadeIn 0.2s ease;
        }
        .bvss-toast-btn {
            color: #00aeec;
            cursor: pointer;
            text-decoration: underline;
            font-weight: 500;
        }
        @keyframes bvssFadeIn {
            from { opacity: 0; transform: translate(-50%, -10px); }
            to { opacity: 1; transform: translate(-50%, 0); }
        }

        .bvss-progress-marker {
            position: absolute;
            top: 0;
            height: 100%;
            background: rgba(251, 114, 153, 0.7);
            border-radius: 1px;
            pointer-events: none;
            z-index: 5;
        }
    `;

    GM_addStyle(STYLES);

    const STORAGE_PREFIX = 'BVSS_DATA_';
    const SETTINGS_KEY = 'BVSS_GLOBAL_SETTINGS';

    let globalSettings = {
        autoSkipEnabled: true,
        showToastNotice: true
    };

    function loadSettings() {
        const saved = GM_getValue(SETTINGS_KEY, null);
        if (saved) {
            try {
                globalSettings = Object.assign(globalSettings, JSON.parse(saved));
            } catch (e) {}
        }
    }

    function saveSettings() {
        GM_setValue(SETTINGS_KEY, JSON.stringify(globalSettings));
    }

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

    function loadSegmentsForCurrentVideo() {
        const key = STORAGE_PREFIX + getCurrentVideoKey();
        const raw = GM_getValue(key, '[]');
        try {
            return JSON.parse(raw);
        } catch (e) {
            return [];
        }
    }

    function saveSegmentsForCurrentVideo(segments) {
        const key = STORAGE_PREFIX + getCurrentVideoKey();
        GM_setValue(key, JSON.stringify(segments));
        updateProgressMarkers();
    }

    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) seconds = 0;
        const total = Math.floor(seconds);
        const m = Math.floor(total / 60);
        const s = total % 60;
        const ms = Math.floor((seconds % 1) * 10);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
    }

    function parseTime(str) {
        if (typeof str === 'number') return str;
        if (!str) return 0;
        str = str.trim();
        const parts = str.split(':');
        if (parts.length === 1) {
            return parseFloat(parts[0]) || 0;
        } else if (parts.length === 2) {
            return (parseFloat(parts[0]) || 0) * 60 + (parseFloat(parts[1]) || 0);
        } else if (parts.length === 3) {
            return (parseFloat(parts[0]) || 0) * 3600 + (parseFloat(parts[1]) || 0) * 60 + (parseFloat(parts[2]) || 0);
        }
        return 0;
    }

    function getActiveVideo() {
        const videos = Array.from(document.querySelectorAll('video'));
        if (videos.length === 0) return null;
        if (videos.length === 1) return videos[0];

        const playing = videos.find(v => !v.paused && v.duration > 0);
        if (playing) return playing;

        return videos.find(v => v.duration > 0) || videos[0];
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
        undoBtn.className = 'bvss-toast-btn';
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
        if (!globalSettings.autoSkipEnabled || isTemporarilyDisabled) return;
        if (!video || video.paused || video.seeking) return;

        const currentTime = video.currentTime;
        const segments = loadSegmentsForCurrentVideo();

        for (const seg of segments) {
            if (!seg.enabled) continue;

            if (currentTime >= seg.start && currentTime < (seg.end - 0.2)) {
                if (lastSkippedSegmentId === seg.id && Math.abs(currentTime - seg.end) < 0.8) {
                    continue;
                }

                const prevTime = currentTime;
                video.currentTime = seg.end;
                lastSkippedSegmentId = seg.id;

                if (globalSettings.showToastNotice) {
                    const desc = seg.name ? `「${seg.name}」` : '';
                    showToast(`已自动跳过片段 ${desc} (${formatTime(seg.start)} - ${formatTime(seg.end)})`, () => {
                        video.currentTime = prevTime;
                        isTemporarilyDisabled = true;
                        if (tempDisableTimeout) clearTimeout(tempDisableTimeout);
                        tempDisableTimeout = setTimeout(() => {
                            isTemporarilyDisabled = false;
                        }, 12000);
                        showToast('已撤销跳过，已临时暂停自动跳过12秒');
                    });
                }
                break;
            }
        }
    }

    function updateProgressMarkers() {
        document.querySelectorAll('.bvss-progress-marker').forEach(el => el.remove());

        const video = getActiveVideo();
        if (!video || !video.duration || isNaN(video.duration)) return;

        const progressTrack = document.querySelector('.bpx-player-progress-schedule, .bilibili-player-video-progress-bar, .bpx-player-progress-slider');
        if (!progressTrack) return;

        const duration = video.duration;
        const segments = loadSegmentsForCurrentVideo();

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

    let panelElement = null;
    let floatBtnElement = null;

    function createUI() {
        if (document.getElementById('bvss-float-btn')) return;

        floatBtnElement = document.createElement('div');
        floatBtnElement.id = 'bvss-float-btn';
        floatBtnElement.innerHTML = `<span>⏭️</span> <span>片段跳过</span>`;
        floatBtnElement.onclick = togglePanel;
        document.body.appendChild(floatBtnElement);

        panelElement = document.createElement('div');
        panelElement.id = 'bvss-panel';
        panelElement.innerHTML = `
            <div class="bvss-header" id="bvss-header-drag">
                <div class="bvss-title">
                    <span>✂️ 片段标记与跳过</span>
                </div>
                <div class="bvss-header-btns">
                    <label class="bvss-toggle-wrap" title="启用/禁用自动跳过">
                        <input type="checkbox" id="bvss-toggle-auto" ${globalSettings.autoSkipEnabled ? 'checked' : ''}>
                        <span>自动跳过</span>
                    </label>
                    <button class="bvss-icon-btn" id="bvss-btn-close" title="关闭">✕</button>
                </div>
            </div>

            <div class="bvss-body">
                <div class="bvss-card">
                    <div class="bvss-card-title">
                        <span>添加新片段</span>
                        <span id="bvss-current-time-display" style="color: #00aeec; font-family: monospace;">当前: 00:00.0</span>
                    </div>

                    <div class="bvss-time-inputs">
                        <div class="bvss-input-group">
                            <span class="bvss-label">起始时间 [</span>
                            <input class="bvss-input" id="bvss-input-start" placeholder="00:00.0">
                        </div>
                        <div class="bvss-input-group">
                            <span class="bvss-label">结束时间 ]</span>
                            <input class="bvss-input" id="bvss-input-end" placeholder="00:00.0">
                        </div>
                    </div>

                    <div class="bvss-btn-row">
                        <button class="bvss-btn" id="bvss-btn-set-start" style="flex:1;">📍 捕获当前为起点</button>
                        <button class="bvss-btn" id="bvss-btn-set-end" style="flex:1;">🏁 捕获当前为终点</button>
                    </div>

                    <div class="bvss-input-group">
                        <span class="bvss-label">片段备注 / 标签</span>
                        <input class="bvss-input" id="bvss-input-name" placeholder="例如：片头、广告赞助、片尾 (可选)">
                    </div>

                    <button class="bvss-btn bvss-btn-primary" id="bvss-btn-add-segment">➕ 保存该片段 (快捷键 \\)</button>
                </div>

                <div class="bvss-card">
                    <div class="bvss-card-title">
                        <span>当前视频已标记片段</span>
                        <span id="bvss-count-badge" style="color: #aaa;">0 个</span>
                    </div>
                    <div class="bvss-list" id="bvss-segment-list"></div>
                </div>
            </div>

            <div class="bvss-footer">
                <span id="bvss-vid-key-label" title="当前视频区分键">Key: --</span>
                <div style="display: flex; gap: 8px;">
                    <button class="bvss-btn" id="bvss-btn-export" style="padding: 3px 8px; font-size: 11px;">导出</button>
                    <button class="bvss-btn" id="bvss-btn-import" style="padding: 3px 8px; font-size: 11px;">导入</button>
                    <button class="bvss-btn bvss-btn-danger" id="bvss-btn-clear" style="padding: 3px 8px; font-size: 11px;">清空</button>
                </div>
            </div>
        `;
        document.body.appendChild(panelElement);

        bindEvents();
        enableDrag(document.getElementById('bvss-header-drag'), panelElement);
    }

    function togglePanel() {
        if (!panelElement) createUI();
        if (panelElement.style.display === 'flex') {
            panelElement.style.display = 'none';
        } else {
            panelElement.style.display = 'flex';
            refreshPanelData();
        }
    }

    function refreshPanelData() {
        if (!panelElement) return;

        const key = getCurrentVideoKey();
        const vidLabel = document.getElementById('bvss-vid-key-label');
        if (vidLabel) vidLabel.innerText = `Key: ${key.length > 18 ? key.slice(0, 16) + '..' : key}`;

        const segments = loadSegmentsForCurrentVideo();
        const listContainer = document.getElementById('bvss-segment-list');
        const countBadge = document.getElementById('bvss-count-badge');

        if (countBadge) countBadge.innerText = `${segments.length} 个`;
        if (!listContainer) return;
        listContainer.innerHTML = '';

        if (segments.length === 0) {
            listContainer.innerHTML = '<div class="bvss-empty-tip">暂无标记片段，可在上方设置添加~</div>';
            return;
        }

        segments.sort((a, b) => a.start - b.start);

        segments.forEach((seg, idx) => {
            const item = document.createElement('div');
            item.className = `bvss-item ${seg.enabled ? '' : 'disabled'}`;
            item.innerHTML = `
                <div class="bvss-item-info">
                    <div class="bvss-item-title">${seg.name || '未命名片段 ' + (idx + 1)}</div>
                    <div class="bvss-item-range">${formatTime(seg.start)} ➔ ${formatTime(seg.end)} <span style="color:#777;">(${Math.max(0, Math.round(seg.end - seg.start))}s)</span></div>
                </div>
                <div class="bvss-item-actions">
                    <button class="bvss-btn" title="预览起点" data-act="play-start" data-id="${seg.id}" style="padding:3px 6px;">▶</button>
                    <button class="bvss-btn" title="跳转终点" data-act="play-end" data-id="${seg.id}" style="padding:3px 6px;">⏭</button>
                    <button class="bvss-btn" title="${seg.enabled ? '点击禁用' : '点击启用'}" data-act="toggle" data-id="${seg.id}" style="padding:3px 6px;">${seg.enabled ? '✓' : '✗'}</button>
                    <button class="bvss-btn bvss-btn-danger" title="删除" data-act="delete" data-id="${seg.id}" style="padding:3px 6px;">🗑</button>
                </div>
            `;
            listContainer.appendChild(item);
        });

        listContainer.onclick = (e) => {
            const btn = e.target.closest('button[data-act]');
            if (!btn) return;
            const action = btn.getAttribute('data-act');
            const id = btn.getAttribute('data-id');
            const seg = segments.find(s => s.id === id);
            const video = getActiveVideo();

            if (action === 'play-start' && seg && video) {
                video.currentTime = seg.start;
                video.play();
            } else if (action === 'play-end' && seg && video) {
                video.currentTime = seg.end;
            } else if (action === 'toggle' && seg) {
                seg.enabled = !seg.enabled;
                saveSegmentsForCurrentVideo(segments);
                refreshPanelData();
            } else if (action === 'delete') {
                const filtered = segments.filter(s => s.id !== id);
                saveSegmentsForCurrentVideo(filtered);
                refreshPanelData();
            }
        };
    }

    function bindEvents() {
        document.getElementById('bvss-btn-close').onclick = () => {
            panelElement.style.display = 'none';
        };

        const autoToggle = document.getElementById('bvss-toggle-auto');
        autoToggle.onchange = () => {
            globalSettings.autoSkipEnabled = autoToggle.checked;
            saveSettings();
            showToast(`自动跳过已 ${autoToggle.checked ? '开启' : '关闭'}`);
        };

        document.getElementById('bvss-btn-set-start').onclick = () => {
            const video = getActiveVideo();
            if (video) {
                document.getElementById('bvss-input-start').value = formatTime(video.currentTime);
            }
        };

        document.getElementById('bvss-btn-set-end').onclick = () => {
            const video = getActiveVideo();
            if (video) {
                document.getElementById('bvss-input-end').value = formatTime(video.currentTime);
            }
        };

        document.getElementById('bvss-btn-add-segment').onclick = addNewSegmentFromInput;

        document.getElementById('bvss-btn-export').onclick = () => {
            const segments = loadSegmentsForCurrentVideo();
            const dataStr = JSON.stringify(segments, null, 2);
            navigator.clipboard.writeText(dataStr).then(() => {
                alert('当前视频片段数据已成功复制到剪贴板！');
            }).catch(() => {
                prompt('请手动复制以下 JSON 配置：', dataStr);
            });
        };

        document.getElementById('bvss-btn-import').onclick = () => {
            const input = prompt('请粘贴片段 JSON 数组数据：');
            if (!input) return;
            try {
                const parsed = JSON.parse(input);
                if (Array.isArray(parsed)) {
                    saveSegmentsForCurrentVideo(parsed);
                    refreshPanelData();
                    alert(`导入成功！共加载 ${parsed.length} 个片段。`);
                } else {
                    alert('数据格式不合法，必须为数组格式！');
                }
            } catch (e) {
                alert('JSON 解析失败，请确认格式无误。');
            }
        };

        document.getElementById('bvss-btn-clear').onclick = () => {
            if (confirm('确定要清空当前视频的所有已标记片段吗？')) {
                saveSegmentsForCurrentVideo([]);
                refreshPanelData();
            }
        };
    }

    function addNewSegmentFromInput() {
        const startVal = document.getElementById('bvss-input-start').value;
        const endVal = document.getElementById('bvss-input-end').value;
        const nameVal = document.getElementById('bvss-input-name').value.trim();

        const startSec = parseTime(startVal);
        const endSec = parseTime(endVal);

        if (endSec <= startSec) {
            alert('结束时间必须大于起始时间！');
            return;
        }

        const segments = loadSegmentsForCurrentVideo();
        const newSeg = {
            id: 'seg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            start: startSec,
            end: endSec,
            name: nameVal || `片段 ${segments.length + 1}`,
            enabled: true
        };

        segments.push(newSeg);
        saveSegmentsForCurrentVideo(segments);
        refreshPanelData();

        document.getElementById('bvss-input-start').value = '';
        document.getElementById('bvss-input-end').value = '';
        document.getElementById('bvss-input-name').value = '';
    }

    function enableDrag(handle, target) {
        let isDragging = false;
        let startX, startY, origLeft, origTop;

        handle.addEventListener('mousedown', (e) => {
            if (e.target.closest('button') || e.target.closest('input')) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = target.getBoundingClientRect();
            origLeft = rect.left;
            origTop = rect.top;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            e.preventDefault();
        });

        function onMouseMove(e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            target.style.left = `${Math.max(10, origLeft + dx)}px`;
            target.style.top = `${Math.max(10, origTop + dy)}px`;
            target.style.right = 'auto';
        }

        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }

    window.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement.isContentEditable) {
            return;
        }

        const video = getActiveVideo();
        if (!video) return;

        if (e.key === '[') {
            if (!panelElement || panelElement.style.display !== 'flex') togglePanel();
            document.getElementById('bvss-input-start').value = formatTime(video.currentTime);
            showToast(`已捕获起点: ${formatTime(video.currentTime)}`);
        } else if (e.key === ']') {
            if (!panelElement || panelElement.style.display !== 'flex') togglePanel();
            document.getElementById('bvss-input-end').value = formatTime(video.currentTime);
            showToast(`已捕获终点: ${formatTime(video.currentTime)}`);
        } else if (e.key === '\\') {
            addNewSegmentFromInput();
        }
    });

    let currentBoundVideo = null;
    let lastUrl = window.location.href;

    function attachVideoListeners() {
        const video = getActiveVideo();
        if (!video || video === currentBoundVideo) return;

        currentBoundVideo = video;

        video.addEventListener('timeupdate', () => {
            checkAndExecuteSkip(video);

            if (panelElement && panelElement.style.display === 'flex') {
                const timeDisp = document.getElementById('bvss-current-time-display');
                if (timeDisp) timeDisp.innerText = `当前: ${formatTime(video.currentTime)}`;
            }
        });

        video.addEventListener('loadedmetadata', () => {
            updateProgressMarkers();
        });

        video.addEventListener('durationchange', () => {
            updateProgressMarkers();
        });

        updateProgressMarkers();
    }

    setInterval(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            lastSkippedSegmentId = null;
            if (panelElement && panelElement.style.display === 'flex') {
                refreshPanelData();
            }
            updateProgressMarkers();
        }

        attachVideoListeners();
    }, 800);

    loadSettings();
    createUI();

    if (typeof GM_registerMenuCommand !== 'undefined') {
        GM_registerMenuCommand('打开/关闭片段标记面板', togglePanel);
        GM_registerMenuCommand('清空当前视频标记数据', () => {
            saveSegmentsForCurrentVideo([]);
            if (panelElement && panelElement.style.display === 'flex') refreshPanelData();
            alert('已清空当前视频标记数据');
        });
    }
})();
