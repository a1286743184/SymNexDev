## 🔧 ECharts集成实施指南（统一调用与显示格式标准）

本指南汇总了在 Obsidian + DataviewJS 环境中集成 ECharts 的最佳实践，涵盖统一的容器初始化、响应式处理、标题/图例/网格的版式规范、性能与交互建议，以及常见问题的调优方法。目标是在不同图表间实现一致的外观与行为，降低维护成本，便于后续新增图表快速复用。

### 一、前置条件
1. 已启用 Dataview 插件并支持 DataviewJS 执行
2. 本地 ECharts 库位于 `08-科技树系统/01-OB_LifeOS_Build/00-通用模块库/echarts.js`
3. Obsidian 启用 JS 执行（默认开启）

加载本地 ECharts（推荐）：
```javascript
const echartsFile = app.vault.getAbstractFileByPath('08-科技树系统/01-OB_LifeOS_Build/00-通用模块库/echarts.js');
if (echartsFile) {
  app.vault.read(echartsFile).then(content => {
    const script = document.createElement('script');
    script.textContent = content;
    document.head.appendChild(script);
  });
} else {
  console.error('ECharts文件未找到');
}
```

### 二、统一工具库：EChartsKit（最新规范）
为保证一致性，在图表文件顶部注入工具库 `window.EChartsKit`，统一常用操作与显示策略：
- `isMobile()`：判断是否为移动端（含窗口宽度规则）
- `applyDvContainerDefaults(dv)`：设置 Dataview 容器为 100% 宽度、无最大宽度、可见溢出
- `getActualWidth(dvContainer)` / `computeActualWidth(dvContainer)`：根据设备与父容器宽度计算实际像素宽度（上限 1200px），用于图表宽度控制
- `initContainer(dv, heightMobile=300, heightDesktop=400, marginDesktop='20px auto', marginMobile='20px 30px 20px 20px')`：创建图表容器并居中/紧凑布局
- `addPassiveResize(dv, container, updateHeightFn)`：统一窗口 resize 监听为 passive:true，并按设备更新容器宽高
- `insertExplanation(dv, text, { marginBottomPx })`：在图表容器之前插入一段“说明”文本，形成“说明 → 图例 → 纵轴名 → 图”的竖向顺序（推荐：`marginBottomPx=8`）
- `title(text, subtext='', top=20)`：生成居中标题与副标题（含行高与间距）
- `legend(top=38, left='center', itemGap=12)`：生成统一风格的图例（圆形图标，默认 `type:'scroll'`），`top` 强制采用像素值，便于与网格竖向顺序计算
- `grid(opts)`：默认采用像素化网格并启用 `containLabel:true`，左侧做“最小化压缩”（移动端≈8px，桌面端≈max(12px, 视口2%)），右侧采用“标准值”（移动端≈20px，桌面端≈28px）。默认：移动端 `top:56,left:8,right:20,bottom:24`；桌面端 `top:56,left:12,right:28,bottom:24`（可按需覆盖，但库会将更大的 `left` 压到最小值、`right` 压到不超过标准值）
- `legendRowHeight()`：返回 legend 的行高估值，用于计算竖向顺序（移动端≈22，桌面≈24）
- `nameGap()`：返回纵轴名置顶时与轴顶之间的像素间距（移动端10，桌面12）
- `computeGridTop(legendTopPx, extra=12)`：按照“legend 在上 → 纵轴名 → grid.top”的顺序计算网格顶部像素值（推荐 `extra=12`，使“legend↔纵轴名”间隔更舒适）
- `computeGridLeftForYAxis(digitsMax=5)`：当 `grid.containLabel=true` 时，轴标签与名称被包含在 grid 内部，外侧的 `grid.left` 仅作为容器边距，统一返回“极小值”（移动端≈8px，桌面≈max(12px, 视口2%)）。旧参数 `digitsMax` 已不再用于扩大留白。
- `formatShortNumber(value, digits=1)`：统一将数值格式化为 k/m 缩写（如 12_300 -> 12.3k，1_200_000 -> 1.2m），用于 yAxis/tooltip/visualMap/label 等
- `formatMoney(value, digits=1)`：以货币样式输出，前缀 `¥` + k/m 缩写（如 12_300 -> ¥12.3k）

-使用建议：
- 使用 `getActualWidth()` 获取容器宽度，将图表宽度限制为该值的 95%–98%（推荐 98%），以确保完整显示并尽量减少周边空白；同时将 `grid.left/right` 控制在极小值，让 containLabel 接管轴与标签的自适应空间分配，保证两侧边界齐平
- 所有需要数值展示的场景统一接入 `formatShortNumber()`，避免各图表之间显示风格不一致

#### 2.1 单源工具库与兼容层（重要）
为避免不同页面重复注入 `window.EChartsKit` 导致接口覆盖、函数缺失（如 `getActualWidth is not a function`），采用“单源注入 + polyfill 兼容层”策略：

- 在公共库 `08-科技树系统/01-OB_LifeOS_Build/00-通用模块库/财务可视化工具库.js` 中，通过 `FinanceVizKit.init()` 调用 `initEChartsKit()` 注入 `EChartsKit`；
- 该注入会在已有 `window.EChartsKit` 的情况下进行“合并而非覆盖”，并自动补齐 `getActualWidth/computeActualWidth`、`legend/grid/computeGridTop/computeGridLeftForYAxis` 等 API；
- 若在单页内确需自定义 `EChartsKit`，务必遵守：
  - 不要直接 `window.EChartsKit = { ... }` 覆盖；
  - 推荐写法：
```javascript
// 安全合并，不覆盖已有实现
window.EChartsKit = Object.assign(window.EChartsKit || {}, {
  // 仅添加本页特有的工具函数或颜色等，不复写通用方法
});
```
或保持守卫：
```javascript
if (!window.EChartsKit) {
  window.EChartsKit = { /* ...本页实现（尽量避免）... */ };
}
```
优先使用单源工具库，减少在看板之间来回切换后出现接口不一致的风险。

### 三、竖向布局顺序与像素化间距（最新规则）
核心顺序：说明（可选） → 图例（legend） → 纵轴名称（置顶时） → 网格（grid，含坐标系） → 横轴标签 → 交互条（dataZoom / visualMap）。

规范要点：
1) 说明在最上、图例在其下、纵轴名称再下（仅当名称置顶时才占用网格上方空间）
- `legend.top` 使用像素值：移动端约 34–40px，桌面端约 42–52px
- 图例高度估算：移动端 `≈26px`、桌面端 `≈28px`（icon + 文本 + 内边距）
- 纵轴名称置顶：`yAxis.nameLocation = 'end'`；贴近轴顶：`yAxis.nameGap = isMobile ? 10 : 12`
- 计算网格顶部：`grid.top(px) = legend.top + legendHeight + (nameGap + 2) + 8`

说明文本的推荐插入方式：
```javascript
// 放在 initContainer 之前，自动出现在图例上方
window.EChartsKit.insertExplanation(dv, '本图用于说明……（可选）');
```

2) 左右留白（避免浪费）
- 左侧（统一最小化）：移动端推荐 `≈8px`（或 `2%`），桌面端推荐 `≈12px`；由 `containLabel:true` 接管轴标签自适应。
- 右侧（统一标准值）：移动端推荐 `≈20px`，桌面端推荐 `≈28px`；用于保持各图右界位置一致，不与左侧数值相等。

3) 底部留白（避免横轴与交互条重叠）
- 折线/柱状图：`dataZoom.bottom = 16px`（移动端与桌面端一致），`grid.bottom` 预留约 24px，如存在 dataZoom/legend 需提高到 60–70px
- 热力图：`visualMap.bottom = isMobile ? 28 : 30`，`grid.bottom = isMobile ? 86 : 76`

4) 图例间距与文字风格
- `legend.itemGap = 12`，`legend.textStyle.fontSize = 12`
- 绝大多数场景使用 `type:'scroll'`，居中布局（`left:'center'`），数据量大时自动滚动

### 四、全局滚动监听 passive 修复（性能）
为避免滚动时的非被动监听器性能警告，可在图表文件顶部注入：
```javascript
(() => {
  const passiveEvents = new Set(['wheel','mousewheel','DOMMouseScroll']);
  const orig = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options){
    if (passiveEvents.has(type)) {
      if (options === undefined) options = { passive: true };
      else if (typeof options === 'boolean') options = { capture: options, passive: true };
      else options = Object.assign({ passive: true }, options);
    }
    return orig.call(this, type, listener, options);
  };
})();
```
该补丁默认仅影响滚轮相关事件，不改变其他事件的行为。

### 五、标准图表骨架（可复制）
```javascript
// 1) 容器与响应式
window.EChartsKit.applyDvContainerDefaults(dv);
// （可选）插入“说明”文本，遵循：说明 → 图例 → 纵轴名 → 图
window.EChartsKit.insertExplanation(dv, '这里是图表说明文字，简要解释图表目的或读法', { marginBottomPx: 8 });
const container = window.EChartsKit.initContainer(dv, 300, 400);
const isMobile = window.EChartsKit.isMobile();
window.EChartsKit.addPassiveResize(dv, container, m => m ? 300 : 400);

// 2) 初始化图表
const myChart = echarts.init(container, null, { renderer: 'canvas', progressive: 200, progressiveThreshold: 1000 });
container.myChart = myChart;

// 3) 配置（图内不放标题；使用 legendTop + 计算式 grid.top）
const legendTop = isMobile ? 34 : 52; // 强制像素值，便于对齐
const option = {
  // 按新规范：图表内部不再使用标题；如需说明，使用 insertExplanation()
  legend: Object.assign(window.EChartsKit.legend(legendTop, 'center', 12), {
    type: 'scroll', data: ['系列A','系列B']
  }),
  // 纵向顺序：legend（上） → axisName（若置顶） → grid
  // grid.top(px) = computeGridTop(legendTop, extra)
  grid: window.EChartsKit.grid({
    top: window.EChartsKit.computeGridTop(legendTop, isMobile ? 10 : 12),
    left: window.EChartsKit.computeGridLeftForYAxis(3), // 纵轴名置顶时压缩左留白
    bottom: isMobile ? 70 : 60,
    containLabel: true
  }),
  // xAxis/yAxis/series...
};
myChart.setOption(option);
```

### 六、常见问题与调优（最新）
- 图例与纵轴名称“粘连”：请使用像素化顺序计算，确保 `grid.top = legend.top + legendHeight + axisNameTopSpace + 8`
- 左侧空白过多：当纵轴名称置顶时调用 `computeGridLeftForYAxis(..., nameAtTop=true)`，移动端至少压到 `max(8px, 2%)`
- 数字风格不一致：统一调用 `formatShortNumber(value, digits)`，yAxis/tooltip/label/visualMap 全部接入
- 交互条与横轴标签重叠：折线/柱状图设置 `dataZoom.bottom = 16`，热力图设置 `visualMap.bottom = 28/30` 并加大 `grid.bottom`
- 移动端居中更紧凑：容器不对称边距 `marginMobile = '20px 30px 20px 20px'`
- 性能：优先使用 `renderer:'canvas'`，启用 `progressive`；事件监听统一为 passive，减少滚动卡顿

### 七、数据源扩展（多文件示例）
```javascript
const files = [
  "07-项目系统/01-公务员考试/01-行测/01-刷题复盘/06-刷题记录/逻辑填空记录.md",
  "07-项目系统/01-公务员考试/01-行测/01-刷题复盘/06-刷题记录/图形推理记录.md"
];
const allRecords = [];
for (const filePath of files) {
  const file = app.vault.getAbstractFileByPath(filePath);
  if (file) {
    const content = await app.vault.read(file);
    const records = content.split("\n").filter(line => line.includes("【") && line.includes("】"));
    allRecords.push(...records);
  }
}
```

### 八、图表显示效果控制统一化（关键经验，最新）

#### 8.1 数值格式化统一（k/m缩写）与货币样式
所有≥1000的数值统一缩写显示，采用 `window.EChartsKit.formatShortNumber(value, digits=1)`。涉及金额场景统一使用：`window.EChartsKit.formatMoney(value, digits=1)`：
```javascript
yAxis: {
  axisLabel: {
    formatter: value => window.EChartsKit.formatShortNumber(value, 1) // 非金额
  },
  nameLocation: 'end', // 需要时置顶
}
tooltip: {
  formatter: params => `${params.seriesName}: ${window.EChartsKit.formatMoney(params.value, 1)}` // 金额
}
visualMap: {
  formatter: value => window.EChartsKit.formatShortNumber(value, 1)
}
```

#### 8.2 图例与纵轴名称的竖向顺序（强制）
在同一图表中，legend 始终在上，纵轴名称（若置顶）在 legend 下方并位于网格顶部内部。请以像素值控制：
```javascript
const legendTop = isMobile ? 34 : 52;
const approxLegendHeight = isMobile ? 26 : 28;
const nameGapPx = isMobile ? 10 : 12; // 贴近轴顶
const gridTopPx = legendTop + approxLegendHeight + (nameGapPx + 2) + 12; // 按 nameGap 预留空间（推荐）

option.legend = window.EChartsKit.legend(legendTop, 'center', 12);
option.grid = Object.assign(window.EChartsKit.grid({ top: gridTopPx, bottom: isMobile ? 70 : 60 }), { containLabel: true });
```

#### 8.3 左右留白统一（当纵轴名称置顶）
使用 `computeGridLeftForYAxis` 自动压缩左侧外留白（仅为容器边距；标签自适应由 containLabel 接管）；右侧由工具库统一限制为标准值：
```javascript
// 推荐：图表宽度 ≈ 实际容器宽度的 98%
const chartWidth = Math.floor(actualWidth * 0.98);
option.grid.left = window.EChartsKit.computeGridLeftForYAxis(4); // 移动端≈8px，桌面≈12px
// 右侧无需显式设置，库会将更大的 right 自动压到不超过标准值（移动≈20，桌面≈28）
```

#### 8.4 交互条与底部空间（统一）
- 折线/柱状图：`dataZoom.bottom = 16`；如需更多底部空间（例如同时显示 legend 或 x 轴标签较长），同步将 `grid.bottom` 增至 60–70
- 热力图：`visualMap.bottom = 28/30`；同步将 `grid.bottom = 76–86`

#### 8.5 图表标题处理
为保持界面简洁，建议：
1. **移除代码中的标题**：从图表HTML结构中移除`<h2>`标签，避免重复显示
2. **保留文档标题**：在Markdown文档中保留文字版标题，用于文档导航

**示例：**
```html
<!-- 移除前 -->
<div>
  <h2>按日期的Token消耗趋势</h2>
  <div id="chart"></div>
</div>

<!-- 移除后 -->
<div>
  <div id="chart"></div>
</div>
```

#### 8.6 显示控制统一总则与禁用项（重要）
- 单一来源：页面不覆盖 `window.EChartsKit` 的核心方法，统一使用公共库；如需扩展，采用 `Object.assign` 合并，不直接重写。
- 像素优先：`legend.top`、`grid.top/bottom/left/right` 统一使用像素，并以 `computeGridTop()` 驱动竖向顺序；避免百分比与像素混用导致对齐偏差。
- 边界齐平：`grid.left/right` 由库最小化压缩，页面勿再单独计算右侧边距；纵轴名称置顶时仅通过 `computeGridLeftForYAxis()` 控制左侧。
- containLabel 唯一入口：与轴标签相关的可视区全部由 `containLabel:true` 接管，页面不要再通过 `axisLabel.margin` 等方式尝试“拉宽”外侧留白。
- 交互条统一：折线/柱状图仅使用 `dataZoom.bottom=16` 与 `grid.bottom` 调整，热力图仅使用 `visualMap.bottom=28/30` 与 `grid.bottom` 调整；不要通过 `grid.height` 等间接方式挤压布局。
- 数值风格统一：yAxis/tooltip/label/visualMap 全面接入 `formatShortNumber/formatMoney`，不要混用其他自定义格式函数。
- 事件监听统一：仅通过 `addPassiveResize()` 和全局 passive 补丁处理滚动/尺寸变化，避免在页面各处重复注册不同风格的监听器。

#### 8.5 响应式高度计算
为确保图表在不同设备上的最佳显示效果，建议：
1. **动态计算高度**：根据数据量和设备类型调整图表高度
2. **设置合理的最小/最大高度**：避免图表过小或过大

**示例：**
```javascript
const dataPointCount = data.length;
const baseHeight = 60;
const minChartHeight = isMobile ? 280 : 300;
const maxChartHeight = isMobile ? 350 : 400;
const dynamicHeight = 200 + Math.min(dataPointCount * 8, 100);
const chartHeight = Math.max(minChartHeight, Math.min(maxChartHeight, dynamicHeight));
```

#### 8.6 图表宽度控制与容器适配（关键经验）
为确保图表在容器内完整显示，避免超出显示范围被截断，需要精确控制图表宽度：

**核心原则：**
- **外层容器宽度**：使用 `window.EChartsKit.getActualWidth()` 获取的完整宽度
- **图表实际宽度**：限制为容器宽度的95%，确保在容器内完整显示

**统一实现方法：**
```javascript
// 获取容器实际宽度
const actualWidth = window.EChartsKit.getActualWidth(dv.container);

// 设置外层容器宽度（保持完整宽度）
container.style.width = actualWidth + 'px';
container.style.minWidth = actualWidth + 'px';
container.style.maxWidth = actualWidth + 'px';

// 设置图表容器宽度（限制为95%）
const chartContainer = container.querySelector('#chart-id');
if (chartContainer) {
  const chartWidth = Math.floor(actualWidth * 0.98); // 推荐限制为容器的98%，减少可感知的留白
  chartContainer.style.width = chartWidth + 'px';
  chartContainer.style.height = chartHeight + 'px';
}
```

**应用场景：**
1. **所有ECharts图表容器**：包括折线图、柱状图、饼图、热力图等
2. **响应式调整**：窗口大小变化时同步调整图表宽度

#### 8.7 饼图在移动端的纵向布局范式（新增）
移动端饼图易与图例重叠，推荐采用“图例置顶、饼图中心下移”的布局：

- 图例：`legend.type='scroll'`，`legend.top=38px`，`legend.left='center'`
- 饼图：`series.radius=['30%','60%']`，`series.center=['50%','42%']`
- 标签：移动端 `label.show=false`、`labelLine.show=false`，减少遮挡
- 颜色：沿用 `window.EChartsKit.colors`

桌面端推荐：右侧纵向图例（`orient:'vertical'`，`right:10`，`top:'middle'`），饼图居左（`center:['40%','50%']`），标签显示在外部。

### 九、迁移与对照（旧文档与代码的差异整理）
当本指南与旧实现存在矛盾时，以本指南为准。迁移清单：
- 将所有百分比型 `grid.top/bottom/left/right` 改为像素值或“像素+百分比混合”的计算（尤其是 `grid.top`）
- 将所有自定义数值格式化替换为 `window.EChartsKit.formatShortNumber`
- 在纵轴名称置顶的图表中，统一调用 `computeGridLeftForYAxis(..., nameAtTop=true)`
- 调整交互条位置：折线/柱状图 `dataZoom.bottom=16`；热力图 `visualMap.bottom=28/30` 并加大 `grid.bottom`
- 图例统一：`legend.type='scroll'`、`legend.top≈34/52px`、`legend.itemGap=12`、`legend.textStyle.fontSize=12`

### 十、预览与验证 Checklist（双端）
- 左侧空白是否显著减少（名称置顶时尤需检查）
- 右侧界限位置在各图中是否一致（遵循标准 `grid.right`）
- y轴数字是否按 k/m 显示（包括 tooltip/label/visualMap）
- 图例、纵轴名称、横轴、交互条之间是否互不粘连
- 热力图横轴标签与 visualMap 是否形成独立竖向空间
- 容器宽度与图表宽度是否遵循 100% 与 95% 的规则
3. **移动端适配**：确保在小屏幕设备上图表不会超出显示范围

**实际效果：**
- 避免图表右侧被截断
- 保持图表在容器内居中显示
- 确保图表内容完整可见
- 提升用户体验和可读性

**注意事项：**
- 95%的比例可根据实际需要调整（建议范围：90%-98%）
- 确保图表初始化在宽度设置之后进行
- 在响应式调整中同步更新图表宽度

#### 8.7 轴标签完整显示控制（关键配置）

**核心问题**：图表宽度控制后，Y轴标签仍可能被裁切，需要确保"图表整体宽度自适应"包含所有元素

**解决方案**：为所有图表的grid配置添加`containLabel: true`，并采用像素化顺序计算
```javascript
// 标准配置方式（像素化，并由 legendTop 驱动）
const legendTop = isMobile ? 34 : 52;
grid: window.EChartsKit.grid({
  top: window.EChartsKit.computeGridTop(legendTop, isMobile ? 10 : 12),
  left: window.EChartsKit.computeGridLeftForYAxis(4),
  bottom: isMobile ? 70 : 60,
  containLabel: true
})
```

**containLabel的作用**：
- 确保grid区域包含坐标轴的标签
- 防止轴标签被裁切
- 自动调整grid的位置以容纳所有标签
- 真正实现"图表整体宽度自适应包括所有元素"

**应用范围**：
- 所有包含坐标轴的图表（折线图、柱状图、散点图、热力图等）
- 特别重要：Y轴标签较长的图表
- 移动端显示空间受限的场景

**最佳实践**：
```javascript
// 完整的图表配置示例（像素化，并由 legendTop 驱动顺序）
const legendTop = isMobile ? 34 : 52;
const option = {
  legend: Object.assign(window.EChartsKit.legend(legendTop, 'center', 12), { type: 'scroll' }),
  grid: window.EChartsKit.grid({
    top: window.EChartsKit.computeGridTop(legendTop, isMobile ? 10 : 12),
    left: window.EChartsKit.computeGridLeftForYAxis(4),
    bottom: isMobile ? 70 : 60,
    containLabel: true
  }),
  // 轴配置...
};
```

### 九、移动端显示最佳实践（关键经验）

#### 9.1 Y轴标签移动端优化（统一为名称置顶）
移动端屏幕空间有限，Y轴标签容易显示不清或被裁切。统一采用“名称置顶 + 像素化顺序”的策略：

**核心配置：**
```javascript
yAxis: {
  type: 'value',
  name: 'Y轴标题',
  nameLocation: 'end',
  nameGap: window.EChartsKit.nameGap(), // 贴近轴顶，移动端≈10，桌面≈12
  nameTextStyle: {
    fontSize: 12,
    fontWeight: 'normal'
  },
  axisLabel: {
    fontSize: 12
  }
}
```

**关键参数说明：**
- `nameLocation:'end'`：名称置于纵轴顶部，参与竖向顺序计算
- `nameGap`：由工具库统一返回，避免各页面使用不同数值
- 配合`grid: { containLabel: true }`确保标签完整显示并自动留白

#### 9.2 饼图移动端布局优化
饼图在移动端容易出现图例与图表重叠问题，需要重新设计垂直布局：

**核心配置：**
```javascript
// 图例配置
legend: Object.assign(window.EChartsKit.legend(), {
  top: isMobile ? 35 : 64, // 移动端图例上移
  left: 'center',
  itemGap: 12
}),

// 饼图中心位置
series: [{
  type: 'pie',
  center: [
    '50%', 
    isMobile ? '65%' : '58%' // 移动端饼图下移
  ],
  radius: ['40%', '70%'],
  // 其他配置...
}]
```

**布局原理：**
- 移动端图例`top: 35`，饼图`center: ['50%', '65%']`
- 确保图例在上方，饼图在下方，避免重叠
- 桌面端保持原有布局比例

#### 9.3 容器高度和留白优化
移动端需要精确控制容器高度，避免过大的上下留白：

**核心配置：**
```javascript
// 容器高度计算
const isMobile = window.EChartsKit.isMobile();
const baseHeight = isMobile ? 30 : 40; // 大幅减少基础高度
const chartHeight = isMobile ? 250 : 300; // 适中的图表高度
const totalHeight = baseHeight + chartHeight;

// Padding优化
const containerHTML = `
  <div style="padding: ${isMobile ? '5px' : '15px'}; ...">
    <!-- 图表内容 -->
  </div>
`;
```

**优化效果：**
- 移动端`baseHeight: 30px`，桌面端`40px`
- 移动端`padding: 5px`，桌面端`15px`
- 显著减少无谓留白，提升空间利用率

#### 9.4 响应式调整函数统一化
确保所有图表的响应式调整使用一致的高度计算：

**标准模板：**
```javascript
// 添加响应式调整
window.EChartsKit.addPassiveResize(dv, container, () => {
  const newIsMobile = window.EChartsKit.isMobile();
  const newBaseHeight = newIsMobile ? 30 : 40;
  const newChartHeight = newIsMobile ? 250 : 300;
  return newBaseHeight + newChartHeight;
});
```

#### 9.5 移动端图表类型适配指南

**折线图/柱状图：**
- Y轴`nameGap: 55`，字体`12px`
- `baseHeight: 30px`，`chartHeight: 250px`
- `padding: 5px`

**饼图/环形图：**
- 图例`top: 35`，饼图`center: ['50%', '65%']`
- `baseHeight: 30px`，`chartHeight: 250px`
- `padding: 5px`

**热力图：**
- 调整`visualMap.bottom`避免与轴标签重叠
- `grid.top/bottom`留出足够空间
- `baseHeight: 30px`，`chartHeight: 250px`

#### 9.6 移动端检查清单
在实施移动端优化时，请检查以下要点：

- [ ] Y轴标签：`nameGap: 55`，字体`12px`
- [ ] 饼图布局：图例`top: 35`，中心`65%`
- [ ] 容器高度：`baseHeight: 30px`，`chartHeight: 250px`
- [ ] 内边距：`padding: 5px`
- [ ] 响应式函数：使用统一的高度计算
- [ ] Grid配置：`containLabel: true`
- [ ] 图表宽度：限制为容器95%

### 十、表格类图表与数据筛选器（新增）

表格类图表在财务数据展示中非常常见，特别是在需要详细查看每条记录的场景。本节提供表格创建、数据筛选、响应式设计和交互功能的最佳实践。

#### 10.1 表格基础结构与响应式设计

**核心原则：**
- 使用DataviewJS创建动态表格，支持数据筛选和排序
- 移动端适配：字体大小、列宽、换行处理
- 添加交互功能：如点击跳转到原始文件

**标准模板：**
```javascript
// 1) 创建表格容器
const tableContainer = dv.container.createEl('div', { cls: 'bill-table-container' });

// 2) 创建筛选器容器
const filterContainer = dv.container.createEl('div', { cls: 'filter-container' });

// 3) 创建表格元素
const table = tableContainer.createEl('table', { cls: 'bill-table' });
const thead = table.createEl('thead');
const tbody = table.createEl('tbody');

// 4) 响应式判断
const isMobile = window.innerWidth <= 768;
```

#### 10.2 数据筛选器实现

**筛选器类型：**
- 类型筛选（收入/支出）
- 分类筛选（下拉选择）
- 日期范围筛选
- 关键词搜索

**标准实现：**
```javascript
// 创建筛选器行
const filterRow = filterContainer.createEl('div', { cls: 'filter-row' });

// 类型筛选
const typeFilter = filterRow.createEl('select', { cls: 'filter-item' );
['全部', '收入', '支出'].forEach(type => {
  const option = typeFilter.createEl('option');
  option.value = type;
  option.textContent = type;
});

// 分类筛选
const categoryFilter = filterRow.createEl('select', { cls: 'filter-item' );
const categories = [...new Set(bills.map(bill => bill.category))];
['全部', ...categories].forEach(category => {
  const option = categoryFilter.createEl('option');
  option.value = category;
  option.textContent = category;
});

// 日期范围筛选
const startDateInput = filterRow.createEl('input', { 
  type: 'date', 
  cls: 'filter-item' 
});
const endDateInput = filterRow.createEl('input', { 
  type: 'date', 
  cls: 'filter-item' 
});

// 关键词搜索
const searchInput = filterRow.createEl('input', { 
  type: 'text', 
  placeholder: '搜索...',
  cls: 'filter-item' 
});
```

#### 10.3 表格渲染与数据筛选

**表格渲染函数：**
```javascript
function renderTable() {
  // 清空现有内容
  tbody.innerHTML = '';
  
  // 获取筛选条件
  const typeValue = typeFilter.value;
  const categoryValue = categoryFilter.value;
  const searchValue = searchInput.value.toLowerCase();
  const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
  const endDate = endDateInput.value ? new Date(endDateInput.value) : null;
  
  // 筛选数据
  const filteredBills = bills.filter(bill => {
    const typeMatch = typeValue === '全部' || bill.type === typeValue;
    const categoryMatch = categoryValue === '全部' || bill.category === categoryValue;
    const searchMatch = !searchValue ||
      bill.description.toLowerCase().includes(searchValue) ||
      bill.amount.toString().includes(searchValue);
    const billDate = new Date(bill.date);
    const dateMatch = (!startDate || billDate >= startDate) && (!endDate || billDate <= endDate);
    
    return typeMatch && categoryMatch && searchMatch && dateMatch;
  });
  
  // 排序数据
  const sortedBills = filteredBills.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // 添加表格行
  sortedBills.forEach(bill => {
    const row = tbody.createEl('tr');
    
    // 根据类型设置行背景色
    if (bill.type === '收入') {
      row.style.backgroundColor = 'rgba(76, 175, 80, 0.05)';
    } else {
      row.style.backgroundColor = 'rgba(244, 67, 54, 0.05)';
    }
    
    // 添加单元格
    addCell(row, bill.date, 'center', true); // 日期列，可点击
    addCell(row, bill.category, 'center');
    addCell(row, bill.subcategory || bill.description, 'center');
    addCell(row, bill.channel, 'center');
    addAmountCell(row, bill.amount, bill.type);
  });
  
  // 如果没有数据，显示提示
  if (sortedBills.length === 0) {
    const noDataRow = tbody.createEl('tr');
    const noDataCell = noDataRow.createEl('td');
    noDataCell.colSpan = headers.length;
    noDataCell.textContent = '没有符合条件的数据';
    noDataCell.style.padding = '20px';
    noDataCell.style.textAlign = 'center';
    noDataCell.style.color = '#999';
  }
}
```

#### 10.4 表格跳转功能实现

**核心功能：**
- 点击表格中的日期列，跳转到对应的账单文件
- 使用Obsidian API实现文件跳转
- 添加视觉反馈（悬停效果、点击样式）

**实现代码：**
```javascript
// 添加单元格函数（支持跳转功能）
function addCell(row, content, align = 'left', isClickable = false) {
  const cell = row.createEl('td');
  cell.style.padding = isMobile ? '6px 8px' : '8px 12px';
  cell.style.textAlign = align;
  
  if (isClickable && content) {
    // 创建可点击的链接
    const link = cell.createEl('a');
    link.textContent = content;
    link.style.color = '#76448A'; // 使用主题色
    link.style.textDecoration = 'none';
    link.style.cursor = 'pointer';
    link.style.fontWeight = '500';
    
    // 添加点击事件处理
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        // 获取账单文件路径
        const filePath = bill.path;
        if (filePath) {
          // 使用Obsidian API打开文件
          const currentFile = app.workspace.getActiveFile();
          const file = app.metadataCache.getFirstLinkpathDest(filePath, currentFile.path);
          if (file) {
            await app.workspace.getLeaf('tab').openFile(file);
          } else {
            console.error('无法找到文件:', filePath);
          }
        }
      } catch (error) {
        console.error('打开文件时出错:', error);
      }
    });
    
    // 添加悬停效果
    link.addEventListener('mouseenter', () => {
      link.style.textDecoration = 'underline';
    });
    
    link.addEventListener('mouseleave', () => {
      link.style.textDecoration = 'none';
    });
  } else {
    // 移动端文本处理
    cell.textContent = isMobile ? chunkText(content, 2) : content;
    cell.style.whiteSpace = isMobile ? 'pre-wrap' : 'normal';
    cell.style.lineHeight = isMobile ? '1.1' : '1.4';
  }
  
  return cell;
}

// 文本分块函数（移动端适配）
function chunkText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.substr(i, maxLength));
  }
  return chunks.join('\n');
}
```

#### 10.5 表格样式与响应式设计

**全局样式：**
```javascript
// 添加全局样式
if (!document.querySelector('#finance-table-style')) {
  const style = document.createElement('style');
  style.id = 'finance-table-style';
  style.textContent = `
    .bill-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 14px;
    }
    .bill-table th, .bill-table td {
      border: 1px solid #ddd;
      padding: 8px 12px;
      text-align: left;
    }
    .bill-table th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    .bill-table tr:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
    .filter-container { 
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 15px;
      align-items: stretch; 
      font-size: 0.85em;
    }
    .filter-item {
      display: flex;
      align-items: center;
    }
    .filter-item label {
      margin-right: 5px;
      font-size: 0.85em;
    }
    .filter-item select, .filter-item input {
      padding: 4px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.85em;
      box-shadow: none;
    }
    @media (max-width: 768px) {
      .bill-table { font-size: 12px; }
      .bill-table th, .bill-table td { padding: 6px 8px; }
      .filter-container {
        padding: 8px;
        flex-direction: column;
      }
      .filter-row {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .filter-item {
        margin-bottom: 6px;
        width: auto;
      }
    }
  `;
  document.head.appendChild(style);
}
```

#### 10.6 表格最佳实践与注意事项

**数据准备：**
- 确保数据源包含必要的字段（如path用于跳转）
- 对数据进行预处理和格式化
- 处理可能的空值或异常值

**性能优化：**
- 对于大量数据，考虑分页或虚拟滚动
- 使用防抖处理搜索输入，减少频繁筛选
- 缓存筛选结果，避免重复计算

**用户体验：**
- 提供清晰的视觉反馈（加载状态、空数据提示）
- 保持筛选器状态，避免用户重复输入
- 添加数据导出功能（可选）

**移动端适配：**
- 调整字体大小和间距
- 处理长文本的换行显示
- 优化触摸交互（增大点击区域）

#### 10.7 完整表格示例

```javascript
// 完整表格实现示例
async function createInteractiveTable(dv, bills) {
  // 1. 创建容器
  const tableContainer = dv.container.createEl('div', { cls: 'bill-table-container' });
  const filterContainer = dv.container.createEl('div', { cls: 'filter-container' });
  const filterRow = filterContainer.createEl('div', { cls: 'filter-row' });
  
  // 2. 创建表格
  const table = tableContainer.createEl('table', { cls: 'bill-table' });
  const thead = table.createEl('thead');
  const tbody = table.createEl('tbody');
  
  // 3. 创建表头
  const headers = ['日期', '分类', '子分类', '渠道', '金额'];
  const headerRow = thead.createEl('tr');
  headers.forEach(header => {
    const th = headerRow.createEl('th');
    th.textContent = header;
    th.style.textAlign = 'center';
  });
  
  // 4. 创建筛选器
  const typeFilter = createSelectFilter(filterRow, '类型:', ['全部', '收入', '支出']);
  const categoryFilter = createSelectFilter(filterRow, '分类:', ['全部', ...getUniqueCategories(bills)]);
  const searchInput = createTextInput(filterRow, '搜索:');
  const startDateInput = createDateInput(filterRow, '开始:');
  const endDateInput = createDateInput(filterRow, '结束:');
  
  // 5. 渲染表格
  function renderTable() {
    // 实现表格渲染逻辑（参考10.3节）
  }
  
  // 6. 添加事件监听
  typeFilter.addEventListener('change', renderTable);
  categoryFilter.addEventListener('change', renderTable);
  searchInput.addEventListener('input', debounce(renderTable, 300));
  startDateInput.addEventListener('change', renderTable);
  endDateInput.addEventListener('change', renderTable);
  
  // 7. 初始渲染
  renderTable();
  
  // 8. 添加全局样式（如果尚未添加）
  addTableStyles();
}

// 辅助函数
function createSelectFilter(container, label, options) {
  const containerDiv = container.createEl('div', { cls: 'filter-item' });
  const labelEl = containerDiv.createEl('label');
  labelEl.textContent = label;
  
  const select = containerDiv.createEl('select');
  options.forEach(option => {
    const optionEl = select.createEl('option');
    optionEl.value = option;
    optionEl.textContent = option;
  });
  
  return select;
}

function createTextInput(container, label) {
  const containerDiv = container.createEl('div', { cls: 'filter-item' });
  const labelEl = containerDiv.createEl('label');
  labelEl.textContent = label;
  
  const input = containerDiv.createEl('input');
  input.type = 'text';
  input.placeholder = '输入关键词...';
  
  return input;
}

function createDateInput(container, label) {
  const containerDiv = container.createEl('div', { cls: 'filter-item' });
  const labelEl = containerDiv.createEl('label');
  labelEl.textContent = label;
  
  const input = containerDiv.createEl('input');
  input.type = 'date';
  
  return input;
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function getUniqueCategories(bills) {
  return [...new Set(bills.map(bill => bill.category))];
}

function addTableStyles() {
  // 实现样式添加逻辑（参考10.5节）
}
```

### 十一、模板与自动化
- 可使用 Templater 将上述"骨架 + 数据解析 + option 生成"封装为模板，打开文件时自动刷新或按需生成
- 新增图表时严格遵守本指南的版式与调用规范，保证跨页面一致性
- **特别提醒**：新增图表时务必应用8.1-8.7节的显示效果控制经验，确保数值格式、图例位置、显示范围、标题处理、响应式设计、宽度控制和轴标签完整显示的统一性

---

### 附录：常用图表示例（按新规范，含 insertExplanation 用法）

以下示例均遵循“说明 → 图例 → 纵轴名（置顶） → 图”的竖向顺序，顶部与左侧采用像素化/自适应计算，保证不同页面风格一致。

#### A. 饼图（占比类）
```javascript
// 说明：各类别支出占比（当月）
window.EChartsKit.insertExplanation(dv, '展示各类别的支出占比（当月）', { marginBottomPx: 8 });
const container = window.EChartsKit.initContainer(dv, 300, 360);
const isMobile = window.EChartsKit.isMobile();
const legendTop = 38;
const myChart = echarts.init(container, null, { renderer:'canvas' });

const option = {
  legend: Object.assign(window.EChartsKit.legend(legendTop, 'center', 12), {
    type: 'scroll', data: categories
  }),
  series: [{
    type: 'pie',
    radius: isMobile ? ['36%','68%'] : ['42%','72%'],
    center: ['50%', isMobile ? '65%' : '58%'],
    avoidLabelOverlap: true,
    label: { formatter: p => `${p.name}: ${p.percent}%` },
    data: categories.map((name, i) => ({ name, value: values[i] }))
  }]
};
myChart.setOption(option);
```

#### B. 柱状图（金额类，k/m + ¥ 格式）
```javascript
window.EChartsKit.insertExplanation(dv, '展示最近12个月的支出与预算对比', { marginBottomPx: 8 });
const container = window.EChartsKit.initContainer(dv, 320, 420);
const isMobile = window.EChartsKit.isMobile();
const legendTop = 38;
const myChart = echarts.init(container);

const option = {
  legend: Object.assign(window.EChartsKit.legend(legendTop, 'center', 12), {
    type: 'scroll', data: ['支出','预算']
  }),
  grid: window.EChartsKit.grid({
    top: window.EChartsKit.computeGridTop(legendTop, isMobile ? 10 : 12),
    left: window.EChartsKit.computeGridLeftForYAxis(4),
    bottom: 60, containLabel: true
  }),
  xAxis: { type: 'category', data: months, axisLabel: { interval: 0 } },
  yAxis: {
    type: 'value',
    name: '金额(¥)',
    nameLocation: 'end',
    nameGap: window.EChartsKit.nameGap(),
    axisLabel: { formatter: v => window.EChartsKit.formatMoney(v, 1) }
  },
  series: [
    { name: '支出', type: 'bar', data: spendArray },
    { name: '预算', type: 'bar', data: budgetArray }
  ]
};
myChart.setOption(option);
```

#### C. 热力图（视觉映射 + 底部留白）
```javascript
window.EChartsKit.insertExplanation(dv, '展示一周 × 24小时的活跃强度热力分布', { marginBottomPx: 8 });
const container = window.EChartsKit.initContainer(dv, 320, 420);
const isMobile = window.EChartsKit.isMobile();
const legendTop = 34;
const myChart = echarts.init(container);

const option = {
  grid: window.EChartsKit.grid({
    top: window.EChartsKit.computeGridTop(legendTop, isMobile ? 10 : 12),
    left: window.EChartsKit.computeGridLeftForYAxis(3),
    bottom: isMobile ? 86 : 76,
    containLabel: true
  }),
  xAxis: { type: 'category', data: hours, boundaryGap: false },
  yAxis: {
    type: 'category', data: weekdays,
    name: '强度', nameLocation: 'end', nameGap: window.EChartsKit.nameGap(),
    axisLabel: { formatter: v => v }
  },
  visualMap: {
    min: 0, max: maxValue,
    orient: 'horizontal', left: 'center', bottom: isMobile ? 28 : 30,
    inRange: { color: ['#e0f3f8','#abd9e9','#74add1','#4575b4'] },
    formatter: v => window.EChartsKit.formatShortNumber(v, 1)
  },
  series: [{
    type: 'heatmap',
    data: heatmapData, // [[xIndex, yIndex, value], ...]
    progressive: 500
  }]
};
myChart.setOption(option);
```

## 📝 原始数据（Dataview 示例）
```dataview
LIST
FROM "07-项目系统/01-公务员考试/01-行测/01-刷题复盘/06-刷题记录"
WHERE file.name = "逻辑填空记录.md"
```
### 单源合并与跨页覆盖回退（新增）

为避免在同一工作仓中跨页打开不同数据看板时出现全局 `EChartsKit` 被覆盖而导致样式与布局回退的问题，务必使用“合并赋值”而非“覆盖赋值”：

```html
<script>
  // 正确：合并已存在的全局对象
  window.EChartsKit = Object.assign(window.EChartsKit || {}, EC);
  
  // 错误：直接覆盖会清空其它页面已注册的实现
  // window.EChartsKit = EC;
</script>
```

同时，统一容器与宽度计算策略，消除移动端的额外左右留白：

- `initContainer`：移动端边距统一为 `marginMobile = '20px 0 20px 0'`，桌面端保持 `marginDesktop = '20px auto'`。
- `computeActualWidth`（或 `defaultComputeActualWidth`）：移动端不再人为减去固定 50px；宽度以容器 `offsetWidth` 或 `window.innerWidth` 的可用值为准。

参考实现：

```js
const defaultComputeActualWidth = (dvContainer) => {
  const isMobile = EC.isMobile();
  if (isMobile) {
    const base = (dvContainer && dvContainer.offsetWidth) ? dvContainer.offsetWidth : (window.innerWidth || 800);
    return Math.max(280, Math.min(base, 1200));
  } else {
    const parentWidth = (dvContainer && dvContainer.offsetWidth) ? dvContainer.offsetWidth : 800;
    return Math.min(parentWidth, 1200);
  }
};

EC.initContainer = (dv, heightMobile = 300, heightDesktop = 400, marginDesktop = '20px auto', marginMobile = '20px 0 20px 0') => {
  const isMobile = EC.isMobile();
  const container = document.createElement('div');
  container.style.width = (isMobile ? defaultComputeActualWidth(dv?.container) : defaultComputeActualWidth(dv?.container)) + 'px';
  container.style.height = (isMobile ? heightMobile : heightDesktop) + 'px';
  container.style.margin = isMobile ? marginMobile : marginDesktop;
  (dv?.container || document.body).appendChild(container);
  return container;
};
```

调试建议：

- 在同一会话中来回打开多个看板，验证全局对象未被覆盖且容器宽度保持满宽。
- 若采用 Obsidian 预览模式，确保无其他自定义样式对容器 `padding` 或 `margin` 添加额外数值。