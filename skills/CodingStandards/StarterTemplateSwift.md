# Swift Starter Templates

Curated GitHub templates for scaffolding new Swift/macOS projects.

| Template | Repo | Use When |
|---|---|---|
| SwiftUI macOS app | [simonweniger/swift-macos-template](https://github.com/simonweniger/swift-macos-template) | Full macOS app: sidebar, detail pane, search, menu bar |
| Menu bar app | [hellodx-co/macos-menu-bar-starter-kit](https://github.com/hellodx-co/macos-menu-bar-starter-kit) | Lightweight menu bar utility with NSStatusItem |
| SwiftUI resource examples | [stakes/swiftui-macos-resources](https://github.com/stakes/swiftui-macos-resources) | Reference patterns for SwiftUI on macOS |

## Quickstart

```bash
# Clone SwiftUI app template
git clone https://github.com/simonweniger/swift-macos-template MyApp
open MyApp/MyApp.xcodeproj

# Clone menu bar starter
git clone https://github.com/hellodx-co/macos-menu-bar-starter-kit MyMenuApp
open MyMenuApp/*.xcodeproj
```

## Notes

- All templates require Xcode 15+, macOS 12+ target
- SwiftUI apps: use `WindowGroup` + `@main App` entry point (see `Swift.md`)
- For CLI tools compiled to `.app` bundles: build manually with `swiftc` (see `Swift.md` AppKit section)
