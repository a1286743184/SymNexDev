# SymbiNexus 架构研究报告

> 研究时间：2026-04-14 | Agent类型：Code Researcher | 任务ID：001

---

## 一、系统总览

SymbiNexus 是一个基于 Obsidian 的 All-in-One 个人全能管理系统，核心理念为"AI驱动的智能分类录入 + 多维度数据归档 + 可视化看板"。系统以 `smart-input-pro` 插件为唯一入口，通过自然语言输入自动分类并路由到8大子系统，实现从信息捕获到结构化存储的全链路自动化。

**核心架构模式**：管道式数据流（Pipeline） + 模块化路由（Module Router） + 壳文件渲染（Shell Rendering）

---

## 二、8大子系统目录结构

### 01-经纬矩阵系统（任务调度中枢）

```
01-经纬矩阵系统/
  01-看板模块/
    今日聚焦.md              # lifeos-task壳文件，mode: today-focus
    今日聚焦.config.json      # 任务源配置（7个数据源）
    今日聚焦配置.md           # 配置说明
    任务控制台.md             # lifeos-task壳文件，mode: console
  02-周委托模块/
    周度委托列表26W16.md      # 当前周任务列表（Templater自动命名）
  03-备忘提醒模块/
    备忘录.md                 # 备忘任务汇总（Obsidian Tasks格式）
    备忘提醒路径配置.md
  04-规律性事项模块/
    规律性事项列表.md         # 循环任务（🔁 every week/day）
  08-智能录入模块/
    01-INBOX.md              # 杂项/未分类记录的兜底落点
    02-Require.md            # 代码开发需求落点
    03-智能录入看板.md        # DVJS看板（SmartInputKit渲染）
    智能录入日志/
      SIPLog_2026-01.md      # 月度Token消耗日志
      SIPLog_History.md
  99-任务归档/
    99-周委托归档/2025/       # 按年归档的周委托
    99-周委托归档/2026/
```

### 02-复盘系统

```
02-复盘系统/
  01-日复盘/
    足迹25-10-20.md          # 当前日复盘（Templater自动命名）
    99-日复盘归档/            # 历史日复盘
  02-周复盘/
    周航行报告25W38.md       # 周复盘文件
```

### 03-成就系统

```
03-成就系统/
  🏆成就馆.md                # 成就总览（按日期分组，传说/史诗/稀有/普通四级）
```

### 04-模板系统

```
04-模板系统/
  00-核心模块/
    枢轴偏移.dvjs.md         # 3点枢轴日期逻辑（window.ObLife.pivot3am）
    枢轴偏移.tpl.md          # Templater版枢轴函数
    枢轴偏移.readme.md       # 使用说明
  01-复盘模板/
    日复盘.md                # Templater模板（自动重命名为"足迹YY-MM-DD"）
    周复盘.md                # Templater模板（自动重命名为"周航行报告YYWW"）
    知识点.md
    行测复盘.md              # 题目复盘模板
  02-计划模板/
    周计划.md                # Templater模板（自动重命名为"周度委托列表YYYYWW"）
  03-生活坐标模板/
    角色档案/角色档案.md      # 含dynbedded子版块嵌入
    角色档案/子版块-档案卡.md
    角色档案/子版块-周期待办.md
    角色档案/子版块-时间轴.md
    事件记录/事件记录.md      # 含枢轴偏移逻辑+自动重命名
    事件记录/子版块-与会者.md
    装备档案.md
  09-专用模板/
    记账模板.md              # {{VALUE:xxx}} 占位符模板
    宠物驱虫计划.md
```

### 05-生活坐标系统

```
05-生活坐标系统/
  01-角色档案/
    月饼家族/                # 宠物家族（月饼+6只崽子）
    妈妈.md / 爸爸.md / 自己.md / 阿软.md / ...
  02-事件记录/               # 事件记录文件
  03-装备档案/               # 购入物品档案（YYMM-序号-品牌-品名）
  04-美食档案/
    菜谱/                    # 菜谱文件
    美食收藏.md              # 美食心愿单
  05-消费决策/               # 价格追踪文件（单品比价）
  06-生活经验/
    备孕与养狗/              # 专题知识库
    月饼与幼崽/              # 养犬SOP
```

### 06-财务系统

```
06-财务系统/
  01-账单数据/
    2025/10/                 # 按年/月分目录
      251005-08-工作学习-课程.md   # YYMMDD-序号-分类-子分类.md
    2025/11/
    2025/12/
    2026/01/
    2026/02/
  02-统计分析/               # 财务看板壳文件
```

### 07-项目系统

```
07-项目系统/
  01-公务员考试/
    01-行测/
      01-刷题复盘/
        01-言语理解/          # 按板块分类的刷题复盘
        02-判断推理/
        03-资料分析/
        06-刷题记录/          # 数据看板（DVJS渲染）
      02-知识沉淀/
        00-理论体系/
        01-考点坑点/
        02-错误归因/
        03-方法论/
        04-词义积累/
        05-词义辨析/
        06-固定搭配/
      03-中期回看/
    02-申论/
      01-刷题复盘/
      02-知识沉淀/
    03-面试/
    学习计划/
  02-摄影/
    01-理论积累/
```

### 08-科技树系统

```
08-科技树系统/
  01-OB_LifeOS_Build/
    00-通用模块库/
      SmartInputKit.js       # 智能录入看板DVJS库
      TaskDashboardKit.js    # 任务看板DVJS库
      PuppyBoardKit.js       # 宠物看板DVJS库
      PuppyProfileKit.js     # 宠物档案DVJS库
      PuppyVizKit.js         # 宠物可视化DVJS库
      echarts.js             # ECharts图表库
      price_dashboard.js     # 价格看板DVJS库
      VoiceInputModule.js    # 语音输入模块
      orb-scripts/           # CommandOrb快捷脚本
        TaskReorderModule.js
        UpdateStudyPlan.js
        toggle-image-converter.js
        open-daily-review.js
        open-inbox.js
        open-weekly-plan.js
      task-reminder/         # 外部任务提醒（PowerShell脚本）
    01-提示词/                # AI提示词存档
    02-示例/                  # 代码示例
    03-密钥/                  # API密钥文件
    04-技能/                  # Trae技能定义
    98-配置/smart-input-pro/prompts/
      pipeline/
        stage1_classification_prompt.md  # 阶段一分类提示词
        stage2_optimization_prompt.md    # 阶段二优化提示词
      modules/
        bill.md / task.md / memo.md / contact.md / ...
    99-文档/                  # 开发文档
  02-公考学习/
    01-提示词/                # 公考专用提示词
```

---

## 三、核心插件功能分析

### 3.1 smart-input-pro（智能录入核心）

**文件**：[main.js](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/.obsidian/plugins/smart-input-pro/main.js) | [data.json](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/.obsidian/plugins/smart-input-pro/data.json)

**核心流程**：两阶段管道式处理

```
用户输入文本
    |
    v
[阶段一] classifyCategoryOnly(text)
    |  AI分类：11个类别（bill/task/memo/contact/sip_plugin/
    |  food_wishlist/price_tracker/question_entry/study_record/pet_growth/other）
    |  提示词：stage1_classification_prompt.md
    |  输出：{ category: "xxx" }
    v
[可选优化] maybeOptimizeTextForStage2(text, category)
    |  仅当 enableOptimization=true 时执行
    |  提示词：stage2_optimization_prompt.md
    v
[阶段二] processCategoryXxx(optimizedText)
    |  根据分类路由到11个处理函数
    |  每个函数：AI结构化提取 -> 模板变量替换 -> 文件写入
    v
写入目标文件 + 导航跳转
```

**AI服务商路由**（[data.json#L144-L157](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/.obsidian/plugins/smart-input-pro/data.json#L144-L157)）：
- 主力：LongCat（美团 LongCat-Flash-Chat）
- 备选：doubao（豆包 doubao-seed-2-0-mini）
- 可选：智谱/稀宇/千问/小米/谷歌/阿里 共8个服务商
- 降级机制：主力失败自动切备选，支持按日配额封锁

**模块路由表**（[data.json#L159-L213](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/.obsidian/plugins/smart-input-pro/data.json#L159-L213)）：

| 模块ID | 显示名 | 目标路径 | 模板路径 | 语义优化 |
|--------|--------|---------|---------|---------|
| bill | 账务收支 | 06-财务系统/01-账单数据 | 04-模板系统/09-专用模板/记账模板.md | 否 |
| task | 任务事项 | (写入周委托/备忘) | - | 是 |
| memo | 快捷备忘 | (写入备忘录) | - | 是 |
| contact | 联系信息 | (创建角色档案) | 04-模板系统/03-生活坐标模板/角色档案 | 是 |
| question_entry | 题目录入 | 07-项目系统/.../01-刷题复盘 | 04-模板系统/01-复盘模板/行测复盘.md | 否 |
| code_dev | 代码开发 | 01-经纬矩阵系统/.../02-Require.md | - | 是 |
| food_wishlist | 美食收藏 | 05-生活坐标系统/04-美食档案/美食收藏.md | - | 否 |
| price_tracker | 价格追踪 | 05-生活坐标系统/05-消费决策 | - | 否 |
| study_record | 刷题记录 | 07-项目系统/.../06-刷题记录 | - | 否 |
| pet_growth | 崽子成长 | 05-生活坐标系统/01-角色档案/月饼家族 | - | 是 |
| other | 杂项记录 | 01-经纬矩阵系统/.../01-INBOX.md | - | 是 |

**PromptManager**（[main.js#L29-L240](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/.obsidian/plugins/smart-input-pro/main.js#L29-L240)）：
- 提示词存储在 `08-科技树系统/01-OB_LifeOS_Build/98-配置/smart-input-pro/prompts/`
- 分为 `defaults.js`（内置默认）和 `user.js`（用户覆盖）
- 支持热加载、缓存、迁移

**账单处理详解**（[main.js#L3201-L3400](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/.obsidian/plugins/smart-input-pro/main.js#L3201-L3400)）：
1. AI提取JSON数组（支持多条账单）
2. 渠道强制归一化（Code-Level Force Normalization）
3. 日期解析（跨年回溯、禁止未来日期）
4. 文件名生成：`YYMMDD-序号-分类-子分类.md`
5. 模板变量替换：`{{VALUE:xxx}}` -> 实际值
6. 耐用品自动登记（电子产品/家具家电/装修硬装 -> 装备档案）

### 3.2 lifeos-engine（看板引擎）

**文件**：[main.js](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/.obsidian/plugins/lifeos-engine/main.js) | [data.json](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/.obsidian/plugins/lifeos-engine/data.json)

**核心机制**：壳文件（Shell）+ Markdown代码块处理器

**壳文件模式**：
- 在md文件的frontmatter中标记 `lifeos.kind`
- 通过 `registerMarkdownCodeBlockProcessor` 注册 `lifeos-task` 和 `lifeos-finance` 代码块
- 打开壳文件时自动渲染为交互式看板

**任务系统**（[data.json#L17-L95](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/.obsidian/plugins/lifeos-engine/data.json#L17-L95)）：
- 7个数据源：角色档案(文件夹)、周计划(文件夹)、规律事项(文件)、备忘(文件)、INBOX(文件)、开发需求(文件)、公考计划(文件)
- 排除路径：99-周委托归档、99-附件
- 周委托管理：自动换周归档、未完成任务迁移
- 渲染模式：console（控制台）、today-focus（今日聚焦）

**财务系统**（[data.json#L96-L236](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/.obsidian/plugins/lifeos-engine/data.json#L96-L236)）：
- 数据源：06-财务系统/01-账单数据（文件夹）
- Schema字段映射：type/category/subcategory/amount/channel/date/description
- 渠道归一化：微信/支付宝/现金/云闪付/多多/美团/京东/抖音/滴滴/数币
- 渲染模式：console（控制台）、month（月度看板）、year（年度看板）、assets（资产统计）
- 图表类型：饼图/热力图/趋势图/TopN
- 性能优化：索引缓存（财务看板.index.json）、最大5000文件

**任务控制台KPI**（[main.js#L950-L1120](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/.obsidian/plugins/lifeos-engine/main.js#L950-L1120)）：
- 滞后待办/今日待办/未来前瞻/待排期/今日已完结/循环任务/来源数量/扫描文件

**财务控制台KPI**（[main.js#L1123-L1200](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/.obsidian/plugins/lifeos-engine/main.js#L1123-L1200)）：
- 本月支出/本月收入/本月结余/账单记录/资产数量/资产总值/索引缓存/数据来源

### 3.3 command-orb（浮动命令按钮）

**文件**：[main.js](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/.obsidian/plugins/command-orb/main.js) | [data.json](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/.obsidian/plugins/command-orb/data.json)

**功能**：
- 浮动按钮（FAB）：可拖拽定位，紫色主题(#8B5CF6)
- 快捷命令栏（Quickbar）：点击FAB展开，显示常用命令
- 脚本执行：从 `08-科技树系统/01-OB_LifeOS_Build/00-通用模块库/orb-scripts/` 加载JS脚本
- 安全沙箱：限制require范围（obsidian/fs/path/child_process）

**当前快捷命令**（[data.json#L20-L35](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/.obsidian/plugins/command-orb/data.json#L20-L35)）：

| 命令 | 标签 | 星标 | 说明 |
|------|------|------|------|
| app:reload | 重加载 | 是 | 重载Obsidian |
| properties:open-local | 显示属性 | 否 | 打开属性面板 |
| orb-script-048d6f01 | 图片转换开关 | 否 | toggle-image-converter.js |
| orb-script-af5a8548 | 任务重排 | 否 | TaskReorderModule.js |
| orb-script-15e1453b | 学习计划更新 | 是 | UpdateStudyPlan.js |
| smart-input-pro:smart-input | 智能录入 | 是 | SIP核心入口 |

**快捷键绑定**（[hotkeys.json](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/.obsidian/plugins/smart-input-pro/../../.obsidian/hotkeys.json)）：
- Alt+Q -> 任务重排脚本
- Alt+I -> 显示属性
- Alt+Down -> 任务重排
- Ctrl+Shift+H -> 正则替换

### 3.4 view-controller（视图模式控制）

**文件**：[main.js](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/.obsidian/plugins/view-controller/main.js) | [data.json](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/.obsidian/plugins/view-controller/data.json)

**功能**：根据文件路径自动切换视图模式和跳转位置

**视图模式**：default / reading / source / live

**跳转目标**：none / bottom / heading / regex

**当前规则**（[data.json#L3-L37](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/.obsidian/plugins/view-controller/data.json#L3-L37)）：

| 路径 | 视图模式 | 跳转目标 | 说明 |
|------|---------|---------|------|
| 05-.../月饼家族 | source | heading(第2个) | 宠物档案用源码模式，跳到第2个标题 |
| 01-.../智能录入日志 | reading | bottom | 日志用阅读模式，跳到文末 |
| 05-.../崽子成长监控面板 | reading | none | 监控面板纯阅读 |
| 01-.../02-Require.md | live | bottom | 开发需求用实时预览，跳到文末 |
| 01-.../03-智能录入看板.md | reading | none | 看板纯阅读 |

**SIP导航兼容**：检测 `window.sipNavigationInProgress` 标记，SIP写入后跳转时跳过VC逻辑

### 3.5 dataview（数据查询引擎）

**文件**：[data.json](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/.obsidian/plugins/dataview/data.json)

**关键配置**：
- 启用DataviewJS和Inline DataviewJS
- 刷新间隔：2500ms
- 内联查询前缀：`=` / `$=`
- 最大递归渲染深度：4
- 允许HTML渲染

**DVJS在系统中的使用场景**：
1. **枢轴偏移模块**（`04-模板系统/00-核心模块/枢轴偏移.dvjs.md`）：注入 `window.ObLife.pivot3am` 全局对象
2. **智能录入看板**（`01-经纬矩阵系统/08-智能录入模块/03-智能录入看板.md`）：加载 SmartInputKit.js
3. **任务看板**：加载 TaskDashboardKit.js
4. **宠物看板**：加载 PuppyBoardKit.js / PuppyVizKit.js
5. **价格看板**：加载 price_dashboard.js
6. **刷题数据看板**：行测各板块的统计看板

---

## 四、数据流分析

### 4.1 智能录入全链路数据流

```
用户输入（文本/语音）
    |
    v
smart-input-pro: classifyAndSave()
    |
    +-- [阶段一] classifyCategoryOnly()
    |       |  提示词: stage1_classification_prompt.md
    |       |  AI调用: callAIByProvider() -> LongCat-Flash-Chat
    |       |  输出: { category: "bill" }
    |       v
    +-- [可选优化] maybeOptimizeTextForStage2()
    |       |  提示词: stage2_optimization_prompt.md
    |       |  仅当 enableOptimization=true
    |       v
    +-- [阶段二] processCategoryXxx()
            |  提示词: modules/xxx.md
            |  AI调用: callAIByProvider() -> 结构化JSON
            |  模板渲染: {{VALUE:xxx}} 替换
            |  文件写入: vault.create()
            v
    +-- bill: 06-财务系统/01-账单数据/YYYY/MM/YYMMDD-序号-分类-子分类.md
    +-- task: 01-经纬矩阵系统/02-周委托模块/周度委托列表YYWW.md (追加任务)
    +-- memo: 01-经纬矩阵系统/03-备忘提醒模块/备忘录.md (追加备忘)
    +-- contact: 05-生活坐标系统/01-角色档案/新角色.md (创建档案)
    +-- question_entry: 07-项目系统/.../01-刷题复盘/XX板块/题名.md
    +-- code_dev: 01-经纬矩阵系统/08-智能录入模块/02-Require.md
    +-- food_wishlist: 05-生活坐标系统/04-美食档案/美食收藏.md
    +-- price_tracker: 05-生活坐标系统/05-消费决策/商品名.md
    +-- study_record: 07-项目系统/.../06-刷题记录/板块记录.md
    +-- pet_growth: 05-生活坐标系统/01-角色档案/月饼家族/崽子名.md
    +-- other: 01-经纬矩阵系统/08-智能录入模块/01-INBOX.md
```

### 4.2 任务系统数据流

```
数据源（7个）:
  05-生活坐标系统/01-角色档案/    -> 角色相关任务
  01-经纬矩阵系统/02-周委托模块/  -> 周计划任务
  01-经纬矩阵系统/04-规律性事项/  -> 循环任务
  01-经纬矩阵系统/03-备忘提醒/    -> 备忘任务
  01-经纬矩阵系统/08-智能录入/01-INBOX.md -> 兜底任务
  01-经纬矩阵系统/08-智能录入/02-Require.md -> 开发需求
  07-项目系统/.../公考学习计划.md  -> 学习任务
    |
    v
lifeos-engine: _buildTaskPagesForTaskKit()
    |  扫描所有数据源文件
    |  解析Obsidian Tasks格式（- [ ] / - [x]）
    |  应用3点枢轴日期逻辑
    |  分类到buckets: overdue/today/forecast/undated/completed
    v
渲染目标:
  今日聚焦.md (mode: today-focus) -> TaskDashboardKit.js
  任务控制台.md (mode: console) -> lifeos-engine内置渲染
```

### 4.3 财务系统数据流

```
数据源:
  06-财务系统/01-账单数据/YYYY/MM/*.md
    每个md文件的frontmatter:
      type: 支出/收入
      category: 一级分类（交通出行/餐饮消费/购物消费/...）
      subcategory: 二级分类（停车/外卖/买菜/...）
      amount: 12.00
      channel: 微信支付
      note: 停车费
      create_date: ISO时间戳
      year/month/quarter/weekday
    |
    v
lifeos-engine: renderFinanceConsole/renderFinanceDashboard
    |  扫描账单目录
    |  解析frontmatter字段
    |  渠道归一化（normalization.channelAlias）
    |  按月/年聚合统计
    |  生成图表（饼图/热力图/趋势图/TopN）
    v
渲染目标:
  财务控制台 (mode: console)
  月度看板 (mode: month, period: 2026-01)
  年度看板 (mode: year, period: 2026)
  资产统计 (mode: assets)
```

### 4.4 模块间数据依赖关系

```
smart-input-pro ----写入----> 06-财务系统/01-账单数据
                 ----写入----> 01-经纬矩阵系统/02-周委托模块
                 ----写入----> 01-经纬矩阵系统/03-备忘提醒模块
                 ----写入----> 05-生活坐标系统/01-角色档案
                 ----写入----> 05-生活坐标系统/04-美食档案
                 ----写入----> 05-生活坐标系统/05-消费决策
                 ----写入----> 07-项目系统/01-公务员考试/...
                 ----写入----> 01-经纬矩阵系统/08-智能录入模块

lifeos-engine <---读取---- 01-经纬矩阵系统/01-看板模块 (壳文件)
              <---读取---- 06-财务系统/01-账单数据 (账单frontmatter)
              <---读取---- 01-经纬矩阵系统/02-周委托模块 (任务)
              <---读取---- 01-经纬矩阵系统/03-备忘提醒模块 (备忘)
              <---读取---- 01-经纬矩阵系统/04-规律性事项模块 (循环)
              <---读取---- 05-生活坐标系统/01-角色档案 (角色任务)
              <---读取---- 07-项目系统/.../公考学习计划.md (学习任务)

view-controller <---监听---- file-open事件
                <---读取---- data.json规则配置

command-orb <---加载---- 08-科技树系统/.../orb-scripts/*.js

dataview <---执行---- 04-模板系统/00-核心模块/枢轴偏移.dvjs.md
          <---执行---- 08-科技树系统/.../00-通用模块库/*.js
          <---查询---- 全Vault的frontmatter和任务数据
```

---

## 五、模板系统分析

### 5.1 模板变量体系

**记账模板**（`04-模板系统/09-专用模板/记账模板.md`）：
- 占位符格式：`{{VALUE:xxx}}`
- 变量列表：type/category/subcategory/amount/channel/note/create_date/year/month/quarter/weekday/signed_amount/raw_input/date/time
- 渲染方式：SIP在processCategoryBill中通过正则替换

**日复盘模板**（`04-模板系统/01-复盘模板/日复盘.md`）：
- Templater语法：`<% tp.date.now("YYYY-MM-DD") %>`
- 自动重命名：`足迹${date}`
- 结构：每日委托 / 速记 / 闪光点与思考

**周复盘模板**（`04-模板系统/01-复盘模板/周复盘.md`）：
- Templater语法：`<% tp.date.now("YY") %>` / `<% tp.date.now("WW") %>`
- 自动重命名：`周航行报告${year}W${week}`
- 结构：数据罗盘 / 核心目标 / 高光时刻 / 深度复盘 / 连贯叙事

**周计划模板**（`04-模板系统/02-计划模板/周计划.md`）：
- Templater语法：`moment().add(7, 'days')` 计算下周
- 自动重命名：`周度委托列表${year}W${week}`
- 结构：主线任务 / 支线任务（含示例任务）

**角色档案模板**（`04-模板系统/03-生活坐标模板/角色档案/角色档案.md`）：
- Frontmatter：type/name/alias/tags/birthday/first-met/last-contact/location/tel
- dynbedded嵌入：子版块-档案卡 / 子版块-周期待办 / 子版块-时间轴
- 结构：档案卡片 / 周期性事件待办 / 时间轴 / 角色画像 / 周期性事件归档 / 琐事记录

**事件记录模板**（`04-模板系统/03-生活坐标模板/事件记录/事件记录.md`）：
- 枢轴偏移：`await tp.file.include("[[枢轴偏移.tpl]]")` 引入3点枢轴函数
- 自动重命名：`${date}事件记录`（同名自动加序号）
- Frontmatter日期：使用 `pivotDateISO(3)` 设置逻辑日期
- 自动打开属性面板

**行测复盘模板**（`04-模板系统/01-复盘模板/行测复盘.md`）：
- Frontmatter：type/keyword/module/submod/result/date/tags
- 结构：题目原貌 / 我的选择与思考 / 正确答案与解析 / 我的解构与收获 / 考点障碍点分析 / 错误归因 / 提炼与总结

### 5.2 枢轴偏移核心模块

**文件**：[枢轴偏移.dvjs.md](file:///d:/Docements/Obsidian%20Vault/SymbiNexus/04-模板系统/00-核心模块/枢轴偏移.dvjs.md)

**核心逻辑**：将本地时间 0:00-2:59 视为上一"逻辑日"（默认枢轴小时=3）

**注入对象**：`window.ObLife.pivot3am`

**关键函数**：
- `logicalTodayISO(pivotHour)` -> 逻辑今天的ISO日期
- `isoDateWithPivot(raw, pivotHour)` -> 任意时间转逻辑日期
- `completionISO(completion, pivotHour)` -> 任务完成日的逻辑日期
- `isLateByPivot(due, completion, pivotHour)` -> 逾期判断（比较枢轴后ISO日期）
- `bind(pivotHour)` -> 返回便捷函数集合

**使用方式**：通过 `dynbedded` 在页面顶部引入，后续DVJS代码通过 `window.ObLife.pivot3am` 访问

---

## 六、关键配置文件

### 6.1 插件生态

**已启用社区插件**（18个）：
1. obsidian-style-settings - 样式设置
2. templater-obsidian - 模板引擎
3. dataview - 数据查询
4. obsidian-copy-block-link - 块链接复制
5. obsidian-tasks-plugin - 任务管理
6. homepage - 首页
7. emoji-shortcodes - Emoji快捷输入
8. obsidian-dynbedded - 嵌入式内容块
9. command-orb - 浮动命令按钮
10. regex-mark - 正则标记
11. colored-tags - 彩色标签
12. obsidian-icon-folder - 文件夹图标
13. attachment-management - 附件管理
14. view-controller - 视图控制
15. lifeos-engine - LifeOS引擎
16. smart-input-pro - 智能录入
17. image-converter - 图片转换

**核心插件**：file-explorer / global-search / switcher / graph / backlink / tag-pane / properties / bookmarks / outline

### 6.2 快捷键配置

| 快捷键 | 命令 | 说明 |
|--------|------|------|
| Alt+Q | orb-script-113aff41 | 任务重排 |
| Alt+I | properties:open-local | 显示属性 |
| Alt+Down | orb-script-af5a8548 | 任务重排 |
| Ctrl+Shift+H | obsidian-regex-replace | 正则替换 |
| Ctrl+Shift+C | copy-block-link | 复制块链接 |

### 6.3 CSS Snippets

- Tag Fonts.css - 标签字体
- achievements.css - 成就系统样式
- folder-colors.css - 文件夹颜色
- profile-table.css - 档案表格样式
- table.css - 表格样式

---

## 七、架构特征总结

### 7.1 设计模式

| 模式 | 应用位置 | 说明 |
|------|---------|------|
| 管道模式 | smart-input-pro | 两阶段AI处理管道 |
| 模块路由 | SIP分类分发 | 11个模块的switch-case路由 |
| 壳文件模式 | lifeos-engine | md文件作为UI壳，代码块处理器渲染 |
| 插件沙箱 | command-orb | 限制性require + JS脚本执行 |
| 全局注入 | 枢轴偏移模块 | window.ObLife.pivot3am全局对象 |
| 降级容错 | SIP错误处理 | AI失败 -> 降级到INBOX |
| 模板变量 | 记账模板 | {{VALUE:xxx}}占位符替换 |

### 7.2 数据一致性机制

1. **3点枢轴偏移**：解决"工作到凌晨2点但任务归属前一天"的问题
2. **渠道强制归一**：Code-Level Force Normalization，AI输出后二次校验
3. **文件名编码**：`YYMMDD-序号-分类-子分类.md`，通过文件名即可定位
4. **索引缓存**：lifeos-engine维护 `财务看板.index.json`，避免重复扫描
5. **Token消耗追踪**：SIP记录每次AI调用的Token消耗

### 7.3 关键依赖关系

```
smart-input-pro (写入者)
    |
    +---> lifeos-engine (读取者/渲染者)
    |       依赖：账单frontmatter格式、任务格式、壳文件标记
    |
    +---> view-controller (监听者)
    |       依赖：SIP导航标记(window.sipNavigationInProgress)
    |
    +---> dataview (查询者)
    |       依赖：frontmatter字段、任务格式
    |
    +---> command-orb (触发者)
            依赖：SIP命令ID(smart-input-pro:smart-input)
```

### 7.4 潜在风险点

1. **全局对象污染**：枢轴偏移模块注入 `window.ObLife`，SmartInputKit注入 `window.SmartInputKit`，多插件共享全局命名空间
2. **AI提示词硬编码**：分类边界规则在提示词中定义，修改需同步更新提示词文件
3. **文件系统依赖**：账单文件名编码规则变更会导致lifeos-engine解析失败
4. **同步冲突**：Syncthing多端同步时，周委托文件出现 `.sync-conflict` 副本（已观察到）
5. **DVJS库加载**：SmartInputKit等通过 `new Function()` 动态加载，无模块化隔离
