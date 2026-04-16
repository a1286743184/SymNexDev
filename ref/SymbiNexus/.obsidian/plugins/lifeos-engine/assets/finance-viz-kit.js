(function initStyles() {
    const styleId = "finance-viz-kit-style-v5";
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
        .fv-container { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            max-width: 100%; 
            overflow-x: hidden; 
            background-image: linear-gradient(to bottom, #E2E8F0, #E2E8F0);
            background-size: 2px 100%;
            background-position: 14px 0; 
            background-repeat: no-repeat;
            padding: 0 0 20px 0; 
            box-sizing: border-box;
            color: #111827;
        }
        
        .fv-super-card {
            background: #FFFFFF;
            border-radius: 12px;
            box-shadow: 0 4px 20px -4px rgba(139, 92, 246, 0.15);
            overflow: visible;
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
            border-radius: 12px 12px 0 0;
        }
        .fv-sc-header::before {
            content: ""; position: absolute; top: -50%; right: -20%; width: 200px; height: 200px;
            background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
            border-radius: 50%; pointer-events: none;
            overflow: hidden;
        }
        .fv-sc-title-area h2 { margin: 0; font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.95); letter-spacing: 0.5px; }
        .fv-sc-title-area p { margin: 4px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.7); font-family: monospace; }
        .fv-sc-title-area p.fv-date-trigger { 
            margin: 6px 0 0 0; 
            font-size: 14px; 
            color: rgba(255,255,255,0.95); 
            font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 6px;
            padding: 4px 8px;
            border-radius: 6px;
            transition: background 0.2s;
        }
        .fv-sc-title-area p.fv-date-trigger:hover {
            background: rgba(255,255,255,0.15);
        }
        
        .fv-sc-big-num { font-size: 36px; font-weight: 800; font-family: 'Arial Black', sans-serif; letter-spacing: -1px; margin-top: 4px; }
        .fv-sc-label { font-size: 12px; opacity: 0.9; text-align: right; font-weight: 600; color: rgba(255,255,255,0.9); }
        
        .fv-sc-body { display: grid; grid-template-columns: 1fr 1px 1fr 1px 1fr; align-items: center; padding: 20px 0; }
        .fv-sc-divider { height: 40px; background: #F1F5F9; width: 1px; }
        
        .fv-stat-box { 
            padding: 0 16px; display: flex; flex-direction: column; justify-content: center; align-items: center; 
            cursor: pointer; transition: transform 0.2s;
        }
        .fv-stat-box:hover { transform: translateY(-2px); }
        .fv-stat-title { font-size: 11px; color: #64748B; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; }
        .fv-stat-val { font-size: 20px; font-weight: 800; color: #111827; line-height: 1; }
        .fv-stat-sub { font-size: 11px; color: #94A3B8; margin-top: 4px; }
        
        .val-income { color: #10B981; }
        .val-expense { color: #EF4444; }
        .val-surplus { color: #3B82F6; }
        .val-deficit { color: #F59E0B; }

        .fv-section { margin-bottom: 24px; padding-left: 34px; position: relative; }
        .fv-section::before {
            content: ""; position: absolute; left: 9px; top: 6px;
            width: 12px; height: 12px; border-radius: 50%;
            background: #FFFFFF; border: 3px solid #8B5CF6;
            box-shadow: 0 0 0 2px #F9FAFB; z-index: 1;
        }
        
        .fv-section-wide { margin-bottom: 24px; position: relative; }
        .fv-section-wide .fv-chart-header { padding-left: 34px; position: relative; margin-bottom: 12px; }
        .fv-section-wide .fv-chart-header::before {
            content: ""; position: absolute; left: 9px; top: 50%; transform: translateY(-50%);
            width: 12px; height: 12px; border-radius: 50%;
            background: #FFFFFF; border: 3px solid #8B5CF6;
            box-shadow: 0 0 0 2px #F9FAFB; z-index: 1;
        }

        .fv-chart-header { display: flex; align-items: center; margin-bottom: 12px; }
        .fv-chart-title { 
            font-size: 14px; font-weight: 800; color: #374151; 
            background: #F3F4F6; padding: 4px 10px; border-radius: 6px;
        }
        
        .fv-grid-row { display: flex; gap: 16px; margin-bottom: 24px; }
        .fv-grid-col { flex: 1; min-width: 0; background: #fff; border-radius: 8px; border: 1px solid #F1F5F9; overflow: hidden; }
        .fv-chart-body { width: 100%; height: 320px; position: relative; }

        @media (max-width: 768px) {
            .fv-container { background-position: 10px 0; padding-left: 0; }
            .fv-section { padding-left: 24px; margin-bottom: 24px; }
            .fv-section::before { left: 5px; } 
            .fv-section-wide .fv-chart-header { padding-left: 24px; }
            .fv-section-wide .fv-chart-header::before { left: 5px; }
            .fv-sc-header { 
                padding: 16px; 
                flex-direction: row; 
                align-items: center; 
                justify-content: space-between;
                gap: 10px; 
            }
            .fv-sc-total-area { text-align: right; }
            .fv-sc-big-num { font-size: 28px; margin-top: 0; }
            .fv-sc-label { font-size: 11px; }
            .fv-sc-body { 
                grid-template-columns: 1fr 1fr 1fr;
                grid-template-rows: auto;
                row-gap: 0;
                padding: 16px 0; 
            }
            .fv-sc-divider { display: none; }
            .fv-stat-box { 
                border-right: 1px solid #F1F5F9; 
                padding: 0 4px; 
            }
            .fv-stat-box:last-child { border-right: none; }
            .fv-stat-val { font-size: 16px; } 
            .fv-grid-row { flex-direction: column; }
            .fv-chart-body { height: 280px; }
        }

        .td-save-toast {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            color: white;
            padding: 10px 18px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 600;
            box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
            z-index: 99999;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: td-toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            backdrop-filter: blur(8px);
        }
        .td-save-toast.fade-out {
            animation: td-toast-out 0.3s ease forwards;
        }
        @keyframes td-toast-in {
            from { opacity: 0; transform: translateY(16px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes td-toast-out {
            from { opacity: 1; transform: translateY(0) scale(1); }
            to { opacity: 0; transform: translateY(-8px) scale(0.95); }
        }
        .td-save-toast svg {
            width: 16px;
            height: 16px;
            flex-shrink: 0;
        }

        .fv-collapsible-section {
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            overflow: hidden;
            margin-top: 16px;
            background: #FFFFFF;
        }
        .fv-collapsible-section:first-child {
            margin-top: 0;
        }
        .fv-collapsible-header {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 14px;
            background: linear-gradient(to right, rgba(139, 92, 246, 0.04), transparent);
            cursor: pointer;
            user-select: none;
            transition: background 0.2s ease;
        }
        .fv-collapsible-header:hover {
            background: linear-gradient(to right, rgba(139, 92, 246, 0.08), transparent);
        }
        .fv-collapsible-icon {
            width: 18px;
            height: 18px;
            color: #8B5CF6;
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            flex-shrink: 0;
        }
        .fv-collapsible-section.collapsed .fv-collapsible-icon {
            transform: rotate(-90deg);
        }
        .fv-collapsible-title {
            font-size: 13px;
            font-weight: 700;
            color: #1E293B;
        }
        .fv-collapsible-desc {
            font-size: 11px;
            color: #64748B;
            margin-left: auto;
        }
        .fv-collapsible-body {
            border-top: 1px solid #F1F5F9;
            padding: 12px 14px;
            max-height: 3000px;
            overflow: hidden;
            transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), 
                        padding 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                        opacity 0.25s ease;
            opacity: 1;
        }
        .fv-collapsible-section.collapsed .fv-collapsible-body {
            max-height: 0;
            padding-top: 0;
            padding-bottom: 0;
            opacity: 0;
            border-top: none;
        }

        /* 配置页面 Section 样式 */
        .fv-config-divider {
            height: 1px;
            background: linear-gradient(90deg, #E2E8F0 0%, transparent 100%);
            margin: 16px 0;
        }
        .fv-config-section-title {
            font-size: 14px;
            font-weight: 700;
            color: #1E293B;
            margin: 0 0 4px 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .fv-config-section-title::before {
            content: '';
            width: 4px;
            height: 16px;
            background: linear-gradient(180deg, #8B5CF6 0%, #A78BFA 100%);
            border-radius: 2px;
            flex-shrink: 0;
        }
        .fv-config-section-desc {
            font-size: 12px;
            color: #64748B;
            margin: 0 0 8px 0;
            line-height: 1.5;
            padding-left: 12px;
        }
        .fv-config-section-body {
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            padding: 10px;
            background: #FFFFFF;
        }
    `;
    document.head.appendChild(style);
})();

(function enforcePassiveWheel() {
  if (window.__passiveWheelPatched__) return;
  const origAdd = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (['wheel', 'mousewheel', 'DOMMouseScroll'].includes(type)) {
      if (typeof options === 'object' && options.passive === undefined) options.passive = true;
      else if (options === undefined) options = { passive: true };
    }
    return origAdd.call(this, type, listener, options);
  };
  window.__passiveWheelPatched__ = true;
})();

window.FinanceVizKit = {
  __readyPromise: null,

  money: {
    toCents(n) { return Math.round(Number(n || 0) * 100); },
    fromCents(c) { return c / 100; },
    add(a, b) { return this.fromCents(this.toCents(a) + this.toCents(b)); },
    sub(a, b) { return this.fromCents(this.toCents(a) - this.toCents(b)); },
    sum(arr) { return this.fromCents((arr || []).reduce((acc, n) => acc + this.toCents(n), 0)); },
    aggregateBy(items, keyFn, amountFn) {
      const map = {};
      (items || []).forEach(it => {
        const k = keyFn(it);
        const c = this.toCents(amountFn(it));
        map[k] = (map[k] || 0) + c;
      });
      const res = {};
      Object.keys(map).forEach(k => { res[k] = this.fromCents(map[k]); });
      return res;
    }
  },

  channelAlias: function(name) {
    if (!name) return '未知';
    const s = String(name).trim();
    const cfg = window.FinanceVizKit?.__config || {};
    const aliasMap = cfg?.normalization?.channelAlias || {};
    const mapped = aliasMap[s];
    if (mapped) return String(mapped);
    if (s.includes('中国银行')) return s.includes('信用卡') ? '中行信用' : '中行卡';
    const exactMap = {
      '支付宝': '支付宝', '微信支付': '微信', '微信': '微信', 
      '现金支付': '现金', '现金': '现金', '云闪付': '云闪付',
      '多多支付': '多多', '美团支付': '美团', '京东支付': '京东', 
      '抖音支付': '抖音', '滴滴支付': '滴滴', '数字人民币': '数币'
    };
    if (exactMap[s]) return exactMap[s];
    if (s.includes('银行')) {
        let shortBank = s.replace(/中国|银行|股份有限公司|储蓄卡|信用卡/g, '');
        if (s.includes('建设')) shortBank = '建行';
        else if (s.includes('工商')) shortBank = '工行';
        else if (s.includes('农业')) shortBank = '农行';
        else if (s.includes('民生')) shortBank = '民生';
        else if (s.includes('招商')) shortBank = '招行';
        else if (s.includes('交通')) shortBank = '交行';
        else if (s.includes('浦东')) shortBank = '浦发';
        else if (s.includes('邮政')) shortBank = '邮储';
        const type = s.includes('信用卡') ? '信用' : '卡';
        return shortBank.substring(0, 3) + type; 
    }
    return s.substring(0, 4);
  },

  initECharts: async function() {
    if (window.echarts) { this.setupEC(); return true; }
    const f = app.vault.getAbstractFileByPath('08-科技树系统/01-OB_LifeOS_Build/00-通用模块库/echarts.js');
    if (f) {
      const c = await app.vault.read(f);
      const s = document.createElement('script');
      s.textContent = c;
      document.head.appendChild(s);
      this.setupEC();
      return true;
    }
    return false;
  },
  setupEC: function() {
    if(!window.echarts) return;
    echarts.registerPostInit(c => { c.getZr().handler.__mouseup = () => true; });
  },

  config: {
    defaultConfig() {
      return {
        version: 1,
        sources: [
          { id: "bills", type: "folder", path: "06-财务系统/01-账单数据", name: "账单数据", enabled: true }
        ],
        excludePathIncludes: ["99-", "99-附件"],
        schema: {
          fields: {
            type: "type",
            category: "category",
            subcategory: "subcategory",
            amount: "amount",
            channel: "channel",
            date: "date",
            descriptionFallback: "description"
          },
          dateFallback: {
            fromFilename: true
          },
          amountSign: {
            mode: "byType"
          },
          ledger: {
            enabled: false,
            regex: ""
          },
          csv: {
            enabled: false,
            delimiter: ",",
            hasHeader: true,
            columns: {
              date: "date",
              type: "type",
              category: "category",
              subcategory: "subcategory",
              amount: "amount",
              channel: "channel",
              description: "description"
            }
          }
        },
        ui: {
          fontScale: "12px",
          columnWidths: {
            DATE: "15%",
            CATEGORY: "19%",
            CONTENT: "25%",
            CHANNEL: "19%",
            AMOUNT: "22%"
          }
        },
        normalization: {
          channelAlias: {
            "微信支付": "微信",
            "微信": "微信",
            "支付宝": "支付宝",
            "现金": "现金",
            "现金支付": "现金",
            "云闪付": "云闪付",
            "多多支付": "多多",
            "美团支付": "美团",
            "京东支付": "京东",
            "抖音支付": "抖音",
            "滴滴支付": "滴滴",
            "数字人民币": "数币"
          },
          categoryAlias: {},
          accountAlias: {}
        },
        views: {
          month: {
            cards: { enabled: true, showBudget: true },
            charts: { pie: true, heatmap: true, trend: true, topN: true },
            table: { enabled: true, contentMode: "subcategory", defaultSort: "date_desc" }
          },
          year: {
            cards: { enabled: true, showBudget: false },
            charts: { pie: true, heatmap: true, trend: true, topN: true },
            table: { enabled: true, contentMode: "subcategory", defaultSort: "date_desc" }
          },
          range: {
            cards: { enabled: true, showBudget: true },
            charts: { pie: true, heatmap: true, trend: true, topN: true },
            table: { enabled: true, contentMode: "subcategory", defaultSort: "date_desc" }
          }
        },
        filters: {
          excluded: {
            categories: [],
            subcategories: [],
            channels: []
          },
          applyTo: {
            trend: true,
            heatmap: true,
            pie: true,
            topN: true,
            table: false,
            cards: false
          }
        },
        budgets: {
          monthlyTotal: 0,
          categoryMonthly: {},
          savingsRateTarget: 0,
          debtPaymentTarget: 0
        },
        performance: {
          cacheEnabled: true,
          cacheFile: "财务看板.index.json",
          maxFiles: 5000
        }
      };
    },
    normalizeConfig(cfg) {
      const base = this.defaultConfig();
      const out = cfg && typeof cfg === 'object' ? cfg : {};
      const merged = Object.assign({}, base, out);
      merged.version = Number(merged.version || 1) || 1;
      merged.excludePathIncludes = Array.isArray(merged.excludePathIncludes)
        ? merged.excludePathIncludes.map(v => String(v || '').trim()).filter(Boolean)
        : base.excludePathIncludes;

      merged.sources = Array.isArray(merged.sources) ? merged.sources : base.sources;
      merged.sources = merged.sources
        .filter(s => s && typeof s === 'object')
        .map(s => ({
          id: String(s.id || '').trim() || `s-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          type: (s.type === 'folder' || s.type === 'file' || s.type === 'csv') ? s.type : 'folder',
          path: String(s.path || '').trim(),
          name: String(s.name || '').trim(),
          enabled: s.enabled !== false
        }))
        .filter(s => s.path);

      merged.schema = merged.schema && typeof merged.schema === 'object' ? merged.schema : {};
      merged.schema.fields = merged.schema.fields && typeof merged.schema.fields === 'object' ? merged.schema.fields : {};
      const bf = base.schema.fields;
      const f = Object.assign({}, bf, merged.schema.fields);
      merged.schema.fields = {
        type: String(f.type || '').trim() || bf.type,
        category: String(f.category || '').trim() || bf.category,
        subcategory: String(f.subcategory || '').trim() || bf.subcategory,
        amount: String(f.amount || '').trim() || bf.amount,
        channel: String(f.channel || '').trim() || bf.channel,
        date: String(f.date || '').trim() || bf.date,
        descriptionFallback: String(f.descriptionFallback || '').trim() || bf.descriptionFallback
      };
      merged.schema.dateFallback = merged.schema.dateFallback && typeof merged.schema.dateFallback === 'object' ? merged.schema.dateFallback : {};
      merged.schema.dateFallback.fromFilename = merged.schema.dateFallback.fromFilename !== false;
      merged.schema.amountSign = merged.schema.amountSign && typeof merged.schema.amountSign === 'object' ? merged.schema.amountSign : {};
      merged.schema.amountSign.mode = (merged.schema.amountSign.mode === 'signed' || merged.schema.amountSign.mode === 'byType') ? merged.schema.amountSign.mode : base.schema.amountSign.mode;
      merged.schema.ledger = merged.schema.ledger && typeof merged.schema.ledger === 'object' ? merged.schema.ledger : {};
      merged.schema.ledger.enabled = merged.schema.ledger.enabled === true;
      merged.schema.ledger.regex = String(merged.schema.ledger.regex || '').trim();
      merged.schema.csv = merged.schema.csv && typeof merged.schema.csv === 'object' ? merged.schema.csv : {};
      merged.schema.csv.enabled = merged.schema.csv.enabled === true;
      merged.schema.csv.delimiter = String(merged.schema.csv.delimiter || base.schema.csv.delimiter || ',');
      merged.schema.csv.hasHeader = merged.schema.csv.hasHeader !== false;
      merged.schema.csv.columns = merged.schema.csv.columns && typeof merged.schema.csv.columns === 'object' ? merged.schema.csv.columns : {};
      merged.schema.csv.columns = Object.assign({}, base.schema.csv.columns, merged.schema.csv.columns);

      merged.ui = merged.ui && typeof merged.ui === 'object' ? merged.ui : {};
      merged.ui.fontScale = String(merged.ui.fontScale || base.ui.fontScale || '12px').trim();
      merged.ui.columnWidths = merged.ui.columnWidths && typeof merged.ui.columnWidths === 'object' ? merged.ui.columnWidths : {};
      const cw = Object.assign({}, base.ui.columnWidths, merged.ui.columnWidths);
      merged.ui.columnWidths = {
        DATE: String(cw.DATE || '').trim() || base.ui.columnWidths.DATE,
        CATEGORY: String(cw.CATEGORY || '').trim() || base.ui.columnWidths.CATEGORY,
        CONTENT: String(cw.CONTENT || '').trim() || base.ui.columnWidths.CONTENT,
        CHANNEL: String(cw.CHANNEL || '').trim() || base.ui.columnWidths.CHANNEL,
        AMOUNT: String(cw.AMOUNT || '').trim() || base.ui.columnWidths.AMOUNT
      };

      merged.normalization = merged.normalization && typeof merged.normalization === 'object' ? merged.normalization : {};
      merged.normalization.channelAlias = merged.normalization.channelAlias && typeof merged.normalization.channelAlias === 'object'
        ? merged.normalization.channelAlias
        : base.normalization.channelAlias;
      merged.normalization.categoryAlias = merged.normalization.categoryAlias && typeof merged.normalization.categoryAlias === 'object'
        ? merged.normalization.categoryAlias
        : base.normalization.categoryAlias;
      merged.normalization.accountAlias = merged.normalization.accountAlias && typeof merged.normalization.accountAlias === 'object'
        ? merged.normalization.accountAlias
        : base.normalization.accountAlias;

      merged.views = merged.views && typeof merged.views === 'object' ? merged.views : {};
      const vBase = base.views;
      const ensureView = (v, vb) => {
        const outv = v && typeof v === 'object' ? v : {};
        outv.cards = outv.cards && typeof outv.cards === 'object' ? outv.cards : {};
        outv.cards.enabled = outv.cards.enabled !== false;
        outv.cards.showBudget = outv.cards.showBudget !== false;
        outv.charts = outv.charts && typeof outv.charts === 'object' ? outv.charts : {};
        outv.charts.pie = outv.charts.pie !== false;
        outv.charts.heatmap = outv.charts.heatmap !== false;
        outv.charts.trend = outv.charts.trend !== false;
        outv.charts.topN = outv.charts.topN !== false;
        outv.table = outv.table && typeof outv.table === 'object' ? outv.table : {};
        outv.table.enabled = outv.table.enabled !== false;
        outv.table.contentMode = (outv.table.contentMode === 'rawInput' || outv.table.contentMode === 'subcategory') ? outv.table.contentMode : vb.table.contentMode;
        outv.table.defaultSort = (outv.table.defaultSort === 'amount_desc' || outv.table.defaultSort === 'date_desc') ? outv.table.defaultSort : vb.table.defaultSort;
        return outv;
      };
      merged.views.month = ensureView(merged.views.month, vBase.month);
      merged.views.year = ensureView(merged.views.year, vBase.year);
      merged.views.range = ensureView(merged.views.range, vBase.range);

      merged.filters = merged.filters && typeof merged.filters === 'object' ? merged.filters : {};
      const legacyTrendExcluded = Array.isArray(merged.filters.trendExcludedSubcategories)
        ? merged.filters.trendExcludedSubcategories.map(v => String(v || '').trim()).filter(Boolean)
        : [];
      const exIn = merged.filters.excluded && typeof merged.filters.excluded === 'object' ? merged.filters.excluded : {};
      const excluded = {
        categories: Array.isArray(exIn.categories) ? exIn.categories.map(v => String(v || '').trim()).filter(Boolean) : [],
        subcategories: Array.isArray(exIn.subcategories) ? exIn.subcategories.map(v => String(v || '').trim()).filter(Boolean) : [],
        channels: Array.isArray(exIn.channels) ? exIn.channels.map(v => String(v || '').trim()).filter(Boolean) : []
      };
      if (legacyTrendExcluded.length && excluded.subcategories.length === 0) excluded.subcategories = legacyTrendExcluded;
      const apIn = merged.filters.applyTo && typeof merged.filters.applyTo === 'object' ? merged.filters.applyTo : {};
      const apBase = base.filters.applyTo || {};
      const applyTo = {
        trend: apIn.trend !== false,
        heatmap: apIn.heatmap !== false,
        pie: apIn.pie !== false,
        topN: apIn.topN !== false,
        table: apIn.table === true,
        cards: apIn.cards === true
      };
      merged.filters.excluded = excluded;
      merged.filters.applyTo = Object.assign({}, apBase, applyTo);
      try { delete merged.filters.trendExcludedSubcategories; } catch (_) {}

      merged.budgets = merged.budgets && typeof merged.budgets === 'object' ? merged.budgets : {};
      merged.budgets.monthlyTotal = Number(merged.budgets.monthlyTotal || 0) || 0;
      merged.budgets.categoryMonthly = merged.budgets.categoryMonthly && typeof merged.budgets.categoryMonthly === 'object' ? merged.budgets.categoryMonthly : {};
      merged.budgets.savingsRateTarget = Number(merged.budgets.savingsRateTarget || 0) || 0;
      merged.budgets.debtPaymentTarget = Number(merged.budgets.debtPaymentTarget || 0) || 0;

      merged.performance = merged.performance && typeof merged.performance === 'object' ? merged.performance : {};
      merged.performance.cacheEnabled = merged.performance.cacheEnabled !== false;
      merged.performance.cacheFile = String(merged.performance.cacheFile || base.performance.cacheFile || '财务看板.index.json').trim();
      merged.performance.maxFiles = Number(merged.performance.maxFiles || base.performance.maxFiles || 5000) || 5000;

      if (out.dateRangeCache && typeof out.dateRangeCache === 'object') {
        merged.dateRangeCache = {
          startDate: String(out.dateRangeCache.startDate || '').trim(),
          endDate: String(out.dateRangeCache.endDate || '').trim(),
          periodType: String(out.dateRangeCache.periodType || 'month').trim()
        };
      }

      return merged;
    },
    async load(configPath) {
      const adapter = app?.vault?.adapter;
      const fallback = this.defaultConfig();
      if (!adapter || !configPath) return this.normalizeConfig(fallback);
      const p = String(configPath || '').trim();
      try {
        const exists = await adapter.exists(p);
        if (!exists) {
          await adapter.write(p, JSON.stringify(fallback, null, 2));
          return this.normalizeConfig(fallback);
        }
        const content = await adapter.read(p);
        const parsed = JSON.parse(content || '{}');
        return this.normalizeConfig(parsed);
      } catch (_) {
        try { await adapter.write(p, JSON.stringify(fallback, null, 2)); } catch (_) {}
        return this.normalizeConfig(fallback);
      }
    },
    async save(configPath, cfg) {
      const adapter = app?.vault?.adapter;
      if (!adapter || !configPath) return;
      const normalized = this.normalizeConfig(cfg);
      await adapter.write(String(configPath).trim(), JSON.stringify(normalized, null, 2));
    }
  },

  _listFilesFromSources: async function(cfg) {
    const sources = Array.isArray(cfg?.sources) ? cfg.sources : [];
    const excludes = Array.isArray(cfg?.excludePathIncludes) ? cfg.excludePathIncludes : [];
    const out = [];
    const shouldExclude = (path) => excludes.some(x => x && String(path).includes(String(x)));

    const walkFolder = (folder) => {
      const children = folder?.children || [];
      for (const ch of children) {
        if (!ch) continue;
        if (ch.children) walkFolder(ch);
        else if (ch.extension === 'md' && !shouldExclude(ch.path)) out.push(ch);
      }
    };

    for (const s of sources) {
      if (!s || s.enabled === false || !s.path) continue;
      const af = app?.vault?.getAbstractFileByPath?.(s.path);
      if (!af) continue;
      if (af.extension === 'md' || (s.type === 'csv' && af.extension === 'csv')) {
        if (!shouldExclude(af.path)) out.push(af);
      } else if (af.children) {
        walkFolder(af);
      }
    }
    return out;
  },

  _resolveCachePath: function(cfg) {
    const p = String(cfg?.performance?.cacheFile || '').trim();
    if (!p) return '';
    if (p.includes('/')) return p;
    const base = String(window.FinanceVizKit?.__configPath || '').trim();
    if (!base) return p;
    const dir = base.split('/').slice(0, -1).join('/');
    return `${dir}/${p}`;
  },

  _getConfigSig: function(cfg) {
    try {
      return JSON.stringify({ schema: cfg?.schema || {}, normalization: cfg?.normalization || {} });
    } catch (_) {
      return '';
    }
  },

  _normalizeDate: function(dateStr) {
    if (!dateStr) return '';
    const s = String(dateStr).trim();
    const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!m) return s;
    const year = m[1];
    const month = m[2].padStart(2, '0');
    const day = m[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  _parseDateFromFilename: function(fileName) {
    const m = String(fileName || '').match(/^(\d{2})(\d{2})(\d{2})-/);
    if (!m) return '';
    const year = `20${m[1]}`;
    const month = m[2];
    const day = m[3];
    return this._normalizeDate(`${year}-${month}-${day}`);
  },

  _parseFrontmatterBill: function(file, txt, cfg) {
    const normalizedTxt = String(txt || '').replace(/\r\n/g, '\n');
    const match = normalizedTxt.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;
    let fm = {};
    try { fm = (app.metadataCache.getFileCache && app.metadataCache.getFileCache(file))?.frontmatter || {}; } catch (_) { fm = {}; }

    const f = cfg?.schema?.fields || {};
    const typeKey = f.type || 'type';
    const categoryKey = f.category || 'category';
    const subcategoryKey = f.subcategory || 'subcategory';
    const amountKey = f.amount || 'amount';
    const channelKey = f.channel || 'channel';
    const dateKey = f.date || 'date';
    const descFallbackKey = f.descriptionFallback || 'description';

    let d = fm[dateKey];
    if (!d && cfg?.schema?.dateFallback?.fromFilename) d = this._parseDateFromFilename(file?.name);
    if (!d) return null;

    let amt = Number(fm[amountKey]);
    if (!Number.isFinite(amt)) {
      amt = parseFloat((match[1].match(new RegExp(`${amountKey}:\\\\s*([\\\\d.]+)`)) || [])[1] || 0);
    }

    let type = String(fm[typeKey] || '支出').trim();
    const amountMode = cfg?.schema?.amountSign?.mode || 'byType';
    if (amountMode === 'signed' && Number.isFinite(amt)) {
      if (amt < 0) type = '支出';
      if (amt > 0 && type !== '支出') type = '收入';
    }

    let category = String(fm[categoryKey] || '未分类').trim();
    const catAlias = cfg?.normalization?.categoryAlias || {};
    if (catAlias[category]) category = String(catAlias[category]);

    const subcategory = String(fm[subcategoryKey] || fm[descFallbackKey] || '').trim();

    let channel = String(fm[channelKey] || '未知').trim();
    const acctAlias = cfg?.normalization?.accountAlias || {};
    if (acctAlias[channel]) channel = String(acctAlias[channel]);

    const rawInput = (normalizedTxt.match(/\*\*原始输入：\*\*\s*([\s\S]*?)\n/) || [])[1] || '';
    const note = String(fm.note || '').trim();

    return {
      date: this._normalizeDate(String(d).trim()),
      type,
      category,
      subcategory,
      channel,
      amount: Math.abs(Number.isFinite(amt) ? amt : 0),
      path: file?.path || '',
      rawInput: String(rawInput || '').trim(),
      note
    };
  },

  _parseCsv: function(text, delimiter) {
    const d = delimiter || ',';
    const rows = [];
    let row = [];
    let cur = '';
    let inQuotes = false;
    const s = String(text || '');
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (inQuotes) {
        if (ch === '"') {
          if (s[i + 1] === '"') { cur += '"'; i++; }
          else inQuotes = false;
        } else {
          cur += ch;
        }
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === d) { row.push(cur); cur = ''; }
        else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
        else if (ch !== '\r') cur += ch;
      }
    }
    row.push(cur);
    rows.push(row);
    return rows;
  },

  _parseCsvBills: function(file, txt, cfg) {
    if (!cfg?.schema?.csv?.enabled) return [];
    const delimiter = cfg?.schema?.csv?.delimiter || ',';
    const rows = this._parseCsv(txt, delimiter).filter(r => r.some(x => String(x || '').trim()));
    if (rows.length === 0) return [];
    const hasHeader = cfg?.schema?.csv?.hasHeader !== false;
    let header = [];
    let start = 0;
    if (hasHeader) {
      header = rows[0].map(h => String(h || '').trim());
      start = 1;
    } else {
      header = rows[0].map((_, i) => `col${i}`);
    }

    const col = cfg?.schema?.csv?.columns || {};
    const findIdx = (name) => header.findIndex(h => h === name);
    const idx = {
      date: findIdx(col.date || 'date'),
      type: findIdx(col.type || 'type'),
      category: findIdx(col.category || 'category'),
      subcategory: findIdx(col.subcategory || 'subcategory'),
      amount: findIdx(col.amount || 'amount'),
      channel: findIdx(col.channel || 'channel'),
      description: findIdx(col.description || 'description')
    };

    const bills = [];
    for (let i = start; i < rows.length; i++) {
      const r = rows[i];
      const d = idx.date >= 0 ? String(r[idx.date] || '').trim() : '';
      if (!d) continue;
      const amtRaw = idx.amount >= 0 ? Number(String(r[idx.amount] || '').replace(/[, ]/g, '')) : 0;
      let type = idx.type >= 0 ? String(r[idx.type] || '').trim() : '';
      if (!type) type = amtRaw < 0 ? '支出' : '收入';
      const amountMode = cfg?.schema?.amountSign?.mode || 'byType';
      if (amountMode === 'signed') type = amtRaw < 0 ? '支出' : (type === '支出' ? '支出' : '收入');

      let category = idx.category >= 0 ? String(r[idx.category] || '').trim() : '未分类';
      const catAlias = cfg?.normalization?.categoryAlias || {};
      if (catAlias[category]) category = String(catAlias[category]);

      const subcategory = idx.subcategory >= 0 ? String(r[idx.subcategory] || '').trim() : '';
      let channel = idx.channel >= 0 ? String(r[idx.channel] || '').trim() : '未知';
      const acctAlias = cfg?.normalization?.accountAlias || {};
      if (acctAlias[channel]) channel = String(acctAlias[channel]);

      const desc = idx.description >= 0 ? String(r[idx.description] || '').trim() : '';
      bills.push({
        date: this._normalizeDate(d),
        type,
        category,
        subcategory: subcategory || desc,
        channel,
        amount: Math.abs(Number.isFinite(amtRaw) ? amtRaw : 0),
        path: file?.path || '',
        rawInput: '',
        note: desc
      });
    }
    return bills;
  },

  _parseLedgerBills: function(file, txt, cfg) {
    if (!cfg?.schema?.ledger?.enabled) return [];
    const src = String(cfg?.schema?.ledger?.regex || '').trim();
    if (!src) return [];
    let re;
    try { re = new RegExp(src, 'g'); } catch (_) { return []; }
    const bills = [];
    const catAlias = cfg?.normalization?.categoryAlias || {};
    const acctAlias = cfg?.normalization?.accountAlias || {};
    const amountMode = cfg?.schema?.amountSign?.mode || 'byType';
    let m;
    while ((m = re.exec(String(txt || ''))) !== null) {
      const g = m.groups || {};
      const date = String(g.date || m[1] || '').trim();
      if (!date) continue;
      let type = String(g.type || m[2] || '').trim() || '支出';
      let category = String(g.category || m[3] || '').trim() || '未分类';
      if (catAlias[category]) category = String(catAlias[category]);
      const subcategory = String(g.subcategory || m[4] || '').trim();
      let channel = String(g.channel || m[6] || '').trim() || '未知';
      if (acctAlias[channel]) channel = String(acctAlias[channel]);
      const amtRaw = Number(String(g.amount || m[5] || '0').replace(/[, ]/g, ''));
      if (amountMode === 'signed' && Number.isFinite(amtRaw)) type = amtRaw < 0 ? '支出' : (type === '支出' ? '支出' : '收入');
      bills.push({
        date: this._normalizeDate(date),
        type,
        category,
        subcategory,
        channel,
        amount: Math.abs(Number.isFinite(amtRaw) ? amtRaw : 0),
        path: file?.path || '',
        rawInput: String(g.raw || '').trim(),
        note: String(g.note || '').trim()
      });
    }
    return bills;
  },

  getBillData: async function(cfg) {
    const effectiveCfg = cfg && typeof cfg === 'object' ? cfg : (window.FinanceVizKit?.__config || window.FinanceVizKit.config.defaultConfig());
    const adapter = app?.vault?.adapter;
    const filesAll = await this._listFilesFromSources(effectiveCfg);
    if (!filesAll.length) return [];

    let files = filesAll.slice();
    const maxFiles = Number(effectiveCfg?.performance?.maxFiles || 0) || 0;
    if (maxFiles > 0 && files.length > maxFiles) {
      files = files
        .slice()
        .sort((a, b) => (b?.stat?.mtime || 0) - (a?.stat?.mtime || 0))
        .slice(0, maxFiles);
    }

    const cacheEnabled = effectiveCfg?.performance?.cacheEnabled !== false;
    const cachePath = cacheEnabled ? this._resolveCachePath(effectiveCfg) : '';
    const sig = this._getConfigSig(effectiveCfg);
    let cache = { version: 1, sig, files: {} };
    if (cacheEnabled && adapter && cachePath) {
      try {
        const exists = await adapter.exists(cachePath);
        if (exists) {
          const raw = await adapter.read(cachePath);
          const parsed = JSON.parse(raw || '{}');
          if (parsed && parsed.files && parsed.sig === sig) cache = parsed;
        }
      } catch (_) {}
    }
    if (!cache.files || typeof cache.files !== 'object') cache.files = {};

    const bills = [];
    let dirty = false;
    const alive = new Set();

    for (const f of files) {
      if (!f || !f.path) continue;
      alive.add(f.path);
      const mtime = Number(f?.stat?.mtime || 0) || 0;
      const cached = cache.files[f.path];
      if (cacheEnabled && cached && cached.mtime === mtime && Array.isArray(cached.items)) {
        bills.push(...cached.items);
        continue;
      }

      let txt = '';
      try { txt = await app.vault.read(f); } catch (_) { continue; }

      let items = [];
      if (f.extension === 'csv') items = this._parseCsvBills(f, txt, effectiveCfg);
      else {
        if (effectiveCfg?.schema?.ledger?.enabled && String(effectiveCfg?.schema?.ledger?.regex || '').trim()) {
          items = this._parseLedgerBills(f, txt, effectiveCfg);
        }
        if (!items || items.length === 0) {
          const it = this._parseFrontmatterBill(f, txt, effectiveCfg);
          if (it) items = [it];
        }
      }

      bills.push(...items);
      if (cacheEnabled) {
        cache.files[f.path] = { mtime, items };
        dirty = true;
      }
    }

    if (cacheEnabled) {
      const keys = Object.keys(cache.files);
      for (const k of keys) {
        if (!alive.has(k)) {
          delete cache.files[k];
          dirty = true;
        }
      }
    }

    if (cacheEnabled && dirty && adapter && cachePath) {
      try {
        cache.version = 1;
        cache.sig = sig;
        await adapter.write(cachePath, JSON.stringify(cache, null, 2));
      } catch (_) {}
    }

    return bills;
  },

  render: {
    CONFIG: {
        FONT_SCALE: "12px",
        COLUMN_WIDTHS: {
            DATE: "15%",
            CATEGORY: "19%",
            CONTENT: "25%",
            CHANNEL: "19%",
            AMOUNT: "22%"
        }
    },

    _getFilters(cfg) {
        const Kit = window.FinanceVizKit;
        const base = Kit?.config?.defaultConfig?.()?.filters || {
            excluded: { categories: [], subcategories: [], channels: [] },
            applyTo: { trend: true, heatmap: true, pie: true, topN: true, table: false, cards: false }
        };
        const f = cfg && typeof cfg === 'object' && cfg.filters && typeof cfg.filters === 'object' ? cfg.filters : {};
        const legacy = Array.isArray(f.trendExcludedSubcategories) ? f.trendExcludedSubcategories.map(v => String(v || '').trim()).filter(Boolean) : [];
        const ex = f.excluded && typeof f.excluded === 'object' ? f.excluded : {};
        const excluded = {
            categories: Array.isArray(ex.categories) ? ex.categories.map(v => String(v || '').trim()).filter(Boolean) : [],
            subcategories: Array.isArray(ex.subcategories) ? ex.subcategories.map(v => String(v || '').trim()).filter(Boolean) : [],
            channels: Array.isArray(ex.channels) ? ex.channels.map(v => String(v || '').trim()).filter(Boolean) : []
        };
        if (legacy.length && excluded.subcategories.length === 0) excluded.subcategories = legacy;
        const ap = f.applyTo && typeof f.applyTo === 'object' ? f.applyTo : {};
        const applyTo = {
            trend: ap.trend !== false,
            heatmap: ap.heatmap !== false,
            pie: ap.pie !== false,
            topN: ap.topN !== false,
            table: ap.table === true,
            cards: ap.cards === true
        };
        return { excluded: Object.assign({}, base.excluded, excluded), applyTo: Object.assign({}, base.applyTo, applyTo) };
    },

    _filterBills(bills, filterCfg) {
        const Kit = window.FinanceVizKit;
        const excluded = filterCfg?.excluded || {};
        const exCat = new Set((excluded.categories || []).map(v => String(v || '').trim()).filter(Boolean));
        const exSub = new Set((excluded.subcategories || []).map(v => String(v || '').trim()).filter(Boolean));
        const exCh = new Set((excluded.channels || []).map(v => String(v || '').trim()).filter(Boolean));
        const hits = { categories: new Set(), subcategories: new Set(), channels: new Set() };
        const out = [];
        (bills || []).forEach(b => {
            if (!b) return;
            if (b.type !== '支出') { out.push(b); return; }
            const cat = String(b.category || '').trim();
            const sub = String(b.subcategory || '').trim();
            const rawCh = String(b.channel || '').trim();
            const aliCh = String(Kit?.channelAlias ? Kit.channelAlias(rawCh) : rawCh).trim();
            const catHit = cat && exCat.has(cat);
            const subHit = sub && exSub.has(sub);
            const chHit = (rawCh && exCh.has(rawCh)) || (aliCh && exCh.has(aliCh));
            if (catHit || subHit || chHit) {
                if (catHit) hits.categories.add(cat);
                if (subHit) hits.subcategories.add(sub);
                if (chHit) hits.channels.add(aliCh || rawCh);
                return;
            }
            out.push(b);
        });
        return { bills: out, hits };
    },

    _formatFilterHint(hits) {
        const list = [];
        if (hits?.subcategories) list.push(...Array.from(hits.subcategories));
        if (hits?.categories) list.push(...Array.from(hits.categories));
        if (hits?.channels) list.push(...Array.from(hits.channels));
        const uniq = Array.from(new Set(list.map(v => String(v || '').trim()).filter(Boolean)));
        if (!uniq.length) return '';
        return `${uniq.join('、')}已屏蔽`;
    },

    _makeChartHeader(titleText, hintText) {
        const header = document.createElement('div');
        header.className = 'fv-chart-header';
        header.style.justifyContent = 'space-between';
        const title = document.createElement('span');
        title.className = 'fv-chart-title';
        title.textContent = String(titleText || '').trim();
        header.appendChild(title);
        if (hintText) {
            const hint = document.createElement('span');
            hint.style.fontSize = '12px';
            hint.style.color = '#94A3B8';
            hint.style.fontWeight = '700';
            hint.style.maxWidth = '70%';
            hint.style.whiteSpace = 'nowrap';
            hint.style.overflow = 'hidden';
            hint.style.textOverflow = 'ellipsis';
            hint.textContent = hintText;
            hint.title = hintText;
            header.appendChild(hint);
        }
        return header;
    },

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
        
        if (rangeSelector && rangeSelector.open) {
            const triggerBtn = headerEl.querySelector('#fv-date-trigger-btn');
            if (triggerBtn) {
                triggerBtn.onclick = (e) => {
                    e.stopPropagation();
                    rangeSelector.open();
                };
            }
        }
        
        const bodyEl = document.createElement('div');
        bodyEl.className = 'fv-sc-body';
        bodyEl.innerHTML = `
            <div class="fv-stat-box" id="fv-btn-income">
                <div class="fv-stat-title">总收入</div>
                <div class="fv-stat-val val-income">¥${parseInt(totalIn).toLocaleString()}</div>
                <div class="fv-stat-sub">${countIn} 笔</div>
            </div>
            <div class="fv-sc-divider"></div>
            <div class="fv-stat-box" id="fv-btn-net">
                <div class="fv-stat-title">${netLabel || '结余'}</div>
                <div class="fv-stat-val ${net >= 0 ? 'val-surplus' : 'val-deficit'}">¥${parseInt(net).toLocaleString()}</div>
                <div class="fv-stat-sub">${net >= 0 ? '盈余' : '超支'}</div>
            </div>
            <div class="fv-sc-divider"></div>
            <div class="fv-stat-box" id="fv-btn-daily">
                <div class="fv-stat-title">日均消费</div>
                <div class="fv-stat-val">¥${daily}</div>
                <div class="fv-stat-sub">实支 ${activeDays} 天</div>
            </div>
        `;
        card.appendChild(bodyEl);
        
        container.appendChild(card);

        container.querySelector('#fv-btn-income').onclick = () => callbacks.onFilter('收入');
        container.querySelector('#fv-btn-expense').onclick = () => callbacks.onFilter('支出');
    },

    charts(container, bills, allBills, callbacks, flags = {}) {
        const showPie = flags.pie !== false;
        const showHeatmap = flags.heatmap !== false;
        if (!showPie && !showHeatmap) return;

        const cfg = window.FinanceVizKit?.__config || {};
        const filters = this._getFilters(cfg);
        const filtered = this._filterBills(bills, filters);
        const filteredHint = this._formatFilterHint(filtered.hits);

        const makeSubTitle = (text, hintText) => {
            const h = document.createElement('div');
            h.style.display = 'flex';
            h.style.alignItems = 'center';
            h.style.justifyContent = 'space-between';
            h.style.padding = '10px';
            h.style.borderBottom = '1px solid #eee';
            const t = document.createElement('div');
            t.textContent = text;
            t.style.fontWeight = 'bold';
            t.style.fontSize = '12px';
            t.style.textAlign = 'center';
            t.style.color = '#64748B';
            h.appendChild(t);
            if (hintText) {
                const s = document.createElement('div');
                s.textContent = hintText;
                s.title = hintText;
                s.style.fontWeight = '800';
                s.style.fontSize = '11px';
                s.style.color = '#94A3B8';
                s.style.maxWidth = '60%';
                s.style.whiteSpace = 'nowrap';
                s.style.overflow = 'hidden';
                s.style.textOverflow = 'ellipsis';
                h.appendChild(s);
            }
            return h;
        };

        const grid = document.createElement('div');
        grid.className = 'fv-section';
        
        const header = document.createElement('div');
        header.className = 'fv-chart-header';
        header.innerHTML = '<span class="fv-chart-title">结构分析</span>';
        grid.appendChild(header);

        const row = document.createElement('div');
        row.className = 'fv-grid-row';
        grid.appendChild(row);

        let pieBody = null;
        let mapBody = null;

        if (showPie) {
            const pieBills = filters.applyTo.pie ? filtered.bills : bills;
            const pieHint = filters.applyTo.pie ? filteredHint : '';
            const colPie = document.createElement('div');
            colPie.className = 'fv-grid-col';
            colPie.appendChild(makeSubTitle('类别分布图', pieHint));
            pieBody = document.createElement('div');
            pieBody.className = 'fv-chart-body';
            colPie.appendChild(pieBody);
            row.appendChild(colPie);
            pieBody.__fv_bills = pieBills;
        }

        if (showHeatmap) {
            const heatBills = filters.applyTo.heatmap ? filtered.bills : bills;
            const heatHint = filters.applyTo.heatmap ? filteredHint : '';
            const colMap = document.createElement('div');
            colMap.className = 'fv-grid-col';
            colMap.appendChild(makeSubTitle('渠道热力图', heatHint));
            mapBody = document.createElement('div');
            mapBody.className = 'fv-chart-body';
            mapBody.style.overflowY = 'auto';
            colMap.appendChild(mapBody);
            row.appendChild(colMap);
            mapBody.__fv_bills = heatBills;
        }

        container.appendChild(grid);

        requestAnimationFrame(() => {
            if (pieBody) this._renderPie(pieBody, pieBody.__fv_bills || bills, callbacks);
            if (mapBody) this._renderHeatmap(mapBody, mapBody.__fv_bills || bills, allBills, callbacks);
        });
    },

    _renderPie(dom, bills, callbacks) {
        if (!window.echarts) return;
        const M = window.FinanceVizKit.money;
        const catMap = M.aggregateBy(bills.filter(b => b.type === '支出'), b => b.category, b => b.amount);
        const data = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
        if (!data.length) {
            dom.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#94A3B8;font-size:12px;font-weight:700;">无数据（可能被屏蔽）</div>`;
            return;
        }
        
        const themeColors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6'];
        data.forEach((d, i) => {
            if (i < themeColors.length) {
                d.itemStyle = { color: themeColors[i] };
            }
        });

        if (dom.clientHeight === 0) dom.style.height = '320px';

        const myChart = echarts.init(dom);
        const isM = window.innerWidth <= 768;
        
        const option = {
            tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
            legend: { 
                type: 'plain',
                orient: 'horizontal', 
                bottom: 0, 
                left: 'center', 
                width: '100%',
                itemWidth: 10, 
                itemHeight: 10, 
                textStyle: { fontSize: 10, color: '#64748B' },
                formatter: name => {
                    return name.length > 4 ? name.slice(0, 4) : name;
                }
            },
            grid: { bottom: 60 },
            series: [{
                type: 'pie', 
                radius: isM ? ['30%', '50%'] : ['35%', '60%'], 
                center: ['50%', '40%'],
                data: data,
                itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 1 },
                label: { show: false }
            }]
        };
        myChart.setOption(option);
        myChart.on('click', p => callbacks.onCategory(p.name));
        
        setTimeout(() => myChart.resize(), 100);
        window.addEventListener('resize', () => myChart.resize());
    },

    _renderHeatmap(dom, monthBills, allBills, callbacks) {
        const M = window.FinanceVizKit.money;
        const Kit = window.FinanceVizKit;
        
        const allChannelsSet = new Set();
        allBills.forEach(b => { if(b.type === '支出') allChannelsSet.add(Kit.channelAlias(b.channel)); });

        const currentStats = {};
        let maxCount = 0;
        monthBills.filter(b => b.type === '支出').forEach(b => {
            const alias = Kit.channelAlias(b.channel);
            if(!currentStats[alias]) currentStats[alias] = { count: 0, amount: 0 };
            currentStats[alias].count += 1;
            currentStats[alias].amount += M.toCents(b.amount);
            if(currentStats[alias].count > maxCount) maxCount = currentStats[alias].count;
        });

        const renderList = Array.from(allChannelsSet).map(name => ({
            name, count: (currentStats[name]?.count || 0), amount: M.fromCents(currentStats[name]?.amount || 0), isActive: (currentStats[name]?.count > 0)
        })).sort((a, b) => {
            if (a.name === '未知') return 1; if (b.name === '未知') return -1;
            return b.count - a.count;
        });

        dom.style.display = 'grid';
        dom.style.gridTemplateColumns = 'repeat(3, 1fr)';
        dom.style.gap = '6px';
        dom.style.padding = '10px';
        dom.style.alignContent = 'start';

        let activeFilter = null;

        renderList.forEach(item => {
            const box = document.createElement('div');
            box.textContent = item.name;
            box.title = item.isActive ? `支出: ${item.amount} (${item.count}笔)` : '无支出';
            box.style.cssText = `
                aspect-ratio: 2.2; display: flex; align-items: center; justify-content: center;
                font-size: 11px; border-radius: 4px; cursor: pointer; border: 1px solid #eee;
                transition: all 0.2s; color: #ccc; background: #fff;
            `;

            if (item.isActive) {
                const ratio = item.count / maxCount;
                if (ratio > 0.6) { 
                    box.style.background = '#7C3AED';
                    box.style.color = '#fff'; 
                } else if (ratio > 0.3) { 
                    box.style.background = '#8B5CF6';
                    box.style.color = '#fff'; 
                } else if (ratio > 0.1) {
                    box.style.background = '#C4B5FD';
                    box.style.color = '#512E5F';
                } else { 
                    box.style.background = '#F3E8FF';
                    box.style.color = '#512E5F'; 
                }
                box.style.fontWeight = 'bold';
                box.style.border = '1px solid rgba(0,0,0,0.05)';
            }

            box.onclick = () => {
                const isDeactivating = (activeFilter === item.name);
                Array.from(dom.children).forEach(c => { c.style.transform = 'scale(1)'; c.style.boxShadow = 'none'; });
                
                if (isDeactivating) {
                    activeFilter = null; callbacks.onChannel(null);
                } else {
                    activeFilter = item.name;
                    box.style.transform = 'scale(1.05)'; box.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    callbacks.onChannel(item.name);
                }
            };
            dom.appendChild(box);
        });
    },

    trend(container, bills, periodType, startDate, endDate) {
        if (!window.echarts) return;
        const cfg = window.FinanceVizKit?.__config || {};
        const filters = this._getFilters(cfg);
        const filtered = filters.applyTo.trend ? this._filterBills(bills, filters) : { bills, hits: null };
        const hintText = filters.applyTo.trend ? this._formatFilterHint(filtered.hits) : '';

        const sec = document.createElement('div');
        sec.className = 'fv-section';
        sec.appendChild(this._makeChartHeader('趋势', hintText));

        const col = document.createElement('div');
        col.className = 'fv-grid-col';
        col.style.border = '1px solid #F1F5F9';
        const dom = document.createElement('div');
        dom.className = 'fv-chart-body';
        dom.style.height = '260px';
        col.appendChild(dom);
        sec.appendChild(col);
        container.appendChild(sec);

        requestAnimationFrame(() => this._renderTrend(dom, filtered.bills || bills, periodType, startDate, endDate));
    },

    _renderTrend(dom, bills, periodType, startDate, endDate) {
        if (!window.echarts) return;
        const out = (bills || []).filter(b => b && b.type === '支出');
        const map = {};
        out.forEach(b => {
            const d = String(b.date || '').trim();
            if (!d) return;
            const parts = d.split('-');
            if (parts.length < 3) return;
            let key;
            if (periodType === 'year') {
                key = parts[1];
            } else if (periodType === 'month') {
                key = parts[2];
            } else {
                key = d;
            }
            map[key] = (map[key] || 0) + Number(b.amount || 0);
        });

        const keys = Object.keys(map).sort((a, b) => a.localeCompare(b));
        if (!keys.length) {
            dom.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#94A3B8;font-size:12px;font-weight:700;">无趋势数据（可能被屏蔽）</div>`;
            return;
        }

        let labels;
        if (periodType === 'year') {
            labels = keys.map(k => `${k}月`);
        } else if (periodType === 'month') {
            labels = keys.map(k => `${k}日`);
        } else {
            labels = keys.map(k => {
                const parts = k.split('-');
                return `${parts[1]}-${parts[2]}`;
            });
        }
        const values = keys.map(k => Math.round(map[k] || 0));

        const myChart = echarts.init(dom);
        const option = {
            tooltip: { trigger: 'axis' },
            grid: { left: 20, right: 20, top: 20, bottom: 40, containLabel: true },
            xAxis: { type: 'category', data: labels, axisLabel: { color: '#64748B', fontSize: 10, rotate: periodType === 'range' ? 45 : 0 } },
            yAxis: { type: 'value', axisLabel: { color: '#94A3B8', fontSize: 10 }, splitLine: { lineStyle: { color: '#F1F5F9' } } },
            series: [{
                type: 'line',
                data: values,
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                lineStyle: { width: 3, color: '#8B5CF6' },
                itemStyle: { color: '#8B5CF6' },
                areaStyle: { color: 'rgba(139,92,246,0.12)' }
            }]
        };
        myChart.setOption(option);
        setTimeout(() => myChart.resize(), 50);
        window.addEventListener('resize', () => myChart.resize());
    },

    topN(container, bills, callbacks) {
        const cfg = window.FinanceVizKit?.__config || {};
        const filters = this._getFilters(cfg);
        const filtered = filters.applyTo.topN ? this._filterBills(bills, filters) : { bills, hits: null };
        const hintText = filters.applyTo.topN ? this._formatFilterHint(filtered.hits) : '';

        const sec = document.createElement('div');
        sec.className = 'fv-section';
        sec.appendChild(this._makeChartHeader('TopN', hintText));

        const row = document.createElement('div');
        row.className = 'fv-grid-row';
        sec.appendChild(row);

        const box1 = document.createElement('div');
        box1.className = 'fv-grid-col';
        box1.style.padding = '12px';
        box1.innerHTML = `<div style="font-weight:800;font-size:12px;color:#64748B;margin-bottom:8px;text-align:center">支出分类 Top 8</div>`;
        row.appendChild(box1);

        const box2 = document.createElement('div');
        box2.className = 'fv-grid-col';
        box2.style.padding = '12px';
        box2.innerHTML = `<div style="font-weight:800;font-size:12px;color:#64748B;margin-bottom:8px;text-align:center">单笔支出 Top 8</div>`;
        row.appendChild(box2);

        const out = (filtered.bills || bills || []).filter(b => b.type === '支出');
        const M = window.FinanceVizKit.money;
        const byCat = M.aggregateBy(out, b => b.category || '未分类', b => b.amount || 0);
        const catList = Object.entries(byCat).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v).slice(0, 8);

        if (!catList.length) {
            const empty = document.createElement('div');
            empty.style.color = '#94A3B8';
            empty.style.fontSize = '12px';
            empty.style.fontWeight = '700';
            empty.style.padding = '10px';
            empty.style.textAlign = 'center';
            empty.textContent = '无数据（可能被屏蔽）';
            box1.appendChild(empty);
        }
        catList.forEach(item => {
            const it = document.createElement('div');
            it.style.display = 'flex';
            it.style.justifyContent = 'space-between';
            it.style.alignItems = 'center';
            it.style.padding = '6px 8px';
            it.style.borderRadius = '8px';
            it.style.cursor = 'pointer';
            it.onmouseover = () => { it.style.background = '#F8F5FF'; };
            it.onmouseout = () => { it.style.background = 'transparent'; };
            it.onclick = () => callbacks?.onCategory?.(item.k);
            it.innerHTML = `<span style="font-size:12px;color:#111827;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:70%">${item.k}</span><span style="font-size:12px;color:#6D28D9;font-weight:800">¥${parseInt(item.v)}</span>`;
            box1.appendChild(it);
        });

        const topList = out.slice().sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, 8);
        if (!topList.length) {
            const empty = document.createElement('div');
            empty.style.color = '#94A3B8';
            empty.style.fontSize = '12px';
            empty.style.fontWeight = '700';
            empty.style.padding = '10px';
            empty.style.textAlign = 'center';
            empty.textContent = '无数据（可能被屏蔽）';
            box2.appendChild(empty);
        }
        topList.forEach(b => {
            const it = document.createElement('div');
            it.style.display = 'flex';
            it.style.justifyContent = 'space-between';
            it.style.alignItems = 'center';
            it.style.padding = '6px 8px';
            it.style.borderRadius = '8px';
            it.style.cursor = 'pointer';
            it.onmouseover = () => { it.style.background = '#F8F5FF'; };
            it.onmouseout = () => { it.style.background = 'transparent'; };
            it.onclick = () => { try { app.workspace.openLinkText(b.path, '', true); } catch (_) {} };
            const left = (b.subcategory || b.rawInput || b.category || '').toString();
            it.innerHTML = `<span style="font-size:12px;color:#111827;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:70%">${left}</span><span style="font-size:12px;color:#6D28D9;font-weight:800">¥${parseInt(b.amount || 0)}</span>`;
            box2.appendChild(it);
        });

        container.appendChild(sec);
    },

    async main(dv, arg) {
        const Kit = window.FinanceVizKit;
        const M = Kit.money;
        dv.container.innerHTML = "";

        let targetDate = arg;
        let configPath = "";
        if (arg && typeof arg === 'object') {
            targetDate = arg.targetDate || arg.targetYear || arg.period || "";
            configPath = String(arg.configPath || "").trim();
        }

        if (configPath) {
            const cfg = await Kit.config.load(configPath);
            Kit.__config = cfg;
            Kit.__configPath = configPath;
            const ui = cfg.ui || {};
            Kit.render.CONFIG.FONT_SCALE = String(ui.fontScale || Kit.render.CONFIG.FONT_SCALE || "12px").trim();
            const cw = ui.columnWidths || {};
            Kit.render.CONFIG.COLUMN_WIDTHS = Object.assign({}, Kit.render.CONFIG.COLUMN_WIDTHS, cw);
        } else if (!Kit.__config) {
            Kit.__config = Kit.config.defaultConfig();
        }

        const wrapper = document.createElement("div");
        wrapper.className = "fv-container";
        dv.container.appendChild(wrapper);

        const allBills = await Kit.getBillData(Kit.__config);

        let startDate = "";
        let endDate = "";
        let periodType = "month";

        const cachedRange = Kit.__config?.dateRangeCache || null;

        const periodStr = String(targetDate || '').trim();
        const isYear = /^\d{4}$/.test(periodStr);
        const isMonth = /^\d{4}-\d{1,2}$/.test(periodStr);

        if (cachedRange && cachedRange.startDate && cachedRange.endDate) {
            startDate = cachedRange.startDate;
            endDate = cachedRange.endDate;
            periodType = cachedRange.periodType || "month";
        } else if (isYear) {
            startDate = `${periodStr}-01-01`;
            endDate = `${periodStr}-12-31`;
            periodType = "year";
        } else if (isMonth) {
            const [year, month] = periodStr.split('-');
            const monthNum = parseInt(month, 10);
            const lastDay = new Date(parseInt(year), monthNum, 0).getDate();
            startDate = `${year}-${month.padStart(2, '0')}-01`;
            endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`;
            periodType = "month";
        } else {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            const lastDay = new Date(year, month, 0).getDate();
            startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
            periodType = "month";
        }

        const contentArea = document.createElement('div');
        contentArea.className = 'fv-content-area';
        wrapper.appendChild(contentArea);

        let dateRangeModal = null;
        let dateRangeModalCleanup = null;
        let startDateInput, endDateInput;

        const closeDateRangeModal = () => {
            try { dateRangeModalCleanup && dateRangeModalCleanup(); } catch (_) {}
            dateRangeModalCleanup = null;
            if (dateRangeModal && dateRangeModal.parentNode) dateRangeModal.parentNode.removeChild(dateRangeModal);
            dateRangeModal = null;
        };

        const openDateRangeModal = () => {
            closeDateRangeModal();
            
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.3);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 16px;
                box-sizing: border-box;
            `;

            const card = document.createElement('div');
            card.style.cssText = `
                width: 100%;
                max-width: 360px;
                background: #FFFFFF;
                border: 1px solid #E9D5FF;
                border-radius: 12px;
                box-shadow: 0 12px 28px rgba(17, 24, 39, 0.18);
                overflow: hidden;
            `;
            overlay.appendChild(card);

            const header = document.createElement('div');
            header.style.cssText = `padding: 14px 16px; display:flex; justify-content:space-between; align-items:center; background: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%);`;
            const title = document.createElement('div');
            title.textContent = '时间范围设置';
            title.style.cssText = `font-weight: 700; font-size: 14px; color: #FFFFFF;`;
            const closeBtn = document.createElement('div');
            closeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
            closeBtn.style.cssText = `cursor:pointer; color: rgba(255,255,255,0.9); padding: 4px; border-radius: 6px; display:flex; align-items:center; justify-content:center;`;
            closeBtn.onmouseenter = () => closeBtn.style.background = 'rgba(255,255,255,0.15)';
            closeBtn.onmouseleave = () => closeBtn.style.background = 'transparent';
            closeBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); closeDateRangeModal(); };
            header.appendChild(title);
            header.appendChild(closeBtn);
            card.appendChild(header);

            const body = document.createElement('div');
            body.style.cssText = `padding: 16px 20px;`;

            const quickLabel = document.createElement('div');
            quickLabel.textContent = '快捷选择';
            quickLabel.style.cssText = `font-size: 11px; color: #64748B; font-weight: 600; margin-bottom: 10px; text-transform: uppercase; text-align: right;`;
            body.appendChild(quickLabel);

            const quickGroup = document.createElement('div');
            quickGroup.style.cssText = `display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px;`;
            
            const quickButtons = [
                { text: '本月', type: 'month' },
                { text: '上月', type: 'lastMonth' },
                { text: '近3月', type: 'quarter' },
                { text: '本年', type: 'year' }
            ];
            
            quickButtons.forEach(qb => {
                const btn = document.createElement('button');
                btn.textContent = qb.text;
                btn.style.cssText = `padding: 8px 0; background: #F1F5F9; color: #475569; border: 1px solid transparent; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 500; transition: all 0.2s;`;
                btn.onmouseenter = () => { btn.style.background = '#E2E8F0'; btn.style.color = '#0F172A'; };
                btn.onmouseleave = () => { btn.style.background = '#F1F5F9'; btn.style.color = '#475569'; };
                btn.onclick = () => {
                    const today = new Date();
                    let start, end;
                    
                    if (qb.type === 'month') {
                        start = new Date(today.getFullYear(), today.getMonth(), 1);
                        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    } else if (qb.type === 'lastMonth') {
                        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                        end = new Date(today.getFullYear(), today.getMonth(), 0);
                    } else if (qb.type === 'quarter') {
                        start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
                        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    } else if (qb.type === 'year') {
                        start = new Date(today.getFullYear(), 0, 1);
                        end = new Date(today.getFullYear(), 11, 31);
                    }
                    
                    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
                    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
                    
                    startDateInput.value = startStr;
                    endDateInput.value = endStr;
                };
                quickGroup.appendChild(btn);
            });
            body.appendChild(quickGroup);

            const customLabel = document.createElement('div');
            customLabel.textContent = '自定义范围';
            customLabel.style.cssText = `font-size: 11px; color: #64748B; font-weight: 600; margin-bottom: 10px; text-transform: uppercase; text-align: right;`;
            body.appendChild(customLabel);

            const dateRow = document.createElement('div');
            dateRow.style.cssText = `display: flex; align-items: center; gap: 10px;`;
            
            startDateInput = document.createElement('input');
            startDateInput.type = 'date';
            startDateInput.value = startDate || '';
            startDateInput.style.cssText = `flex: 1; padding: 10px 12px 10px 36px; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 13px; color: #1F2937; background: #F8FAFC; outline: none;`;
            startDateInput.onfocus = () => { startDateInput.style.borderColor = '#8B5CF6'; startDateInput.style.background = '#FFFFFF'; };
            startDateInput.onblur = () => { startDateInput.style.borderColor = '#E2E8F0'; startDateInput.style.background = '#F8FAFC'; };
            dateRow.appendChild(startDateInput);
            
            const sep = document.createElement('span');
            sep.textContent = '至';
            sep.style.cssText = `color: #94A3B8; font-size: 13px; font-weight: 500;`;
            dateRow.appendChild(sep);
            
            endDateInput = document.createElement('input');
            endDateInput.type = 'date';
            endDateInput.value = endDate || '';
            endDateInput.style.cssText = `flex: 1; padding: 10px 12px 10px 36px; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 13px; color: #1F2937; background: #F8FAFC; outline: none;`;
            endDateInput.onfocus = () => { endDateInput.style.borderColor = '#8B5CF6'; endDateInput.style.background = '#FFFFFF'; };
            endDateInput.onblur = () => { endDateInput.style.borderColor = '#E2E8F0'; endDateInput.style.background = '#F8FAFC'; };
            dateRow.appendChild(endDateInput);
            
            body.appendChild(dateRow);
            card.appendChild(body);

            const footer = document.createElement('div');
            footer.style.cssText = `padding: 12px 16px; display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #F1F5F9; background:#FAFAFA;`;
            
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.textContent = '取消';
            cancelBtn.style.cssText = `border: 1px solid #E2E8F0; background:#FFFFFF; color:#64748B; border-radius: 8px; padding: 8px 16px; font-size: 12px; cursor:pointer; font-weight: 600;`;
            cancelBtn.onclick = () => closeDateRangeModal();
            footer.appendChild(cancelBtn);

            const applyBtn = document.createElement('button');
            applyBtn.type = 'button';
            applyBtn.textContent = '确认应用';
            applyBtn.style.cssText = `border: none; background: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%); color:#FFFFFF; border-radius: 8px; padding: 8px 20px; font-size: 12px; cursor:pointer; font-weight: 700;`;
            applyBtn.onclick = async () => {
                const newStart = startDateInput.value;
                const newEnd = endDateInput.value;
                if (!newStart || !newEnd) return;
                
                startDate = newStart;
                endDate = newEnd;
                const start = new Date(startDate);
                const end = new Date(endDate);
                const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                if (diffMonths >= 11) periodType = "year";
                else if (diffMonths >= 2) periodType = "range";
                else periodType = "month";
                
                const savePath = configPath || Kit.__configPath;
                if (savePath && Kit.__config) {
                    Kit.__config.dateRangeCache = { startDate, endDate, periodType };
                    try {
                        await Kit.config.save(savePath, Kit.__config);
                    } catch (e) {
                        console.error('Failed to save date range cache:', e);
                    }
                }
                
                closeDateRangeModal();
                renderDashboard();
            };
            footer.appendChild(applyBtn);
            card.appendChild(footer);

            const onOverlayClick = (e) => {
                if (e.target === overlay) closeDateRangeModal();
            };
            const onEscape = (e) => {
                if (e.key === 'Escape') closeDateRangeModal();
            };
            
            overlay.addEventListener('mousedown', onOverlayClick, true);
            document.addEventListener('keydown', onEscape, true);
            
            dateRangeModalCleanup = () => {
                overlay.removeEventListener('mousedown', onOverlayClick, true);
                document.removeEventListener('keydown', onEscape, true);
            };
            
            dateRangeModal = overlay;
            document.body.appendChild(overlay);
        };

        const rangeSelectorEl = { open: openDateRangeModal };

        const renderDashboard = async () => {
            closeDateRangeModal();
            contentArea.innerHTML = "";
            
            const start = startDate;
            const end = endDate;
            
            if (!start || !end) {
                contentArea.innerHTML = `<div class="fv-super-card"><div class="fv-sc-header"><h2>请选择时间范围</h2></div></div>`;
                return;
            }

            const periodBills = Kit.filterBillsByDateRange(allBills, start, end);
            const viewCfg = (Kit.__config?.views && Kit.__config.views[periodType]) ? Kit.__config.views[periodType] : Kit.config.defaultConfig().views[periodType];
            const filters = this._getFilters(Kit.__config || {});
            const filteredPeriod = this._filterBills(periodBills, filters);
            const cardsBills = filters.applyTo.cards ? filteredPeriod.bills : periodBills;

            const startParts = start.split('-');
            const endParts = end.split('-');
            let periodLabel = '';
            if (start === end) {
                periodLabel = start;
            } else if (startParts[0] === endParts[0] && startParts[1] === endParts[1]) {
                periodLabel = `${startParts[0]}年${startParts[1]}月`;
            } else if (startParts[0] === endParts[0]) {
                periodLabel = `${startParts[0]}年`;
            } else {
                periodLabel = `${start} ~ ${end}`;
            }

            if (periodBills.length === 0) {
                contentArea.innerHTML = `<div class="fv-super-card"><div class="fv-sc-header"><h2>${periodLabel} 无数据</h2></div></div>`;
                return;
            }

            const incomes = cardsBills.filter(b => b.type === '收入');
            const expenses = cardsBills.filter(b => b.type === '支出');
            const totalIn = M.sum(incomes.map(b => b.amount));
            const totalOut = M.sum(expenses.map(b => b.amount));
            const net = M.sub(totalIn, totalOut);

            const activeDateSet = new Set(expenses.map(b => b.date));
            const activeDays = activeDateSet.size;
            const daily = activeDays > 0 ? (totalOut / activeDays).toFixed(0) : 0;

            let tableController = null;
            const callbacks = {
                onFilter: (type) => { if(tableController) { const v = tableController.setFilter('type', type); if(v) new Notice(`💰 只看${type}`); } },
                onCategory: (cat) => { if(tableController) { const v = tableController.setFilter('category', cat); if(v) new Notice(`🔍 分类: ${cat}`); } },
                onChannel: (chn) => { if(tableController) { const v = tableController.setFilter('channel', chn); if(v) new Notice(`💳 渠道: ${chn}`); } }
            };

            let budgetLine = "";
            const budgetTotal = Number(Kit.__config?.budgets?.monthlyTotal || 0) || 0;
            const monthsInRange = Math.ceil(activeDays / 30);
            const adjustedBudget = budgetTotal * monthsInRange;
            if (periodType !== 'year' && viewCfg?.cards?.showBudget !== false && adjustedBudget > 0) {
                const diff = adjustedBudget - totalOut;
                if (diff >= 0) budgetLine = `预算 ¥${parseInt(adjustedBudget)} | 剩余 ¥${parseInt(diff)}`;
                else budgetLine = `预算 ¥${parseInt(adjustedBudget)} | 超支 ¥${parseInt(Math.abs(diff))}`;
            }

            this.header(contentArea, {
                dateStr: periodLabel,
                totalIn,
                totalOut,
                net,
                daily,
                activeDays,
                countIn: incomes.length,
                countOut: expenses.length,
                periodLabel: periodType === 'year' ? '本年' : (periodType === 'month' ? '本月' : '期间'),
                netLabel: periodType === 'year' ? '年度结余' : (periodType === 'month' ? '月度结余' : '期间结余'),
                budgetLine,
                startDate: start,
                endDate: end
            }, callbacks, rangeSelectorEl);

            await Kit.initECharts();
            if (viewCfg?.charts) {
                this.charts(contentArea, periodBills, allBills, callbacks, { pie: viewCfg.charts.pie, heatmap: viewCfg.charts.heatmap });
                if (viewCfg.charts.trend) this.trend(contentArea, periodBills, periodType, start, end);
                if (viewCfg.charts.topN) this.topN(contentArea, periodBills, callbacks);
            }

            if (viewCfg?.table?.enabled !== false) {
                const tableSection = document.createElement('div');
                tableSection.className = 'fv-section-wide';
                tableSection.innerHTML = `<div class="fv-chart-header"><span class="fv-chart-title">账单明细</span></div>`;
                const tableBody = document.createElement('div');
                tableSection.appendChild(tableBody);
                contentArea.appendChild(tableSection);

                const tableBills = filters.applyTo.table ? filteredPeriod.bills : periodBills;
                tableController = Kit.createSmartTable({ container: tableBody }, tableBills, {
                    contentMode: viewCfg?.table?.contentMode || 'subcategory',
                    defaultSort: viewCfg?.table?.defaultSort || 'date_desc'
                });
            }
        };

        await renderDashboard();
    },

    async config(dv, opts = {}) {
        const Kit = window.FinanceVizKit;
        dv.container.innerHTML = "";

        const configPath = String(opts?.configPath || "").trim();
        let cfg = await Kit.config.load(configPath);
        Kit.__config = cfg;
        Kit.__configPath = configPath;

        const root = document.createElement("div");
        root.className = "fv-container";
        dv.container.appendChild(root);

        const card = document.createElement("div");
        card.className = "fv-super-card";
        root.appendChild(card);

        const header = document.createElement("div");
        header.className = "fv-sc-header";
        header.innerHTML = `<div class="fv-sc-title-area"><h2>财务看板配置</h2><p>配置来源、显示与归一化规则 · 所有更改即时生效</p></div>`;
        card.appendChild(header);

        const body = document.createElement("div");
        body.style.padding = "14px 16px";
        card.appendChild(body);

        const saveConfig = async () => {
            try {
                await Kit.config.save(configPath, cfg);
                cfg = await Kit.config.load(configPath);
                Kit.__config = cfg;
                return true;
            } catch (e) {
                try { new Notice(`❌ 保存失败：${e.message || e}`); } catch (_) {}
                return false;
            }
        };

        let toastTimeout = null;
        const showSaveToast = () => {
            const existing = document.querySelector(".td-save-toast");
            if (existing) existing.remove();
            if (toastTimeout) clearTimeout(toastTimeout);
            
            const toast = document.createElement("div");
            toast.className = "td-save-toast";
            toast.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>已保存</span>
            `;
            document.body.appendChild(toast);
            
            toastTimeout = setTimeout(() => {
                toast.classList.add("fade-out");
                setTimeout(() => toast.remove(), 300);
            }, 1800);
        };

        const markChanged = async () => { 
            const success = await saveConfig();
            if (success) showSaveToast();
        };

        const section = (title, desc, collapsible = false, defaultCollapsed = false) => {
            const container = document.createElement("div");
            
            if (collapsible) {
                container.className = "fv-collapsible-section" + (defaultCollapsed ? " collapsed" : "");
                body.appendChild(container);
                
                const header = document.createElement("div");
                header.className = "fv-collapsible-header";
                header.innerHTML = `
                    <svg class="fv-collapsible-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                    <span class="fv-collapsible-title">${title}</span>
                    <span class="fv-collapsible-desc">${desc}</span>
                `;
                container.appendChild(header);
                
                const box = document.createElement("div");
                box.className = "fv-collapsible-body";
                container.appendChild(box);
                
                header.onclick = () => {
                    container.classList.toggle("collapsed");
                };
                
                return box;
            }
            
            const divider = document.createElement("div");
            divider.className = "fv-config-divider";
            body.appendChild(divider);
            
            body.appendChild(container);
            
            const h = document.createElement("div");
            h.className = "fv-config-section-title";
            h.textContent = title;
            container.appendChild(h);
            
            const p = document.createElement("div");
            p.className = "fv-config-section-desc";
            p.textContent = desc;
            container.appendChild(p);
            
            const box = document.createElement("div");
            box.className = "fv-config-section-body";
            container.appendChild(box);
            return box;
        };

        const makeRow = (host, labelText) => {
            const row = document.createElement("div");
            row.style.display = "grid";
            row.style.gridTemplateColumns = "110px 1fr";
            row.style.gap = "10px";
            row.style.alignItems = "center";
            row.style.margin = "8px 0";
            const label = document.createElement("div");
            label.textContent = labelText;
            label.style.fontSize = "12px";
            label.style.fontWeight = "800";
            label.style.color = "#64748B";
            row.appendChild(label);
            const right = document.createElement("div");
            row.appendChild(right);
            host.appendChild(row);
            return right;
        };

        const makeInput = (value, placeholder) => {
            const input = document.createElement("input");
            input.type = "text";
            input.value = String(value || "");
            input.placeholder = placeholder || "";
            input.style.width = "100%";
            input.style.border = "1px solid #E2E8F0";
            input.style.borderRadius = "10px";
            input.style.padding = "6px 10px";
            input.style.fontSize = "12px";
            return input;
        };

        const makeSelect = (value, options) => {
            const sel = document.createElement("select");
            sel.style.width = "100%";
            sel.style.border = "1px solid #E2E8F0";
            sel.style.borderRadius = "10px";
            sel.style.padding = "6px 10px";
            sel.style.fontSize = "12px";
            options.forEach(o => {
                const opt = document.createElement("option");
                opt.value = o.value;
                opt.text = o.label;
                sel.appendChild(opt);
            });
            sel.value = value;
            return sel;
        };

        const makeBtn = (text, kind) => {
            const btn = document.createElement("button");
            btn.textContent = text;
            btn.style.border = "1px solid #E2E8F0";
            btn.style.borderRadius = "10px";
            btn.style.padding = "6px 10px";
            btn.style.cursor = "pointer";
            btn.style.fontWeight = "800";
            btn.style.fontSize = "12px";
            btn.style.background = "#FFFFFF";
            btn.style.color = "#111827";
            if (kind === "primary") {
                btn.style.borderColor = "#DDD6FE";
                btn.style.background = "#8B5CF6";
                btn.style.color = "#fff";
            }
            if (kind === "danger") {
                btn.style.borderColor = "#FECACA";
                btn.style.background = "#FEF2F2";
                btn.style.color = "#EF4444";
            }
            return btn;
        };

        const makeSegmentedControl = (options, currentValue, onChange) => {
            const wrap = document.createElement("div");
            wrap.className = "sip-segmented-control";
            wrap.style.cssText = "display:inline-flex;background:var(--sip-primary-tint-1, rgba(186,168,254,0.05));border-radius:10px;padding:3px;width:fit-content;border:1px solid var(--sip-primary-muted, rgba(186,168,254,0.15));";
            
            const updateAll = () => {
                wrap.querySelectorAll("button").forEach(btn => {
                    const isActive = btn.dataset.value === currentValue;
                    if (isActive) {
                        btn.style.background = "#9f7aea";
                        btn.style.color = "#fff";
                        btn.style.boxShadow = "0 2px 8px rgba(159,122,234,0.4)";
                        btn.style.fontWeight = "600";
                    } else {
                        btn.style.background = "transparent";
                        btn.style.color = "var(--text-muted, #64748b)";
                        btn.style.boxShadow = "none";
                        btn.style.fontWeight = "500";
                    }
                });
            };
            
            options.forEach(opt => {
                const btn = document.createElement("button");
                btn.textContent = opt.label;
                btn.dataset.value = opt.value;
                btn.style.cssText = "padding:6px 14px;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:500;transition:all 0.2s ease;color:var(--text-muted, #64748b);";
                btn.onmouseenter = () => {
                    if (btn.dataset.value !== currentValue) {
                        btn.style.background = "var(--sip-primary-tint-2, rgba(186,168,254,0.1))";
                    }
                };
                btn.onmouseleave = () => {
                    if (btn.dataset.value !== currentValue) {
                        btn.style.background = "transparent";
                    }
                };
                btn.onclick = () => {
                    if (currentValue !== opt.value) {
                        currentValue = opt.value;
                        updateAll();
                        if (typeof onChange === "function") onChange(opt.value);
                    }
                };
                wrap.appendChild(btn);
            });
            
            updateAll();
            
            wrap.setValue = (val) => {
                currentValue = val;
                updateAll();
            };
            wrap.getValue = () => currentValue;
            
            return wrap;
        };

        const srcBox = section("数据来源（Source）", "选择要纳入统计的目录/账本文件。建议只包含账单数据目录，避免移动端卡顿。", false, false);

        const sourcesWrap = document.createElement("div");
        sourcesWrap.style.border = "1px solid #E2E8F0";
        sourcesWrap.style.borderRadius = "12px";
        sourcesWrap.style.overflow = "hidden";
        srcBox.appendChild(sourcesWrap);

        const renderSources = () => {
            sourcesWrap.innerHTML = "";
            const sources = Array.isArray(cfg.sources) ? cfg.sources : [];
            sources.forEach((s, idx) => {
                const row = document.createElement("div");
                row.style.display = "grid";
                row.style.gridTemplateColumns = "26px 110px 90px 1fr 70px";
                row.style.gap = "8px";
                row.style.alignItems = "center";
                row.style.padding = "10px";
                row.style.borderTop = idx === 0 ? "none" : "1px solid #F1F5F9";
                sourcesWrap.appendChild(row);

                const enabled = document.createElement("input");
                enabled.type = "checkbox";
                enabled.checked = s.enabled !== false;
                enabled.onchange = () => { s.enabled = enabled.checked; markChanged(); };
                row.appendChild(enabled);

                const name = makeInput(s.name, "显示名");
                name.oninput = () => { s.name = name.value; markChanged(); };
                row.appendChild(name);

                const type = makeSelect(s.type === "file" ? "file" : (s.type === "csv" ? "csv" : "folder"), [
                    { value: "folder", label: "目录" },
                    { value: "file", label: "文件" },
                    { value: "csv", label: "CSV" }
                ]);
                type.onchange = () => { s.type = type.value; markChanged(); };
                row.appendChild(type);

                const path = makeInput(s.path, "vault 相对路径");
                path.oninput = () => { s.path = path.value; markChanged(); };
                row.appendChild(path);

                const del = makeBtn("删除", "danger");
                del.onclick = () => {
                    cfg.sources = (cfg.sources || []).filter((_, i) => i !== idx);
                    markChanged();
                    renderSources();
                };
                row.appendChild(del);
            });
        };

        const srcActions = document.createElement("div");
        srcActions.style.display = "flex";
        srcActions.style.gap = "10px";
        srcActions.style.marginTop = "10px";
        srcBox.appendChild(srcActions);

        const btnAdd = makeBtn("新增来源");
        btnAdd.onclick = () => {
            cfg.sources = cfg.sources || [];
            cfg.sources.push({
                id: `s-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                type: "folder",
                path: "",
                name: "",
                enabled: true
            });
            markChanged();
            renderSources();
        };
        srcActions.appendChild(btnAdd);

        const excludeRow = makeRow(srcBox, "排除规则");
        const excludeTa = document.createElement("textarea");
        excludeTa.rows = 3;
        excludeTa.style.width = "100%";
        excludeTa.style.border = "1px solid #E2E8F0";
        excludeTa.style.borderRadius = "10px";
        excludeTa.style.padding = "8px 10px";
        excludeTa.style.fontSize = "12px";
        excludeTa.value = Array.isArray(cfg.excludePathIncludes) ? cfg.excludePathIncludes.join("\n") : "";
        excludeTa.oninput = () => {
            cfg.excludePathIncludes = excludeTa.value.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
            markChanged();
        };
        excludeRow.appendChild(excludeTa);

        const schemaBox = section("数据口径（Schema）", "配置字段名、日期/金额口径，以及 CSV/ledger 解析规则（可选）。默认值兼容现有账单文件格式。", true, false);
        cfg.schema = cfg.schema || {};
        cfg.schema.fields = cfg.schema.fields || {};
        cfg.schema.amountSign = cfg.schema.amountSign || {};
        cfg.schema.dateFallback = cfg.schema.dateFallback || {};
        cfg.schema.ledger = cfg.schema.ledger || {};
        cfg.schema.csv = cfg.schema.csv || {};
        cfg.schema.csv.columns = cfg.schema.csv.columns || {};

        const schemaFieldsRow = makeRow(schemaBox, "字段名");
        const schemaFieldWrap = document.createElement("div");
        schemaFieldWrap.style.display = "grid";
        schemaFieldWrap.style.gridTemplateColumns = "repeat(3, 1fr)";
        schemaFieldWrap.style.gap = "8px";
        schemaFieldsRow.appendChild(schemaFieldWrap);
        const schemaFieldInputs = {};
        [
            { k: "type", p: "type" },
            { k: "category", p: "category" },
            { k: "subcategory", p: "subcategory" },
            { k: "amount", p: "amount" },
            { k: "channel", p: "channel" },
            { k: "date", p: "date" }
        ].forEach(({k, p}) => {
            const i = makeInput(cfg.schema.fields[k] || p, p);
            i.oninput = () => { cfg.schema.fields[k] = i.value; markChanged(); };
            schemaFieldInputs[k] = i;
            schemaFieldWrap.appendChild(i);
        });

        const signRow = makeRow(schemaBox, "金额口径");
        const signCtrl = makeSegmentedControl(
            [{ value: "byType", label: "按type判断" }, { value: "signed", label: "按金额正负" }],
            cfg.schema.amountSign.mode === "signed" ? "signed" : "byType",
            (val) => { cfg.schema.amountSign.mode = val; markChanged(); }
        );
        signRow.appendChild(signCtrl);

        const dateRow = makeRow(schemaBox, "日期推断");
        const dateCtrl = makeSegmentedControl(
            [{ value: "true", label: "从文件名推断" }, { value: "false", label: "仅frontmatter" }],
            cfg.schema.dateFallback.fromFilename === false ? "false" : "true",
            (val) => { cfg.schema.dateFallback.fromFilename = val !== "false"; markChanged(); }
        );
        dateRow.appendChild(dateCtrl);

        const csvRow = makeRow(schemaBox, "CSV 导入");
        const csvWrap = document.createElement("div");
        csvWrap.style.display = "grid";
        csvWrap.style.gridTemplateColumns = "120px 90px 1fr";
        csvWrap.style.gap = "8px";
        csvRow.appendChild(csvWrap);
        const csvEnabled = makeSelect(cfg.schema.csv.enabled === true ? "true" : "false", [
            { value: "false", label: "停用" },
            { value: "true", label: "启用" }
        ]);
        csvEnabled.onchange = () => { cfg.schema.csv.enabled = csvEnabled.value === "true"; markChanged(); };
        csvWrap.appendChild(csvEnabled);
        const csvDelim = makeInput(cfg.schema.csv.delimiter || ",", "分隔符");
        csvDelim.oninput = () => { cfg.schema.csv.delimiter = csvDelim.value; markChanged(); };
        csvWrap.appendChild(csvDelim);
        const csvHeader = makeSelect(cfg.schema.csv.hasHeader === false ? "false" : "true", [
            { value: "true", label: "首行是表头" },
            { value: "false", label: "无表头" }
        ]);
        csvHeader.onchange = () => { cfg.schema.csv.hasHeader = csvHeader.value !== "false"; markChanged(); };
        csvWrap.appendChild(csvHeader);

        const ledgerRow = makeRow(schemaBox, "Ledger 正则");
        const ledgerWrap = document.createElement("div");
        ledgerWrap.style.display = "grid";
        ledgerWrap.style.gridTemplateColumns = "90px 1fr";
        ledgerWrap.style.gap = "8px";
        ledgerRow.appendChild(ledgerWrap);
        const ledgerEnabled = makeSelect(cfg.schema.ledger.enabled === true ? "true" : "false", [
            { value: "false", label: "停用" },
            { value: "true", label: "启用" }
        ]);
        ledgerEnabled.onchange = () => { cfg.schema.ledger.enabled = ledgerEnabled.value === "true"; markChanged(); };
        ledgerWrap.appendChild(ledgerEnabled);
        const ledgerRegex = makeInput(cfg.schema.ledger.regex || "", "正则（预留）");
        ledgerRegex.oninput = () => { cfg.schema.ledger.regex = ledgerRegex.value; markChanged(); };
        ledgerWrap.appendChild(ledgerRegex);

        const displayBox = section("显示", "配置表格字号与列宽，适配不同设备与屏幕。", true, true);
        cfg.ui = cfg.ui || {};
        const rowFont = makeRow(displayBox, "表格字号");
        const fontScale = makeInput(cfg.ui.fontScale, "例如 12px");
        fontScale.oninput = () => { cfg.ui.fontScale = fontScale.value; markChanged(); };
        rowFont.appendChild(fontScale);

        const rowCols = makeRow(displayBox, "列宽");
        const colWrap = document.createElement("div");
        colWrap.style.display = "grid";
        colWrap.style.gridTemplateColumns = "repeat(5, 1fr)";
        colWrap.style.gap = "8px";
        rowCols.appendChild(colWrap);

        const cw = cfg.ui.columnWidths || {};
        const colKeys = [
            { k: "DATE", p: "日期%" },
            { k: "CATEGORY", p: "分类%" },
            { k: "CONTENT", p: "内容%" },
            { k: "CHANNEL", p: "渠道%" },
            { k: "AMOUNT", p: "金额%" }
        ];
        const colInputs = {};
        colKeys.forEach(({k, p}) => {
            const i = makeInput(cw[k] || "", p);
            i.oninput = () => {
                cfg.ui.columnWidths = cfg.ui.columnWidths || {};
                cfg.ui.columnWidths[k] = i.value;
                markChanged();
            };
            colInputs[k] = i;
            colWrap.appendChild(i);
        });

        const viewsBox = section("看板视图（Views）", "配置月度/年度看板展示哪些图表与明细表，并设置默认排序与内容展示口径。", true, false);
        cfg.views = cfg.views || {};
        cfg.views.month = cfg.views.month || {};
        cfg.views.month.charts = cfg.views.month.charts || {};
        cfg.views.month.table = cfg.views.month.table || {};
        cfg.views.month.cards = cfg.views.month.cards || {};
        cfg.views.year = cfg.views.year || {};
        cfg.views.year.charts = cfg.views.year.charts || {};
        cfg.views.year.table = cfg.views.year.table || {};
        cfg.views.year.cards = cfg.views.year.cards || {};

        const makeCheck = (labelText, checked, onChange) => {
            const wrap = document.createElement("label");
            wrap.style.display = "inline-flex";
            wrap.style.alignItems = "center";
            wrap.style.gap = "6px";
            wrap.style.fontSize = "12px";
            wrap.style.color = "#374151";
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.checked = !!checked;
            cb.onchange = () => onChange(cb.checked);
            const span = document.createElement("span");
            span.textContent = labelText;
            wrap.appendChild(cb);
            wrap.appendChild(span);
            return { wrap, cb };
        };

        const filtersBox = section("屏蔽规则（Filters）", "可屏蔽规律性大额支出以观察日常开销；并可选择哪些图表应用该屏蔽规则。", true, true);
        cfg.filters = cfg.filters || {};
        cfg.filters.excluded = cfg.filters.excluded || {};
        cfg.filters.applyTo = cfg.filters.applyTo || {};

        const exSubRow = makeRow(filtersBox, "屏蔽子分类");
        const exSubTa = document.createElement("textarea");
        exSubTa.rows = 4;
        exSubTa.style.width = "100%";
        exSubTa.style.border = "1px solid #E2E8F0";
        exSubTa.style.borderRadius = "10px";
        exSubTa.style.padding = "8px 10px";
        exSubTa.style.fontSize = "12px";
        exSubTa.placeholder = "每行一个子分类，例如：\n车贷\n房贷";
        exSubTa.value = Array.isArray(cfg.filters.excluded.subcategories) ? cfg.filters.excluded.subcategories.join("\n") : "";
        exSubTa.oninput = () => { cfg.filters.excluded.subcategories = exSubTa.value.split(/\r?\n/).map(v => v.trim()).filter(Boolean); markChanged(); };
        exSubRow.appendChild(exSubTa);

        const exCatRow = makeRow(filtersBox, "屏蔽分类");
        const exCatTa = document.createElement("textarea");
        exCatTa.rows = 3;
        exCatTa.style.width = "100%";
        exCatTa.style.border = "1px solid #E2E8F0";
        exCatTa.style.borderRadius = "10px";
        exCatTa.style.padding = "8px 10px";
        exCatTa.style.fontSize = "12px";
        exCatTa.placeholder = "每行一个分类，例如：\n交通出行\n居住";
        exCatTa.value = Array.isArray(cfg.filters.excluded.categories) ? cfg.filters.excluded.categories.join("\n") : "";
        exCatTa.oninput = () => { cfg.filters.excluded.categories = exCatTa.value.split(/\r?\n/).map(v => v.trim()).filter(Boolean); markChanged(); };
        exCatRow.appendChild(exCatTa);

        const exChRow = makeRow(filtersBox, "屏蔽渠道");
        const exChTa = document.createElement("textarea");
        exChTa.rows = 3;
        exChTa.style.width = "100%";
        exChTa.style.border = "1px solid #E2E8F0";
        exChTa.style.borderRadius = "10px";
        exChTa.style.padding = "8px 10px";
        exChTa.style.fontSize = "12px";
        exChTa.placeholder = "每行一个渠道，例如：\n微信\n支付宝";
        exChTa.value = Array.isArray(cfg.filters.excluded.channels) ? cfg.filters.excluded.channels.join("\n") : "";
        exChTa.oninput = () => { cfg.filters.excluded.channels = exChTa.value.split(/\r?\n/).map(v => v.trim()).filter(Boolean); markChanged(); };
        exChRow.appendChild(exChTa);

        const applyRow = makeRow(filtersBox, "应用到");
        const applyWrap = document.createElement("div");
        applyWrap.style.display = "grid";
        applyWrap.style.gridTemplateColumns = "repeat(3, 1fr)";
        applyWrap.style.gap = "8px";
        applyRow.appendChild(applyWrap);
        const apTrend = makeCheck("趋势", cfg.filters.applyTo.trend !== false, v => { cfg.filters.applyTo.trend = v; markChanged(); });
        const apHeat = makeCheck("热力", cfg.filters.applyTo.heatmap !== false, v => { cfg.filters.applyTo.heatmap = v; markChanged(); });
        const apPie = makeCheck("饼图", cfg.filters.applyTo.pie !== false, v => { cfg.filters.applyTo.pie = v; markChanged(); });
        const apTopN = makeCheck("TopN", cfg.filters.applyTo.topN !== false, v => { cfg.filters.applyTo.topN = v; markChanged(); });
        const apTable = makeCheck("明细表", cfg.filters.applyTo.table === true, v => { cfg.filters.applyTo.table = v; markChanged(); });
        const apCards = makeCheck("顶部统计", cfg.filters.applyTo.cards === true, v => { cfg.filters.applyTo.cards = v; markChanged(); });
        applyWrap.appendChild(apTrend.wrap);
        applyWrap.appendChild(apHeat.wrap);
        applyWrap.appendChild(apPie.wrap);
        applyWrap.appendChild(apTopN.wrap);
        applyWrap.appendChild(apTable.wrap);
        applyWrap.appendChild(apCards.wrap);

        const viewMonthRow = makeRow(viewsBox, "月度");
        const viewMonthWrap = document.createElement("div");
        viewMonthWrap.style.display = "grid";
        viewMonthWrap.style.gridTemplateColumns = "repeat(2, 1fr)";
        viewMonthWrap.style.gap = "8px";
        viewMonthRow.appendChild(viewMonthWrap);
        const vmPie = makeCheck("饼图", cfg.views.month.charts.pie !== false, v => { cfg.views.month.charts.pie = v; markChanged(); });
        const vmHeat = makeCheck("热力", cfg.views.month.charts.heatmap !== false, v => { cfg.views.month.charts.heatmap = v; markChanged(); });
        const vmTrend = makeCheck("趋势", cfg.views.month.charts.trend !== false, v => { cfg.views.month.charts.trend = v; markChanged(); });
        const vmTop = makeCheck("TopN", cfg.views.month.charts.topN !== false, v => { cfg.views.month.charts.topN = v; markChanged(); });
        viewMonthWrap.appendChild(vmPie.wrap);
        viewMonthWrap.appendChild(vmHeat.wrap);
        viewMonthWrap.appendChild(vmTrend.wrap);
        viewMonthWrap.appendChild(vmTop.wrap);

        const viewMonthRow2 = makeRow(viewsBox, "明细表");
        const vmTableWrap = document.createElement("div");
        vmTableWrap.style.display = "grid";
        vmTableWrap.style.gridTemplateColumns = "90px 1fr 1fr";
        vmTableWrap.style.gap = "8px";
        viewMonthRow2.appendChild(vmTableWrap);
        const vmTableEnabled = makeSelect(cfg.views.month.table.enabled === false ? "false" : "true", [
            { value: "true", label: "启用" },
            { value: "false", label: "停用" }
        ]);
        vmTableEnabled.onchange = () => { cfg.views.month.table.enabled = vmTableEnabled.value !== "false"; markChanged(); };
        vmTableWrap.appendChild(vmTableEnabled);
        const vmContentMode = makeSelect(cfg.views.month.table.contentMode === "rawInput" ? "rawInput" : "subcategory", [
            { value: "subcategory", label: "内容=子分类" },
            { value: "rawInput", label: "内容=原始输入" }
        ]);
        vmContentMode.onchange = () => { cfg.views.month.table.contentMode = vmContentMode.value; markChanged(); };
        vmTableWrap.appendChild(vmContentMode);
        const vmSort = makeSelect(cfg.views.month.table.defaultSort === "amount_desc" ? "amount_desc" : "date_desc", [
            { value: "date_desc", label: "默认按日期" },
            { value: "amount_desc", label: "默认按金额" }
        ]);
        vmSort.onchange = () => { cfg.views.month.table.defaultSort = vmSort.value; markChanged(); };
        vmTableWrap.appendChild(vmSort);

        const viewYearRow = makeRow(viewsBox, "年度");
        const viewYearWrap = document.createElement("div");
        viewYearWrap.style.display = "grid";
        viewYearWrap.style.gridTemplateColumns = "repeat(2, 1fr)";
        viewYearWrap.style.gap = "8px";
        viewYearRow.appendChild(viewYearWrap);
        const vyPie = makeCheck("饼图", cfg.views.year.charts.pie !== false, v => { cfg.views.year.charts.pie = v; markChanged(); });
        const vyHeat = makeCheck("热力", cfg.views.year.charts.heatmap !== false, v => { cfg.views.year.charts.heatmap = v; markChanged(); });
        const vyTrend = makeCheck("趋势", cfg.views.year.charts.trend !== false, v => { cfg.views.year.charts.trend = v; markChanged(); });
        const vyTop = makeCheck("TopN", cfg.views.year.charts.topN !== false, v => { cfg.views.year.charts.topN = v; markChanged(); });
        viewYearWrap.appendChild(vyPie.wrap);
        viewYearWrap.appendChild(vyHeat.wrap);
        viewYearWrap.appendChild(vyTrend.wrap);
        viewYearWrap.appendChild(vyTop.wrap);

        const viewYearRow2 = makeRow(viewsBox, "年度表");
        const vyTableWrap = document.createElement("div");
        vyTableWrap.style.display = "grid";
        vyTableWrap.style.gridTemplateColumns = "90px 1fr 1fr";
        vyTableWrap.style.gap = "8px";
        viewYearRow2.appendChild(vyTableWrap);
        const vyTableEnabled = makeSelect(cfg.views.year.table.enabled === false ? "false" : "true", [
            { value: "true", label: "启用" },
            { value: "false", label: "停用" }
        ]);
        vyTableEnabled.onchange = () => { cfg.views.year.table.enabled = vyTableEnabled.value !== "false"; markChanged(); };
        vyTableWrap.appendChild(vyTableEnabled);
        const vyContentMode = makeSelect(cfg.views.year.table.contentMode === "rawInput" ? "rawInput" : "subcategory", [
            { value: "subcategory", label: "内容=子分类" },
            { value: "rawInput", label: "内容=原始输入" }
        ]);
        vyContentMode.onchange = () => { cfg.views.year.table.contentMode = vyContentMode.value; markChanged(); };
        vyTableWrap.appendChild(vyContentMode);
        const vySort = makeSelect(cfg.views.year.table.defaultSort === "amount_desc" ? "amount_desc" : "date_desc", [
            { value: "date_desc", label: "默认按日期" },
            { value: "amount_desc", label: "默认按金额" }
        ]);
        vySort.onchange = () => { cfg.views.year.table.defaultSort = vySort.value; markChanged(); };
        vyTableWrap.appendChild(vySort);

        const viewRangeRow = makeRow(viewsBox, "范围");
        const viewRangeWrap = document.createElement("div");
        viewRangeWrap.style.display = "grid";
        viewRangeWrap.style.gridTemplateColumns = "repeat(2, 1fr)";
        viewRangeWrap.style.gap = "8px";
        viewRangeRow.appendChild(viewRangeWrap);
        const vrPie = makeCheck("饼图", cfg.views.range.charts.pie !== false, v => { cfg.views.range.charts.pie = v; markChanged(); });
        const vrHeat = makeCheck("热力", cfg.views.range.charts.heatmap !== false, v => { cfg.views.range.charts.heatmap = v; markChanged(); });
        const vrTrend = makeCheck("趋势", cfg.views.range.charts.trend !== false, v => { cfg.views.range.charts.trend = v; markChanged(); });
        const vrTop = makeCheck("TopN", cfg.views.range.charts.topN !== false, v => { cfg.views.range.charts.topN = v; markChanged(); });
        viewRangeWrap.appendChild(vrPie.wrap);
        viewRangeWrap.appendChild(vrHeat.wrap);
        viewRangeWrap.appendChild(vrTrend.wrap);
        viewRangeWrap.appendChild(vrTop.wrap);

        const viewRangeRow2 = makeRow(viewsBox, "范围表");
        const vrTableWrap = document.createElement("div");
        vrTableWrap.style.display = "grid";
        vrTableWrap.style.gridTemplateColumns = "90px 1fr 1fr";
        vrTableWrap.style.gap = "8px";
        viewRangeRow2.appendChild(vrTableWrap);
        const vrTableEnabled = makeSelect(cfg.views.range.table.enabled === false ? "false" : "true", [
            { value: "true", label: "启用" },
            { value: "false", label: "停用" }
        ]);
        vrTableEnabled.onchange = () => { cfg.views.range.table.enabled = vrTableEnabled.value !== "false"; markChanged(); };
        vrTableWrap.appendChild(vrTableEnabled);
        const vrContentMode = makeSelect(cfg.views.range.table.contentMode === "rawInput" ? "rawInput" : "subcategory", [
            { value: "subcategory", label: "内容=子分类" },
            { value: "rawInput", label: "内容=原始输入" }
        ]);
        vrContentMode.onchange = () => { cfg.views.range.table.contentMode = vrContentMode.value; markChanged(); };
        vrTableWrap.appendChild(vrContentMode);
        const vrSort = makeSelect(cfg.views.range.table.defaultSort === "amount_desc" ? "amount_desc" : "date_desc", [
            { value: "date_desc", label: "默认按日期" },
            { value: "amount_desc", label: "默认按金额" }
        ]);
        vrSort.onchange = () => { cfg.views.range.table.defaultSort = vrSort.value; markChanged(); };
        vrTableWrap.appendChild(vrSort);

        const budgetsBox = section("预算与目标（Budgets & Goals）", "设置月预算与分类预算；看板会在月度页展示预算使用情况（可关闭）。", true, true);
        cfg.budgets = cfg.budgets || {};
        const budgetRow = makeRow(budgetsBox, "月预算");
        const budgetInput = makeInput(cfg.budgets.monthlyTotal || 0, "例如 6000");
        budgetInput.oninput = () => { cfg.budgets.monthlyTotal = Number(budgetInput.value || 0) || 0; markChanged(); };
        budgetRow.appendChild(budgetInput);

        const catBudgetRow = makeRow(budgetsBox, "分类预算");
        const catBudgetTa = document.createElement("textarea");
        catBudgetTa.rows = 5;
        catBudgetTa.style.width = "100%";
        catBudgetTa.style.border = "1px solid #E2E8F0";
        catBudgetTa.style.borderRadius = "10px";
        catBudgetTa.style.padding = "8px 10px";
        catBudgetTa.style.fontSize = "12px";
        catBudgetTa.oninput = () => {
            const map = {};
            catBudgetTa.value.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(line => {
                const idx = line.indexOf("=");
                if (idx <= 0) return;
                const k = line.slice(0, idx).trim();
                const v = Number(line.slice(idx + 1).trim());
                if (!k || !Number.isFinite(v)) return;
                map[k] = v;
            });
            cfg.budgets.categoryMonthly = map;
            markChanged();
        };
        catBudgetRow.appendChild(catBudgetTa);

        const goalRow = makeRow(budgetsBox, "储蓄率%");
        const savingsInput = makeInput(cfg.budgets.savingsRateTarget || 0, "例如 20");
        savingsInput.oninput = () => { cfg.budgets.savingsRateTarget = Number(savingsInput.value || 0) || 0; markChanged(); };
        goalRow.appendChild(savingsInput);

        const debtRow = makeRow(budgetsBox, "还款目标");
        const debtInput = makeInput(cfg.budgets.debtPaymentTarget || 0, "例如 2000");
        debtInput.oninput = () => { cfg.budgets.debtPaymentTarget = Number(debtInput.value || 0) || 0; markChanged(); };
        debtRow.appendChild(debtInput);

        const perfBox = section("性能策略（Performance）", "建议启用索引缓存以避免重复扫描；可设置缓存文件名与最大扫描文件数。", true, true);
        cfg.performance = cfg.performance || {};
        const cacheRow = makeRow(perfBox, "索引缓存");
        const cacheWrap = document.createElement("div");
        cacheWrap.style.display = "grid";
        cacheWrap.style.gridTemplateColumns = "90px 1fr";
        cacheWrap.style.gap = "8px";
        cacheRow.appendChild(cacheWrap);
        const cacheEnabledSel = makeSelect(cfg.performance.cacheEnabled === false ? "false" : "true", [
            { value: "true", label: "启用" },
            { value: "false", label: "停用" }
        ]);
        cacheEnabledSel.onchange = () => { cfg.performance.cacheEnabled = cacheEnabledSel.value !== "false"; markChanged(); };
        cacheWrap.appendChild(cacheEnabledSel);
        const cacheFileInput = makeInput(cfg.performance.cacheFile || "财务看板.index.json", "缓存文件名");
        cacheFileInput.oninput = () => { cfg.performance.cacheFile = cacheFileInput.value; markChanged(); };
        cacheWrap.appendChild(cacheFileInput);

        const maxFilesRow = makeRow(perfBox, "最大文件数");
        const maxFilesInput = makeInput(cfg.performance.maxFiles || 5000, "例如 5000");
        maxFilesInput.oninput = () => { cfg.performance.maxFiles = Number(maxFilesInput.value || 0) || 0; markChanged(); };
        maxFilesRow.appendChild(maxFilesInput);

        const normBox = section("标准化规则（Normalization）", "配置渠道/分类/账户的归一化映射。每行一条：原值=目标值。", true, true);
        cfg.normalization = cfg.normalization || {};
        const normGrid = document.createElement("div");
        normGrid.style.display = "grid";
        normGrid.style.gridTemplateColumns = "repeat(3, 1fr)";
        normGrid.style.gap = "8px";
        normBox.appendChild(normGrid);

        const makeTa = () => {
            const t = document.createElement("textarea");
            t.rows = 6;
            t.style.width = "100%";
            t.style.border = "1px solid #E2E8F0";
            t.style.borderRadius = "10px";
            t.style.padding = "8px 10px";
            t.style.fontSize = "12px";
            return t;
        };

        const chTa = makeTa();
        const catTa = makeTa();
        const accTa = makeTa();
        normGrid.appendChild(chTa);
        normGrid.appendChild(catTa);
        normGrid.appendChild(accTa);

        chTa.placeholder = "渠道映射：微信支付=微信";
        catTa.placeholder = "分类映射：外卖=餐饮";
        accTa.placeholder = "账户映射：WeChat Pay=微信";

        const parseMap = (text) => {
            const map = {};
            String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(line => {
                const idx = line.indexOf("=");
                if (idx <= 0) return;
                const k = line.slice(0, idx).trim();
                const v = line.slice(idx + 1).trim();
                if (!k || !v) return;
                map[k] = v;
            });
            return map;
        };

        chTa.oninput = () => { cfg.normalization.channelAlias = parseMap(chTa.value); markChanged(); };
        catTa.oninput = () => { cfg.normalization.categoryAlias = parseMap(catTa.value); markChanged(); };
        accTa.oninput = () => { cfg.normalization.accountAlias = parseMap(accTa.value); markChanged(); };

        const bottom = document.createElement("div");
        bottom.style.display = "flex";
        bottom.style.gap = "10px";
        bottom.style.marginTop = "12px";
        body.appendChild(bottom);

        const btnReload = makeBtn("重新加载配置");
        btnReload.onclick = async () => {
            cfg = await Kit.config.load(configPath);
            Kit.__config = cfg;
            renderAll();
        };
        bottom.appendChild(btnReload);

        const btnSave = makeBtn("保存配置", "primary");
        btnSave.onclick = async () => {
            try {
                await Kit.config.save(configPath, cfg);
                cfg = await Kit.config.load(configPath);
                Kit.__config = cfg;
                try { new Notice("✅ 配置已保存"); } catch (_) {}
                renderAll();
            } catch (e) {
                try { new Notice(`❌ 保存失败：${e.message || e}`); } catch (_) {}
            }
        };
        bottom.appendChild(btnSave);

        const renderAll = () => {
            renderSources();
            const ui = cfg.ui || {};
            fontScale.value = String(ui.fontScale || "");
            const c = ui.columnWidths || {};
            colKeys.forEach(({k}) => {
                colInputs[k].value = String(c[k] || "");
            });
            excludeTa.value = Array.isArray(cfg.excludePathIncludes) ? cfg.excludePathIncludes.join("\n") : "";
            const sf = cfg.schema?.fields || {};
            Object.keys(schemaFieldInputs).forEach(k => { schemaFieldInputs[k].value = String(sf[k] || schemaFieldInputs[k].value || ""); });
            signCtrl.setValue(cfg.schema?.amountSign?.mode === "signed" ? "signed" : "byType");
            dateCtrl.setValue(cfg.schema?.dateFallback?.fromFilename === false ? "false" : "true");
            csvEnabled.value = cfg.schema?.csv?.enabled === true ? "true" : "false";
            csvDelim.value = String(cfg.schema?.csv?.delimiter || ",");
            csvHeader.value = cfg.schema?.csv?.hasHeader === false ? "false" : "true";
            ledgerEnabled.value = cfg.schema?.ledger?.enabled === true ? "true" : "false";
            ledgerRegex.value = String(cfg.schema?.ledger?.regex || "");

            vmTableEnabled.value = cfg.views?.month?.table?.enabled === false ? "false" : "true";
            vmContentMode.value = cfg.views?.month?.table?.contentMode === "rawInput" ? "rawInput" : "subcategory";
            vmSort.value = cfg.views?.month?.table?.defaultSort === "amount_desc" ? "amount_desc" : "date_desc";
            vyTableEnabled.value = cfg.views?.year?.table?.enabled === false ? "false" : "true";
            vyContentMode.value = cfg.views?.year?.table?.contentMode === "rawInput" ? "rawInput" : "subcategory";
            vySort.value = cfg.views?.year?.table?.defaultSort === "amount_desc" ? "amount_desc" : "date_desc";

            budgetInput.value = String(cfg.budgets?.monthlyTotal || 0);
            const cb = cfg.budgets?.categoryMonthly || {};
            catBudgetTa.value = Object.keys(cb).map(k => `${k}=${cb[k]}`).join("\n");
            savingsInput.value = String(cfg.budgets?.savingsRateTarget || 0);
            debtInput.value = String(cfg.budgets?.debtPaymentTarget || 0);

            cacheEnabledSel.value = cfg.performance?.cacheEnabled === false ? "false" : "true";
            cacheFileInput.value = String(cfg.performance?.cacheFile || "财务看板.index.json");
            maxFilesInput.value = String(cfg.performance?.maxFiles || 5000);

            const a1 = cfg.normalization?.channelAlias || {};
            const a2 = cfg.normalization?.categoryAlias || {};
            const a3 = cfg.normalization?.accountAlias || {};
            chTa.value = Object.keys(a1).map(k => `${k}=${a1[k]}`).join("\n");
            catTa.value = Object.keys(a2).map(k => `${k}=${a2[k]}`).join("\n");
            accTa.value = Object.keys(a3).map(k => `${k}=${a3[k]}`).join("\n");

            const ex = cfg.filters?.excluded || {};
            exSubTa.value = Array.isArray(ex.subcategories) ? ex.subcategories.join("\n") : "";
            exCatTa.value = Array.isArray(ex.categories) ? ex.categories.join("\n") : "";
            exChTa.value = Array.isArray(ex.channels) ? ex.channels.join("\n") : "";
            apTrend.cb.checked = cfg.filters?.applyTo?.trend !== false;
            apHeat.cb.checked = cfg.filters?.applyTo?.heatmap !== false;
            apPie.cb.checked = cfg.filters?.applyTo?.pie !== false;
            apTopN.cb.checked = cfg.filters?.applyTo?.topN !== false;
            apTable.cb.checked = cfg.filters?.applyTo?.table === true;
            apCards.cb.checked = cfg.filters?.applyTo?.cards === true;

            vmPie.cb.checked = cfg.views?.month?.charts?.pie !== false;
            vmHeat.cb.checked = cfg.views?.month?.charts?.heatmap !== false;
            vmTrend.cb.checked = cfg.views?.month?.charts?.trend !== false;
            vmTop.cb.checked = cfg.views?.month?.charts?.topN !== false;
            vyPie.cb.checked = cfg.views?.year?.charts?.pie !== false;
            vyHeat.cb.checked = cfg.views?.year?.charts?.heatmap !== false;
            vyTrend.cb.checked = cfg.views?.year?.charts?.trend !== false;
            vyTop.cb.checked = cfg.views?.year?.charts?.topN !== false;
        };

        renderAll();
    }
  },

  _escapeRegExp: function(s) {
    return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  _yamlQuote: function(s) {
    const v = String(s ?? '');
    return `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  },

  _upsertFrontmatterField: function(content, key, value) {
    const k = String(key || '').trim();
    if (!k) return content;
    const fm = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
    const line = `${k}: ${this._yamlQuote(value)}`;
    if (!fm) return `---\n${line}\n---\n\n${content}`;
    const body = fm[1];
    const re = new RegExp(`^(${this._escapeRegExp(k)}\\s*:\\s*).*$`, 'm');
    let nextBody = body;
    if (re.test(body)) nextBody = body.replace(re, `$1${this._yamlQuote(value)}`);
    else nextBody = `${body}\n${line}`;
    const replaced = `---\n${nextBody}\n---\n`;
    return content.replace(fm[0], replaced);
  },

  _extractFrontmatterField: function(content, key) {
    const k = String(key || '').trim();
    if (!k) return null;
    const fm = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
    if (!fm) return null;
    const body = fm[1];
    const re = new RegExp(`^${this._escapeRegExp(k)}\\s*:\\s*(.+?)\\s*$`, 'm');
    const m = body.match(re);
    if (!m) return null;
    const raw = String(m[1] || '').trim();
    const unquoted = raw.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    return unquoted;
  },

  _replaceBillChannelInMarkdown: function(content, channelKey, newChannel, oldCandidates = []) {
    let out = String(content || '');
    out = this._upsertFrontmatterField(out, channelKey, newChannel);

    out = out.replace(/^(-\s*\*\*渠道[：:]\*\*\s*).*(\s*)$/m, `$1${newChannel}$2`);

    const rawInputRe = /^(\*\*原始输入[：:]\*\*\s*)(.*)$/m;
    if (rawInputRe.test(out)) {
      out = out.replace(rawInputRe, (m, p1, p2) => {
        let t = String(p2 || '');
        const uniq = Array.from(new Set((oldCandidates || []).map(v => String(v || '').trim()).filter(Boolean)));
        uniq.forEach(oldV => {
          if (oldV && oldV !== newChannel && t.includes(oldV)) t = t.replace(oldV, newChannel);
        });
        return `${p1}${t}`;
      });
    }
    return out;
  },

  _replaceBillAmountInMarkdown: function(content, amountKey, newAmount, billType) {
    let out = String(content || '');
    const amt = Number(newAmount);
    const abs = Number.isFinite(amt) ? Math.abs(amt) : 0;
    const sign = billType === '收入' ? '+' : '-';
    const formatted = Number.isFinite(abs) ? abs.toFixed(2) : String(newAmount || '');
    const display = `${sign}¥${formatted}`;

    out = this._upsertFrontmatterField(out, amountKey, Number.isFinite(amt) ? String(newAmount) : String(newAmount || ''));
    out = out.replace(/(###\s*金额[\s\S]*?<div[^>]*>)([^<]*)(<\/div>)/, `$1${display}$3`);
    out = out.replace(/^-\s*\*\*金额[：:]\*\*\s*.*$/m, `- **金额：** ${display}`);
    return out;
  },

  updateBillChannelInFile: async function(bill, newChannel) {
    const path = String(bill?.path || '').trim();
    if (!path) return false;
    const file = app.vault.getAbstractFileByPath(path);
    if (!file || file.extension !== 'md') {
      new Notice('仅支持修改 Markdown 账单');
      return false;
    }
    const cfg = window.FinanceVizKit?.__config || this.config.defaultConfig();
    const channelKey = String(cfg?.schema?.fields?.channel || 'channel').trim() || 'channel';

    const original = await app.vault.read(file);
    const oldCandidates = [];
    const fmOld = this._extractFrontmatterField(original, channelKey);
    if (fmOld) oldCandidates.push(fmOld);
    const detailOldMatch = original.match(/^\-\s*\*\*渠道[：:]\*\*\s*(.*)\s*$/m);
    if (detailOldMatch && detailOldMatch[1]) oldCandidates.push(String(detailOldMatch[1]).trim());
    if (bill?.channel) oldCandidates.push(String(bill.channel).trim());
    if (bill?.channel) oldCandidates.push(this.channelAlias(bill.channel));

    const updated = this._replaceBillChannelInMarkdown(original, channelKey, newChannel, oldCandidates);
    if (updated === original) {
      new Notice('未检测到可更新内容');
      return false;
    }
    await app.vault.modify(file, updated);
    return true;
  },

  updateBillAmountInFile: async function(bill, newAmount) {
    const path = String(bill?.path || '').trim();
    if (!path) return false;
    const file = app.vault.getAbstractFileByPath(path);
    if (!file || file.extension !== 'md') {
      new Notice('仅支持修改 Markdown 账单');
      return false;
    }
    const cfg = window.FinanceVizKit?.__config || this.config.defaultConfig();
    const amountKey = String(cfg?.schema?.fields?.amount || 'amount').trim() || 'amount';
    const mode = cfg?.schema?.amountSign?.mode || 'byType';
    const n = Number(newAmount);
    if (!Number.isFinite(n)) {
      new Notice('金额格式无效');
      return false;
    }
    const abs = Math.abs(n);
    const stored = mode === 'signed' ? (bill?.type === '支出' ? -abs : abs) : abs;
    const value = Number.isFinite(stored) ? stored.toFixed(2) : String(newAmount || '');

    const original = await app.vault.read(file);
    const updated = this._replaceBillAmountInMarkdown(original, amountKey, value, bill?.type);
    if (updated === original) {
      new Notice('未检测到可更新内容');
      return false;
    }
    await app.vault.modify(file, updated);
    return { abs };
  },

  createSmartTable: function(dv, bills, opts = {}) {
    const container = dv.container.createEl('div');
    const M = this.money;
    const contentMode = (opts && opts.contentMode) || 'subcategory';
    const defaultSort = (opts && opts.defaultSort) || 'date_desc';

    const controlBar = container.createEl('div');
    controlBar.style.cssText = `
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 10px; flex-wrap: nowrap; gap: 8px;
        background: #F8F5FF; padding: 8px 12px; border-radius: 8px;
        border: 1px solid #E9D5FF;
    `;

    const leftGroup = controlBar.createEl('div');
    leftGroup.style.cssText = `display: flex; gap: 8px; align-items: center; flex: 1; min-width: 0;`;

    const resetBtn = leftGroup.createEl('div');
    resetBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>`;
    resetBtn.style.cssText = `
        cursor: pointer; color: #fff; 
        display: inline-flex; align-items: center; justify-content: center;
        width: 32px; height: 32px; 
        background: #8B5CF6; border-radius: 6px;
        box-shadow: 0 2px 4px rgba(139, 92, 246, 0.2);
        transition: all 0.3s; flex-shrink: 0;
    `;
    resetBtn.title = '重置筛选';
    resetBtn.onmouseover = () => { resetBtn.style.transform = 'rotate(180deg)'; resetBtn.style.background = '#7C3AED'; };
    resetBtn.onmouseout = () => { resetBtn.style.transform = 'none'; resetBtn.style.background = '#8B5CF6'; };

    const searchInput = leftGroup.createEl('input', { type: 'text', placeholder: '搜索...' });
    searchInput.style.cssText = `
        flex: 1; padding: 6px 12px; font-size: 13px;
        border: 1px solid #E9D5FF; border-radius: 6px;
        background: #fff; color: #4B5563;
        transition: all 0.2s; outline: none;
        min-width: 50px;
    `;
    searchInput.onfocus = () => { searchInput.style.borderColor = '#8B5CF6'; searchInput.style.boxShadow = '0 0 0 2px rgba(139, 92, 246, 0.1)'; };
    searchInput.onblur = () => { searchInput.style.borderColor = '#E9D5FF'; searchInput.style.boxShadow = 'none'; };

    const statsArea = controlBar.createEl('div');
    statsArea.style.cssText = `
        font-size: 12px; color: #512E5F; font-weight: 600;
        white-space: nowrap; flex-shrink: 0;
    `;
    statsArea.innerHTML = '...';

    const tableEl = container.createEl('table');
    tableEl.style.width = '100%';
    tableEl.style.fontSize = '11px'; 
    tableEl.style.borderCollapse = 'separate'; 
    tableEl.style.borderSpacing = '0 4px'; 
    tableEl.style.tableLayout = 'fixed';
    tableEl.style.marginTop = '0'; 

    const thead = tableEl.createEl('thead');
    const hRow = thead.createEl('tr');
    hRow.style.background = 'transparent'; 
    
    const widthConfig = window.FinanceVizKit.render.CONFIG?.COLUMN_WIDTHS || {};
    const cols = [
        {t:'日期', w: widthConfig.DATE || '15%', a:'center'}, 
        {t:'分类', w: widthConfig.CATEGORY || '15%', a:'center'}, 
        {t:'内容', w: widthConfig.CONTENT || '35%', a:'center'}, 
        {t:'渠道', w: widthConfig.CHANNEL || '15%', a:'center'}, 
        {t:'金额', w: widthConfig.AMOUNT || '20%', a:'right'}
    ];
    
    cols.forEach((c, i) => {
        const th = hRow.createEl('th', { text: c.t });
        let cssStr = `
            background-color: #F8F5FF !important;
            color: #6D28D9 !important;
            font-weight: 800 !important;
            border-bottom: 2px solid #E9D5FF !important;
            text-align: center !important;
            width: ${c.w};
            padding: 10px 0;
            font-size: 12px;
        `;
        if (i === 0) cssStr += 'border-top-left-radius: 8px !important; border-bottom-left-radius: 8px !important;'; 
        if (i === cols.length - 1) cssStr += 'border-top-right-radius: 8px !important; border-bottom-right-radius: 8px !important;'; 
        th.style.cssText = cssStr;
    });

    const tbody = tableEl.createEl('tbody');

    let state = { filterType: null, filterValue: null, keyword: '' };
    let activeChannelMenu = null;
    let activeChannelMenuCleanup = null;
    let activeAmountMenu = null;
    let activeAmountMenuCleanup = null;
    let activeBillModal = null;
    let activeBillModalCleanup = null;

    const closeChannelMenu = () => {
      try { activeChannelMenuCleanup && activeChannelMenuCleanup(); } catch (_) {}
      activeChannelMenuCleanup = null;
      if (activeChannelMenu && activeChannelMenu.parentNode) activeChannelMenu.parentNode.removeChild(activeChannelMenu);
      activeChannelMenu = null;
    };

    const closeAmountMenu = () => {
      try { activeAmountMenuCleanup && activeAmountMenuCleanup(); } catch (_) {}
      activeAmountMenuCleanup = null;
      if (activeAmountMenu && activeAmountMenu.parentNode) activeAmountMenu.parentNode.removeChild(activeAmountMenu);
      activeAmountMenu = null;
    };

    const closeBillModal = () => {
      try { activeBillModalCleanup && activeBillModalCleanup(); } catch (_) {}
      activeBillModalCleanup = null;
      if (activeBillModal && activeBillModal.parentNode) activeBillModal.parentNode.removeChild(activeBillModal);
      activeBillModal = null;
    };

    const computeChannelHeat = () => {
      const map = {};
      (bills || []).forEach(b => {
        const k = this.channelAlias(b?.channel);
        if (!k) return;
        map[k] = (map[k] || 0) + 1;
      });
      const cfg = window.FinanceVizKit?.__config || {};
      const aliasMap = cfg?.normalization?.channelAlias || {};
      Object.keys(aliasMap).forEach(raw => {
        const v = String(aliasMap[raw] || '').trim();
        if (v) map[v] = map[v] || 0;
      });
      return Object.keys(map)
        .map(name => ({ name, count: map[name] || 0 }))
        .filter(it => it.name && it.name !== '未知');
    };

    const openChannelMenu = (anchorEl, bill) => {
      closeChannelMenu();
      const menu = document.createElement('div');
      menu.style.cssText = `
        position: fixed;
        width: 260px;
        background: #FFFFFF;
        border: 1px solid #E9D5FF;
        border-radius: 10px;
        box-shadow: 0 12px 28px rgba(17, 24, 39, 0.14);
        z-index: 10000;
        overflow: hidden;
      `;

      const header = document.createElement('div');
      header.style.cssText = `padding: 10px 12px; display:flex; justify-content:space-between; align-items:center; background:#F8F5FF; border-bottom:1px solid #E9D5FF;`;
      const title = document.createElement('div');
      title.textContent = '修改渠道';
      title.style.cssText = `font-weight: 800; font-size: 12px; color: #6D28D9;`;
      const closeBtn = document.createElement('div');
      closeBtn.textContent = '×';
      closeBtn.style.cssText = `cursor:pointer; font-size: 16px; line-height: 16px; color:#7C3AED; padding: 2px 6px; border-radius: 6px;`;
      closeBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); closeChannelMenu(); };
      header.appendChild(title);
      header.appendChild(closeBtn);
      menu.appendChild(header);

      const controls = document.createElement('div');
      controls.style.cssText = `padding: 10px 12px; display:flex; gap:8px; align-items:center;`;
      const sortBtn = document.createElement('button');
      sortBtn.type = 'button';
      sortBtn.style.cssText = `border: 1px solid #E9D5FF; background:#fff; color:#6D28D9; border-radius: 8px; padding: 6px 8px; font-size: 12px; cursor:pointer; font-weight: 700;`;
      let sortMode = 'heat';
      sortBtn.textContent = '热力排序';
      const filterInput = document.createElement('input');
      filterInput.type = 'text';
      filterInput.placeholder = '搜索或自定义...';
      filterInput.style.cssText = `flex:1; border: 1px solid #E9D5FF; border-radius: 8px; padding: 6px 8px; font-size: 12px; outline:none;`;
      controls.appendChild(sortBtn);
      controls.appendChild(filterInput);
      menu.appendChild(controls);

      const list = document.createElement('div');
      list.style.cssText = `max-height: 260px; overflow:auto; padding: 0 6px 8px 6px;`;
      menu.appendChild(list);

      const positionMenu = () => {
        const vv = window.visualViewport;
        const viewport = vv
          ? { w: vv.width, h: vv.height, ox: vv.offsetLeft, oy: vv.offsetTop }
          : { w: window.innerWidth, h: window.innerHeight, ox: 0, oy: 0 };
        const margin = 12;
        const narrow = viewport.w <= 520;
        const keyboardLikely = !!(vv && vv.height < window.innerHeight - 80);
        const rect = anchorEl.getBoundingClientRect();

        if (narrow) {
          const w = Math.max(220, Math.min(340, viewport.w - margin * 2));
          menu.style.width = `${w}px`;
        } else {
          menu.style.width = '260px';
        }

        const menuRect = menu.getBoundingClientRect();
        let mw = menuRect.width || 260;
        let mh = menuRect.height || 320;

        const headerH = header.getBoundingClientRect().height || 44;
        const controlsH = controls.getBoundingClientRect().height || 44;
        const availableListH = viewport.h - margin * 2 - headerH - controlsH - 8;
        list.style.maxHeight = `${Math.max(120, Math.min(320, availableListH))}px`;

        const menuRect2 = menu.getBoundingClientRect();
        mw = menuRect2.width || mw;
        mh = menuRect2.height || mh;

        const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
        const minLeft = viewport.ox + margin;
        const maxLeft = viewport.ox + viewport.w - mw - margin;
        const minTop = viewport.oy + margin;
        const maxTop = viewport.oy + viewport.h - mh - margin;

        let left;
        let top;
        if (narrow || keyboardLikely) {
          left = clamp(viewport.ox + (viewport.w - mw) / 2, minLeft, maxLeft);
          top = clamp(viewport.oy + (viewport.h - mh) / 2, minTop, maxTop);
        } else {
          left = clamp(rect.left, minLeft, maxLeft);
          top = clamp(rect.bottom + 6, minTop, maxTop);
        }
        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
      };

      const renderList = () => {
        list.innerHTML = '';
        const kw = String(filterInput.value || '').trim().toLowerCase();
        let items = computeChannelHeat();
        if (sortMode === 'heat') items.sort((a, b) => (b.count || 0) - (a.count || 0) || a.name.localeCompare(b.name, 'zh'));
        else items.sort((a, b) => a.name.localeCompare(b.name, 'zh') || (b.count || 0) - (a.count || 0));
        if (kw) items = items.filter(it => it.name.toLowerCase().includes(kw));

        const current = this.channelAlias(bill?.channel);
        const addRow = (name, count, isCustom) => {
          const row = document.createElement('div');
          row.style.cssText = `
            display:flex; justify-content:space-between; align-items:center;
            padding: 8px 10px;
            margin: 4px 6px;
            border-radius: 8px;
            cursor: pointer;
            border: 1px solid transparent;
            font-size: 12px;
          `;
          row.onmouseover = () => { row.style.background = '#F5F3FF'; row.style.borderColor = '#E9D5FF'; };
          row.onmouseout = () => { row.style.background = 'transparent'; row.style.borderColor = 'transparent'; };
          const left = document.createElement('div');
          left.textContent = name;
          left.style.cssText = `font-weight: ${name === current ? 900 : 700}; color: ${name === current ? '#6D28D9' : '#111827'};`;
          const right = document.createElement('div');
          right.textContent = isCustom ? '自定义' : (count ? `${count}笔` : '');
          right.style.cssText = `color:#9CA3AF; font-size: 11px; font-weight: 700;`;
          row.appendChild(left);
          row.appendChild(right);
          row.onclick = async (e) => {
            e.preventDefault(); e.stopPropagation();
            closeChannelMenu();
            const next = String(name || '').trim();
            if (!next || next === current) return;
            try {
              new Notice(`💳 渠道 → ${next}`);
              const ok = await this.updateBillChannelInFile(bill, next);
              if (ok) {
                bill.channel = next;
                render();
                new Notice('✅ 已同步到账单文档');
              }
            } catch (_) {
              new Notice('❌ 更新失败');
            }
          };
          list.appendChild(row);
        };

        const custom = String(filterInput.value || '').trim();
        if (custom && !items.some(it => it.name === custom) && custom !== current) addRow(custom, 0, true);

        if (items.length === 0) {
          const empty = document.createElement('div');
          empty.textContent = '无匹配渠道';
          empty.style.cssText = `padding: 10px 14px; color:#9CA3AF; font-size: 12px;`;
          list.appendChild(empty);
          return;
        }
        items.forEach(it => addRow(it.name, it.count, false));
      };

      sortBtn.onclick = (e) => {
        e.preventDefault(); e.stopPropagation();
        sortMode = sortMode === 'heat' ? 'az' : 'heat';
        sortBtn.textContent = sortMode === 'heat' ? '热力排序' : 'A-Z';
        renderList();
      };
      filterInput.oninput = () => renderList();
      filterInput.onkeydown = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeChannelMenu(); }
      };

      const onDocDown = (e) => {
        if (!menu.contains(e.target)) closeChannelMenu();
      };
      const onKeyDown = (e) => {
        if (e.key === 'Escape') closeChannelMenu();
      };
      const onViewportChange = () => {
        if (!activeChannelMenu) return;
        positionMenu();
      };
      setTimeout(() => {
        document.addEventListener('mousedown', onDocDown, true);
        document.addEventListener('keydown', onKeyDown, true);
        window.addEventListener('resize', onViewportChange, true);
        if (window.visualViewport) {
          window.visualViewport.addEventListener('resize', onViewportChange);
          window.visualViewport.addEventListener('scroll', onViewportChange);
        }
      }, 0);
      activeChannelMenuCleanup = () => {
        document.removeEventListener('mousedown', onDocDown, true);
        document.removeEventListener('keydown', onKeyDown, true);
        window.removeEventListener('resize', onViewportChange, true);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', onViewportChange);
          window.visualViewport.removeEventListener('scroll', onViewportChange);
        }
      };
      activeChannelMenu = menu;
      document.body.appendChild(menu);
      positionMenu();
      const isTouchLike = (() => {
        try {
          return (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window);
        } catch (_) {
          return false;
        }
      })();
      if (!isTouchLike) filterInput.focus();
      renderList();
    };

    const openAmountMenu = (anchorEl, bill) => {
      closeAmountMenu();
      const menu = document.createElement('div');
      menu.style.cssText = `
        position: fixed;
        width: 240px;
        background: #FFFFFF;
        border: 1px solid #E9D5FF;
        border-radius: 10px;
        box-shadow: 0 12px 28px rgba(17, 24, 39, 0.14);
        z-index: 10000;
        overflow: hidden;
      `;

      const header = document.createElement('div');
      header.style.cssText = `padding: 10px 12px; display:flex; justify-content:space-between; align-items:center; background:#F8F5FF; border-bottom:1px solid #E9D5FF;`;
      const title = document.createElement('div');
      title.textContent = '修改金额';
      title.style.cssText = `font-weight: 800; font-size: 12px; color: #6D28D9;`;
      const closeBtn = document.createElement('div');
      closeBtn.textContent = '×';
      closeBtn.style.cssText = `cursor:pointer; font-size: 16px; line-height: 16px; color:#7C3AED; padding: 2px 6px; border-radius: 6px;`;
      closeBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); closeAmountMenu(); };
      header.appendChild(title);
      header.appendChild(closeBtn);
      menu.appendChild(header);

      const body = document.createElement('div');
      body.style.cssText = `padding: 12px; display:flex; flex-direction:column; gap:10px;`;
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = '输入金额';
      input.value = Number.isFinite(Number(bill?.amount)) ? Number(bill.amount).toFixed(2) : '';
      input.style.cssText = `border: 1px solid #E9D5FF; border-radius: 8px; padding: 8px 10px; font-size: 12px; outline:none;`;
      body.appendChild(input);

      const hint = document.createElement('div');
      hint.textContent = bill?.type === '收入' ? '当前为收入' : '当前为支出';
      hint.style.cssText = `color:#9CA3AF; font-size: 11px; font-weight: 700;`;
      body.appendChild(hint);

      const actionRow = document.createElement('div');
      actionRow.style.cssText = `display:flex; gap:8px; justify-content:flex-end;`;
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.textContent = '取消';
      cancelBtn.style.cssText = `border: 1px solid #E9D5FF; background:#fff; color:#6D28D9; border-radius: 8px; padding: 6px 10px; font-size: 12px; cursor:pointer; font-weight: 700;`;
      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.textContent = '保存';
      saveBtn.style.cssText = `border: 1px solid #E9D5FF; background:#7C3AED; color:#fff; border-radius: 8px; padding: 6px 12px; font-size: 12px; cursor:pointer; font-weight: 800;`;
      actionRow.appendChild(cancelBtn);
      actionRow.appendChild(saveBtn);
      body.appendChild(actionRow);
      menu.appendChild(body);

      const positionMenu = () => {
        const vv = window.visualViewport;
        const viewport = vv
          ? { w: vv.width, h: vv.height, ox: vv.offsetLeft, oy: vv.offsetTop }
          : { w: window.innerWidth, h: window.innerHeight, ox: 0, oy: 0 };
        const margin = 12;
        const narrow = viewport.w <= 520;
        const keyboardLikely = !!(vv && vv.height < window.innerHeight - 80);
        const rect = anchorEl.getBoundingClientRect();

        if (narrow) {
          const w = Math.max(220, Math.min(320, viewport.w - margin * 2));
          menu.style.width = `${w}px`;
        } else {
          menu.style.width = '240px';
        }

        const menuRect = menu.getBoundingClientRect();
        const mw = menuRect.width || 240;
        const mh = menuRect.height || 200;
        const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
        const minLeft = viewport.ox + margin;
        const maxLeft = viewport.ox + viewport.w - mw - margin;
        const minTop = viewport.oy + margin;
        const maxTop = viewport.oy + viewport.h - mh - margin;

        let left;
        let top;
        if (narrow || keyboardLikely) {
          left = clamp(viewport.ox + (viewport.w - mw) / 2, minLeft, maxLeft);
          top = clamp(viewport.oy + (viewport.h - mh) / 2, minTop, maxTop);
        } else {
          left = clamp(rect.left, minLeft, maxLeft);
          top = clamp(rect.bottom + 6, minTop, maxTop);
        }
        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
      };

      const commit = async () => {
        const raw = String(input.value || '').replace(/[¥,\s]/g, '');
        const n = Number(raw);
        if (!Number.isFinite(n)) { new Notice('金额格式无效'); return; }
        try {
          const result = await this.updateBillAmountInFile(bill, n);
          if (result && Number.isFinite(result.abs)) {
            bill.amount = result.abs;
            render();
            new Notice('✅ 已同步到账单文档');
            closeAmountMenu();
          }
        } catch (_) {
          new Notice('❌ 更新失败');
        }
      };

      cancelBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); closeAmountMenu(); };
      saveBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); commit(); };
      input.onkeydown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); commit(); }
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeAmountMenu(); }
      };

      const onDocDown = (e) => {
        if (!menu.contains(e.target)) closeAmountMenu();
      };
      const onKeyDown = (e) => {
        if (e.key === 'Escape') closeAmountMenu();
      };
      const onViewportChange = () => {
        if (!activeAmountMenu) return;
        positionMenu();
      };
      setTimeout(() => {
        document.addEventListener('mousedown', onDocDown, true);
        document.addEventListener('keydown', onKeyDown, true);
        window.addEventListener('resize', onViewportChange, true);
        if (window.visualViewport) {
          window.visualViewport.addEventListener('resize', onViewportChange);
          window.visualViewport.addEventListener('scroll', onViewportChange);
        }
      }, 0);
      activeAmountMenuCleanup = () => {
        document.removeEventListener('mousedown', onDocDown, true);
        document.removeEventListener('keydown', onKeyDown, true);
        window.removeEventListener('resize', onViewportChange, true);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', onViewportChange);
          window.visualViewport.removeEventListener('scroll', onViewportChange);
        }
      };
      activeAmountMenu = menu;
      document.body.appendChild(menu);
      positionMenu();
      input.focus();
      input.select();
    };

    const openBillDetailModal = (bill) => {
      closeBillModal();
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        box-sizing: border-box;
      `;

      const card = document.createElement('div');
      card.style.cssText = `
        width: 100%;
        max-width: 420px;
        background: #FFFFFF;
        border: 1px solid #E9D5FF;
        border-radius: 12px;
        box-shadow: 0 12px 28px rgba(17, 24, 39, 0.18);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        max-height: 70vh;
      `;
      overlay.appendChild(card);

      const header = document.createElement('div');
      header.style.cssText = `padding: 12px 14px; display:flex; justify-content:space-between; align-items:center; background:#F8F5FF; border-bottom:1px solid #E9D5FF;`;
      const title = document.createElement('div');
      title.textContent = '账单详情';
      title.style.cssText = `font-weight: 800; font-size: 13px; color: #6D28D9;`;
      const closeBtn = document.createElement('div');
      closeBtn.textContent = '×';
      closeBtn.style.cssText = `cursor:pointer; font-size: 18px; line-height: 18px; color:#7C3AED; padding: 2px 6px; border-radius: 6px;`;
      closeBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); closeBillModal(); };
      header.appendChild(title);
      header.appendChild(closeBtn);
      card.appendChild(header);

      const body = document.createElement('div');
      body.style.cssText = `padding: 14px; overflow: auto;`;
      const note = document.createElement('div');
      const noteText = String(bill?.note || bill?.rawInput || '').trim() || '无备注';
      note.textContent = noteText;
      note.style.cssText = `font-size: 13px; color: #111827; line-height: 1.7; white-space: pre-wrap;`;
      body.appendChild(note);
      card.appendChild(body);

      const action = document.createElement('div');
      action.style.cssText = `padding: 12px 14px; display:flex; justify-content:flex-end; gap:8px; border-top:1px solid #F1F5F9; background:#fff;`;
      const openBtn = document.createElement('button');
      openBtn.type = 'button';
      openBtn.textContent = '打开账单';
      openBtn.style.cssText = `border: 1px solid #E9D5FF; background:#7C3AED; color:#fff; border-radius: 8px; padding: 6px 12px; font-size: 12px; cursor:pointer; font-weight: 800;`;
      action.appendChild(openBtn);
      card.appendChild(action);

      const onDocDown = (e) => {
        if (e.target === overlay) closeBillModal();
      };
      const onKeyDown = (e) => {
        if (e.key === 'Escape') closeBillModal();
      };
      const onOpen = (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeBillModal();
        try { app.workspace.openLinkText(bill?.path || '', '', true); } catch (_) {}
      };

      openBtn.onclick = onOpen;
      overlay.addEventListener('mousedown', onDocDown, true);
      document.addEventListener('keydown', onKeyDown, true);
      activeBillModalCleanup = () => {
        overlay.removeEventListener('mousedown', onDocDown, true);
        document.removeEventListener('keydown', onKeyDown, true);
      };
      activeBillModal = overlay;
      document.body.appendChild(overlay);
    };

    const render = () => {
      tbody.empty();
      
      const fsConfig = window.FinanceVizKit.render.CONFIG?.FONT_SCALE || "13px";

      let data;
      if (state.keyword) {
          const k = state.keyword.toLowerCase();
          data = bills.filter(b => {
              const fullText = `${b.rawInput} ${b.category} ${b.subcategory} ${b.amount}`.toLowerCase();
              return fullText.includes(k);
          });
          searchInput.style.borderColor = '#73c0de';
      } else {
          data = bills.filter(b => {
              if (state.filterType === 'category' && b.category !== state.filterValue) return false;
              if (state.filterType === 'channel' && this.channelAlias(b.channel) !== state.filterValue) return false;
              if (state.filterType === 'type' && b.type !== state.filterValue) return false;
              return true;
          });
          searchInput.style.borderColor = '#E9D5FF';
      }

      const totalOut = M.sum(data.filter(b=>b.type==='支出').map(b=>b.amount));
      const label = (state.keyword || state.filterType) ? '筛选' : '总计';
      statsArea.innerHTML = `<span style="color:#6D28D9">${label}:</span> <span style="color:#7C3AED;font-weight:800;font-size:14px;margin-left:4px">¥${parseInt(totalOut)}</span> <span style="color:#D8B4FE;margin:0 6px">|</span> ${data.length}笔`;

      if (defaultSort === 'amount_desc') data.sort((a, b) => (b.amount || 0) - (a.amount || 0));
      else data.sort((a, b) => new Date(b.date) - new Date(a.date));

      if (data.length === 0) {
          const tr = tbody.createEl('tr');
          tr.createEl('td', { text: '无记录' }).colSpan = 5;
          tr.style.textAlign = 'center';
          tr.style.padding = '15px';
          tr.style.color = '#ccc';
          return;
      }

      let lastDate = '';
      let colorToggle = false;
      
      data.forEach(b => {
          const isNewDate = b.date !== lastDate;
          if (isNewDate) { 
              lastDate = b.date; 
              colorToggle = !colorToggle; 
          }
          
          const tr = tbody.createEl('tr');
          
          const bg = colorToggle ? '#fff' : '#FAFAFA'; 
          tr.style.backgroundColor = bg;
          
          tr.style.border = 'none';
          tr.style.cursor = 'pointer'; 
          tr.title = '点击查看详情';
          tr.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02), 0 0 0 1px rgba(0,0,0,0.02)';
          tr.style.borderRadius = '6px';
          
          tr.onmouseover = () => {
              tr.style.transform = 'translateY(-1px)';
              tr.style.boxShadow = '0 4px 6px rgba(109, 40, 217, 0.05), 0 0 0 1px rgba(109, 40, 217, 0.1)';
              tr.style.backgroundColor = '#F5F3FF'; 
              tr.style.zIndex = '1';
              tr.style.position = 'relative';
          };
          tr.onmouseout = () => {
              tr.style.transform = 'none';
              tr.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02), 0 0 0 1px rgba(0,0,0,0.02)';
              tr.style.backgroundColor = bg;
              tr.style.zIndex = '0';
          };
          tr.onclick = () => openBillDetailModal(b);

          const cellStyle = 'padding: 8px 4px !important; line-height: 1.6 !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #374151; vertical-align: middle;';
          
          const dateTxt = b.date.slice(5);
          const tdDate = tr.createEl('td');
          tdDate.style = cellStyle + `color: #6D28D9; font-family: "JetBrains Mono", monospace; text-align: center; font-weight: 600; font-size: ${fsConfig} !important;`;
          tdDate.style.borderTopLeftRadius = '6px';
          tdDate.style.borderBottomLeftRadius = '6px';
          tdDate.innerText = isNewDate ? dateTxt : ''; 
          if (!isNewDate) tdDate.style.opacity = '0.3'; 
          
          tr.createEl('td', { text: b.category }).style = cellStyle + `text-align: center; font-size: ${fsConfig} !important;`;
          
          let content = '';
          if (contentMode === 'rawInput') content = b.rawInput || b.subcategory || '';
          else content = b.subcategory || b.rawInput || '';
          tr.createEl('td', { text: content }).style = cellStyle + `text-align: center; color: #111827; font-weight: 500; font-size: ${fsConfig} !important;`; 

          const tdCh = tr.createEl('td');
          tdCh.style = cellStyle + `color: #9CA3AF; text-align: center; font-size: ${fsConfig} !important;`;
          const chSpan = tdCh.createEl('span', { text: this.channelAlias(b.channel) });
          chSpan.style.cssText = `cursor: pointer; padding: 2px 8px; border-radius: 999px; border: 1px dashed #E9D5FF; background: rgba(139, 92, 246, 0.06); color: #6B7280; display: inline-block;`;
          chSpan.onclick = (e) => { e.preventDefault(); e.stopPropagation(); openChannelMenu(chSpan, b); };
          
          let amtStr = Math.abs(b.amount).toFixed(2);
          if (Math.abs(b.amount) >= 10000) amtStr = parseInt(Math.abs(b.amount)); 
          const amtCell = tr.createEl('td', { text: (b.type==='收入'?'+':'-') + amtStr });
          amtCell.style = cellStyle + `text-align: right; font-weight: 700; font-family: "JetBrains Mono", monospace; font-size: ${fsConfig} !important;`;
          
          amtCell.style.color = b.type==='收入' ? '#3B82F6' : '#7C3AED';
          amtCell.style.borderTopRightRadius = '6px';
          amtCell.style.borderBottomRightRadius = '6px';
          amtCell.style.cursor = 'pointer';
          amtCell.style.textDecoration = 'underline dotted rgba(109, 40, 217, 0.35)';
          amtCell.style.textDecorationThickness = '1px';
          amtCell.style.textUnderlineOffset = '2px';
          amtCell.title = '点击修改金额';
          amtCell.onclick = (e) => { e.preventDefault(); e.stopPropagation(); openAmountMenu(amtCell, b); };
      });
    };

    searchInput.addEventListener('change', (e) => { state.keyword = e.target.value.trim(); render(); });
    resetBtn.onclick = () => {
        state.keyword = ''; state.filterType = null; state.filterValue = null;
        searchInput.value = ''; render(); new Notice('🔄 重置');
    };

    render();

    return {
        setFilter: (type, value) => {
            if (state.keyword) { state.keyword = ''; searchInput.value = ''; }
            if (state.filterType === type && state.filterValue === value) {
                state.filterType = null; state.filterValue = null;
            } else {
                state.filterType = type; state.filterValue = value;
            }
            render();
            return state.filterValue;
        }
    };
  },

  filterBillsByDate: function(bills, y, m) {
    if (!y) return bills;
    const p = m ? `${y}-${String(m).padStart(2,'0')}` : `${y}`;
    return bills.filter(b => b.date.startsWith(p));
  },

  filterBillsByDateRange: function(bills, startDate, endDate) {
    if (!startDate || !endDate) return bills;
    return bills.filter(b => b.date >= startDate && b.date <= endDate);
  },

  init: async function() {
    if (this.__readyPromise) return this.__readyPromise;
    this.__readyPromise = (async () => {
      await this.initECharts();
      return true;
    })();
    return this.__readyPromise;
  }
};
