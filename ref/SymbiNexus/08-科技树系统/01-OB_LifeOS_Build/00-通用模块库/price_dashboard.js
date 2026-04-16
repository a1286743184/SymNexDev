// price_dashboard.js - 终极双轨融合版 (No Emoji)
const currentPage = dv.current();

// 1. 数据读取
const listItems = currentPage.file.lists;
const records = [];

for (let item of listItems) {
    if (item.price) {
        const rawPrice = Number(item.price);
        // 兼容性：如果旧记录没有sup，则回退
        const rawSup = item.sup ? Number(item.sup) : rawPrice; 
        const rawSupUnit = item.sup_unit || item.unit || '单位';

        records.push({
            date: item.text.split(' ')[0],
            price: rawPrice,          // 零售价
            unit: item.unit || '个',  // 零售单位
            sup: rawSup,              // 真值
            sup_unit: rawSupUnit,     // 真值单位
            spec: item.spec || '标准',
            location: item.location || '未知',
            text: item.text
        });
    }
}

if (records.length === 0) {
    dv.paragraph("Waiting for data...");
    return;
}

// 2. 统计逻辑 (双轨并行)
const groups = {};
for (let r of records) {
    if (!groups[r.spec]) groups[r.spec] = [];
    groups[r.spec].push(r);
}

const latest = records[0];
const currentGroup = groups[latest.spec] || records;

// Track A: 真值 (SUP) 统计 - 使用所有记录
const sups = records.map(r => r.sup);
const minSup = Math.min(...sups);
const maxSup = Math.max(...sups);
const avgSup = sups.reduce((a, b) => a + b, 0) / sups.length;

// Track B: 零售 (Retail) 统计 - 使用所有记录
const prices = records.map(r => r.price);
const minPrice = Math.min(...prices);
const maxPrice = Math.max(...prices);
const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

// 查找记录 (用于显示地点) - 使用所有记录
const minSupRecord = records.find(r => r.sup === minSup);
const maxSupRecord = records.find(r => r.sup === maxSup);

// 涨跌幅
const diff = latest.sup - avgSup;
const percentVal = ((Math.abs(diff) / avgSup) * 100).toFixed(1);

// 3. 视觉状态机
let statusLabel = "波动正常"; 
let themeColor = "#3b82f6"; // Blue
let heroBg = "linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%)";
let badgeBg = "rgba(59, 130, 246, 0.15)";
let trendSymbol = "="; 

if (latest.sup <= avgSup * 0.95) {
    themeColor = "#10b981"; // Green
    heroBg = "linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)";
    badgeBg = "rgba(16, 185, 129, 0.15)";
    trendSymbol = "▼";
    statusLabel = `划算 ${percentVal}%`;
} else if (latest.sup >= avgSup * 1.05) {
    themeColor = "#f43f5e"; // Red
    heroBg = "linear-gradient(180deg, rgba(244, 63, 94, 0.08) 0%, rgba(244, 63, 94, 0.02) 100%)";
    badgeBg = "rgba(244, 63, 94, 0.15)";
    trendSymbol = "▲";
    statusLabel = `偏高 ${percentVal}%`;
} else {
    if (Math.abs(diff) > 0) {
        const dir = diff > 0 ? "+" : "-";
        statusLabel = `正常 ${dir}${percentVal}%`;
        trendSymbol = diff > 0 ? "▲" : "▼";
    }
}

// 4. HTML 渲染

// 辅助函数：渲染双轨格子 (真值在上，零售在下)
function renderDualCell(title, supVal, retailVal, unit, footer, color) {
    return `
    <div style="display: flex; flex-direction: column; align-items: center; position: relative;">
        <div style="font-size: 0.75em; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase;">${title}</div>
        
        <div style="font-size: 1.1em; font-weight: 800; color: ${color}; line-height: 1.1;">
            <span style="font-size: 0.7em; font-weight: normal; opacity: 0.7;">¥</span>${Number(supVal).toFixed(2)}
        </div>
        
        <div style="font-size: 0.8em; color: var(--text-muted); margin-top: 2px; opacity: 0.8;">
            ¥${Number(retailVal).toFixed(2)}/${unit}
        </div>
        
        <div style="font-size: 0.75em; opacity: 0.5; margin-top: 6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:90%;">${footer}</div>
        
        ${title !== '历史最高' ? `<div style="position: absolute; right: 0; top: 10%; height: 80%; border-right: 1px solid var(--background-modifier-border);"></div>` : ''}
    </div>`;
}

// 多规格提示
let specInfoHTML = "";
if (Object.keys(groups).length > 1) {
    const specRows = Object.keys(groups).map(sp => {
        const gSups = groups[sp].map(r => r.sup);
        const gAvg = (gSups.reduce((a,b)=>a+b,0) / gSups.length).toFixed(2);
        const isCurrent = sp === latest.spec ? "font-weight:bold; color:var(--text-normal);" : "color:var(--text-muted);";
        return `<span style="margin-right:12px; font-size:0.8em; ${isCurrent}">${sp}: ¥${gAvg}</span>`;
    }).join("");
    specInfoHTML = `<div style="margin-top:8px; padding-top:8px; border-top:1px dashed var(--background-modifier-border); width:100%; text-align:center; font-size:0.75em; color:var(--text-muted);">${specRows}</div>`;
}

// 样式
const containerStyle = `
    border-radius: 16px; border: 1px solid var(--background-modifier-border);
    overflow: hidden; font-family: var(--font-interface); margin-bottom: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03); background: var(--background-primary);
`;
const heroStyle = `
    padding: 20px; background: ${heroBg};
    border-bottom: 1px solid var(--background-modifier-border);
    display: flex; flex-direction: column; align-items: center;
`;
const gridStyle = `
    display: grid; grid-template-columns: 1fr 1fr 1fr;
    padding: 16px 0; background: var(--background-primary);
`;

const dashboardHTML = `
<div style="${containerStyle}">
    <div style="${heroStyle}">
        <div style="font-size:0.8em; color:var(--text-muted); margin-bottom:4px;">最新录入 (真值 / ${latest.sup_unit})</div>
        
        <div style="display: flex; align-items: baseline; color: ${themeColor}; margin-bottom: 4px;">
            <span style="font-size: 1.5em; font-weight: 600; margin-right: 2px;">¥</span>
            <span style="font-size: 3.2em; font-weight: 800; letter-spacing: -1px;">${latest.sup.toFixed(2)}</span>
        </div>
        
        <div style="font-size: 0.95em; color: var(--text-normal); opacity: 0.8; margin-bottom: 12px; font-weight: 500;">
            零售价: ¥${latest.price.toFixed(2)} / ${latest.unit}
        </div>
        
        <div style="background: ${badgeBg}; color: ${themeColor}; padding: 4px 12px; border-radius: 20px; font-size: 0.85em; font-weight: 700; letter-spacing: 0.5px; display:inline-flex; align-items:center;">
            <span style="margin-right: 4px;">${trendSymbol}</span>${statusLabel}
        </div>
        ${specInfoHTML}
    </div>

    <div style="${gridStyle}">
        ${renderDualCell('历史最低', minSup, minPrice, latest.unit, minSupRecord?.location || '-', '#10b981')}
        ${renderDualCell('全网均价', avgSup, avgPrice, latest.unit, `共 ${records.length} 条`, '#3b82f6')}
        ${renderDualCell('历史最高', maxSup, maxPrice, latest.unit, maxSupRecord?.location || '-', '#f43f5e')}
    </div>
</div>
`;

// 列表卡片 CSS
const listCardStyle = `
    padding: 12px 16px; margin-bottom: 10px; background: var(--background-primary);
    border: 1px solid var(--background-modifier-border); border-left: 4px solid #512E5F;
    border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);
`;

let listHTML = `<div style="margin-top: 20px;">`;
for (let r of records) {
    let noteDiv = "";
    const noteMatch = r.text.match(/\(📝 (.*?)\)$/);
    if (noteMatch) noteDiv = `<div style="margin-top:8px; padding-top:6px; border-top:1px dashed var(--background-modifier-border); font-size:0.85em; color:var(--text-muted);"><span style="opacity:0.7; margin-right:4px;">📝</span>${noteMatch[1]}</div>`;

    listHTML += `
    <div style="${listCardStyle}">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="display: flex; align-items: baseline; color: #512E5F;">
                    <span style="font-size: 1.4em; font-weight: 800;">¥${r.sup.toFixed(2)}</span>
                    <span style="font-size: 0.8em; opacity: 0.6; margin-left: 2px;">/ ${r.sup_unit}</span>
                </div>
                <div style="font-size: 0.8em; color: var(--text-muted); margin-top: 2px;">
                    零售: ¥${r.price.toFixed(2)} / ${r.unit} | ${r.spec}
                </div>
            </div>
            <div style="text-align: right; line-height: 1.3;">
                <div style="font-size: 0.95em; font-weight: 600; color: var(--text-normal); opacity: 0.9;">${r.location}</div>
                <div style="font-size: 0.75em; font-family: var(--font-monospace); opacity: 0.5;">${r.date}</div>
            </div>
        </div>
        ${noteDiv}
    </div>`;
}
listHTML += `</div>`;

dv.container.innerHTML = dashboardHTML + listHTML;