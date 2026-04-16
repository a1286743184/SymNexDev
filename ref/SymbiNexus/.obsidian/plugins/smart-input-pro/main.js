/**
 * Smart Input Pro Plugin for Obsidian
 *
 * 分层注释结构（统一规范）：
 * 1) 整体架构总览：说明插件的核心流程与模块边界
 * 2) 辅助通用功能模块：导航助手、日志、模板加载等通用工具
 * 3) 模块入口与命令：仅保留“快速语音录入”入口，移除未使用命令
 * 4) 阶段一处理：语义分类与文本优化
 * 5) 阶段二处理：各功能模块的结构化提取与写入（任务/备忘/记账/联系人/美食/杂项）
 *
 * 核心流程：语义分类 -> 分流处理 -> 文件写入
 * - 阶段一：semanticClassifyAndOptimize(text)
 *   负责口语文本的优化与六分类（bill, task, memo, contact, food_wishlist, other）
 * - 阶段二：processCategoryXxx(optimizedText)
 *   根据分类结果进行结构化提取与写入（只描述功能定位，不展开实现细节）
 *
 * 特色与约定：
 * - 支持桌面端和移动端文本录入功能
 * - 统一的日期解析策略，保证“开始/执行/截止”任一明确日期都被写入
 * - 完善日志与降级处理，确保数据不丢失
 */

const { Plugin, Modal, Notice, requestUrl, PluginSettingTab, Setting, normalizePath, TFile } = require('obsidian');

/* --- Integrated Prompts Manager --- */
/* --- Integrated Prompts Manager --- */


class PromptManager {
    constructor(app, pluginDir) {
        this.app = app;
        this.pluginDir = pluginDir;
        
        // 使用相对路径 (Obsidian Adapter API 只需要相对 Vault 根目录的路径)
        // normalizePath 确保路径分隔符在各平台一致 (使用 /)
        this.defaultsPath = normalizePath(`${pluginDir}/prompts/defaults.js`);
        this.userPath = normalizePath(`${pluginDir}/prompts/user.js`);
        
        this.defaults = {};
        this.user = { version: 1, overrides: {} };
        
        // 注意：load() 变为异步，不能在构造函数中 await，需在 onload 中显式调用
    }

    async load() {
        try {
            // Load defaults
            const defaults = await this.loadModule(this.defaultsPath);
            if (defaults) {
                this.defaults = defaults;
            } else {
                Logger.error('Defaults prompt file not found or invalid:', this.defaultsPath);
                this.defaults = { pipeline: {}, modules: {} };
            }

            // Load user overrides
            if (await this.app.vault.adapter.exists(this.userPath)) {
                const user = await this.loadModule(this.userPath);
                if (user) {
                    this.user = user;
                } else {
                    Logger.error('Failed to parse user prompts. Keeping existing file to prevent data loss.');
                    new Notice('SmartInputPro: 用户提示词文件(user.js)加载失败，请检查语法错误。已临时使用默认配置。', 10000);
                }
            } else {
                // Initialize only if file strictly does not exist
                await this.saveUser();
            }
        } catch (error) {
            Logger.error('Failed to load prompts:', error);
            this.user = { version: 1, overrides: {} };
        }
    }

    async loadModule(filePath) {
        if (await this.app.vault.adapter.exists(filePath)) {
            try {
                const content = await this.app.vault.adapter.read(filePath);
                // 构造一个简单的 CommonJS 模块运行环境
                const module = { exports: {} };
                const fn = new Function('module', 'exports', content);
                fn(module, module.exports);
                return module.exports;
            } catch (e) {
                Logger.error(`Error loading module ${filePath}:`, e);
            }
        }
        return null;
    }

    async saveUser() {
        try {
            const formatAsJS = (obj, indent = 0) => {
                const spaces = '    '.repeat(indent);
                if (obj === null) return 'null';
                if (typeof obj === 'undefined') return 'undefined';
                if (typeof obj === 'string') {
                    // 转义反引号和 ${
                    const escaped = obj.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
                    return `\`${escaped}\``;
                }
                if (Array.isArray(obj)) {
                    const items = obj.map(item => formatAsJS(item, indent + 1));
                    return `[\n${items.map(i => spaces + '    ' + i).join(',\n')}\n${spaces}]`;
                }
                if (typeof obj === 'object') {
                    const entries = Object.entries(obj).map(([key, value]) => {
                        const keyStr = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
                        let comment = '';
                        // 为特定关键字段添加警告注释
                        if (['stage1_classification_prompt', 'stage2_optimization_prompt', 'extractionPrompt', 'asset_log_prompt'].includes(key)) {
                            comment = `// ⚠️ 注意：请保留 \\$\{变量} 的转义格式 (即在 $ 前加反斜杠)，否则会导致插件崩溃！\n${spaces}    `;
                        }
                        return `${comment}${spaces}    ${keyStr}: ${formatAsJS(value, indent + 1)}`;
                    });
                    return `{\n${entries.join(',\n')}\n${spaces}}`;
                }
                return String(obj);
            };

            const headerWarning = `/**
 * ⚠️以此格式编辑时特别注意：
 * 任何形如 \${text} 或 \${currentDate} 的占位符，
 * 必须在 $ 符号前加反斜杠转义，写成 \\$\{text} 或 \\$\{currentDate}。
 * 否则会导致插件加载失败 (ReferenceError)。
 */
`;
            const content = `${headerWarning}module.exports = ${formatAsJS(this.user)};`;
            // 确保目录存在
            const dir = this.userPath.substring(0, this.userPath.lastIndexOf('/'));
            if (!(await this.app.vault.adapter.exists(dir))) {
                await this.app.vault.adapter.mkdir(dir);
            }
            await this.app.vault.adapter.write(this.userPath, content);
        } catch (error) {
            Logger.error('Failed to save user prompts:', error);
        }
    }

    // --- Getters (with caching) ---

    getStage1Prompt() {
        if (this._cacheStage1 !== undefined) return this._cacheStage1;
        this._cacheStage1 = this.user.overrides?.pipeline?.stage1_classification_prompt || 
               this.defaults.pipeline?.stage1_classification_prompt || '';
        return this._cacheStage1;
    }
    
    getStage2Prompt() {
        if (this._cacheStage2 !== undefined) return this._cacheStage2;
        this._cacheStage2 = this.user.overrides?.pipeline?.stage2_optimization_prompt || 
               this.defaults.pipeline?.stage2_optimization_prompt || '';
        return this._cacheStage2;
    }

    getModulePrompt(moduleId) {
        if (!this._cacheModules) this._cacheModules = {};
        if (this._cacheModules[moduleId] !== undefined) return this._cacheModules[moduleId];
        this._cacheModules[moduleId] = this.user.overrides?.modules?.[moduleId]?.extractionPrompt || 
               this.defaults.modules?.[moduleId]?.extractionPrompt || '';
        return this._cacheModules[moduleId];
    }

    getAssetLogPrompt() {
        if (this._cacheAssetLog !== undefined) return this._cacheAssetLog;
        this._cacheAssetLog = this.user.overrides?.modules?.bill?.asset_log_prompt || 
               this.defaults.modules?.bill?.asset_log_prompt || '';
        return this._cacheAssetLog;
    }

    clearCache() {
        this._cacheStage1 = undefined;
        this._cacheStage2 = undefined;
        this._cacheModules = {};
        this._cacheAssetLog = undefined;
    }

    // --- Setters / Migration ---

    async saveUserOverride(pathArray, value) {
        let current = this.user.overrides;
        for (let i = 0; i < pathArray.length - 1; i++) {
            if (!current[pathArray[i]]) current[pathArray[i]] = {};
            current = current[pathArray[i]];
        }
        
        const defaultValue = this.getValue(this.defaults, pathArray);
        
        if (value === defaultValue) {
             delete current[pathArray[pathArray.length - 1]];
        } else {
            current[pathArray[pathArray.length - 1]] = value;
        }
        
        this.clearCache();
        await this.saveUser();
    }
    
    getValue(obj, pathArray) {
        let current = obj;
        for (const key of pathArray) {
            if (current === undefined || current === null) return undefined;
            current = current[key];
        }
        return current;
    }

    async migrateFromSettings(settings) {
        Logger.info('[SmartInputPro] Starting prompt migration...');
        let hasChanges = false;

        if (settings.pipeline?.stage1_classification_prompt) {
            await this.saveUserOverride(['pipeline', 'stage1_classification_prompt'], settings.pipeline.stage1_classification_prompt);
            hasChanges = true;
        }
        if (settings.pipeline?.stage2_optimization_prompt) {
            await this.saveUserOverride(['pipeline', 'stage2_optimization_prompt'], settings.pipeline.stage2_optimization_prompt);
            hasChanges = true;
        }

        if (settings.modules) {
            for (const [moduleId, moduleConfig] of Object.entries(settings.modules)) {
                if (moduleConfig.extractionPrompt) {
                     await this.saveUserOverride(['modules', moduleId, 'extractionPrompt'], moduleConfig.extractionPrompt);
                     hasChanges = true;
                }
                if (moduleId === 'bill' && moduleConfig.asset_log_prompt) {
                    await this.saveUserOverride(['modules', 'bill', 'asset_log_prompt'], moduleConfig.asset_log_prompt);
                    hasChanges = true;
                }
            }
        }
        
        if (hasChanges) {
             Logger.info('[SmartInputPro] Migration completed.');
        } else {
             Logger.info('[SmartInputPro] No prompts to migrate.');
        }
    }
}



// ========= 配置常量 =========
/**
 * Config - 插件全局配置常量
 * 
 * 功能概述：
 * 集中管理插件运行所需的所有配置常量，包括文件路径、API端点、系统设置等。
 * 采用单一配置对象模式，便于统一管理和修改。
 * 
 * 配置分类：
 * - 日志路径：错误日志、AI请求日志等文件路径
 * - API密钥路径：各AI服务商的密钥文件存储位置
 * - 业务数据路径：账单、INBOX、模板等核心业务文件路径
 * - 系统配置：时区、模板占位符等系统级设置
 * 
 * 设计特点：
 * - 路径集中管理：所有文件路径统一配置，便于维护
 * - 分类清晰：按功能模块分组，提高可读性
 * - 环境隔离：支持不同环境下的配置差异
 * 
 * @const {Object} Config
 */
const Config = {
    // --- 日志系统配置 ---
    LOG_DIR: '.obsidian/plugins/smart-input-pro/logs',
    LOG_RETENTION_DAYS: 7, // 默认保留7天
    
    // --- API密钥路径 ---
    // 各AI服务商的API密钥存储路径
    API_KEY_PATH: '08-科技树系统/01-OB_LifeOS_Build/03-密钥/GLM4_API_KEY.md',
    ZHIPU_API_KEY_PATH: '08-科技树系统/01-OB_LifeOS_Build/03-密钥/GLM4_API_KEY.md',
    MINIMAX_M2_KEY_PATH: '08-科技树系统/01-OB_LifeOS_Build/03-密钥/Minimax_M2_key.md',
    QWEN_API_KEY_PATH: '08-科技树系统/01-OB_LifeOS_Build/03-密钥/QwenAPIKey.md',

    // --- AI服务端点 ---
    // 各AI服务商的API端点URL
    MINIMAX_M2_BASE_URL: 'https://api.minimaxi.com/anthropic',
    QWEN_BASE_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    
    // --- 业务数据路径 ---
    // 各功能模块的数据存储路径
    CAPTURE_INBOX_PATH: '01-经纬矩阵系统/08-智能录入模块/01-INBOX.md',
    BILL_BASE_PATH: '06-财务系统/01-账单数据',
    TEMPLATE_PATH: '04-模板系统/09-专用模板/记账模板.md',
    BILL_TEMPLATE_BASENAME: '记账模板',
    ROLE_TEMPLATE_PATH: '04-模板系统/03-生活坐标模板/角色档案/角色档案.md',
    ROLE_BASE_PATH: '05-生活坐标系统/01-角色档案',
    FOOD_WISHLIST_PATH: '05-生活坐标系统/04-美食档案/美食收藏.md',
    WEEKLY_DELEGATION_PREFIX: '01-经纬矩阵系统/02-周委托模块/周度委托列表',
    STUDY_RECORD_BASE_PATH: '07-项目系统/01-公务员考试/01-行测/01-刷题复盘/06-刷题记录',
    QUESTION_ENTRY_BASE_PATH: '07-项目系统/01-公务员考试/01-行测/01-刷题复盘',
    QUESTION_ENTRY_TEMPLATE_PATH: '04-模板系统/01-复盘模板/行测复盘.md',
    
    // --- 价格追踪系统路径 ---
    // 功能：用于价格行情追踪模块的数据存储路径
    PRICE_TRACK_PATH: '05-生活坐标系统/05-消费决策',
    // --- 行测题目板块到类型的映射表 ---
    // 功能：将行测题目板块映射到对应的分类目录，便于组织存储
    SECTION_TYPE_MAPPING: {
        // 言语理解
        '逻辑填空': '01-言语理解',
        '语句填空': '01-言语理解',
        '中心主旨': '01-言语理解',
        '细节理解': '01-言语理解',
        '下文推断': '01-言语理解',
        '语句排序': '01-言语理解',
        '言语其他': '01-言语理解',
        // 判断推理
        '定义判断': '02-判断推理',
        '类比推理': '02-判断推理',
        '逻辑判断': '02-判断推理',
        '图形推理': '02-判断推理',
        // 资料分析
        '增长率': '03-资料分析',
        '比重': '03-资料分析',
        '平均数': '03-资料分析',
        '倍数': '03-资料分析',
        '资料分析': '03-资料分析',
        '综合分析': '03-资料分析',
        // 数量关系
        '数学运算': '04-数量关系',
        '数字推理': '04-数量关系',
        // 政治理论
        '马克思主义': '05-政治理论',
        '毛泽东思想': '05-政治理论',
        '中国特色社会主义理论': '05-政治理论',
        '时事政治': '05-政治理论'
    },
    
    // --- 全局配置 ---
    // 全局时区常量（用于所有 timestamp 与 created 字段）
    TIMEZONE: 'Asia/Shanghai',
    
    // --- 角色模板占位符 ---
    // 功能：用于新建角色档案时替换模板中的占位符
    ROLE_NAME_MARKER: 'name: 周复盘连贯叙事生成器',
    ROLE_TEL_MARKER: 'tel:',

    // --- 宠物与家庭路径 ---
    PET_FAMILY_PATH: '05-生活坐标系统/01-角色档案/月饼家族',

    // --- 资产与装备路径 ---
    ASSET_ARCHIVE_PATH: '05-生活坐标系统/03-装备档案',

    // --- 消费决策路径 ---
    PRICE_DASHBOARD_PATH: '05-生活坐标系统/05-消费决策/实时比价看板.md'
};

// ========= 工具类定义 =========

/**
 * Logger - 简单的日志工具类
 * 增强版：支持写入文件以便在移动端调试
 * 优化版：使用队列批量写入，减少 I/O 阻塞
 */
class Logger {
    static initialize(app) {
        this.app = app;
        this.logFilePath = '99-附件/SmartInputPro_Debug_Log.md';
        this._logQueue = [];
        this._flushInterval = null;
        this._isFlushing = false;
        this._lastCleanupCheck = null;
    }

    static async logToFile(level, msg, data) {
        if (!this.app) return;
        
        const timestamp = new Date().toISOString();
        let logMessage = `\n[${timestamp}] [${level}] ${msg}`;
        if (data) {
            if (data instanceof Error) {
                logMessage += `\nStack: ${data.stack}`;
            } else {
                try {
                    logMessage += `\nData: ${JSON.stringify(data)}`;
                } catch (e) {
                    logMessage += `\nData: [Circular or Non-serializable Object]`;
                }
            }
        }
        
        this._logQueue.push(logMessage);
        
        if (!this._flushInterval) {
            this._flushInterval = setInterval(() => this.flushLogs(), 2000);
        }
        
        if (this._logQueue.length >= 10) {
            await this.flushLogs();
        }
    }

    static async flushLogs() {
        if (this._isFlushing || this._logQueue.length === 0 || !this.app) return;
        
        this._isFlushing = true;
        const logs = this._logQueue.splice(0);
        
        try {
            const adapter = this.app.vault.adapter;
            const content = logs.join('');
            if (await adapter.exists(this.logFilePath)) {
                await adapter.append(this.logFilePath, content);
            } else {
                const frontmatter = `---
title: SmartInputPro Debug Log
tags: [debug, log, smart-input-pro]
excludeFromGraphView: true
created: ${new Date().toISOString().slice(0, 10)}
---
# SmartInputPro Debug Log
`;
                await adapter.write(this.logFilePath, frontmatter + content);
            }
            await this.checkAndCleanupLog();
        } catch (e) {
            console.error('[SmartInputPro] Failed to flush logs', e);
        }
        
        this._isFlushing = false;
    }

    static async checkAndCleanupLog() {
        const now = Date.now();
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
        const THREE_DAYS_MS = 3 * ONE_DAY_MS;
        
        if (this._lastCleanupCheck && (now - this._lastCleanupCheck) < ONE_DAY_MS) {
            return;
        }
        
        this._lastCleanupCheck = now;
        
        try {
            const adapter = this.app.vault.adapter;
            if (!(await adapter.exists(this.logFilePath))) return;
            
            const content = await adapter.read(this.logFilePath);
            const cutoffDate = new Date(now - THREE_DAYS_MS);
            
            const lines = content.split('\n');
            const headerLines = [];
            const logLines = [];
            let inHeader = true;
            let foundFirstLog = false;
            
            for (const line of lines) {
                if (inHeader) {
                    headerLines.push(line);
                    if (line.startsWith('# SmartInputPro Debug Log')) {
                        inHeader = false;
                    }
                } else {
                    if (!foundFirstLog && line.trim() === '') {
                        headerLines.push(line);
                        continue;
                    }
                    foundFirstLog = true;
                    logLines.push(line);
                }
            }
            
            const filteredLogs = [];
            let currentEntry = [];
            
            for (const line of logLines) {
                const timestampMatch = line.match(/^\[(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}/);
                if (timestampMatch) {
                    if (currentEntry.length > 0) {
                        filteredLogs.push(currentEntry.join('\n'));
                    }
                    currentEntry = [line];
                    const entryDate = new Date(timestampMatch[1]);
                    if (entryDate >= cutoffDate) {
                        currentEntry._keep = true;
                    } else {
                        currentEntry._keep = false;
                    }
                } else {
                    currentEntry.push(line);
                }
            }
            if (currentEntry.length > 0 && currentEntry._keep !== false) {
                filteredLogs.push(currentEntry.join('\n'));
            }
            
            const newContent = headerLines.join('\n') + '\n' + filteredLogs.join('\n');
            await adapter.write(this.logFilePath, newContent);
            console.info('[SmartInputPro] Debug log cleaned up, kept last 3 days');
        } catch (e) {
            console.error('[SmartInputPro] Failed to cleanup log', e);
        }
    }

    static error(msg, error) {
        console.error(`[SmartInputPro] ${msg}`, error);
        this.logToFile('ERROR', msg, error);
    }
    static warn(msg, data) {
        console.warn(`[SmartInputPro] ${msg}`, data);
        this.logToFile('WARN', msg, data);
    }
    static info(msg, data) {
        console.info(`[SmartInputPro] ${msg}`, data);
        this.logToFile('INFO', msg, data);
    }
}

/**
 * safeExecute - 异步函数错误处理高阶函数
 * 
 * 功能：
 * - 自动捕获异步函数执行过程中的错误
 * - 统一记录错误日志 (Console + 文件日志)
 * - 统一发送 UI 通知
 * - 支持自动降级到 INBOX (当 fallbackToInbox=true 且第一个参数为文本时)
 * 
 * @param {Function} asyncFn - 原始异步函数
 * @param {Object} context - 函数执行上下文 (this)
 * @param {string} operationName - 操作名称（用于日志和提示）
 * @param {boolean} fallbackToInbox - 是否在失败时降级到 INBOX
 * @returns {Function} 包装后的异步函数
 */
const safeExecute = (asyncFn, context, operationName = '操作', fallbackToInbox = false) => {
    return async function(...args) {
        try {
            return await asyncFn.apply(context, args);
        } catch (error) {
            Logger.error(`${operationName}失败:`, error);
            
            // 1. 发送 UI 通知
            try { new Notice(`❌ ${operationName}出错: ${error.message}`); } catch (_) {}

            // 2. 记录错误日志 (如果 context 有 logError)
            if (context && typeof context.logError === 'function') {
                const input = args[0] && typeof args[0] === 'string' ? args[0] : 'non-text-input';
                context.logError(operationName, error, {
                    method: asyncFn.name || 'anonymous',
                    input: input,
                    fallback: fallbackToInbox ? 'appendToCapture' : 'none'
                });
            }

            // 3. 降级处理 (Fallback to Inbox)
            if (fallbackToInbox && context && typeof context.appendToCapture === 'function') {
                const text = args[0]; // 假设第一个参数是文本
                if (text && typeof text === 'string') {
                    try {
                        new Notice(`⚠️ 正在尝试降级存入 INBOX...`);
                        if (context.logPipelineEvent) {
                            await context.logPipelineEvent(`${operationName}_degrade`, { error: error.message, original_text: text });
                        }
                        return await context.appendToCapture(text);
                    } catch (fbError) {
                        Logger.error('降级处理也失败了:', fbError);
                        new Notice(`❌ 严重错误：降级处理也失败了，请手动保存文本！`);
                    }
                }
            }
            
            return null; // 发生错误且无降级或降级失败
        }
    };
};

 
// ========= 辅助工具函数 =========
// 功能：提供插件运行所需的基础工具函数

/**
 * 获取当前日期（ISO格式：YYYY-MM-DD）
 * @returns {string} 当前日期字符串
 */
function getCurrentDateISO() {
    try { return new Date().toISOString().slice(0, 10); } catch (_) { return ''; }
}



// ========= Helpers（paths & logs） =========
// 将独立的辅助函数前置，便于统一引用

// ========== Token 消耗记录辅助 ==========


// ========= 文件导航辅助类 =========
/**
 * NavigationHelper - 文件导航辅助类
 * 
 * 功能概述：
 * 提供统一的文件导航和定位功能，支持打开文件并定位到特定位置。
 * 主要用于智能输入后的文件跳转和内容定位场景。
 * 
 * 核心功能：
 * - openAndNavigate：打开文件并定位到指定行号或内容
 * - openInboxAndLocate：打开INBOX文件并定位到特定内容
 * - openBillAndLocate：打开账单文件并定位到特定条目
 * 
 * 使用场景：
 * - 语音输入完成后跳转到生成的笔记位置
 * - 智能记账后定位到新创建的账单条目
 * - 智能分类后跳转到对应分类文件
 * 
 * 技术特点：
 * - 支持多种定位方式：行号、文本搜索、正则表达式
 * - 容错处理：文件不存在时提供友好提示
 * - 异步操作：所有文件操作均为异步，不阻塞UI
 * 
 * @class NavigationHelper
 */
class NavigationHelper {
    /**
     * 构造函数
     * @param {App} app - Obsidian应用实例
     */
    constructor(app) {
        this.app = app;
    }

    /**
     * 在新页面打开指定文件并定位到指定位置
     * @param {string} filePath - 文件路径
     * @param {Object} options - 定位选项
     * @param {string} options.mode - 定位模式: 'end'(末尾) | 'line'(指定行) | 'search'(搜索文本)
     * @param {number} options.line - 行号（mode为'line'时使用）
     * @param {string} options.searchText - 搜索文本（mode为'search'时使用）
     * @returns {Promise<boolean>} 是否成功导航
     */
    async openAndNavigate(filePath, options = {}) {
        try {
            // 设置 SIP 导航进行中标志，阻止 View Controller 等插件干扰
            window.sipNavigationInProgress = true;

            const { mode = 'end', line, searchText } = options;
            
            // 获取文件对象
            const file = this.app.vault.getAbstractFileByPath(filePath);
            if (!file) {
                new Notice(`文件不存在: ${filePath}`);
                window.sipNavigationInProgress = false;
                return false;
            }

            // 在新页面打开文件
            const leaf = this.app.workspace.getLeaf('tab');
            await leaf.openFile(file);

            // 获取编辑器实例
            const view = leaf.view;
            if (!view || !view.editor) {
                new Notice('无法获取编辑器实例');
                // 即使失败也要延迟重置，以防万一
                setTimeout(() => { window.sipNavigationInProgress = false; }, 100);
                return false;
            }

            const editor = view.editor;
            
            // 根据模式进行定位
            switch (mode) {
                case 'end':
                    // 定位到文件末尾
                    const lastLine = editor.lastLine();
                    const lastLineLength = editor.getLine(lastLine).length;
                    editor.setCursor(lastLine, lastLineLength);
                    break;
                    
                case 'line':
                    // 定位到指定行
                    if (typeof line === 'number' && line >= 0) {
                        const targetLine = Math.min(line, editor.lastLine());
                        editor.setCursor(targetLine, 0);
                    }
                    break;
                    
                case 'search':
                    // 搜索并定位到指定文本
                    if (searchText) {
                        const content = editor.getValue();
                        const searchIndex = content.lastIndexOf(searchText);
                        if (searchIndex !== -1) {
                            const pos = editor.offsetToPos(searchIndex);
                            editor.setCursor(pos);
                        }
                    }
                    break;
            }

            // 滚动到光标位置
            editor.scrollIntoView({ from: editor.getCursor(), to: editor.getCursor() }, true);
            
            // 聚焦编辑器
            editor.focus();
            
            // 延迟重置标志，确保其他插件的 file-open 事件已处理完毕
            setTimeout(() => {
                window.sipNavigationInProgress = false;
            }, 500);
            
            return true;
        } catch (error) {
            Logger.error('导航失败:', error);
            new Notice(`导航失败: ${error.message}`);
            window.sipNavigationInProgress = false;
            return false;
        }
    }

    /**
     * 打开INBOX文件并定位到最新添加的内容
     * @param {string} inboxPath - INBOX文件路径
     * @param {string} addedText - 刚添加的文本内容（用于精确定位）
     * @returns {Promise<boolean>} 是否成功导航
     */
    async openInboxAndLocate(inboxPath, addedText = '') {
        if (addedText) {
            // 如果有添加的文本，搜索定位
            return await this.openAndNavigate(inboxPath, {
                mode: 'search',
                searchText: addedText.trim()
            });
        } else {
            // 否则定位到文件末尾
            return await this.openAndNavigate(inboxPath, { mode: 'end' });
        }
    }

    /**
     * 打开账单文件并定位到指定位置
     * @param {string} billPath - 账单文件路径
     * @returns {Promise<boolean>} 是否成功导航
     */
    async openBillAndLocate(billPath) {
        // 账单文件通常定位到文件开头查看元数据
        return await this.openAndNavigate(billPath, { mode: 'line', line: 0 });
    }
}



// 统一的保存后跳转辅助方法已移动为 SmartInputProPlugin 类方法，避免在类初始化前引用导致错误

/**
 * 调用AI（双模型降级：glm-4-flashx → glm-4.5-flash）
 */
// 已统一到插件方法 SmartInputProPlugin.callZhipuJSON，移除此冗余的全局 AI 调用函数

// ========= 插件默认设置配置 =========
/**
 * DEFAULT_SETTINGS - 插件默认配置对象
 * 
 * 功能概述：
 * 定义插件的所有可配置选项，包括AI服务、路径配置、语音服务等。
 * 提供默认值和配置结构，确保插件在首次安装或重置配置时能够正常工作。
 * 
 * 配置分类：
 * - AI服务配置：各AI服务商的API密钥、端点、模型选择
 * - 服务商映射：统一管理baseUrl、keyPath、models等配置
 * - 模型配置：首选/备选模型选择、降级机制
 * - 额度管理：模型额度耗尽标记和自动切换机制
 * - 录入与分类：语音输入开关、智能分类开关
 * - 桌面端配置：语音录入、分类设置等桌面端特定功能
 * - 路径配置：各类业务文件的存储路径
 * - Token统计：AI服务Token消耗记录开关和路径
 * 
 * 设计特点：
 * - 多服务商支持：同时支持智谱、MiniMax、Qwen等主流AI服务
 * - 降级机制：首选模型失败时自动切换备选模型
 * - 灵活配置：所有关键参数都可通过设置面板修改
 * - 跨平台支持：同时支持桌面端和移动端使用场景
 * 
 * @const {Object} DEFAULT_SETTINGS
 */
const DEFAULT_SETTINGS = {
    // --- v4.0 数据驱动配置 ---
    schemaVersion: 4,
    resources: {
        zhipu: {
            name: '智谱AI',
            baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
            protocol: 'openai',
            disableThinking: false,
            models: ['glm-4-flash', 'glm-4.5-flash', 'glm-4-plus'],
            accounts: [
                { label: 'Default', apiKey: '', apiKeyPath: '08-科技树系统/01-OB_LifeOS_Build/03-密钥/GLM4_API_KEY.md' }
            ]
        },
        minimax: {
            name: 'MiniMax',
            baseUrl: 'https://api.minimaxi.com/anthropic',
            protocol: 'anthropic',
            disableThinking: false,
            models: ['MiniMax-M2', 'abab6.5s-chat', 'abab6.5-chat'],
            accounts: [
                { label: 'Default', apiKey: '', apiKeyPath: '08-科技树系统/01-OB_LifeOS_Build/03-密钥/Minimax_M2_key.md' }
            ]
        },
        qwen: {
            name: 'Qwen',
            baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            protocol: 'openai',
            disableThinking: false,
            models: ['qwen-flash', 'qwen-turbo'],
            accounts: [
                { label: 'Default', apiKey: '', apiKeyPath: '08-科技树系统/01-OB_LifeOS_Build/03-密钥/QwenAPIKey.md' }
            ]
        },
        mimo: {
            name: 'MiMo',
            baseUrl: 'https://api.xiaomimimo.com/anthropic',
            protocol: 'anthropic',
            disableThinking: false,
            models: ['MiMo-V2-Flash'],
            accounts: [
                { label: 'Default', apiKey: '', apiKeyPath: '08-科技树系统/01-OB_LifeOS_Build/03-密钥/MiMo-V2-Flash.md' }
            ]
        },
        google: {
            name: 'Google Gemini',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
            protocol: 'openai',
            disableThinking: true,
            models: ['gemini-2.5-flash', 'gemini-2.0-flash'],
            accounts: [
                { label: 'Default', apiKey: '', apiKeyPath: '08-科技树系统/01-OB_LifeOS_Build/03-密钥/GoogleKey.md' }
            ]
        }
    },
    strategy: {
        primary: { provider: 'mimo', model: 'MiMo-V2-Flash', accountLabel: 'Default' },
        backup: { enabled: true, provider: 'zhipu', model: 'glm-4.5-flash', accountLabel: 'Default' },
        quotaBlockDate: ''
    },
    pipeline: {
        // Prompts have been moved to prompts/defaults.js
    },
    modules: {
        bill: {
            enabled: true,
            enableOptimization: false,
            targetPath: Config.BILL_BASE_PATH,
            templatePath: Config.TEMPLATE_PATH
        },
        task: {
            enabled: true,
            enableOptimization: true
        },
        memo: {
            enabled: true,
            enableOptimization: true
        },
        contact: {
            enabled: true,
            enableOptimization: true
        },
        question_entry: {
            enabled: true,
            enableOptimization: true,
            targetPath: Config.QUESTION_ENTRY_BASE_PATH,
            templatePath: Config.QUESTION_ENTRY_TEMPLATE_PATH
        },
        code_dev: {
            enabled: true,
            enableOptimization: true,
            targetPath: '01-经纬矩阵系统/08-智能录入模块/02-Require.md'
        },
        food_wishlist: {
            enabled: true,
            enableOptimization: true,
            targetPath: Config.FOOD_WISHLIST_PATH
        },
        price_tracker: {
            enabled: true,
            enableOptimization: true,
            targetPath: Config.PRICE_TRACK_PATH
        },
        study_record: {
            enabled: true,
            enableOptimization: true,
            targetPath: Config.STUDY_RECORD_BASE_PATH
        },
        pet_growth: {
            enabled: true,
            enableOptimization: true,
            targetPath: Config.PET_FAMILY_PATH
        },
        other: {
            enabled: true,
            enableOptimization: true,
            targetPath: Config.CAPTURE_INBOX_PATH
        }
    },
    ui: {
        moduleDisplayName: {},
        fieldLabel: {},
        quickInput: {}
    },
    autoClassify: false
};

/**
 * @class SmartInputProPlugin
 * @extends Plugin
 */
class SmartInputProPlugin extends Plugin {
    async onload() {
        // 初始化日志工具，传入 app 实例以便写入文件
        Logger.initialize(this.app);
        try {
            Logger.info('Loading Smart Input Pro plugin (Debug Mode Enabled)');
            
            // Initialize PromptManager
        this.promptManager = new PromptManager(this.app, this.manifest.dir);
        
        // 显式加载提示词 (异步)
        await this.promptManager.load();

        // 加载设置
        await this.loadSettings();

        // 迁移旧配置中的提示词到 PromptManager
        if (this.settings.pipeline?.stage1_classification_prompt) {
            await this.promptManager.migrateFromSettings(this.settings);
            
            // 清理旧数据
            if (this.settings.pipeline) {
                delete this.settings.pipeline.stage1_classification_prompt;
                delete this.settings.pipeline.stage2_optimization_prompt;
            }
            if (this.settings.modules) {
                for (const key in this.settings.modules) {
                    if (this.settings.modules[key].extractionPrompt) {
                        delete this.settings.modules[key].extractionPrompt;
                    }
                    if (key === 'bill' && this.settings.modules[key].asset_log_prompt) {
                        delete this.settings.modules[key].asset_log_prompt;
                    }
                }
            }
            await this.saveData(this.settings);
        }

        // 启动时清理过期日志
        setTimeout(() => { this.cleanupOldLogs(); }, 3000);

        // 会话级 Token 统计字段初始化
        this.stage1Tokens = 0;
        this.stage2Tokens = 0;
        this.currentInputText = '';
        // 新增：本次录入的起始时间与实际使用模型记录
        this.processingStartAt = null;
        this.lastSuccessfulAIModel = null;
        
        // 初始化导航助手
        this.navigationHelper = new NavigationHelper(this.app);
        
        // 初始化缓存
        this._foodCollectionCache = null;
        this._foodCollectionCacheTime = 0;
        this._promptCache = {};
        
        // 添加状态栏项目
        this.statusBarItem = this.addStatusBarItem();
        this.statusBarItem.setText('Smart Input Pro');
        
        /*
         * 模块入口与命令（统一规范）：
         * - 保留：Smart Input Pro: 快速语音录入（唯一入口命令）

         * 说明：命令入口仅作为触发点，实际处理均由模态框/管线完成。
         */
        
        this.addCommand({
            id: 'smart-input',
            name: 'SmartInput',
            hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 'v' }],
            callback: () => {
                // 唯一入口：使用 SmartInput（统一录入界面，支持文本与语音）
                new SmartInput(this.app, this).open();
            }
        });

        // 添加手动清理日志的命令（用于测试）
        this.addCommand({
            id: 'cleanup-logs',
            name: '手动清理日志文件',
            callback: async () => {
                await this.cleanupLogFilesByCount();
                new Notice('日志文件清理完成');
            }
        });

        // 最小化连通性测试（统一路由与密钥读取验证）
        this.addCommand({
            id: 'sip-connectivity-test',
            name: 'SmartInputPro: 最小化连通性测试',
            callback: async () => {
                try {
                    const ok = await this.runConnectivityTest();
                    new Notice(ok ? '连通性测试成功' : '连通性测试失败');
                } catch (e) {
                    new Notice('连通性测试异常：' + (e?.message || 'unknown'));
                }
            }
        });
        
        // 开放设置面板：确保通过面板修改的 data.json 作为唯一入口
        this.addSettingTab(new SmartInputProSettingTab(this.app, this));
        
        } catch (error) {
            Logger.error('SmartInputPro 插件加载严重失败', error);
            // 尝试发送通知（如果 Notice 可用）
            try { new Notice('SmartInputPro 加载失败，详情请查看 99-附件/SmartInputPro_Debug_Log.md'); } catch(_) {}
            throw error;
        }
    }
    
    onunload() {
        Logger.info('Unloading Smart Input Pro plugin');
        if (Logger._flushInterval) {
            clearInterval(Logger._flushInterval);
        }
        Logger.flushLogs();
    }

    // 基于时间的日志清理方法（按天清理）
    async cleanupOldLogs() {
        try {
            const logDir = Config.LOG_DIR;
            const retentionDays = Config.LOG_RETENTION_DAYS || 7;
            const adapter = this.app.vault.adapter;

            if (!(await adapter.exists(logDir))) return;

            const files = await adapter.list(logDir);
            const now = Date.now();
            const msPerDay = 24 * 60 * 60 * 1000;

            for (const filePath of files.files) {
                // 仅处理 jsonl 文件
                if (!filePath.endsWith('.jsonl')) continue;

                // 提取文件名中的日期部分 (YYYY-MM-DD.jsonl)
                const fileName = filePath.split('/').pop();
                const dateMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})\.jsonl$/);
                
                if (dateMatch) {
                    const fileDateStr = dateMatch[1];
                    const fileDate = new Date(fileDateStr).getTime();
                    
                    // 如果文件日期早于保留期限，则删除
                    if (now - fileDate > retentionDays * msPerDay) {
                        try {
                            await adapter.remove(filePath);
                            Logger.info(`[SmartInputPro] 已清理过期日志: ${filePath}`);
                        } catch (err) {
                            Logger.warn(`[SmartInputPro] 清理日志失败: ${filePath}`, err);
                        }
                    }
                }
            }
        } catch (e) {
            Logger.error('[SmartInputPro] 日志清理过程出错:', e);
        }
    }

    getPluginDataFilePath() {
        const configDir = this.app?.vault?.configDir || '.obsidian';
        const pluginId = this.manifest?.id || 'smart-input-pro';
        return `${configDir}/plugins/${pluginId}/data.json`;
    }

    getPersistedSettings(settingsOverride = null) {
        const s = settingsOverride || this.settings || {};
        const out = {};

        out.schemaVersion = 4;
        out.resources = s.resources || {};
        out.strategy = s.strategy || {};
        out.pipeline = {};
        out.modules = JSON.parse(JSON.stringify(s.modules || {}));
        Object.keys(out.modules || {}).forEach((mid) => {
            const m = out.modules[mid];
            if (!m || typeof m !== 'object') return;
            Object.keys(m).forEach((k) => {
                if (/prompt/i.test(k)) delete m[k];
            });
        });
        out.ui = s.ui || DEFAULT_SETTINGS.ui;

        out.autoClassify = !!s.autoClassify;
        out.enableTokenCostTracking = !!s.enableTokenCostTracking;
        out.tokenCostFilePath = s.tokenCostFilePath || DEFAULT_SETTINGS.tokenCostFilePath;

        out.billPath = s.billPath || DEFAULT_SETTINGS.billPath;
        out.capturePath = s.capturePath || DEFAULT_SETTINGS.capturePath;
        out.templatePath = s.templatePath || DEFAULT_SETTINGS.templatePath;
        out.foodWishlistPath = s.foodWishlistPath || DEFAULT_SETTINGS.foodWishlistPath;
        out.weeklyDelegationPrefix = s.weeklyDelegationPrefix || DEFAULT_SETTINGS.weeklyDelegationPrefix;
        out.priceTrackPath = s.priceTrackPath || DEFAULT_SETTINGS.priceTrackPath;
        out.petFamilyPath = s.petFamilyPath || DEFAULT_SETTINGS.petFamilyPath;

        if (out.modules?.bill) {
            out.modules.bill.targetPath = out.billPath;
            out.modules.bill.templatePath = out.templatePath;
        }
        if (out.modules?.other) out.modules.other.targetPath = out.capturePath;
        if (out.modules?.food_wishlist) out.modules.food_wishlist.targetPath = out.foodWishlistPath;
        if (out.modules?.price_tracker) out.modules.price_tracker.targetPath = out.priceTrackPath;

        return out;
    }

    async backupCurrentDataJson(contentFallback = '') {
        try {
            const adapter = this.app?.vault?.adapter;
            if (!adapter) return null;
            const dataPath = this.getPluginDataFilePath();

            let content = '';
            try {
                const exists = await adapter.exists(dataPath);
                if (exists) content = await adapter.read(dataPath);
            } catch (_) {}
            if (!content) content = contentFallback || '';
            if (!content) return null;

            const basePath = dataPath.replace(/\/data\.json$/i, '/data.v3.backup.json');
            let backupPath = basePath;
            let i = 1;
            while (await adapter.exists(backupPath)) {
                backupPath = basePath.replace(/\.json$/i, `.${i}.json`);
                i += 1;
            }
            await adapter.write(backupPath, content);
            return backupPath;
        } catch (_) {
            return null;
        }
    }

    async loadSettings() {
        // 读取 data.json 容错：如为空或损坏，使用默认设置并记录警告
        let userSettings = {};
        try {
            userSettings = await this.loadData();
            if (!userSettings || typeof userSettings !== 'object') userSettings = {};
        } catch (e) {
            Logger.warn('failed to read plugin data.json, using defaults:', e);
            userSettings = {};
        }
        this._rawDataJson = userSettings;
        if (!this.promptManager) {
            this.promptManager = new PromptManager(this.app, this.manifest.dir);
        }
        const deepMerge = (base, override) => {
            if (Array.isArray(base)) {
                return Array.isArray(override) ? override : base;
            }
            if (base && typeof base === 'object') {
                const out = Object.assign({}, base);
                const o = override && typeof override === 'object' ? override : {};
                Object.keys(o).forEach((k) => {
                    if (k in base) out[k] = deepMerge(base[k], o[k]);
                    else out[k] = o[k];
                });
                return out;
            }
            return override !== undefined ? override : base;
        };

        this.settings = deepMerge(DEFAULT_SETTINGS, userSettings);
        if (!this.settings.ui || typeof this.settings.ui !== 'object') this.settings.ui = {};
        if (!this.settings.ui.quickInput || typeof this.settings.ui.quickInput !== 'object') this.settings.ui.quickInput = {};
        if (typeof this.settings.ui.quickInput.autoSubmit !== 'boolean') this.settings.ui.quickInput.autoSubmit = true;
        if (typeof this.settings.ui.quickInput.provider !== 'string') this.settings.ui.quickInput.provider = '';
        if (!this.settings.ui.quickInput.providerModels || typeof this.settings.ui.quickInput.providerModels !== 'object') {
            this.settings.ui.quickInput.providerModels = {};
        }

        let migrated = false;
        let hasNewResources = false;
        let hasNewStrategy = false;
        let hasNewPipeline = false;
        let hasNewModules = false;

        try {
            hasNewResources = !!(userSettings.resources && typeof userSettings.resources === 'object');
            hasNewStrategy = !!(userSettings.strategy && typeof userSettings.strategy === 'object');
            hasNewPipeline = !!(userSettings.pipeline && typeof userSettings.pipeline === 'object');
            hasNewModules = !!(userSettings.modules && typeof userSettings.modules === 'object');

            const inferProtocol = (providerId) => {
                const baseUrl = String(this.settings?.resources?.[providerId]?.baseUrl || '').toLowerCase();
                if (baseUrl.includes('/anthropic')) return 'anthropic';
                return 'openai';
            };

            const ensureResource = (providerId, baseFallback) => {
                if (!this.settings.resources) this.settings.resources = {};
                if (!this.settings.resources[providerId]) {
                    this.settings.resources[providerId] = deepMerge(baseFallback || {}, {});
                    migrated = true;
                }
                const r = this.settings.resources[providerId];
                if (!Array.isArray(r.models)) r.models = [];
                if (!Array.isArray(r.accounts)) r.accounts = [];
                if (!r.accounts.length) {
                    r.accounts = [{ label: 'Default', apiKey: '', apiKeyPath: '' }];
                    migrated = true;
                }
                if (!r.protocol || String(r.protocol).trim() === '') {
                    r.protocol = inferProtocol(providerId);
                    migrated = true;
                }
                if (typeof r.disableThinking !== 'boolean') {
                    r.disableThinking = false;
                    migrated = true;
                }
            };

            Object.keys(DEFAULT_SETTINGS.resources || {}).forEach((pid) => ensureResource(pid, DEFAULT_SETTINGS.resources[pid]));

            if (!this.settings.strategy || typeof this.settings.strategy !== 'object') {
                this.settings.strategy = deepMerge(DEFAULT_SETTINGS.strategy, {});
                migrated = true;
            }
            if (!this.settings.strategy.primary) {
                this.settings.strategy.primary = deepMerge(DEFAULT_SETTINGS.strategy.primary, {});
                migrated = true;
            }
            if (!this.settings.strategy.backup) {
                this.settings.strategy.backup = deepMerge(DEFAULT_SETTINGS.strategy.backup, {});
                migrated = true;
            }

            if (!hasNewResources) {
                const legacyProviders = (this.settings.providers && typeof this.settings.providers === 'object') ? this.settings.providers : {};
                Object.keys(this.settings.resources || {}).forEach((pid) => {
                    const r = this.settings.resources[pid];
                    const lp = legacyProviders[pid] || {};
                    if (lp.baseUrl && !r.baseUrl) {
                        r.baseUrl = String(lp.baseUrl);
                        migrated = true;
                    }
                    if (Array.isArray(lp.models) && lp.models.length) {
                        r.models = lp.models.slice();
                        migrated = true;
                    }
                    const defaultAcc = r.accounts.find(a => a && a.label === 'Default') || r.accounts[0];
                    if (defaultAcc) {
                        if (lp.apiKey && String(lp.apiKey).trim() && !String(defaultAcc.apiKey || '').trim()) {
                            defaultAcc.apiKey = String(lp.apiKey).trim();
                            migrated = true;
                        }
                        if (lp.apiKeyPath && String(lp.apiKeyPath).trim() && !String(defaultAcc.apiKeyPath || '').trim()) {
                            defaultAcc.apiKeyPath = String(lp.apiKeyPath).trim();
                            migrated = true;
                        }
                    }
                });
            }

            if (!hasNewStrategy) {
                const p = String(this.settings.preferredProvider || '').trim() || this.settings.strategy.primary.provider;
                const bp = String(this.settings.backupProvider || '').trim() || this.settings.strategy.backup.provider;
                const pm = String(this.settings.preferredModel || '').trim();
                const bm = String(this.settings.backupModel || '').trim();
                const primaryModels = this.settings.resources?.[p]?.models || [];
                const backupModels = this.settings.resources?.[bp]?.models || [];

                this.settings.strategy.primary.provider = p;
                this.settings.strategy.primary.model = pm || primaryModels[0] || this.settings.strategy.primary.model;
                if (!this.settings.strategy.primary.accountLabel) this.settings.strategy.primary.accountLabel = 'Default';

                const backupEnabled = this.settings.enableBackupModel !== false;
                this.settings.strategy.backup.enabled = backupEnabled;
                this.settings.strategy.backup.provider = bp;
                this.settings.strategy.backup.model = bm || backupModels[0] || this.settings.strategy.backup.model;
                if (!this.settings.strategy.backup.accountLabel) this.settings.strategy.backup.accountLabel = 'Default';

                if (!this.settings.strategy.quotaBlockDate && this.settings.preferredModelExhaustedDate) {
                    this.settings.strategy.quotaBlockDate = String(this.settings.preferredModelExhaustedDate || '').trim();
                }
                migrated = true;
            }

            const today = new Date();
            const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            if (this.settings.strategy.quotaBlockDate && this.settings.strategy.quotaBlockDate !== dateKey) {
                this.settings.strategy.quotaBlockDate = '';
                migrated = true;
            }

            const migrateLegacyKey = (providerId, legacyKeyValue, legacyKeyPathValue) => {
                const r = this.settings.resources?.[providerId];
                if (!r || !Array.isArray(r.accounts)) return;
                const target = r.accounts.find(a => a && a.label === 'Default') || r.accounts[0];
                if (!target) return;
                if (legacyKeyValue && String(legacyKeyValue).trim() && !String(target.apiKey || '').trim()) {
                    target.apiKey = String(legacyKeyValue).trim();
                    migrated = true;
                }
                if (legacyKeyPathValue && String(legacyKeyPathValue).trim() && !String(target.apiKeyPath || '').trim()) {
                    target.apiKeyPath = String(legacyKeyPathValue).trim();
                    migrated = true;
                }
            };

            migrateLegacyKey('zhipu', this.settings.zhipuApiKey, this.settings.zhipuApiKeyPath);
            migrateLegacyKey('minimax', this.settings.minimaxM2ApiKey || this.settings.minimaxApiKey, this.settings.minimaxM2ApiKeyPath || this.settings.minimaxApiKeyPath);
            migrateLegacyKey('qwen', this.settings.qwenApiKey, this.settings.qwenApiKeyPath);
            migrateLegacyKey('mimo', this.settings.mimoApiKey, this.settings.mimoApiKeyPath);

            if (this.settings.zhipuApiKey) { this.settings.zhipuApiKey = ''; migrated = true; }
            if (this.settings.minimaxApiKey) { this.settings.minimaxApiKey = ''; migrated = true; }
            if (this.settings.minimaxM2ApiKey) { this.settings.minimaxM2ApiKey = ''; migrated = true; }
            if (this.settings.qwenApiKey) { this.settings.qwenApiKey = ''; migrated = true; }

            if (this.settings.modules?.bill?.targetPath && !this.settings.billPath) {
                this.settings.billPath = this.settings.modules.bill.targetPath;
                migrated = true;
            }
            if (this.settings.modules?.bill?.templatePath && !this.settings.templatePath) {
                this.settings.templatePath = this.settings.modules.bill.templatePath;
                migrated = true;
            }
            if (this.settings.modules?.food_wishlist?.targetPath && !this.settings.foodWishlistPath) {
                this.settings.foodWishlistPath = this.settings.modules.food_wishlist.targetPath;
                migrated = true;
            }
            if (this.settings.modules?.price_tracker?.targetPath && !this.settings.priceTrackPath) {
                this.settings.priceTrackPath = this.settings.modules.price_tracker.targetPath;
                migrated = true;
            }
            if (this.settings.modules?.other?.targetPath && !this.settings.capturePath) {
                this.settings.capturePath = this.settings.modules.other.targetPath;
                migrated = true;
            }

            const legacyAssetPrompt = userSettings.pipeline?.asset_log_prompt || this.settings.pipeline?.asset_log_prompt;
            if (legacyAssetPrompt && this.settings.modules?.bill && !this.settings.modules.bill.asset_log_prompt) {
                this.settings.modules.bill.asset_log_prompt = String(legacyAssetPrompt);
                migrated = true;
            }
            if (this.settings.pipeline?.asset_log_prompt) {
                delete this.settings.pipeline.asset_log_prompt;
                migrated = true;
            }
            if (this.settings.pipeline?.legacy_bill_or_capture_prompt) {
                delete this.settings.pipeline.legacy_bill_or_capture_prompt;
                migrated = true;
            }
        } catch (mErr) {
            Logger.warn('settings 迁移失败（将使用默认结构）:', mErr);
        }

        const needsRewrite = (() => {
            const sv = Number(userSettings.schemaVersion || 0);
            const missingCore = !(hasNewResources && hasNewStrategy && hasNewPipeline && hasNewModules);
            const legacyKeys = [
                'providers',
                'preferredProvider',
                'preferredModel',
                'backupProvider',
                'backupModel',
                'enableBackupModel',
                'preferredModelExhaustedDate',
                'zhipuApiKey',
                'zhipuApiKeyPath',
                'minimaxApiKey',
                'minimaxApiKeyPath',
                'minimaxM2ApiKey',
                'minimaxM2ApiKeyPath',
                'qwenApiKey',
                'qwenApiKeyPath',
                'customApiUrl',
                'minimaxPreferredModel',
                'minimaxBackupModel',
                'minimaxM2BaseUrl',
                'qwenBaseUrl'
            ];
            const hasLegacy = legacyKeys.some((k) => Object.prototype.hasOwnProperty.call(userSettings, k));
            return sv !== 4 || missingCore || hasLegacy || migrated;
        })();

        if (needsRewrite) {
            const persisted = this.getPersistedSettings(this.settings);
            await this.backupCurrentDataJson(JSON.stringify(userSettings, null, 2));
            await this.saveData(persisted);
            this.settings = deepMerge(DEFAULT_SETTINGS, persisted);
        }

        // --- Prompt Migration Logic (New Architecture) ---
        if (this.promptManager) {
            try {
                // Pass _rawDataJson to ensure we have original data even if settings were modified
                const sourceSettings = this._rawDataJson || this.settings; 
                const migrated = await this.promptManager.migrateFromSettings(sourceSettings);
                
                if (migrated) {
                    Logger.info('Prompts migrated to user.js');
                    
                    if (this.settings.pipeline) {
                        delete this.settings.pipeline.stage1_classification_prompt;
                        delete this.settings.pipeline.stage2_optimization_prompt;
                    }
                    if (this.settings.modules) {
                        Object.values(this.settings.modules).forEach(m => {
                            if (m) {
                                delete m.extractionPrompt;
                                delete m.asset_log_prompt;
                            }
                        });
                    }
                    
                    // Save cleaned settings
                    await this.saveSettings();
                    new Notice('SmartInputPro: 提示词已迁移至 prompts/user.js');
                }
            } catch (e) {
                Logger.error('Prompt migration failed:', e);
            }
        }
        
        // 不再读取通用 API Key/路径，强制依赖首选服务商的专用 Key/路径
        // 模板路径校验（轻量化）：仅规范化与存在性检查，不在启动期进行全库扫描
        try {
            const tplPath = (this.settings.templatePath || '').trim();
            this.settings.templatePath = tplPath; // 规范化去空格
            const tplFile = tplPath ? this.app.vault.getAbstractFileByPath(tplPath) : null;
            if (!tplPath || !tplFile) {
                // 启动期不做全库扫描，提示在功能使用时会按需解析
                Logger.warn('[SmartInputPro] 记账模板路径尚未就绪，将在首次使用记账功能时进行惰性解析。');
            }
        } catch (e) {
            Logger.warn('模板路径校验失败:', e);
        }
    }
    
    async saveSettings() {
        await this.saveData(this.getPersistedSettings());
    }

    // 启动期优化：惰性解析记账模板路径，仅在实际需要时执行（可能触发全库扫描）
    async ensureTemplatePathReady() {
        try {
            let tplPath = (this.settings.templatePath || '').trim();
            let tplFile = tplPath ? this.app.vault.getAbstractFileByPath(tplPath) : null;
            if (tplFile) return tplPath;
            // 按需解析（包含候选与必要时全库扫描）
            const resolved = this.resolveBillTemplatePath();
            if (resolved) {
                this.settings.templatePath = resolved;
                await this.saveSettings();
                Logger.info(`[SmartInputPro] 记账模板路径已惰性解析为: ${resolved}`);
                return resolved;
            }
            Logger.warn('[SmartInputPro] 未找到记账模板文件。请在设置中指定模板路径或在 04-模板系统/09-专用模板/ 处创建“记账模板.md”。');
            return null;
        } catch (e) {
            Logger.warn('ensureTemplatePathReady 失败:', e);
            return null;
        }
    }

    // ========== Token 消耗记录辅助（类内定义，避免初始化前引用） ==========
    async getNextTokenId() {
        try {
            const now = new Date();
            const yy = String(now.getFullYear()).substring(2); // 获取两位数的年份
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const prefix = `${yy}${mm}${dd}`;
            
            // 计算当前月度日志文件路径
            const logDir = '01-经纬矩阵系统/08-智能录入模块/智能录入日志';
            const logFileName = `SIPLog_${now.getFullYear()}-${mm}.md`;
            const tokenFilePath = `${logDir}/${logFileName}`;
            
            let content = '';
            try { content = await this.app.vault.adapter.read(tokenFilePath); } catch (_) { content = ''; }
            const lines = content.split(/\r?\n/).filter(Boolean);
            
            // 获取当天所有记录的ID
            const todayIds = [];
            lines.forEach(line => {
                const match = line.match(/^- (\d{8}) \|/);
                if (match && match[1].startsWith(prefix)) {
                    todayIds.push(match[1]);
                }
            });
            
            // 提取已存在的序号部分（后两位）
            const existingSeqs = todayIds.map(id => parseInt(id.substring(6), 10)).filter(seq => !isNaN(seq));
            
            // 找出最大序号，如果没有则从0开始
            let maxSeq = 0;
            if (existingSeqs.length > 0) {
                maxSeq = Math.max(...existingSeqs);
            }
            
            // 新序号为最大序号+1
            const newSeq = maxSeq + 1;
            const seq = String(newSeq).padStart(2, '0');
            return `${prefix}${seq}`;
        } catch (_) {
            // 兜底：无法读取文件或解析，则返回一个时间戳后两位作为序号
            const now = new Date();
            const yy = String(now.getFullYear()).substring(2); // 获取两位数的年份
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const seq = String(now.getSeconds() % 100).padStart(2, '0');
            return `${yy}${mm}${dd}${seq}`;
        }
    }

    async appendTokenCostRecord(category = null) {
        try {
            // 计算当前月度日志文件路径
            const now = new Date();
            const yearFull = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const logDir = '01-经纬矩阵系统/08-智能录入模块/智能录入日志';
            const logFileName = `SIPLog_${yearFull}-${month}.md`;
            const tokenFilePath = `${logDir}/${logFileName}`;
            
            // 确保目录存在
            if (this.app && this.app.vault) {
                const exists = await this.app.vault.adapter.exists(logDir);
                if (!exists) await this.app.vault.createFolder(logDir);
            }

            // 生成YYMMDDHHMM格式的编号
            const year = String(yearFull).slice(-2); // 获取年份后两位
            const day = String(now.getDate()).padStart(2, '0'); // 日期补零
            const hour = String(now.getHours()).padStart(2, '0'); // 小时补零
            const minute = String(now.getMinutes()).padStart(2, '0'); // 分钟补零
            const id = `${year}${month}${day}${hour}${minute}`;
            
            const s1 = Number(this.stage1Tokens || 0);
            const s2 = Number(this.stage2Tokens || 0);
            const total = s1 + s2;
            const input = (this.currentInputText || '').replace(/\s+/g, ' ').trim();
            
            // 新增：分别获取两个阶段的输入和输出Token
            const s1Prompt = Number(this.stage1PromptTokens || 0);
            const s1Completion = Number(this.stage1CompletionTokens || 0);
            const s2Prompt = Number(this.stage2PromptTokens || 0);
            const s2Completion = Number(this.stage2CompletionTokens || 0);
            const totalPrompt = s1Prompt + s2Prompt;
            const totalCompletion = s1Completion + s2Completion;
            
            // 如果没有传入分类结果，尝试从最近的日志中获取
            if (!category) {
                try {
                    const logs = await this.getRecentPipelineEvents(5, 'stage1_result');
                    if (logs.length > 0) {
                        category = logs[0].data?.category || 'unknown';
                    }
                } catch (_) {
                    category = 'unknown';
                }
            }
            // 新格式：编号 | 类别: 中文显示名 | s1: 1000(s1Prompt/s1Completion) | s2: 500(s2Prompt/s2Completion) | total: 1500(totalPrompt/totalCompletion) | 输入: 示例文本
            const displayCategory = this.getCategoryDisplayName(category);
            const line = `- ${id} | 类别: ${displayCategory} | s1: ${s1}(${s1Prompt}/${s1Completion}) | s2: ${s2}(${s2Prompt}/${s2Completion}) | total: ${total}(${totalPrompt}/${totalCompletion}) | 耗时: ${(((Date.now() - (this.processingStartAt || Date.now()))/1000).toFixed(1))}s | 模型: ${this.lastSuccessfulAIModel || '调用失败'} | 输入: ${input}`;

            let existing = '';
            try { existing = await this.app.vault.adapter.read(tokenFilePath); } catch (_) { existing = ''; }
            const newContent = (existing ? (existing.endsWith('\n') ? existing : existing + '\n') : '') + line + '\n';
            
            // 写入文件（如果不存在会自动创建，因为 adapter.write 对应 fs.writeFile）
            // 但为了保险，还是先检查是否存在，不存在则 create
            const fileExists = await this.app.vault.adapter.exists(tokenFilePath);
            if (fileExists) {
                await this.app.vault.adapter.append(tokenFilePath, line + '\n');
            } else {
                await this.app.vault.create(tokenFilePath, line + '\n');
            }
            
            await this.logPipelineEvent('token_cost_record', { id, s1, s2, total, category, file: tokenFilePath });
        } catch (e) {
            Logger.error('appendTokenCostRecord 失败:', e);
            try { await this.logPipelineEvent('token_cost_record_error', { error: e?.message || String(e) }); } catch (_) {}
        }
    }

    // 统一的保存后跳转辅助方法：在所有模块中复用，通过参数化支持差异化定位
    // 用法示例：
    // - navigateAfterSave(path)                    → 默认定位到末尾
    // - navigateAfterSave(path, 'end')             → 显式指定末尾
    // - navigateAfterSave(path, { mode: 'line', line: 0 })
    // - navigateAfterSave(path, { mode: 'search', searchText: '刚刚追加的文本片段' })
    async navigateAfterSave(filePath, options = 'end') {
        try {
            // 规范化路径：支持传入字符串或 TFile 对象
            const targetPath = (typeof filePath === 'string')
                ? filePath
                : (filePath && typeof filePath === 'object' && (filePath.path || filePath.file?.path || filePath.data?.path))
                    ? (filePath.path || filePath.file?.path || filePath.data?.path)
                    : String(filePath);

            // 兼容字符串简写：'end' | 'line:0' | 'search:xxx' | 直接传入“刚追加的文本”即按搜索定位
            let navOptions = {};
            if (typeof options === 'string') {
                if (options === 'end') {
                    navOptions = { mode: 'end' };
                } else if (options.startsWith('line:')) {
                    const n = Number(options.split(':')[1]);
                    navOptions = { mode: 'line', line: isNaN(n) ? 0 : n };
                } else if (options.startsWith('search:')) {
                    navOptions = { mode: 'search', searchText: options.slice('search:'.length) };
                } else {
                    // 未知字符串视为搜索文本，按新增内容定位
                    navOptions = { mode: 'search', searchText: options };
                }
            } else if (typeof options === 'object' && options !== null) {
                // 传入对象参数，直接透传并补默认值
                const { mode = 'end', line, searchText } = options;
                navOptions = { mode, line, searchText };
            } else {
                navOptions = { mode: 'end' };
            }

            if (this.navigationHelper) {
                await this.navigationHelper.openAndNavigate(targetPath, navOptions);
            } else {
                // 兜底：仅打开文件，不保证定位
                const file = this.app.vault.getAbstractFileByPath(targetPath);
                if (file) await this.app.workspace.getLeaf().openFile(file);
            }
        } catch (err) {
        Logger.warn('[SmartInputPro] navigateAfterSave failed:', err);
        }
    }

    // 记录错误到JSONL文件（兼容多种调用方式）
    async logError(arg1, arg2 = {}, arg3 = {}) {
        try {
            // 兼容以下调用：
            // 1) logError(errorObj, context)
            // 2) logError('label', errorObj, context)
            // 3) logError('label', context)
            let label = null;
            let error = null;
            let context = {};

            if (arg1 instanceof Error) {
                error = arg1;
                context = (arg2 && typeof arg2 === 'object') ? arg2 : {};
            } else if (typeof arg1 === 'string' && arg2 instanceof Error) {
                label = arg1;
                error = arg2;
                context = (arg3 && typeof arg3 === 'object') ? arg3 : {};
            } else if (typeof arg1 === 'string' && arg2 && typeof arg2 === 'object' && !('message' in arg2)) {
                label = arg1;
                context = arg2;
            } else {
                // 兜底：将任意内容包装为错误消息
                error = new Error(String(arg1));
                context = (arg2 && typeof arg2 === 'object') ? arg2 : {};
            }

            // 改为调用统一的日志流水线，类型标记为 error
            // 确保 context 中的数据也能被记录
            const errorData = {
                error_message: (error && error.message) || (label || 'Unknown error'),
                error_stack: (error && error.stack) || '',
                ...context
            };
            
            // 使用 logPipelineEvent 统一记录
            await this.logPipelineEvent(label || 'error', errorData);

        } catch (e) {
            Logger.error('[SmartInputPro] Failed to write to log file:', e);
        }
    }

    



    

    /**
     * 通用 Token 统计辅助函数
     */
    _trackTokenUsage(usage, trackStage) {
        if (!usage || !trackStage) return;
        try {
            // 兼容 OpenAI (prompt_tokens/completion_tokens) 和 Anthropic (input_tokens/output_tokens)
            const prompt = usage.prompt_tokens || usage.input_tokens || 0;
            const completion = usage.completion_tokens || usage.output_tokens || 0;
            const total = usage.total_tokens || (prompt + completion) || 0;

            if (trackStage === 'stage1') {
                this.stage1Tokens = (this.stage1Tokens || 0) + total;
                this.stage1PromptTokens = (this.stage1PromptTokens || 0) + prompt;
                this.stage1CompletionTokens = (this.stage1CompletionTokens || 0) + completion;
            } else if (trackStage === 'stage2') {
                this.stage2Tokens = (this.stage2Tokens || 0) + total;
                this.stage2PromptTokens = (this.stage2PromptTokens || 0) + prompt;
                this.stage2CompletionTokens = (this.stage2CompletionTokens || 0) + completion;
            }
        } catch (_) {}
    }

    /**
     * 统一 AI 调用底层核心方法 (Unified AI Kernel)
     * 支持 OpenAI 兼容协议与 Anthropic 兼容协议
     */
    async unifiedCallAI(params) {
        const { provider, model, apiKey, baseUrl, prompt, trackStage, jsonMode } = params;
        
        // 1. 协议适配配置
        const providerConfig = this.settings?.resources?.[provider];
        const overrideProtocol = String(providerConfig?.protocol || '').trim();
        const protocol = (() => {
            if (overrideProtocol && overrideProtocol !== 'auto') return overrideProtocol;
            const url = String(baseUrl || '').toLowerCase();
            if (url.includes('/anthropic')) return 'anthropic';
            return 'openai';
        })();
        
        // 2. 构造请求
        let url = '';
        let headers = {
            'Content-Type': 'application/json'
        };
        let body = {};
        
        const cleanBaseUrl = String(baseUrl).replace(/\/$/, '');

        if (protocol === 'openai') {
            url = `${cleanBaseUrl}/chat/completions`;
            headers['Authorization'] = `Bearer ${apiKey}`;
            
            body = {
                model: model,
                messages: [{ role: 'user', content: prompt }],
                temperature: jsonMode ? 0.3 : 0.2,
                top_p: 0.9,
                max_tokens: 4096
            };
            
            // 智谱特有配置
            if (provider === 'zhipu') {
                 if (jsonMode) {
                     body.response_format = { type: 'json_object' };
                     body.thinking = { type: 'disabled' }; 
                 }
            }
            if (providerConfig?.disableThinking === true) {
                const baseUrlLower = String(cleanBaseUrl).toLowerCase();
                if (baseUrlLower.includes('generativelanguage.googleapis.com') && /^gemini-2\.5/i.test(String(model || ''))) {
                    body.reasoning_effort = 'none';
                } else if (baseUrlLower.includes('open.bigmodel.cn') && !body.thinking) {
                    body.thinking = { type: 'disabled' };
                }
            }
            
        } else if (protocol === 'anthropic') {
            url = `${cleanBaseUrl}/v1/messages`;
            headers['x-api-key'] = apiKey; 
            
            const systemMessage = jsonMode 
                ? '请严格遵循指令，仅返回最终JSON；不要输出思考内容、解释或代码块。' 
                : '请严格遵循指令，仅返回最终文本或JSON；不要输出思考内容、解释或代码块。';

            body = {
                model: model,
                max_tokens: 4096,
                system: systemMessage,
                messages: [
                    { role: 'user', content: [ { type: 'text', text: prompt } ] }
                ]
            };
            
            // MiMo 特有配置
            if (provider === 'mimo') {
                 body.thinking = { type: 'disabled' };
            }
        }

        // 3. 辅助：预览与日志
        const mkPreview = (obj) => { const s = JSON.stringify(obj); return s.length > 800 ? (s.slice(0, 800) + `...(+${s.length - 800} chars)`) : s; };
        
        // 4. 发起请求
        try {
            await this.logPipelineEvent('ai_request', { provider, protocol, model, api_url: url, body_preview: mkPreview(body) });
            
            const response = await requestUrl({
                url: url,
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });

            // 5. 处理响应
            const status = response.status;
            const respData = response.json;

            if (status < 200 || status >= 300 || respData.error) {
                 const errMsg = respData?.error?.message || respData?.message || `HTTP ${status}`;
                 const err = new Error(errMsg);
                 err.status = status;
                 err.data = respData;
                 err.isQuota = (status === 403 || status === 429) || /余额不足|无可用资源包|额度|quota/i.test(errMsg);
                 throw err;
            }

            // 6. 统计 Token
            if (respData.usage) {
                this._trackTokenUsage(respData.usage, trackStage);
            }

            // 7. 提取内容
            let content = '';
            if (protocol === 'openai') {
                content = respData.choices?.[0]?.message?.content || '';
            } else if (protocol === 'anthropic') {
                if (Array.isArray(respData.content)) {
                    content = respData.content.map(c => c.text).join('\n');
                } else {
                    content = respData.content;
                }
            }
            
            const contentPreview = content.length > 500 ? (content.slice(0, 500) + '...') : content;
            await this.logPipelineEvent('ai_response', { provider, model, status, content_preview: contentPreview });
            
            this.lastSuccessfulAIModel = model;
            return content || '';

        } catch (e) {
            const isNetwork = /Failed to fetch|NetworkError/i.test(e.message);
            await this.logPipelineEvent('ai_error', { 
                provider, model, 
                error: e.message, 
                status: e.status,
                is_network: isNetwork,
                raw_response: e.data 
            });
            throw e;
        }
    }



    /**
     * 宽松JSON解析工具 (修复版：支持 Object 和 Array)
     */
    parseJSONRelaxed(str) {
        if (!str) return null;
        let s = String(str).trim();
        // 1. 移除 Markdown 代码块标记
        s = s.replace(/^```\s*json\s*/i, '').replace(/^```/, '').replace(/```$/, '').trim();
        
        // 2. 尝试直接解析 (最快)
        try { return JSON.parse(s); } catch (_) {}

        // 3. 智能提取：判断是对象还是数组
        const firstOpen = s.indexOf('{');
        const firstArray = s.indexOf('[');
        
        // 如果是数组 (存在 [ 且在 { 之前)
        if (firstArray !== -1 && (firstOpen === -1 || firstArray < firstOpen)) {
            const lastArray = s.lastIndexOf(']');
            if (lastArray > firstArray) {
                try { return JSON.parse(s.slice(firstArray, lastArray + 1)); } catch (_) {}
            }
        }
        
        // 如果是对象
        const last = s.lastIndexOf('}');
        if (firstOpen !== -1 && last > firstOpen) {
            try { return JSON.parse(s.slice(firstOpen, last + 1)); } catch (_) {}
        }
        
        return null;
    }

    renderPrompt(template, context) {
        if (!template) return '';
        const ctx = (context && typeof context === 'object') ? context : {};
        return String(template).replace(/\$\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
            return Object.prototype.hasOwnProperty.call(ctx, key) ? String(ctx[key]) : match;
        });
    }

    /**
     * 新架构核心方法：语义分类与优化保存的两步处理流程
     * 
     * 架构设计：
     * 1. 第一阶段：轻量级语义分类 - 仅识别内容类型，最小化Token消耗
     * 2. 第二阶段：专门化处理 - 根据分类结果调用对应的结构化处理函数
     * 
     * 处理流程：
     * - 初始化Token统计（支持分阶段统计）
     * - 调用classifyCategoryOnly进行纯分类
     * - 可选优化：maybeOptimizeTextForStage2（仅当需要时）
     * - 根据分类结果分发到专门处理函数
     * - 记录Token消耗（可配置）
     * 
     * 错误处理：
     * - 任何阶段失败均降级为appendToCapture
     * - 保留分类结果用于Token统计
     * - 记录详细的错误日志和降级事件
     * 
     * @param {string} text - 用户输入的原始文本
     * @returns {Promise<string>} 处理后的文件路径
     */
    async classifyAndSave(text) {
        let category = 'unknown'; // 初始化category变量
        try {
            // 初始化本次录入的 token 统计
            this.currentInputText = text;
            this.stage1Tokens = 0;
            this.stage2Tokens = 0;
            // 新增：分别记录两个阶段的输入和输出Token
            this.stage1PromptTokens = 0;
            this.stage1CompletionTokens = 0;
            this.stage2PromptTokens = 0;
            this.stage2CompletionTokens = 0;
            // 第一步（重构）：仅进行纯分类，减少提示词体量与token消耗
            const classificationResult = await this.classifyCategoryOnly(text);
            category = classificationResult.category; // 获取分类结果
            const moduleConf = this.settings?.modules?.[category];
            if (moduleConf && moduleConf.enabled === false) {
                category = 'other';
            }
            // 第一步提醒与流水记录
            try { new Notice(`第一步：已识别为「${category}」`); } catch (_) {}
            // 可选的轻量优化：仅当类别确实需要优化时才调用优化提示词
            const textForStage2 = await this.maybeOptimizeTextForStage2(text, category);

            await this.logPipelineEvent('stage2_dispatch', { module: category, text_used: textForStage2, original_text: text, optimized_text: textForStage2 !== text ? textForStage2 : undefined });

            // 根据分类结果分发到对应的结构化处理函数
            let resultPath = '';
            switch (category) {
                case 'bill':
                    resultPath = await this.processCategoryBill(textForStage2);
                    break;
                case 'code_dev':
                    resultPath = await this.processCategoryCodeDev(textForStage2);
                    break;
                case 'task':
                    resultPath = await this.processCategoryTask(textForStage2);
                    break;
                case 'question_entry':
                    resultPath = await this.processCategoryQuestionEntry(textForStage2);
                    break;
                case 'study_record':
                    resultPath = await this.processCategoryStudyRecord(textForStage2);
                    break;
                case 'memo':
                    resultPath = await this.processCategoryMemo(textForStage2);
                    break;
                case 'contact':
                    resultPath = await this.processCategoryContact(textForStage2);
                    break;
                case 'food_wishlist':
                    resultPath = await this.processCategoryFoodWishlist(textForStage2);
                    break;
                case 'price_tracker':
                    resultPath = await this.processCategoryPriceTracker(textForStage2);
                    break;
                case 'pet_growth':
                    resultPath = await this.processCategoryPetGrowth(textForStage2);
                    break;
                case 'other':
                default:
                    resultPath = await this.processCategoryOther(textForStage2);
                    break;
            }
            // 第二步完成后记录一次 token 消耗（可配置）
            if (this.settings.enableTokenCostTracking) {
                await this.appendTokenCostRecord(category);
                try {
                    const totalTokens = (this.stage1Tokens || 0) + (this.stage2Tokens || 0);
                } catch (_) {}
            }
            return resultPath;
        } catch (error) {
            Logger.error('Error in classifyAndSave:', error);
            
            // 记录降级处理的错误日志
            this.logError('降级处理', error, {
                method: 'classifyAndSave',
                input: text,
                fallback_method: 'appendToCapture'
            });
            
            // 降级操作：直接存入INBOX
            try { new Notice(`处理失败（错误原因：${error.message}），降级为杂项，已存入INBOX`); } catch (_) {}
            await this.logPipelineEvent('stage2_degrade', { error: error.message, original_text: text });
            const path = await this.appendToCapture(text);
            // 即便降级，也记录 Token 消耗（第二阶段为 0）（可配置）
            if (this.settings.enableTokenCostTracking) {
                await this.appendTokenCostRecord(category);
                try {
                    const totalTokens = (this.stage1Tokens || 0) + (this.stage2Tokens || 0);
                    new Notice(`📊 本次消耗 Token 共 ${totalTokens}`);
                } catch (_) {}
            }
            return path;
        }
    }

    /**
     * 统一API密钥获取方法
     * 
     * 功能定位：
     * - 集中管理所有AI服务商的API密钥获取逻辑
     * - 支持新旧配置系统的兼容性处理
     * 
     * 获取策略：
     * 1. 优先从统一providers配置中读取
     *    - 直接使用apiKey字段（明文配置）
     *    - 通过apiKeyPath字段读取文件内容（安全配置）
     * 2. 兼容旧版独立字段配置
     *    - 支持各服务商的独立apiKey字段
     *    - 支持各服务商的独立apiKeyPath字段
     * 
     * 技术特点：
     * - 多层降级机制，确保总能获取到有效密钥
     * - 统一错误处理，避免密钥获取失败导致流程中断
     * - 支持多种配置方式，适应不同安全需求
     * 
     * @param {string|null} providerOverride - 可选的服务商覆盖参数，为null时使用默认配置
     * @returns {Promise<string>} API密钥字符串，获取失败时返回空字符串
     */
    async getApiKey(providerOverride = null, accountLabelOverride = null) {
        const provider = providerOverride || this.settings?.strategy?.primary?.provider || this.settings.preferredProvider;
        if (!provider) return '';
        const accountLabel = accountLabelOverride || this.settings?.strategy?.primary?.accountLabel || 'Default';

        const tryRead = async (path) => {
            if (!path) return '';
            try {
                const normalizedPath = String(path).replace(/\\/g, '/').trim();
                if (!normalizedPath) return '';
                const file = this.app.vault.getAbstractFileByPath(normalizedPath);
                if (file) {
                    const content = await this.app.vault.read(file);
                    return (content || '').trim();
                }
            } catch (_) {}
            return '';
        };

        const r = this.settings?.resources?.[provider];
        if (r && Array.isArray(r.accounts) && r.accounts.length) {
            const target = r.accounts.find(a => a && String(a.label || '').trim() === accountLabel) || r.accounts[0];
            if (target) {
                if (target.apiKey && String(target.apiKey).trim()) return String(target.apiKey).trim();
                const fromPath = String(target.apiKeyPath || '').trim();
                const content = await tryRead(fromPath);
                if (content) return content;
            }
        }

        const providers = this.settings?.providers || {};
        const conf = providers[provider];
        if (conf) {
            if (conf.apiKey && String(conf.apiKey).trim()) return String(conf.apiKey).trim();
            const pathFromConf = conf.apiKeyPath && String(conf.apiKeyPath).trim();
            const content = await tryRead(pathFromConf);
            if (content) return content;
        }

        // 兼容旧字段（迁移期间的备用方案）
        if (provider === 'zhipu') {
            if (this.settings.zhipuApiKey) return String(this.settings.zhipuApiKey).trim();
            const content = await tryRead(this.settings.zhipuApiKeyPath || Config.ZHIPU_API_KEY_PATH);
            if (content) return content;
        } else if (provider === 'qwen') {
            if (this.settings.qwenApiKey) return String(this.settings.qwenApiKey).trim();
            const content = await tryRead(this.settings.qwenApiKeyPath || Config.QWEN_API_KEY_PATH);
            if (content) return content;
        } else if (provider === 'minimax' || provider === 'minimax_m2') {
            if (this.settings.minimaxM2ApiKey) return String(this.settings.minimaxM2ApiKey).trim();
            if (this.settings.minimaxApiKey) return String(this.settings.minimaxApiKey).trim();
            const contentM2 = await tryRead(this.settings.minimaxM2ApiKeyPath || Config.MINIMAX_M2_KEY_PATH);
            if (contentM2) return contentM2;
            const content = await tryRead(this.settings.minimaxApiKeyPath || Config.MINIMAX_M2_KEY_PATH);
            if (content) return content;
        }
        return '';
    }

 
}



// ========== Entry（入口与 UI） ==========
/**
 * QuickAdd风格的精简Prompt：仅一个输入框 + OK 按钮，专注高效文本输入
 */

/**
 * 智能录入模态框 - 插件的主要用户交互界面
 * 
 * 设计理念：
 * - QuickAdd风格的精简界面：单一输入框 + 操作按钮
 * - 智能交互：自动倒计时提交 + 手动控制切换
 * - 桌面端优化：自动聚焦输入框，提升用户体验
 * 
 * 核心功能：
 * 1. 文本输入与自动提交机制
 *    - 输入后5秒倒计时自动提交
 *    - 支持手动暂停/恢复自动提交
 *    - Enter键快速提交（Shift+Enter换行）
 * 
 * 2. 桌面端语音集成
   *    - 通过桌面端语音识别服务提供便捷输入方式
   *    - 语音结果自动填入输入框
 * 
 * 3. 用户体验优化
 *    - 随机显示哲理名言
 *    - 倒计时可视化反馈
 *    - 防重复提交机制
 * 
 * 技术特点：
 * - 基于Obsidian Modal组件扩展
 * - 响应式CSS类设计
 *    - 事件驱动的交互逻辑
 */

/**
 * PriceAnalysisModal - 价格分析对话框类
 * 
 * 功能概述：
 * 用于显示商品价格统计分析结果，提供用户友好的价格评估反馈。
 * 根据历史价格数据计算统计指标（最高、最低、平均、中位数），
 * 并给出当前价格是否实惠的评估结论。
 * 
 * 核心功能：
 * 1. 统计数据展示：显示历史最高、最低、平均、中位数价格
 * 2. 当前价格对比：直观显示当前价格与历史价格的对比
 * 3. 智能评估：根据当前价格与历史均价的关系给出评估结论
 * 4. 视觉反馈：通过颜色编码提供直观的价格评估（便宜/正常/昂贵）
 * 
 * UI设计特点：
 * - 响应式布局：适配不同屏幕尺寸
 * - Obsidian原生样式：使用CSS变量确保暗色/亮色模式兼容
 * - 层次化信息展示：突出重点信息，辅助信息次要展示
 * 
 * @class PriceAnalysisModal
 * @extends Modal
 */
class PriceAnalysisModal extends Modal {
    constructor(app, currentData, stats) {
        super(app);
        this.currentData = currentData;
        this.stats = stats;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        // 设置模态框标题
        this.titleEl.setText('💰 价格分析报告');

        // 创建主要内容容器
        const mainContainer = contentEl.createDiv({
            cls: 'price-analysis-container',
            attr: { style: 'padding: 16px; max-width: 500px;' }
        });

        // 商品信息标题
        const itemTitle = mainContainer.createEl('h3', {
            text: `📊 ${this.currentData.item} 价格分析`,
            attr: { style: 'margin-bottom: 16px; color: var(--text-normal);' }
        });

        // 当前价格信息卡片
        const currentPriceCard = mainContainer.createDiv({
            cls: 'current-price-card',
            attr: { 
                style: `
                    background: var(--background-secondary);
                    border: 1px solid var(--background-modifier-border);
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 16px;
                `
            }
        });

        const currentPriceTitle = currentPriceCard.createEl('h4', {
            text: '💵 当前价格',
            attr: { style: 'margin: 0 0 8px 0; color: var(--text-normal);' }
        });

        const currentPriceInfo = currentPriceCard.createDiv({
            attr: { style: 'font-size: 1.1em; color: var(--text-normal);' }
        });

        const priceText = `${this.currentData.price} 元/${this.currentData.unit}`;
        const locationText = this.currentData.location ? ` @ ${this.currentData.location}` : '';
        currentPriceInfo.textContent = priceText + locationText;

        // 评估结果卡片
        const evalCard = mainContainer.createDiv({
            cls: 'evaluation-card',
            attr: {
                style: `
                    background: ${this.getEvalColor(this.stats.status)};
                    border: 1px solid ${this.getEvalBorderColor(this.stats.status)};
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 16px;
                    color: white;
                    text-align: center;
                `
            }
        });

        const evalTitle = evalCard.createEl('h4', {
            text: this.getEvalTitle(this.stats.status),
            attr: { 
                style: `
                    margin: 0 0 8px 0; 
                    font-size: 1.2em; 
                    font-weight: bold;
                    color: white;
                `
            }
        });

        const evalDesc = evalCard.createEl('p', {
            text: this.getEvalDescription(this.stats),
            attr: { style: 'margin: 0; line-height: 1.4;' }
        });

        // 历史统计卡片
        if (this.stats.records > 0) {
            const statsCard = mainContainer.createDiv({
                cls: 'stats-card',
                attr: { 
                    style: `
                        background: var(--background-secondary);
                        border: 1px solid var(--background-modifier-border);
                        border-radius: 8px;
                        padding: 16px;
                    `
                }
            });

            const statsTitle = statsCard.createEl('h4', {
                text: '📈 历史统计',
                attr: { style: 'margin: 0 0 12px 0; color: var(--text-normal);' }
            });

            const statsGrid = statsCard.createDiv({
                attr: { 
                    style: `
                        display: grid; 
                        grid-template-columns: 1fr 1fr; 
                        gap: 8px;
                    `
                }
            });

            // 历史最高价
            const maxItem = statsGrid.createDiv({
                attr: { 
                    style: `
                        display: flex;
                        justify-content: space-between;
                        padding: 4px 8px;
                        background: rgba(255, 0, 0, 0.1);
                        border-radius: 4px;
                    `
                }
            });
            maxItem.createSpan({ text: '最高价', attr: { style: 'color: var(--text-muted);' } });
            maxItem.createSpan({ text: `${this.stats.max} 元/${this.currentData.unit}`, attr: { style: 'color: var(--text-normal); font-weight: bold;' } });

            // 历史最低价
            const minItem = statsGrid.createDiv({
                attr: { 
                    style: `
                        display: flex;
                        justify-content: space-between;
                        padding: 4px 8px;
                        background: rgba(0, 255, 0, 0.1);
                        border-radius: 4px;
                    `
                }
            });
            minItem.createSpan({ text: '最低价', attr: { style: 'color: var(--text-muted);' } });
            minItem.createSpan({ text: `${this.stats.min} 元/${this.currentData.unit}`, attr: { style: 'color: var(--text-normal); font-weight: bold;' } });

            // 历史平均价
            const avgItem = statsGrid.createDiv({
                attr: { 
                    style: `
                        display: flex;
                        justify-content: space-between;
                        padding: 4px 8px;
                        background: rgba(0, 100, 255, 0.1);
                        border-radius: 4px;
                    `
                }
            });
            avgItem.createSpan({ text: '平均价', attr: { style: 'color: var(--text-muted);' } });
            avgItem.createSpan({ text: `${this.stats.avg.toFixed(2)} 元/${this.currentData.unit}`, attr: { style: 'color: var(--text-normal); font-weight: bold;' } });

            // 历史中位数
            const medianItem = statsGrid.createDiv({
                attr: { 
                    style: `
                        display: flex;
                        justify-content: space-between;
                        padding: 4px 8px;
                        background: rgba(255, 165, 0, 0.1);
                        border-radius: 4px;
                    `
                }
            });
            medianItem.createSpan({ text: '中位数', attr: { style: 'color: var(--text-muted);' } });
            medianItem.createSpan({ text: `${this.stats.median} 元/${this.currentData.unit}`, attr: { style: 'color: var(--text-normal); font-weight: bold;' } });

            // 记录数统计
            const recordsInfo = statsCard.createDiv({
                attr: { 
                    style: `
                        text-align: center;
                        margin-top: 8px;
                        font-size: 0.9em;
                        color: var(--text-muted);
                    `
                }
            });
            recordsInfo.textContent = `共 ${this.stats.records} 条历史记录`;
        }

        // 关闭按钮
        const closeButton = mainContainer.createEl('button', {
            text: '关闭',
            attr: { 
                style: `
                    width: 100%;
                    padding: 8px 16px;
                    background: var(--interactive-accent);
                    color: var(--text-on-accent);
                    border: none;
                    border-radius: 4px;
                    font-size: 1em;
                    cursor: pointer;
                    margin-top: 16px;
                `
            }
        });
        closeButton.onclick = () => this.close();
    }

    onClose() {
        this.contentEl.empty();
    }

    /**
     * 根据评估状态获取背景色
     */
    getEvalColor(status) {
        switch (status) {
            case 'cheap': return 'rgba(34, 197, 94, 0.8)'; // green
            case 'expensive': return 'rgba(239, 68, 68, 0.8)'; // red
            case 'normal': return 'rgba(249, 115, 22, 0.8)'; // orange
            case 'first': return 'rgba(59, 130, 246, 0.8)'; // blue
            default: return 'rgba(156, 163, 175, 0.8)'; // gray
        }
    }

    /**
     * 根据评估状态获取边框色
     */
    getEvalBorderColor(status) {
        switch (status) {
            case 'cheap': return '#22c55e';
            case 'expensive': return '#ef4444';
            case 'normal': return '#f97316';
            case 'first': return '#3b82f6';
            default: return '#9ca3af';
        }
    }

    /**
     * 根据评估状态获取标题
     */
    getEvalTitle(status) {
        switch (status) {
            case 'cheap': return '🎉 价格实惠';
            case 'expensive': return '⚠️ 价格偏高';
            case 'normal': return '📊 价格正常';
            case 'first': return '📝 首条记录';
            default: return '❓ 状态未知';
        }
    }

    /**
     * 根据评估状态获取描述
     */
    getEvalDescription(stats) {
        if (stats.status === 'first') {
            return '这是该商品的首次价格记录，将作为后续比价的基准。';
        }
        
        const ratio = (this.currentData.price / stats.avg).toFixed(2);
        const percentChange = ((this.currentData.price - stats.avg) / stats.avg * 100).toFixed(1);
        
        switch (stats.status) {
            case 'cheap':
                return `当前价格比历史均价低 ${Math.abs(percentChange)}%，相当划算！`;
            case 'expensive':
                return `当前价格比历史均价高 ${percentChange}%，建议谨慎考虑。`;
            case 'normal':
                return `当前价格接近历史均价（${ratio}x），属于正常范围。`;
            default:
                return `当前价格与历史均价比率为 ${ratio}x。`;
        }
    }
}

class SmartInput extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        this.isSubmitting = false; // 防止重复提交
        this.autoSubmitTimer = null; // 自动提交定时器
        this.manualMode = false; // 手动输入模式：拒绝自动提交
        this.selectedProvider = '';
        this.selectedModel = '';
        this.selectedAccountLabel = 'Default';
        this.smartClassifyEnabled = !!this.plugin.settings.autoClassify;
    }
    
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        const header = this.containerEl.querySelector('.modal-header');
        if (header) {
            header.style.display = 'none';
        }

        this.containerEl.addClass('smart-input-modal-root');
        contentEl.addClass('smart-input-modal');
        
        // 标题容器
        const titleContainer = contentEl.createDiv({ cls: 'smart-input-title-container' });
        
        // SVG 图标 (Custom Smart Input Icon - Pen with Sparkles)
        const iconContainer = titleContainer.createDiv({ cls: 'smart-input-title-icon' });



        // SVG 图标 (Scheme D v2: AI Sparkles - 极简星光 - 优化版)
        // 核心理念：尺寸适中，线条轻盈但清晰 (30px / 1.7px)
        iconContainer.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>';

        
        // 标题文本
        titleContainer.createSpan({ cls: 'smart-input-title-text', text: '智能录入' });
        
        // 文本输入区域容器
        const textAreaContainer = contentEl.createEl('div', {
            cls: 'smart-input-textarea-container',
            attr: { style: 'position: relative;' }
        });
        
        // 文本输入区域
        this.textArea = textAreaContainer.createEl('textarea', {
            cls: 'smart-input-textarea',
            attr: {
                placeholder: '请输入内容...',
                rows: '3'
            }
        });

        const keepTextAreaFocus = () => {
            if (!this.textArea) return;
            setTimeout(() => {
                this.textArea.focus();
            }, 0);
        };

        const preventBlurOnPress = (el) => {
            el.addEventListener('mousedown', (event) => {
                event.preventDefault();
            });
            el.addEventListener('touchstart', (event) => {
                event.preventDefault();
                el.click();
            });
        };

        const resources = this.plugin.settings?.resources || {};
        const providerIds = Object.keys(resources);
        if (!this.plugin.settings.ui || typeof this.plugin.settings.ui !== 'object') this.plugin.settings.ui = {};
        if (!this.plugin.settings.ui.quickInput || typeof this.plugin.settings.ui.quickInput !== 'object') this.plugin.settings.ui.quickInput = {};
        const quickInput = this.plugin.settings.ui.quickInput;
        if (!quickInput.providerModels || typeof quickInput.providerModels !== 'object') quickInput.providerModels = {};

        const resolveProviderModel = (providerId) => {
            const models = resources?.[providerId]?.models || [];
            const strategy = this.plugin.settings?.strategy || {};
            let model = '';
            if (strategy.primary?.provider === providerId) model = strategy.primary.model;
            else if (strategy.backup?.provider === providerId) model = strategy.backup.model;
            if (!model) model = quickInput.providerModels?.[providerId];
            if (model && models.includes(model)) return model;
            return models[0] || '';
        };

        const resolveProviderAccount = (providerId) => {
            const strategy = this.plugin.settings?.strategy || {};
            let label = '';
            if (strategy.primary?.provider === providerId) label = strategy.primary.accountLabel;
            else if (strategy.backup?.provider === providerId) label = strategy.backup.accountLabel;
            if (!label) {
                const accounts = resources?.[providerId]?.accounts || [];
                label = accounts[0]?.label || 'Default';
            }
            return label || 'Default';
        };

        const preferredProvider = quickInput.provider || this.plugin.settings?.strategy?.primary?.provider || providerIds[0] || '';
        const initialProvider = providerIds.includes(preferredProvider) ? preferredProvider : (providerIds[0] || '');
        this.selectedProvider = initialProvider;
        this.selectedModel = resolveProviderModel(initialProvider);
        this.selectedAccountLabel = resolveProviderAccount(initialProvider);
        this.manualMode = quickInput.autoSubmit === false;

        const quickControls = textAreaContainer.createDiv({ cls: 'smart-input-quick-controls' });
        
        // --- 1. Provider Selector (Custom UI with Native Select) ---
        const providerWrap = quickControls.createDiv({ cls: 'sip-quick-toggle sip-provider-toggle' });
        providerWrap.classList.add('is-active'); // Always active/highlighted or just styled? User said "others no bg when unselected". Provider usually has a value. Let's keep it highlighted or just text? 
        // User said: "可选择的（服务商）右侧给一个非常小的svg下箭头...被选中时以底色和文字高亮来提示选中"
        // Provider is always "selected" (it has a value). So maybe it should look like the active toggles? Or just a button?
        // Let's make it look like a button that is always "active" (highlighted) or just subtle?
        // Actually, user said "others... when unselected". Implicitly Provider might be different. 
        // Let's treat Provider as always having a value, so maybe always "Active" style? Or just a clean button.
        // Let's stick to the "Active" style for Provider since it's a primary selection.
        
        // Sparkles Icon (Matching Header)
        providerWrap.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sip-icon"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>`;
        
        const providerLabel = providerWrap.createSpan({ cls: 'sip-btn-text', text: resources[initialProvider]?.name || initialProvider });
        
        // Chevron Down
        providerWrap.insertAdjacentHTML('beforeend', `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sip-chevron" style="margin-left: 4px; opacity: 0.5;"><path d="m6 9 6 6 6-6"/></svg>`);

        const providerSelect = providerWrap.createEl('select', { cls: 'sip-quick-select-overlay' });
        providerIds.forEach((pid) => {
            providerSelect.add(new Option(resources[pid]?.name || pid, pid));
        });
        providerSelect.value = initialProvider;

        const togglesWrap = quickControls.createDiv({ cls: 'sip-quick-toggles' });

        // --- 2. Think Toggle ---
        const thinkToggleBtn = togglesWrap.createEl('button', { cls: 'sip-quick-toggle', attr: { type: 'button' } });
        // Lightbulb Icon
        thinkToggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sip-icon"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2 1.5-3.5a6 6 0 0 0-11 0c0 1.5.5 2.5 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`;
        thinkToggleBtn.createSpan({ cls: 'sip-btn-text', text: '思考' });
        preventBlurOnPress(thinkToggleBtn);

        const syncThinkingToggle = () => {
            const providerConfig = resources?.[this.selectedProvider];
            const enabled = providerConfig ? !providerConfig.disableThinking : true;
            thinkToggleBtn.classList.toggle('is-active', !!enabled);
        };
        syncThinkingToggle();

        // --- 3. Auto Submit Toggle ---
        const autoToggleBtn = togglesWrap.createEl('button', { cls: 'sip-quick-toggle', attr: { type: 'button' } });
        // Zap Icon
        autoToggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sip-icon"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
        this.autoToggleLabel = autoToggleBtn.createSpan({ cls: 'sip-btn-text', text: '自动提交' });
        this.autoToggleButton = autoToggleBtn;
        autoToggleBtn.classList.toggle('is-active', !this.manualMode);
        preventBlurOnPress(autoToggleBtn);

        // --- 4. Classify Toggle ---
        const classifyToggleBtn = togglesWrap.createEl('button', { cls: 'sip-quick-toggle', attr: { type: 'button' } });
        // Tags Icon
        classifyToggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sip-icon"><path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"/><path d="M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z"/></svg>`;
        classifyToggleBtn.createSpan({ cls: 'sip-btn-text', text: '智能分类' });
        preventBlurOnPress(classifyToggleBtn);
        
        classifyToggleBtn.classList.toggle('is-active', !!this.smartClassifyEnabled);
        classifyToggleBtn.addEventListener('click', async () => {
            this.smartClassifyEnabled = !this.smartClassifyEnabled;
            this.plugin.settings.autoClassify = this.smartClassifyEnabled;
            classifyToggleBtn.classList.toggle('is-active', this.smartClassifyEnabled);
            await this.plugin.saveSettings();
            keepTextAreaFocus();
        });

        providerSelect.addEventListener('change', async () => {
            this.selectedProvider = providerSelect.value;
            providerLabel.textContent = resources[this.selectedProvider]?.name || this.selectedProvider; // Update label
            this.selectedModel = resolveProviderModel(this.selectedProvider);
            this.selectedAccountLabel = resolveProviderAccount(this.selectedProvider);
            quickInput.provider = this.selectedProvider;
            quickInput.providerModels[this.selectedProvider] = this.selectedModel;
            syncThinkingToggle();
            await this.plugin.saveSettings();
            this.updateCountdownDisplay();
            keepTextAreaFocus();
        });

        thinkToggleBtn.addEventListener('click', async () => {
            const providerConfig = resources?.[this.selectedProvider] || (resources[this.selectedProvider] = {});
            const currentEnabled = providerConfig ? !providerConfig.disableThinking : true;
            const nextEnabled = !currentEnabled;
            providerConfig.disableThinking = !nextEnabled;
            thinkToggleBtn.classList.toggle('is-active', nextEnabled);
            await this.plugin.saveSettings();
            keepTextAreaFocus();
        });

        autoToggleBtn.addEventListener('click', async () => {
            this.manualMode = !this.manualMode;
            quickInput.autoSubmit = !this.manualMode;
            if (this.countdownTimer) {
                clearInterval(this.countdownTimer);
                this.countdownTimer = null;
            }
            this.hasStartedCountdown = false;
            if (!this.manualMode && this.textArea.value.trim()) {
                this.hasStartedCountdown = true;
                this.resetCountdownTimer();
            } else {
                this.updateCountdownDisplay();
            }
            await this.plugin.saveSettings();
            keepTextAreaFocus();
        });

        // 倒计时提示已集成到复选框标签中
        this.countdownEl = null;
        this.updateCountdownDisplay();
        
        // 初始化倒计时相关变量
        this.countdownTimer = null;
        this.countdownSeconds = 5;
        this.hasStartedCountdown = false; // 标记是否已开始倒计时
        
        // 添加输入监听器，实现自动提交功能
        this.textArea.addEventListener('input', () => {
            if (this.manualMode) {
                this.updateCountdownDisplay();
                return;
            }
            // 第一次输入时开始倒计时
            if (!this.hasStartedCountdown && this.textArea.value.trim()) {
                this.hasStartedCountdown = true;
                this.resetCountdownTimer();
            } else if (this.hasStartedCountdown) {
                // 后续输入时重置倒计时
                this.resetCountdownTimer();
            }
        });
        
        // 添加键盘事件监听器
        this.textArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.saveContent();
            }
        });
        
        const actionRow = contentEl.createEl('div', {
            cls: 'smart-input-action-row'
        });
        const confirmButton = actionRow.createEl('button', {
            text: '确认',
            cls: 'sip-btn-confirm'
        });
        confirmButton.onclick = () => {
            this.saveContent();
        };
        
        setTimeout(() => {
            this.textArea.focus();
        }, 100);
    }
    
    // 重置倒计时定时器
    resetCountdownTimer() {
        // 清除现有定时器
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }
        
        // 重置倒计时秒数
        this.countdownSeconds = 5;
        this.updateCountdownDisplay();
        
        // 手动模式下不启动倒计时
        if (this.manualMode) return;
        // 启动新的倒计时
        this.startCountdown();
    }
    
    // 更新倒计时显示
    updateCountdownDisplay() {
        if (this.autoToggleLabel) {
            if (this.manualMode) {
                this.autoToggleLabel.textContent = '自动提交';
            } else if (this.hasStartedCountdown) {
                this.autoToggleLabel.textContent = `${this.countdownSeconds}s提交`;
            } else {
                this.autoToggleLabel.textContent = '自动提交';
            }
        }
        if (this.autoToggleButton) {
            this.autoToggleButton.classList.toggle('is-active', !this.manualMode);
        }
    }
    
    // 启动倒计时
    startCountdown() {
        // 手动模式：不启动倒计时
        if (this.manualMode) return;
        this.countdownTimer = setInterval(() => {
            this.countdownSeconds--;
            this.updateCountdownDisplay();
            
            // 倒计时结束，执行自动录入
            if (this.countdownSeconds <= 0) {
                clearInterval(this.countdownTimer);
                if (this.textArea && this.textArea.value.trim()) {
                    this.saveContent();
                }
            }
        }, 1000); // 每秒更新一次
    }
    
    async saveContent() {
        // 防止重复提交
        if (this.isSubmitting) {
            return;
        }
        
        const content = this.textArea.value.trim();
        if (!content) {
            new Notice('请输入内容');
            this.close(); // 输入框为空时也关闭弹窗
            return;
        }
        this.isSubmitting = true; // 设置提交状态

        const quickInput = this.plugin.settings?.ui?.quickInput || {};
        if (!quickInput.providerModels || typeof quickInput.providerModels !== 'object') quickInput.providerModels = {};
        if (this.selectedProvider) {
            quickInput.provider = this.selectedProvider;
            quickInput.providerModels[this.selectedProvider] = this.selectedModel;
        }
        quickInput.autoSubmit = !this.manualMode;
        if (!this.plugin.settings.ui) this.plugin.settings.ui = {};
        this.plugin.settings.ui.quickInput = quickInput;
        if (!this.plugin.settings.strategy) this.plugin.settings.strategy = { primary: {}, backup: {} };
        if (!this.plugin.settings.strategy.primary) this.plugin.settings.strategy.primary = { provider: '', model: '', accountLabel: 'Default' };
        this.plugin.settings.strategy.primary.provider = this.selectedProvider || this.plugin.settings.strategy.primary.provider;
        this.plugin.settings.strategy.primary.model = this.selectedModel || this.plugin.settings.strategy.primary.model;
        this.plugin.settings.strategy.primary.accountLabel = this.selectedAccountLabel || this.plugin.settings.strategy.primary.accountLabel || 'Default';
        this.plugin.saveSettings().catch(() => {});

        // 立即关闭弹窗，避免用户误以为未执行（适用于：自动提交 / 点击确认 / Enter键）
        this.close();

        // 清除自动提交定时器
        if (this.autoSubmitTimer) {
            clearTimeout(this.autoSubmitTimer);
            this.autoSubmitTimer = null;
        }

        try {
            // 记录录入起始时间，并重置本次记录的模型名
            this.plugin.processingStartAt = Date.now();
            this.plugin.lastSuccessfulAIModel = null;
            if (!this.smartClassifyEnabled) {
                await this.plugin.appendToCapture(content);
                return;
            }
            await this.plugin.classifyAndSave(content);
        } catch (error) {
            Logger.error('保存失败:', error);
            // 提供更详细的错误信息
            let errorMsg = '保存失败';
            if (error.message.includes('未找到') || error.message.includes('路径') || error.message.includes('权限') || error.message.includes('目录')) {
                errorMsg = '请检查路径与权限: ' + error.message;
            } else if (error.message.includes('API') || error.message.includes('网络') || error.message.includes('额度')) {
                errorMsg = 'AI服务异常: ' + error.message;
            } else {
                errorMsg = '保存失败: ' + error.message;
            }
            new Notice('❌ ' + errorMsg);
        } finally {
            this.isSubmitting = false; // 重置提交状态
        }
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
        
        // 清理定时器
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
        
        // 重置状态
        this.isSubmitting = false;
        this.hasStartedCountdown = false;
        this.manualMode = false;
        
        if (this.countdownEl) this.countdownEl.textContent = '';
    }
}

module.exports = SmartInputProPlugin;



// ========== 第一阶段：语义分类+文本优化 ==========

/**
 * 阶段一（子步骤A）：语义分类专用方法
 * 
 * 功能定位：
 * - 专为两阶段处理流程设计的分类方法，仅执行分类任务，不进行文本优化
 * - 作为新架构的核心组件，降低token消耗，提高处理效率
 * 
 * 处理流程：
 * - 构建专用分类提示词，基于语义理解将输入文本分类到预定义类别
 * - 统一路由调用AI服务，根据配置的首选/备选服务商自动选择
 * - 解析AI响应，提取分类结果，包含容错机制
 * - 记录详细的处理日志，便于调试和优化
 * 
 * 技术特点：
 * - 使用轻量级提示词设计，减少不必要的token消耗
 * - 内置9种预定义类别，覆盖常见使用场景
 * - 双重容错机制：JSON解析失败时尝试从纯文本中匹配
 * - 完整的日志记录，支持全链路追踪
 * 
 * @param {string} text - 需要分类的原始文本
 * @returns {Promise<Object>} 包含分类结果的对象 { category: string }
 */
SmartInputProPlugin.prototype.classifyCategoryOnly = async function(text) {
    // 流水：第一步开始（分类-only）
    await this.logPipelineEvent('stage1_start', { original_text: text, mode: 'classify_only' });
    // 【新增】获取动态宠物名单，防止 petNames is not defined 报错
    const petNames = this.getPetNamesList();
    const template = this.promptManager.getStage1Prompt();
    const prompt = this.renderPrompt(template, { text, petNames });

    await this.logPipelineEvent('stage1_prompt', { prompt });
    // 统一路由调用：根据首选/备选服务商+模型自动选择，并读取对应密钥
    const response = await this.callAIByProvider(prompt, null, 'stage1');
    
    await this.logPipelineEvent('stage1_response', { raw_response: response });
    const parsed = this.parseJSONRelaxed(response);
    const validCategories = ['bill', 'task', 'memo', 'contact', 'food_wishlist', 'code_dev', 'price_tracker', 'question_entry', 'study_record', 'pet_growth', 'other'];
    let category = parsed?.category;
    if (!category || !validCategories.includes(category)) {
        // 文本容错：尝试从纯文本中匹配
        const s = String(response).toLowerCase();
        category = validCategories.find(c => s.includes(c)) || 'other';
    }
    await this.logPipelineEvent('stage1_result', { category });
    // 兼容原日志：记录分类成功
    try {
        this.logAIError('semantic_classify_success', {
            original_text: text,
            category,
            optimized_text: undefined,
            timestamp: new Date().toLocaleString('zh-CN', { timeZone: Config.TIMEZONE })
        });
    } catch (_) {}
    // 当分类为 other 时，额外记录日志用于分析
    if (category === 'other') {
        this.logError('分类为杂项', null, {
            method: 'classifyCategoryOnly',
            input: text,
            reason: 'AI将输入分类为other类别'
        });
    }
    return { category };
};

/**
 * 阶段二文本优化器 - 按需优化输入文本
 * 
 * 设计理念：
 * - 智能判断是否需要优化：仅对特定类别执行优化
 * - 最小化Token消耗：避免不必要的AI调用
 * - 保持原始信息：优化过程中保留关键上下文
 * 
 * 优化策略：
 * 1. 跳过优化的类别：question_entry / study_record / bill
 *    - 这些类别需要保留原始表述的完整性
 *    - 直接使用原文进入第二阶段处理
 * 
 * 2. 执行优化的类别：task / memo / contact / food_wishlist / code_dev
 *    - 应用"口语文本提纯与润色"策略
 *    - 清理语音识别噪音和冗余表达
 *    - 保留关键信息和上下文名词
 * 
 * 技术特点：
 * - 使用详细的提示词工程，包含原则、策略和案例
 * - 支持时间信息恢复机制
 * - 完整的错误处理和降级逻辑
 * - 优化结果验证（长度阈值检查）
 * 
 * @param {string} text - 原始输入文本
 * @param {string} category - 文本分类结果
 * @returns {Promise<string>} 优化后的文本（失败时返回原文）
 */
SmartInputProPlugin.prototype.maybeOptimizeTextForStage2 = async function(text, category) {
    const moduleConf = this.settings?.modules?.[category];
    if (moduleConf) {
        if (moduleConf.enableOptimization !== true) return text;
    } else {
        const noOptimizeCategories = ['question_entry', 'study_record', 'bill', 'price_tracker'];
        if (noOptimizeCategories.includes(category)) return text;
    }
    try {
        const template = this.promptManager.getStage2Prompt();
        const prompt = this.renderPrompt(template, { text });

        await this.logPipelineEvent('stage1_opt_prompt', { prompt, category });
        const apiKey = null; // 交由统一路由读取对应服务商的密钥
        const resp = await this.callAIByProvider(prompt, apiKey, 'stage2');
        await this.logPipelineEvent('stage1_opt_response', { raw_response: resp, category });
        // 兼容模型返回 JSON 的情况，如 { "optimized_text": "..." }
        let optimizedRaw = String(resp || '').trim();
        const parsedObj = this.parseJSONRelaxed(optimizedRaw);
        let optimized = parsedObj?.optimized_text ? String(parsedObj.optimized_text).trim() : optimizedRaw;
        // 兜底：若模型返回异常或过短，使用原文
        if (!optimized || optimized.length < Math.min(10, text.length / 3)) return text;
        // 恢复可能丢失的时间信息（沿用既有辅助）
        const recovered = this.recoverTimeInfo(text, optimized);
        await this.logPipelineEvent('stage1_opt_result', { optimized_text: recovered, category });
        return recovered;
    } catch (e) {
        await this.logPipelineEvent('stage1_opt_degrade', { error: e?.message || String(e), category });
        return text;
    }
};

/**
 * 新架构核心方法：语义分类+文本优化统一处理
 * 这是新架构的第一步，负责对语音识别文本进行优化和六分类
 * @param {string} text - 用户输入的原始语音识别文本
 * @returns {Promise<Object>} 包含 category 和 optimized_text 的结果对象
 */
/* --- 阶段一处理：语义分类与文本优化 ---
 * 功能定位：
 * - 接收原始输入，进行口语文本提纯
 * - 基于语义进行六分类：bill/task/memo/contact/food_wishlist/other
 * - 输出 optimized_text 与 category
 */
// [移除] 旧版语义分类+优化合并函数 semanticClassifyAndOptimize，已拆分为 classifyCategoryOnly 与 maybeOptimizeTextForStage2

/* --- 通用辅助：题目复盘ID生成 ---
 * 功能定位：生成唯一的题目复盘ID（日期+当日记录数递增）
 */
// ========== 第二阶段：各分类专门处理 ==========
/**
 * AI服务统一路由调用接口
 * 
 * 功能定位：
 * - 为所有AI调用提供统一入口点
 * - 实现服务商和模型的动态路由
 * - 提供首选/备选服务商的自动降级机制
 * 
 * 路由逻辑：
 * 1. 读取首选服务商和模型配置
 * 2. 根据服务商类型调用对应的底层实现
 *    - minimax → callMiniMaxM2Anthropic
 *    - zhipu → callZhipuJSON
 *    - qwen → callQwenOpenAICompatible
 * 3. 首选服务商失败时自动降级到备选服务商
 * 4. 记录降级事件用于监控和优化
 * 
 * 技术特点：
 * - 支持Token消耗跟踪（可配置trackStage参数）
 * - 统一的错误处理和降级逻辑
 * - 服务商配置验证和API密钥获取
 * - 完整的日志记录和事件追踪
 * 
 * @param {string} prompt - 发送给AI的提示词
 * @param {string|null} apiKey - API密钥，为null时自动从配置获取
 * @param {string|null} trackStage - Token跟踪阶段标识（stage1/stage2）
 * @returns {Promise<string>} AI响应文本
 * @throws {Error} 当所有服务商均失败时抛出异常
 */
SmartInputProPlugin.prototype.callAIByProvider = async function(prompt, apiKey, trackStage = null) {
    const strategy = this.settings?.strategy || {};
    const primary = strategy.primary || {};
    const backup = strategy.backup || {};

    const preferredProvider = primary.provider || this.settings.preferredProvider;
    const preferredModel = primary.model || this.settings.preferredModel;
    const preferredAccountLabel = primary.accountLabel || 'Default';

    if (!preferredProvider) throw new Error('缺少主力服务商配置');
    if (!preferredModel) throw new Error('缺少主力模型配置');

    const backupEnabled = (backup.enabled !== false) && (this.settings.enableBackupModel !== false);
    const backupProvider = backup.provider || this.settings.backupProvider || preferredProvider;
    const backupModel = backup.model || this.settings.backupModel || (backupProvider === 'minimax' ? 'MiniMax-M2' : 'glm-4-flash');
    const backupAccountLabel = backup.accountLabel || 'Default';

    const isJsonRequest = /JSON/i.test(prompt);

    const callOnce = async (provider, model, accountLabel) => {
        const r = this.settings?.resources?.[provider];
        const legacy = this.settings?.providers?.[provider];
        const baseUrl = (r?.baseUrl || legacy?.baseUrl || '').trim();
        const key = apiKey || await this.getApiKey(provider, accountLabel);
        if (!key) throw new Error(`缺少服务商 ${provider} 的 API Key`);
        if (!baseUrl) throw new Error(`缺少服务商 ${provider} 的 Base URL`);
        return await this.unifiedCallAI({
            provider,
            model,
            apiKey: key,
            baseUrl,
            prompt,
            trackStage,
            jsonMode: isJsonRequest
        });
    };

    const now = new Date();
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (strategy.quotaBlockDate && strategy.quotaBlockDate !== dateKey) {
        strategy.quotaBlockDate = '';
        this.saveSettings().catch(()=>{});
    }

    const preferredBlockedToday = strategy.quotaBlockDate === dateKey;

    let firstTry = { p: preferredProvider, m: preferredModel, a: preferredAccountLabel };
    let secondTry = null;

    if (preferredBlockedToday) {
        if (backupEnabled) firstTry = { p: backupProvider, m: backupModel, a: backupAccountLabel };
    } else {
        if (backupEnabled) secondTry = { p: backupProvider, m: backupModel, a: backupAccountLabel };
    }

    try {
        return await callOnce(firstTry.p, firstTry.m, firstTry.a);
    } catch (e) {
        if (e.isQuota && firstTry.p === preferredProvider) {
            strategy.quotaBlockDate = dateKey;
            this.saveSettings().catch(()=>{});
            await this.logPipelineEvent('ai_block_preferred_today', { date: dateKey, reason: e.message });
        }

        if (secondTry) {
            await this.logPipelineEvent('ai_degrade', {
                reason: e.message,
                from: `${firstTry.p}:${firstTry.m}`,
                to: `${secondTry.p}:${secondTry.m}`
            });
            return await callOnce(secondTry.p, secondTry.m, secondTry.a);
        }

        throw e;
    }
};

/**
 * 账单处理模块 - 新架构第二步的专门化处理函数
 * 
 * @description 
 * ## 功能定位
 * 专门处理账单相关的文本，从优化后的文本中提取结构化账单信息，应用复杂的业务规则和术语映射，
 * 将处理结果写入财务系统文件，实现自动化记账流程。
 * 
 * ## 处理流程
 * 1. **AI提示词构建**：
 *    - 构建包含详细规则和参考数据的复杂提示词
 *    - 包含核心术语定义（如"月饼"指代小狗、"阿软"指代妻子）
 *    - 定义提取原则、字段规则和类别映射表
 *    - 提供多个处理示例作为参考
 * 
 * 2. **AI信息提取**：
 *    - 调用AI模型进行结构化信息提取
 *    - 解析JSON响应并验证数据完整性
 *    - 应用特殊逻辑规则（内部转移、内部转入、兼职收入等）
 *    - 处理中文货币表达（如"三块五"→3.50）
 * 
 * 3. **文件生成与保存**：
 *    - 构建标准账单记录格式
 *    - 生成唯一文件名（YYMMDD-编号-类别-场景.md）
 *    - 使用模板系统生成账单文件
 *    - 自动创建目录结构（年/月）
 * 
 * 4. **后处理与导航**：
 *    - 触发耐用品资产登记（非阻塞后台任务）
 *    - 自动打开并定位到新创建的账单文件
 *    - 提供用户反馈通知
 * 
 * ## 技术特点
 * - 复杂提示词工程：包含术语定义、提取规则和参考数据
 * - 特殊逻辑规则：处理内部转移、内部转入等特殊场景
 * - 中文货币解析：支持"三块五"等口语化表达
 * - 模板系统：使用占位符替换生成标准化账单
 * - 完整错误处理：失败时自动降级到INBOX
 * - 资产登记触发：耐用品自动触发资产登记流程
 * 
 * @param {string} optimizedText - 经过语义优化的账单文本
 * @returns {Promise<string|Object>} 处理后的账单文件路径或错误对象
 * @returns {string} returns.filePath - 成功时返回账单文件路径
 * @returns {boolean} returns.success - 失败时返回处理状态
 * @returns {string} returns.error - 失败时返回错误信息
 * @returns {string} returns.fallback - 失败时返回降级处理方式
 */
/* --- 阶段二处理（#1）：账单模块 (bill) ---
 * 账单处理模块 - 最终量产版 (2025-11-26 v3)
 * * 核心特性：
 * 1. 无缝兼容：完全适配现有 Markdown 模板与 Dataview 看板逻辑。
 * 2. 智能日期：基于基准时间推断相对日期（昨天、上周），实现“补录”功能。
 * 3. 批量录入：支持一次性输入多条账单。
 * 4. 语料溯源：精准截取单条账单对应的原始文本。
 * 5. 渠道泛化：支持“官方全称+卡种”的通用银行卡识别规则。
 * 6. 备注清洗：自动剔除“昨天/刚刚”等已固化为日期的相对时间词。
 * 7. 逻辑冲突解决：确立“支付工具 > 消费平台”的优先级。
 */
/**
 * 账单处理模块 - 新架构第二步的专门化处理函数
 * * @description 
 * ## 功能定位
 * 专门处理账单相关的文本，从优化后的文本中提取结构化账单信息，应用复杂的业务规则和术语映射，
 * 将处理结果写入财务系统文件，实现自动化记账流程。
 * * ## 处理流程
 * 1. **AI提示词构建**：
 * - 构建包含详细规则和参考数据的复杂提示词
 * - 包含核心术语定义（如"月饼"指代小狗、"阿软"指代妻子）
 * - 定义提取原则、字段规则和类别映射表
 * - 提供多个处理示例作为参考
 * * 2. **AI信息提取**：
 * - 调用AI模型进行结构化信息提取
 * - 解析JSON响应并验证数据完整性
 * - 应用特殊逻辑规则（内部转移、内部转入、兼职收入等）
 * - 处理中文货币表达（如"三块五"→3.50）
 * * 3. **文件生成与保存**：
 * - 构建标准账单记录格式
 * - 生成唯一文件名（YYMMDD-编号-类别-场景.md）
 * - 使用模板系统生成账单文件
 * - 自动创建目录结构（年/月）
 * * 4. **后处理与导航**：
 * - 触发耐用品资产登记（非阻塞后台任务）
 * - 自动打开并定位到新创建的账单文件
 * - 提供用户反馈通知
 * * ## 技术特点
 * - 复杂提示词工程：包含术语定义、提取规则和参考数据
 * - 特殊逻辑规则：处理内部转移、内部转入等特殊场景
 * - 中文货币解析：支持"三块五"等口语化表达
 * - 模板系统：使用占位符替换生成标准化账单
 * - 完整错误处理：失败时自动降级到INBOX
 * - 资产登记触发：耐用品自动触发资产登记流程
 * * @param {string} optimizedText - 经过语义优化的账单文本
 * @returns {Promise<string|Object>} 处理后的账单文件路径或错误对象
 * @returns {string} returns.filePath - 成功时返回账单文件路径
 * @returns {boolean} returns.success - 失败时返回处理状态
 * @returns {string} returns.error - 失败时返回错误信息
 * @returns {string} returns.fallback - 失败时返回降级处理方式
 */
/* --- 阶段二处理（#1）：账单模块 (bill) ---
 * 账单处理模块 - 最终量产版 (2025-11-26 v3 + 2026-01-01 跨年修正版)
 * * 核心特性：
 * 1. 无缝兼容：完全适配现有 Markdown 模板与 Dataview 看板逻辑。
 * 2. 智能日期：基于基准时间推断相对日期（昨天、上周），实现“补录”功能。
 * 3. 批量录入：支持一次性输入多条账单。
 * 4. 语料溯源：精准截取单条账单对应的原始文本。
 * 5. 渠道泛化：支持“官方全称+卡种”的通用银行卡识别规则。
 * 6. 备注清洗：自动剔除“昨天/刚刚”等已固化为日期的相对时间词。
 * 7. 逻辑冲突解决：确立“支付工具 > 消费平台”的优先级。
 * 8. 跨年修正：增加年份回溯机制，解决年初录入年末账单时的日期漂移问题。
 */
SmartInputProPlugin.prototype.processCategoryBill = async function(optimizedText) {
    try {
        try { new Notice('分流至「记账」模块，正在处理'); } catch (_) {}
        await this.logPipelineEvent('stage2_start', { module: 'bill', optimized_text: optimizedText });
        
        // 1. 准备基准时间 (Context)
        const sysNow = new Date();
        const sysDateStr = `${sysNow.getFullYear()}-${String(sysNow.getMonth() + 1).padStart(2, '0')}-${String(sysNow.getDate()).padStart(2, '0')}`;
        const weekDayStr = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][sysNow.getDay()];

        const template = this.promptManager.getModulePrompt('bill');
        const aiPrompt = this.renderPrompt(template, { sysDateStr, weekDayStr, optimizedText });


        // 2. AI 调用与解析
        await this.logPipelineEvent('stage2_prompt', { module: 'bill', prompt: aiPrompt });
        const aiResponse = await this.callAIByProvider(aiPrompt, null, 'stage2');
        await this.logPipelineEvent('stage2_response', { module: 'bill', raw_response: aiResponse });

        let parsedItems = this.parseJSONRelaxed(aiResponse);
        if (!parsedItems) {
            try { await appendAIErrorLog(this.app, { reason: '账单JSON格式错误', user_input: optimizedText, ai_raw: aiResponse }); } catch (_) {}
            await this.logPipelineEvent('stage2_degrade', { module: 'bill', error: 'JSON解析错误', optimized_text: optimizedText, raw_response: aiResponse });
            throw new Error('AI返回格式错误');
        }

        // 兼容单对象返回，强制转为数组
        if (!Array.isArray(parsedItems)) {
            parsedItems = [parsedItems];
        }

        const createdFiles = [];
        let successCount = 0;

        // 3. 循环处理每一条账单
        for (const item of parsedItems) {
            try {
                // ============================================================
                // [新增] 强制渠道标准化 (Code-Level Force Normalization)
                // 解决 AI 偶尔无视 Prompt 照搬原文 "拼多多支付" 的问题
                // ============================================================
                let ch = String(item.channel || '').trim();
                
                // a. 平台支付强制归一
                if (/拼多多|多多/.test(ch)) ch = '多多支付';
                else if (/美团/.test(ch)) ch = '美团支付';
                else if (/京东|白条/.test(ch)) ch = '京东支付';
                else if (/抖音/.test(ch)) ch = '抖音支付';
                else if (/滴滴/.test(ch)) ch = '滴滴支付';
                else if (/云闪付/.test(ch)) ch = '云闪付';
                
                // b. 支付工具强制归一
                else if (/微信/.test(ch)) ch = '微信支付';
                else if (/支付宝|花呗|余额宝/.test(ch)) ch = '支付宝';
                else if (/现金|Cash/i.test(ch)) ch = '现金支付';
                else if (/数字人民币/.test(ch)) ch = '数字人民币';
                
                // 将清洗后的值写回 item
                item.channel = ch;
                // ============================================================                // 数据完整性校验
                if (!item.type || !item.category || item.amount == null) {
                    try { await appendAIErrorLog(this.app, { reason: '账单数据不完整', item, user_input: optimizedText }); } catch (_) {}
                    continue; // 跳过无效条目
                }

                // 3.1 确定该条记录的业务发生日期 (Transaction Date)
                let txDate;
                if (item.date && /^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
                    // 如果AI解析出了日期
                    txDate = new Date();
                    const [y, m, d] = item.date.split('-').map(Number);
                    txDate.setFullYear(y);
                    txDate.setMonth(m - 1);
                    txDate.setDate(d);
                    // 保留当前时分秒
                    txDate.setHours(sysNow.getHours(), sysNow.getMinutes(), sysNow.getSeconds());
                } else {
                    // 否则使用当前系统时间
                    txDate = new Date();
                }

                // 3.2 默认规则兜底
                if (item.type === '收入' && item.category === '工资收入' && item.channel === '未知') {
                    item.channel = '中国建设银行储蓄卡';
                }
                if (item.type === '收入' && (/媳妇儿|媳妇|老婆|妻子|阿软|软软|咪总/.test(optimizedText)) && item.category === '家庭资助') {
                    item.category = '内部转入';
                }

                // 3.3 准备文件名变量
                const year = String(txDate.getFullYear());
                const month = String(txDate.getMonth() + 1).padStart(2, '0');
                const day = String(txDate.getDate()).padStart(2, '0');
                const shortDatePrefix = `${year.slice(-2)}${month}${day}`; // YYMMDD
                const dateStr = `${year}-${month}-${day}`;
                
                // 时间变量：create_date(审计用), timestamp(排序用), date(业务用)
                const createDateStr = sysNow.toISOString();
                const timeStr = `${String(txDate.getHours()).padStart(2,'0')}:${String(txDate.getMinutes()).padStart(2,'0')}:${String(txDate.getSeconds()).padStart(2,'0')}`;
                const timestamp = `${year}${month}${day}${String(txDate.getHours()).padStart(2,'0')}${String(txDate.getMinutes()).padStart(2,'0')}${String(txDate.getSeconds()).padStart(2,'0')}`;
                
                const quarter = 'Q' + Math.ceil((txDate.getMonth() + 1) / 3);
                const weekdays = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
                const weekday = weekdays[txDate.getDay()];
                const amountFixed = parseFloat(item.amount).toFixed(2);
                const signed_amount = `${item.type === '支出' ? '-' : '+'}¥${amountFixed}`;

                // 3.4 生成递增编号
                const targetPath = `${this.settings.billPath}/${year}/${month}`;
                await this.ensureDirectoryExists(targetPath);
                
                let fileNumber = 1;
                try {
                    const list = await this.app.vault.adapter.list(targetPath);
                    if (list && list.files) {
                        const todayFiles = list.files
                            .map(fp => fp.split('/').pop())
                            .filter(name => name && name.startsWith(shortDatePrefix));
                        const numbers = todayFiles.map(name => {
                            const m = name.match(/^\d{6}-(\d+)-/);
                            return m ? parseInt(m[1]) : 0;
                        });
                        if (numbers.length > 0) fileNumber = Math.max(...numbers) + 1;
                    }
                } catch (_) {}

                const filename = `${shortDatePrefix}-${String(fileNumber).padStart(2,'0')}-${item.category}-${item.subcategory}`;
                const filePath = `${targetPath}/${filename}.md`;

                // 3.5 模板变量替换
                const baseVariables = {
                    // 优先使用AI截取的 item_text
                    raw_input: item.item_text || optimizedText,
                    type: item.type,
                    category: item.category,
                    subcategory: item.subcategory || '未知',
                    channel: item.channel || '未知',
                    amount: amountFixed,
                    signed_amount: signed_amount,
                    note: item.note || '',
                    timestamp: timestamp,
                    create_date: createDateStr, 
                    date: dateStr, 
                    time: timeStr,
                    year: year,
                    month: month,
                    quarter: quarter,
                    weekday: weekday,
                    filename: filename
                };

                // 读取模板
                const templatePath = await this.ensureTemplatePathReady();
                if (!templatePath) throw new Error('未找到记账模板文件');
                const tplFile = this.app.vault.getAbstractFileByPath(templatePath);
                if (!tplFile) throw new Error(`模板文件不可访问：${templatePath}`);
                
                let templateContent = await this.app.vault.read(tplFile);
                templateContent = this.normalizeBillTemplatePlaceholders(templateContent);
                
                const placeholderKeys = new Set(Array.from(templateContent.matchAll(/\{\{VALUE:([a-zA-Z0-9_]+)\}\}/g)).map(m => m[1]));
                const variables = Object.fromEntries(Object.entries(baseVariables).filter(([key]) => placeholderKeys.has(key)));
                
                for (const [key, value] of Object.entries(variables)) {
                    const regex = new RegExp(`\\{\\{VALUE:${key}\\}\\}`, 'g');
                    templateContent = templateContent.replace(regex, value ?? '');
                }

                // 3.6 写入文件
                await this.app.vault.create(filePath, templateContent);
                createdFiles.push(filePath);
                successCount++;

                // 3.7 耐用品登记
                try {
                    const assetTriggers = ['电子产品', '家具家电', '装修硬装'];
                    if (assetTriggers.includes(item.subcategory)) {
                        this.helperLogAsset(this, baseVariables, baseVariables.raw_input).catch(err => {
                            try {
                                this.logError('helperLogAsset_background', err, {
                                    bill_data: baseVariables,
                                    original_text: optimizedText
                                });
                            } catch (_) {}
                        });
                    }
                } catch (_) {}

            } catch (innerErr) {
                Logger.error('单条账单处理失败:', innerErr);
                await this.logError(innerErr, { method: 'processCategoryBill_Loop', item });
            }
        }

        // 4. 结果反馈与跳转
        if (createdFiles.length > 0) {
            new Notice(`✅ 成功录入 ${successCount} 条账单`);
            const lastFile = createdFiles[createdFiles.length - 1];
            await this.navigateAfterSave(lastFile, { mode: 'line', line: 0 });
            return lastFile;
        } else {
            throw new Error('未能生成任何有效账单 (AI返回数据有效但写入过程失败)');
        }

    } catch (error) {
        // 全局降级处理
        await this.logError(error, {
            method: 'processCategoryBill',
            input: optimizedText,
            fallback_method: 'appendToCapture'
        });
        
        await this.logPipelineEvent('stage2_degrade', {
            error: error.message,
            original_text: optimizedText
        });
        
        new Notice('⚠️ 账单处理失败，已保存到捕获箱');
        
        const inboxPath = this.resolveCaptureInboxPath();
        const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        const fallbackContent = `\n\n---\n**时间**: ${timestamp}\n**内容**: ${optimizedText}\n**备注**: 账单处理失败: ${error.message}\n`;
        
        try {
            await this.appendToCapture(fallbackContent);
            await this.navigateAfterSave(inboxPath, { mode: 'search', searchText: fallbackContent });
            return { success: false, error: error.message, fallback: 'inbox' };
        } catch (fallbackError) {
            return { success: false, error: error.message, fallback_error: fallbackError.message };
        }
    }
};


/**
 * 处理SIP插件开发优化需求
 * @description 
 * ## 功能定位
 * 专门处理SIP(Smart Input Plugin)插件开发相关的需求收集与整理，将用户的插件开发想法
 * 提炼为结构化的任务条目并写入指定的需求收集文档。
 * 
 * ## 处理流程
 * 1. **需求解析**：使用AI模型解析用户输入，提取关键信息
 *    - 需求日期(due_date)：识别与需求相关的时间描述
 *    - 需求标题(task_title)：凝练核心可执行需求
 *    - 需求背景(task_context)：重构背景和动机信息
 *    - 标签(tags)：自动添加#SIP插件标签及相关标签
 * 
 * 2. **信息提取规则**：
 *    - 主从需求识别：区分核心需求与补充说明
 *    - 主语处理原则：严格保持原文主语风格
 *    - 关键定位信息：保留版本号、技术细节等
 *    - 信息归位：避免时间信息重复
 * 
 * 3. **文档更新**：将结构化需求写入指定路径的收集文档
 *    - 使用Obsidian任务格式：`- [ ] #SIP插件 需求标题`
 *    - 自动添加截止日期（如果有）
 *    - 背景信息作为子项目缩进显示
 * 
 * ## 技术特点
 * - 智能提炼：保持原始意图的同时理顺逻辑
 * - 绝对保真：保留个人口吻和所有关键信息
 * - 自动导航：处理后自动打开需求文档定位到新增内容
 * - 降级处理：失败时自动降级到通用处理流程
 * 
 * @param {string} optimizedText - 经过AI优化的用户输入文本
 * @returns {Promise<Object>} 处理结果对象
 * @returns {boolean} returns.success - 处理是否成功
 * @returns {string} returns.message - 处理结果描述信息
 * @returns {string} [returns.saved_to] - 需求保存的文件路径（成功时）
 */
/* --- 阶段二处理（#2）：代码开发模块 (code_dev) ---
 * 功能定位：提取代码开发、优化、测试等需求信息，写入指定的需求收集文档
 */
SmartInputProPlugin.prototype.processCategoryCodeDev = async function(optimizedText) {
    try {
        try { new Notice('分流至「代码开发」模块，正在处理'); } catch (_) {}
        await this.logPipelineEvent('stage2_start', { module: 'code_dev', optimized_text: optimizedText });
        const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
        
        const template = this.promptManager.getModulePrompt('code_dev');
        const prompt = this.renderPrompt(template, { currentDate, optimizedText });
        
        await this.logPipelineEvent('stage2_prompt', { module: 'code_dev', prompt });
        const response = await this.callAIByProvider(prompt, null, 'stage2');
        await this.logPipelineEvent('stage2_response', { module: 'code_dev', raw_response: response });
        const parsed = this.parseJSONRelaxed(response);

        if (parsed && parsed.task_title) {
            // 目标文件路径（使用相对路径）
            const requireFilePath = '01-经纬矩阵系统/08-智能录入模块/02-Require.md';
            
            // 获取或创建文件
            let requireFile = this.app.vault.getAbstractFileByPath(requireFilePath);
            if (!requireFile) {
                await this.app.vault.create(requireFilePath, `# 需求收集\n\n`);
                requireFile = this.app.vault.getAbstractFileByPath(requireFilePath);
            }
            
            // 构造Obsidian任务格式的需求条目
            let requirementEntry = `- [ ] ${parsed.task_title}`;
            
            // [NEW] 添加时间信息（在日期之前）
            if (parsed.time_info && parsed.time_info !== 'null') {
                requirementEntry += ` [${parsed.time_info}]`;
            }

            // 添加截止日期（如果有）
            if (parsed.due_date && parsed.due_date !== 'null') {
                requirementEntry += ` 📅 ${parsed.due_date}`;
            }
            
            requirementEntry += `\n`;
            
            // 添加背景信息作为子项目（如果有）
            if (parsed.task_context && parsed.task_context !== 'null') {
                requirementEntry += `  - ${parsed.task_context}\n`;
            }
            
            requirementEntry += `\n`;
            
            // [OPTIMIZED] 检查文件末尾内容，避免新旧任务混杂
            const currentContent = await this.app.vault.read(requireFile);
            const trimmedContent = currentContent.trimEnd();
            
            // 检查末尾是否是子任务（以两个空格开头的行）
            const lines = trimmedContent.split('\n');
            const lastLine = lines[lines.length - 1] || '';
            const isLastLineSubtask = lastLine.trim().startsWith('-') && lastLine.startsWith('  ');
            
            // 如果末尾是子任务，需要添加额外的空行来断开层级关系
            if (isLastLineSubtask) {
                requirementEntry = '\n' + requirementEntry;
            }
            
            await this.app.vault.append(requireFile, requirementEntry);
            
            this.logAIError('code_dev_process_success', {
                original_text: optimizedText,
                extracted: parsed,
                saved_to: requireFilePath,
                timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
            });
            await this.logPipelineEvent('stage2_result', { module: 'code_dev', parsed, saved_to: requireFilePath });

            new Notice(`✅ 开发需求已添加到需求收集文档`);
            
            // 自动打开并定位到需求文件（统一跳转模块）
            await this.navigateAfterSave(requireFilePath, 'end');
            
            return { success: true, message: `开发需求已添加到 ${requireFilePath}` };
        } else {
            throw new Error('Failed to extract Code Dev requirement information');
        }
    } catch (error) {
        // 记录错误日志
        await this.logError(error, {
            method: 'processCategoryCodeDev',
            input: optimizedText,
            fallback: 'processCategoryOther'
        });
        try { new Notice(`开发需求处理失败（错误原因：${error.message}），降级归入INBOX`); } catch (_) {}
        await this.logPipelineEvent('stage2_degrade', { module: 'code_dev', error: error.message, optimized_text: optimizedText });
        // 降级：直接保存到INBOX
        return await this.processCategoryOther(optimizedText);
    }
};

/**
 * 题目复盘处理方法：从优化后的文本中提取题目复盘信息并保存到对应的复盘文件
 * 这是新架构第二步的题目复盘专门处理函数，负责结构化处理题目复盘内容
 * @param {string} optimizedText - 经过语义优化的题目复盘文本
 * @returns {Promise<void>}
 */
/* --- 阶段二处理（#3）：题目录入模块 (question_entry) ---
 * 功能定位：提取题目信息，识别板块和题目标志，标准化题目内容并写入模板/目录
 */
SmartInputProPlugin.prototype.processCategoryQuestionEntry = async function(optimizedText) {
    try {
        try { new Notice('分流至「题目录入」模块，正在处理'); } catch (_) {}
        await this.logPipelineEvent('stage2_start', { module: 'question_entry', optimized_text: optimizedText });
        
        const template = this.promptManager.getModulePrompt('question_entry');
        const prompt = this.renderPrompt(template, { optimizedText });
        // 记录提示与调用
        await this.logPipelineEvent('stage2_prompt', { module: 'question_entry', prompt });
        const response = await this.callAIByProvider(prompt, null, 'stage2');
        await this.logPipelineEvent('stage2_response', { module: 'question_entry', raw_response: response });
        const parsed = this.parseJSONRelaxed(response);
        if (!parsed) {
            throw new Error('AI返回格式错误');
        }
        
        // 根据板块字段确定类型目录
        const sectionType = Config.SECTION_TYPE_MAPPING[parsed.section];
        if (!sectionType) {
            throw new Error(`未知的板块类型：${parsed.section}`);
        }
        
        // 构建文件路径和文件名
        const basePath = Config.QUESTION_ENTRY_BASE_PATH;
        const typeDir = `${basePath}/${sectionType}`;
        const fileName = `${parsed.section}-${parsed.question_identifier}.md`;
        const filePath = `${typeDir}/${fileName}`;
        
        // 确保目录存在
        await this.ensureDirectoryExists(typeDir);
        
        // 读取行测复盘模板文件
        const templatePath = Config.QUESTION_ENTRY_TEMPLATE_PATH;
        let templateContent;
        try {
            templateContent = await this.app.vault.adapter.read(templatePath);
        } catch (error) {
            throw new Error(`无法读取模板文件：${templatePath}，错误：${error.message}`);
        }
        
        // 将模板内容按行分割
        const templateLines = templateContent.split('\n');
        
        // 本地格式化：不调用大模型进行题目格式化
        // 目标：
        // - 将题干中的空白处替换为 `______`
        // - 保留“依次填入画横线部分最恰当的一项是：”这一提示语
        // - 将选项规范为 “- A. 选项内容” 的列表格式
        const phrase = '依次填入划横线部分最恰当的一项是：';
        const normalizeSpaces = (s) => s.replace(/\u00A0|\u3000/g, ' ');
        const raw = normalizeSpaces(optimizedText);
        const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

        // 拆分题干和选项
        let questionLines = [];
        let optionsSection = [];
        let i = 0; let phraseFound = false;
        while (i < lines.length) {
            const l = lines[i];
            if (l.includes(phrase)) { phraseFound = true; i++; break; }
            questionLines.push(l);
            i++;
        }
        while (i < lines.length) { optionsSection.push(lines[i]); i++; }

        // 题干合并并替换空白为 `______`
        let questionText = questionLines.join(' ');
        // 将 3 个及以上的连续空格（含不间断空格、全角空格）替换为占位符（更宽松）
        questionText = questionText.replace(/[ \u00A0\u3000]{3,}/g, '`______`');
        // 将连续下划线或长破折号替换为占位符
        questionText = questionText.replace(/_{3,}/g, '`______`');
        questionText = questionText.replace(/—{2,}/g, '`______`');

        // 解析选项为标准列表
        const optionList = [];
        const rawOptionContents = [];
        const letterOnlyRe = /^[A-D]$/;
        const letterWithDotRe = /^[A-D]\./;
        for (let j = 0; j < optionsSection.length; j++) {
            const l = optionsSection[j];
            if (letterOnlyRe.test(l)) {
                const letter = l;
                // 下一行作为内容
                let content = '';
                if (j + 1 < optionsSection.length) {
                    content = optionsSection[j + 1];
                    j++;
                }
                if (content) { optionList.push(`- ${letter}. ${content}`); rawOptionContents.push(content); }
            } else if (letterWithDotRe.test(l)) {
                const letter = l[0];
                const content = l.slice(2).trim();
                optionList.push(`- ${letter}. ${content}`);
                rawOptionContents.push(content);
            } else if (/^-\s*[A-D]\.\s*/.test(l)) {
                const letter = l.trim()[1];
                const content = l.replace(/^-.?[A-D]\.\s*/, '').trim();
                optionList.push(`- ${letter}. ${content}`);
                rawOptionContents.push(content);
            }
        }

        // 如果题干中仍未出现占位符，则尝试用选项词语进行回填：
        // 原理：若题干被“错误填充”为选项中的词语（例如出现了“隐藏”、“捷足先登”），
        // 则用 `______` 替换掉这些候选词，从而恢复空白。
        if (!/`______`/.test(questionText) && rawOptionContents.length > 0) {
            const tokenSet = new Set();
            for (const content of rawOptionContents) {
                // 以常见的中文/英文分隔符拆分为词语
                const tokens = content.split(/[，、。；：,;\s]+/).filter(t => t && t.length > 0);
                for (const t of tokens) tokenSet.add(t);
            }
            if (tokenSet.size > 0) {
                // 逐个词进行替换（中文通常无空格，直接匹配即可）
                for (const t of tokenSet) {
                    const safe = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    questionText = questionText.replace(new RegExp(safe, 'g'), '`______`');
                }
            }
        }

        // 输出组装：题干 + 提示语 + 选项
        let processedContent = questionText;
        // 仅在逻辑填空类型且题干中不包含提示语时，才添加提示语
        if (parsed.section === '逻辑填空' && !questionText.includes(phrase)) {
            processedContent += '\n' + phrase;
        } else if (parsed.section === '语句填空' && !questionText.includes('填入画横线部分最恰当的一句是')) {
            // 为语句填空类型添加适当的提示语
            processedContent += '\n填入画横线部分最恰当的一句是';
        }
        if (optionList.length > 0) {
            processedContent += '\n' + optionList.join('\n');
        } else {
            // 如果没有成功解析选项，尝试从原始文本中提取并格式化
            // 处理类似 "A 载体 激励 B 体现 训诫 C 内涵 塑造 D 象征 制约" 的情况
            const optionPattern = /([A-D])\s+([^A-D]+?)(?=[A-D]|$)/g;
            const options = [];
            let match;
            while ((match = optionPattern.exec(questionText)) !== null) {
                const letter = match[1];
                const content = match[2].trim();
                options.push(`- ${letter}. ${content}`);
            }
            
            // 如果找到了选项，从题干中移除这些选项
            if (options.length > 0) {
                questionText = questionText.replace(/[A-D]\s+[^A-D]+?(?=[A-D]|$)/g, '').trim();
                processedContent = questionText;
                // 仅在逻辑填空类型且题干中不包含提示语时，才添加提示语
                if (parsed.section === '逻辑填空' && !questionText.includes(phrase)) {
                    processedContent += '\n' + phrase;
                } else if (parsed.section === '语句填空' && !questionText.includes('填入画横线部分最恰当的一句是')) {
                    // 为语句填空类型添加适当的提示语
                    processedContent += '\n填入画横线部分最恰当的一句是';
                }
                processedContent += '\n' + options.join('\n');
            }
        }

        // 精确替换「### 题目原貌」与下一个分隔线“---”之间的所有行（不包含标题和分隔线本身）
        const headingIdx = templateLines.findIndex(l => l.trim() === '### 题目原貌');
        if (headingIdx !== -1) {
            let endIdx = -1;
            for (let i = headingIdx + 1; i < templateLines.length; i++) {
                if (templateLines[i].trim() === '---') { endIdx = i; break; }
            }
            if (endIdx !== -1) {
                const contentLines = processedContent.split('\n');
                // 替换范围：标题下一行到分隔线上一行（即 L11-18 之间的所有内容行）
                templateLines.splice(headingIdx + 1, endIdx - (headingIdx + 1), ...contentLines);
            }
        }
        
        // 更新frontmatter字段
        const currentDate = this.getCurrentDateISO(); // 使用通用辅助函数
        for (let i = 0; i < templateLines.length; i++) {
            if (templateLines[i].startsWith('keyword:')) {
                templateLines[i] = `keyword: ${parsed.question_identifier}`;
            } else if (templateLines[i].startsWith('module:')) {
                templateLines[i] = `module: ${parsed.section}`;
            } else if (templateLines[i].startsWith('submod:')) {
                templateLines[i] = `submod: ${sectionType}`;
            } else if (templateLines[i].startsWith('date:')) {
                templateLines[i] = `date: ${currentDate}`;
            }
        }
        
        // 重新组合内容
        const reviewContent = templateLines.join('\n');

        // 创建或覆盖文件
        if (await this.app.vault.adapter.exists(filePath)) {
            // 文件已存在，询问是否覆盖（这里直接覆盖）
            await this.app.vault.adapter.write(filePath, reviewContent);
            try { new Notice(`题目录入已更新：${fileName}`); } catch (_) {}
        } else {
            // 创建新文件
            await this.app.vault.create(filePath, reviewContent);
            try { new Notice(`题目录入已创建：${fileName}`); } catch (_) {}
        }

        // [NEW] 保存后跳转：统一通过 navigateAfterSave 执行
        // 对于题目录入模块，跳转到文件开头而不是末尾，方便用户查看题目内容
        await this.navigateAfterSave(filePath, { mode: 'line', line: 0 });
        
        await this.logPipelineEvent('question_entry_process_success', {
            module: 'question_entry',
            section: parsed.section,
            section_type: sectionType,
            question_identifier: parsed.question_identifier,
            file_path: filePath,
            type_dir: typeDir,
            mapping_used: `${parsed.section} -> ${sectionType}`,
            optimized_text: optimizedText
        });
        
        try { new Notice(`题目录入记录已保存：${fileName}`); } catch (_) {}
        
    } catch (error) {
        // 错误处理
        await this.logAIError('question_entry', {
            original_text: optimizedText,
            error: error.message,
            ai_response: error.response || 'No response',
            timestamp: new Date().toLocaleString('zh-CN', { timeZone: Config.TIMEZONE })
        });
        
        await this.logError(error, {
            method: 'processCategoryQuestionEntry',
            input: optimizedText,
            fallback: 'processCategoryOther'
        });
        
        try { new Notice(`题目录入处理失败（错误原因：${error.message}），已降级归入INBOX`); } catch (_) {}
        await this.logPipelineEvent('stage2_degrade', { module: 'question_entry', error: error.message, optimized_text: optimizedText });
        return await this.processCategoryOther(optimizedText);
    }
};

/**
 * 任务处理方法：从优化后的文本中提取结构化任务信息（标题+背景）并保存到周度委托文件
 * 这是新架构第二步的任务专门处理函数，负责结构化处理任务内容
 * @param {string} optimizedText - 经过语义优化的任务文本
 * @returns {Promise<Object>} 处理结果对象
 */
/* --- 阶段二处理（#4）：任务模块 (task) ---
 * 功能定位：提取任务标题/背景及相关日期，写入周度委托清单
 */
SmartInputProPlugin.prototype.processCategoryTask = async function(optimizedText) {
    try {
        try { new Notice('分流至「任务」模块，正在处理'); } catch (_) {}
        await this.logPipelineEvent('stage2_start', { module: 'task', optimized_text: optimizedText });
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD格式
        
        // [MODIFIED] 采用新的Prompt，提取 task_title 和 task_context
        const template = this.promptManager.getModulePrompt('task');
        const prompt = this.renderPrompt(template, { currentDate, optimizedText });

        await this.logPipelineEvent('stage2_prompt', { module: 'task', prompt });
        const response = await this.callAIByProvider(prompt, null, 'stage2');
        await this.logPipelineEvent('stage2_response', { module: 'task', raw_response: response });
        const parsed = this.parseJSONRelaxed(response);

        // [MODIFIED] 检查返回结果中是否包含关键的 task_title
        if (parsed && parsed.task_title) {
            // 获取当前周度委托文件路径
            const weeklyListPath = this.getWeeklyListPath(now);
            await this.ensureDirectoryExists(weeklyListPath.split('/').slice(0, -1).join('/'));
            
            let weeklyListFile = this.app.vault.getAbstractFileByPath(weeklyListPath);
            if (!weeklyListFile) {
                await this.app.vault.create(weeklyListPath, '\n');
                weeklyListFile = this.app.vault.getAbstractFileByPath(weeklyListPath);
            }
            
            // [MODIFIED] 全新的、智能的任务条目构造逻辑
            let taskLine;
            const dateString = parsed.due_date ? ` 📅 ${parsed.due_date}` : '';
            
            // [NEW] 插入时间信息
            const timeString = (parsed.time_info && parsed.time_info !== 'null') ? ` [${parsed.time_info}]` : '';
            
            const originalTaskTitle = String(parsed.task_title ?? '').trim();
            let finalTaskTitle = originalTaskTitle;
            if (parsed.due_date && String(parsed.due_date).trim() !== '') {
                const relativeDatePrefixRegex = /^\s*(?:今天|明天|后天|昨天|前天|今晚|今早|明早|明晚|本周|这周|下周|本星期|这星期|下星期|本月|这个月|下月|下个月)(?:[\s:：，,。.!！?？、\-—]+)?/g;
                const strippedTitle = originalTaskTitle.replace(relativeDatePrefixRegex, '').trim();
                finalTaskTitle = strippedTitle || originalTaskTitle;
            }
            
            const titleLine = `- [ ] ${finalTaskTitle}${timeString}${dateString}`;
            
            // 检查是否有任务背景（根据提示词，当原始输入简洁或无额外信息时，task_context可能为null）
            const hasContext = parsed.task_context && parsed.task_context.trim() !== '' && parsed.task_context !== 'null';
            
            // 如果存在任务背景，则使用 "主任务 + 缩进详情" 格式
            if (hasContext) {
                // 注意：这里的缩进是两个空格，这是标准的Markdown子列表格式
                const contextLine = `\n  - ${parsed.task_context}`; 
                taskLine = `\n${titleLine}${contextLine}\n`;
            } else {
                // 如果没有任务背景，则只使用单行主任务格式
                taskLine = `\n${titleLine}\n`;
            }
            
            // [OPTIMIZED] 检查文件末尾内容，避免新旧任务混杂
            const currentContent = await this.app.vault.read(weeklyListFile);
            const trimmedContent = currentContent.trimEnd();
            
            // 检查末尾是否是子任务（以两个空格开头的行）
            const lines = trimmedContent.split('\n');
            const lastLine = lines[lines.length - 1] || '';
            const isLastLineSubtask = lastLine.trim().startsWith('-') && lastLine.startsWith('  ');
            
            // 如果末尾是子任务，需要添加额外的空行来断开层级关系
            if (isLastLineSubtask) {
                taskLine = '\n' + taskLine;
            }
            
            await this.app.vault.append(weeklyListFile, taskLine);
            
            this.logAIError('task_process_success', {
                original_text: optimizedText,
                extracted: parsed,
                saved_to: weeklyListPath,
                timestamp: new Date().toLocaleString('zh-CN', { timeZone: Config.TIMEZONE })
            });
            await this.logPipelineEvent('stage2_result', { module: 'task', parsed, saved_to: weeklyListPath });

            // [MODIFIED] 通知内容使用更简洁的 task_title
            new Notice(`✅ 已添加到周委托：${finalTaskTitle}`);
            
            // 自动打开并定位到周度委托文件（统一跳转模块）
            await this.navigateAfterSave(weeklyListPath, 'end');
            
            return { success: true, message: `任务已添加到 ${weeklyListPath}` };
        } else {
            throw new Error('Failed to extract task title information');
        }
    } catch (error) {
        // 错误处理和降级逻辑保持不变
        await this.logError(error, {
            method: 'processCategoryTask',
            input: optimizedText,
            fallback: 'processCategoryOther'
        });
        try { new Notice(`任务处理失败（错误原因：${error.message}），降级归入INBOX`); } catch (_) {}
        await this.logPipelineEvent('stage2_degrade', { module: 'task', error: error.message, optimized_text: optimizedText });
        return await this.processCategoryOther(optimizedText);
    }
};

/**
	 * 刷题记录处理方法：从优化后的文本中提取刷题记录信息并保存到对应的记录文件
	 * 这是新架构第二步的刷题记录专门处理函数，负责结构化处理刷题记录内容
	 * @param {string} optimizedText - 经过语义优化的刷题记录文本
	 * @returns {Promise<void>}
	 */
/* --- 阶段二处理（#5）：刷题记录模块 (study_record) ---
 * 功能定位：提取刷题记录信息，生成格式化记录并写入对应板块文档
 */
SmartInputProPlugin.prototype.processCategoryStudyRecord = async function(optimizedText) {
    try {
        try { new Notice('分流至「刷题记录」模块，正在处理'); } catch (_) {}
        await this.logPipelineEvent('stage2_start', { module: 'study_record', optimized_text: optimizedText });
        const template = this.promptManager.getModulePrompt('study_record');
        const prompt = this.renderPrompt(template, { optimizedText });
        
        await this.logPipelineEvent('stage2_prompt', { module: 'study_record', prompt });
        const response = await this.callAIByProvider(prompt, null, 'stage2');
        await this.logPipelineEvent('stage2_response', { module: 'study_record', raw_response: response });
        const parsed = this.parseJSONRelaxed(response);

        if (parsed && parsed.section_name) {
            // 板块名称规范化与回退：当解析到的板块为通用“行测/综合”或为空时，尝试从原始文本推断，否则回退到默认板块
            const originalText = optimizedText || '';
            const rawSection = (parsed.section_name || '').trim();
            const sectionKeys = Object.keys(Config.SECTION_TYPE_MAPPING || {});
            const isGenericSection = !rawSection || /^(行测|综合)$/i.test(rawSection) || /行测|综合/i.test(rawSection);
            let finalSection = rawSection;
            let inferredSection = '';

            if (isGenericSection) {
                inferredSection = sectionKeys.find(k => originalText.includes(k)) || '';
                finalSection = inferredSection || (Config.STUDY_RECORD_DEFAULT_SECTION || '逻辑填空');
                await this.logPipelineEvent('stage2_section_fallback', { module: 'study_record', original_section: rawSection, inferred_section: inferredSection, final_section: finalSection });
            }
            // 数字字段规范化：确保字段为数字并在缺失时计算错误数，同时覆盖回写到 parsed 供后续使用
            parsed.section_name = finalSection;
            const totalQuestionsNum = Number(parsed.total_questions);
            const correctAnswersNum = Number(parsed.correct_answers);
            let wrongAnswersNum = Number(parsed.wrong_answers);
            parsed.total_questions = Number.isFinite(totalQuestionsNum) ? totalQuestionsNum : 0;
            parsed.correct_answers = Number.isFinite(correctAnswersNum) ? correctAnswersNum : 0;
            parsed.wrong_answers = Number.isFinite(wrongAnswersNum) ? wrongAnswersNum : (parsed.total_questions >= parsed.correct_answers ? (parsed.total_questions - parsed.correct_answers) : 0);

            // 计算正确率
            const correctRate = parsed.total_questions > 0 ? 
                ((parsed.correct_answers / parsed.total_questions) * 100).toFixed(1) + '%' : '0%';
            
            // 生成唯一ID（日期+当日记录数递增）
            const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const recordId = await this.generateStudyRecordId(today, finalSection);
            
            // 确定文件路径
            const fileName = `${finalSection}记录.md`;
            const filePath = `${Config.STUDY_RECORD_BASE_PATH}/${fileName}`;
            
            // 确保目录存在
            await this.ensureDirectoryExists(Config.STUDY_RECORD_BASE_PATH);
            
            // 获取或创建文件
            let recordFile = this.app.vault.getAbstractFileByPath(filePath);
            if (!recordFile) {
                const header = `# ${parsed.section_name}记录\n\n`;
                await this.app.vault.create(filePath, header);
                recordFile = this.app.vault.getAbstractFileByPath(filePath);
            }
            
            // 构造记录条目（按照标准格式：- 【ID-考试名称】用时，完成X道题，答对X道，答错X道, 正确率X%。）
            // 如果考试名称为空，则不显示考试名称部分
            const examNamePart = parsed.exam_name ? `${parsed.exam_name}` : '';
            const recordEntry = `- 【${recordId}-${examNamePart}${parsed.section_name}】${parsed.time_spent}，完成${parsed.total_questions}道题，答对${parsed.correct_answers}道，答错${parsed.wrong_answers}道，正确率${correctRate}。
`;
            
            await this.app.vault.append(recordFile, recordEntry);
            
            this.logAIError('study_record_process_success', {
                original_text: optimizedText,
                extracted: parsed,
                record_id: recordId,
                correct_rate: correctRate,
                saved_to: filePath,
                timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
            });
            await this.logPipelineEvent('stage2_result', { 
                module: 'study_record', 
                parsed, 
                record_id: recordId,
                correct_rate: correctRate,
                saved_to: filePath 
            });

            new Notice(`✅ 刷题记录已添加到 ${fileName}`);
            
            // 自动打开并定位到记录文件（统一跳转模块）
            await this.navigateAfterSave(filePath, 'end');
            
            return { success: true, message: `刷题记录已添加到 ${filePath}` };
        } else {
            throw new Error('Failed to extract study record information');
        }
    } catch (error) {
        // 记录错误日志
        await this.logError(error, {
            method: 'processCategoryStudyRecord',
            input: optimizedText,
            fallback: 'processCategoryOther'
        });
        try { new Notice(`刷题记录处理失败（错误原因：${error.message}），降级归入INBOX`); } catch (_) {}
        await this.logPipelineEvent('stage2_degrade', { module: 'study_record', error: error.message, optimized_text: optimizedText });
        // 降级：直接保存到INBOX
        return await this.processCategoryOther(optimizedText);
    }
};

/**
 * 备忘处理方法：从优化后的文本中提取备忘信息并保存到周度委托文件
 * 这是新架构第二步的备忘专门处理函数，负责结构化处理备忘内容
 * @param {string} optimizedText - 经过语义优化的备忘文本
 * @returns {Promise<Object>} 处理结果对象
 */
/* --- 阶段二处理（#6）：备忘模块 (memo) ---
 * 功能定位：提取备忘核心信息、相关日期与标签，写入INBOX或备忘列表
 */
SmartInputProPlugin.prototype.processCategoryMemo = async function(optimizedText) {
    try {
        try { new Notice('分流至「备忘」模块，正在处理'); } catch (_) {}
        await this.logPipelineEvent('stage2_start', { module: 'memo', optimized_text: optimizedText });
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD格式
        
        const template = this.promptManager.getModulePrompt('memo');
        const prompt = this.renderPrompt(template, { currentDate, optimizedText });
        await this.logPipelineEvent('stage2_prompt', { module: 'memo', prompt });
        const response = await this.callAIByProvider(prompt, null, 'stage2');
        await this.logPipelineEvent('stage2_response', { module: 'memo', raw_response: response });
        const parsed = this.parseJSONRelaxed(response);

        if (parsed && parsed.memo_content) {
            const memoPath = '01-经纬矩阵系统/03-备忘提醒模块/备忘录.md';
            await this.ensureDirectoryExists(memoPath.split('/').slice(0, -1).join('/'));
            
            let memoFile = this.app.vault.getAbstractFileByPath(memoPath);
            if (!memoFile) {
                await this.app.vault.create(memoPath, '\n');
                memoFile = this.app.vault.getAbstractFileByPath(memoPath);
            }
            
            // 按照旧版格式构造备忘条目
            const dateString = parsed.due_date ? ` 📅 ${parsed.due_date}` : '';
            
            // [NEW] 插入时间信息
            const timeString = (parsed.time_info && parsed.time_info !== 'null') ? ` [${parsed.time_info}]` : '';

            const rawMemoText = String(parsed.memo_content || '').trim();
            let memoLine = `\n- [ ] ${rawMemoText}${timeString}${dateString}\n`;
            
            // [OPTIMIZED] 检查文件末尾内容，避免新旧任务混杂
            const currentContent = await this.app.vault.read(memoFile);
            const trimmedContent = currentContent.trimEnd();
            
            // 检查末尾是否是子任务（以两个空格开头的行）
            const lines = trimmedContent.split('\n');
            const lastLine = lines[lines.length - 1] || '';
            const isLastLineSubtask = lastLine.trim().startsWith('-') && lastLine.startsWith('  ');
            
            // 如果末尾是子任务，需要添加额外的空行来断开层级关系
            if (isLastLineSubtask) {
                memoLine = '\n' + memoLine;
            }
            
            await this.app.vault.append(memoFile, memoLine);
            
            this.logAIError('memo_process_success', {
                original_text: optimizedText,
                extracted: parsed,
                saved_to: memoPath,
                timestamp: new Date().toLocaleString('zh-CN', { timeZone: Config.TIMEZONE })
            });
            await this.logPipelineEvent('stage2_result', { module: 'memo', parsed, saved_to: memoPath });

            new Notice(`✅ 已添加到备忘录：${parsed.memo_content}`);
            
            await this.navigateAfterSave(memoPath, 'end');
            
            return { success: true, message: `备忘已添加到 ${memoPath}` };
        } else {
            throw new Error('Failed to extract memo information');
        }
    } catch (error) {
        // 记录错误日志
        await this.logError(error, {
            method: 'processCategoryMemo',
            input: optimizedText,
            fallback: 'processCategoryOther'
        });
        try { new Notice(`备忘处理失败（错误原因：${error.message}），降级归入INBOX`); } catch (_) {}
        await this.logPipelineEvent('stage2_degrade', { module: 'memo', error: error.message, optimized_text: optimizedText });
        // 降级：直接保存到INBOX
        return await this.processCategoryOther(optimizedText);
    }
};

/**
 * 联系人处理方法：从优化后的文本中提取联系人信息并更新角色档案
 * 这是新架构第二步的联系人专门处理函数，负责结构化处理联系人内容
 * 
 * @description
 * 本方法专门处理联系人相关内容，通过AI提取关键信息并维护角色档案系统。
 * 支持新建联系人档案和更新现有联系人信息，确保联系人数据的完整性和一致性。
 * 
 * 功能定位：
 * - 从自由文本中提取结构化联系人信息
 * - 维护角色档案库的完整性和时效性
 * - 支持新建和更新两种操作模式
 * - 提供联系人信息的集中管理入口
 * 
 * 处理流程：
 * 1. 构建联系人信息提取提示词，包含姓名、电话、关系、备注等字段
 * 2. 调用AI服务提取结构化联系人信息
 * 3. 检查是否存在同名角色档案文件
 * 4. 若存在则更新现有档案（更新frontmatter中的电话字段）
 * 5. 若不存在则创建新档案（使用角色模板并填充信息）
 * 6. 记录处理日志并自动导航到相关文件
 * 
 * 技术特点：
 * - 智能信息提取，支持多种联系人信息格式
 * - 自动档案查找与匹配，避免重复创建
 * - 模板化档案创建，保持格式一致性
 * - 原子性操作，确保数据完整性
 * - 自动导航功能，提升用户体验
 * 
 * @param {string} optimizedText - 经过语义优化的联系人文本，包含联系人相关信息
 * @returns {Promise<Object>} 处理结果对象，包含以下字段：
 *   - success: boolean - 处理是否成功
 *   - message: string - 处理结果描述信息
 *   - 在失败情况下，降级调用processCategoryOther并返回其结果
 */
/* --- 阶段二处理（#7）：联系人模块 (contact) ---
 * 功能定位：提取姓名与电话号码并创建或更新联系人记录
 */
SmartInputProPlugin.prototype.processCategoryContact = async function(optimizedText) {
    try {
        try { new Notice('分流至「联系人」模块，正在处理'); } catch (_) {}
        await this.logPipelineEvent('stage2_start', { module: 'contact', optimized_text: optimizedText });
        const template = this.promptManager.getModulePrompt('contact');
        const prompt = this.renderPrompt(template, { optimizedText });
        await this.logPipelineEvent('stage2_prompt', { module: 'contact', prompt });
        const response = await this.callAIByProvider(prompt, null, 'stage2');
        await this.logPipelineEvent('stage2_response', { module: 'contact', raw_response: response });
        const parsed = this.parseJSONRelaxed(response);

        if (parsed && parsed.name && parsed.phone) {
            // 尝试找到对应的角色档案文件
            const roleFiles = this.app.vault.getMarkdownFiles().filter(file => 
                file.path.includes(Config.ROLE_BASE_PATH) && file.name.includes(parsed.name)
            );

            if (roleFiles.length > 0) {
                // 更新现有角色档案
                const roleFile = roleFiles[0];
                const content = await this.app.vault.read(roleFile);
                const updatedContent = this.updateFrontmatter(content, { tel: parsed.phone });
                await this.app.vault.modify(roleFile, updatedContent);
                
                this.logAIError('contact_update_success', {
                    original_text: optimizedText,
                    extracted: parsed,
                    updated_file: roleFile.path,
                    timestamp: new Date().toLocaleString('zh-CN', { timeZone: Config.TIMEZONE })
                });
                await this.logPipelineEvent('stage2_result', { module: 'contact', parsed, updated_file: roleFile.path });
                // 自动打开并定位到更新后的角色档案（统一跳转模块）
                await this.navigateAfterSave(roleFile.path, 'end');

                return { success: true, message: `已更新 ${parsed.name} 的电话信息` };
            } else {
                // 创建新的角色档案
                const newRolePath = `${Config.ROLE_BASE_PATH}/${parsed.name}.md`;
                const roleTemplate = await this.loadTemplate(Config.ROLE_TEMPLATE_PATH);
                const roleContent = roleTemplate
                    .replace(new RegExp(Config.ROLE_NAME_MARKER, 'g'), `name: ${parsed.name}`)
                    .replace(new RegExp(Config.ROLE_TEL_MARKER, 'g'), `tel: ${parsed.phone}`);
                
                await this.app.vault.create(newRolePath, roleContent);
                
                this.logAIError('contact_create_success', {
                    original_text: optimizedText,
                    extracted: parsed,
                    created_file: newRolePath,
                    timestamp: new Date().toLocaleString('zh-CN', { timeZone: Config.TIMEZONE })
                });
                await this.logPipelineEvent('stage2_result', { module: 'contact', parsed, created_file: newRolePath });
                // 自动打开并定位到新建的角色档案（统一跳转模块）
                await this.navigateAfterSave(newRolePath, 'end');

                return { success: true, message: `已创建 ${parsed.name} 的角色档案` };
            }
        } else {
            throw new Error('Failed to extract contact information');
        }
    } catch (error) {
        // 记录错误日志
        await this.logError(error, {
            method: 'processCategoryContact',
            input: optimizedText,
            fallback: 'processCategoryOther'
        });
        try { new Notice(`联系人处理失败（错误原因：${error.message}），降级归入INBOX`); } catch (_) {}
        await this.logPipelineEvent('stage2_degrade', { module: 'contact', error: error.message, optimized_text: optimizedText });
        // 降级：直接保存到INBOX
        return await this.processCategoryOther(optimizedText);
    }
};

/**
 * 美食清单处理方法：从优化后的文本中提取美食信息并追加到待尝清单
 * 这是新架构第二步的美食清单专门处理函数，负责结构化处理美食内容
 * 
 * @description
 * 本方法专门处理美食相关内容，通过AI提取关键信息并维护美食待尝清单。
 * 支持从自由文本中提取店铺名称、位置、菜系类型和特色信息，并格式化保存。
 * 
 * 功能定位：
 * - 从自由文本中提取结构化美食信息
 * - 维护美食待尝清单的完整性和时效性
 * - 支持多种美食信息格式的智能解析
 * - 提供美食探索记录的集中管理入口
 * 
 * 处理流程：
 * 1. 构建美食信息提取提示词，包含店名、位置、菜系、特色等字段
 * 2. 调用AI服务提取结构化美食信息
 * 3. 验证必要字段（店名）是否成功提取
 * 4. 构造格式化的待尝清单条目（Markdown格式）
 * 5. 追加条目到待尝清单文件（通过统一路径解析器）
 * 6. 记录处理日志并自动导航到新添加内容
 * 
 * 技术特点：
 * - 智能信息提取，支持多种美食信息格式
 * - 灵活的条目构造，适应不同信息完整度
 * - 统一文件路径解析，支持自定义路径配置
 * - 原子性操作，确保数据完整性
 * - 自动导航功能，支持按文本精确定位
 * 
 * @param {string} optimizedText - 经过语义优化的美食文本，包含美食相关信息
 * @returns {Promise<Object>} 处理结果对象，包含以下字段：
 *   - success: boolean - 处理是否成功
 *   - message: string - 处理结果描述信息
 *   - 在失败情况下，降级调用processCategoryOther并返回其结果
 */
/* --- 阶段二处理（#8）：美食收藏模块 (food_wishlist) ---
 * 功能定位：记录美食收藏信息，支持想去/去过状态、菜品收藏
 * 数据格式：单行格式，便于看板读取
 * 编号规则：YYMMDD + 两位序号（初始记录日期，不变）
 */
SmartInputProPlugin.prototype.processCategoryFoodWishlist = async function(optimizedText) {
    try {
        try { new Notice('分流至「美食收藏」模块，正在处理'); } catch (_) {}
        await this.logPipelineEvent('stage2_start', { module: 'food_wishlist', optimized_text: optimizedText });
        
        const wishlistFile = this.resolveFoodWishlistPath();
        const CACHE_TTL = 5 * 60 * 1000;
        let existingRecords = [];
        
        if (this._foodCollectionCache && Date.now() - this._foodCollectionCacheTime < CACHE_TTL) {
            existingRecords = this._foodCollectionCache;
        } else {
            const file = this.app.vault.getAbstractFileByPath(wishlistFile);
            if (file) {
                const fileContent = await this.app.vault.read(file);
                existingRecords = this.parseFoodCollectionLines(fileContent);
            }
            this._foodCollectionCache = existingRecords;
            this._foodCollectionCacheTime = Date.now();
        }
        
        const existingShops = existingRecords.map(r => r.shop).join('、');
        const template = this.promptManager.getModulePrompt('food_wishlist');
        const prompt = this.renderPrompt(template, { optimizedText, existingShops });
        await this.logPipelineEvent('stage2_prompt', { module: 'food_wishlist', prompt });
        
        const response = await this.callAIByProvider(prompt, null, 'stage2');
        await this.logPipelineEvent('stage2_response', { module: 'food_wishlist', raw_response: response });
        const parsed = this.parseJSONRelaxed(response);

        if (!parsed || !parsed.shop) {
            throw new Error('Failed to extract shop name');
        }

        const currentDate = new Date();
        const dateStr = currentDate.toISOString().slice(2, 10).replace(/-/g, '');
        
        let existingIndex = -1;
        
        if (parsed.location) {
            existingIndex = existingRecords.findIndex(r => 
                r.shop === parsed.shop && r.location === parsed.location
            );
        } else {
            existingIndex = existingRecords.findIndex(r => r.shop === parsed.shop);
        }
        
        if (existingIndex >= 0) {
            const existing = existingRecords[existingIndex];
            
            if (parsed.status === '去过' && existing.status === '想去') {
                existing.status = '去过';
            }
            
            if (parsed.cuisine && !existing.cuisine) {
                existing.cuisine = parsed.cuisine;
            }
            
            if (parsed.dishes && Array.isArray(parsed.dishes)) {
                if (!existing.dishes) existing.dishes = [];
                for (const dish of parsed.dishes) {
                    if (!existing.dishes.includes(dish)) {
                        existing.dishes.push(dish);
                    }
                }
            }
            
            existing.updated = currentDate.toISOString().slice(0, 10);
            
            try { new Notice(`已更新「${existing.shop}」的收藏信息`); } catch (_) {}
        } else {
            const todayRecords = existingRecords.filter(r => r.id && r.id.startsWith(dateStr));
            const todayIndex = todayRecords.length + 1;
            const newId = `${dateStr}${String(todayIndex).padStart(2, '0')}`;
            
            const newRecord = {
                id: newId,
                shop: parsed.shop,
                status: parsed.status || '想去',
                cuisine: parsed.cuisine || null,
                location: parsed.location || null,
                dishes: parsed.dishes || null,
                updated: currentDate.toISOString().slice(0, 10)
            };
            existingRecords.push(newRecord);
            
            try { new Notice(`已添加「${parsed.shop}」到美食收藏`); } catch (_) {}
        }
        
        const newContent = this.serializeFoodCollectionLines(existingRecords);
        await this.app.vault.adapter.write(wishlistFile, newContent);
        
        this._foodCollectionCache = existingRecords;
        this._foodCollectionCacheTime = Date.now();
        
        await this.navigateAfterSave(wishlistFile, parsed.shop);
        
        this.logAIError('food_wishlist_success', {
            original_text: optimizedText,
            extracted: parsed,
            saved_to: wishlistFile,
            timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
        });
        await this.logPipelineEvent('stage2_result', { module: 'food_wishlist', parsed, saved_to: wishlistFile });

        return { success: true, message: `美食收藏已更新` };
    } catch (error) {
        await this.logError(error, {
            method: 'processCategoryFoodWishlist',
            input: optimizedText,
            fallback_method: 'processCategoryOther'
        });
        try { new Notice(`美食收藏处理失败（${error.message}），降级归入INBOX`); } catch (_) {}
        await this.logPipelineEvent('stage2_degrade', { module: 'food_wishlist', error: error.message, optimized_text: optimizedText });
        
        return await this.processCategoryOther(optimizedText);
    }
};

/* --- 美食收藏辅助：解析单行格式记录 ---
 * 格式：- 编号 | 店名 | 状态：x | 菜系：x | 地址：x | 菜品：x | 更新：x
 */
SmartInputProPlugin.prototype.parseFoodCollectionLines = function(content) {
    const records = [];
    if (!content || !content.trim()) return records;
    
    const lines = content.split('\n').filter(line => line.trim().startsWith('-'));
    
    for (const line of lines) {
        const record = {};
        const parts = line.split('|').map(p => p.trim());
        
        if (parts.length < 2) continue;
        
        record.id = parts[0].replace(/^-/, '').trim();
        record.shop = (parts[1] || '').replace(/^\*\*|\*\*$/g, '');
        
        for (let i = 2; i < parts.length; i++) {
            const part = parts[i];
            if (part.startsWith('状态：')) {
                record.status = part.replace('状态：', '');
            } else if (part.startsWith('菜系：')) {
                record.cuisine = part.replace('菜系：', '') || null;
            } else if (part.startsWith('地址：')) {
                record.location = part.replace('地址：', '') || null;
            } else if (part.startsWith('菜品：')) {
                const dishesStr = part.replace('菜品：', '');
                record.dishes = dishesStr ? dishesStr.split(',').map(d => d.trim()) : null;
            } else if (part.startsWith('更新：')) {
                record.updated = part.replace('更新：', '');
            }
        }
        
        if (record.shop) {
            records.push(record);
        }
    }
    
    return records;
};

/* --- 美食收藏辅助：序列化为单行格式 ---
 */
SmartInputProPlugin.prototype.serializeFoodCollectionLines = function(records) {
    const lines = [];
    
    for (const record of records) {
        const parts = [`- ${record.id}`, `**${record.shop}**`];
        
        if (record.status) parts.push(`状态：${record.status}`);
        if (record.cuisine) parts.push(`菜系：${record.cuisine}`);
        if (record.location) parts.push(`地址：${record.location}`);
        if (record.dishes && record.dishes.length > 0) parts.push(`菜品：${record.dishes.join(',')}`);
        if (record.updated) parts.push(`更新：${record.updated}`);
        
        lines.push(parts.join(' | '));
    }
    
    return lines.join('\n');
};

/**
 * 其他内容处理方法：将优化后的文本直接录入INBOX
 * 这是新架构第二步的其他内容专门处理函数，作为降级处理机制
 * 
 * @description
 * 本方法是新架构第二步的兜底处理函数，用于处理所有无法归类到特定模块的内容。
 * 作为整个智能处理流程的最后防线，确保任何输入都能得到妥善保存，不会丢失。
 * 
 * 功能定位：
 * - 作为所有专门处理模块的降级目标
 * - 提供最小化格式的快速保存机制
 * - 维护系统鲁棒性，确保内容不丢失
 * 
 * 处理流程：
 * 1. 获取INBOX文件路径（通过统一路径解析器）
 * 2. 构造最小格式的条目（前缀短横线 + 空格 + 内容）
 * 3. 追加内容到INBOX文件（自动处理文件不存在的情况）
 * 4. 记录处理日志和用户通知
 * 5. 自动导航到INBOX文件并定位到新添加内容
 * 
 * 技术特点：
 * - 极简处理逻辑，最大程度保证成功率
 * - 统一文件路径解析，支持自定义路径配置
 * - 自动文件创建与目录结构维护
 * - 完整的错误处理与日志记录
 * - 自动导航功能，提升用户体验
 * 
 * @param {string} optimizedText - 经过语义优化的其他类型文本，通常是第一步处理后的结果
 * @returns {Promise<Object>} 处理结果对象，包含以下字段：
 *   - success: boolean - 处理是否成功
 *   - message: string - 处理结果描述信息
 *   - 在失败情况下，仅包含success:false和基本错误信息
 */



/* ============================================================
 * 阶段二处理（#9）：价格追踪模块 (price_tracker) - 最终量产版
 * ============================================================
 * 核心特性：
 * 1. 场景定义: 询价/比价场景 (非记账)。
 * 2. 模型: 零售容器模型 (Retail Container Model)。
 * 3. 容错: 针对无规格商品 (如"5元一包") 增加兜底逻辑。
 */

SmartInputProPlugin.prototype.processCategoryPriceTracker = async function(optimizedText) {
    try {
        try { new Notice('正在分析价格数据...'); } catch (_) {}
        await this.logPipelineEvent('stage2_start', { module: 'price_tracker', optimized_text: optimizedText });
        
        const template = this.promptManager.getModulePrompt('price_tracker');
        const aiPrompt = this.renderPrompt(template, { optimizedText });
        
        await this.logPipelineEvent('stage2_prompt', { module: 'price_tracker', prompt: aiPrompt });
        const aiResponse = await this.callAIByProvider(aiPrompt, null, 'stage2');
        let items = this.parseJSONRelaxed(aiResponse);
        
        if (!Array.isArray(items)) items = [items];
        if (!items || items.length === 0 || !items[0].product_name) throw new Error('AI解析失败或数据为空');

        // 2. 逻辑分流
        if (items.length > 1) {
            // PK模式：先静默归档，再比价
            for (const item of items) {
                await this.archiveSingleItem(item, true);
            }
            return await this.handlePriceComparison(items);
        } else {
            // 归档模式
            return await this.archiveSingleItem(items[0], false);
        }

    } catch (error) {
        Logger.error('Price tracker failed:', error);
        new Notice('❌ 处理失败，已存入INBOX');
        return await this.processCategoryOther(optimizedText);
    }
};

/**
 * 子功能 A：单商品归档 (双轨计算 + 兜底逻辑)
 */
SmartInputProPlugin.prototype.archiveSingleItem = async function(item, silent = false) {
    const baseDir = this.settings.priceTrackPath || Config.PRICE_TRACK_PATH;
    await this.ensureDirectoryExists(baseDir);
    
    // 1. 智能匹配文件名
    const cleanName = item.product_name.replace(/[\\/:*?"<>|]/g, '').trim();
    let targetName = `${cleanName}.md`;
    
    const files = this.app.vault.getFiles().filter(f => f.path.startsWith(baseDir));
    const targetFile = files.find(f => f.basename === cleanName || f.basename.includes(cleanName) || cleanName.includes(f.basename));
    if (targetFile) targetName = targetFile.name;
    const filePath = `${baseDir}/${targetName}`;

    // 2. 核心计算逻辑 (双轨制)
    
    // A. 零售维度 (Retail Track)
    // 零售单价 = 总价 / 报价数量
    const retailPrice = (item.total_price / (item.quote_qty || 1)).toFixed(2);
    
    // B. 规格描述 (Spec String)
    let specStr = "标准";
    if (item.atom_value && item.atom_value !== 1 && item.atom_unit !== item.item_unit) {
        // 只有当原子单位不是"包/个"这种自身单位时，才显示规格
        if (item.pack_count > 1) {
            specStr = `${item.pack_count}x${item.atom_value}${item.atom_unit}`;
        } else {
            specStr = `${item.atom_value}${item.atom_unit}`;
        }
    } else if (item.pack_count > 1) {
        // 比如 "一袋子10个苹果" (无重量)
        specStr = `${item.pack_count}x${item.item_unit}`;
    }

    // C. 真值维度 (SUP Track)
    const totalItems = (item.quote_qty || 1) * (item.pack_count || 1);
    const totalAtomicAmount = totalItems * (item.atom_value || 1);
    
    let supPrice = 0;
    let supUnit = item.atom_unit;

    // 归一化逻辑 (含兜底)
    if (['ml', 'g', '毫升', '克'].includes(item.atom_unit.toLowerCase())) {
        // 液体/重量：按 100单位 计价
        supPrice = (item.total_price / totalAtomicAmount) * 100;
        supUnit = item.atom_unit.toLowerCase().includes('l') ? '100ml' : '100g';
    } else if (['l', 'kg', '千克', '升'].includes(item.atom_unit.toLowerCase())) {
        // 大容量：按 1单位 计价
        supPrice = item.total_price / totalAtomicAmount;
    } else {
        // 兜底：非计量单位 (如 包/个) -> 真值 = 单个零售单位的价格
        // 比如：10元1箱(20袋)，真值 = 0.5元/袋
        supPrice = item.total_price / totalItems;
        supUnit = item.item_unit; 
    }
    if (!isFinite(supPrice)) supPrice = 0;

    // 3. 构造全量数据行
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const noteStr = item.notes ? ` (📝 ${item.notes})` : "";
    
    // [price] = 零售价, [unit] = 报价单位, [sup] = 真值价, [sup_unit] = 真值单位
    const dataLine = `- ${dateStr} [item:: ${item.product_name}] [price:: ${retailPrice}] [unit:: ${item.quote_unit}] [sup:: ${supPrice.toFixed(2)}] [sup_unit:: ${supUnit}] [spec:: ${specStr}] [location:: ${item.location}] [desc:: ${item.quote_qty}${item.quote_unit}*${item.pack_count}]${noteStr}`;

    // 4. 写入文件
    const file = this.app.vault.getAbstractFileByPath(filePath);
    const FILE_HEADER = `### 价格追踪\n\`\`\`dataviewjs\ndv.view("08-科技树系统/01-OB_LifeOS_Build/00-通用模块库/price_dashboard")\n\`\`\`\n\n### 历史记录\n`;

    if (!file) {
        await this.app.vault.create(filePath, FILE_HEADER + dataLine);
    } else {
        let content = await this.app.vault.read(file);
        if (!content.includes('### 历史记录')) content += '\n\n### 历史记录\n';
        let lines = content.split('\n');
        let historyIndex = lines.findIndex(l => l.trim() === '### 历史记录');
        if (historyIndex === -1) { lines.push('### 历史记录'); historyIndex = lines.length - 1; }
        lines.splice(historyIndex + 1, 0, dataLine);
        await this.app.vault.modify(file, lines.join('\n'));
    }

    if (!silent) {
        new Notice(`✅ 已记录：${item.product_name} (SUP: ¥${supPrice.toFixed(2)}/${supUnit})`);
        await this.navigateAfterSave(filePath, { mode: 'search', searchText: '### 历史记录' });
        await this.switchToReadingView();
    }
    return filePath;
};

/**
 * 子功能 B：比价看板 (逻辑同步)
 */
SmartInputProPlugin.prototype.handlePriceComparison = async function(items) {
    const comparisonPath = '05-生活坐标系统/05-消费决策/实时比价看板.md';
    const parentDir = comparisonPath.substring(0, comparisonPath.lastIndexOf('/'));
    await this.ensureDirectoryExists(parentDir);

    // 计算逻辑与 archiveSingleItem 保持完全一致
    const calculatedItems = items.map(item => {
        const retailPrice = (item.total_price / (item.quote_qty || 1)).toFixed(2);
        
        const totalItems = (item.quote_qty || 1) * (item.pack_count || 1);
        const totalAtomicAmount = totalItems * (item.atom_value || 1);
        let stdPrice = 0;
        let stdUnit = item.atom_unit;
        
        if (['ml', 'g', '毫升', '克'].includes(item.atom_unit.toLowerCase())) {
            stdPrice = (item.total_price / totalAtomicAmount) * 100;
            stdUnit = item.atom_unit.toLowerCase().includes('l') ? '100ml' : '100g';
        } else if (['l', 'kg', '千克', '升'].includes(item.atom_unit.toLowerCase())) {
            stdPrice = item.total_price / totalAtomicAmount;
        } else {
            stdPrice = item.total_price / totalItems;
            stdUnit = item.item_unit;
        }
        if (!isFinite(stdPrice)) stdPrice = 0;
        
        // 规格描述
        let specDesc = "标准";
        if (item.atom_value && item.atom_value !== 1 && item.atom_unit !== item.item_unit) {
            specDesc = (item.pack_count > 1) 
                ? `${item.pack_count}x${item.atom_value}${item.atom_unit}`
                : `${item.atom_value}${item.atom_unit}`;
        } else if (item.pack_count > 1) {
            specDesc = `${item.pack_count}x${item.item_unit}`;
        }
        
        return { ...item, stdPrice, stdUnit, retailPrice, specDesc };
    });

    calculatedItems.sort((a, b) => a.stdPrice - b.stdPrice);
    const winner = calculatedItems[0];

    const rows = calculatedItems.map((item, idx) => {
        const isWin = idx === 0;
        const style = isWin ? 'border: 2px solid #10b981; background: rgba(16, 185, 129, 0.05);' : 'border: 1px solid var(--background-modifier-border);';
        const badge = isWin ? '<span style="color:#10b981; font-weight:bold; font-size:0.8em; margin-left:8px;">👑 推荐</span>' : '';

        return `
        <div style="padding:12px; margin-bottom:8px; border-radius:8px; ${style} display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-weight:bold; color:var(--text-normal);">${item.product_name}${badge}</div>
                <div style="font-size:0.8em; color:var(--text-muted); margin-top:2px;">
                    零售 ¥${item.retailPrice}/${item.quote_unit} | 规格 ${item.specDesc}
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:1.4em; font-weight:800; color:${isWin ? '#10b981' : 'var(--text-normal)'};">
                    ¥${item.stdPrice.toFixed(2)}
                </div>
                <div style="font-size:0.75em; opacity:0.6;">/${item.stdUnit}</div>
            </div>
        </div>`;
    }).join('');

    const content = `\n> 生成时间: ${new Date().toLocaleString()}\n\n<div style="padding:16px;">${rows}</div>`;

    const f = this.app.vault.getAbstractFileByPath(comparisonPath);
    if (f) await this.app.vault.modify(f, content);
    else await this.app.vault.create(comparisonPath, content);

    new Notice(`⚖️ 比价推荐：${winner.product_name}`);
    await this.navigateAfterSave(comparisonPath, 'line:0');
    await this.switchToReadingView();
    return comparisonPath;
};

/* ============================================================
/* --- 阶段二处理（#10）：宠物成长模块 (pet_growth) [REVAMPED] ---
 * 功能：解析体重/健康信息，支持别名查找，写入 hidden log-stream (%%) 区域
 */
SmartInputProPlugin.prototype.processCategoryPetGrowth = async function(optimizedText) {
    try {
        try { new Notice('分流至「宠物成长」模块，正在处理'); } catch (_) {}
        await this.logPipelineEvent('stage2_start', { module: 'pet_growth', optimized_text: optimizedText });
        
        // 1. 获取动态名单
        const petNames = this.getPetNamesList();

        const template = this.promptManager.getModulePrompt('pet_growth');
        const prompt = this.renderPrompt(template, { petNames, currentDate: this.getCurrentDateISO(), optimizedText });

        // 3. 调用 AI
        await this.logPipelineEvent('stage2_prompt', { module: 'pet_growth', prompt });
        const response = await this.callAIByProvider(prompt, null, 'stage2');
        const parsed = this.parseJSONRelaxed(response);

        if (parsed && parsed.name) {
            // 4. 智能寻找文件
            const baseDir = this.settings?.petFamilyPath || Config.PET_FAMILY_PATH; 
            const files = this.app.vault.getMarkdownFiles().filter(f => f.path.includes(baseDir));
            
            const targetName = parsed.name.toLowerCase();
            const targetFile = files.find(f => {
                const cache = this.app.metadataCache.getFileCache(f);
                const fm = cache?.frontmatter;
                if (fm && fm.name && String(fm.name).toLowerCase() === targetName) return true;
                if (fm && fm.aliases) {
                    const aliases = Array.isArray(fm.aliases) ? fm.aliases : [fm.aliases];
                    if (aliases.some(a => String(a).toLowerCase() === targetName)) return true;
                }
                return f.basename.toLowerCase() === targetName;
            });

            if (!targetFile) throw new Error(`未找到角色档案：${parsed.name}`);

            // 5. 构造新条目内容
            // 格式：
            // # YYYY-MM-DD
            // [weight:: xxx]
            // 内容...
            let entryContent = `\n# ${parsed.date}`;
            let logMessage = "";

            if (parsed.weight_g !== null && parsed.weight_g !== undefined) {
                entryContent += `\n[weight:: ${parsed.weight_g}]`;
                logMessage += `体重${parsed.weight_g}g `;
            }
            if (parsed.note) {
                entryContent += `\n${parsed.note}`;
                logMessage += parsed.note;
            } else {
                if(!logMessage) logMessage = "记录已更新";
            }
            entryContent += `\n`; // 保持块的独立性

            // 6. 写入文件 (Log-Stream 模式)
            let content = await this.app.vault.read(targetFile);
            
            // 检测是否存在 %% 数据区
            const blockRegex = /^%%[\r\n]+([\s\S]*?)%%$/m;
            const match = content.match(blockRegex);

            if (match) {
                // 存在 %% 块，插入到 %% 标记后的第一行（倒序）
                const startIndex = match.index + 2; // "%%".length
                // 检查换行符，确保插入位置干净
                const before = content.slice(0, startIndex);
                const after = content.slice(startIndex);
                // 确保新条目和前后有换行，避免粘连
                const insertion = content[startIndex] === '\n' ? entryContent : `\n${entryContent}`;
                content = before + insertion + after;
            } else {
                // 不存在 %% 块，在文件末尾新建
                content = content.trimEnd() + `\n\n%%\n${entryContent}%%\n`;
            }
            
            await this.app.vault.modify(targetFile, content);

            // 7. 收尾
            new Notice(`✅ 记录成功至《${targetFile.basename}》`);
            await this.navigateAfterSave(targetFile.path, parsed.date); // 定位到日期
            
            this.logAIError('pet_growth_success', {
                original_text: optimizedText,
                extracted: parsed,
                target_file: targetFile.path
            });
            
            return { success: true, message: `已记录到 ${targetFile.name}` };
        } else {
            throw new Error('无法提取宠物名称');
        }
    } catch (error) {
        await this.logError(error, {
            method: 'processCategoryPetGrowth',
            input: optimizedText,
            fallback: 'processCategoryOther'
        });
        return await this.processCategoryOther(optimizedText);
    }
};

/* --- 阶段二处理（#11）：杂项模块 (other) ---
 * 功能定位：将未结构化的其他信息以最小格式写入INBOX
 */
SmartInputProPlugin.prototype.processCategoryOther = async function(optimizedText) {
    try {
        const inboxFile = this.resolveCaptureInboxPath();
        const otherItem = `- ${optimizedText}`;
        await this.appendToFile(inboxFile, otherItem);
        try { new Notice('内容已归入INBOX'); } catch (_) {}
        await this.logPipelineEvent('append_to_inbox', { saved_to: inboxFile, line: otherItem });
        
        // 自动打开INBOX文件并定位到新添加的内容（统一跳转模块，支持按文本定位）
        await this.navigateAfterSave(inboxFile, optimizedText);
        
        this.logAIError('other_process_success', {
            original_text: optimizedText,
            saved_to: inboxFile,
            timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
        });

        return { success: true, message: `内容已添加到 ${inboxFile}` };
    } catch (error) {
        this.logAIError('other_process_error', {
            original_text: optimizedText,
            error: error.message,
            timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
        });
        await this.logPipelineEvent('append_to_inbox_error', { error: error.message, text: optimizedText });
        return { success: false, message: '保存失败' };
    }
};

/**
 * 通用辅助：切换到阅读视图
 * 功能定位：将当前激活的 Markdown 视图切换为阅读模式（预览模式）
 * 使用场景：图表类内容（如价格追踪 Dashboard）写入后，自动切换以展示渲染效果
 */
SmartInputProPlugin.prototype.switchToReadingView = async function() {
    try {
        // 获取当前激活的 Markdown 视图
        const view = this.app.workspace.getActiveViewOfType(require('obsidian').MarkdownView);
        if (!view) return;

        // 检测当前状态
        const state = view.getState();
        // state.mode: 'preview' (阅读) | 'source' (编辑/实时预览)
        // state.source: false (实时预览) | true (源码模式)
        
        const isReadingMode = state.mode === 'preview';

        // 只有当当前不是阅读模式时才切换
        if (!isReadingMode) {
            // 调用切换命令
            // 注意：markdown:toggle-preview 是一个 toggle 命令，
            // 如果当前是 source，它会切到 preview；如果当前是 preview，它会切到 source。
            // 所以必须先判断当前状态，防止"切反了"。
            await this.app.commands.executeCommandById('markdown:toggle-preview');
            
            // 可选：等待一下确保切换完成（虽然 await executeCommandById 通常是同步触发的）
            // await new Promise(resolve => setTimeout(resolve, 100));
            
            // 再次检查是否成功，如果没成功（可能因为某些奇怪状态），尝试强制设置
            const newState = view.getState();
            if (newState.mode !== 'preview') {
                await view.setState({ ...newState, mode: 'preview' }, { history: false });
            }
        }
    } catch (e) {
        Logger.warn('[SmartInputPro] 切换阅读视图失败:', e);
    }
};

// 辅助函数：获取周数
/* --- 通用辅助：周号计算 ---
 * 功能定位：根据日期计算ISO周序号
 */
SmartInputProPlugin.prototype.getWeekNumber = function(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// 辅助函数：追加内容到文件
/* --- 通用辅助：文件追加写入 ---
 * 功能定位：将内容追加写入到指定文件
 */
SmartInputProPlugin.prototype.appendToFile = async function(filePath, content) {
    try {
        // 确保父目录存在，避免首次创建文件时因目录缺失失败
        const dirPath = filePath.split('/').slice(0, -1).join('/');
        if (dirPath) {
            await this.ensureDirectoryExists(dirPath);
        }
        const file = this.app.vault.getAbstractFileByPath(filePath);
        if (file) {
            const existingContent = await this.app.vault.read(file);
            const newContent = existingContent + '\n' + content;
            await this.app.vault.modify(file, newContent);
        } else {
            // 文件不存在，创建新文件
            await this.app.vault.create(filePath, content);
        }
        // 统一记录写入事件，便于追踪为何文本最终进入某文件（例如 INBOX）
        try {
            await this.logAIError('append_to_file', {
                target_file: filePath,
                appended_line: content,
                timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
            });
            await this.logPipelineEvent('append_to_file', {
                target_file: filePath,
                appended_line: content
            });
        } catch (_e) {
            // 忽略日志记录失败，避免影响主流程
        }
    } catch (error) {
        throw new Error(`Failed to append to file ${filePath}: ${error.message}`);
    }
};

// 辅助函数：加载模板文件
/* --- 通用辅助：模板加载 ---
 * 功能定位：从给定路径加载内容模板
 */
SmartInputProPlugin.prototype.loadTemplate = async function(templatePath) {
    try {
        const templateFile = this.app.vault.getAbstractFileByPath(templatePath);
        if (templateFile) {
            return await this.app.vault.read(templateFile);
        } else {
            throw new Error(`Template file not found: ${templatePath}`);
        }
    } catch (error) {
        // 返回基础模板
        return `---
type: 角色档案
name: {{name}}
tel: {{phone}}
---

## 基本信息
`;
    }
};

/**
 * 辅助函数：获取周度委托文件路径
 * @param {Date} date - 日期对象
 * @returns {string} 周度委托文件路径
 */
/* --- 通用辅助：周度委托路径解析 ---
 * 功能定位：基于日期解析周度委托文件路径
 * 特殊规则：周日12点之后到周一凌晨三点前仍视为周日
 */
SmartInputProPlugin.prototype.getWeeklyListPath = function(date) {
    // 复制日期对象以避免修改原始日期
    const adjustedDate = new Date(date.valueOf());
    
    // 获取当前时间的小时数和星期几
    const hour = adjustedDate.getHours();
    const dayOfWeek = adjustedDate.getDay(); // 0=周日, 1=周一, ..., 6=周六
    
    // 特殊规则：周日12点之后到周一凌晨三点前仍视为周日
    // 这意味着在这段时间内录入的内容应该归入上一周
    if ((dayOfWeek === 0 && hour >= 12) || (dayOfWeek === 1 && hour < 3)) {
        // 将日期调整为前一天，这样计算周数时会使用上一周的周数
        adjustedDate.setDate(adjustedDate.getDate() - 1);
    }
    
    // 使用标准ISO周数计算方式
    // ISO周数：一年中的第几周，以周一为一周的开始
    // 1月4日所在的周为第一周
    
    // 计算ISO周数和ISO年份
    const isoData = this.getISOWeekNumber(adjustedDate);
    const weekNumber = isoData.weekNumber;
    const isoYear = isoData.year;
    
    // 格式：01-经纬矩阵系统/02-周委托模块/周度委托列表25W41.md
    const yearShort = String(isoYear).slice(-2); // 取ISO年份后两位，如 2025 -> 25
    return `${(this.settings.weeklyDelegationPrefix || Config.WEEKLY_DELEGATION_PREFIX)}${yearShort}W${String(weekNumber).padStart(2, '0')}.md`;
};

/**
 * 计算标准ISO周数
 * @param {Date} date - 日期对象
 * @returns {Object} 包含ISO周数和ISO年份的对象
 */
SmartInputProPlugin.prototype.getISOWeekNumber = function(date) {
    // 复制日期以避免修改原始日期
    const tempDate = new Date(date.valueOf());
    
    // 将日期设置为周四（ISO周以周四为中心）
    // 这样可以确保跨年周处理正确
    tempDate.setUTCDate(tempDate.getUTCDate() + 4 - (tempDate.getUTCDay() || 7));
    
    // 获取ISO年份（可能与日历年份不同）
    const isoYear = tempDate.getUTCFullYear();
    
    // 获取ISO年份的第一天
    const yearStart = new Date(Date.UTC(isoYear, 0, 1));
    
    // 计算周数
    const weekNumber = Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7);
    
    return {
        weekNumber: weekNumber,
        year: isoYear
    };
};

/**
 * 辅助函数：更新文档的 frontmatter
 * @param {string} content - 文档内容
 * @param {Object} updates - 需要更新的键值对
 * @returns {string} 更新后的文档内容
 */
/* --- 通用辅助：Frontmatter 更新 ---
 * 功能定位：在内容中更新Frontmatter字段
 */
SmartInputProPlugin.prototype.updateFrontmatter = function(content, updates) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);
    
    if (match) {
        let frontmatter = match[1];
        Object.keys(updates).forEach(key => {
            const regex = new RegExp(`^${key}:.*$`, 'm');
            if (regex.test(frontmatter)) {
                frontmatter = frontmatter.replace(regex, `${key}: ${updates[key]}`);
            } else {
                frontmatter += `\n${key}: ${updates[key]}`;
            }
        });
        return content.replace(frontmatterRegex, `---\n${frontmatter}\n---`);
    } else {
        // 没有frontmatter，添加一个
        const newFrontmatter = Object.keys(updates)
            .map(key => `${key}: ${updates[key]}`)
            .join('\n');
        return `---\n${newFrontmatter}\n---\n\n${content}`;
    }
};

SmartInputProPlugin.prototype.normalizeBillTemplatePlaceholders = function(content) {
    const keys = ['type','category','subcategory','channel','note','create_date','weekday'];
    let s = String(content || '');
    keys.forEach(k => {
        const re = new RegExp(`^${k}:\s*"\{\{VALUE:${k}\}\}"`, 'm');
        s = s.replace(re, `${k}: {{VALUE:${k}}}`);
    });
    return s;
};

/* --- 通用辅助：日期（YYYY-MM-DD） ---
 * 功能定位：返回当前本地日期字符串（受系统时区影响）
 */
SmartInputProPlugin.prototype.getCurrentDateISO = function() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

/**
 * 辅助函数：提取文本中的时间词汇
 * @param {string} text - 原始文本
 * @returns {Array} 时间词汇数组
 */
SmartInputProPlugin.prototype.extractTimeWords = function(text) {
    // 常见时间词汇模式
    const timePatterns = [
        /今天|明天|昨天|后天|前天/g,
        /今晚|明晚|昨晚|今早|明早/g,
        /今年|明年|去年|后年|前年/g,
        /本周|下周|上周|下下周|上上周/g,
        /本月|下月|上月|下下月|上上月/g,
        /这周|下周|上周|这个月|下个月|上个月/g,
        /\d{1,2}号|\d{1,2}日/g,
        /\d{1,2}点|\d{1,2}:\d{2}/g,
        /上午|下午|中午|晚上|深夜|凌晨/g,
        /周一|周二|周三|周四|周五|周六|周日/g,
        /星期一|星期二|星期三|星期四|星期五|星期六|星期日/g,
        /现在|刚才|一会儿|稍后|马上|立即/g
    ];
    
    const timeWords = [];
    timePatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            timeWords.push(...matches);
        }
    });
    
    // 去重并返回
    return [...new Set(timeWords)];
};

/**
 * 辅助函数：恢复丢失的时间信息
 * @param {string} originalText - 原始文本
 * @param {string} optimizedText - 优化后的文本
 * @returns {string} 恢复时间信息后的文本
 */
SmartInputProPlugin.prototype.recoverTimeInfo = function(originalText, optimizedText) {
    // 提取原文中的时间词汇
    const originalTimeWords = this.extractTimeWords(originalText);
    
    // 检查哪些时间词汇在优化后的文本中丢失了
    const missingTimeWords = originalTimeWords.filter(word => 
        !optimizedText.includes(word)
    );
    
    if (missingTimeWords.length === 0) {
        return optimizedText; // 没有丢失时间信息，直接返回
    }
    
    // 恢复丢失的时间信息
    let recoveredText = optimizedText;
    
    // 简单策略：将丢失的时间词添加到句子开头
    if (missingTimeWords.length > 0) {
        const timePrefix = missingTimeWords.join('');
        recoveredText = timePrefix + recoveredText;
    }
    
    return recoveredText;
};

// ========== Helpers（沉底统一分组）：路径解析与目录保障 ==========
// 自动解析捕获INBOX路径：
// 1) 优先使用 settings.capturePath（规范化与斜杠修正）
// 2) 使用默认路径 '01-经纬矩阵系统/08-智能录入模块/01-INBOX.md'
/* --- 通用辅助：路径解析（INBOX路径） ---
 * 功能定位：解析并返回捕获INBOX文件路径
 */
SmartInputProPlugin.prototype.resolveCaptureInboxPath = function() {
    const candidates = [];
    const setCap = (this.settings.capturePath || '').trim();
    if (setCap) candidates.push(setCap);
    candidates.push(Config.CAPTURE_INBOX_PATH);
    const p = candidates[0] || Config.CAPTURE_INBOX_PATH;
    const fixed = p.replace(/\\/g, '/');
    // 对于 INBOX 文件，我们不需要检查文件是否存在，因为会自动创建
    return fixed;
};

// 自动解析记账模板路径（无需用户配置）：
// 1) 优先使用 settings.templatePath（规范化与斜杠修正）
// 2) 使用默认路径 '04-模板系统/09-专用模板/记账模板.md'
// 3) 全库扫描，按文件名 '记账模板.md' 命中首个文件
/* --- 通用辅助：路径解析（记账模板路径） ---
 * 功能定位：解析并返回记账模板文件路径
 */
SmartInputProPlugin.prototype.resolveBillTemplatePath = function() {
    const candidates = [];
    const setTpl = (this.settings.templatePath || '').trim();
    if (setTpl) candidates.push(setTpl);
    candidates.push(Config.TEMPLATE_PATH);
    for (const p of candidates) {
        const fixed = p.replace(/\\/g, '/');
        const f = this.app.vault.getAbstractFileByPath(fixed);
        if (f) return fixed;
    }
    // 兜底：按文件名全库扫描
    if (this.app?.vault?.getFiles) {
        const files = this.app.vault.getFiles();
        const hit = files.find(f => f.basename === Config.BILL_TEMPLATE_BASENAME && f.extension === 'md');
        if (hit) return hit.path;
    }
    return null;
};

/* --- 通用辅助：路径解析（美食待尝清单） ---
 * 功能定位：解析并返回美食待尝清单文件路径
 */
SmartInputProPlugin.prototype.resolveFoodWishlistPath = function() {
    const p = (this.settings.foodWishlistPath || Config.FOOD_WISHLIST_PATH);
    return p.replace(/\\/g, '/');
};

/* --- 通用辅助：目录保障 ---
 * 功能定位：确保给定路径的各级文件夹存在，不存在则递归创建
 */
SmartInputProPlugin.prototype.ensureDirectoryExists = async function(path) {
    const folders = path.split('/');
    let cur = '';
    for (const f of folders) {
        cur = cur ? `${cur}/${f}` : f;
        const exists = await this.app.vault.adapter.exists(cur);
        if (!exists) await this.app.vault.createFolder(cur);
    }
};

/* --- 通用辅助：耐用品资产登记 ---
 * 功能定位：解析账单文本并登记资产档案（独立文件，非阻塞触发）
 */
SmartInputProPlugin.prototype.helperLogAsset = async function(self, billData, originalText) {
    try {
        // [新增] 资产登记开始提示
        try { new Notice('📦 正在进行资产登记...'); } catch (_) {}

        const template = this.promptManager.getAssetLogPrompt();
        if (!template) return;
        const prompt = self.renderPrompt(template, { text: String(originalText || '') });

        // 2) 调用 AI（trackStage=null，确保零统计污染）
        const aiResp = await self.callAIByProvider(prompt, null, null);
        let cleaned = String(aiResp || '').trim();
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^json\s*/i, '').replace(/```$/,'').trim();
        const parsedAsset = JSON.parse(cleaned);
        // 兼容可能返回的嵌套结构（如 { asset: { name, purchase_platform, category } })
        if (parsedAsset && parsedAsset.asset && !parsedAsset.product_name) {
            const a = parsedAsset.asset;
            parsedAsset.product_name = a?.name || a?.product_name || null;
            parsedAsset.brand = parsedAsset.brand || a?.brand || null;
            parsedAsset.vendor = parsedAsset.vendor || a?.purchase_platform || a?.vendor || null;
            parsedAsset.asset_type = parsedAsset.asset_type || a?.category || null;
        }

        // 3) 解析账单数据
        const price = Number(billData?.amount || 0);
        const purchase_date = billData?.date || '';
        const bill_filename = billData?.filename || '';
        const bill_link = `[[${bill_filename}]]`;

        // 4) 定义路径与文件名，并保障目录存在（命名：YYMM-序号-品牌-产品）
        const assetDir = Config.ASSET_ARCHIVE_PATH;
        await self.ensureDirectoryExists(assetDir);
        const safe = (s) => String(s ?? '').replace(/[\\\/:*?"<>|]/g, '').trim();
        const brandSafe = safe(parsedAsset?.brand || '');
        const productSafe = safe(parsedAsset?.product_name || '');
        // 4.1 提取 YYMM（优先从账单文件名前缀 \d{6} 中取前4位）
        let yearMonth = '';
        const ymdMatch = bill_filename.match(/^(\d{6})-/);
        if (ymdMatch) {
            const ymd = ymdMatch[1];
            yearMonth = ymd.slice(0, 4); // YYMM
        } else if (purchase_date) {
            const m1 = String(purchase_date).match(/^(\d{4})-(\d{2})/);
            if (m1) yearMonth = `${m1[1].slice(2)}${m1[2]}`;
        }
        if (!yearMonth) {
            const nowStr = new Date().toLocaleString('en-US', { timeZone: Config.TIMEZONE });
            const now = new Date(nowStr);
            const yy = String(now.getFullYear()).slice(2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            yearMonth = `${yy}${mm}`;
        }

        // 4.2 枚举同目录文件，计算“当月全局序号”（与品牌/产品无关）
        let maxIndex = 0;
        try {
            const listRes = await self.app.vault.adapter.list(assetDir);
            const files = Array.isArray(listRes?.files) ? listRes.files : [];
            const monthRe = new RegExp(`^${yearMonth}-(\\d{2})-`);
            for (const f of files) {
                const name = String(f).split('/').pop();
                const mMonth = name.match(monthRe);
                if (mMonth) { maxIndex = Math.max(maxIndex, Number(mMonth[1])); }
            }
        } catch (_) {}
        const seq = String(maxIndex + 1).padStart(2, '0');
        const assetFileName = `${yearMonth}-${seq}-${brandSafe || '未知品牌'}-${productSafe || '未知产品'}.md`;
        const filePath = `${assetDir}/${assetFileName}`;

        // 5) 检查存在性（通常因并发才会命中），存在则返回
        const exists = await self.app.vault.adapter.exists(filePath);
        if (exists) {
            await self.logPipelineEvent('asset_log_skipped', {
                reason: 'file_exists',
                bill_filename,
                asset_file: filePath
            });
            return filePath;
        }

        // 6) 准备文件内容（YAML + 正文）
        const asset_type = safe(parsedAsset?.asset_type || '其他耐用品');
        const vendor = safe(parsedAsset?.vendor || '');
        const brand = brandSafe;
        const product_name = productSafe;

        const yaml = [
            '---',
            `asset_type: "${asset_type}"`,
            `product_name: "${product_name}"`,
            `brand: "${brand}"`,
            `vendor: "${vendor}"`,
            `price: ${price}`,
            `purchase_date: "${purchase_date}"`,
            `bill_link: "${bill_link}"`,
            '---'
        ].join('\n');

        const bodyLines = [
            `# ${brand ? brand + ' ' : ''}${product_name}`,
            '',
            `- 资产类型：${asset_type}`,
            `- 品牌：${brand || '未提及'}`,
            `- 商家/渠道：${vendor || '未提及'}`,
            `- 购买金额：¥${price.toFixed ? price.toFixed(2) : Number(price).toFixed(2)}`,
            `- 购买日期：${purchase_date || '未知'}`,
            `- 关联账单：${bill_link}`,
            '',
            '### 保修与备注',
            '',
            '（在此补充保修期、发票信息、序列号等备注）'
        ];
        const fileContent = `${yaml}\n\n${bodyLines.join('\n')}`;

        // 7) 创建文件
        await self.app.vault.create(filePath, fileContent);

        // 8) 通知与日志（成功）
        const displayName = (product_name && product_name !== '未知产品') || (brand && brand !== '未知品牌')
            ? `${brand && brand !== '未知品牌' ? brand + ' ' : ''}${product_name && product_name !== '未知产品' ? product_name : ''}`
            : '资产档案';
        try { new Notice(`📦资产已登记：${displayName}`); } catch (_) {}
        await self.logPipelineEvent('asset_log_success', {
            bill_filename,
            asset_file: filePath,
            parsed_asset: parsedAsset
        });

        return filePath;
    } catch (error) {
        // B 计划：完整错误隔离（不抛出，保持 Fire-and-Forget）
        try {
            Logger.error('[SmartInputPro] helperLogAsset 失败：', error);
            await self.logError('helperLogAsset', error, {
                original_text: originalText,
                bill_data: billData
            });
            new Notice(`⚠️ 资产登记失败：${error?.message || String(error)}`);
        } catch (_) {}
        return null;
    }
};


// ========== Helpers（沉底统一分组）：日志与文件操作 ==========
/* --- 通用辅助：AI 事件日志 ---
 * 功能定位：记录 AI 事件（成功/失败/过程）到 JSONL 文件，统一审计
 */
SmartInputProPlugin.prototype.logAIError = async function(eventType, data = {}) {
    try {
        const logEntry = {
            timestamp: new Date().toLocaleString('zh-CN', { timeZone: Config.TIMEZONE }),
            type: String(eventType || 'ai_event'),
            data
        };
        const logLine = JSON.stringify(logEntry) + '\n';
        const logDir = Config.LOG_DIR;
        const logFilePath = Config.ERROR_LOG;
        await this.ensureDirectoryExists(logDir);
        const exists = await this.app.vault.adapter.exists(logFilePath);
        if (exists) {
            await this.app.vault.adapter.append(logFilePath, logLine);
        } else {
            try {
                await this.app.vault.create(logFilePath, logLine);
            } catch (createErr) {
                if (String(createErr?.message || '').includes('File already exists')) {
                    await this.app.vault.adapter.append(logFilePath, logLine);
                } else {
                    throw createErr;
                }
            }
        }
    } catch (e) {
        Logger.error('[SmartInputPro] Failed to write AI event log:', e);
    }
};

/* --- 通用辅助：流水日志 ---
 * 功能定位：记录完整处理过程到独立 JSONL 文件（按天存储）
 */
SmartInputProPlugin.prototype.logPipelineEvent = async function(event, data = {}) {
    try {
        const logDir = Config.LOG_DIR;
        // 使用 ISO 格式日期 (YYYY-MM-DD) 作为文件名
        const today = new Date().toISOString().slice(0, 10);
        const logFilePath = `${logDir}/${today}.jsonl`;
        
        // 数据清洗：保留核心字段，剔除冗余
        const cleanData = {};
        // 核心关注字段列表
        const focusKeys = [
            'original_text', 'classification', 'optimized_text', 
            'usage', 'tokens', 'cost', 
            'error', 'error_message', 'error_stack',
            's1', 's2' // 保留阶段结果对象
        ];
        
        // 显式剔除的大体量字段
        const ignoreKeys = ['messages', 'system_prompt', 'raw_response', 'history', 'context_full', 'body_preview', 'api_url'];

        // 过滤空数据事件（除非是关键节点）
        if (Object.keys(data).length === 0 && !['stage1_start', 'stage2_dispatch'].includes(event)) {
             return; 
        }

        for (const [key, val] of Object.entries(data)) {
             // 1. 如果是核心字段，直接保留
             if (focusKeys.includes(key) || key.toLowerCase().includes('token') || key.toLowerCase().includes('cost')) {
                 cleanData[key] = val;
                 continue;
             }
             // 2. 如果是忽略字段，直接跳过
             if (ignoreKeys.includes(key)) {
                 continue;
             }
             // 3. 其他字段：如果不是对象，或者字符串长度较短(<1000)，则保留作为补充信息
             if (typeof val !== 'object' && String(val).length < 1000) {
                 cleanData[key] = val;
             } else if (typeof val === 'object' && val !== null) {
                 // 简单对象尝试保留，过于复杂的忽略
                 try {
                     const str = JSON.stringify(val);
                     if (str.length < 1000) cleanData[key] = val;
                 } catch (_) {}
             }
        }

        const entry = {
            timestamp: new Date().toLocaleString('zh-CN', { timeZone: Config.TIMEZONE }),
            event: String(event || 'pipeline_event'),
            data: cleanData
        };
        let line = JSON.stringify(entry) + '\n';
        
        await this.ensureDirectoryExists(logDir);
        
        // 写入文件（追加模式）
        const exists = await this.app.vault.adapter.exists(logFilePath);
        if (exists) {
            // 视觉优化：如果是新会话开始，添加空行分隔
            if (event === 'stage1_start') {
                line = '\n' + line;
            }
            await this.app.vault.adapter.append(logFilePath, line);
        } else {
            try {
                await this.app.vault.create(logFilePath, line);
            } catch (createErr) {
                // 处理并发创建时的竞态条件
                if (String(createErr?.message || '').includes('File already exists')) {
                    if (event === 'stage1_start') line = '\n' + line;
                    await this.app.vault.adapter.append(logFilePath, line);
                } else {
                    throw createErr;
                }
            }
        }
        
        // 注意：不再每次写入都调用清理逻辑，改为在插件启动时清理
    } catch (e) {
        Logger.error('[SmartInputPro] Failed to write pipeline log:', e);
    }
};

/* --- 通用辅助：获取最近的流水日志 ---
 * 功能定位：从流水日志中获取最近的N条指定事件类型的记录（仅读取当天）
 */
SmartInputProPlugin.prototype.getRecentPipelineEvents = async function(limit = 10, eventType = null) {
    try {
        const logDir = Config.LOG_DIR;
        const today = new Date().toISOString().slice(0, 10);
        const logFilePath = `${logDir}/${today}.jsonl`;
        
        // 检查日志文件是否存在
        const exists = await this.app.vault.adapter.exists(logFilePath);
        if (!exists) {
            return [];
        }
        
        // 读取日志文件内容
        const content = await this.app.vault.adapter.read(logFilePath);
        const lines = content.trim().split('\n').filter(line => line.trim());
        
        // 解析每一行日志
        const events = [];
        for (const line of lines) {
            try {
                const entry = JSON.parse(line);
                if (!eventType || entry.event === eventType) {
                    events.push(entry);
                }
            } catch (e) {
                continue;
            }
        }
        
        // 返回最近的N条记录（倒序）
        return events.slice(-limit).reverse();
    } catch (e) {
        Logger.error('[SmartInputPro] Failed to read pipeline log:', e);
        return [];
    }
};

/* --- 通用辅助：类别显示名映射 ---
 * 功能定位：将内部类别key映射为统一的四字中文显示名（≤4字，尽量4字）
 */
SmartInputProPlugin.prototype.getCategoryDisplayName = function(key) {
    const k = String(key || '').trim();
    const uiName = this.settings?.ui?.moduleDisplayName?.[k];
    if (uiName) return uiName;
    const map = {
        bill: '账务收支',
        task: '任务事项',
        memo: '快捷备忘',
        contact: '联系信息',
        food_wishlist: '美食清单',
        code_dev: '代码开发',
        question_entry: '题目录入',
        study_record: '刷题记录',
        price_tracker: '价格追踪',
        pet_growth: '崽子成长',
        other: '杂项记录',
        unknown: '未知记录'        
    };
    return map[k] || k || '未知';
};

/* --- 通用辅助：连通性测试 ---
 * 功能定位：验证统一路由（首选/备选）与密钥读取是否正常，记录结果
 */
SmartInputProPlugin.prototype.runConnectivityTest = async function() {
    try { new Notice('开始最小化连通性测试'); } catch (_) {}
    const primary = this.settings?.strategy?.primary || {};
    const secondary = this.settings?.strategy?.backup || {};
    const preferred = {
        provider: primary.provider || this.settings.preferredProvider,
        model: primary.model || this.settings.preferredModel,
        accountLabel: primary.accountLabel || 'Default'
    };
    const backup = {
        enabled: secondary.enabled !== false,
        provider: secondary.provider || this.settings.backupProvider || preferred.provider,
        model: secondary.model || this.settings.backupModel || (secondary.provider === 'minimax' ? 'MiniMax-M2' : 'glm-4-flash'),
        accountLabel: secondary.accountLabel || 'Default'
    };

    const prompt = '请严格按以下要求输出：仅输出小写字符串 ok，不要输出任何其他字符或标点。';
    await this.logPipelineEvent('connectivity_test_start', { preferred, backup });

    let ok = false;
    let respSnippet = '';
    let errorMsg = null;
    try {
        const resp = await this.callAIByProvider(prompt, null, 'connectivity');
        const cleaned = String(resp || '').toLowerCase().replace(/[`#*]/g, '').replace(/^json\s*/, '').replace(/\s/g, '');
        ok = cleaned.includes('ok');
        respSnippet = String(resp || '').slice(0, 200);
    } catch (e) {
        errorMsg = e?.message || String(e);
    }

    await this.logPipelineEvent('connectivity_test_result', {
        ok,
        preferred,
        backup,
        response: respSnippet,
        error: errorMsg ? String(errorMsg).slice(0, 200) : undefined
    });

    return ok;
};

/* --- 通用辅助：追加到 INBOX ---
 * 功能定位：将文本统一追加到 INBOX.md，并在 UI 中提示与定位
 */
SmartInputProPlugin.prototype.appendToCapture = async function(text) {
    const inboxPath = this.resolveCaptureInboxPath();
    await this.ensureDirectoryExists(inboxPath.split('/').slice(0, -1).join('/'));
    let inboxFile = this.app.vault.getAbstractFileByPath(inboxPath);
    if (!inboxFile) {
        await this.app.vault.create(inboxPath, `# INBOX\n\n`);
        inboxFile = this.app.vault.getAbstractFileByPath(inboxPath);
    }
    const noteLine = `\n- ${text}\n`;
    await this.app.vault.append(inboxFile, noteLine);
    new Notice(`内容已追加到INBOX`);
    // 自动打开并按文本定位到刚追加的内容（统一跳转模块）
    await this.navigateAfterSave(inboxPath, text);
    return inboxPath;
};

/* --- 通用辅助：刷题记录ID生成 ---
 * 功能定位：生成唯一的刷题记录ID（日期+当日记录数递增）
 */
SmartInputProPlugin.prototype.generateStudyRecordId = async function(dateStr, sectionName) {
    try {
        const fileName = `${sectionName}记录.md`;
        const filePath = `${Config.STUDY_RECORD_BASE_PATH}/${fileName}`;
        
        // 检查文件是否存在
        const recordFile = this.app.vault.getAbstractFileByPath(filePath);
        if (!recordFile) {
            // 文件不存在，返回第一个ID
            return `${dateStr}-01`;
        }
        
        // 读取文件内容，查找当日已有的记录数量
        const content = await this.app.vault.read(recordFile);
        
        // 修正正则表达式，匹配实际文件中的记录格式：【日期-序号-...】
        const todayPattern = new RegExp(`【${dateStr}-(\\d{2})-`, 'g');
        const matches = [...content.matchAll(todayPattern)];
        
        if (matches.length === 0) {
            // 当日没有记录，返回第一个ID
            return `${dateStr}-01`;
        }
        
        // 找到最大的序号并递增
        const maxNumber = Math.max(...matches.map(match => parseInt(match[1])));
        const nextNumber = (maxNumber + 1).toString().padStart(2, '0');
        return `${dateStr}-${nextNumber}`;
        
    } catch (error) {
        Logger.error('[SmartInputPro] Failed to generate study review ID:', error);
        // 出错时返回默认ID
        return `${dateStr}-01`;
    }
};

/* --- 通用辅助：动态获取宠物名单 ---
 * 功能定位：扫描指定目录，提取 1.name字段 2.文件名 3.别名
 */
SmartInputProPlugin.prototype.getPetNamesList = function() {
    // 请确保此路径与你实际的文件夹路径一致
    const baseDir = this.settings?.petFamilyPath || "05-生活坐标系统/01-角色档案/月饼家族"; 
    
    // 容错：防止插件在未完全加载时调用导致 vault 未就绪
    if (!this.app || !this.app.vault) return "月饼, 老二";

    const files = this.app.vault.getMarkdownFiles().filter(f => f.path.includes(baseDir));
    
    let names = new Set();
    
    files.forEach(f => {
        const cache = this.app.metadataCache.getFileCache(f);
        
        // 1. 优先读取 frontmatter 中的 name 字段
        if (cache && cache.frontmatter && cache.frontmatter.name) {
            names.add(String(cache.frontmatter.name));
        }

        // 2. 添加文件名 (去除 .md)
        names.add(f.basename);
        
        // 3. 添加别名 (Aliases)
        if (cache && cache.frontmatter && cache.frontmatter.aliases) {
            const aliases = cache.frontmatter.aliases;
            if (Array.isArray(aliases)) {
                aliases.forEach(a => names.add(String(a)));
            } else if (typeof aliases === 'string') {
                names.add(aliases);
            }
        }
    });
    
    // 兜底默认值
    if (names.size === 0) return "月饼, 老二";
    
    return Array.from(names).join('、');
};
3



/**
 * @class SmartInputProSettingTab
 * @extends PluginSettingTab
 */
class SmartInputProSettingTab extends PluginSettingTab {
    /**
     * 构造函数
     * @param {App} app - Obsidian应用实例
     * @param {SmartInputProPlugin} plugin - 插件实例
     */
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    getIcon(name) {
        const icons = {
            bot: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sip-tab-icon"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>',
            globe: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sip-tab-icon"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
            grid: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sip-tab-icon"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>',
            settings: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sip-tab-icon"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
            module: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sip-tab-icon"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></svg>'
        };
        return icons[name] || '';
    }

    async testAIConnection(provider, model, apiKey, baseUrl) {
        try {
            const protocol = this.plugin.settings.resources?.[provider]?.protocol || 'auto';
            let endpoint = baseUrl;
            
            if (!endpoint) {
                const defaultEndpoints = {
                    'zhipu': 'https://open.bigmodel.cn/api/paas/v4',
                    'openai': 'https://api.openai.com/v1',
                    'deepseek': 'https://api.deepseek.com/v1',
                    'anthropic': 'https://api.anthropic.com/v1',
                    'moonshot': 'https://api.moonshot.cn/v1',
                    'qwen': 'https://dashscope.aliyuncs.com/compatible-mode/v1'
                };
                endpoint = defaultEndpoints[provider] || '';
            }
            
            if (!endpoint) {
                return { success: false, error: '未配置 Base URL' };
            }
            
            const url = endpoint.endsWith('/chat/completions') 
                ? endpoint 
                : `${endpoint.replace(/\/$/, '')}/chat/completions`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 5
                })
            });
            
            if (response.ok) {
                return { success: true };
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
                return { success: false, error: errorMsg };
            }
        } catch (err) {
            return { success: false, error: err.message || '网络错误' };
        }
    }
    
    async resolveAPIKey(account) {
        if (account?.apiKey) {
            return account.apiKey;
        }
        
        if (account?.apiKeyPath) {
            try {
                const file = this.app.vault.getAbstractFileByPath(account.apiKeyPath);
                if (file && file instanceof TFile) {
                    const content = await this.app.vault.read(file);
                    return content.trim();
                }
            } catch (e) {
                console.error('读取 API Key 文件失败:', e);
            }
        }
        
        return '';
    }

    /**
     * 显示设置面板
     * 功能：渲染所有配置项的UI界面
     */
    display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass('sip-console');

        const s = this.plugin.settings;
        if (!s.resources) s.resources = {};
        if (!s.strategy) s.strategy = { primary: { provider: '', model: '', accountLabel: 'Default' }, backup: { enabled: true, provider: '', model: '', accountLabel: 'Default' }, quotaBlockDate: '' };
        if (!s.pipeline) s.pipeline = {};
        if (!s.modules) s.modules = {};
        if (!s.ui || typeof s.ui !== 'object') s.ui = {};
        if (!s.ui.moduleDisplayName || typeof s.ui.moduleDisplayName !== 'object') s.ui.moduleDisplayName = {};
        if (!s.ui.fieldLabel || typeof s.ui.fieldLabel !== 'object') s.ui.fieldLabel = {};

        const resources = s.resources;
        const providerIds = Object.keys(resources);

        const save = async () => {
            await this.plugin.saveSettings();
        };

        const normalizeModels = (value) => {
            const lines = String(value || '').split(/[\r\n,]+/).map(v => v.trim()).filter(Boolean);
            return Array.from(new Set(lines));
        };

        const ensureAccountLabel = (providerId, label) => {
            const accs = resources?.[providerId]?.accounts || [];
            if (!accs.length) return 'Default';
            const labels = accs.map(a => String(a?.label || '').trim()).filter(Boolean);
            if (labels.includes(label)) return label;
            return labels[0] || 'Default';
        };

        const addVarHints = (parentEl, vars) => {
            if (!vars || !vars.length) return;
            const hints = parentEl.createDiv({ cls: 'sip-var-hints' });
            vars.forEach((v) => {
                const badge = hints.createEl('span', { cls: 'sip-var-badge', text: v });
                badge.addEventListener('click', async () => {
                    try {
                        await navigator.clipboard.writeText(v);
                        new Notice(`已复制：${v}`);
                    } catch (_) {}
                });
            });
        };

        const getFieldLabel = (key, fallback) => {
            const v = s.ui?.fieldLabel?.[key];
            const sv = (v !== undefined && v !== null) ? String(v).trim() : '';
            return sv ? sv : fallback;
        };

        const attachInlineEdit = (el, getCurrent, commit) => {
            if (!el) return;
            el.classList.add('sip-editable');
            el.addEventListener('click', (evt) => {
                evt.preventDefault();
                evt.stopPropagation();
                const current = String(getCurrent() || '');
                const input = document.createElement('input');
                input.type = 'text';
                input.value = current;
                input.className = 'sip-edit-input';
                const parent = el.parentElement;
                if (!parent) return;
                parent.replaceChild(input, el);
                const finish = async (saveValue, shouldCommit) => {
                    const nextEl = el;
                    if (input.parentElement) input.parentElement.replaceChild(nextEl, input);
                    if (!shouldCommit) return;
                    await commit(saveValue);
                };
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') finish(input.value, true).catch(()=>{});
                    if (e.key === 'Escape') finish(current, false).catch(()=>{});
                });
                input.addEventListener('blur', () => {
                    finish(input.value, true).catch(()=>{});
                });
                setTimeout(() => {
                    input.focus();
                    input.select();
                }, 0);
            });
        };

        const setFieldLabel = async (key, value, fallback) => {
            const v = String(value || '').trim();
            if (!v || v === fallback) delete s.ui.fieldLabel[key];
            else s.ui.fieldLabel[key] = v;
            await save();
        };

        const setModuleDisplayName = async (moduleId, value) => {
            const v = String(value || '').trim();
            if (!v) delete s.ui.moduleDisplayName[moduleId];
            else s.ui.moduleDisplayName[moduleId] = v;
            await save();
        };

        const addPromptEditor = (container, title, subtitle, getter, setter, vars, options = {}) => {
            const wrap = container.createDiv({ cls: 'sip-prompt-editor' });
            
            // Only create header if title or subtitle or vars exists
            if (title || subtitle || (vars && vars.length > 0)) {
                const header = wrap.createDiv({ cls: 'sip-prompt-editor__header' });
                const titleWrap = header.createDiv();
                if (title) {
                    const titleEl = titleWrap.createEl('div', { cls: 'sip-prompt-editor__titleText', text: title });
                    if (options.titleKey && options.titleFallback) {
                        attachInlineEdit(titleEl, () => getFieldLabel(options.titleKey, options.titleFallback), async (v) => {
                            await setFieldLabel(options.titleKey, v, options.titleFallback);
                            this.display();
                        });
                    }
                }
                if (subtitle) titleWrap.createDiv({ cls: 'sip-prompt-editor__subtitle', text: subtitle });
                const varsWrap = header.createDiv();
                addVarHints(varsWrap, vars);
            } else {
                wrap.classList.add('no-header');
            }

            const ta = wrap.createEl('textarea', { cls: 'sip-prompt-textarea sip-prompt-textarea--compact sip-prompt-editor__textarea' });
            ta.value = getter() || '';
            ta.spellcheck = false;
            if (options.minHeight) ta.style.minHeight = String(options.minHeight);

            let timer = null;
            const flush = async () => {
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
                setter(ta.value);
                await save();
            };
            ta.addEventListener('input', () => {
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => {
                    flush().catch(() => {});
                }, 400);
            });
            ta.addEventListener('blur', () => {
                flush().catch(() => {});
            });
        };

        // --- Render Functions ---

        const SECTIONS = ['strategy', 'pipeline', 'modules', 'advanced'];
        const SECTION_CONFIG = {
            strategy: {
                title: '策略与资源',
                desc: '配置 AI 模型服务商、API Key、以及主备切换策略。',
                icon: 'bot'
            },
            pipeline: {
                title: '全局管线',
                desc: '管理 Stage 1 分类与 Stage 2 优化的核心提示词。',
                icon: 'globe'
            },
            modules: {
                title: '业务模块',
                desc: '配置各个业务模块的提取提示词、保存路径与开关。',
                icon: 'module'
            },
            advanced: {
                title: '高级设置',
                desc: '日志保留策略、Token 消耗统计及其他系统选项。',
                icon: 'settings'
            }
        };

        // Initialize state if needed
        if (!this.currentSectionIndex) this.currentSectionIndex = 0;
        
        // We need a content container for sub-views to attach to
        let contentEl = null;

        const renderStrategy = () => {
            const primary = s.strategy.primary || (s.strategy.primary = { provider: '', model: '', accountLabel: 'Default' });
            const backup = s.strategy.backup || (s.strategy.backup = { enabled: true, provider: '', model: '', accountLabel: 'Default' });

            // --- Top Grid: Model Strategy ---
            const grid = contentEl.createDiv({ cls: 'sip-grid-2' });

            // 1. Primary Model Card
            const primaryCard = grid.createDiv({ cls: 'sip-strategy-card active' });
            // Add sip-card structure explicitly via internal classes
            
            const pHeader = primaryCard.createDiv({ cls: 'sip-card-header sip-strategy-header' });
            pHeader.createEl('h3', { text: '主力模型', cls: 'sip-section-title' });
            pHeader.createSpan({ cls: 'sip-strategy-badge primary', text: 'PRIMARY' });

            const pBody = primaryCard.createDiv({ cls: 'sip-card-body' });

            // Provider Dropdown
            const pProviderGroup = pBody.createDiv({ cls: 'sip-form-group' });
            pProviderGroup.createEl('label', { text: '服务商' });
            const pProviderSelect = pProviderGroup.createEl('select', { cls: 'sip-select' });
            providerIds.forEach(pid => {
                const opt = pProviderSelect.createEl('option', { value: pid, text: pid });
                if (pid === primary.provider) opt.selected = true;
            });
            pProviderSelect.onchange = async () => {
                primary.provider = pProviderSelect.value;
                const models = resources?.[primary.provider]?.models || [];
                primary.model = models.includes(primary.model) ? primary.model : (models[0] || '');
                primary.accountLabel = ensureAccountLabel(primary.provider, primary.accountLabel || 'Default');
                await save();
                this.display();
            };

            // Model Dropdown
            const pModelGroup = pBody.createDiv({ cls: 'sip-form-group' });
            pModelGroup.createEl('label', { text: '模型' });
            const pModelSelect = pModelGroup.createEl('select', { cls: 'sip-select' });
            const pModels = resources?.[primary.provider]?.models || [];
            if (pModels.length === 0) pModelSelect.createEl('option', { text: '无可用模型', disabled: true });
            pModels.forEach(m => {
                const opt = pModelSelect.createEl('option', { value: m, text: m });
                if (m === primary.model) opt.selected = true;
            });
            pModelSelect.onchange = async () => {
                primary.model = pModelSelect.value;
                await save();
            };

            // Account Dropdown
            const pAccountGroup = pBody.createDiv({ cls: 'sip-form-group', style: 'margin-bottom:0;' });
            pAccountGroup.createEl('label', { text: '账号' });
            const pAccountSelect = pAccountGroup.createEl('select', { cls: 'sip-select' });
            const pAccounts = resources?.[primary.provider]?.accounts || [];
            pAccounts.forEach(acc => {
                const label = acc.label || 'Default';
                const opt = pAccountSelect.createEl('option', { value: label, text: label });
                if (label === primary.accountLabel) opt.selected = true;
            });
            pAccountSelect.onchange = async () => {
                primary.accountLabel = pAccountSelect.value;
                await save();
            };

            // Test Button (Small, inside card)
            const pActions = pBody.createDiv({ style: 'margin-top:16px; display:flex; justify-content:space-between; align-items:center;' });
            const pStatus = pActions.createSpan({ cls: 'sip-status-dot', style: 'width:8px; height:8px; background:var(--text-muted); display:inline-block;' });
            const pTestBtn = pActions.createEl('button', { cls: 'sip-btn ghost', text: '测试连接' });
            pTestBtn.onclick = async () => {
                pStatus.style.background = 'var(--sip-warning)';
                pTestBtn.textContent = '测试中...';
                try {
                    const acc = pAccounts.find(a => a.label === primary.accountLabel) || pAccounts[0];
                    const key = await this.resolveAPIKey(acc);
                    const res = await this.testAIConnection(primary.provider, primary.model, key, resources[primary.provider]?.baseUrl);
                    if (res.success) {
                        pStatus.style.background = 'var(--sip-success)';
                        new Notice('连接成功');
                    } else {
                        throw new Error(res.error);
                    }
                } catch (e) {
                    pStatus.style.background = 'var(--sip-danger)';
                    new Notice(`连接失败: ${e.message}`);
                } finally {
                    pTestBtn.textContent = '测试连接';
                }
            };


            // 2. Backup Model Card
            const backupCard = grid.createDiv({ cls: `sip-strategy-card ${backup.enabled ? 'active' : 'inactive'}` });
            if (!backup.enabled) backupCard.style.borderColor = 'transparent'; // Visual tweak

            const bHeader = backupCard.createDiv({ cls: 'sip-card-header sip-strategy-header' });
            bHeader.createEl('h3', { text: '备用模型', cls: 'sip-section-title' });
            
            // Toggle Switch for Backup
            const bToggleWrap = bHeader.createDiv({ style: 'display:flex; align-items:center; gap:8px;' });
            // Use Obsidian Setting toggle logic but minimal DOM
            const bToggleContainer = bToggleWrap.createDiv();
            new Setting(bToggleContainer)
                .addToggle(t => {
                    t.setValue(backup.enabled !== false).onChange(async (v) => {
                        backup.enabled = v;
                        await save();
                        this.display();
                    });
                });
            // Hack to remove extra padding from Setting
            bToggleContainer.querySelector('.setting-item').style.border = 'none';
            bToggleContainer.querySelector('.setting-item').style.padding = '0';
            bToggleContainer.querySelector('.setting-item-info').style.display = 'none';

            const bBody = backupCard.createDiv({ cls: 'sip-card-body' });

            // Provider (Backup)
            const bProviderGroup = bBody.createDiv({ cls: 'sip-form-group' });
            bProviderGroup.createEl('label', { text: '服务商' });
            const bProviderSelect = bProviderGroup.createEl('select', { cls: 'sip-select' });
            bProviderSelect.disabled = !backup.enabled;
            providerIds.forEach(pid => {
                const opt = bProviderSelect.createEl('option', { value: pid, text: pid });
                if (pid === backup.provider) opt.selected = true;
            });
            bProviderSelect.onchange = async () => {
                backup.provider = bProviderSelect.value;
                const models = resources?.[backup.provider]?.models || [];
                backup.model = models.includes(backup.model) ? backup.model : (models[0] || '');
                backup.accountLabel = ensureAccountLabel(backup.provider, backup.accountLabel || 'Default');
                await save();
                this.display();
            };

            // Model (Backup)
            const bModelGroup = bBody.createDiv({ cls: 'sip-form-group' });
            bModelGroup.createEl('label', { text: '模型' });
            const bModelSelect = bModelGroup.createEl('select', { cls: 'sip-select' });
            bModelSelect.disabled = !backup.enabled;
            const bModels = resources?.[backup.provider]?.models || [];
            bModels.forEach(m => {
                const opt = bModelSelect.createEl('option', { value: m, text: m });
                if (m === backup.model) opt.selected = true;
            });
            bModelSelect.onchange = async () => {
                backup.model = bModelSelect.value;
                await save();
            };

            // Account (Backup)
            const bAccountGroup = bBody.createDiv({ cls: 'sip-form-group', style: 'margin-bottom:0;' });
            bAccountGroup.createEl('label', { text: '账号' });
            const bAccountSelect = bAccountGroup.createEl('select', { cls: 'sip-select' });
            bAccountSelect.disabled = !backup.enabled;
            const bAccounts = resources?.[backup.provider]?.accounts || [];
            bAccounts.forEach(acc => {
                const label = acc.label || 'Default';
                const opt = bAccountSelect.createEl('option', { value: label, text: label });
                if (label === backup.accountLabel) opt.selected = true;
            });
            bAccountSelect.onchange = async () => {
                backup.accountLabel = bAccountSelect.value;
                await save();
            };


            // --- Resources Pool Section ---
            const resSection = contentEl.createDiv({ cls: 'sip-section' });
            
            // Wrap in Card
            const resCard = resSection.createDiv({ cls: 'sip-card' });
            const resHeader = resCard.createDiv({ cls: 'sip-card-header' });
            resHeader.createEl('h3', { text: '资源池配置', cls: 'sip-section-title' });

            const resBody = resCard.createDiv({ cls: 'sip-card-body' });
            const resList = resBody.createDiv({ cls: 'sip-resource-list' });

            providerIds.forEach(pid => {
                const r = resources[pid];
                const item = resList.createDiv({ cls: 'sip-resource-item' });
                
                // Summary Row
                const summary = item.createDiv({ cls: 'sip-resource-summary' });
                const info = summary.createDiv({ cls: 'sip-resource-info' });
                info.createDiv({ cls: 'sip-resource-icon', text: pid.substring(0,2).toUpperCase() });
                const nameWrap = info.createDiv();
                nameWrap.createDiv({ cls: 'sip-resource-name', text: r.name || pid });
                nameWrap.createDiv({ cls: 'sip-resource-meta', text: `${(r.models||[]).length} Models • ${(r.accounts||[]).length} Accounts` });
                
                const action = summary.createDiv({ cls: 'sip-resource-action' });
                const chevron = action.createDiv({ cls: 'sip-btn-icon' });
                chevron.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

                // Expand Action
                summary.onclick = () => {
                    item.classList.toggle('open');
                    if (item.classList.contains('open')) {
                        chevron.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
                        chevron.classList.add('active');
                    } else {
                        chevron.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
                        chevron.classList.remove('active');
                    }
                };

                // Details Form
                const details = item.createDiv({ cls: 'sip-resource-details' });
                const detailsCard = details.createDiv({ cls: 'sip-card sip-resource-card' });
                const detailsPanel = detailsCard.createDiv({ cls: 'sip-card-body sip-resource-panel' });
                
                // 1. Basic Info (Vertical Stack Layout)
                const rGrid = detailsPanel.createDiv({ cls: 'sip-form-stack' });
                
                // Provider ID
                const idGroup = rGrid.createDiv({ cls: 'sip-form-group' });
                idGroup.createEl('label', { text: '服务商 ID' });
                const idInput = idGroup.createEl('input', { cls: 'sip-input', type: 'text', value: pid });
                idInput.onchange = async () => {
                    const newId = idInput.value.trim();
                    if (!newId || newId === pid || resources[newId]) {
                        idInput.value = pid;
                        return;
                    }
                    // 更新所有引用
                    if (s.strategy.primary.provider === pid) s.strategy.primary.provider = newId;
                    if (s.strategy.backup.provider === pid) s.strategy.backup.provider = newId;
                    if (s.ui.quickInput.provider === pid) s.ui.quickInput.provider = newId;
                    if (s.ui.quickInput.providerModels?.[pid]) {
                        s.ui.quickInput.providerModels[newId] = s.ui.quickInput.providerModels[pid];
                        delete s.ui.quickInput.providerModels[pid];
                    }
                    resources[newId] = resources[pid];
                    delete resources[pid];
                    await save();
                    this.display();
                };

                // Display Name
                const nameGroup = rGrid.createDiv({ cls: 'sip-form-group' });
                nameGroup.createEl('label', { text: '展示名称' });
                const nameInput = nameGroup.createEl('input', { cls: 'sip-input', type: 'text', value: r.name || '' });
                nameInput.onchange = async () => { r.name = nameInput.value; await save(); summary.querySelector('.sip-resource-name').textContent = r.name; };

                // Base URL
                const urlGroup = rGrid.createDiv({ cls: 'sip-form-group' });
                urlGroup.createEl('label', { text: 'Base URL (可选)' });
                const urlInput = urlGroup.createEl('input', { cls: 'sip-input', type: 'text', value: r.baseUrl || '' });
                urlInput.placeholder = '默认';
                urlInput.onchange = async () => { r.baseUrl = urlInput.value.trim(); await save(); };

                // Protocol & Thinking
                const protoGroup = rGrid.createDiv({ cls: 'sip-form-group' });
                protoGroup.createEl('label', { text: '协议类型' });
                const protoSelect = protoGroup.createEl('select', { cls: 'sip-select' });
                ['auto', 'openai', 'anthropic'].forEach(p => protoSelect.createEl('option', { value: p, text: p }).selected = (r.protocol === p));
                protoSelect.onchange = async () => { r.protocol = protoSelect.value; await save(); };

                const thinkGroup = rGrid.createDiv({ cls: 'sip-form-group' });
                thinkGroup.createEl('label', { text: '思考模式 (Thinking)' });
                
                const thinkRow = thinkGroup.createDiv({ cls: 'sip-toggle-row' });
                const thinkLabel = thinkRow.createSpan({ text: '禁用思考 (Disable Thinking)', style: 'flex:1; font-size:13px; color:var(--sip-text-muted);' });
                const thinkToggle = new Setting(thinkRow)
                    .addToggle(t => t.setValue(!!r.disableThinking).onChange(async v => { r.disableThinking = v; await save(); }));
                // Minimal styling for toggle
                thinkRow.querySelector('.setting-item').style.border = 'none';
                thinkRow.querySelector('.setting-item').style.padding = '0';
                thinkRow.querySelector('.setting-item-info').style.display = 'none';

                // 2. Models Editor
                const modelGroup = detailsPanel.createDiv({ cls: 'sip-form-group', style: 'margin-top:16px;' });
                modelGroup.createEl('label', { text: '模型列表 (每行一个)' });
                addPromptEditor(
                    modelGroup,
                    '', // No title needed inside form group
                    '',
                    () => (r.models || []).join('\n'),
                    (v) => {
                        r.models = normalizeModels(v);
                        summary.querySelector('.sip-resource-meta').textContent = `${(r.models||[]).length} Models • ${(r.accounts||[]).length} Accounts`;
                    },
                    [],
                    { minHeight: '100px' }
                );

                // 3. Accounts List (Refined)
                const accSection = detailsPanel.createDiv({ style: 'margin-top:16px; border-top:1px solid var(--sip-border); padding-top:16px;' });
                
                // Section Title with improved styling
                const accHeader = accSection.createDiv({ cls: 'sip-section-header-small' });
                accHeader.createEl('span', { text: 'API 密钥管理' });
                
                const accList = accSection.createDiv({ cls: 'sip-account-list' });
                
                const renderAccounts = () => {
                    accList.empty();
                    r.accounts.forEach((acc, idx) => {
                        const accCard = accList.createDiv({ cls: 'sip-account-card' });
                        
                        const delBtn = accCard.createDiv({ cls: 'sip-btn-icon delete', attr: {'aria-label': '删除此账号'} });
                        delBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
                        delBtn.onclick = async (e) => {
                            e.stopPropagation();
                            r.accounts.splice(idx, 1);
                            await save();
                            renderAccounts();
                            summary.querySelector('.sip-resource-meta').textContent = `${(r.models||[]).length} Models • ${(r.accounts||[]).length} Accounts`;
                        };

                        // Label Field
                        const group1 = accCard.createDiv({ cls: 'sip-form-group', style: 'padding-right: 30px;' });
                        group1.createEl('label', { text: '标签' });
                        const lInput = group1.createEl('input', { cls: 'sip-input', type: 'text', value: acc.label || `Account ${idx+1}` });
                        lInput.placeholder = '例如: Default, Pro, Free...';
                        lInput.onchange = async () => { acc.label = lInput.value; await save(); };

                        // API Key Field
                        const group2 = accCard.createDiv({ cls: 'sip-form-group', style: 'margin-bottom:0;' });
                        group2.createEl('label', { text: 'API Key / 密钥文件路径' });
                        const kInput = group2.createEl('input', { cls: 'sip-input', type: 'text', value: acc.apiKey || acc.apiKeyPath || '' }); 
                        kInput.placeholder = 'sk-... 或 08-科技树/.../key.md';
                        kInput.onchange = async () => { 
                            const value = kInput.value.trim();
                            if (!value) {
                                acc.apiKey = '';
                                acc.apiKeyPath = '';
                            } else if (value.includes('/') || value.includes('\\') || value.endsWith('.md')) {
                                acc.apiKeyPath = value;
                                acc.apiKey = '';
                            } else {
                                acc.apiKey = value;
                                acc.apiKeyPath = '';
                            }
                            await save();
                        };
                    });

                    // Add Button
                    const addBtn = accList.createEl('button', { cls: 'sip-btn', text: '+ 添加账号 / 密钥' });
                    addBtn.style.width = '100%';
                    addBtn.style.marginTop = '8px';
                    addBtn.onclick = async () => {
                        r.accounts.push({ label: `Account ${r.accounts.length+1}`, apiKey: '', apiKeyPath: '' });
                        await save();
                        renderAccounts();
                        summary.querySelector('.sip-resource-meta').textContent = `${(r.models||[]).length} Models • ${(r.accounts||[]).length} Accounts`;
                    };
                };
                renderAccounts();
            });

            // Add Provider Button
            const addProvBtn = resBody.createEl('button', { cls: 'sip-btn', text: '+ 新增服务商', style: 'margin-top:16px; width:100%; padding:12px;' });
            addProvBtn.onclick = async () => {
                const id = `custom_${Date.now().toString().slice(-4)}`;
                resources[id] = { name: 'New Provider', models: [], accounts: [{}] };
                await save();
                this.display();
            };
        };

        const renderPipeline = () => {
            const grid = contentEl.createDiv({ cls: 'sip-grid-1', style: 'display: grid; grid-template-columns: 1fr; gap: 24px;' });

            // Stage 1 Card
            const stage1Card = grid.createDiv({ cls: 'sip-card' });
            const s1Header = stage1Card.createDiv({ cls: 'sip-card-header' });
            s1Header.createEl('h3', { text: 'Stage 1: 语义分类', cls: 'sip-section-title' });
            s1Header.createEl('p', { text: 'AI 将根据此提示词判断用户意图，分流至不同模块。' });
            
            const s1Body = stage1Card.createDiv({ cls: 'sip-card-body' });
            addPromptEditor(
                s1Body,
                '分类提示词',
                '可用变量：${text} ${petNames}',
                () => this.plugin.promptManager.getStage1Prompt(),
                (v) => { this.plugin.promptManager.saveUserOverride(['pipeline', 'stage1_classification_prompt'], v); },
                ['${text}', '${petNames}'],
                { minHeight: '300px' }
            );

            // Stage 2 Card
            const stage2Card = grid.createDiv({ cls: 'sip-card' });
            const s2Header = stage2Card.createDiv({ cls: 'sip-card-header' });
            s2Header.createEl('h3', { text: 'Stage 2: 通用优化', cls: 'sip-section-title' });
            s2Header.createEl('p', { text: '当模块未启用专属优化时，将使用此通用提示词进行处理。' });

            const s2Body = stage2Card.createDiv({ cls: 'sip-card-body' });
            addPromptEditor(
                s2Body,
                '优化提示词',
                '可用变量：${text}',
                () => this.plugin.promptManager.getStage2Prompt(),
                (v) => { this.plugin.promptManager.saveUserOverride(['pipeline', 'stage2_optimization_prompt'], v); },
                ['${text}'],
                { minHeight: '300px' }
            );
        };

        const renderModules = () => {
            const modules = s.modules || {};
            const moduleIds = Object.keys(modules).filter((k) => modules[k] && typeof modules[k] === 'object');
            if (!this._activeModuleId || !moduleIds.includes(this._activeModuleId)) {
                this._activeModuleId = moduleIds[0] || '';
            }

            const container = contentEl.createDiv({ cls: 'sip-module-layout' });
            
            // Sidebar
            const sidebar = container.createDiv({ cls: 'sip-module-sidebar' });
            moduleIds.forEach((mid) => {
                const isActive = this._activeModuleId === mid;
                const item = sidebar.createDiv({ cls: `sip-sidebar-item ${isActive ? 'active' : ''}` });
                item.onclick = () => { this._activeModuleId = mid; this.display(); };
                // item.insertAdjacentHTML('beforeend', this.getIcon('module')); // Icon removed
                const label = this.plugin.getCategoryDisplayName ? this.plugin.getCategoryDisplayName(mid) : mid;
                item.createSpan({ text: label });
            });

            // Detail Area
            const detail = container.createDiv({ cls: 'sip-module-detail' });
            const mid = this._activeModuleId;
            const m = modules[mid];
            if (!m) return;

            const card = detail.createDiv({ cls: 'sip-card' });
            
            // Header
            const header = card.createDiv({ cls: 'sip-card-header' });
            const titleWrap = header.createDiv();
            const moduleTitleFallback = DEFAULT_SETTINGS.ui?.moduleDisplayName?.[mid] || (this.plugin.getCategoryDisplayName ? this.plugin.getCategoryDisplayName(mid) : mid);
            const displayTitle = String(s.ui.moduleDisplayName?.[mid] || moduleTitleFallback);
            
            const titleEl = titleWrap.createEl('h3', { text: displayTitle, cls: 'sip-section-title' });
            titleWrap.createEl('p', { text: `Module ID: ${mid}` });
            
            attachInlineEdit(titleEl, () => String(s.ui.moduleDisplayName?.[mid] || moduleTitleFallback), async (v) => {
                await setModuleDisplayName(mid, v);
                this.display();
            });

            // Body
            const body = card.createDiv({ cls: 'sip-card-body' });
            
            // Toggles Grid
            const togglesGrid = body.createDiv({ cls: 'sip-grid-2', style: 'margin-bottom:24px;' });
            
            // Enable Toggle
            const t1 = togglesGrid.createDiv({ cls: 'sip-form-group sip-bordered-group' }); // Added sip-bordered-group
            new Setting(t1)
                .setName(getFieldLabel('module.enabled', '启用模块'))
                .addToggle(t => t.setValue(m.enabled !== false).onChange(async v => { m.enabled = v; await save(); }));
            attachInlineEdit(t1.querySelector('.setting-item-name'), () => getFieldLabel('module.enabled', '启用模块'), async (v) => {
                await setFieldLabel('module.enabled', v, '启用模块');
                this.display();
            });

            // Optimize Toggle
            const t2 = togglesGrid.createDiv({ cls: 'sip-form-group sip-bordered-group' }); // Added sip-bordered-group
            new Setting(t2)
                .setName(getFieldLabel('module.enableOptimization', '启用语义优化'))
                .addToggle(t => t.setValue(!!m.enableOptimization).onChange(async v => { m.enableOptimization = v; await save(); }));
             attachInlineEdit(t2.querySelector('.setting-item-name'), () => getFieldLabel('module.enableOptimization', '启用语义优化'), async (v) => {
                await setFieldLabel('module.enableOptimization', v, '启用语义优化');
                this.display();
            });

            // Paths
            if ('targetPath' in m) {
                const pg = body.createDiv({ cls: 'sip-form-group' });
                const labelText = getFieldLabel('module.targetPath', '文件保存路径');
                const lbl = pg.createEl('label', { text: labelText });
                attachInlineEdit(lbl, () => getFieldLabel('module.targetPath', '文件保存路径'), async (v) => {
                    await setFieldLabel('module.targetPath', v, '文件保存路径');
                    this.display();
                });
                
                const inp = pg.createEl('input', { cls: 'sip-input', type: 'text', value: m.targetPath || '' });
                inp.onchange = async () => {
                    m.targetPath = inp.value.trim();
                    if (mid === 'bill') s.billPath = m.targetPath;
                    if (mid === 'food_wishlist') s.foodWishlistPath = m.targetPath;
                    if (mid === 'price_tracker') s.priceTrackPath = m.targetPath;
                    if (mid === 'other') s.capturePath = m.targetPath;
                    await save();
                };
            }

            if ('templatePath' in m) {
                const pg = body.createDiv({ cls: 'sip-form-group' });
                const labelText = getFieldLabel('module.templatePath', '模板路径');
                const lbl = pg.createEl('label', { text: labelText });
                 attachInlineEdit(lbl, () => getFieldLabel('module.templatePath', '模板路径'), async (v) => {
                    await setFieldLabel('module.templatePath', v, '模板路径');
                    this.display();
                });

                const inp = pg.createEl('input', { cls: 'sip-input', type: 'text', value: m.templatePath || '' });
                inp.onchange = async () => {
                    m.templatePath = inp.value.trim();
                    s.templatePath = m.templatePath;
                    await save();
                };
            }

            // Prompt Editor
            if ('extractionPrompt' in m || mid) {
                const varMap = {
                    bill: ['${sysDateStr}', '${weekDayStr}', '${optimizedText}'],
                    task: ['${currentDate}', '${optimizedText}'],
                    memo: ['${currentDate}', '${optimizedText}'],
                    code_dev: ['${currentDate}', '${optimizedText}'],
                    question_entry: ['${optimizedText}'],
                    study_record: ['${optimizedText}'],
                    contact: ['${optimizedText}'],
                    food_wishlist: ['${optimizedText}'],
                    price_tracker: ['${optimizedText}'],
                    pet_growth: ['${petNames}', '${currentDate}', '${optimizedText}']
                };
                
                body.createEl('hr', { style: 'margin: 24px 0; border:none; border-top:1px solid var(--sip-border);' });

                addPromptEditor(
                    body,
                    getFieldLabel('module.extractionPrompt', '核心提取提示词'),
                    '用于 stage2 结构化提取',
                    () => this.plugin.promptManager.getModulePrompt(mid),
                    (v) => { this.plugin.promptManager.saveUserOverride(['modules', mid, 'extractionPrompt'], v); },
                    varMap[mid] || ['${optimizedText}'],
                    { titleKey: 'module.extractionPrompt', titleFallback: '核心提取提示词', minHeight: '300px' }
                );
            }

            if (mid === 'bill') {
                body.createEl('hr', { style: 'margin: 24px 0; border:none; border-top:1px solid var(--sip-border);' });
                addPromptEditor(
                    body,
                    getFieldLabel('bill.asset_log_prompt', '资产信息提取（可选）'),
                    '可用变量：${text}',
                    () => this.plugin.promptManager.getAssetLogPrompt(),
                    (v) => { this.plugin.promptManager.saveUserOverride(['modules', 'bill', 'asset_log_prompt'], v); },
                    ['${text}'],
                    { minHeight: '200px', titleKey: 'bill.asset_log_prompt', titleFallback: '资产信息提取（可选）' }
                );
            }
        };

        const renderAdvanced = () => {
            const grid = contentEl.createDiv({ cls: 'sip-grid-2' });

            // System Settings
            const sysCard = grid.createDiv({ cls: 'sip-card' });
            const sHeader = sysCard.createDiv({ cls: 'sip-card-header' });
            sHeader.createEl('h3', { text: '系统设置', cls: 'sip-section-title' });
            
            const sBody = sysCard.createDiv({ cls: 'sip-card-body' });
            
            // Wrapped in bordered group
            const sysGroup1 = sBody.createDiv({ cls: 'sip-form-group sip-bordered-group' });
            new Setting(sysGroup1)
                .setName('智能语义分类')
                .setDesc('是否启用第一步的语义分类与文本优化')
                .addToggle((toggle) => {
                    toggle.setValue(!!s.autoClassify).onChange(async (value) => {
                        s.autoClassify = !!value;
                        await save();
                    });
                });

            const sysGroup2 = sBody.createDiv({ cls: 'sip-form-group sip-bordered-group', style: 'margin-top: 12px;' });
            new Setting(sysGroup2)
                .setName('日志保留天数')
                .setDesc('自动清理旧日志文件的周期')
                .addDropdown((dropdown) => {
                    dropdown
                        .addOption('3', '3天')
                        .addOption('7', '7天')
                        .addOption('30', '30天')
                        .setValue(String(Config.LOG_RETENTION_DAYS || 7))
                        .onChange(async (value) => {
                            Config.LOG_RETENTION_DAYS = parseInt(value, 10);
                            await save();
                        });
                });

            // Token Tracking
            const tokenCard = grid.createDiv({ cls: 'sip-card' });
            const tHeader = tokenCard.createDiv({ cls: 'sip-card-header' });
            tHeader.createEl('h3', { text: '成本追踪', cls: 'sip-section-title' });
            
            const tBody = tokenCard.createDiv({ cls: 'sip-card-body' });

            const tokenGroup = tBody.createDiv({ cls: 'sip-form-group sip-bordered-group' });
            new Setting(tokenGroup)
                .setName('记录 Token 消耗')
                .setDesc('开启后，将每次的 Token 用量追加到日志文件')
                .addToggle((toggle) => {
                    toggle.setValue(!!s.enableTokenCostTracking).onChange(async (value) => {
                        s.enableTokenCostTracking = !!value;
                        await save();
                        this.display();
                    });
                });

            if (s.enableTokenCostTracking) {
                const pg = tBody.createDiv({ cls: 'sip-form-group', style: 'margin-top:16px;' });
                pg.createEl('label', { text: 'Token 记录文件路径' });
                const inp = pg.createEl('input', { cls: 'sip-input', type: 'text', value: s.tokenCostFilePath || '' });
                inp.onchange = async () => {
                    s.tokenCostFilePath = inp.value.trim();
                    await save();
                };
            }
        };

        // Navigation & Rendering Logic (New Slider Architecture)
        
        // 1. Create Main Container
        const sliderContainer = containerEl.createDiv({ cls: 'sip-slider-container' });
        
        // 2. Render Banner (Header)
        const currentKey = SECTIONS[this.currentSectionIndex];
        const config = SECTION_CONFIG[currentKey];
        
        const banner = sliderContainer.createDiv({ cls: 'sip-nav-banner' });
        
        // Left Arrow
        const prevBtn = banner.createDiv({ cls: 'sip-nav-arrow prev' });
        prevBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
        if (this.currentSectionIndex === 0) prevBtn.addClass('hidden');
        prevBtn.onclick = (e) => {
            e.stopPropagation();
            if (this.currentSectionIndex > 0) {
                this.currentSectionIndex--;
                this.display();
            }
        };

        // Right Arrow
        const nextBtn = banner.createDiv({ cls: 'sip-nav-arrow next' });
        nextBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
        if (this.currentSectionIndex === SECTIONS.length - 1) nextBtn.addClass('hidden');
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            if (this.currentSectionIndex < SECTIONS.length - 1) {
                this.currentSectionIndex++;
                this.display();
            }
        };

        // Banner Content
        const iconWrap = banner.createDiv({ cls: 'sip-nav-banner-icon' });
        iconWrap.innerHTML = this.getIcon(config.icon);
        
        banner.createDiv({ cls: 'sip-nav-banner-title', text: config.title });
        banner.createDiv({ cls: 'sip-nav-banner-desc', text: config.desc });

        // 3. Render Content View
        contentEl = sliderContainer.createDiv({ cls: 'sip-settings-container sip-content-view' });
        
        // Swipe Logic for Mobile
        let touchStartX = 0;
        let touchEndX = 0;
        
        banner.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        banner.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
        
        const handleSwipe = () => {
            const threshold = 50;
            if (touchStartX - touchEndX > threshold) {
                // Swiped Left -> Next
                this.currentSectionIndex = (this.currentSectionIndex + 1) % SECTIONS.length;
                this.display();
            }
            if (touchEndX - touchStartX > threshold) {
                // Swiped Right -> Prev
                this.currentSectionIndex = (this.currentSectionIndex - 1 + SECTIONS.length) % SECTIONS.length;
                this.display();
            }
        };

        // Render specific section
        if (currentKey === 'strategy') renderStrategy();
        else if (currentKey === 'pipeline') renderPipeline();
        else if (currentKey === 'modules') renderModules();
        else if (currentKey === 'advanced') renderAdvanced();

    }
}
