/**
 * Minified by jsDelivr using Terser v5.39.0.
 * Original file: /gh/willmyerscode/megaMenu@2.0.53/megaMenu.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
class wmMegaMenu {
    static get pluginTitle() {
        return "wmMegaMenu";
    }
    static get defaultSettings() {
        return {
            layout: "full-width",
            openAnimation: "none",
            openAnimationDelay: 0,
            insetMenuWidthLimit: 0.04,
            closeAnimationDelay: 0,
            closeMenuDelay: 150,
            activeAnimation: "none",
            activeAnimationDelay: 0,
            closeOnScroll: !1,
            allowTriggerClickthrough: !0,
            addActiveTriggerClass: !1,
            activeDesktopTriggerClass: "header-nav-item--active",
            activeMobileTriggerClass: "header-menu-nav-item--active",
            setTriggerNoFollow: !1,
            triggerIconDisplay: !0,
            backButtonText: "Back",
            triggerIcon:
                '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">\n        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />\n      </svg>',
            openOnClick: !1,
            hooks: {
                beforeInit: [],
                afterInit: [
                    function () {
                        wm$?.initializeAllPlugins();
                    },
                ],
                beforeOpenMenu: [],
                afterOpenMenu: [],
                beforeCloseMenu: [],
                afterCloseMenu: [],
            },
        };
    }
    static get userSettings() {
        return window[wmMegaMenu.pluginTitle + "Settings"] || {};
    }
    static globalClickListenerAttached = !1;
    constructor(e) {
        if (e[0].dataset.megaMenuLoadingState) return;
        e.forEach((e) => (e.dataset.megaMenuLoadingState = "loading")),
            (this.els = e),
            (this.settings = wm$.deepMerge({}, wmMegaMenu.defaultSettings, wmMegaMenu.userSettings));
        window.matchMedia("(pointer: fine)").matches || (this.settings.openOnClick = !0),
            (this.menus = []),
            (this.isMenuOpen = !1),
            (this.isMobileMenuOpen = !1),
            (this.menuTriggerCurrentlyHovered = null),
            (this.headerBottom = 0),
            (this.header = document.querySelector("#header")),
            (this.mobileHeader = this.header.querySelector(".header-menu")),
            (this.headerContext = JSON.parse(this.header.dataset.currentStyles)),
            (this.mobileMenuOverlayTheme = this.headerContext.menuOverlayTheme),
            (this.siteWrapper = document.querySelector("#siteWrapper")),
            (this.page = document.querySelector("#page")),
            (this.mobileFoldersList = this.header.querySelector(".header-menu-nav-list")),
            (this.defaultHeaderColorTheme = this.header.dataset.sectionTheme),
            this.settings.openOnClick && (this.settings.allowTriggerClickthrough = !1),
            (this.isAnimating = !1),
            this.init();
    }
    async init() {
        wm$.emitEvent("wmMegaMenu:beforeInit", this),
            this.runHooks("beforeInit"),
            await this.buildStructure(),
            this.buildDesktopHTML(),
            this.buildMobileHTML(),
            this.setSizing(),
            this.bindEvents(),
            (this.isHamburgerMenuOpen = !1),
            this.placeMegaMenusByScreenSize(),
            (this.headerCurrentStyles = JSON.parse(this.header.dataset.currentStyles)),
            window.Squarespace &&
                (wm$?.handleAddingMissingColorTheme(),
                "complete" === document.readyState
                    ? wm$?.reloadSquarespaceLifecycle([this.menu, this.header])
                    : window.addEventListener("load", () => {
                          wm$?.reloadSquarespaceLifecycle([this.menu, this.header]);
                      })),
            (this.activeMenu = this.menus[0]),
            (this.menu.dataset.sectionTheme = this.activeMenu.colorTheme),
            (this.accessibility = this.handleAccessibility()),
            this.accessibility.init(),
            this.accessibility.addKeyboardOpenAndClosedNavigation(),
            this.runHooks("afterInit"),
            wm$.emitEvent("wmMegaMenu:ready", this);
    }
    bindEvents() {
        this.addEditModeObserver(),
            this.addOpenTriggers(),
            this.addCloseTriggers(),
            this.addMobileOpenTriggers(),
            this.addMobileBackButtonClick(),
            this.addResizeEventListener(),
            this.addScrollEventListener(),
            this.addBurgerClickEventListener(),
            this.addClickEventListener(),
            this.addClickToCloseEventListener();
    }
    updateHeaderBottom() {
        const e = this.header.getBoundingClientRect();
        (this.headerBottom = `${e.bottom}px`), this.menu.style.setProperty("--header-bottom", this.headerBottom);
    }
    async buildStructure() {
        const e = Array.from(this.els).map(async (e, t) => {
            new URL(e.href);
            const i = e.getAttribute("href");
            let n,
                s,
                r = document.querySelectorAll(`#header .header-inner [href="${i}"]`),
                a = !1,
                o = !1;
            if (
                (i.includes("-wm-mega-") && e.classList.contains("header-nav-folder-title")
                    ? ((n = "/" + i.split("-wm-mega-")[1] || ""),
                      (s = i.split("-wm-mega-")[0] || "#"),
                      (o = !0),
                      (a = !0))
                    : ((n = i.split("=")[1] || ""),
                      n.startsWith("/") || (n = "/" + n),
                      (s = i.startsWith("#") ? "#" : new URL(e.href).pathname)),
                !r.length || !n)
            )
                return null;
            const l = r[0].innerText,
                d = document.querySelector(`#header .header-menu [href="${i}"]`).parentElement;
            try {
                const e = await wm$?.getFragment(n),
                    h = e.querySelector(".page-section").dataset.sectionTheme;
                return {
                    order: t + 1,
                    triggerText: l,
                    desktopTriggers: r,
                    mobileTriggerParent: d,
                    urlSlug: i,
                    sourceUrl: s,
                    referenceUrl: n,
                    contentFrag: e,
                    colorTheme: h,
                    keepDefaultMobileMenu: o,
                    isDropdown: a,
                };
            } catch (e) {
                return console.error(`Error fetching content for ${n}:`, e), null;
            }
        });
        (this.menus = (await Promise.all(e)).filter(Boolean)), (this.activeMenu = this.menus[0]);
    }
    buildDesktopHTML() {
        document.body.classList.add("wm-mega-menu-plugin");
        const e = document.createDocumentFragment();
        this.container = e;
        const t = document.createElement("div");
        (t.className = "wm-mega-menu"),
            (t.dataset.openAnimation = this.settings.openAnimation),
            (t.dataset.layout = this.settings.layout),
            (this.menu = t),
            this.matchZIndex();
        const i = document.createElement("div");
        (i.className = "mega-menu-wrapper"), (this.menuWrapper = i);
        const n = document.createElement("div");
        (n.className = "mega-menu-absolute"), (this.absoluteMenu = n);
        const s = document.createElement("div");
        (s.className = "mega-menu-page-overlay"), (this.pageOverlay = s);
        // Arrow element removed
            this.menus.forEach((e) => {
                e.desktopTriggers.forEach((t) => {
                    "/" === e.sourceUrl
                        ? (t.setAttribute("href", e.referenceUrl),
                          t.setAttribute("rel", "nofollow"),
                          t.addEventListener("click", (e) => {
                              e.preventDefault(), e.stopPropagation();
                          }))
                        : (this.settings.allowTriggerClickthrough ||
                              t.addEventListener("click", (e) => {
                                  e.preventDefault(), e.stopPropagation();
                              }),
                          e.isDropdown &&
                              this.settings.allowTriggerClickthrough &&
                              t.addEventListener("click", (t) => {
                                  window.location.href = e.sourceUrl;
                              }),
                          this.settings.setTriggerNoFollow && t.setAttribute("rel", "nofollow"),
                          t.setAttribute("href", e.sourceUrl));
                });
                const t = window.location.pathname;
                e.desktopTriggers.forEach((i) => {
                    e.sourceUrl === t && i.parentElement.classList.add("header-nav-item--active");
                });
                const i = document.createElement("div");
                (i.className = "mega-menu-item"),
                    (i.dataset.referenceUrl = e.referenceUrl),
                    e.contentFrag.querySelectorAll(".page-section").forEach((e) => {
                        i.appendChild(e);
                    }),
                    i.querySelectorAll("a").forEach((i) => {
                        if (i.href && "#" !== i.href && "#" !== i.getAttribute("href") && "" !== i.getAttribute("href"))
                            try {
                                const n = new URL(i.href, window.location.origin);
                                n.pathname === t &&
                                    (i.classList.add("mega-menu-nav-item--active"),
                                    e.desktopTriggers.forEach((e) => {
                                        this.settings.addActiveTriggerClass &&
                                            e.parentElement.classList.add(this.settings.activeDesktopTriggerClass);
                                    }),
                                    e.mobileTrigger
                                        ? this.settings.addActiveTriggerClass &&
                                          e.mobileTrigger.classList.add(this.settings.activeMobileTriggerClass)
                                        : (e.shouldAddMobileActiveClass = !0));
                            } catch (e) {
                                console.warn(`Could not parse URL: ${i.href}`, e);
                            }
                    }),
                    n.appendChild(i),
                    (e.item = i);
            }),
            i.appendChild(n),
            t.appendChild(i),
            // Arrow appendChild removed
            e.appendChild(t),
            this.header.appendChild(e),
            this.positionMenuWrapper();
    }
    buildMobileHTML() {
        const e = this;
        this.menus.forEach((t) => {
            const i = (function (e) {
                const t = e.sourceUrl,
                    i = e.referenceUrl,
                    n = e.triggerText,
                    s = document.createElement("a");
                s.setAttribute("data-folder-id", i), (s.href = t);
                const r = document.createElement("div");
                r.className = "header-menu-nav-item-content header-menu-nav-item-content-folder";
                const a = document.createElement("span");
                (a.className = "visually-hidden"), (a.textContent = "Folder:"), r.appendChild(a);
                const o = document.createElement("span");
                return (
                    (o.textContent = n),
                    r.appendChild(o),
                    s.appendChild(r),
                    s.addEventListener("click", (e) => {
                        e.preventDefault(), e.stopPropagation();
                        const t = s.closest('[data-folder="root"]'),
                            i = document.querySelector(`.header-menu-nav-folder[data-folder="${s.dataset.folderId}"]`);
                        t.classList.add("header-menu-nav-folder--open"),
                            i.classList.add("header-menu-nav-folder--active");
                    }),
                    s
                );
            })(t);
            (t.mobileFolder = (function (t = "/demo-url") {
                const i = document.createElement("div");
                i.setAttribute("data-folder", t),
                    (i.className = "header-menu-nav-folder mobile-mega-menu-folder site-wrapper");
                const n = document.createElement("div");
                n.className = "header-menu-nav-folder-content";
                const s = document.createElement("div");
                s.className = "header-menu-controls container header-menu-nav-item";
                let r = document.querySelector('.header-menu-controls-control[data-action="back ff"]')?.cloneNode(!0);
                r = r
                    ? r.cloneNode(!0)
                    : (function () {
                          const t = document.createElement("a");
                          (t.className = "header-menu-controls-control header-menu-controls-control--active"),
                              t.setAttribute("data-action", "back"),
                              (t.href = "/"),
                              (t.tabIndex = -1);
                          const i = document.createElement("span");
                          return (i.textContent = e.settings.backButtonText), t.appendChild(i), t;
                      })();
                return (
                    r.addEventListener("click", (e) => {
                        e.preventDefault(), e.stopPropagation();
                        const t = document.querySelector('[data-folder="root"]'),
                            i = r.closest(".header-menu-nav-folder");
                        t.classList.remove("header-menu-nav-folder--open"),
                            i.classList.remove("header-menu-nav-folder--active");
                    }),
                    s.appendChild(r),
                    n.appendChild(s),
                    i.appendChild(n),
                    i
                );
            })(t.referenceUrl)),
                (t.mobileBackButton = t.mobileFolder.querySelector('a[data-action="back"]')),
                (t.mobileTrigger = null),
                (t.mobileContainer = null),
                t.keepDefaultMobileMenu ||
                    (this.mobileFoldersList.append(t.mobileFolder),
                    (t.mobileTriggerParent.innerHTML = ""),
                    t.mobileTriggerParent.append(i),
                    (t.mobileTrigger = t.mobileTriggerParent.querySelector("a")),
                    (t.mobileContainer = t.mobileFolder.querySelector(".header-menu-nav-folder-content")),
                    t.shouldAddMobileActiveClass &&
                        this.settings.addActiveTriggerClass &&
                        (t.mobileTriggerParent.classList.add(this.settings.activeMobileTriggerClass),
                        (t.mobileTrigger.ariaCurrent = "page")));
        });
    }
    addCloseTriggers() {
        this.menuWrapper.addEventListener("mouseleave", (e) => {
            e.relatedTarget && e.relatedTarget === this.menu
                ? this.closeMenu()
                : (e.relatedTarget && e.relatedTarget.closest("#header")) || this.closeMenu();
        });
        let e;
        this.header
            .querySelectorAll(".header-inner a, .header-inner button, .header-inner .header-nav-folder-content")
            .forEach((t) => {
                this.settings.openOnClick ||
                    t.addEventListener("mouseenter", () => {
                        e && clearTimeout(e),
                            this.activeMenu &&
                                this.activeMenu.desktopTriggers &&
                                (e = setTimeout(() => {
                                    Array.from(this.activeMenu.desktopTriggers).some((e) => e === t) ||
                                        this.closeMenu();
                                }, this.settings.closeMenuDelay || 150));
                    }),
                    t.addEventListener("mouseleave", () => {
                        e && clearTimeout(e);
                    });
            }),
            wmMegaMenu.globalClickListenerAttached ||
                (document.addEventListener("click", (e) => {
                    if (e.target.closest(".mobile-mega-menu-folder a[href]")) {
                        const e = document.querySelector("button.header-burger-btn.burger--active");
                        e && e.click();
                    }
                }),
                (wmMegaMenu.globalClickListenerAttached = !0));
    }
    addClickEventListener() {
        this.menu.addEventListener("click", (e) => {
            this.positionMenuWrapper(),
                window.setTimeout(() => {
                    this.setSizing(), this.positionMenuWrapper();
                }, 300);
        });
    }
    addClickToCloseEventListener() {
        document.addEventListener("click", (e) => {
            e.target.closest(".mega-menu-wrapper") || this.closeMenu();
        });
    }
    addMobileOpenTriggers() {
        this.menus.forEach((e) => {
            if (e.keepDefaultMobileMenu) return;
            e.mobileTrigger.addEventListener("click", () => {
                (this.activeMenu = e), this.matchColorTheme();
            });
        });
    }
    addMobileBackButtonClick() {
        this.menus.forEach((e) => {
            e.mobileBackButton.addEventListener("click", () => {
                this.revertColorTheme();
            });
        });
    }
    addOpenTriggers() {
        this.menus.forEach((e) => {
            e.desktopTriggers.forEach((t) => {
                let i;
                if (
                    (this.settings.openOnClick
                        ? t.addEventListener("click", (i) => {
                              i.preventDefault(),
                                  Array.from(this.activeMenu.desktopTriggers).some((e) => e === t) && this.isMenuOpen
                                      ? this.closeMenu()
                                      : this.openMenu(e);
                          })
                        : (t.addEventListener("mouseenter", () => {
                              (this.menuTriggerCurrentlyHovered = e),
                                  (i = setTimeout(() => {
                                      this.openMenu(e);
                                  }, 80));
                          }),
                          t.addEventListener("mouseleave", () => {
                              clearTimeout(i), (this.menuTriggerCurrentlyHovered = null);
                          })),
                    t.classList.add("mega-menu-link"),
                    t.closest(".header-nav-item")?.classList.add("header-nav-item--mega-menu"),
                    "squarespace" === this.settings.triggerIcon &&
                        document.querySelector("#header[data-current-styles]"))
                )
                    try {
                        const e = document.querySelector("#header[data-current-styles]");
                        if (!e?.dataset?.currentStyles)
                            return void console.warn("Header element or currentStyles dataset not found");
                        const t = e.dataset.currentStyles;
                        let i;
                        try {
                            const e = JSON.parse(t);
                            i = e?.iconOptions;
                        } catch (e) {
                            return void console.warn("Failed to parse header settings JSON:", e);
                        }
                        const n = i?.desktopDropdownIconOptions?.folderDropdownIcon;
                        if ("string" == typeof n && n.length > 0) {
                            const e = document.createElement("span");
                            e.classList.add("mega-menu-dropdown-icon");
                            const t = document.createElement("svg");
                            t.setAttribute("viewBox", "0 0 22 22");
                            const s = i?.desktopDropdownIconOptions?.endcapType;
                            "string" == typeof s &&
                                ["butt", "round", "square"].includes(s) &&
                                t.setAttribute("stroke-linecap", s),
                                t.setAttribute("stroke-linejoin", "miter");
                            const r = i?.desktopDropdownIconOptions?.strokeWidth;
                            r &&
                                "number" == typeof r.value &&
                                "string" == typeof r.unit &&
                                r.value > 0 &&
                                t.setAttribute("stroke-width", r.value + r.unit);
                            const a = i?.desktopDropdownIconOptions?.size;
                            a &&
                                "number" == typeof a.value &&
                                "string" == typeof a.unit &&
                                a.value > 0 &&
                                (e.style.setProperty("width", a.value + a.unit),
                                e.style.setProperty("height", a.value + a.unit));
                            const o = document.createElement("use");
                            o.setAttribute("href", "#" + n),
                                t.classList.add("squarespace-icon"),
                                t.appendChild(o),
                                e.appendChild(t),
                                (this.settings.triggerIcon = e.outerHTML);
                        } else console.warn("Invalid or missing folderDropdownIcon");
                    } catch (e) {
                        console.error("Error setting up Squarespace trigger icon:", e);
                    }
                this.settings.triggerIconDisplay && t.insertAdjacentHTML("beforeend", this.settings.triggerIcon);
            });
        });
    }
    openMenu(e) {
        if (this.isAnimating) return;
        if (
            ((this.isAnimating = !0),
            this.runHooks("beforeOpenMenu", e),
            wm$.emitEvent("wmMegaMenu:beforeOpenMenu", e),
            this.isMenuOpen && this.activeMenu === e)
        )
            return void (this.isAnimating = !1);
        if (
            ((this.activeMenu = e),
            this.updateHeaderBottom(),
            this.setSizing(),
            "full-width" === this.settings.layout && this.matchColorTheme(),
            this.isMenuOpen || "inset" !== this.settings.layout || this.handleInsetMenuPositioning(!0),
            this.positionMenuWrapper(),
            // Arrow animation removed
            e.desktopTriggers.forEach((e) => {
                e.setAttribute("aria-expanded", "true");
            }),
            this.isMenuOpen)
        )
            return (
                this.showActiveMenu(),
                (this.isAnimating = !1),
                void (
                    this.menuTriggerCurrentlyHovered &&
                    this.menuTriggerCurrentlyHovered !== e &&
                    this.openMenu(this.menuTriggerCurrentlyHovered)
                )
            );
        // No animation - instant show
        this.menu.classList.add("open");
        this.addPageOverlay();
        document.body.classList.add("wm-mega-menu--open");
        // Arrow animation removed
        this.showActiveMenu();
        this.isMenuOpen = !0;
        this.isAnimating = !1;
        if (this.menuTriggerCurrentlyHovered && this.menuTriggerCurrentlyHovered !== e) {
            this.openMenu(this.menuTriggerCurrentlyHovered);
        }
        wm$.emitEvent("wmMegaMenu:afterOpenMenu", e);
        this.runHooks("afterOpenMenu", e);
    }
    showActiveMenu() {
        (this.menu.dataset.sectionTheme = this.activeMenu.colorTheme),
            "inset" === this.settings.layout && this.handleInsetMenuPositioning(),
            this.positionMenuWrapper(),
            (this.menu.dataset.activeMenu = this.activeMenu.referenceUrl),
            this.menus.forEach((e) => {
                this.activeMenu === e
                    ? (// Arrow animation removed
                      e.desktopTriggers.forEach((e) => e.parentElement.classList.add("mega-menu--active")),
                      e.item.classList.add("active"))
                    : (e.desktopTriggers.forEach((e) => e.parentElement.classList.remove("mega-menu--active")),
                      e.item.classList.remove("active"));
            });
    }
    closeMenu() {
        if (this.isAnimating) return;
        if (((this.isAnimating = !0), this.runHooks("beforeCloseMenu"), !this.isMenuOpen))
            return void (this.isAnimating = !1);
        // No animation - instant hide
        // Arrow animation removed
        this.menu.classList.remove("open");
        document.body.classList.remove("wm-mega-menu--open");
        document.body.classList.remove("wm-mega-menu-open-animation-complete");
        this.removePageOverlay();
        this.isMenuOpen = !1;
        this.isAnimating = !1;
        if ("inset" !== this.settings.layout) {
            this.revertColorTheme();
        }
        this.menus.forEach((e) => {
            e.desktopTriggers.forEach((e) => e.parentElement.classList.remove("mega-menu--active"));
            e.item.classList.remove("active");
        });
        this.runHooks("afterCloseMenu");
    }
    getOpenAnimationKeyframes() {
        const e = {
                fade: [
                    { opacity: 0, visibility: "hidden" },
                    { opacity: 1, visibility: "visible" },
                ],
                slide: (e) => [
                    { transform: `translateY(${e})`, opacity: 0, visibility: "hidden" },
                    { transform: "translateY(0)", opacity: 1, visibility: "visible" },
                ],
                swing: [
                    { transform: "rotateX(-90deg) translateZ(0px)", opacity: 0, visibility: "hidden" },
                    { transform: "rotateX(0deg) translateZ(0px)", opacity: 1, visibility: "visible" },
                ],
            },
            t = e[this.settings.openAnimation] || e.fade;
        if ("function" == typeof t) {
            return t("inset" === this.settings.layout ? "-20px" : `-${this.activeMenu.height}px`);
        }
        return t;
    }
    getCloseAnimationKeyframes() {
        const e = {
                fade: [
                    { opacity: 1, visibility: "visible" },
                    { opacity: 0, visibility: "hidden" },
                ],
                slide: (e) => [
                    { transform: "translateY(0)", opacity: 1, visibility: "visible" },
                    { transform: `translateY(${e})`, opacity: 0, visibility: "hidden" },
                ],
                swing: [
                    { transform: "rotateX(0deg) translateZ(0px)", opacity: 1, visibility: "visible" },
                    { transform: "rotateX(-90deg) translateZ(0px)", opacity: 0, visibility: "hidden" },
                ],
            },
            t = e[this.settings.openAnimation] || e.fade;
        if ("function" == typeof t) {
            return t("inset" === this.settings.layout ? "-20px" : `-${this.activeMenu.height}px`);
        }
        return t;
    }
    // Arrow animation function removed completely
    matchZIndex() {
        let e = window.getComputedStyle(this.header).getPropertyValue("z-index");
        e = parseInt(e, 10) || 0;
        const t = Math.max(0, e - 1);
        this.menu.style.setProperty("--z-index", t);
    }
    matchColorTheme() {
        (this.menu.dataset.sectionTheme = this.activeMenu.colorTheme),
            ("inset" !== this.settings.layout || this.isMobileMenuOpen) &&
                ((this.header.dataset.sectionTheme = this.activeMenu.colorTheme),
                (this.mobileHeader.dataset.sectionTheme = this.activeMenu.colorTheme));
    }
    revertColorTheme() {
        (this.menu.dataset.sectionTheme = this.defaultHeaderColorTheme),
            ("inset" !== this.settings.layout || this.isMobileMenuOpen) &&
                (this.isMobileMenuOpen
                    ? window.setTimeout(() => {
                          (this.header.dataset.sectionTheme = this.mobileMenuOverlayTheme),
                              (this.mobileHeader.dataset.sectionTheme = this.mobileMenuOverlayTheme);
                      }, 100)
                    : window.setTimeout(() => {
                          this.header.dataset.sectionTheme = this.defaultHeaderColorTheme;
                      }, 10));
    }
    addEditModeObserver() {
        if (window.self === window.top) return;
        let e = !1;
        const t = this;
        const i = new MutationObserver((n) => {
            n.forEach((n) => {
                if ("class" === n.attributeName) {
                    document.body.classList.contains("sqs-edit-mode-active") &&
                        (e ||
                            ((e = !0),
                            t.menu.remove(),
                            (t.menus = []),
                            wm$.reloadSquarespaceLifecycle(),
                            i.disconnect()));
                }
            });
        });
        i.observe(document.body, { attributes: !0 });
    }
    runHooks(e, ...t) {
        (this.settings.hooks[e] || []).forEach((e) => {
            "function" == typeof e && e.apply(this, t);
        });
    }
    positionMenuWrapper() {
        this.menu.style.setProperty("--active-menu-height", "0px");
        let e = 0;
        for (const t of this.menus) {
            if (t === this.activeMenu) break;
            e += t.width;
        }
        let t = Array.from(this.activeMenu.item.children).reduce((e, t) => e + t.offsetHeight, 0);
        const i = window.getComputedStyle(this.menuWrapper);
        t += parseFloat(i.borderTopWidth) + parseFloat(i.borderBottomWidth);
        const n = this.activeMenu.width;
        this.menu.style.setProperty("--active-menu-height", t + "px"),
            (this.menuWrapper.style.width = n + "px"),
            this.menuWrapper.offsetHeight,
            "inset" !== this.settings.layout && (this.menuWrapper.style.width = "100%"),
            requestAnimationFrame(() => {
                this.absoluteMenu.style.left = `-${e}px`;
            });
    }
    parseInsetLimit(e) {
        if ("number" == typeof e) return e;
        if ("string" == typeof e) {
            if (e.endsWith("vh")) return parseFloat(e) / 100;
            if (e.endsWith("vw")) return parseFloat(e) / 100;
            if (e.endsWith("px")) return parseFloat(e) / window.innerWidth;
            if (e.endsWith("rem")) {
                const t = parseFloat(getComputedStyle(document.documentElement).fontSize);
                return (parseFloat(e) * t) / window.innerWidth;
            }
            if (e.endsWith("em")) {
                const t = parseFloat(getComputedStyle(this.menu).fontSize);
                return (parseFloat(e) * t) / window.innerWidth;
            }
        }
        return 0.04;
    }
    setSizing() {
        this.menus.forEach((e) => {
            e.item.style.width = "";
        }),
            this.menuWrapper.offsetHeight;
        let e = 0;
        this.menus.forEach((t) => {
            const i = Array.from(t.item.children).reduce((e, t) => e + t.offsetHeight, 0);
            t.height = i;
            let n = parseInt(window.getComputedStyle(t.item).getPropertyValue("--mega-menu-max-width"));
            const s = (() => {
                    const e = document.documentElement.clientWidth;
                    return window.innerWidth - e;
                })(),
                r = this.parseInsetLimit(this.settings.insetMenuWidthLimit),
                a = (window.innerWidth - s) * (1 - 2 * r);
            n > a && (n = a),
                "inset" !== this.settings.layout && (n = window.innerWidth - s),
                (t.width = n),
                (t.item.style.width = `${n}px`),
                (e += n);
        }),
            (this.absoluteMenu.style.width = `${e}px`);
    }
    handleInsetMenuPositioning(e = !1) {
        this.setSizing(), this.positionMenuWrapper(), e && (this.menuWrapper.style.transition = "none");
        const t = this.parseInsetLimit(this.settings.insetMenuWidthLimit),
            i = window.innerWidth * t,
            n = window.innerWidth - i,
            s = i,
            r = this.activeMenu.width,
            a = this.activeMenu.desktopTriggers[0];
        let o = 0;
        if ("navLeft" === this.headerCurrentStyles?.layout || "brandingCenter" === this.headerCurrentStyles?.layout) {
            if (((o = a.getBoundingClientRect().left - 34), o < s)) {
                o += s - o;
            }
            if (o + r > n) {
                (o = o - (o + r - n) - i), o < s && (o = s);
            }
        } else if ("navRight" === this.headerCurrentStyles?.layout) {
            if (((o = a.getBoundingClientRect().right + 34 - r), o + r > n)) {
                o -= o + r - n;
            }
            if (o < s) {
                o = i;
            }
        } else if (
            "navCenter" === this.headerCurrentStyles?.layout ||
            "brandingCenterNavCenter" === this.headerCurrentStyles?.layout
        ) {
            const e = a.getBoundingClientRect();
            (o = e.left + e.width / 2 - r / 2), o + r > n && (o = n - r - i), o < s && (o = s);
        }
        const l = window.getComputedStyle(this.menuWrapper).transform,
            d = ("none" !== l && parseFloat(l.split(",")[4]), `${o}px`);
        (this.menuWrapper.style.left = d),
            this.setSizing(),
            e &&
                (this.menuWrapper.offsetHeight,
                setTimeout(() => {
                    this.menuWrapper.style.transition = "";
                }, 0));
    }
    addResizeEventListener() {
        window.addEventListener("resize", () => {
            this.closeMenu(), this.placeMegaMenusByScreenSize(), this.setSizing();
        });
    }
    placeMegaMenusByScreenSize() {
        this.isMobileMenuOpen || document.body.classList.contains("header--menu-open")
            ? this.menus.forEach((e) => {
                  e.keepDefaultMobileMenu || e.mobileFolder.append(e.item);
              })
            : (this.menus.sort((e, t) => e.order - t.order),
              (this.absoluteMenu.innerHTML = ""),
              this.menus.forEach((e) => {
                  this.absoluteMenu.append(e.item);
              }));
    }
    addPageOverlay() {
        this.page.prepend(this.pageOverlay);
    }
    removePageOverlay() {
        window.setTimeout(() => {
            this.pageOverlay && !this.isMenuOpen && this.pageOverlay.remove();
        }, this.settings.openAnimationDelay);
    }
    addScrollEventListener() {
    // Scroll listener completely removed - menu stays open when scrolling
        console.log("Scroll listener disabled - menu will stay open");
    }
    addBurgerClickEventListener() {
        const e = this.header.querySelectorAll(".header-burger-btn"),
            t = (e) => {
                this.revertColorTheme(),
                    window.setTimeout(() => {
                        if (e.target.closest("button").matches(".burger--active"))
                            (this.isMobileMenuOpen = !0), this.revertColorTheme();
                        else {
                            this.isMobileMenuOpen = !1;
                            const e = document.querySelector('.header-menu-nav-list [data-folder="root"]'),
                                t = document.querySelectorAll(
                                    '.header-menu-nav-list [data-folder]:not([data-folder="root"])'
                                );
                            e.classList.remove("header-menu-nav-folder--open"),
                                t.forEach((e) => {
                                    e.classList.remove("header-menu-nav-folder--active");
                                }),
                                this.revertColorTheme();
                        }
                        this.placeMegaMenusByScreenSize();
                    }, 400);
            };
        e.forEach((e) => e.addEventListener("click", t));
    }
    get activeMenu() {
        return this._activeMenu;
    }
    set activeMenu(e) {
        this._activeMenu = e;
    }
    handleAccessibility() {
        const e = (e) =>
            e.offsetWidth > 0 && e.offsetHeight > 0 && "hidden" !== getComputedStyle(e).visibility && !e.disabled;
        return {
            addKeyboardOpenAndClosedNavigation: () => {
                window.addEventListener("keydown", (e) => {
                    "Escape" === e.key &&
                        (this.closeMenu(),
                        this.activeMenu.desktopTriggers[0].focus(),
                        this.activeMenu.focusableElements.forEach((e) => {
                            e.setAttribute("tabindex", "-1");
                        }));
                }),
                    this.menus.forEach((t) => {
                        t.desktopTriggers.forEach((i) => {
                            i.addEventListener("keydown", (i) => {
                                if ("Enter" === i.key || " " === i.key || "ArrowDown" === i.key) {
                                    if (this.isMenuOpen) return void this.closeMenu();
                                    i.preventDefault(),
                                        (this.lastFocus = document.activeElement),
                                        this.menu.setAttribute("aria-hidden", !1),
                                        this.openMenu(t),
                                        window.setTimeout(() => {
                                            t.firstFocusableElement &&
                                                (((t) => {
                                                    const i = Array.from(t.focusableElements).filter(e),
                                                        n = i[0],
                                                        s = i[i.length - 1];
                                                    function r(e) {
                                                        ("Tab" === e.key || 9 === e.keyCode) &&
                                                            (e.shiftKey
                                                                ? document.activeElement === n &&
                                                                  (s.focus(), e.preventDefault())
                                                                : document.activeElement === s &&
                                                                  (n.focus(), e.preventDefault()));
                                                    }
                                                    i.forEach((e) => {
                                                        e.removeAttribute("tabindex");
                                                    }),
                                                        t.item.removeEventListener("keydown", r),
                                                        t.item.addEventListener("keydown", r);
                                                })(t),
                                                t.firstFocusableElement.focus());
                                        }, 300);
                                }
                            });
                        });
                    });
            },
            init: () => {
                this.menus.forEach((e) => {
                    const t = e.item.querySelectorAll(
                        'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
                    );
                    t.forEach((e) => {
                        e.setAttribute("tabindex", "-1");
                    }),
                        (e.focusableElements = t),
                        (e.firstFocusableElement = t[0]);
                });
            },
        };
    }
}
(() => {
    function e() {
        const e = document.querySelectorAll(
            ".header-display-desktop .header-nav-list a[href*='#wm-mega']:not([data-mega-menu-loading-state]), .header-display-desktop .header-nav-list .header-nav-item--folder a[href*='-wm-mega-']:not([data-mega-menu-loading-state]),\n    [data-wm-plugin=\"secondary-nav\"] .secondary-links a[href*='#wm-mega']:not([data-mega-menu-loading-state])"
        );
        e.length && new wmMegaMenu(e);
    }
    (window.wmMegaMenu = { init: () => e() }),
        document.querySelector("SecondaryNav") || window.wmMegaMenu.init(),
        window.addEventListener("DOMContentLoaded", e);
})();
//# sourceMappingURL=/sm/c22c36bf6255e0f32552dc98e35b36df29f61997542770d4d5f4af48108b75c1.map
