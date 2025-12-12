# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Busybox** is a VSCode extension that provides a comprehensive collection of developer toolkits and utilities. It's a JavaScript/Node.js project with the latest version being 0.10.1, published by user "wenning" on the VSCode Marketplace.

The extension offers 27+ commands organized into several categories:
- Code conversion tools (JSON ↔ Go Struct, Excel ↔ JSON)
- Encoding/decoding utilities (Base64, URL encode/decode)
- Timestamp tools (current time, formatting, parsing)
- Editor enhancements (center window, open files in IntelliJ IDEA)
- **GNU Global integration** for advanced code navigation (go to definition, find references, Maven source navigation)

## Development Commands

### Build and Development
```bash
npm run lint     # Run ESLint code quality checks
npm run test     # Run test suite with Mocha
```

### Extension Development
- **Debug Extension**: Use VSCode debug configuration "Run Extension" to launch extension in a new VSCode window
- **Extension Testing**: Use VSCode debug configuration "Extension Tests" to run the test suite
- **Hot Reload**: Changes are reflected immediately in the development extension host

### Extension Testing
- **Test Framework**: Mocha with TDD interface
- **Test Runner**: VSCode test framework (`vscode-test`)
- **Test Location**: `/test/suite/`
- **Run Tests**: `npm run test` (automatically runs lint first via `pretest`)

## Key Architecture and Structure

### Entry Point
- **Main File**: `extension.js` - Registers all commands and activates features
- **Architecture**: Event-driven with command subscriptions pattern
- **Dependencies**: Uses `child-process-promise` for external commands (GNU Global), `iconv-lite` for encoding

### Core Library Structure (`src/`)
- **busybox.js** (20KB) - Main functionality implementation with all utility functions
- **global-integration.js** (18KB) - GNU Global integration for code navigation
- **json2go.js** (8KB) - JSON to Go struct conversion
- **gostruct2json.js** (1KB) - Go struct to JSON conversion
- **excel.js** (2KB) - Excel ↔ JSON conversion

### GNU Global Integration (Advanced Feature)
The extension implements sophisticated code navigation using GNU Global:

1. **Database Management**:
   - Project database stored in `.vscode/` directory
   - Library database in `~/.m2/sources/` for Maven dependencies
   - Environment variables: `GTAGSDBPATH`, `GTAGSROOT`, `GTAGSLIBPATH`

2. **Features**:
   - Go to definition (`F12`)
   - Find all references (`Shift+F12`)
   - Document symbols (`Ctrl+Shift+O`)
   - Smart jump with `Ctrl+Click`

3. **Maven Integration**:
   - Downloads dependency sources
   - Extracts and indexes source JARs
   - Builds gtags database for external libraries
   - Auto-updates database when files change

### Command Registration
All commands are registered in `package.json` under `contributes.commands` and implemented in `extension.js`:

```javascript
// Example command registration pattern
let commandName = vscode.commands.registerCommand('busybox.commandName', function () {
    busybox.functionName();
});
context.subscriptions.push(commandName);
```

### Configuration
Extension settings are defined in `package.json` under `contributes.configuration.properties`:
- `busybox.idea.cmd.path` - IntelliJ IDEA command path (default: "idea64")
- `busybox.gnuGlobal.enabled` - Enable GNU Global integration (default: false)
- `busybox.gnuGlobal.autoupdate` - Auto-update database on file changes (default: true)
- `busybox.gnuGlobal.encoding` - Character encoding for GNU Global output

## Important Files and Locations

### Source Files
- `src/lib/busybox.js` - Main implementation with all utility functions
- `src/lib/global-integration.js` - GNU Global integration and Maven source navigation
- `src/lib/json2go.js` - JSON to Go struct conversion logic
- `src/lib/excel.js` - Excel ↔ JSON conversion utilities

### Configuration Files
- `package.json` - Project configuration, dependencies, and VSCode extension manifest
- `.eslintrc.json` - ESLint configuration for code quality
- `.vscode/launch.json` - Debug configurations for extension development
- `.vscodeignore` - Files to exclude when packaging extension

### Documentation
- `README.md` - English documentation with feature overview
- `README_CN.md` - Chinese documentation
- `CHANGELOG.md` - Version history
- `docs/maven-sources.md` - Maven source navigation guide (English)
- `docs/maven-sources_CN.md` - Maven source navigation guide (Chinese)

## Common Development Tasks

### Adding New Commands
1. Add command to `package.json` under `contributes.commands`
2. Implement function in `src/lib/busybox.js`
3. Register command in `extension.js` using the pattern shown above
4. Update README.md with documentation

### GNU Global Development
- GNU Global must be installed separately (`brew install global` or `scoop install global`)
- Enable with `busybox.gnuGlobal.enabled: true` in VSCode settings
- Database creation uses GTAGS in `.vscode` directory
- Maven source navigation requires downloading and extracting JAR sources

### Testing
- Tests use Mocha TDD interface
- Test files in `/test/suite/` directory
- Run with `npm run test` or VSCode debug configuration
- Extension testing environment available for isolated testing

### Extension Packaging
- Use VSCode extension packaging tools
- Files in `.vscodeignore` are excluded from packaged extension
- Dependencies are bundled during packaging process

## Tips for Development

1. **GNU Global Integration**: This is the most complex feature - understand the dual database system (project + library)
2. **Encoding Support**: Use `iconv-lite` for character encoding conversions in GNU Global output
3. **Extension Lifecycle**: Use `context.subscriptions.push()` to properly clean up resources
4. **Error Handling**: Always handle async operations with try/catch for external commands
5. **Configuration**: Use VSCode configuration API for user settings rather than hardcoded values

## External Dependencies

- **GNU Global**: Required for code navigation features
- **child-process-promise**: For executing external commands
- **iconv-lite**: For character encoding support
- **VSCode Extension API**: Core extension functionality

## File Organization

```
busybox/
├── src/                    # Main source code
│   ├── busybox.js         # Main implementation
│   ├── global-integration.js # GNU Global features
│   ├── json2go.js         # JSON conversion
│   ├── gostruct2json.js   # Go struct conversion
│   └── excel.js           # Excel utilities
├── test/                   # Test files
├── docs/                   # Documentation
├── asset/                  # Images and GIFs
├── .vscode/               # VSCode configuration
├── node_modules/          # Dependencies
├── package.json           # Project configuration
├── extension.js           # Main extension entry
└── README.md/README_CN.md # Documentation
```