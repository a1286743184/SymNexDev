成就稀有度区分辉光效果+五种时间圆角矩形打底区分颜色
***
{
  "mark": [
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
      ],
      "viewMode": {
        "reading": true,
        "source": true,
        "live": true
      }
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
      ],
      "viewMode": {
        "reading": true,
        "source": true,
        "live": true
      }
    },
    {
      "name": "成就-稀有",
      "regex": "(【稀有】.*)",
      "class": "achievement-rare",
      "mark": true,
      "replace": "",
      "attributes": {},
      "repeat": false,
      "types": [
        "markdown-preview"
      ],
      "viewMode": {
        "reading": true,
        "source": true,
        "live": true,
        "codeBlock": true
      }
    },
    {
      "name": "成就-普通",
      "regex": "(【普通】.*)",
      "class": "achievement-common",
      "mark": true,
      "replace": "",
      "attributes": {},
      "repeat": false,
      "types": [
        "markdown-preview"
      ],
      "viewMode": {
        "reading": true,
        "source": true,
        "live": true,
        "codeBlock": true
      }
    },
    {
      "name": "时间记录-生存",
      "regex": "(【生存】)",
      "class": "timelog-shengcun",
      "mark": true,
      "replace": "",
      "attributes": {},
      "repeat": false,
      "types": [
        "markdown-preview"
      ],
      "viewMode": {
        "reading": true,
        "source": true,
        "live": true
      }
    },
    {
      "name": "时间记录-升级",
      "regex": "(【升级】)",
      "class": "timelog-shengji",
      "mark": true,
      "replace": "",
      "attributes": {},
      "repeat": false,
      "types": [
        "markdown-preview"
      ],
      "viewMode": {
        "reading": true,
        "source": true,
        "live": true
      }
    },
    {
      "name": "时间记录-赚钱",
      "regex": "(【赚钱】)",
      "class": "timelog-zhuanqian",
      "mark": true,
      "replace": "",
      "attributes": {},
      "repeat": false,
      "types": [
        "markdown-preview"
      ],
      "viewMode": {
        "reading": true,
        "source": true,
        "live": true
      }
    },
    {
      "name": "时间记录-愉悦",
      "regex": "(【愉悦】)",
      "class": "timelog-yuyue",
      "mark": true,
      "replace": "",
      "attributes": {},
      "repeat": false,
      "types": [
        "markdown-preview"
      ],
      "viewMode": {
        "reading": true,
        "source": true,
        "live": true
      }
    },
    {
      "name": "时间记录-黑洞",
      "regex": "(【黑洞】)",
      "class": "timelog-heidong",
      "mark": true,
      "replace": "",
      "attributes": {},
      "repeat": false,
      "types": [
        "markdown-preview"
      ],
      "viewMode": {
        "reading": true,
        "source": true,
        "live": true
      }
    }
  ],
  "pattern": {
    "open": "{{open:(.*?)}}",
    "close": "{{close:(.*?)}}"
  },
  "propertyName": "regex_mark"
}