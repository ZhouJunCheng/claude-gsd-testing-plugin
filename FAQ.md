# FAQ - 常见问题解答

## 版本相关

### Q1: 如何检测当前安装的 GSD 版本？

**方法 1: 使用测试脚本**
```bash
cd claude-gsd-testing-plugin
node test-version-detection.js
```

输出示例：
```
GSD Version Detection Results:

GSD 1.x (get-shit-done-cc):
  - Globally installed: No
  - Skills directory exists: Yes
  - Skill path: /home/user/.claude/skills/gsd-new-project
  - Config directory: .planning

GSD 2.x (gsd-pi):
  - Globally installed: Yes
  - Skills directory exists: No
  - Skill path: /home/user/.agents/skills
  - Config directory: .gsd
```

**方法 2: 手动检查**
```bash
# 检查 GSD 1.x
ls ~/.claude/skills/gsd-new-project
npm list -g get-shit-done-cc

# 检查 GSD 2.x
ls ~/.agents/skills
npm list -g gsd-pi
```

---

### Q2: 如何在两个版本之间切换？

GSD 1.x 和 GSD 2.x 可以共存，无需切换。插件会根据您使用的 GSD 版本自动工作：

- 使用 GSD 1.x 的 `/gsd-new-project` → 触发 GSD 1.x 组件（hooks）
- 使用 GSD 2.x 的 `new project` → 触发 GSD 2.x 组件（skill）

如果您想只使用一个版本：

**卸载 GSD 1.x**
```bash
npm uninstall -g get-shit-done-cc
bash uninstall.sh  # 卸载插件的 GSD 1.x 组件
```

**卸载 GSD 2.x**
```bash
npm uninstall -g gsd-pi
rm -rf ~/.agents/skills/gsd-testing-setup  # 卸载插件的 GSD 2.x 组件
```

---

### Q3: 如果同时安装了两个版本会怎样？

完全没问题！插件设计为支持双版本共存：

1. **安装时**: 安装脚本检测到两个版本，会安装所有组件
2. **运行时**: 
   - GSD 1.x 组件有版本检测，只在 GSD 1.x 环境中执行
   - GSD 2.x 组件独立运行，不会冲突
3. **配置**: 两个版本使用不同的配置文件路径
   - GSD 1.x: `.planning/config.json`
   - GSD 2.x: `.gsd/testing-config.json`

---

### Q4: 我升级了 GSD，插件还能用吗？

**GSD 1.x 升级**
- ✅ 插件会继续工作
- ⚠️ 如果 GSD 更新重置了 `SKILL.md`，`SessionStart` hook 会在下次会话启动时自动重新注入

**GSD 2.x 升级**
- ✅ 插件会继续工作
- ✅ 自定义 skill 独立于 GSD 核心，不受升级影响

**从 GSD 1.x 迁移到 GSD 2.x**
1. 安装 GSD 2.x: `npm install -g gsd-pi`
2. 重新运行安装脚本: `bash install.sh`
3. 安装脚本会自动检测并安装 GSD 2.x 组件

---

## 安装相关

### Q5: 安装脚本显示 "No GSD installation detected"，怎么办？

这表示您的系统中既没有 GSD 1.x 也没有 GSD 2.x。请先安装 GSD：

**安装 GSD 1.x**
```bash
npm install -g get-shit-done-cc
```

**安装 GSD 2.x**
```bash
npm install -g gsd-pi
```

然后重新运行插件安装脚本：
```bash
bash install.sh  # Linux/Mac
.\install.bat    # Windows
```

---

### Q6: 我已经安装了旧版本的插件，如何升级？

**方法 1: 重新安装（推荐）**
```bash
cd claude-gsd-testing-plugin
git pull origin main
bash install.sh  # 或 .\install.bat
```

安装脚本会：
- 自动备份现有配置
- 覆盖旧文件
- 更新 hooks 注册
- 重新注入 SKILL.md patch

**方法 2: 先卸载再安装**
```bash
bash uninstall.sh
git pull origin main
bash install.sh
```

---

### Q7: 安装后没有弹出测试配置问答？

**检查清单：**

1. **确认插件已安装**
   ```bash
   # GSD 1.x
   ls ~/.claude/hooks/gsd-testing-config.js
   grep "gsd-testing-plugin" ~/.claude/skills/gsd-new-project/SKILL.md
   
   # GSD 2.x
   ls ~/.agents/skills/gsd-testing-setup/SKILL.md
   ```

2. **确认配置未预设**
   ```bash
   # GSD 1.x
   cat .planning/config.json | grep framework
   cat ~/.gsd/defaults.json | grep framework
   
   # GSD 2.x
   cat .gsd/testing-config.json
   ```
   
   如果已有配置，插件会自动跳过问答。

3. **重启 Claude Code**
   - 关闭所有 Claude Code 窗口
   - 重新启动

4. **检查 hooks 是否注册**
   ```bash
   cat ~/.claude/settings.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('hooks', {}), indent=2))"
   ```

---

## 配置相关

### Q8: 如何修改已保存的测试配置？

**GSD 1.x**
```bash
# 方法 1: 使用 gsd-sdk
gsd-sdk query config-set testing.framework "pytest"
gsd-sdk query config-set testing.coverage_threshold 90

# 方法 2: 直接编辑配置文件
vim .planning/config.json
```

**GSD 2.x**
```bash
# 直接编辑配置文件
vim .gsd/testing-config.json
```

修改后，下次运行 `/gsd-new-project` 时会使用新配置。

---

### Q9: 如何为不同项目设置不同的测试框架？

配置是**项目级别**的，每个项目可以有不同的配置：

**GSD 1.x**
- 配置保存在项目的 `.planning/config.json`
- 每个项目独立配置

**GSD 2.x**
- 配置保存在项目的 `.gsd/testing-config.json`
- 每个项目独立配置

**全局默认配置（可选）**
```bash
# GSD 1.x
echo '{"testing":{"framework":"jest"}}' > ~/.gsd/defaults.json

# 新项目会使用这个默认值，但仍可以在项目中覆盖
```

---

### Q10: 如何跳过测试配置问答？

**临时跳过（单个项目）**

GSD 1.x:
```bash
# 在项目中预设配置
gsd-sdk query config-set testing.skip_prompt true
```

GSD 2.x:
```bash
# 创建空配置文件
mkdir -p .gsd
echo '{"skip_prompt":true}' > .gsd/testing-config.json
```

**永久跳过（所有项目）**

GSD 1.x:
```bash
mkdir -p ~/.gsd
echo '{"testing":{"skip_prompt":true}}' > ~/.gsd/defaults.json
```

GSD 2.x:
- 不创建 `.gsd/testing-config.json` 文件即可

---

## 使用相关

### Q11: 支持哪些测试框架？

插件支持 **9 个主流测试框架**：

| 框架 | 语言 | ID |
|-----|------|-----|
| JUnit 5 | Java | `junit5` |
| pytest | Python | `pytest` |
| unittest | Python | `unittest` |
| Vitest | JS/TS | `vitest` |
| Jest | JS/TS | `jest` |
| go test | Go | `go-test` |
| testify | Go | `testify` |
| Kotest | Kotlin | `kotest` |
| cargo test | Rust | `cargo-test` |
| xUnit | .NET | `dotnet-test` |

---

### Q12: 如何添加自定义测试框架？

**GSD 1.x**

编辑 `gsd1/gsd-testing-config.js`，在 `ALL_FRAMEWORKS` 数组中添加：

```javascript
{
  id: 'my-framework',
  label: 'My Framework (Language)',
  lang: 'lang',
  desc: 'Description of the framework',
  runner: 'command to run tests',
  coverage: 'command to run coverage'
}
```

然后重新运行安装脚本。

**GSD 2.x**

编辑 `gsd2/gsd-testing-setup-skill/SKILL.md`，在 options 列表中添加新框架，然后重新安装 skill。

---

### Q13: TDD 模式是什么？启用后有什么影响？

**TDD (Test-Driven Development)** 是测试驱动开发模式：

- **启用 TDD**: Claude 会在实现功能之前先生成测试
- **禁用 TDD**: Claude 会在实现功能之后再生成测试

**影响范围：**
- GSD 的 planner agents 会根据 `workflow.tdd_mode` 调整计划生成策略
- 执行阶段会优先运行测试（RED），然后实现功能（GREEN），最后重构（REFACTOR）

---

## 故障排除

### Q14: Hook 没有触发，怎么调试？

**GSD 1.x 调试**

1. **检查 debug 日志**
   ```bash
   tail -f /tmp/gsd-testing-hook-debug.log
   ```

2. **手动测试 hook**
   ```bash
   echo '{"tool_name":"Skill","tool_input":{"skill":"gsd-new-project"},"cwd":"'$(pwd)'"}' | node ~/.claude/hooks/gsd-testing-config.js
   ```

3. **检查 hook 权限**
   ```bash
   ls -la ~/.claude/hooks/gsd-testing-*.js
   # 应该有执行权限
   ```

**GSD 2.x 调试**

1. **检查 skill 是否存在**
   ```bash
   cat ~/.agents/skills/gsd-testing-setup/SKILL.md
   ```

2. **测试触发词**
   - 在 Claude Code 中输入 `new project` 或 `testing setup`
   - 检查是否加载了 skill

---

### Q15: Windows 上安装失败？

**常见问题：**

1. **权限不足**
   - 以管理员身份运行 PowerShell 或 CMD
   - 右键点击 `install.bat` → "以管理员身份运行"

2. **路径包含空格**
   - 确保 Node.js 安装路径不包含空格
   - 或使用短路径名（8.3 格式）

3. **Node.js 未安装或版本过低**
   ```cmd
   node --version
   # 应该 >= 18
   ```

4. **行尾符问题**
   - 确保 `.bat` 文件使用 CRLF 行尾符
   - 使用 `dos2unix` 或编辑器转换

---

## 更多问题？

如果您的问题未在此列出，请：

1. 查看 [TROUBLESHOOTING.md](TROUBLESHOOTING.md) 获取详细的故障排除指南
2. 在 [GitHub Issues](https://github.com/ZhouJunCheng/claude-gsd-testing-plugin/issues) 提交问题
3. 提供以下信息：
   - 操作系统和版本
   - GSD 版本（1.x 或 2.x）
   - 插件版本
   - 错误信息或日志
   - 重现步骤
