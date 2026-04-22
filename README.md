# GSD Testing Setup Plugin

> 为 [GSD (Get Shit Done)](https://github.com/gsd-build/get-shit-done) 提供的测试框架配置插件。在 `/gsd-new-project` 启动时自动触发，引导用户完成单元测试框架选择，无需修改 GSD 任何源代码。

## 实现效果

### 触发时机

用户运行 `/gsd-new-project` 时，Claude Code 在执行 workflow 第一步之前，自动弹出三个必选问答：

```
1. Unit Testing Framework  — 选择单元测试框架（必选）
2. Coverage Threshold      — 设置覆盖率目标（必选）
3. TDD Mode                — 是否启用测试驱动开发
```

### 智能推荐

插件自动检测项目文件，将最适合的框架排在第一位并标注 `✓ Recommended`：

| 项目特征 | 推荐框架 |
|---|---|
| `package.json` + `vite` / `vitest` dep | Vitest (JS/TS) |
| `package.json` + `jest` dep | Jest (JS/TS) |
| `package.json` scripts.test 含 `vitest` | Vitest (JS/TS) |
| `package.json` scripts.test 含 `jest` | Jest (JS/TS) |
| 纯 Node（无特征） | Jest (JS/TS)（fallback） |
| `requirements.txt` / `pyproject.toml` / `setup.py` | pytest (Python) |
| `go.mod` | go test (Go) |
| `Cargo.toml` | cargo test (Rust) |
| `pom.xml` | JUnit 5 (Java) |
| `build.gradle` / `build.gradle.kts` | Kotest (Kotlin) |
| `*.csproj` | xUnit (.NET) |

### 支持的框架（10个）

| 框架 | 语言 | 说明 |
|---|---|---|
| Vitest | JS/TS | Vite-native，速度极快，ESM 原生支持 |
| Jest | JS/TS | 生态最成熟，内置 mock 和 snapshot |
| pytest | Python | fixture、参数化、插件生态最强 |
| unittest | Python | 标准库内建，无需安装 |
| go test | Go | Go 内建，零依赖，标准 |
| testify | Go | go test + 断言增强，最流行的 Go 测试库 |
| JUnit 5 | Java | Java 单元测试标配，配合 Mockito 使用 |
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
    "framework": "vitest",
    "runner_command": "npm test",
    "coverage_command": "npm run test:coverage",
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

## 安装方式

### 前置条件

- [Claude Code](https://claude.ai/code) 已安装
- [GSD](https://github.com/gsd-build/get-shit-done) 已安装（`npm i -g get-shit-done-cc`）
- Node.js >= 18

### 步骤

**1. 复制插件文件**

```bash
mkdir -p ~/.claude/skills/gsd-testing-setup
mkdir -p ~/.claude/hooks

cp gsd-testing-config.js ~/.claude/hooks/
cp install.sh ~/.claude/skills/gsd-testing-setup/
```

**2. 运行安装脚本**

```bash
chmod +x ~/.claude/skills/gsd-testing-setup/install.sh
~/.claude/skills/gsd-testing-setup/install.sh
```

安装脚本会：
- 自动备份现有 `settings.json` → `settings.json.YYYYMMDD.bak`
- 注册 `PreToolUse` hook（matcher: Skill）

**3. 验证安装**

```bash
ls ~/.claude/hooks/gsd-testing-config.js
cat ~/.claude/settings.json
```

`settings.json` 应包含：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Skill",
        "hooks": [
          { "type": "command", "command": "node ~/.claude/hooks/gsd-testing-config.js" }
        ]
      }
    ]
  }
}
```

### 全局跳过（可选）

```bash
mkdir -p ~/.gsd

# 跳过所有提示
echo '{"testing":{"skip_prompt":true}}' > ~/.gsd/defaults.json

# 或预设默认框架
echo '{"testing":{"framework":"vitest"},"workflow":{"tdd_mode":true}}' > ~/.gsd/defaults.json
```

### 手动配置（可选）

```bash
gsd-sdk query config-set testing.framework "vitest"
gsd-sdk query config-set testing.runner_command "npm test"
gsd-sdk query config-set testing.coverage_command "npm run test:coverage"
gsd-sdk query config-set testing.coverage_threshold 80
gsd-sdk query config-set workflow.tdd_mode true
```
