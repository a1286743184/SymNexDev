module.exports = async function(context) {
    const { Modal, Notice } = require('obsidian');

    const app = context?.app;
    const adapter = app?.vault?.adapter;
    if (!app || !adapter) {
        if (typeof Notice !== 'undefined') new Notice("未获取到 Obsidian app，上下文异常");
        return;
    }

    const PROJECT_ROOT = "07-项目系统/01-公务员考试";
    const PLAN_FOLDER = `${PROJECT_ROOT}/学习计划`;
    const CURRENT_PLAN_FILE = `${PLAN_FOLDER}/公考学习计划.md`;
    const LIST_XINGCE = `${PROJECT_ROOT}/行测学习清单.md`;
    const STATS_SHENLUN = `${PROJECT_ROOT}/申论视频时长统计.md`;

    const exists = async (p) => {
        try { return await adapter.exists(p); } catch (e) { return false; }
    };
    const readText = async (p) => adapter.read(p);
    const writeText = async (p, text) => adapter.write(p, text);
    const ensureFolder = async (folderPath) => {
        if (await exists(folderPath)) return;
        try { await adapter.mkdir(folderPath); } catch (e) {}
    };

    // Default Config (Will be overwritten by Modal)
    const DEFAULT_CONFIG = {
        examDate: "2026-03-15",
        rangeDays: 7, // 7 or 14 or 9999(All)
        slots: {
            morning: { start: "09:00", end: "11:30", enabled: true },
            afternoon: { start: "14:00", end: "17:20", enabled: true },
            evening: { start: "21:00", end: "23:20", enabled: true }
        },
        rest: {
            weeklyOffDays: 1.5 // for forecast simulation
        }
    };

    // --- Helpers ---
    const notify = (msg) => {
        if (typeof Notice !== 'undefined') new Notice(msg);
        else console.log("[Notice]: " + msg);
    };

    const parseDurationStr = (str) => {
        if (!str) return 0;
        const s = String(str).trim();
        const cnH = s.match(/(\d+)\s*小时/);
        const cnM = s.match(/(\d+)\s*分/);
        const cnS = s.match(/(\d+)\s*秒/);
        if (cnH || cnM || cnS) {
            const hours = cnH ? parseInt(cnH[1], 10) : 0;
            const minutes = cnM ? parseInt(cnM[1], 10) : 0;
            const seconds = cnS ? parseInt(cnS[1], 10) : 0;
            return Math.ceil((hours * 3600 + minutes * 60 + seconds) / 60);
        }
        let minutes = 0;
        const hMatch = s.match(/(\d+)\s*h/);
        const mMatch = s.match(/(\d+)\s*m/);
        if (hMatch) minutes += parseInt(hMatch[1], 10) * 60;
        if (mMatch) minutes += parseInt(mMatch[1], 10);
        return minutes;
    };

    const formatDuration = (minutes) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h${m}m` : `${m}m`;
    };

    const addMinutes = (d, minutes) => {
        const out = new Date(d);
        out.setMinutes(out.getMinutes() + minutes);
        return out;
    };

    const getMinutesBetween = (startStr, endStr) => {
        const [sh, sm] = startStr.split(':').map(Number);
        const [eh, em] = endStr.split(':').map(Number);
        return (eh * 60 + em) - (sh * 60 + sm);
    };
    
    const setTime = (date, timeStr) => {
        const d = new Date(date);
        const [h, m] = timeStr.split(':').map(Number);
        d.setHours(h, m, 0, 0);
        return d;
    };

    const formatTime = (d) => {
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    };

    const formatDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
    };

    // --- Task Parsers ---
    const generateXingceTasks = async () => {
        const tasks = [];
        if (!(await exists(LIST_XINGCE))) return tasks;
        const content = await readText(LIST_XINGCE);
        const lines = content.split('\n');
        const regex = /- \[ \] (#\S+) (\[[^\]]+\])(.+?) \((.+?)\)(?:\s*\[学习:\s*(.+?)\])?/;
        
        for (const line of lines) {
            const match = line.match(regex);
            if (match) {
                const tag = match[1];
                const type = match[2];
                const name = match[3].trim();
                const videoDurStr = match[4];
                const studyDurStr = match[5];
                const mins = parseDurationStr(studyDurStr || videoDurStr);
                
                const sliceMins = 60;
                if (mins > 160) {
                    const partCount = Math.max(1, Math.ceil(mins / sliceMins));
                    for (let part = 1; part <= partCount; part++) {
                        const partMins = (part < partCount) ? sliceMins : (mins - sliceMins * (partCount - 1));
                        tasks.push({
                            Tag: tag, Type: type, Name: `${name}（${part}/${partCount}）`,
                            BaseName: name, Minutes: partMins, Part: part, PartCount: partCount, Category: "Xingce"
                        });
                    }
                } else {
                    tasks.push({ Tag: tag, Type: type, Name: name, Minutes: mins, Category: "Xingce" });
                }
            }
        }
        return tasks;
    };

    const generateShenlunTasks = async () => {
        const tasks = [];
        if (!(await exists(STATS_SHENLUN))) return tasks;
        const content = await readText(STATS_SHENLUN);
        const lines = content.split('\n');
        let currentClass = "";
        
        for (const line of lines) {
            const catMatch = line.match(/\*\*([^*]+)\*\*/);
            if (catMatch) currentClass = catMatch[1];
            
            const taskMatch = line.match(/📄\s*(.+?)\s*\(.+?\)\s*\[学习:\s*(?:(\d+)小时)?(\d+)分\]/);
            if (taskMatch) {
                const name = taskMatch[1];
                const h = taskMatch[2] ? parseInt(taskMatch[2]) : 0;
                const m = parseInt(taskMatch[3]);
                const mins = h * 60 + m;
                const type = (name.includes("练") || name.includes("套")) ? "[练]" : "[学]";
                
                const sliceMins = 60;
                const partCount = Math.max(1, Math.ceil(mins / sliceMins));
                for (let part = 1; part <= partCount; part++) {
                    const partMins = (part < partCount) ? sliceMins : (mins - sliceMins * (partCount - 1));
                    tasks.push({
                        Class: currentClass, Type: type, Name: partCount > 1 ? `${name}（${part}/${partCount}）` : name,
                        BaseName: name, Minutes: partMins, Part: part, PartCount: partCount, Category: "ShenLun"
                    });
                }
            }
        }
        return tasks;
    };

    // --- Modal UI ---
    class PlanConfigModal extends Modal {
        constructor(app, onSubmit) {
            super(app);
            this.onSubmit = onSubmit;
            this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
            this.availability = []; // { date: Date, slots: [bool, bool, bool] }
        }

        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.classList.add("sip-plan-modal");
            if (!document.getElementById("sip-plan-modal-style")) {
                const style = document.createElement("style");
                style.id = "sip-plan-modal-style";
                style.textContent = `
                    .sip-plan-modal { overflow-x: hidden; }
                    .sip-plan-modal h2 { margin: 0 0 6px 0; font-size: 18px; }
                    .sip-plan-modal .sip-subtitle { margin: 0 0 12px 0; color: var(--text-muted); font-size: 12px; }
                    .sip-plan-modal input[type="text"] { border-radius: 8px; }
                    .sip-plan-modal .sip-card { background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 10px; padding: 10px; }
                    .sip-plan-modal .sip-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
                    .sip-plan-modal .sip-label { font-weight: 600; }
                    .sip-plan-modal .sip-select { min-width: 160px; border-radius: 10px; padding: 6px 10px; }
                    .sip-plan-modal .sip-time-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 10px 0 12px 0; }
                    .sip-plan-modal .sip-time-title { font-weight: 700; font-size: 12px; color: var(--text-muted); margin-bottom: 6px; text-align: center; }
                    .sip-plan-modal .sip-time-row { display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: nowrap; }
                    .sip-plan-modal .sip-time-row input { width: 54px; text-align: center; padding: 4px 6px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
                    .sip-plan-modal .sip-cal-title { margin: 12px 0 8px 0; font-size: 14px; font-weight: 800; }
                    .sip-plan-modal .sip-cal { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; width: 100%; box-sizing: border-box; }
                    .sip-plan-modal .sip-cal-head { text-align: center; font-size: 11px; color: var(--text-muted); padding: 2px 0; }
                    .sip-plan-modal .sip-cal-head.sun { color: var(--interactive-accent); font-weight: 800; }
                    .sip-plan-modal .sip-day { background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 10px; padding: 8px; display: flex; flex-direction: column; gap: 8px; min-height: 72px; box-sizing: border-box; }
                    .sip-plan-modal .sip-day.today { border-color: var(--interactive-accent); box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.2) inset; }
                    .sip-plan-modal .sip-day.sun { background: rgba(124, 58, 237, 0.06); }
                    .sip-plan-modal .sip-day-top { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
                    .sip-plan-modal .sip-day-date { font-weight: 800; font-size: 11px; white-space: nowrap; }
                    .sip-plan-modal .sip-toggle-row { display: flex; flex-direction: column; align-items: center; gap: 6px; }
                    .sip-plan-modal .sip-toggle { border: 1px solid var(--background-modifier-border); border-radius: 10px; width: 32px; height: 32px; padding: 0; font-size: 12px; cursor: pointer; background: var(--background-primary); color: var(--text-muted); display: flex; align-items: center; justify-content: center; }
                    .sip-plan-modal .sip-toggle.on { background: var(--interactive-accent); border-color: var(--interactive-accent); color: var(--text-on-accent); }
                    .sip-plan-modal .sip-toggle.disabled { background: var(--background-secondary); color: var(--text-faint); border-color: var(--background-modifier-border); cursor: not-allowed; opacity: 0.7; }
                    @media (max-width: 768px) {
                        .sip-plan-modal .sip-time-row { flex-direction: column; gap: 4px; }
                        .sip-plan-modal .sip-time-row input { width: 58px; }
                        .sip-plan-modal .sip-cal { gap: 4px; }
                        .sip-plan-modal .sip-cal-head { font-size: 10px; }
                        .sip-plan-modal .sip-day { padding: 4px; gap: 6px; border-radius: 8px; min-height: 62px; }
                        .sip-plan-modal .sip-day-date { font-size: 10px; }
                        .sip-plan-modal .sip-toggle-row { gap: 4px; }
                        .sip-plan-modal .sip-toggle { width: 26px; height: 26px; border-radius: 8px; font-size: 11px; }
                    }
                    .sip-plan-modal .sip-foot { margin-top: 14px; display: flex; justify-content: flex-end; padding-top: 10px; border-top: 1px solid var(--background-modifier-border); }
                `;
                document.head.appendChild(style);
            }

            contentEl.createEl("h2", { text: "公考学习计划配置" });
            contentEl.createDiv({ text: "设置排布范围、时段时间，并调整未来日程可用性。", cls: "sip-subtitle" });

            const topCard = contentEl.createDiv({ cls: "sip-card" });
            const rangeRow = topCard.createDiv({ cls: "sip-row" });
            rangeRow.createDiv({ text: "排布范围", cls: "sip-label" });
            const rangeSelect = rangeRow.createEl("select", { cls: "sip-select" });
            [
                { v: "7", t: "未来 7 天" },
                { v: "14", t: "未来 14 天" },
                { v: "9999", t: "排布所有任务" }
            ].forEach(o => {
                const opt = document.createElement("option");
                opt.value = o.v;
                opt.textContent = o.t;
                rangeSelect.appendChild(opt);
            });
            rangeSelect.value = String(this.config.rangeDays);

            const timeGroup = topCard.createDiv({ cls: "sip-time-grid" });

            const createCompactTimeInput = (container, label, slotKey) => {
                const wrapper = container.createDiv();
                wrapper.createDiv({ text: label, cls: "sip-time-title" });
                
                const row = wrapper.createDiv({ cls: "sip-time-row" });
                const createInput = (val, setter) => {
                    const inp = row.createEl("input", { type: "text", value: val });
                    inp.onchange = (e) => setter(e.target.value);
                };
                createInput(this.config.slots[slotKey].start, v => this.config.slots[slotKey].start = v);
                row.createSpan({ text: "-" });
                createInput(this.config.slots[slotKey].end, v => this.config.slots[slotKey].end = v);
            };

            createCompactTimeInput(timeGroup, "上午 (行测)", "morning");
            createCompactTimeInput(timeGroup, "下午 (混合)", "afternoon");
            createCompactTimeInput(timeGroup, "晚上 (申论)", "evening");

            const calTitle = contentEl.createDiv({ text: "日程可用性设置", cls: "sip-cal-title" });
            const gridEl = contentEl.createDiv({ cls: "sip-cal" });
            this.renderAvailabilityGrid(gridEl);

            rangeSelect.onchange = () => {
                this.config.rangeDays = parseInt(rangeSelect.value, 10);
                this.renderAvailabilityGrid(gridEl);
            };

            const btnDiv = contentEl.createDiv({ cls: "sip-foot" });
            const btn = btnDiv.createEl("button", { text: "生成学习计划", cls: "mod-cta" });
            btn.onclick = () => {
                this.close();
                this.onSubmit(this.config, this.availability);
            };
        }

        renderAvailabilityGrid(container) {
            container.empty();
            
            const now = new Date();
            this.availability = [];
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            const parseTimeToMinutes = (timeStr) => {
                const m = String(timeStr || "").match(/^(\d{1,2}):(\d{2})$/);
                if (!m) return 0;
                return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
            };
            
            const displayDays = this.config.rangeDays > 100 ? 14 : this.config.rangeDays;
            const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
            const startDay = now.getDay();

            for (let i = 0; i < 7; i++) {
                const head = container.createDiv({ text: weekDays[i], cls: `sip-cal-head ${i === 0 ? "sun" : ""}` });
            }

            for (let i = 0; i < startDay; i++) {
                container.createDiv();
            }

            for (let i = 0; i < displayDays; i++) {
                const d = new Date(now);
                d.setDate(d.getDate() + i);
                const weekDayNum = d.getDay();
                
                const isSunday = (weekDayNum === 0);
                const isToday = (i === 0);
                
                const card = container.createDiv({ cls: `sip-day ${isSunday ? "sun" : ""} ${isToday ? "today" : ""}` });
                
                const header = card.createDiv({ cls: "sip-day-top" });
                header.createDiv({ text: `${d.getMonth() + 1}-${d.getDate()}`, cls: "sip-day-date" });

                const slots = [true, true, true]; // Default
                if (weekDayNum === 6) slots.fill(false);
                if (weekDayNum === 0) slots[2] = false;
                const disabled = [false, false, false];
                if (isToday) {
                    const endMins = [
                        parseTimeToMinutes(this.config.slots.morning.end),
                        parseTimeToMinutes(this.config.slots.afternoon.end),
                        parseTimeToMinutes(this.config.slots.evening.end)
                    ];
                    for (let idx = 0; idx < 3; idx++) {
                        if (nowMinutes >= endMins[idx]) {
                            slots[idx] = false;
                            disabled[idx] = true;
                        }
                    }
                }

                this.availability.push({ date: d, slots });

                const toggles = card.createDiv({ cls: "sip-toggle-row" });
                ["早", "中", "晚"].forEach((label, idx) => {
                    const cls = `sip-toggle ${slots[idx] ? "on" : ""} ${disabled[idx] ? "disabled" : ""}`;
                    const btn = toggles.createEl("button", { text: label, cls });
                    if (disabled[idx]) {
                        btn.disabled = true;
                        return;
                    }
                    btn.onclick = (e) => {
                        e.preventDefault();
                        slots[idx] = !slots[idx];
                        btn.classList.toggle("on", slots[idx]);
                    };
                });
            }
            
            if (this.config.rangeDays > 100) {
                container.createDiv();
            }
        }

        onClose() {
            const { contentEl } = this;
            contentEl.empty();
        }
    }

    // --- Main Logic ---
    const runUpdate = async (config, availability) => {
        notify("正在生成学习计划...");
        const now = new Date();

        // 1. Prepare Data
        const allXingce = await generateXingceTasks();
        const allShenlun = await generateShenlunTasks();
        
        // Reorder Shenlun (Basic -> Topic -> Practice)
        const slBasic = allShenlun.filter(t => t.Class === "基础班");
        const slTopic = allShenlun.filter(t => t.Class === "专题班");
        const slPractice = allShenlun.filter(t => t.Class === "刷题班");
        const shenlunQueueRaw = [...slBasic, ...slTopic, ...slPractice];

        // 2. Load Existing & Extract Completed
        let completedWholeSet = new Set();
        let completedPartMap = new Map();
        let historyCompletedLines = [];
        let historyForecasts = [];
        let historyProgressStats = []; // csv lines (without header)
        let completedMinutesByDate = new Map(); // dateStr -> minutes
        let completedMinutesByDateCat = new Map(); // dateStr -> { X, S }
        let completedMinutesByPlannedDate = new Map(); // plannedDateStr -> minutes
        let completedMinutesByPlannedDateCat = new Map(); // plannedDateStr -> { X, S }

        if (await exists(CURRENT_PLAN_FILE)) {
            const content = await readText(CURRENT_PLAN_FILE);
            const lines = content.split('\n');
            let section = null; // "history" | "forecast" | "progress" | null
            let inForecastCsv = false;
            let inProgressCsv = false;

            // Regex to extract tasks
            const taskRegex = /- \[(x|X)\] .+?(\[.+?\])(.+?) \(/;
            const parseTaskMinutesFromLine = (line) => {
                const m = line.match(/\(([^)]+)\)\[/);
                if (!m) return 0;
                return parseDurationStr(m[1]);
            };
            const parseTaskPlannedDateFromLine = (line) => {
                const m = line.match(/📅\s*(\d{4}-\d{2}-\d{2})/);
                return m ? m[1] : null;
            };
            const parseCompletionDateFromLine = (line) => {
                const m = line.match(/✅\s*(\d{4}-\d{2}-\d{2})\s*$/);
                return m ? m[1] : null;
            };
            const ensureCompletionStamp = (line, completionDateStr) => {
                if (!completionDateStr) return line;
                if (line.includes("✅")) return line;
                return `${line} ✅ ${completionDateStr}`;
            };
            const completedLineKey = (line) => {
                return String(line || "")
                    .replace(/- \[(x|X)\]\s*/g, "")
                    .replace(/\s*✅\s*\d{4}-\d{2}-\d{2}\s*$/g, "")
                    .trim();
            };
            const isValidDateStr = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || "").trim());
            const isValidDateValue = (dateStr) => {
                if (!isValidDateStr(dateStr)) return false;
                const d = new Date(dateStr);
                return !Number.isNaN(d.getTime());
            };
            const parseForecastCsvLine = (line) => {
                const raw = String(line || "").trim();
                const parts = raw.split(",");
                if (parts.length !== 3) return null;
                const [dateStr, forecastDateStr, deltaStr] = parts.map(s => s.trim());
                if (!isValidDateStr(dateStr)) return null;
                if (!isValidDateValue(forecastDateStr)) return null;
                if (!/^-?\d+$/.test(deltaStr)) return null;
                return `${dateStr},${forecastDateStr},${parseInt(deltaStr, 10)}`;
            };

            const completedLineKeySet = new Set();

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith("## ")) {
                    inForecastCsv = false;
                    inProgressCsv = false;
                    if (trimmed === "## 历史已完成") section = "history";
                    else if (trimmed === "## 历史预测记录") section = "forecast";
                    else if (trimmed === "## 历史进度统计") section = "progress";
                    else section = null;
                }

                if (section === "forecast") {
                    if (trimmed === "```csv") { inForecastCsv = true; continue; }
                    if (trimmed === "```") { inForecastCsv = false; continue; }
                    if (inForecastCsv) {
                        const parsed = parseForecastCsvLine(trimmed);
                        if (parsed) historyForecasts.push(parsed);
                    }
                }

                if (section === "progress") {
                    if (trimmed === "```csv") { inProgressCsv = true; continue; }
                    if (trimmed === "```") { inProgressCsv = false; continue; }
                    if (inProgressCsv && trimmed.match(/^\d{4}-\d{2}-\d{2},/)) {
                        historyProgressStats.push(trimmed);
                    }
                }

                const match = line.match(taskRegex);
                if (match) {
                    // Extract completion
                    const rawName = match[3].trim();
                    const partMatch = rawName.match(/^(.*)（(\d+)\/(\d+)）$/);
                    if (partMatch) {
                        const baseName = partMatch[1].trim();
                        const part = parseInt(partMatch[2]);
                        if (!completedPartMap.has(baseName)) completedPartMap.set(baseName, new Set());
                        completedPartMap.get(baseName).add(part);
                    } else {
                        completedWholeSet.add(rawName);
                    }

                    const plannedDateStr = parseTaskPlannedDateFromLine(line);
                    const completionDateStr = parseCompletionDateFromLine(line) || formatDate(now);
                    const stamped = ensureCompletionStamp(line, completionDateStr);
                    const key = completedLineKey(stamped);

                    if (!completedLineKeySet.has(key)) {
                        const mins = parseTaskMinutesFromLine(line);
                        if (completionDateStr) {
                            completedMinutesByDate.set(completionDateStr, (completedMinutesByDate.get(completionDateStr) || 0) + mins);
                            const cat = stamped.includes("#行测") ? "X" : (stamped.includes("#申论") ? "S" : null);
                            if (cat) {
                                if (!completedMinutesByDateCat.has(completionDateStr)) completedMinutesByDateCat.set(completionDateStr, { X: 0, S: 0 });
                                completedMinutesByDateCat.get(completionDateStr)[cat] += mins;
                            }
                        }
                        if (plannedDateStr) {
                            completedMinutesByPlannedDate.set(plannedDateStr, (completedMinutesByPlannedDate.get(plannedDateStr) || 0) + mins);
                            const cat = stamped.includes("#行测") ? "X" : (stamped.includes("#申论") ? "S" : null);
                            if (cat) {
                                if (!completedMinutesByPlannedDateCat.has(plannedDateStr)) completedMinutesByPlannedDateCat.set(plannedDateStr, { X: 0, S: 0 });
                                completedMinutesByPlannedDateCat.get(plannedDateStr)[cat] += mins;
                            }
                        }
                    }

                    if (!completedLineKeySet.has(key)) {
                        historyCompletedLines.push(stamped);
                        completedLineKeySet.add(key);
                    }
                }
            }
        }

        // 3. Filter Queues
        const xingceQueue = allXingce.filter(t => {
            const baseName = t.BaseName || t.Name;
            if (completedWholeSet.has(baseName)) return false;
            if (t.PartCount > 1) {
                const set = completedPartMap.get(baseName);
                return !(set && set.has(t.Part));
            }
            return !completedWholeSet.has(t.Name);
        });

        const shenlunQueue = shenlunQueueRaw.filter(t => {
            const baseName = t.BaseName || t.Name;
            if (completedWholeSet.has(baseName)) return false;
            if (t.PartCount > 1) {
                const set = completedPartMap.get(baseName);
                return !(set && set.has(t.Part));
            }
            return !completedWholeSet.has(t.Name);
        });

        // 4. Scheduling
        const outputLines = [];
        const todayTasks = [];
        const futureTasks = []; // Map<DateStr, Lines[]>

        let xIdx = 0;
        let sIdx = 0;
        
        // Helper: Schedule a slot
        const isSameDate = (a, b) => {
            return a.getFullYear() === b.getFullYear()
                && a.getMonth() === b.getMonth()
                && a.getDate() === b.getDate();
        };

        const scheduleSlot = (date, slotName, queue, idxRef, linesArr, minStartTime) => {
            const cfg = config.slots[slotName];
            const slotStart = setTime(date, cfg.start);
            const slotEnd = setTime(date, cfg.end);
            const normalizedMinStartTime = (() => {
                if (!minStartTime) return null;
                const d = new Date(minStartTime);
                d.setSeconds(0, 0);
                return d;
            })();
            const timeCursorStart = (normalizedMinStartTime && normalizedMinStartTime > slotStart) ? normalizedMinStartTime : slotStart;
            const capMins = Math.max(0, Math.floor((slotEnd - timeCursorStart) / (1000 * 60)));
            let used = 0;
            let currentIdx = idxRef.val;
            
            let timeCursor = timeCursorStart;
            const endTimeLimit = addMinutes(slotEnd, 40); // overflow buffer

            while (currentIdx < queue.length && used < capMins) {
                const t = queue[currentIdx];
                const endT = addMinutes(timeCursor, t.Minutes);
                if (endT > endTimeLimit) break;

                const timeStr = formatTime(timeCursor);
                const durStr = formatDuration(t.Minutes);
                const dateStr = formatDate(date);
                
                let line = `- [ ] ${t.Tag || "#申论-"+t.Class} ${t.Type}${t.Name} (${durStr})[${timeStr}] 📅 ${dateStr}`;
                if (t.SubTag) line = line.replace(t.Tag, `${t.Tag}-${t.SubTag}`); // Fix subtag if any
                
                linesArr.push(line);
                
                used += t.Minutes;
                timeCursor = endT;
                currentIdx++;
            }
            idxRef.val = currentIdx;
            return used;
        };

        // 4.1 Real Schedule (Range)
        // If range is 9999, we loop until tasks done, but using availability cycle
        const isFullMode = config.rangeDays > 100;
        const scheduleLimit = isFullMode ? 9999 : config.rangeDays;
        
        let dayOffset = 0;
        // Use provided availability for first N days, then default cycle
        const availLength = availability.length;
        
        while ((xIdx < xingceQueue.length || sIdx < shenlunQueue.length) && dayOffset < scheduleLimit) {
            let slots = [true, true, true];
            let date;
            
            if (dayOffset < availLength) {
                // Use explicit setting
                slots = availability[dayOffset].slots;
                date = availability[dayOffset].date;
            } else {
                // Use default simulation (Weekly 1.5 off)
                // Need to calculate date
                date = new Date(availability[0].date);
                date.setDate(date.getDate() + dayOffset);
                const day = date.getDay();
                // Sat off, Sun evening off
                if (day === 6) slots = [false, false, false];
                else if (day === 0) slots = [true, true, false];
                else slots = [true, true, true];
            }

            const dayDate = new Date(date);
            dayDate.setHours(0, 0, 0, 0);
            const isToday = isSameDate(dayDate, now);
            const dayLines = [];

            // Morning: Xingce
            if (slots[0]) {
                scheduleSlot(
                    dayDate,
                    "morning",
                    xingceQueue,
                    { get val() { return xIdx }, set val(v) { xIdx = v } },
                    dayLines,
                    isToday ? now : null
                );
            }

            // Afternoon: Mixed
            if (slots[1]) {
                const cfg = config.slots.afternoon;
                const slotStart = setTime(dayDate, cfg.start);
                const slotEnd = setTime(dayDate, cfg.end);
                const normalizedNow = new Date(now);
                normalizedNow.setSeconds(0, 0);
                const timeCursorStart = (isToday && normalizedNow > slotStart) ? normalizedNow : slotStart;
                const capMins = Math.max(0, Math.floor((slotEnd - timeCursorStart) / (1000 * 60)));
                let used = 0;
                let timeCursor = timeCursorStart;
                const endTimeLimit = addMinutes(slotEnd, 40);

                const sumRemainingMinutes = (queue, startIdx) => {
                    let acc = 0;
                    for (let i = startIdx; i < queue.length; i++) acc += queue[i].Minutes;
                    return acc;
                };
                const totalXMins = allXingce.reduce((acc, t) => acc + t.Minutes, 0);
                const totalSMins = shenlunQueueRaw.reduce((acc, t) => acc + t.Minutes, 0);
                const remXMinsNow = sumRemainingMinutes(xingceQueue, xIdx);
                const remSMinsNow = sumRemainingMinutes(shenlunQueue, sIdx);
                const remXRatio = totalXMins > 0 ? remXMinsNow / totalXMins : 0;
                const remSRatio = totalSMins > 0 ? remSMinsNow / totalSMins : 0;
                const primaryCat = remXRatio >= remSRatio ? "X" : "S";

                while ((xIdx < xingceQueue.length || sIdx < shenlunQueue.length) && used < capMins) {
                    const tryPick = (cat) => {
                        if (cat === "X") {
                            if (xIdx >= xingceQueue.length) return null;
                            return { cat: "X", t: xingceQueue[xIdx] };
                        }
                        if (sIdx >= shenlunQueue.length) return null;
                        return { cat: "S", t: shenlunQueue[sIdx] };
                    };

                    let pick = tryPick(primaryCat) || tryPick(primaryCat === "X" ? "S" : "X");
                    if (!pick || !pick.t) break;

                    let endT = addMinutes(timeCursor, pick.t.Minutes);
                    if (endT > endTimeLimit) {
                        const fallback = tryPick(pick.cat === "X" ? "S" : "X");
                        if (!fallback || !fallback.t) break;
                        const endFallback = addMinutes(timeCursor, fallback.t.Minutes);
                        if (endFallback > endTimeLimit) break;
                        pick = fallback;
                        endT = endFallback;
                    }

                    const timeStr = formatTime(timeCursor);
                    const durStr = formatDuration(pick.t.Minutes);
                    const dateStr = formatDate(dayDate);
                    let line = `- [ ] ${pick.t.Tag || "#申论-"+pick.t.Class} ${pick.t.Type}${pick.t.Name} (${durStr})[${timeStr}] 📅 ${dateStr}`;
                    
                    dayLines.push(line);
                    used += pick.t.Minutes;
                    timeCursor = endT;
                    if (pick.cat === "X") xIdx++; else sIdx++;
                }
            }

            // Evening: Shenlun
            if (slots[2]) {
                scheduleSlot(
                    dayDate,
                    "evening",
                    shenlunQueue,
                    { get val() { return sIdx }, set val(v) { sIdx = v } },
                    dayLines,
                    isToday ? now : null
                );
            }

            if (dayLines.length > 0) {
                if (isToday) todayTasks.push(...dayLines);
                else futureTasks.push({ date: formatDate(dayDate), lines: dayLines });
            }
            
            dayOffset++;
        }

        // 4.2 Forecast Simulation (Only if not fully scheduled in 4.1)
        // If isFullMode, we likely finished everything in 4.1, so this loop won't run.
        // If not full mode, we simulate remaining.
        
        let simXIdx = xIdx;
        let simSIdx = sIdx;
        let simDate = new Date(availability[0].date);
        simDate.setDate(simDate.getDate() + dayOffset);
        
        const simCapMorning = getMinutesBetween(config.slots.morning.start, config.slots.morning.end);
        const simCapAfternoon = getMinutesBetween(config.slots.afternoon.start, config.slots.afternoon.end);
        const simCapEvening = getMinutesBetween(config.slots.evening.start, config.slots.evening.end);
        
        while (simXIdx < xingceQueue.length || simSIdx < shenlunQueue.length) {
            const day = simDate.getDay();
            let availM = true, availA = true, availE = true;
            if (day === 6) { availM = false; availA = false; availE = false; } 
            if (day === 0) { availE = false; }

            if (availM) {
                let used = 0;
                while (simXIdx < xingceQueue.length && used < simCapMorning) {
                    used += xingceQueue[simXIdx].Minutes;
                    simXIdx++;
                }
            }
            if (availA) {
                let used = 0;
                while ((simXIdx < xingceQueue.length || simSIdx < shenlunQueue.length) && used < simCapAfternoon) {
                    if (simXIdx < xingceQueue.length) { used += xingceQueue[simXIdx].Minutes; simXIdx++; }
                    else { used += shenlunQueue[simSIdx].Minutes; simSIdx++; }
                }
            }
            if (availE) {
                let used = 0;
                while (simSIdx < shenlunQueue.length && used < simCapEvening) {
                    used += shenlunQueue[simSIdx].Minutes;
                    simSIdx++;
                }
            }
            
            if (simXIdx < xingceQueue.length || simSIdx < shenlunQueue.length) {
                simDate.setDate(simDate.getDate() + 1);
            }
        }
        
        // If we finished exactly in loop 4.1, simDate might be advanced one extra day or same.
        // Actually if loop 4.1 finished all tasks, sim loop doesn't run, simDate is dayOffset.
        // But dayOffset is relative to start.
        // If tasks finished in 4.1, the last task date was (start + dayOffset - 1).
        // Let's correct forecast date logic: it's the date of last task.
        // But for delta calc we need "Finish Date".
        
        // If tasks remain, simDate is the finish date.
        // If tasks done in 4.1, we need to know when they finished.
        let finalDate = simDate;
        if (xIdx >= xingceQueue.length && sIdx >= shenlunQueue.length && dayOffset > 0) {
             // Finished inside 4.1 loop
             finalDate = new Date(availability[0].date);
             finalDate.setDate(finalDate.getDate() + dayOffset - 1);
        }
        
        const forecastFinishDate = formatDate(finalDate);
        
        // Calculate Delta
        let lastForecast = null;
        if (historyForecasts.length > 0) {
            const lastEntry = historyForecasts[historyForecasts.length - 1].split(',');
            if (lastEntry.length >= 2) lastForecast = lastEntry[1];
        }
        let deltaDays = 0;
        if (lastForecast) {
            const lastD = new Date(lastForecast);
            const currD = new Date(forecastFinishDate);
            if (!Number.isNaN(lastD.getTime()) && !Number.isNaN(currD.getTime())) {
                deltaDays = Math.ceil((currD - lastD) / (1000 * 60 * 60 * 24));
            } else {
                deltaDays = 0;
            }
        }

        // 5. Output Generation
        // Remaining workload is what was remaining BEFORE this schedule run? Or remaining AFTER?
        // Usually "Remaining Workload" means what is left to do totally (including what we just scheduled).
        // So we calculate from queue start (0) excluding completed history.
        // But wait, user wants to know "How much left".
        // Let's show TOTAL pending (including what is scheduled in futureTasks).
        const remXMins = xingceQueue.reduce((acc, t) => acc + t.Minutes, 0);
        const remSMins = shenlunQueue.reduce((acc, t) => acc + t.Minutes, 0);
        const totalXMinsAll = allXingce.reduce((acc, t) => acc + t.Minutes, 0);
        const totalSMinsAll = shenlunQueueRaw.reduce((acc, t) => acc + t.Minutes, 0);
        const doneXMinsAll = Math.max(0, totalXMinsAll - remXMins);
        const doneSMinsAll = Math.max(0, totalSMinsAll - remSMins);
        const progressX = totalXMinsAll > 0 ? (doneXMinsAll / totalXMinsAll) : 0;
        const progressS = totalSMinsAll > 0 ? (doneSMinsAll / totalSMinsAll) : 0;
        const formatPercent = (ratio) => `${(ratio * 100).toFixed(1)}%`;

        const yaml = [
            "---",
            `examDate: ${config.examDate}`,
            `planEndDate: ${forecastFinishDate}`,
            `deltaDays: ${deltaDays}`,
            `remainingXingce: ${formatDuration(remXMins)}`,
            `remainingShenlun: ${formatDuration(remSMins)}`,
            `totalXingce: ${formatDuration(totalXMinsAll)}`,
            `totalShenlun: ${formatDuration(totalSMinsAll)}`,
            `progressXingce: ${formatPercent(progressX)}`,
            `progressShenlun: ${formatPercent(progressS)}`,
            "---"
        ].join('\n');

        outputLines.push(yaml);
        outputLines.push(`# 公考学习计划`);
        outputLines.push(`> 自动更新于: ${new Date().toLocaleString()}`);
        outputLines.push(`> 预计完成: **${forecastFinishDate}** (${deltaDays === 0 ? `不变 0 天` : (deltaDays > 0 ? `滞后 ${deltaDays} 天` : `提前 ${Math.abs(deltaDays)} 天`)})`);
        outputLines.push(`> 剩余工作量: 行测 ${formatDuration(remXMins)} / 申论 ${formatDuration(remSMins)}`);
        outputLines.push(`> 时间进度: 行测 ${formatPercent(progressX)}（${formatDuration(doneXMinsAll)}/${formatDuration(totalXMinsAll)}） / 申论 ${formatPercent(progressS)}（${formatDuration(doneSMinsAll)}/${formatDuration(totalSMinsAll)}）`);
        outputLines.push("");

        outputLines.push("## 今日已完成");
        const todayStr = formatDate(new Date());
        const todayCompleted = [];
        const pastCompleted = [];
        
        for (const line of historyCompletedLines) {
            if (line.includes(`✅ ${todayStr}`)) todayCompleted.push(line);
            else pastCompleted.push(line);
        }
        
        if (todayCompleted.length > 0) outputLines.push(...todayCompleted);
        else outputLines.push("- (暂无今日完成)");
        outputLines.push("");

        outputLines.push(`## 未来计划`);
        if (todayTasks.length > 0) {
            outputLines.push(`### ${formatDate(new Date())} (今日剩余)`);
            outputLines.push(...todayTasks);
        }
        for (const day of futureTasks) {
            outputLines.push(`### ${day.date}`);
            outputLines.push(...day.lines);
        }
        outputLines.push("");

        outputLines.push("## 历史已完成");
        outputLines.push(...pastCompleted);
        outputLines.push("");

        outputLines.push("## 历史预测记录");
        outputLines.push("```csv");
        outputLines.push("date,forecast_date,delta");
        const todayStrForForecast = formatDate(new Date());
        const forecastLine = `${todayStrForForecast},${forecastFinishDate},${deltaDays}`;
        const normalizedForecasts = (() => {
            const out = [];
            const seen = new Set();
            for (const l of historyForecasts) {
                const parsed = String(l || "").trim();
                const parts = parsed.split(",");
                if (parts.length < 1) continue;
                if (parts[0] === todayStrForForecast) continue;
                if (seen.has(parsed)) continue;
                seen.add(parsed);
                out.push(parsed);
            }
            return out;
        })();
        outputLines.push(...normalizedForecasts);
        outputLines.push(forecastLine);
        outputLines.push("```");

        const parsePlannedMinutes = (lines, catToken) => {
            let acc = 0;
            for (const line of lines) {
                if (!line.includes(catToken)) continue;
                const m = line.match(/\(([^)]+)\)\[/);
                if (!m) continue;
                acc += parseDurationStr(m[1]);
            }
            return acc;
        };

        const doneToday = completedMinutesByDate.get(todayStr) || 0;
        const doneTodayCat = completedMinutesByDateCat.get(todayStr) || { X: 0, S: 0 };
        const donePlannedTodayCat = completedMinutesByPlannedDateCat.get(todayStr) || { X: 0, S: 0 };
        const plannedTodayX = parsePlannedMinutes(todayTasks, "#行测") + donePlannedTodayCat.X;
        const plannedTodayS = parsePlannedMinutes(todayTasks, "#申论") + donePlannedTodayCat.S;
        const plannedToday = plannedTodayX + plannedTodayS;
        const doneRatioToday = plannedToday > 0 ? (doneToday / plannedToday) : 0;

        const normalizeStatsLines = (csvLines) => {
            const map = new Map();
            for (const l of csvLines) {
                const parts = l.split(",");
                if (parts.length < 2) continue;
                const d = parts[0];
                if (!d.match(/^\d{4}-\d{2}-\d{2}$/)) continue;
                map.set(d, l);
            }
            return map;
        };

        const statsMap = normalizeStatsLines(historyProgressStats);
        statsMap.set(
            todayStr,
            [
                todayStr,
                plannedToday,
                doneToday,
                (doneRatioToday * 100).toFixed(1),
                plannedTodayX,
                plannedTodayS,
                doneTodayCat.X,
                doneTodayCat.S,
                totalXMinsAll,
                doneXMinsAll,
                (progressX * 100).toFixed(1),
                totalSMinsAll,
                doneSMinsAll,
                (progressS * 100).toFixed(1)
            ].join(",")
        );

        outputLines.push("");
        outputLines.push("## 历史进度统计");
        outputLines.push("```csv");
        outputLines.push("date,planned_min,done_min,done_pct,planned_x_min,planned_s_min,done_x_min,done_s_min,x_total_min,x_done_min,x_done_pct,s_total_min,s_done_min,s_done_pct");
        outputLines.push(...Array.from(statsMap.keys()).sort().map(k => statsMap.get(k)));
        outputLines.push("```");

        // Write File
        await ensureFolder(PLAN_FOLDER);
        await writeText(CURRENT_PLAN_FILE, outputLines.join('\n'));
        
        // Remove old "-当前" file if exists to clean up
        const oldPath = `${PLAN_FOLDER}/公考学习计划-当前.md`;
        if (await exists(oldPath)) {
            try { await adapter.remove(oldPath); } catch (e) {}
        }
        
        notify("学习计划更新完毕！");
    };

    // --- Entry Point ---
    new PlanConfigModal(context.app, runUpdate).open();
};
