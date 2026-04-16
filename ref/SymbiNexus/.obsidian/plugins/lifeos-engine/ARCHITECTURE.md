# LifeOS Engine Architecture

## 核心原则

1.  **逻辑分离**：`main.js` 作为插件入口，负责生命周期管理、命令注册和与 Obsidian API 的交互。具体的业务逻辑和复杂渲染应委托给 `assets/` 目录下的 Kit 库。
2.  **Kit 模式**：
    *   `assets/task-dashboard-kit.js`：负责「今日聚焦」看板的所有逻辑、数据处理和渲染。
    *   `assets/finance-viz-kit.js`：负责「财务看板」的逻辑和渲染。
3.  **配置集中**：配置应加载自 Vault 中的 JSON 文件，而非硬编码。

## 目录结构

```
lifeos-engine/
├── main.js                 # 插件入口
├── styles.css              # 通用样式
├── assets/                 # 核心业务逻辑库
│   ├── task-dashboard-kit.js   # [重点] 任务看板逻辑 (渲染、交互、数据)
│   ├── finance-viz-kit.js      # 财务看板逻辑
│   └── echarts.min.js          # 图表库
└── data.json               # 插件基础配置
```

## 开发指南

### 修改「今日聚焦」看板
*   **不要修改** `main.js` 中的 `renderTaskTodayFocus` (已废弃)。
*   **请修改** `assets/task-dashboard-kit.js`。
*   主要入口：`window.TaskDashboardKit.render.main`。
*   渲染逻辑：`renderCard` 和 `renderTaskList`。

### 修改「财务看板」
*   **请修改** `assets/finance-viz-kit.js`。

## 规则固化
*   任何涉及看板渲染逻辑的修改，必须在对应的 Kit 文件中进行。
*   `main.js` 仅负责加载 Kit 并调用其初始化/渲染方法。
