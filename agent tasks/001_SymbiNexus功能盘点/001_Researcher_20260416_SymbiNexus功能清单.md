# SymbiNexus Obsidian 个人管理系统 -- 完整功能清单

> 分析日期: 2026-04-16
> 来源: d:\DevEnv\ref\SymbiNexus

---

## 一、Smart Input Pro 插件 (v2.1.1)

### 1.1 AI 管线架构

**三阶段处理流程:**

```
用户输入 -> Stage1: 分类 -> Stage2: 语义优化(可选) -> Stage3: 模块提取 -> 自动落盘
```

- **Stage1 (分类)**: `stage1_classification_prompt` -- 将原始文本分类到11个功能类别之一
- **Stage2 (语义优化)**: `stage2_optimization_prompt` -- 语音文本去噪润色(口头禅剔除、改口修正、语序优化)，可按模块单独启用/禁用(`enableOptimization`)
- **Stage3 (模块提取)**: 每个模块独立的 `extractionPrompt`，将优化后文本提取为结构化JSON

**Prompt管理机制:**
- `defaults.js`: 只读基线提示词
- `user.js`: 用户覆盖层(仅存储与默认不同的部分)
- `manager.js`: PromptManager 类，自动合并 defaults + user overrides
- 变量占位符: `${text}`, `${optimizedText}`, `${currentDate}`, `${sysDateStr}`, `${weekDayStr}`, `${petNames}`, `${existingShops}`

### 1.2 11个分类模块

| 模块ID | 显示名 | 启用优化 | 目标路径 | 提取字段 |
|--------|--------|---------|---------|---------|
| `bill` | 账务收支 | 否 | `06-财务系统/01-账单数据` | date, type, amount, channel, category, subcategory, note, item_text |
| `task` | 任务事项 | 是 | (写入周委托) | task_title, task_context, due_date, time_info |
| `memo` | 快捷备忘 | 是 | (写入备忘录) | memo_content, due_date, time_info |
| `contact` | 联系信息 | 是 | (写入INBOX) | name, phone, relationship, note |
| `question_entry` | 题目录入 | 否 | `07-项目系统/01-公务员考试/01-行测/01-刷题复盘` | section, question_identifier, optimized_content |
| `code_dev` | 代码开发 | 是 | `01-经纬矩阵系统/08-智能录入模块/02-Require.md` | task_title, task_context, due_date, time_info |
| `food_wishlist` | 美食收藏 | 否 | `05-生活坐标系统/04-美食档案/美食收藏.md` | shop, status, cuisine, location, dishes |
| `price_tracker` | 价格追踪 | 否 | `05-生活坐标系统/05-消费决策` | product_name, total_price, quote_qty/quote_unit, pack_count/item_unit, atom_value/atom_unit, location |
| `study_record` | 刷题记录 | 否 | `07-项目系统/01-公务员考试/01-行测/01-刷题复盘/06-刷题记录` | exam_name, section_name, time_spent, total_questions, correct_answers, wrong_answers |
| `pet_growth` | 崽子成长 | 是 | `05-生活坐标系统/01-角色档案/月饼家族` | name, weight_g, date, note |
| `other` | 杂项记录 | 是 | `01-经纬矩阵系统/08-智能录入模块/01-INBOX.md` | (原始文本直接落盘) |

### 1.3 8个 LLM 供应商配置

| 供应商ID | 名称 | 协议 | 模型 | 用途 |
|----------|------|------|------|------|
| `zhipu` | 智谱 | openai | glm-4.5-flash, GLM-4.5-X, GLM-4.5-AirX, glm-4.7-flash | 通用 |
| `minimax` | 稀宇 | anthropic | MiniMax-M2.7-highspeed, MiniMax-M2.5 | 通用 |
| `qwen` | 千问 | openai | qwen-flash, qwen3-max, qwen-plus | 通用 |
| `mimo` | 小米 | anthropic | mimo-v2-flash | 通用 |
| `google` | 谷歌 | openai | gemini-2.5-flash | 通用 |
| `doubao` | 豆包 | auto | doubao-seed-2-0-mini/lite/pro-260215 | 通用 |
| `AL` | 阿里 | openai | qwen3.5-plus, glm-4.7, kimi-k2.5 | 通用 |
| `LongCat` | 美团 | openai | LongCat-Flash-Thinking/Chat/Lite | **主用** |

**策略配置:**
- 主用: LongCat / LongCat-Flash-Chat
- 备用: doubao / doubao-seed-2-0-mini-260215 (当前禁用)
- 快速输入各供应商独立模型配置
- API Key 通过 Vault 内文件路径引用(非明文存储)

### 1.4 账单模块特殊逻辑

**支付渠道标准化(三级优先级):**
1. 支付工具优先: 微信支付 > 支付宝 > 云闪付 > 现金 > 数字人民币
2. 平台默认: 多多支付 > 美团支付 > 京东支付 > 抖音支付 > 滴滴支付
3. 银行卡: `[银行全称] + [储蓄卡/信用卡]`

**分类映射表:**
- 支出10大类: 餐饮消费, 购物消费, 交通出行, 娱乐休闲, 居住费用, 医疗健康, 工作学习, 人情往来, 宠物消费, 内部转移, 其他支出
- 收入6大类: 工资收入, 投资收益, 兼职收入, 家庭资助, 其他收入, 内部转入

**特殊术语映射:** 月饼=小狗, 阿软/软软/咪总/媳妇=妻子, 小白=我的车, 可可=老婆的车

**资产信息提取(可选):** `asset_log_prompt` -- 提取 product_name, brand, vendor, asset_type(13种耐用品分类)

### 1.5 语音输入模块

- 快速输入模式: `autoSubmit: true` (自动提交)
- 可切换供应商和模型
- 语义优化专门针对语音转文本场景(去噪、改口修正、保真)

### 1.6 UI 交互

- **输入模态框**: 圆角24px, 紫色主题(#baa8fe), 最大宽度600px
- **工具栏**: 供应商切换(药丸样式) + 快捷开关(自动分类/语音等)
- **确认按钮**: 全宽紫色渐变
- **移动端适配**: 固定定位, 紧凑布局, 触摸优化
- **Token成本追踪**: 记录到 `01-经纬矩阵系统/08-智能录入模块/03-智能录入日志.md`

---

## 二、LifeOS Engine 插件

### 2.1 Shell 文件渲染系统

**frontmatter 标记:** `lifeos.kind` 字段决定渲染方式

**已识别的 kind 类型:**
| kind 值 | 用途 | 对应代码块 |
|---------|------|-----------|
| `task-today-focus` | 今日聚焦看板 | `lifeos-task` / `mode: today-focus` |

### 2.2 三个代码块处理器

| 代码块 | 功能 | 参数 |
|--------|------|------|
| `lifeos-finance` | 财务看板渲染 | `mode`: month/year, `period`: YYYY-MM/YYYY |
| `lifeos-task` | 任务看板渲染 | `mode`: today-focus/weekly-focus/seven-day/monthly 等 |
| `lifeos-config` | 配置页面渲染 | `module`: finance/task |

### 2.3 Kit 模式架构

- `assets/task-dashboard-kit.js`: 任务看板逻辑(渲染、交互、数据)
- `assets/finance-viz-kit.js`: 财务看板逻辑
- `assets/echarts.min.js`: ECharts 图表库
- `assets/finance-viz-kit.js` + `assets/task-dashboard-kit.js`: 两个核心业务逻辑库

### 2.4 控制台页面

**任务控制台** (`taskConsoleDir: 01-经纬矩阵系统/01-看板模块`):
- KPI 网格(4列)
- 核心入口瓦片(今日聚焦/本周聚焦/七日前瞻/月度前瞻)
- 维护与定位(配置/索引)

**财务控制台** (`financeConsoleDir: 06-财务系统/02-统计分析`):
- KPI 网格
- 看板入口(月度/年度)
- 维护与数据(配置/索引/资产)

**资产统计页面**: 来源SIP记账自动生成的装备档案

### 2.5 任务数据源配置

| 源ID | 类型 | 路径 | 名称 |
|------|------|------|------|
| roles | folder | `05-生活坐标系统/01-角色档案` | 角色档案 |
| weekly | folder | `01-经纬矩阵系统/02-周委托模块` | 周计划 |
| routines | file | `01-经纬矩阵系统/04-规律性事项模块/规律性事项列表.md` | 规律事项 |
| memos | file | `01-经纬矩阵系统/03-备忘提醒模块/备忘录.md` | 备忘 |
| inbox | file | `01-经纬矩阵系统/08-智能录入模块/01-INBOX.md` | INBOX |
| require | file | `01-经纬矩阵系统/08-智能录入模块/02-Require.md` | 开发需求 |
| s-1769265144346 | file | `07-项目系统/01-公务员考试/学习计划/公考学习计划.md` | 公考计划 |

**排除路径:** `99-周委托归档`, `99-附件`

### 2.6 财务模块配置

**数据源:** `06-财务系统/01-账单数据` (folder)

**Schema字段映射:** type, category, subcategory, amount, channel, date, description(fallback)

**渠道标准化别名:**
- 微信支付/微信 -> 微信
- 支付宝 -> 支付宝
- 现金/现金支付 -> 现金
- 多多支付 -> 多多
- 美团支付 -> 美团
- 京东支付 -> 京东
- 抖音支付 -> 抖音
- 滴滴支付 -> 滴滴
- 数字人民币 -> 数币

**视图配置:**
- 月度视图: 卡片(含预算) + 图表(饼图/热力图/趋势/TopN) + 表格
- 年度视图: 卡片(无预算) + 图表(同上) + 表格

**性能:** 缓存启用, 缓存文件 `财务看板.index.json`, 最大5000文件

### 2.7 周委托系统

- 周起始: 周一
- 文件前缀: `01-经纬矩阵系统/02-周委托模块/周度委托列表`
- 归档目录: `01-经纬矩阵系统/99-任务归档/99-周委托归档`
- 自动迁移未完成任务: 是

---

## 三、View Controller 插件

### 3.1 视图切换规则

| 路径匹配 | 模式 | 跳转目标 | 参数 |
|----------|------|---------|------|
| `05-生活坐标系统/01-角色档案/月饼家族` | source | heading | `%%` (匹配第1个) |
| `01-经纬矩阵系统/08-智能录入模块/智能录入日志` | reading | bottom | - |
| `05-生活坐标系统/01-角色档案/月饼家族/崽子成长监控面板` | reading | none | `趋势` |
| `01-经纬矩阵系统/08-智能录入模块/02-Require.md` | live | bottom | - |
| `01-经纬矩阵系统/08-智能录入模块/03-智能录入看板.md` | reading | none | - |

**模式说明:**
- `source`: 源码编辑模式
- `reading`: 阅读模式
- `live`: 实时预览模式

**跳转目标:**
- `heading`: 跳转到指定标题
- `bottom`: 跳转到底部
- `none`: 不跳转

---

## 四、Command Orb 插件

### 4.1 浮动按钮

- 颜色: `#8B5CF6` (紫色)
- 桌面位置: 右下角 (bottom: 209, right: 259)
- 移动端位置: 右下角 (bottom: 199, right: 10)
- 长按阈值: 400ms
- 移动阈值: 10px

### 4.2 快捷栏命令

| 命令 | 标签 | 收藏 |
|------|------|------|
| `app:reload` | 重加载 | 是 |
| `properties:open-local` | 显示属性 | 否 |
| `command-orb:orb-script-048d6f01` | 图片转换开关 | 否 |
| `command-orb:orb-script-af5a8548` | 任务重排 | 否 |
| `command-orb:orb-script-15e1453b` | 学习计划更新 | 是 |
| `smart-input-pro:smart-input` | 智能录入 | 是 |

### 4.3 Orb 脚本

| 脚本 | 功能 | 详细描述 |
|------|------|---------|
| `open-inbox.js` | 打开INBOX | 打开 `01-经纬矩阵系统/08-智能录入模块/01-INBOX.md` |
| `open-daily-review.js` | 打开日复盘 | 枢轴偏移(凌晨3点前算前一天)，自动从模板创建 `02-复盘系统/01-日复盘/足迹YY-MM-DD.md` |
| `open-weekly-plan.js` | 打开周计划 | 计算ISO周数，打开 `01-经纬矩阵系统/02-周委托模块/周度委托列表YYYYWww.md` |
| `toggle-image-converter.js` | 切换图片转换插件 | 启用/禁用 image-converter 插件 |
| `TaskReorderModule.js` | 任务重排 | 按标题分组，已完成排前(完成日期降序)，未完成排后(截止日期升序)，自动清理空行，支持视图切换 |
| `UpdateStudyPlan.js` | 学习计划更新 | 完整的公考学习计划排布系统(见下文) |

### 4.4 学习计划更新脚本 (UpdateStudyPlan.js)

**核心功能:**
- 从行测清单 + 申论视频统计生成任务队列
- 按时段排布: 上午(行测) / 下午(混合) / 晚上(申论)
- 支持配置: 排布范围(7/14/全部), 时段起止时间, 日程可用性
- 日历式可用性设置(每天3个时段开关)
- 自动去重已完成任务
- 生成预测完成日期 + 历史预测记录(CSV)
- 历史进度统计(CSV): 每日计划/完成分钟数, 行测/申论分类统计

**输出文件:** `07-项目系统/01-公务员考试/学习计划/公考学习计划.md`

**Frontmatter字段:** examDate, planEndDate, deltaDays, remainingXingce, remainingShenlun, progressXingce, progressShenlun

---

## 五、辅助插件配置

### 5.1 Dataview 插件

**关键配置:**
- 内联查询前缀: `=`
- 内联JS查询前缀: `$=`
- DataviewJS关键词: `dataviewjs`
- 启用: DataviewJS, 内联Dataview, 内联DataviewJS
- 美化渲染内联字段: 是(含实时预览)
- 刷新间隔: 2500ms
- 递归渲染深度: 4
- 空值渲染: `\-`

### 5.2 Colored Tags 插件

**调色板:** `adaptive-soft` (自适应柔和)
**已知标签(部分重要):**

| 标签 | 用途 |
|------|------|
| `01_经纬矩阵系统` / `0101_看板模块` / `010101_今日聚焦` | 系统层级标签 |
| `备忘` | 备忘事项标记 |
| `行测` / `申论` / 各子板块 | 公考学习分类 |
| `角色/家人` / `角色/朋友` / `角色/月饼家族` | 人际关系分类 |
| `宠物/柯基` | 宠物相关 |
| `flashcards/申论` / `flashcards/行测` | 闪卡分类 |
| `sip插件` / `smart-input-pro` | 开发标记 |

### 5.3 Regex Mark 插件

**视觉标记规则:**

| 规则名 | 正则 | CSS类 | 效果 |
|--------|------|-------|------|
| 成就-传说 | `(【传说】.*)` | `achievement-legendary` | 橙色加粗+辉光 |
| 成就-史诗 | `(【史诗】.*)` | `achievement-epic` | 紫色加粗+辉光 |
| 成就-稀有 | `(【稀有】.*)` | `achievement-rare` | 蓝色加粗+辉光 |
| 成就-普通 | `(【普通】.*)` | `achievement-common` | 绿色加粗+辉光 |
| 时间记录-生存 | `(【生存】)` | `timelog-shengcun` | 棕色药丸标签 |
| 时间记录-升级 | `(【升级】)` | `timelog-shengji` | 橙色药丸标签 |
| 时间记录-赚钱 | `(【赚钱】)` | `timelog-zhuanqian` | 蓝色药丸标签 |
| 时间记录-愉悦 | `(【愉悦】)` | `timelog-yuyue` | 紫色药丸标签 |
| 时间记录-黑洞 | `(【黑洞】)` | `timelog-heidong` | 深灰药丸标签 |
| 进度单元 | `进度单元` | `meta-progress` | 进度标记 |

---

## 六、模板系统

### 6.1 核心模块

**枢轴偏移系统** (`00-核心模块/枢轴偏移.dvjs.md`):
- 核心概念: 凌晨3点前算"前一天"(解决深夜复盘日期问题)
- 导出函数: `isoDateWithPivot`, `logicalTodayISO`, `startOfLogicalDay`, `endOfLogicalDay`, `belongsToLogicalDate`, `isCancelledLine`, `completionISO`, `isLateByPivot`, `isCompletedToday`, `isCompletedThisWeek`
- 全局注入: `window.ObLife.pivot3am`
- 便捷绑定: `bind(pivotHour)` 返回一组绑定了枢轴小时的函数

**枢轴偏移模板** (`00-核心模块/枢轴偏移.tpl.md`): Templater 版本的枢轴函数

### 6.2 复盘模板

**日复盘** (`01-复盘模板/日复盘.md`):
- Frontmatter: date, summary
- 自动重命名: `足迹YY-MM-DD`
- 结构: 每日委托 / 速记 / 闪光点与思考

**行测复盘** (`01-复盘模板/行测复盘.md`):
- Frontmatter: type=刷题复盘, keyword, module, submod, result=错误, date, tags
- 结构: 题目原貌 / 我的选择与思考 / 正确答案与解析 / 我的解构与收获 / 考点障碍点分析 / 错误归因 / 提炼与总结

**周复盘** (`01-复盘模板/周复盘.md`):
- 自动重命名: `周航行报告YYWww`
- 结构: 数据罗盘(五色时间) / 核心目标进度 / 高光时刻 / 深度复盘 / 连贯叙事

**知识点** (`01-复盘模板/知识点.md`): 知识点记录模板

### 6.3 计划模板

**周计划** (`02-计划模板/周计划.md`):
- Templater脚本自动重命名: `周度委托列表YYYYWww`
- 结构: 主线任务 / 支线任务
- 任务格式: `- [ ] #标签 #类型 描述 📅 日期` + 进度单元子任务

### 6.4 生活坐标模板

**角色档案** (`03-生活坐标模板/角色档案/角色档案.md`):
- Frontmatter: type=角色档案, name, alias, tags, birthday, first-met, last-contact, location, tel
- 嵌入子版块(通过dynbedded): 档案卡 / 周期待办 / 时间轴
- 结构: 角色画像 / 周期性事件归档 / 琐事记录

**子版块-档案卡** (`子版块-档案卡.md`):
- DataviewJS渲染当前页面frontmatter为键值对表格
- 自动计算年龄(从birthday字段)
- 排除file/position/type字段

**子版块-时间轴** (`子版块-时间轴.md`):
- DataviewJS收集事件记录+日复盘中有双链到当前角色的页面
- 按日期倒序排列
- 显示: 事件名/简介/日期

**子版块-周期待办** (`子版块-周期待办.md`):
- DataviewJS收集当前页面未完成任务
- 按到期日排序(最近优先)
- 同名任务去重

**事件记录** (`03-生活坐标模板/事件记录/事件记录.md`):
- Frontmatter: type=事件记录, summary, attendees(双链), date, tags
- 枢轴偏移集成(逻辑日期计算)
- 自动重命名: `YY-MM-DD事件记录`(同名加序号)
- 自动打开属性面板
- 嵌入: 与会者子版块
- 结构: 议程/计划 / 记录 / 任务

**装备档案** (`03-生活坐标模板/装备档案.md`):
- Frontmatter: type=装备档案, name, buy-date, price, warranty-until, manual-link, tags=["装备/物品"]
- 结构: 基本信息 / 维护与提醒(年度保养+保修到期) / 使用记录

### 6.5 专用模板

**记账模板** (`09-专用模板/记账模板.md`):
- Frontmatter: type, category, subcategory, amount, channel, note, create_date, year, month, quarter, weekday
- 金额大字显示(3em, 紫色#512E5F)
- 账单详情 / 原始输入 / 时间维度

**宠物驱虫计划** (`09-专用模板/宠物驱虫计划.md`):
- 按月排布的驱虫任务(拜宠清/爱沃克/福来恩)
- 使用 #备忘 标签 + 📅 日期

---

## 七、核心系统文件

### 7.1 今日聚焦看板

**文件:** `01-经纬矩阵系统/01-看板模块/今日聚焦.md`
- Frontmatter: `lifeos.kind: task-today-focus`
- 代码块: `lifeos-task` / `mode: today-focus`
- 由 LifeOS Engine 渲染

**配置文件:** `今日聚焦.config.json`
- 数据源同 LifeOS Engine task.sources
- forecastDays: 1
- showCompleted: true
- showUndated: true
- groupBySource: true
- hiddenTags: 备忘, SIP插件, sip-plugin, sip_plugin

### 7.2 备忘录

**文件:** `01-经纬矩阵系统/03-备忘提醒模块/备忘录.md`
- 格式: `- [x] #备忘 内容 [时间] 📅 日期 ✅ 完成日期`
- 时间格式: 模糊(晚上/上午) 或 精确(HH:mm)

### 7.3 规律性事项列表

**文件:** `01-经纬矩阵系统/04-规律性事项模块/规律性事项列表.md`
- 按类别分组(周复盘/周计划/行测小课堂/行测助手算数特训)
- 格式: `- [x] 名称 🔁 every week 📅 日期 ✅ 完成日期`
- 使用 Tasks 插件的循环语法

### 7.4 智能录入看板

**文件:** `01-经纬矩阵系统/08-智能录入模块/03-智能录入看板.md`
- DataviewJS 加载 `SmartInputKit.js` 核心库
- 路径: `08-科技树系统/01-OB_LifeOS_Build/00-通用模块库/SmartInputKit.js`
- 调用 `window.SmartInputKit.render.main(dv)` 渲染

### 7.5 成就馆

**文件:** `03-成就系统/🏆成就馆.md`
- 按日期分组
- 四个等级: 【传说】/【史诗】/【稀有】/【普通】
- 每条成就: 等级标记 + 名称 + 日期 + 条件描述
- 部分成就有块引用ID(如 `^ewqxht`, `^250925-1`)
- 五色时间分类: 生存/升级/赚钱/愉悦/黑洞

---

## 八、CSS Snippets

### 8.1 achievements.css -- 成就系统游戏化样式

| 等级 | 颜色 | 字重 | 辉光 |
|------|------|------|------|
| 传说(legendary) | #ff9900 橙色 | 700 | 3px rgba(255,153,0,0.5) |
| 史诗(epic) | #a335ee 紫色 | 600 | 2px rgba(163,53,238,0.5) |
| 稀有(rare) | #0070dd 蓝色 | 600 | 2px rgba(0,112,221,0.5) |
| 普通(common) | #28a745 绿色 | 600 | 2px rgba(40,167,69,0.35) |

**时间日志标签样式(药丸):**
| 分类 | 背景色 | 文字色 |
|------|--------|--------|
| 升级 | #e85a0c 橙 | 白 |
| 生存 | #806c5e 棕 | 白 |
| 愉悦 | #c084fc 紫 | 白 |
| 赚钱 | #2588eb 蓝 | 白 |
| 黑洞 | #2f2f2f 深灰 | 白 |

### 8.2 folder-colors.css -- 文件夹颜色

- 根目录一级文件夹: 紫色(#AF7AC5)加粗
- 子目录文件夹: 紫色不加粗
- 覆盖9个一级目录 + 98-稿纸 + 99-附件

### 8.3 table.css -- 全局表格样式

- 无边框, 透明背景
- 表头: 紫色(#76448A)加粗
- 字号: 0.88em
- 行间距: 4px

### 8.4 profile-table.css -- 档案卡片表格样式

- 档案卡片容器: 隐藏Dataview默认表头和顶边线
- 左列标签: 紫色(#76448A)加粗, 最小宽度6.5em
- 右列值: 跟随Obsidian属性面板风格
- 标签字体: 0.6em
- 时间轴表格: 同风格, 表头紫色加粗

### 8.5 Tag Fonts.css -- 标签字体缩小

- 标签字号: 0.6em(比正文小)
- 垂直居中对齐
- 紧凑内边距

---

## 九、数据格式规范汇总

### 9.1 Frontmatter 字段

| 文件类型 | 关键字段 |
|----------|---------|
| 账单 | type, category, subcategory, amount, channel, note, create_date, year, month, quarter, weekday |
| 刷题复盘 | type=刷题复盘, keyword, module, submod, result, date, tags |
| 角色档案 | type=角色档案, name, alias, tags, birthday, first-met, last-contact, location, tel |
| 事件记录 | type=事件记录, summary, attendees(双链), date, tags |
| 装备档案 | type=装备档案, name, buy-date, price, warranty-until, manual-link, tags |
| 学习计划 | examDate, planEndDate, deltaDays, remainingXingce, remainingShenlun, progressXingce, progressShenlun |
| 看板Shell | lifeos.kind, lifeos.id |

### 9.2 任务格式

```
- [ ] #标签1 #标签2 任务描述 📅 YYYY-MM-DD
- [x] #标签 任务描述 📅 YYYY-MM-DD ✅ YYYY-MM-DD
- [ ] 任务描述 [HH:mm] 📅 YYYY-MM-DD
- [ ] 任务描述 🔁 every week 📅 YYYY-MM-DD
- [-] 任务描述 ❌ YYYY-MM-DD (取消)
```

**进度单元:** 子任务使用 `- [x] 进度单元 ✅ 日期`

### 9.3 文件命名约定

| 类型 | 命名格式 |
|------|---------|
| 日复盘 | `足迹YY-MM-DD.md` |
| 周计划 | `周度委托列表YYYYWww.md` |
| 周复盘 | `周航行报告YYWww.md` |
| 事件记录 | `YY-MM-DD事件记录.md` (同名加序号) |
| 账单 | (由SIP自动生成, 存入06-财务系统/01-账单数据) |

### 9.4 目录结构

```
SymbiNexus/
  01-经纬矩阵系统/
    01-看板模块/          -- 今日聚焦/本周聚焦/七日前瞻/月度前瞻
    02-周委托模块/        -- 周度委托列表文件
    03-备忘提醒模块/      -- 备忘录.md
    04-规律性事项模块/    -- 规律性事项列表.md
    08-智能录入模块/      -- INBOX.md, Require.md, 智能录入看板.md, 智能录入日志.md
    99-任务归档/          -- 99-周委托归档
  02-复盘系统/
    01-日复盘/            -- 足迹YY-MM-DD.md
  03-成就系统/            -- 🏆成就馆.md
  04-模板系统/
    00-核心模块/          -- 枢轴偏移.dvjs.md, 枢轴偏移.tpl.md
    01-复盘模板/          -- 日复盘, 行测复盘, 周复盘, 知识点
    02-计划模板/          -- 周计划
    03-生活坐标模板/      -- 角色档案(含子版块), 事件记录, 装备档案
    09-专用模板/          -- 记账模板, 宠物驱虫计划
  05-生活坐标系统/
    01-角色档案/          -- 月饼家族(宠物)
    02-事件记录/
    04-美食档案/          -- 美食收藏.md
    05-消费决策/          -- 价格追踪数据
  06-财务系统/
    01-账单数据/          -- SIP自动生成的账单文件
    02-统计分析/          -- 财务看板
  07-项目系统/
    01-公务员考试/        -- 行测/申论学习资料, 学习计划
  08-科技树系统/
    01-OB_LifeOS_Build/
      00-通用模块库/      -- SmartInputKit.js, TaskReorderModule.js, orb-scripts/
      03-密钥/            -- API Key文件
      99-文档/            -- 配置页面
```

---

## 十、功能-Flutter对照映射建议

| Obsidian功能 | Flutter实现要点 |
|-------------|----------------|
| SIP三阶段AI管线 | 需实现: 分类API调用 -> 优化API调用(可选) -> 提取API调用, 支持多供应商切换 |
| 11个分类模块 | 每个模块需要: 分类prompt + 提取prompt + 落盘路径 + 模板路径 |
| 枢轴偏移(3AM逻辑) | 核心时间计算逻辑, 影响所有日期相关功能 |
| LifeOS代码块渲染 | 需要自定义渲染引擎, 替代Obsidian的registerMarkdownCodeBlockProcessor |
| 任务看板(4种时间维度) | 今日/本周/七日/月度, 需要任务聚合+过滤+排序 |
| 财务看板(ECharts) | 需要图表库(如fl_chart), 支持饼图/热力图/趋势/TopN |
| View Controller自动切换 | 根据文件路径自动切换编辑/阅读模式 |
| Command Orb浮动按钮 | 可拖拽FAB + 快捷命令栏 |
| 任务重排 | 按标题分组排序逻辑(已完成在前,未完成在后) |
| 成就系统(4级+视觉) | 传说/史诗/稀有/普通 + 颜色/辉光CSS映射 |
| 五色时间分类 | 生存/升级/赚钱/愉悦/黑洞 + 药丸标签样式 |
| Dynbedded嵌入 | 模板子版块嵌入机制(档案卡/时间轴/周期待办) |
| DataviewJS动态渲染 | 需要替代方案: 本地数据查询+渲染引擎 |
| Colored Tags | 标签着色系统, 基于调色板自动分配 |
| Regex Mark | 正则匹配+CSS类注入的视觉标记 |
| 周委托自动归档 | 周切换时自动迁移未完成任务 |
| 学习计划排布 | 时段调度算法(上午行测/下午混合/晚上申论) + 预测 |
