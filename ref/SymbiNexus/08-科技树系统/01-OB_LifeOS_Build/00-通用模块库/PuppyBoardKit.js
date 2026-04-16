//# 崽子看板专用库 (PuppyBoardKit) v2.9 (Mobile Header Fix)
// v2.9: 深度优化Banner区移动端适配，修复百天以上数字挤压导致标题换行的问题

const STYLE_CONFIG = {
    textMain: "#1F2937",
    textSub:  "#6B7280",
    
    // --- 视觉构造配置 (竖线) ---
    vizConfig: {
        lineOffset: "38px",    
        lineColor:  "#E5E7EB", 
        lineWidth:  "2px"      
    },

    // 进度条配色
    barWeight: "linear-gradient(90deg, #a78bfa 0%, #8b5cf6 100%)", // 恒定紫
    barGrowth: "linear-gradient(90deg, #34d399 0%, #10b981 100%)", // 默认青
    barGold:   "linear-gradient(90deg, #FCD34D 0%, #F59E0B 100%)", // 冠军金
    barRed:    "linear-gradient(90deg, #FCA5A5 0%, #EF4444 100%)", // 预警红
    
    trackBg:   "rgba(0,0,0,0.04)",

    // 边框色
    border: {
        normal:   "#9CA3AF", 
        champion: "#F59E0B", 
        alert:    "#EF4444", 
        mother:   "#8b5cf6"  
    }
};

(function initBoardStyle() {
    const styleId = "puppy-board-kit-v2.9"; // Updated ID
    if (document.getElementById(styleId)) return;
    
    const C = STYLE_CONFIG;
    const V = C.vizConfig;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
        /* --- 容器重置 & 竖线背景 (看板专用) --- */
        .puppy-container { 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            position: relative; 
            background-image: 
                linear-gradient(to bottom, ${V.lineColor}, ${V.lineColor}),
                linear-gradient(to bottom, ${V.lineColor}, ${V.lineColor});
            background-size: ${V.lineWidth} 100%;
            background-position: ${V.lineOffset} 0, calc(100% - ${V.lineOffset}) 0;
            background-repeat: no-repeat;
        }

        .pb-banner-header, .pb-stats-panel, .mother-card, .viz-card, .chart-card-container {
            position: relative; isolation: isolate;
        }

        /* ================= 1. Header & KPI (pb- class) ================= */
        .pb-banner-header { margin: 10px 0 0 0 !important; display: flex; align-items: center; justify-content: space-between; overflow: visible !important; color: white; }
        .pb-banner-bg { position: absolute; inset: 0; border-radius: 16px 16px 0 0; background: linear-gradient(135deg, #512E5F 0%, #8E44AD 60%, #FF9A9E 100%); z-index: -1; }
        
        /* v2.9 默认桌面端样式 */
        .pb-banner-content { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; }
        .pb-left-container { display: flex; align-items: center; gap: 16px; min-width: 0; /* 允许flex子项收缩 */ }
        .pb-icon-box { flex-shrink: 0; width: 54px; height: 54px; background: rgba(255,255,255,0.95); border-radius: 50%; box-shadow: 0 4px 8px rgba(0,0,0,0.15); border: 3px solid rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; font-size: 24px; }
        .pb-info-box { display: flex; flex-direction: column; justify-content: center; min-width: 0; /* 文本截断关键 */ }
        
        .pb-name { font-size: 24px; font-weight: 900; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pb-sub { font-size: 11px; opacity: 0.8; white-space: nowrap; }

        .pb-hero-group { display: flex; flex-direction: row; align-items: baseline; transform: skewX(-5deg); flex-shrink: 0; margin-left: 10px; }
        .pb-hero-num { font-size: 52px; font-family: 'Impact', sans-serif; font-weight: 900; line-height: 1; }
        .pb-hero-label { font-size: 12px; font-weight: 800; text-transform: uppercase; opacity: 0.8; margin-left: 4px; }

        .pb-stats-panel { background: #fff; border-radius: 0 0 16px 16px; margin-bottom: 25px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid rgba(0,0,0,0.05); border-top: none; overflow: hidden; }
        
        /* 桌面端默认 Grid (4列) */
        .pb-stat-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0; padding: 18px 10px; }
        
        .pb-stat-item { display: flex; flex-direction: column; align-items: center; text-align: center; border-right: 1px solid #F3F4F6; }
        .pb-stat-item:last-child { border-right: none; }
        .pb-stat-label { font-size: 12px; color: ${C.textSub}; margin-bottom: 6px; font-weight: 500; }
        .pb-stat-value { font-size: 20px; font-weight: 700; color: ${C.textMain}; line-height: 1; font-family: 'Verdana', sans-serif; letter-spacing: -0.5px; }
        .pb-stat-unit { font-size: 11px; color: #9CA3AF; margin-left: 2px; font-weight: normal; }

        /* ================= 2. Mother Widget ================= */
        .mother-card {
            display: flex; align-items: center; justify-content: space-between;
            background: #fff; border-radius: 12px; padding: 16px 24px; margin-bottom: 16px;
            border: 1px solid rgba(0,0,0,0.05); border-left: 4px solid ${C.border.mother};
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .mc-left { display: flex; align-items: center; gap: 12px; }
        .mc-name { font-size: 18px; font-weight: 800; color: #4B5563; }
        .mc-tag { background: #F3F4F6; color: #8b5cf6; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.5px; }
        .mc-right { display: flex; gap: 32px; text-align: right; }
        .mc-data-group { display: flex; flex-direction: column; }
        .mc-val { font-size: 22px; font-weight: 800; color: #1F2937; line-height: 1; }
        .mc-unit { font-size: 12px; color: #9CA3AF; font-weight: 500; margin-left: 2px;}
        .mc-sub { font-size: 13px; color: #6B7280; font-weight: 600; margin-top: 4px; }

        /* ================= 3. 崽子列表 ================= */
        .viz-list { display: flex; flex-direction: column; gap: 12px; margin-top: 10px; }
        
        .viz-card { 
            display: flex; align-items: center; 
            padding: 14px 20px; border-radius: 12px; 
            background: #fff; 
            border: 1px solid rgba(0,0,0,0.06);
            border-left: 4px solid ${C.border.normal}; 
            box-shadow: 0 1px 2px rgba(0,0,0,0.03);
            transition: all 0.2s ease;
        }
        
        /* 桌面端列宽 */
        .vc-rank-col { width: 30px; font-size: 16px; font-weight: 900; color: #D1D5DB; font-style: italic; text-align: center; }
        .vc-name-col { width: 80px; font-size: 15px; font-weight: 700; color: #374151; }
        .vc-bars-area { flex: 1; display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; align-items: center; }
        
        /* 状态变体 */
        .viz-card.s-champion { border-left-color: ${C.border.champion}; background: #FFFEF9; }
        .s-champion .vc-rank-col { color: ${C.border.champion}; }

        .viz-card.s-alert { border-left-color: ${C.border.alert}; background: #FFF5F5; }
        .s-alert .vc-rank-col { color: ${C.border.alert}; }

        /* 数据文字 */
        .vc-bar-group { display: flex; flex-direction: column; justify-content: center; }
        .vc-data-row { display: flex; justify-content: space-between; align-items: baseline; width: 100%; margin-bottom: 5px; }
        
        .txt-weight-main { font-size: 16px; font-weight: 800; color: #1F2937; line-height: 1; }
        .txt-weight-unit { font-size: 11px; font-weight: normal; color: #9CA3AF; }
        
        .txt-growth-pct { font-size: 16px; font-weight: 800; color: #10b981; line-height: 1; }
        
        /* 增量数值：全局强制灰色 */
        .txt-growth-val { font-size: 11px; font-weight: 600; color: #9CA3AF !important; opacity: 0.8; }

        /* 仅有百分比会变色 */
        .s-champion .txt-growth-pct { color: #D97706; }
        .s-alert .txt-growth-pct { color: #EF4444; }

        .vc-track { height: 6px; background: ${C.trackBg}; border-radius: 3px; overflow: hidden; width: 100%; }
        .vc-fill { height: 100%; border-radius: 3px; }
        
        .fill-purple { background: ${C.barWeight}; }
        .fill-cyan   { background: ${C.barGrowth}; }
        .fill-gold   { background: ${C.barGold}; }
        .fill-red    { background: ${C.barRed}; }

        /* ================= 4. Chart (边框加深实体化) ================= */
        .chart-card-container { 
            background: #fff; border-radius: 16px; 
            border: 1px solid rgba(0,0,0,0.15); /* 边框加深 */
            padding: 16px; margin-top: 25px; 
            box-shadow: 0 4px 10px -2px rgba(0,0,0,0.06); 
        }
        .chart-header { display: flex; align-items: center; margin-bottom: 12px; gap: 8px; }
        .chart-title { font-size: 14px; font-weight: bold; color: #374151; }
        .chart-badge { font-size: 10px; background: #F3F4F6; color: #6B7280; padding: 2px 6px; border-radius: 4px; }

        /* ================= Mobile Optimization (v2.9 深度优化) ================= */
        @media (max-width: 480px) {
            
            /* --- v2.9 Header Fix --- */
            .pb-banner-content { 
                padding: 16px 14px; /* 缩减内边距 */
            }
            .pb-icon-box { 
                width: 42px; height: 42px; /* 缩小图标 */
                font-size: 20px; border-width: 2px;
            }
            .pb-left-container { 
                gap: 8px; /* 拉近图标与文字 */
            }
            .pb-name { 
                font-size: 19px; /* 缩小标题 */
                white-space: nowrap; /* 强制不换行 */
            }
            .pb-sub { font-size: 10px; } /* 缩小副标题 */

            .pb-hero-group { margin-left: 8px; transform: skewX(-3deg); }
            .pb-hero-num { 
                font-size: 40px; /* 缩小数字，给三位数留空间 */
            }
            .pb-hero-label { 
                font-size: 10px; margin-left: 2px; 
            }

            /* --- KPI 面板 --- */
            .pb-stat-grid { 
                grid-template-columns: repeat(4, 1fr); 
                padding: 10px 4px; gap: 0; 
            }
            .pb-stat-item { border-right: none; } 
            .pb-stat-label { font-size: 10px; margin-bottom: 0px; opacity: 0.8; }
            .pb-stat-value { font-size: 16px; margin-top: 2px; }

            /* --- 列表卡片 --- */
            .viz-card { padding: 12px 8px; gap: 6px; }
            .vc-rank-col { width: 15px; font-size: 13px; } 
            .vc-name-col { width: 42px; font-size: 13px; } 

            /* --- 数据区 --- */
            .vc-bars-area { 
                grid-template-columns: 1fr 1fr; 
                gap: 8px; 
            }
            .txt-weight-main { font-size: 14px; } 
            .txt-growth-pct { font-size: 14px; }
            .txt-weight-unit, .txt-growth-val { font-size: 10px; }
            .vc-data-row { margin-bottom: 2px; }
        }
    `;
    document.head.appendChild(style);
})();

const CHART_JS_URL = "https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.min.js";
function ensureChartJsLoaded() {
    if (window.Chart) return Promise.resolve(true);
    if (window.__pbChartJsPromise) return window.__pbChartJsPromise;

    window.__pbChartJsPromise = new Promise((resolve) => {
        const existing = document.querySelector('script[data-pb-chartjs="1"]');
        if (existing) {
            if (window.Chart) return resolve(true);
            existing.addEventListener("load", () => resolve(!!window.Chart), { once: true });
            existing.addEventListener("error", () => resolve(false), { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = CHART_JS_URL;
        script.async = true;
        script.defer = true;
        script.dataset.pbChartjs = "1";
        script.onload = () => resolve(!!window.Chart);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
    });

    return window.__pbChartJsPromise;
}
ensureChartJsLoaded();

window.PuppyBoardKit = {
    chartColors: ["#8b5cf6", "#F59E0B", "#10b981", "#EF4444", "#3b82f6"],

    logic: {
        getDaysOld(birthDateStr) {
            if (!birthDateStr) return 0;
            const birth = new Date(birthDateStr);
            const target = new Date();
            birth.setHours(0,0,0,0); target.setHours(0,0,0,0);
            return Math.floor((target - birth) / (1000 * 60 * 60 * 24));
        },
        evaluateStatus(days, gainPct) {
            if (gainPct < 0) return { isPass: false }; 
            const p = gainPct * 100;
            let isPass = false;
            if (days <= 7) isPass = p >= 10; 
            else if (days <= 14) isPass = p >= 8;
            else isPass = p >= 5;
            return { isPass: isPass };
        },
        formatSmart(val) {
            if (val === null || val === undefined) return { num: "--", unit: "" };
            if (val >= 999) { return { num: (val / 1000).toFixed(2), unit: "kg" }; }
            return { num: Math.round(val), unit: "g" };
        },
        async parseLog(app, fileOrPath) {
            let file = (typeof fileOrPath === 'string') ? app.vault.getAbstractFileByPath(fileOrPath) : app.vault.getAbstractFileByPath(fileOrPath.path);
            if (!file) return [];
            const content = await app.vault.read(file);
            const events = [];
            const commentRegex = /%%([\s\S]*?)%%/g;
            let combinedText = ""; let cMatch;
            while ((cMatch = commentRegex.exec(content)) !== null) { combinedText += "\n" + cMatch[1]; }
            const blockRegex = /#+\s+(\d{4}-\d{2}-\d{2})(.*)\n([\s\S]*?)(?=(#+\s+\d{4}-\d{2}-\d{2})|$)/g;
            let bMatch;
            while ((bMatch = blockRegex.exec(combinedText)) !== null) {
                let weight = null;
                const weightMatch = bMatch[3].trim().match(/\[weight::\s*(\d+(?:\.\d+)?)\]/i);
                if (weightMatch) weight = parseFloat(weightMatch[1]);
                events.push({ date: bMatch[1], weight: weight });
            }
            return events;
        }
    },

    renderCockpitHeader: function(container, title, days) {
        container.createEl("div", { cls: "pb-banner-header" }).innerHTML = `
            <div class="pb-banner-bg"></div>
            <div class="pb-banner-content">
                <div class="pb-left-container">
                    <div class="pb-icon-box">🏰</div>
                    <div class="pb-info-box">
                        <div class="pb-name">${title}</div>
                        <div class="pb-sub">Family Monitor</div>
                    </div>
                </div>
                <div class="pb-hero-group">
                    <span class="pb-hero-num">${days}</span><span class="pb-hero-label">DAYS</span>
                </div>
            </div>`;
    },

    renderCockpitConsole: function(container, kpiData) {
        const panel = container.createEl("div", { cls: "pb-stats-panel" });
        const grid = panel.createEl("div", { cls: "pb-stat-grid" });
        
        const createItem = (label, val, unit, color) => {
            grid.innerHTML += `
            <div class="pb-stat-item">
                <div class="pb-stat-label">${label}</div>
                <div><span class="pb-stat-value" style="color:${color}">${val}</span><span class="pb-stat-unit">${unit || ''}</span></div>
            </div>`;
        };
        
        createItem("整体达标", kpiData.pass, null, "#10b981");
        createItem("今日均重", kpiData.avg, "g", "#8b5cf6");
        createItem("增幅冠军", kpiData.top, null, "#F59E0B"); 
        createItem("最小体重", kpiData.bot, null, "#EF4444"); 
    },

    renderMotherWidget: function(container, m) {
        if (!m) return;
        const wFmt = this.logic.formatSmart(m.weight);
        const gFmt = m.gain >= 0 ? `+${m.gain}g` : `${m.gain}g`;
        const gPct = (m.gainPct * 100).toFixed(1) + "%";
        const card = container.createEl("div", { cls: "mother-card" });
        card.innerHTML = `
            <div class="mc-left">
                <div style="font-size:24px;">👑</div>
                <div>
                    <div class="mc-name">${m.name}</div>
                    <span class="mc-tag">MOTHER</span>
                </div>
            </div>
            <div class="mc-right">
                <div class="mc-data-group">
                    <div class="mc-val">${wFmt.num}<span class="mc-unit">${wFmt.unit}</span></div>
                    <div class="mc-sub" style="opacity:0.6;">Current</div>
                </div>
                <div class="mc-data-group">
                    <div class="mc-val" style="color:#6B7280;">${gFmt}</div>
                    <div class="mc-sub" style="color:#9CA3AF;">${gPct}</div>
                </div>
            </div>
        `;
    },

    renderCardList: function(container, items, maxWeight, maxGainPct, sortOrder) {
        const list = container.createEl("div", { cls: "viz-list" });
        const puppies = items.filter(x => !x.isMother).sort((a, b) => sortOrder.indexOf(a.name) - sortOrder.indexOf(b.name));

        puppies.forEach((p, idx) => {
            let statusClass = "s-normal";
            let growthFillClass = "fill-cyan"; 

            if (p.isChampion) { 
                statusClass = "s-champion"; 
                growthFillClass = "fill-gold"; 
            }
            else if (p.isAlert) { 
                statusClass = "s-alert"; 
                growthFillClass = "fill-red";  
            }

            const wFmt = this.logic.formatSmart(p.weight);
            const wPct = (maxWeight > 0) ? (p.weight / maxWeight) * 100 : 0;
            const gVal = p.gain >= 0 ? `+${p.gain}g` : `${p.gain}g`;
            const gPctNum = (p.gainPct * 100).toFixed(1) + "%";
            const gBarPct = (maxGainPct > 0 && p.gainPct > 0) ? (p.gainPct / maxGainPct) * 100 : 0;
            
            const card = list.createEl("div", { cls: `viz-card ${statusClass}` });
            card.onclick = () => app.workspace.openLinkText(p.path, '', true);

            card.innerHTML = `
                <div class="vc-rank-col">${idx + 1}</div>
                <div class="vc-name-col">${p.name}</div>
                
                <div class="vc-bars-area">
                    <div class="vc-bar-group">
                        <div class="vc-data-row">
                            <span class="txt-weight-main">${wFmt.num}<span class="txt-weight-unit">${wFmt.unit}</span></span>
                        </div>
                        <div class="vc-track"><div class="vc-fill fill-purple" style="width:${wPct}%"></div></div>
                    </div>
                    
                    <div class="vc-bar-group">
                        <div class="vc-data-row">
                            <span class="txt-growth-pct">${gPctNum}</span>
                            <span class="txt-growth-val">${gVal}</span>
                        </div>
                        <div class="vc-track"><div class="vc-fill ${growthFillClass}" style="width:${gBarPct}%"></div></div>
                    </div>
                </div>
            `;
        });
    },

    createGrowthChart: function(container, chartData, title = "生长趋势") {
        const wrapper = container.createEl("div", { cls: "chart-card-container" });
        
        // --- 1. Header Area (Title + Controls) ---
        const header = wrapper.createEl("div", { cls: "chart-header" });
        header.style.justifyContent = "space-between";
        header.createEl("span", { cls: "chart-title", text: title });

        const controls = header.createEl("div");
        controls.style.cssText = "display:flex; align-items:center; gap:4px; font-size:12px; color:#6B7280;";
        controls.createEl("span", { text: "近" });
        const input = controls.createEl("input", { type: "number", value: "7" });
        input.style.cssText = "width:40px; border:1px solid #e5e7eb; border-radius:4px; padding:2px; font-size:12px; text-align:center; color:#374151;";
        controls.createEl("span", { text: "天" });

        // --- 2. Canvas Containers ---
        // Container for Puppies
        const puppyContainer = wrapper.createEl("div"); 
        puppyContainer.style.cssText = `position:relative; height:220px; width:100%;`;
        const canvasPuppy = puppyContainer.createEl("canvas");

        // Container for Mother (Mooncake) - Created dynamically if needed
        let motherContainer = null;
        let canvasMother = null;
        
        // Identify series
        const motherName = "月饼";
        const motherSeries = chartData.series.find(s => s.name.includes(motherName));
        const puppySeriesList = chartData.series.filter(s => !s.name.includes(motherName));

        if (motherSeries) {
            // Add a separator title or spacing
            const sep = wrapper.createEl("div");
            sep.style.cssText = "margin: 20px 0 10px 0; font-size: 13px; font-weight: bold; color: #374151; border-top: 1px dashed #eee; padding-top: 15px;";
            sep.innerText = "月饼体重趋势"; // Removed Emoji

            motherContainer = wrapper.createEl("div");
            motherContainer.style.cssText = `position:relative; height:180px; width:100%;`; // Slightly shorter for mother
            canvasMother = motherContainer.createEl("canvas");
        }
        
        let chartInstancePuppy = null;
        let chartInstanceMother = null;

        // Get all dates and find the latest one to anchor "Last N Days"
        const allDates = Array.from(chartData.dates).sort();
        const latestDateStr = allDates[allDates.length - 1];
        
        // Helper: Generate continuous date range ending at `endDateStr`
        const getFullDateRange = (endDateStr, daysCount) => {
            if (!endDateStr) return [];
            const dates = [];
            const end = new Date(endDateStr);
            end.setHours(0,0,0,0);
            
            for (let i = daysCount - 1; i >= 0; i--) {
                const d = new Date(end);
                d.setDate(d.getDate() - i);
                // Format: YYYY-MM-DD
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                dates.push(`${y}-${m}-${day}`);
            }
            return dates;
        };

        const renderChart = (canvas, instance, seriesList, dates, isMother) => {
            if (instance) instance.destroy();

            // Prepare datasets
            // Sort series by last value (descending)
            const sortedSeries = seriesList.sort((a, b) => {
                 const getLastVal = (s) => {
                     for(let i=dates.length-1; i>=0; i--) {
                         let v = s.dataMap.get(dates[i]);
                         if(v !== undefined) return v;
                     } return 0;
                 };
                 return getLastVal(b) - getLastVal(a);
            });

            const datasets = sortedSeries.map((s, index) => {
                const dataPoints = dates.map(date => { 
                    const val = s.dataMap.get(date); 
                    return (val !== undefined && val !== null) ? Math.round(val) : null; 
                });
                // For mother, use a specific color (e.g., purple/pink), else cycle colors
                const color = isMother ? "#8b5cf6" : this.chartColors[index % this.chartColors.length];
                
                return { 
                    label: s.name.replace(".md", ""), 
                    data: dataPoints, 
                    borderColor: color, 
                    backgroundColor: color, 
                    borderWidth: 2, 
                    tension: 0.2, 
                    pointRadius: 3, 
                    pointBackgroundColor: "#fff", 
                    pointBorderWidth: 2, 
                    fill: false,
                    spanGaps: true // Allow connecting lines over missing data if desired? User said "actual spacing", so gaps might be better or connected. 
                                   // "横轴不应跨天的数据紧挨着彼此" -> This is solved by full date range + null values.
                                   // If we want lines to connect, spanGaps: true. If we want breaks, spanGaps: false.
                                   // Default chart.js is false. Let's keep it false to show data gaps clearly, or true if user prefers continuity.
                                   // User didn't specify, but "Interval actual days" implies x-axis linearity. 
                                   // Let's use spanGaps: true so the line looks continuous but the x-axis is correct.
                };
            });
            
            return new window.Chart(canvas, {
                type: 'line', 
                data: { labels: dates.map(d => d.substring(5)), datasets: datasets },
                options: { 
                    responsive: true, maintainAspectRatio: false, 
                    interaction: { mode: 'index', intersect: false }, 
                    plugins: { 
                        legend: { position: 'top', align:'end', labels: { usePointStyle: true, boxWidth: 6, font: { size: 11 } } }, 
                        tooltip: { backgroundColor: 'rgba(255, 255, 255, 0.95)', titleColor: '#1f2937', bodyColor: '#4b5563', borderColor: '#e5e7eb', borderWidth: 1, padding: 10 }
                    },
                    scales: { 
                        x: { grid: { display: false } }, 
                        y: { border: { display: false }, grid: { borderDash: [4, 4], color: '#f3f4f6' } } 
                    } 
                }
            });
        };

        const renderCore = (days) => {
            // Generate full date range based on the LATEST available date
            const fullDates = getFullDateRange(latestDateStr, days);

            // Render Puppy Chart
            chartInstancePuppy = renderChart(canvasPuppy, chartInstancePuppy, puppySeriesList, fullDates, false);

            // Render Mother Chart (if exists)
            if (motherSeries && canvasMother) {
                chartInstanceMother = renderChart(canvasMother, chartInstanceMother, [motherSeries], fullDates, true);
            }
        };

        const render = (days) => {
            ensureChartJsLoaded().then((ok) => {
                if (!ok || !window.Chart) return;
                const start = performance.now();
                const tryRender = () => {
                    const w = puppyContainer.offsetWidth;
                    const h = puppyContainer.offsetHeight;
                    if ((w > 0 && h > 0) || (performance.now() - start) > 1200) {
                        renderCore(days);
                        return;
                    }
                    requestAnimationFrame(tryRender);
                };
                requestAnimationFrame(tryRender);
            });
        };

        render(7);

        input.onchange = () => {
            let val = parseInt(input.value);
            if (isNaN(val) || val <= 0) val = 7;
            render(val);
        };
    }
};
