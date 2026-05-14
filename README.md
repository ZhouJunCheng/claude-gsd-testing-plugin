# GSD Testing Setup Plugin

> 为 [GSD (Get Shit Done)](https://github.com/gsd-build/get-shit-done) 提供的测试框架配置插件。在 `/gsd-new-project` 启动时自动触发，引导用户完成单元测试框架选择，无需修改 GSD 任何源代码。

![GSD](https://img.shields.io/badge/GSD-1.x%20%7C%202.x-blue) ![Claude Code](https://img.shields.io/badge/Claude%20Code-required-orange) ![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green)

## 🎯 双版本支持

**v2.3.0** 开始，本插件同时支持 **GSD 1.x** 和 **GSD 2.x**：

| GSD 版本 | 实现方式 | 自动检测 |
|---------|---------|---------|
| **GSD 1.x** (`get-shit-done-cc`) | SessionStart hook + PreToolUse hook + SKILL.md patch | ✅ 检测 `~/.claude/skills/gsd-new-project` |
| **GSD 2.x** (`gsd-pi`) | 自定义 Skill (`gsd-testing-setup`) | ✅ 检测 `~/.agents/skills` |

**安装脚本会自动检测您的环境，只安装需要的组件。** 如果同时安装了两个版本，两套组件都会被安装。

## 实现效果

用户运行 `/gsd-new-project` 时，Claude 在执行 workflow 第一步之前，自动弹出三个必选问答：

```
1. Unit Testing Framework  — 选择单元测试框架（必选）
2. Coverage Threshold      — 设置覆盖率目标（必选）
3. TDD Mode                — 是否启用测试驱动开发
```

### 支持的框架（9个）

| 框架 | 语言 | 说明 |
|---|---|---|
| JUnit 5 | Java | Java 单元测试标配，配合 Mockito 使用 |
| pytest | Python | fixture、参数化、插件生态最强 |
| Vitest | JS/TS | Vite-native，速度极快，ESM 原生支持 |
| Jest | JS/TS | 生态最成熟，内置 mock 和 snapshot |
| go test | Go | Go 内建，零依赖，标准 |
| testify | Go | go test + 断言增强，最流行的 Go 测试库 |
| Kotest | Kotlin | Kotlin-first，DSL 风格，协程支持 |
| cargo test | Rust | Rust 内建 `#[test]`，零配置 |
| xUnit | .NET | C#/F# 最流行的单元测试框架 |

### 问答设计原则

- **Unit Testing Framework**：必选，无 None/Skip 选项
- **Coverage Threshold**：必选，80% / 90% / 100%，无"不设置"选项
- **TDD Mode**：Yes (Recommended) / No

### 配置写入位置

回答完成后，配置自动写入项目的 `.planning/config.json`：

```json
{
  "testing": {
    "framework": "junit5",
    "runner_command": "mvn test",
    "coverage_command": "mvn test jacoco:report",
    "coverage_threshold": 80
  },
  "workflow": {
    "tdd_mode": true
  }
}
```

### 跳过条件

以下任一条件满足时，插件自动跳过不弹出问答：

- 项目 `.planning/config.json` 中 `testing.framework` 已配置
- 项目 `.planning/config.json` 中 `testing.skip_prompt: true`
- `~/.gsd/defaults.json` 中预设了框架或 `skip_prompt: true`

---

## 工作原理

### GSD 1.x 实现方式

Claude Code 的 `PreToolUse` hook 对 `Skill` 工具的拦截**只对 Claude 程序化调用 Skill 时生效**，用户直接输入 `/gsd-new-project` slash 命令时，Claude Code 直接加载 SKILL.md，完全绕过 hook 机制。

因此采用两个互补组件：

| 组件 | 类型 | 作用 |
|---|---|---|
| `gsd-testing-patch.js` | `SessionStart` hook | 每次会话启动时检查 `gsd-new-project/SKILL.md`，GSD 更新后自动重新注入测试配置问答 |
| `gsd-testing-config.js` | `PreToolUse` hook | 拦截程序化 Skill 调用（如从另一个 skill 内部调用 `gsd-new-project`），使用 `block` 决策阻止执行并要求先完成测试配置 |

**执行流程：**

1. 安装时：在 `gsd-new-project/SKILL.md` 注入 `<pre_workflow_testing_setup>` 块（Step 0）
2. Claude 读取 SKILL.md 时优先看到 Step 0，弹出 3 个测试问答
3. 用户回答后，Claude 用 `gsd-sdk` 写入配置到 `.planning/config.json`，继续正常 workflow
4. GSD 更新重置 SKILL.md 后，下次会话启动时 `SessionStart` hook 自动重新注入

### GSD 2.x 实现方式

GSD 2.x 使用新的 Agents 架构，支持自定义 Skill。本插件提供：

| 组件 | 位置 | 作用 |
|---|---|---|
| `gsd-testing-setup` skill | `~/.agents/skills/gsd-testing-setup/` | 独立的测试配置 skill，通过触发器自动激活 |

**执行流程：**

1. 安装时：复制 skill 到 `~/.agents/skills/gsd-testing-setup/`
2. 用户输入 `new project`、`testing setup` 等触发词时，Claude 自动加载该 skill
3. Skill 弹出 3 个测试问答（与 GSD 1.x 相同的问题）
4. 用户回答后，配置写入 `.gsd/testing-config.json`

### 版本检测

安装脚本会自动检测您的环境：

```bash
# 检测 GSD 1.x
~/.claude/skills/gsd-new-project 目录是否存在

# 检测 GSD 2.x
~/.agents/skills 目录是否存在
```

根据检测结果，只安装需要的组件：
- **仅 GSD 1.x**: 安装 hooks + SKILL.md patch
- **仅 GSD 2.x**: 安装自定义 skill
- **两者都有**: 安装所有组件
- **都没有**: 显示警告和安装建议

---

## 安装方式

### 前置条件

- [Claude Code](https://claude.ai/code) 已安装
- **GSD 1.x** (`get-shit-done-cc` >= 1.37.1) 或 **GSD 2.x** (`gsd-pi`) 或两者都有
- Node.js >= 18

### 步骤

**1. Clone 仓库**

```bash
git clone https://github.com/ZhouJunCheng/claude-gsd-testing-plugin.git
cd claude-gsd-testing-plugin
```

**2. 运行安装脚本**

macOS / Linux / WSL：
```bash
bash install.sh
```

Windows（PowerShell 或 CMD）：
```bat
.\install.bat
```

**3. 安装脚本会自动检测您的环境并安装相应组件**

#### 检测到 GSD 1.x
```
=== GSD Version Detection ===
GSD 1.x: Skills directory exists
GSD 2.x: Not found

=== Installing GSD 1.x Support ===
✓ Copied hooks to ~/.claude/hooks/
✓ Registered hooks in settings.json
✓ Applied SKILL.md patch

=== Installation Summary ===
✓ GSD 1.x support installed (hooks)
```

安装内容：
- 复制 `gsd-testing-config.js` 和 `gsd-testing-patch.js` 到 `~/.claude/hooks/`
- 自动备份所有 `settings*.json` → `settings*.json.YYYYMMDD-HHMMSS.bak`
- 在所有 `settings*.json` 中注册 `PreToolUse` hook 和 `SessionStart` hook
- 立即将测试配置问答注入 `gsd-new-project/SKILL.md`

#### 检测到 GSD 2.x
```
=== GSD Version Detection ===
GSD 1.x: Not found
GSD 2.x: Skills directory exists

=== Installing GSD 2.x Support ===
✓ Copied skill to ~/.agents/skills/gsd-testing-setup/

=== Installation Summary ===
✓ GSD 2.x support installed (skill)
```

安装内容：
- 复制 `gsd-testing-setup` skill 到 `~/.agents/skills/gsd-testing-setup/`
- 包含 SKILL.md、默认配置和安装脚本

#### 检测到两个版本
```
=== GSD Version Detection ===
GSD 1.x: Skills directory exists
GSD 2.x: Skills directory exists

=== Installing GSD 1.x Support ===
✓ Copied hooks to ~/.claude/hooks/
✓ Registered hooks in settings.json
✓ Applied SKILL.md patch

=== Installing GSD 2.x Support ===
✓ Copied skill to ~/.agents/skills/gsd-testing-setup/

=== Installation Summary ===
✓ GSD 1.x support installed (hooks)
✓ GSD 2.x support installed (skill)
```

#### 未检测到任何版本
```
=== GSD Version Detection ===
GSD 1.x: Not found
GSD 2.x: Not found

⚠️  WARNING: No GSD installation detected!

Please install GSD first:
  - GSD 1.x: npm install -g get-shit-done-cc
  - GSD 2.x: npm install -g gsd-pi

Then run this installer again.
```

**4. 验证安装**

GSD 1.x 验证：
```bash
# 确认 hook 文件存在
ls ~/.claude/hooks/gsd-testing-config.js
ls ~/.claude/hooks/gsd-testing-patch.js

# 确认 SKILL.md 已注入
grep -c "gsd-testing-plugin" ~/.claude/skills/gsd-new-project/SKILL.md

# 确认 SessionStart hook 已注册
cat ~/.claude/settings.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['hooks']['SessionStart'])"
```

GSD 2.x 验证：
```bash
# 确认 skill 已安装
ls ~/.agents/skills/gsd-testing-setup/SKILL.md

# 测试版本检测
node test-version-detection.js
```

`settings.json` 应包含：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Skill",
        "hooks": [{ "type": "command", "command": "node \"/home/<user>/.claude/hooks/gsd-testing-config.js\"", "timeout": 10 }]
      }
    ],
    "SessionStart": [
      {
        "hooks": [{ "type": "command", "command": "node \"/home/<user>/.claude/hooks/gsd-testing-patch.js\"" }]
      }
    ]
  }
}
```

### 配置文件位置

根据 GSD 版本，配置写入不同位置：

| GSD 版本 | 配置文件路径 | 写入方式 |
|---------|------------|---------|
| **GSD 1.x** | `.planning/config.json` | `gsd-sdk query config-set` |
| **GSD 2.x** | `.gsd/testing-config.json` | 直接写入 JSON |

### 全局跳过（可选）

#### GSD 1.x
```bash
mkdir -p ~/.gsd

# 跳过所有提示
echo '{"testing":{"skip_prompt":true}}' > ~/.gsd/defaults.json

# 或预设默认框架（不再弹出问答）
echo '{"testing":{"framework":"junit5"},"workflow":{"tdd_mode":false}}' > ~/.gsd/defaults.json
```

#### GSD 2.x
```bash
# 在项目中预设配置
mkdir -p .gsd
echo '{"framework":"junit5","runner_command":"mvn test","coverage_command":"mvn test jacoco:report","coverage_threshold":80,"tdd_mode":false}' > .gsd/testing-config.json
```

### 手动配置（可选）

#### GSD 1.x
```bash
gsd-sdk query config-set testing.framework "junit5"
gsd-sdk query config-set testing.runner_command "mvn test"
gsd-sdk query config-set testing.coverage_command "mvn test jacoco:report"
gsd-sdk query config-set testing.coverage_threshold 80
gsd-sdk query config-set workflow.tdd_mode false
```

#### GSD 2.x
```bash
# 直接编辑配置文件
cat > .gsd/testing-config.json << EOF
{
  "framework": "junit5",
  "runner_command": "mvn test",
  "coverage_command": "mvn test jacoco:report",
  "coverage_threshold": 80,
  "tdd_mode": false
}
EOF
```

---

## 卸载方式

macOS / Linux / WSL：
```bash
bash uninstall.sh
```

Windows（PowerShell 或 CMD）：
```bat
.\uninstall.bat
```

卸载脚本会自动检测并卸载相应组件：

### GSD 1.x 卸载
- 删除 `~/.claude/hooks/gsd-testing-config.js` 和 `gsd-testing-patch.js`
- 自动备份所有 `settings*.json`
- 从所有 `settings*.json` 中移除两个 hook 注册项
- 从 `gsd-new-project/SKILL.md` 中移除注入的测试配置块

### GSD 2.x 卸载
- 删除 `~/.agents/skills/gsd-testing-setup/` 目录

重启 Claude Code 后生效。

---

## 项目结构

```
claude-gsd-testing-plugin/
├── gsd1/                              # GSD 1.x 组件
│   ├── gsd-testing-config.js          # PreToolUse hook（带版本检测）
│   └── gsd-testing-patch.js           # SessionStart hook（带版本检测）
│
├── gsd2/                              # GSD 2.x 组件
│   ├── gsd-testing-setup-skill/       # 自定义 Skill
│   │   └── SKILL.md                   # Skill 定义
│   ├── install-gsd2-skill.js          # Skill 安装脚本
│   └── testing-defaults.json          # 默认配置模板
│
├── gsd-version-detector.js            # 版本检测模块
├── gsd-config-writer.js               # 统一配置写入接口
├── test-version-detection.js          # 版本检测测试
│
├── gsd-testing-config.js              # 向后兼容包装器（重定向到 gsd1/）
├── gsd-testing-patch.js               # 向后兼容包装器（重定向到 gsd1/）
│
├── install-helper.js                  # Windows 安装辅助脚本
├── install.sh                         # Linux/Mac 安装脚本
├── install.bat                        # Windows 安装脚本
├── uninstall-helper.js                # Windows 卸载辅助脚本
├── uninstall.sh                       # Linux/Mac 卸载脚本
├── uninstall.bat                      # Windows 卸载脚本
│
├── README.md                          # 本文档
├── FAQ.md                             # 常见问题解答
└── TROUBLESHOOTING.md                 # 故障排除指南
```

---

## 常见问题

详见 [FAQ.md](FAQ.md)

---

## 故障排除

详见 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 多 settings 文件支持

Claude Code 支持多个 profile（对应不同模型），每个 profile 有独立的 `settings*.json`。安装脚本会扫描 `~/.claude/settings*.json`（排除 `.bak` 备份），自动在所有文件中注册 hook，确保切换 profile 后插件仍然生效。
