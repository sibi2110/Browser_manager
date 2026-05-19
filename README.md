# Browser Manager

Brave-compatible browser manager extension for organizing existing browser windows and tabs.

## Current Version

The current version is a Manifest V3 extension with a side-panel UI. It does not create its own browser. It works by managing existing Brave windows and tabs through Chromium extension APIs.

## Features

- Lists currently open Brave windows
- Lists saved window snapshots
- Lets you inspect a selected live or saved window
- Supports custom tab groups inside a live window
- Supports assigning a color to each group
- Groups tabs together in the detail view
- Sorts grouped tabs so the largest group appears first
- Shows compact tab previews with `Show all` / `Collapse`
- Saves a live window as a snapshot
- Saves and closes a live window
- Permanently closes a live window without saving it
- Restores a saved window back into Brave
- Renames live windows in the manager
- Renames saved windows in the manager
- Uses a monochrome UI with group-color accents

## Extension Structure

- [manifest.json](C:/Users/SIBI CHARAN/Desktop/Job/browser_manager/manifest.json): MV3 manifest
- [background.js](C:/Users/SIBI CHARAN/Desktop/Job/browser_manager/background.js): background worker, browser API integration, persistence
- [index.html](C:/Users/SIBI CHARAN/Desktop/Job/browser_manager/index.html): side-panel markup
- [app.js](C:/Users/SIBI CHARAN/Desktop/Job/browser_manager/app.js): side-panel state and UI behavior
- [styles.css](C:/Users/SIBI CHARAN/Desktop/Job/browser_manager/styles.css): extension styling
- [BUILDPLAN.md](C:/Users/SIBI CHARAN/Desktop/Job/browser_manager/BUILDPLAN.md): implementation plan

## How To Load In Brave

1. Open `brave://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the folder `C:\Users\SIBI CHARAN\Desktop\Job\browser_manager`
5. Open the extension side panel

## How To Use

### Navigation

The left rail has three main views:

- `OW`: open windows
- `SV`: saved windows
- `GP`: group management for live windows

### Open Windows

In `OW`:

- select a live browser window from the sidebar
- inspect its tabs in the detail view
- click a live tab row to jump to that tab in Brave
- use `Save`, `Save & Close`, or `Close`

### Saved Windows

In `SV`:

- select a saved window snapshot
- inspect only the saved tabs and saved groups
- use `Restore` to reopen it in Brave
- use `Delete` to remove the saved snapshot

### Group Management

In `GP`:

- select a live window
- create a group with a name and color
- change a group color later using the group color dropdown
- assign tabs to a group using the per-tab dropdown
- grouped tabs are shown together

### Rename

- select a live or saved window
- click `Rename`
- enter a new name in the inline rename panel
- click `Save`

The renamed title is manager-owned metadata. It is intended to appear immediately in the detail pane and sidebar, and persist when reopening the extension UI.

## Notes

- This extension manages existing Brave windows; it is not a standalone browser.
- Custom groups are extension metadata, not Brave-native tab groups.
- Tab URLs are hidden by default in the compact view and appear on hover.
- Group colors are used as visual accents on grouped tabs and group chips.

## Known Rough Edges

- The rename flow and group-color persistence have been iterated several times and may still need more runtime validation inside Brave.
- Group color persistence depends on extension state and side-panel refresh behavior.
- The current UI is optimized for the Brave side panel, not a full-page dashboard.

## Design Reference

The repo also includes the original design handoff used as visual reference:

- [stitch_tab_and_window_manager/DESIGN.md](C:/Users/SIBI CHARAN/Desktop/Job/browser_manager/stitch_tab_and_window_manager/DESIGN.md)
- [stitch_tab_and_window_manager/code.html](C:/Users/SIBI CHARAN/Desktop/Job/browser_manager/stitch_tab_and_window_manager/code.html)
- [stitch_tab_and_window_manager/screen.png](C:/Users/SIBI CHARAN/Desktop/Job/browser_manager/stitch_tab_and_window_manager/screen.png)
