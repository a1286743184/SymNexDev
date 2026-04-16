/**
 * SIP-UI Design System v2.0 - Markdown Adapter
 * =============================================
 * Markdown 渲染适配方案
 * 
 * 用于在 Obsidian Markdown 视图中注入 SIP-UI 样式
 * 适用于通过 Markdown 渲染的配置页面（如 Task Dashboard Kit）
 * 
 * 使用方法：
 * ```javascript
 * // 在你的 Markdown 渲染代码中
 * import { SIPMarkdownAdapter } from './markdown-adapter';
 * 
 * const adapter = new SIPMarkdownAdapter();
 * adapter.injectStyles();
 * adapter.wrapContent(container);
 * ```
 * 
 * 版本: 2.0.0
 */

class SIPMarkdownAdapter {
  constructor(options = {}) {
    this.styleId = options.styleId || 'sip-ui-markdown-styles';
    this.containerClass = options.containerClass || 'sip-markdown-container';
    this.injectedElements = new Set();
  }

  /**
   * 检查样式是否已注入（防抖/查重）
   */
  hasStyles() {
    return !!document.getElementById(this.styleId);
  }

  /**
   * 注入 SIP-UI 样式到 Markdown 视图（带查重）
   */
  injectStyles() {
    if (this.hasStyles()) {
      return false;
    }

    const style = document.createElement('style');
    style.id = this.styleId;
    style.textContent = this.getCSS();
    document.head.appendChild(style);
    this.injectedElements.add(this.styleId);
    return true;
  }

  /**
   * 移除 SIP-UI 样式
   */
  removeStyles() {
    const style = document.getElementById(this.styleId);
    if (style?.parentNode) {
      style.parentNode.removeChild(style);
      this.injectedElements.delete(this.styleId);
      return true;
    }
    return false;
  }

  /**
   * 完全卸载适配器（清理所有资源）
   */
  unmount() {
    this.removeStyles();
    
    // 清理所有注入的容器类
    const containers = document.querySelectorAll(`.${this.containerClass}`);
    containers.forEach(container => {
      container.removeClass(this.containerClass);
    });
    
    this.injectedElements.clear();
  }

  /**
   * 包装 Markdown 内容容器
   */
  wrapContent(container) {
    if (!container) return;
    
    container.addClass(this.containerClass);
    
    // 转换原生元素为 SIP-UI 风格
    this.transformButtons(container);
    this.transformInputs(container);
    this.transformCards(container);
    this.transformLists(container);
  }

  /**
   * 转换按钮为 SIP 风格
   */
  transformButtons(container) {
    const buttons = container.querySelectorAll('button:not(.sip-btn)');
    buttons.forEach(btn => {
      btn.addClass('sip-btn');
      
      // 根据按钮文本或类名判断变体
      if (btn.hasClass('primary') || btn.hasClass('mod-cta')) {
        btn.addClass('sip-btn--primary');
      } else if (btn.hasClass('danger') || btn.hasClass('mod-warning')) {
        btn.addClass('sip-btn--danger');
      } else if (btn.hasClass('ghost')) {
        btn.addClass('sip-btn--ghost');
      }
    });
  }

  /**
   * 转换输入框为 SIP 风格
   */
  transformInputs(container) {
    const inputs = container.querySelectorAll('input[type="text"], input[type="number"], select');
    inputs.forEach(input => {
      input.addClass('sip-input');
    });

    const textareas = container.querySelectorAll('textarea');
    textareas.forEach(textarea => {
      textarea.addClass('sip-input');
      textarea.addClass('sip-textarea');
    });
  }

  /**
   * 转换卡片区域为 SIP 风格
   */
  transformCards(container) {
    // 查找带有特定类名或结构的卡片
    const cards = container.querySelectorAll('.setting-item, .config-card, [data-sip-card]');
    cards.forEach(card => {
      card.addClass('sip-card');
      
      // 尝试识别头部和内容
      const header = card.querySelector('.setting-item-name, .card-header, h3, h4');
      const info = card.querySelector('.setting-item-info, .card-body');
      
      if (header) {
        header.addClass('sip-card__title');
      }
      if (info) {
        info.addClass('sip-card__body');
      }
    });
  }

  /**
   * 转换列表为 SIP 风格
   */
  transformLists(container) {
    const lists = container.querySelectorAll('.config-list, [data-sip-list]');
    lists.forEach(list => {
      list.addClass('sip-list');
      
      const items = list.querySelectorAll('li, .list-item, .config-item');
      items.forEach(item => {
        item.addClass('sip-list-item');
      });
    });
  }

  /**
   * 获取适配后的 CSS
   */
  getCSS() {
    return `
/* SIP-UI Markdown Adapter Styles */

/* 容器基础 */
.${this.containerClass} {
  --sip-primary: #baa8fe;
  --sip-primary-hover: #a894fc;
  --sip-primary-muted: rgba(186, 168, 254, 0.15);
  --sip-primary-subtle: rgba(186, 168, 254, 0.25);
  --sip-surface: #f5f3ff;
  --sip-glow: rgba(186, 168, 254, 0.12);
  --sip-glow-focus: rgba(186, 168, 254, 0.35);
  
  --sip-text-primary: var(--text-normal);
  --sip-text-secondary: var(--text-muted);
  --sip-bg-primary: var(--background-primary);
  --sip-bg-secondary: var(--background-secondary);
  --sip-border: var(--background-modifier-border);
  
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* 按钮适配 */
.${this.containerClass} .sip-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid transparent;
  background: var(--sip-bg-secondary);
  color: var(--sip-text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.${this.containerClass} .sip-btn:hover {
  background: var(--background-modifier-hover);
  transform: translateY(-1px);
}

.${this.containerClass} .sip-btn--primary {
  background: var(--sip-primary);
  color: white;
  border-color: var(--sip-primary);
}

.${this.containerClass} .sip-btn--primary:hover {
  background: var(--sip-primary-hover);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
}

.${this.containerClass} .sip-btn--danger {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.${this.containerClass} .sip-btn--ghost {
  background: transparent;
  color: var(--sip-text-secondary);
}

/* 输入框适配 */
.${this.containerClass} .sip-input {
  width: 100%;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--sip-text-primary);
  background: var(--sip-bg-primary);
  border: 1px solid var(--sip-border);
  border-radius: 12px;
  transition: all 0.2s ease;
  outline: none;
}

.${this.containerClass} .sip-input:focus {
  border-color: var(--sip-primary);
  box-shadow: 0 0 0 3px var(--sip-glow-focus);
}

.${this.containerClass} .sip-textarea {
  min-height: 100px;
  resize: vertical;
}

/* 卡片适配 */
.${this.containerClass} .sip-card {
  background: var(--sip-bg-primary);
  border: 1px solid var(--sip-border);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.2s ease;
}

.${this.containerClass} .sip-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
  border-color: var(--sip-primary-subtle);
}

.${this.containerClass} .sip-card__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--sip-text-primary);
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.${this.containerClass} .sip-card__title::before {
  content: "";
  width: 4px;
  height: 14px;
  border-radius: 3px;
  background: var(--sip-primary);
}

.${this.containerClass} .sip-card__body {
  color: var(--sip-text-secondary);
}

/* 列表适配 */
.${this.containerClass} .sip-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.${this.containerClass} .sip-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--sip-bg-primary);
  border: 1px solid var(--sip-border);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.${this.containerClass} .sip-list-item:hover {
  border-color: var(--sip-primary-muted);
  background: var(--sip-bg-secondary);
}

/* 开关适配 */
.${this.containerClass} .sip-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.${this.containerClass} .sip-toggle input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.${this.containerClass} .sip-toggle-track {
  width: 44px;
  height: 24px;
  background: var(--sip-border);
  border-radius: 999px;
  transition: background 0.2s ease;
  position: relative;
}

.${this.containerClass} .sip-toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.${this.containerClass} .sip-toggle input:checked + .sip-toggle-track {
  background: var(--sip-primary);
}

.${this.containerClass} .sip-toggle input:checked + .sip-toggle-track .sip-toggle-thumb {
  transform: translateX(20px);
}

/* 移动端适配 */
@media (max-width: 480px) {
  .${this.containerClass} .sip-card {
    padding: 16px;
    border-radius: 12px;
  }
  
  .${this.containerClass} .sip-btn:not(.sip-btn--icon) {
    width: 100%;
  }
  
  .${this.containerClass} .sip-list-item {
    padding: 10px 12px;
  }
}
`;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SIPMarkdownAdapter };
}

// 全局可用
if (typeof window !== 'undefined') {
  window.SIPMarkdownAdapter = SIPMarkdownAdapter;
}
