//# 崽子成长可视化工具库 v8.3 (Fix: Smart Stages & Clean UI)

// ==========================================
//   0. [配置区] 样式微调
// ==========================================
const STYLE_CONFIG = {
    colorBg: "#FFFFFF",
    colorTextMain: "#1F2937",
    colorTextSub: "#6B7280",
    colorAccent: "#512E5F",
    barWeight: "#F97316",
    barGain: "#8B5CF6",
    barRate: "#14B8A6",
    imgMarginTop: "-4px",
    imgMarginBottom: "-12px",
    lineLeft: "12px", dotLeft: "-29px", cardGap: "35px"
};

(function initSystem() {
    const styleId = "puppy-viz-v8-3";
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
        /* --- 基础样式 --- */
        .puppy-source { display: none !important; }
        .puppy-banner-header {
            position: relative; margin: 10px 0 0 0 !important; padding: 20px 24px;
            border-radius: 16px 16px 0 0; background: linear-gradient(135deg, #512E5F 0%, #8E44AD 50%, #FF9A9E 100%);
            color: white; display: flex; align-items: center; gap: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; z-index: 2;
        }
        .puppy-banner-deco-1 { position: absolute; top: -40px; right: -30px; width: 140px; height: 140px; background: rgba(255,255,255,0.12); border-radius: 50%; pointer-events: none; z-index: 0; }
        .puppy-banner-deco-2 { position: absolute; bottom: -50px; left: 20px; width: 100px; height: 100px; background: rgba(255,255,255,0.06); border-radius: 50%; pointer-events: none; z-index: 0; }
        
        /* 等级与年龄显示 */
        .puppy-lv-wrapper { display: flex; align-items: baseline; gap: 2px; text-shadow: 0 2px 4px rgba(0,0,0,0.15); line-height: 1; }
        .puppy-lv-label { font-size: 14px; font-weight: 700; font-style: italic; opacity: 0.9; }
        .puppy-lv-num { font-size: 36px; line-height: 1; font-family: 'Impact', 'Arial Black', sans-serif; font-weight: 900; font-style: italic; letter-spacing: 1px; transform: skewX(-5deg); }
        
        /* 状态胶囊 (替代原StatusBadge) */
        .puppy-stage-badge {
            background: rgba(255,255,255,0.25); padding: 3px 10px; border-radius: 12px; 
            font-size: 11px; font-weight: bold; backdrop-filter: blur(4px); margin-top: 6px; 
            border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            text-align: right; min-width: 60px; display: flex; justify-content: center;
        }

        .puppy-stats-panel {
            background: #fff; border-radius: 0 0 16px 16px; padding: 20px 24px 20px 24px; margin-bottom: 25px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(0,0,0,0.05); border-top: none; position: relative; z-index: 1;
        }
        .psp-grid-top { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; padding-bottom: 12px; margin-bottom: 0px; border-bottom: 1px dashed #F3F4F6; }
        .psp-stat-item { display: flex; flex-direction: column; position: relative; padding: 0 16px; }
        .psp-stat-item:first-child { padding-left: 0; padding-right: 16px; }
        .psp-stat-item:last-child { padding-right: 0; padding-left: 16px; }
        .psp-stat-item:not(:last-child)::after { content: ''; position: absolute; right: 0; top: 15%; height: 70%; width: 1px; background-color: #E5E7EB; }
        .psp-label { font-size: 13px; color: ${STYLE_CONFIG.colorTextSub}; margin-bottom: 4px; font-weight: 500; }
        .psp-value-box { display: flex; align-items: baseline; }
        .psp-value { font-size: 24px; font-weight: 800; color: ${STYLE_CONFIG.colorTextMain}; line-height: 1; font-family: 'JetBrains Mono', Consolas, monospace; }
        .psp-unit { font-size: 12px; font-weight: normal; color: #9CA3AF; margin-left: 2px; }
        .psp-rank-wrapper { margin-top: 8px; width: 100%; min-height: 15px; } /* 增加最小高度防止空的时候塌陷 */
        .psp-rank-track { width: 100%; height: 6px; background-color: #F3F4F6; border-radius: 3px; overflow: hidden; margin-bottom: 4px; }
        .psp-rank-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease-out; }
        .psp-rank-text { font-size: 10px; color: #9CA3AF; font-weight: 500; }
        .psp-row-bottom { width: 100%; margin-top: 12px; }
        .psp-text-content {
            font-size: 14px; line-height: 1.6; color: #4B5563; background: rgba(81, 46, 95, 0.04); 
            border-radius: 12px; padding: 12px 18px; position: relative; overflow: hidden; 
            display: flex; flex-direction: column; gap: 4px;
        }
        .psp-inner-title { font-size: 11px; font-weight: 700; color: #9CA3AF; letter-spacing: 0.5px; text-transform: uppercase; position: relative; z-index: 1; text-align: right; margin-bottom: 2px; }
        /* 修复：缩小引号尺寸 */
        .psp-text-content::before {
            content: ''; position: absolute; top: 12px; left: 14px; width: 20px; height: 20px;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='rgba(81, 46, 95, 0.15)' d='M464 256h-80v-64c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8c-88.4 0-160 71.6-160 160v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48zm-288 0H96v-64c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8C71.6 32 0 103.6 0 192v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48z'/%3E%3C/svg%3E");
            background-repeat: no-repeat; background-size: contain; pointer-events: none; z-index: 0; opacity: 0.8;
        }
        .psp-text-inner { position: relative; z-index: 1; }
        .pt-container { position: relative; padding: 10px 0 10px 35px; display: flex; flex-direction: column; }
        .pt-container::before { content: ''; position: absolute; top: 15px; bottom: 50px; left: ${STYLE_CONFIG.lineLeft}; width: 2px; background-color: #E2E8F0; z-index: 0; }
        .pt-item { position: relative; margin-bottom: ${STYLE_CONFIG.cardGap}; flex-shrink: 0; }
        .pt-dot { position: absolute; left: ${STYLE_CONFIG.dotLeft}; top: 5px; width: 14px; height: 14px; background: #fff; border: 3px solid #512E5F; border-radius: 50%; z-index: 1; box-shadow: 0 0 0 4px #fff; }
        .pt-meta-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .pt-date { font-family: monospace; font-weight: 700; font-size: 16px; color: #1A202C; }
        .pt-age-pill { background: #512E5F; color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 700; transform: translateY(-1px); }
        .pt-suffix { font-size: 13px; color: #718096; font-style: italic; }
        .pt-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08); border: 1px solid #E2E8F0; overflow: hidden; display: flex; flex-direction: column; transform: translateY(-8px); }
        .pt-remark-section { padding: 16px 16px 0 16px; background: #fff; font-size: 15px; color: #2D3748; line-height: 1.6; margin-bottom: 0 !important; }
        .pt-remark-section p { margin: 0 0 6px 0 !important; }
        .pt-media-section { padding: 0 16px 16px 16px; background: #fff; }
        .pt-media-section img { 
            display: block; width: 100%; object-fit: cover; border-radius: 8px; border: 1px solid rgba(0,0,0,0.03);
            margin-top: ${STYLE_CONFIG.imgMarginTop} !important; margin-bottom: ${STYLE_CONFIG.imgMarginBottom} !important;
        }
        .pt-media-section figcaption, .pt-media-section .caption, .pt-media-section .image-embed::after { display: none !important; }
    `;
    document.head.appendChild(style);
})();

(async function loadChartJs() {
    if (!window.Chart) { await import("https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.min.js"); }
})();

window.PuppyVizKit = {
    theme: {
        primary: "#512E5F", green: "#10b981", yellow: "#f59e0b", red: "#f43f5e", blue: "#3b82f6", grey: "#9ca3af",
        headerBg: "#D6CADD", headerText: "#512E5F",
        chartColors: ["#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de", "#3ba272", "#fc8452", "#9a60b4"]
    },
    
    logic: {
        // --- 核心修复：更科学的犬类成长阶段 ---
        getLifeStage(daysOld) {
            if (daysOld <= 20) return "🍼 哺乳期";
            if (daysOld <= 90) return "🥛 离乳期";
            if (daysOld <= 180) return "🦴 幼年期";
            if (daysOld <= 365) return "⚡ 少年期";
            return "🛡️ 成犬期";
        },

        getDaysOld(birthDateStr, eventDateStr = null) {
            if (!birthDateStr) return 0;
            const birth = new Date(birthDateStr);
            const target = eventDateStr ? new Date(eventDateStr) : new Date();
            birth.setHours(0,0,0,0); target.setHours(0,0,0,0);
            return Math.floor((target - birth) / (1000 * 60 * 60 * 24));
        },

        async parseLog(app, fileOrPath) {
            let file = null;
            if (typeof fileOrPath === 'string') { file = app.vault.getAbstractFileByPath(fileOrPath); } 
            else if (fileOrPath && fileOrPath.path) { file = app.vault.getAbstractFileByPath(fileOrPath.path); }
            else if (fileOrPath && fileOrPath.stat) { file = fileOrPath; }

            if (!file) return [];
            
            const content = await app.vault.read(file);
            const events = [];
            const commentRegex = /%%([\s\S]*?)%%/g;
            let combinedText = "";
            let cMatch;
            while ((cMatch = commentRegex.exec(content)) !== null) { combinedText += "\n" + cMatch[1]; }
            
            const blockRegex = /#+\s+(\d{4}-\d{2}-\d{2})(.*)\n([\s\S]*?)(?=(#+\s+\d{4}-\d{2}-\d{2})|$)/g;
            let bMatch;
            while ((bMatch = blockRegex.exec(combinedText)) !== null) {
                const date = bMatch[1];
                const suffix = bMatch[2].trim();
                let rawBody = bMatch[3].trim();
                let weight = null;
                const weightMatch = rawBody.match(/\[weight::\s*(\d+(?:\.\d+)?)\]/i);
                if (weightMatch) {
                    weight = parseFloat(weightMatch[1]);
                    rawBody = rawBody.replace(/\[weight::\s*(\d+(?:\.\d+)?)\]/gi, "").trim();
                }
                const hasContent = rawBody.length > 0;
                const hasImage = /!\[.*\]\(.*\)|!\[\[.*\]\]/.test(rawBody);
                events.push({
                    date: date, suffix: suffix, weight: weight, content: rawBody,
                    hasContent: hasContent, hasImage: hasImage,
                    isWeightOnly: (weight !== null) && !hasContent
                });
            }
            return events;
        },

        async calculateRankings(dv, currentFilePath, isAdult = false) {
            const currentFile = app.vault.getAbstractFileByPath(currentFilePath);
            const parentPath = currentFile.parent.path;
            const pages = dv.pages(`"${parentPath}"`).where(p => !p.file.name.includes("面板"));

            let rankingPool = [];

            // --- 核心修复：排名池过滤逻辑 ---
            for (let p of pages) {
                const bDate = p.birth || p.birthday;
                if (!bDate) continue;
                
                const daysOld = this.getDaysOld(bDate);
                // 仅将 300 天以下的崽子加入排名池
                if (daysOld < 300) {
                    const events = await this.parseLog(app, p.file);
                    const weights = events.filter(e => e.weight !== null).map(e => ({ w: e.weight, d: e.date }));
                    weights.sort((a, b) => b.d.localeCompare(a.d));
                    
                    if (weights.length > 0) {
                        const cur = weights[0].w;
                        let gain = 0, rate = 0;
                        if (weights.length > 1) {
                            const prev = weights[1].w;
                            gain = cur - prev;
                            rate = (gain / prev) * 100;
                        }
                        rankingPool.push({
                            name: p.file.name, path: p.file.path,
                            weight: cur, gain: gain, rate: rate
                        });
                    }
                }
            }

            // 获取当前文件的数据（即便是成年狗，也要读取自己的数据，只是不和rankingPool比）
            let myData = null;
            if (isAdult) {
                // 如果是成年模式，单独读取自己，不在 rankingPool 里找
                const events = await this.parseLog(app, currentFile);
                const weights = events.filter(e => e.weight !== null).map(e => ({ w: e.weight, d: e.date }));
                weights.sort((a, b) => b.d.localeCompare(a.d));
                if (weights.length > 0) {
                    const cur = weights[0].w;
                    let gain = 0, rate = 0;
                    if (weights.length > 1) { const prev = weights[1].w; gain = cur - prev; rate = (gain / prev) * 100; }
                    myData = { weight: cur, gain: gain, rate: rate };
                }
            } else {
                // 幼崽模式，在池子里找自己
                myData = rankingPool.find(x => x.path === currentFilePath);
            }
            
            if (!myData) return null;

            // --- 核心：成年/守护者模式 ---
            if (isAdult) {
                const fullBar = { text: "", rank: 1, total: 1 }; // text留白，不显示“监测中”
                return {
                    data: myData,
                    rankWeight: fullBar, rankGain: fullBar, rankRate: fullBar,
                    isAdultMode: true
                };
            }

            const getRank = (arr, key, myPath, isDesc = true) => {
                const sorted = [...arr].sort((a, b) => isDesc ? (b[key] - a[key]) : (a[key] - b[key]));
                const idx = sorted.findIndex(x => x.path === myPath);
                if (idx === -1) return { text: "-", rank: 0, total: 0 };
                // 此时 pool.length 已经是剔除了成年狗后的数量
                return { text: `第 ${idx + 1}/${arr.length}`, rank: idx + 1, total: arr.length };
            };

            return {
                data: myData,
                rankWeight: getRank(rankingPool, 'weight', currentFilePath, true),
                rankGain: getRank(rankingPool, 'gain', currentFilePath, true),
                rankRate: getRank(rankingPool, 'rate', currentFilePath, true)
            };
        }
    },
    
    renderTimelineFromText: async function(dv, container, birthDateStr, sectionHeader, obsModule) {
        const currentFile = app.workspace.getActiveFile();
        if(!currentFile) return;
        const events = await this.logic.parseLog(app, currentFile);
        const visibleEvents = events.filter(e => !e.isWeightOnly);
        if (sectionHeader && visibleEvents.length > 0) { container.createEl("h2", { text: sectionHeader.replace(/^#+\s*/, '') }); }
        const wrap = container.createEl("div"); wrap.className = "pt-container";
        const Component = obsModule ? obsModule.Component : null;
        const MarkdownRenderer = obsModule ? obsModule.MarkdownRenderer : null;
        visibleEvents.forEach(evt => {
            const daysOld = this.logic.getDaysOld(birthDateStr, evt.date);
            const item = wrap.createEl("div"); item.className = "pt-item";
            item.createEl("div", { cls: "pt-dot" });
            const metaRow = item.createEl("div", { cls: "pt-meta-row" });
            metaRow.createEl("span", { cls: "pt-date", text: evt.date });
            metaRow.createEl("span", { cls: "pt-age-pill", text: daysOld === 0 ? "BIRTH" : `Day ${daysOld}` });
            if(evt.suffix) metaRow.createEl("span", { cls: "pt-suffix", text: evt.suffix });
            const card = item.createEl("div", { cls: "pt-card" });
            let remark = ""; let media = "";
            const imgIndex = evt.content.search(/!\[.*\]\(.*\)|!\[\[.*\]\]/);
            if (imgIndex !== -1) { remark = evt.content.substring(0, imgIndex).trim(); media = evt.content.substring(imgIndex).trim(); } else { remark = evt.content; }
            if (remark && MarkdownRenderer) {
                const remarkBox = card.createEl("div"); remarkBox.className = "pt-remark-section"; 
                const rComp = new Component(); MarkdownRenderer.render(app, remark, remarkBox, currentFile.path, rComp); rComp.load();
            }
            if (media && MarkdownRenderer) {
                const mediaBox = card.createEl("div"); mediaBox.className = "pt-media-section";
                if (!remark) { mediaBox.style.paddingTop = "16px"; }
                const mComp = new Component(); MarkdownRenderer.render(app, media, mediaBox, currentFile.path, mComp); mComp.load(); 
            }
        });
    },

    renderHeader: async function(dv, container, options = {}) {
        const page = dv.current();
        const currentFile = app.workspace.getActiveFile();
        const name = page.name || page.file.name;
        const alias = (page.aliases && page.aliases.length > 0) ? page.aliases[0].toUpperCase() : "PUPPY";
        const birthDate = page.birth || page.birthday ? new Date(page.birth || page.birthday) : new Date();
        const today = new Date(); birthDate.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0);
        const diffTime = Math.max(0, today - birthDate); 
        const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const isAdult = options.isAdult || false;

        // --- 逻辑升级：面板右上角显示 ---
        let levelLabel = "Lv.";
        let levelNum = totalDays;
        let badgeText = "";
        
        if (isAdult || totalDays >= 365) {
            // 成年模式：只显示年龄大字，胶囊显示具体年月
            levelLabel = "Age";
            levelNum = Math.floor(totalDays / 365);
            const months = Math.floor((totalDays % 365) / 30);
            badgeText = `${levelNum}岁${months}个月`; // 具体的岁数移到 Badge
        } else {
            // 幼年模式：显示Day，胶囊显示生理阶段
            badgeText = this.logic.getLifeStage(totalDays);
        }

        const rankData = await this.logic.calculateRankings(dv, currentFile.path, isAdult);
        
        const events = await this.logic.parseLog(app, currentFile);
        let latestText = "暂无动态";
        const latestEvent = events.find(e => e.content && e.content.replace(/!\[.*\]\(.*\)|!\[\[.*\]\]/g, "").trim().length > 0);
        if (latestEvent) { latestText = latestEvent.content.replace(/!\[.*\]\(.*\)|!\[\[.*\]\]/g, "").trim(); } 
        else if (events.length > 0 && events[0].hasImage) { latestText = "（最新动态为图片分享）"; }

        const banner = container.createEl("div"); banner.className = "puppy-banner-header";
        
        banner.createEl("div", { cls: "puppy-banner-deco-1" });
        banner.createEl("div", { cls: "puppy-banner-deco-2" });

        const iconBox = banner.createEl("div"); iconBox.style.cssText = `width: 56px; height: 56px; background: rgba(255,255,255,0.95); border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 3px solid rgba(255,255,255,0.3); z-index: 1; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0;`;
        const iconImg = iconBox.createEl("img"); iconImg.src = app.vault.adapter.getResourcePath("99-附件/DogIcon/DogIcon.webp"); iconImg.style.cssText = `width: 100%; height: 100%; object-fit: cover;`;
        
        const infoBox = banner.createEl("div"); infoBox.style.cssText = `flex: 1; display: flex; flex-direction: column; z-index: 1;`;
        const nameEl = infoBox.createEl("div", { text: name }); nameEl.style.cssText = `font-size: 28px; font-weight: 900; line-height: 1.1; text-shadow: 0 2px 4px rgba(0,0,0,0.15);`;
        const aliasEl = infoBox.createEl("div", { text: alias }); aliasEl.style.cssText = `font-size: 12px; opacity: 0.9; font-weight: 600; letter-spacing: 1px; margin-top: 4px; font-family: monospace;`;

        const badgeBox = banner.createEl("div"); badgeBox.style.cssText = `display: flex; flex-direction: column; align-items: flex-end; justify-content: center; z-index: 1;`;
        
        // 显示 Lv./Age 大字
        const lvlWrapper = badgeBox.createEl("div", { cls: "puppy-lv-wrapper" });
        lvlWrapper.createEl("span", { text: levelLabel, cls: "puppy-lv-label" });
        lvlWrapper.createEl("span", { text: levelNum, cls: "puppy-lv-num" });
        
        // 显示 胶囊 (生理阶段 或 具体岁数)
        badgeBox.createEl("div", { text: badgeText, cls: "puppy-stage-badge" });

        const statsPanel = container.createEl("div"); statsPanel.className = "puppy-stats-panel";
        if (!rankData) { statsPanel.createEl("div", { text: "暂无体重数据，请先录入。", style: "color:#ccc;text-align:center;" }); return; }

        const grid = statsPanel.createEl("div"); grid.className = "psp-grid-top";
        
        const createStat = (label, value, unit, rankObj, barColor) => {
            const item = grid.createEl("div", { cls: "psp-stat-item" }); 
            item.createEl("div", { text: label, cls: "psp-label" });
            const valBox = item.createEl("div", { cls: "psp-value-box" }); 
            valBox.createEl("span", { text: value, cls: "psp-value" }); 
            valBox.createEl("span", { text: unit, cls: "psp-unit" });
            const rankWrapper = item.createEl("div", { cls: "psp-rank-wrapper" });
            const track = rankWrapper.createEl("div", { cls: "psp-rank-track" });
            
            let widthPct = 0; 
            if (rankData.isAdultMode) {
                widthPct = 100; // 成年模式：装饰性满条
            } else if (rankObj.total > 0) { 
                widthPct = ((rankObj.total - rankObj.rank + 1) / rankObj.total) * 100; 
            }
            
            const fill = track.createEl("div", { cls: "psp-rank-fill" });
            fill.style.width = `${widthPct}%`; fill.style.backgroundColor = barColor;
            rankWrapper.createEl("div", { text: rankObj.text, cls: "psp-rank-text" });
        };
        
        const d = rankData.data; 
        const gainStr = d.gain > 0 ? `+${d.gain}` : `${d.gain}`; 
        const rateStr = d.rate > 0 ? `+${d.rate.toFixed(1)}` : `${d.rate.toFixed(1)}`;
        
        createStat("体重", d.weight, "g", rankData.rankWeight, STYLE_CONFIG.barWeight);
        createStat("最新增重", gainStr, "g", rankData.rankGain, STYLE_CONFIG.barGain);
        createStat("最新增幅", rateStr, "%", rankData.rankRate, STYLE_CONFIG.barRate);

        const bottomRow = statsPanel.createEl("div", { cls: "psp-row-bottom" });
        
        const textBox = bottomRow.createEl("div", { cls: "psp-text-content" }); 
        textBox.createEl("div", { text: "最新动态", cls: "psp-inner-title" });
        const textInner = textBox.createEl("div", { cls: "psp-text-inner" });
        textInner.textContent = latestText;
    }
};