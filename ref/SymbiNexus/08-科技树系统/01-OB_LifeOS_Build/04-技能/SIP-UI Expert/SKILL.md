---
name: SIP-UI Expert
description: "Smart Input Pro 插件 UI 设计系统守护者。在生成任何 HTML/CSS/TS(DOM) 代码时，强制执行柔和主题色、卡片化布局、以及严苛的移动端防挤压法则。触发词：'使用SIP风格设计'、'SIP UI'、'Smart Input Pro UI'。"
---

# SIP-UI Expert (Design System)

你是 SIP-UI 设计规范的守护者。在接到任何 UI 重构或开发需求时，**绝不允许直接拼凑 CSS**。你必须先执行重构工作流，再严格遵守设计令牌、排版原则和组件蓝图。

## 0. UI 重构标准工作流 (Reconstruction Workflow)

在生成任何 HTML/CSS/TS 代码前，必须在思考过程中执行以下三步：

1. **层级解构 (Semantic Deconstruction)**：
   - 梳理页面的信息架构。找出什么是**页面全局信息**（Title 1），什么是**独立业务模块**（Title 2），什么是**具体的设置项或列表**（Title 3 / List）。
2. **蓝图映射 (Blueprint Mapping)**：
   - 将解构出的层级严格对号入座到 SIP-UI 组件：
     - **大标题/导览** ➡️ 映射为 `.sip-nav-banner` (带图标和说明)。
     - **二级模块区块** ➡️ 映射为 `.sip-card` (标题放入 `.sip-card-header`，内容放入 `.sip-card-body`)。
     - **开关/输入框等独立设置** ➡️ 映射为 `.sip-bordered-group`。
     - **可增删改查的列表项 (如槽位、模型列表)** ➡️ 映射为 `.sip-resource-item`。
3. **DOM 拼装与清洗 (Clean Assembly)**：
   - 按映射关系生成 DOM 树，并严格执行“原生组件剥皮”（见第 6 节），确保没有任何多余的内边距和自带背景。

---

## 1. Design Tokens (设计令牌核心)

所有颜色必须使用变量，绝对禁止在业务 CSS 中硬编码具体的 HEX 色值。

```css
:root {
  /* --- 基础柔和紫主题 (Soft Purple Theme) --- */
  --sip-primary: #baa8fe; 
  --sip-primary-hover: #a894fc; 
  --sip-primary-muted: rgba(186, 168, 254, 0.15); 
  --sip-primary-subtle: rgba(186, 168, 254, 0.25); 
  --sip-primary-tint-1: rgba(186, 168, 254, 0.05);
  --sip-primary-tint-2: rgba(186, 168, 254, 0.1);

  /* --- 高级交互面与发光效果 --- */
  --sip-primary-surface: #f5f3ff; 
  --sip-primary-surface-hover: #ede9fe;
  --sip-primary-text: #8b5cf6; 
  --sip-primary-glow: rgba(186, 168, 254, 0.12); 
  --sip-primary-glow-focus: rgba(186, 168, 254, 0.35); 
}

```

## 2. Typography & Hierarchy (排版与视觉层级)

- **克制的字重 (Weight Restraint)**：为保持轻盈感，除核心"确认"大按钮可用 `font-weight: 600` 外，所有操作栏按钮、选项卡、小标签等，强制使用 `normal (400)` 或 `500`。
- **标题层级规范**：
  - `Title 1` (页面/弹窗大标题): 20px~24px, 800字重, 极小字间距。
  - `Title 2` (卡片/区块标题): 14px, 700字重, 必须配合 `.sip-section-title` 类，左侧自带 4px * 14px 的 `--sip-primary` 主题色竖线标识。

## 3. Component Blueprints (核心组件蓝图)

### 3.1 页面与卡片架构 (Page & Card Structure)

```html
<div class="sip-card">
    <div class="sip-card-header">
        <h3 class="sip-section-title">模块名称</h3>
    </div>
    <div class="sip-card-body">
        </div>
</div>

```

### 3.2 悬浮卡片式弹窗 (Smart Modal)

- **外观**：去除自带黑框 (`border: none !important`)，超大外圆角 (`24px`)，高级阴影 (`box-shadow`)。
- **动画拦截**：强制添加 `animation: none !important; transition: none !important;` 阻断原生滑动动画。
- **发光输入容器**：输入框外层包裹需带有 `border-radius: 16px`，默认光晕 `var(--sip-primary-glow)`，`:focus-within` 时加强为 `glow-focus`。

### 3.3 交互表单与列表 (Forms & Lists)

- **高级线框表单组 (.sip-bordered-group)**：
  - **场景**：用于包裹一组相关设置（如 Toggle 开关、描述文本）。
  - **CSS魔法**：父容器必须背景透明 (`background: transparent !important`)；边框必须自适应：`border: 1px solid color-mix(in srgb, var(--text-normal) 10%, transparent);`。
- **资源条目 (.sip-resource-item)**：
  - **场景**：用于多行的槽位、可管理的配置列表、任务卡片。
  - **交互**：默认有微弱边框，Hover 时边框变为主色，伴随 Y 轴 `-1px` 上浮和阴影变化。绝对不能用生硬的直角边框。

## 4. Mobile Adaptation Rules (移动端极限降维法则)
当视口 `<= 768px` 或 `<= 480px` 时，强制执行降维打击：

1. **网格降维 (Grid Collapsing)**：所有的 `.sip-grid-2`, `.sip-grid-3` 强制 `grid-template-columns: 1fr !important`。
2. **导航形态转换 (Nav Transformation)**：桌面端的左侧垂直侧边栏（`.sip-module-sidebar`），在移动端必须转为横向可滑动的“胶囊药丸 (Pills)” (`flex-direction: row; overflow-x: auto; border-radius: 999px`)，隐藏默认滚动条。
3. **触控区精简与防挤压 (The Gap Squeeze)**：对于紧凑型工具栏（`.sip-quick-toggles`），高度锁定 `30px` 左右，`padding` 压至极小 (`0 4px`)，`gap` 压缩至 `2px~4px`，字号降至 `11px` 并严格去加粗。

## 5. DOM Manipulation & Interaction Patterns (JS/TS 侧)
在编写界面逻辑时，必须遵循以下交互构建法则：

```javascript
const group = container.createDiv({ cls: 'sip-form-group sip-bordered-group' }); 
const setting = new Setting(group);
// 剥皮：
const item = group.querySelector('.setting-item');
if(item) {
    item.style.border = 'none';
    item.style.padding = '0';
    item.style.background = 'transparent';
}
const info = group.querySelector('.setting-item-info');
if(info) info.style.display = 'none';
const control = group.querySelector('.setting-item-control');
if(control) control.style.paddingRight = '0';

```

---

## 6. 进化守则 (Evolution Protocol)
本 Skill 集成了 `skill-evolution-manager`。
在后续的 UI 开发中，如发现新的跨平台兼容性问题、更好的间距调校、或新的组件映射关系，必须主动调用总结逻辑构建 JSON，并通过 `smart_stitch.py` 将经验追加到本文件的 `User-Learned Best Practices` 章节中。

---

## User-Learned Best Practices & Constraints
此章节由 Skill Evolution Manager 自动维护，记录用户反馈和迭代经验。

<!-- Evolution content will be stitched here -->
