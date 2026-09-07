# Workflow — verifying and debugging portability

Run this after any change to paths, packaging, process spawning, or WebView2
configuration. Portability failures are invisible on a development machine,
because on a development machine every directory the app might wrongly use
already exists.

## Verify a packaged build

### 1. Build and extract to a fresh location

```bash
bun run package
```

Extract `dist/SLATE-<version>-win-x64.zip` to a path the project has never used,
for example `C:\Temp\slate-portability-test\`.

### 2. Snapshot before

```powershell
Get-ChildItem -Path $env:LOCALAPPDATA,$env:APPDATA,$env:TEMP -Recurse -File -ErrorAction SilentlyContinue |
  Select-Object FullName,Length | Export-Csv "$env:TEMP\slate-before.csv" -NoTypeInformation

reg export HKCU "$env:TEMP\slate-hkcu-before.reg" /y
```

### 3. Exercise the suite

Run `Slate.exe`. Launch every app from the Launcher. Change a setting in each.
Open a file in Explorer. Resize and move every window. Close everything.

### 4. Snapshot after and compare

```powershell
Get-ChildItem -Path $env:LOCALAPPDATA,$env:APPDATA,$env:TEMP -Recurse -File -ErrorAction SilentlyContinue |
  Select-Object FullName,Length | Export-Csv "$env:TEMP\slate-after.csv" -NoTypeInformation

Compare-Object (Import-Csv "$env:TEMP\slate-before.csv") (Import-Csv "$env:TEMP\slate-after.csv") -Property FullName

reg export HKCU "$env:TEMP\slate-hkcu-after.reg" /y
Compare-Object (Get-Content "$env:TEMP\slate-hkcu-before.reg") (Get-Content "$env:TEMP\slate-hkcu-after.reg")
```

Anything attributable to SLATE in either diff is a defect. Ignore noise from
unrelated software — compare paths, not counts.

### 5. Confirm the tree is self-contained

Settings changed in step 3 must be visible under
`C:\Temp\slate-portability-test\installDir\appdata\config\`, and the database
must have grown. If a setting persisted but nothing under `appdata/` changed,
it was written somewhere it should not have been.

## When something escaped

Work through these in order — they cover nearly every case:

1. **A path resolved outside `slate-paths`.** Search for `PathBuf::from`,
   `Path::new`, and `std::fs` calls in the changed code.
2. **WebView2 user data.** `WEBVIEW2_USER_DATA_FOLDER` must be set before the
   first window is created. Set later, it silently has no effect.
3. **A child process inheriting nothing.** `slate-process` must inject
   `SLATE_INSTALL_DIR` into every spawn; without it the child re-discovers and
   may pick a different root.
4. **A dependency using OS directories.** Some crates call `dirs` internally.
   Check the dependency diff, and confirm `cargo deny check` still passes.
5. **A log file.** `tracing-appender` writes wherever it is pointed. It must be
   pointed at `paths.logs_dir()`.

## A faster check during development

```bash
cargo test --package slate-paths
```

The `slate-paths` suite covers every discovery branch and every escape attempt.
It will not catch a misconfigured WebView2 or a bad spawn, but it catches the
majority of path mistakes in seconds.
