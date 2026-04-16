### **[ AI-IDE 提示词 ]：Obsidian DataviewJS 看板新增图表任务**

任务目标：

在 04-Dashboard_TokenCst.md 中，紧随 ## 4. 模型-类别 性能矩阵 之后，新增一个图表节点。

**核心背景与规范：**

1. **数据源：** `03-TokenCst.md`（已包含 `timeCost` 和 `modelName` 字段）。
    
2. **技术栈：** Obsidian DataviewJS, ECharts, `window.EChartsKit`。
    
3. **规范遵从：** 必须严格遵循《ECharts集成实施指南》中的所有版式规范和函数调用（指南将一同提供）。
    

---

### **新增图表：`## 5. 模型效率 (Token-Time) 散点图`**

**任务：** 创建一个新的 `dataviewjs` 代码块，实现一个散点图，用于可视化“耗时”与“Token消耗”之间的关系，并按“模型”进行分组。

- **图表类型：** `scatter` (散点图)。
    
- **数据聚合：**
    
    1. 遍历所有 `recs` 记录（建议排除 `modelName === "调用失败"` 的记录）。
        
    2. 按 `modelName` 进行分组。
        
    3. 为每个模型生成一个 `series` 对象，其 `data` 属性格式为 `[[total, timeCost], [total, timeCost], ...]`。
        
- **布局规范 (遵循指南)：**
    
    - **竖向顺序：** 必须遵循指南的“图例 -> 纵轴名 -> 网格”顺序。
        
    - `legend.top`：使用像素值 (e.g., `isMobile ? 34 : 52`)。
        
    - `legend.type`：必须为 `'scroll'`。
        
    - `grid.top`：必须使用 `window.EChartsKit.computeGridTop(legendTop, ...)` 计算。
        
    - **X轴 (Token)：**
        
        - `name: '总Token消耗量'`。
            
        - `nameLocation: 'end'`。
            
        - `nameGap: window.EChartsKit.nameGap()`。
            
        - `axisLabel`：必须使用 `window.EChartsKit.formatShortNumber`。
            
    - **Y轴 (耗时)：**
        
        - `name: '耗时(s)'`。
            
        - `nameLocation: 'end'`。
            
        - `nameGap: window.EChartsKit.nameGap()`。
            
    - **边距控制：** 必须设置 `grid.containLabel = true`。`grid.left` 必须使用 `window.EChartsKit.computeGridLeftForYAxis()` 计算。
        
    - **宽度控制：** 图表容器宽度必须遵循指南 `Math.floor(actualWidth * 0.98)` 规范。
        
    - **底部交互：** 必须包含 `dataZoom`（`type: 'slider'`, `bottom: 16`），`grid.bottom` 预留足够空间 (e.g., 60-70px)。
        
- **Tooltip (提示框)：**
    
    - `trigger: 'item'`。
        
    - 必须能清晰显示：`模型名称`、`总Token消耗` (使用 `formatShortNumber`) 和 `耗时` (e.g., "x.x s")。
        
- **Series (系列)：**
    
    - 为每一个 `modelName` 创建一个 `type: 'scatter'` 系列。
        
    - `symbolSize`：设置一个合适的大小（例如 `8` 或 `10`）。
        
    - `color`：使用 `window.EChartsKit.colors` 循环分配。