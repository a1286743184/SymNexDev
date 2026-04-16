//# 崽子档案专用库 (PuppyProfileKit) v3.2 (Spacing Fix + Layout Align)
// 1:1 复刻原版视觉效果，修复与看板库的 CSS 类名冲突问题 (增加 pp- 前缀)
// v3.2 更新：调整默认卡片间距，优化竖向空间利用率
// 2025-12-23 修复：将阶段指南弹窗改为与卡片左侧对齐，防止右侧溢出

// ================= 0. 样式配置 (可调整区域) =================
const STYLE_CONFIG = {
    colorBg: "#FFFFFF",
    colorTextMain: "#1F2937",
    colorTextSub: "#6B7280",
    colorAccent: "#512E5F",
    barWeight: "#F97316",
    barGain: "#8B5CF6",
    barRate: "#14B8A6",
    lineLeft: "12px", 
    dotLeft: "-29px", 
    
    // 👇👇👇 在这里调整卡片间距 👇👇👇
    cardGap: "8px",  // ✅ 核心调整项：时间轴卡片垂直间距 (原 35px，已调小)
    
    layoutLogGap: "10px"
};

const GROWTH_STAGES = [
    { min: 0, max: 12, name: "纯母乳期", task: "保温 · 催奶 · 去脐带", desc: "眼睛耳朵紧闭，自主调节体温差，全靠妈妈舔屁屁排泄。" },
    { min: 13, max: 20, name: "感官复苏期", task: "剪指甲 · 防强光", desc: "眼睛睁开（避强光），耳朵打开，指甲变尖抓伤母乳，尝试爬行。" },
    { min: 21, max: 29, name: "学步辅食期", task: "加围栏 · 泡奶糕 · 铺尿垫", desc: "关键转折！长牙吃糊状辅食；自主排泄到处乱尿；走路变稳会翻栏。" },
    { min: 30, max: 45, name: "离乳混战期", task: "驱虫 · 收屎 · 逐渐断奶", desc: "食欲大增；铲屎高峰；兄弟姐妹打架互咬，社会化开始。" },
    { min: 46, max: 60, name: "立规矩期", task: "第一针疫苗 · 定点排便训练", desc: "母源抗体消失；智商上线，教“坐下/定点”黄金期；勿溺爱。" },
    { min: 61, max: 90, name: "社会化期", task: "疫苗完成 · 分笼/新家", desc: "疫苗打完可洗澡出门；可去新家或分笼训练独立性。" },
    { min: 91, max: 180, name: "尴尬换牙期", task: "补钙 · 磨牙棒 · 防拆家", desc: "乳牙脱落换恒牙，极度爱咬东西，颜值进入尴尬期。" },
    { min: 181, max: 365, name: "青春叛逆期", task: "运动 · 绝育/繁育考量", desc: "精力旺盛，体型定型，可能出现护食、领地意识或骑跨行为。" },
    { min: 366, max: 99999, name: "成犬期", task: "定期体检 · 健康维护", desc: "性格稳定，身体成熟，享受生活。" }
];

(function initProfileStyle() {
    const styleId = "puppy-profile-kit-v3.2"; // Updated Version ID
    
    if (!window._puppyProfileClickAttached) {
        document.addEventListener("click", function(e) {
            document.querySelectorAll("details.pp-stage-details[open]").forEach(el => {
                if (!el.contains(e.target)) { el.removeAttribute("open"); }
            });
        });
        window._puppyProfileClickAttached = true;
    }

    if (document.getElementById(styleId)) return;
    
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
        /* --- Banner Header (pp- 前缀) --- */
        .pp-banner-header { position: relative; margin: 10px 0 0 0 !important; background: transparent; color: white; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 10px -2px rgba(81, 46, 95, 0.3); overflow: visible !important; z-index: 10; }
        .pp-banner-bg { position: absolute; inset: 0; border-radius: 16px 16px 0 0; background: linear-gradient(135deg, #512E5F 0%, #8E44AD 60%, #FF9A9E 100%); overflow: hidden; z-index: -1; }
        .pp-banner-content { position: relative; z-index: 1; width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; }
        .pp-banner-deco-1 { position: absolute; top: -50px; right: -40px; width: 130px; height: 130px; background: rgba(255, 255, 255, 0.08); border-radius: 50%; pointer-events: none; z-index: 0; }
        .pp-banner-deco-2 { position: absolute; bottom: -30px; left: -20px; width: 90px; height: 90px; background: rgba(255, 255, 255, 0.06); border-radius: 50%; pointer-events: none; z-index: 0; }
        
        .pp-left-container { display: flex; align-items: center; gap: 16px; flex: 1; }
        .pp-icon-box { width: 54px; height: 54px; background: rgba(255,255,255,0.95); border-radius: 50%; box-shadow: 0 4px 8px rgba(0,0,0,0.15); border: 3px solid rgba(255,255,255,0.4); overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .pp-info-box { display: flex; flex-direction: column; justify-content: center; }
        .pp-name { font-size: 24px; font-weight: 900; line-height: 1.1; text-shadow: 0 2px 4px rgba(0,0,0,0.1); letter-spacing: -0.5px; }

        /* 阶段详情 Popover (已修正对齐方式) */
        .pp-stage-wrapper { margin-top: 4px; position: static; display: inline-block; } /* Change: static so child refers to banner */
        .pp-stage-summary { list-style: none; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.9); background: rgba(255,255,255,0.15); padding: 2px 8px; border-radius: 4px; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.1); }
        .pp-stage-summary:hover { background: rgba(255,255,255,0.25); text-shadow: 0 0 8px rgba(255,255,255,0.4); }
        .pp-guide-card { position: absolute; top: calc(100% - 10px); left: 24px; width: 260px; background: rgba(255, 255, 255, 0.98); color: #333; border-radius: 12px; padding: 16px; box-shadow: 0 12px 30px -8px rgba(0, 0, 0, 0.3); text-align: left; z-index: 100 !important; border: 1px solid rgba(230,230,230,0.8); animation: puppyFadeIn 0.2s ease-out; }
        @keyframes puppyFadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        
        .pg-row { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #f0f0f0; }
        .pg-row:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        .pg-icon-box { width: 24px; height: 24px; background: #F3E8FF; border-radius: 6px; color: #8E44AD; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .pg-title { font-size: 11px; font-weight: 800; color: #8E44AD; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px; }
        .pg-text { font-size: 12px; line-height: 1.4; font-weight: 500; color: #1F2937; }
        .pg-desc { font-size: 11px; color: #666; line-height: 1.4; }

        /* Badge */
        .pp-badge-box { display: flex; flex-direction: column; align-items: flex-end; justify-content: center; min-width: auto; padding-left: 10px; }
        .pp-hero-group { display: flex; flex-direction: row; align-items: baseline; justify-content: flex-end; transform: skewX(-5deg); }
        .pp-hero-num { font-size: 52px; font-family: 'Impact', 'Arial Black', sans-serif; font-weight: 900; font-style: italic; line-height: 1; background: linear-gradient(to bottom, #fff 40%, rgba(255,255,255,0.7)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); padding-right: 0.3em; margin-right: -0.2em; }
        .pp-hero-label { font-size: 12px; font-weight: 800; text-transform: uppercase; opacity: 0.8; letter-spacing: 0.5px; color: rgba(255,255,255,0.9); margin-left: -2px; }

        /* --- Stats Panel (pp-stats-panel) --- */
        .pp-stats-panel { background: #fff; border-radius: 0 0 16px 16px; padding: 0; margin-bottom: 25px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid rgba(0,0,0,0.05); border-top: none; position: relative; z-index: 5; overflow: hidden; }
        
        .pp-stat-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; padding: 18px 10px; border-bottom: none; }
        .pp-stat-item { display: flex; flex-direction: column; position: relative; padding: 0 8px; border-right: 1px solid #F3F4F6; }
        .pp-stat-item:last-child { border-right: none; }
        .pp-stat-label { font-size: 12px; color: ${STYLE_CONFIG.colorTextSub}; margin-bottom: 2px; font-weight: 500; }
        .pp-stat-value { font-size: 22px; font-weight: 800; color: ${STYLE_CONFIG.colorTextMain}; line-height: 1.1; font-family: 'JetBrains Mono', Consolas, monospace; }
        .pp-stat-unit { font-size: 11px; color: #9CA3AF; margin-left: 2px; font-weight: normal; }
        
        /* 排名条 (Rank Track) */
        .pp-rank-track { width: 100%; height: 6px; background-color: #F3F4F6; border-radius: 3px; overflow: hidden; margin-top: 8px; margin-bottom: 4px; }
        .pp-rank-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease-out; }
        .pp-rank-text { font-size: 10px; color: #9CA3AF; font-weight: 500; }
        
        /* Log Container (pp-log-*) */
        .pp-log-container { margin-top: ${STYLE_CONFIG.layoutLogGap}; background: #F9FAFB; border: 1px solid #F3F4F6; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; margin: 0 24px 20px 24px; }
        .pp-log-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px dashed #E5E7EB; font-family: 'JetBrains Mono', Consolas, monospace; font-size: 11px; background: #FDFDFD; }
        .pp-log-meta-left { display: flex; align-items: center; gap: 6px; color: #4B5563; font-weight: 600; }
        .pp-log-dot { width: 6px; height: 6px; border-radius: 50%; background-color: ${STYLE_CONFIG.colorAccent}; opacity: 0.8; box-shadow: 0 0 0 2px rgba(81, 46, 95, 0.1); }
        .pp-log-timeago { color: #9CA3AF; font-weight: normal; }
        .pp-log-body { padding: 10px 12px 12px 12px; font-size: 13px; line-height: 1.6; color: #374151; white-space: pre-wrap; }

        /* --- Timeline (原版时间轴，保持 pt- 前缀因为是独有的) --- */
        .pt-container { position: relative; padding: 10px 0 10px 35px; display: flex; flex-direction: column; }
        .pt-container::before { content: ''; position: absolute; top: 15px; bottom: 50px; left: ${STYLE_CONFIG.lineLeft}; width: 2px; background-color: #E2E8F0; z-index: 0; }
        
        /* ⬇️ 这里引用了 cardGap，控制卡片之间的垂直间距 ⬇️ */
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
        .pt-media-section img { display: block; width: 100%; object-fit: cover; border-radius: 8px; border: 1px solid rgba(0,0,0,0.03); margin-top: -4px !important; margin-bottom: -12px !important; }
        .pt-media-section figcaption, .pt-media-section .caption, .pt-media-section .image-embed::after { display: none !important; }
        .view-action, 
        .mobile-view-action, 
        .view-header { 
            z-index: 9999 !important; 
        }
        
        /* 如果那是你自己的“成长阶段”按钮，也给它加个保险 */
        .your-custom-button-class-if-any {
            z-index: 9999 !important;
        }
        `;
    document.head.appendChild(style);
})();

window.PuppyProfileKit = {
    icons: {
        bolt: `<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`,
        paw: `<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3-6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-6 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm2-4c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></path></svg>`
    },

    logic: {
        getTargetRate(current, prev) {
            if (!prev || prev <= 0) return 0;
            return ((current - prev) / prev) * 100;
        },
        getDaysOld(birthDateStr, eventDateStr = null) {
            if (!birthDateStr) return 0;
            const birth = new Date(birthDateStr);
            const target = eventDateStr ? new Date(eventDateStr) : new Date();
            birth.setHours(0,0,0,0); target.setHours(0,0,0,0);
            return Math.floor((target - birth) / (1000 * 60 * 60 * 24));
        },
        getTimeAgo(dateStr) {
            if (!dateStr) return "";
            const diff = new Date() - new Date(dateStr);
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            if (days === 0) return "Today";
            if (days === 1) return "Yesterday";
            return `${days} Days ago`;
        },
        getStageInfo(daysOld) {
            const stage = GROWTH_STAGES.find(s => daysOld >= s.min && daysOld <= s.max);
            return stage || GROWTH_STAGES[GROWTH_STAGES.length - 1];
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
            let combinedText = ""; let cMatch;
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
            for (let p of pages) {
                const bDate = p.birth || p.birthday; if (!bDate) continue;
                const daysOld = this.getDaysOld(bDate);
                if (daysOld < 300) {
                    const events = await this.parseLog(app, p.file);
                    const weights = events.filter(e => e.weight !== null).map(e => ({ w: e.weight, d: e.date }));
                    weights.sort((a, b) => b.d.localeCompare(a.d));
                    if (weights.length > 0) {
                        const cur = weights[0].w;
                        let gain = 0, rate = 0;
                        if (weights.length > 1) { const prev = weights[1].w; gain = cur - prev; rate = this.getTargetRate(cur, prev); }
                        rankingPool.push({ name: p.file.name, path: p.file.path, weight: cur, gain: gain, rate: rate });
                    }
                }
            }
            let myData = null;
            if (isAdult) {
                const events = await this.parseLog(app, currentFile);
                const weights = events.filter(e => e.weight !== null).map(e => ({ w: e.weight, d: e.date }));
                weights.sort((a, b) => b.d.localeCompare(a.d));
                if (weights.length > 0) {
                    const cur = weights[0].w;
                    let gain = 0, rate = 0;
                    if (weights.length > 1) { const prev = weights[1].w; gain = cur - prev; rate = this.getTargetRate(cur, prev); }
                    myData = { weight: cur, gain: gain, rate: rate };
                }
            } else { myData = rankingPool.find(x => x.path === currentFilePath); }
            if (!myData) return null;
            if (isAdult) {
                const fullBar = { text: "", rank: 1, total: 1 };
                return { data: myData, rankWeight: fullBar, rankGain: fullBar, rankRate: fullBar, isAdultMode: true };
            }
            const getRank = (arr, key, myPath) => {
                const sorted = [...arr].sort((a, b) => b[key] - a[key]);
                const idx = sorted.findIndex(x => x.path === myPath);
                if (idx === -1) return { text: "-", rank: 0, total: 0 };
                return { text: `第 ${idx + 1}/${arr.length}`, rank: idx + 1, total: arr.length };
            };
            return {
                data: myData,
                rankWeight: getRank(rankingPool, 'weight', currentFilePath),
                rankGain: getRank(rankingPool, 'gain', currentFilePath),
                rankRate: getRank(rankingPool, 'rate', currentFilePath)
            };
        }
    },

    // ================= UI Renders (Updated Classes) =================

    renderHeader: async function(dv, container, options = {}) {
        const page = dv.current();
        const currentFile = app.workspace.getActiveFile();
        const name = page.name || page.file.name;
        const birthDateStr = page.birth || page.birthday;
        const totalDays = this.logic.getDaysOld(birthDateStr);
        const isAdult = options.isAdult || false;
        const stageInfo = this.logic.getStageInfo(totalDays);

        let labelStr = "DAYS", numberStr = totalDays, adultSubtext = "";
        if (isAdult || totalDays >= 365) {
            labelStr = "YEARS"; numberStr = Math.floor(totalDays / 365);
            const months = Math.floor((totalDays % 365) / 30); adultSubtext = `${numberStr}岁${months}个月`;
        }

        const rankData = await this.logic.calculateRankings(dv, currentFile.path, isAdult);
        const events = await this.logic.parseLog(app, currentFile);
        
        let latestText = "暂无动态", latestDate = null;
        const latestEvent = events.find(e => e.content && e.content.replace(/!\[.*\]\(.*\)|!\[\[.*\]\]/g, "").trim().length > 0);
        if (latestEvent) { latestText = latestEvent.content.replace(/!\[.*\]\(.*\)|!\[\[.*\]\]/g, "").trim(); latestDate = latestEvent.date; } 
        else if (events.length > 0 && events[0].hasImage) { latestText = "（最新动态为图片分享）"; latestDate = events[0].date; }

        // 1. 渲染 Banner (pp- class)
        const banner = container.createEl("div"); banner.className = "pp-banner-header";
        const bgLayer = banner.createEl("div", { cls: "pp-banner-bg" });
        bgLayer.createEl("div", { cls: "pp-banner-deco-1" }); bgLayer.createEl("div", { cls: "pp-banner-deco-2" });
        const contentLayer = banner.createEl("div", { cls: "pp-banner-content" });

        const leftContainer = contentLayer.createEl("div", { cls: "pp-left-container" });
        const iconBox = leftContainer.createEl("div", { cls: "pp-icon-box" });
        const iconImg = iconBox.createEl("img"); iconImg.src = app.vault.adapter.getResourcePath("99-附件/DogIcon/DogIcon.webp"); 
        iconImg.onerror = () => { iconImg.style.display='none'; iconBox.innerText='🐶'; iconBox.style.fontSize='24px'; };
        iconImg.style.cssText = `width: 100%; height: 100%; object-fit: cover;`;
        
        const infoBox = leftContainer.createEl("div", { cls: "pp-info-box" });
        infoBox.createEl("div", { text: name, cls: "pp-name" });
        
        const stageDetails = infoBox.createEl("details", { cls: "pp-stage-details pp-stage-wrapper" });
        const buttonText = isAdult ? adultSubtext : stageInfo.name;
        const stageSummary = stageDetails.createEl("summary", { cls: "pp-stage-summary", text: buttonText });
        
        const cardEl = stageDetails.createEl("div", { cls: "pp-guide-card" });
        const row1 = cardEl.createEl("div", { cls: "pg-row" });
        const icon1 = row1.createEl("div", { cls: "pg-icon-box" }); icon1.innerHTML = this.icons.bolt;
        const c1 = row1.createEl("div", { cls: "pg-content" }); c1.createEl("div", { cls: "pg-title", text: "行动指南" }); c1.createEl("div", { cls: "pg-text", text: stageInfo.task });
        const row2 = cardEl.createEl("div", { cls: "pg-row" });
        const icon2 = row2.createEl("div", { cls: "pg-icon-box" }); icon2.innerHTML = this.icons.paw;
        const c2 = row2.createEl("div", { cls: "pg-content" }); c2.createEl("div", { cls: "pg-title", text: "生理特征" }); c2.createEl("div", { cls: "pg-desc", text: stageInfo.desc });

        const rightBox = contentLayer.createEl("div", { cls: "pp-badge-box" });
        const heroGroup = rightBox.createEl("div", { cls: "pp-hero-group" });
        heroGroup.createEl("span", { cls: "pp-hero-num", text: numberStr }); heroGroup.createEl("span", { cls: "pp-hero-label", text: labelStr });

        // 2. 渲染 Stats Panel (pp- class)
        const statsPanel = container.createEl("div"); statsPanel.className = "pp-stats-panel";
        const grid = statsPanel.createEl("div"); grid.className = "pp-stat-grid";
        
        if (!rankData) { statsPanel.createEl("div", { text: "暂无体重数据，请先录入。", style: "color:#ccc;text-align:center;padding:20px;" }); return; }
        
        const createStat = (label, value, unit, rankObj, barColor) => {
            const item = grid.createEl("div", { cls: "pp-stat-item" }); 
            item.createEl("div", { text: label, cls: "pp-stat-label" });
            const valBox = item.createEl("div"); valBox.createEl("span", { text: value, cls: "pp-stat-value" }); valBox.createEl("span", { text: unit, cls: "pp-stat-unit" });
            const track = item.createEl("div", { cls: "pp-rank-track" });
            let widthPct = 0; 
            if (rankData.isAdultMode) { widthPct = 100; } else if (rankObj.total > 0) { widthPct = ((rankObj.total - rankObj.rank + 1) / rankObj.total) * 100; }
            const fill = track.createEl("div", { cls: "pp-rank-fill" }); fill.style.width = `${widthPct}%`; fill.style.backgroundColor = barColor;
            if(!rankData.isAdultMode) { item.createEl("div", { text: rankObj.text, cls: "pp-rank-text" }); }
        };
        
        const d = rankData.data; 
        const gainStr = d.gain > 0 ? `+${d.gain}` : `${d.gain}`; 
        const rateStr = d.rate > 0 ? `+${d.rate.toFixed(1)}` : `${d.rate.toFixed(1)}`;
        let displayWeight = d.weight, displayUnit = "g";
        if (d.weight > 9999) { displayWeight = (d.weight / 1000).toFixed(1); displayUnit = "kg"; }
        
        createStat("体重", displayWeight, displayUnit, rankData.rankWeight, STYLE_CONFIG.barWeight);
        createStat("最新增重", gainStr, "g", rankData.rankGain, STYLE_CONFIG.barGain);
        createStat("最新增幅", rateStr, "%", rankData.rankRate, STYLE_CONFIG.barRate);
        
        // 3. 渲染 Log Container
        const logContainer = statsPanel.createEl("div", { cls: "pp-log-container" });
        const logHeader = logContainer.createEl("div", { cls: "pp-log-header" });
        const leftMeta = logHeader.createEl("div", { cls: "pp-log-meta-left" });
        leftMeta.createEl("div", { cls: "pp-log-dot" });
        if (latestDate) {
            leftMeta.createEl("span", { text: latestDate });
            logHeader.createEl("span", { cls: "pp-log-timeago", text: this.logic.getTimeAgo(latestDate) });
        } else { leftMeta.createEl("span", { text: "NO DATA" }); }
        const logBody = logContainer.createEl("div", { cls: "pp-log-body" });
        logBody.textContent = latestText;
    },

    renderTimelineFromText: async function(dv, container, birthDateStr, sectionHeader, obsModule) {
        const currentFile = app.workspace.getActiveFile(); if(!currentFile) return;
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
    }
};