/**
 * SIP-UI Design System v2.0 - Obsidian Adapter
 * =============================================
 * Obsidian 插件专用适配层
 * 
 * 提供以下基类和工具：
 * 1. SIPSettingTab - 标准设置页面基类
 * 2. SIPModal - 标准弹窗基类
 * 3. UIUtils - DOM 操作工具集
 * 4. ComponentFactory - 组件工厂
 * 
 * 使用方法：
 * ```typescript
 * class MySettingTab extends SIPSettingTab {
 *   display(): void {
 *     this.createBanner('设置', '配置您的插件');
 *     this.createCard('基本设置', (body) => {
 *       this.createToggle(body, '启用功能', 'enableFeature', true);
 *     });
 *   }
 * }
 * ```
 * 
 * 版本: 2.0.0
 * 
 * 注意：本文件为 Skill 参考文件，实际使用时需要在 Obsidian 插件环境中运行。
 * 类型声明仅用于代码提示，不做严格类型检查。
 */

// @ts-nocheck
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { App, Modal, PluginSettingTab, Setting, Component, SettingTab } from 'obsidian';

// ========================================
// 类型定义
// ========================================

export interface SIPToggleConfig {
  name: string;
  desc?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export interface SIPTextConfig {
  name: string;
  desc?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export interface SIPSelectConfig {
  name: string;
  desc?: string;
  value: string;
  options: Record<string, string>;
  onChange: (value: string) => void;
}

export interface SIPSegmentedConfig {
  name?: string;
  desc?: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

export interface SIPButtonConfig {
  name: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick: () => void;
}

// ========================================
// UI 工具类
// ========================================

export class UIUtils {
  /**
   * 创建带 SIP-UI 类的元素
   */
  static createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    classes?: string[],
    parent?: HTMLElement
  ): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    if (classes) {
      el.addClasses(classes);
    }
    if (parent) {
      parent.appendChild(el);
    }
    return el;
  }

  /**
   * 创建图标 (使用 Lucide 图标)
   */
  static createIcon(iconName: string, size: number = 16): HTMLElement {
    const icon = document.createElement('span');
    icon.addClass('sip-icon');
    // 使用 Obsidian 的 setIcon API
    if (window.require) {
      const { setIcon } = window.require('obsidian');
      setIcon(icon, iconName);
    }
    return icon;
  }

  /**
   * 创建 SVG 图标字符串
   */
  static getIconSvg(name: string, size: number = 16): string {
    const icons: Record<string, string> = {
      check: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
      x: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      chevronLeft: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
      chevronRight: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
      settings: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
    };
    return icons[name] || '';
  }

  /**
   * 强制清除 Obsidian Setting 组件的默认样式
   * 这是"剥皮"操作的核心
   * 
   * 防御性编程说明：
   * - 所有 DOM 操作都使用可选链 (?.) 和判空保护
   * - 如果 Obsidian 未来更改内部类名，方法会静默跳过而非抛出错误
   * - 返回操作结果便于调试
   */
  static stripSettingStyles(settingEl: HTMLElement): { success: boolean; skipped: string[] } {
    const result = { success: true, skipped: [] as string[] };
    
    // 防御性检查：确保传入有效元素
    if (!settingEl?.querySelector) {
      console.warn('[SIP-UI] stripSettingStyles: 无效的元素传入');
      return { success: false, skipped: ['invalid-element'] };
    }
    
    try {
      // 清除 setting-item 样式
      const item = settingEl.querySelector('.setting-item');
      if (item instanceof HTMLElement) {
        item.style.border = 'none';
        item.style.padding = '0';
        item.style.background = 'transparent';
      } else {
        result.skipped.push('setting-item');
      }
      
      // 隐藏 setting-item-info
      const info = settingEl.querySelector('.setting-item-info');
      if (info instanceof HTMLElement) {
        info.style.display = 'none';
      } else {
        result.skipped.push('setting-item-info');
      }
      
      // 调整 setting-item-control
      const control = settingEl.querySelector('.setting-item-control');
      if (control instanceof HTMLElement) {
        control.style.paddingRight = '0';
        control.style.justifyContent = 'flex-start';
      } else {
        result.skipped.push('setting-item-control');
      }
    } catch (error) {
      // 静默处理错误，避免阻塞插件渲染
      console.warn('[SIP-UI] stripSettingStyles 执行时遇到错误:', error);
      result.success = false;
    }
    
    return result;
  }
}

// ========================================
// SIP SettingTab 基类
// ========================================

export abstract class SIPSettingTab extends PluginSettingTab {
  protected containerEl: HTMLElement;

  constructor(app: App, plugin: any) {
    super(app, plugin);
  }

  /**
   * 在 containerEl 上添加 SIP-UI 根类
   */
  protected initializeContainer(): void {
    this.containerEl.addClass('sip-ui-root');
    this.containerEl.empty();
  }

  /**
   * 创建导航 Banner
   */
  protected createBanner(
    title: string,
    description?: string,
    options?: {
      showNav?: boolean;
      onPrev?: () => void;
      onNext?: () => void;
    }
  ): HTMLElement {
    const banner = UIUtils.createElement('div', ['sip-nav-banner'], this.containerEl);

    // 图标
    const iconWrapper = UIUtils.createElement('div', ['sip-nav-banner__icon'], banner);
    iconWrapper.innerHTML = UIUtils.getIconSvg('settings', 24);

    // 标题
    const titleEl = UIUtils.createElement('h1', ['sip-nav-banner__title'], banner);
    titleEl.textContent = title;

    // 描述
    if (description) {
      const descEl = UIUtils.createElement('p', ['sip-nav-banner__desc'], banner);
      descEl.textContent = description;
    }

    // 导航箭头
    if (options?.showNav) {
      if (options.onPrev) {
        const prevBtn = UIUtils.createElement('button', ['sip-nav-banner__arrow', 'sip-nav-banner__arrow--prev'], banner);
        prevBtn.innerHTML = UIUtils.getIconSvg('chevronLeft', 20);
        prevBtn.onclick = options.onPrev;
      }
      if (options.onNext) {
        const nextBtn = UIUtils.createElement('button', ['sip-nav-banner__arrow', 'sip-nav-banner__arrow--next'], banner);
        nextBtn.innerHTML = UIUtils.getIconSvg('chevronRight', 20);
        nextBtn.onclick = options.onNext;
      }
    }

    return banner;
  }

  /**
   * 创建卡片容器
   */
  protected createCard(
    title: string,
    contentCallback: (body: HTMLElement) => void,
    options?: {
      subtitle?: string;
      variant?: 'default' | 'primary' | 'ghost';
    }
  ): HTMLElement {
    const variant = options?.variant || 'default';
    const cardClasses = ['sip-card'];
    if (variant !== 'default') {
      cardClasses.push(`sip-card--${variant}`);
    }

    const card = UIUtils.createElement('div', cardClasses, this.containerEl);

    // 头部
    const header = UIUtils.createElement('div', ['sip-card__header'], card);
    const titleWrapper = UIUtils.createElement('div', [], header);
    
    const titleEl = UIUtils.createElement('h3', ['sip-card__title'], titleWrapper);
    titleEl.textContent = title;

    if (options?.subtitle) {
      const subtitleEl = UIUtils.createElement('p', ['sip-card__subtitle'], titleWrapper);
      subtitleEl.textContent = options.subtitle;
    }

    // 内容
    const body = UIUtils.createElement('div', ['sip-card__body'], card);
    contentCallback(body);

    return card;
  }

  /**
   * 创建 KPI 网格
   */
  protected createKPIGrid(items: Array<{
    label: string;
    value: string | number;
    sub?: string;
  }>): HTMLElement {
    const grid = UIUtils.createElement('div', ['sip-kpi-grid'], this.containerEl);

    items.forEach(item => {
      const kpi = UIUtils.createElement('div', ['sip-kpi'], grid);
      
      const label = UIUtils.createElement('div', ['sip-kpi__label'], kpi);
      label.textContent = item.label;
      
      const value = UIUtils.createElement('div', ['sip-kpi__value'], kpi);
      value.textContent = String(item.value);
      
      if (item.sub) {
        const sub = UIUtils.createElement('div', ['sip-kpi__sub'], kpi);
        sub.textContent = item.sub;
      }
    });

    return grid;
  }

  /**
   * 创建侧边栏导航
   */
  protected createSidebar(
    items: Array<{
      id: string;
      label: string;
      icon?: string;
    }>,
    activeId: string,
    onSelect: (id: string) => void
  ): HTMLElement {
    const sidebar = UIUtils.createElement('div', ['sip-sidebar'], this.containerEl);

    items.forEach(item => {
      const classes = ['sip-sidebar__item'];
      if (item.id === activeId) {
        classes.push('sip-sidebar__item--active');
      }
      
      const el = UIUtils.createElement('div', classes, sidebar);
      el.textContent = item.label;
      el.onclick = () => onSelect(item.id);
    });

    return sidebar;
  }

  /**
   * 创建 SIP 风格的 Toggle 开关
   */
  protected createToggle(
    container: HTMLElement,
    config: SIPToggleConfig
  ): HTMLElement {
    const group = UIUtils.createElement('div', ['sip-form-group', 'sip-bordered-group'], container);

    const setting = new Setting(group)
      .setName(config.name)
      .setDesc(config.desc || '')
      .addToggle(toggle => {
        toggle.setValue(config.value);
        toggle.onChange(config.onChange);
      });

    // 剥皮操作
    UIUtils.stripSettingStyles(group);

    return group;
  }

  /**
   * 创建 SIP 风格的文本输入
   */
  protected createTextInput(
    container: HTMLElement,
    config: SIPTextConfig
  ): HTMLElement {
    const group = UIUtils.createElement('div', ['sip-form-group'], container);

    const label = UIUtils.createElement('label', ['sip-form-label'], group);
    label.textContent = config.name;

    const input = UIUtils.createElement('input', ['sip-input'], group) as HTMLInputElement;
    input.type = 'text';
    input.value = config.value;
    input.placeholder = config.placeholder || '';
    input.onchange = () => config.onChange(input.value);

    if (config.desc) {
      const hint = UIUtils.createElement('div', ['sip-form-hint'], group);
      hint.textContent = config.desc;
    }

    return group;
  }

  /**
   * 创建 SIP 风格的选择框
   */
  protected createSelect(
    container: HTMLElement,
    config: SIPSelectConfig
  ): HTMLElement {
    const group = UIUtils.createElement('div', ['sip-form-group'], container);

    const label = UIUtils.createElement('label', ['sip-form-label'], group);
    label.textContent = config.name;

    const select = UIUtils.createElement('select', ['sip-input', 'sip-select'], group) as HTMLSelectElement;
    
    Object.entries(config.options).forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    });
    
    select.value = config.value;
    select.onchange = () => config.onChange(select.value);

    if (config.desc) {
      const hint = UIUtils.createElement('div', ['sip-form-hint'], group);
      hint.textContent = config.desc;
    }

    return group;
  }

  /**
   * 创建 SIP 风格的按钮
   */
  protected createButton(
    container: HTMLElement,
    config: SIPButtonConfig
  ): HTMLElement {
    const classes = ['sip-btn'];
    if (config.variant) {
      classes.push(`sip-btn--${config.variant}`);
    }
    if (config.size) {
      classes.push(`sip-btn--${config.size}`);
    }

    const btn = UIUtils.createElement('button', classes, container);
    btn.textContent = config.name;
    btn.onclick = config.onClick;

    return btn;
  }

  /**
   * 创建分段控制器 (Segmented Control)
   * 适用于 2-3 个选项的切换场景，替代下拉框
   */
  protected createSegmentedControl(
    container: HTMLElement,
    config: SIPSegmentedConfig
  ): HTMLElement {
    const group = UIUtils.createElement('div', ['sip-form-group'], container);

    if (config.name) {
      const label = UIUtils.createElement('label', ['sip-form-label'], group);
      label.textContent = config.name;
    }

    const wrapper = UIUtils.createElement('div', ['sip-segmented'], group);
    let currentValue = config.value;

    const updateAll = () => {
      wrapper.querySelectorAll('.sip-segmented__item').forEach((btn) => {
        const isActive = (btn as HTMLElement).dataset.value === currentValue;
        btn.toggleClass('sip-segmented__item--active', isActive);
      });
    };

    config.options.forEach((opt) => {
      const btn = UIUtils.createElement('button', ['sip-segmented__item'], wrapper);
      btn.textContent = opt.label;
      btn.dataset.value = opt.value;
      btn.onclick = () => {
        if (currentValue !== opt.value) {
          currentValue = opt.value;
          updateAll();
          config.onChange(opt.value);
        }
      };
    });

    updateAll();

    // 暴露方法供外部调用
    (wrapper as any).setValue = (val: string) => {
      currentValue = val;
      updateAll();
    };
    (wrapper as any).getValue = () => currentValue;

    if (config.desc) {
      const hint = UIUtils.createElement('div', ['sip-form-hint'], group);
      hint.textContent = config.desc;
    }

    return group;
  }

  /**
   * 创建资源列表
   */
  protected createResourceList(
    container: HTMLElement,
    items: Array<{
      icon?: string;
      title: string;
      meta?: string;
      actions?: SIPButtonConfig[];
    }>
  ): HTMLElement {
    const list = UIUtils.createElement('div', ['sip-list'], container);

    items.forEach(item => {
      const listItem = UIUtils.createElement('div', ['sip-list-item'], list);

      // 图标
      if (item.icon) {
        const iconEl = UIUtils.createElement('div', ['sip-list-item__icon'], listItem);
        iconEl.innerHTML = UIUtils.getIconSvg(item.icon, 18);
      }

      // 内容
      const content = UIUtils.createElement('div', ['sip-list-item__content'], listItem);
      const title = UIUtils.createElement('div', ['sip-list-item__title'], content);
      title.textContent = item.title;

      if (item.meta) {
        const meta = UIUtils.createElement('div', ['sip-list-item__meta'], content);
        meta.textContent = item.meta;
      }

      // 操作
      if (item.actions && item.actions.length > 0) {
        const actions = UIUtils.createElement('div', ['sip-list-item__actions'], listItem);
        item.actions.forEach(action => {
          this.createButton(actions, action);
        });
      }
    });

    return list;
  }
}

// ========================================
// SIP Modal 基类
// ========================================

export abstract class SIPModal extends Modal {
  protected contentEl: HTMLElement;

  constructor(app: App) {
    super(app);
  }

  /**
   * 自定义模态框样式
   */
  protected customizeModal(): void {
    // 移除默认头部
    const header = this.containerEl.querySelector('.modal-header');
    if (header) {
      (header as HTMLElement).style.display = 'none';
    }

    // 添加 SIP-UI 根类
    this.containerEl.addClass('sip-modal-root');
    
    // 获取内容容器
    this.contentEl = this.containerEl.querySelector('.modal-content') as HTMLElement;
    if (this.contentEl) {
      this.contentEl.empty();
      this.contentEl.addClass('sip-modal__content');
    }
  }

  /**
   * 创建模态框头部
   */
  protected createHeader(title: string, showClose: boolean = true): HTMLElement {
    const header = UIUtils.createElement('div', ['sip-modal__header'], this.contentEl);

    const titleEl = UIUtils.createElement('h2', ['sip-modal__title'], header);
    titleEl.textContent = title;

    if (showClose) {
      const closeBtn = UIUtils.createElement('button', ['sip-modal__close'], header);
      closeBtn.innerHTML = UIUtils.getIconSvg('x', 20);
      closeBtn.onclick = () => this.close();
    }

    return header;
  }

  /**
   * 创建模态框内容区
   */
  protected createBody(): HTMLElement {
    return UIUtils.createElement('div', ['sip-modal__body'], this.contentEl);
  }

  /**
   * 创建模态框底部
   */
  protected createFooter(buttons: SIPButtonConfig[]): HTMLElement {
    const footer = UIUtils.createElement('div', ['sip-modal__footer'], this.contentEl);

    buttons.forEach(config => {
      const classes = ['sip-btn'];
      if (config.variant) {
        classes.push(`sip-btn--${config.variant}`);
      }

      const btn = UIUtils.createElement('button', classes, footer);
      btn.textContent = config.name;
      btn.onclick = config.onClick;
    });

    return footer;
  }

  /**
   * 创建带光晕的输入容器
   */
  protected createInputWrapper(parent: HTMLElement): HTMLElement {
    return UIUtils.createElement('div', ['sip-input-wrapper'], parent);
  }

  onOpen(): void {
    this.customizeModal();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

// ========================================
// 组件工厂
// ========================================

export class ComponentFactory {
  private static readonly STYLE_ID = 'sip-ui-styles';
  private static readonly TOKEN_ID = 'sip-ui-tokens';
  private static readonly COMPONENT_ID = 'sip-ui-components';
  private static readonly MOBILE_ID = 'sip-ui-mobile';

  /**
   * 检查样式是否已存在（防抖/查重）
   */
  static hasStyles(styleId: string = this.STYLE_ID): boolean {
    return !!document.getElementById(styleId);
  }

  /**
   * 创建完整的 SIP-UI 样式表链接
   */
  static createStylesheet(cssContent: string = '', styleId: string = this.STYLE_ID): HTMLStyleElement {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = cssContent || `/* SIP-UI Design System v2.0 */`;
    return style;
  }

  /**
   * 注入 SIP-UI 样式到文档（带查重）
   */
  static injectStyles(cssContent: string = '', styleId: string = this.STYLE_ID): HTMLStyleElement | null {
    if (this.hasStyles(styleId)) {
      return document.getElementById(styleId) as HTMLStyleElement;
    }

    const style = this.createStylesheet(cssContent, styleId);
    document.head.appendChild(style);
    return style;
  }

  /**
   * 移除指定 ID 的样式标签
   */
  static removeStyles(styleId: string = this.STYLE_ID): void {
    const style = document.getElementById(styleId);
    if (style?.parentNode) {
      style.parentNode.removeChild(style);
    }
  }

  /**
   * 移除所有 SIP-UI 相关样式
   */
  static removeAllStyles(): void {
    [this.STYLE_ID, this.TOKEN_ID, this.COMPONENT_ID, this.MOBILE_ID].forEach(id => {
      this.removeStyles(id);
    });
  }

  /**
   * 注入 tokens.css 内容
   */
  static injectTokens(cssContent: string): HTMLStyleElement | null {
    return this.injectStyles(cssContent, this.TOKEN_ID);
  }

  /**
   * 注入 components.css 内容
   */
  static injectComponents(cssContent: string): HTMLStyleElement | null {
    return this.injectStyles(cssContent, this.COMPONENT_ID);
  }

  /**
   * 注入 mobile.css 内容
   */
  static injectMobile(cssContent: string): HTMLStyleElement | null {
    return this.injectStyles(cssContent, this.MOBILE_ID);
  }
}

// ========================================
// 导出所有内容
// ========================================

export default {
  UIUtils,
  SIPSettingTab,
  SIPModal,
  ComponentFactory,
};
