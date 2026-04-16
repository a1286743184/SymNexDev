---
name: SIP-UI Expert (Smart Input Pro Design System)
description: 专门用于构建和维护 Smart Input Pro 插件及衍生 UI (如看板、统计图表) 的前端视觉体系与响应式规范。强制执行柔和主题色、卡片化布局、以及严苛的移动端防挤压法则。
license: MIT
---

# SIP-UI Expert (Design System)

你是 SIP-UI 设计规范的守护者。在生成任何 HTML/CSS/TS(DOM) 代码时，必须严格遵守以下设计令牌、排版原则、组件蓝图和移动端降维法则。

## 1. Design Tokens (设计令牌核心)

所有颜色必须使用变量，**绝对禁止**在业务 CSS 中硬编码具体的 HEX 色值。

```css
:root {
  /* --- 基础柔和紫主题 (Soft Purple Theme) --- */
  --sip-primary: #baa8fe; 
  --sip-primary-hover: #a894fc; 
  --sip-primary-muted: rgba(186, 168, 254, 0.15); /* 用于边框或浅色分割线 */
  --sip-primary-subtle: rgba(186, 168, 254, 0.25); /* 用于输入框基础边框 */
  --sip-primary-tint-1: rgba(186, 168, 254, 0.05);
  --sip-primary-tint-2: rgba(186, 168, 254, 0.1);

  /* --- 高级交互面与发光效果 --- */
  --sip-primary-surface: #f5f3ff; /* 按钮/选项选中时的极浅背景色 */
  --sip-primary-surface-hover: #ede9fe;
  --sip-primary-text: #8b5cf6; /* 浅色背景上的对比强化色 */
  --sip-primary-glow: rgba(186, 168, 254, 0.12); /* 常驻外发光 */
  --sip-primary-glow-focus: rgba(186, 168, 254, 0.35); /* 聚焦强发光 */
}

```

## 2. Typography & Hierarchy (排版与视觉层级)

* **克制的字重 (Weight Restraint)**：为了保持 UI 的轻盈感，除了核心的“确认/提交”大按钮可以使用 `font-weight: 600/700` 之外，所有快捷操作栏的 `sip-quick-toggle`、服务商选择卡片、小标签等，**强制使用 `font-weight: normal (400)` 或最多 `500**`。严禁出现笨重的视觉感。
* **标题层级**：
* `Title 1` (弹窗大标题): 20px, 800字重, 极小字间距 (`letter-spacing: -0.02em`)。
* `Title 2` (区块标题): 14px, 700字重, 左侧带有 4px * 14px 的 `--sip-primary` 主题色竖线标识。



## 3. Component Blueprints (核心组件蓝图)

### 3.1 悬浮卡片式弹窗 (Smart Modal)

* **外观**：去除自带黑框 (`border: none !important`)，超大外圆角 (`border-radius: 24px`)，采用高级阴影 (`box-shadow: 0 10px 40px -10px var(--sip-primary-subtle), 0 0 0 1px var(--sip-primary-tint-2)`)。
* **动画拦截**：强制添加 `animation: none !important; transition: none !important;` 阻断 Obsidian 移动端原生丑陋的滑动动画，实现瞬间弹出。
* **带光晕的输入容器**：输入框外层包裹需带有 `border-radius: 16px`，默认光晕 `var(--sip-primary-glow)`，`:focus-within` 时光晕加强为 `var(--sip-primary-glow-focus)`。

### 3.2 卡片与表单组 (Settings & Cards)

* **资源条目 (`.sip-resource-item`)**：默认有边框，Hover 时边框变为主色，并伴随 Y 轴 `-1px` 的轻微上浮和投影 (`box-shadow`) 变化。
* **线框表单组 (`.sip-bordered-group`)**：用于包裹一组相关设置，需强制背景透明 (`background: transparent !important`)，使用基于文本色的混合淡边框（如透明度 10% 的 border），`border-radius: var(--sip-radius-lg)`。

### 3.3 生态延展性 (Ecosystem Extensibility)

* 这套 UI Tokens 是“原子化”的。未来开发**看板 (Kanban)** 模块时：
* 看板列背景应复用 `--sip-bg-secondary` 或 `--sip-bg-elevated`。
* 任务卡片直接继承 `.sip-resource-item` 或 `.sip-card` 的交互规范。
* 统计 KPI 块直接复用 `.sip-kpi-grid`。



## 4. Mobile Adaptation Rules (移动端极限降维法则)

当视口 `<= 768px` 或 `<= 480px` 时，强制执行以下降维打击逻辑：

1. **网格降维 (Grid Collapsing)**：
* 所有的 `.sip-grid-2`, `.sip-grid-3`, `.sip-tile-grid` 等多列容器，强制 `grid-template-columns: 1fr !important`。


2. **导航形态转换 (Nav Transformation)**：
* 桌面端的左侧垂直侧边栏（`.sip-module-sidebar`），在移动端必须转为横向排列 (`flex-direction: row; overflow-x: auto`)。
* 侧边栏的每一项 (`.sip-sidebar-item`) 取消前面的主题色竖线，变为带圆角的“胶囊药丸 (Pills)” (`border-radius: 999px`)。隐藏原生横向滚动条。


3. **触控区精简与防挤压 (The Gap & Padding Squeeze)**：
* 对于紧凑型工具栏（如 `.sip-quick-toggles`），为了防止左侧文字被挤压，移动端必须执行极限压缩：
* `height`: 统一锁定为 `30px` 左右以利于手指点击。
* `padding`: 压至极小 (`0 4px` 甚至更小)。
* `gap`: 图标与文字间隙压缩至 `2px`，按钮与按钮间隙压缩至 `4px`。
* `font-size`: 降至 `11px` 或 `12px`，并**严格去加粗** (`font-weight: normal`)。





## 5. 进化守则 (Evolution Protocol)

本 Skill 集成了 `skill-evolution-manager`。
在后续的 UI 开发与测试中，如果你（大模型）在对话中通过用户反馈发现了新的 UI 兼容性问题、更好的间距调校、或者新组件的复用规范，你**必须**：

1. 主动调用总结逻辑，构建 JSON。
2. 调用 `merge_evolution.py` 和 `smart_stitch.py`，将经验以 Markdown 追加到本文件的 `User-Learned Best Practices & Constraints` 章节中。
3. 绝不遗漏你在试错中获得的任何“跨平台适配”教训。


