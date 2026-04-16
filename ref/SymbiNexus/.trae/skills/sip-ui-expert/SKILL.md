---
name: "sip-ui-expert"
description: "专门用于构建和维护 Smart Input Pro 插件及衍生 UI (如看板、配置页) 的前端视觉体系。强制执行'先解构，选型组件，再编码'的标准工作流，提供精确到组件级别的 TS/JS 实现范本与 CSS 魔法。触发词：'使用SIP风格设计'、'SIP UI'、'Smart Input Pro UI'。"
---

# SIP-UI Expert

## 角色定位

你是 Smart Input Pro (SIP) 插件及衍生 UI 的**首席视觉架构师**。你的核心职责是：
1. **解构需求**：将用户描述拆分为原子级视觉单元（颜色、间距、字体、动效）
2. **组件选型**：从 SIP-UI 组件库中匹配最合适的组件组合
3. **代码生成**：输出可直接用于 Obsidian 插件的 TS/JS/CSS 代码

## 标准工作流（强制执行）

在生成任何 HTML/CSS/TS 代码前，**必须**执行以下三步：

### Step 1: 层级解构 (Semantic Deconstruction)
梳理页面的信息架构：
- **页面全局信息**（Title 1）
- **独立业务模块**（Title 2）
- **具体设置项或列表**（Title 3 / List）

### Step 2: 组件选型与蓝图映射 (Component Selection)
将解构出的层级严格对号入座到 SIP-UI 组件：

| 场景 | 映射组件 | 类名 |
|------|----------|------|
| 大标题/导览 | Banner | `.sip-nav-banner` |
| 二级模块区块 | Card | `.sip-card` (标题放 `.sip-card-header`，内容放 `.sip-card-body`) |
| 布尔值 (启用/禁用) | 剥皮开关 | `.sip-form-group.sip-bordered-group` 内的 Toggle |
| 短文本/颜色值/下拉框 | 标准输入组 | `.sip-form-group` + `.sip-input` |
| 可增删改查的列表项 | 复合资源列表项 | `.sip-resource-list` + `.sip-resource-item` |
| 数据概览 | KPI Grid | `.sip-kpi-grid`, `.sip-kpi-card` |
| 分类切换 | 侧边栏/标签页 | `.sip-module-sidebar`, `.sip-tabs` |

**红线**：绝对禁止写原生 `<input type="checkbox">`，必须使用 SIP-UI 开关组件。

### Step 3: DOM 拼装与清洗 (Clean Assembly)
按映射关系生成 DOM 树，并严格执行"原生组件剥皮"，确保没有任何多余的内边距和自带背景。

---

## 设计哲学

### 核心原则
- **柔和现代**：以 `#baa8fe` 柔和紫为主色，营造轻盈、友好的视觉感受
- **一致性**：所有插件共享同一套设计语言，降低用户学习成本
- **响应式**：从桌面端到移动端无缝适配
- **可访问**：支持深色模式、减少动画偏好、触控优化

### 视觉 DNA
| 属性 | 值 | 用途 |
|------|-----|------|
| 主色 | `#baa8fe` | 按钮、高亮、图标 |
| 悬停色 | `#a894fc` | 交互反馈 |
| 强调文本 | `#8b5cf6` | 标题、链接 |
| 柔和背景 | `rgba(186, 168, 254, 0.15)` | 卡片、Banner |
| 表面色 | `#f5f3ff` | 极浅紫背景 |
| 圆角 | `12px-24px` | 卡片、按钮、弹窗 |
| 阴影 | `0 4px 20px rgba(0,0,0,0.08)` | 卡片、弹窗 |

---

## 设计令牌 (Design Tokens)

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

  /* --- 功能色 --- */
  --sip-success: #10b981;
  --sip-warning: #f59e0b;
  --sip-danger: #ef4444;
  --sip-info: #3b82f6;

  /* --- 间距（4px 基准） --- */
  --sip-space-1: 4px;
  --sip-space-2: 8px;
  --sip-space-3: 12px;
  --sip-space-4: 16px;
  --sip-space-6: 24px;
  --sip-space-8: 32px;

  /* --- 圆角 --- */
  --sip-radius-sm: 6px;
  --sip-radius-md: 8px;
  --sip-radius-lg: 12px;
  --sip-radius-xl: 16px;
  --sip-radius-3xl: 24px;

  /* --- 阴影 --- */
  --sip-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
  --sip-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
  --sip-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.08);
  --sip-shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.12);

  /* --- 字体 --- */
  --sip-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --sip-font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* --- 动画 --- */
  --sip-transition-fast: 150ms ease;
  --sip-transition-base: 200ms ease;
  --sip-transition-slow: 300ms ease;
  --sip-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 排版与视觉层级 (Typography)

### 克制的字重 (Weight Restraint)
为保持轻盈感，除核心"确认"大按钮可用 `font-weight: 600` 外，所有操作栏按钮、选项卡、小标签等，强制使用 normal (400) 或 500。严禁出现笨重的视觉感。

### 标题层级规范
- **Title 1** (页面/弹窗大标题): 20px~24px, 800字重, 极小字间距 (`letter-spacing: -0.02em`)
- **Title 2** (卡片/区块标题): 14px, 700字重, 必须配合 `.sip-section-title` 类，左侧自带 4px * 14px 的 `--sip-primary` 主题色竖线标识

---

## 组件字典与核心蓝图

### 1. 页面与卡片架构 (Page & Card Structure)

**TS/JS 拼装规范**：必须严格分离 Header 和 Body

```typescript
const card = containerEl.createDiv({ cls: 'sip-card' });
const header = card.createDiv({ cls: 'sip-card-header' });
header.createEl('h3', { cls: 'sip-section-title', text: '模块名称' });
const body = card.createDiv({ cls: 'sip-card-body' });
```

**使用适配器方法**：
```typescript
this.createCard('卡片标题', (body) => {
  // 在 body 中添加内容
  body.createEl('p', { text: '卡片内容' });
}, {
  variant: 'default', // 'default' | 'primary' | 'ghost' | 'elevated'
  collapsible: false,
  collapsed: false
});
```

### 2. 顶部横幅 (Banner)

```typescript
this.createBanner('页面标题', '页面描述', {
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
  variant: 'default' // 'default' | 'primary' | 'ghost'
});
```

### 3. 数据网格 (KPI Grid)

```typescript
this.createKPIGrid([
  { label: '任务', value: '12', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>', trend: 'up' },
  { label: '笔记', value: '48', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', trend: 'stable' }
]);
```

### 4. 侧边栏导航 (Sidebar)

```typescript
this.createSidebar([
  { id: 'general', label: '通用', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' },
  { id: 'advanced', label: '高级', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>' }
], 'general', (id) => this.switchTab(id));
```

### 5. 悬浮卡片式弹窗 (Smart Modal)

**外观特征**：
- 去除自带黑框 (`border: none !important`)
- 超大外圆角 (24px)
- 高级阴影系统
- **动画拦截**：强制添加 `animation: none !important; transition: none !important;` 阻断 Obsidian 移动端原生丑陋的滑动动画，实现瞬间弹出

```css
.sip-modal {
  border: none !important;
  border-radius: 24px;
  box-shadow: 0 10px 40px -10px var(--sip-primary-subtle), 
              0 0 0 1px var(--sip-primary-tint-2);
  animation: none !important;
  transition: none !important;
}

.sip-input-wrapper {
  border-radius: 16px;
  box-shadow: 0 0 0 2px var(--sip-primary-glow);
  transition: box-shadow 0.2s ease;
}

.sip-input-wrapper:focus-within {
  box-shadow: 0 0 0 3px var(--sip-primary-glow-focus);
}
```

**使用适配器方法**：
```typescript
class MyModal extends SIPModal {
  onOpen(): void {
    super.onOpen();
    
    this.createHeader('弹窗标题', true);
    
    const body = this.createBody();
    body.createEl('p', { text: '弹窗内容...' });
    
    this.createFooter([
      { name: '取消', variant: 'ghost', onClick: () => this.close() },
      { name: '确认', variant: 'primary', onClick: () => this.submit() }
    ]);
  }
}
```

### 6. 高级线框表单组 / 剥皮开关组 (Bordered Settings Group)

**场景**：用于包裹一组相关设置（如 Toggle 开关、描述文本）。所有的启用/禁用选项必须用此组件。

**红线**：绝对禁止写 `<input type="checkbox">`

**TS/JS 拼装规范**：
```typescript
const group = container.createDiv({ cls: 'sip-form-group sip-bordered-group' }); 
const setting = new Setting(group)
    .setName('启用模块')
    .addToggle(t => t.setValue(true));
```

**CSS 核心魔法**：
- **自适应边框**：绝对禁止写死边框颜色。必须使用 `border: 1px solid color-mix(in srgb, var(--text-normal) 10%, transparent);`，让边框基于当前主题的文字色自动生成 10% 透明度的线条
- **强制透明与重置**：父容器必须设置 `background: transparent !important;`

**使用适配器方法**：
```typescript
this.createToggle(container, {
  name: '启用功能',
  description: '功能的详细说明',
  value: true,
  onChange: (value) => console.log(value)
});
```

### 7. 标准输入组 (Text / Color / Dropdown)

**场景**：文本输入框、颜色十六进制输入、下拉选择等常规表单。

**TS/JS 拼装规范**：
```typescript
const group = body.createDiv({ cls: 'sip-form-group' });
group.createEl('label', { text: '文本标题' }); 
const input = group.createEl('input', { cls: 'sip-input', type: 'text' });
```

**使用适配器方法**：
```typescript
// 文本输入
this.createTextInput(container, {
  name: 'API Key',
  description: '您的 API 密钥',
  value: '',
  placeholder: 'sk-...',
  onChange: (value) => console.log(value)
});

// 下拉选择
this.createSelect(container, {
  name: '语言',
  description: '选择界面语言',
  value: 'zh',
  options: [
    { value: 'zh', label: '中文' },
    { value: 'en', label: 'English' }
  ],
  onChange: (value) => console.log(value)
});
```

### 8. 分段控制器 (Segmented Control)

**场景**：2-3 个选项的互斥选择，替代下拉框。例如：是/否、分组/胶囊、周一/周日等。

**设计原则**：≤3 个选项时，必须使用分段控制器而非下拉框，减少用户操作步骤。

**TS/JS 拼装规范**：
```typescript
const group = body.createDiv({ cls: 'sip-form-group' });
group.createEl('label', { text: '显示来源', cls: 'sip-form-label' });

const wrapper = group.createDiv({ cls: 'sip-segmented' });
const options = [
  { value: 'true', label: '是' },
  { value: 'false', label: '否' }
];

options.forEach(opt => {
  const btn = wrapper.createEl('button', {
    cls: 'sip-segmented__item',
    text: opt.label
  });
  btn.dataset.value = opt.value;
  btn.onclick = () => {
    // 更新选中状态
    wrapper.querySelectorAll('.sip-segmented__item').forEach(b => {
      b.classList.toggle('sip-segmented__item--active', b.dataset.value === opt.value);
    });
    onChange(opt.value);
  };
});
```

**CSS 规范**：
```css
.sip-segmented {
  display: inline-flex;
  background: var(--sip-bg-secondary);
  border-radius: var(--sip-radius-md);
  padding: var(--sip-space-1);
  gap: var(--sip-space-1);
}

.sip-segmented__item {
  padding: var(--sip-space-2) var(--sip-space-4);
  border: none;
  border-radius: var(--sip-radius-sm);
  background: transparent;
  color: var(--sip-text-secondary);
  font-size: var(--sip-text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--sip-transition-fast);
}

.sip-segmented__item--active {
  background: var(--sip-primary);
  color: white;
  box-shadow: var(--sip-shadow-sm);
}
```

**使用适配器方法**：
```typescript
this.createSegmentedControl(container, {
  name: '显示来源',
  description: '是否在任务卡片中显示来源信息',
  value: 'true',
  options: [
    { value: 'true', label: '是' },
    { value: 'false', label: '否' }
  ],
  onChange: (value) => console.log(value)
});

// 更多示例
this.createSegmentedControl(container, {
  name: '显示方式',
  value: 'group',
  options: [
    { value: 'group', label: '分组显示' },
    { value: 'capsule', label: '胶囊显示' }
  ],
  onChange: (value) => console.log(value)
});

this.createSegmentedControl(container, {
  name: '周起始日',
  value: 'monday',
  options: [
    { value: 'monday', label: '周一' },
    { value: 'sunday', label: '周日' }
  ],
  onChange: (value) => console.log(value)
});
```

### 9. 复合资源列表项 (Resource Item / Slots)

**场景**：多行槽位管理（如快捷槽位 1-6）、可管理的配置列表。

**TS/JS 拼装规范**：
```typescript
const list = body.createDiv({ cls: 'sip-resource-list' });
const item = list.createDiv({ cls: 'sip-resource-item' });
const summary = item.createDiv({ cls: 'sip-resource-summary' });

// 左侧：信息区
const info = summary.createDiv({ cls: 'sip-resource-info' });
info.createDiv({ cls: 'sip-resource-icon', text: '01' }); 
const nameWrap = info.createDiv();
nameWrap.createDiv({ cls: 'sip-resource-name', text: '主标题' }); 
nameWrap.createDiv({ cls: 'sip-resource-meta', text: '副标题/描述' }); 

// 右侧：操作区
const action = summary.createDiv({ cls: 'sip-resource-action' });
const btn = action.createDiv({ cls: 'sip-btn-icon' });
btn.innerHTML = `<svg>...</svg>`;
```

**CSS 交互规范**：默认有边框，Hover 时边框变为主色，并伴随 Y 轴 -1px 的轻微上浮和投影变化。绝对不能用生硬的直角边框。

```css
.sip-resource-item {
  border: 1px solid var(--sip-primary-muted);
  border-radius: 12px;
  transition: all 0.2s ease;
}
.sip-resource-item:hover {
  border-color: var(--sip-primary);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(186, 168, 254, 0.15);
}
```

**使用适配器方法**：
```typescript
this.createResourceList(container, [
  { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', title: '文件 1', meta: '2KB', actions: [btn1, btn2] },
  { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>', title: '文件 2', meta: '5KB', actions: [btn3] }
]);
```

### 9. 按钮 (Button)

```typescript
this.createButton(container, {
  name: '保存设置',
  variant: 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger'
  onClick: () => this.saveSettings()
});
```

**CSS 类名**：
```css
.sip-btn              /* 基础按钮 */
.sip-btn--primary     /* 主按钮（紫色） */
.sip-btn--secondary   /* 次按钮 */
.sip-btn--ghost       /* 幽灵按钮 */
.sip-btn--danger      /* 危险按钮 */
.sip-btn--sm          /* 小尺寸 */
.sip-btn--lg          /* 大尺寸 */
```

---

## CSS 类名速查

```css
/* 按钮 */
.sip-btn, .sip-btn--primary, .sip-btn--secondary, .sip-btn--ghost, .sip-btn--danger

/* 卡片 */
.sip-card, .sip-card--primary, .sip-card--ghost, .sip-card--elevated
.sip-card__header, .sip-card__title, .sip-card__body

/* 输入框 */
.sip-input, .sip-textarea, .sip-select, .sip-input--error
.sip-input-wrapper    /* 带光晕的输入容器 */

/* 开关 */
.sip-toggle, .sip-toggle__input, .sip-toggle__track, .sip-toggle__thumb, .sip-toggle__label

/* 列表 */
.sip-list, .sip-list-item, .sip-list-item__icon, .sip-list-item__content
.sip-list-item__title, .sip-list-item__meta, .sip-list-item__actions

/* 资源项 */
.sip-resource-list, .sip-resource-item, .sip-resource-summary
.sip-resource-info, .sip-resource-icon, .sip-resource-name, .sip-resource-meta
.sip-resource-action, .sip-btn-icon

/* 弹窗 */
.sip-modal-backdrop, .sip-modal, .sip-modal__header
.sip-modal__title, .sip-modal__close, .sip-modal__body, .sip-modal__footer

/* 布局 */
.sip-nav-banner, .sip-kpi-grid, .sip-kpi-card
.sip-module-sidebar, .sip-sidebar-item, .sip-tabs
.sip-form-group, .sip-bordered-group, .sip-section-title

/* 网格 */
.sip-grid-2, .sip-grid-3, .sip-tile-grid
```

---

## 移动端极限降维法则

当视口 <= 768px 或 <= 480px 时，强制执行以下降维逻辑：

### 1. 网格降维 (Grid Collapsing)
所有的 `.sip-grid-2`, `.sip-grid-3`, `.sip-tile-grid` 等多列容器，强制 `grid-template-columns: 1fr !important`。

```css
@media (max-width: 768px) {
  .sip-grid-2, .sip-grid-3, .sip-tile-grid {
    grid-template-columns: 1fr !important;
  }
}
```

### 2. 导航形态转换 (Nav Transformation)
桌面端的左侧垂直侧边栏（`.sip-module-sidebar`），在移动端必须转为横向排列：

```css
@media (max-width: 768px) {
  .sip-module-sidebar {
    flex-direction: row;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .sip-module-sidebar::-webkit-scrollbar { display: none; }
  .sip-sidebar-item { 
    border-radius: 999px;  /* 胶囊药丸 */
  }
  .sip-sidebar-item::before { display: none; }  /* 隐藏竖线 */
}
```

### 3. 触控区精简与防挤压 (The Gap & Padding Squeeze)
对于紧凑型工具栏，移动端必须执行极限压缩：

```css
@media (max-width: 480px) {
  .sip-quick-toggles {
    height: 30px;
    padding: 0 4px;
    gap: 4px;
    font-size: 11px;
    font-weight: normal;
  }
  .sip-quick-toggle {
    padding: 0 4px;
    gap: 2px;
    font-weight: normal;
  }
}
```

### 4. 触控优化
- 所有可点击元素最小 44px
- 输入框字体 16px（防止 iOS 缩放）
- 增加触控反馈

---

## JS/TS 交互构建法则

### Modal 深度定制化
必须通过 `this.containerEl.querySelector('.modal-header').style.display = 'none';` 移除默认头部，并叠加定制的 Root Class 以彻底接管布局。

### 输入框焦点锁定 (Focus Lock)
对于输入框周围的工具栏按钮，必须绑定 `mousedown` 和 `touchstart` 事件并调用 `e.preventDefault()`，防止用户点击按钮时输入框失去焦点（导致移动端软键盘频繁起落）。

### 原生 Setting 组件的"剥皮"与融合 (Component Reset)
永远不要让 Obsidian `new Setting(el)` 直接暴露在网格中。必须通过 JS 强行抹除其默认样式：

```typescript
// 前提：setting 对象已经挂载到含有 .sip-bordered-group 的 group 容器上
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

### 横向滑动导航 (Swipe Architecture)
移动端复杂表单必须避免无尽垂直滚动。采用监听 `touchstart` 和 `touchend` 计算 `deltaX > 50` 的方式实现 Section 的滑动切换。

### 内联编辑 (Inline Editing)
放弃弹窗修改小文本，使用统一的 `attachInlineEdit(el, getter, setter)` 函数，点击文本即原地变为 input，失焦或回车后保存。

---

## 技术方案选择

### 方案 A: Obsidian TypeScript 插件（推荐）
适用于：原生 Obsidian 插件开发

**使用方式**：
```typescript
// 方式1：从 Skill 目录直接引用（开发时）
import { SIPSettingTab, SIPModal, UIUtils } from '.trae/skills/sip-ui-expert/obsidian-adapter';

// 方式2：复制到插件目录后引用（推荐）
import { SIPSettingTab, SIPModal, UIUtils } from './sip-ui/obsidian-adapter';

class MySettingTab extends SIPSettingTab {
  display(): void {
    this.initializeContainer();
    this.createBanner('设置');
    // ... 更多组件
  }
}
```

**设计系统文件位置**：`.trae/skills/sip-ui-expert/`（本 Skill 目录下）

### 方案 B: Markdown 渲染页面
适用于：通过 Markdown 渲染的配置界面

```javascript
// 方式1：从 Skill 目录直接引用（开发时）
const { SIPMarkdownAdapter } = require('.trae/skills/sip-ui-expert/markdown-adapter');

// 方式2：复制到插件目录后引用（推荐）
const { SIPMarkdownAdapter } = require('./sip-ui/markdown-adapter');

const adapter = new SIPMarkdownAdapter();
adapter.injectStyles();
adapter.wrapContent(container);
```

### 方案 C: 纯 CSS 引入
适用于：任何 Web 项目

```html
<link rel="stylesheet" href="sip-ui/tokens.css">
<link rel="stylesheet" href="sip-ui/components.css">
<link rel="stylesheet" href="sip-ui/mobile.css">
```

---

## 代码生成模板

### 设置页面完整模板

```typescript
import { App, Plugin, PluginSettingTab } from 'obsidian';
// 从 Skill 目录引用适配器
import { SIPSettingTab, UIUtils } from '.trae/skills/sip-ui-expert/obsidian-adapter';
// 或复制到插件目录后：import { SIPSettingTab, UIUtils } from './sip-ui/obsidian-adapter';

interface MyPluginSettings {
  enabled: boolean;
  apiKey: string;
  theme: 'light' | 'dark' | 'auto';
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  enabled: true,
  apiKey: '',
  theme: 'auto'
};

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new MySettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class MySettingTab extends SIPSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.initializeContainer();

    // Banner
    this.createBanner('My Plugin', '插件描述信息', {
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
      variant: 'primary'
    });

    // 基本设置卡片
    this.createCard('基本设置', (body) => {
      this.createToggle(body, {
        name: '启用插件',
        description: '开启或关闭插件功能',
        value: this.plugin.settings.enabled,
        onChange: async (value) => {
          this.plugin.settings.enabled = value;
          await this.plugin.saveSettings();
        }
      });

      this.createTextInput(body, {
        name: 'API Key',
        description: '您的 API 密钥',
        value: this.plugin.settings.apiKey,
        placeholder: 'sk-...',
        onChange: async (value) => {
          this.plugin.settings.apiKey = value;
          await this.plugin.saveSettings();
        }
      });

      this.createSelect(body, {
        name: '主题',
        description: '选择界面主题',
        value: this.plugin.settings.theme,
        options: [
          { value: 'light', label: '浅色' },
          { value: 'dark', label: '深色' },
          { value: 'auto', label: '自动' }
        ],
        onChange: async (value) => {
          this.plugin.settings.theme = value as 'light' | 'dark' | 'auto';
          await this.plugin.saveSettings();
        }
      });
    });
  }
}
```

### 弹窗完整模板

```typescript
import { App, Modal } from 'obsidian';
// 从 Skill 目录引用适配器
import { SIPModal } from '.trae/skills/sip-ui-expert/obsidian-adapter';
// 或复制到插件目录后：import { SIPModal } from './sip-ui/obsidian-adapter';

interface FormData {
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
}

export class CreateItemModal extends SIPModal {
  private data: FormData = {
    title: '',
    content: '',
    priority: 'medium'
  };
  private onSubmit: (data: FormData) => void;

  constructor(app: App, onSubmit: (data: FormData) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    super.onOpen();

    this.createHeader('创建新项目', true);

    const body = this.createBody();

    // 标题输入
    const titleWrapper = this.createInputWrapper(body);
    titleWrapper.createEl('label', { 
      text: '标题', 
      cls: 'sip-form-label' 
    });
    const titleInput = titleWrapper.createEl('input', {
      type: 'text',
      cls: 'sip-input',
      placeholder: '输入标题...'
    });
    titleInput.addEventListener('input', (e) => {
      this.data.title = (e.target as HTMLInputElement).value;
    });

    // 内容输入
    const contentWrapper = this.createInputWrapper(body);
    contentWrapper.createEl('label', { 
      text: '内容', 
      cls: 'sip-form-label' 
    });
    const contentInput = contentWrapper.createEl('textarea', {
      cls: 'sip-input sip-textarea',
      placeholder: '输入内容...'
    });
    contentInput.addEventListener('input', (e) => {
      this.data.content = (e.target as HTMLTextAreaElement).value;
    });

    // 优先级选择
    const priorityWrapper = this.createInputWrapper(body);
    priorityWrapper.createEl('label', { 
      text: '优先级', 
      cls: 'sip-form-label' 
    });
    const prioritySelect = priorityWrapper.createEl('select', {
      cls: 'sip-input sip-select'
    });
    [
      { value: 'low', label: '低' },
      { value: 'medium', label: '中' },
      { value: 'high', label: '高' }
    ].forEach(opt => {
      prioritySelect.createEl('option', {
        text: opt.label,
        value: opt.value
      });
    });
    prioritySelect.addEventListener('change', (e) => {
      this.data.priority = (e.target as HTMLSelectElement).value as 'low' | 'medium' | 'high';
    });

    // 底部按钮
    this.createFooter([
      { 
        name: '取消', 
        variant: 'ghost', 
        onClick: () => this.close() 
      },
      { 
        name: '创建', 
        variant: 'primary', 
        onClick: () => {
          this.onSubmit(this.data);
          this.close();
        }
      }
    ]);
  }
}
```

---

## 附录：类名速查表

| 组件 | 容器类名 | 子元素类名 | 状态修饰符 |
|------|----------|------------|------------|
| **容器** | `.sip-container` | - | `--narrow`, `--wide` |
| **网格** | `.sip-grid` | - | `--2`, `--3`, `--4` |
| **卡片** | `.sip-card` | `.sip-card__header`, `.sip-card__body` | `--hoverable` |
| **KPI 网格** | `.sip-kpi-grid` | `.sip-kpi-item`, `.sip-kpi-value`, `.sip-kpi-label` | - |
| **横幅** | `.sip-banner` | `.sip-banner__icon`, `.sip-banner__title`, `.sip-banner__desc` | `--brand`, `--success`, `--warning`, `--danger` |
| **侧边栏** | `.sip-sidebar` | `.sip-sidebar__item` | `--active` |
| **按钮** | `.sip-btn` | - | `--primary`, `--secondary`, `--ghost`, `--danger`, `--sm`, `--lg` |
| **输入框** | `.sip-input` | - | `--error` |
| **文本域** | `.sip-textarea` | - | - |
| **选择框** | `.sip-select` | - | - |
| **开关** | `.sip-toggle` | `.sip-toggle__track`, `.sip-toggle__thumb`, `.sip-toggle__label` | - |
| **复选框** | `.sip-checkbox` | `.sip-checkbox__box` | - |
| **分段控制器** | `.sip-segmented` | `.sip-segmented__item` | `--active` |
| **列表** | `.sip-list` | `.sip-list-item` | `--active` |
| **列表项** | `.sip-list-item` | `.sip-list-item__icon`, `.sip-list-item__content`, `.sip-list-item__title`, `.sip-list-item__meta`, `.sip-list-item__actions` | - |
| **表单组** | `.sip-form-group` | `.sip-form-label`, `.sip-form-hint` | - |
| **资源项** | `.sip-resource-item` | `.sip-resource-summary`, `.sip-resource-info`, `.sip-resource-icon`, `.sip-resource-name`, `.sip-resource-meta`, `.sip-resource-action` | - |
| **弹窗** | `.sip-modal` | `.sip-modal__overlay`, `.sip-modal__container`, `.sip-modal__header`, `.sip-modal__body`, `.sip-modal__footer` | `--size-sm`, `--size-lg` |

### 适配器方法速查

| 方法 | 用途 | 配置接口 |
|------|------|----------|
| `createBanner()` | 创建横幅 | `{ title, description?, variant?, icon? }` |
| `createCard()` | 创建卡片 | `{ title, contentCallback, collapsible?, defaultCollapsed? }` |
| `createSidebar()` | 创建侧边栏 | `{ items, activeId, onSelect }` |
| `createKPI()` | 创建 KPI 网格 | `{ items }` |
| `createToggle()` | 创建开关 | `SIPToggleConfig` |
| `createTextInput()` | 创建文本输入 | `SIPTextConfig` |
| `createSelect()` | 创建下拉选择 | `SIPSelectConfig` |
| `createSegmentedControl()` | 创建分段控制器 | `SIPSegmentedConfig` |
| `createButton()` | 创建按钮 | `SIPButtonConfig` |
| `createResourceList()` | 创建资源列表 | `{ icon?, title, meta?, actions? }[]` |
| `createInputWrapper()` | 创建输入包装器 | - |
| `createHeader()` | 创建弹窗头部 | `SIPModalHeaderConfig` |
| `createBody()` | 创建弹窗主体 | - |
| `createFooter()` | 创建弹窗底部 | - |

---

## 生态延展性 (Ecosystem Extensibility)

未来开发看板 (Kanban) 模块时：
- 看板列背景应复用 `--sip-bg-secondary` 或 `--sip-bg-elevated`
- 任务卡片直接继承 `.sip-resource-item` 或 `.sip-card` 的交互规范
- 统计 KPI 块直接复用 `.sip-kpi-grid`

---

## 文件位置

### Skill 文件
```
.trae/skills/sip-ui-expert/
├── SKILL.md           # 本文件（Skill 定义）
├── REFERENCE.md       # 源信息参考
├── evolution.json     # 进化记录
└── SKILL.md.bak       # 备份
```

### 设计系统资源（本目录下）
```
.trae/skills/sip-ui-expert/
├── SKILL.md           # Skill 定义（本文件）
├── REFERENCE.md       # 源信息参考
├── evolution.json     # 进化记录
├── SKILL.md.bak       # 备份
├── tokens.css         # 设计令牌
├── components.css     # 组件样式
├── mobile.css         # 移动端适配
├── obsidian-adapter.ts    # Obsidian 适配层
└── markdown-adapter.js    # Markdown 适配器
```

---

## 触发词

当用户提到以下内容时，立即激活此 Skill：
- "使用 SIP 风格设计"
- "SIP UI"
- "Smart Input Pro UI"
- "Obsidian 插件界面"
- "统一插件风格"
- "紫色主题界面"

---

## 进化守则 (Evolution Protocol)

本 Skill 集成了 skill-evolution-manager。在后续的 UI 开发中，如发现新的跨平台兼容性问题、更好的间距调校、或新的组件映射关系，必须主动调用总结逻辑构建 JSON，并通过 smart_stitch.py 将经验追加到本文件的 User-Learned Best Practices 章节中。

---

## User-Learned Best Practices & Constraints

> **Auto-Generated Section**: This section is maintained by `skill-evolution-manager`. Do not edit manually.

### User Preferences
- 重构 CSS 时应先检查是否存在重复的选择器定义，优先删除冲突的重复代码而非逐个修复

### Known Fixes & Workarounds
- 多字段资源列表项（如包含多个输入框的槽位行）严禁设置固定高度，必须使用 min-height: auto 或 height: auto 让 flex 内容自适应撑开，否则会导致后续字段被截断不可见
- CSS 样式应集中管理，避免在文件多处重复定义相同选择器。后定义的样式会覆盖前面的，可能导致预期外的布局问题。移动端样式应统一放在移动端适配章节中
- 多字段网格布局严禁使用 nth-of-type 选择器，必须使用 data-field 语义化属性选择器
- 输入框容器严禁使用 height + line-height 组合实现垂直居中，必须使用 display: flex; align-items: center 让内容自适应
- 网格字段容器必须显式设置 min-width: 0 以允许在 flex/grid 布局中正确收缩
- 动态表单中所有可交互字段必须添加 data-field 属性以便精确选择，禁止依赖 DOM 顺序

### Component Patterns & Contexts

【输入框组件 .sip-input-wrapper / .sip-input】.sip-input-wrapper { position: relative; border-radius: 12px; box-shadow: 0 0 0 2px var(--sip-primary-glow); transition: box-shadow 0.2s ease; background: var(--background-primary); height: 40px; display: flex; align-items: center; } .sip-input-wrapper:focus-within { box-shadow: 0 0 0 3px var(--sip-primary-glow-focus); } .sip-input { width: 100%; min-width: 0; height: 100%; padding: 0 14px; border: none; border-radius: 12px; background: transparent; color: var(--text-normal); font-size: 13px; outline: none; box-sizing: border-box; }

【下拉选择器 .sip-select】.sip-select { width: 100%; min-width: 0; height: 40px; padding: 0 28px 0 14px; border: 1px solid color-mix(in srgb, var(--text-normal) 15%, transparent); border-radius: 12px; background-color: var(--background-primary); color: var(--text-normal); font-size: 13px; cursor: pointer; outline: none; transition: all 0.2s ease; appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239f7aea' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; box-sizing: border-box; } .sip-select:focus { border-color: var(--sip-primary); box-shadow: 0 0 0 3px var(--sip-primary-glow-focus); }

【资源列表组件 .sip-resource-list / .sip-resource-item / .sip-resource-grid】.sip-resource-list { display: flex; flex-direction: column; gap: 12px; } .sip-resource-item { border: 1px solid var(--sip-primary-muted); border-radius: 12px; padding: 16px; background: var(--background-primary); transition: all 0.2s ease; } .sip-resource-item:hover { border-color: var(--sip-primary); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(186, 168, 254, 0.15); } .sip-resource-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; } .sip-resource-index { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: var(--sip-primary-muted); color: var(--sip-primary-text); font-size: 12px; font-weight: 600; border-radius: 8px; } .sip-resource-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; gap: 12px; align-items: start; } .sip-resource-field { min-width: 0; } .sip-field-label { font-size: 11px; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: block; }

【按钮组件 .sip-btn-primary / .sip-btn-secondary / .sip-btn-icon】.sip-btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; background: var(--sip-primary); color: white; font-size: 14px; font-weight: 500; border: none; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; } .sip-btn-primary:hover { background: var(--sip-primary-hover); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(159, 122, 234, 0.3); } .sip-btn-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; background: transparent; color: var(--text-normal); font-size: 14px; font-weight: 500; border: 1px solid color-mix(in srgb, var(--text-normal) 15%, transparent); border-radius: 12px; cursor: pointer; transition: all 0.2s ease; } .sip-btn-secondary:hover { background: var(--sip-primary-tint-1); border-color: var(--sip-primary); } .sip-btn-icon { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: transparent; color: var(--text-muted); border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; } .sip-btn-icon:hover { background: var(--background-modifier-hover); color: var(--text-error); }

【卡片组件 .sip-card / .sip-card-header / .sip-card-body】.sip-card { background: var(--background-primary); border: 1px solid color-mix(in srgb, var(--text-normal) 8%, transparent); border-radius: 16px; margin-bottom: 20px; overflow: hidden; } .sip-card-header { padding: 20px 20px 0 20px; } .sip-card-body { padding: 16px 20px 20px 20px; }

【边框表单组 .sip-bordered-group】.sip-bordered-group { border: 1px solid color-mix(in srgb, var(--text-normal) 10%, transparent); border-radius: 12px; padding: 16px; } .sip-bordered-group .setting-item { border: none !important; padding: 0 !important; background: transparent !important; } .sip-bordered-group .setting-item-info { display: none; } .sip-bordered-group .setting-item-control { padding-right: 0 !important; justify-content: space-between; width: 100%; }

【空状态组件 .sip-empty-state / .sip-empty-svg】.sip-empty-state { text-align: center; padding: 40px 20px; color: var(--text-muted); } .sip-empty-svg { width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.5; stroke: currentColor; }