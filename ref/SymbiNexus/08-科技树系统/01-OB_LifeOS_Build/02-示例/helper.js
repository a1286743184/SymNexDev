// SipUiHelper - 插件配置页 UI 渲染基准
class SipUiHelper {
    constructor(containerEl) {
        this.container = containerEl;
        this.container.empty();
        this.container.classList.add('sip-settings-container');
        this.tabContents = new Map();
        this.tabBtns = new Map();
    }

    // 创建带下划线的顶部选项卡
    createTabs(tabNames, defaultTab = tabNames[0]) {
        const header = this.container.createDiv('sip-tabs-header');
        
        tabNames.forEach(name => {
            const btn = header.createEl('button', { cls: 'sip-tab-btn', text: name });
            const content = this.container.createDiv('sip-tab-content');
            
            this.tabBtns.set(name, btn);
            this.tabContents.set(name, content);

            btn.addEventListener('click', () => this.switchTab(name));
        });

        this.switchTab(defaultTab);
        return this.tabContents; // 返回容器 Map 供后续挂载 Card
    }

    switchTab(activeName) {
        this.tabBtns.forEach((btn, name) => {
            btn.classList.toggle('is-active', name === activeName);
            this.tabContents.get(name).classList.toggle('is-active', name === activeName);
        });
    }

    // 创建标准分组卡片
    createCard(parentEl, title, subtitle = '') {
        const card = parentEl.createDiv('sip-card');
        const header = card.createDiv('sip-card-header');
        
        const titleEl = header.createDiv('sip-card-title');
        titleEl.textContent = title;
        
        if (subtitle) {
            const subtitleEl = header.createDiv('sip-card-subtitle');
            subtitleEl.textContent = subtitle;
        }
        
        return card; // 返回卡片 DOM，用于 new Setting(card)
    }

    // 创建纯净状态指示器 (替代 Emoji)
    createStatusTag(parentEl, text, status = 'success') {
        const tag = parentEl.createDiv('sip-status-tag');
        const dot = tag.createDiv(`sip-status-dot ${status}`);
        const span = tag.createSpan();
        span.textContent = text;
        return tag;
    }
}