

请按照以下步骤在 IDE 中进行替换执行。在代码中，我严格规避了 Emoji 的使用。

### 第一步：修改注入的 CSS 样式

在 `finance-viz-kit.js` 的最上方 `initStyles()` 函数内部，找到原有的 `.fv-sc-selector` 相关样式（大约在第 43 行到第 93 行左右），将其**全部删除并替换**为以下气泡卡片的专用样式。

同时，为了防止气泡被父级卡片的 `overflow: hidden` 裁切，我们需要微调 `.fv-super-card` 和 `.fv-sc-header` 的样式。

**替换为以下 CSS 片段：**

```css
        /* 修正父级容器的溢出裁切，并为头部单独应用圆角 */
        .fv-super-card {
            background: #FFFFFF;
            border-radius: 12px;
            box-shadow: 0 4px 20px -4px rgba(139, 92, 246, 0.15);
            overflow: visible; /* 改为 visible 允许气泡溢出 */
            margin-bottom: 24px;
            border: 1px solid rgba(0,0,0,0.03);
            position: relative;
            z-index: 2;
        }
        .fv-sc-header {
            background: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%);
            padding: 20px 24px; color: white;
            display: flex; justify-content: space-between; align-items: center;
            position: relative;
            border-radius: 12px 12px 0 0; /* 补充顶部圆角 */
        }
        .fv-sc-header::before {
            content: ""; position: absolute; top: -50%; right: -20%; width: 200px; height: 200px;
            background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
            border-radius: 50%; pointer-events: none;
            overflow: hidden; /* 将溢出控制限制在伪元素内 */
        }

        /* 触发器（原日期文本）样式 */
        .fv-sc-title-area p.fv-date-trigger { 
            margin: 4px 0 0 0; 
            font-size: 12px; 
            color: rgba(255,255,255,0.9); 
            font-family: monospace;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 6px;
            margin-left: -6px;
            border-radius: 6px;
            transition: background 0.2s;
        }
        .fv-sc-title-area p.fv-date-trigger:hover {
            background: rgba(255,255,255,0.15);
        }

        /* 全新气泡卡片样式 */
        .fv-sc-selector-popover {
            position: absolute;
            top: 100%;
            left: 24px;
            margin-top: -8px; /* 稍微向上收一点，与头部衔接更紧凑 */
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            padding: 16px;
            display: none; /* 默认隐藏 */
            z-index: 100;
            flex-direction: column;
            gap: 16px;
            width: 320px;
        }
        .fv-sc-selector-popover.active {
            display: flex;
            animation: fv-popover-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fv-popover-in {
            from { opacity: 0; transform: translateY(-8px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .fv-sc-selector-row {
            display: flex;
            align-items: center;
            gap: 8px;
            justify-content: space-between;
        }
        .fv-sc-selector-popover input[type="date"] {
            flex: 1;
            padding: 8px 10px;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            font-size: 12px;
            color: #1F2937;
            background: #F8FAFC;
            outline: none;
            width: 100%;
        }
        .fv-sc-selector-popover input[type="date"]:focus {
            border-color: #8B5CF6;
            background: #FFFFFF;
        }
        .fv-sc-selector-apply {
            padding: 10px 16px;
            background: #8B5CF6;
            color: #FFFFFF;
            border: none;
            border-radius: 8px;
            font-size: 12px;
            cursor: pointer;
            font-weight: 600;
            width: 100%;
            transition: background 0.2s;
        }
        .fv-sc-selector-apply:hover {
            background: #7C3AED;
        }
        .fv-sc-selector-quick {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
        }
        .fv-sc-selector-quick button {
            padding: 6px 0;
            background: #F1F5F9;
            color: #475569;
            border: 1px solid transparent;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
        }
        .fv-sc-selector-quick button:hover {
            background: #E2E8F0;
            color: #0F172A;
        }

```

### 第二步：修改 DOM 生成逻辑

在 `finance-viz-kit.js` 中的 `window.FinanceVizKit.render.main` 函数内（大约在第 858 行 `createRangeSelector` 方法和稍后的 `header` 方法渲染逻辑）：

#### 1. 替换 `header` 函数的生成代码

找到 `header(container, data, callbacks, rangeSelector)` 内部拼接 `headerEl.innerHTML` 的逻辑，添加下拉箭头的 SVG，并绑定点击事件：

```javascript
    header(container, data, callbacks, rangeSelector) {
        const { totalIn, totalOut, net, daily, activeDays, countIn, countOut, periodLabel, netLabel, budgetLine, startDate, endDate } = data;
        
        let dateDisplay = data.dateStr || 'FINANCE OVERVIEW';
        if (startDate && endDate && startDate !== endDate) {
            const startParts = startDate.split('-');
            const endParts = endDate.split('-');
            if (startParts.length === 3 && endParts.length === 3) {
                const startDisplay = `${startParts[1]}-${startParts[2]}`;
                const endDisplay = `${endParts[1]}-${endParts[2]}`;
                dateDisplay = `${startDisplay} ~ ${endDisplay}`;
            }
        }
        
        const card = document.createElement('div');
        card.className = 'fv-super-card';
        
        const headerEl = document.createElement('div');
        headerEl.className = 'fv-sc-header';
        
        // 修改点：增加 class="fv-date-trigger" 和下拉箭头 SVG
        headerEl.innerHTML = `
            <div class="fv-sc-title-area">
                <h2>财务数据看板</h2>
                <p class="fv-date-trigger" id="fv-date-trigger-btn">
                    ${dateDisplay} 
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </p>
            </div>
            <div class="fv-sc-total-area" id="fv-btn-expense" style="cursor:pointer">
                <div class="fv-sc-big-num">¥${parseInt(totalOut).toLocaleString()}</div>
                <div class="fv-sc-label">${periodLabel || '本月'}总支出</div>
                ${budgetLine ? `<div class="fv-sc-label" style="margin-top:4px;opacity:0.8;font-weight:500">${budgetLine}</div>` : ``}
            </div>
        `;
        card.appendChild(headerEl);
        
        // 修改点：将气泡挂载在 card 内部，并处理点击开关逻辑
        if (rangeSelector) {
            card.appendChild(rangeSelector);
            
            const triggerBtn = headerEl.querySelector('#fv-date-trigger-btn');
            if (triggerBtn) {
                triggerBtn.onclick = (e) => {
                    e.stopPropagation();
                    rangeSelector.classList.toggle('active');
                };
                
                // 点击空白处关闭气泡
                const closePopover = (e) => {
                    if (!rangeSelector.contains(e.target) && !triggerBtn.contains(e.target)) {
                        rangeSelector.classList.remove('active');
                    }
                };
                document.addEventListener('click', closePopover, { capture: true });
                
                // 提供一个清理方法给外部，防止重绘时内存泄漏
                rangeSelector._cleanup = () => {
                    document.removeEventListener('click', closePopover, { capture: true });
                };
            }
        }
        
        // ...（保留原来的 bodyEl 和后续逻辑）
        const bodyEl = document.createElement('div');
        bodyEl.className = 'fv-sc-body';
        // ... (以下不动)

```

#### 2. 重写 `createRangeSelector` 函数

将原本的水平排布改为网格化的气泡内容排布。替换原有的 `createRangeSelector` 声明块：

```javascript
        let startDateInput, endDateInput;
        
        const createRangeSelector = () => {
            const selector = document.createElement('div');
            selector.className = 'fv-sc-selector-popover'; // 使用新样式
            
            // 顶部：快捷按钮组
            const quickGroup = document.createElement('div');
            quickGroup.className = 'fv-sc-selector-quick';
            
            const quickButtons = [
                { text: '本月', type: 'month' },
                { text: '上月', type: 'lastMonth' },
                { text: '近3月', type: 'quarter' },
                { text: '本年', type: 'year' }
            ];
            
            quickButtons.forEach(qb => {
                const btn = document.createElement('button');
                btn.textContent = qb.text;
                btn.onclick = () => {
                    const today = new Date();
                    let start, end;
                    
                    if (qb.type === 'month') {
                        start = new Date(today.getFullYear(), today.getMonth(), 1);
                        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                        periodType = "month";
                    } else if (qb.type === 'lastMonth') {
                        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                        end = new Date(today.getFullYear(), today.getMonth(), 0);
                        periodType = "month";
                    } else if (qb.type === 'quarter') {
                        start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
                        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                        periodType = "range";
                    } else if (qb.type === 'year') {
                        start = new Date(today.getFullYear(), 0, 1);
                        end = new Date(today.getFullYear(), 11, 31);
                        periodType = "year";
                    }
                    
                    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
                    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
                    
                    startDateInput.value = startStr;
                    endDateInput.value = endStr;
                };
                quickGroup.appendChild(btn);
            });
            selector.appendChild(quickGroup);
            
            // 中间：分割线
            const divider = document.createElement('div');
            divider.style.cssText = 'height: 1px; background: #F1F5F9; margin: 4px 0;';
            selector.appendChild(divider);
            
            // 下部：自定义日期输入
            const dateRow = document.createElement('div');
            dateRow.className = 'fv-sc-selector-row';
            
            startDateInput = document.createElement('input');
            startDateInput.type = 'date';
            startDateInput.value = startDate || '';
            dateRow.appendChild(startDateInput);
            
            const sep = document.createElement('span');
            sep.textContent = '至';
            sep.style.cssText = 'color: #94A3B8; font-size: 12px;';
            dateRow.appendChild(sep);
            
            endDateInput = document.createElement('input');
            endDateInput.type = 'date';
            endDateInput.value = endDate || '';
            dateRow.appendChild(endDateInput);
            
            selector.appendChild(dateRow);
            
            // 底部：确认按钮
            const applyBtn = document.createElement('button');
            applyBtn.className = 'fv-sc-selector-apply';
            applyBtn.textContent = '确认应用';
            applyBtn.onclick = () => {
                startDate = startDateInput.value;
                endDate = endDateInput.value;
                const start = new Date(startDate);
                const end = new Date(endDate);
                const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                if (diffMonths >= 11) periodType = "year";
                else if (diffMonths >= 2) periodType = "range";
                else periodType = "month";
                
                // 关闭气泡并执行重绘
                if (selector._cleanup) selector._cleanup();
                renderDashboard();
            };
            selector.appendChild(applyBtn);
            
            return selector;
        };

```

---

**最后注意一点防泄漏：**在执行渲染循环（`renderDashboard`）时，需要清除掉老组件绑定的 `document` 级别事件。如果你在 `renderDashboard` 里每次都要重新执行这部分内容，记得在 `contentArea.innerHTML = ""` 前加上一行：

```javascript
if (rangeSelectorEl && rangeSelectorEl._cleanup) rangeSelectorEl._cleanup();

```
