/**
 * SmartInputKit.js v4.2 (Mobile Fix & Scroll Patch)
 * 修复：页面横向滚动条BUG / 手机端 Meta 信息布局重构（左对齐模型名）
 */

// ================= 1. 全局配置区 =================
const CONFIG = {
    // 性能统计阈值 (>10s 视为脏数据)
    TIME_THRESHOLD_SECONDS: 10,

    // [配置] 性能矩阵：左侧模型名称列宽 (锁定 110px)
    MATRIX_MODEL_WIDTH: "110px", 
    
    // 显示最近多少条日志
    RECENT_LOG_COUNT: 5,

    // 路径配置
    DATA_DIR: "01-经纬矩阵系统/08-智能录入模块/智能录入日志",
    ECHARTS_PATH: "08-科技树系统/01-OB_LifeOS_Build/00-通用模块库/echarts.js",

    // 配色系统 (Purple Theme)
    COLORS: {
        bg:       "transparent", 
        textMain: "#111827", 
        textSub:  "#64748B", 
        
        themePrimary:   "#7C3AED", // 紫色 (主色 S1)
        themeSecondary: "#2563EB", // 蓝色 (辅色 S2)
        
        barGold: "linear-gradient(90deg, #FDE68A 0%, #D97706 100%)", 
        barNormal: "linear-gradient(90deg, #A78BFA 0%, #7C3AED 100%)", 
        
        border:   "rgba(0,0,0,0.06)",
        
        treemapFixed: ["#7C3AED", "#2563EB"]
    }
};

// ================= 2. 样式注入系统 =================
(function initStyles() {
    const styleId = "smart-input-kit-style-v4-2";
    if (document.getElementById(styleId)) return;
    
    const C = CONFIG.COLORS;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
        /* --- 容器基础：吊绳背景 --- */
        .si-container { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            max-width: 100%; 
            /* 核心修复：禁止容器撑开页面产生横向滚动条 */
            overflow-x: hidden; 
            
            background-image: linear-gradient(to bottom, #E2E8F0, #E2E8F0);
            background-size: 2px 100%;
            background-position: 14px 0; 
            background-repeat: no-repeat;
            padding: 0 0 20px 0; 
            box-sizing: border-box;
            color: ${C.textMain};
        }
        
        /* --- 1. The Super Card --- */
        .si-super-card {
            background: #FFFFFF;
            border-radius: 12px;
            box-shadow: 0 4px 20px -4px rgba(124, 58, 237, 0.15);
            overflow: hidden;
            margin-bottom: 32px;
            margin-left: 0;
            border: 1px solid rgba(0,0,0,0.03);
            position: relative;
            z-index: 2;
        }
        .si-sc-header {
            background: linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%);
            padding: 24px; color: white;
            display: flex; justify-content: space-between; align-items: center;
            position: relative;
        }
        .si-sc-header::before {
            content: ""; position: absolute; top: -50%; right: -20%; width: 200px; height: 200px;
            background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
            border-radius: 50%; pointer-events: none;
        }
        .si-sc-title-area h2 { margin: 0; font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.95); letter-spacing: 0.5px; }
        .si-sc-title-area p { margin: 4px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.7); font-family: monospace; }
        .si-sc-big-num { font-size: 32px; font-weight: 800; font-family: 'Arial Black', sans-serif; letter-spacing: -1px; }
        .si-sc-label { font-size: 12px; opacity: 0.8; margin-top: 4px; text-align: right; }
        .si-sc-body { display: grid; grid-template-columns: 1fr 1px 1fr; align-items: center; padding: 20px 0; }
        .si-sc-divider { height: 40px; background: #F1F5F9; width: 1px; }
        .si-stat-box { padding: 0 24px; display: flex; flex-direction: column; justify-content: center; }
        .si-stat-title { font-size: 11px; color: ${C.textSub}; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; }
        .si-stat-val { font-size: 22px; font-weight: 800; color: ${C.textMain}; line-height: 1; }
        .si-stat-sub { font-size: 11px; color: #94A3B8; margin-top: 4px; }
        .si-sc-footer {
            border-top: 1px solid #F8FAFC; padding: 12px 24px;
            display: flex; justify-content: space-between; align-items: center;
            background: #FAFAFA;
        }
        .si-model-label { font-size: 11px; color: ${C.themeSecondary}; font-weight: 800; text-transform: uppercase; margin-bottom: 2px; } 
        .si-model-val { font-size: 15px; font-weight: 800; color: ${C.textMain}; }
        .si-model-pill { 
            background: #EFF6FF; border: 1px solid #DBEAFE; color: ${C.themeSecondary};
            padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; 
        }

        /* --- 2. Chart Sections --- */
        .si-section { margin-bottom: 32px; padding-left: 34px; position: relative; }
        .si-section::before {
            content: ""; position: absolute; left: 9px; top: 6px;
            width: 12px; height: 12px; border-radius: 50%;
            background: #FFFFFF; border: 3px solid ${C.themePrimary};
            box-shadow: 0 0 0 2px #F9FAFB; z-index: 1;
        }
        .si-chart-header { display: flex; align-items: center; margin-bottom: 12px; }
        .si-chart-title { 
            font-size: 14px; font-weight: 800; color: #374151; 
            background: #F3F4F6; padding: 4px 10px; border-radius: 6px;
        }
        .si-chart-body { 
            width: 100%; height: 280px; position: relative; 
            background: #FFFFFF; border-radius: 8px; border: 1px solid #F1F5F9;
        }

        /* --- 3. Performance Matrix --- */
        .si-matrix-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .si-matrix-card { background: #FFFFFF; border: 1px solid #F1F5F9; border-radius: 8px; overflow: hidden; }
        .si-matrix-head { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid #F8FAFC; }
        .si-matrix-title { font-size: 13px; font-weight: 800; color: ${C.textMain}; } 
        .si-matrix-count { font-size: 10px; color: ${C.themePrimary}; background: #F3E8FF; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        .si-matrix-body { padding: 12px 14px; }
        .si-model-row { display: flex; align-items: center; margin-bottom: 10px; font-size: 12px; }
        .si-model-row:last-child { margin-bottom: 0; }
        .si-model-name { 
            width: ${CONFIG.MATRIX_MODEL_WIDTH}; color: #334155; font-weight: 700; 
            font-family: 'JetBrains Mono', monospace; white-space: nowrap; overflow: hidden; 
            text-overflow: ellipsis; flex-shrink: 0; text-align: right; padding-right: 12px; 
        }
        .si-track { flex: 1; height: 6px; background: #F8FAFC; border-radius: 3px; margin-right: 10px; position: relative; overflow: hidden; }
        .si-bar { height: 100%; border-radius: 3px; position: absolute; left: 0; top: 0; }
        .si-time { width: 32px; text-align: right; font-family: monospace; font-weight: 700; color: ${C.textMain}; flex-shrink: 0; font-size: 11px; }
        .si-tag-fastest { 
            font-size: 9px; font-weight: 800; color: #B45309; background: #FEF3C7; 
            padding: 1px 4px; border-radius: 3px; margin-left: auto; margin-right: 6px; 
            display: inline-flex; align-items: center;
        }

        /* --- 4. Recent Logs Stream --- */
        .si-log-list { display: flex; flex-direction: column; gap: 10px; }
        .si-log-item {
            background: #FFFFFF; border: 1px solid #F1F5F9; border-radius: 8px;
            padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;
            position: relative; overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
            /* 确保卡片本身不溢出 */
            max-width: 100%;
            box-sizing: border-box;
        }
        .si-log-item:hover { transform: translateX(2px); box-shadow: 0 2px 8px rgba(0,0,0,0.05); border-color: #E2E8F0; }
        .si-log-item::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
        .si-log-clean::before { background: ${C.themePrimary}; }
        .si-log-dirty::before { background: #F59E0B; }
        .si-log-fail::before { background: #EF4444; }

        .si-log-meta { 
            display: flex; justify-content: space-between; align-items: center; 
            font-size: 11px; color: ${C.textSub}; font-family: 'JetBrains Mono', monospace;
        }
        .si-log-id { font-weight: 700; color: #334155; }
        .si-log-cat-pill { 
            background: #F1F5F9; padding: 2px 6px; border-radius: 4px; 
            color: #475569; font-weight: 600; margin-left: 8px; font-size: 10px;
        }
        .si-log-model { margin-left: auto; margin-right: 12px; font-weight: 600; }
        .si-log-time { font-weight: 700; color: ${C.textMain}; }
        .si-log-time.slow { color: #D97706; }

        .si-log-metrics { display: flex; align-items: center; gap: 12px; font-size: 11px; }
        .si-metric-group { display: flex; align-items: center; gap: 4px; }
        .si-metric-label { color: #94A3B8; text-transform: uppercase; font-size: 9px; font-weight: 700; }
        .si-metric-val { font-family: 'JetBrains Mono', monospace; font-weight: 600; }
        .si-metric-val.p { color: ${C.themePrimary}; } 
        .si-metric-val.c { color: ${C.themeSecondary}; }
        .si-metric-val.t { color: ${C.textMain}; font-weight: 700; }

        /* 内容区交互优化：水平滚动+文本选取 */
        .si-log-content {
            font-size: 12px; color: #64748B; background: #FAFAFA;
            padding: 6px 8px; border-radius: 4px; 
            border: 1px solid #F8FAFC;
            
            white-space: nowrap; 
            overflow-x: auto; 
            overflow-y: hidden;
            
            /* 关键修复：防止撑破父容器 */
            max-width: 100%;
            min-width: 0; 
            
            cursor: text;
            user-select: text; 
            -webkit-user-select: text;

            scrollbar-width: none; 
        }
        .si-log-content::-webkit-scrollbar { display: none; }
        
        .si-log-content span { opacity: 0.5; margin-right: 6px; font-size: 10px; user-select: none; }

        /* --- Mobile Optimization (Layout Fix) --- */
        @media (max-width: 768px) {
            .si-container { background-position: 10px 0; padding-left: 0; }
            .si-section { padding-left: 24px; margin-bottom: 24px; }
            .si-section::before { left: 5px; } 

            .si-super-card { margin-left: 0; border-radius: 8px; } 
            .si-sc-header { padding: 16px; }
            .si-sc-big-num { font-size: 28px; }
            .si-sc-body { padding: 16px 0; }
            .si-stat-box { padding: 0 16px; }
            .si-sc-footer { padding: 10px 16px; }
            
            .si-chart-body { height: 240px; }
            .si-matrix-container { grid-template-columns: 1fr; }
            
            /* 修复：Meta 信息布局重构 */
            .si-log-meta { 
                flex-wrap: wrap; 
                row-gap: 6px; /* 行间距 */
            } 
            
            /* 第一行：ID 和 类别 */
            .si-log-meta > div:first-child { 
                width: 100%; 
                display: flex;
                align-items: center;
            } 
            
            /* 第二行：模型名（左对齐） + 耗时（右对齐） */
            .si-log-model { 
                margin-left: 0; 
                flex: 1; /* 占据剩余空间 */
                text-align: left; /* 左对齐！解决割裂感 */
                color: #94A3B8; /* 稍微变淡，区分层级 */
                font-size: 10px;
                margin-right: 8px; 
                overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            .si-log-time { 
                flex-shrink: 0; 
            }
        }
    `;
    document.head.appendChild(style);
})();

// ================= 3. 核心逻辑库 =================
window.SmartInputKit = {
    
    sys: {
        async loadECharts(app) {
            if (window.echarts) return true;
            const file = app.vault.getAbstractFileByPath(CONFIG.ECHARTS_PATH);
            if (!file) return false;
            const content = await app.vault.read(file);
            const script = document.createElement('script');
            script.textContent = content;
            document.head.appendChild(script);
            return new Promise(resolve => {
                let check = setInterval(() => {
                    if (window.echarts) { clearInterval(check); resolve(true); }
                }, 50);
            });
        },
        isMobile() { return window.innerWidth <= 768; }
    },

    data: {
        parseLog(content) {
            if (!content) return [];
            const lines = content.split(/\r?\n/);
            const records = [];
            const regex = /^-\s*(\d{8,12})\s*\|\s*类别:\s*([^|]+?)\s*\|\s*s1:\s*(\d+)\((\d+)\/(\d+)\).*?\|\s*s2:\s*(\d+)\((\d+)\/(\d+)\).*?\|\s*total:\s*(\d+).*?\|\s*输入:\s*(.*)$/;
            
            for (const line of lines) {
                const m = regex.exec(line);
                if (!m) continue;

                const category = (m[2] || '').trim() || "未知分类";
                
                const timeMatch = /耗时:\s*([0-9]+(?:\.[0-9]+)?)s/.exec(line);
                const modelMatch = /模型:\s*([^|]+?)(?:\s*\|\s*|$)/.exec(line);
                const timeCost = timeMatch ? parseFloat(timeMatch[1]) : null;
                const modelName = modelMatch ? (modelMatch[1] || '').trim() : '';
                const inputContent = (m[10] || '').trim();
                
                // 状态判断
                let status = 'clean';
                if (!timeCost || timeCost > CONFIG.TIME_THRESHOLD_SECONDS) status = 'dirty';
                if (modelName === '调用失败') status = 'fail';

                let isClean = (status === 'clean');

                const s1 = { total: parseInt(m[3])||0, prompt: parseInt(m[4])||0, comp: parseInt(m[5])||0 };
                const s2 = { total: parseInt(m[6])||0, prompt: parseInt(m[7])||0, comp: parseInt(m[8])||0 };
                const total = parseInt(m[9]) || 0;

                records.push({
                    id: m[1],
                    dateStr: this.formatDateId(m[1]),
                    dateObj: this.parseIdToDate(m[1]),
                    category: category,
                    s1: s1, s2: s2,
                    total: total,
                    totalPrompt: s1.prompt + s2.prompt, 
                    totalCompletion: s1.comp + s2.comp,
                    timeCost: timeCost,
                    modelName: modelName,
                    isClean: isClean,
                    status: status,
                    input: inputContent
                });
            }
            return records.sort((a, b) => a.dateObj - b.dateObj);
        },

        parseIdToDate(id) {
            const yy = 2000 + parseInt(id.slice(0, 2));
            const mm = parseInt(id.slice(2, 4)) - 1;
            const dd = parseInt(id.slice(4, 6));
            const hh = parseInt(id.slice(6, 8)) || 0;
            const min = parseInt(id.slice(8, 10)) || 0;
            return new Date(yy, mm, dd, hh, min);
        },

        formatDateId(id) {
            const yy = 2000 + parseInt(id.slice(0, 2));
            const mm = String(parseInt(id.slice(2, 4))).padStart(2, '0');
            const dd = String(parseInt(id.slice(4, 6))).padStart(2, '0');
            return `${yy}-${mm}-${dd}`;
        },

        calcKPI(records) {
            if (!records.length) return null;
            const totalTokens = records.reduce((acc, r) => acc + r.total, 0);
            const totalPrompt = records.reduce((acc, r) => acc + r.totalPrompt, 0);
            const totalCompletion = records.reduce((acc, r) => acc + r.totalCompletion, 0);
            
            const uniqueDays = new Set(records.map(r => r.dateStr)).size;
            const avgDaily = uniqueDays > 0 ? Math.round(totalTokens / uniqueDays) : 0;
            const ioRatio = totalCompletion > 0 ? (totalPrompt / totalCompletion).toFixed(2) : "∞";

            const validModelRecords = records.filter(r => r.modelName && r.modelName !== '调用失败' && r.modelName !== '未知模型');
            const modelCounts = {};
            validModelRecords.forEach(r => {
                modelCounts[r.modelName] = (modelCounts[r.modelName] || 0) + 1;
            });

            let domModel = "暂无数据";
            let maxCount = 0;
            for (const [m, c] of Object.entries(modelCounts)) {
                if (c > maxCount) { maxCount = c; domModel = m; }
            }
            const domShare = validModelRecords.length > 0 ? Math.round((maxCount / validModelRecords.length) * 100) : 0;

            return { totalTokens, totalPrompt, totalCompletion, avgDaily, activeDays: uniqueDays, ioRatio, domModel, domShare };
        },

        groupByDate(records) {
            const map = new Map();
            records.forEach(r => {
                const k = r.dateStr.slice(5);
                if (!map.has(k)) map.set(k, { s1: 0, s2: 0 });
                const d = map.get(k);
                d.s1 += r.s1.total; 
                d.s2 += r.s2.total; 
            });
            return Array.from(map.entries()).map(([date, val]) => ({ date, s1: val.s1, s2: val.s2 }));
        },

        groupByCategory(records) {
            const map = new Map();
            let grandTotal = 0;
            records.forEach(r => {
                const k = r.category;
                if (!map.has(k)) map.set(k, 0);
                map.set(k, map.get(k) + r.total);
                grandTotal += r.total;
            });
            
            const sorted = Array.from(map.entries())
                .map(([name, value]) => ({ 
                    name, value,
                    percent: ((value / grandTotal) * 100).toFixed(1) 
                }))
                .sort((a, b) => b.value - a.value);

            return sorted.map((item, index) => {
                let color;
                if (index === 0) color = CONFIG.COLORS.treemapFixed[0]; 
                else if (index === 1) color = CONFIG.COLORS.treemapFixed[1]; 
                
                return { ...item, itemStyle: color ? { color: color } : {} };
            });
        },

        calcPerformance(records) {
            const catMap = {};
            records.forEach(r => {
                if (r.category === '未知分类' || r.category === 'unknown') return;
                if (!r.isClean) return;
                
                if (!catMap[r.category]) catMap[r.category] = { modelStats: {}, totalCount: 0 };
                catMap[r.category].totalCount += 1;
                
                if (!catMap[r.category].modelStats[r.modelName]) catMap[r.category].modelStats[r.modelName] = { sum: 0, count: 0 };
                catMap[r.category].modelStats[r.modelName].sum += r.timeCost;
                catMap[r.category].modelStats[r.modelName].count += 1;
            });

            let result = [];
            for (const [catName, data] of Object.entries(catMap)) {
                const modelList = [];
                for (const [mName, stats] of Object.entries(data.modelStats)) {
                    modelList.push({ name: mName, avg: parseFloat((stats.sum / stats.count).toFixed(1)) });
                }
                if (modelList.length === 0) continue;

                modelList.sort((a, b) => a.avg - b.avg);
                const maxTime = Math.max(...modelList.map(m => m.avg));
                
                result.push({
                    category: catName,
                    totalDataCount: data.totalCount,
                    count: modelList.length,
                    models: modelList.map((m, idx) => ({
                        name: m.name, avg: m.avg, pct: (m.avg / maxTime) * 100, isFastest: idx === 0
                    }))
                });
            }

            result = result.filter(group => group.count >= 2);
            result.sort((a, b) => {
                if (a.category === '杂项记录') return 1;
                if (b.category === '杂项记录') return -1;
                if (b.count !== a.count) return b.count - a.count;
                return b.totalDataCount - a.totalDataCount;
            });

            return result;
        }
    },

    // --- 渲染模块 ---
    render: {
        
        overview(container, records) {
            const kpi = window.SmartInputKit.data.calcKPI(records);
            if (!kpi) return;

            const html = `
                <div class="si-super-card">
                    <div class="si-sc-header">
                        <div class="si-sc-title-area">
                            <h2>智能录入中枢</h2>
                            <p>SYSTEM ONLINE</p>
                        </div>
                        <div class="si-sc-total-area">
                            <div class="si-sc-big-num">${parseInt(kpi.totalTokens).toLocaleString()}</div>
                            <div class="si-sc-label">Token 累计消耗</div>
                        </div>
                    </div>
                    <div class="si-sc-body">
                        <div class="si-stat-box">
                            <div class="si-stat-title">日均消耗</div>
                            <div class="si-stat-val">${parseInt(kpi.avgDaily).toLocaleString()}</div>
                            <div class="si-stat-sub">活跃: ${kpi.activeDays}天</div>
                        </div>
                        <div class="si-sc-divider"></div>
                        <div class="si-stat-box">
                            <div class="si-stat-title">投入产出比</div>
                            <div class="si-stat-val">${kpi.ioRatio} : 1</div>
                            <div class="si-stat-sub">入:${(kpi.totalPrompt/1000).toFixed(0)}k / 出:${(kpi.totalCompletion/1000).toFixed(0)}k</div>
                        </div>
                    </div>
                    <div class="si-sc-footer">
                        <div class="si-model-left">
                            <div class="si-model-label">主力模型</div>
                            <div class="si-model-val">${kpi.domModel}</div>
                        </div>
                        <div class="si-model-right">
                            <div class="si-model-pill">占比 ${kpi.domShare}%</div>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML = html;
        },

        async charts(containerId, records) {
            const parent = document.getElementById(containerId);
            if (!parent || !window.echarts) return;

            const trendData = window.SmartInputKit.data.groupByDate(records);
            const costData = window.SmartInputKit.data.groupByCategory(records);
            const C = CONFIG.COLORS;
            const isM = window.SmartInputKit.sys.isMobile();

            // 1. Trend Chart
            const trendSection = document.createElement("div");
            trendSection.className = "si-section";
            trendSection.innerHTML = `<div class="si-chart-header"><span class="si-chart-title">每日流量监测 (Purple/Blue)</span></div><div class="si-chart-body" id="si-trend-chart"></div>`;
            parent.appendChild(trendSection);

            // 2. Treemap
            const costSection = document.createElement("div");
            costSection.className = "si-section";
            costSection.innerHTML = `<div class="si-chart-header"><span class="si-chart-title">成本构成占比</span></div><div class="si-chart-body" id="si-treemap-chart"></div>`;
            parent.appendChild(costSection);

            // 3. Matrix
            const matrixHtml = this.renderMatrix(records);
            const matrixSection = document.createElement("div");
            matrixSection.className = "si-section";
            matrixSection.innerHTML = matrixHtml;
            parent.appendChild(matrixSection);

            // --- ECharts Init ---
            const trendChart = echarts.init(document.getElementById("si-trend-chart"));
            const trendOption = {
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                legend: { top: 0, right: 0, itemWidth: 10, itemHeight: 10, textStyle: { color: C.textSub } },
                grid: { left: 5, right: 10, bottom: 20, top: 30, containLabel: true },
                dataZoom: [{ type: 'inside', start: 70, end: 100 }],
                xAxis: { type: 'category', data: trendData.map(d => d.date), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: C.textSub, fontSize: 10 } },
                yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#E5E7EB' } }, axisLabel: { formatter: (v) => v >= 1000 ? (v/1000).toFixed(0)+'k' : v } },
                series: [
                    { name: 'S1阶段', type: 'bar', stack: 'total', data: trendData.map(d => d.s1), itemStyle: { color: C.themePrimary, borderRadius: [0,0,2,2] } },
                    { name: 'S2阶段', type: 'bar', stack: 'total', data: trendData.map(d => d.s2), itemStyle: { color: C.themeSecondary, borderRadius: [2,2,0,0] } }
                ]
            };
            trendChart.setOption(trendOption);

            const treeChart = echarts.init(document.getElementById("si-treemap-chart"));
            const treeOption = {
                tooltip: { formatter: '{b}: {c} Tokens' },
                series: [{
                    type: 'treemap', width: '100%', height: '100%', left: 0, right: 0, top: 0, bottom: 0, breadcrumb: { show: false }, roam: false, nodeClick: false,
                    label: { show: true, formatter: function(params) { if (params.data.percent < 3) return ''; return `${params.name}\n${params.data.percent}%`; }, fontSize: isM ? 9 : 11, fontWeight: 'bold' },
                    itemStyle: { borderColor: '#fff', borderWidth: 1, gapWidth: 1 },
                    data: costData
                }]
            };
            treeChart.setOption(treeOption);
            window.addEventListener("resize", () => { trendChart.resize(); treeChart.resize(); });
        },

        renderMatrix(records) {
            const data = window.SmartInputKit.data.calcPerformance(records);
            const C = CONFIG.COLORS;
            let html = `<div class="si-chart-header"><span class="si-chart-title">模型-类别 性能矩阵</span></div><div class="si-matrix-container">`;
            data.forEach(group => {
                html += `<div class="si-matrix-card"><div class="si-matrix-head"><span class="si-matrix-title">${group.category}</span><span class="si-matrix-count">${group.count}个模型</span></div><div class="si-matrix-body">`;
                group.models.forEach(m => {
                    const barColor = m.isFastest ? C.barGold : C.barNormal; 
                    const tag = m.isFastest ? `<span class="si-tag-fastest">⚡FAST</span>` : ``;
                    html += `<div class="si-model-row"><div class="si-model-name" title="${m.name}">${m.name}</div><div class="si-track"><div class="si-bar" style="width: ${m.pct}%; background: ${barColor};"></div></div>${tag}<div class="si-time">${m.avg}s</div></div>`;
                });
                html += `</div></div>`;
            });
            html += `</div>`;
            return html;
        },

        renderRecentLogs(container, records) {
            const recent = records.slice(-CONFIG.RECENT_LOG_COUNT).reverse();
            let html = `
                <div class="si-section">
                    <div class="si-chart-header">
                        <span class="si-chart-title">实时监测日志 (Debug Stream)</span>
                    </div>
                    <div class="si-log-list">
            `;
            recent.forEach(r => {
                const statusClass = r.status === 'clean' ? 'si-log-clean' : (r.status === 'fail' ? 'si-log-fail' : 'si-log-dirty');
                const timeStr = r.timeCost ? `${r.timeCost}s` : 'N/A';
                const timeClass = r.isClean ? '' : 'slow';

                html += `
                    <div class="si-log-item ${statusClass}">
                        <div class="si-log-meta">
                            <div>
                                <span class="si-log-id">${r.id}</span>
                                <span class="si-log-cat-pill">${r.category}</span>
                            </div>
                            <span class="si-log-model">${r.modelName || 'Unknown Model'}</span>
                            <span class="si-log-time ${timeClass}">${timeStr}</span>
                        </div>
                        
                        <div class="si-log-metrics">
                            <div class="si-metric-group">
                                <span class="si-metric-label">Token</span>
                                <span class="si-metric-val t">${r.total}</span>
                            </div>
                            <div class="si-metric-group" style="opacity:0.7">
                                <span class="si-metric-label">S1</span>
                                <span class="si-metric-val p">${r.s1.total}</span>
                            </div>
                            <div class="si-metric-group" style="opacity:0.7">
                                <span class="si-metric-label">S2</span>
                                <span class="si-metric-val c">${r.s2.total}</span>
                            </div>
                        </div>

                        <div class="si-log-content">
                            <span>Input:</span>${r.input || '(无内容)'}
                        </div>
                    </div>
                `;
            });
            html += `</div></div>`;
            container.insertAdjacentHTML('beforeend', html);
        },

        async main(dv) {
            try {
                const hasECharts = await window.SmartInputKit.sys.loadECharts(app);
                if (!hasECharts) { dv.paragraph("❌ ECharts 未找到"); return; }
                
                // 聚合读取逻辑：扫描目录 -> 过滤 -> 并发读取 -> 合并
                const dirPath = CONFIG.DATA_DIR;
                if (!dirPath) {
                    dv.paragraph("❌ 配置错误：CONFIG.DATA_DIR 未定义");
                    return;
                }

                const adapter = app.vault.adapter;
                
                if (!(await adapter.exists(dirPath))) {
                    dv.paragraph(`❌ 日志目录未找到: ${dirPath}`);
                    return;
                }

                const listResult = await adapter.list(dirPath);
                const files = listResult.files.filter(f => {
                    const name = f.split('/').pop();
                    // 匹配 SIPLog_YYYY-MM.md 或 SIPLog_History.md
                    return name.startsWith('SIPLog_') && name.endsWith('.md');
                });

                if (files.length === 0) {
                    dv.paragraph("⚠️ 未发现日志文件");
                    return;
                }

                // 并发读取所有文件
                const contentPromises = files.map(f => adapter.read(f));
                const contents = await Promise.all(contentPromises);
                const allContent = contents.join('\n');

                const records = window.SmartInputKit.data.parseLog(allContent);

                const container = document.createElement("div");
                container.className = "si-container";
                dv.container.appendChild(container);

                this.overview(container, records);
                this.renderRecentLogs(container, records);

                // Re-ordered: Charts at the bottom
                const chartsArea = document.createElement("div");
                chartsArea.id = "si-charts-area";
                container.appendChild(chartsArea);
                this.charts("si-charts-area", records);
            } catch (e) {
                dv.paragraph(`❌ 渲染发生严重错误: ${e.message}`);
                console.error("SmartInputKit Render Error:", e);
            }
        }
    }
};