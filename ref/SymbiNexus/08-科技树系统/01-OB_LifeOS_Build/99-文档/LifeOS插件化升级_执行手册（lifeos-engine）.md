# LifeOS 插件化升级执行手册（lifeos-engine）

> 目标：将当前 Vault 的「任务系统 + 财务系统」从 **散装文件 + DataviewJS + Vault 内 echarts.js** 升级为 **lifeos-engine 插件驱动**。  
> 要求：升级后你的使用体验几乎不变；不保留“兼容模式”，最终状态等同于“新用户安装插件 + 配置选择与你一致”。  
> 本手册面向“AI 驱动的 IDE/工程执行者”，按本文档即可完成全量落地与自测。

---

## 0. 关键约束与验收标准

### 0.1 关键约束
- 不依赖 Dataview 插件：Vault 内看板与配置页 **不再使用** ```dataviewjs``` / `dv.*`。
- 不依赖 Vault 内散装工具库：不再从 Vault 读取 `TaskDashboardKit.js` / `FinanceVizKit.js` / `echarts.js` 再注入运行。
- ECharts 随插件内置：图表库作为插件 assets 或 bundle 内置。
- 仅你是该库用户：不做“迁移功能”给别人用；直接一次性把本 Vault 迁移到插件形态。
- 任务解析口径保持现状：沿用你当前任务文本标记方式（📅/✅/🔁/方括号时间等），不改用户写法。

### 0.2 验收标准（必须全部满足）
- ✅ 「今日聚焦」输出与旧版一致（任务数量、分组、@来源胶囊、过滤规则、换周逻辑）。
- ✅ 月度/年度财务看板统计与旧版一致（饼图/热力/趋势/TopN/明细表/预算开关等按配置生效）。
- ✅ 不安装 Dataview 插件也能运行上述看板与配置页。
- ✅ 不依赖 Vault 内 `08-.../echarts.js` 文件；ECharts 从插件内加载。
- ✅ 插件更新不覆盖用户配置：保留 `.obsidian/plugins/lifeos-engine/data.json`（以及缓存索引文件）。
- ✅ 看板/控制台的 md 壳文件可被拖动到任意目录；路径失效时能自动按“文件名/标识”重绑定联动。

---

## 1. 现状输入（执行者需要阅读/参考的现有实现）

### 1.1 现有任务/财务运行时（散装工具库）
- 任务工具库（DataviewJS 形态）：[TaskDashboardKit.js](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/08-%E7%A7%91%E6%8A%80%E6%A0%91%E7%B3%BB%E7%BB%9F/01-OB_LifeOS_Build/00-%E9%80%9A%E7%94%A8%E6%A8%A1%E5%9D%97%E5%BA%93/TaskDashboardKit.js)
- 财务工具库（已升级到 6 分区配置体系）：[FinanceVizKit.js](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/08-%E7%A7%91%E6%8A%80%E6%A0%91%E7%B3%BB%E7%BB%9F/01-OB_LifeOS_Build/00-%E9%80%9A%E7%94%A8%E6%A8%A1%E5%9D%97%E5%BA%93/FinanceVizKit.js)
- Vault 内 ECharts 源文件（旧依赖）：[echarts.js](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/08-%E7%A7%91%E6%8A%80%E6%A0%91%E7%B3%BB%E7%BB%9F/01-OB_LifeOS_Build/00-%E9%80%9A%E7%94%A8%E6%A8%A1%E5%9D%97%E5%BA%93/echarts.js)

### 1.2 现有配置（将迁移为插件默认配置）
- 今日聚焦配置（任务模块的真实使用习惯来源）：[今日聚焦.config.json](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/01-%E7%BB%8F%E7%BA%AC%E7%9F%A9%E9%98%B5%E7%B3%BB%E7%BB%9F/01-%E7%9C%8B%E6%9D%BF%E6%A8%A1%E5%9D%97/%E4%BB%8A%E6%97%A5%E8%81%9A%E7%84%A6.config.json)
- 财务看板配置（财务模块的真实使用习惯来源）：[财务看板.config.json](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/06-%E8%B4%A2%E5%8A%A1%E7%B3%BB%E7%BB%9F/02-%E7%BB%9F%E8%AE%A1%E5%88%86%E6%9E%90/%E8%B4%A2%E5%8A%A1%E7%9C%8B%E6%9D%BF.config.json)

### 1.3 现有看板与配置页入口（将被替换为插件 CodeBlock 壳）
- 今日聚焦看板：[今日聚焦.md](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/01-%E7%BB%8F%E7%BA%AC%E7%9F%A9%E9%98%B5%E7%B3%BB%E7%BB%9F/01-%E7%9C%8B%E6%9D%BF%E6%A8%A1%E5%9D%97/%E4%BB%8A%E6%97%A5%E8%81%9A%E7%84%A6.md)
- 今日聚焦配置页（DataviewJS 壳）：[今日聚焦配置.md](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/01-%E7%BB%8F%E7%BA%AC%E7%9F%A9%E9%98%B5%E7%B3%BB%E7%BB%9F/01-%E7%9C%8B%E6%9D%BF%E6%A8%A1%E5%9D%97/%E4%BB%8A%E6%97%A5%E8%81%9A%E7%84%A6%E9%85%8D%E7%BD%AE.md)
- 月度财务看板（样例）：[25年12月财务看板.md](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/06-%E8%B4%A2%E5%8A%A1%E7%B3%BB%E7%BB%9F/02-%E7%BB%9F%E8%AE%A1%E5%88%86%E6%9E%90/25%E5%B9%B412%E6%9C%88%E8%B4%A2%E5%8A%A1%E7%9C%8B%E6%9D%BF.md)
- 年度财务看板（样例）：[2025年度财务看板.md](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/06-%E8%B4%A2%E5%8A%A1%E7%B3%BB%E7%BB%9F/02-%E7%BB%9F%E8%AE%A1%E5%88%86%E6%9E%95/2025%E5%B9%B4%E5%BA%A6%E8%B4%A2%E5%8A%A1%E7%9C%8B%E6%9D%BF.md)
- 财务配置页（DataviewJS 壳）：[财务看板配置.md](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/06-%E8%B4%A2%E5%8A%A1%E7%B3%BB%E7%BB%9F/02-%E7%BB%9F%E8%AE%A1%E5%88%86%E6%9E%95/%E8%B4%A2%E5%8A%A1%E7%9C%8B%E6%9D%BF%E9%85%8D%E7%BD%AE.md)

### 1.4 任务文本真实口径（必须兼容）
从现有数据抽样可见任务行包含如下标记（示例：周委托、规律事项、备忘等）：
- `- [ ]` / `- [x]`：未完成/已完成
- `[21:00]` / `[晚上]`：时间或时段（方括号）
- `📅 YYYY-MM-DD`：到期/计划日期
- `✅ YYYY-MM-DD`：完成日期
- `🔁 every week` / `🔁 every day`：循环规则
- `#标签`：标签（例如 `#备忘`、`#行测`）

示例文件：
- 周委托任务样例：[周度委托列表26W04.md](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/01-%E7%BB%8F%E7%BA%AC%E7%9F%A9%E9%98%B5%E7%B3%BB%E7%BB%9F/02-%E5%91%A8%E5%A7%94%E6%89%98%E6%A8%A1%E5%9D%97/%E5%91%A8%E5%BA%A6%E5%A7%94%E6%89%98%E5%88%97%E8%A1%A826W04.md)
- 规律性事项样例：[规律性事项列表.md](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/01-%E7%BB%8F%E7%BA%AC%E7%9F%A9%E9%98%B5%E7%B3%BB%E7%BB%9F/04-%E8%A7%84%E5%BE%8B%E6%80%A7%E4%BA%8B%E9%A1%B9%E6%A8%A1%E5%9D%97/%E8%A7%84%E5%BE%8B%E6%80%A7%E4%BA%8B%E9%A1%B9%E5%88%97%E8%A1%A8.md)

---

## 2. 目标产物（升级后的插件与库结构）

### 2.1 插件目录结构（必须）
```
.obsidian/plugins/lifeos-engine/
  manifest.json
  main.js
  styles.css
  assets/
    echarts.min.js
  data.json               # 用户配置（升级保留）
```

### 2.2 Vault 侧“壳文件”策略（体验几乎不变）
- 仍保留 md 看板/配置页（用户打开 md 即可使用）。
- md 内不再执行 dataviewjs，只放插件 CodeBlock。
- 壳文件的生成目录可配置；用户拖动壳文件后仍可联动（见第 6 节）。

建议在 Vault 内新增（可配置目录，默认示例）：
- `01-经纬矩阵系统/01-看板模块/任务控制台.md`
- `06-财务系统/02-统计分析/财务控制台.md`
- `01-经纬矩阵系统/01-看板模块/任务配置.md`
- `06-财务系统/02-统计分析/财务配置.md`

---

## 3. 插件渲染入口（替代 DataviewJS）

### 3.1 Markdown CodeBlock 处理器（必须）
插件注册：
- `lifeos-task`
- `lifeos-finance`
- `lifeos-config`

这些处理器用 Obsidian 原生 API 实现（`registerMarkdownCodeBlockProcessor`），不依赖 Dataview。

### 3.2 CodeBlock 参数格式（统一采用 YAML 风格）
允许两种写法：
- YAML 键值对（推荐）
- 单行 JSON（可选）

示例：今日聚焦看板（替换原 今日聚焦.md 内容）
````
```lifeos-task
mode: today-focus
```
````

示例：月度财务看板
````
```lifeos-finance
mode: month
period: 2025-12
```
````

示例：财务配置页（md 壳）
````
```lifeos-config
module: finance
```
````

### 3.3 插件内“控制台（Console）”两种打开方式（都要支持）
- 命令/快捷键打开：Modal 或 View（系统级面板）
- md 壳打开：用 `mode: console` 渲染控制台 UI

示例：财务控制台壳文件
````
```lifeos-finance
mode: console
```
````

---

## 4. 配置体系（插件 data.json 为唯一来源）

### 4.1 统一策略
- 插件 `data.json` 是运行时唯一配置来源。
- 插件首次启动时，将从 Vault 读取：
  - [今日聚焦.config.json](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/01-%E7%BB%8F%E7%BA%AC%E7%9F%A9%E9%98%B5%E7%B3%BB%E7%BB%9F/01-%E7%9C%8B%E6%9D%BF%E6%A8%A1%E5%9D%97/%E4%BB%8A%E6%97%A5%E8%81%9A%E7%84%A6.config.json)
  - [财务看板.config.json](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/06-%E8%B4%A2%E5%8A%A1%E7%B3%BB%E7%BB%9F/02-%E7%BB%9F%E8%AE%A1%E5%88%86%E6%9E%90/%E8%B4%A2%E5%8A%A1%E7%9C%8B%E6%9D%BF.config.json)
  导入为插件配置，形成“新用户默认配置 = 你当前习惯”。

### 4.2 插件配置结构（建议 Schema）
顶层：
- `version`
- `global`：壳文件策略、默认生成目录、重绑定策略等
- `task`：任务模块配置
- `finance`：财务模块配置

global 建议字段：
- `shells.enabled`：是否启用 md 壳（默认 true）
- `shells.directories`：各壳文件的默认生成目录（可配置）
- `shells.rebindStrategy`：路径失效时重绑定策略（filename + marker）

> 执行者要求：写一个 `normalizeSettings()`，确保字段缺失时自动补齐默认值，并对旧版本做迁移。

---

## 5. 财务模块（Finance）——能力清单与实现要点

### 5.1 财务配置 6 分区（必须完整实现）
以你现有 [财务看板.config.json](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/06-%E8%B4%A2%E5%8A%A1%E7%B3%BB%E7%BB%9F/02-%E7%BB%9F%E8%AE%A1%E5%88%86%E6%9E%95/%E8%B4%A2%E5%8A%A1%E7%9C%8B%E6%9D%BF.config.json) 为基准：
1) Sources：folder/file/csv
2) Schema：字段名映射、日期推断、金额口径、CSV、Ledger
3) Normalization：channel/category/account 三映射
4) Views：month/year 图表开关、明细表、默认排序、内容口径
5) Budgets & Goals：月预算、分类预算、目标（储蓄率/还款）
6) Performance：索引缓存、缓存文件名、maxFiles

### 5.2 ECharts 依赖移除（必须）
- 插件内置 `assets/echarts.min.js`。
- 运行时如果 `window.echarts` 不存在：
  - 从插件目录读取 assets 内容并注入 `<script>`（或直接打包进 main.js）。
- 禁止从 Vault 读取 `08-.../echarts.js`。

### 5.3 财务索引缓存（必须）
目标：避免每次渲染全量读文件（移动端必需）。
- 缓存文件位置：插件 data 目录或由 `finance.performance.cacheFile` 指定（建议存放在插件目录或插件数据区）。
- 缓存键：`file.path + file.stat.mtime + configSig`
- configSig：`schema + normalization` 的 JSON 摘要，用于配置变化自动失效缓存。

### 5.4 财务控制台（Console）需求（必须）
控制台按钮（最小集合）：
- 创建本月财务看板
- 创建指定年月财务看板
- 打开财务配置（插件设置 Tab 或 md 壳）
- 重建财务索引 / 清理缓存
- 打开资产子系统入口（先做“跳转/打开文件/打开目录”的能力，资产模块后续再扩）

创建月度看板的行为规范：
- 支持用户配置“生成目录”。
- 若用户把看板文件拖动到其他目录：
  - 插件下次创建/打开同年月时，先按“标识/文件名”全库查找并重绑定（见第 6 节）。

---

## 6. 任务模块（Task）——能力清单与实现要点

### 6.1 Task 不能再依赖 Dataview 的 tasks 解析
旧版 `dv.pages().file.tasks` 必须替换为插件自实现扫描与解析：
- sources：沿用 [今日聚焦.config.json](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/01-%E7%BB%8F%E7%BA%AC%E7%9F%A9%E9%98%B5%E7%B3%BB%E7%BB%9F/01-%E7%9C%8B%E6%9D%BF%E6%A8%A1%E5%9D%97/%E4%BB%8A%E6%97%A5%E8%81%9A%E7%84%A6.config.json) 的 folder/file sources 语义与显示名（name）。
- 每条任务需要记录：`text/status/due/done/repeat/time/tags/source/filePath/lineNo/subtasks`。

### 6.2 任务解析规则（必须兼容你的真实数据）
#### 6.2.1 任务行识别
- 仅识别 Markdown task：`^\s*-\s*\[( |x|X)\]\s+`
- 支持子任务：通过缩进（leading spaces）构建树。

#### 6.2.2 字段抽取（最小必须）
从任务原始文本中抽取：
- `status`：`[ ]` 未完成；`[x]/[X]` 已完成
- `timeHint`：首个方括号 `[...]`（例：`[21:00]`、`[晚上]`）
- `dueDate`：`📅 YYYY-MM-DD`
- `doneDate`：`✅ YYYY-MM-DD`
- `repeatRule`：`🔁 ...`（直到遇到下一个 emoji 标记或行尾）
- `tags`：`#xxx`（保留原样，不做强制小写）
- `titleText`：去掉上述标记后的“主文本”

> 备注：你现有数据中已明确使用 📅/✅/🔁（见第 1.4）。执行者需以此为主口径，其他标记（如 ⏳、🛫 等）可作为扩展。

#### 6.2.3 来源胶囊（@来源）规则
- 插件按 sources 的 `name` 给每条任务附加 `@name` 来源胶囊（仅展示，不写回文件）。
- UI 上支持 `groupBySource`（与现有今日聚焦一致）。
- 支持 `hiddenTags`：配置里列出的标签不显示（避免系统标签污染）。

### 6.3 今日聚焦逻辑（复刻现有）
- 分组：逾期 / 今日 / 未来 forecastDays / 未标注日期（showUndated 控制） / 已完成（showCompleted 控制）
- 排序：保持现有展示口径（与当前今日聚焦一致）

### 6.4 换周归档与迁移未完成（必须保留现有模式）
以 [今日聚焦.config.json](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/01-%E7%BB%8F%E7%BA%AC%E7%9F%A9%E9%98%B5%E7%B3%BB%E7%BB%9F/01-%E7%9C%8B%E6%9D%BF%E6%A8%A1%E5%9D%97/%E4%BB%8A%E6%97%A5%E8%81%9A%E7%84%A6.config.json) 的 `weekly` 分区为准：
- weekStart：monday
- prefix：`01-经纬矩阵系统/02-周委托模块/周度委托列表`
- archiveFolder：`01-经纬矩阵系统/02-周委托模块/99-周委托归档`
- migrateUndone：true
- lastWeekKey：例如 `26W04`

执行者实现要求：
- 计算当前周 key（ISO Week 或按你现有规则，必须与现有文件命名一致）。
- 若新周已开始且 lastWeekKey != currentWeekKey：
  - 创建新周文件（按 prefix + 当前周 key）
  - 将旧周文件移动到 archiveFolder（按年分目录的策略若已存在需复刻）
  - 若 migrateUndone 开启：把旧周文件中的未完成任务迁移到新周文件，并保留子任务结构
  - 更新 lastWeekKey 并保存配置

### 6.5 任务索引缓存（必须）
- 目标：避免每次渲染全量扫描 sources。
- 缓存内容：每个文件的 mtime + 解析后的任务列表（包含行号与层级）。
- 支持增量更新：当文件 mtime 未变时直接复用。

---

## 7. 壳文件生成、目录可配置、路径重绑定（关键模式）

### 7.1 为什么必须做“重绑定”
你要求：
- 用户可选择把看板生成在哪个目录
- 用户拖动 md 文件后，初次路径匹配失败仍能按文件名找到并联动

因此插件必须维护“逻辑实体”与“md 文件”的映射，并支持路径漂移修复。

### 7.2 推荐实现：双重标识（优先 marker，其次 filename）
每个壳文件写入一个稳定标识，推荐 frontmatter（不影响阅读）：
```yaml
---
lifeos:
  kind: finance-month
  period: "2026-01"
  id: "finance-month-2026-01"
---
```

同时文件名按习惯命名（例如：`26年01月财务看板.md`）。

重绑定策略（执行顺序）：
1) 读取 settings 中记录的“期望路径”，若存在则直接用
2) 否则全库查找：frontmatter.lifeos.id 匹配
3) 否则按文件名匹配（同名优先；若多个同名，选择最近修改的）
4) 若找到文件：更新 settings 映射（完成重绑定）
5) 若仍找不到：在用户配置的默认目录创建新文件

### 7.3 壳文件目录配置（必须）
插件配置提供以下默认目录（可改）：
- `global.shells.directories.taskConsoleDir`
- `global.shells.directories.financeConsoleDir`
- `global.shells.directories.taskDashboardsDir`
- `global.shells.directories.financeDashboardsDir`
- `global.shells.directories.configPagesDir`

### 7.4 壳文件默认是否显示（可选配置，但必须支持）
用户可配置：
- 是否生成 md 壳控制台（默认 true）
- 是否仅使用命令弹窗控制台（默认同时支持）

---

## 8. 插件 UI：设置页两大 Tab（任务/财务）

### 8.1 Tab 结构（必须）
- Tab: 任务
  - 来源（sources 列表编辑：folder/file）
  - 展示（forecastDays/showCompleted/showUndated/groupBySource/hiddenTags）
  - 换周归档（weekly）
  - 性能（索引缓存、最大扫描数、重建索引按钮）
- Tab: 财务
  - 6 分区配置（Sources/Schema/Normalization/Views/Budgets/Performance）
  - 重建财务索引、清理缓存按钮

### 8.2 UI 风格要求
尽量复刻你当前配置页：
- 分区“抱团卡片”+ 分区说明
- 来源列表为表格式行编辑（启用、显示名、类型、路径、删除）
- 每个分区在底部有“保存”与“重载”
- 顶部保留“打开控制台/打开看板/重新加载”的快捷按钮（可选）

---

## 9. 一次性迁移执行步骤（针对本 Vault）

> 本节是“AI IDE 执行清单”，按顺序做，做完后全库进入插件驱动形态。

### 9.1 创建 lifeos-engine 插件目录与文件
- 在 `.obsidian/plugins/lifeos-engine/` 创建插件骨架（manifest/main/styles/assets/data）。
- 将 ECharts 作为 assets 内置（建议从现有 [echarts.js](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/08-%E7%A7%91%E6%8A%80%E6%A0%91%E7%B3%BB%E7%BB%9F/01-OB_LifeOS_Build/00-%E9%80%9A%E7%94%A8%E6%A8%A1%E5%9D%97%E5%BA%93/echarts.js) 生成 minified 版本后放入 `assets/echarts.min.js`）。

### 9.2 插件首次运行导入你的现有配置（不做兼容模式）
- 启动时读取 Vault 的旧配置 JSON：
  - 今日聚焦.config.json → 写入 `data.json.task`
  - 财务看板.config.json → 写入 `data.json.finance`
- 完成后：插件运行时只读 `data.json`；旧配置文件不再驱动运行（可保留作备份）。

### 9.3 批量替换看板/配置页为 CodeBlock 壳
直接修改以下文件内容（保留文件名/路径不变，体验几乎无异）：
- [今日聚焦.md](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/01-%E7%BB%8F%E7%BA%AC%E7%9F%A9%E9%98%B5%E7%B3%BB%E7%BB%9F/01-%E7%9C%8B%E6%9D%BF%E6%A8%A1%E5%9D%97/%E4%BB%8A%E6%97%A5%E8%81%9A%E7%84%A6.md) → `lifeos-task mode: today-focus`
- [今日聚焦配置.md](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/01-%E7%BB%8F%E7%BA%AC%E7%9F%A9%E9%98%B5%E7%B3%BB%E7%BB%9F/01-%E7%9C%8B%E6%9D%BF%E6%A8%A1%E5%9D%97/%E4%BB%8A%E6%97%A5%E8%81%9A%E7%84%A6%E9%85%8D%E7%BD%AE.md) → `lifeos-config module: task`
- 月度财务看板（如 25年10/11/12）→ `lifeos-finance mode: month period: YYYY-MM`
- 年度财务看板 → `lifeos-finance mode: year period: YYYY`
- [财务看板配置.md](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/06-%E8%B4%A2%E5%8A%A1%E7%B3%BB%E7%BB%9F/02-%E7%BB%9F%E8%AE%A1%E5%88%86%E6%9E%95/%E8%B4%A2%E5%8A%A1%E7%9C%8B%E6%9D%BF%E9%85%8D%E7%BD%AE.md) → `lifeos-config module: finance`

新增（可选但建议）：
- `任务控制台.md`（壳）
- `财务控制台.md`（壳）

### 9.4 验证（必须）
- 不安装 Dataview 插件的情况下：
  - 打开 今日聚焦.md、月度/年度财务看板、两份配置页，确认全部渲染正常
- 任务验证：
  - 逾期/今日/未来/未标注/已完成分区一致
  - @来源胶囊一致、隐藏标签一致
  - 换周归档与迁移未完成一致
- 财务验证：
  - 月度/年度总计一致
  - 饼图/热力/趋势/TopN/明细表按 Views 开关生效
  - 预算显示按 Budgets 与 Views 生效
- 路径重绑定验证：
  - 手动拖动一个月度财务看板到新目录
  - 通过财务控制台再次“打开/创建同年月看板”，应能找到旧文件并更新映射

---

## 10. 离线更新机制（非商店分发）

> 由于不走官方商店，建议同时交付离线更新器，做到“像插件一样更新”。

建议交付：
- `installer/update.bat`：收集 vault 路径并启动 ps1
- `installer/update.ps1`：白名单覆盖 + 自动备份 + 保留 data.json

白名单覆盖文件：
- `manifest.json`
- `main.js`
- `styles.css`
- `assets/*`

必须保留：
- `data.json`
- `*.index.json`（缓存索引，建议保留）

---

## 11. 待清理文件清单（执行最后再确认删除）

以下文件在插件化完成并验证通过后，原则上不再需要：
- Vault 内散装工具库（任务/财务旧引擎）：`08-.../TaskDashboardKit.js`、`08-.../FinanceVizKit.js`
- Vault 内 ECharts：`08-.../echarts.js`
- 全库所有旧的 ```dataviewjs``` 看板/配置页块（已被替换为 lifeos-* code block）

> 删除需用户手动确认：执行者必须在所有迁移/验证完成后，再列出最终可删除清单供确认。

---

## 12. 参考文档（本目录内已有）
- [LifeOS插件化升级_需求规格.md](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/08-%E7%A7%91%E6%8A%80%E6%A0%91%E7%B3%BB%E7%BB%9F/01-OB_LifeOS_Build/99-%E6%96%87%E6%A1%A3/LifeOS%E6%8F%92%E4%BB%B6%E5%8C%96%E5%8D%87%E7%BA%A7_%E9%9C%80%E6%B1%82%E8%A7%84%E6%A0%BC.md)
- [LifeOS插件化升级_实施方案.md](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/08-%E7%A7%91%E6%8A%80%E6%A0%91%E7%B3%BB%E7%BB%9F/01-OB_LifeOS_Build/99-%E6%96%87%E6%A1%A3/LifeOS%E6%8F%92%E4%BB%B6%E5%8C%96%E5%8D%87%E7%BA%A7_%E5%AE%9E%E6%96%BD%E6%96%B9%E6%A1%88.md)
- [ECharts集成实施指南.md](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/08-%E7%A7%91%E6%8A%80%E6%A0%91%E7%B3%BB%E7%BB%9F/01-OB_LifeOS_Build/99-%E6%96%87%E6%A1%A3/ECharts%E9%9B%86%E6%88%90%E5%AE%9E%E6%96%BD%E6%8C%87%E5%8D%97.md)


