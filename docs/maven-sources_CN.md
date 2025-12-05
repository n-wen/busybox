# Maven 源码导航

[English](./maven-sources.md)

本文档介绍 Maven 源码导航的工作原理以及手动设置脚本。

## 工作原理

### 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                      你的项目                                │
│  ┌─────────────────┐                                        │
│  │   .vscode/      │  ← 项目 GTAGS 数据库                    │
│  │   ├── GTAGS     │                                        │
│  │   ├── GRTAGS    │                                        │
│  │   └── GPATH     │                                        │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ GTAGSLIBPATH
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   ~/.m2/sources/                             │
│  ┌─────────────────┐                                        │
│  │   GTAGS         │  ← 库 GTAGS 数据库                      │
│  │   GRTAGS        │                                        │
│  │   GPATH         │                                        │
│  ├─────────────────┤                                        │
│  │   com/          │  ← 解压的源码文件                        │
│  │   org/          │                                        │
│  │   ...           │                                        │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

### 环境变量

| 变量 | 描述 |
|------|------|
| `GTAGSDBPATH` | GTAGS 数据库目录路径 |
| `GTAGSROOT` | 源码项目根目录 |
| `GTAGSLIBPATH` | 外部库 GTAGS 数据库路径 |

查找符号时：
1. GNU Global 首先在 `GTAGSDBPATH`（项目数据库）中搜索
2. 如果未找到，则在 `GTAGSLIBPATH`（库数据库）中搜索

### 文件检测

当你打开文件时，插件会检测其位置：
- **项目文件**：使用项目的 `.vscode/GTAGS`
- **Maven 源码文件**（`~/.m2/sources/*`）：使用 `~/.m2/sources/GTAGS`

## 手动设置脚本

### Linux / macOS

```bash
#!/bin/bash

# 1. 下载 Maven 依赖源码
cd /path/to/your/maven/project
mvn dependency:sources

# 2. 创建源码目录
mkdir -p ~/.m2/sources

# 3. 解压所有源码 JAR
find ~/.m2/repository -name "*-sources.jar" -exec unzip -o -d ~/.m2/sources {} \;

# 4. 为源码构建 GTAGS 数据库
cd ~/.m2/sources
gtags

echo "完成！GTAGS 数据库已创建在 ~/.m2/sources"
```

### Windows (PowerShell)

```powershell
# 1. 下载 Maven 依赖源码
cd C:\path\to\your\maven\project
mvn dependency:sources

# 2. 创建源码目录
$sourcesDir = "$env:USERPROFILE\.m2\sources"
New-Item -ItemType Directory -Force -Path $sourcesDir

# 3. 解压所有源码 JAR
$repoDir = "$env:USERPROFILE\.m2\repository"
Get-ChildItem -Path $repoDir -Recurse -Filter "*-sources.jar" | ForEach-Object {
    Expand-Archive -Path $_.FullName -DestinationPath $sourcesDir -Force
}

# 4. 为源码构建 GTAGS 数据库
cd $sourcesDir
gtags

Write-Host "完成！GTAGS 数据库已创建在 $sourcesDir"
```

### Windows (Git Bash)

```bash
#!/bin/bash

# 1. 下载 Maven 依赖源码
cd /c/path/to/your/maven/project
mvn dependency:sources

# 2. 创建源码目录
mkdir -p ~/.m2/sources

# 3. 解压所有源码 JAR（使用 7z 或 unzip）
find ~/.m2/repository -name "*-sources.jar" -exec unzip -o -d ~/.m2/sources {} \;

# 4. 为源码构建 GTAGS 数据库
cd ~/.m2/sources
gtags

echo "完成！GTAGS 数据库已创建在 ~/.m2/sources"
```

## 更新源码

当你向项目添加新依赖时：

```bash
# 1. 下载新源码
mvn dependency:sources

# 2. 解压新 JAR（会覆盖现有文件）
find ~/.m2/repository -name "*-sources.jar" -exec unzip -o -d ~/.m2/sources {} \;

# 3. 更新 GTAGS 数据库（增量更新）
cd ~/.m2/sources
gtags -i  # 或 'global -u' 进行更新
```

## 故障排除

### "File is out of the source project" 错误

当尝试查看 GTAGS 项目范围外的文件的文档符号时会出现此错误。

**解决方案**：插件会自动检测 Maven 源码文件并使用正确的 GTAGS 数据库。

### 在库中找不到符号

1. 确保已下载源码：`mvn dependency:sources`
2. 确保已解压源码到 `~/.m2/sources`
3. 确保已构建 GTAGS：`cd ~/.m2/sources && gtags`

### 找到多个定义

当点击类名（如 `Lists`）时，可能会找到多个定义，如果：
- 多个库定义了相同的类名
- 该类同时存在于主包和 shaded 包中

**解决方案**：当点击 `import` 语句时，插件会根据完整包路径过滤结果。

## 目录结构

```
~/.m2/
├── repository/           # Maven 本地仓库
│   └── com/
│       └── google/
│           └── guava/
│               └── guava/
│                   └── 31.1-jre/
│                       ├── guava-31.1-jre.jar
│                       └── guava-31.1-jre-sources.jar  ← 源码 JAR
│
└── sources/              # 解压的源码 + GTAGS
    ├── GTAGS             # GNU Global 数据库
    ├── GRTAGS
    ├── GPATH
    └── com/
        └── google/
            └── common/
                └── collect/
                    └── Lists.java  ← 解压的源码
```

