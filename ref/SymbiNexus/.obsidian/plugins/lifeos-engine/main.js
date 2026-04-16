const { Plugin, PluginSettingTab, Setting, Notice, Modal, TFile, setIcon } = require("obsidian");

const ENGINE_CONFIG_DIR = ".obsidian/plugins/lifeos-engine/config";
const TASK_CFG_PATH = `${ENGINE_CONFIG_DIR}/task.config.json`;
const FINANCE_CFG_PATH = `${ENGINE_CONFIG_DIR}/finance.config.json`;
const ASSET_CFG_PATH = `${ENGINE_CONFIG_DIR}/assets.config.json`;
const TASK_CACHE_PATH = `${ENGINE_CONFIG_DIR}/task.index.json`;

const SKELETON_HTML = `
<div class="td-skeleton-wrapper">
  <div class="td-container td-skeleton">
    <div class="td-header-card td-skeleton-header">
      <div class="td-skeleton-title"></div>
      <div class="td-skeleton-date"></div>
    </div>
    <div class="td-timeline-wrapper">
      <div class="td-section td-skeleton-section"><div class="td-skeleton-card"></div></div>
      <div class="td-section td-skeleton-section"><div class="td-skeleton-card"></div></div>
      <div class="td-section td-skeleton-section"><div class="td-skeleton-card"></div></div>
    </div>
  </div>
</div>
<style>
.td-skeleton-wrapper{position:relative}
.td-skeleton-wrapper .td-skeleton-header{min-height:120px}
.td-skeleton-wrapper .td-skeleton-title{width:180px;height:28px;background:linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);background-size:200% 100%;animation:td-skeleton-pulse 1.5s ease-in-out infinite;border-radius:8px;margin-bottom:8px}
.td-skeleton-wrapper .td-skeleton-date{width:80px;height:32px;background:linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);background-size:200% 100%;animation:td-skeleton-pulse 1.5s ease-in-out infinite;border-radius:4px;margin-left:auto}
.td-skeleton-wrapper .td-skeleton-section{padding-left:34px;margin-bottom:16px}
.td-skeleton-wrapper .td-skeleton-card{height:80px;background:linear-gradient(90deg,#f8fafc 25%,#f1f5f9 50%,#f8fafc 75%);background-size:200% 100%;animation:td-skeleton-pulse 1.5s ease-in-out infinite;border-radius:10px;border:1px solid #f1f5f9}
@keyframes td-skeleton-pulse{0%{background-position:200% 0}100%{background-position:-200% 0}}
</style>`;

const SKELETON_STYLE_ID = "lifeos-skeleton-style";

function parseBlockArgs(source) {
  const s = String(source || "").trim();
  if (!s) return {};
  if ((s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"))) {
    try {
      const v = JSON.parse(s);
      return v && typeof v === "object" ? v : {};
    } catch (_) {
      return {};
    }
  }
  const out = {};
  for (const line of s.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const idx = t.indexOf(":");
    if (idx <= 0) continue;
    const k = t.slice(0, idx).trim();
    const v = t.slice(idx + 1).trim();
    out[k] = v;
  }
  return out;
}

function normalizeSettings(s) {
  const base = {
    version: 1,
    initialized: false,
    global: {
      shells: {
        enabled: true,
        rebindStrategy: "marker_then_filename",
        directories: {
          taskConsoleDir: "01-经纬矩阵系统/01-看板模块",
          financeConsoleDir: "06-财务系统/02-统计分析",
          taskDashboardsDir: "01-经纬矩阵系统/01-看板模块",
          financeDashboardsDir: "06-财务系统/02-统计分析",
          configPagesDir: "08-科技树系统/01-OB_LifeOS_Build/99-文档"
        }
      }
    },
    task: null,
    finance: null,
    links: {
      shells: {},
      dashboards: {}
    }
  };
  const out = s && typeof s === "object" ? s : {};
  const merged = Object.assign({}, base, out);
  merged.global = merged.global && typeof merged.global === "object" ? merged.global : base.global;
  merged.global.shells = merged.global.shells && typeof merged.global.shells === "object" ? merged.global.shells : base.global.shells;
  merged.global.shells.enabled = merged.global.shells.enabled !== false;
  merged.global.shells.rebindStrategy = String(merged.global.shells.rebindStrategy || base.global.shells.rebindStrategy);
  merged.global.shells.directories = merged.global.shells.directories && typeof merged.global.shells.directories === "object" ? merged.global.shells.directories : base.global.shells.directories;
  merged.global.shells.directories = Object.assign({}, base.global.shells.directories, merged.global.shells.directories);
  merged.links = merged.links && typeof merged.links === "object" ? merged.links : base.links;
  merged.links.shells = merged.links.shells && typeof merged.links.shells === "object" ? merged.links.shells : {};
  merged.links.dashboards = merged.links.dashboards && typeof merged.links.dashboards === "object" ? merged.links.dashboards : {};
  return merged;
}

class SimpleConsoleModal extends Modal {
  constructor(app, title, renderFn) {
    super(app);
    this._title = title;
    this._renderFn = renderFn;
  }
  onOpen() {
    this.setTitle(this._title);
    const root = this.contentEl;
    root.empty();
    this._renderFn(root);
  }
}

class LifeOSEngineSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "LifeOS Engine" });

    new Setting(containerEl)
      .setName("壳文件启用")
      .setDesc("启用后可在 Vault 中使用 md 壳打开看板/配置页。")
      .addToggle(t => t.setValue(this.plugin.settings.global.shells.enabled).onChange(async v => {
        this.plugin.settings.global.shells.enabled = v;
        await this.plugin.saveSettings();
      }));

    const dirs = this.plugin.settings.global.shells.directories;
    const addDir = (name, desc, key) => {
      new Setting(containerEl)
        .setName(name)
        .setDesc(desc)
        .addText(t => t.setValue(String(dirs[key] || "")).onChange(async v => {
          dirs[key] = v;
          await this.plugin.saveSettings();
        }));
    };

    addDir("任务控制台目录", "生成任务控制台壳文件的默认目录（vault 相对路径）。", "taskConsoleDir");
    addDir("财务控制台目录", "生成财务控制台壳文件的默认目录（vault 相对路径）。", "financeConsoleDir");
    addDir("任务看板目录", "生成任务看板壳文件的默认目录（vault 相对路径）。", "taskDashboardsDir");
    addDir("财务看板目录", "生成财务看板壳文件的默认目录（vault 相对路径）。", "financeDashboardsDir");
    addDir("配置页目录", "生成配置页壳文件的默认目录（vault 相对路径）。", "configPagesDir");

    new Setting(containerEl)
      .setName("打开任务控制台")
      .addButton(b => b.setButtonText("打开").onClick(() => this.plugin.openTaskConsole()));
    new Setting(containerEl)
      .setName("打开财务控制台")
      .addButton(b => b.setButtonText("打开").onClick(() => this.plugin.openFinanceConsole()));
  }
}

class LifeOSEnginePlugin extends Plugin {
  async onload() {
    this.settings = normalizeSettings(await this.loadData());
    this.__fileMtimeCache = new Map();
    this.__parsedTasksCache = new Map();
    this.__taskPagesCache = null;
    this.__engineLoaded = false;
    this.__engineLoadPromise = null;
    
    this._loadTaskCache().then(() => {
      this._preloadTaskData();
    }).catch(() => {});
    
    await this.bootstrapSettingsFromVault();
    await this.saveSettings();

    this.addSettingTab(new LifeOSEngineSettingTab(this.app, this));

    this.addCommand({
      id: "open-task-console",
      name: "打开任务控制台",
      callback: () => this.openTaskConsole()
    });
    this.addCommand({
      id: "open-finance-console",
      name: "打开财务控制台",
      callback: () => this.openFinanceConsole()
    });

    this.registerMarkdownCodeBlockProcessor("lifeos-finance", async (source, el, ctx) => {
      el.empty();
      const args = parseBlockArgs(source);
      const mode = String(args.mode || "").trim() || "console";
      if (mode === "console") return this.renderFinanceConsole(el);
      if (mode === "assets" || mode === "asset") {
        await this.renderAssetDashboard(el);
        return;
      }
      const period = String(args.period || args.targetDate || args.targetYear || "").trim();
      if (mode !== "month" && mode !== "year") {
        el.createEl("div", { text: `lifeos-engine 财务模块不支持该 mode：${mode}` });
        return;
      }
      if (!period) {
        el.createEl("div", { text: "lifeos-engine 财务模块缺少 period（例如 2026-01 或 2026）" });
        return;
      }
      await this.ensureEChartsLoaded();
      await this.ensureFinanceEngineLoaded();
      const dv = { container: el };
      try {
        const cfg = await this._readVaultJson(FINANCE_CFG_PATH);
        if (cfg) window.FinanceVizKit.__config = cfg;
        await window.FinanceVizKit.init();
        await window.FinanceVizKit.render.main(dv, { targetDate: period, configPath: FINANCE_CFG_PATH });
      } catch (e) {
        el.empty();
        el.createEl("div", { text: `lifeos-engine 财务渲染失败：${e?.message || e}` });
      }
    });

    this.registerMarkdownCodeBlockProcessor("lifeos-task", async (source, el, ctx) => {
      const args = parseBlockArgs(source);
      const mode = String(args.mode || "").trim() || "console";
      if (mode === "console") {
        el.empty();
        return this.renderTaskConsole(el);
      }
      if (mode === "today-focus" || mode === "today") {
        await this.ensureTaskEngineLoaded();
        await this.renderTaskViaKit(el, { mode: "main" });
        return;
      }
      el.innerHTML = `<div class="td-error">lifeos-engine 任务模块不支持该 mode：${mode}</div>`;
    });

    this.registerMarkdownCodeBlockProcessor("lifeos-config", async (source, el, ctx) => {
      el.empty();
      const args = parseBlockArgs(source);
      const module = String(args.module || args.section || "").trim();
      if (module === "finance") return this.renderFinanceConfig(el);
      if (module === "task") return this.renderTaskConfig(el);
      el.createEl("div", { text: "lifeos-engine：未指定 module（finance/task）" });
    });

    let weeklyCheckTimer = null;
    const runWeeklyCheck = async () => {
      try {
        await this.ensureTaskEngineLoaded();
        const Kit = window.TaskDashboardKit;
        if (!Kit) return;
        Kit.data.L = this._getLuxonShim();
        const cfg = await Kit.config.load(TASK_CFG_PATH);
        await Kit.config.ensureWeeklyRollover(TASK_CFG_PATH, cfg);
      } catch (_) {}
    };
    const scheduleWeeklyCheck = () => {
      if (weeklyCheckTimer) clearTimeout(weeklyCheckTimer);
      weeklyCheckTimer = setTimeout(() => {
        weeklyCheckTimer = null;
        runWeeklyCheck();
      }, 600);
    };
    scheduleWeeklyCheck();
    this.registerEvent(this.app.vault.on("create", (file) => {
      if (!file || file.extension !== "md") return;
      scheduleWeeklyCheck();
    }));
    this.registerEvent(this.app.vault.on("modify", (file) => {
      if (!file || file.extension !== "md") return;
      this._clearTaskCache(file.path);
    }));
    this.registerEvent(this.app.vault.on("delete", (file) => {
      if (!file || file.extension !== "md") return;
      this._clearTaskCache(file.path);
    }));
  }

  onunload() {
    if (this._weeklyCheckTimer) {
      clearTimeout(this._weeklyCheckTimer);
      this._weeklyCheckTimer = null;
    }
    
    if (window.TaskDashboardKit) {
      if (window.TaskDashboardKit.__runtime) {
        window.TaskDashboardKit.__runtime = null;
      }
      if (window.TaskDashboardKit.__renderTimers) {
        window.TaskDashboardKit.__renderTimers.forEach(id => clearTimeout(id));
        window.TaskDashboardKit.__renderTimers = [];
      }
      window.TaskDashboardKit.__config = null;
      window.TaskDashboardKit.__motion = null;
    }
    
    this.__taskPagesCache = null;
    this.__luxonShim = null;
    if (this.__fileMtimeCache) this.__fileMtimeCache.clear();
    if (this.__parsedTasksCache) this.__parsedTasksCache.clear();
  }
  
  _clearTaskCache(filePath) {
    if (!this.__fileMtimeCache || !this.__parsedTasksCache) return;
    if (filePath) {
      this.__fileMtimeCache.delete(filePath);
      this.__parsedTasksCache.delete(filePath);
    } else {
      this.__fileMtimeCache.clear();
      this.__parsedTasksCache.clear();
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async _readVaultJson(path) {
    const adapter = this.app.vault.adapter;
    try {
      const exists = await adapter.exists(path);
      if (!exists) return null;
      const raw = await adapter.read(path);
      return JSON.parse(raw || "{}");
    } catch (_) {
      return null;
    }
  }

  async _writeVaultJson(path, obj) {
    const adapter = this.app.vault.adapter;
    try {
      await adapter.mkdir(ENGINE_CONFIG_DIR).catch(() => {});
      await adapter.write(path, JSON.stringify(obj || {}, null, 2));
      return true;
    } catch (_) {
      return false;
    }
  }

  async bootstrapSettingsFromVault() {
    if (this.settings.initialized) return;
    const legacyTaskCfgPath = "01-经纬矩阵系统/01-看板模块/今日聚焦.config.json";
    const legacyFinanceCfgPath = "06-财务系统/02-统计分析/财务看板.config.json";
    let taskCfg = await this._readVaultJson(TASK_CFG_PATH);
    let financeCfg = await this._readVaultJson(FINANCE_CFG_PATH);
    if (!taskCfg) taskCfg = await this._readVaultJson(legacyTaskCfgPath);
    if (!financeCfg) financeCfg = await this._readVaultJson(legacyFinanceCfgPath);
    if (taskCfg) await this._writeVaultJson(TASK_CFG_PATH, taskCfg);
    if (financeCfg) await this._writeVaultJson(FINANCE_CFG_PATH, financeCfg);
    this.settings.initialized = true;
    new Notice("✅ lifeos-engine 已加载集中任务/财务配置");
  }

  async ensureEChartsLoaded() {
    if (window.echarts) return;
    const pluginDir = this.manifest.dir;
    const p = `${pluginDir}/assets/echarts.min.js`;
    const adapter = this.app.vault.adapter;
    try {
      const exists = await adapter.exists(p);
      if (!exists) {
        new Notice("❌ lifeos-engine 缺少 ECharts 资源：assets/echarts.min.js");
        return;
      }
      const content = await adapter.read(p);
      const s = document.createElement("script");
      s.textContent = content;
      document.head.appendChild(s);
    } catch (_) {}
  }

  async ensureFinanceEngineLoaded() {
    if (window.FinanceVizKit) return;
    const pluginDir = this.manifest.dir;
    const target = `${pluginDir}/assets/finance-viz-kit.js`;
    const adapter = this.app.vault.adapter;
    try {
      const exists = await adapter.exists(target);
      if (!exists) throw new Error("missing assets/finance-viz-kit.js");
      const code = await adapter.read(target);
      new Function("window", "document", "app", "Notice", code)(window, document, this.app, Notice);
      if (window.FinanceVizKit && window.echarts) {
        window.FinanceVizKit.initECharts = async () => {};
      }
    } catch (e) {
      new Notice(`❌ Finance 引擎加载失败（请确认插件 assets 完整）：${e?.message || e}`);
    }
  }

  _getLuxonShim() {
    if (this.__luxonShim) return this.__luxonShim;
    const msPerDay = 86400000;
    class DT {
      constructor(date) {
        this._d = date instanceof Date ? date : new Date(date);
        this.isValid = !Number.isNaN(this._d.getTime());
      }
      static local() {
        return new DT(new Date());
      }
      static fromISO(iso) {
        const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
        if (!m) return new DT(new Date(NaN));
        const y = Number(m[1]);
        const mo = Number(m[2]) - 1;
        const d = Number(m[3]);
        const dt = new Date(y, mo, d, 0, 0, 0, 0);
        return new DT(dt);
      }
      static fromObject(obj) {
        const y = Number(obj?.year);
        const mo = Number(obj?.month) - 1;
        const d = Number(obj?.day);
        const h = Number(obj?.hour || 0);
        const mi = Number(obj?.minute || 0);
        const dt = new Date(y, mo, d, h, mi, 0, 0);
        return new DT(dt);
      }
      get year() { return this._d.getFullYear(); }
      get month() { return this._d.getMonth() + 1; }
      get day() { return this._d.getDate(); }
      get hour() { return this._d.getHours(); }
      get minute() { return this._d.getMinutes(); }
      toISODate() {
        const y = this.year;
        const m = String(this.month).padStart(2, "0");
        const d = String(this.day).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
      startOf(unit) {
        if (unit !== "day") return this;
        return new DT(new Date(this.year, this.month - 1, this.day, 0, 0, 0, 0));
      }
      endOf(unit) {
        if (unit !== "day") return this;
        return new DT(new Date(this.year, this.month - 1, this.day, 23, 59, 59, 999));
      }
      hasSame(other, unit) {
        if (!other || unit !== "day") return false;
        const o = other instanceof DT ? other : new DT(other);
        return this.year === o.year && this.month === o.month && this.day === o.day;
      }
      plus(obj) {
        const d = new Date(this._d.getTime());
        const days = Number(obj?.days || 0) || 0;
        const weeks = Number(obj?.weeks || 0) || 0;
        const months = Number(obj?.months || 0) || 0;
        const years = Number(obj?.years || 0) || 0;
        if (years) d.setFullYear(d.getFullYear() + years);
        if (months) d.setMonth(d.getMonth() + months);
        if (weeks) d.setDate(d.getDate() + weeks * 7);
        if (days) d.setDate(d.getDate() + days);
        return new DT(d);
      }
      minus(obj) {
        if (obj && typeof obj === "object" && Number.isFinite(obj.milliseconds)) {
          return new DT(new Date(this._d.getTime() - obj.milliseconds));
        }
        const days = Number(obj?.days || 0) || 0;
        const weeks = Number(obj?.weeks || 0) || 0;
        const months = Number(obj?.months || 0) || 0;
        const years = Number(obj?.years || 0) || 0;
        return this.plus({ days: -days, weeks: -weeks, months: -months, years: -years });
      }
      diff(other, unit) {
        const o = other instanceof DT ? other : new DT(other);
        const ms = this._d.getTime() - o._d.getTime();
        if (!unit) return { milliseconds: ms };
        if (unit === "days") return { days: ms / msPerDay };
        return { milliseconds: ms };
      }
      valueOf() { return this._d.getTime(); }
    }
    this.__luxonShim = { DateTime: DT };
    return this.__luxonShim;
  }

  _parseTasksForTaskKit(content, filePath) {
    const lines = String(content || "").split(/\r?\n/);
    const roots = [];
    const stack = [];
    const L = this._getLuxonShim();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let indent = "";
      let completed = false;
      let text = "";
      let isTask = false;

      // 1. 尝试匹配标准任务 (- [ ] Task)
      const mTask = String(line).match(/^(\s*)([-*])\s*\[([^\]])\]\s+(.*)$/);
      if (mTask) {
        isTask = true;
        indent = mTask[1] || "";
        completed = String(mTask[3]).toLowerCase() === "x";
        text = String(mTask[4] || "").trimEnd();
      } else {
        // 2. 尝试匹配普通列表项 (- Item)，仅用于作为子项
        const mList = String(line).match(/^(\s*)([-*])\s+(.*)$/);
        if (mList) {
          isTask = false;
          indent = mList[1] || "";
          completed = false;
          text = String(mList[3] || "").trimEnd();
        } else {
          continue;
        }
      }

      const due = (text.match(/📅\s*(\d{4}-\d{1,2}-\d{1,2})/) || [])[1] || "";
      const scheduled = (text.match(/⏳\s*(\d{4}-\d{1,2}-\d{1,2})/) || [])[1] || "";
      const start = (text.match(/🛫\s*(\d{4}-\d{1,2}-\d{1,2})/) || [])[1] || "";
      const completion = (text.match(/✅\s*(\d{4}-\d{1,2}-\d{1,2})/) || [])[1] || "";

      const toISO = (d) => {
        if (!d) return "";
        const parts = String(d).split("-");
        if (parts.length !== 3) return "";
        return `${parts[0]}-${String(parts[1]).padStart(2, "0")}-${String(parts[2]).padStart(2, "0")}`;
      };

      const task = {
        text,
        completed,
        line: i,
        position: { start: { line: i } },
        file: { path: filePath },
        path: filePath,
        children: [],
        isRemark: !isTask // [Flag] Mark non-task items (bullets)
      };
      if (due) task.due = L.DateTime.fromISO(toISO(due));
      if (scheduled) task.scheduled = L.DateTime.fromISO(toISO(scheduled));
      if (start) task.start = L.DateTime.fromISO(toISO(start));
      if (completion) task.completion = L.DateTime.fromISO(toISO(completion));

      // [Fix] Normalize indent length: expand tabs to 4 spaces to handle mixed tab/space indentation
      const indentLen = indent.replace(/\t/g, "    ").length;
      
      // Strict Parent-Child Logic: Child must have GREATER indent than Parent
      while (stack.length > 0 && indentLen <= stack[stack.length - 1].indentLen) stack.pop();
      
      if (stack.length > 0) {
        // 作为子项加入父级 (无论是任务还是列表项)
        const parentTask = stack[stack.length - 1].task;
        parentTask.children.push(task);
        // [Optional] Add parent reference for better compatibility
        task.parent = parentTask; 
        
        // 入栈，以便它也可以有子项
        stack.push({ indentLen, task });
      } else {
        // 顶层：只有真正的任务才作为 Root 加入
        if (isTask) {
          roots.push(task);
          stack.push({ indentLen, task });
        }
        // 顶层普通列表项被忽略 (不入栈，不显示)
      }
    }
    return roots;
  }

  async _dvPagesForTaskKit(sourceQuery) {
    return null;
  }

  async ensureTaskEngineLoaded() {
    if (window.TaskDashboardKit && this.__engineLoaded) return;
    
    if (this.__engineLoadPromise) {
      return this.__engineLoadPromise;
    }
    
    this.__engineLoadPromise = this._doLoadEngine();
    return this.__engineLoadPromise;
  }

  async _doLoadEngine() {
    const pluginDir = this.manifest.dir;
    const target = `${pluginDir}/assets/task-dashboard-kit.js`;
    const adapter = this.app.vault.adapter;
    try {
      const exists = await adapter.exists(target);
      if (!exists) throw new Error("missing assets/task-dashboard-kit.js");
      const code = await adapter.read(target);
      new Function("window", "document", "app", "Notice", code)(window, document, this.app, Notice);
    } catch (e) {
      this.__engineLoadPromise = null;
      new Notice(`❌ Task 引擎加载失败（请确认插件 assets 完整）：${e?.message || e}`);
      return;
    }

    if (!window.TaskDashboardKit) {
      this.__engineLoadPromise = null;
      return;
    }
    
    this.__engineLoaded = true;

    window.TaskDashboardKit.action.scheduleDataviewRefresh = () => {
      try { this.refreshActiveMarkdownView(); } catch (_) {}
    };

    const Kit = window.TaskDashboardKit;
    const origEnsureWeekly = typeof Kit.config.ensureWeeklyRollover === "function"
      ? Kit.config.ensureWeeklyRollover.bind(Kit.config)
      : null;

    if (origEnsureWeekly) {
      Kit.config.ensureWeeklyRollover = async (configPath, cfg) => {
        try {
          const archiveFolder = String(cfg?.weekly?.archiveFolder || "").trim();
          const alt = "01-经纬矩阵系统/99-任务归档/99-周委托归档";
          if (archiveFolder) {
            const af = this.app.vault.getAbstractFileByPath(archiveFolder);
            if (!af || !af.children) {
              const af2 = this.app.vault.getAbstractFileByPath(alt);
              if (af2 && af2.children) {
                cfg.weekly = cfg.weekly || {};
                cfg.weekly.archiveFolder = alt;
              }
            }
          }
        } catch (_) {}
        await origEnsureWeekly(configPath, cfg);
        try {
          this.__taskPagesCache = await this._buildTaskPagesForTaskKit(cfg);
        } catch (_) {
          this.__taskPagesCache = [];
        }
      };
    }
  }

  refreshActiveMarkdownView() {
    const leaf = this.app.workspace.activeLeaf;
    const view = leaf?.view;
    if (!view) return;
    try {
      if (typeof view.getViewType === "function" && view.getViewType() === "markdown") {
        if (view.previewMode && typeof view.previewMode.rerender === "function") {
          view.previewMode.rerender(true);
          return;
        }
        if (typeof view.rebuildView === "function") {
          view.rebuildView();
          return;
        }
      }
    } catch (_) {}
  }

  async renderTaskViaKit(el, opts) {
    const hasCache = Array.isArray(this.__taskPagesCache) && this.__taskPagesCache.length > 0;
    
    if (!hasCache) {
      el.innerHTML = SKELETON_HTML;
    }
    
    const [Kit] = await Promise.all([
      this.ensureTaskEngineLoaded().then(() => window.TaskDashboardKit),
      hasCache ? Promise.resolve() : this._loadTaskCache()
    ]);
    
    if (!Kit) {
      el.innerHTML = '<div class="td-error">❌ Task 引擎未就绪</div>';
      return;
    }
    
    try {
      await Kit.init?.();
    } catch (_) {}
    
    if (!Array.isArray(this.__taskPagesCache) || this.__taskPagesCache.length === 0) {
      try {
        const configPath = TASK_CFG_PATH;
        const cfg = await Kit.config.load(configPath);
        this.__taskPagesCache = await this._buildTaskPagesForTaskKit(cfg);
        this._saveTaskCache();
      } catch (e) {
        this.__taskPagesCache = [];
      }
    }
    
    const makePages = (arr) => {
      return {
        _pages: arr,
        where: function(fn) {
          let next = this._pages;
          try { next = next.filter(p => fn(p)); } catch (_) {}
          return makePages(next);
        },
        get file() {
          const tasksAll = [];
          for (const p of this._pages) tasksAll.push(...(p?.file?.tasks || []));
          return { tasks: tasksAll };
        }
      };
    };

    const dv = {
      container: el,
      luxon: this._getLuxonShim(),
      pages: (_) => makePages(Array.isArray(this.__taskPagesCache) ? this.__taskPagesCache : [])
    };
    
    try {
      if (opts?.mode === "config") await Kit.render.config(dv, { configPath: TASK_CFG_PATH });
      else await Kit.render.main(dv, { configPath: TASK_CFG_PATH });
    } catch (e) {
      el.innerHTML = `<div class="td-error">lifeos-engine 任务渲染失败：${e?.message || e}</div>`;
    }
  }

  async _buildTaskPagesForTaskKit(cfg) {
    const enabledSources = (cfg?.sources || []).filter(s => s && s.enabled !== false && s.path);
    const folders = enabledSources.filter(s => s.type === "folder").map(s => s.path);
    const files = enabledSources.filter(s => s.type === "file").map(s => s.path);
    const resolveSourceName = (() => {
      const folderSources = enabledSources
        .filter(s => s.type === "folder")
        .map(s => ({ path: String(s.path || "").replace(/\/+$/,"") + "/", name: s.name || s.path }))
        .sort((a, b) => b.path.length - a.path.length);
      const fileSources = new Map(enabledSources.filter(s => s.type === "file").map(s => [s.path, s.name || s.path]));
      return (filePath) => {
        const p = String(filePath || "").trim();
        if (!p) return "";
        const exact = fileSources.get(p);
        if (exact) return String(exact);
        for (const fs of folderSources) {
          if (p.startsWith(fs.path)) return String(fs.name);
        }
        return "";
      };
    })();

    const collectFiles = () => {
      const out = [];
      const seen = new Set();
      const addFile = (f) => {
        if (!f || !f.path || f.extension !== "md") return;
        if (seen.has(f.path)) return;
        seen.add(f.path);
        out.push(f);
      };
      const walkFolder = (folder) => {
        const children = folder?.children || [];
        for (const ch of children) {
          if (!ch) continue;
          if (ch.children) walkFolder(ch);
          else addFile(ch);
        }
      };
      folders.forEach(p => {
        const af = this.app.vault.getAbstractFileByPath(p);
        if (af && af.children) walkFolder(af);
      });
      files.forEach(p => {
        const af = this.app.vault.getAbstractFileByPath(p);
        if (af && af.extension === "md") addFile(af);
      });
      return out;
    };

    const allFiles = collectFiles();
    
    const processFile = async (f) => {
      const cachedMtime = this.__fileMtimeCache.get(f.path);
      const currentMtime = f.stat?.mtime;
      
      let roots = null;
      const useCache = cachedMtime && currentMtime && cachedMtime === currentMtime;
      
      if (useCache) {
        const cached = this.__parsedTasksCache.get(f.path);
        if (cached && Array.isArray(cached)) {
          roots = cached;
        }
      }
      
      if (!roots) {
        let content = "";
        try { content = await this.app.vault.read(f); } catch (_) { return null; }
        roots = this._parseTasksForTaskKit(content, f.path) || [];
        this.__parsedTasksCache.set(f.path, roots);
        if (currentMtime) this.__fileMtimeCache.set(f.path, currentMtime);
      }
      
      const flat = [];
      const flatten = (list) => {
        (list || []).forEach(t => {
          t.__sourceName = resolveSourceName(f.path);
          flat.push(t);
          if (t.children && t.children.length) flatten(t.children);
        });
      };
      flatten(roots);
      return { file: { path: f.path, tasks: flat } };
    };
    
    const BATCH_SIZE = 10;
    const pages = [];
    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
      const batch = allFiles.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map(processFile));
      for (const r of results) {
        if (r) pages.push(r);
      }
    }
    return pages;
  }

  async _loadTaskCache() {
    try {
      const adapter = this.app.vault.adapter;
      const exists = await adapter.exists(TASK_CACHE_PATH);
      if (!exists) return;
      const raw = await adapter.read(TASK_CACHE_PATH);
      const cache = JSON.parse(raw || "{}");
      if (cache && cache.mtimeCache && cache.parsedCache) {
        this.__fileMtimeCache = new Map(Object.entries(cache.mtimeCache));
        this.__parsedTasksCache = new Map(Object.entries(cache.parsedCache));
      }
    } catch (_) {}
  }

  async _saveTaskCache() {
    try {
      const adapter = this.app.vault.adapter;
      await adapter.mkdir(ENGINE_CONFIG_DIR).catch(() => {});
      const cache = {
        version: 1,
        savedAt: Date.now(),
        mtimeCache: Object.fromEntries(this.__fileMtimeCache),
        parsedCache: Object.fromEntries(this.__parsedTasksCache)
      };
      await adapter.write(TASK_CACHE_PATH, JSON.stringify(cache));
    } catch (_) {}
  }

  async _preloadTaskData() {
    try {
      await this.ensureTaskEngineLoaded();
      const Kit = window.TaskDashboardKit;
      if (!Kit) return;
      
      Kit.data.L = this._getLuxonShim();
      const cfg = await Kit.config.load(TASK_CFG_PATH);
      
      const cachedPages = [];
      const allFiles = this._collectTaskFiles(cfg);
      
      for (const f of allFiles) {
        const cachedMtime = this.__fileMtimeCache.get(f.path);
        const currentMtime = f.stat?.mtime;
        if (cachedMtime && currentMtime && cachedMtime === currentMtime) {
          const roots = this.__parsedTasksCache.get(f.path);
          if (roots && Array.isArray(roots)) {
            const flat = [];
            const resolveSourceName = this._createSourceNameResolver(cfg);
            const flatten = (list) => {
              (list || []).forEach(t => {
                t.__sourceName = resolveSourceName(f.path);
                flat.push(t);
                if (t.children && t.children.length) flatten(t.children);
              });
            };
            flatten(roots);
            cachedPages.push({ file: { path: f.path, tasks: flat } });
          }
        }
      }
      
      if (cachedPages.length > 0) {
        this.__taskPagesCache = cachedPages;
      }
    } catch (_) {}
  }

  _collectTaskFiles(cfg) {
    const enabledSources = (cfg?.sources || []).filter(s => s && s.enabled !== false && s.path);
    const folders = enabledSources.filter(s => s.type === "folder").map(s => s.path);
    const files = enabledSources.filter(s => s.type === "file").map(s => s.path);
    
    const out = [];
    const seen = new Set();
    const addFile = (f) => {
      if (!f || !f.path || f.extension !== "md") return;
      if (seen.has(f.path)) return;
      seen.add(f.path);
      out.push(f);
    };
    const walkFolder = (folder) => {
      const children = folder?.children || [];
      for (const ch of children) {
        if (!ch) continue;
        if (ch.children) walkFolder(ch);
        else addFile(ch);
      }
    };
    folders.forEach(p => {
      const af = this.app.vault.getAbstractFileByPath(p);
      if (af && af.children) walkFolder(af);
    });
    files.forEach(p => {
      const af = this.app.vault.getAbstractFileByPath(p);
      if (af && af.extension === "md") addFile(af);
    });
    return out;
  }

  _createSourceNameResolver(cfg) {
    const enabledSources = (cfg?.sources || []).filter(s => s && s.enabled !== false && s.path);
    const folderSources = enabledSources
      .filter(s => s.type === "folder")
      .map(s => ({ path: String(s.path || "").replace(/\/+$/,"") + "/", name: s.name || s.path }))
      .sort((a, b) => b.path.length - a.path.length);
    const fileSources = new Map(enabledSources.filter(s => s.type === "file").map(s => [s.path, s.name || s.path]));
    
    return (filePath) => {
      const p = String(filePath || "").trim();
      if (!p) return "";
      const exact = fileSources.get(p);
      if (exact) return String(exact);
      for (const fs of folderSources) {
        if (p.startsWith(fs.path)) return String(fs.name);
      }
      return "";
    };
  }

  openTaskConsole() {
    const m = new SimpleConsoleModal(this.app, "任务控制台", (root) => this.renderTaskConsole(root));
    m.open();
  }

  openFinanceConsole() {
    const m = new SimpleConsoleModal(this.app, "财务控制台", (root) => this.renderFinanceConsole(root));
    m.open();
  }

  _renderCard(el, title, desc) {
    const root = el.createEl("div");
    root.className = "lifeos-engine-root";
    const card = root.createEl("div");
    card.className = "lifeos-engine-card";
    card.createEl("div", { text: title }).className = "lifeos-engine-title";
    card.createEl("div", { text: desc }).className = "lifeos-engine-desc";
    const actions = card.createEl("div");
    actions.className = "lifeos-engine-actions";
    return { root, card, actions };
  }

  renderTaskConsole(el) {
    el.empty();
    const root = el.createEl("div");
    root.className = "lifeos-console";

    const header = root.createEl("div");
    header.className = "lifeos-console-header";
    const left = header.createEl("div");
    left.createEl("h2", { text: "任务控制台" }).className = "lifeos-console-title";
    left.createEl("div", { text: "一张图看清：今日聚焦、周委托换周归档、任务来源配置、索引与维护入口。" }).className = "lifeos-console-subtitle";

    const right = header.createEl("div");
    right.style.display = "flex";
    right.style.gap = "10px";
    right.style.flexWrap = "wrap";
    const btnFocus = right.createEl("button", { text: "打开今日聚焦" });
    btnFocus.className = "lifeos-engine-btn primary";
    btnFocus.onclick = () => this.openByPathOrName("今日聚焦.md");
    const btnCfg = right.createEl("button", { text: "打开任务配置" });
    btnCfg.className = "lifeos-engine-btn";
    btnCfg.onclick = () => this.openByPathOrName("今日聚焦配置.md");

    const kpiGrid = root.createEl("div");
    kpiGrid.className = "lifeos-kpi-grid";
    const makeKpi = (label) => {
      const box = kpiGrid.createEl("div");
      box.className = "lifeos-kpi";
      box.createEl("div", { text: label }).className = "lifeos-kpi-label";
      const val = box.createEl("div", { text: "—" });
      val.className = "lifeos-kpi-value";
      const sub = box.createEl("div", { text: "" });
      sub.className = "lifeos-kpi-sub";
      return { val, sub };
    };
    const kOverdue = makeKpi("滞后待办");
    const kToday = makeKpi("今日待办");
    const kForecast = makeKpi("未来前瞻");
    const kUndated = makeKpi("待排期");
    const kDone = makeKpi("今日已完结");
    const kRecurring = makeKpi("循环任务");
    const kSources = makeKpi("来源数量");
    const kFiles = makeKpi("扫描文件");

    const sec1 = root.createEl("div");
    sec1.className = "lifeos-section";
    sec1.createEl("div", { text: "核心入口" }).className = "lifeos-section-title";
    const tiles1 = sec1.createEl("div");
    tiles1.className = "lifeos-tile-grid";

    const tile = (title, desc, actions) => {
      const t = tiles1.createEl("div");
      t.className = "lifeos-tile";
      t.createEl("div", { text: title }).className = "lifeos-tile-title";
      t.createEl("div", { text: desc }).className = "lifeos-tile-desc";
      const a = t.createEl("div");
      a.className = "lifeos-tile-actions";
      actions(a);
      return t;
    };

    const openBtn = (host, text, onClick, primary) => {
      const b = host.createEl("button", { text });
      b.className = primary ? "lifeos-engine-btn primary" : "lifeos-engine-btn";
      b.onclick = onClick;
      return b;
    };

    tile("今日聚焦", "查看滞后/今日/前瞻/待排期，支持勾选写回、循环任务生成与删除。", (a) => {
      openBtn(a, "打开看板", () => this.openByPathOrName("今日聚焦.md"), true);
      openBtn(a, "打开配置", () => this.openByPathOrName("今日聚焦配置.md"));
    });

    tile("周委托", "打开本周周度委托文件，必要时可手动触发换周归档与未完成迁移。", (a) => {
      openBtn(a, "打开本周文件", async () => {
        try {
          await this.ensureTaskEngineLoaded();
          const Kit = window.TaskDashboardKit;
          Kit.data.L = this._getLuxonShim();
          const cfg = await Kit.config.load(TASK_CFG_PATH);
          const wk = Kit.config.getWeekKey(cfg?.weekly?.weekStart || "monday");
          const p = Kit.config.getWeeklyFilePath(cfg?.weekly?.prefix || "", wk) || "";
          if (p) await this.openByPathOrName(p);
        } catch (_) {}
      }, true);
      openBtn(a, "周任务归档", async () => {
        try {
          await this.ensureTaskEngineLoaded();
          const Kit = window.TaskDashboardKit;
          Kit.data.L = this._getLuxonShim();
          const cfg = await Kit.config.load(TASK_CFG_PATH);
          await Kit.config.ensureWeeklyRollover(TASK_CFG_PATH, cfg);
          new Notice("✅ 已完成周任务归档");
        } catch (e) {
          new Notice(`❌ 归档失败：${e?.message || e}`);
        }
      });
    });

    tile("快速打开", "高频文件入口：INBOX、备忘录、规律性事项。", (a) => {
      openBtn(a, "INBOX", () => this.openByPathOrName("01-经纬矩阵系统/08-智能录入模块/01-INBOX.md"), true);
      openBtn(a, "备忘录", () => this.openByPathOrName("01-经纬矩阵系统/03-备忘提醒模块/备忘录.md"));
      openBtn(a, "规律事项", () => this.openByPathOrName("01-经纬矩阵系统/04-规律性事项模块/规律性事项列表.md"));
    });

    const sec2 = root.createEl("div");
    sec2.className = "lifeos-section";
    sec2.createEl("div", { text: "维护与定位" }).className = "lifeos-section-title";
    const tiles2 = sec2.createEl("div");
    tiles2.className = "lifeos-tile-grid";

    const tile2 = (title, desc, actions) => {
      const t = tiles2.createEl("div");
      t.className = "lifeos-tile";
      t.createEl("div", { text: title }).className = "lifeos-tile-title";
      t.createEl("div", { text: desc }).className = "lifeos-tile-desc";
      const a = t.createEl("div");
      a.className = "lifeos-tile-actions";
      actions(a);
      return t;
    };

    tile2("集中配置", "任务配置统一存放于集中目录，修改后立即影响今日聚焦与周委托逻辑。", (a) => {
      a.createEl("span", { text: "task.config.json" }).className = "lifeos-badge strong";
      openBtn(a, "打开配置文件", () => this.openByPathOrName(TASK_CFG_PATH), true);
    });

    tile2("任务索引", "重建扫描缓存（不改变任何任务内容），用于控制台统计与加速。", (a) => {
      openBtn(a, "重建索引", async () => {
        try {
          await this.ensureTaskEngineLoaded();
          const Kit = window.TaskDashboardKit;
          Kit.data.L = this._getLuxonShim();
          const cfg = await Kit.config.load(TASK_CFG_PATH);
          const pages = await this._buildTaskPagesForTaskKit(cfg);
          this.__taskPagesCache = pages;
          const tasks = pages.flatMap(p => p?.file?.tasks || []);
          new Notice(`✅ 已重建：${pages.length} 文件 / ${tasks.length} 任务`);
        } catch (e) {
          new Notice(`❌ 重建失败：${e?.message || e}`);
        }
      }, true);
      openBtn(a, "打开今日聚焦", () => this.openByPathOrName("今日聚焦.md"));
    });

    (async () => {
      try {
        await this.ensureTaskEngineLoaded();
        const Kit = window.TaskDashboardKit;
        Kit.data.L = this._getLuxonShim();
        const cfg = await Kit.config.load(TASK_CFG_PATH);
        const pages = await this._buildTaskPagesForTaskKit(cfg);
        this.__taskPagesCache = pages;
        const allTasks = pages.flatMap(p => p?.file?.tasks || []);
        const forecastDays = parseInt(cfg?.ui?.forecastDays || 1);
        try { await Kit.data.ensureTimePeriodsLoaded(); } catch (_) {}
        const buckets = Kit.data.getBuckets(allTasks, { forecastDays });
        kOverdue.val.textContent = String(buckets?.overdue?.length || 0);
        kToday.val.textContent = String(buckets?.today?.length || 0);
        kForecast.val.textContent = String(buckets?.forecast?.length || 0);
        kUndated.val.textContent = String(buckets?.undated?.length || 0);
        kDone.val.textContent = String(buckets?.completed?.length || 0);
        kForecast.sub.textContent = `前瞻 ${forecastDays} 日`;
        const recurring = allTasks.filter(t => String(t?.text || "").includes("🔁") || String(t?.text || "").includes("recurrence:")).length;
        kRecurring.val.textContent = String(recurring);
        const enabledSources = (cfg?.sources || []).filter(s => s && s.enabled !== false && s.path).length;
        kSources.val.textContent = String(enabledSources);
        kFiles.val.textContent = String(pages.length);
      } catch (e) {
        kOverdue.sub.textContent = `加载失败：${e?.message || e}`;
      }
    })();
  }

  renderFinanceConsole(el) {
    el.empty();
    const root = el.createEl("div");
    root.className = "lifeos-console";

    const header = root.createEl("div");
    header.className = "lifeos-console-header";
    const left = header.createEl("div");
    left.createEl("h2", { text: "财务控制台" }).className = "lifeos-console-title";
    left.createEl("div", { text: "一张图看清：月度/年度看板入口、账单数据与索引缓存、资产统计与配置管理。" }).className = "lifeos-console-subtitle";

    const right = header.createEl("div");
    right.style.display = "flex";
    right.style.gap = "10px";
    right.style.flexWrap = "wrap";

    const btnCfg = right.createEl("button", { text: "打开财务配置" });
    btnCfg.className = "lifeos-engine-btn primary";
    btnCfg.onclick = () => this.openByPathOrName("财务看板配置.md");
    const btnAssets = right.createEl("button", { text: "打开资产统计" });
    btnAssets.className = "lifeos-engine-btn";
    btnAssets.onclick = () => this.openByPathOrName("06-财务系统/02-统计分析/资产统计.md");

    const kpiGrid = root.createEl("div");
    kpiGrid.className = "lifeos-kpi-grid";
    const makeKpi = (label) => {
      const box = kpiGrid.createEl("div");
      box.className = "lifeos-kpi";
      box.createEl("div", { text: label }).className = "lifeos-kpi-label";
      const val = box.createEl("div", { text: "—" });
      val.className = "lifeos-kpi-value";
      const sub = box.createEl("div", { text: "" });
      sub.className = "lifeos-kpi-sub";
      return { val, sub };
    };
    const kOut = makeKpi("本月支出");
    const kIn = makeKpi("本月收入");
    const kNet = makeKpi("本月结余");
    const kBills = makeKpi("账单记录");
    const kAssets = makeKpi("资产数量");
    const kAssetValue = makeKpi("资产总值");
    const kCache = makeKpi("索引缓存");
    const kSources = makeKpi("数据来源");

    const sec = root.createEl("div");
    sec.className = "lifeos-section";
    sec.createEl("div", { text: "看板入口" }).className = "lifeos-section-title";
    const tiles = sec.createEl("div");
    tiles.className = "lifeos-tile-grid";

    const openBtn = (host, text, onClick, primary) => {
      const b = host.createEl("button", { text });
      b.className = primary ? "lifeos-engine-btn primary" : "lifeos-engine-btn";
      b.onclick = onClick;
      return b;
    };
    const tile = (title, desc, actions) => {
      const t = tiles.createEl("div");
      t.className = "lifeos-tile";
      t.createEl("div", { text: title }).className = "lifeos-tile-title";
      t.createEl("div", { text: desc }).className = "lifeos-tile-desc";
      const a = t.createEl("div");
      a.className = "lifeos-tile-actions";
      actions(a);
      return t;
    };

    const toPeriod = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      return `${y}-${m}`;
    };
    const now = new Date();
    const thisPeriod = toPeriod(now);
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevPeriod = toPeriod(prev);
    const year = String(now.getFullYear());

    const openOrCreateFinanceDashboard = async (mode, period) => {
      const id = mode === "year" ? `finance-year-${period}` : `finance-month-${period}`;
      const files = this.app.vault.getMarkdownFiles();
      for (const f of files) {
        const fm = this.app.metadataCache.getFileCache(f)?.frontmatter;
        const lifeos = fm?.lifeos;
        const fid = typeof lifeos === "object" ? lifeos.id : null;
        if (fid === id) {
          await this.app.workspace.getLeaf(true).openFile(f);
          return;
        }
      }

      const dir = String(this.settings.global?.shells?.directories?.financeDashboardsDir || "06-财务系统/02-统计分析").trim() || "06-财务系统/02-统计分析";
      const y2 = String(period).slice(2, 4);
      const m2 = String(period).slice(5, 7);
      const name = mode === "year" ? `${period}年度财务看板.md` : `${y2}年${m2}月财务看板.md`;
      const path = `${dir}/${name}`;
      const fm = `---\nlifeos:\n  kind: finance-${mode}\n  period: \"${period}\"\n  id: \"${id}\"\n---\n\n`;
      const block = `\`\`\`lifeos-finance\nmode: ${mode}\nperiod: ${period}\n\`\`\`\n`;
      try {
        const exists = await this.app.vault.adapter.exists(path);
        if (!exists) await this.app.vault.create(path, fm + block);
        await this.openByPathOrName(path);
      } catch (e) {
        new Notice(`❌ 创建失败：${e?.message || e}`);
      }
    };

    tile("本月看板", `打开 ${thisPeriod} 的月度财务看板（必要时自动创建）。`, (a) => {
      openBtn(a, "打开/创建", () => openOrCreateFinanceDashboard("month", thisPeriod), true);
      openBtn(a, "打开配置", () => this.openByPathOrName("财务看板配置.md"));
    });
    tile("上月看板", `打开 ${prevPeriod} 的月度财务看板（必要时自动创建）。`, (a) => {
      openBtn(a, "打开/创建", () => openOrCreateFinanceDashboard("month", prevPeriod), true);
    });
    tile("年度看板", `打开 ${year} 的年度财务看板（必要时自动创建）。`, (a) => {
      openBtn(a, "打开/创建", () => openOrCreateFinanceDashboard("year", year), true);
    });

    const sec2 = root.createEl("div");
    sec2.className = "lifeos-section";
    sec2.createEl("div", { text: "维护与数据" }).className = "lifeos-section-title";
    const tiles2 = sec2.createEl("div");
    tiles2.className = "lifeos-tile-grid";
    const tile2 = (title, desc, actions) => {
      const t = tiles2.createEl("div");
      t.className = "lifeos-tile";
      t.createEl("div", { text: title }).className = "lifeos-tile-title";
      t.createEl("div", { text: desc }).className = "lifeos-tile-desc";
      const a = t.createEl("div");
      a.className = "lifeos-tile-actions";
      actions(a);
      return t;
    };

    tile2("集中配置", "财务配置统一存放于集中目录，渲染与配置页均指向该文件。", (a) => {
      a.createEl("span", { text: "finance.config.json" }).className = "lifeos-badge strong";
      openBtn(a, "打开配置文件", () => this.openByPathOrName(FINANCE_CFG_PATH), true);
    });

    tile2("账单数据", "打开账单来源目录（按 finance.config.json 的 sources 指定）。", (a) => {
      openBtn(a, "打开账单目录", async () => {
        const cfg = await this._readVaultJson(FINANCE_CFG_PATH);
        const s0 = (cfg?.sources || []).find(s => s && s.enabled !== false && s.path);
        if (s0?.path) await this.openByPathOrName(String(s0.path));
      }, true);
      openBtn(a, "打开配置页", () => this.openByPathOrName("财务看板配置.md"));
    });

    tile2("索引缓存", "清理缓存文件后，下次渲染将自动重建索引。", (a) => {
      openBtn(a, "清理缓存", async () => {
        const cfg = await this._readVaultJson(FINANCE_CFG_PATH);
        const fileName = String(cfg?.performance?.cacheFile || "").trim() || "财务看板.index.json";
        const cachePath = fileName.includes("/") ? fileName : `${ENGINE_CONFIG_DIR}/${fileName}`;
        try {
          const exists = await this.app.vault.adapter.exists(cachePath);
          if (exists) await this.app.vault.adapter.remove(cachePath);
          new Notice("✅ 已清理缓存");
        } catch (e) {
          new Notice(`❌ 清理失败：${e?.message || e}`);
        }
      }, true);
      openBtn(a, "打开缓存目录", () => this.openByPathOrName(ENGINE_CONFIG_DIR));
    });

    tile2("资产统计", "整合 SIP 记账后的装备档案，提供资产总览、分类/品牌统计与明细。", (a) => {
      openBtn(a, "打开资产看板", () => this.openByPathOrName("06-财务系统/02-统计分析/资产统计.md"), true);
      openBtn(a, "打开装备档案", async () => {
        const cfg = await this._readVaultJson(ASSET_CFG_PATH);
        const p = String(cfg?.archivePath || "05-生活坐标系统/03-装备档案").trim();
        await this.openByPathOrName(p);
      });
    });

    (async () => {
      try {
        await this.ensureEChartsLoaded();
        await this.ensureFinanceEngineLoaded();
        const cfg = await this._readVaultJson(FINANCE_CFG_PATH);
        if (cfg && window.FinanceVizKit) {
          window.FinanceVizKit.__configPath = FINANCE_CFG_PATH;
          const bills = await window.FinanceVizKit.getBillData(cfg);
          const monthBills = bills.filter(b => String(b?.date || "").startsWith(thisPeriod));
          const out = monthBills.filter(b => b.type === "支出").reduce((s, x) => s + (Number(x.amount) || 0), 0);
          const income = monthBills.filter(b => b.type !== "支出").reduce((s, x) => s + (Number(x.amount) || 0), 0);
          kOut.val.textContent = `¥${Math.round(out).toLocaleString()}`;
          kIn.val.textContent = `¥${Math.round(income).toLocaleString()}`;
          const net = income - out;
          kNet.val.textContent = `¥${Math.round(net).toLocaleString()}`;
          kNet.sub.textContent = net >= 0 ? "盈余" : "超支";
          kBills.val.textContent = String(monthBills.length);
          kBills.sub.textContent = `本月 ${thisPeriod}`;
          const enabledSources = (cfg?.sources || []).filter(s => s && s.enabled !== false && s.path).length;
          kSources.val.textContent = String(enabledSources);
          const cacheFile = String(cfg?.performance?.cacheFile || "财务看板.index.json");
          const cachePath = cacheFile.includes("/") ? cacheFile : `${ENGINE_CONFIG_DIR}/${cacheFile}`;
          const cacheExists = await this.app.vault.adapter.exists(cachePath);
          kCache.val.textContent = cacheExists ? "已启用" : "未生成";
          kCache.sub.textContent = cacheExists ? cacheFile : cacheFile;
        }
      } catch (e) {
        kOut.sub.textContent = `加载失败：${e?.message || e}`;
      }

      try {
        const assets = await this._loadAssets();
        kAssets.val.textContent = String(assets.items.length);
        const total = assets.items.reduce((s, x) => s + (Number(x.price) || 0), 0);
        kAssetValue.val.textContent = `¥${Math.round(total).toLocaleString()}`;
        kAssets.sub.textContent = String(assets.archivePath);
      } catch (_) {}
    })();
  }

  async _ensureAssetConfig() {
    const adapter = this.app.vault.adapter;
    try {
      const exists = await adapter.exists(ASSET_CFG_PATH);
      if (exists) return;
      await adapter.mkdir(ENGINE_CONFIG_DIR).catch(() => {});
      const cfg = { version: 1, archivePath: "05-生活坐标系统/03-装备档案" };
      await adapter.write(ASSET_CFG_PATH, JSON.stringify(cfg, null, 2));
    } catch (_) {}
  }

  _normalizeAssetFromFrontmatter(fm, file) {
    const get = (k) => fm && Object.prototype.hasOwnProperty.call(fm, k) ? fm[k] : undefined;
    const price = get("price") ?? get("amount") ?? get("cost");
    const purchaseDate = get("purchase_date") ?? get("buy-date") ?? get("buy_date") ?? get("purchaseDate");
    const brand = get("brand") ?? get("vendor_brand") ?? "";
    const vendor = get("vendor") ?? get("channel") ?? "";
    const type = get("asset_type") ?? get("assetType") ?? get("type") ?? "";
    const product = get("product_name") ?? get("product") ?? get("name") ?? file?.basename ?? "";
    const billLink = get("bill_link") ?? get("billLink") ?? "";
    return {
      path: file?.path || "",
      name: file?.name || "",
      brand: String(brand || "").trim(),
      vendor: String(vendor || "").trim(),
      assetType: String(type || "").trim(),
      productName: String(product || "").trim(),
      price: Number(price) || 0,
      purchaseDate: String(purchaseDate || "").trim(),
      billLink: String(billLink || "").trim()
    };
  }

  async _loadAssets() {
    await this._ensureAssetConfig();
    const cfg = await this._readVaultJson(ASSET_CFG_PATH);
    const archivePath = String(cfg?.archivePath || "05-生活坐标系统/03-装备档案").trim();
    const af = this.app.vault.getAbstractFileByPath(archivePath);
    if (!af || !af.children) return { archivePath, items: [] };
    const files = [];
    const walk = (folder) => {
      const children = folder?.children || [];
      for (const ch of children) {
        if (!ch) continue;
        if (ch.children) walk(ch);
        else if (ch.extension === "md") files.push(ch);
      }
    };
    walk(af);
    const items = [];
    for (const f of files) {
      const fm = this.app.metadataCache.getFileCache(f)?.frontmatter || {};
      const item = this._normalizeAssetFromFrontmatter(fm, f);
      if (!item.productName && !item.brand && !item.price) continue;
      items.push(item);
    }
    return { archivePath, items };
  }

  async renderAssetDashboard(el) {
    el.empty();
    await this.ensureEChartsLoaded();
    const root = el.createEl("div");
    root.className = "lifeos-console";

    const header = root.createEl("div");
    header.className = "lifeos-console-header";
    const left = header.createEl("div");
    left.createEl("h2", { text: "资产统计" }).className = "lifeos-console-title";
    left.createEl("div", { text: "来源：SIP 记账自动生成的装备档案 + 既有装备档案（frontmatter 兼容）。" }).className = "lifeos-console-subtitle";
    const right = header.createEl("div");
    right.style.display = "flex";
    right.style.gap = "10px";
    right.style.flexWrap = "wrap";
    const btnOpenFolder = right.createEl("button", { text: "打开装备档案" });
    btnOpenFolder.className = "lifeos-engine-btn primary";
    btnOpenFolder.onclick = async () => {
      const cfg = await this._readVaultJson(ASSET_CFG_PATH);
      const p = String(cfg?.archivePath || "05-生活坐标系统/03-装备档案").trim();
      await this.openByPathOrName(p);
    };
    const btnCfg = right.createEl("button", { text: "打开配置" });
    btnCfg.className = "lifeos-engine-btn";
    btnCfg.onclick = () => this.openByPathOrName(ASSET_CFG_PATH);

    const kpiGrid = root.createEl("div");
    kpiGrid.className = "lifeos-kpi-grid";
    const makeKpi = (label) => {
      const box = kpiGrid.createEl("div");
      box.className = "lifeos-kpi";
      box.createEl("div", { text: label }).className = "lifeos-kpi-label";
      const val = box.createEl("div", { text: "—" });
      val.className = "lifeos-kpi-value";
      const sub = box.createEl("div", { text: "" });
      sub.className = "lifeos-kpi-sub";
      return { val, sub };
    };
    const kCount = makeKpi("资产数量");
    const kTotal = makeKpi("总金额");
    const kTypes = makeKpi("资产类型");
    const kVendors = makeKpi("渠道数量");

    const charts = root.createEl("div");
    charts.className = "lifeos-tile-grid";
    const cType = charts.createEl("div");
    cType.className = "lifeos-chart";
    const cBrand = charts.createEl("div");
    cBrand.className = "lifeos-chart";
    const cMonth = charts.createEl("div");
    cMonth.className = "lifeos-chart";

    const tableSec = root.createEl("div");
    tableSec.className = "lifeos-section";
    tableSec.createEl("div", { text: "明细（按金额降序）" }).className = "lifeos-section-title";
    const tableHost = tableSec.createEl("div");
    tableHost.className = "lifeos-tile";

    const assets = await this._loadAssets();
    const items = assets.items.slice().sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    const total = items.reduce((s, x) => s + (Number(x.price) || 0), 0);
    kCount.val.textContent = String(items.length);
    kTotal.val.textContent = `¥${Math.round(total).toLocaleString()}`;
    const uniqTypes = new Set(items.map(x => String(x.assetType || "未分类")).filter(Boolean));
    kTypes.val.textContent = String(uniqTypes.size);
    const uniqVendors = new Set(items.map(x => String(x.vendor || "未知")).filter(Boolean));
    kVendors.val.textContent = String(uniqVendors.size);
    kCount.sub.textContent = assets.archivePath;

    const groupSum = (keyFn) => {
      const m = new Map();
      for (const it of items) {
        const k = String(keyFn(it) || "").trim() || "未分类";
        m.set(k, (m.get(k) || 0) + (Number(it.price) || 0));
      }
      return Array.from(m.entries()).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v);
    };

    const byType = groupSum(x => x.assetType);
    const byBrand = groupSum(x => x.brand);
    const byMonth = (() => {
      const m = new Map();
      for (const it of items) {
        const d = String(it.purchaseDate || "").slice(0, 7);
        if (!/^\d{4}-\d{2}$/.test(d)) continue;
        m.set(d, (m.get(d) || 0) + (Number(it.price) || 0));
      }
      return Array.from(m.entries()).map(([k, v]) => ({ k, v })).sort((a, b) => a.k.localeCompare(b.k));
    })();

    if (window.echarts) {
      const chartType = echarts.init(cType);
      chartType.setOption({
        title: { text: "按资产类型", left: "center", top: 10 },
        tooltip: { trigger: "item" },
        series: [
          {
            type: "pie",
            radius: ["35%", "70%"],
            center: ["50%", "55%"],
            data: byType.slice(0, 12).map(x => ({ name: x.k, value: Math.round(x.v) }))
          }
        ]
      });

      const chartBrand = echarts.init(cBrand);
      const topBrand = byBrand.slice(0, 10);
      chartBrand.setOption({
        title: { text: "按品牌 Top10", left: "center", top: 10 },
        tooltip: { trigger: "axis" },
        grid: { left: 40, right: 20, top: 60, bottom: 40, containLabel: true },
        xAxis: { type: "category", data: topBrand.map(x => x.k), axisLabel: { rotate: 25 } },
        yAxis: { type: "value" },
        series: [{ type: "bar", data: topBrand.map(x => Math.round(x.v)) }]
      });

      const chartMonth = echarts.init(cMonth);
      chartMonth.setOption({
        title: { text: "按月份购入金额", left: "center", top: 10 },
        tooltip: { trigger: "axis" },
        grid: { left: 40, right: 20, top: 60, bottom: 40, containLabel: true },
        xAxis: { type: "category", data: byMonth.map(x => x.k) },
        yAxis: { type: "value" },
        series: [{ type: "line", smooth: true, data: byMonth.map(x => Math.round(x.v)) }]
      });
    }

    const table = tableHost.createEl("div");
    table.style.display = "grid";
    table.style.gridTemplateColumns = "1fr 110px 90px";
    table.style.gap = "8px";
    table.style.fontSize = "12px";
    table.style.alignItems = "center";

    const head = (t) => {
      const d = document.createElement("div");
      d.textContent = t;
      d.style.fontWeight = "900";
      d.style.color = "#475569";
      return d;
    };
    table.appendChild(head("名称 / 品牌 / 类型"));
    table.appendChild(head("购买日期"));
    table.appendChild(head("金额"));

    const addRow = (name, date, amt, path) => {
      const a = document.createElement("div");
      a.textContent = name;
      a.style.cursor = "pointer";
      a.style.fontWeight = "800";
      a.style.color = "#111827";
      a.style.whiteSpace = "nowrap";
      a.style.overflow = "hidden";
      a.style.textOverflow = "ellipsis";
      a.onclick = async () => { if (path) await this.openByPathOrName(path); };

      const d = document.createElement("div");
      d.textContent = date || "";
      d.style.color = "#64748b";

      const p = document.createElement("div");
      p.textContent = `¥${Number(amt || 0).toFixed(0)}`;
      p.style.textAlign = "right";
      p.style.fontWeight = "900";
      p.style.color = "#6d28d9";

      table.appendChild(a);
      table.appendChild(d);
      table.appendChild(p);
    };

    items.slice(0, 50).forEach(it => {
      const title = `${it.brand ? it.brand + " " : ""}${it.productName || it.name || ""}${it.assetType ? " · " + it.assetType : ""}`;
      addRow(title, String(it.purchaseDate || "").slice(0, 10), it.price, it.path);
    });
  }

  renderTaskConfig(el) {
    (async () => {
      await this.ensureTaskEngineLoaded();
      await this.renderTaskViaKit(el, { mode: "config" });
    })();
  }

  renderFinanceConfig(el) {
    const host = el.createEl("div");

    (async () => {
      await this.ensureEChartsLoaded();
      await this.ensureFinanceEngineLoaded();
      if (!window.FinanceVizKit) {
        host.createEl("div", { text: "❌ Finance 引擎未就绪" });
        return;
      }

      const Kit = window.FinanceVizKit;
      const dv = { container: host };
      try {
        await Kit.init();
        await Kit.render.config(dv, { configPath: FINANCE_CFG_PATH });
      } catch (e) {
        host.empty();
        host.createEl("div", { text: `❌ 财务配置渲染失败：${e?.message || e}` });
      }
    })();
  }

  getTaskConfig() {
    const base = {
      version: 1,
      sources: [],
      excludePathIncludes: ["99-周委托归档", "99-附件"],
      ui: {
        forecastDays: 1,
        showCompleted: true,
        showUndated: true,
        showSource: true,
        sourceDisplayMode: "group",
        hiddenTags: []
      },
      weekly: {
        enabled: false,
        weekStart: "monday",
        prefix: "01-经纬矩阵系统/02-周委托模块/周度委托列表",
        archiveFolder: "01-经纬矩阵系统/99-任务归档/99-周委托归档",
        migrateUndone: true,
        lastWeekKey: ""
      }
    };
    const cfg = this.settings.task && typeof this.settings.task === "object" ? this.settings.task : {};
    const merged = Object.assign({}, base, cfg);
    merged.sources = Array.isArray(merged.sources) ? merged.sources : [];
    merged.excludePathIncludes = Array.isArray(merged.excludePathIncludes) ? merged.excludePathIncludes : base.excludePathIncludes;
    merged.ui = merged.ui && typeof merged.ui === "object" ? merged.ui : base.ui;
    merged.ui.hiddenTags = Array.isArray(merged.ui.hiddenTags) ? merged.ui.hiddenTags : [];
    merged.weekly = merged.weekly && typeof merged.weekly === "object" ? merged.weekly : base.weekly;
    merged.weekly.weekStart = String(merged.weekly.weekStart || "monday");
    merged.weekly.prefix = String(merged.weekly.prefix || base.weekly.prefix);
    merged.weekly.archiveFolder = String(merged.weekly.archiveFolder || base.weekly.archiveFolder);
    merged.weekly.lastWeekKey = String(merged.weekly.lastWeekKey || "");
    merged.weekly.migrateUndone = merged.weekly.migrateUndone !== false;
    merged.weekly.enabled = merged.weekly.enabled === true;
    return merged;
  }

  _shouldExcludePath(path, excludes) {
    const list = Array.isArray(excludes) ? excludes : [];
    return list.some(x => x && String(path).includes(String(x)));
  }

  _listFilesFromSources(sources, excludes) {
    const out = [];
    const walkFolder = (folder, sourceName) => {
      const children = folder?.children || [];
      for (const ch of children) {
        if (!ch) continue;
        if (ch.children) walkFolder(ch, sourceName);
        else if (ch.extension === "md" && !this._shouldExcludePath(ch.path, excludes)) out.push({ file: ch, sourceName });
      }
    };
    (sources || []).forEach(s => {
      if (!s || s.enabled === false || !s.path) return;
      const af = this.app.vault.getAbstractFileByPath(String(s.path).trim());
      if (!af) return;
      const sourceName = String(s.name || "").trim() || String(s.id || "").trim() || "来源";
      if (af.children) walkFolder(af, sourceName);
      else if (af.extension === "md" && !this._shouldExcludePath(af.path, excludes)) out.push({ file: af, sourceName });
    });
    return out;
  }

  _parseTaskLine(line) {
    const m = String(line).match(/^\s*-\s*\[( |x|X)\]\s+(.*)$/);
    if (!m) return null;
    const statusRaw = m[1];
    const rawText = m[2] || "";
    const done = statusRaw.toLowerCase() === "x";
    const timeHint = (rawText.match(/\[([^\]]+)\]/) || [])[1] || "";
    const dueDate = (rawText.match(/📅\s*(\d{4}-\d{2}-\d{2})/) || [])[1] || "";
    const doneDate = (rawText.match(/✅\s*(\d{4}-\d{2}-\d{2})/) || [])[1] || "";
    const repeatRule = (rawText.match(/🔁\s*([^📅✅]+)/) || [])[1] || "";
    const tags = [];
    rawText.replace(/(^|\s)#([^\s#]+)/g, (_, __, tag) => {
      tags.push(tag);
      return "";
    });
    let title = rawText;
    title = title.replace(/\[[^\]]+\]/g, " ");
    title = title.replace(/📅\s*\d{4}-\d{2}-\d{2}/g, " ");
    title = title.replace(/✅\s*\d{4}-\d{2}-\d{2}/g, " ");
    title = title.replace(/🔁\s*[^📅✅]+/g, " ");
    title = title.replace(/(^|\s)#[^\s#]+/g, " ");
    title = title.replace(/\s+/g, " ").trim();
    return { done, title, rawText, timeHint, dueDate, doneDate, repeatRule: String(repeatRule).trim(), tags };
  }

  async _parseTasksFromFile(file, sourceName) {
    let content = "";
    try { content = await this.app.vault.read(file); } catch (_) { return []; }
    const lines = String(content).split(/\r?\n/);
    const tasks = [];
    const stack = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parsed = this._parseTaskLine(line);
      if (!parsed) continue;
      const indent = (line.match(/^\s*/) || [""])[0].length;
      const node = Object.assign({}, parsed, {
        filePath: file.path,
        fileName: file.name,
        lineNo: i + 1,
        indent,
        sourceName,
        children: []
      });
      while (stack.length > 0 && indent <= stack[stack.length - 1].indent) stack.pop();
      if (stack.length > 0) stack[stack.length - 1].children.push(node);
      else tasks.push(node);
      stack.push(node);
    }
    return tasks;
  }

  _flattenTasks(tasks) {
    const out = [];
    const walk = (t, depth) => {
      (t || []).forEach(x => {
        out.push(Object.assign({}, x, { depth }));
        if (x.children && x.children.length) walk(x.children, depth + 1);
      });
    };
    walk(tasks, 0);
    return out;
  }

  _toDateOnly(s) {
    const m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (Number.isNaN(d.getTime())) return null;
    return d;
  }

  _formatYMD(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  async renderTaskTodayFocus(el) {
    // [DEPRECATED]
    // ⚠️ 警告：此方法已废弃，不再被调用。
    // 实际渲染逻辑已迁移至 assets/task-dashboard-kit.js
    // 请勿在此修改代码！
    // 
    // Reference: task-dashboard-kit.js -> window.TaskDashboardKit.render.main
    el.createEl("div", { text: "Logic moved to assets/task-dashboard-kit.js" });
  }

  _isoWeekKey(d) {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const week1 = new Date(date.getFullYear(), 0, 4);
    week1.setDate(week1.getDate() + 3 - ((week1.getDay() + 6) % 7));
    const weekNo = 1 + Math.round((date.getTime() - week1.getTime()) / 86400000 / 7);
    const yy = String(date.getFullYear()).slice(2);
    return `${yy}W${String(weekNo).padStart(2, "0")}`;
  }

  async checkWeeklyRollover(forceNotice) {
    const cfg = this.getTaskConfig();
    if (!cfg.weekly || !cfg.weekly.enabled) return;
    const now = new Date();
    const currentKey = this._isoWeekKey(now);
    const lastKey = String(cfg.weekly.lastWeekKey || "").trim();
    if (lastKey === currentKey) return;

    const prefix = String(cfg.weekly.prefix || "").trim();
    if (!prefix) return;
    const oldPath = lastKey ? `${prefix}${lastKey}.md` : "";
    const newPath = `${prefix}${currentKey}.md`;

    const adapter = this.app.vault.adapter;
    const ensureFile = async (p) => {
      try {
        const exists = await adapter.exists(p);
        if (!exists) await adapter.write(p, "");
      } catch (_) {}
    };

    await ensureFile(newPath);

    let migratedText = "";
    if (cfg.weekly.migrateUndone && oldPath) {
      const oldFile = this.app.vault.getAbstractFileByPath(oldPath);
      if (oldFile instanceof TFile) {
        try {
          const oldContent = await this.app.vault.read(oldFile);
          const lines = String(oldContent).split(/\r?\n/);
          const keep = [];
          let inUndoneBlock = false;
          for (const line of lines) {
            if (/^\s*-\s*\[( |x|X)\]\s+/.test(line)) {
              const isDone = /^\s*-\s*\[(x|X)\]\s+/.test(line);
              inUndoneBlock = !isDone;
              if (!isDone) keep.push(line);
            } else if (/^\s+/.test(line) && inUndoneBlock) {
              keep.push(line);
            } else {
              inUndoneBlock = false;
            }
          }
          if (keep.length) migratedText = keep.join("\n").trim();
        } catch (_) {}
      }
    }

    if (migratedText) {
      try {
        const cur = await adapter.read(newPath).catch(() => "");
        const next = String(cur || "").trimEnd() + "\n\n" + migratedText + "\n";
        await adapter.write(newPath, next);
      } catch (_) {}
    }

    const resolveArchiveFolder = async () => {
      const configured = String(cfg.weekly.archiveFolder || "").trim();
      const candidates = [
        configured,
        "01-经纬矩阵系统/99-任务归档/99-周委托归档",
        "01-经纬矩阵系统/02-周委托模块/99-周委托归档"
      ].filter(Boolean);
      for (const c of candidates) {
        const af = this.app.vault.getAbstractFileByPath(c);
        if (af && af.children) return c;
      }
      for (const c of candidates) {
        try { await adapter.mkdir(c); return c; } catch (_) {}
      }
      return configured;
    };

    const archiveFolder = await resolveArchiveFolder();
    if (oldPath) {
      const oldFile = this.app.vault.getAbstractFileByPath(oldPath);
      if (oldFile instanceof TFile && archiveFolder) {
        const year = `20${lastKey.slice(0, 2)}`;
        let useYear = false;
        const folderAf = this.app.vault.getAbstractFileByPath(archiveFolder);
        if (folderAf && folderAf.children) {
          useYear = folderAf.children.some(ch => ch?.children && /^\d{4}$/.test(String(ch.name || "")));
        }
        const destDir = useYear ? `${archiveFolder}/${year}` : archiveFolder;
        try { await adapter.mkdir(destDir); } catch (_) {}
        const destPath = `${destDir}/${oldFile.name}`;
        try {
          await this.app.fileManager.renameFile(oldFile, destPath);
        } catch (_) {}
      }
    }

    cfg.weekly.lastWeekKey = currentKey;
    this.settings.task = cfg;
    await this.saveSettings();
    if (forceNotice) new Notice(`✅ 已切换到新周：${currentKey}`);
  }

  openPluginSettings() {
    this.app.setting.open();
    try {
      const tab = this.app.setting.pluginTabs?.find(t => t.manifest?.id === "lifeos-engine");
      if (tab) this.app.setting.openTabById("lifeos-engine");
    } catch (_) {}
  }

  async openByPathOrName(pathOrName) {
    const p = String(pathOrName || "").trim();
    if (!p) return;
    const fileByPath = this.app.vault.getAbstractFileByPath(p);
    if (fileByPath instanceof TFile) {
      await this.app.workspace.getLeaf(true).openFile(fileByPath);
      return;
    }
    const files = this.app.vault.getMarkdownFiles().filter(f => f.name === p || f.path.endsWith("/" + p));
    if (files.length > 0) {
      const latest = files.slice().sort((a, b) => (b.stat?.mtime || 0) - (a.stat?.mtime || 0))[0];
      await this.app.workspace.getLeaf(true).openFile(latest);
    }
  }
}

module.exports = LifeOSEnginePlugin;

