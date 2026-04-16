const { Plugin, PluginSettingTab, Setting, MarkdownView, Notice } = require('obsidian');

const DEFAULT_SETTINGS = {
    debugMode: false,
    rules: [],
    maxFileSizeForRegex: 100000
};

const VIEW_MODE = {
    DEFAULT: 'default',
    READING: 'reading',
    SOURCE: 'source',
    LIVE: 'live'
};

const JUMP_TARGET = {
    NONE: 'none',
    BOTTOM: 'bottom',
    HEADING: 'heading',
    REGEX: 'regex'
};

class ViewControllerPlugin extends Plugin {
    async onload() {
        this._sortedRules = null;
        this._pendingOperations = new Map();
        this._currentFile = null;

        await this.loadSettings();
        this.addSettingTab(new ViewControllerSettingTab(this.app, this));

        this.registerEvent(
            this.app.workspace.on('file-open', this.onFileOpen.bind(this))
        );

        if (this.settings.debugMode) {
            console.log('[View Controller] Plugin Loaded');
        }
    }

    onunload() {
        this.cancelAllPendingOperations();
        this._sortedRules = null;
        if (this.settings.debugMode) {
            console.log('[View Controller] Plugin Unloaded');
        }
    }

    cancelAllPendingOperations() {
        for (const [key, timerId] of this._pendingOperations) {
            clearTimeout(timerId);
        }
        this._pendingOperations.clear();
    }

    cancelPendingOperation(key) {
        const timerId = this._pendingOperations.get(key);
        if (timerId) {
            clearTimeout(timerId);
            this._pendingOperations.delete(key);
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        this._sortedRules = null;
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this._sortedRules = null;
    }

    getSortedRules() {
        if (!this._sortedRules) {
            this._sortedRules = [...this.settings.rules].sort((a, b) => {
                const aIsFile = !a.path.endsWith('/');
                const bIsFile = !b.path.endsWith('/');
                
                if (aIsFile && !bIsFile) return -1;
                if (!aIsFile && bIsFile) return 1;
                
                return b.path.length - a.path.length;
            });
        }
        return this._sortedRules;
    }

    async onFileOpen(file) {
        if (!file) return;

        this._currentFile = file;
        this.cancelAllPendingOperations();

        if (window.sipNavigationInProgress) {
            if (this.settings.debugMode) {
                console.log('[View Controller] SIP Navigation in progress, skipping VC logic.');
            }
            return;
        }

        const rule = this.findMatchingRule(file.path);
        
        if (this.settings.debugMode && rule) {
            new Notice(`✅ [VC] 匹配规则:\n路径: ${rule.path}\n模式: ${rule.mode}\n跳转: ${rule.jumpTarget}`, 5000);
            console.log(`[View Controller] Matched rule for ${file.path}:`, rule);
        }

        if (!rule) return;

        const viewReady = await this.waitForViewReady(file, 300);
        if (!viewReady) return;

        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view || !view.file || view.file.path !== file.path) return;

        await this.applyViewMode(view, rule.mode);

        if (rule.jumpTarget !== JUMP_TARGET.NONE) {
            const timerId = setTimeout(async () => {
                this._pendingOperations.delete('jump');
                
                const currentView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (!currentView || !currentView.file || currentView.file.path !== file.path) return;

                const mode = currentView.getMode();
                if (mode === 'preview' && rule.jumpTarget !== JUMP_TARGET.BOTTOM) {
                    if (this.settings.debugMode) {
                        new Notice(`⚠️ [VC] 阅读视图仅支持"文末"跳转，已跳过"${rule.jumpTarget}"操作。`);
                    }
                    return;
                }

                if (this.settings.debugMode) {
                    new Notice(`🚀 [VC] 执行跳转: ${rule.jumpTarget}`);
                }
                await this.applyJump(currentView, file, rule);
            }, 150);
            
            this._pendingOperations.set('jump', timerId);
        }
    }

    waitForViewReady(file, timeout = 300) {
        return new Promise((resolve) => {
            let resolved = false;
            const startTime = Date.now();

            const check = () => {
                if (resolved) return;
                
                if (this._currentFile && this._currentFile.path !== file.path) {
                    resolved = true;
                    resolve(null);
                    return;
                }

                const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (view && view.file && view.file.path === file.path) {
                    resolved = true;
                    resolve(view);
                    return;
                }

                if (Date.now() - startTime >= timeout) {
                    resolved = true;
                    resolve(null);
                    return;
                }

                setTimeout(check, 16);
            };

            setTimeout(check, 16);
        });
    }

    findMatchingRule(filePath) {
        const sortedRules = this.getSortedRules();

        for (const rule of sortedRules) {
            if (!rule.path) continue;
            
            const rulePath = rule.path.trim();
            
            if (rulePath === filePath) return rule;
            
            if (!rulePath.endsWith('/') && !rulePath.endsWith('.md') && rulePath + '.md' === filePath) return rule;

            let dirPath = rulePath;
            if (!dirPath.endsWith('/')) dirPath += '/';
            
            if (filePath.startsWith(dirPath)) return rule;
        }
        return null;
    }

    async applyViewMode(view, targetMode) {
        if (targetMode === VIEW_MODE.DEFAULT) return;

        const currentMode = view.getMode();

        const isLivePreview = () => {
            const state = view.getState();
            return state.mode === 'source' && !state.source;
        };
        const isSourceMode = () => {
            const state = view.getState();
            return state.mode === 'source' && state.source;
        };

        const togglePreview = async () => {
            await this.app.commands.executeCommandById('markdown:toggle-preview');
            await new Promise(resolve => setTimeout(resolve, 50));
        };

        const toggleSource = async () => {
            await this.app.commands.executeCommandById('editor:toggle-source');
            await new Promise(resolve => setTimeout(resolve, 50));
        };

        try {
            if (targetMode === VIEW_MODE.READING) {
                if (currentMode === 'source') {
                    await togglePreview();
                }
            } else if (targetMode === VIEW_MODE.SOURCE) {
                if (currentMode === 'preview') {
                    await togglePreview();
                }
                if (isLivePreview()) {
                    await toggleSource();
                }
            } else if (targetMode === VIEW_MODE.LIVE) {
                if (currentMode === 'preview') {
                    await togglePreview();
                }
                if (isSourceMode()) {
                    await toggleSource();
                }
            }
        } catch (e) {
            console.error('[View Controller] Error switching view:', e);
            if (this.settings.debugMode) {
                new Notice(`❌ [VC] 视图切换失败: ${e.message}`);
            }
        }
    }

    async applyJump(view, file, rule) {
        const mode = view.getMode();
        let line = 0;
        let ch = 0;
        let matchIndex = rule.matchIndex || 0;
        
        try {
            if (rule.jumpTarget === JUMP_TARGET.BOTTOM) {
                if (mode === 'source') {
                    const editor = view.editor;
                    const lineCount = editor.lineCount();
                    line = lineCount > 0 ? lineCount - 1 : 0;
                    ch = editor.getLine(line).length;
                } else {
                    setTimeout(() => {
                         const scroller = view.contentEl.querySelector('.markdown-preview-view');
                         if (scroller) {
                             scroller.scrollTop = scroller.scrollHeight;
                         }
                    }, 50);
                    return;
                }
            } else if (rule.jumpTarget === JUMP_TARGET.HEADING) {
                const headingText = rule.jumpParams;
                if (!headingText) return;

                const cache = this.app.metadataCache.getFileCache(file);
                if (!cache || !cache.headings) return;

                let matches = cache.headings.filter(h => h.heading === headingText);
                if (matches.length === 0) {
                     const cleanParam = headingText.toLowerCase().trim();
                     matches = cache.headings.filter(h => h.heading.toLowerCase().includes(cleanParam));
                }

                if (matches.length > 0) {
                    const targetMatch = matches[Math.min(matchIndex, matches.length - 1)];
                    line = targetMatch.position.start.line;
                } else {
                    if (this.settings.debugMode) {
                        new Notice(`⚠️ [VC] 未找到标题: ${headingText}`);
                    }
                    return;
                }
            } else if (rule.jumpTarget === JUMP_TARGET.REGEX) {
                const fileSize = file.stat?.size || 0;
                const maxSize = this.settings.maxFileSizeForRegex || 100000;
                
                if (fileSize > maxSize) {
                    if (this.settings.debugMode) {
                        new Notice(`⚠️ [VC] 文件过大 (${Math.round(fileSize/1024)}KB)，跳过正则匹配`);
                    }
                    return;
                }

                let regexStr = rule.jumpParams;
                
                try {
                    const regex = new RegExp(regexStr, 'g');
                    const content = await this.app.vault.read(file);
                    
                    let match;
                    let currentIdx = 0;
                    let found = false;
                    while ((match = regex.exec(content)) !== null) {
                        if (currentIdx === matchIndex) {
                            const textBefore = content.substring(0, match.index);
                            const lines = textBefore.split('\n');
                            line = lines.length - 1;
                            ch = lines[lines.length - 1].length;
                            found = true;
                            break;
                        }
                        currentIdx++;
                    }
                    if (!found && this.settings.debugMode) {
                        new Notice(`⚠️ [VC] 未找到正则匹配: ${regexStr} (第${matchIndex+1}个)`);
                        return;
                    }
                } catch (e) {
                    new Notice(`❌ [VC] 正则表达式错误: ${e.message}`);
                    return;
                }
            }

            if (mode === 'source') {
                const editor = view.editor;
                editor.setCursor(line, ch);
                editor.scrollIntoView({ from: { line, ch }, to: { line, ch } }, true);
                editor.focus();
            }
        } catch (err) {
            console.error('[View Controller] Jump failed:', err);
            if (this.settings.debugMode) {
                new Notice(`❌ [VC] 跳转失败: ${err.message}`);
            }
        }
    }
}

class ViewControllerSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        // ========== Title 1: 页面大标题 ==========
        containerEl.createEl('h1', { 
            cls: 'vc-sip-title', 
            text: 'View Controller' 
        });
        containerEl.createEl('p', { 
            cls: 'vc-sip-subtitle', 
            text: '根据路径规则自动切换视图模式和跳转位置' 
        });

        // ========== Card 1: 全局设置 ==========
        const globalCard = containerEl.createDiv({ cls: 'vc-sip-card' });
        const globalHeader = globalCard.createDiv({ cls: 'vc-sip-card-header' });
        globalHeader.createEl('h3', { 
            cls: 'vc-sip-section-title', 
            text: '全局设置' 
        });
        const globalBody = globalCard.createDiv({ cls: 'vc-sip-card-body' });

        // 调试模式 - 使用剥皮开关组
        const debugGroup = globalBody.createDiv({ cls: 'vc-sip-form-group vc-sip-bordered-group' });
        const debugSetting = new Setting(debugGroup)
            .setName('调试模式')
            .setDesc('开启后，打开文件时会提示是否匹配到规则，并在跳转时显示通知。')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.debugMode)
                .onChange(async (value) => {
                    this.plugin.settings.debugMode = value;
                    await this.plugin.saveSettings();
                }));
        this.stripSettingStyles(debugGroup);

        // 文件大小限制 - 使用标准输入组
        const sizeGroup = globalBody.createDiv({ cls: 'vc-sip-form-group' });
        sizeGroup.createEl('label', { 
            cls: 'vc-sip-input-label', 
            text: '正则匹配文件大小限制' 
        });
        const sizeWrapper = sizeGroup.createDiv({ cls: 'vc-sip-input-wrapper' });
        const sizeInput = sizeWrapper.createEl('input', { 
            cls: 'vc-sip-input', 
            type: 'number',
            value: String(this.plugin.settings.maxFileSizeForRegex || 100000)
        });
        sizeInput.onchange = async () => {
            const num = parseInt(sizeInput.value);
            if (!isNaN(num) && num > 0) {
                this.plugin.settings.maxFileSizeForRegex = num;
                await this.plugin.saveSettings();
            }
        };
        sizeGroup.createEl('p', { 
            cls: 'vc-sip-input-hint', 
            text: `超过此大小的文件将跳过正则匹配（当前: ${Math.round((this.plugin.settings.maxFileSizeForRegex || 100000) / 1024)}KB）` 
        });

        // ========== Card 2: 规则列表 ==========
        const rulesCard = containerEl.createDiv({ cls: 'vc-sip-card' });
        const rulesHeader = rulesCard.createDiv({ cls: 'vc-sip-card-header' });
        rulesHeader.createEl('h3', { 
            cls: 'vc-sip-section-title', 
            text: '路径规则列表' 
        });
        const rulesBody = rulesCard.createDiv({ cls: 'vc-sip-card-body' });

        // 优先级说明
        rulesBody.createEl('div', { 
            cls: 'vc-sip-info-box',
            text: '优先级说明：文件精确匹配 > 文件夹匹配。若一个文档同时满足多条规则，将优先使用最具体的规则。'
        });

        // 规则列表 - 使用复合资源列表
        const resourceList = rulesBody.createDiv({ cls: 'vc-sip-resource-list' });
        
        if (this.plugin.settings.rules.length === 0) {
            const emptyState = resourceList.createDiv({ cls: 'vc-sip-empty-state' });
            emptyState.innerHTML = `
                <svg class="vc-sip-empty-svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/>
                </svg>
                <p>暂无规则，点击下方按钮添加</p>
            `;
        } else {
            this.plugin.settings.rules.forEach((rule, index) => {
                this.renderRuleItem(resourceList, rule, index);
            });
        }

        // 添加按钮
        const addBtnContainer = rulesBody.createDiv({ cls: 'vc-sip-flex vc-sip-mt-md' });
        const addBtn = addBtnContainer.createEl('button', { 
            cls: 'vc-sip-btn-secondary', 
            text: '+ 添加新规则' 
        });
        addBtn.onclick = async () => {
            this.plugin.settings.rules.push({
                path: '',
                mode: VIEW_MODE.DEFAULT,
                jumpTarget: JUMP_TARGET.NONE,
                jumpParams: '',
                matchIndex: 0
            });
            await this.plugin.saveSettings();
            this.display();
        };

        // ========== 保存按钮 ==========
        const saveContainer = containerEl.createDiv({ cls: 'vc-sip-flex vc-sip-gap-md vc-sip-mt-lg' });
        const saveBtn = saveContainer.createEl('button', { cls: 'vc-sip-btn-primary' });
        saveBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span>保存并生效配置</span>
        `;
        saveBtn.onclick = async () => {
            await this.plugin.saveSettings();
            new Notice('View Controller 配置已保存！');
        };
        saveContainer.createEl('span', { 
            cls: 'vc-sip-input-hint', 
            text: '修改规则后请点击此按钮确保生效',
            attr: { style: 'align-self: center;' }
        });
    }

    // 剥皮 Setting 组件的默认样式
    stripSettingStyles(groupEl) {
        const item = groupEl.querySelector('.setting-item');
        if (item) {
            item.style.border = 'none';
            item.style.padding = '0';
            item.style.background = 'transparent';
        }
        const info = groupEl.querySelector('.setting-item-info');
        if (info) info.style.display = 'none';
        const control = groupEl.querySelector('.setting-item-control');
        if (control) {
            control.style.paddingRight = '0';
            control.style.justifyContent = 'space-between';
            control.style.width = '100%';
            
            // 添加自定义标签
            const labelWrap = control.createDiv({ cls: 'vc-sip-flex-col' });
            labelWrap.createEl('span', { 
                cls: 'vc-sip-toggle-label', 
                text: '调试模式' 
            });
            labelWrap.createEl('span', { 
                cls: 'vc-sip-toggle-desc', 
                text: '开启后，打开文件时会提示是否匹配到规则' 
            });
            control.prepend(labelWrap);
        }
    }

    renderRuleItem(listEl, rule, index) {
        const item = listEl.createDiv({ cls: 'vc-sip-resource-item' });
        item.dataset.index = String(index);

        // 头部：序号 + 删除按钮
        const header = item.createDiv({ cls: 'vc-sip-resource-header' });
        header.createDiv({ 
            cls: 'vc-sip-resource-index', 
            text: String(index + 1).padStart(2, '0') 
        });
        
        const deleteBtn = header.createEl('button', { 
            cls: 'vc-sip-btn-icon',
            attr: { 'aria-label': '删除规则' }
        });
        deleteBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
        deleteBtn.onclick = async () => {
            this.plugin.settings.rules.splice(index, 1);
            await this.plugin.saveSettings();
            this.display();
        };

        // 表单网格
        const grid = item.createDiv({ cls: 'vc-sip-resource-grid' });

        // 路径字段
        const pathField = grid.createDiv({ cls: 'vc-sip-resource-field' });
        pathField.createEl('label', { 
            cls: 'vc-sip-field-label', 
            text: '路径' 
        });
        const pathWrapper = pathField.createDiv({ cls: 'vc-sip-input-wrapper' });
        const pathInput = pathWrapper.createEl('input', { 
            cls: 'vc-sip-input', 
            type: 'text', 
            value: rule.path,
            placeholder: '08-科技树/ 或 Inbox'
        });
        pathInput.onchange = async () => {
            this.plugin.settings.rules[index].path = pathInput.value;
        };

        // 视图模式字段
        const modeField = grid.createDiv({ cls: 'vc-sip-resource-field' });
        modeField.createEl('label', { 
            cls: 'vc-sip-field-label', 
            text: '视图模式' 
        });
        const modeSelect = modeField.createEl('select', { 
            cls: 'vc-sip-select',
            attr: { 'data-field': 'mode' }
        });
        this.addOption(modeSelect, VIEW_MODE.DEFAULT, '保持默认');
        this.addOption(modeSelect, VIEW_MODE.READING, '阅读视图');
        this.addOption(modeSelect, VIEW_MODE.SOURCE, '源码模式');
        this.addOption(modeSelect, VIEW_MODE.LIVE, '实时预览');
        modeSelect.value = rule.mode;
        modeSelect.onchange = async () => {
            this.plugin.settings.rules[index].mode = modeSelect.value;
            
            if (modeSelect.value === VIEW_MODE.READING && 
                (rule.jumpTarget === JUMP_TARGET.HEADING || rule.jumpTarget === JUMP_TARGET.REGEX)) {
                this.plugin.settings.rules[index].jumpTarget = JUMP_TARGET.NONE;
            }
            
            await this.plugin.saveSettings();
            this.updateJumpOptionsForItem(item, index);
        };

        // 跳转目标字段
        const jumpField = grid.createDiv({ cls: 'vc-sip-resource-field' });
        jumpField.createEl('label', { 
            cls: 'vc-sip-field-label', 
            text: '跳转目标' 
        });
        const jumpSelect = jumpField.createEl('select', { 
            cls: 'vc-sip-select',
            attr: { 'data-field': 'jump' }
        });
        this.updateJumpOptions(jumpSelect, this.plugin.settings.rules[index].mode, rule.jumpTarget);
        
        jumpSelect.onchange = async () => {
            this.plugin.settings.rules[index].jumpTarget = jumpSelect.value;
            await this.plugin.saveSettings();
            this.updateParamInputsForItem(item, index);
        };

        // 参数字段
        const paramField = grid.createDiv({ cls: 'vc-sip-resource-field' });
        paramField.createEl('label', { 
            cls: 'vc-sip-field-label', 
            text: '参数配置' 
        });
        
        const paramContainer = paramField.createDiv({ 
            cls: 'vc-sip-flex vc-sip-gap-sm',
            attr: { style: 'align-items: center;' }
        });
        
        const paramWrapper = paramContainer.createDiv({ 
            cls: 'vc-sip-input-wrapper',
            attr: { style: 'flex: 1;' }
        });
        const paramInput = paramWrapper.createEl('input', { 
            cls: 'vc-sip-input', 
            type: 'text',
            value: rule.jumpParams,
            attr: { 'data-field': 'param' }
        });

        const indexWrapper = paramContainer.createDiv({ 
            cls: 'vc-sip-flex vc-sip-gap-sm',
            attr: { 
                style: 'align-items: center; white-space: nowrap;',
                'data-index-wrapper': 'true'
            }
        });
        indexWrapper.createSpan({ 
            text: '第',
            attr: { style: 'font-size: 12px; color: var(--text-muted);' }
        });
        const indexInputWrapper = indexWrapper.createDiv({ cls: 'vc-sip-input-wrapper' });
        const indexInput = indexInputWrapper.createEl('input', { 
            cls: 'vc-sip-input', 
            type: 'number',
            value: (rule.matchIndex !== undefined ? rule.matchIndex + 1 : 1),
            min: 1,
            attr: { 
                style: 'width: 50px; padding: 8px; text-align: center;'
            }
        });
        indexWrapper.createSpan({ 
            text: '个',
            attr: { style: 'font-size: 12px; color: var(--text-muted);' }
        });

        this.updateParamInputsVisibility(paramInput, indexWrapper, rule.jumpTarget);

        paramInput.onchange = async () => {
            this.plugin.settings.rules[index].jumpParams = paramInput.value;
        };

        indexInput.onchange = async () => {
            let val = parseInt(indexInput.value);
            if (isNaN(val) || val < 1) val = 1;
            this.plugin.settings.rules[index].matchIndex = val - 1;
        };
    }

    updateJumpOptionsForItem(item, index) {
        const jumpSelect = item.querySelector('.vc-sip-select[data-field="jump"]');
        if (!jumpSelect) return;
        
        const currentMode = this.plugin.settings.rules[index].mode;
        const currentValue = this.plugin.settings.rules[index].jumpTarget;
        
        jumpSelect.innerHTML = '';
        this.updateJumpOptions(jumpSelect, currentMode, currentValue);
    }

    updateJumpOptions(select, mode, currentValue) {
        this.addOption(select, JUMP_TARGET.NONE, '无');
        this.addOption(select, JUMP_TARGET.BOTTOM, '文末');
        
        if (mode !== VIEW_MODE.READING) {
            this.addOption(select, JUMP_TARGET.HEADING, '指定标题');
            this.addOption(select, JUMP_TARGET.REGEX, '正则匹配');
        }
        
        select.value = currentValue;
    }

    updateParamInputsForItem(item, index) {
        const paramInput = item.querySelector('.vc-sip-input[data-field="param"]');
        const indexWrapper = item.querySelector('[data-index-wrapper]');
        if (!paramInput || !indexWrapper) return;
        
        const jumpTarget = this.plugin.settings.rules[index].jumpTarget;
        this.updateParamInputsVisibility(paramInput, indexWrapper, jumpTarget);
    }

    updateParamInputsVisibility(textInput, indexWrapper, jumpTarget) {
        if (jumpTarget === JUMP_TARGET.HEADING) {
            textInput.style.display = 'block';
            textInput.placeholder = '标题文字';
            indexWrapper.style.display = 'flex';
        } else if (jumpTarget === JUMP_TARGET.REGEX) {
            textInput.style.display = 'block';
            textInput.placeholder = '正则表达式';
            indexWrapper.style.display = 'flex';
        } else {
            textInput.style.display = 'none';
            indexWrapper.style.display = 'none';
        }
    }

    addOption(select, value, text) {
        const option = select.createEl('option');
        option.value = value;
        option.text = text;
    }
}

module.exports = ViewControllerPlugin;
