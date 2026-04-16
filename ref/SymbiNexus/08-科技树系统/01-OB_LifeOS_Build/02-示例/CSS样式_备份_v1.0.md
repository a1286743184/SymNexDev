```
成就稀有度区分辉光效果+五种时间圆角矩形打底区分颜色
***
/* ================================== */
/* ====== 成就系统游戏化样式 (V4) ====== */
/* ================================== */

/* * V4 版本更新:
 * - 将所有辉光效果 (text-shadow) 替换为标签式的圆角矩形背景。
 * - 调整文字颜色为白色，以确保在彩色背景上的可读性。
 * - 新增内边距 (padding) 和圆角 (border-radius) 来营造标签的视觉效果。
*/

/* --- 传说 (Legendary) --- */
.achievement-legendary {
    background-color: #D97706 !important; /* 更沉稳的金色/琥珀色背景 */
    color: #ffffff !important; /* 白色文字以保证对比度 */
    font-weight: 700 !important;
    padding: 2px 8px !important; /* 上下2px，左右8px的内边距 */
    border-radius: 5px !important; /* 5px的圆角半径 */
    text-shadow: none !important; /* 移除所有文本阴影 */
}

/* --- 史诗 (Epic) --- */
.achievement-epic {
    background-color: #9333EA !important; /* 鲜艳的紫色背景 */
    color: #ffffff !important;
    font-weight: 600 !important;
    padding: 2px 8px !important;
    border-radius: 5px !important;
    text-shadow: none !important;
}

/* --- 稀有 (Rare) --- */
.achievement-rare {
    background-color: #2563EB !important; /* 清晰的蓝色背景 */
    color: #ffffff !important;
    font-weight: 500 !important;
    padding: 2px 8px !important;
    border-radius: 5px !important;
    text-shadow: none !important;
}

/* --- 普通 (Common) --- */
.achievement-common {
    background-color: #16A34A !important; /* 沉稳的绿色背景 */
    color: #ffffff !important;
    font-weight: normal !important;
    padding: 2px 8px !important;
    border-radius: 5px !important;
    text-shadow: none !important;
}
参考这个css样式的实现，以及
[
  {
    "name": "成就-传说",
    "regex": "(【传说】.*)",
    "class": "achievement-legendary",
    "mark": true,
    "replace": "",
    "attributes": {},
    "repeat": false,
    "types": [
      "markdown-preview"
    ]
  },
  {
    "name": "成就-史诗",
    "regex": "(【史诗】.*)",
    "class": "achievement-epic",
    "mark": true,
    "replace": "",
    "attributes": {},
    "repeat": false,
    "types": [
      "markdown-preview"
    ]
  },
  {
    "name": "成就-稀有",
    "regex": "(【稀有】.*)",
/* ================================== */
/* ====== 成就系统游戏化样式 (V5) ====== */
/* ================================== */

/* * V5 版本更新 (基于 V3):
 * - 进一步减小所有辉光的模糊半径，使效果更收敛、精致。
 * - 将【稀有】和【普通】等级的字体同样设置为加粗，统一视觉风格。
 * - 使用前提：本样式需配合去除成就名下划线的 Markdown 写法。
*/

/* --- 传说 (Legendary) --- */
.achievement-legendary {
    background: transparent !important;
    color: #ff9900 !important;
    font-weight: 700 !important; /* 加粗 */
    padding: 0;
    /* [修改] 模糊半径从 4px 进一步减为 3px */
    text-shadow: 0 0 3px rgba(255, 153, 0, 0.5); 
}

/* --- 史诗 (Epic) --- */
.achievement-epic {
    background: transparent !important;
    color: #a335ee !important;
    font-weight: 600 !important; /* 加粗 */
    padding: 0;
    /* [修改] 模糊半径从 3px 进一步减为 2px */
    text-shadow: 0 0 2px rgba(163, 53, 238, 0.5);
}

/* --- 稀有 (Rare) --- */
.achievement-rare {
    background: transparent !important;
    color: #0070dd !important;
    /* [修改] 从 500 改为 600，变为加粗显示 */
    font-weight: 600 !important;
    padding: 0;
    /* [修改] 模糊半径从 3px 进一步减为 2px */
    text-shadow: 0 0 2px rgba(0, 112, 221, 0.5);
}

/* --- 普通 (Common) --- */
.achievement-common {
    background: transparent !important;
    color: #28a745 !important;
    /* [修改] 从 normal 改为 600，变为加粗显示 */
    font-weight: 600 !important;
    padding: 0;
    /* [修改] 模糊半径从 3px 进一步减为 2px，并降低透明度 */
    text-shadow: 0 0 2px rgba(40, 167, 69, 0.35);
}


/* ================================== */
/* ====== 时间日志分类标签样式 ====== */
/* ================================== */

/* --- 生存 (Survival) --- */
.timelog-shengji {
    background-color: #e85a0c !important;
    color: #ffffff !important;
    font-weight: 600 !important;
    padding: 2px 8px !important;
    border-radius: 15px !important;
    text-shadow: none !important;
}

/* --- 升级 (Upgrade) --- */
.timelog-shengcun {
    background-color: #806c5e !important;
    color: #ffffff !important;
    font-weight: 600 !important;
    padding: 2px 8px !important;
    border-radius: 15px !important;
    text-shadow: none !important;
}

/* --- 赚钱 (Earning) --- */
.timelog-yuyue {
    background-color: #c084fc !important;
    color: #ffffff !important;
    font-weight: 600 !important;
    padding: 2px 8px !important;
    border-radius: 15px !important;
    text-shadow: none !important;
}

/* --- 愉悦 (Pleasure) --- */
.timelog-zhuanqian {
    background-color: #2588eb !important;
    color: #ffffff !important;
    font-weight: 600 !important;
    padding: 2px 8px !important;
    border-radius: 15px !important;
    text-shadow: none !important;
}

/* --- 黑洞 (Black Hole) --- */
.timelog-heidong {
    background-color: #2f2f2f !important;
    color: #ffffff !important;
    font-weight: 600 !important;
    padding: 2px 8px !important;
    border-radius: 15px !important;
    text-shadow: none !important;
}

```