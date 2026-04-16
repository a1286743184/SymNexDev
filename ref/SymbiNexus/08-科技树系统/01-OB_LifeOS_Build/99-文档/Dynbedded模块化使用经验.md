## Dynbedded 模块化使用经验（重构版）

目标与范围：整合今天上午关于 Dynbedded 的全部实践，形成一份可落地的“模块/子版块开发与调用指南”。本指南覆盖：目录与命名约定、模块职责划分、标准引用方式、现有模块清单与示例、最佳实践与排错、迁移指引与验收清单。

一、核心原则与角色分工
- 单一职责与最小副作用：
  - DataviewJS 模块（.dvjs.md）：只向 window 命名空间输出函数，不进行任何渲染、不写 frontmatter。
  - Templater 模块（.tpl.md）：只提供可调用函数与一次性写入逻辑，不输出正文文本。
  - 入口模板与子版块（.md）：通过 Dynbedded 进行视图渲染，内部可调用已注册的 DVJS/TPL 函数。
- 路径稳定、可复用：所有引用统一用相对 Vault 路径；重构时更新模块路径即可，引用者尽量不改。
- 防卡死原则：严禁在 DataviewJS 代码块内写 frontmatter；任何写入均由 Templater 执行。

二、目录结构与命名约定（已实施版本）
- 04-模板系统/
  - 00-核心模块/
    - 枢轴偏移.dvjs.md（DVJS 函数导出）
    - 枢轴偏移.tpl.md（Templater 函数）
    - 枢轴偏移.readme.md（说明）
  - 01-复盘模板/
    - 日复盘.md
    - 周复盘.md
  - 20_计划模板/
    - 周计划.md
  - 03-生活坐标模板/
    - 角色档案/
      - 角色档案.md（入口）
      - 子版块-档案卡.md
      - 子版块-时间轴.md
      - 子版块-周期待办.md
    - 事件记录/
      - 事件记录.md（入口）
      - 子版块-与会者.md
    - 装备档案.md
  - 09-专用模板/
    - 宠物驱虫计划.md

命名建议：
- 纯逻辑模块：模块名.dvjs.md（仅导出函数，挂载到 window.ObLife.*）。
- Templater 函数模块：模块名.tpl.md（仅函数，无正文输出）。
- 入口模板：中文功能名.md（如 事件记录.md、日复盘.md）。
- 子版块：入口模板名/子版块-名称.md（如 角色档案/子版块-时间轴.md）。

三、标准引用方式（Dynbedded 与 Templater）
- Dynbedded 引入 DVJS/子版块：
  ```dynbedded
  [[枢轴偏移.dvjs]]
  ```
  ```dynbedded
  [[子版块-档案卡]]
  [[子版块-时间轴]]
  [[子版块-周期待办]]
  ```
- Templater include 调用函数：
  ```tpl
  <%* await tp.file.include("[[04-模板系统/00-核心模块/枢轴偏移.tpl]]");
  const logicalISO = pivotDateISO(3);
  %>
  ```
  说明：.tpl 模块不输出正文，仅提供函数调用；.dvjs 模块通过 Dynbedded 注入到 window。

四、核心模块：枢轴偏移（3 点枢轴）
- DVJS 暴露 API：
  ```dataviewjs
  const { todayISO, completionISO, isLateByPivot } = window.ObLife.pivot3am.bind(3);
  ```
- Templater 提供：pivotDateISO(pivotHour)、pivotDayRange(pivotHour)
- 看板页示例（均已更新引用路径）：
  - 01_经纬矩阵系统/0101_看板模块/010101_今日聚焦.md
  - 01_经纬矩阵系统/0101_看板模块/010102_本周聚焦.md
  - 01_经纬矩阵系统/0101_看板模块/010103_七日前瞻.md
  - 01_经纬矩阵系统/0101_看板模块/010104_月度前瞻.md
  以上页面通过 Dynbedded 引入枢轴偏移.dvjs，并在 DataviewJS 中使用 window.ObLife.pivot3am。

五、现有模块与调用示例
- 角色档案（入口）：
  文件：[[角色档案]]
  内含 Dynbedded 引用：
  ```dynbedded
  [[子版块-档案卡]]
  [[子版块-时间轴]]
  [[子版块-周期待办]]
  ```
  要点：
  - 档案卡：遍历 frontmatter，日期格式化为 yyyy-LL-dd，标签渲染为 #tag，必要时手工创建 a.internal-link；类名 dvjs-profile-table。
  - 周期待办：host.file.tasks 过滤未完成，按到期日排序；用 dv.taskList(tasks, false) 渲染。
  - 时间轴：汇总事件记录与日复盘，按 file.outlinks/attendees 是否关联当前角色；内部链接用 a.internal-link；类名 dvjs-profile-timeline-table。

- 事件记录（入口）：
  文件：[[事件记录]]
  内含 Dynbedded 与 Templater：
  ```dynbedded
  [[枢轴偏移.dvjs]]
  ```
  ```tpl
  <%* await tp.file.include("[[04-模板系统/03-生活坐标模板/事件记录/子版块-与会者]]") %>
  ```
  要点：所有 frontmatter 写入均由 Templater 完成，避免在 DataviewJS 中写入。

- 复盘与计划：
  - 日复盘：[[日复盘]]
  - 周复盘：[[周复盘]]
  - 周计划：[[周计划]]

六、开发新模块/子版块指南（模板骨架）
- DVJS 模块骨架（仅函数输出）：
  ```dataviewjs
  if (!window.ObLife) window.ObLife = {};
  window.ObLife.example = {
    hello(name){ return `Hello, ${name}`; },
  };
  ```
- Templater 模块骨架（仅函数）：
  ```tpl
  <%*
  function normalizeISO(date){ return window.moment(date).format("YYYY-MM-DD"); }
  module.exports = { normalizeISO };
  %>
  ```
- 子版块渲染骨架（Dynbedded）：
  ```dataviewjs
  const el = dv.el("div", "");
  // 渲染你的表格/列表；避免写入 frontmatter；需要内部链接时使用 a.internal-link。
  ```

七、最佳实践与常见坑
- 内部链接渲染：不要直接使用 dv.fileLink 的字符串返回；改为创建 a.internal-link 并设置 href/data-href 与文本。
- Link.path replaceAll 报错：传递字符串路径（如 r.page.file.path），避免传 Link 对象。
- 索引刷新：变更未生效时执行 Dataview: Rebuild index 或切页再回来。
- 统一渲染：同一页面避免混用原生 Dataview 与 Dynbedded 实现同一模块。
- 样式：使用 snippets 中的表格样式（如 dvjs-profile-table、dvjs-profile-timeline-table），保持无边框与统一配色。

八、迁移与维护（从旧结构到新结构）
- 角色档案相关文件从 04-模板系统/角色档案-*.md 迁移为：
  - 04-模板系统/03-生活坐标模板/角色档案/子版块-档案卡.md
  - 04-模板系统/03-生活坐标模板/角色档案/子版块-时间轴.md
  - 04-模板系统/03-生活坐标模板/角色档案/子版块-周期待办.md
- 事件记录-与会者 重命名为：04-模板系统/03-生活坐标模板/事件记录/子版块-与会者.md
- 枢轴逻辑模块重命名与拆分为：
  - 04-模板系统/00-核心模块/枢轴偏移.dvjs.md
  - 04-模板系统/00-核心模块/枢轴偏移.tpl.md
- 完成迁移后，更新所有 Dynbedded/Templater 引用路径并回归测试。

九、验收清单（面向现有页面）
- 看板四页（今日/本周/七日/月度前瞻）均能正常渲染，枢轴日期逻辑正确。
- 事件记录入口模板可正常创建并弹出“属性视图”；如未弹出，检查核心插件启用与命令存在，然后重试。
- 角色档案入口渲染三大子版块，内部链接悬浮预览与跳转均正常。
- 执行一次 Dataview: Rebuild index；确认无卡死与无限渲染循环。

十、故障排查速查表
- 未渲染或报错：确认 Dynbedded/Dataview/Templater 插件均启用；看控制台是否有 ReferenceError。
- 路径失效：逐一核对相对 Vault 路径是否与新结构一致；路径中空格与中文均需完整匹配。
- 页面卡死：是否在 DataviewJS 中写 frontmatter；如是，移除写入并改由 Templater 执行。

十一、附录：常用片段
- 枢轴 DVJS 引入：
  ```dynbedded
  [[枢轴偏移.dvjs]]
  ```
- 枢轴 TPL 调用：
  ```tpl
  <%* await tp.file.include("[[04-模板系统/00-核心模块/枢轴偏移.tpl]]"); const iso = pivotDateISO(3); %>
  ```
- 角色档案子版块引入：
  ```dynbedded
  [[子版块-档案卡]]
  [[子版块-时间轴]]
  [[子版块-周期待办]]
  ```

版本备注：本重构版已与 04-模板系统 最新目录结构与路径命名完全同步，可直接作为后续模块开发与使用的统一指引。