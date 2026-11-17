# What is this project ? 
This project is an adaptation for BoardGameArena of game Skate Legend edited by Rose Noire Edition.
You can play here : https://boardgamearena.com

# How to install the auto-build stack

## Install builders
Intall node/npm then `npm i` on the root folder to get builders.

## Auto build JS and CSS files
In VS Code, add extension https://marketplace.visualstudio.com/items?itemName=emeraldwalk.RunOnSave and then add to config.json extension part :
```json
        "commands": [
            {
                "match": ".*\\.ts$",
                "isAsync": true,
                "cmd": "npm run build"
            },
            {
                "match": ".*\\.scss$",
                "isAsync": true,
                "cmd": "npm run build:scss"
            }
        ]
    }
```
The maintained interface entry point is `src/ts/Game.ts`. Run `npm run build` to bundle it into `modules/js/Game.js` and compile the existing SCSS into `skatelegend.css`. Run `npm run typecheck` for a separate TypeScript check, or `npm run watch` while developing.

The build prepares the pinned unofficial help, animation, and card libraries as separate AMD files in `modules/js/`, loaded with `importDojoLibs` as in Castle Combo. Zoom and jump-to use the official `1.x` ES modules. The ignored `.build/` directory contains generated type-checking input; do not edit it or commit `node_modules`.

If you use this project for another game, update the stylesheet paths in `package.json`.

## Auto-upload builded files
Also add one auto-FTP upload extension (for example https://marketplace.visualstudio.com/items?itemName=lukasz-wronski.ftp-sync) and configure it. The extension will detected modified files in the workspace, including builded ones, and upload them to remote server.

## Hint
Make sure ftp-sync.json and node_modules are in .gitignore
