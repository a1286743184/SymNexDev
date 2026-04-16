# -*- coding: utf-8 -*-
"""
JSON to Markdown Task Converter
将学习计划数据转换为任务看板可识别的 Markdown 格式

Usage:
    python converter.py [--output 面试学习计划.md] [--test]
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any


def format_duration(minutes: float) -> str:
    """将分钟数格式化为 (Xm) 或 (XhYm) 格式"""
    total_mins = int(round(minutes))
    if total_mins < 60:
        return f"({total_mins}m)"
    hours = total_mins // 60
    mins = total_mins % 60
    if mins == 0:
        return f"({hours}h)"
    return f"({hours}h{mins}m)"


def load_json(filepath: str) -> Optional[Dict]:
    """加载 JSON 文件"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"[WARN] File not found: {filepath}")
        return None
    except json.JSONDecodeError as e:
        print(f"[ERROR] JSON parse error in {filepath}: {e}")
        return None


def get_completed_tasks(progress: Dict) -> Dict[str, str]:
    """从进度文件获取已完成任务及其完成日期"""
    completed = {}
    for task_id, info in progress.get('completed_tasks', {}).items():
        if isinstance(info, dict) and info.get('completed_at'):
            completed[task_id] = info['completed_at'][:10]  # YYYY-MM-DD
        elif isinstance(info, str):
            completed[task_id] = info[:10]
    return completed


def generate_task_line(
    task_type: str,
    title: str,
    duration_minutes: float,
    date: str,
    task_id: str = "",
    completed_tasks: Dict[str, str] = None,
    is_completed: bool = False
) -> str:
    """生成单行任务 Markdown"""
    completed_tasks = completed_tasks or {}
    
    tag_map = {
        'video': '#面试-视频',
        'internalization': '#面试-内化',
        'memory': '#面试-背诵',
        'review': '#面试-复习'
    }
    
    tag = tag_map.get(task_type, '#面试-其他')
    duration = format_duration(duration_minutes)
    
    checkbox = "[ ]"
    completion_date = ""
    
    if is_completed or task_id in completed_tasks:
        checkbox = "[x]"
        comp_date = completed_tasks.get(task_id, "")
        if comp_date:
            completion_date = f" ✅ {comp_date}"
    
    return f"- {checkbox} {tag} {title} {duration} 📅 {date}{completion_date}"


def convert_day_plan(
    day_plan: Dict,
    completed_tasks: Dict[str, str]
) -> List[str]:
    """转换单日计划为 Markdown 行列表"""
    lines = []
    
    date = day_plan.get('date', '')
    day_num = day_plan.get('day', '')
    day_name = day_plan.get('day_name', f'Day {day_num}')
    
    lines.append(f"## {date} ({day_name})")
    lines.append("")
    
    video_tasks = day_plan.get('video_tasks', [])
    internalization_tasks = day_plan.get('internalization_tasks', [])
    memory_tasks = day_plan.get('memory_tasks', [])
    review_tasks = day_plan.get('review_tasks', [])
    
    if video_tasks:
        lines.append("### 视频任务")
        for task in video_tasks:
            title = task.get('title', '未知视频')
            duration = task.get('duration_minutes', 0)
            video_id = task.get('video_id', '')
            line = generate_task_line(
                'video', title, duration, date, video_id, completed_tasks
            )
            lines.append(line)
        lines.append("")
    
    if internalization_tasks:
        lines.append("### 内化任务")
        for task in internalization_tasks:
            title = task.get('title', '未知例题')
            duration = task.get('estimated_minutes', 25)
            task_id = task.get('task_id', '')
            line = generate_task_line(
                'internalization', title, duration, date, task_id, completed_tasks
            )
            lines.append(line)
        lines.append("")
    
    if memory_tasks:
        lines.append("### 背诵任务")
        for task in memory_tasks:
            title = task.get('title', '未知例题')
            duration = task.get('estimated_minutes', 12)
            question_id = task.get('question_id', '')
            line = generate_task_line(
                'memory', title, duration, date, question_id, completed_tasks
            )
            lines.append(line)
        lines.append("")
    
    if review_tasks:
        lines.append("### 复习任务")
        for task in review_tasks:
            title = task.get('title', '复习内容')
            duration = task.get('estimated_minutes', 7)
            task_id = task.get('id', '')
            is_completed = task.get('is_completed', False)
            line = generate_task_line(
                'review', title, duration, date, task_id, completed_tasks, is_completed
            )
            lines.append(line)
        lines.append("")
    
    return lines


def convert_all(
    daily_plan_path: str,
    progress_path: str,
    output_path: str
) -> bool:
    """执行完整转换"""
    
    daily_data = load_json(daily_plan_path)
    if not daily_data:
        print("[ERROR] Failed to load daily plan data")
        return False
    
    progress_data = load_json(progress_path) or {}
    completed_tasks = get_completed_tasks(progress_data)
    
    lines = []
    
    lines.append("# 面试学习计划")
    lines.append("")
    
    generated_at = daily_data.get('generated_at', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    lines.append(f"> 自动生成于: {generated_at}")
    
    metadata = daily_data.get('metadata', {})
    total_days = daily_data.get('total_days', len(daily_data.get('daily_plan', [])))
    lines.append(f"> 学习周期: 共 {total_days} 天")
    lines.append("")
    
    time_breakdown = metadata.get('time_breakdown', {})
    if time_breakdown:
        lines.append("## 时间分配概览")
        lines.append("")
        lines.append(f"| 类型 | 时长 |")
        lines.append(f"|------|------|")
        lines.append(f"| 视频观看 | {time_breakdown.get('video_hours', 0):.1f}h |")
        lines.append(f"| 内化改造 | {time_breakdown.get('internalization_hours', 0):.1f}h |")
        lines.append(f"| 背诵掌握 | {time_breakdown.get('memory_hours', 0):.1f}h |")
        lines.append(f"| 艾宾浩斯复习 | {time_breakdown.get('review_hours', 0):.1f}h |")
        lines.append(f"| **总计** | **{time_breakdown.get('total_hours', 0):.1f}h** |")
        lines.append("")
    
    daily_plan = daily_data.get('daily_plan', [])
    
    lines.append("## 每日任务")
    lines.append("")
    
    for day_plan in daily_plan:
        day_lines = convert_day_plan(day_plan, completed_tasks)
        lines.extend(day_lines)
    
    content = "\n".join(lines)
    
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[OK] Generated: {output_path}")
        print(f"     Total days: {len(daily_plan)}")
        print(f"     Completed tasks: {len(completed_tasks)}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to write output: {e}")
        return False


def generate_test_output(output_path: str) -> bool:
    """生成测试输出（仅包含前3天）"""
    
    daily_data = load_json('daily_tasks_adjusted.json')
    if not daily_data:
        return False
    
    progress_data = load_json('my_progress.json') or {}
    completed_tasks = get_completed_tasks(progress_data)
    
    lines = []
    lines.append("# 面试学习计划 (测试输出 - 前3天)")
    lines.append("")
    lines.append(f"> 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("")
    
    daily_plan = daily_data.get('daily_plan', [])[:3]
    
    for day_plan in daily_plan:
        day_lines = convert_day_plan(day_plan, completed_tasks)
        lines.extend(day_lines)
    
    content = "\n".join(lines)
    
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[OK] Test output generated: {output_path}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to write test output: {e}")
        return False


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Convert JSON learning plan to Markdown tasks')
    parser.add_argument('--output', '-o', default='面试学习计划.md', help='Output file path')
    parser.add_argument('--test', '-t', action='store_true', help='Generate test output (first 3 days only)')
    args = parser.parse_args()
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    print("=" * 50)
    print("JSON to Markdown Task Converter")
    print("=" * 50)
    print(f"Working directory: {script_dir}")
    print()
    
    if args.test:
        test_output = 'test_output.md'
        success = generate_test_output(test_output)
    else:
        success = convert_all(
            'daily_tasks_adjusted.json',
            'my_progress.json',
            args.output
        )
    
    if success:
        print()
        print("[DONE] Conversion completed successfully!")
    else:
        print()
        print("[FAILED] Conversion failed. Check errors above.")
        exit(1)


if __name__ == '__main__':
    main()
