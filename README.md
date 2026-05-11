# 🌟 Aura Lint

**Aura Lint** is a blazing-fast, zero-config, zero-dependency, framework-agnostic UI architecture and code quality tool. It enforces Design System standards, catches Tailwind CSS magic numbers, and provides smart code suggestions right in your terminal.

## 🚀 Features

- **Framework Agnostic:** Works flawlessly with Svelte, React, Vue, or Vanilla HTML/JS.
- **Zero Dependency:** Ultra-lightweight. No heavy `node_modules` dragging your system down.
- **Smart Suggestions:** Detects "Magic Numbers" (e.g., `w-[400px]`) and mathematically calculates the closest Tailwind equivalent (e.g., `💡 Suggestion: w-100`).
- **Architecture Enforcement:** Prevents inline styles, hardcoded colors, and non-accessible click events.
- **Multi-Language UI:** Native CLI support for English (`-en`), Turkish (`-tr`), and Azerbaijani (`-az`).
- **Clickable Terminal Links:** Cmd/Ctrl + Click on the terminal output to jump directly to the offending line in your editor.

## 📦 Usage (No Installation Required)

You don't even need to install it! Run it directly via `npx` in any project:

```bash
# Basic scan in English
npx aura-lint src/

# Detailed view with clickable links in Turkish
npx aura-lint -f -l -tr src/
```

### 🛠 Local Project Installation
If you want to make it a standard part of your project pipeline:

**Bash**
```bash
npm install -D aura-lint
```

Add it to your `package.json` scripts:

**JSON**
```json
"scripts": {
  "lint:ui": "aura-lint -f -l src/"
}
```

## 🚩 CLI Flags


| Flag | Description |
| :--- | :--- |
| `-f` | **Full Detail Mode:** Shows the exact violating code snippet and the suggestion block. |
| `-l` | **Link Mode:** Generates a clickable file path (`src/App.svelte:42`) to jump straight to the code. |
| `-en` | English output (Default). |
| `-tr` | Turkish output. |
| `-az` | Azerbaijani output. |

## ⚙️ Custom Configuration (auralint.json)

Aura Lint is highly customizable. Create an `auralint.json` file in the root of your project to define your company-specific or project-specific rules.

**JSON**
```json
{
  "must_not_have": [
    {
      "id": "no_rounded_corners",
      "pattern": "rounded-(sm|md|lg|xl|2xl|3xl|full)",
      "errorMsg": "ARCHITECTURE: Rounded corners are forbidden in this project. Use sharp edges."
    }
  ],
  "must_have": [
    {
      "id": "missing_container",
      "pattern": "class=\"[^\"]*container[^\"]*\""
    }
  ]
}
```

Aura Lint will automatically merge your custom rules with its default system rules. Custom `errorMsg` properties bypass the i18n dictionaries.

## 🤝 Contributing

Pull requests are welcome! We use a strict `main` (production) and `develop` (testing) branch workflow. Please submit all PRs to the `develop` branch. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

MIT
