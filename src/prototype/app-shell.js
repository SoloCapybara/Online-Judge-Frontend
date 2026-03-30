/**
 * CodeArena 壳层：主题、移动端抽屉侧栏、桌面端侧栏折叠、顶栏页面标签
 */
(function () {
  var STORAGE_THEME = "codearena-theme";
  var STORAGE_SIDEBAR = "codearena-sidebar-collapsed";
  var STORAGE_TABS = "codearena-page-tabs";

  var PAGE_REGISTRY = [
    { key: "index.html", title: "首页", href: "index.html" },
    { key: "user.html", title: "用户中心", href: "user.html" },
  ];

  function currentPageKey() {
    var name = location.pathname.split("/").pop();
    if (!name || name === "") name = "index.html";
    return name;
  }

  function findRegistry(key) {
    for (var i = 0; i < PAGE_REGISTRY.length; i++) {
      if (PAGE_REGISTRY[i].key === key || PAGE_REGISTRY[i].href === key) return PAGE_REGISTRY[i];
    }
    return null;
  }

  /* ---------- 布局 / 侧栏折叠 ---------- */
  var layout = document.getElementById("layout");
  var sidebar = document.getElementById("sidebar");
  var sidebarCollapseToggle = document.getElementById("sidebarCollapseToggle");
  var sidebarCollapseIcon = document.getElementById("sidebarCollapseIcon");

  function isSidebarCollapsed() {
    return layout && layout.classList.contains("sidebar-collapsed");
  }

  function setSidebarCollapsed(collapsed) {
    if (!layout) return;
    if (collapsed) {
      layout.classList.add("sidebar-collapsed");
      layout.style.setProperty("--sb", "72px");
    } else {
      layout.classList.remove("sidebar-collapsed");
      layout.style.setProperty("--sb", "260px");
    }
    try {
      localStorage.setItem(STORAGE_SIDEBAR, collapsed ? "1" : "0");
    } catch (e) {}
    if (sidebarCollapseToggle) {
      sidebarCollapseToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      sidebarCollapseToggle.setAttribute("aria-label", collapsed ? "展开侧栏" : "折叠侧栏");
      sidebarCollapseToggle.title = collapsed ? "展开侧栏" : "折叠侧栏";
    }
    if (sidebarCollapseIcon) {
      sidebarCollapseIcon.style.transform = collapsed ? "rotate(180deg)" : "rotate(0deg)";
    }
  }

  function initSidebarCollapse() {
    if (!layout) return;
    try {
      if (localStorage.getItem(STORAGE_SIDEBAR) === "1") {
        setSidebarCollapsed(true);
      }
    } catch (e) {}
    if (sidebarCollapseToggle) {
      sidebarCollapseToggle.addEventListener("click", function () {
        setSidebarCollapsed(!isSidebarCollapsed());
      });
    }
  }

  /* ---------- 移动端抽屉 ---------- */
  var overlay = document.getElementById("overlay");
  var menuToggle = document.getElementById("menuToggle");

  function mobileNav() {
    return window.innerWidth <= 960;
  }

  function closeDrawer() {
    if (!overlay || !sidebar) return;
    overlay.classList.add("hidden");
    overlay.classList.remove("block");
    sidebar.classList.remove("translate-x-0", "shadow-2xl");
    if (mobileNav()) sidebar.classList.add("-translate-x-[calc(100%+12px)]");
    else sidebar.classList.remove("-translate-x-[calc(100%+12px)]");
  }

  function openDrawer() {
    if (!overlay || !sidebar || !mobileNav()) return;
    sidebar.classList.remove("-translate-x-[calc(100%+12px)]");
    sidebar.classList.add("translate-x-0", "shadow-2xl");
    overlay.classList.remove("hidden");
    overlay.classList.add("block");
  }

  function initMobileDrawer() {
    if (menuToggle) {
      menuToggle.addEventListener("click", function () {
        if (!mobileNav()) return;
        if (sidebar && sidebar.classList.contains("translate-x-0")) closeDrawer();
        else openDrawer();
      });
    }
    if (overlay) overlay.addEventListener("click", closeDrawer);
    window.addEventListener("resize", function () {
      if (!mobileNav()) closeDrawer();
    });
  }

  /* ---------- 主题 ---------- */
  var themeBtn = document.getElementById("themeToggle");

  function syncThemeUi() {
    var isDark = document.documentElement.classList.contains("dark");
    if (themeBtn) {
      themeBtn.setAttribute("aria-pressed", isDark ? "true" : "false");
      themeBtn.setAttribute("aria-label", isDark ? "切换到浅色模式" : "切换到深色模式");
      themeBtn.title = isDark ? "当前：深色 · 点击切换浅色" : "当前：浅色 · 点击切换深色";
    }
  }

  function setTheme(next) {
    if (next === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    try {
      localStorage.setItem(STORAGE_THEME, next);
    } catch (e) {}
    syncThemeUi();
  }

  function initTheme() {
    if (themeBtn) {
      syncThemeUi();
      themeBtn.addEventListener("click", function () {
        var isDark = document.documentElement.classList.contains("dark");
        setTheme(isDark ? "light" : "dark");
      });
    }
  }

  /* ---------- 页面标签 ---------- */
  var pageTabsEl = document.getElementById("pageTabs");
  var tabAddBtn = document.getElementById("tabAddBtn");
  var tabAddMenu = document.getElementById("tabAddMenu");

  function loadTabs() {
    try {
      var raw = sessionStorage.getItem(STORAGE_TABS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function saveTabs(tabs) {
    try {
      sessionStorage.setItem(STORAGE_TABS, JSON.stringify(tabs));
    } catch (e) {}
  }

  function normalizeTabs(raw) {
    var list = Array.isArray(raw) ? raw.slice() : [];
    var ck = currentPageKey();
    var has = list.some(function (t) {
      return t.href === ck || t.key === ck;
    });
    if (!has) {
      var reg = findRegistry(ck);
      if (reg) list.push({ key: reg.key, title: reg.title, href: reg.href });
      else list.push({ key: ck, title: (document.title || "页面").split("·")[0].trim(), href: ck });
    }
    if (list.length === 0) {
      list.push({ key: "index.html", title: "首页", href: "index.html" });
    }
    return list;
  }

  function tabActiveClass(isActive) {
    return isActive
      ? "border-violet-500/50 bg-white text-violet-700 shadow-sm dark:border-violet-500/40 dark:bg-[#12151f] dark:text-violet-300"
      : "border-transparent bg-slate-100/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-slate-100";
  }

  function renderPageTabs() {
    if (!pageTabsEl) return;
    var tabs = normalizeTabs(loadTabs());
    saveTabs(tabs);
    var ck = currentPageKey();
    pageTabsEl.innerHTML = "";
    tabs.forEach(function (t, index) {
      var isActive = t.href === ck || t.key === ck;
      var wrap = document.createElement("div");
      wrap.className =
        "group flex max-w-[220px] min-w-0 shrink-0 items-stretch overflow-hidden rounded-t-lg border border-b-0 transition " +
        tabActiveClass(isActive);
      wrap.setAttribute("role", "presentation");

      var link = document.createElement("a");
      link.href = t.href;
      link.className = "min-w-0 flex-1 truncate px-2.5 py-2 text-left text-sm font-medium no-underline " + (isActive ? "text-violet-700 dark:text-violet-300" : "text-inherit");
      link.textContent = t.title;
      link.setAttribute("aria-current", isActive ? "page" : "false");
      wrap.appendChild(link);

      var canClose = tabs.length > 1;
      if (canClose) {
        var closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className =
          "flex w-7 shrink-0 items-center justify-center rounded text-slate-400 transition hover:bg-slate-200/80 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200";
        closeBtn.setAttribute("aria-label", "关闭「" + t.title + "」");
        closeBtn.innerHTML =
          '<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
        closeBtn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          var next = tabs.filter(function (_, i) {
            return i !== index;
          });
          var closingActive = isActive;
          saveTabs(next);
          if (closingActive && next.length) {
            var go = index > 0 ? next[index - 1] : next[0];
            location.href = go.href;
          } else {
            renderPageTabs();
          }
        });
        wrap.appendChild(closeBtn);
      }

      pageTabsEl.appendChild(wrap);
    });
  }

  function initTabAddMenu() {
    if (!tabAddBtn || !tabAddMenu) return;

    function closeMenu() {
      tabAddMenu.classList.add("hidden");
    }

    tabAddBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      tabAddMenu.classList.toggle("hidden");
      if (!tabAddMenu.classList.contains("hidden")) {
        tabAddMenu.innerHTML = "";
        var tabs = normalizeTabs(loadTabs());
        var existing = {};
        tabs.forEach(function (t) {
          existing[t.href] = true;
          existing[t.key] = true;
        });
        PAGE_REGISTRY.forEach(function (p) {
          if (existing[p.href]) return;
          var a = document.createElement("a");
          a.href = p.href;
          a.className =
            "block px-3 py-2 text-sm text-slate-700 no-underline hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.06]";
          a.textContent = p.title;
          a.addEventListener("click", function (e) {
            e.preventDefault();
            var next = tabs.slice();
            next.push({ key: p.key, title: p.title, href: p.href });
            saveTabs(next);
            closeMenu();
            location.href = p.href;
          });
          tabAddMenu.appendChild(a);
        });
        if (tabAddMenu.children.length === 0) {
          var empty = document.createElement("div");
          empty.className = "px-3 py-2 text-xs text-slate-400";
          empty.textContent = "常用页面已全部打开";
          tabAddMenu.appendChild(empty);
        }
      }
    });

    document.addEventListener("click", closeMenu);
    tabAddMenu.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  /* ---------- 标签栏：无感刷新（仅替换 main） ---------- */
  var tabRefreshBtn = document.getElementById("tabRefreshBtn");

  function softRefreshMain() {
    var main = document.querySelector("main");
    if (!main) {
      location.reload();
      return;
    }
    var icon = tabRefreshBtn && tabRefreshBtn.querySelector("svg");
    if (tabRefreshBtn) tabRefreshBtn.disabled = true;
    if (icon) icon.classList.add("animate-spin");
    main.style.transition = "opacity 0.18s ease";
    main.style.opacity = "0.55";

    fetch(location.href, { cache: "no-store", credentials: "same-origin" })
      .then(function (r) {
        if (!r.ok) throw new Error("fetch failed");
        return r.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var newMain = doc.querySelector("main");
        if (!newMain) throw new Error("no main");
        main.innerHTML = newMain.innerHTML;
        var t = doc.querySelector("title");
        if (t && t.textContent) document.title = t.textContent.trim();
        renderPageTabs();
        try {
          window.dispatchEvent(new CustomEvent("codearena:content-refreshed"));
        } catch (e) {}
        main.style.opacity = "1";
      })
      .catch(function () {
        location.reload();
      })
      .finally(function () {
        if (tabRefreshBtn) tabRefreshBtn.disabled = false;
        if (icon) icon.classList.remove("animate-spin");
        setTimeout(function () {
          main.style.transition = "";
          main.style.opacity = "";
        }, 220);
      });
  }

  function initSoftRefresh() {
    if (!tabRefreshBtn) return;
    tabRefreshBtn.addEventListener("click", function () {
      if (tabRefreshBtn.disabled) return;
      softRefreshMain();
    });
  }

  /* ---------- 启动 ---------- */
  initSidebarCollapse();
  initMobileDrawer();
  initTheme();
  renderPageTabs();
  initTabAddMenu();
  initSoftRefresh();
})();
