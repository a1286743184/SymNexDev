# JSON 转 Markdown 任务转换方案

## 一、数据结构分析

### 1. 输入数据源

| 文件 | 用途 |
|------|------|
| `units.json` | 课程单元元数据，定义视频与内化/背诵任务的对应关系 |
| `daily_tasks_adjusted.json` | 每日任务计划，包含具体的任务列表和时间安排 |
| `my_progress.json` | 用户进度追踪，记录已完成任务 |

### 2. 课程结构层次

```
视频课程 (Video)
    │
    └──► 单元 (Unit) - 一个视频对应多个单元
              │
              ├──► 内化任务 (Internalization) - 每个单元多个
              │
              ├──► 背诵任务 (Memory) - 每个单元多个
              │
              └──► 复习任务 (Review) - 基于艾宾浩斯曲线生成
```

### 3. 任务类型定义

| 类型 | JSON字段 | 标签 | 内容来源 |
|------|----------|------|----------|
| 视频 | `video_tasks[]` | `#面试-视频` | `title` 字段 |
| 内化 | `internalization_tasks[]` | `#面试-内化` | `title` 字段（例题名） |
| 背诵 | `memory_tasks[]` | `#面试-背诵` | `title` 字段（例题名） |
| 复习 | `review_tasks[]` | `#面试-复习` | `title` 字段（例题名） |

## 二、转换规则

### 1. 任务行格式

```
- [ ] #面试-{类型} {任务内容} ({时长}) 📅 {日期}
```

### 2. 时长格式化

- 小于60分钟: `(25m)`
- 大于等于60分钟: `(1h30m)`

### 3. 日期处理

- 从 `daily_plan[].date` 获取
- 格式: `YYYY-MM-DD`

### 4. 完成状态

- 从 `my_progress.json` 的 `completed_tasks` 查询
- 已完成: `- [x] ... ✅ {完成日期}`

## 三、输出结构

```markdown
# 面试学习计划

> 自动生成于: {生成时间}
> 学习周期: {开始日期} - {结束日期}

## {日期} (Day {序号})

### 视频任务
- [ ] #面试-视频 {视频名} ({时长}) 📅 {日期}

### 内化任务
- [ ] #面试-内化 {例题名} ({时长}) 📅 {日期}

### 背诵任务
- [ ] #面试-背诵 {例题名} ({时长}) 📅 {日期}

### 复习任务
- [ ] #面试-复习 {例题名} ({时长}) 📅 {日期}
```

## 四、预期转换结果示例

### 输入 (daily_tasks_adjusted.json 片段)

```json
{
  "day": 1,
  "date": "2026-03-25",
  "video_tasks": [
    {
      "video_id": "UP001",
      "title": "情景模拟讲解",
      "duration_minutes": 67.8
    }
  ],
  "internalization_tasks": [
    {
      "task_id": "IN-L01-Q001",
      "title": "与不满的同事沟通",
      "estimated_minutes": 25
    },
    {
      "task_id": "IN-L01-Q002",
      "title": "劝群众严防电诈",
      "estimated_minutes": 25
    }
  ],
  "memory_tasks": [
    {
      "question_id": "L01-Q001",
      "title": "与不满的同事沟通",
      "estimated_minutes": 12
    }
  ]
}
```

### 输出 (Markdown)

```markdown
## 2026-03-25 (Day 1)

### 视频任务
- [ ] #面试-视频 情景模拟讲解 (1h8m) 📅 2026-03-25

### 内化任务
- [ ] #面试-内化 与不满的同事沟通 (25m) 📅 2026-03-25
- [ ] #面试-内化 劝群众严防电诈 (25m) 📅 2026-03-25

### 背诵任务
- [ ] #面试-背诵 与不满的同事沟通 (12m) 📅 2026-03-25
```

## 五、技术实现

### 脚本: `converter.py`

- 语言: Python 3
- 依赖: 仅标准库
- 输入: 当前目录下的 JSON 文件
- 输出: `面试学习计划.md`

### 运行方式

```bash
cd "d:\Docements\Obsidian Vault\SymbiNexus\学习计划数据"
python converter.py
```

## 六、使用说明

### 运行转换

```bash
cd "d:\Docements\Obsidian Vault\SymbiNexus\学习计划数据"

# 生成完整计划
python converter.py

# 生成测试输出（前3天）
python converter.py --test

# 指定输出文件名
python converter.py --output "我的学习计划.md"
```

### 输出文件

| 文件 | 说明 |
|------|------|
| `面试学习计划.md` | 完整的26天学习计划 |
| `test_output.md` | 测试输出（前3天） |

### 与任务系统集成

生成的 Markdown 文件需要被添加到 `task-dashboard-kit.js` 的 `TASK_SOURCES.extraFiles` 中:

```javascript
extraFiles: [
    // ... 其他文件
    "学习计划数据/面试学习计划.md"
]
```

或者在 `公考学习计划.md` 中通过 `![[]]` 引用。

## 七、生成结果示例

```markdown
## 2026-03-25 (Day 1)

### 视频任务
- [ ] #面试-视频 情景模拟讲解 (1h8m) 📅 2026-03-25
- [ ] #面试-视频 人际关系讲解 (50m) 📅 2026-03-25

### 内化任务
- [ ] #面试-内化 与不满的同事沟通 (25m) 📅 2026-03-25
- [ ] #面试-内化 劝群众严防电诈 (25m) 📅 2026-03-25

### 背诵任务
- [ ] #面试-背诵 与不满的同事沟通 (12m) 📅 2026-03-25

### 复习任务
- [ ] #面试-复习 复习：与不满的同事沟通 (7m) 📅 2026-03-26
```

## 八、文件清单

| 文件 | 用途 |
|------|------|
| `converter.py` | 转换脚本 |
| `CONVERSION_PLAN.md` | 本方案文档 |
| `daily_tasks_adjusted.json` | 每日任务数据源 |
| `my_progress.json` | 进度追踪数据 |
| `units.json` | 课程单元元数据 |
| `面试学习计划.md` | 生成的 Markdown 任务文件 |
