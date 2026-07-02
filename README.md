# snip-cli

Zero-dependency Node.js CLI for the [Snip](https://github.com/randforsw/ai-sdlc-snip-demo) URL shortener.  
Requires Node.js ≥ 18 (global `fetch`, `http`/`https` built-ins).

## Quick start

```sh
# run directly
node cli.js help

# or install globally from this folder
npm link
snip help
```

## Commands

| Command | Description |
|---|---|
| `snip add <url>` | POST the URL, print the returned short link |
| `snip ls` | List all links in an aligned table |
| `snip open <code>` | Open the destination URL in the OS browser |
| `snip help` | Show usage |

## Configuration

| Variable | Default | Description |
|---|---|---|
| `SNIP_API` | `http://localhost:3000` | Backend base URL |

```sh
SNIP_API=https://my-snip.up.railway.app snip ls
```

## Wrappers

| File | Use when |
|---|---|
| `snip` | bash / zsh / sh (Linux, macOS, WSL) |
| `snip.cmd` | Windows Command Prompt |
| `snip.ps1` | PowerShell (any OS) |
