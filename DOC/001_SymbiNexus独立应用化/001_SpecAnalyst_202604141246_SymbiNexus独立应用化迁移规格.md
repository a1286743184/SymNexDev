# SymbiNexus 独立应用化 -- 迁移可行性规格文档

> Spec Analyst | 2026-04-14 | SESSION_REPORT_DIR::d:\Docements\Obsidian Vault\agent tasks\001_SymbiNexus独立应用化

---

## 1. 需求概述

将当前运行于 Obsidian 生态中的个人生活管理系统 SymbiNexus（含 Smart Input Pro 智能录入、LifeOS Engine 看板引擎、Command Orb 快捷操作等核心自研插件，以及 2000+ Markdown 数据文件）迁移为独立应用，以突破 Obsidian 的平台限制（无通知、无小组件、冷启动慢、搜索/索引性能瓶颈），同时保持与 Syncthing 的文件同步兼容性。

---

## 2. 功能迁移完整性检查

### 2.1 Smart Input Pro -- 11 个 AI 分类模块

| 模块 | 当前实现 | 迁移方式 | 迁移类型 | 备注 |
|------|---------|---------|---------|------|
| bill (账务收支) | AI分类 -> 提取JSON -> Templater模板 -> 新建md文件到 `06-财务系统/01-账单数据/{year}/{month}/` | 保留AI管道，输出改为SQLite/本地DB + Markdown双写 | 需重新设计 | 当前每笔账单一个md文件（200+文件/月），独立应用应改为DB存储，可选双写md |
| task (任务事项) | AI分类 -> 提取标题/上下文/日期 -> 写入经纬矩阵系统 | 保留AI管道，任务数据存DB，UI原生渲染 | 需重新设计 | 可增加通知、小组件、日历视图 |
| memo (快捷备忘) | AI分类 -> 提取内容/日期 -> 写入备忘录.md | 保留AI管道，备忘数据存DB，支持系统通知 | 需重新设计 | 可增加定时提醒通知 |
| contact (联系信息) | AI分类 -> 提取姓名/电话/关系 -> 写入角色档案 | 保留AI管道，联系人数据存DB，可导出vCard | 可增强 | 可与系统通讯录联动 |
| question_entry (题目录入) | AI分类 -> 提取板块/题目标志 -> 写入刷题复盘 | 保留AI管道，题目数据存DB，支持刷题统计 | 可直接迁移 | 可增加错题本、间隔复习 |
| code_dev (代码开发) | AI分类 -> 提取标题/上下文 -> 写入Require.md | 保留AI管道，开发需求存DB | 可直接迁移 | 可增加Git集成 |
| food_wishlist (美食收藏) | AI分类 -> 提取店名/状态/菜系 -> 追加到美食收藏.md | 保留AI管道，数据存DB，支持地图展示 | 可增强 | 可增加地图标注、评分 |
| price_tracker (价格追踪) | AI分类 -> 提取商品/价格/规格 -> 写入消费决策目录 | 保留AI管道，价格数据存DB，支持趋势图 | 可增强 | 可增加价格趋势图表、降价提醒 |
| study_record (刷题记录) | AI分类 -> 提取考试/板块/用时/正确率 -> 写入刷题记录 | 保留AI管道，刷题数据存DB，支持统计图表 | 可增强 | 可增加正确率趋势、薄弱板块分析 |
| pet_growth (崽子成长) | AI分类 -> 提取名字/体重/日志 -> 写入月饼家族档案 | 保留AI管道，成长数据存DB，支持体重曲线 | 可增强 | 可增加体重曲线图、疫苗提醒通知 |
| other (杂项记录) | AI分类 -> 写入INBOX.md | 保留AI管道，杂项存DB | 可直接迁移 | 可增加标签系统 |

**AI管道迁移核心结论**：
- 三阶段管道（分类 -> 语义优化 -> 结构化提取）的提示词逻辑完全可复用
- 8个LLM供应商（智谱/稀宇/千问/小米/谷歌/豆包/阿里/美团）的API调用逻辑可复用
- 当前主策略：LongCat-Flash-Chat，快速输入策略：各供应商flash模型
- 需将 `prompts/defaults.js` 和 `prompts/user.js` 中的提示词迁移为独立应用的配置

### 2.2 LifeOS Engine 功能

| 功能 | 当前实现 | 迁移方式 | 迁移类型 | 备注 |
|------|---------|---------|---------|------|
| 任务控制台 | DVJS渲染 + task-dashboard-kit.js | 原生UI + SQLite查询 | 需重新设计 | 7个数据源（角色档案/周计划/规律事项/备忘/INBOX/开发需求/公考计划）需统一索引 |
| 今日聚焦 | lifeos-task codeblock + kit.js渲染 | 原生首页Widget | 需重新设计 | 可增加Android桌面小组件 |
| 财务看板 | echarts.min.js + finance-viz-kit.js | 原生图表库（MPAndroidChart/FL Chart） | 需重新设计 | 月/年/自定义范围视图，卡片+饼图+热力图+趋势图+TopN+表格 |
| 财务控制台 | lifeos-finance codeblock | 原生UI | 需重新设计 | 配置页面需可视化重构 |
| 周委托系统 | 自动生成周度委托列表 + 归档 | 原生UI + DB | 需重新设计 | 可增加周报推送通知 |
| 任务索引 | task.index.json 缓存 | SQLite FTS5全文索引 | 可增强 | 性能大幅提升 |
| 财务索引 | 财务看板.index.json 缓存 | SQLite聚合查询 | 可增强 | 毫秒级响应 |

**LifeOS Engine配置迁移**：
- `task.config.json`：9个数据源配置、UI偏好、周委托参数 -> 迁移为应用设置
- `finance.config.json`：账单schema、渠道标准化、分类映射、视图配置 -> 迁移为应用设置
- `assets.config.json`：装备档案归档路径 -> 迁移为应用设置

### 2.3 其他插件功能

| 插件 | 当前功能 | 迁移方式 | 迁移类型 | 备注 |
|------|---------|---------|---------|------|
| Command Orb | 浮动按钮 + 6个快捷命令 | 底部导航栏 / FAB + 快捷操作 | 需重新设计 | 原生FAB更流畅 |
| View Controller | 5条路径视图模式规则 | 原生路由 + 视图状态管理 | 需重新设计 | 更灵活的路由系统 |
| Homepage | 启动打开"今日聚焦" | 原生首页默认页 | 可直接迁移 | - |
| Dataview | DVJS查询渲染看板 | SQLite + 原生渲染 | 需重新设计 | 性能大幅提升 |
| Templater | 模板系统 | 原生模板引擎 | 需重新设计 | 简化为结构化数据录入 |
| obsidian-tasks-plugin | 任务checkbox语法解析 | 原生任务模型 | 需重新设计 | 不再需要markdown checkbox |
| colored-tags | 标签颜色 | 原生标签系统 | 可直接迁移 | - |
| regex-mark | 正则高亮 | 原生文本渲染 | 可直接迁移 | - |
| image-converter | 图片格式转换 | 原生图片处理 | 可直接迁移 | - |
| attachment-management | 附件管理 | 原生文件管理 | 可直接迁移 | - |
| obsidian-icon-folder | 文件夹图标 | 原生UI | 可直接迁移 | - |
| obsidian-dynbedded | 嵌入内容渲染 | 原生组件 | 需重新设计 | - |
| Smart Env | 本地嵌入模型(bge-micro-v2) | 可选集成 | 可延后 | 语义搜索功能 |

---

## 3. 数据迁移方案

### 3.1 当前数据规模

| 数据类型 | 数量 | 存储格式 |
|---------|------|---------|
| 账单文件 | ~200+ (仅2026年1-2月已70+) | 每笔一个md，frontmatter + 正文 |
| 角色档案 | 10+ | 单文件md，frontmatter + dataviewjs |
| 消费决策 | 20+ | 单文件md，dataviewjs + inline字段 |
| 周委托 | 10+ | 单文件md，checkbox列表 |
| 日复盘 | 10+ | 单文件md |
| 周复盘 | 5+ | 单文件md |
| 备忘录 | 1文件 | checkbox列表 |
| 规律事项 | 1文件 | checkbox + repeating |
| INBOX | 1文件 | 混合内容 |
| 模板 | 10+ | md模板文件 |
| 附件 | 100+ | webp/jpg/pdf/heic |

### 3.2 Markdown格式保留策略

**核心原则：双轨制 -- DB为主，Markdown为辅**

```yaml
data_strategy:
  primary_storage: "SQLite (结构化数据)"
  secondary_storage: "Markdown (人类可读备份)"
  sync_layer: "Syncthing (文件级同步)"
```

**方案A：Markdown优先（推荐用于MVP）**
- 保持Markdown文件格式不变，应用直接读写md文件
- frontmatter解析为结构化数据
- 优点：Syncthing零改动兼容，Obsidian可降级回退
- 缺点：查询性能受限，复杂统计需全量扫描

**方案B：DB优先（推荐用于正式版）**
- 数据主存SQLite，md文件作为可读视图
- 写入时双写（DB + md），读取从DB
- 优点：查询性能极优，支持FTS全文搜索
- 缺点：需维护双写一致性，迁移复杂度高

**方案C：渐进式（推荐路线）**
- MVP阶段采用方案A（Markdown优先），验证核心功能
- 正式版迁移到方案B（DB优先），md文件降级为导出格式
- 保留md文件同步能力，确保Syncthing兼容

### 3.3 目录结构保留策略

当前目录结构：
```
01-经纬矩阵系统/  (任务/备忘/周委托/规律事项/智能录入)
02-复盘系统/       (日复盘/周复盘)
03-成就系统/
04-模板系统/
05-生活坐标系统/   (角色档案/美食档案/消费决策/生活经验)
06-财务系统/       (账单数据/统计分析)
07-项目系统/       (公务员考试)
99-附件/
```

**保留策略**：
- 独立应用内部使用虚拟路径映射，不依赖物理目录结构
- 导出/同步时按原目录结构生成md文件
- 应用内导航使用功能模块分类，与原目录一一对应

### 3.4 元数据(frontmatter)处理

当前frontmatter格式（以账单为例）：
```yaml
type: 支出
category: 餐饮消费
subcategory: 堂食
amount: 5.50
channel: 微信支付
note: 董长亮
create_date: 2026-02-28T23:02:26.127Z
year: 2026
month: 02
quarter: Q1
weekday: 星期一
```

**处理方案**：
- 解析frontmatter为DB字段
- 保留原始frontmatter文本用于md导出
- 新增字段（如id、sync_status）存储在DB中，不写入md

### 3.5 Dataview查询迁移

当前Dataview使用场景：
1. **价格追踪看板**：`dv.view("price_dashboard")` -- 自定义DVJS视图
2. **宠物成长面板**：`PuppyProfileKit.js` -- 自定义DVJS视图
3. **财务看板**：`finance-viz-kit.js` + echarts
4. **任务看板**：`task-dashboard-kit.js`
5. **inline字段查询**：`[weight:: 9350]`、`[price:: 27.50]` 等

**迁移方案**：
- DVJS视图 -> 原生UI组件（最大工作量）
- inline字段 -> DB字段映射
- Dataview查询语法 -> SQL查询
- echarts图表 -> 原生图表库

---

## 4. 功能增强机会

### 4.1 Android通知能力

| 增强功能 | 当前状态 | 独立应用实现 |
|---------|---------|-------------|
| 任务到期提醒 | 无（需手动打开Obsidian查看） | 系统通知，支持提前N分钟/小时/天提醒 |
| 备忘定时提醒 | 无 | 精确到分钟的定时通知 |
| 规律事项提醒 | 无 | 周期性通知（每天/每周/每月） |
| 宠物驱虫/疫苗提醒 | 无 | 周期性通知 + 日历集成 |
| 账单预算超支 | 无 | 月度预算超支实时通知 |
| 价格降价提醒 | 无 | 商品价格追踪 + 降价通知 |

### 4.2 Android小组件(Widget)

| Widget类型 | 内容 | 尺寸 |
|-----------|------|------|
| 今日聚焦 | 今日待办任务列表 | 4x2 |
| 快速录入 | 一键语音/文字录入按钮 | 1x1 / 2x1 |
| 月度财务概览 | 收支卡片 + 饼图 | 4x2 |
| 宠物体重 | 最新体重 + 趋势迷你图 | 2x2 |
| 备忘速记 | 最新备忘 + 快速添加 | 4x1 |

### 4.3 性能优化

| 指标 | Obsidian当前 | 独立应用预期 | 提升倍数 |
|------|-------------|-------------|---------|
| 冷启动 | 3-8秒 | <1秒 | 3-8x |
| 账单索引 | 全量扫描md文件 | SQLite索引查询 | 50-100x |
| 搜索速度 | Dataview全量扫描 | FTS5全文搜索 | 10-50x |
| 财务看板渲染 | echarts JS渲染 | 原生图表渲染 | 2-5x |
| AI录入响应 | 2-5秒（网络依赖） | 2-5秒（不变） | 1x |

### 4.4 Obsidian无法实现的新能力

1. **语音录入原生集成**：直接调用系统语音识别，无需Obsidian中间层
2. **相机扫描**：拍照识别账单/题目，OCR提取
3. **分享菜单集成**：从任意App分享内容到SymbiNexus
4. **后台同步**：应用后台自动Syncthing同步
5. **生物识别锁**：指纹/面容锁定敏感数据（财务/密码）
6. **快捷方式**：Android Shortcuts / iOS Shortcuts集成
7. **日历集成**：系统日历双向同步任务/规律事项
8. **联系人集成**：系统通讯录双向同步角色档案

---

## 5. 风险和挑战

### 5.1 技术风险

| 风险 | 严重度 | 概率 | 缓解措施 |
|------|--------|------|---------|
| Markdown解析兼容性 | 高 | 中 | 使用gray-matter等成熟库，逐文件验证 |
| Syncthing同步冲突 | 高 | 高 | 文件级锁 + 冲突检测 + 自动合并策略 |
| AI API网络依赖 | 中 | 中 | 离线队列 + 本地小模型降级 |
| 跨平台UI一致性 | 中 | 高 | 使用Flutter/React Native统一框架 |
| frontmatter字段不一致 | 中 | 中 | 迁移脚本 + 字段校验 + 默认值填充 |
| 附件路径引用断裂 | 高 | 中 | 相对路径映射 + 附件索引表 |

### 5.2 数据风险

| 风险 | 严重度 | 概率 | 缓解措施 |
|------|--------|------|---------|
| 迁移过程数据丢失 | 极高 | 低 | 全量备份 + 逐条校验 + 回滚机制 |
| 双写不一致 | 高 | 中 | 事务保证 + 定期一致性检查 |
| 历史数据格式不统一 | 中 | 高 | 数据清洗脚本 + 容错解析 |

### 5.3 开发工作量评估

| 模块 | 预估工时(人天) | 复杂度 |
|------|---------------|--------|
| AI管道迁移（分类+提取+API调用） | 15-20 | 高 |
| 账务收支模块（录入+看板+统计） | 20-30 | 高 |
| 任务管理系统（录入+看板+通知） | 15-20 | 高 |
| 备忘提醒系统（录入+通知+小组件） | 10-15 | 中 |
| 角色档案系统（CRUD+图片+时间轴） | 10-15 | 中 |
| 价格追踪系统（录入+比价+趋势） | 10-15 | 中 |
| 宠物成长系统（体重+日志+曲线） | 8-10 | 中 |
| 美食收藏系统（CRUD+地图） | 5-8 | 低 |
| 刷题记录系统（录入+统计） | 8-10 | 中 |
| 题目录入系统（OCR+格式化） | 10-15 | 高 |
| 数据迁移工具（md解析+DB写入+校验） | 10-15 | 高 |
| Syncthing集成 | 5-8 | 中 |
| Android通知+小组件 | 10-15 | 中 |
| 基础框架（路由/状态/主题/设置） | 15-20 | 高 |
| **总计** | **150-210** | - |

---

## 6. 最小可行产品(MVP)定义

### 6.1 MVP核心功能（第一版必须包含）

```yaml
mvp_scope:
  priority_1_must_have:
    - AI智能录入管道（11模块分类 + 语义优化 + 结构化提取）
    - 账务收支（录入 + 月度看板 + 基础统计）
    - 任务管理（录入 + 今日聚焦 + 基础列表）
    - 备忘提醒（录入 + 定时通知）
    - Markdown文件读写（Syncthing兼容）
    - 数据迁移工具（从现有md导入）
  
  priority_2_should_have:
    - 价格追踪（录入 + 比价计算）
    - 宠物成长（体重记录 + 日志）
    - 角色档案（基础CRUD）
    - Android通知（任务到期/备忘提醒）
    - 快速录入Widget（1x1）
  
  priority_3_could_have:
    - 财务看板完整版（热力图/趋势图/TopN）
    - 美食收藏
    - 刷题记录
    - 题目录入
    - 代码开发需求管理
  
  priority_4_wont_have_in_mvp:
    - 日历集成
    - 联系人集成
    - 相机OCR
    - 语义搜索(Smart Env)
    - 桌面小组件(4x2)
    - iOS版本
```

### 6.2 MVP开发优先级排序

| 阶段 | 功能 | 预计工期 | 依赖 |
|------|------|---------|------|
| P0 | 基础框架（Flutter/React Native + 路由 + 主题 + SQLite） | 2周 | 无 |
| P0 | Markdown文件读写层（frontmatter解析 + 文件监控 + Syncthing兼容） | 1周 | 基础框架 |
| P0 | AI管道核心（API调用 + 分类 + 提取 + 提示词管理） | 2周 | 基础框架 |
| P1 | 账务收支模块 | 2周 | AI管道 + 文件读写 |
| P1 | 任务管理模块 | 1.5周 | AI管道 + 文件读写 |
| P1 | 备忘提醒模块 | 1周 | AI管道 + 通知系统 |
| P1 | Android通知系统 | 1周 | 基础框架 |
| P2 | 数据迁移工具 | 1.5周 | 所有P1模块 |
| P2 | 价格追踪模块 | 1周 | AI管道 |
| P2 | 宠物成长模块 | 1周 | AI管道 |
| P2 | 快速录入Widget | 0.5周 | AI管道 + 通知 |

**MVP总工期预估：10-14周（单人开发）**

### 6.3 技术选型建议

| 决策点 | 推荐方案 | 备选方案 | 理由 |
|--------|---------|---------|------|
| 跨平台框架 | Flutter | React Native | 性能优、Widget支持好、单代码库 |
| 本地存储 | SQLite + drift/sqflite | Realm | 成熟稳定、FTS5全文搜索、Syncthing友好 |
| 图表库 | fl_chart | MPAndroidChart | Flutter原生、轻量 |
| Markdown解析 | flutter_markdown + gray_matter | 自研 | 成熟方案、frontmatter支持好 |
| 状态管理 | Riverpod | Bloc | 轻量灵活 |
| AI API调用 | dio + 直接HTTP | - | 支持流式响应 |

---

## 7. 关键用例

### UC-001: 语音快速录入账单

```yaml
actor: 用户
preconditions:
  - 应用已启动，AI管道已配置API密钥
flow:
  1. 用户点击快速录入按钮（或Widget）
  2. 用户语音输入："昨天中午楼下吃了个黄焖鸡，付的现金，三块五"
  3. 系统调用语音识别转文本
  4. 系统调用AI分类管道 -> 分类为 bill
  5. 系统调用AI语义优化 -> "昨天中午楼下吃了个黄焖鸡，付的现金，三块五"
  6. 系统调用AI账单提取 -> 提取结构化数据
  7. 系统创建账单记录（DB + md双写）
  8. 系统显示录入结果卡片，用户确认
postconditions:
  - 账单记录已保存到DB和md文件
  - 财务看板数据已更新
  - Syncthing可同步新增md文件
exceptions:
  - AI API超时: 显示错误，提供离线队列重试
  - 分类错误: 用户可手动修改分类后重新提交
```

### UC-002: 今日聚焦查看

```yaml
actor: 用户
preconditions:
  - 任务数据已从md文件索引到DB
flow:
  1. 用户打开应用，首页显示"今日聚焦"
  2. 系统查询DB：今日到期任务 + 未完成任务 + 近期备忘
  3. 按来源分组显示（角色档案/周计划/规律事项/备忘/INBOX）
  4. 用户可勾选完成任务
  5. 完成状态同步回写md文件
postconditions:
  - 任务完成状态已更新
  - md文件checkbox已标记
exceptions:
  - 数据源md文件被外部修改: 自动重新索引
```

### UC-003: 月度财务看板

```yaml
actor: 用户
preconditions:
  - 账单数据已索引到DB
flow:
  1. 用户进入财务看板
  2. 系统查询DB聚合当月数据
  3. 渲染：总收支卡片 + 分类饼图 + 日支出热力图 + 趋势折线 + TopN + 明细表格
  4. 用户可切换月/年/自定义范围
  5. 用户可点击分类查看明细
postconditions:
  - 无数据变更
exceptions:
  - 数据量过大: 分页加载 + 虚拟滚动
```

---

## 8. Gherkin验收场景

### 场景1: AI账单录入完整流程

```gherkin
Feature: AI智能录入 - 账务收支

  Scenario: 成功录入单笔账单
    Given AI管道已配置LongCat-Flash-Chat模型
    And API密钥有效
    When 用户输入"昨天午饭吃面20微信付的"
    Then 系统分类结果为"bill"
    And 提取的账单数据为:
      | date       | type | category  | subcategory | channel  | amount |
      | 昨天的日期  | 支出  | 餐饮消费   | 堂食         | 微信支付  | 20.00  |
    And 账单记录已保存到SQLite
    And 对应md文件已创建到06-财务系统/01-账单数据/{year}/{month}/目录

  Scenario: AI API调用失败
    Given AI管道已配置模型
    And 网络不可用
    When 用户输入"午饭20"
    Then 系统显示"网络不可用，已加入离线队列"
    And 输入内容已保存到离线队列
    When 网络恢复
    Then 系统自动重试离线队列中的录入
```

### 场景2: 任务到期通知

```gherkin
Feature: 任务通知

  Scenario: 任务到期前提醒
    Given 用户有一条任务"帮媳妇在京东咨询满减" due_date为今天 time_info为"10:00"
    And 通知已启用，提前15分钟提醒
    When 当前时间为09:45
    Then 系统发送通知"10:00 - 帮媳妇在京东咨询满减"
    And 通知点击后打开任务详情页

  Scenario: 用户关闭通知权限
    Given 用户未授予通知权限
    When 用户创建一条带时间的备忘
    Then 系统提示"请开启通知以接收提醒"
    And 备忘仍正常保存，仅无通知
```

### 场景3: Syncthing同步兼容

```gherkin
Feature: Syncthing文件同步

  Scenario: 新增账单文件被Syncthing同步
    Given 应用创建新账单文件 260214-01-餐饮消费-堂食.md
    And 文件frontmatter包含标准字段
    When Syncthing将文件同步到其他设备
    Then 其他设备的Obsidian可正常读取该文件
    And frontmatter字段完整可解析

  Scenario: 外部修改md文件被应用感知
    Given 用户在Obsidian中修改了备忘录.md
    When 应用检测到文件变更
    Then 应用自动重新索引变更的文件
    And DB中的备忘数据已更新
```

---

## 9. 数据模型

### 9.1 核心实体

```yaml
entities:
  Bill:
    attributes:
      - name: id
        type: uuid
        constraints: [primary_key, auto_generate]
      - name: type
        type: string
        constraints: [not_null, enum: [收入, 支出]]
      - name: category
        type: string
        constraints: [not_null]
      - name: subcategory
        type: string
        constraints: [not_null]
      - name: amount
        type: float
        constraints: [not_null]
      - name: channel
        type: string
        constraints: [not_null]
      - name: note
        type: string
      - name: date
        type: date
        constraints: [not_null]
      - name: raw_input
        type: string
      - name: create_date
        type: datetime
        constraints: [auto_generate]
      - name: md_file_path
        type: string
        constraints: [unique]
      - name: sync_status
        type: string
        constraints: [enum: [synced, pending, conflict]]
    indexes:
      - fields: [date]
        purpose: "按日期查询"
      - fields: [category, subcategory]
        purpose: "按分类统计"
      - fields: [channel]
        purpose: "按渠道统计"

  Task:
    attributes:
      - name: id
        type: uuid
        constraints: [primary_key, auto_generate]
      - name: title
        type: string
        constraints: [not_null, max_length:200]
      - name: context
        type: string
      - name: due_date
        type: date
      - name: time_info
        type: string
      - name: status
        type: string
        constraints: [not_null, enum: [pending, completed, cancelled]]
      - name: completed_date
        type: datetime
      - name: source_type
        type: string
        constraints: [enum: [role, weekly, routine, memo, inbox, require, exam_plan]]
      - name: source_path
        type: string
      - name: tags
        type: json
      - name: is_recurring
        type: boolean
      - name: recurring_rule
        type: string
      - name: md_file_path
        type: string
      - name: sync_status
        type: string
    indexes:
      - fields: [due_date, status]
        purpose: "今日聚焦查询"
      - fields: [source_type]
        purpose: "按来源分组"

  Memo:
    attributes:
      - name: id
        type: uuid
        constraints: [primary_key, auto_generate]
      - name: content
        type: string
        constraints: [not_null]
      - name: due_date
        type: date
      - name: time_info
        type: string
      - name: status
        type: string
        constraints: [not_null, enum: [pending, completed]]
      - name: completed_date
        type: datetime
      - name: notification_id
        type: integer
      - name: md_file_path
        type: string
    indexes:
      - fields: [due_date, status]
        purpose: "待办备忘查询"

  PriceRecord:
    attributes:
      - name: id
        type: uuid
        constraints: [primary_key, auto_generate]
      - name: product_name
        type: string
        constraints: [not_null]
      - name: total_price
        type: float
        constraints: [not_null]
      - name: quote_qty
        type: integer
      - name: quote_unit
        type: string
      - name: pack_count
        type: integer
      - name: item_unit
        type: string
      - name: atom_value
        type: float
      - name: atom_unit
        type: string
      - name: location
        type: string
      - name: date
        type: date
      - name: unit_price
        type: float
        constraints: [computed: total_price / quote_qty / pack_count / atom_value]
    indexes:
      - fields: [product_name]
        purpose: "按商品名查询比价"

  PetGrowth:
    attributes:
      - name: id
        type: uuid
        constraints: [primary_key, auto_generate]
      - name: pet_name
        type: string
        constraints: [not_null]
      - name: weight_g
        type: integer
      - name: date
        type: date
      - name: note
        type: string
      - name: md_file_path
        type: string
    indexes:
      - fields: [pet_name, date]
        purpose: "按宠物查体重趋势"

  Contact:
    attributes:
      - name: id
        type: uuid
        constraints: [primary_key, auto_generate]
      - name: name
        type: string
        constraints: [not_null]
      - name: phone
        type: string
      - name: relationship
        type: string
      - name: note
        type: string
      - name: md_file_path
        type: string

  FoodWishlist:
    attributes:
      - name: id
        type: uuid
        constraints: [primary_key, auto_generate]
      - name: shop
        type: string
        constraints: [not_null]
      - name: status
        type: string
        constraints: [enum: [想去, 去过]]
      - name: cuisine
        type: string
      - name: location
        type: string
      - name: dishes
        type: json
      - name: updated_date
        type: date
```

---

## 10. 验证清单

- [x] 每个需求都有明确的迁移方案（直接迁移/重新设计/增强/延后）
- [x] AI管道的三阶段提示词已完整分析，可复用
- [x] 数据格式兼容性已评估（frontmatter解析、md双写、Syncthing兼容）
- [x] 边界情况已覆盖（AI API失败、同步冲突、通知权限、离线队列）
- [x] 性能指标已量化（冷启动<1秒、索引查询50-100x提升、搜索10-50x提升）
- [x] 安全需求已识别（生物识别锁、API密钥存储）
- [x] 外部系统依赖已识别（8个LLM供应商、Syncthing）
- [x] MVP范围已明确（P0-P4四级优先级）
- [x] 工期预估已给出（MVP 10-14周单人开发）
- [x] 技术选型已有推荐方案（Flutter + SQLite + Riverpod）
