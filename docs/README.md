# GENCORE.SLATE Documentation Hub

Welcome to the documentation for **GENCORE.SLATE** — a portable, Windows-only desktop suite
built with Rust, Tauri v2, and React.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           DOCUMENTATION DIRECTORY MAP                            │
│                                                                                  │
│   DEVELOPMENT & ONBOARDING                  ARCHITECTURE & CORE PRINCIPLES       │
│   ├── Getting Started (getting-started.md)  ├── High-Level Overview (architecture.md) │
│   ├── Commands Cheat Sheet (commands.md)    ├── Portability Invariant (portability.md)│
│   └── Component Gallery (ui-kit.md)         └── Inter-Process Broker (ipc.md)    │
│                                                                                  │
│   SECURITY, QUALITY & RELEASE               SYSTEM RUNTIMES                      │
│   ├── Security Model (security.md)          └── WebView2 Fixed Runtime           │
│   ├── Testing Strategies (testing.md)           (webview2.md)                    │
│   └── Release Lifecycle (release.md)                                             │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Document Index

| Document | Purpose | Primary Audience |
| --- | --- | --- |
| [**Getting Started**](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/docs/getting-started.md) | Windows environment prerequisites, toolchain installation, and first-time run instructions. | Contributors, New Developers |
| [**Developer Commands**](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/docs/commands.md) | Master reference for Bun, Moon, and Cargo commands with operational nuances. | Contributors, Maintainers |
| [**Architecture Overview**](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/docs/architecture.md) | Multi-process topology, shared Rust crates, frontend packages, and system boundaries. | All Developers, Architects |
| [**Portability & Storage**](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/docs/portability.md) | Invariants for zero host pollution, root discovery, and lexical path confinement. | Backend & Systems Developers |
| [**Inter-Process Communication**](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/docs/ipc.md) | Intra-process Tauri commands and cross-app communication via the Launcher broker. | Full-Stack Developers |
| [**UI Kit & Design System**](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/docs/ui-kit.md) | Design tokens, macOS-inspired styling, window metrics, and component gallery. | Frontend Developers, Designers |
| [**Testing & Quality Assurance**](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/docs/testing.md) | Rules for `tests/` directories, mock fixtures, Nextest, Bun runner, and WebDriver e2e. | Contributors, QA Engineers |
| [**Security & Sandboxing**](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/docs/security.md) | Threat modeling, Tauri v2 capability manifests, CSP policies, and Windows mitigations. | Security Engineers, Maintainers |
| [**Release & Versioning**](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/docs/release.md) | Changesets, suite-wide version propagation, SBOM generation, and release publishing. | Release Managers, Maintainers |
| [**WebView2 Runtime**](file:///c:/Users/DUSTI/Documents/Development/Projects/GENCORE/GENCORE.SLATE/docs/webview2.md) | Bundled fixed-version WebView2 runtime verification, extraction, and caching. | Maintainers, CI Builders |

---

## Architectural Invariants Quick Reference

When developing in this repository, keep these six invariants in mind at all times:

1. **Bun Only:** Never introduce Node.js, npm, pnpm, or Yarn.
2. **Strict Portability:** Never write to `%APPDATA%`, `%TEMP%`, or the Windows Registry. All paths originate from `slate-paths`.
3. **Tests in `tests/`:** No inline tests beside code in either language.
4. **Unified Version:** One synchronized version across all crates, packages, and manifests.
5. **Shared UI Components:** All UI components originate from `@slate/ui-kit` styled with `@slate/tokens`.
6. **No Manual Edits to Generated Files:** Edit `.agents/rules/` and run `bun run agents:sync`.
