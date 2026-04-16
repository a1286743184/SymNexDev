/**
 * TaskDashboardKit.js v4.2
 * Modern Task Management Dashboard
 * 现代化任务看板核心库 - 包含逻辑处理与视觉渲染
 * 
 * [ARCH NOTE] 本文件是今日聚焦看板的唯一渲染逻辑来源。
 * 请勿在 main.js 中修改渲染逻辑。
 * 
 * Update: v4.4.0
 * - 安全：添加 XSS 过滤和输入转义函数 (Security: XSS filtering and input escaping)
 * - 性能：将内联样式迁移到 CSS 类 (Performance: Migrate inline styles to CSS classes)
 * 
 * Update: v4.3.4
 * - 修复：彻底解决日期标题中的 `undefined` 问题 (Simplify check for string literal "undefined")
 * - 优化：改进折叠间距控制，使用 removeProperty 恢复默认状态，避免样式冲突 (Clean style manipulation)
 */

// ==========================================
// 安全工具函数 (Security Utilities)
// ==========================================

const SecurityUtils = {
    escapeHtml: function(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/\//g, '&#x2F;');
    },
    
    escapeHtmlAttr: function(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },
    
    sanitizeText: function(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    },
    
    safeInnerHTML: function(element, html) {
        if (!element) return;
        const sanitized = this.sanitizeText(html);
        element.innerHTML = sanitized;
    },
    
    createSafeElement: function(tag, className, textContent) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (textContent) el.textContent = textContent;
        return el;
    }
};

const CONFIG = {
    // 基础配色
    COLORS: {
        bg: "transparent",
        textMain: "#111827",
        textSub: "#64748B",
        primary: "#7C3AED", // Purple
        secondary: "#2563EB", // Blue
        danger: "#EF4444", // Red
        success: "#10B981", // Green
        warning: "#F59E0B", // Orange
        border: "rgba(0,0,0,0.06)",
        cardBg: "#FFFFFF",
        
        // [新增] 图标颜色配置
        iconDelete: "#e1e8f4ff", // 删除图标颜色 (Default: Slate 400)
        iconToggle: "#e1e8f4ff"  // 折叠图标颜色 (Default: Slate 500)
    },
    
    // ==========================================
    // 配置区域 (Configuration)
    // ==========================================
    LAYOUT: {
        // --- 1. 通用/电脑端配置 (Desktop/Common) ---
        timelineLeft: "14px",   // [通用] 时间轴竖线左侧距离
        dotLeft: "7px",         // [通用] 时间轴圆点左侧距离
        
        // [缩进控制] 
        // 建议值: 35px (保持对齐复选框后的文本)
        metaIndent: "35px",
        remarkIndent: "35px", // 备注框缩进 (与metaIndent一致，依靠边框和padding对齐)

        // [字体设置]
        metaFontSize: "10px",   // [新增] 元数据字号 (标签/日期/Pill)
        
        // [间距控制]
        taskListPadding: "2px 0",  // 列表整体垂直间距 (控制列表首尾与容器的距离)
        taskItemPadding: "2px 0",  // 单个任务项的垂直间距 (控制任务之间的疏密)
        
        // [新增] 卡片内部间距 (控制首尾任务与卡片边缘的距离)
        cardPaddingTop: "0px",    // 标题下方 -> 第一个任务
        cardPaddingBottom: "0px", // 最后一个任务 -> 卡片底部

        // --- 2. 移动端/安卓配置 (Mobile/Android) ---
        mobile: {
            // [字体与排版]
            baseFontSize: "13px",       // 基础字号
            headerTitleSize: "20px",    // 标题字号
            metaFontSize: "6px",       // [新增] 元数据字号 (标签/日期/Pill)
            
            // [间距与布局]
            sectionMarginLeft: "18px",  // 板块左边距
            timelineLeft: "8px",        // [移动端] 时间轴竖线位置
            dotLeft: "0px",             // [移动端] 时间轴圆点位置
            cardPadding: "10px 10px",   // 卡片内边距 (左右)
            cardPaddingTop: "2px",
            cardPaddingBottom: "2px",
            
            // [筛选栏]
            filterGap: "8px",           // 筛选按钮间距
            filterPaddingLeft: "0px",   // 筛选栏左侧缩进
            
            // [缩进控制]
            metaIndent: "24px",
            remarkIndent: "24px",       // 移动端备注缩进
            
            // [复选框]
            checkboxSize: "16px",       
            checkboxMarginRight: "0px", 
            
            // [任务样式]
            taskFontSize: "14px",       
            taskPadding: "2px 0",       // 任务行垂直间距
            taskContentPadding: "0 2px",// 任务内容左右内边距
            
            // [列表间距]
            taskListPadding: "2px 0",
            
            // [备注样式]
            remarkFontSize: "12px",     
            remarkColor: "#64748B"      
        }
    },

    // 图标定义 (SVG Path)
    ICONS: {
        calendar: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
        clock: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
        repeat: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>',
        priorityHigh: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        priorityLow: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>',
        remarkBullet: '<svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="8"/></svg>'
    },

    TAG_PALETTE: [
        { bg: "#EEF7F0", fg: "#2F6B4F", border: "#BFE3CD" },  // Sage
        { bg: "#FFF3DB", fg: "#8A5A00", border: "#F4D18B" },  // Sand
        { bg: "#E9F7F6", fg: "#1F6A69", border: "#A7DED9" },  // Teal
        { bg: "#F3F7E8", fg: "#5B6B2E", border: "#D6E5AE" },  // Olive
        { bg: "#F9F2E7", fg: "#7A4A1E", border: "#E7CDB3" },  // Biscuit
        { bg: "#E7FBF5", fg: "#0F766E", border: "#99F6E4" },  // Aqua-green
        { bg: "#FFF8E6", fg: "#8A3B12", border: "#F3C5A7" },  // Apricot
        { bg: "#EDF8F3", fg: "#2C6E5A", border: "#BFE5D6" },  // Mint
        { bg: "#FFFBEA", fg: "#9A6B00", border: "#FDE68A" },  // Light mustard
        { bg: "#F7EFEA", fg: "#7A3E2C", border: "#E5C1B1" },  // Clay
        { bg: "#EAFBEF", fg: "#1F7A3B", border: "#A7E9BF" },  // Green
        { bg: "#F6FAE8", fg: "#617A0F", border: "#DDEBA7" },  // Lime-olive
        { bg: "#FFF0ED", fg: "#8C3A2B", border: "#F4B4A7" },  // Terracotta (muted)
        { bg: "#F4F3E6", fg: "#6B5D2E", border: "#DDD4A5" },  // Khaki
        { bg: "#E6FBF7", fg: "#0F5F5A", border: "#8FE7DA" }   // Seafoam
    ],

    TASK_SOURCES: {
        folders: [
            "05-生活坐标系统/01-角色档案",
            "01-经纬矩阵系统/02-周委托模块"],
        extraFiles: [
            "01-经纬矩阵系统/04-规律性事项模块/规律性事项列表.md",
            "01-经纬矩阵系统/03-备忘提醒模块/备忘录.md",
            "01-经纬矩阵系统/08-智能录入模块/01-INBOX.md",
            "01-经纬矩阵系统/08-智能录入模块/02-Require.md",
            "07-项目系统/01-公务员考试/学习计划/公考学习计划.md"
        ],
        excludePathIncludes: ["99-周委托归档", "99-附件"],
        includeLatestExamPlan: false
    }
};

// ==========================================
// 预编译正则表达式 (Pre-compiled Regex Patterns)
// 性能优化：避免每次调用时重新编译正则表达式
// ==========================================
const REGEX = {
    tag: /#([\w\u4e00-\u9fa5\-\/]+)/g,
    due: /📅\s*(\d{4}-\d{1,2}-\d{1,2})/g,
    time: /\[[^\[\]]+?\]/g,
    recurrence: /🔁\s*([a-zA-Z0-9\s]+?)(?=\s*[📅⏳🛫✅]|$)/g,
    priority: /[🔺🔼🔽⏬]/g,
    completion: /✅\s*\d{4}-\d{1,2}-\d{1,2}/g,
    startScheduled: /[⏳🛫]\s*(\d{4}-\d{1,2}-\d{1,2})/g,
    everyDay: /^every day$/i,
    everyWeek: /^every week$/i,
    everyMonth: /^every month$/i,
    everyYear: /^every year$/i,
    everyDays: /^every (\d+) days?$/i
};

// ================= 1. 样式注入系统 =================
(function initStyles() {
    const styleId = "task-dashboard-kit-style-v4";
    if (document.getElementById(styleId)) return;
    
    const C = CONFIG.COLORS;
    const L = CONFIG.LAYOUT;
    const M = L.mobile;
    
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
        /* --- 容器基础 --- */
        .td-container { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            max-width: 100%; 
            overflow-x: hidden; 
            /* Timeline moved to .td-timeline-wrapper::before */
            padding: 0 0 40px 0; 
            box-sizing: border-box;
            color: ${C.textMain};
            position: relative;
        }

        /* --- 时间轴容器 (Wrapper) --- */
        .td-timeline-wrapper {
            position: relative;
            padding-bottom: 20px;
        }
        /* 时间轴竖线 */
        .td-timeline-wrapper::before {
            content: ""; 
            position: absolute; 
            top: -30px; /* 向上延伸至 Banner (Banner margin-bottom=24px, 留余量) */
            bottom: 50px; 
            left: ${L.timelineLeft}; 
            width: 2px; 
            background: linear-gradient(to bottom, #9481e2ff, #E2E8F0);
            z-index: 0;
        }
        
        /* --- 头部卡片 (Banner - V2 Redesign) --- */
        .td-header-card {
            /* 活力紫粉渐变 (参考 PuppyProfile) */
            background: linear-gradient(135deg, #7C3AED 0%, #9061f3 100%);
            border-radius: 20px;
            padding: 24px 28px;
            color: white;
            margin-bottom: 24px;
            box-shadow: 0 3px 8px -2px rgba(124, 58, 237, 0.4); /* 阴影再次减半 */
            position: relative;
            /* Update: z-index higher than timeline line */
            z-index: 10;
            overflow: hidden;
            display: flex;
            flex-direction: column; 
            justify-content: space-between;
            min-height: 120px; 
            border: 1px solid rgba(255,255,255,0.15);
        }
        
        /* 装饰光晕 */
        .td-header-card::before {
            content: ""; position: absolute; top: -30%; right: -10%; width: 250px; height: 250px;
            background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%);
            border-radius: 50%; pointer-events: none; filter: blur(30px);
            z-index: 0;
        }
        .td-header-card::after {
            content: ""; position: absolute; bottom: -20%; left: -10%; width: 200px; height: 200px;
            background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
            border-radius: 50%; pointer-events: none; filter: blur(40px);
            z-index: 0;
        }

        /* 布局容器 */
        .td-header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            width: 100%;
            z-index: 2;
            margin-bottom: 20px;
        }
        
        /* 标题区域 */
        .td-title-area h1 { 
            margin: 0; 
            font-size: 28px; /* 更大标题 */
            font-weight: 800; 
            color: white; 
            letter-spacing: -0.5px; 
            line-height: 1.1; 
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .td-title-area p { 
            margin: 6px 0 0 0; 
            font-size: 13px; 
            color: rgba(255,255,255,0.9); 
            font-weight: 500;
            opacity: 0.8;
        }

        /* 日期显示 (大字号无框风格) */
        .td-date-badge {
            background: transparent;
            border: none;
            padding: 0;
            font-family: 'Inter', sans-serif; /* 选用现代字体 */
            font-weight: 800;
            font-size: 32px; /* 巨大字号 */
            color: rgba(255,255,255,0.95);
            text-shadow: 0 2px 10px rgba(0,0,0,0.15);
            line-height: 1;
            letter-spacing: -1px;
            backdrop-filter: none;
            box-shadow: none;
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }
        .td-date-badge span.year {
            font-size: 12px;
            font-weight: 600;
            opacity: 0.7;
            letter-spacing: 1px;
            margin-bottom: 2px;
            display: block;
        }

        /* --- 筛选栏 (通透幽灵风格) --- */
        .td-filter-bar {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            z-index: 2;
            padding-left: 0; 
            margin-top: auto; /* 推到底部 */
        }
        
        /* 下拉框 (Ghost Button Style) */
        .td-select {
            background: transparent; /* 完全透明 */
            border: none;
            border-bottom: 2px solid rgba(255,255,255,0.3); /* 仅保留底部线条 */
            border-radius: 0;
            padding: 4px 20px 4px 0; /* 左侧无padding */
            font-size: 13px;
            color: rgba(255,255,255,0.95);
            font-weight: 600;
            outline: none;
            cursor: pointer;
            transition: border-color 200ms ease, color 200ms ease, transform 200ms ease, box-shadow 200ms ease;
            appearance: none;
            -webkit-appearance: none;
            
            /* 极简箭头 (Chevron Down) */
            background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%224%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E");
            background-repeat: no-repeat;
            background-position: right 0 center;
            background-size: 10px auto;
            
            backdrop-filter: none;
            box-shadow: none;
        }
        .td-select:hover, .td-select:focus { 
            border-bottom-color: rgba(255,255,255,0.8);
            color: white;
            transform: translateY(-1px);
            background-color: transparent; /* 防止变白 */
            outline: none;
        }
        .td-select:focus-visible {
            border-bottom-color: rgba(255,255,255,0.9);
            box-shadow: 0 6px 14px rgba(255, 255, 255, 0.18);
        }
        .td-select:active { transform: translateY(0); }
        .td-select option { 
            background: #fff; 
            color: #333; 
            font-weight: 500;
        }

        /* --- 任务卡片 --- */
        .td-section {
            margin-bottom: 16px;
            padding-left: calc(${L.timelineLeft} + 20px);
            position: relative;
        }
        .td-section::before {
            content: ""; position: absolute; left: ${L.dotLeft}; top: 16px;
            width: 12px; height: 12px; border-radius: 50%;
            background: #FFFFFF; border: 3px solid #CBD5E1;
            box-shadow: 0 0 0 2px #F8FAFC; z-index: 1;
            transition: all 0.3s;
            /* Update: 垂直居中对齐标题 (Assuming Header height ~40px) */
            /* Actually header padding is 10px top/bottom + font size. Let's adjust top */
            /* Header height: 10+10+13*1.5 ~ 40px. Center is 20px. Circle is 12px. Top should be ~14px */
            top: 14px; 
        }
        
        /* 状态颜色指示 */
        .td-section.overdue::before { border-color: ${C.danger}; }
        .td-section.today::before { border-color: ${C.primary}; }
        .td-section.forecast::before { border-color: ${C.secondary}; }
        .td-section.completed::before { border-color: ${C.success}; }

        .td-card {
            background: #FFFFFF;
            border-radius: 10px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            border: 1px solid #F1F5F9;
            overflow: hidden;
            transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms ease, border-color 220ms ease;
        }
        .td-card:hover { box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08); transform: translateY(-2px); border-color: #E2E8F0; }

        .td-card-header {
            padding: 10px 16px;
            background: #FAFAFA;
            border-bottom: 1px solid #F1F5F9;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .td-card-title {
            font-size: 13px;
            font-weight: 700;
            color: ${C.textMain};
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
            min-width: 0;
        }
        .td-count-badge {
            background: #E2E8F0;
            color: ${C.textSub};
            font-size: 10px;
            padding: 0 6px; /* Reduced vertical padding */
            border-radius: 99px;
            font-weight: 600;
            
            /* Align height with left circle (12px) */
            height: 12px;
            line-height: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 12px;
            box-sizing: content-box; /* ensure padding adds to width but height is controlled */
        }
        
        /* Count Badge Coloring (Active) */
        .td-section.overdue .td-count-badge.has-items { background: ${C.danger}; color: white; }
        .td-section.today .td-count-badge.has-items { background: ${C.primary}; color: white; }
        .td-section.forecast .td-count-badge.has-items { background: ${C.secondary}; color: white; }
        .td-section.completed .td-count-badge.has-items { background: ${C.success}; color: white; }

        .td-card-body {
            padding: ${L.cardPaddingTop} 16px ${L.cardPaddingBottom} 16px; /* 使用配置的上下间距 */
        }

        /* --- 任务列表样式覆写 (紧凑化) --- */
        .td-card-body ul.contains-task-list {
            padding-left: 0;
            margin: 0;
            padding: ${L.taskListPadding}; /* 应用列表整体间距 */
        }
        .td-card-body li.task-list-item {
            list-style: none;
            border-bottom: 1px dashed #CBD5E1; /* 加深分隔线颜色 */
            display: block; 
            padding: ${L.taskItemPadding}; /* 应用单项间距 */
            margin-left: 0 !important;
            transition: background 180ms ease, border-color 180ms ease, transform 180ms ease;
        }
        .td-card-body li.task-list-item:hover { background: #F8FAFC; border-bottom-color: #E2E8F0; transform: translateY(-1px); }
        .td-card-body li.task-list-item:last-child { border-bottom: none; }
        .td-task-motion {
            transition: transform 360ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms ease-out;
            will-change: transform, opacity;
            backface-visibility: hidden;
            transform-origin: center left;
        }
        .td-task-enter {
            transform: translate3d(0, 8px, 0);
            opacity: 0;
            transition: transform 360ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms ease-out;
        }
        .td-task-exit-complete {
            transition: transform 220ms ease-in, opacity 200ms ease-in;
            transform: translate3d(0, 8px, 0);
            opacity: 0;
        }
        .td-task-exit-uncomplete {
            transition: transform 220ms ease-in, opacity 200ms ease-in;
            transform: translate3d(0, -8px, 0);
            opacity: 0;
        }
        .td-task-exit-delete {
            transition: transform 240ms ease-in, opacity 220ms ease-in;
            transform: translate3d(16px, 0, 0);
            opacity: 0;
        }
        .td-task-delete-anim {
            opacity: 0.7;
        }
        .td-task-delete-anim .list-item-part {
            text-decoration: line-through;
            color: #94A3B8;
        }
        .td-task-delete-anim .td-meta-pill,
        .td-task-delete-anim .td-remark-box {
            opacity: 0.5;
        }
        .td-task-completed-visual .list-item-part {
            text-decoration: line-through;
            color: #94A3B8;
            opacity: 0.6;
            transition: all 200ms ease;
        }
        .td-delete-btn.td-delete-animate {
            color: #EF4444;
            background: #FEE2E2;
            border-radius: 4px;
            position: relative;
        }
        .td-delete-btn.td-delete-animate::after {
            content: "";
            position: absolute;
            left: 50%;
            top: 50%;
            width: 6px;
            height: 6px;
            border-radius: 999px;
            background: rgba(239, 68, 68, 0.35);
            transform: translate(-50%, -50%) scale(1);
            animation: td-delete-pulse 240ms ease forwards;
            pointer-events: none;
        }
        @keyframes td-delete-pulse {
            0% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(6); }
        }
        .td-pill-pulse {
            animation: td-pill-pulse 260ms ease;
        }
        @keyframes td-pill-pulse {
            0% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.25); background: rgba(124, 58, 237, 0.08); }
            60% { box-shadow: 0 0 0 6px rgba(124, 58, 237, 0.12); background: rgba(124, 58, 237, 0.12); }
            100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); background: transparent; }
        }
        .td-task-pulse {
            animation: td-task-pulse 720ms ease-out;
        }
        @keyframes td-task-pulse {
            0% { background: rgba(124, 58, 237, 0.06); box-shadow: inset 0 0 0 1px rgba(124, 58, 237, 0.10); }
            45% { background: rgba(124, 58, 237, 0.12); box-shadow: inset 0 0 0 1px rgba(124, 58, 237, 0.18); }
            100% { background: rgba(124, 58, 237, 0.00); box-shadow: inset 0 0 0 1px rgba(124, 58, 237, 0.00); }
        }
        
        /* Row 1: Main Content */
        .td-task-main-row {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            width: 100%;
        }

        /* Update: 左右侧边框明确，padding微调 */
        .td-remark-box {
            font-size: 12px; 
            color: #64748B; 
            background: #FAFAFA;
            padding: 0 12px;
            border-radius: 4px; 
            border: 0 solid transparent;
            border-left-width: 0; 
            border-right-width: 0;
            white-space: pre-wrap; 
            word-break: break-word;
            overflow-x: visible; 
            overflow-y: visible;
            max-width: 100%;
            min-width: 0; 
            margin-top: 0;
            margin-left: ${L.remarkIndent}; /* 使用统一后的缩进 */
            cursor: text;
            display: block;
            max-height: 0;
            opacity: 0;

            overflow: hidden;
            pointer-events: none;
            /* Simplified Transition: Faster, fewer properties */
            transition: max-height 150ms ease-out, opacity 150ms ease-out, padding 150ms ease, margin-top 150ms ease;
        }
        .td-remark-box.visible { 
            /* Increased padding-bottom from 3px to 12px */
            padding: 6px 12px 12px 12px; 
            border: 1px solid #F8FAFC;
            border-left: 3px solid #E2E8F0; 
            border-right: 3px solid #E2E8F0;
            margin-top: 4px;
            max-height: none; /* Changed from 1200px to none for auto-height */
            opacity: 1;
            /* transform: translateY(0); REMOVED */
            pointer-events: auto;
        }

        /* 子项列表样式优化 (Flex layout for icon + text) */
        .td-remark-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .td-remark-item {
            display: flex;
            align-items: flex-start;
            gap: 6px;
            line-height: 1.5;
        }
        .td-remark-icon {
            flex-shrink: 0;
            width: 6px;
            height: 6px;
            margin-top: 6px; /* Align with text top */
            color: #94A3B8;
            opacity: 0.7;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .td-remark-text {
            flex: 1;
            min-width: 0;
        }

        /* Meta Footer (Tags, Loop, Date) - Bottom Row */
        .td-meta-footer {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 6px;
            padding-left: ${L.metaIndent}; /* 左侧缩进 */
            flex-wrap: wrap;
        }

        /* 展开/收起按钮 */
        .td-toggle-btn {
            opacity: 1; /* Ensure visible */
            color: ${C.iconToggle}; /* Configurable Color */
            cursor: pointer;
            padding: 4px;
            /* margin-left: auto; Handled by wrapper */
            transition: color 160ms ease, background 160ms ease, transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
            display: flex;
            align-items: center;
            transform: rotate(0deg);
        }
        .td-toggle-btn.expanded { transform: rotate(180deg); color: ${C.iconToggle}; }
        
        /* 悬停显示控制 */
        li.task-list-item:hover .td-delete-btn,
        li.task-list-item:hover .td-toggle-btn { opacity: 1; }
        
        .td-toggle-btn:hover { color: ${C.primary}; background: #F3E8FF; border-radius: 4px; transform: rotate(0deg) scale(1.06); box-shadow: 0 2px 6px rgba(124, 58, 237, 0.18); }
        .td-toggle-btn:active { transform: rotate(0deg) scale(0.96); }
        .td-toggle-btn.expanded:hover { transform: rotate(180deg) scale(1.06); }
        .td-toggle-btn.expanded:active { transform: rotate(180deg) scale(0.96); }

        /* 复选框美化 */
        .td-card-body input[type="checkbox"] {
            appearance: none;
            -webkit-appearance: none;
            width: 14px; height: 14px;
            border: 1.5px solid #CBD5E1;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 3px;
            flex-shrink: 0;
            position: relative;
            transition: background 160ms ease, border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
        }
        .td-card-body input[type="checkbox"]:hover {
            border-color: #94A3B8;
            box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.2);
        }
        .td-card-body input[type="checkbox"]:active {
            transform: scale(0.96);
        }
        .td-card-body input[type="checkbox"]:checked {
            background: ${C.success};
            border-color: ${C.success};
        }
        .td-card-body input[type="checkbox"]:checked::after {
            content: "✔";
            color: white;
            font-size: 9px;
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
        }
        
        /* 任务文本优化 */
        .td-card-body .list-item-part {
            flex: 1;
            font-size: 13px;
            line-height: 1.5;
            color: #334155;
            word-break: break-word;
            cursor: pointer;
        }
        
        /* 元数据标签 (日期、循环等) */
        .td-meta-pill {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            font-size: ${L.metaFontSize};
            padding: 1px 6px;
            border-radius: 4px;
            background: #F8FAFC;
            color: ${C.textSub};
            border: 1px solid #E2E8F0;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            white-space: nowrap;
        }
        .td-meta-pill svg { width: 10px; height: 10px; opacity: 0.7; }
        
        /* 状态变色 */
        .td-meta-pill.is-due { color: ${C.textMain}; background: #F1F5F9; }
        .td-meta-pill.is-overdue { color: ${C.danger}; background: #FEF2F2; border-color: #FECACA; }
        .td-meta-pill.is-today { color: ${C.primary}; background: #F3E8FF; border-color: #E9D5FF; }
        .td-meta-pill.is-forecast { color: ${C.secondary}; background: #EFF6FF; border-color: #BFDBFE; }
        .td-meta-pill.is-time { color: #0EA5E9; background: #F0F9FF; border-color: #BAE6FD; }
        .td-meta-pill.is-time-overdue { color: ${C.danger}; background: #FEF2F2; border-color: #FECACA; }
        
        /* 循环任务 - 浅色底 (改为黄色) */
        .td-meta-pill.is-recurring { color: #D97706; background: #FFFBEB; border-color: #FDE68A; }

        /* 完成状态颜色 */
        .td-meta-pill.completed-early { color: #2563EB; background: #EFF6FF; border-color: #BFDBFE; } 
        .td-meta-pill.completed-ontime { color: #7C3AED; background: #F3E8FF; border-color: #E9D5FF; } 
        .td-meta-pill.completed-late { color: #EF4444; background: #FEF2F2; border-color: #FECACA; }

        /* 可点击日期胶囊 */
        .td-meta-pill.clickable-date,
        .td-meta-pill.clickable-time {
            cursor: pointer;
            transition: background 180ms ease, border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
        }
        .td-meta-pill.clickable-date:hover,
        .td-meta-pill.clickable-time:hover {
            background: #E0E7FF;
            border-color: #A5B4FC;
            transform: translateY(-1px) scale(1.02);
            box-shadow: 0 6px 14px rgba(30, 41, 59, 0.15);
        }
        .td-meta-pill.clickable-date:active,
        .td-meta-pill.clickable-time:active {
            transform: translateY(0) scale(0.98);
            box-shadow: 0 2px 6px rgba(30, 41, 59, 0.12);
        }

        /* 日历弹出层 */
        .td-date-picker-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.4);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(2px);
            animation: td-overlay-fade 180ms ease;
        }
        .td-date-picker {
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            padding: 16px;
            min-width: 280px;
            animation: td-date-picker-appear 240ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes td-overlay-fade {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes td-date-picker-appear {
            from { opacity: 0; transform: scale(0.95) translateY(-10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .td-date-picker-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #E2E8F0;
        }
        .td-date-picker-title {
            font-weight: 600;
            font-size: 14px;
            color: #1E293B;
        }
        .td-date-picker-nav {
            display: flex;
            gap: 4px;
        }
        .td-date-picker-nav button {
            background: #F1F5F9;
            border: none;
            border-radius: 6px;
            width: 28px;
            height: 28px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748B;
            transition: background 160ms ease, color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
        }
        .td-date-picker-nav button:hover {
            background: #E2E8F0;
            color: #1E293B;
        }
        .td-date-picker-nav button:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.25);
        }
        .td-date-picker-nav button:active { transform: scale(0.96); box-shadow: 0 2px 6px rgba(15, 23, 42, 0.15); }
        .td-date-picker-weekdays {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
            margin-bottom: 4px;
        }
        .td-date-picker-days .td-date-picker-weekday {
            text-align: center;
            font-size: 11px;
            font-weight: 600;
            color: #94A3B8;
            padding: 4px 0;
        }
        .td-date-picker-days {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
        }
        .td-date-picker-day {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            border-radius: 6px;
            cursor: pointer;
            color: #475569;
            transition: background 160ms ease, color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
        }
        .td-date-picker-day:hover:not(.disabled):not(.other-month) {
            background: #F1F5F9;
            transform: translateY(-1px);
            box-shadow: 0 2px 6px rgba(15, 23, 42, 0.1);
        }
        .td-date-picker-day:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.25);
        }
        .td-date-picker-day:active:not(.disabled):not(.other-month) { transform: translateY(0) scale(0.98); box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12); }
        .td-date-picker-day.other-month {
            color: #CBD5E1;
        }
        .td-date-picker-day.disabled {
            color: #E2E8F0;
            cursor: not-allowed;
        }
        .td-date-picker-day.today {
            font-weight: 700;
            color: #7C3AED;
            border: 1.5px solid #7C3AED;
            background: transparent;
        }
        .td-date-picker-day.selected {
            background: #7C3AED;
            color: white;
            border: 1.5px solid #7C3AED;
        }
        .td-date-picker-footer {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #E2E8F0;
        }
        .td-date-picker-btn {
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            border: none;
            transition: background 160ms ease, color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
        }
        .td-date-picker-btn.cancel {
            background: #F1F5F9;
            color: #64748B;
        }
        .td-date-picker-btn.cancel:hover {
            background: #E2E8F0;
        }
        .td-date-picker-btn.confirm {
            background: #7C3AED;
            color: white;
        }
        .td-date-picker-btn.confirm:hover {
            background: #6D28D9;
        } 
        .td-date-picker-btn:active { transform: scale(0.98); box-shadow: 0 2px 6px rgba(15, 23, 42, 0.15); }
        .td-date-picker-btn:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.25);
        }

        .td-time-picker {
            min-width: 300px;
        }
        .td-time-picker-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #E2E8F0;
        }
        .td-time-picker-title {
            font-weight: 600;
            font-size: 14px;
            color: #1E293B;
        }
        .td-time-picker-note {
            margin-top: 4px;
            font-size: 11px;
            color: #94A3B8;
            line-height: 1.4;
        }
        .td-time-picker-body {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin: 8px 0 12px;
        }
        .td-time-picker-section {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .td-time-picker-label {
            font-size: 12px;
            color: #64748B;
        }
        .td-time-picker-select,
        .td-time-picker-input {
            width: 100%;
            padding: 6px 8px;
            border-radius: 6px;
            border: 1px solid #E2E8F0;
            font-size: 12px;
            color: #1E293B;
            background: #fff;
            outline: none;
        }
        .td-time-picker-input[type="time"] {
            font-variant-numeric: tabular-nums;
        }

        /* 折叠板块样式 */
        .td-card.is-collapsible .td-card-header {
            cursor: pointer;
            transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .td-card.is-collapsible .td-card-header:hover {
            background: #F1F5F9;
            box-shadow: inset 0 -1px 0 rgba(15, 23, 42, 0.04);
        }
        .td-card.is-collapsible .td-card-header:active { transform: scale(0.995); }
        .td-card.is-collapsible.collapsed .td-card-body {
            display: none;
        }
        
        /* 显式折叠箭头 */
        .td-collapse-arrow {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 16px; 
            height: 16px;
            color: #94A3B8; /* Slate 400 */
            transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .td-collapse-arrow svg { width: 14px; height: 14px; }
        
        .td-card.is-collapsible.collapsed .td-collapse-arrow {
            transform: rotate(-90deg);
        }

        /* 移除 Pin 按钮，改为自动记忆 */
        /* .td-pin-btn styles removed */

        /* 标签 Pill 样式 (修改为与时间看齐) */
        .td-tag {
            display: inline-flex;
            align-items: center;
            padding: 1px 6px; /* Same padding as pills */
            border-radius: 4px; /* Same radius */
            font-size: ${L.metaFontSize};    /* Apply Configured Size */
            text-decoration: none;
            margin: 0;          /* Reset margin */
            border: 1px solid #E2E8F0;
            /* 统一字体，确保与时间 pill 一致 */
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-weight: normal; /* 不加粗，保持一致 */
            background: #F8FAFC; /* 与默认 meta pill 背景一致 */
            color: #64748B;
            white-space: nowrap;
        }
        .td-source {
            color: ${C.primary};
            background: #F3E8FF;
            border-color: #E9D5FF;
        }
        /* 给特定标签加点颜色 (统一为中性色，避免冲突) */
        /* .td-tag[data-tag="优先"] { background: #FEF2F2; color: #EF4444; border-color: #FECACA; } */
        /* .td-tag[data-tag="备忘"] { background: #F0F9FF; color: #0EA5E9; border-color: #BAE6FD; } */
        /* .td-tag[data-tag="SIP插件"] { background: #FFF7ED; color: #C2410C; border-color: #FED7AA; } */
        
        /* 删除按钮样式 */
        .td-delete-btn {
            opacity: 1; /* Ensure visible */
            color: ${C.iconDelete}; /* Configurable Color */
            cursor: pointer;
            padding: 4px;
            /* margin-left: auto; Removed, now handled by flex order */
            margin-left: 2px;
            transition: color 160ms ease, background 160ms ease, transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
            display: flex;
            align-items: center;
        }
        /* .td-task-main-row:hover .td-delete-btn { opacity: 1; } Removed, handled by li:hover */
        .td-delete-btn:hover { color: #EF4444; background: #FEE2E2; border-radius: 4px; transform: scale(1.06); box-shadow: 0 2px 6px rgba(239, 68, 68, 0.2); }
        .td-delete-btn:active { transform: scale(0.96); }
        
        /* 移动端适配 */
        @media (max-width: 768px) {
            /* [Fix] 强制移动端展开时不裁剪内容 */
            .td-remark-box.visible {
                max-height: none !important;
                overflow: visible !important;
            }
            /* 防止父级容器在移动端裁剪 */
            .td-card-body li.task-list-item {
                height: auto !important;
                overflow: visible !important;
            }
            /* 确保底部按钮栏可见且不被压缩 */
            .td-meta-footer {
                flex-shrink: 0;
                overflow: visible;
                display: flex !important;
                padding-bottom: 4px; /* 增加一点底部缓冲 */
            }

             .td-delete-btn { 
                 opacity: 1; /* Full opacity on mobile */
                 padding: 2px; /* 减小内边距 */
                 transform: scale(0.9); /* 整体缩小 */
                 transform-origin: right center; /* 右对齐缩放 */
             } 

             /* 移动端只需调整缩进和间距 */
             .td-remark-box {
                 margin-left: ${M.remarkIndent}; 
             }
             .td-meta-footer {
                 padding-left: ${M.metaIndent};
                 margin-top: 2px; /* 压缩垂直间距，匹配 taskPadding */
             }
             
             .td-card-body input[type="checkbox"] {
                width: ${M.checkboxSize};
                height: ${M.checkboxSize};
                margin-right: ${M.checkboxMarginRight};
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .td-card,
            .td-card-body li.task-list-item,
            .td-task-motion,
            .td-task-enter,
            .td-task-exit-complete,
            .td-task-exit-uncomplete,
            .td-task-exit-delete,
            .td-remark-box,
            .td-toggle-btn,
            .td-delete-btn,
            .td-meta-pill.clickable-date,
            .td-meta-pill.clickable-time,
            .td-date-picker-overlay,
            .td-date-picker,
            .td-date-picker-nav button,
            .td-date-picker-day,
            .td-date-picker-btn,
            .td-card.is-collapsible .td-card-header,
            .td-collapse-arrow {
                transition: none !important;
                animation: none !important;
                transform: none !important;
            }
        }
        
        /* 分组标题 */
        .td-group-header {
            font-size: 11px;
            color: ${C.textSub};
            font-weight: 700;
            margin: 10px 0 4px 0;
            padding-bottom: 2px;
            border-bottom: 1px solid #F1F5F9;
        }

        .fv-super-card {
            background: #FFFFFF;
            border-radius: 12px;
            box-shadow: 0 4px 20px -4px rgba(139, 92, 246, 0.15);
            overflow: hidden;
            margin-bottom: 24px;
            border: 1px solid rgba(0,0,0,0.03);
            position: relative;
            z-index: 2;
        }
        .fv-sc-header {
            background: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%);
            padding: 20px 24px; color: white;
            display: flex; justify-content: space-between; align-items: center;
            position: relative;
        }
        .fv-sc-header::before {
            content: ""; position: absolute; top: -50%; right: -20%; width: 200px; height: 200px;
            background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
            border-radius: 50%; pointer-events: none;
        }
        .fv-sc-title-area h2 { margin: 0; font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.95); letter-spacing: 0.5px; }
        .fv-sc-title-area p { margin: 4px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.7); font-family: monospace; }

        .td-config {
            border: 1px solid rgba(0,0,0,0.06);
            border-radius: 16px;
            background: #FFFFFF;
            padding: 16px;
            margin: 0 0 16px 0;
        }
        .td-config h2 { margin: 0 0 10px 0; font-size: 18px; }
        .td-config p { margin: 0 0 10px 0; color: ${C.textSub}; font-size: 12px; }
        .td-config-section {
            margin-top: 14px;
        }
        .td-config-section-title {
            margin: 0;
            font-size: 13px;
            font-weight: 800;
            color: ${C.textMain};
        }
        .td-config-section-desc {
            margin: 4px 0 10px 0;
            color: ${C.textSub};
            font-size: 12px;
            line-height: 1.5;
        }
        .td-config-section-body {
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            background: #FFFFFF;
            padding: 10px;
        }
        .td-config-row {
            display: grid;
            grid-template-columns: 110px 1fr;
            gap: 10px;
            align-items: center;
            margin: 8px 0;
        }
        .td-config-row label { color: ${C.textSub}; font-size: 12px; font-weight: 700; }
        .td-config-row input, .td-config-row select, .td-config-row textarea {
            width: 100%;
            border: 1px solid #E2E8F0;
            border-radius: 10px;
            padding: 6px 10px;
            background: #FFFFFF;
            color: ${C.textMain};
            font-size: 12px;
        }
        .td-config-sources {
            border: 1px solid #E2E8F0;
            border-radius: 12px;
        }
        .td-config-source {
            display: grid;
            grid-template-columns: 26px 90px 90px 1fr 70px;
            gap: 8px;
            align-items: center;
            padding: 10px;
            border-top: 1px solid #F1F5F9;
            background: #FFFFFF;
            /* Drag & Drop Support */
            cursor: move; 
            transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s;
            user-select: none; /* 防止选中文字 */
        }
        @media (hover: none) and (pointer: coarse) {
            .td-config-source {
                touch-action: none; /* 仅在移动端禁止触摸滚动 */
            }
        }
        .td-config-source.dragging {
            opacity: 0.5;
            background: #F8FAFC;
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
            position: relative;
            z-index: 10;
        }
        .td-config-source.drag-over {
            border-top: 2px solid #7C3AED;
            background: #F3E8FF;
        }
        .td-config-source:first-child { border-top: none; }
        
        /* 移动端来源卡片布局 */
        @media (max-width: 600px) {
            .td-config-sources {
                border: none;
                border-radius: 0;
                background: transparent;
            }
            .td-config-source {
                display: flex;
                flex-direction: column;
                gap: 10px;
                padding: 14px;
                margin-bottom: 10px;
                border: 1px solid #E2E8F0;
                border-radius: 14px;
                background: #FFFFFF;
                box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            }
            .td-config-source:first-child {
                border-top: 1px solid #E2E8F0;
            }
            .td-config-source .td-source-header {
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
            }
            .td-config-source .td-source-main {
                display: flex;
                flex-direction: column;
                gap: 8px;
                flex: 1;
                min-width: 0;
            }
            .td-config-source .td-source-actions {
                display: flex;
                align-items: center;
                gap: 8px;
                padding-top: 8px;
                border-top: 1px solid #F1F5F9;
            }
            .td-config-source input[type="text"] {
                width: 100%;
                min-width: 0;
            }
            .td-config-source select {
                flex: 1;
                min-width: 0;
            }
        }
        
        .td-config-actions {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-top: 12px;
        }
        .td-btn {
            appearance: none;
            border: 1px solid #E2E8F0;
            background: #FFFFFF;
            color: ${C.textMain};
            padding: 6px 10px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 700;
            font-size: 12px;
        }
        .td-btn.primary {
            border-color: #E9D5FF;
            background: #F3E8FF;
            color: ${C.primary};
        }
        .td-btn.danger {
            border-color: #FECACA;
            background: #FEF2F2;
            color: ${C.danger};
        }
        .td-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        /* 保存反馈 Toast */
        .td-save-toast {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            color: white;
            padding: 10px 18px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 600;
            box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
            z-index: 99999;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: td-toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            backdrop-filter: blur(8px);
        }
        .td-save-toast.fade-out {
            animation: td-toast-out 0.3s ease forwards;
        }
        @keyframes td-toast-in {
            from { opacity: 0; transform: translateY(16px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes td-toast-out {
            from { opacity: 1; transform: translateY(0) scale(1); }
            to { opacity: 0; transform: translateY(-8px) scale(0.95); }
        }
        .td-save-toast svg {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
        }

        /* 可折叠 Section */
        .td-collapsible-section {
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            overflow: hidden;
            margin-top: 12px;
            background: #FFFFFF;
        }
        .td-collapsible-header {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 14px;
            background: linear-gradient(to right, rgba(139, 92, 246, 0.04), transparent);
            cursor: pointer;
            user-select: none;
            transition: background 0.2s ease;
        }
        .td-collapsible-header:hover {
            background: linear-gradient(to right, rgba(139, 92, 246, 0.08), transparent);
        }
        .td-collapsible-icon {
            width: 18px;
            height: 18px;
            color: #8B5CF6;
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            flex-shrink: 0;
        }
        .td-collapsible-section.collapsed .td-collapsible-icon {
            transform: rotate(-90deg);
        }
        .td-collapsible-title {
            font-size: 13px;
            font-weight: 700;
            color: #1E293B;
        }
        .td-collapsible-badge {
            margin-left: auto;
            font-size: 10px;
            font-weight: 600;
            color: #64748B;
            background: #F1F5F9;
            padding: 2px 8px;
            border-radius: 99px;
        }
        .td-collapsible-body {
            border-top: 1px solid #F1F5F9;
            padding: 12px 14px;
            max-height: 2000px;
            overflow: hidden;
            transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), 
                        padding 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                        opacity 0.25s ease;
            opacity: 1;
        }
        .td-collapsible-section.collapsed .td-collapsible-body {
            max-height: 0;
            padding-top: 0;
            padding-bottom: 0;
            opacity: 0;
            border-top: none;
        }

        /* 配置页面 Section 样式 */
        .td-config-section {
            position: relative;
            margin-top: 8px;
        }
        .td-config-section-title {
            font-size: 14px;
            font-weight: 700;
            color: #1E293B;
            margin: 0 0 4px 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .td-config-section-title::before {
            content: '';
            width: 4px;
            height: 16px;
            background: linear-gradient(180deg, #8B5CF6 0%, #A78BFA 100%);
            border-radius: 2px;
            flex-shrink: 0;
        }
        .td-config-section-desc {
            font-size: 12px;
            color: #64748B;
            margin: 0 0 8px 0;
            line-height: 1.5;
            padding-left: 12px;
        }
        .td-config-section-body {
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            background: #FFFFFF;
            padding: 10px;
        }
        .td-config-divider {
            height: 1px;
            background: linear-gradient(90deg, #E2E8F0 0%, transparent 100%);
            margin: 16px 0;
        }
        .td-config-divider.major {
            height: 2px;
            background: linear-gradient(90deg, #CBD5E1 0%, #E2E8F0 50%, transparent 100%);
            margin: 20px 0;
        }
        .td-config-row {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;
        }
        .td-config-row label {
            font-size: 12px;
            font-weight: 600;
            color: #374151;
            min-width: 80px;
            flex-shrink: 0;
        }
        .td-config-row input[type="text"],
        .td-config-row input[type="number"],
        .td-config-row select,
        .td-config-row textarea {
            flex: 1;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 6px 10px;
            font-size: 12px;
            background: #FFFFFF;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .td-config-row input:focus,
        .td-config-row select:focus,
        .td-config-row textarea:focus {
            outline: none;
            border-color: #8B5CF6;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        /* 移动端深度适配 (Override) */
        @media (max-width: 768px) {
            .td-container { 
                padding-left: 0; 
                /* Timeline background removed */
            }
            .td-timeline-wrapper::before {
                left: ${M.timelineLeft};
            }
            .td-section { 
                padding-left: ${M.sectionMarginLeft}; 
                margin-bottom: 12px;
            }
            .td-section::before { 
                left: ${M.dotLeft}; 
            }
            .td-filter-bar { 
                padding-left: ${M.filterPaddingLeft}; 
                gap: ${M.filterGap}; 
            }
            
            .td-header-card { 
                padding: 16px 20px; 
                flex-direction: column; 
                align-items: stretch;
                margin-bottom: 16px;
                gap: 12px;
                min-height: auto;
            }
            
            /* 移动端顶部区域优化 - 恢复左右布局 */
            .td-header-top {
                margin-bottom: 8px;
                flex-direction: row; /* 强制横向 */
                align-items: flex-start;
                justify-content: space-between;
                gap: 12px;
                flex-wrap: nowrap; /* 禁止换行 */
            }

            .td-title-area {
                width: auto;
                flex: 1; /* 占据剩余空间 */
                min-width: 0; /* 允许 flex item 缩小 */
                display: flex;
                flex-direction: column;
                justify-content: center;
            }

            .td-title-area h1 { 
                font-size: ${M.headerTitleSize}; 
                line-height: 1.2;
                margin-bottom: 2px;
                white-space: nowrap; /* 标题不换行 */
            }
            
            /* 签名区域：自动截断 + 弹性收缩 */
            .td-title-area p { 
                display: block !important; 
                font-size: 12px;
                opacity: 0.9;
                line-height: 1.3;
                margin-top: 2px;
                
                /* 超长省略逻辑 */
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
            }

            /* 确保签名可见且可点击 */
            #td-user-signature {
                min-height: 20px;
                padding: 2px 0;
            }

            /* 日期区域：固定不压缩 */
            .td-date-badge {
                width: auto;
                flex-shrink: 0; /* 禁止被压缩 */
                align-items: flex-end; /* 右对齐 */
                text-align: right;
                flex-direction: column; /* 恢复垂直排列 */
                gap: 0;
                margin-top: 2px;
            }
            
            .td-date-badge span.year {
                font-size: 10px;
                margin-bottom: 0;
                line-height: 1;
            }

            /* Date Badge removed to use previous definition */
            .td-date-badge span.year {
                font-size: 10px;
                margin-bottom: 0;
            }
            
            .td-card {
                border-radius: 8px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.03);
            }
            .td-card-body { 
                padding: ${M.cardPadding}; 
                padding-top: ${M.cardPaddingTop};
                padding-bottom: ${M.cardPaddingBottom};
            }
            
            /* Apply User Configs */
            .td-card-body ul.contains-task-list {
                padding: ${M.taskListPadding};
            }
            .td-card-body li.task-list-item {
                padding: ${M.taskPadding};
            }

            .td-task-content-wrapper {
                padding: 0; /* Deprecated wrapper padding, reset to 0 */
            }
            .td-card-body .list-item-part { 
                font-size: ${M.taskFontSize};
                padding: ${M.taskContentPadding};
            }
            .td-card-body input[type="checkbox"] {
                width: ${M.checkboxSize};
                height: ${M.checkboxSize};
                margin-right: ${M.checkboxMarginRight};
            }
            .td-remark-container {
                font-size: ${M.remarkFontSize} !important;
                color: ${M.remarkColor};
                padding-left: calc(${M.checkboxSize} + ${M.checkboxMarginRight} + 4px); /* 动态计算对齐 */
            }
            
            .td-meta-pill { padding: 0 4px; font-size: ${M.metaFontSize}; }
            .td-tag { font-size: ${M.metaFontSize}; padding: 0 4px; }
            
            /* 强制不换行处理 - 极致紧凑 */
            .td-select { 
                padding: 2px 8px; 
                padding-right: 18px; 
                font-size: 10px; 
                height: 24px; 
                line-height: 18px;
                max-width: none; 
                border-radius: 6px;
            }
        }
    `;
    document.head.appendChild(style);
})();

// ================= 2. 核心逻辑库 =================
window.TaskDashboardKit = {
    
    // --- 数据处理模块 ---
    data: {
        L: null, // Luxon
        _timePeriods: null,
        _timePeriodsPromise: null,
        
        getTimeContext() {
            const L = this.L;
            const now = L.DateTime.local();
            const isEarlyMorning = now.hour < 3;
            
            const naturalToday = now.startOf('day');
            const logicalToday = isEarlyMorning ? naturalToday.minus({ days: 1 }) : naturalToday;
            const logicalTomorrow = logicalToday.plus({ days: 1 });
            
            return { now, today: logicalToday, todayISO: logicalToday.toISODate(), tomorrow: logicalTomorrow, naturalToday };
        },

        getCompletionISO(t) {
            if (!t || !t.completion) return null;
            try {
                const comp = t.completion.startOf ? t.completion.startOf('day') : t.completion;
                return comp.toISODate ? comp.toISODate() : (comp.toISO ? comp.toISO().split('T')[0] : String(comp));
            } catch (e) { return null; }
        },

        // 核心：从文本中尝试解析日期 (Fallback for non-standard tasks)
        // 匹配 📅 2026-1-8 或 📅 2026-01-08
        extractDateFromText(text) {
            const m = text.match(/📅\s*(\d{4}-\d{1,2}-\d{1,2})/);
            if (m) {
                try {
                    // 补全为 YYYY-MM-DD 以便 Luxon 解析
                    const parts = m[1].split('-');
                    const y = parts[0];
                    const M = parts[1].padStart(2, '0');
                    const d = parts[2].padStart(2, '0');
                    return window.TaskDashboardKit.data.L.DateTime.fromISO(`${y}-${M}-${d}`);
                } catch (e) { return null; }
            }
            
            const timeMatch = text.match(/\[(凌晨|早上|上午|中午|下午|晚上|早|中|下|晚)\]/);
            if (timeMatch) {
                const { today } = this.getTimeContext();
                return today;
            }
            
            return null;
        },

        async ensureTimePeriodsLoaded() {
            if (Array.isArray(this._timePeriods) && this._timePeriods.length > 0) return this._timePeriods;
            if (this._timePeriodsPromise) return this._timePeriodsPromise;

            const configPath = "08-科技树系统/01-OB_LifeOS_Build/00-通用模块库/task-reminder/task-reminder.config.json";

            this._timePeriodsPromise = (async () => {
                try {
                    const file = app?.vault?.getAbstractFileByPath?.(configPath);
                    if (!file) return null;
                    const raw = await app.vault.read(file);
                    const json = JSON.parse(raw);
                    const periods = json?.reminder?.timePeriods;
                    if (!Array.isArray(periods) || periods.length === 0) return null;
                    this._timePeriods = periods.filter(p => p && typeof p.token === "string");
                    return this._timePeriods;
                } catch (e) {
                    return null;
                } finally {
                    this._timePeriodsPromise = null;
                }
            })();

            return this._timePeriodsPromise;
        },

        getTimePeriods() {
            if (Array.isArray(this._timePeriods) && this._timePeriods.length > 0) return this._timePeriods;
            return [
                { token: "凌晨", start: "00:00", end: "03:00", aliases: ["凌", "半夜", "夜里", "夜间", "深夜"] },
                { token: "早上", start: "03:00", end: "09:00", aliases: ["早晨", "清晨", "早", "一早"] },
                { token: "上午", start: "09:00", end: "12:00", aliases: ["上", "早间"] },
                { token: "中午", start: "12:00", end: "14:00", aliases: ["午", "午间", "正午"] },
                { token: "下午", start: "14:00", end: "18:00", aliases: ["下", "午后"] },
                { token: "晚上", start: "18:00", end: "24:00", aliases: ["晚", "傍晚", "夜晚", "夜里", "夜间", "晚间"] }
            ];
        },

        normalizeTimeToken(token) {
            const t = String(token || "").trim();
            if (!t) return null;
            const tm = t.match(/^(\d{1,2})[:：](\d{2})$/);
            if (tm) return `${tm[1].padStart(2, "0")}:${tm[2]}`;
            const periods = this.getTimePeriods();
            for (const p of periods) {
                if (!p) continue;
                if (p.token === t) return p.token;
                const aliases = Array.isArray(p.aliases) ? p.aliases : [];
                if (aliases.includes(t)) return p.token;
            }
            return t;
        },

        isTimeToken(token) {
            const t = String(token || "").trim();
            if (!t) return false;
            if (/^\d{1,2}[:：]\d{2}$/.test(t)) return true;
            const periods = this.getTimePeriods();
            return periods.some(p => p && p.token === t);
        },

        extractTimeTokenFromText(text) {
            const s = String(text || "");
            const matches = s.match(/\[[^\[\]]+?\]/g);
            if (!matches) return null;

            const periods = this.getTimePeriods();
            let firstPeriod = null;

            for (const m of matches) {
                const raw = m.slice(1, -1).trim();
                if (!raw) continue;

                const norm = this.normalizeTimeToken(raw);
                if (!norm) continue;

                if (this.parseClockToken(norm)) return norm;

                const idx = periods.findIndex(p => p && p.token === norm);
                if (idx >= 0 && firstPeriod == null) firstPeriod = norm;
            }
            return firstPeriod;
        },

        parseClockToken(token) {
            if (!token) return null;
            const t = String(token).trim();
            const m = t.match(/^(\d{1,2}):(\d{2})$/);
            if (!m) return null;
            const hour = Number(m[1]);
            const minute = Number(m[2]);
            if (!Number.isFinite(hour) || !Number.isFinite(minute) || minute < 0 || minute > 59) return null;
            if (hour === 24 && minute === 0) return { hour: 0, minute: 0, dayOffset: 1, minutesOfDay: 24 * 60 };
            if (hour < 0 || hour > 23) return null;
            return { hour, minute, dayOffset: 0, minutesOfDay: hour * 60 + minute };
        },

        parseTimeTokenToClock(token) {
            if (!token) return null;
            const norm = this.normalizeTimeToken(token);
            if (!norm) return null;
            const explicit = this.parseClockToken(norm);
            if (explicit) return explicit;

            const periods = this.getTimePeriods();
            const period = periods.find(p => p && p.token === norm);
            if (!period) return null;
            const endClock = this.parseClockToken(period.end);
            if (!endClock) return null;
            return endClock;
        },

        getPeriodIndexByMinutes(minutesOfDay) {
            const periods = this.getTimePeriods();
            const minutes = Math.max(0, Math.min(24 * 60 - 1, Number(minutesOfDay)));
            for (let i = 0; i < periods.length; i++) {
                const p = periods[i];
                const start = this.parseClockToken(p?.start);
                const end = this.parseClockToken(p?.end);
                if (!start || !end) continue;
                const endMin = end.minutesOfDay === 24 * 60 ? 24 * 60 : end.minutesOfDay;
                if (minutes >= start.minutesOfDay && minutes < endMin) return i;
            }
            return periods.length;
        },

        getTaskTimeSortMeta(task) {
            const s = String(task?.text || "");
            const matches = s.match(/\[[^\[\]]+?\]/g);
            const periods = this.getTimePeriods();
            let periodIndex = null;
            let clockMinutes = null;

            if (matches) {
                for (const m of matches) {
                    const raw = m.slice(1, -1).trim();
                    if (!raw) continue;

                    const norm = this.normalizeTimeToken(raw);
                    if (!norm) continue;

                    const explicit = this.parseClockToken(norm);
                    if (explicit) {
                        clockMinutes = explicit.minutesOfDay === 24 * 60 ? 24 * 60 - 1 : explicit.minutesOfDay;
                        break;
                    }

                    const idx = periods.findIndex(p => p && p.token === norm);
                    if (idx >= 0 && periodIndex == null) periodIndex = idx;
                }
            }

            if (clockMinutes != null) {
                return { groupIndex: this.getPeriodIndexByMinutes(clockMinutes), typeRank: 1, clockMinutes };
            }
            if (periodIndex != null) {
                return { groupIndex: periodIndex, typeRank: 0, clockMinutes: null };
            }
            return { groupIndex: periods.length, typeRank: 2, clockMinutes: null };
        },

        compareTasksInSameDate(a, b) {
            const metaA = this.getTaskTimeSortMeta(a);
            const metaB = this.getTaskTimeSortMeta(b);

            if (metaA.groupIndex !== metaB.groupIndex) {
                return metaA.groupIndex - metaB.groupIndex;
            }

            if (metaA.typeRank !== metaB.typeRank) {
                return metaA.typeRank - metaB.typeRank;
            }

            if (metaA.clockMinutes != null && metaB.clockMinutes != null) {
                return metaA.clockMinutes - metaB.clockMinutes;
            }

            return (a.line ?? 0) - (b.line ?? 0);
        },

        compareTasks(a, b, getPlanDate) {
            const toISO = (d) => {
                if (!d) return null;
                if (typeof d === "string") {
                    const m = d.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
                    if (!m) return null;
                    return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
                }
                if (typeof d?.toISODate === "function") return d.toISODate();
                if (typeof d?.toISO === "function") return String(d.toISO()).slice(0, 10);
                return null;
            };

            const textA = a?.text || a?.originalText || "";
            const textB = b?.text || b?.originalText || "";
            
            const planA = getPlanDate(a);
            const planB = getPlanDate(b);
            const isoA = toISO(planA?.startOf ? planA.startOf("day") : planA);
            const isoB = toISO(planB?.startOf ? planB.startOf("day") : planB);

            if (isoA !== isoB) {
                if (isoA == null && isoB == null) return this.compareTasksInSameDate(a, b);
                if (isoA == null) return 1;
                if (isoB == null) return -1;
                const cmp = isoA.localeCompare(isoB);
                if (cmp !== 0) return cmp;
            }

            return this.compareTasksInSameDate(a, b);
        },

        getBuckets(allTasks, config) {
            const { now, today, todayISO, tomorrow, naturalToday } = this.getTimeContext();
            const L = this.L;
            const tasks = Array.from(allTasks || []);

            // 防御性检查：如果 Luxon 未加载，返回空 buckets
            if (!L || !L.DateTime) {
                return { overdue: [], today: [], forecast: [], completed: [], undated: [] };
            }

            const normalizeDate = (d) => {
                if (!d) return null;
                if (typeof d?.hasSame === "function") return d;
                if (typeof d === "string") {
                    const iso = d.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
                    if (iso) {
                        const y = iso[1];
                        const m = iso[2].padStart(2, "0");
                        const day = iso[3].padStart(2, "0");
                        return L.DateTime.fromISO(`${y}-${m}-${day}`);
                    }
                }
                if (typeof d?.toISODate === "function") {
                    const iso = d.toISODate();
                    if (iso) return L.DateTime.fromISO(iso);
                }
                if (typeof d?.toISO === "function") {
                    const iso = String(d.toISO()).slice(0, 10);
                    if (iso) return L.DateTime.fromISO(iso);
                }
                return null;
            };

            // 增强版日期获取：优先用 t.due，如果没有，尝试从文本解析
            const getDue = (t) => {
                const base = normalizeDate(t?.due);
                if (base) return base;
                const result = this.extractDateFromText(t.text || "");
                return normalizeDate(result);
            };
            
            // 取消检测
            const isCancelled = (t) => {
                const txt = t.text ?? "";
                if (txt.includes("❌")) return true;
                return !!(t.cancelled || t.canceled);
            };

            const isTimeOverdue = (t) => {
                const d = getDue(t);
                if (!d || !d.hasSame || !d.hasSame(today, "day")) return false;
                const token = this.extractTimeTokenFromText(t.text || "");
                if (!token) return false;
                const clock = this.parseTimeTokenToClock(token);
                if (!clock) return false;
                const deadline = L.DateTime.fromObject({
                    year: d.year,
                    month: d.month,
                    day: d.day,
                    hour: clock.hour,
                    minute: clock.minute
                }).plus({ days: clock.dayOffset || 0 });
                return now >= deadline;
            };

            // 1. 滞后待办
            const overdue = tasks.filter(t => {
                if (t.completed || isCancelled(t)) return false;
                const d = getDue(t);
                if (d && d < today) return true;
                return isTimeOverdue(t);
            }).sort((a, b) => this.compareTasks(a, b, getDue));

            // 2. 今日待办
            const todayTasks = tasks.filter(t => {
                if (t.completed || isCancelled(t)) return false;
                const d = getDue(t);
                if (d && d < today) return false; // 已归入滞后
                if (isTimeOverdue(t)) return false; // 今日超时也归入滞后
                
                const isDueToday = d && d.hasSame(today, 'day');
                const scheduled = normalizeDate(t.scheduled);
                const isScheduledReady = !d && scheduled && scheduled <= today;
                return isDueToday || isScheduledReady;
            }).sort((a, b) => this.compareTasks(a, b, (t) => (getDue(t) ?? t.scheduled)));

            // 3. 未来前瞻
            const forecastDays = config.forecastDays || 1;
            const startForecast = tomorrow;
            const endForecast = startForecast.plus({ days: forecastDays - 1 }).endOf('day');
            
            const forecast = tasks.filter(t => {
                if (t.completed || isCancelled(t)) return false;
                const planDate = getDue(t) ?? normalizeDate(t.scheduled);
                if (!planDate) return false;
                return planDate >= startForecast && planDate <= endForecast;
            }).sort((a, b) => this.compareTasks(a, b, (t) => (getDue(t) ?? t.scheduled)));

            // 4. 今日已完结
            const completed = tasks.filter(t => {
                if (!t.completed) return false;
                const compISO = this.getCompletionISO(t);
                return compISO === todayISO || compISO === naturalToday.toISODate();
            }).sort((a, b) => {
                // 排序逻辑：逾期 (diff > 0) -> 按计划 (diff == 0) -> 提前 (diff < 0)
                // 注意：这里的 diff 是 完成时间 - 截止时间
                // 逾期：完成时间 > 截止时间 (diff > 0)
                // 按计划：完成时间 = 截止时间 (diff = 0)
                // 提前：完成时间 < 截止时间 (diff < 0)
                // 排序顺序：逾期 -> 按计划 -> 提前
                // 即 diff 从大到小排序
                
                const getDiff = (task) => {
                    const compISO = this.getCompletionISO(task);
                    const due = getDue(task);
                    if (!compISO || !due) return -9999; // 无截止日期，视为提前/正常? 放到最后?
                    // 暂时将无截止日期的任务视为按计划或最后
                    
                    const compDate = window.TaskDashboardKit.data.L.DateTime.fromISO(compISO).startOf('day');
                    const dueDate = due.startOf('day');
                    return compDate.diff(dueDate, 'days').days;
                };

                const diffA = getDiff(a);
                const diffB = getDiff(b);
                
                // 处理无截止日期的情况：
                // 如果没有截止日期，diff 为 -9999。
                // 我们希望有截止日期的任务排在前面吗？
                // 假设无截止日期属于 "按计划" 或 "其他"，排在 逾期 之后，提前 之前？
                // 简单起见，直接按 diff 降序排列
                const primary = diffB - diffA;
                if (primary !== 0) return primary;
                return this.compareTasks(a, b, (t) => (getDue(t) ?? t.scheduled));
            });

            // 5. 待排期 (Undated)
            const undated = tasks.filter(t => {
                if (t.completed || isCancelled(t)) return false;
                const d = getDue(t);
                const s = t.scheduled;
                return !d && !s;
            }).sort((a, b) => {
                return this.compareTasksInSameDate(a, b);
            });

            return { overdue, today: todayTasks, forecast, completed, undated };
        },

        applyFilters(tasks, filterKey, subtaskState) {
            let filtered = tasks;

            // 0. Subtask Filtering
            // Deprecated: We don't filter out subtasks here anymore.
            // We control visibility in renderTaskList (collapse/expand).
            // This ensures that "orphaned" subtasks (whose parents are not in the current view) are still visible.
            /*
            if (subtaskState === 'hide') {
                filtered = filtered.filter(t => !t.parent);
            }
            */

            // 1. Tag Filtering
            if (!filterKey || filterKey === 'all') return filtered;
            
            const hasTag = (t, tag) => (t.text || "").includes(`#${tag}`);
            if (filterKey.startsWith('only-')) {
                const tag = filterKey.replace('only-', '');
                return filtered.filter(t => hasTag(t, tag));
            }
            if (filterKey === 'no-memo') return filtered.filter(t => !hasTag(t, '备忘'));
            return filtered;
        },

        groupByDate(tasks) {
            const list = Array.from(tasks || []);
            const groups = {};
            for (const t of list) {
                // 这里也要用 getDue 增强逻辑，但为了性能暂时只在 getBuckets 里处理了
                // 如果需要分组准确，这里最好也复用逻辑
                // 但考虑到 tasks 对象传进来时没有被修改，我们再次解析一下
                let d = t.due ?? t.scheduled;
                if (!d) d = this.extractDateFromText(t.text || "");
                
                const dateKey = d ? d.toISODate() : "未知日期";
                let weekday = "";
                if (d && d.isValid) {
                    // Try standard property first, then format
                    if (typeof d.weekdayShort === 'string') weekday = d.weekdayShort;
                    else if (typeof d.toFormat === 'function') weekday = d.toFormat('ccc', { locale: 'zh-CN' });
                }
                
                // [Fix] Completely remove any "undefined" string check and rely on truthiness
                // Luxon's toFormat('ccc') might return 'undefined' string in some rare locale/version combos?
                // Or maybe d.weekdayShort is literally the string "undefined"?
                // Let's force a clean check.
                if (weekday === "undefined") weekday = "";
                
                const key = weekday ? `${dateKey} ${weekday}` : dateKey;
                if (!groups[key]) groups[key] = [];
                groups[key].push(t);
            }
            for (const key of Object.keys(groups)) {
                groups[key].sort((a, b) => {
                    return this.compareTasksInSameDate(a, b);
                });
            }
            return groups;
        },

        // --- 核心：任务文本处理器 (Updated for V4.2 Layout) ---
        processTaskText(task) {
            let text = task.text || "";
            const tags = [];
            const recurrencePills = [];
            const priorityPills = [];
            const I = CONFIG.ICONS;
            const { now, today, todayISO } = this.getTimeContext();
            const hiddenTagsRaw = window.TaskDashboardKit?.__config?.ui?.hiddenTags || [];
            const hiddenTags = new Set((Array.isArray(hiddenTagsRaw) ? hiddenTagsRaw : []).map(v => String(v || '').trim()).filter(Boolean));

            // [Performance] Reset regex lastIndex for global patterns
            REGEX.tag.lastIndex = 0;
            REGEX.due.lastIndex = 0;
            REGEX.time.lastIndex = 0;
            REGEX.recurrence.lastIndex = 0;
            REGEX.priority.lastIndex = 0;
            REGEX.completion.lastIndex = 0;
            REGEX.startScheduled.lastIndex = 0;

            // Helper: 生成 Pill HTML
            const createPill = (icon, label, className = "", dataAttrs = "") => {
                return `<span class="td-meta-pill ${className}" ${dataAttrs}>${icon} ${label}</span>`;
            };

            // 获取任务路径和行号
            const taskPath = task.file?.path || task.path;
            const taskLine = task.line || task.position?.start?.line;
            const taskInfoAttr = (taskPath && taskLine !== undefined) 
                ? `data-task-path="${taskPath}" data-task-line="${taskLine}"` 
                : "";

            // 0. 处理 #标签 (提取并放入 tags 数组)
            // Fix: Support hyphen and slash in tags
            text = text.replace(REGEX.tag, (match, tagName) => {
                if (hiddenTags.has(tagName) || hiddenTags.has(String(tagName).toLowerCase())) return "";
                tags.push(`<span class="td-meta-pill td-tag" data-tag="${tagName}">${match}</span>`);
                return ""; 
            });

            // 1. Due Date: 📅 YYYY-M-D (支持 1位或2位数字)
            let dueDate = null;
            let datePill = ""; 
            text = text.replace(REGEX.due, (match, dateStr) => {
                let isoStr = dateStr;
                try {
                     const parts = dateStr.split('-');
                     isoStr = `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`;
                     dueDate = window.TaskDashboardKit.data.L.DateTime.fromISO(isoStr);
                } catch(e){}

                const displayDate = dueDate ? dueDate.toISODate() : dateStr;
                datePill = createPill(I.calendar, displayDate, "is-due clickable-date", taskInfoAttr);
                return ""; 
            });

            if (!datePill) {
                const fallbackDate = task.due ?? task.scheduled;
                if (fallbackDate && typeof fallbackDate.toISODate === 'function') {
                    const isoStr = fallbackDate.toISODate();
                    datePill = createPill(I.calendar, isoStr, "is-due clickable-date", taskInfoAttr);
                    dueDate = fallbackDate;
                }
            }

            // 2. Time: [上午] [下午] [晚上] [HH:mm]
            let timePill = "";
            let timeToken = null;
            let timeDataAttrs = "";
            text = text.replace(REGEX.time, (match) => {
                const raw = String(match.slice(1, -1) || "").trim();
                if (!raw || /^[xX]$/.test(raw)) return match;
                if (raw === "学" || raw === "练" || raw === "习") return "";

                const norm = this.normalizeTimeToken(raw);
                if (!norm || !this.isTimeToken(norm)) return match;

                if (!timeToken) {
                    timeToken = norm;
                    if (taskInfoAttr) timeDataAttrs = `${taskInfoAttr} data-time-token="${norm}"`;
                    timePill = createPill(I.clock, norm, taskInfoAttr ? "is-time clickable-time" : "is-time", timeDataAttrs);
                } else {
                    const currentIsClock = !!this.parseClockToken(timeToken);
                    const nextIsClock = !!this.parseClockToken(norm);
                    if (!currentIsClock && nextIsClock) {
                        timeToken = norm;
                        if (taskInfoAttr) timeDataAttrs = `${taskInfoAttr} data-time-token="${norm}"`;
                        timePill = createPill(I.clock, norm, taskInfoAttr ? "is-time clickable-time" : "is-time", timeDataAttrs);
                    }
                }
                return "";
            });

            if (!task.completed && timePill && timeToken && dueDate && dueDate.hasSame && dueDate.hasSame(today, "day")) {
                const clock = this.parseTimeTokenToClock(timeToken);
                if (clock) {
                    const deadline = this.L.DateTime.fromObject({
                        year: dueDate.year,
                        month: dueDate.month,
                        day: dueDate.day,
                        hour: clock.hour,
                        minute: clock.minute
                    }).plus({ days: clock.dayOffset || 0 });
                    if (now >= deadline) timePill = createPill(I.clock, timeToken, taskInfoAttr ? "is-time is-time-overdue clickable-time" : "is-time is-time-overdue", timeDataAttrs);
                }
            }

            // 3. Recurrence: 🔁 every ...
            text = text.replace(REGEX.recurrence, (match, rule) => {
                let shortRule = rule.trim();
                if (REGEX.everyDay.test(shortRule)) shortRule = "1d";
                else if (REGEX.everyWeek.test(shortRule)) shortRule = "1w";
                else if (REGEX.everyMonth.test(shortRule)) shortRule = "1m";
                else if (REGEX.everyYear.test(shortRule)) shortRule = "1y";
                else {
                    const mDays = shortRule.match(REGEX.everyDays);
                    if (mDays) shortRule = `${mDays[1]}d`;
                }
                recurrencePills.push(createPill(I.repeat, shortRule, "is-recurring"));
                return "";
            });

            // 4. Priority
            if (text.includes("🔺") || text.includes("🔼")) {
                text = text.replace(REGEX.priority, "");
                priorityPills.push(createPill(I.priorityHigh, "High", "is-overdue"));
            }
            if (text.includes("🔽") || text.includes("⏬")) {
                text = text.replace(REGEX.priority, "");
                priorityPills.push(createPill(I.priorityLow, "Low"));
            }
            
            // 5. Start/Scheduled
            text = text.replace(REGEX.startScheduled, "");
            
            // 6. Completion Logic
            if (task.completed) {
                text = text.replace(REGEX.completion, "");
                let statusClass = "completed-ontime";
                const compISO = this.getCompletionISO(task);
                if (compISO && dueDate) {
                     const compDate = window.TaskDashboardKit.data.L.DateTime.fromISO(compISO);
                     const diff = compDate.startOf('day').diff(dueDate.startOf('day'), 'days').days;
                     if (diff < 0) statusClass = "completed-early"; 
                     else if (diff > 0) statusClass = "completed-late"; 
                }
                
                // Update datePill if exists, or create one
                if (datePill) {
                    datePill = datePill.replace('is-due', `is-due ${statusClass}`);
                } else if (compISO) {
                    datePill = createPill(I.calendar, compISO, `${statusClass} clickable-date`, taskInfoAttr);
                }
            }

            text = text.trim();
            
            const sourceName = String(task.__sourceName || '').trim();
            const escHtml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            const uiConfig = window.TaskDashboardKit?.__config?.ui || {};
            const showSource = uiConfig.showSource !== false && uiConfig.sourceDisplayMode === 'capsule';
            const sourcePill = (showSource && sourceName) ? `<span class="td-meta-pill td-source" data-source="${escHtml(sourceName)}">@${escHtml(sourceName)}</span>` : "";

            // Layout Order: Date -> Time -> Recurrence -> Source -> Tags -> Priority
            const footerItems = [];
            if (datePill) footerItems.push(datePill);
            if (timePill) footerItems.push(timePill);
            footerItems.push(...recurrencePills);
            if (sourcePill) footerItems.push(sourcePill);
            footerItems.push(...tags);
            footerItems.push(...priorityPills);

            return {
                textHtml: text,
                footerHtml: footerItems.join("")
            };
        }
    },

    config: {
        defaultConfig() {
            const sourceCfg = CONFIG.TASK_SOURCES || {};
            const folders = Array.isArray(sourceCfg.folders) && sourceCfg.folders.length > 0
                ? sourceCfg.folders
                : ["01-经纬矩阵系统", "05-生活坐标系统/01-角色档案"];
            const extraFiles = Array.isArray(sourceCfg.extraFiles) ? sourceCfg.extraFiles : [];
            const excludePathIncludes = Array.isArray(sourceCfg.excludePathIncludes) ? sourceCfg.excludePathIncludes : ["99-周委托归档", "99-附件"];

            const basename = (p) => {
                const s = String(p || '').split('/').filter(Boolean);
                const name = s[s.length - 1] || '';
                return name.replace(/\.md$/i, '');
            };

            const sources = [];
            folders.forEach((p) => {
                sources.push({
                    id: `folder:${p}`,
                    type: 'folder',
                    path: p,
                    name: basename(p) || p,
                    enabled: true
                });
            });
            extraFiles.forEach((p) => {
                sources.push({
                    id: `file:${p}`,
                    type: 'file',
                    path: p,
                    name: basename(p) || p,
                    enabled: true
                });
            });

            return {
                version: 1,
                sources,
                excludePathIncludes,
                ui: {
                    forecastDays: 1,
                    showCompleted: true,
                    showUndated: true,
                    showSource: true,
                    sourceDisplayMode: "group",
                    hiddenTags: ["备忘", "SIP插件", "sip-plugin", "sip_plugin"]
                },
                weekly: {
                    enabled: true,
                    weekStart: "monday",
                    prefix: "01-经纬矩阵系统/02-周委托模块/周度委托列表",
                    archiveFolder: "01-经纬矩阵系统/02-周委托模块/99-周委托归档",
                    migrateUndone: true,
                    lastWeekKey: ""
                }
            };
        },

        normalizeConfig(cfg) {
            const out = cfg && typeof cfg === 'object' ? cfg : {};
            if (!out.version) out.version = 1;
            if (!Array.isArray(out.sources)) out.sources = [];
            out.sources = out.sources
                .filter(s => s && typeof s === 'object')
                .map(s => ({
                    id: String(s.id || '').trim() || `s-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    type: (s.type === 'folder' || s.type === 'file') ? s.type : 'file',
                    path: String(s.path || '').trim(),
                    name: String(s.name || '').trim(),
                    enabled: s.enabled !== false
                }));

            if (!Array.isArray(out.excludePathIncludes)) out.excludePathIncludes = [];
            out.excludePathIncludes = out.excludePathIncludes.map(v => String(v || '').trim()).filter(Boolean);

            if (!out.ui || typeof out.ui !== 'object') out.ui = {};
            out.ui.forecastDays = Number(out.ui.forecastDays || 1) || 1;
            out.ui.showCompleted = out.ui.showCompleted !== false;
            out.ui.showUndated = out.ui.showUndated !== false;
            
            const legacyGroupBySource = out.ui.groupBySource;
            const legacyShowSourceTag = out.ui.showSourceTag;
            delete out.ui.groupBySource;
            delete out.ui.showSourceTag;
            
            if (typeof out.ui.showSource === 'boolean') {
                out.ui.showSource = out.ui.showSource === true;
            } else if (typeof legacyGroupBySource === 'boolean' || typeof legacyShowSourceTag === 'boolean') {
                if (legacyGroupBySource === false && legacyShowSourceTag === false) {
                    out.ui.showSource = false;
                } else {
                    out.ui.showSource = true;
                }
            } else {
                out.ui.showSource = true;
            }
            
            if (out.ui.sourceDisplayMode === 'group' || out.ui.sourceDisplayMode === 'capsule') {
                // keep
            } else if (typeof legacyGroupBySource === 'boolean' && typeof legacyShowSourceTag === 'boolean') {
                if (legacyShowSourceTag === true) {
                    out.ui.sourceDisplayMode = 'capsule';
                } else {
                    out.ui.sourceDisplayMode = 'group';
                }
            } else {
                out.ui.sourceDisplayMode = 'group';
            }
            
            if (!Array.isArray(out.ui.hiddenTags)) out.ui.hiddenTags = [];
            out.ui.hiddenTags = out.ui.hiddenTags.map(v => String(v || '').trim()).filter(Boolean);

            if (!out.weekly || typeof out.weekly !== 'object') out.weekly = {};
            out.weekly.enabled = out.weekly.enabled !== false;
            out.weekly.weekStart = (out.weekly.weekStart === 'sunday') ? 'sunday' : 'monday';
            out.weekly.prefix = String(out.weekly.prefix || '').trim();
            out.weekly.archiveFolder = String(out.weekly.archiveFolder || '').trim();
            out.weekly.migrateUndone = out.weekly.migrateUndone !== false;
            out.weekly.lastWeekKey = String(out.weekly.lastWeekKey || '').trim();

            return out;
        },

        async load(configPath) {
            const adapter = app?.vault?.adapter;
            const fallback = this.defaultConfig();
            if (!adapter || !configPath) return this.normalizeConfig(fallback);

            const path = String(configPath || '').trim();
            try {
                const exists = await adapter.exists(path);
                if (!exists) {
                    await adapter.write(path, JSON.stringify(fallback, null, 2));
                    return this.normalizeConfig(fallback);
                }
                const content = await adapter.read(path);
                const parsed = JSON.parse(content || '{}');
                return this.normalizeConfig(Object.assign({}, fallback, parsed));
            } catch (_) {
                try { await adapter.write(path, JSON.stringify(fallback, null, 2)); } catch (_) {}
                return this.normalizeConfig(fallback);
            }
        },

        async save(configPath, cfg) {
            const adapter = app?.vault?.adapter;
            if (!adapter || !configPath) return;
            const normalized = this.normalizeConfig(cfg);
            await adapter.write(String(configPath).trim(), JSON.stringify(normalized, null, 2));
        },

        getWeekKey(weekStart = 'monday') {
            // 优先尝试使用 Luxon (如果完整支持)
            try {
                const L = window.TaskDashboardKit?.data?.L;
                if (L && L.DateTime) {
                    let dt = L.DateTime.local();
                    if (weekStart === 'sunday') dt = dt.plus({ days: 1 });
                    
                    // 关键修复：检查 weekYear 和 weekNumber 是否存在 (Shim 可能没有这些属性)
                    if (typeof dt.weekYear === 'number' && typeof dt.weekNumber === 'number') {
                        const yy = String(dt.weekYear).slice(-2);
                        const ww = String(dt.weekNumber).padStart(2, '0');
                        return `${yy}W${ww}`;
                    }
                }
            } catch (_) {}

            // Fallback: 原生 ISO 8601 周数计算
            const d = new Date();
            if (weekStart === 'sunday') {
                // 如果周日作为一周开始，我们将日期+1天，将其伪装成下周一或本周内的某天，
                // 以便利用 ISO (周一作为开始) 的逻辑计算出正确的“周归属”
                d.setDate(d.getDate() + 1);
            }
            
            // ISO 8601: 第一周是包含 1月4日 的那周
            const day = (d.getDay() + 6) % 7; // 将周日(0)转为6, 周一(1)转为0
            const thursday = new Date(d);
            thursday.setDate(d.getDate() - day + 3);
            const firstThursday = new Date(thursday.getFullYear(), 0, 4);
            const diff = thursday - firstThursday;
            const week = 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
            
            const yy = String(thursday.getFullYear()).slice(-2);
            const ww = String(week).padStart(2, '0');
            return `${yy}W${ww}`;
        },

        getWeeklyFilePath(prefix, weekKey) {
            const p = String(prefix || '').trim();
            const k = String(weekKey || '').trim();
            if (!p || !k) return '';
            return `${p}${k}.md`;
        },

        extractUndoneTaskBlocks(content) {
            const lines = String(content || '').split(/\r?\n/);
            const blocks = [];
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // 增强正则：支持 - [ ] 和 * [ ]，容错缩进
                if (!/^\s*[-*]\s\[\s\]/.test(line)) continue;
                
                const b = [line.replace(/\s+$/g, '')];
                let j = i + 1;
                while (j < lines.length) {
                    const l = lines[j];
                    // 遇到下一个任务项，停止
                    if (/^\s*[-*]\s\[[ xX]\]/.test(l)) break;
                    
                    // 遇到空行，保留（可能属于当前任务的间隔）
                    if (l.trim() === '') {
                        b.push('');
                        j += 1;
                        continue;
                    }
                    
                    // 遇到缩进内容（笔记、子项），保留
                    // 判断缩进：只要比任务行缩进深，或者非任务列表项
                    if (/^\s+/.test(l) || !/^\s*[-*]\s/.test(l)) {
                        b.push(l.replace(/\s+$/g, ''));
                        j += 1;
                        continue;
                    }
                    
                    // 遇到非缩进的普通文本，如果是列表符开头，视为新块，停止
                    if (/^\s*[-*]\s/.test(l)) break;
                    
                    // 其他情况（如无缩进文本），视为任务描述的一部分？
                    // 按照通常 Markdown 习惯，无缩进文本会中断列表。停止。
                    break;
                }
                blocks.push(b.join('\n').trimEnd());
                i = j - 1;
            }
            return blocks;
        },

        async ensureWeeklyRollover(configPath, cfg) {
            const weekly = cfg?.weekly;
            if (!weekly || weekly.enabled === false) return;
            const prefix = String(weekly.prefix || '').trim();
            const archiveFolder = String(weekly.archiveFolder || '').trim();
            if (!prefix) return;

            const adapter = app?.vault?.adapter;
            if (!adapter) return;

            const isValidKey = (k) => /^\d{2}W\d{2}$/.test(String(k || ''));
            const currentKey = this.getWeekKey(weekly.weekStart || 'monday');
            if (!isValidKey(currentKey)) return;
            const folderPath = prefix.includes('/') ? prefix.slice(0, prefix.lastIndexOf('/')) : '';
            const baseName = prefix.split('/').pop() || '';
            const keyFromName = (name) => {
                if (!name || !baseName || !name.startsWith(baseName)) return '';
                const rest = name.slice(baseName.length);
                const m = rest.match(/^(\d{2}W\d{2})\.md$/);
                return m ? m[1] : '';
            };
            const keyScore = (k) => {
                const m = String(k || '').match(/^(\d{2})W(\d{2})$/);
                if (!m) return -1;
                return Number(m[1]) * 100 + Number(m[2]);
            };
            const yearFromKey = (k) => {
                const m = String(k || '').match(/^(\d{2})W\d{2}$/);
                return m ? `20${m[1]}` : '';
            };

            const listWeeklyFiles = () => {
                if (!folderPath) return [];
                const folder = app.vault.getAbstractFileByPath(folderPath);
                if (!folder || !folder.children) return [];
                const items = [];
                for (const ch of folder.children) {
                    if (!ch || !ch.path || !ch.name) continue;
                    if (!ch.extension || ch.extension !== 'md') continue;
                    const key = keyFromName(ch.name);
                    if (!key) continue;
                    items.push({ file: ch, key, path: ch.path, name: ch.name });
                }
                return items;
            };

            const allFiles = listWeeklyFiles();
            const hasOldFiles = allFiles.some(f => f.key && f.key !== currentKey);
            // 强制检查：即使 lastWeekKey 相等，只要有旧文件存在，就应该尝试归档
            if (!hasOldFiles) return;

            const newPath = this.getWeeklyFilePath(prefix, currentKey);
            if (newPath) {
                try {
                    const exists = await adapter.exists(newPath);
                    if (!exists) await adapter.write(newPath, "\n\n");
                } catch (_) {}
            }

            let migratedText = "";
            if (weekly.migrateUndone !== false && newPath) {
                // 1. 读取当前周文档内容，用于去重
                let currentContent = "";
                try {
                    const newFile = app.vault.getAbstractFileByPath(newPath);
                    if (newFile) {
                        currentContent = await app.vault.read(newFile);
                    }
                } catch (_) {}
                const currentNorm = String(currentContent || '').toLowerCase();
                const seenKeys = new Set();
                const normalizeTaskKey = (taskLine) => {
                    const raw = String(taskLine || '')
                        .replace(/^\s*[-*]\s\[\s\]\s*/, '')
                        .replace(/^\s*[-*]\s\[[ xX]\]\s*/, '')
                        .trim();
                    const cleaned = raw
                        .replace(/\s*✅\s*\d{4}-\d{2}-\d{2}\s*$/g, '')
                        .replace(/\s*📅\s*\d{4}-\d{2}-\d{2}\s*$/g, '')
                        .replace(/\s+/g, ' ')
                        .trim();
                    return cleaned ? cleaned.toLowerCase() : '';
                };

                const oldItems = allFiles
                    .filter(f => f.key && f.key !== currentKey)
                    .sort((a, b) => keyScore(a.key) - keyScore(b.key));
                
                const parts = [];
                for (const item of oldItems) {
                    try {
                        const prevContent = await app.vault.read(item.file);
                        // extractUndoneTaskBlocks 现在返回数组 string[]
                        const undoneBlocks = this.extractUndoneTaskBlocks(prevContent);
                        
                        if (Array.isArray(undoneBlocks)) {
                            for (const block of undoneBlocks) {
                                // 简单去重逻辑：检查第一行（任务标题行）是否已存在于目标文件
                                // 提取第一行并去掉复选框状态，只比对文本
                                const firstLine = block.split('\n')[0] || "";
                                const key = normalizeTaskKey(firstLine);
                                
                                if (!key) continue;
                                
                                // 如果当前文档已经包含这个任务文本，跳过
                                // 注意：这里使用了简单的 includes，可能会有误判（如果任务文本很短且是另一个任务的子串）
                                // 但对于去重来说，宁可错杀不可放过重复
                                if (currentNorm.includes(key)) continue;
                                if (seenKeys.has(key)) continue;
                                seenKeys.add(key);
                                
                                parts.push(block);
                            }
                        }
                    } catch (_) {}
                }
                migratedText = parts.join("\n\n").trim();
            }

            if (migratedText && newPath) {
                try {
                    const newFile = app.vault.getAbstractFileByPath(newPath);
                    if (newFile) {
                        const cur = await app.vault.read(newFile);
                        const next = (cur || '').trimEnd() + "\n\n" + migratedText + "\n";
                        await app.vault.modify(newFile, next);
                    }
                } catch (_) {}
            }

            if (archiveFolder) {
                try {
                    const folderExists = await adapter.exists(archiveFolder);
                    if (!folderExists) await app.vault.createFolder(archiveFolder);
                } catch (_) {}
                const baseArchive = archiveFolder.replace(/\/+$/,'');
                for (const item of allFiles) {
                    if (!item.key || item.key === currentKey) continue;
                    
                    const year = yearFromKey(item.key);
                    let destDir = baseArchive;
                    if (year) {
                        const yearDir = `${baseArchive}/${year}`;
                        try {
                            const yExists = await adapter.exists(yearDir);
                            if (!yExists) await app.vault.createFolder(yearDir);
                        } catch (_) {}
                        destDir = yearDir;
                    }
                    
                    const archivedPath = `${destDir}/${item.name}`;
                    
                    try {
                        const buildUniquePath = (p) => {
                            const t = Date.now();
                            const s = String(p || '');
                            if (s.toLowerCase().endsWith('.md')) return s.slice(0, -3) + `__dup-${t}.md`;
                            return `${s}__dup-${t}`;
                        };
                        const safeArchiveMove = async (srcFile, preferredDestPath) => {
                            const parentDirOf = (p) => {
                                const s = String(p || '');
                                const idx = s.lastIndexOf('/');
                                return idx > 0 ? s.slice(0, idx) : '';
                            };
                            const ensureDirExists = async (dir) => {
                                const d = String(dir || '').replace(/\/+$/,'');
                                if (!d) return;
                                try {
                                    const ok = await adapter.exists(d);
                                    if (!ok) await app.vault.createFolder(d);
                                } catch (_) {}
                            };
                            const destFile = app.vault.getAbstractFileByPath(preferredDestPath);
                            if (destFile && destFile.extension === 'md') {
                                let a = "";
                                let b = "";
                                try { a = await app.vault.read(srcFile); } catch (_) {}
                                try { b = await app.vault.read(destFile); } catch (_) {}
                                if (a && b && String(a).trim() === String(b).trim()) {
                                    try { await app.vault.trash(srcFile, true); } catch (_) {}
                                    return;
                                }
                                const unique = buildUniquePath(preferredDestPath);
                                await ensureDirExists(parentDirOf(unique));
                                try { await app.vault.rename(srcFile, unique); } catch (_) {}
                                return;
                            }
                            try {
                                const targetExists = await adapter.exists(preferredDestPath);
                                if (targetExists) {
                                    const unique = buildUniquePath(preferredDestPath);
                                    await ensureDirExists(parentDirOf(unique));
                                    try { await app.vault.rename(srcFile, unique); } catch (_) {}
                                    return;
                                }
                            } catch (_) {}
                            try {
                                await ensureDirExists(parentDirOf(preferredDestPath));
                                await app.vault.rename(srcFile, preferredDestPath);
                            } catch (_) {
                                const unique = buildUniquePath(preferredDestPath);
                                await ensureDirExists(parentDirOf(unique));
                                try { await app.vault.rename(srcFile, unique); } catch (_) {}
                            }
                        };

                        if (destDir !== baseArchive) {
                            const rootDup = `${baseArchive}/${item.name}`;
                            try {
                                const rootExists = await adapter.exists(rootDup);
                                if (rootExists) {
                                    const rootFile = app.vault.getAbstractFileByPath(rootDup);
                                    if (rootFile && rootFile.extension === 'md') {
                                        try { await app.vault.rename(rootFile, archivedPath); } catch (_) {}
                                    }
                                }
                            } catch (_) {}
                        }

                        await safeArchiveMove(item.file, archivedPath);
                    } catch (e) {
                        console.error("Weekly Rollover Error:", e);
                    }
                }
            }

            weekly.lastWeekKey = currentKey;
            try { await this.save(configPath, cfg); } catch (_) {}
        }
    },

    // --- 逻辑操作模块 (新增) ---
    action: {
        scheduleDataviewRefresh() {
            const root = window.TaskDashboardKit || {};
            const state = root.__dvRefreshState || (root.__dvRefreshState = { timer: null });
            if (state.timer) clearTimeout(state.timer);
            state.timer = setTimeout(async () => {
                state.timer = null;
                const exec = app?.commands?.executeCommandById?.bind(app.commands);
                if (!exec) return;
                const ids = [
                    "dataview:dataview-rebuild-current-view",
                    "dataview:dataview-force-refresh-views"
                ];
                for (const id of ids) {
                    try {
                        await exec(id);
                        break;
                    } catch (e) {}
                }
            }, 350);
        },
        getRuntime() {
            const root = window.TaskDashboardKit || {};
            return root.__runtime || null;
        },
        buildTaskKey(taskPath, lineNo) {
            return `${String(taskPath || "")}:${String(lineNo)}`;
        },
        _getTaskLine(t) {
            if (!t) return null;
            if (typeof t.line === "number") return t.line;
            if (t.position && t.position.start && typeof t.position.start.line === "number") return t.position.start.line;
            return null;
        },
        _setTaskLine(t, lineNo) {
            if (!t) return;
            if (typeof t.line === "number") t.line = lineNo;
            if (t.position && t.position.start) t.position.start.line = lineNo;
        },
        _stripTaskPrefix(line) {
            return String(line || "").replace(/^\s*[-*]\s*\[[ xX]\]\s+/, "");
        },
        _findTaskIndex(rt, taskPath, lineNo) {
            if (!rt || !Array.isArray(rt.allTasks)) return -1;
            for (let i = 0; i < rt.allTasks.length; i++) {
                const t = rt.allTasks[i];
                const p = t.file?.path || t.path;
                const l = this._getTaskLine(t);
                if (p === taskPath && l === lineNo) return i;
            }
            return -1;
        },
        _shiftTaskLines(rt, taskPath, fromLine, delta) {
            if (!rt || !Array.isArray(rt.allTasks) || !delta) return;
            for (const t of rt.allTasks) {
                const p = t.file?.path || t.path;
                if (p !== taskPath) continue;
                const l = this._getTaskLine(t);
                if (typeof l !== "number") continue;
                if (l >= fromLine) this._setTaskLine(t, l + delta);
            }
        },
        _removeTasksInRange(rt, taskPath, startLine, count) {
            if (!rt || !Array.isArray(rt.allTasks) || !count) return;
            const endLine = startLine + count - 1;
            for (let i = rt.allTasks.length - 1; i >= 0; i--) {
                const t = rt.allTasks[i];
                const p = t.file?.path || t.path;
                if (p !== taskPath) continue;
                const l = this._getTaskLine(t);
                if (typeof l !== "number") continue;
                if (l >= startLine && l <= endLine) rt.allTasks.splice(i, 1);
            }
        },
        _captureAnchor(rt, taskKey) {
            const root = rt?.root;
            const scroller = root?.closest(".view-content") || root?.closest(".markdown-preview-view") || document.scrollingElement || document.documentElement;
            const prevTop = scroller ? scroller.scrollTop : 0;
            if (!root || !taskKey) return { scroller, prevTop, taskKey: null, top: null };
            const esc = window.CSS && CSS.escape ? CSS.escape(taskKey) : String(taskKey).replace(/["\\]/g, "\\$&");
            const el = root.querySelector(`[data-task-key="${esc}"]`);
            if (!el) return { scroller, prevTop, taskKey: null, top: null };
            const rect = el.getBoundingClientRect();
            return { scroller, prevTop, taskKey, top: rect.top };
        },
        _restoreAnchor(rt, anchor) {
            if (!anchor || !anchor.scroller) return;
            const root = rt?.root;
            if (anchor.taskKey && anchor.top != null && root) {
                const esc = window.CSS && CSS.escape ? CSS.escape(anchor.taskKey) : String(anchor.taskKey).replace(/["\\]/g, "\\$&");
                const el = root.querySelector(`[data-task-key="${esc}"]`);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    const delta = rect.top - anchor.top;
                    if (Math.abs(delta) > 0.5) anchor.scroller.scrollTop += delta;
                    return;
                }
            }
            anchor.scroller.scrollTop = anchor.prevTop;
        },
        _captureTaskPositions(root) {
            const map = {};
            if (!root) return map;
            const nodes = root.querySelectorAll('li.task-list-item');
            nodes.forEach(el => {
                // Filter out invisible elements (e.g. inside collapsed details)
                if (el.offsetParent === null) return;
                
                const key = el.dataset.taskKey;
                if (!key) return;
                
                const rect = el.getBoundingClientRect();
                // Strict dimension check
                if (rect.width > 0 && rect.height > 0) {
                    map[key] = { top: rect.top, left: rect.left, el };
                }
            });
            return map;
        },
        _setMotion(type, taskKey, pulse) {
            if (!taskKey) return;
            window.TaskDashboardKit.__motion = {
                type: type || "",
                taskKey,
                pulse: pulse || "",
                prev: null,
                ts: Date.now()
            };
        },
        applyMotion(root) {
            // [Systematic Animation Optimization v4]
            // Fixes: Style loss during gap-fill & unexpected animation of collapsed items
            // 1. Primary Move (Exit): Ghost (Old Pos -> Target 0.5h + Fade Out)
            // 2. Primary Move (Enter): Real Element FLIP (Start Offset -> Target + Fade In + Highlight)
            // 3. Others (Gap Fill): Real Element FLIP (No Ghost, preserves styles)
            // Note: Animation styles are defined in styles.css

            const motion = window.TaskDashboardKit.__motion;
            if (motion && (Date.now() - (motion.ts || 0) > 2000)) {
                window.TaskDashboardKit.__motion = null;
                return;
            }
            if (!motion || !motion.prev || !root) return;
            
            root.querySelectorAll('.td-task-highlight-change').forEach(el => el.classList.remove('td-task-highlight-change'));

            const prev = motion.prev;
            const next = this._captureTaskPositions(root);
            const applyHighlight = (el) => {
                if (!el) return;
                el.classList.remove('td-task-highlight-change');
                void el.offsetWidth;
                el.classList.add('td-task-highlight-change');
                const cleanup = () => {
                    el.classList.remove('td-task-highlight-change');
                    el.removeEventListener('animationend', cleanup);
                };
                el.addEventListener('animationend', cleanup);
            };
            
            // Identify Moving Items
            const moving = [];
            const entering = [];
            
            Object.keys(next).forEach(key => {
                const n = next[key];
                const p = prev[key];
                
                if (p && n.el) {
                     const dx = n.left - p.left;
                     const dy = n.top - p.top;
                     // Threshold to ignore sub-pixel jitters
                     if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                         moving.push({ key, el: n.el, prevRect: p, nextRect: n, dx, dy });
                     }
                } else if (!p && n.el) {
                    entering.push({ key, el: n.el });
                }
            });

            // Helper to copy styles (Only for Ghost)
            const copyComputedStyles = (source, target) => {
                if (!source || !target) return;
                const computed = window.getComputedStyle(source);
                // Copy critical layout properties
                ['width', 'height', 'min-width', 'min-height', 'padding', 'margin', 
                 'border', 'border-radius', 'display', 'flex-direction', 'align-items', 
                 'justify-content', 'font-size', 'line-height', 'color', 'background', 
                 'list-style-type', 'text-align'].forEach(p => target.style[p] = computed[p]);
                target.style.boxSizing = computed.boxSizing;
            };

            // Ghost Root (Only for Primary Exit Ghost)
            let ghostRoot = document.getElementById('td-ghost-root');
            let ghostList = document.getElementById('td-ghost-list');
            
            const ensureGhostEnv = () => {
                 if (!ghostRoot) {
                     ghostRoot = document.createElement('div');
                     ghostRoot.id = 'td-ghost-root';
                     ghostRoot.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:visible;';
                     
                     const container = document.createElement('div');
                     container.className = 'td-container'; // Basic wrapper
                     
                     ghostList = document.createElement('ul');
                     ghostList.id = 'td-ghost-list';
                     ghostList.className = 'contains-task-list'; // Try to match Obsidian list class
                     ghostList.style.cssText = 'padding:0;margin:0;list-style:none;';
                     
                     container.appendChild(ghostList);
                     ghostRoot.appendChild(container);
                     document.body.appendChild(ghostRoot);
                 }
                 return ghostList;
            };

            // Animation Config
            const DURATION = 300; // ms
            const EASING = 'cubic-bezier(0.2, 0, 0.2, 1)';

            moving.forEach(({ key, el, prevRect, nextRect, dx, dy }) => {
                const isPrimary = motion.taskKey && key === motion.taskKey;
                
                if (isPrimary) {
                    // === Action 1: Primary Task Exit (Ghost) ===
                    ensureGhostEnv();
                    
                    const ghost = el.cloneNode(true);
                    copyComputedStyles(el, ghost);
                    ghost.classList.add('td-ghost-task');
                    ghost.style.position = 'fixed';
                    ghost.style.top = `${prevRect.top}px`;
                    ghost.style.left = `${prevRect.left}px`;
                    ghost.style.margin = '0';
                    ghost.style.zIndex = '100'; 
                    ghost.style.opacity = '1';
                    ghost.style.transform = 'translate(0, 0) translateZ(0)';
                    ghost.style.transition = `transform ${DURATION}ms ${EASING}, opacity ${DURATION}ms ease`;
                    
                    if (ghostList) ghostList.appendChild(ghost);
                    
                    void ghost.offsetWidth;
                    requestAnimationFrame(() => {
                        const halfHeight = prevRect.el.offsetHeight * 0.5;
                        const dir = dy > 0 ? 1 : -1;
                        const moveY = halfHeight * dir;
                        ghost.style.transform = `translate(0px, ${moveY}px) translateZ(0)`;
                        ghost.style.opacity = '0';
                    });
                    
                    ghost.addEventListener('transitionend', () => {
                        if(ghost.parentNode) ghost.parentNode.removeChild(ghost);
                        if (ghostList && ghostList.childNodes.length === 0 && ghostRoot && ghostRoot.parentNode) {
                             ghostRoot.parentNode.removeChild(ghostRoot);
                             ghostRoot = null; ghostList = null;
                        }
                    });

                    // === Action 2: Primary Task Enter (Real Element) ===
                    const halfHeight = nextRect.el.offsetHeight * 0.5;
                    const dir = dy > 0 ? 1 : -1;
                    const startOffsetY = -1 * halfHeight * dir; 
                    
                    el.style.opacity = '0';
                    el.style.transform = `translate(0px, ${startOffsetY}px)`;
                    el.style.transition = `transform ${DURATION}ms ${EASING}, opacity ${DURATION}ms ease`;
                    
                    void el.offsetWidth;
                    requestAnimationFrame(() => {
                        el.style.opacity = '1';
                        el.style.transform = `translate(0px, 0px)`;
                        applyHighlight(el); 
                    });
                    
                    const realCleanup = () => {
                        el.style.transition = '';
                        el.style.transform = '';
                        el.style.opacity = '';
                        el.removeEventListener('transitionend', realCleanup);
                        clearTimeout(realFallbackTimer);
                    };
                    el.addEventListener('transitionend', realCleanup);
                    const realFallbackTimer = setTimeout(realCleanup, DURATION + 100);

                } else {
                    // === Action 3: Other Tasks (Gap Fill) - Real Element FLIP ===
                    // Use real element to preserve styles. 
                    // Invert: translate(-dx, -dy) -> Play: translate(0, 0)
                    
                    // 1. Invert
                    el.style.transform = `translate(${-dx}px, ${-dy}px)`;
                    el.style.transition = 'none';
                    el.style.zIndex = '1'; // Slight boost to sit above static bg
                    el.style.position = 'relative'; // Ensure z-index works
                    
                    // 2. Play
                    void el.offsetWidth;
                    requestAnimationFrame(() => {
                        el.style.transition = `transform ${DURATION}ms ${EASING}`;
                        el.style.transform = `translate(0px, 0px)`;
                    });
                    
                    const cleanup = () => {
                        el.style.transition = '';
                        el.style.transform = '';
                        el.style.zIndex = '';
                        el.style.position = '';
                        el.removeEventListener('transitionend', cleanup);
                        clearTimeout(fallbackTimer);
                    };
                    el.addEventListener('transitionend', cleanup);
                    const fallbackTimer = setTimeout(cleanup, DURATION + 100);
                }
            });

            // Handling Entering (New) Tasks
            entering.forEach(({ key, el }) => {
                if (motion.taskKey && el.dataset.taskKey === motion.taskKey) {
                    applyHighlight(el);
                }
                el.classList.add('td-task-enter');
                void el.getBoundingClientRect();
                requestAnimationFrame(() => {
                     el.classList.add('td-task-enter-active');
                     el.classList.remove('td-task-enter');
                });
                const cleanup = () => {
                    el.classList.remove('td-task-enter-active');
                    el.removeEventListener('transitionend', cleanup);
                    clearTimeout(enterFallbackTimer);
                };
                el.addEventListener('transitionend', cleanup);
                const enterFallbackTimer = setTimeout(cleanup, DURATION + 100);
            });
            
            // Fallback Highlight
            if (motion && motion.taskKey && next[motion.taskKey] && next[motion.taskKey].el) {
                const target = next[motion.taskKey].el;
                const isMoving = moving.some(m => m.el === target);
                const isEntering = entering.some(e => e.el === target);
                
                if (!isMoving && !isEntering) {
                     if (motion.pulse === "task" || motion.pulse === "date" || motion.pulse === "time") {
                        applyHighlight(target);
                     }
                }
            }
            
            window.TaskDashboardKit.__motion = null;
        },
        _requestSoftRender(taskPath, lineNo) {
            const rt = this.getRuntime();
            if (!rt || typeof rt.renderContent !== "function") {
                this.scheduleDataviewRefresh();
                return;
            }
            const taskKey = (taskPath && lineNo !== undefined && lineNo !== null) ? this.buildTaskKey(taskPath, lineNo) : null;
            const motion = window.TaskDashboardKit.__motion;
            const skipAnchor = motion && (motion.type === "date" || motion.type === "time");
            const anchor = skipAnchor ? null : this._captureAnchor(rt, taskKey);
            if (motion) {
                motion.anchor = this._captureAnchor(rt, taskKey);
            }
            if (motion && rt.root) {
                motion.prev = this._captureTaskPositions(rt.root);
            }
            rt.renderContent();
            if (!skipAnchor) {
                this._restoreAnchor(rt, anchor);
            }
            // applyMotion will be triggered after full render in renderContent
        },

        // 完成任务并回写文件
        async completeTask(taskPath, lineNo, rawText) {
            const file = app.vault.getAbstractFileByPath(taskPath);
            if (!file) return;
            if (!window.TaskDashboardKit.__motion && taskPath && lineNo !== undefined && lineNo !== null) {
                this._setMotion("complete", this.buildTaskKey(taskPath, lineNo), "task");
            }

            const content = await app.vault.read(file);
            const lines = content.split(/\r?\n/);
            
            if (lineNo >= lines.length) return;
            
            let targetLine = lines[lineNo];
            
            // 简单校验：确保是未完成的任务行 (兼容 - 和 *)
            if (!targetLine.includes("[ ]")) return;

            // 构造完成标记：✅ YYYY-MM-DD
            const { todayISO } = window.TaskDashboardKit.data.getTimeContext();
            const completionTag = ` ✅ ${todayISO}`;
            
            // 替换状态：将第一个 [ ] 替换为 [x]，并追加完成日期
            const newLine = targetLine.replace("[ ]", "[x]") + completionTag;
            lines[lineNo] = newLine;
            let insertedLine = null;

            // [新增] 循环任务自动生成
            // 匹配 🔁 或 recurrence: 
            const recurrenceMatch = targetLine.match(/(?:🔁|recurrence:)\s*([a-zA-Z0-9\s]+)/);
            
            if (recurrenceMatch) {
                try {
                    const rule = recurrenceMatch[1].trim();
                    const L = window.TaskDashboardKit.data.L;
                    
                    // 1. 确定基准日期 (Base Date)
                    const dueMatch = targetLine.match(/📅\s*(\d{4}-\d{1,2}-\d{1,2})/);
                    let baseDate = null;
                    // [优化] 支持大小写不敏感的 when done 检测
                    const isWhenDone = /when\s+done/i.test(rule);
                    
                    if (isWhenDone) {
                        // when done: 基于完成时间 (即今天)
                        baseDate = L.DateTime.fromISO(todayISO);
                    } else {
                        // default: 基于原计划时间 (如果存在)，否则基于今天
                        if (dueMatch) {
                            baseDate = window.TaskDashboardKit.data.extractDateFromText(dueMatch[0]);
                        } else {
                            baseDate = L.DateTime.fromISO(todayISO);
                        }
                    }

                    if (baseDate && baseDate.isValid) {
                        // 2. 解析规则并计算下一次时间
                        // [优化] 移除 when done 时忽略大小写
                        const cleanRule = rule.replace(/when\s+done/gi, "").trim();
                        const parts = cleanRule.split(/\s+/);
                        
                        let interval = 1;
                        let unit = "day"; 
                        
                        // 解析: every [N] [unit]
                        if (parts.length >= 2 && parts[0].toLowerCase() === "every") {
                            const p1 = parseInt(parts[1]);
                            if (!isNaN(p1)) {
                                interval = p1;
                                unit = parts[2] || "day";
                            } else {
                                unit = parts[1] || "day";
                            }
                        }
                        
                        // 归一化单位
                        unit = unit.toLowerCase();
                        if (unit.startsWith("day")) unit = "days";
                        else if (unit.startsWith("week")) unit = "weeks";
                        else if (unit.startsWith("month")) unit = "months";
                        else if (unit.startsWith("year")) unit = "years";
                        
                        const nextDate = baseDate.plus({ [unit]: interval });
                        
                        // 3. 生成新任务行
                        if (nextDate && nextDate.isValid) {
                            const nextDateISO = nextDate.toISODate();
                            let newTaskLine = targetLine; // 使用原始行 (未完成状态)
                            
                            // 更新或追加日期
                            if (dueMatch) {
                                // 只有当有原截止日期时，才能计算偏移并调整其他日期
                                const oldDueDate = window.TaskDashboardKit.data.extractDateFromText(dueMatch[0]);
                                
                                if (oldDueDate && oldDueDate.isValid) {
                                    // Helper to shift dates
                                    const shiftDate = (match, dateStr) => {
                                        let oldDate = null;
                                        try {
                                            // dateStr format: YYYY-MM-DD or YYYY-M-D
                                            const parts = dateStr.split('-');
                                            const y = parts[0];
                                            const M = parts[1].padStart(2, '0');
                                            const d = parts[2].padStart(2, '0');
                                            oldDate = L.DateTime.fromISO(`${y}-${M}-${d}`);
                                        } catch (e) { return match; }

                                        if (oldDate && oldDate.isValid) {
                                            // Gap = Due - Other
                                            // NewOther = NewDue - Gap
                                            const diff = oldDueDate.diff(oldDate);
                                            const newDate = nextDate.minus(diff);
                                            return match.replace(dateStr, newDate.toISODate());
                                        }
                                        return match;
                                    };

                                    // Shift Start 🛫
                                    newTaskLine = newTaskLine.replace(/🛫\s*(\d{4}-\d{1,2}-\d{1,2})/, shiftDate);
                                    
                                    // Shift Scheduled ⏳
                                    newTaskLine = newTaskLine.replace(/⏳\s*(\d{4}-\d{1,2}-\d{1,2})/, shiftDate);
                                }
                                
                                newTaskLine = newTaskLine.replace(dueMatch[0], `📅 ${nextDateISO}`);
                            } else {
                                newTaskLine += ` 📅 ${nextDateISO}`;
                            }
                            
                            // 插入新行
                            lines.splice(lineNo + 1, 0, newTaskLine);
                            insertedLine = newTaskLine;
                        }
                    }
                } catch (e) {
                    console.error("TaskDashboardKit: Failed to process recurrence", e);
                }
            }
            
            try {
                await app.vault.modify(file, lines.join("\n"));
            } catch (e) {
                console.error("TaskDashboardKit: Failed to modify file", e);
                // Revert visual state if failed
                this._requestSoftRender(taskPath, lineNo);
                return;
            }

            const rt = this.getRuntime();
            if (rt) {
                const idx = this._findTaskIndex(rt, taskPath, lineNo);
                if (idx >= 0) {
                    const t = rt.allTasks[idx];
                    t.completed = true;
                    const L = window.TaskDashboardKit.data.L;
                    if (L && L.DateTime) t.completion = L.DateTime.fromISO(todayISO);
                    t.text = this._stripTaskPrefix(newLine);
                } else {
                    console.warn("TaskDashboardKit: Task not found in runtime for optimistic update", taskPath, lineNo);
                }
                if (insertedLine) {
                    this._shiftTaskLines(rt, taskPath, lineNo + 1, 1);
                    const taskText = this._stripTaskPrefix(insertedLine);
                    const newTask = { text: taskText, completed: false, path: taskPath, line: lineNo + 1, file: { path: taskPath } };
                    if (typeof rt.resolveSourceName === "function") newTask.__sourceName = rt.resolveSourceName(taskPath);
                    if (window.TaskDashboardKit.data && window.TaskDashboardKit.data.extractDateFromText) {
                        newTask.due = window.TaskDashboardKit.data.extractDateFromText(taskText);
                    }
                    rt.allTasks.push(newTask);
                }
            }
            this._requestSoftRender(taskPath, lineNo);
        },

        // 取消完成任务并回写文件 (还原状态)
        async uncompleteTask(taskPath, lineNo, rawText) {
            const file = app.vault.getAbstractFileByPath(taskPath);
            if (!file) return;
            if (!window.TaskDashboardKit.__motion && taskPath && lineNo !== undefined && lineNo !== null) {
                this._setMotion("uncomplete", this.buildTaskKey(taskPath, lineNo), "task");
            }

            const content = await app.vault.read(file);
            const lines = content.split(/\r?\n/);
            
            if (lineNo >= lines.length) return;
            
            let targetLine = lines[lineNo];
            
            // 简单校验：确保是已完成的任务行
            if (!targetLine.includes("[x]") && !targetLine.includes("[X]")) return;

            const completionMatch = targetLine.match(/✅\s*(\d{4}-\d{1,2}-\d{1,2})/);
            let completionDate = null;
            if (completionMatch) {
                try {
                    const parts = completionMatch[1].split("-");
                    const y = parts[0];
                    const M = parts[1].padStart(2, "0");
                    const d = parts[2].padStart(2, "0");
                    completionDate = window.TaskDashboardKit.data.L.DateTime.fromISO(`${y}-${M}-${d}`);
                } catch (e) { completionDate = null; }
            }

            // 1. 还原状态 [x] -> [ ] (只替换第一个)
            let newLine = targetLine.replace(/\[[xX]\]/, "[ ]");
            
            // 2. 移除完成时间 ✅ YYYY-MM-DD (及其变体)
            // 匹配 ✅ 2023-01-01 或 ✅ 2023-1-1
            newLine = newLine.replace(/\s*✅\s*\d{4}-\d{1,2}-\d{1,2}/g, "");
            
            lines[lineNo] = newLine;
            let removedRecurringCount = 0;

            const recurrenceMatch = newLine.match(/(?:🔁|recurrence:)\s*([a-zA-Z0-9\s]+)/);
            if (recurrenceMatch) {
                try {
                    const rule = recurrenceMatch[1].trim();
                    const L = window.TaskDashboardKit.data.L;
                    const dueMatch = newLine.match(/📅\s*(\d{4}-\d{1,2}-\d{1,2})/);
                    const isWhenDone = rule.includes("when done");
                    let baseDate = null;

                    if (isWhenDone) {
                        if (completionDate && completionDate.isValid) baseDate = completionDate;
                        else {
                            const { todayISO } = window.TaskDashboardKit.data.getTimeContext();
                            baseDate = L.DateTime.fromISO(todayISO);
                        }
                    } else {
                        if (dueMatch) {
                            baseDate = window.TaskDashboardKit.data.extractDateFromText(dueMatch[0]);
                        } else if (completionDate && completionDate.isValid) {
                            baseDate = completionDate;
                        } else {
                            const { todayISO } = window.TaskDashboardKit.data.getTimeContext();
                            baseDate = L.DateTime.fromISO(todayISO);
                        }
                    }

                    if (baseDate && baseDate.isValid) {
                        const cleanRule = rule.replace("when done", "").trim();
                        const parts = cleanRule.split(/\s+/);

                        let interval = 1;
                        let unit = "day";

                        if (parts.length >= 2 && parts[0].toLowerCase() === "every") {
                            const p1 = parseInt(parts[1]);
                            if (!isNaN(p1)) {
                                interval = p1;
                                unit = parts[2] || "day";
                            } else {
                                unit = parts[1] || "day";
                            }
                        }

                        unit = unit.toLowerCase();
                        if (unit.startsWith("day")) unit = "days";
                        else if (unit.startsWith("week")) unit = "weeks";
                        else if (unit.startsWith("month")) unit = "months";
                        else if (unit.startsWith("year")) unit = "years";

                        const nextDate = baseDate.plus({ [unit]: interval });
                        if (nextDate && nextDate.isValid) {
                            const nextDateISO = nextDate.toISODate();
                            let expectedNewTaskLine = newLine;

                            if (dueMatch) {
                                const oldDueDate = window.TaskDashboardKit.data.extractDateFromText(dueMatch[0]);

                                if (oldDueDate && oldDueDate.isValid) {
                                    const shiftDate = (match, dateStr) => {
                                        let oldDate = null;
                                        try {
                                            const parts = dateStr.split("-");
                                            const y = parts[0];
                                            const M = parts[1].padStart(2, "0");
                                            const d = parts[2].padStart(2, "0");
                                            oldDate = L.DateTime.fromISO(`${y}-${M}-${d}`);
                                        } catch (e) { return match; }

                                        if (oldDate && oldDate.isValid) {
                                            const diff = oldDueDate.diff(oldDate);
                                            const newDate = nextDate.minus(diff);
                                            return match.replace(dateStr, newDate.toISODate());
                                        }
                                        return match;
                                    };

                                    expectedNewTaskLine = expectedNewTaskLine.replace(/🛫\s*(\d{4}-\d{1,2}-\d{1,2})/, shiftDate);
                                    expectedNewTaskLine = expectedNewTaskLine.replace(/⏳\s*(\d{4}-\d{1,2}-\d{1,2})/, shiftDate);
                                }

                                expectedNewTaskLine = expectedNewTaskLine.replace(dueMatch[0], `📅 ${nextDateISO}`);
                            } else {
                                expectedNewTaskLine += ` 📅 ${nextDateISO}`;
                            }

                            if (lineNo + 1 < lines.length && lines[lineNo + 1] === expectedNewTaskLine) {
                                lines.splice(lineNo + 1, 1);
                                removedRecurringCount = 1;
                            }
                        }
                    }
                } catch (e) {
                    console.error("TaskDashboardKit: Failed to rollback recurrence on uncomplete", e);
                }
            }
            
            try {
                await app.vault.modify(file, lines.join("\n"));
            } catch (e) {
                console.error("TaskDashboardKit: Failed to modify file", e);
                this._requestSoftRender(taskPath, lineNo);
                return;
            }

            const rt = this.getRuntime();
            if (rt) {
                const idx = this._findTaskIndex(rt, taskPath, lineNo);
                if (idx >= 0) {
                    const t = rt.allTasks[idx];
                    t.completed = false;
                    t.completion = null;
                    t.text = this._stripTaskPrefix(newLine);
                } else {
                    console.warn("TaskDashboardKit: Task not found in runtime for optimistic uncomplete", taskPath, lineNo);
                }
                if (removedRecurringCount) {
                    this._removeTasksInRange(rt, taskPath, lineNo + 1, removedRecurringCount);
                    this._shiftTaskLines(rt, taskPath, lineNo + 1, -removedRecurringCount);
                }
            }
            this._requestSoftRender(taskPath, lineNo);
        },

        // 删除任务并回写文件 (双向同步)
        async deleteTask(taskPath, lineNo, rawText) {
            const file = app.vault.getAbstractFileByPath(taskPath);
            if (!file) return;
            if (!window.TaskDashboardKit.__motion && taskPath && lineNo !== undefined && lineNo !== null) {
                this._setMotion("delete", this.buildTaskKey(taskPath, lineNo));
            }

            const content = await app.vault.read(file);
            const lines = content.split(/\r?\n/);
            
            if (lineNo >= lines.length) return;
            
            // --- Logic to Identify Subtasks (Recursive Delete) ---
            let count = 1;
            const targetLine = lines[lineNo];
            const parentIndentMatch = targetLine.match(/^\s*/);
            const parentIndent = parentIndentMatch ? parentIndentMatch[0] : "";
            
            // Iterate subsequent lines to find children
            for (let i = lineNo + 1; i < lines.length; i++) {
                const currentLine = lines[i];
                
                // If blank line, check ahead logic
                if (currentLine.trim().length === 0) {
                     let isBlockContinuing = false;
                     // Look ahead for the next non-blank line
                     for (let j = i + 1; j < lines.length; j++) {
                         if (lines[j].trim().length > 0) {
                             const nextIndentMatch = lines[j].match(/^\s*/);
                             const nextIndent = nextIndentMatch ? nextIndentMatch[0] : "";
                             // If next line is deeper than parent, the block continues
                             if (nextIndent.startsWith(parentIndent) && nextIndent.length > parentIndent.length) {
                                 isBlockContinuing = true;
                             }
                             break; // Found non-blank, stop looking
                         }
                     }
                     
                     if (isBlockContinuing) {
                         continue; // Include this blank line in scanning (will be deleted if followed by subtask)
                     } else {
                         break; // Blank line is end of block
                     }
                }
                
                const currentIndentMatch = currentLine.match(/^\s*/);
                const currentIndent = currentIndentMatch ? currentIndentMatch[0] : "";
                
                if (currentIndent.startsWith(parentIndent) && currentIndent.length > parentIndent.length) {
                    // It is a subtask
                    count = (i - lineNo) + 1;
                } else {
                    // Sibling or Parent
                    break;
                }
            }
            
            // Delete parent + all identified subtasks
            lines.splice(lineNo, count);
            
            await app.vault.modify(file, lines.join("\n"));
            const rt = this.getRuntime();
            if (rt) {
                this._removeTasksInRange(rt, taskPath, lineNo, count);
                this._shiftTaskLines(rt, taskPath, lineNo + count, -count);
            }
            this._requestSoftRender(taskPath, lineNo);
        },

        // 显示日期选择器
        showDatePicker(taskPath, lineNo, currentDate, onSelect) {
            const L = window.TaskDashboardKit.data.L;
            const parseISO = (s) => {
                const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
                if (!m) return null;
                return { y: parseInt(m[1], 10), m: parseInt(m[2], 10), d: parseInt(m[3], 10) };
            };
            const todayJs = new Date();
            const todayYMD = { y: todayJs.getFullYear(), m: todayJs.getMonth() + 1, d: todayJs.getDate() };
            let selectedYMD = parseISO(currentDate) || todayYMD;
            let viewYear = selectedYMD.y;
            let viewMonthIndex = selectedYMD.m - 1;
            const renderCalendar = () => {
                const firstDay = new Date(viewYear, viewMonthIndex, 1);
                const weekday0 = firstDay.getDay();
                const lead = weekday0 === 0 ? 6 : weekday0 - 1;
                const daysInMonth = new Date(viewYear, viewMonthIndex + 1, 0).getDate();
                const prevMonthLast = new Date(viewYear, viewMonthIndex, 0).getDate();
                const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
                let daysHtml = weekdays.map(d => `<div class="td-date-picker-weekday">${d}</div>`).join('');
                for (let i = prevMonthLast - lead + 1; i <= prevMonthLast; i++) {
                    daysHtml += `<div class="td-date-picker-day other-month">${i}</div>`;
                }
                const isSame = (a, b) => a.y === b.y && a.m === b.m && a.d === b.d;
                const isAfter = (a, b) => (a.y * 10000 + a.m * 100 + a.d) > (b.y * 10000 + b.m * 100 + b.d);
                const toISO = (y, m, d) => `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                for (let day = 1; day <= daysInMonth; day++) {
                    const ymd = { y: viewYear, m: viewMonthIndex + 1, d: day };
                    const isToday = isSame(ymd, todayYMD);
                    const isSelected = isSame(ymd, selectedYMD);
                    const classes = [
                        'td-date-picker-day',
                        isToday ? 'today' : '',
                        isSelected ? 'selected' : '',
                        ''
                    ].filter(Boolean).join(' ');
                    daysHtml += `<div class="${classes}" data-date="${toISO(ymd.y, ymd.m, ymd.d)}">${day}</div>`;
                }
                const totalCells = lead + daysInMonth;
                const remainingCells = 42 - totalCells;
                for (let i = 1; i <= remainingCells; i++) {
                    daysHtml += `<div class="td-date-picker-day other-month">${i}</div>`;
                }
                return {
                    title: `${viewYear}年${viewMonthIndex + 1}月`,
                    daysHtml
                };
            };
            
            // 创建弹出层
            const overlay = document.createElement('div');
            overlay.className = 'td-date-picker-overlay';
            
            const picker = document.createElement('div');
            picker.className = 'td-date-picker';
            
            const updatePicker = () => {
                const { title, daysHtml } = renderCalendar();
                picker.innerHTML = `
                    <div class="td-date-picker-header">
                        <div class="td-date-picker-title">${title}</div>
                        <div class="td-date-picker-nav">
                            <button id="td-dp-prev">‹</button>
                            <button id="td-dp-next">›</button>
                        </div>
                    </div>
                    <div class="td-date-picker-days">${daysHtml}</div>
                    <div class="td-date-picker-footer">
                        <button class="td-date-picker-btn cancel" id="td-dp-cancel">取消</button>
                        <button class="td-date-picker-btn confirm" id="td-dp-today">今天</button>
                    </div>
                `;
                
                picker.querySelector('#td-dp-prev').onclick = () => {
                    viewMonthIndex -= 1;
                    if (viewMonthIndex < 0) { viewMonthIndex = 11; viewYear -= 1; }
                    updatePicker();
                };
                picker.querySelector('#td-dp-next').onclick = () => {
                    viewMonthIndex += 1;
                    if (viewMonthIndex > 11) { viewMonthIndex = 0; viewYear += 1; }
                    updatePicker();
                };
                picker.querySelector('#td-dp-cancel').onclick = () => {
                    document.body.removeChild(overlay);
                };
                picker.querySelector('#td-dp-today').onclick = () => {
                    selectedYMD = todayYMD;
                    viewYear = todayYMD.y;
                    viewMonthIndex = todayYMD.m - 1;
                    document.body.removeChild(overlay);
                    const iso = `${String(selectedYMD.y).padStart(4,"0")}-${String(selectedYMD.m).padStart(2,"0")}-${String(selectedYMD.d).padStart(2,"0")}`;
                    if (onSelect) onSelect(iso);
                };
                picker.querySelectorAll('.td-date-picker-day:not(.disabled):not(.other-month)').forEach(el => {
                    el.onclick = () => {
                        const dateStr = el.dataset.date;
                        const next = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr||""));
                        if (next) {
                            selectedYMD = { y: parseInt(next[1],10), m: parseInt(next[2],10), d: parseInt(next[3],10) };
                        }
                        document.body.removeChild(overlay);
                        if (onSelect) onSelect(dateStr);
                    };
                });
            };
            
            updatePicker();
            overlay.appendChild(picker);
            document.body.appendChild(overlay);
            
            // 点击遮罩关闭
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    document.body.removeChild(overlay);
                }
            };
        },

        // 更新任务日期
        async updateTaskDate(taskPath, lineNo, oldDate, newDate) {
            const file = app.vault.getAbstractFileByPath(taskPath);
            if (!file) return;
            if (taskPath && lineNo !== undefined && lineNo !== null) {
                this._setMotion("date", this.buildTaskKey(taskPath, lineNo), "date");
            }

            const content = await app.vault.read(file);
            const lines = content.split(/\r?\n/);
            
            if (lineNo >= lines.length) return;
            
            let targetLine = lines[lineNo];
            
            // 尝试替换 📅 后的日期
            const dateRegex = /📅\s*(\d{4}-\d{1,2}-\d{1,2})/;
            const match = targetLine.match(dateRegex);
            
            if (match) {
                // 替换现有日期
                targetLine = targetLine.replace(dateRegex, `📅 ${newDate}`);
            } else {
                // 没有日期，添加到任务文本后
                targetLine = targetLine + ` 📅 ${newDate}`;
            }
            
            lines[lineNo] = targetLine;
            await app.vault.modify(file, lines.join("\n"));
            const rt = this.getRuntime();
            if (rt) {
                const idx = this._findTaskIndex(rt, taskPath, lineNo);
                if (idx >= 0) {
                    const t = rt.allTasks[idx];
                    t.text = this._stripTaskPrefix(targetLine);
                    if (t.originalText != null) t.originalText = t.text;
                    if (window.TaskDashboardKit.data && window.TaskDashboardKit.data.extractDateFromText) {
                        t.due = window.TaskDashboardKit.data.extractDateFromText(t.text);
                    }
                }
            }
            this._requestSoftRender(taskPath, lineNo);
        }
        ,
        showTimePicker(taskPath, lineNo, currentToken, onSelect) {
            const data = window.TaskDashboardKit.data;
            const periods = data.getTimePeriods();
            const overlay = document.createElement('div');
            overlay.className = 'td-date-picker-overlay';
            const picker = document.createElement('div');
            picker.className = 'td-date-picker td-time-picker';

            const normCurrent = data.normalizeTimeToken(currentToken || "");
            const isClock = !!data.parseClockToken(normCurrent);
            const periodOptions = periods.map(p => `<option value="${p.token}">${p.token} (${p.start}-${p.end})</option>`).join('');

            picker.innerHTML = `
                <div class="td-time-picker-header">
                    <div class="td-time-picker-title">设置时间</div>
                    <div class="td-time-picker-note">时段与具体时间二选一，最终只会保存一个</div>
                </div>
                <div class="td-time-picker-body">
                    <div class="td-time-picker-section">
                        <div class="td-time-picker-label">时段</div>
                        <select id="td-tp-period" class="td-time-picker-select">
                            <option value="">请选择</option>
                            ${periodOptions}
                        </select>
                        <div class="td-time-picker-note">选择时段会清空具体时间</div>
                    </div>
                    <div class="td-time-picker-section">
                        <div class="td-time-picker-label">时间 (HH:mm)</div>
                        <input id="td-tp-time" class="td-time-picker-input" type="time" step="60" placeholder="09:30" />
                        <div class="td-time-picker-note">可手动输入，也可上下拨动</div>
                    </div>
                </div>
                <div class="td-date-picker-footer">
                    <button class="td-date-picker-btn cancel" id="td-tp-cancel">取消</button>
                    <button class="td-date-picker-btn confirm" id="td-tp-confirm">确认</button>
                </div>
            `;

            const sel = picker.querySelector('#td-tp-period');
            const input = picker.querySelector('#td-tp-time');
            if (!isClock && periods.some(p => p.token === normCurrent)) {
                sel.value = normCurrent;
            }
            if (isClock) {
                input.value = normCurrent;
            }

            sel.onchange = () => {
                if (sel.value) input.value = "";
            };
            input.oninput = () => {
                if (input.value) sel.value = "";
            };

            picker.querySelector('#td-tp-cancel').onclick = () => {
                document.body.removeChild(overlay);
            };
            picker.querySelector('#td-tp-confirm').onclick = () => {
                const rawInput = String(input.value || "").trim();
                let nextToken = "";
                if (rawInput) {
                    const norm = data.normalizeTimeToken(rawInput);
                    if (norm && data.isTimeToken(norm)) nextToken = norm;
                } else if (sel.value) {
                    nextToken = sel.value;
                }
                document.body.removeChild(overlay);
                if (nextToken && onSelect) onSelect(nextToken);
            };

            overlay.appendChild(picker);
            document.body.appendChild(overlay);
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    document.body.removeChild(overlay);
                }
            };
        },

        async updateTaskTime(taskPath, lineNo, oldToken, newToken) {
            const file = app.vault.getAbstractFileByPath(taskPath);
            if (!file) return;
            if (!newToken) return;
            if (taskPath && lineNo !== undefined && lineNo !== null) {
                this._setMotion("time", this.buildTaskKey(taskPath, lineNo), "time");
            }

            const content = await app.vault.read(file);
            const lines = content.split(/\r?\n/);
            if (lineNo >= lines.length) return;

            let targetLine = lines[lineNo];
            let replaced = false;
            const data = window.TaskDashboardKit.data;
            targetLine = targetLine.replace(/\[([^\[\]]+?)\]/g, (match, inner) => {
                if (replaced) return match;
                const norm = data.normalizeTimeToken(inner);
                if (!norm || !data.isTimeToken(norm)) return match;
                replaced = true;
                return `[${newToken}]`;
            });
            if (!replaced) {
                targetLine = targetLine + ` [${newToken}]`;
            }
            lines[lineNo] = targetLine;
            try {
                await app.vault.modify(file, lines.join("\n"));
            } catch (e) {
                console.error("TaskDashboardKit: Failed to modify file", e);
                this._requestSoftRender(taskPath, lineNo);
                return;
            }
            const rt = this.getRuntime();
            if (rt) {
                const idx = this._findTaskIndex(rt, taskPath, lineNo);
                if (idx >= 0) {
                    const t = rt.allTasks[idx];
                    t.text = this._stripTaskPrefix(targetLine);
                    if (t.originalText != null) t.originalText = t.text;
                } else {
                    console.warn("TaskDashboardKit: Task not found in runtime for optimistic update", taskPath, lineNo);
                }
            }
            this._requestSoftRender(taskPath, lineNo);
        }
    },

    // --- 渲染模块 ---
    render: {
        _getSectionPinStorageKey(type) {
            const vaultName = (app && app.vault && typeof app.vault.getName === "function") ? app.vault.getName() : "vault";
            return `TaskDashboardKit.sectionPin.${vaultName}.${type}`;
        },

        _readSectionPin(type) {
            try {
                const key = this._getSectionPinStorageKey(type);
                const raw = localStorage.getItem(key);
                if (!raw) return null;
                return JSON.parse(raw);
            } catch (e) {
                try {
                    localStorage.removeItem(this._getSectionPinStorageKey(type));
                } catch (e2) {}
                return null;
            }
        },

        _writeSectionPin(type, collapsed) {
            try {
                const data = { pinned: true, collapsed: !!collapsed };
                localStorage.setItem(this._getSectionPinStorageKey(type), JSON.stringify(data));
            } catch (e) {}
        },

        _clearSectionPin(type) {
            try {
                localStorage.removeItem(this._getSectionPinStorageKey(type));
            } catch (e) {}
        },
        
        _getStorageKey(key) {
            const vaultName = (app && app.vault && typeof app.vault.getName === "function") ? app.vault.getName() : "vault";
            return `TaskDashboardKit.${vaultName}.${key}`;
        },
        
        _getStorageItem(key, defaultValue = null) {
            try {
                const fullKey = this._getStorageKey(key);
                const raw = localStorage.getItem(fullKey);
                if (raw === null) return defaultValue;
                try {
                    return JSON.parse(raw);
                } catch (e) {
                    return raw;
                }
            } catch (e) {
                return defaultValue;
            }
        },
        
        _setStorageItem(key, value) {
            try {
                const fullKey = this._getStorageKey(key);
                const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
                localStorage.setItem(fullKey, serialized);
                return true;
            } catch (e) {
                return false;
            }
        },
        
        _removeStorageItem(key) {
            try {
                const fullKey = this._getStorageKey(key);
                localStorage.removeItem(fullKey);
                return true;
            } catch (e) {
                return false;
            }
        },

        // ==========================================
        // 事件委托系统 (Event Delegation System)
        // 性能优化：减少事件监听器数量
        // ==========================================
        _delegatedContainers: new WeakSet(),
        _taskDataCache: new Map(),

        _initDelegatedHandlers(container) {
            if (this._delegatedContainers.has(container)) return;
            this._delegatedContainers.add(container);

            container.addEventListener('click', (e) => {
                const taskItem = e.target.closest('.td-task-item');
                if (!taskItem) return;

                const taskKey = taskItem.dataset.taskKey;
                const taskData = this._taskDataCache.get(taskKey);
                if (!taskData) return;

                if (e.target.matches('.task-list-item-checkbox')) {
                    e.stopPropagation();
                    this._handleCheckboxToggle(taskItem, taskData, e.target);
                } else if (e.target.closest('.td-delete-btn')) {
                    e.stopPropagation();
                    this._handleTaskDelete(taskItem, taskData);
                } else if (e.target.closest('.list-item-part')) {
                    e.stopPropagation();
                    this._handleTaskClick(taskData);
                } else if (e.target.closest('.td-toggle-btn')) {
                    e.stopPropagation();
                    this._handleToggleRemark(taskItem);
                } else if (e.target.closest('.clickable-date')) {
                    e.stopPropagation();
                    this._handleDateClick(taskItem, taskData, e.target.closest('.clickable-date'));
                } else if (e.target.closest('.clickable-time')) {
                    e.stopPropagation();
                    this._handleTimeClick(taskItem, taskData, e.target.closest('.clickable-time'));
                }
            });
        },

        _handleCheckboxToggle(taskItem, taskData, checkbox) {
            if (checkbox.disabled) return;
            checkbox.disabled = true;
            
            const isCompleting = checkbox.checked;
            if (taskItem.dataset.taskKey) {
                window.TaskDashboardKit.action._setMotion(isCompleting ? "complete" : "uncomplete", taskItem.dataset.taskKey, "task");
            }

            if (isCompleting) {
                taskItem.classList.add("td-task-completed-visual");
                setTimeout(() => {
                    taskItem.classList.add("td-task-exit-complete");
                    setTimeout(() => {
                        window.TaskDashboardKit.action.completeTask(taskData.path, taskData.line, taskData.text);
                    }, 350);
                }, 500);
            } else {
                taskItem.classList.remove("td-task-completed-visual");
                taskItem.classList.add("td-task-exit-uncomplete");
                setTimeout(() => {
                    window.TaskDashboardKit.action.uncompleteTask(taskData.path, taskData.line, taskData.text);
                }, 350);
            }
        },

        _handleTaskDelete(taskItem, taskData) {
            if (taskItem.dataset.taskKey) {
                window.TaskDashboardKit.action._setMotion("delete", taskItem.dataset.taskKey);
            }
            
            taskItem.classList.add("td-task-delete-anim");
            setTimeout(() => {
                taskItem.classList.add("td-task-exit-delete");
                setTimeout(() => {
                    window.TaskDashboardKit.action.deleteTask(taskData.path, taskData.line, taskData.text);
                }, 300);
            }, 350);
        },

        _handleTaskClick(taskData) {
            if (!taskData.path) return;
            window.sipNavigationInProgress = true;
            setTimeout(() => window.sipNavigationInProgress = false, 1000);

            const leaf = app.workspace.getLeaf(false);
            const file = app.vault.getAbstractFileByPath(taskData.path);
            if (file) leaf.openFile(file, { eState: { line: taskData.line } });
        },

        _handleToggleRemark(taskItem) {
            const remarkBox = taskItem.querySelector('.td-remark-box');
            const toggleBtn = taskItem.querySelector('.td-toggle-btn');
            if (remarkBox) remarkBox.classList.toggle("visible");
            if (toggleBtn) toggleBtn.classList.toggle("expanded");
        },

        _handleDateClick(taskItem, taskData, pill) {
            const path = pill.dataset.taskPath;
            const line = parseInt(pill.dataset.taskLine, 10);
            const currentDate = pill.textContent.trim().replace(/📅\s*/i, '');

            if (path && !isNaN(line)) {
                window.TaskDashboardKit.action.showDatePicker(path, line, currentDate, (newDate) => {
                    if (taskItem.dataset.taskKey) {
                        window.TaskDashboardKit.action._setMotion("date", taskItem.dataset.taskKey, "date");
                    }
                    window.TaskDashboardKit.action.updateTaskDate(path, line, currentDate, newDate);
                });
            }
        },

        _handleTimeClick(taskItem, taskData, pill) {
            const path = pill.dataset.taskPath;
            const line = parseInt(pill.dataset.taskLine, 10);
            const currentToken = pill.dataset.timeToken || pill.textContent.trim().replace(/🕒\s*/i, '');
            
            if (path && !isNaN(line)) {
                window.TaskDashboardKit.action.showTimePicker(path, line, currentToken, (newToken) => {
                    if (taskItem.dataset.taskKey) {
                        window.TaskDashboardKit.action._setMotion("time", taskItem.dataset.taskKey, "time");
                    }
                    window.TaskDashboardKit.action.updateTaskTime(path, line, currentToken, newToken);
                });
            }
        },

        _cacheTaskData(taskKey, taskData) {
            this._taskDataCache.set(taskKey, taskData);
        },

        applyTagColorStyle(tasks) {
            const styleId = "task-dashboard-kit-tag-style-v4";
            let style = document.getElementById(styleId);
            if (!style) {
                style = document.createElement("style");
                style.id = styleId;
                document.head.appendChild(style);
            }

            const palette = CONFIG.TAG_PALETTE || [];
            if (palette.length === 0) {
                style.textContent = "";
                return;
            }

            const re = /#([\w\u4e00-\u9fa5\-\/]+)/g;
            const order = [];
            const seen = new Set();
            const hiddenTagsRaw = window.TaskDashboardKit?.__config?.ui?.hiddenTags || [];
            const hiddenTags = new Set((Array.isArray(hiddenTagsRaw) ? hiddenTagsRaw : []).map(v => String(v || '').trim()).filter(Boolean));

            for (const t of tasks || []) {
                const txt = t?.text || "";
                re.lastIndex = 0;
                let m;
                while ((m = re.exec(txt)) !== null) {
                    const tag = m[1];
                    if (hiddenTags.has(tag) || hiddenTags.has(String(tag).toLowerCase())) continue;
                    if (seen.has(tag)) continue;
                    seen.add(tag);
                    order.push(tag);
                }
            }

            const esc = (s) => (window.CSS && CSS.escape ? CSS.escape(String(s)) : String(s).replace(/["\\]/g, "\\$&"));

            const key = `${palette.length}:${order.join("|")}`;
            if (window.TaskDashboardKit && window.TaskDashboardKit.__tagStyleKey === key) return;
            if (window.TaskDashboardKit) window.TaskDashboardKit.__tagStyleKey = key;

            let css = "";
            for (let i = 0; i < order.length; i++) {
                const tag = order[i];
                const c = palette[i % palette.length];
                if (!c) continue;
                css += `.td-tag[data-tag="${esc(tag)}"]{background:${c.bg};color:${c.fg};border-color:${c.border};}`;
            }
            style.textContent = css;
        },
        
        renderTaskList(dv, tasks, container, showSubtasks) {
            this._initDelegatedHandlers(container);

            // 清理旧的 source group 元素
            container.querySelectorAll(':scope > .td-source-group').forEach(el => el.remove());

            let ul = container.querySelector("ul.contains-task-list");
            if (!ul) {
                ul = document.createElement("ul");
                ul.className = "contains-task-list";
                container.appendChild(ul);
            }

            if (tasks.length === 0) {
                ul.innerHTML = "";
                container.style.padding = "0";
                return;
            }

            const createItem = (t) => {
                const li = document.createElement("li");
                li.className = "task-list-item";
                const taskPath = t.file?.path || t.path;
                const taskLine = t.line ?? t.position?.start?.line;
                if (taskPath && taskLine !== undefined && taskLine !== null) {
                    li.dataset.taskKey = window.TaskDashboardKit.action.buildTaskKey(taskPath, taskLine);
                }
                
                this._updateItemContent(li, t);
                return li;
            };

            // 1. Build Task ID Set
            const taskIds = new Set();
            tasks.forEach(t => {
                const path = t.file?.path || t.path;
                const line = t.line ?? t.position?.start?.line;
                if (path && line !== undefined) {
                    taskIds.add(path + ":" + line);
                }
            });
            
            // Filter Root Tasks
            const rootTasks = tasks.filter(t => {
                const path = t.file?.path || t.path;
                if (!path) return false;
                if (t.isRemark && !t.parent) return false;
                if (!t.parent) return true; 
                if (t.isRemark) return false;
                let parentLine = t.parent;
                if (typeof t.parent === 'object' && t.parent !== null) {
                    parentLine = t.parent.line ?? t.parent.position?.start?.line;
                }
                const parentId = path + ":" + parentLine;
                return !taskIds.has(parentId);
            });

            // Diff Logic
            const existingNodes = new Map();
            Array.from(ul.children).forEach(li => {
                if(li.dataset.taskKey) existingNodes.set(li.dataset.taskKey, li);
            });

            rootTasks.forEach(t => {
                const taskPath = t.file?.path || t.path;
                const taskLine = t.line ?? t.position?.start?.line;
                const key = window.TaskDashboardKit.action.buildTaskKey(taskPath, taskLine);
                
                let li = existingNodes.get(key);
                if (li) {
                    existingNodes.delete(key);
                    // Check if update needed (simple dirty check based on text/checked)
                    // We always update content for now to ensure reactivity, but DOM is preserved
                    this._updateItemContent(li, t);
                } else {
                    li = createItem(t);
                }
                // appendChild will move the node if it's already in the list
                ul.appendChild(li);
            });

            // Remove orphaned nodes
            existingNodes.forEach(li => li.remove());
        },

        _updateItemContent(li, t) {
            li.classList.remove("td-task-exit-complete", "td-task-exit-uncomplete", "td-task-exit-modern", "td-task-enter", "td-task-enter-active", "td-task-move", "td-task-delete-anim", "td-task-exit-delete", "td-task-completed-visual", "td-task-highlight-change");
            li.style.removeProperty("opacity");
            li.style.removeProperty("transform");
            li.style.removeProperty("transition");
            li.style.removeProperty("position");
            li.style.removeProperty("z-index");
            li.style.removeProperty("margin");
            li.style.removeProperty("padding");
            li.style.removeProperty("width");
            li.style.removeProperty("height");
            
            const taskPath = t.file?.path || t.path;
            const taskLine = t.line ?? t.position?.start?.line;
            const taskKey = li.dataset.taskKey;
            
            // [Event Delegation] Cache task data for delegated handlers
            if (taskKey) {
                this._cacheTaskData(taskKey, {
                    path: taskPath,
                    line: taskLine,
                    text: t.text,
                    completed: t.completed
                });
            }
            
            const processed = window.TaskDashboardKit.data.processTaskText(t);
            const contentHash = `${t.completed}|${processed.textHtml}|${processed.footerHtml}|${(t.children||[]).length}`;
            
            if (li._contentHash === contentHash) {
                const cb = li.querySelector('.task-list-item-checkbox');
                if (cb && cb.checked !== t.completed) cb.checked = t.completed;
                if (cb) cb.disabled = false;
                return;
            }
            li._contentHash = contentHash;

            li.innerHTML = "";
            li.classList.add("td-task-item");
            
            const mainRow = document.createElement("div");
            mainRow.className = "td-task-main-row";
            
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = t.completed;
            checkbox.className = "task-list-item-checkbox";
            mainRow.appendChild(checkbox);

            const textDiv = document.createElement("div");
            textDiv.className = "list-item-part";
            SecurityUtils.safeInnerHTML(textDiv, processed.textHtml);
            mainRow.appendChild(textDiv);
            
            li.appendChild(mainRow);

            if (t.children && t.children.length > 0) {
                const validChildren = t.children.filter(c => c.text);
                if (validChildren.length > 0) {
                    const remarkBox = document.createElement("div");
                    remarkBox.className = "td-remark-box";
                    
                    const listDiv = document.createElement("div");
                    listDiv.className = "td-remark-list";
                    
                    validChildren.forEach(child => {
                        const itemDiv = document.createElement("div");
                        itemDiv.className = "td-remark-item";
                        
                        const iconDiv = document.createElement("div");
                        iconDiv.className = "td-remark-icon";
                        iconDiv.innerHTML = CONFIG.ICONS.remarkBullet;
                        
                        const childTextDiv = document.createElement("div");
                        childTextDiv.className = "td-remark-text";
                        childTextDiv.textContent = child.text;
                        
                        itemDiv.appendChild(iconDiv);
                        itemDiv.appendChild(childTextDiv);
                        listDiv.appendChild(itemDiv);
                    });
                    remarkBox.appendChild(listDiv);
                    
                    li._remarkBox = remarkBox;
                    li.appendChild(remarkBox);
                }
            }

            const footer = document.createElement("div");
            footer.className = "td-meta-footer";
            if (processed.footerHtml) {
                SecurityUtils.safeInnerHTML(footer, processed.footerHtml);
            }

            const actionWrapper = document.createElement("div");
            actionWrapper.className = "td-action-wrapper";

            if (li._remarkBox) {
                const toggleBtn = document.createElement("div");
                toggleBtn.className = "td-toggle-btn";
                toggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
                actionWrapper.appendChild(toggleBtn);
            }

            const delBtn = document.createElement("div");
            delBtn.className = "td-delete-btn";
            delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
            actionWrapper.appendChild(delBtn);
            
            footer.appendChild(actionWrapper);
            li.appendChild(footer);
        },

        // Helper to render source groups (extracted for reuse)
        _renderSourceGroups(dv, container, tasks, type, config) {
            const showSource = config && config.showSource !== false;
            const sourceDisplayMode = config && config.sourceDisplayMode;
            const groupBySource = showSource && sourceDisplayMode === 'group';
            if (groupBySource) {
                const groups = new Map();
                tasks.forEach((t) => {
                    const k = String(t.__sourceName || '').trim() || '其他';
                    if (!groups.has(k)) groups.set(k, []);
                    groups.get(k).push(t);
                });
                const order = window.TaskDashboardKit.__sourceOrder || [];
                const orderIndex = new Map(order.map((v, i) => [String(v), i]));
                const keys = Array.from(groups.keys()).sort((a, b) => {
                    const ia = orderIndex.has(a) ? orderIndex.get(a) : 9999;
                    const ib = orderIndex.has(b) ? orderIndex.get(b) : 9999;
                    if (ia !== ib) return ia - ib;
                    return a.localeCompare(b, 'zh-CN');
                });
                
                container.style.padding = "0";

                // [Optimization] Diff Logic for Groups
                const existingGroups = new Map();
                // We add a class 'td-source-group' to identify these containers
                container.querySelectorAll(':scope > .td-source-group').forEach(el => {
                    if (el.dataset.sourceKey) existingGroups.set(el.dataset.sourceKey, el);
                });

                keys.forEach((k, index) => {
                    const groupTasks = groups.get(k);
                    let groupContainer = existingGroups.get(k);
                    let groupContent;

                    if (groupContainer) {
                        existingGroups.delete(k);
                        // Update Header Count
                        const countSpan = groupContainer.querySelector('.td-group-header > span:last-child');
                        if (countSpan) countSpan.textContent = String(groupTasks.length);
                        
                        // Update Border Top
                        const header = groupContainer.querySelector('.td-group-header');
                        if (header) {
                            if (index > 0) header.style.borderTop = "1px solid rgba(0,0,0,0.05)";
                            else header.style.borderTop = "none";
                        }

                        groupContent = groupContainer.lastChild;
                    } else {
                        // Create New - Using CSS classes instead of inline styles
                        groupContainer = document.createElement("div");
                        groupContainer.className = "td-source-group";
                        groupContainer.dataset.sourceKey = k;
                        
                        // --- Group Header ---
                        const groupHeader = document.createElement("div");
                        groupHeader.className = `td-source-group-header td-source-group-header--${type}`;
                        
                        const left = document.createElement("div");
                        left.className = "td-source-group-header__left";
    
                        const iconSpan = document.createElement("span");
                        iconSpan.className = "td-source-group-header__icon";
                        iconSpan.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
    
                        const titleSpan = document.createElement("span");
                        titleSpan.className = "td-source-group-header__title";
                        titleSpan.textContent = `@${k}`;
                        
                        left.appendChild(iconSpan);
                        left.appendChild(titleSpan);
    
                        const countSpan = document.createElement("span");
                        countSpan.className = "td-source-group-header__count";
                        countSpan.textContent = String(groupTasks.length);
                        
                        groupHeader.appendChild(left);
                        groupHeader.appendChild(countSpan);
    
                        groupContent = document.createElement("div");
                        groupContent.className = "td-source-group-content";
                        
                        const storageKey = `groupPin.${type}.${k}`;
                        let isCollapsed = this._getStorageItem(storageKey) === true;
                        
                        const updateState = () => {
                            if (isCollapsed) {
                                groupContent.classList.add("td-source-group-content--collapsed");
                                groupContent.classList.remove("td-source-group-content--expanded");
                                iconSpan.classList.add("td-source-group-header__icon--collapsed");
                                groupContent.style.maxHeight = "0px";
                            } else {
                                groupContent.classList.remove("td-source-group-content--collapsed");
                                groupContent.classList.add("td-source-group-content--expanded");
                                iconSpan.classList.remove("td-source-group-header__icon--collapsed");
                                
                                groupContent.style.maxHeight = `${groupContent.scrollHeight}px`;
                                const unlock = () => {
                                    if (!isCollapsed) groupContent.style.maxHeight = "none";
                                    groupContent.removeEventListener("transitionend", unlock);
                                };
                                groupContent.addEventListener("transitionend", unlock);
                                setTimeout(unlock, 300);
                            }
                        };
    
                        groupHeader.onclick = () => {
                            isCollapsed = !isCollapsed;
                            this._setStorageItem(storageKey, isCollapsed);
                            updateState();
                        };
    
                        groupContainer.appendChild(groupHeader);
                        groupContainer.appendChild(groupContent);
                        groupContainer._updateState = updateState;
                    }

                    // Render Tasks into Content
                    this.renderTaskList(dv, groupTasks, groupContent, config.showSubtasks);
                    
                    const ul = groupContent.querySelector("ul.contains-task-list");
                    if (ul) {
                        ul.style.paddingLeft = "10px"; 
                        ul.style.paddingRight = "10px";
                        ul.style.marginLeft = "0";
                        ul.style.marginRight = "0";
                    }

                    container.appendChild(groupContainer);
                    if (groupContainer._updateState) groupContainer._updateState();
                });

                existingGroups.forEach(el => el.remove());

            } else {
                // 清理旧的 source group 元素（当从 groupBySource 模式切换过来时）
                container.querySelectorAll(':scope > .td-source-group').forEach(el => el.remove());
                this.renderTaskList(dv, tasks, container, config.showSubtasks);
                if (type === 'forecast' && config && config.forecastDays > 1) {
                    const ul = container.querySelector("ul.contains-task-list");
                    if (ul) {
                        ul.style.paddingLeft = "10px";
                        ul.style.paddingRight = "10px";
                        ul.style.marginLeft = "0";
                        ul.style.marginRight = "0";
                    }
                }
            }
        },

        renderCard(dv, host, title, tasksInput, type, config) {
            // [Fix] Pre-filter tasks
            const batchIds = new Set();
            tasksInput.forEach(t => {
                const path = t.file?.path || t.path;
                const line = t.line ?? t.position?.start?.line;
                if (path && line !== undefined) {
                    batchIds.add(path + ":" + line);
                }
            });

            const tasks = tasksInput.filter(t => {
                if (!t.isRemark) return true;
                if (!t.parent) return false;
                let parentLine;
                if (typeof t.parent === 'object' && t.parent !== null) {
                    parentLine = t.parent.line ?? t.parent.position?.start?.line;
                } else {
                    parentLine = t.parent;
                }
                const path = t.file?.path || t.path;
                const parentId = path + ":" + parentLine;
                return batchIds.has(parentId);
            });

            const { showSubtasks, forecastDays } = config;
            
            // [Diff] Card Container
            let card = host.querySelector('.td-card');
            let body;

            if (!card) {
                // Create New Card
                host.className = `td-section ${type}`;
                host.innerHTML = ""; // Clear just in case
                
                card = document.createElement("div");
                card.className = "td-card";
                card.classList.add('is-collapsible');
                
                // Header
                const header = document.createElement("div");
                header.className = "td-card-header";
                
                let cardThemeRgb = "100, 116, 139"; 
                if (type === 'overdue') cardThemeRgb = "239, 68, 68";
                else if (type === 'today') cardThemeRgb = "124, 58, 237";
                else if (type === 'forecast') cardThemeRgb = "37, 99, 235";
                else if (type === 'completed') cardThemeRgb = "16, 185, 129";
                
                header.style.background = `rgba(${cardThemeRgb}, 0.05)`;
                header.style.borderBottom = `1px solid rgba(${cardThemeRgb}, 0.08)`;

                // Content Structure
                const titleEl = document.createElement("div");
                titleEl.className = "td-card-title";
                
                const rightContainer = document.createElement("div");
                rightContainer.style.display = "flex";
                rightContainer.style.alignItems = "center";
                rightContainer.style.gap = "8px";
                
                const countEl = document.createElement("span");
                countEl.className = "td-count-badge";
                
                const arrowIcon = document.createElement("div");
                arrowIcon.className = "td-collapse-arrow";
                arrowIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
                
                rightContainer.appendChild(countEl);
                rightContainer.appendChild(arrowIcon);
                
                header.appendChild(titleEl);
                header.appendChild(rightContainer);
                
                body = document.createElement("div");
                body.className = "td-card-body";
                
                card.appendChild(header);
                card.appendChild(body);
                host.appendChild(card);
                
                // Collapse Logic
                const pinState = this._readSectionPin(type);
                if (pinState) {
                    if (pinState.collapsed) card.classList.add('collapsed');
                    else card.classList.remove('collapsed');
                } else {
                    if (type === 'undated') card.classList.add('collapsed');
                }
                
                card.onclick = (e) => {
                    if (e.target.closest('.td-card-header')) {
                        card.classList.toggle('collapsed');
                        this._writeSectionPin(type, card.classList.contains('collapsed'));
                    }
                };
            } else {
                body = card.querySelector('.td-card-body');
            }

            // Update Header Info
            const titleEl = card.querySelector('.td-card-title');
            if(titleEl.textContent !== title) titleEl.textContent = title;
            
            const countEl = card.querySelector('.td-count-badge');
            const countClass = tasks.length > 0 ? "td-count-badge has-items" : "td-count-badge";
            if(countEl.className !== countClass) countEl.className = countClass;
            if(countEl.textContent !== String(tasks.length)) countEl.textContent = String(tasks.length);

            // Render Body Content
            if (type === 'forecast' && forecastDays > 1) {
                const groups = window.TaskDashboardKit.data.groupByDate(tasks);
                if (Object.keys(groups).length === 0) {
                     body.innerHTML = "";
                     body.style.padding = "0";
                } else {
                    body.style.padding = "0";
                    
                    // [Diff] Forecast Date Wrappers
                    const existingWrappers = new Map();
                    body.querySelectorAll(':scope > .td-date-wrapper').forEach(el => {
                        if(el.dataset.dateLabel) existingWrappers.set(el.dataset.dateLabel, el);
                    });
                    
                    let dateIndex = 0;
                    // [Fix] Sort dates to ensure consistent order
                    const sortedDates = Object.keys(groups).sort();
                    
                    for (const dateLabel of sortedDates) {
                        const groupTasks = groups[dateLabel];
                        const dateLabelStr = String(dateLabel || '').trim() || '无日期';
                        let dateWrapper = existingWrappers.get(dateLabelStr);
                        let contentContainer;

                        if (dateWrapper) {
                            existingWrappers.delete(dateLabelStr);
                            
                            // [Fix] Force Update Title Text (Defense against numeric index bugs)
                            // The text is in the second span inside .td-date-sub-header > div:first-child
                            // Structure: h5 > left > [icon, text]
                            const leftDiv = dateWrapper.querySelector('.td-date-sub-header > div:first-child');
                            if (leftDiv && leftDiv.children.length > 1) {
                                const textSpan = leftDiv.children[1];
                                if (textSpan.textContent !== dateLabelStr) {
                                    textSpan.textContent = dateLabelStr;
                                }
                            }
                            
                            // Update Count
                            const countSpan = dateWrapper.querySelector('.td-date-sub-header > span:last-child');
                            if(countSpan) countSpan.textContent = String(groupTasks.length);
                            
                            // Update Spacing
                            if (dateIndex > 0) dateWrapper.classList.add('td-date-wrapper-spaced');
                            else dateWrapper.classList.remove('td-date-wrapper-spaced');
                            
                            contentContainer = dateWrapper.lastChild;
                        } else {
                            // Create New
                            dateWrapper = document.createElement("div");
                            dateWrapper.className = "td-date-wrapper"; 
                            dateWrapper.dataset.dateLabel = dateLabelStr;
                            if (dateIndex > 0) dateWrapper.classList.add('td-date-wrapper-spaced');
                            
                            const h5 = document.createElement("div");
                            h5.className = "td-date-sub-header";
                            h5.style.padding = "8px 16px";
                            h5.style.background = "rgba(37, 99, 235, 0.03)"; 
                            h5.style.borderBottom = "1px solid rgba(37, 99, 235, 0.08)";
                            h5.style.color = "#2563EB"; 
                            h5.style.fontWeight = "600"; 
                            h5.style.fontSize = "12px"; 
                            h5.style.display = "flex";
                            h5.style.justifyContent = "space-between";
                            h5.style.alignItems = "center";
                            h5.style.cursor = "pointer";
                            h5.style.userSelect = "none";
                            h5.style.transition = "background 200ms ease, transform 200ms ease, box-shadow 200ms ease";

                            h5.onmouseover = () => { h5.style.background = "rgba(37, 99, 235, 0.06)"; h5.style.transform = "translateY(-1px)"; h5.style.boxShadow = "0 3px 10px rgba(15, 23, 42, 0.08)"; };
                            h5.onmouseout = () => { h5.style.background = "rgba(37, 99, 235, 0.03)"; h5.style.transform = "translateY(0)"; h5.style.boxShadow = "none"; };
                            h5.onmousedown = () => { h5.style.transform = "translateY(0) scale(0.99)"; };
                            h5.onmouseup = () => { h5.style.transform = "translateY(-1px)"; };
                            
                            const left = document.createElement("div");
                            left.style.display = "flex";
                            left.style.alignItems = "center";
                            left.style.gap = "6px";

                            const iconSpan = document.createElement("span");
                            iconSpan.style.display = "flex";
                            iconSpan.style.alignItems = "center";
                            iconSpan.style.color = "#94A3B8";
                            iconSpan.style.transition = "transform 220ms cubic-bezier(0.16, 1, 0.3, 1)";
                            iconSpan.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
                            
                            const dateText = document.createElement("span");
                            dateText.textContent = dateLabelStr;
                            
                            left.appendChild(iconSpan);
                            left.appendChild(dateText);
                            h5.appendChild(left);
                            
                            const countSpan = document.createElement("span");
                            countSpan.textContent = String(groupTasks.length);
                            countSpan.style.fontSize = "11px";
                            countSpan.style.color = "#3B82F6"; 
                            countSpan.style.background = "rgba(37, 99, 235, 0.1)";
                            countSpan.style.padding = "1px 6px";
                            countSpan.style.borderRadius = "99px";
                            h5.appendChild(countSpan);

                            dateWrapper.appendChild(h5);
                            
                            contentContainer = document.createElement("div");
                            contentContainer.style.paddingLeft = (config && config.showSource !== false && config.sourceDisplayMode === 'group') ? "16px" : "0"; 
                            contentContainer.style.overflow = "hidden";
                            contentContainer.style.transition = "max-height 220ms ease, opacity 200ms ease, transform 220ms ease";
                            contentContainer.style.transformOrigin = "top";
                            contentContainer.style.willChange = "max-height, opacity, transform";
                            
                            const storageKey = `datePin.${type}.${dateLabelStr}`;
                            let isCollapsed = this._getStorageItem(storageKey) === true;
                            
                            const updateState = () => {
                                if (isCollapsed) {
                                    contentContainer.style.pointerEvents = "none";
                                    contentContainer.style.opacity = "0";
                                    contentContainer.style.transform = "translateY(-4px)";
                                    if (contentContainer.style.maxHeight === "none" || !contentContainer.style.maxHeight) {
                                        contentContainer.style.maxHeight = `${contentContainer.scrollHeight}px`;
                                        void contentContainer.offsetWidth;
                                    }
                                    requestAnimationFrame(() => {
                                        contentContainer.style.maxHeight = "0px";
                                    });
                                    iconSpan.style.transform = "rotate(0deg)";
                                    if (dateWrapper.classList.contains('td-date-wrapper-spaced')) {
                                        dateWrapper.style.marginTop = "0px";
                                        dateWrapper.style.borderTop = "none";
                                    }
                                } else {
                                    contentContainer.style.pointerEvents = "auto";
                                    contentContainer.style.opacity = "1";
                                    contentContainer.style.transform = "translateY(0)";
                                    
                                    contentContainer.style.maxHeight = `${contentContainer.scrollHeight}px`;
                                    
                                    const unlock = () => {
                                        if (!isCollapsed) contentContainer.style.maxHeight = "none";
                                        contentContainer.removeEventListener("transitionend", unlock);
                                    };
                                    contentContainer.addEventListener("transitionend", unlock);
                                    setTimeout(unlock, 300);
                                    
                                    iconSpan.style.transform = "rotate(90deg)";
                                    if (dateWrapper.classList.contains('td-date-wrapper-spaced')) {
                                        dateWrapper.style.removeProperty('margin-top');
                                        dateWrapper.style.removeProperty('border-top');
                                    }
                                }
                            };
                            
                            if (isCollapsed) {
                                if (dateWrapper.classList.contains('td-date-wrapper-spaced')) {
                                    dateWrapper.style.setProperty('margin-top', '0px', 'important');
                                    dateWrapper.style.borderTop = "none";
                                }
                            }

                            h5.onclick = () => {
                                isCollapsed = !isCollapsed;
                                this._setStorageItem(storageKey, isCollapsed);
                                updateState();
                            };
                            
                            dateWrapper.appendChild(contentContainer);
                            // Attach updateState
                            dateWrapper._updateState = updateState;
                        }

                        this._renderSourceGroups(dv, contentContainer, groupTasks, type, config);
                        
                        body.appendChild(dateWrapper);
                        if(dateWrapper._updateState) dateWrapper._updateState();
                        
                        dateIndex++;
                    }
                    
                    existingWrappers.forEach(el => el.remove());
                }
            } else {
                this._renderSourceGroups(dv, body, tasks, type, config);
            }
        },

        async main(dv, opts = {}) {
            window.TaskDashboardKit.data.L = dv.luxon;
            const container = dv.container;
            const hasCache = opts?.hasCache;
            let skeletonWrapper = container.querySelector('.td-skeleton-wrapper');
            if (skeletonWrapper) {
                skeletonWrapper.style.opacity = '0';
                skeletonWrapper.style.transition = 'opacity 0.15s ease-out';
                requestAnimationFrame(() => {
                    skeletonWrapper.remove();
                });
            }
            
            let root = container.querySelector('.td-container');
            if (!root || root.closest('.td-skeleton-wrapper')) {
                container.innerHTML = "";
                root = document.createElement("div");
                root.className = "td-container";
                container.appendChild(root);
            } else if (hasCache) {
                root.className = "td-container";
            }

            const { todayISO } = window.TaskDashboardKit.data.getTimeContext();

            let headerCard = root.querySelector(".td-header-card");
            if (!headerCard) {
                headerCard = document.createElement("div");
                headerCard.className = "td-header-card";
            }

            const dateParts = todayISO.split('-');
            const year = dateParts[0];
            const dateRest = `${dateParts[1]}-${dateParts[2]}`;

            headerCard.innerHTML = `
                <div class="td-header-top">
                    <div class="td-title-area">
                        <h1>今日聚焦</h1>
                        <p id="td-user-signature" style="cursor: pointer; opacity: 0.8; transition: opacity 0.2s, transform 0.2s;" title="点击自定义签名"></p>
                    </div>
                    <div class="td-date-badge">
                        <span class="year">${year}</span>
                        ${dateRest}
                    </div>
                </div>
            `;

            // User Signature Logic (Migrated to Config)
            const sigEl = headerCard.querySelector("#td-user-signature");
            sigEl.innerText = "Focus on what matters";
            
            sigEl.onmouseover = () => {
                if (document.activeElement !== sigEl) { sigEl.style.opacity = "1"; sigEl.style.transform = "translateY(-1px)"; }
            };
            sigEl.onmouseout = () => {
                if (document.activeElement !== sigEl) { sigEl.style.opacity = "0.8"; sigEl.style.transform = "translateY(0)"; }
            };
            
            sigEl.onclick = (e) => {
                e.stopPropagation();
                if (sigEl.isContentEditable) return;
                
                sigEl.contentEditable = true;
                sigEl.style.cursor = "text";
                sigEl.style.opacity = "1";
                sigEl.style.transform = "translateY(0)";
                sigEl.style.outline = "none";
                sigEl.style.borderBottom = "1px solid var(--text-accent)";
                sigEl.focus();

                // Select all text if it is the default text
                if (sigEl.innerText === "Focus on what matters") {
                    const range = document.createRange();
                    range.selectNodeContents(sigEl);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            };

            const saveSignature = async () => {
                sigEl.contentEditable = false;
                sigEl.style.cursor = "pointer";
                sigEl.style.borderBottom = "none";
                sigEl.style.opacity = "0.8";
                sigEl.style.transform = "translateY(0)";
                
                const val = sigEl.innerText.replace(/\n/g, " ").trim();
                const newValue = val || "Focus on what matters";
                
                // Prevent XSS/HTML injection by setting innerText again
                sigEl.innerText = newValue;
                
                // Write to config file
                const currentConfig = window.TaskDashboardKit.__config || {};
                currentConfig.userSignature = newValue;
                
                // Save to window config object for immediate consistency
                window.TaskDashboardKit.__config = currentConfig;

                const configPath = window.TaskDashboardKit.__configPath;
                if (configPath) {
                    try {
                        await window.TaskDashboardKit.config.save(configPath, currentConfig);
                    } catch (_) {}
                } else {
                    this._setStorageItem('user-signature', newValue);
                }
            };

            sigEl.onblur = saveSignature;

            sigEl.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sigEl.blur();
                }
            };
            if (headerCard.parentElement !== root) {
                root.appendChild(headerCard);
            }
            if (root.firstElementChild !== headerCard) {
                root.insertBefore(headerCard, root.firstElementChild);
            }

            let filterBar = headerCard.querySelector(".td-filter-bar");
            if (!filterBar) {
                filterBar = document.createElement("div");
                filterBar.className = "td-filter-bar";
                headerCard.appendChild(filterBar);
            } else {
                filterBar.innerHTML = "";
            }

            let timelineBody = root.querySelector(".td-timeline-wrapper");
            if (!timelineBody) {
                timelineBody = document.createElement("div");
                timelineBody.className = "td-timeline-wrapper";
                root.appendChild(timelineBody);
            }

            const createSelect = (opts, defaultVal, onChange) => {
                const sel = document.createElement("select");
                sel.className = "td-select";
                opts.forEach(o => {
                    const opt = document.createElement("option");
                    opt.value = o.value;
                    opt.text = o.label;
                    sel.appendChild(opt);
                });
                sel.value = defaultVal;
                sel.addEventListener("change", (e) => onChange(e.target.value));
                return sel;
            };

            const configPath = String(opts?.configPath || '').trim();
            const cfg = await window.TaskDashboardKit.config.load(configPath);
            window.TaskDashboardKit.__config = cfg;
            window.TaskDashboardKit.__configPath = configPath;
            await window.TaskDashboardKit.config.ensureWeeklyRollover(configPath, cfg);

            // Apply signature after config is loaded (fix first-render showing default)
            try {
                const loadedSignature = String(cfg?.userSignature || '').trim();
                const legacySignature = String(this._getStorageItem('user-signature', '')).trim();
                if (!sigEl.isContentEditable) {
                    if (loadedSignature) {
                        sigEl.innerText = loadedSignature;
                    } else if (legacySignature) {
                        sigEl.innerText = legacySignature;
                        cfg.userSignature = legacySignature;
                        window.TaskDashboardKit.__config = cfg;
                        if (configPath) {
                            try { await window.TaskDashboardKit.config.save(configPath, cfg); } catch (_) {}
                        }
                        this._removeStorageItem('user-signature');
                    } else {
                        sigEl.innerText = "Focus on what matters";
                    }
                }
            } catch (_) {}

            const enabledSources = (cfg.sources || []).filter(s => s && s.enabled !== false && s.path);
            window.TaskDashboardKit.__sourceOrder = enabledSources.map(s => String(s.name || s.path || '').trim()).filter(Boolean);
            const folders = enabledSources.filter(s => s.type === 'folder').map(s => s.path);
            const files = enabledSources.filter(s => s.type === 'file').map(s => s.path);
            const excludePathIncludes = Array.isArray(cfg.excludePathIncludes) ? cfg.excludePathIncludes : [];

            const resolveSourceName = (() => {
                const folderSources = enabledSources
                    .filter(s => s.type === 'folder')
                    .map(s => ({ path: s.path.replace(/\/+$/,'') + '/', name: s.name || s.path }))
                    .sort((a, b) => b.path.length - a.path.length);
                const fileSources = new Map(enabledSources.filter(s => s.type === 'file').map(s => [s.path, s.name || s.path]));
                return (filePath) => {
                    const p = String(filePath || '').trim();
                    if (!p) return '';
                    const exact = fileSources.get(p);
                    if (exact) return String(exact);
                    for (const fs of folderSources) {
                        if (p.startsWith(fs.path)) return String(fs.name);
                    }
                    return '';
                };
            })();

            const state = { 
                subtasks: "hide", 
                forecastDays: this._getStorageItem('state.forecastDays') || String(cfg.ui?.forecastDays || 1) 
            };

            let sourceQuery = "";
            if (folders.length > 0) sourceQuery = folders.map(p => `"${p}"`).join(" or ");
            if (files.length > 0) {
                const fileQuery = files.map(p => `"${p}"`).join(" or ");
                sourceQuery = sourceQuery ? `${sourceQuery} or ${fileQuery}` : fileQuery;
            }
            if (!sourceQuery) sourceQuery = `"01-经纬矩阵系统/08-智能录入模块/01-INBOX.md"`;

            const pages = dv.pages(sourceQuery).where(p => !excludePathIncludes.some(s => p.file.path.includes(s)));
            const allTasksRaw = pages.file.tasks;
            const allTasks = Array.from(allTasksRaw || []);
            allTasks.forEach((t) => {
                const p = t.file?.path || t.path;
                t.__sourceName = resolveSourceName(p);
            });

            const clearTimers = () => {
                const timers = window.TaskDashboardKit.__renderTimers || [];
                for (const id of timers) clearTimeout(id);
                window.TaskDashboardKit.__renderTimers = [];
            };

            const renderContent = () => {
                clearTimers();
                const m0 = window.TaskDashboardKit.__motion;
                const capture = root && window.TaskDashboardKit?.action?._captureTaskPositions
                    ? window.TaskDashboardKit.action._captureTaskPositions(root)
                    : {};
                if (!m0) {
                    window.TaskDashboardKit.__motion = { type: "auto", taskKey: "", pulse: "", prev: capture, ts: Date.now() };
                } else if (!m0.prev) {
                    m0.prev = capture;
                }
                
                // [Optimization] Do NOT remove old sections blindly
                // Instead, we get or create stable host containers
                const getHost = (id) => {
                    let el = timelineBody.querySelector(`#td-host-${id}`);
                    if (!el) {
                        el = document.createElement("div");
                        el.id = `td-host-${id}`;
                        timelineBody.appendChild(el);
                    }
                    return el;
                };

                let filtered = window.TaskDashboardKit.data.applyFilters(allTasks, "all", state.subtasks);
                const buckets = window.TaskDashboardKit.data.getBuckets(filtered, { forecastDays: parseInt(state.forecastDays) });
                this.applyTagColorStyle(filtered);

                const config = {
                    showSubtasks: state.subtasks === 'show',
                    forecastDays: parseInt(state.forecastDays),
                    showSource: cfg.ui?.showSource !== false,
                    sourceDisplayMode: cfg.ui?.sourceDisplayMode || 'group'
                };

                const hostOverdue = getHost('overdue');
                const hostToday = getHost('today');
                const hostForecast = getHost('forecast');
                const hostCompleted = getHost('completed');
                const hostUndated = getHost('undated');

                // Overdue
                if (buckets.overdue.length > 0) {
                    hostOverdue.style.display = "block";
                    this.renderCard(dv, hostOverdue, "滞后待办", buckets.overdue, "overdue", config);
                } else {
                    hostOverdue.style.display = "none";
                    hostOverdue.innerHTML = "";
                }

                // Today
                if (buckets.today.length > 0) {
                    hostToday.style.display = "block";
                    this.renderCard(dv, hostToday, "今日待办", buckets.today, "today", config);
                } else {
                    hostToday.style.display = "none";
                    hostToday.innerHTML = "";
                }

                // Forecast
                if (buckets.forecast.length > 0) {
                    hostForecast.style.display = "block";
                    this.renderCard(dv, hostForecast, `未来前瞻 (${state.forecastDays}日)`, buckets.forecast, "forecast", config);
                } else {
                    hostForecast.style.display = "none";
                    hostForecast.innerHTML = "";
                }
                
                // Completed
                if (buckets.completed.length > 0) {
                    hostCompleted.style.display = "block";
                    this.renderCard(dv, hostCompleted, "今日已完结", buckets.completed, "completed", config);
                } else {
                    hostCompleted.style.display = "none";
                    hostCompleted.innerHTML = "";
                }

                // Undated
                if (buckets.undated.length > 0) {
                    hostUndated.style.display = "block";
                    this.renderCard(dv, hostUndated, "待排期", buckets.undated, "undated", config);
                } else {
                    hostUndated.style.display = "none";
                    hostUndated.innerHTML = "";
                }

                this.setupJumpHandler(root);
                if (window.TaskDashboardKit?.action?.applyMotion) {
                    window.TaskDashboardKit.action.applyMotion(root);
                }
            };

            window.TaskDashboardKit.__runtime = {
                root,
                renderContent,
                allTasks,
                resolveSourceName
            };

            const requestRender = () => {
                window.TaskDashboardKit.data.ensureTimePeriodsLoaded()
                    .then(() => renderContent())
                    .catch(() => renderContent());
            };

            filterBar.appendChild(createSelect([
                {value: "1", label: "前瞻 1日"},
                {value: "3", label: "前瞻 3日"},
                {value: "7", label: "前瞻 1周"}
            ], state.forecastDays, (v) => { 
                state.forecastDays = v; 
                this._setStorageItem('state.forecastDays', v);
                requestRender(); 
            }));

            requestRender();
        },

        async config(dv, opts = {}) {
            window.TaskDashboardKit.data.L = dv.luxon;
            const container = dv.container;
            
            let root = container.querySelector('.td-container');
            let skeletonWrapper = container.querySelector('.td-skeleton-wrapper');
            
            if (skeletonWrapper) {
                skeletonWrapper.style.opacity = '0';
                skeletonWrapper.style.transition = 'opacity 0.15s ease-out';
                requestAnimationFrame(() => {
                    skeletonWrapper.remove();
                });
            }
            
            if (!root || root.closest('.td-skeleton-wrapper')) {
                container.innerHTML = "";
                root = document.createElement("div");
                root.className = "td-container";
                container.appendChild(root);
            } else {
                root.innerHTML = "";
            }

            const configPath = String(opts?.configPath || '').trim();
            let cfg = await window.TaskDashboardKit.config.load(configPath);
            window.TaskDashboardKit.__config = cfg;
            window.TaskDashboardKit.__configPath = configPath;

            const card = document.createElement("div");
            card.className = "fv-super-card";
            root.appendChild(card);

            const header = document.createElement("div");
            header.className = "fv-sc-header";
            header.innerHTML = `<div class="fv-sc-title-area"><h2>今日聚焦配置</h2><p>配置来源、显示与换周归档规则 · 所有更改即时生效</p></div>`;
            card.appendChild(header);

            const body = document.createElement("div");
            body.style.padding = "14px 16px";
            card.appendChild(body);

            const openBoard = (targetPath) => {
                try {
                    const file = app.vault.getAbstractFileByPath(targetPath);
                    if (!file) return;
                    const leaf = app.workspace.getLeaf(false);
                    leaf.openFile(file);
                } catch (_) {}
            };

            const guessBoardPath = () => {
                if (!configPath) return "01-经纬矩阵系统/01-看板模块/今日聚焦.md";
                const dir = configPath.split('/').slice(0, -1).join('/');
                return `${dir}/今日聚焦.md`;
            };

            const actionsTop = document.createElement("div");
            actionsTop.className = "td-config-actions";
            actionsTop.style.marginBottom = "12px";
            body.appendChild(actionsTop);

            const btnOpen = document.createElement("button");
            btnOpen.className = "td-btn";
            btnOpen.textContent = "打开今日聚焦";
            btnOpen.onclick = () => openBoard(guessBoardPath());
            actionsTop.appendChild(btnOpen);

            const btnReload = document.createElement("button");
            btnReload.className = "td-btn";
            btnReload.textContent = "重新加载配置";
            btnReload.onclick = async () => {
                cfg = await window.TaskDashboardKit.config.load(configPath);
                window.TaskDashboardKit.__config = cfg;
                renderAll();
            };
            actionsTop.appendChild(btnReload);

            const createSection = (sectionTitle, sectionDesc, boxedBody = false, isMajor = false) => {
                const divider = document.createElement("div");
                divider.className = isMajor ? "td-config-divider major" : "td-config-divider";
                body.appendChild(divider);

                const sec = document.createElement("div");
                sec.className = "td-config-section";
                body.appendChild(sec);

                const h = document.createElement("div");
                sec.appendChild(h);

                const h3 = document.createElement("div");
                h3.className = "td-config-section-title";
                h3.textContent = sectionTitle;
                h.appendChild(h3);

                const p = document.createElement("div");
                p.className = "td-config-section-desc";
                p.textContent = sectionDesc;
                h.appendChild(p);

                let secBody = sec;
                if (boxedBody) {
                    secBody = document.createElement("div");
                    secBody.className = "td-config-section-body";
                    sec.appendChild(secBody);
                }
                return { sec, body: secBody };
            };

            const sourcesSection = createSection(
                "聚焦来源（Source）",
                "选择要汇总的目录/文档，并设置显示名。拖拽条目可调整顺序（影响按来源分组时的显示顺序）。",
                false,
                true
            );

            const sourcesActions = document.createElement("div");
            sourcesActions.className = "td-config-actions";
            sourcesActions.style.marginBottom = "10px";
            sourcesSection.body.appendChild(sourcesActions);

            const sourcesWrap = document.createElement("div");
            sourcesWrap.className = "td-config-sources";
            sourcesSection.body.appendChild(sourcesWrap);

            const sourceDisplaySection = createSection(
                "来源显示",
                "配置来源在任务中的显示方式。",
                false
            );
            const sourceDisplayWrap = document.createElement("div");
            sourceDisplaySection.body.appendChild(sourceDisplayWrap);

            const weeklySection = createSection(
                "换周归档",
                "在每周开始时自动创建新周文件，并将上一周文档移动到归档目录；可选把未完成任务迁移到新周文件。",
                true,
                true
            );
            const weeklyWrap = document.createElement("div");
            weeklySection.body.appendChild(weeklyWrap);

            const uiSection = createSection(
                "看板设置",
                "配置默认前瞻天数、需要隐藏的系统标签（避免影响用户自定义标签）。",
                true,
                true
            );
            const uiWrap = document.createElement("div");
            uiSection.body.appendChild(uiWrap);

            const saveConfig = async () => {
                try {
                    await window.TaskDashboardKit.config.save(configPath, cfg);
                    cfg = await window.TaskDashboardKit.config.load(configPath);
                    window.TaskDashboardKit.__config = cfg;
                    return true;
                } catch (e) {
                    try { new Notice(`❌ 保存失败：${e.message || e}`); } catch (_) {}
                    return false;
                }
            };

            let toastTimeout = null;
            const showSaveToast = () => {
                const existing = document.querySelector(".td-save-toast");
                if (existing) existing.remove();
                if (toastTimeout) clearTimeout(toastTimeout);
                
                const toast = document.createElement("div");
                toast.className = "td-save-toast";
                toast.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>已保存</span>
                `;
                document.body.appendChild(toast);
                
                toastTimeout = setTimeout(() => {
                    toast.classList.add("fade-out");
                    setTimeout(() => toast.remove(), 300);
                }, 1800);
            };

            let saveDebounceTimer = null;
            let saveVersion = 0;
            
            const markChanged = () => { 
                if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
                
                const currentVersion = ++saveVersion;
                
                saveDebounceTimer = setTimeout(async () => {
                    if (currentVersion !== saveVersion) return;
                    
                    const success = await saveConfig();
                    if (success) showSaveToast();
                    saveDebounceTimer = null;
                }, 400);
            };
            
            const markChangedImmediate = async () => {
                ++saveVersion;
                if (saveDebounceTimer) {
                    clearTimeout(saveDebounceTimer);
                    saveDebounceTimer = null;
                }
                const success = await saveConfig();
                if (success) showSaveToast();
            };

            const btnAdd = document.createElement("button");
            btnAdd.className = "td-btn";
            btnAdd.textContent = "新增来源";
            btnAdd.onclick = () => {
                cfg.sources = cfg.sources || [];
                cfg.sources.push({
                    id: `s-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    type: "file",
                    path: "",
                    name: "",
                    enabled: true
                });
                renderSources();
            };
            sourcesActions.appendChild(btnAdd);
            
            const btnSave = document.createElement("button");
            btnSave.className = "td-btn primary";
            btnSave.textContent = "保存配置";
            btnSave.onclick = async () => {
                const success = await saveConfig();
                if (success) showSaveToast();
            };
            sourcesActions.appendChild(btnSave);

            const renderSources = () => {
                sourcesWrap.innerHTML = "";
                const sources = Array.isArray(cfg.sources) ? cfg.sources : [];
                
                // Drag State Closure
                // Note: Since renderSources is re-called, we rely on the loop closure for indices
                // But we need to track the source index globally for the current drag operation
                // We'll attach it to the dataTransfer or a module-level var if needed, 
                // but simpler is to use a variable captured in this scope if we didn't re-render.
                // Since we re-render on drop, we need to be careful.
                // Actually, 'draggedIdx' needs to be available to the drop handler. 
                // Since 'renderSources' re-creates the DOM, the old closure is gone.
                // We can use a property on the container or window, or just rely on the fact that
                // dragstart happens, then drop happens, then we re-render.
                // But wait, if we re-render, the old 'draggedIdx' variable is lost if it's local to renderSources.
                // However, dragstart fires, setting the var. Drop fires (before re-render), using the var.
                // THEN we re-render. So a local variable is fine!
                let draggedIdx = null;

                sources.forEach((s, idx) => {
                    const row = document.createElement("div");
                    row.className = "td-config-source";
                    row.draggable = true;
                    sourcesWrap.appendChild(row);

                    // --- Drag Events (Desktop) ---
                    row.addEventListener('dragstart', (e) => {
                        draggedIdx = idx;
                        row.classList.add('dragging');
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', String(idx));
                    });

                    row.addEventListener('dragend', () => {
                        row.classList.remove('dragging');
                        document.querySelectorAll('.td-config-source').forEach(el => el.classList.remove('drag-over'));
                        draggedIdx = null;
                    });

                    row.addEventListener('dragover', (e) => {
                        e.preventDefault(); 
                        e.dataTransfer.dropEffect = 'move';
                        row.classList.add('drag-over');
                    });

                    row.addEventListener('dragleave', () => {
                        row.classList.remove('drag-over');
                    });

                    row.addEventListener('drop', (e) => {
                        e.preventDefault();
                        row.classList.remove('drag-over');
                        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                        if (isNaN(fromIdx) || fromIdx === idx) return;
                        
                        // Reorder
                        const item = cfg.sources[fromIdx];
                        cfg.sources.splice(fromIdx, 1);
                        cfg.sources.splice(idx, 0, item);
                        renderSources();
                    });

                    // --- Pointer Events (Mobile/Touch) ---
                    // 支持长按拖拽体验优化
                    let pointerDownTimer = null;
                    
                    row.addEventListener('pointerdown', (e) => {
                        // 忽略点击内部输入框或按钮的情况
                        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON') return;
                        
                        // 移动端：长按200ms后触发拖拽状态，避免误触滚动
                        row.setPointerCapture(e.pointerId);
                        
                        pointerDownTimer = setTimeout(() => {
                            draggedIdx = idx;
                            row.classList.add('dragging');
                        }, 200); // 200ms 长按阈值
                    });

                    row.addEventListener('pointermove', (e) => {
                        if (draggedIdx === null) return;
                        if (draggedIdx !== idx) return; // 只处理被拖拽元素自身的移动事件？不，我们需要全局处理
                        // Pointer events logic is complex for sorting.
                        // 简单方案：如果是在拖拽状态下移动，尝试找到当前手指下的元素
                        
                        e.preventDefault(); // 阻止滚动
                        
                        // 找到手指当前所在的元素
                        const elementUnderPointer = document.elementFromPoint(e.clientX, e.clientY);
                        const targetRow = elementUnderPointer ? elementUnderPointer.closest('.td-config-source') : null;
                        
                        if (targetRow && targetRow !== row) {
                            // 简单的视觉反馈
                            document.querySelectorAll('.td-config-source').forEach(el => el.classList.remove('drag-over'));
                            targetRow.classList.add('drag-over');
                        }
                    });

                    row.addEventListener('pointerup', (e) => {
                        clearTimeout(pointerDownTimer);
                        if (draggedIdx !== null) {
                            // 释放时，检查是否在某个目标上
                            const elementUnderPointer = document.elementFromPoint(e.clientX, e.clientY);
                            const targetRow = elementUnderPointer ? elementUnderPointer.closest('.td-config-source') : null;
                            
                            if (targetRow && targetRow !== row) {
                                // 找到目标行的索引
                                // 这种方式比较笨拙，但有效
                                const allRows = Array.from(sourcesWrap.children);
                                const targetIdx = allRows.indexOf(targetRow);
                                
                                if (targetIdx !== -1 && targetIdx !== draggedIdx) {
                                    const item = cfg.sources[draggedIdx];
                                    cfg.sources.splice(draggedIdx, 1);
                                    cfg.sources.splice(targetIdx, 0, item);
                                    renderSources();
                                    return; // re-rendered
                                }
                            }
                            
                            row.classList.remove('dragging');
                            document.querySelectorAll('.td-config-source').forEach(el => el.classList.remove('drag-over'));
                            draggedIdx = null;
                        }
                        if (row.hasPointerCapture(e.pointerId)) row.releasePointerCapture(e.pointerId);
                    });
                    
                    row.addEventListener('pointercancel', (e) => {
                        clearTimeout(pointerDownTimer);
                        row.classList.remove('dragging');
                        document.querySelectorAll('.td-config-source').forEach(el => el.classList.remove('drag-over'));
                        draggedIdx = null;
                        if (row.hasPointerCapture(e.pointerId)) row.releasePointerCapture(e.pointerId);
                    });

                    // --- Content ---
                    // 桌面端布局容器
                    const enabled = document.createElement("input");
                    enabled.type = "checkbox";
                    enabled.checked = s.enabled !== false;
                    enabled.onchange = () => { s.enabled = enabled.checked; };

                    const name = document.createElement("input");
                    name.type = "text";
                    name.placeholder = "显示名";
                    name.value = String(s.name || "");
                    name.oninput = () => { s.name = name.value; };

                    const typeSel = document.createElement("select");
                    [{value:"file",label:"文件"},{value:"folder",label:"目录"}].forEach(o => {
                        const opt = document.createElement("option");
                        opt.value = o.value;
                        opt.text = o.label;
                        typeSel.appendChild(opt);
                    });
                    typeSel.value = s.type === "folder" ? "folder" : "file";
                    typeSel.onchange = () => { s.type = typeSel.value; };

                    const path = document.createElement("input");
                    path.type = "text";
                    path.placeholder = "vault 相对路径";
                    path.value = String(s.path || "");
                    path.oninput = () => { s.path = path.value; };

                    const del = document.createElement("button");
                    del.className = "td-btn danger";
                    del.textContent = "删除";
                    del.onclick = () => {
                        cfg.sources = (cfg.sources || []).filter((_, i) => i !== idx);
                        renderSources();
                    };

                    // 响应式布局：检测屏幕宽度
                    const isMobile = window.innerWidth <= 600;
                    
                    if (isMobile) {
                        // 移动端卡片布局
                        const header = document.createElement("div");
                        header.className = "td-source-header";
                        
                        const enabledMobile = document.createElement("input");
                        enabledMobile.type = "checkbox";
                        enabledMobile.checked = s.enabled !== false;
                        enabledMobile.onchange = () => { s.enabled = enabledMobile.checked; };
                        header.appendChild(enabledMobile);
                        
                        const nameMobile = document.createElement("input");
                        nameMobile.type = "text";
                        nameMobile.placeholder = "显示名";
                        nameMobile.value = String(s.name || "");
                        nameMobile.style.flex = "1";
                        nameMobile.oninput = () => { s.name = nameMobile.value; };
                        header.appendChild(nameMobile);
                        
                        row.appendChild(header);
                        
                        const main = document.createElement("div");
                        main.className = "td-source-main";
                        
                        const pathMobile = document.createElement("input");
                        pathMobile.type = "text";
                        pathMobile.placeholder = "vault 相对路径";
                        pathMobile.value = String(s.path || "");
                        pathMobile.oninput = () => { s.path = pathMobile.value; };
                        main.appendChild(pathMobile);
                        
                        const typeSelMobile = document.createElement("select");
                        [{value:"file",label:"文件"},{value:"folder",label:"目录"}].forEach(o => {
                            const opt = document.createElement("option");
                            opt.value = o.value;
                            opt.text = o.label;
                            typeSelMobile.appendChild(opt);
                        });
                        typeSelMobile.value = s.type === "folder" ? "folder" : "file";
                        typeSelMobile.onchange = () => { s.type = typeSelMobile.value; };
                        main.appendChild(typeSelMobile);
                        
                        row.appendChild(main);
                        
                        const actions = document.createElement("div");
                        actions.className = "td-source-actions";
                        
                        const delMobile = document.createElement("button");
                        delMobile.className = "td-btn danger";
                        delMobile.textContent = "删除";
                        delMobile.style.flex = "1";
                        delMobile.onclick = () => {
                            cfg.sources = (cfg.sources || []).filter((_, i) => i !== idx);
                            renderSources();
                        };
                        actions.appendChild(delMobile);
                        
                        const dragHint = document.createElement("span");
                        dragHint.style.cssText = "font-size:11px;color:#94A3B8;margin-left:auto;";
                        dragHint.textContent = "⇄ 长按拖拽排序";
                        actions.appendChild(dragHint);
                        
                        row.appendChild(actions);
                    } else {
                        // 桌面端横向布局
                        row.appendChild(enabled);
                        row.appendChild(name);
                        row.appendChild(typeSel);
                        row.appendChild(path);
                        row.appendChild(del);
                    }
                });
            };

            const renderWeekly = () => {
                weeklyWrap.innerHTML = "";
                cfg.weekly = cfg.weekly || {};

                const rowEnabled = document.createElement("div");
                rowEnabled.className = "td-config-row";
                weeklyWrap.appendChild(rowEnabled);
                rowEnabled.appendChild(Object.assign(document.createElement("label"), { textContent: "启用" }));
                
                const enabledCtrl = createSegmentedControl(
                    [{value:"true",label:"启用"},{value:"false",label:"停用"}],
                    cfg.weekly.enabled === false ? "false" : "true",
                    (val) => { 
                        cfg.weekly.enabled = val !== "false";
                        markChanged();
                    }
                );
                rowEnabled.appendChild(enabledCtrl);

                const rowStart = document.createElement("div");
                rowStart.className = "td-config-row";
                weeklyWrap.appendChild(rowStart);
                rowStart.appendChild(Object.assign(document.createElement("label"), { textContent: "周起始日" }));
                
                const startCtrl = createSegmentedControl(
                    [{value:"monday",label:"周一"},{value:"sunday",label:"周日"}],
                    cfg.weekly.weekStart === "sunday" ? "sunday" : "monday",
                    (val) => { 
                        cfg.weekly.weekStart = val;
                        markChanged();
                    }
                );
                rowStart.appendChild(startCtrl);

                const rowPrefix = document.createElement("div");
                rowPrefix.className = "td-config-row";
                weeklyWrap.appendChild(rowPrefix);
                rowPrefix.appendChild(Object.assign(document.createElement("label"), { textContent: "周文件前缀" }));
                const wPrefix = document.createElement("input");
                wPrefix.type = "text";
                wPrefix.value = String(cfg.weekly.prefix || "");
                wPrefix.oninput = () => { 
                    cfg.weekly.prefix = wPrefix.value;
                    markChanged();
                };
                rowPrefix.appendChild(wPrefix);

                const rowArchive = document.createElement("div");
                rowArchive.className = "td-config-row";
                weeklyWrap.appendChild(rowArchive);
                rowArchive.appendChild(Object.assign(document.createElement("label"), { textContent: "归档目录" }));
                const wArchive = document.createElement("input");
                wArchive.type = "text";
                wArchive.value = String(cfg.weekly.archiveFolder || "");
                wArchive.oninput = () => { 
                    cfg.weekly.archiveFolder = wArchive.value;
                    markChanged();
                };
                rowArchive.appendChild(wArchive);

                const rowMove = document.createElement("div");
                rowMove.className = "td-config-row";
                weeklyWrap.appendChild(rowMove);
                rowMove.appendChild(Object.assign(document.createElement("label"), { textContent: "迁移未完成" }));
                
                const moveCtrl = createSegmentedControl(
                    [{value:"true",label:"是"},{value:"false",label:"否"}],
                    cfg.weekly.migrateUndone === false ? "false" : "true",
                    (val) => { 
                        cfg.weekly.migrateUndone = val !== "false";
                        markChanged();
                    }
                );
                rowMove.appendChild(moveCtrl);
            };

            const createSegmentedControl = (options, currentValue, onChange) => {
                const wrap = document.createElement("div");
                wrap.style.cssText = "display:inline-flex;background:#F1F5F9;border-radius:8px;padding:2px;width:fit-content;";
                
                const updateAll = () => {
                    wrap.querySelectorAll("button").forEach(btn => {
                        const isActive = btn.dataset.value === currentValue;
                        btn.style.background = isActive ? "#8B5CF6" : "transparent";
                        btn.style.color = isActive ? "#fff" : "#64748b";
                        btn.style.boxShadow = isActive ? "0 1px 3px rgba(139,92,246,0.3)" : "none";
                    });
                };
                
                options.forEach(opt => {
                    const btn = document.createElement("button");
                    btn.textContent = opt.label;
                    btn.dataset.value = opt.value;
                    btn.style.cssText = "padding:5px 12px;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;transition:all 0.15s;";
                    btn.onclick = () => {
                        if (currentValue !== opt.value) {
                            currentValue = opt.value;
                            updateAll();
                            if (typeof onChange === "function") onChange(opt.value);
                        }
                    };
                    wrap.appendChild(btn);
                });
                
                updateAll();
                
                wrap.setValue = (val) => {
                    currentValue = val;
                    updateAll();
                };
                wrap.getValue = () => currentValue;
                
                return wrap;
            };

            const renderSourceDisplay = () => {
                sourceDisplayWrap.innerHTML = "";
                cfg.ui = cfg.ui || {};

                const rowShowSource = document.createElement("div");
                rowShowSource.className = "td-config-row";
                sourceDisplayWrap.appendChild(rowShowSource);
                rowShowSource.appendChild(Object.assign(document.createElement("label"), { textContent: "显示来源" }));
                
                const showSourceCtrl = createSegmentedControl(
                    [{value:"true",label:"是"},{value:"false",label:"否"}],
                    cfg.ui.showSource === false ? "false" : "true",
                    (val) => { 
                        cfg.ui.showSource = val !== "false";
                        modeRow.style.display = cfg.ui.showSource ? "" : "none";
                        markChanged();
                    }
                );
                rowShowSource.appendChild(showSourceCtrl);

                const modeRow = document.createElement("div");
                modeRow.className = "td-config-row";
                if (cfg.ui.showSource === false) modeRow.style.display = "none";
                sourceDisplayWrap.appendChild(modeRow);
                modeRow.appendChild(Object.assign(document.createElement("label"), { textContent: "显示方式" }));
                
                const modeCtrl = createSegmentedControl(
                    [{value:"group",label:"分组显示"},{value:"capsule",label:"胶囊显示"}],
                    cfg.ui.sourceDisplayMode || "group",
                    (val) => {
                        cfg.ui.sourceDisplayMode = val;
                        markChanged();
                    }
                );
                modeRow.appendChild(modeCtrl);
            };

            const renderUi = () => {
                uiWrap.innerHTML = "";
                cfg.ui = cfg.ui || {};

                const rowForecast = document.createElement("div");
                rowForecast.className = "td-config-row";
                uiWrap.appendChild(rowForecast);
                rowForecast.appendChild(Object.assign(document.createElement("label"), { textContent: "默认前瞻" }));
                
                const forecastCtrl = createSegmentedControl(
                    [{value:"1",label:"1日"},{value:"3",label:"3日"},{value:"7",label:"1周"}],
                    String(cfg.ui.forecastDays || 1),
                    (val) => { 
                        cfg.ui.forecastDays = parseInt(val);
                        markChanged();
                    }
                );
                rowForecast.appendChild(forecastCtrl);

                const rowHide = document.createElement("div");
                rowHide.className = "td-config-row";
                uiWrap.appendChild(rowHide);
                rowHide.appendChild(Object.assign(document.createElement("label"), { textContent: "隐藏标签" }));
                const ta = document.createElement("textarea");
                ta.rows = 3;
                ta.value = Array.isArray(cfg.ui.hiddenTags) ? cfg.ui.hiddenTags.join("\n") : "";
                ta.oninput = () => {
                    cfg.ui.hiddenTags = ta.value.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
                    markChanged();
                };
                rowHide.appendChild(ta);
            };

            const renderAll = () => {
                renderSources();
                renderSourceDisplay();
                renderWeekly();
                renderUi();
            };

            renderAll();
        },

        setupJumpHandler(container) {
            container.addEventListener("click", (e) => {
                const a = e.target.closest("a.internal-link, a[data-href]");
                if (a) window.__forceEditOnNextOpen = true;
            }, true);
            
            if (!window.__editModeListenerInstalled) {
                app.workspace.on("file-open", () => {
                    if (window.__forceEditOnNextOpen) {
                        window.__forceEditOnNextOpen = false;
                        const leaf = app.workspace.getActiveLeaf();
                        if (leaf && leaf.view && leaf.view.setMode) leaf.view.setMode("source");
                    }
                });
                window.__editModeListenerInstalled = true;
            }
        }
    }
};
