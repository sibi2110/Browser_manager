const STORAGE_KEY = "browser-manager-state-v1";
const DEFAULT_GROUP_COLOR = "slate";

const defaultState = {
  selectedTarget: null,
  liveWindowGroups: {},
  liveWindowNames: {},
  savedWindows: [],
};

chrome.runtime.onInstalled.addListener(async () => {
  await ensureState();
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureState();
  await cleanupState();
});

chrome.windows.onRemoved.addListener(async (windowId) => {
  const state = await getState();
  delete state.liveWindowGroups[String(windowId)];
  delete state.liveWindowNames[String(windowId)];

  if (state.selectedTarget?.kind === "open" && state.selectedTarget.id === String(windowId)) {
    state.selectedTarget = null;
  }

  await setState(state);
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const state = await getState();
  let changed = false;

  for (const groups of Object.values(state.liveWindowGroups)) {
    for (const group of groups) {
      const nextTabIds = group.tabIds.filter((groupTabId) => groupTabId !== tabId);
      if (nextTabIds.length !== group.tabIds.length) {
        group.tabIds = nextTabIds;
        changed = true;
      }
    }
  }

  if (changed) {
    await setState(state);
  }
});

chrome.tabs.onDetached.addListener(async (tabId, detachInfo) => {
  const state = await getState();
  const groups = state.liveWindowGroups[String(detachInfo.oldWindowId)] || [];
  let changed = false;

  groups.forEach((group) => {
    const nextTabIds = group.tabIds.filter((groupTabId) => groupTabId !== tabId);
    if (nextTabIds.length !== group.tabIds.length) {
      group.tabIds = nextTabIds;
      changed = true;
    }
  });

  if (changed) {
    await setState(state);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then((result) => sendResponse({ ok: true, result }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});

async function handleMessage(message) {
  switch (message.type) {
    case "get-dashboard":
      await cleanupState();
      return getDashboard();
    case "select-target":
      return selectTarget(message.payload);
    case "create-group":
      return createGroup(message.payload.windowId, message.payload.name, message.payload.color);
    case "delete-group":
      return deleteGroup(message.payload.windowId, message.payload.groupId);
    case "update-group-color":
      return updateGroupColor(
        message.payload.windowId,
        message.payload.groupId,
        message.payload.color
      );
    case "assign-tab-group":
      return assignTabGroup(
        message.payload.windowId,
        message.payload.tabId,
        message.payload.groupId
      );
    case "rename-open-window":
      return renameOpenWindow(message.payload.windowId, message.payload.name);
    case "rename-saved-window":
      return renameSavedWindow(message.payload.savedWindowId, message.payload.name);
    case "save-window":
      return saveWindow(message.payload.windowId, false);
    case "save-and-close-window":
      return saveWindow(message.payload.windowId, true);
    case "close-window":
      return closeWindow(message.payload.windowId);
    case "restore-saved-window":
      return restoreSavedWindow(message.payload.savedWindowId);
    case "delete-saved-window":
      return deleteSavedWindow(message.payload.savedWindowId);
    case "focus-tab":
      return focusTab(message.payload.windowId, message.payload.tabId);
    default:
      throw new Error("Unsupported message type.");
  }
}

async function selectTarget(target) {
  const state = await getState();
  state.selectedTarget = target;
  await setState(state);
  return getDashboard();
}

async function createGroup(windowId, name, color) {
  const state = await getState();
  const key = String(windowId);
  const groups = state.liveWindowGroups[key] || [];

  groups.push({
    id: createId(),
    name,
    color: color || DEFAULT_GROUP_COLOR,
    tabIds: [],
  });
  state.liveWindowGroups[key] = groups;
  await setState(state);
  return getDashboard();
}

async function updateGroupColor(windowId, groupId, color) {
  const state = await getState();
  const key = String(windowId);
  const groups = state.liveWindowGroups[key] || [];
  const group = groups.find((item) => item.id === groupId);

  if (!group) {
    throw new Error("Group not found.");
  }

  group.color = color || DEFAULT_GROUP_COLOR;
  state.liveWindowGroups[key] = groups;
  await setState(state);
  return getDashboard();
}

async function deleteGroup(windowId, groupId) {
  const state = await getState();
  const key = String(windowId);
  state.liveWindowGroups[key] = (state.liveWindowGroups[key] || []).filter((group) => group.id !== groupId);
  await setState(state);
  return getDashboard();
}

async function assignTabGroup(windowId, tabId, groupId) {
  const state = await getState();
  const key = String(windowId);
  const groups = state.liveWindowGroups[key] || [];

  groups.forEach((group) => {
    group.tabIds = group.tabIds.filter((groupTabId) => groupTabId !== tabId);
  });

  if (groupId) {
    const targetGroup = groups.find((group) => group.id === groupId);
    if (!targetGroup) {
      throw new Error("Group not found.");
    }
    targetGroup.tabIds.push(tabId);
  }

  state.liveWindowGroups[key] = groups;
  await setState(state);
  return getDashboard();
}

async function renameOpenWindow(windowId, name) {
  const state = await getState();
  state.liveWindowNames[String(windowId)] = name;
  await setState(state);
  return getDashboard();
}

async function renameSavedWindow(savedWindowId, name) {
  const state = await getState();
  const target = state.savedWindows.find((item) => item.id === savedWindowId);

  if (!target) {
    throw new Error("Saved window not found.");
  }

  target.name = name;
  target.updatedAt = new Date().toISOString();
  await setState(state);
  return getDashboard();
}

async function saveWindow(windowId, shouldClose) {
  const liveWindow = await chrome.windows.get(windowId, { populate: true });
  const state = await getState();
  const snapshot = createSavedWindowSnapshot(liveWindow, state.liveWindowGroups[String(windowId)] || []);
  snapshot.name = state.liveWindowNames[String(windowId)] || snapshot.name;

  state.savedWindows.unshift(snapshot);

  if (state.selectedTarget?.kind === "open" && state.selectedTarget.id === String(windowId)) {
    state.selectedTarget = {
      kind: "saved",
      id: snapshot.id,
    };
  }

  await setState(state);

  if (shouldClose) {
    await chrome.windows.remove(windowId);
  }

  return getDashboard();
}

async function closeWindow(windowId) {
  const state = await getState();
  delete state.liveWindowGroups[String(windowId)];
  delete state.liveWindowNames[String(windowId)];

  if (state.selectedTarget?.kind === "open" && state.selectedTarget.id === String(windowId)) {
    state.selectedTarget = null;
  }

  await setState(state);
  await chrome.windows.remove(windowId);
  return getDashboard();
}

async function restoreSavedWindow(savedWindowId) {
  const state = await getState();
  const savedWindow = state.savedWindows.find((item) => item.id === savedWindowId);

  if (!savedWindow) {
    throw new Error("Saved window not found.");
  }

  const orderedTabs = [...savedWindow.tabs].sort((left, right) => left.index - right.index);
  const restoredWindow = await chrome.windows.create({
    url: orderedTabs.map((tab) => tab.url),
  });

  const createdTabs = (restoredWindow.tabs || []).sort((left, right) => (left.index || 0) - (right.index || 0));
  const remappedGroups = savedWindow.groups.map((group) => ({
    id: createId(),
    name: group.name,
    color: group.color || DEFAULT_GROUP_COLOR,
    tabIds: group.tabKeys
      .map((tabKey) => {
        const sourceIndex = orderedTabs.findIndex((tab) => tab.key === tabKey);
        return sourceIndex >= 0 ? createdTabs[sourceIndex]?.id : null;
      })
      .filter((tabId) => typeof tabId === "number"),
  }));

  state.liveWindowGroups[String(restoredWindow.id)] = remappedGroups;
  state.liveWindowNames[String(restoredWindow.id)] = savedWindow.name;
  state.savedWindows = state.savedWindows.filter((item) => item.id !== savedWindowId);
  state.selectedTarget = {
    kind: "open",
    id: String(restoredWindow.id),
  };

  await setState(state);
  return getDashboard();
}

async function deleteSavedWindow(savedWindowId) {
  const state = await getState();
  state.savedWindows = state.savedWindows.filter((item) => item.id !== savedWindowId);

  if (state.selectedTarget?.kind === "saved" && state.selectedTarget.id === savedWindowId) {
    state.selectedTarget = null;
  }

  await setState(state);
  return getDashboard();
}

async function focusTab(windowId, tabId) {
  await chrome.windows.update(windowId, { focused: true });
  await chrome.tabs.update(tabId, { active: true });
  return getDashboard();
}

async function getDashboard() {
  const state = await getState();
  const windows = await chrome.windows.getAll({
    populate: true,
    windowTypes: ["normal"],
  });

  const openWindows = windows.map((windowInfo) => {
    const groups = normalizeLiveGroups(windowInfo, state.liveWindowGroups[String(windowInfo.id)] || []);
    const tabs = (windowInfo.tabs || [])
      .filter((tab) => !tab.incognito)
      .sort((left, right) => (left.index || 0) - (right.index || 0))
      .map((tab) => normalizeLiveTab(tab, groups));

    return {
      id: String(windowInfo.id),
      browserWindowId: windowInfo.id,
      name: state.liveWindowNames[String(windowInfo.id)] || deriveWindowName(windowInfo, tabs),
      groups,
      tabs,
      updatedAt: new Date().toISOString(),
    };
  });

  const savedWindows = state.savedWindows.map((savedWindow) => ({
    ...savedWindow,
    tabs: [...savedWindow.tabs].sort((left, right) => left.index - right.index),
  }));

  const selectedTarget = resolveSelectedTarget(state.selectedTarget, openWindows, savedWindows);

  if (!state.selectedTarget) {
    if (openWindows.length) {
      state.selectedTarget = { kind: "open", id: openWindows[0].id };
    } else if (savedWindows.length) {
      state.selectedTarget = { kind: "saved", id: savedWindows[0].id };
    }
    await setState(state);
  }

  return {
    selectedTarget:
      selectedTarget ||
      (openWindows[0]
        ? { kind: "open", id: openWindows[0].id }
        : savedWindows[0]
          ? { kind: "saved", id: savedWindows[0].id }
          : null),
    openWindows,
    savedWindows,
  };
}

function resolveSelectedTarget(selectedTarget, openWindows, savedWindows) {
  if (!selectedTarget) {
    return null;
  }

  if (selectedTarget.kind === "open") {
    return openWindows.some((windowInfo) => windowInfo.id === selectedTarget.id) ? selectedTarget : null;
  }

  if (selectedTarget.kind === "saved") {
    return savedWindows.some((windowInfo) => windowInfo.id === selectedTarget.id) ? selectedTarget : null;
  }

  return null;
}

function normalizeLiveGroups(windowInfo, groups) {
  const liveTabIds = new Set((windowInfo.tabs || []).map((tab) => tab.id));

  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    color: group.color || DEFAULT_GROUP_COLOR,
    tabIds: group.tabIds.filter((tabId) => liveTabIds.has(tabId)),
  }));
}

function normalizeLiveTab(tab, groups) {
  const group = groups.find((groupItem) => groupItem.tabIds.includes(tab.id));

  return {
    id: tab.id,
    title: tab.title || tab.pendingUrl || "Untitled tab",
    url: tab.url || tab.pendingUrl || "",
    favIconUrl: tab.favIconUrl || "",
    pinned: Boolean(tab.pinned),
    index: tab.index || 0,
    active: Boolean(tab.active),
    groupId: group?.id || "",
    groupName: group?.name || "",
  };
}

function createSavedWindowSnapshot(windowInfo, groups) {
  const liveTabs = (windowInfo.tabs || [])
    .filter((tab) => !tab.incognito)
    .sort((left, right) => (left.index || 0) - (right.index || 0));

  const tabs = liveTabs.map((tab) => ({
    key: createId(),
    title: tab.title || tab.pendingUrl || "Untitled tab",
    url: tab.url || tab.pendingUrl || "",
    favIconUrl: tab.favIconUrl || "",
    pinned: Boolean(tab.pinned),
    index: tab.index || 0,
  }));

  const tabById = new Map(liveTabs.map((tab, index) => [tab.id, tabs[index]]));
  const windowName = deriveWindowName(windowInfo, tabs);

  const snapshotGroups = groups.map((group) => ({
    id: createId(),
    name: group.name,
    color: group.color || DEFAULT_GROUP_COLOR,
    tabKeys: group.tabIds
      .map((tabId) => tabById.get(tabId)?.key || null)
      .filter((tabKey) => Boolean(tabKey)),
  }));

  return {
    id: createId(),
    name: windowName,
    sourceWindowName: windowName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tabs,
    groups: snapshotGroups,
  };
}

function deriveWindowName(windowInfo, tabs) {
  const activeTab = tabs.find((tab) => tab.active) || tabs[0];
  const title = activeTab?.title || "Window";
  return `Window ${windowInfo.id} - ${truncate(title, 36)}`;
}

async function cleanupState() {
  const state = await getState();
  const liveWindows = await chrome.windows.getAll({
    populate: true,
    windowTypes: ["normal"],
  });
  const liveWindowIds = new Set(liveWindows.map((windowInfo) => String(windowInfo.id)));
  let changed = false;

  for (const key of Object.keys(state.liveWindowGroups)) {
    if (!liveWindowIds.has(key)) {
      delete state.liveWindowGroups[key];
      delete state.liveWindowNames[key];
      changed = true;
      continue;
    }

    const liveTabIds = new Set(
      (liveWindows.find((windowInfo) => String(windowInfo.id) === key)?.tabs || []).map((tab) => tab.id)
    );

    state.liveWindowGroups[key] = state.liveWindowGroups[key].map((group) => ({
      ...group,
      color: group.color || DEFAULT_GROUP_COLOR,
      tabIds: group.tabIds.filter((tabId) => liveTabIds.has(tabId)),
    }));
  }

  if (state.selectedTarget?.kind === "open" && !liveWindowIds.has(state.selectedTarget.id)) {
    state.selectedTarget = null;
    changed = true;
  }

  if (changed) {
    await setState(state);
  }
}

async function ensureState() {
  const existing = await chrome.storage.local.get(STORAGE_KEY);
  if (!existing[STORAGE_KEY]) {
    await chrome.storage.local.set({ [STORAGE_KEY]: defaultState });
  }
}

async function getState() {
  await ensureState();
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return {
    ...defaultState,
    ...stored[STORAGE_KEY],
    liveWindowGroups: stored[STORAGE_KEY]?.liveWindowGroups || {},
    liveWindowNames: stored[STORAGE_KEY]?.liveWindowNames || {},
    savedWindows: stored[STORAGE_KEY]?.savedWindows || [],
  };
}

async function setState(state) {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}

function createId() {
  return crypto.randomUUID();
}

function truncate(value, size) {
  if (value.length <= size) {
    return value;
  }

  return `${value.slice(0, size - 3)}...`;
}
