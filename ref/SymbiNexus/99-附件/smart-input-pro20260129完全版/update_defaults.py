import os

user_path = r"d:\Docements\Obsidian Vault\SymbiNexus\.obsidian\plugins\smart-input-pro\prompts\user.js"
defaults_path = r"d:\Docements\Obsidian Vault\SymbiNexus\.obsidian\plugins\smart-input-pro\prompts\defaults.js"

with open(user_path, 'r', encoding='utf-8') as f:
    data = f.read()

# Locate pipeline start
p_start_kw = "pipeline: {"
p_start_idx = data.find(p_start_kw)
if p_start_idx == -1:
    print("Error: pipeline start not found")
    exit(1)

# Locate modules start
m_start_kw = "modules: {"
m_start_idx = data.find(m_start_kw)
if m_start_idx == -1:
    print("Error: modules start not found")
    exit(1)

# Part 1: Content inside pipeline
# data[p_start_idx + len(p_start_kw) : m_start_idx]
raw_part1 = data[p_start_idx + len(p_start_kw) : m_start_idx]

# Find the last '}' in raw_part1 and remove it
last_brace_idx = raw_part1.rfind('}')
if last_brace_idx == -1:
    print("Error: pipeline closing brace not found")
    exit(1)

clean_part1 = raw_part1[:last_brace_idx] 
# Add comma
clean_part1 = clean_part1.rstrip() + ",\n"

# Part 2: modules section
raw_part2 = data[m_start_idx:]

# Remove the last }; (module.exports closing)
end_idx = raw_part2.rfind('}')
if end_idx != -1:
    raw_part2 = raw_part2[:end_idx]
else:
    print("Error: Could not find module.exports closing brace")
    exit(1)

# Remove the last } (overrides closing)
raw_part2 = raw_part2.rstrip() # remove whitespace/newlines before finding brace
end_idx = raw_part2.rfind('}')
if end_idx != -1:
    raw_part2 = raw_part2[:end_idx]
else:
    print("Error: Could not find overrides closing brace")
    exit(1)
    
clean_part2 = raw_part2.rstrip()

# Construct defaults.js
header = """/**
 * SmartInputPro 默认提示词配置
 * 仅作为新用户/重置时的基线，只读
 * 生成时间: 2026/01/29
 */
module.exports = {
    /**
     * ⚠️以此格式编辑时特别注意：
     * 任何形如 ${text} 或 ${currentDate} 的占位符，
     * 必须在 $ 符号前加反斜杠转义，写成 \\${text} 或 \\${currentDate}。
     * 否则会导致插件加载失败 (ReferenceError)。
     */
    version: 1,
    prompts: {"""

footer = """
    }
};
"""

new_content = header + clean_part1 + "\n" + clean_part2 + footer

with open(defaults_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
    
print("Successfully updated defaults.js")
