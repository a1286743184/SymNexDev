/**
 * TaskDashboardKit.js v4.1
 * Modern Task Management Dashboard
 * 现代化任务看板核心库 - 包含逻辑处理与视觉渲染
 * 
 * Update: v4.1
 * - 优化：调整子项筛选逻辑 (Hide Subtasks 改为折叠模式，保留无父项的子任务)
 * - 修复：移动端 Banner 布局 (强制纵向排列，防止下拉框挤压)
 * 
 * Update: v4.0
 * - 修复：支持非标准日期格式 (YYYY-M-D) 的解析与过滤
 * - 优化：移动端左侧留白与布局深度微调
 * - 增强：暴露更多布局参数到 CONFIG
 * - 新增：任务完成状态双向同步 (自动修改源文件)
 */

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
            transition: all 0.3s ease;
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
            transition: transform 0.2s;
        }
        .td-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

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
        }
        .td-card-body li.task-list-item:last-child { border-bottom: none; }
        
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
            padding: 3px 12px; /* Reduced vertical padding */
            border-radius: 4px; 
            border: 1px solid #F8FAFC;
            border-left: 3px solid #E2E8F0; 
            border-right: 3px solid #E2E8F0;
            
            /* Update: 允许换行，不再横向滚动 */
            white-space: pre-wrap; 
            word-break: break-word;
            overflow-x: visible; 
            overflow-y: visible;
            
            max-width: 100%;
            min-width: 0; 
            margin-top: 4px;
            margin-left: ${L.remarkIndent}; /* 使用统一后的缩进 */
            
            cursor: text;
            display: none; /* 默认隐藏 */
        }
        .td-remark-box.visible { display: block; } /* 展开时显示 */

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
            transition: all 0.2s;
            display: flex;
            align-items: center;
            transform: rotate(0deg);
        }
        .td-toggle-btn.expanded { transform: rotate(180deg); color: ${C.iconToggle}; }
        
        /* 悬停显示控制 */
        li.task-list-item:hover .td-delete-btn,
        li.task-list-item:hover .td-toggle-btn { opacity: 1; }
        
        .td-toggle-btn:hover { color: ${C.primary}; background: #F3E8FF; border-radius: 4px; }

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

        /* 折叠板块样式 */
        .td-card.is-collapsible .td-card-header {
            cursor: pointer;
            transition: background 0.2s;
        }
        .td-card.is-collapsible .td-card-header:hover {
            background: #F1F5F9;
        }
        .td-card.is-collapsible.collapsed .td-card-body {
            display: none;
        }
        .td-card.is-collapsible .td-card-title::after {
            content: "";
            display: block;
            width: 16px; height: 16px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
            background-size: contain;
            margin-left: 6px;
            transition: transform 0.2s;
        }
        .td-card.is-collapsible.collapsed .td-card-title::after {
            transform: rotate(-90deg);
        }

        .td-pin-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            padding: 0;
            border-radius: 6px;
            color: ${C.textSub};
            cursor: pointer;
            flex-shrink: 0;
            transition: background 0.2s, color 0.2s;
        }
        .td-pin-btn:hover { background: #E2E8F0; color: ${C.textMain}; }
        .td-pin-btn.pinned { background: #E2E8F0; color: ${C.textMain}; }
        .td-pin-btn svg { width: 14px; height: 14px; }
        .td-section.overdue .td-pin-btn.pinned { background: #EF44441A; color: ${C.danger}; }
        .td-section.today .td-pin-btn.pinned { background: #7C3AED1A; color: ${C.primary}; }
        .td-section.forecast .td-pin-btn.pinned { background: #2563EB1A; color: ${C.secondary}; }
        .td-section.completed .td-pin-btn.pinned { background: #10B9811A; color: ${C.success}; }

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
            transition: all 0.2s;
            display: flex;
            align-items: center;
        }
        /* .td-task-main-row:hover .td-delete-btn { opacity: 1; } Removed, handled by li:hover */
        .td-delete-btn:hover { color: #EF4444; background: #FEE2E2; border-radius: 4px; }
        
        /* 移动端适配 */
        @media (max-width: 768px) {
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
        
        /* 分组标题 */
        .td-group-header {
            font-size: 11px;
            color: ${C.textSub};
            font-weight: 700;
            margin: 10px 0 4px 0;
            padding-bottom: 2px;
            border-bottom: 1px solid #F1F5F9;
        }

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
            overflow: hidden;
        }
        .td-config-source {
            display: grid;
            grid-template-columns: 26px 90px 90px 1fr 70px;
            gap: 8px;
            align-items: center;
            padding: 10px;
            border-top: 1px solid #F1F5F9;
            background: #FFFFFF;
        }
        .td-config-source:first-child { border-top: none; }
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
                gap: 8px; /* 减小间距 */
                min-height: auto;
            }
            
            /* 移动端顶部区域优化：横向排列，突出日期 */
            .td-header-top {
                margin-bottom: 4px;
                align-items: center;
            }

            .td-title-area h1 { 
                font-size: ${M.headerTitleSize}; 
                line-height: 1.2;
                margin-bottom: 0;
            }
            .td-title-area p { display: none; } /* 隐藏副标题节省空间 */

            .td-date-badge { 
                padding: 0; 
                font-size: 24px; /* 恢复大字号 */
                align-self: center; 
                background: transparent;
                text-align: right;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
            }
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
            // 优先解析时间段标记 [上午]、[下午] 等，返回今天的日期
            const timeMatch = text.match(/\[(凌晨|早上|上午|中午|下午|晚上|早|中|下|晚)\]/);
            if (timeMatch) {
                const { today } = this.getTimeContext();
                return today;
            }
            
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

            // 增强版日期获取：优先用 t.due，如果没有，尝试从文本解析
            const getDue = (t) => {
                if (t.due) return t.due;
                const result = this.extractDateFromText(t.text || "");
                return result;
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
                const isScheduledReady = t.scheduled && t.scheduled <= today;
                return isDueToday || isScheduledReady;
            }).sort((a, b) => this.compareTasks(a, b, (t) => (getDue(t) ?? t.scheduled)));

            // 3. 未来前瞻
            const forecastDays = config.forecastDays || 1;
            const startForecast = tomorrow;
            const endForecast = startForecast.plus({ days: forecastDays - 1 }).endOf('day');
            
            const forecast = tasks.filter(t => {
                if (t.completed || isCancelled(t)) return false;
                const planDate = getDue(t) ?? t.scheduled;
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
                const weekday = d ? d.weekdayShort : "";
                const key = `${dateKey} ${weekday}`;
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

            // Helper: 生成 Pill HTML
            const createPill = (icon, label, className = "") => {
                return `<span class="td-meta-pill ${className}">${icon} ${label}</span>`;
            };

            // 0. 处理 #标签 (提取并放入 tags 数组)
            // Fix: Support hyphen and slash in tags
            text = text.replace(/#([\w\u4e00-\u9fa5\-\/]+)/g, (match, tagName) => {
                if (hiddenTags.has(tagName) || hiddenTags.has(String(tagName).toLowerCase())) return "";
                // 生成 Tag HTML，样式已调整为与时间一致
                tags.push(`<span class="td-meta-pill td-tag" data-tag="${tagName}">${match}</span>`);
                return ""; 
            });

            // 1. Due Date: 📅 YYYY-M-D (支持 1位或2位数字)
            let dueDate = null;
            let datePill = ""; 
            text = text.replace(/📅\s*(\d{4}-\d{1,2}-\d{1,2})/g, (match, dateStr) => {
                let isoStr = dateStr;
                try {
                     const parts = dateStr.split('-');
                     isoStr = `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`;
                     dueDate = window.TaskDashboardKit.data.L.DateTime.fromISO(isoStr);
                } catch(e){}

                const displayDate = dueDate ? dueDate.toISODate() : dateStr;
                datePill = createPill(I.calendar, displayDate, "is-due");
                return ""; 
            });

            if (!datePill) {
                const fallbackDate = task.due ?? task.scheduled;
                if (fallbackDate && typeof fallbackDate.toISODate === 'function') {
                    const isoStr = fallbackDate.toISODate();
                    datePill = createPill(I.calendar, isoStr, "is-due");
                    dueDate = fallbackDate;
                }
            }

            // 2. Time: [上午] [下午] [晚上] [HH:mm]
            let timePill = "";
            let timeToken = null;
            text = text.replace(/\[[^\[\]]+?\]/g, (match) => {
                const raw = String(match.slice(1, -1) || "").trim();
                if (!raw || /^[xX]$/.test(raw)) return match;
                if (raw === "学" || raw === "练" || raw === "习") return "";

                const norm = this.normalizeTimeToken(raw);
                if (!norm || !this.isTimeToken(norm)) return match;

                if (!timeToken) {
                    timeToken = norm;
                    timePill = createPill(I.clock, norm, "is-time");
                } else {
                    const currentIsClock = !!this.parseClockToken(timeToken);
                    const nextIsClock = !!this.parseClockToken(norm);
                    if (!currentIsClock && nextIsClock) {
                        timeToken = norm;
                        timePill = createPill(I.clock, norm, "is-time");
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
                    if (now >= deadline) timePill = createPill(I.clock, timeToken, "is-time is-time-overdue");
                }
            }

            // 3. Recurrence: 🔁 every ...
            text = text.replace(/🔁\s*([a-zA-Z0-9\s]+?)(?=\s*[📅⏳🛫✅]|$)/g, (match, rule) => {
                let shortRule = rule.trim();
                if (/^every day$/i.test(shortRule)) shortRule = "1d";
                else if (/^every week$/i.test(shortRule)) shortRule = "1w";
                else if (/^every month$/i.test(shortRule)) shortRule = "1m";
                else if (/^every year$/i.test(shortRule)) shortRule = "1y";
                else {
                    const mDays = shortRule.match(/^every (\d+) days?$/i);
                    if (mDays) shortRule = `${mDays[1]}d`;
                }
                recurrencePills.push(createPill(I.repeat, shortRule, "is-recurring"));
                return "";
            });

            // 4. Priority
            if (text.includes("🔺") || text.includes("🔼")) {
                text = text.replace(/[🔺🔼]/g, "");
                priorityPills.push(createPill(I.priorityHigh, "High", "is-overdue"));
            }
            if (text.includes("🔽") || text.includes("⏬")) {
                text = text.replace(/[🔽⏬]/g, "");
                priorityPills.push(createPill(I.priorityLow, "Low"));
            }
            
            // 5. Start/Scheduled
            text = text.replace(/[⏳🛫]\s*(\d{4}-\d{1,2}-\d{1,2})/g, "");
            
            // 6. Completion Logic
            if (task.completed) {
                text = text.replace(/✅\s*\d{4}-\d{1,2}-\d{1,2}/g, "");
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
                    datePill = createPill(I.calendar, compISO, statusClass);
                }
            }

            text = text.trim();
            
            const sourceName = String(task.__sourceName || '').trim();
            const escHtml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            const sourcePill = sourceName ? `<span class="td-meta-pill td-source" data-source="${escHtml(sourceName)}">@${escHtml(sourceName)}</span>` : "";

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
                    groupBySource: true,
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
            out.ui.groupBySource = out.ui.groupBySource !== false;
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
            try {
                const L = window.TaskDashboardKit?.data?.L;
                if (L && L.DateTime) {
                    let dt = L.DateTime.local();
                    if (weekStart === 'sunday') dt = dt.plus({ days: 1 });
                    const yy = String(dt.weekYear).slice(-2);
                    const ww = String(dt.weekNumber).padStart(2, '0');
                    return `${yy}W${ww}`;
                }
            } catch (_) {}
            const d = new Date();
            const day = (d.getDay() + 6) % 7;
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
                if (!/^\s*-\s\[\s\]\s/.test(line)) continue;
                const b = [line.replace(/\s+$/g, '')];
                let j = i + 1;
                while (j < lines.length) {
                    const l = lines[j];
                    if (/^\s*-\s\[[ xX]\]\s/.test(l)) break;
                    if (l.trim() === '') {
                        b.push('');
                        j += 1;
                        continue;
                    }
                    if (/^\s+/.test(l)) {
                        b.push(l.replace(/\s+$/g, ''));
                        j += 1;
                        continue;
                    }
                    break;
                }
                blocks.push(b.join('\n').trimEnd());
                i = j - 1;
            }
            return blocks.join('\n\n').trim();
        },

        async ensureWeeklyRollover(configPath, cfg) {
            const weekly = cfg?.weekly;
            if (!weekly || weekly.enabled === false) return;
            const prefix = String(weekly.prefix || '').trim();
            const archiveFolder = String(weekly.archiveFolder || '').trim();
            if (!prefix) return;

            const currentKey = this.getWeekKey(weekly.weekStart || 'monday');
            if (weekly.lastWeekKey === currentKey) return;

            const adapter = app?.vault?.adapter;
            if (!adapter) return;

            const newPath = this.getWeeklyFilePath(prefix, currentKey);
            if (newPath) {
                try {
                    const exists = await adapter.exists(newPath);
                    if (!exists) await adapter.write(newPath, "\n\n");
                } catch (_) {}
            }

            const prevKey = String(weekly.lastWeekKey || '').trim();
            if (prevKey) {
                const prevPath = this.getWeeklyFilePath(prefix, prevKey);
                try {
                    const prevFile = app.vault.getAbstractFileByPath(prevPath);
                    if (prevFile && prevPath && archiveFolder) {
                        let undone = "";
                        if (weekly.migrateUndone !== false && newPath) {
                            try {
                                const prevContent = await app.vault.read(prevFile);
                                undone = this.extractUndoneTaskBlocks(prevContent);
                            } catch (_) {}
                        }

                        try {
                            const folderExists = await adapter.exists(archiveFolder);
                            if (!folderExists) await app.vault.createFolder(archiveFolder);
                        } catch (_) {}

                        const fileName = prevPath.split('/').pop();
                        const archivedPath = `${archiveFolder.replace(/\/+$/,'')}/${fileName}`;
                        try {
                            await app.vault.rename(prevFile, archivedPath);
                        } catch (_) {}

                        if (undone && newPath) {
                            try {
                                const newFile = app.vault.getAbstractFileByPath(newPath);
                                if (newFile) {
                                    const cur = await app.vault.read(newFile);
                                    const next = (cur || '').trimEnd() + "\n\n" + undone + "\n";
                                    await app.vault.modify(newFile, next);
                                }
                            } catch (_) {}
                        }
                    }
                } catch (_) {}
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

        // 完成任务并回写文件
        async completeTask(taskPath, lineNo, rawText) {
            const file = app.vault.getAbstractFileByPath(taskPath);
            if (!file) return;

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
                    const isWhenDone = rule.includes("when done");
                    
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
                        const cleanRule = rule.replace("when done", "").trim();
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
                        }
                    }
                } catch (e) {
                    console.error("TaskDashboardKit: Failed to process recurrence", e);
                }
            }
            
            await app.vault.modify(file, lines.join("\n"));
            this.scheduleDataviewRefresh();
        },

        // 取消完成任务并回写文件 (还原状态)
        async uncompleteTask(taskPath, lineNo, rawText) {
            const file = app.vault.getAbstractFileByPath(taskPath);
            if (!file) return;

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
                            }
                        }
                    }
                } catch (e) {
                    console.error("TaskDashboardKit: Failed to rollback recurrence on uncomplete", e);
                }
            }
            
            await app.vault.modify(file, lines.join("\n"));
            this.scheduleDataviewRefresh();
        },

        // 删除任务并回写文件 (双向同步)
        async deleteTask(taskPath, lineNo, rawText) {
            const file = app.vault.getAbstractFileByPath(taskPath);
            if (!file) return;

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
            this.scheduleDataviewRefresh();
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
                const data = JSON.parse(raw);
                if (!data || data.pinned !== true) return null;
                return data;
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
            if (tasks.length === 0) {
                // container.innerHTML = `<div style="padding:8px 16px; color:#94A3B8; font-size:12px; font-style:italic;">暂无任务</div>`;
                // 仅保留空容器，不显示任何文字
                container.innerHTML = "";
                container.style.padding = "0"; // 移除内边距，减少高度占用
                return;
            }

            const createItem = (t) => {
                const li = document.createElement("li");
                li.className = "task-list-item";
                
                // Process Text & Meta
                const processed = window.TaskDashboardKit.data.processTaskText(t);
                
                // --- Row 1: Checkbox + Text ---
                const mainRow = document.createElement("div");
                mainRow.className = "td-task-main-row";
                
                // Checkbox
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = t.completed;
                checkbox.className = "task-list-item-checkbox";
                checkbox.onclick = (e) => {
                    e.stopPropagation(); 
                    const path = t.file?.path || t.path;
                    const line = t.line || t.position?.start?.line;
                    if (path && line !== undefined) {
                        li.style.display = "none";
                        if (checkbox.checked) window.TaskDashboardKit.action.completeTask(path, line, t.text);
                        else window.TaskDashboardKit.action.uncompleteTask(path, line, t.text);
                    }
                };
                mainRow.appendChild(checkbox);

                // Text Part
                const textDiv = document.createElement("div");
                textDiv.className = "list-item-part";
                textDiv.innerHTML = processed.textHtml;
                textDiv.onclick = (e) => {
                    e.stopPropagation();
                    const path = t.file?.path || t.path;
                    const line = t.line || t.position?.start?.line;
                    if (path) {
                        // [Fix] Signal View Controller to stand down
                        window.sipNavigationInProgress = true;
                        setTimeout(() => window.sipNavigationInProgress = false, 1000);

                        const leaf = app.workspace.getLeaf(false);
                        const file = app.vault.getAbstractFileByPath(path);
                        if (file) leaf.openFile(file, { eState: { line: line } });
                    }
                };
                mainRow.appendChild(textDiv);
                li.appendChild(mainRow);

                // --- Row 2: Remarks (Subtasks) ---
                if (t.children && t.children.length > 0) {
                    const validChildren = t.children.filter(c => c.text);
                    if (validChildren.length > 0) {
                        const remarkBox = document.createElement("div");
                        remarkBox.className = "td-remark-box";
                        
                        // Construct list for subtasks (Div based structure for better control)
                        const listDiv = document.createElement("div");
                        listDiv.className = "td-remark-list";
                        
                        validChildren.forEach(child => {
                            const itemDiv = document.createElement("div");
                            itemDiv.className = "td-remark-item";
                            
                            // Icon (SVG)
                            const iconDiv = document.createElement("div");
                            iconDiv.className = "td-remark-icon";
                            iconDiv.innerHTML = CONFIG.ICONS.remarkBullet;
                            
                            // Text
                            const textDiv = document.createElement("div");
                            textDiv.className = "td-remark-text";
                            textDiv.innerText = child.text;
                            
                            itemDiv.appendChild(iconDiv);
                            itemDiv.appendChild(textDiv);
                            listDiv.appendChild(itemDiv);
                        });
                        remarkBox.appendChild(listDiv);
                        
                        // Store ref for toggle
                        li._remarkBox = remarkBox;
                        li.appendChild(remarkBox);
                    }
                }

                // --- Row 3: Meta Footer (Always created for Delete/Toggle Button) ---
                const footer = document.createElement("div");
                footer.className = "td-meta-footer";
                if (processed.footerHtml) {
                    footer.innerHTML = processed.footerHtml;
                }

                // Action Wrapper (Right Aligned)
                const actionWrapper = document.createElement("div");
                actionWrapper.style.marginLeft = "auto";
                actionWrapper.style.display = "flex";
                actionWrapper.style.alignItems = "center";
                actionWrapper.style.gap = "2px";

                // Toggle Button (Chevron Down) - Only if remarks exist
                if (li._remarkBox) {
                    const toggleBtn = document.createElement("div");
                    toggleBtn.className = "td-toggle-btn";
                    toggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
                    toggleBtn.onclick = (e) => {
                        e.stopPropagation();
                        li._remarkBox.classList.toggle("visible");
                        toggleBtn.classList.toggle("expanded");
                    };
                    actionWrapper.appendChild(toggleBtn);
                }

                // Delete Button (Trash Icon)
                const delBtn = document.createElement("div");
                delBtn.className = "td-delete-btn";
                delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
                delBtn.onclick = (e) => {
                    e.stopPropagation();
                    const path = t.file?.path || t.path;
                    const line = t.line || t.position?.start?.line;
                    if (path && line !== undefined) {
                         li.style.opacity = "0.2";
                         li.style.transform = "translateX(20px)";
                         window.TaskDashboardKit.action.deleteTask(path, line, t.text);
                    }
                };
                
                actionWrapper.appendChild(delBtn);
                footer.appendChild(actionWrapper);
                li.appendChild(footer);

                return li;
            };

            const ul = document.createElement("ul");
            ul.className = "contains-task-list";
            
            // 1. Build Task ID Set (Robust Path Check)
            const taskIds = new Set();
            tasks.forEach(t => {
                const path = t.file?.path || t.path;
                const line = t.line ?? t.position?.start?.line;
                if (path && line !== undefined) {
                    taskIds.add(path + ":" + line);
                }
            });
            
            // 筛选出 Root Tasks
            const rootTasks = tasks.filter(t => {
                const path = t.file?.path || t.path;
                if (!path) return false;

                if (!t.parent) return true; // 绝对根
                
                // 相对根：父任务被过滤掉了
                let parentLine = t.parent;
                if (typeof t.parent === 'object' && t.parent !== null) {
                    parentLine = t.parent.line ?? t.parent.position?.start?.line;
                }
                
                const parentId = path + ":" + parentLine;
                return !taskIds.has(parentId);
            });

            const renderTree = (taskList, containerUl) => {
                taskList.forEach(t => {
                    const li = createItem(t);
                    containerUl.appendChild(li);
                });
            };

            renderTree(rootTasks, ul);
            container.appendChild(ul);
        },

        renderCard(dv, host, title, tasks, type, config) {
            const { showSubtasks, forecastDays } = config;
            host.className = `td-section ${type}`;
            host.innerHTML = "";
            
            const card = document.createElement("div");
            card.className = "td-card";
            
            card.classList.add('is-collapsible');
            const pinState = this._readSectionPin(type);
            if (pinState) {
                if (pinState.collapsed) card.classList.add('collapsed');
                else card.classList.remove('collapsed');
            } else {
                if (type === 'undated') card.classList.add('collapsed');
            }
            card.onclick = (e) => {
                if (e.target.closest('.td-pin-btn')) return;
                if (e.target.closest('.td-card-header')) {
                    card.classList.toggle('collapsed');
                    const latestPinState = this._readSectionPin(type);
                    if (latestPinState && latestPinState.pinned) {
                        this._writeSectionPin(type, card.classList.contains('collapsed'));
                    }
                }
            };
            
            const header = document.createElement("div");
            header.className = "td-card-header";
            
            // Logic for Count Badge Color
            // If count > 0, add class 'has-items' to apply section color
            const countClass = tasks.length > 0 ? "td-count-badge has-items" : "td-count-badge";
            
            header.innerHTML = "";
            const titleEl = document.createElement("div");
            titleEl.className = "td-card-title";
            titleEl.appendChild(document.createTextNode(title));
            const countEl = document.createElement("span");
            countEl.className = countClass;
            countEl.textContent = String(tasks.length);
            titleEl.appendChild(countEl);
            header.appendChild(titleEl);

            const pinBtn = document.createElement("div");
            pinBtn.className = "td-pin-btn" + (pinState && pinState.pinned ? " pinned" : "");
            pinBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 3h6l1 5v3l3 3v1H5v-1l3-3V8l1-5z"/></svg>';
            pinBtn.onclick = (e) => {
                e.stopPropagation();
                const current = this._readSectionPin(type);
                if (current && current.pinned) {
                    this._clearSectionPin(type);
                    pinBtn.classList.remove("pinned");
                    return;
                }
                this._writeSectionPin(type, card.classList.contains("collapsed"));
                pinBtn.classList.add("pinned");
            };
            header.appendChild(pinBtn);
            
            const body = document.createElement("div");
            body.className = "td-card-body";
            
            card.appendChild(header);
            card.appendChild(body);
            host.appendChild(card);

            if (type === 'forecast' && forecastDays > 1) {
                const groups = window.TaskDashboardKit.data.groupByDate(tasks);
                if (Object.keys(groups).length === 0) {
                     // body.innerHTML = `<div style="padding:8px 16px; color:#94A3B8; font-size:12px; font-style:italic;">暂无任务</div>`;
                     body.innerHTML = "";
                     body.style.padding = "0";
                } else {
                    for (const [dateLabel, groupTasks] of Object.entries(groups)) {
                        const h5 = document.createElement("div");
                        h5.className = "td-group-header";
                        h5.innerText = dateLabel;
                        body.appendChild(h5);
                        this.renderTaskList(dv, groupTasks, body, showSubtasks);
                    }
                }
            } else {
                const groupBySource = config && config.groupBySource;
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
                    keys.forEach((k) => {
                        const h5 = document.createElement("div");
                        h5.className = "td-group-header";
                        h5.innerText = `@${k}`;
                        body.appendChild(h5);
                        this.renderTaskList(dv, groups.get(k), body, showSubtasks);
                    });
                } else {
                    this.renderTaskList(dv, tasks, body, showSubtasks);
                }
            }
        },

        async main(dv, opts = {}) {
            window.TaskDashboardKit.data.L = dv.luxon;
            const container = dv.container;
            container.innerHTML = "";

            const root = document.createElement("div");
            root.className = "td-container";
            container.appendChild(root);

            const { todayISO } = window.TaskDashboardKit.data.getTimeContext();

            const headerCard = document.createElement("div");
            headerCard.className = "td-header-card";

            const dateParts = todayISO.split('-');
            const year = dateParts[0];
            const dateRest = `${dateParts[1]}-${dateParts[2]}`;

            headerCard.innerHTML = `
                <div class="td-header-top">
                    <div class="td-title-area">
                        <h1>今日聚焦</h1>
                        <p>Focus on what matters</p>
                    </div>
                    <div class="td-date-badge">
                        <span class="year">${year}</span>
                        ${dateRest}
                    </div>
                </div>
            `;
            root.appendChild(headerCard);

            const filterBar = document.createElement("div");
            filterBar.className = "td-filter-bar";
            headerCard.appendChild(filterBar);

            const timelineBody = document.createElement("div");
            timelineBody.className = "td-timeline-wrapper";
            root.appendChild(timelineBody);

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

            const state = { subtasks: "hide", forecastDays: String(cfg.ui?.forecastDays || 1) };

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
                const oldSections = timelineBody.querySelectorAll(".td-section");
                oldSections.forEach(el => el.remove());

                let filtered = window.TaskDashboardKit.data.applyFilters(allTasks, "all", state.subtasks);
                const buckets = window.TaskDashboardKit.data.getBuckets(filtered, { forecastDays: parseInt(state.forecastDays) });
                this.applyTagColorStyle(filtered);

                const config = {
                    showSubtasks: state.subtasks === 'show',
                    forecastDays: parseInt(state.forecastDays),
                    groupBySource: cfg.ui?.groupBySource !== false
                };

                const hostOverdue = document.createElement("div");
                const hostToday = document.createElement("div");
                const hostForecast = document.createElement("div");
                const hostCompleted = document.createElement("div");
                const hostUndated = document.createElement("div");
                timelineBody.appendChild(hostOverdue);
                timelineBody.appendChild(hostToday);
                timelineBody.appendChild(hostForecast);
                timelineBody.appendChild(hostCompleted);
                timelineBody.appendChild(hostUndated);

                if (buckets.overdue.length > 0) this.renderCard(dv, hostOverdue, "滞后待办", buckets.overdue, "overdue", config);
                this.renderCard(dv, hostToday, "今日待办", buckets.today, "today", config);

                const timerId = setTimeout(() => {
                    this.renderCard(dv, hostForecast, `未来前瞻 (${state.forecastDays}日)`, buckets.forecast, "forecast", config);
                    if (cfg.ui?.showCompleted !== false && buckets.completed.length > 0) {
                        this.renderCard(dv, hostCompleted, "今日已完结", buckets.completed, "completed", config);
                    }
                    if (cfg.ui?.showUndated !== false) {
                        this.renderCard(dv, hostUndated, "待排期", buckets.undated, "undated", config);
                    }
                    this.setupJumpHandler(root);
                }, 0);
                window.TaskDashboardKit.__renderTimers = window.TaskDashboardKit.__renderTimers || [];
                window.TaskDashboardKit.__renderTimers.push(timerId);
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
            ], state.forecastDays, (v) => { state.forecastDays = v; requestRender(); }));

            requestRender();
        },

        async config(dv, opts = {}) {
            window.TaskDashboardKit.data.L = dv.luxon;
            const container = dv.container;
            container.innerHTML = "";

            const root = document.createElement("div");
            root.className = "td-container";
            container.appendChild(root);

            const configPath = String(opts?.configPath || '').trim();
            let cfg = await window.TaskDashboardKit.config.load(configPath);
            window.TaskDashboardKit.__config = cfg;
            window.TaskDashboardKit.__configPath = configPath;

            const card = document.createElement("div");
            card.className = "td-config";
            root.appendChild(card);

            const title = document.createElement("h2");
            title.textContent = "今日聚焦配置";
            card.appendChild(title);

            const desc = document.createElement("p");
            desc.textContent = "用于配置「今日聚焦」如何扫描任务、如何显示元数据，以及换周归档规则。配置写入同目录 JSON 文件。";
            card.appendChild(desc);

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
            card.appendChild(actionsTop);

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

            const createSection = (sectionTitle, sectionDesc, boxedBody = false) => {
                const sec = document.createElement("div");
                sec.className = "td-config-section";
                card.appendChild(sec);

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

                let body = sec;
                if (boxedBody) {
                    body = document.createElement("div");
                    body.className = "td-config-section-body";
                    sec.appendChild(body);
                }
                return { sec, body };
            };

            const sourcesSection = createSection(
                "聚焦来源（Source）",
                "选择要汇总的目录/文档，并设置显示名。看板会为来源内的任务自动附加 @显示名 胶囊。",
                false
            );

            const sourcesWrap = document.createElement("div");
            sourcesWrap.className = "td-config-sources";
            sourcesSection.body.appendChild(sourcesWrap);

            const sourcesActions = document.createElement("div");
            sourcesActions.className = "td-config-actions";
            sourcesSection.body.appendChild(sourcesActions);

            const weeklySection = createSection(
                "换周归档",
                "在每周开始时自动创建新周文件，并将上一周文档移动到归档目录；可选把未完成任务迁移到新周文件。",
                true
            );
            const weeklyWrap = document.createElement("div");
            weeklySection.body.appendChild(weeklyWrap);

            const uiSection = createSection(
                "显示与标签",
                "配置默认前瞻、是否按来源分组，以及需要隐藏的系统标签（避免影响用户自定义标签）。",
                true
            );
            const uiWrap = document.createElement("div");
            uiSection.body.appendChild(uiWrap);

            const bottomActions = document.createElement("div");
            bottomActions.className = "td-config-actions";
            card.appendChild(bottomActions);

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

            const btnSaveSources = document.createElement("button");
            btnSaveSources.className = "td-btn primary";
            btnSaveSources.textContent = "保存来源";
            btnSaveSources.onclick = async () => {
                try {
                    await window.TaskDashboardKit.config.save(configPath, cfg);
                    cfg = await window.TaskDashboardKit.config.load(configPath);
                    window.TaskDashboardKit.__config = cfg;
                    try { new Notice("✅ 来源已保存"); } catch (_) {}
                    renderAll();
                } catch (e) {
                    try { new Notice(`❌ 保存失败：${e.message || e}`); } catch (_) {}
                }
            };
            sourcesActions.appendChild(btnSaveSources);

            const btnSave = document.createElement("button");
            btnSave.className = "td-btn primary";
            btnSave.textContent = "保存配置";
            btnSave.onclick = async () => {
                try {
                    await window.TaskDashboardKit.config.save(configPath, cfg);
                    cfg = await window.TaskDashboardKit.config.load(configPath);
                    window.TaskDashboardKit.__config = cfg;
                    try { new Notice("✅ 配置已保存"); } catch (_) {}
                    renderAll();
                } catch (e) {
                    try { new Notice(`❌ 保存失败：${e.message || e}`); } catch (_) {}
                }
            };
            bottomActions.appendChild(btnSave);

            const renderSources = () => {
                sourcesWrap.innerHTML = "";
                const sources = Array.isArray(cfg.sources) ? cfg.sources : [];
                sources.forEach((s, idx) => {
                    const row = document.createElement("div");
                    row.className = "td-config-source";
                    sourcesWrap.appendChild(row);

                    const enabled = document.createElement("input");
                    enabled.type = "checkbox";
                    enabled.checked = s.enabled !== false;
                    enabled.onchange = () => { s.enabled = enabled.checked; };
                    row.appendChild(enabled);

                    const name = document.createElement("input");
                    name.type = "text";
                    name.placeholder = "显示名";
                    name.value = String(s.name || "");
                    name.oninput = () => { s.name = name.value; };
                    row.appendChild(name);

                    const typeSel = document.createElement("select");
                    [{value:"file",label:"文件"},{value:"folder",label:"目录"}].forEach(o => {
                        const opt = document.createElement("option");
                        opt.value = o.value;
                        opt.text = o.label;
                        typeSel.appendChild(opt);
                    });
                    typeSel.value = s.type === "folder" ? "folder" : "file";
                    typeSel.onchange = () => { s.type = typeSel.value; };
                    row.appendChild(typeSel);

                    const path = document.createElement("input");
                    path.type = "text";
                    path.placeholder = "vault 相对路径";
                    path.value = String(s.path || "");
                    path.oninput = () => { s.path = path.value; };
                    row.appendChild(path);

                    const del = document.createElement("button");
                    del.className = "td-btn danger";
                    del.textContent = "删除";
                    del.onclick = () => {
                        cfg.sources = (cfg.sources || []).filter((_, i) => i !== idx);
                        renderSources();
                    };
                    row.appendChild(del);
                });
            };

            const renderWeekly = () => {
                weeklyWrap.innerHTML = "";
                cfg.weekly = cfg.weekly || {};

                const rowEnabled = document.createElement("div");
                rowEnabled.className = "td-config-row";
                weeklyWrap.appendChild(rowEnabled);
                rowEnabled.appendChild(Object.assign(document.createElement("label"), { textContent: "启用" }));
                const wEnabled = document.createElement("select");
                [{value:"true",label:"启用"},{value:"false",label:"停用"}].forEach(o => {
                    const opt = document.createElement("option");
                    opt.value = o.value; opt.text = o.label;
                    wEnabled.appendChild(opt);
                });
                wEnabled.value = cfg.weekly.enabled === false ? "false" : "true";
                wEnabled.onchange = () => { cfg.weekly.enabled = wEnabled.value !== "false"; };
                rowEnabled.appendChild(wEnabled);

                const rowStart = document.createElement("div");
                rowStart.className = "td-config-row";
                weeklyWrap.appendChild(rowStart);
                rowStart.appendChild(Object.assign(document.createElement("label"), { textContent: "周起始日" }));
                const wStart = document.createElement("select");
                [{value:"monday",label:"周一"},{value:"sunday",label:"周日"}].forEach(o => {
                    const opt = document.createElement("option");
                    opt.value = o.value; opt.text = o.label;
                    wStart.appendChild(opt);
                });
                wStart.value = cfg.weekly.weekStart === "sunday" ? "sunday" : "monday";
                wStart.onchange = () => { cfg.weekly.weekStart = wStart.value; };
                rowStart.appendChild(wStart);

                const rowPrefix = document.createElement("div");
                rowPrefix.className = "td-config-row";
                weeklyWrap.appendChild(rowPrefix);
                rowPrefix.appendChild(Object.assign(document.createElement("label"), { textContent: "周文件前缀" }));
                const wPrefix = document.createElement("input");
                wPrefix.type = "text";
                wPrefix.value = String(cfg.weekly.prefix || "");
                wPrefix.oninput = () => { cfg.weekly.prefix = wPrefix.value; };
                rowPrefix.appendChild(wPrefix);

                const rowArchive = document.createElement("div");
                rowArchive.className = "td-config-row";
                weeklyWrap.appendChild(rowArchive);
                rowArchive.appendChild(Object.assign(document.createElement("label"), { textContent: "归档目录" }));
                const wArchive = document.createElement("input");
                wArchive.type = "text";
                wArchive.value = String(cfg.weekly.archiveFolder || "");
                wArchive.oninput = () => { cfg.weekly.archiveFolder = wArchive.value; };
                rowArchive.appendChild(wArchive);

                const rowMove = document.createElement("div");
                rowMove.className = "td-config-row";
                weeklyWrap.appendChild(rowMove);
                rowMove.appendChild(Object.assign(document.createElement("label"), { textContent: "迁移未完成" }));
                const wMove = document.createElement("select");
                [{value:"true",label:"是"},{value:"false",label:"否"}].forEach(o => {
                    const opt = document.createElement("option");
                    opt.value = o.value; opt.text = o.label;
                    wMove.appendChild(opt);
                });
                wMove.value = cfg.weekly.migrateUndone === false ? "false" : "true";
                wMove.onchange = () => { cfg.weekly.migrateUndone = wMove.value !== "false"; };
                rowMove.appendChild(wMove);
            };

            const renderUi = () => {
                uiWrap.innerHTML = "";
                cfg.ui = cfg.ui || {};

                const rowForecast = document.createElement("div");
                rowForecast.className = "td-config-row";
                uiWrap.appendChild(rowForecast);
                rowForecast.appendChild(Object.assign(document.createElement("label"), { textContent: "默认前瞻" }));
                const fSel = document.createElement("select");
                [{value:"1",label:"1日"},{value:"3",label:"3日"},{value:"7",label:"1周"}].forEach(o => {
                    const opt = document.createElement("option");
                    opt.value = o.value; opt.text = o.label;
                    fSel.appendChild(opt);
                });
                fSel.value = String(cfg.ui.forecastDays || 1);
                fSel.onchange = () => { cfg.ui.forecastDays = parseInt(fSel.value); };
                rowForecast.appendChild(fSel);

                const rowGroup = document.createElement("div");
                rowGroup.className = "td-config-row";
                uiWrap.appendChild(rowGroup);
                rowGroup.appendChild(Object.assign(document.createElement("label"), { textContent: "按来源分组" }));
                const gSel = document.createElement("select");
                [{value:"true",label:"是"},{value:"false",label:"否"}].forEach(o => {
                    const opt = document.createElement("option");
                    opt.value = o.value; opt.text = o.label;
                    gSel.appendChild(opt);
                });
                gSel.value = cfg.ui.groupBySource === false ? "false" : "true";
                gSel.onchange = () => { cfg.ui.groupBySource = gSel.value !== "false"; };
                rowGroup.appendChild(gSel);

                const rowHide = document.createElement("div");
                rowHide.className = "td-config-row";
                uiWrap.appendChild(rowHide);
                rowHide.appendChild(Object.assign(document.createElement("label"), { textContent: "隐藏标签" }));
                const ta = document.createElement("textarea");
                ta.rows = 3;
                ta.value = Array.isArray(cfg.ui.hiddenTags) ? cfg.ui.hiddenTags.join("\n") : "";
                ta.oninput = () => {
                    cfg.ui.hiddenTags = ta.value.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
                };
                rowHide.appendChild(ta);
            };

            const renderAll = () => {
                renderSources();
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
