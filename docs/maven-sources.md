# Maven Source Navigation

[中文版](./maven-sources_CN.md)

This document explains how Maven source navigation works and provides manual setup scripts.

## How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Your Project                            │
│  ┌─────────────────┐                                        │
│  │   .vscode/      │  ← Project GTAGS database              │
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
│  │   GTAGS         │  ← Library GTAGS database              │
│  │   GRTAGS        │                                        │
│  │   GPATH         │                                        │
│  ├─────────────────┤                                        │
│  │   com/          │  ← Extracted source files              │
│  │   org/          │                                        │
│  │   ...           │                                        │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `GTAGSDBPATH` | Path to the GTAGS database directory |
| `GTAGSROOT` | Root directory of the source project |
| `GTAGSLIBPATH` | Path to external library GTAGS database |

When searching for a symbol:
1. GNU Global first searches in `GTAGSDBPATH` (project database)
2. If not found, it searches in `GTAGSLIBPATH` (library database)

### File Detection

When you open a file, the plugin detects its location:
- **Project files**: Use project's `.vscode/GTAGS`
- **Maven source files** (`~/.m2/sources/*`): Use `~/.m2/sources/GTAGS`

## Manual Setup Scripts

### Linux / macOS

```bash
#!/bin/bash

# 1. Download Maven dependency sources
cd /path/to/your/maven/project
mvn dependency:sources

# 2. Create sources directory
mkdir -p ~/.m2/sources

# 3. Extract all source JARs
find ~/.m2/repository -name "*-sources.jar" -exec unzip -o -d ~/.m2/sources {} \;

# 4. Build GTAGS database for sources
cd ~/.m2/sources
gtags

echo "Done! GTAGS database created at ~/.m2/sources"
```

### Windows (PowerShell)

```powershell
# 1. Download Maven dependency sources
cd C:\path\to\your\maven\project
mvn dependency:sources

# 2. Create sources directory
$sourcesDir = "$env:USERPROFILE\.m2\sources"
New-Item -ItemType Directory -Force -Path $sourcesDir

# 3. Extract all source JARs
$repoDir = "$env:USERPROFILE\.m2\repository"
Get-ChildItem -Path $repoDir -Recurse -Filter "*-sources.jar" | ForEach-Object {
    Expand-Archive -Path $_.FullName -DestinationPath $sourcesDir -Force
}

# 4. Build GTAGS database for sources
cd $sourcesDir
gtags

Write-Host "Done! GTAGS database created at $sourcesDir"
```

### Windows (Git Bash)

```bash
#!/bin/bash

# 1. Download Maven dependency sources
cd /c/path/to/your/maven/project
mvn dependency:sources

# 2. Create sources directory
mkdir -p ~/.m2/sources

# 3. Extract all source JARs (using 7z or unzip)
find ~/.m2/repository -name "*-sources.jar" -exec unzip -o -d ~/.m2/sources {} \;

# 4. Build GTAGS database for sources
cd ~/.m2/sources
gtags

echo "Done! GTAGS database created at ~/.m2/sources"
```

## Updating Sources

When you add new dependencies to your project:

```bash
# 1. Download new sources
mvn dependency:sources

# 2. Extract new JARs (will overwrite existing)
find ~/.m2/repository -name "*-sources.jar" -exec unzip -o -d ~/.m2/sources {} \;

# 3. Update GTAGS database (incremental update)
cd ~/.m2/sources
gtags -i  # or 'global -u' for update
```

## Troubleshooting

### "File is out of the source project" Error

This error occurs when trying to view document symbols for a file outside the GTAGS project scope.

**Solution**: The plugin automatically detects Maven source files and uses the correct GTAGS database.

### Symbols Not Found in Libraries

1. Ensure you've downloaded sources: `mvn dependency:sources`
2. Ensure you've extracted sources to `~/.m2/sources`
3. Ensure you've built GTAGS: `cd ~/.m2/sources && gtags`

### Multiple Definitions Found

When clicking on a class name (e.g., `Lists`), multiple definitions may be found if:
- Multiple libraries define the same class name
- The class exists in both main and shaded packages

**Solution**: When clicking on an `import` statement, the plugin filters results by the full package path.

## Directory Structure

```
~/.m2/
├── repository/           # Maven local repository
│   └── com/
│       └── google/
│           └── guava/
│               └── guava/
│                   └── 31.1-jre/
│                       ├── guava-31.1-jre.jar
│                       └── guava-31.1-jre-sources.jar  ← Source JAR
│
└── sources/              # Extracted sources + GTAGS
    ├── GTAGS             # GNU Global database
    ├── GRTAGS
    ├── GPATH
    └── com/
        └── google/
            └── common/
                └── collect/
                    └── Lists.java  ← Extracted source
```

