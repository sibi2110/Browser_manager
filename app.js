let dashboard = {
  selectedTarget: null,
  openWindows: [],
  savedWindows: [],
};

const GROUP_COLOR_CACHE_KEY = "browser-manager-group-colors-v1";
const WINDOW_NAME_CACHE_KEY = "browser-manager-window-names-v1";
let searchQuery = "";
let activeView = "open";
let expandedTabsKey = "";
let isRenaming = false;
const TAB_PREVIEW_LIMIT = 5;
let groupColorCache = loadGroupColorCache();
let windowNameCache = loadWindowNameCache();
const GROUP_COLOR_LABELS = {
  slate: "Slate",
  blue: "Blue",
  green: "Green",
  amber: "Amber",
  red: "Red",
  purple: "Purple",
};

const navButtons = [...document.querySelectorAll(".nav-button[data-view]")];
const sidebarCaption = document.getElementById("sidebar-caption");
const listTitle = document.getElementById("list-title");
const listCount = document.getElementById("list-count");
const sidebarList = document.getElementById("sidebar-list");
const searchInput = document.getElementById("search-input");
const refreshButton = document.getElementById("refresh-dashboard");
const emptyState = document.getElementById("empty-state");
const detailView = document.getElementById("detail-view");
const detailKind = document.getElementById("detail-kind");
const detailTitle = document.getElementById("detail-title");
const detailSubtitle = document.getElementById("detail-subtitle");
const renameWindowButton = document.getElementById("rename-window");
const renamePanel = document.getElementById("rename-panel");
const renameForm = document.getElementById("rename-form");
const renameInput = document.getElementById("rename-input");
const renameCancelButton = document.getElementById("rename-cancel");
const detailActions = document.getElementById("detail-actions");
const groupSummary = document.getElementById("group-summary");
const groupTotal = document.getElementById("group-total");
const groupChipList = document.getElementById("group-chip-list");
const groupManager = document.getElementById("group-manager");
const groupForm = document.getElementById("group-form");
const groupNameInput = document.getElementById("group-name");
const groupColorInput = document.getElementById("group-color");
const groupList = document.getElementById("group-list");
const tabsTitle = document.getElementById("tabs-title");
const pageTotal = document.getElementById("page-total");
const tabList = document.getElementById("tab-list");
const sidebarItemTemplate = document.getElementById("sidebar-item-template");
const groupItemTemplate = document.getElementById("group-item-template");
const tabItemTemplate = document.getElementById("tab-item-template");
const groupChipTemplate = document.getElementById("group-chip-template");

navButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    activeView = button.dataset.view;
    isRenaming = false;
    syncNav();
    await syncSelectionForActiveView();
    render();
  });
});

searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value.trim().toLowerCase();
  render();
});

refreshButton.addEventListener("click", () => {
  void refresh();
});

renameWindowButton.addEventListener("click", () => {
  const selected = getSelectedEntity();
  if (!selected) {
    return;
  }

  isRenaming = true;
  renameInput.value = selected.name;
  render();
  renameInput.focus();
  renameInput.select();
});

renameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void renameSelectedWindow();
});

renameCancelButton.addEventListener("click", () => {
  isRenaming = false;
  render();
});

groupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const selected = getSelectedOpenWindow();
  const name = groupNameInput.value.trim();

  if (!selected || !name) {
    return;
  }

  dashboard = await sendMessage("create-group", {
    windowId: selected.browserWindowId,
    name,
    color: groupColorInput.value,
  });
  groupNameInput.value = "";
  groupColorInput.value = "slate";
  render();
});

async function refresh() {
  dashboard = await sendMessage("get-dashboard");
  applyCachedGroupColors();
  applyCachedWindowNames();
  render();
}

function render() {
  syncNav();
  renderSidebar();
  renderDetail();
}

function syncNav() {
  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === activeView);
  });
}

function renderSidebar() {
  const config = getSidebarConfig();
  sidebarCaption.textContent = config.caption;
  listTitle.textContent = config.title;
  listCount.textContent = String(config.items.length);
  sidebarList.innerHTML = "";

  if (!config.items.length) {
    sidebarList.innerHTML = `<p class="item-meta">${config.emptyMessage}</p>`;
    return;
  }

  config.items.forEach((item) => {
    const fragment = sidebarItemTemplate.content.cloneNode(true);
    const button = fragment.querySelector(".sidebar-item");

    if (config.isActive(item)) {
      button.classList.add("active");
    }

    fragment.querySelector(".item-name").textContent = item.name;
    fragment.querySelector(".item-badge").textContent = config.badge(item);
    fragment.querySelector(".item-meta").textContent = config.meta(item);
    button.addEventListener("click", () => {
      void config.onSelect(item);
    });
    sidebarList.appendChild(fragment);
  });
}

function renderDetail() {
  const selected = getSelectedEntity();

  if (!selected) {
    emptyState.classList.remove("hidden");
    detailView.classList.add("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  detailView.classList.remove("hidden");

  const isOpen = dashboard.selectedTarget?.kind === "open";
  const groups = selected.groups || [];
  const allTabs = getVisibleTabs(selected, isOpen);
  const tabs = getDisplayedTabs(selected, allTabs);

  detailKind.textContent = getDetailKindLabel(isOpen);
  detailTitle.textContent = selected.name;
  detailSubtitle.textContent = getDetailSubtitle(selected, isOpen, groups.length, allTabs.length);
  tabsTitle.textContent = activeView === "groups" ? "Tabs and Assignments" : "Tabs";
  pageTotal.textContent = String(allTabs.length);
  renameWindowButton.classList.remove("hidden");
  renamePanel.classList.toggle("hidden", !isRenaming);

  renderActions(selected, isOpen);
  renderGroupSummary(selected, groups, isOpen);
  renderGroupManager(selected, groups, isOpen);
  renderTabs(selected, tabs, allTabs, isOpen);
}

function renderActions(selected, isOpen) {
  detailActions.innerHTML = "";

  if (isOpen) {
    detailActions.appendChild(createActionButton("Save", "ghost-button", async () => {
      await sendMessage("save-window", { windowId: selected.browserWindowId });
      await refresh();
    }));
    detailActions.appendChild(createActionButton("Save & Close", "primary-button", async () => {
      await sendMessage("save-and-close-window", { windowId: selected.browserWindowId });
      await refresh();
    }));
    detailActions.appendChild(createActionButton("Close", "danger-button", async () => {
      await sendMessage("close-window", { windowId: selected.browserWindowId });
      await refresh();
    }));
    return;
  }

  detailActions.appendChild(createActionButton("Restore", "primary-button", async () => {
    await sendMessage("restore-saved-window", { savedWindowId: selected.id });
    activeView = "open";
    await refresh();
  }));
  detailActions.appendChild(createActionButton("Delete", "danger-button", async () => {
    await sendMessage("delete-saved-window", { savedWindowId: selected.id });
    await refresh();
  }));
}

function renderGroupSummary(selected, groups, isOpen) {
  const shouldShow = activeView !== "groups" && groups.length > 0;
  groupSummary.classList.toggle("hidden", !shouldShow);
  groupChipList.innerHTML = "";

  if (!shouldShow) {
    return;
  }

  groupTotal.textContent = String(groups.length);
  groups.forEach((group) => {
    const fragment = groupChipTemplate.content.cloneNode(true);
    const chip = fragment.querySelector(".group-chip");
    const tone = getGroupTone(group.color || "slate");
    chip.textContent = `${group.name} ${countGroupTabs(selected, group)}`;
    chip.style.color = tone.text;
    chip.style.borderColor = tone.border;
    chip.style.background = tone.fill;
    groupChipList.appendChild(fragment);
  });
}

function renderGroupManager(selected, groups, isOpen) {
  const shouldShow = activeView === "groups" && isOpen;
  groupManager.classList.toggle("hidden", !shouldShow);
  groupList.innerHTML = "";

  if (!shouldShow) {
    return;
  }

  if (!groups.length) {
    groupList.innerHTML = `<p class="group-meta">No groups created for this window.</p>`;
    return;
  }

  groups.forEach((group) => {
    const fragment = groupItemTemplate.content.cloneNode(true);
    const groupTitle = fragment.querySelector(".group-title");
    const colorSelect = fragment.querySelector(".group-color-select");
    const tone = getGroupTone(group.color || "slate");
    groupTitle.textContent = group.name;
    groupTitle.style.color = tone.text;
    fragment.querySelector(".group-meta").textContent = `${countGroupTabs(selected, group)} tabs`;
    colorSelect.value = group.color || "slate";
    colorSelect.addEventListener("change", async () => {
      group.color = colorSelect.value;
      setCachedGroupColor(selected.id, group.id, colorSelect.value);
      render();
      dashboard = await sendMessage("update-group-color", {
        windowId: selected.browserWindowId,
        groupId: group.id,
        color: colorSelect.value,
      });
      applyCachedGroupColors();
      render();
    });
    fragment.querySelector(".remove-group").addEventListener("click", async () => {
      dashboard = await sendMessage("delete-group", {
        windowId: selected.browserWindowId,
        groupId: group.id,
      });
      render();
    });
    groupList.appendChild(fragment);
  });
}

function renderTabs(selected, tabs, allTabs, isOpen) {
  tabList.innerHTML = "";

  if (!tabs.length) {
    tabList.innerHTML = `<p class="item-meta">No tabs match the current filter.</p>`;
    return;
  }

  tabs.forEach((tab) => {
    const fragment = tabItemTemplate.content.cloneNode(true);
    const row = fragment.querySelector(".tab-row");
    const title = fragment.querySelector(".tab-title");
    const url = fragment.querySelector(".tab-url");
    const badges = fragment.querySelector(".tab-badges");
    const groupSelect = fragment.querySelector(".group-select");

    if (tab.active) {
      row.classList.add("is-active");
    }

    const tabGroup = isOpen
      ? selected.groups.find((group) => group.id === tab.groupId)
      : selected.groups.find((group) => group.tabKeys.includes(tab.key));
    if (tabGroup?.color) {
      row.dataset.groupColor = tabGroup.color;
    }

    title.textContent = tab.title;
    title.title = tab.url;
    url.textContent = tab.url;
    badges.textContent = buildTabBadgeText(tab, selected, isOpen);
    row.title = tab.url;
    if (tabGroup?.color) {
      applyGroupAccent(row, tabGroup.color);
      badges.style.color = getGroupTone(tabGroup.color).text;
    }

    const canAssign = activeView === "groups" && isOpen;
    if (canAssign) {
      groupSelect.classList.remove("hidden");
      populateGroupSelect(groupSelect, selected.groups, tab.groupId || "");
      groupSelect.addEventListener("change", async () => {
        dashboard = await sendMessage("assign-tab-group", {
          windowId: selected.browserWindowId,
          tabId: tab.id,
          groupId: groupSelect.value,
        });
        render();
      });
    } else {
      groupSelect.remove();
    }

    if (isOpen) {
      row.classList.add("is-clickable");
      row.addEventListener("click", async (event) => {
        if (event.target instanceof HTMLElement && event.target.closest("select")) {
          return;
        }
        await sendMessage("focus-tab", {
          windowId: selected.browserWindowId,
          tabId: tab.id,
        });
      });
    }

    tabList.appendChild(fragment);
  });

  if (allTabs.length > tabs.length) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ghost-button show-more-button";
    button.textContent = `Show all ${allTabs.length} tabs`;
    button.addEventListener("click", () => {
      expandedTabsKey = getTabExpansionKey(selected);
      renderDetail();
    });
    tabList.appendChild(button);
  } else if (allTabs.length > TAB_PREVIEW_LIMIT && getTabExpansionKey(selected) === expandedTabsKey) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ghost-button show-more-button";
    button.textContent = "Collapse";
    button.addEventListener("click", () => {
      expandedTabsKey = "";
      renderDetail();
    });
    tabList.appendChild(button);
  }
}

function getSidebarConfig() {
  if (activeView === "saved") {
    const items = dashboard.savedWindows.filter((windowInfo) => matchesWindow(windowInfo, false));
    return {
      caption: "Saved windows",
      title: "Saved Windows",
      items,
      emptyMessage: "No saved windows match the current filter.",
      badge: (item) => String(item.tabs.length),
      meta: (item) => `${item.groups.length} groups`,
      isActive: (item) => dashboard.selectedTarget?.kind === "saved" && dashboard.selectedTarget.id === item.id,
      onSelect: (item) => selectTarget({ kind: "saved", id: item.id }),
    };
  }

  if (activeView === "groups") {
    const items = dashboard.openWindows.filter((windowInfo) => matchesWindow(windowInfo, true));
    return {
      caption: "Group management",
      title: "Live Windows",
      items,
      emptyMessage: "No live windows match the current filter.",
      badge: (item) => String(item.groups.length),
      meta: (item) => `${item.tabs.length} tabs`,
      isActive: (item) => dashboard.selectedTarget?.kind === "open" && dashboard.selectedTarget.id === item.id,
      onSelect: (item) => selectTarget({ kind: "open", id: item.id }),
    };
  }

  const items = dashboard.openWindows.filter((windowInfo) => matchesWindow(windowInfo, true));
  return {
    caption: "Open windows",
    title: "Open Windows",
    items,
    emptyMessage: "No open windows match the current filter.",
    badge: (item) => String(item.tabs.length),
    meta: (item) => `${item.groups.length} groups`,
    isActive: (item) => dashboard.selectedTarget?.kind === "open" && dashboard.selectedTarget.id === item.id,
    onSelect: (item) => selectTarget({ kind: "open", id: item.id }),
  };
}

async function selectTarget(target) {
  expandedTabsKey = "";
  isRenaming = false;
  await sendMessage("select-target", target);
  await refresh();
}

async function syncSelectionForActiveView() {
  if (activeView === "saved") {
    if (dashboard.selectedTarget?.kind !== "saved") {
      const firstSaved = getSidebarConfig().items[0];
      if (firstSaved) {
        await selectTarget({ kind: "saved", id: firstSaved.id });
      }
    }
    return;
  }

  if ((activeView === "open" || activeView === "groups") && dashboard.selectedTarget?.kind !== "open") {
    const firstOpen = dashboard.openWindows.filter((windowInfo) => matchesWindow(windowInfo, true))[0];
    if (firstOpen) {
      await selectTarget({ kind: "open", id: firstOpen.id });
    }
  }
}

async function sendMessage(type, payload = {}) {
  const response = await chrome.runtime.sendMessage({ type, payload });
  if (!response?.ok) {
    throw new Error(response?.error || "Unknown extension error.");
  }
  return response.result;
}

function getSelectedEntity() {
  if (!dashboard.selectedTarget) {
    return null;
  }

  if (dashboard.selectedTarget.kind === "open") {
    return getSelectedOpenWindow();
  }

  return dashboard.savedWindows.find((windowInfo) => windowInfo.id === dashboard.selectedTarget.id) || null;
}

function getSelectedOpenWindow() {
  if (dashboard.selectedTarget?.kind !== "open") {
    return null;
  }

  return dashboard.openWindows.find((windowInfo) => windowInfo.id === dashboard.selectedTarget.id) || null;
}

function loadGroupColorCache() {
  try {
    const raw = localStorage.getItem(GROUP_COLOR_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadWindowNameCache() {
  try {
    const raw = localStorage.getItem(WINDOW_NAME_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setCachedGroupColor(windowId, groupId, color) {
  groupColorCache[`${windowId}:${groupId}`] = color;
  localStorage.setItem(GROUP_COLOR_CACHE_KEY, JSON.stringify(groupColorCache));
}

function setCachedWindowName(kind, id, name) {
  windowNameCache[`${kind}:${id}`] = name;
  localStorage.setItem(WINDOW_NAME_CACHE_KEY, JSON.stringify(windowNameCache));
}

function applyCachedGroupColors() {
  dashboard.openWindows.forEach((windowInfo) => {
    windowInfo.groups.forEach((group) => {
      const cached = groupColorCache[`${windowInfo.id}:${group.id}`];
      if (cached) {
        group.color = cached;
      }
    });
  });
}

function applyCachedWindowNames() {
  dashboard.openWindows.forEach((windowInfo) => {
    const cached = windowNameCache[`open:${windowInfo.id}`];
    if (cached) {
      windowInfo.name = cached;
    }
  });

  dashboard.savedWindows.forEach((windowInfo) => {
    const cached = windowNameCache[`saved:${windowInfo.id}`];
    if (cached) {
      windowInfo.name = cached;
    }
  });
}

function getDisplayedTabs(selected, tabs) {
  if (activeView === "groups") {
    return tabs;
  }

  if (getTabExpansionKey(selected) === expandedTabsKey) {
    return tabs;
  }

  return tabs.slice(0, TAB_PREVIEW_LIMIT);
}

function getTabExpansionKey(selected) {
  return `${dashboard.selectedTarget?.kind || "none"}:${selected.id}`;
}

function getVisibleTabs(selected, isOpen) {
  const filteredTabs = !searchQuery
    ? [...selected.tabs]
    : selected.tabs.filter((tab) => matchesTab(tab, selected, isOpen));

  return sortTabsByGroupPriority(filteredTabs, selected, isOpen);
}

function matchesWindow(windowInfo, isOpen) {
  if (!searchQuery) {
    return true;
  }

  if (windowInfo.name.toLowerCase().includes(searchQuery)) {
    return true;
  }

  return windowInfo.tabs.some((tab) => matchesTab(tab, windowInfo, isOpen));
}

function matchesTab(tab, windowInfo, isOpen) {
  const groupName = isOpen ? tab.groupName : findSavedGroupName(windowInfo, tab.key);
  return [tab.title, tab.url, groupName].filter(Boolean).join(" ").toLowerCase().includes(searchQuery);
}

function getDetailKindLabel(isOpen) {
  if (activeView === "groups") {
    return "Group Management";
  }

  return isOpen ? "Open Window" : "Saved Window";
}

function getDetailSubtitle(selected, isOpen, groupCount, visibleTabCount) {
  if (activeView === "groups" && isOpen) {
    return `${groupCount} groups | ${selected.tabs.length} live tabs | ${visibleTabCount} visible`;
  }

  if (isOpen) {
    return `${selected.tabs.length} live tabs | ${groupCount} groups`;
  }

  return `${selected.tabs.length} saved tabs | ${groupCount} groups`;
}

async function renameSelectedWindow() {
  const selected = getSelectedEntity();

  if (!selected) {
    return;
  }

  const trimmed = renameInput.value.trim();
  if (!trimmed) {
    return;
  }

  const targetKind = dashboard.selectedTarget?.kind;
  updateWindowNameLocally(targetKind, selected.id, trimmed);
  setCachedWindowName(targetKind, selected.id, trimmed);
  isRenaming = false;
  render();

  if (targetKind === "open") {
    dashboard = await sendMessage("rename-open-window", {
      windowId: selected.browserWindowId,
      name: trimmed,
    });
  } else {
    dashboard = await sendMessage("rename-saved-window", {
      savedWindowId: selected.id,
      name: trimmed,
    });
  }

  applyCachedWindowNames();
  render();
}

function updateWindowNameLocally(kind, id, name) {
  if (kind === "open") {
    const liveWindow = dashboard.openWindows.find((item) => item.id === id);
    if (liveWindow) {
      liveWindow.name = name;
    }
    return;
  }

  const savedWindow = dashboard.savedWindows.find((item) => item.id === id);
  if (savedWindow) {
    savedWindow.name = name;
  }
}

function createActionButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", () => {
    void onClick();
  });
  return button;
}

function populateGroupSelect(select, groups, selectedId) {
  select.innerHTML = "";

  const noneOption = document.createElement("option");
  noneOption.value = "";
  noneOption.textContent = "No group";
  select.appendChild(noneOption);

  groups.forEach((group) => {
    const option = document.createElement("option");
    option.value = group.id;
    option.textContent = group.name;
    option.selected = group.id === selectedId;
    select.appendChild(option);
  });

  noneOption.selected = !selectedId;
}

function buildTabBadgeText(tab, selected, isOpen) {
  const parts = [];

  if (tab.pinned) {
    parts.push("Pinned");
  }

  if (isOpen && tab.active) {
    parts.push("Active");
  }

  const groupName = isOpen ? tab.groupName : findSavedGroupName(selected, tab.key);
  if (groupName) {
    const group = isOpen
      ? selected.groups.find((item) => item.id === tab.groupId)
      : selected.groups.find((item) => item.tabKeys.includes(tab.key));
    const colorLabel = group?.color ? GROUP_COLOR_LABELS[group.color] : "";
    parts.push(colorLabel ? `${groupName} - ${colorLabel}` : groupName);
  }

  return parts.join(" | ") || "Ungrouped";
}

function applyGroupAccent(element, color) {
  const tone = getGroupTone(color);
  element.style.borderLeft = `5px solid ${tone.border}`;
  element.style.background = `linear-gradient(90deg, ${tone.fill} 0, ${tone.fill} 18px, rgba(24, 25, 27, 0.98) 18px, rgba(24, 25, 27, 0.98) 100%)`;
}

function getGroupTone(color) {
  const palette = {
    slate: { border: "#c2c6d6", text: "#c2c6d6", fill: "rgba(194, 198, 214, 0.18)" },
    blue: { border: "#adc6ff", text: "#adc6ff", fill: "rgba(173, 198, 255, 0.2)" },
    green: { border: "#4edea3", text: "#4edea3", fill: "rgba(78, 222, 163, 0.22)" },
    amber: { border: "#ffb95f", text: "#ffb95f", fill: "rgba(255, 185, 95, 0.22)" },
    red: { border: "#ffb4ab", text: "#ffb4ab", fill: "rgba(255, 180, 171, 0.22)" },
    purple: { border: "#d8e2ff", text: "#d8e2ff", fill: "rgba(216, 226, 255, 0.2)" },
  };

  return palette[color] || palette.slate;
}

function countGroupTabs(selected, group) {
  if (dashboard.selectedTarget?.kind === "open") {
    return selected.tabs.filter((tab) => tab.groupId === group.id).length;
  }

  return group.tabKeys.length;
}

function findSavedGroupName(selected, tabKey) {
  return selected.groups.find((group) => group.tabKeys.includes(tabKey))?.name || "";
}

function sortTabsByGroupPriority(tabs, selected, isOpen) {
  const groupCountMap = new Map();

  selected.groups.forEach((group) => {
    const count = isOpen
      ? tabs.filter((tab) => tab.groupId === group.id).length
      : tabs.filter((tab) => group.tabKeys.includes(tab.key)).length;
    groupCountMap.set(group.id, count);
  });

  return [...tabs].sort((left, right) => {
    const leftGroup = isOpen
      ? selected.groups.find((group) => group.id === left.groupId) || null
      : selected.groups.find((group) => group.tabKeys.includes(left.key)) || null;
    const rightGroup = isOpen
      ? selected.groups.find((group) => group.id === right.groupId) || null
      : selected.groups.find((group) => group.tabKeys.includes(right.key)) || null;

    if (leftGroup && rightGroup && leftGroup.id !== rightGroup.id) {
      const countDiff = (groupCountMap.get(rightGroup.id) || 0) - (groupCountMap.get(leftGroup.id) || 0);
      if (countDiff !== 0) {
        return countDiff;
      }

      return leftGroup.name.localeCompare(rightGroup.name);
    }

    if (leftGroup && !rightGroup) {
      return -1;
    }

    if (!leftGroup && rightGroup) {
      return 1;
    }

    if (leftGroup && rightGroup && leftGroup.id === rightGroup.id) {
      return (left.index || 0) - (right.index || 0);
    }

    return (left.index || 0) - (right.index || 0);
  });
}

refresh().catch((error) => {
  emptyState.classList.remove("hidden");
  detailView.classList.add("hidden");
  emptyState.innerHTML = `
    <p class="eyebrow">Extension Error</p>
    <h2>Unable to load browser data.</h2>
    <p>${escapeHtml(error.message)}</p>
  `;
});

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
