# TROUBLESHOOTING - 故障排除指南

本文档提供详细的故障排除步骤，帮助您解决使用 GSD Testing Setup Plugin 时遇到的问题。

---

## 目录

1. [安装问题](#安装问题)
2. [Hook 不触发](#hook-不触发)
3. [配置问题](#配置问题)
4. [版本冲突](#版本冲突)
5. [Windows 特定问题](#windows-特定问题)
6. [调试技巧](#调试技巧)

---

## 安装问题

### 问题 1: 安装脚本显示 "No GSD installation detected"

**症状：**
```
⚠️  WARNING: No GSD installation detected!
```

**原因：**
- 系统中既没有 GSD 1.x 也没有 GSD 2.x

**解决方案：**

1. **检查 GSD 是否已安装**
   ```bash
   npm list -g get-shit-done-cc  # GSD 1.x
   npm list -g gsd-pi            # GSD 2.x
   ```

2. **安装 GSD**
   ```bash
   # 安装 GSD 1.x
   npm install -g get-shit-done-cc
   
   # 或安装 GSD 2.x
   npm install -g gsd-pi
   ```

3. **重新运行安装脚本**
   ```bash
   bash install.sh  # Linux/Mac
   .\install.bat    # Windows
   ```

---

### 问题 2: 安装脚本找不到 settings.json

**症状：**
```
Error: settings.json not found
```

**原因：**
- Claude Code 未正确安装
- settings.json 路径不正确

**解决方案：**

1. **确认 Claude Code 已安装**
   ```bash
   which claude  # Linux/Mac
   where claude  # Windows
   ```

2. **检查 settings.json 是否存在**
   ```bash
   ls ~/.claude/settings.json
   ```

3. **如果不存在，创建默认配置**
   ```bash
   mkdir -p ~/.claude
   echo '{"hooks":{}}' > ~/.claude/settings.json
   ```

4. **重新运行安装脚本**

---

### 问题 3: 权限被拒绝 (Permission denied)

**症状：**
```
Permission denied: ~/.claude/hooks/gsd-testing-config.js
```

**原因：**
- 没有写入权限
- 文件被锁定

**解决方案：**

1. **检查目录权限**
   ```bash
   ls -la ~/.claude/hooks/
   ```

2. **修复权限**
   ```bash
   chmod 755 ~/.claude/hooks/
   chmod 644 ~/.claude/hooks/*.js
   ```

3. **使用 sudo（如果必要）**
   ```bash
   sudo bash install.sh
   ```

---

## Hook 不触发

### 问题 4: GSD 1.x hook 没有触发

**症状：**
- 运行 `/gsd-new-project` 时没有弹出测试配置问答
- SKILL.md 没有被注入

**诊断步骤：**

1. **检查 hook 文件是否存在**
   ```bash
   ls -la ~/.claude/hooks/gsd-testing-config.js
   ls -la ~/.claude/hooks/gsd-testing-patch.js
   ```

2. **检查 hooks 是否注册**
   ```bash
   cat ~/.claude/settings.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('hooks', {}), indent=2))"
   ```
   
   应该看到：
   ```json
   {
     "PreToolUse": [...],
     "SessionStart": [...]
   }
   ```

3. **检查 SKILL.md 是否被注入**
   ```bash
   grep "gsd-testing-plugin" ~/.claude/skills/gsd-new-project/SKILL.md
   ```
   
   应该看到：
   ```
   <!-- gsd-testing-plugin v2.2.0 — auto-patched, do not remove this comment -->
   ```

4. **检查 debug 日志**
   ```bash
   tail -f /tmp/gsd-testing-hook-debug.log
   ```
   
   然后运行 `/gsd-new-project`，观察日志输出。

**解决方案：**

**情况 A: Hook 文件不存在**
```bash
bash install.sh  # 重新安装
```

**情况 B: Hooks 未注册**
```bash
bash uninstall.sh  # 先卸载
bash install.sh    # 重新安装
```

**情况 C: SKILL.md 未注入**
```bash
# 手动触发 SessionStart hook
node ~/.claude/hooks/gsd-testing-patch.js
```

**情况 D: 配置已预设（跳过问答）**
```bash
# 检查配置
cat .planning/config.json | grep framework
cat ~/.gsd/defaults.json | grep framework

# 删除配置以重新触发问答
rm .planning/config.json
rm ~/.gsd/defaults.json
```

---

### 问题 5: GSD 2.x skill 没有触发

**症状：**
- 输入 `new project` 或 `testing setup` 时没有加载 skill

**诊断步骤：**

1. **检查 skill 是否安装**
   ```bash
   ls ~/.agents/skills/gsd-testing-setup/SKILL.md
   ```

2. **检查 skill 内容**
   ```bash
   cat ~/.agents/skills/gsd-testing-setup/SKILL.md | head -20
   ```

3. **测试触发词**
   - 在 Claude Code 中输入：`new project`
   - 或：`testing setup`
   - 或：`test configuration`

**解决方案：**

**情况 A: Skill 未安装**
```bash
bash install.sh  # 重新安装
```

**情况 B: Skill 文件损坏**
```bash
rm -rf ~/.agents/skills/gsd-testing-setup
bash install.sh
```

**情况 C: 触发词不匹配**
- 使用完整的触发词：`new project`（不是 `newproject`）
- 或直接说：`I want to set up testing for this project`

---

## 配置问题

### 问题 6: 配置没有保存

**症状：**
- 回答了测试配置问答，但配置文件不存在
- 下次运行时又弹出问答

**诊断步骤：**

1. **检查配置文件是否存在**
   ```bash
   # GSD 1.x
   cat .planning/config.json
   
   # GSD 2.x
   cat .gsd/testing-config.json
   ```

2. **检查 gsd-sdk 是否可用（GSD 1.x）**
   ```bash
   which gsd-sdk
   gsd-sdk --version
   ```

3. **检查目录权限**
   ```bash
   ls -la .planning/  # GSD 1.x
   ls -la .gsd/       # GSD 2.x
   ```

**解决方案：**

**GSD 1.x:**
```bash
# 手动创建配置
mkdir -p .planning
gsd-sdk query config-set testing.framework "jest"
gsd-sdk query config-set testing.runner_command "npm test"
gsd-sdk query config-set testing.coverage_command "npm test -- --coverage"
gsd-sdk query config-set testing.coverage_threshold 80
gsd-sdk query config-set workflow.tdd_mode true
```

**GSD 2.x:**
```bash
# 手动创建配置
mkdir -p .gsd
cat > .gsd/testing-config.json << EOF
{
  "framework": "jest",
  "runner_command": "npm test",
  "coverage_command": "npm test -- --coverage",
  "coverage_threshold": 80,
  "tdd_mode": true
}
EOF
```

---

### 问题 7: 配置被覆盖

**症状：**
- 修改了配置，但又被重置

**原因：**
- 全局默认配置覆盖了项目配置
- Hook 重新触发并覆盖了配置

**解决方案：**

1. **检查全局默认配置**
   ```bash
   cat ~/.gsd/defaults.json
   ```

2. **删除全局默认配置（如果不需要）**
   ```bash
   rm ~/.gsd/defaults.json
   ```

3. **设置 skip_prompt 防止重新触发**
   ```bash
   # GSD 1.x
   gsd-sdk query config-set testing.skip_prompt true
   
   # GSD 2.x
   # 配置文件存在即可，不会重新触发
   ```

---

## 版本冲突

### 问题 8: 同时安装了 GSD 1.x 和 2.x，出现冲突

**症状：**
- 两个版本的配置互相干扰
- 不确定使用的是哪个版本

**诊断步骤：**

1. **检查安装的版本**
   ```bash
   node test-version-detection.js
   ```

2. **检查配置文件**
   ```bash
   ls -la .planning/config.json  # GSD 1.x
   ls -la .gsd/testing-config.json  # GSD 2.x
   ```

**解决方案：**

**方案 A: 保留两个版本（推荐）**
- 两个版本可以共存，互不干扰
- 使用 GSD 1.x 时，配置在 `.planning/config.json`
- 使用 GSD 2.x 时，配置在 `.gsd/testing-config.json`

**方案 B: 只保留一个版本**
```bash
# 卸载 GSD 1.x
npm uninstall -g get-shit-done-cc
bash uninstall.sh

# 或卸载 GSD 2.x
npm uninstall -g gsd-pi
rm -rf ~/.agents/skills/gsd-testing-setup
```

---

### 问题 9: 升级 GSD 后插件失效

**症状：**
- GSD 升级后，测试配置问答不再弹出

**原因：**
- GSD 1.x 升级可能重置了 SKILL.md
- GSD 2.x 升级可能清理了自定义 skills

**解决方案：**

**GSD 1.x:**
```bash
# SessionStart hook 会自动重新注入
# 如果没有，手动触发：
node ~/.claude/hooks/gsd-testing-patch.js

# 或重新安装插件
bash install.sh
```

**GSD 2.x:**
```bash
# 重新安装 skill
bash install.sh
```

---

## Windows 特定问题

### 问题 10: install.bat 执行失败

**症状：**
```
'node' is not recognized as an internal or external command
```

**原因：**
- Node.js 未安装或未添加到 PATH

**解决方案：**

1. **检查 Node.js 是否安装**
   ```cmd
   node --version
   ```

2. **安装 Node.js**
   - 下载：https://nodejs.org/
   - 安装时勾选 "Add to PATH"

3. **手动添加到 PATH**
   - 右键"此电脑" → "属性" → "高级系统设置" → "环境变量"
   - 在"系统变量"中找到"Path"，添加 Node.js 安装路径

4. **重启 CMD/PowerShell**

---

### 问题 11: 路径包含空格导致错误

**症状：**
```
Error: Cannot find module 'C:\Program'
```

**原因：**
- Windows 路径包含空格，未正确引用

**解决方案：**

1. **使用短路径名**
   ```cmd
   dir /x "C:\Program Files"
   # 找到短路径名，如 PROGRA~1
   ```

2. **或重新安装 Node.js 到无空格路径**
   ```
   C:\nodejs\
   ```

3. **或使用引号**
   - 编辑 `install.bat`，确保所有路径都用引号包围

---

### 问题 12: 行尾符问题 (CRLF vs LF)

**症状：**
```
Syntax error near unexpected token
```

**原因：**
- `.bat` 文件使用了 LF 行尾符（应该是 CRLF）

**解决方案：**

1. **使用 dos2unix 转换**
   ```bash
   unix2dos install.bat
   unix2dos uninstall.bat
   ```

2. **或使用编辑器转换**
   - Notepad++: 编辑 → EOL 转换 → Windows (CR LF)
   - VS Code: 右下角点击 "LF" → 选择 "CRLF"

3. **重新运行安装脚本**

---

## 调试技巧

### 技巧 1: 启用详细日志

**GSD 1.x:**
```bash
# 查看 hook debug 日志
tail -f /tmp/gsd-testing-hook-debug.log
```

**GSD 2.x:**
```bash
# 查看 Claude Code 日志
tail -f ~/.claude/logs/claude-code.log
```

---

### 技巧 2: 手动测试 hook

**测试 PreToolUse hook:**
```bash
echo '{"tool_name":"Skill","tool_input":{"skill":"gsd-new-project"},"cwd":"'$(pwd)'"}' | node ~/.claude/hooks/gsd-testing-config.js
```

**测试 SessionStart hook:**
```bash
node ~/.claude/hooks/gsd-testing-patch.js
```

---

### 技巧 3: 验证版本检测

```bash
cd claude-gsd-testing-plugin
node test-version-detection.js
```

---

### 技巧 4: 检查 JSON 语法

```bash
# 检查 settings.json 语法
python3 -m json.tool ~/.claude/settings.json

# 检查配置文件语法
python3 -m json.tool .planning/config.json  # GSD 1.x
python3 -m json.tool .gsd/testing-config.json  # GSD 2.x
```

---

### 技巧 5: 完全重置

如果所有方法都失败，尝试完全重置：

```bash
# 1. 卸载插件
bash uninstall.sh

# 2. 清理所有相关文件
rm -rf ~/.claude/hooks/gsd-testing-*.js
rm -rf ~/.agents/skills/gsd-testing-setup
rm -f /tmp/gsd-testing-hook-debug.log

# 3. 备份配置
cp ~/.claude/settings.json ~/.claude/settings.json.backup

# 4. 重新安装插件
git pull origin main
bash install.sh

# 5. 重启 Claude Code
```

---

## 获取帮助

如果以上方法都无法解决您的问题，请：

1. **收集诊断信息**
   ```bash
   # 创建诊断报告
   cat > diagnostic-report.txt << EOF
   === System Info ===
   OS: $(uname -a)
   Node.js: $(node --version)
   
   === GSD Versions ===
   $(node test-version-detection.js)
   
   === Plugin Files ===
   GSD 1.x hooks:
   $(ls -la ~/.claude/hooks/gsd-testing-*.js 2>&1)
   
   GSD 2.x skill:
   $(ls -la ~/.agents/skills/gsd-testing-setup/ 2>&1)
   
   === Settings ===
   $(cat ~/.claude/settings.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('hooks', {}), indent=2))" 2>&1)
   
   === Debug Log ===
   $(tail -20 /tmp/gsd-testing-hook-debug.log 2>&1)
   EOF
   
   cat diagnostic-report.txt
   ```

2. **提交 GitHub Issue**
   - 访问：https://github.com/ZhouJunCheng/claude-gsd-testing-plugin/issues
   - 附上诊断报告
   - 描述问题和重现步骤

3. **查看 FAQ**
   - 参考 [FAQ.md](FAQ.md) 获取更多常见问题解答
