# DataviewJS 看板筛选功能开发经验

目标：在同一看板页内并列放置两个下拉筛选器（标签筛选 与 显示/隐藏子项），并且两者可交叉作用，默认隐藏子项，样式一致。

## 背景与文件位置
- 具体实现：[[02-本周聚焦]]
- 技术栈：Obsidian + DataviewJS。

## 问题现象与根因
- 现象：切到"隐藏子项"仍会显示子任务的嵌套列表。
- 根因：Dataview 的 dv.taskList 会根据任务对象上的 children/subtasks 等字段自动渲染嵌套 UL。即使集合中过滤掉了子任务，只要父任务对象仍保留这些字段，嵌套依然会被渲染。

## 解决方案关键点
1) 并列筛选器的 UI 构建
- 在页头右侧创建两个原生 select，下拉项与样式一致；"标签筛选"用于排除指定 #tag，"子项筛选"用于切换显示/隐藏子项。

2) 数据集合计算（computeBuckets）
- 根据 includeSubtasks 切换基础集合：
  - 显示子项：使用 allTasks（含所有任务）。
  - 隐藏子项：过滤掉 parent 存在的任务，仅保留顶层任务。
- 使用去重键（文件路径 + 行号）保证同一任务不会重复进入集合。

3) 渲染前防御（prepareTasksForView）
- 当隐藏子项时，对每个任务做浅拷贝并清空 children/subtasks/items/taskList 等可能承载子项的字段，彻底阻止 dv.taskList 自动生成嵌套列表。

4) 统一渲染（renderAll）
- 将两个筛选器的值同时传入渲染：
  - 标签筛选：applyTagFilter 对集合做排除。
  - 子项筛选：prepareTasksForView 控制是否保留子列表字段。
- 每个分区使用 dv.taskList(经过 prepareTasksForView 的集合)，从而保证"隐藏子项"模式下不再显示子项。

5) 事件绑定与默认态
- 初始渲染使用 subtaskSelect = "hide"（默认隐藏）。
- 两个下拉框都绑定 change 事件，任意一个变更都会触发整页重绘，交叉作用。

## 验证清单
- 在命令面板执行 Dataview: Rebuild index 并重新打开页面。
- 切换"隐藏子项/显示子项"验证嵌套 UL 是否消失/恢复。
- 切换标签筛选（如"排除 #备忘"）确认与子项筛选交叉生效。
- 开发者视图检查任务节点下是否仍存在嵌套 UL：在"隐藏子项"模式下不应出现。

## 兼容性与注意事项
- 不同 Dataview 版本对子项字段命名可能不同，prepareTasksForView 需防御性清理（children、subtasks、items、taskList 等）。
- isSubtask 的判断依赖 Dataview 提供的 parent 字段；如遇到版本差异，可根据实际字段调整。
- 样式统一：两个 select 使用一致的 inline 样式与大小，保持并列视觉与交互一致。

## 可复用模式
- 并列多筛选器的核心模式：
  1) 统一计算集合（computeBuckets），根据模式切换基础任务集。
  2) 在渲染前通过防御函数（prepareTasksForView）清理不需要的结构字段，避免组件的默认行为。
  3) 渲染函数（renderAll）只做"读取筛选值 → 过滤 → 渲染"的纯流程，保持简单稳定。

## 变更记录（摘要）
- 修复：隐藏子项无效 → 在渲染前清理任务对象中的子列表字段，阻止 dv.taskList 嵌套渲染。
- 增强：标签筛选与子项筛选的交叉作用与样式统一。