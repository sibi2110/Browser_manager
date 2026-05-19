# Browser Manager Build Plan

## Goal
Build a Brave-compatible browser manager as a Manifest V3 extension that manages existing browser windows and tabs rather than acting as a standalone browser.

## Product Scope
V1 manages two kinds of objects:

- Open windows: live Brave windows discovered through extension APIs.
- Saved windows: snapshots of a live window that can be restored later.

Each window can contain custom groups created by the manager. Groups are metadata owned by the extension and are separate from Brave-native tab groups.

## V1 Features
- List all currently open normal browser windows.
- List all saved windows.
- Select an open or saved window to inspect it.
- Show tabs for the selected window.
- Create and delete custom groups for an open window.
- Assign or unassign live tabs to custom groups.
- Save a live window without closing it.
- Save and close a live window.
- Permanently close a live window without saving it.
- Restore a saved window as a new live Brave window.
- Delete a saved window snapshot.

## Architecture
### Extension shell
- `manifest.json`: MV3 manifest, permissions, side panel entry.
- `background.js`: service worker that owns browser API access and storage updates.
- `index.html`: side panel UI.
- `app.js`: side panel client that renders state and sends commands.
- `styles.css`: side panel styling.

### Browser API usage
- `chrome.windows`: enumerate open windows and close or focus them.
- `chrome.tabs`: inspect tabs and focus a tab.
- `chrome.storage.local`: persist saved windows and live group metadata.
- `chrome.sidePanel`: host the manager UI in Brave's side panel.

## Data Model
### Stored state
```json
{
  "selectedTarget": {
    "kind": "open | saved",
    "id": "string"
  },
  "liveWindowGroups": {
    "123": [
      {
        "id": "group-id",
        "name": "Docs",
        "tabIds": [456, 457]
      }
    ]
  },
  "savedWindows": [
    {
      "id": "saved-id",
      "name": "Window name",
      "createdAt": "ISO timestamp",
      "updatedAt": "ISO timestamp",
      "sourceWindowName": "Live window label",
      "tabs": [
        {
          "key": "tab-key",
          "title": "Page title",
          "url": "https://example.com",
          "favIconUrl": "https://...",
          "pinned": false,
          "index": 0
        }
      ],
      "groups": [
        {
          "id": "group-id",
          "name": "Docs",
          "tabKeys": ["tab-key"]
        }
      ]
    }
  ]
}
```

## UI Plan
### Left rail
- Open windows list.
- Saved windows list.
- Counts for each section.

### Detail pane
- For an open window:
  - Summary card with tab and group counts.
  - Actions: save, save and close, close permanently.
  - Group creation form.
  - Tab list with per-tab group assignment.
- For a saved window:
  - Summary card with saved metadata.
  - Actions: restore, delete.
  - Read-only tab list and group mapping.

## Event Handling
- Refresh live state from Brave on initial load and after each command.
- Keep stored group metadata trimmed when windows or tabs disappear.
- Remove group references for tabs that were closed or moved away.
- Clear live metadata when a live window is closed.

## V1 Constraints
- No sync across devices.
- No native companion app.
- No parsing of Brave session files.
- No reliance on Brave-native tab groups.
- No incognito support in V1.

## Implementation Sequence
1. Add MV3 manifest and background worker.
2. Replace mock local-only state with extension-backed state.
3. Build live-window inspection and selection.
4. Add custom grouping for live tabs.
5. Add save, save-and-close, close, and restore flows.
6. Verify the extension loads in Brave and the JS parses cleanly.

## Validation
- Load unpacked extension in Brave.
- Open multiple windows with several tabs.
- Confirm the side panel lists open windows.
- Create groups and assign tabs.
- Save a window and confirm it appears under saved windows.
- Save and close a window and confirm it disappears from open windows.
- Restore a saved window and confirm tabs reopen in a new window.
- Permanently close a live window and confirm no saved snapshot is created.
