# Swift Standards

**Targets:** macOS 12+ apps (SwiftUI preferred), AppKit for legacy/system-level access.

## Fundamentals

- **Clarity at point of use** over brevity — APIs are declared once, used many times
- `///` doc comment on every public declaration — if you can't describe it simply, redesign it
- `let` over `var` wherever possible — mutability is opt-in
- Prefer `guard` for early exits over nested `if` chains

## Naming

| Pattern | Use |
|---------|-----|
| `UpperCamelCase` | Types, protocols, enums, typealiases |
| `lowerCamelCase` | Variables, functions, parameters, enum cases |
| Acronyms | Uniformly cased: `urlSession`, `httpResponse`, `userID` |

Booleans must start with: `is`, `has`, `can`, `should`.

```swift
// ✅
var isLoading: Bool
func canSubmit() -> Bool

// ❌
var loading: Bool
func checkSubmit() -> Bool
```

## Types — Value vs Reference

- **`struct`** by default — value semantics, thread-safe, no retain cycles
- **`class`** only for: identity semantics, ObjC interop, explicit reference sharing
- **`enum`** over magic strings/ints for finite states
- `final class` when subclassing is not intended

```swift
// ✅ Value type for data
struct UserProfile {
    let id: UUID
    var displayName: String
}

// ✅ Class only where identity matters
final class NetworkSession {
    // Shared, stateful, needs identity
}
```

## Memory Management

- `weak var delegate` — delegates and observers are **always** weak
- `[weak self]` in closures that outlive their scope
- `unowned` only when lifetime is provably guaranteed (rare — prefer `weak`)
- Never create retain cycles: `ViewController → closure → ViewController`

```swift
// ✅
networkClient.fetch(url: url) { [weak self] result in
    guard let self else { return }
    self.handleResult(result)
}

// ❌ Retain cycle
networkClient.fetch(url: url) { result in
    self.handleResult(result) // strong capture
}
```

## Error Handling

- Typed errors using `enum` conforming to `LocalizedError`
- `do { try } catch` — **never `try!` in production**
- `Result<T, Error>` for async callbacks on pre-concurrency APIs
- Never swallow errors silently (`catch { }` must log or rethrow)

```swift
enum AppError: LocalizedError {
    case notFound(String)
    case unauthorized
    var errorDescription: String? {
        switch self {
        case .notFound(let id): return "Resource '\(id)' not found"
        case .unauthorized:     return "Access denied"
        }
    }
}

func loadUser(id: String) throws -> User {
    guard let user = store[id] else { throw AppError.notFound(id) }
    return user
}
```

## Concurrency (Swift 5.5+)

- `async/await` over `DispatchQueue` for **all new code**
- `@MainActor` for every UI mutation — not `DispatchQueue.main.async`
- `actor` for shared mutable state — no manual locks or semaphores
- `Task { }` to bridge sync → async; `Task.detached` only when truly independent
- Never `await` inside a loop — use `withTaskGroup` or `async let` to parallelize

```swift
// ✅ Actor for shared state
actor DataStore {
    private var cache: [String: Data] = [:]
    func store(_ data: Data, for key: String) { cache[key] = data }
    func retrieve(for key: String) -> Data? { cache[key] }
}

// ✅ MainActor for UI
@MainActor
func updateUI(with result: User) {
    nameLabel.stringValue = result.displayName
}

// ❌ Old style
DispatchQueue.main.async { self.nameLabel.stringValue = result.displayName }
```

## macOS AppKit Patterns

### .app Bundle (CRITICAL)

`swift script.swift` **cannot** reliably display GUI windows — the window server
won't activate a CLI process. Always compile a proper `.app` bundle:

```bash
# Directory structure
MyApp.app/
  Contents/
    MacOS/Binary       # compiled binary
    Info.plist

# Compile
swiftc source.swift -o MyApp.app/Contents/MacOS/Binary -framework Cocoa
```

**Required `Info.plist` keys:**
```xml
<key>LSUIElement</key><false/>
<key>NSPrincipalClass</key><string>NSApplication</string>
```

### App Lifecycle

Window setup goes in `applicationDidFinishLaunching` — window server is guaranteed ready:

```swift
import Cocoa

@main
class AppDelegate: NSObject, NSApplicationDelegate {
    var window: NSWindow!

    func applicationDidFinishLaunching(_ notification: Notification) {
        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 640, height: 400),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.title = "My App"
        window.center()
        window.makeKeyAndOrderFront(nil)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}
```

### NSApp.terminate(nil) Gotcha

`NSApp.terminate(nil)` called immediately after firing a `UNUserNotification` will
exit before the notification appears. Add a short delay:

```swift
// ✅
DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
    NSApp.terminate(nil)
}

// ❌ Notification never appears
NSApp.terminate(nil)
```

### Associated Object Keys

Use `UInt8` variable as key — **not** a String:

```swift
// ✅
private static var key: UInt8 = 0
objc_setAssociatedObject(obj, &MyClass.key, value, .OBJC_ASSOCIATION_RETAIN)

// ❌ String exposes internal pointer, not a stable address
objc_setAssociatedObject(obj, "myKey", value, .OBJC_ASSOCIATION_RETAIN)
```

### Compile-Time Cache for Scripts

Add mtime check to avoid recompiling on every run:

```bash
[[ MyApp.app/Contents/MacOS/Binary -nt source.swift ]] || \
  swiftc source.swift -o MyApp.app/Contents/MacOS/Binary -framework Cocoa
```

## SwiftUI (macOS 12+)

- `@StateObject` for models owned by the view; `@ObservedObject` for injected models
- `@EnvironmentObject` for app-wide shared state
- `.task { }` modifier for async work tied to view lifecycle (auto-cancelled on disappear)
- Never do heavy work in `body` — extract to `@ViewBuilder` helpers or `ViewModel`
- `WindowGroup`, `Settings`, `MenuBarExtra` scenes in `@main App`

```swift
import SwiftUI

@main
struct MyApp: App {
    @StateObject private var store = AppStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
        }
        .commands {
            CommandGroup(replacing: .newItem) { }
        }
        Settings {
            SettingsView()
        }
    }
}
```

## Anti-Patterns ❌

| Anti-pattern | Fix |
|---|---|
| `let x = obj as! Foo` | `guard let x = obj as? Foo else { return }` |
| `try!` anywhere | `do { try } catch { }` |
| Force unwrap `x!` on optionals | `if let`, `guard let`, or `??` |
| `@objc` on everything | Only where ObjC interop is actually needed |
| `DispatchQueue.main.async` in SwiftUI | `@MainActor` or `.task {}` |
| `swift script.swift` for GUI | Compile `.app` bundle with `swiftc` |
| String as associated-object key | `private static var key: UInt8 = 0` |
| `NSApp.terminate(nil)` before notification | `asyncAfter(deadline: .now() + 0.5)` |
| Deep optional chains `a?.b?.c?.d` | Intermediate `guard let` bindings |
| Mutable global state | `actor` or `@EnvironmentObject` |

## Context7

Always prepend `use context7` when looking up: SwiftUI modifiers, AppKit APIs,
Combine publishers, Swift concurrency primitives, or any Apple framework API.
Apple APIs evolve quickly — never rely on training data alone.
