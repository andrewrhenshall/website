/**
 * MODIFIED VERSION - Backdrop Filter Compatible
 * Original file: /gh/willmyerscode/megaMenu@2.0.53/megaMenu.js
 * Modified by: Andrew
 * Change: Line 686 - Replaced transform with left positioning for backdrop-filter compatibility
 */
class wmMegaMenu {
    static get pluginTitle() {
        return "wmMegaMenu";
    }
    static get defaultSettings() {
        return {
            layout: "full-width",
            openAnimation: "fade",  // CHANGED: Use fade instead of slide to avoid transforms
            openAnimationDelay: 300,
            insetMenuWidthLimit: 0.04,
            closeAnimationDelay: 300,
            closeMenuDelay: 150,
            activeAnimation: "fade",
            activeAnimationDelay: 300,
            closeOnScroll: !0,
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
            this.bindDesktopMenuHoverEvents(),
            this.bindDesktopMenuClickEvents(),
            this.bindMobileMenuEvents(),
            this.bindGlobalClickListener(),
            this.bindResizeListener(),
            this.bindDocumentClickListener(),
            this.bindScrollListener(),
            this.bindHeaderMenuResize(),
            this.handleCustomStyleReactivity();
    }
    addEditModeObserver() {
        window.top !== window &&
            ((this.editModeObserver = new MutationObserver(() => {
                this.placeMegaMenusByScreenSize();
            })),
            this.editModeObserver.observe(document.documentElement, { attributes: !0, attributeFilter: ["data-vce-edit-overlay-open"] }));
    }
    handleCustomStyleReactivity() {
        this.styleObserver ||
            ((this.styleObserver = new MutationObserver((e) => {
                for (let t of e)
                    "attributes" === t.type &&
                        "data-current-styles" === t.attributeName &&
                        (this.headerCurrentStyles = JSON.parse(this.header.dataset.currentStyles));
            })),
            this.styleObserver.observe(this.header, { attributes: !0, attributeFilter: ["data-current-styles"] }));
    }
    handleAccessibility() {
        const e = () => {
                document.querySelectorAll('[href*="#wm-mega"]').forEach((e) => {
                    e.setAttribute("aria-haspopup", "true"), e.setAttribute("aria-expanded", "false");
                });
            },
            t = () => {
                document.addEventListener("keydown", (e) => {
                    if ("Escape" === e.key && this.isMenuOpen) {
                        const e = document.activeElement;
                        this.closeMenu();
                        const t = document.querySelector(`[href*="#${this.activeMenu.id}"]`);
                        t &&
                            (t.focus(),
                            t.classList.add("focus-visible"),
                            setTimeout(() => {
                                e.classList.remove("focus-visible");
                            }, 100));
                    }
                });
            };
        return { init: e, addKeyboardOpenAndClosedNavigation: t };
    }
    bindHeaderMenuResize() {
        if (((this.header.dataset.menuOverlayThemeType = this.mobileMenuOverlayTheme), this.mobileHeader)) {
            const e = new ResizeObserver((e) => {
                for (let t of e) t.target === this.mobileHeader && this.mobileHeader.classList.contains("header-menu--open") && this.isMobileMenuOpen && this.setMobileHeaderOverlayMode();
            });
            e.observe(this.mobileHeader);
        }
    }
    bindScrollListener() {
        if (!this.settings.closeOnScroll) return;
        let e;
        window.addEventListener("scroll", () => {
            clearTimeout(e),
                (e = setTimeout(() => {
                    this.isMenuOpen && this.closeMenu();
                }, 100));
        });
    }
    bindDocumentClickListener() {
        document.addEventListener("click", (e) => {
            if (!this.isMenuOpen) return;
            const t = e.target;
            (!this.menu.contains(t) && !t.closest(".header-nav-item--mega-menu")) && this.closeMenu();
        });
    }
    bindResizeListener() {
        window.addEventListener("resize", () => {
            this.placeMegaMenusByScreenSize(), this.setSizing(), this.positionMenuWrapper();
        });
    }
    bindGlobalClickListener() {
        wmMegaMenu.globalClickListenerAttached ||
            (document.addEventListener("click", (e) => {
                document.body.classList.contains("wm-mega-menu--open") &&
                    !e.target.closest(".wm-mega-menu") &&
                    !e.target.closest(".header-nav-item--mega-menu") &&
                    this.closeMenu();
            }),
            (wmMegaMenu.globalClickListenerAttached = !0));
    }
    bindMobileMenuEvents() {
        this.header.querySelectorAll('[href*="#wm-mega"]').forEach((e) => {
            e.addEventListener("click", (t) => {
                if (!document.body.classList.contains("header--menu-open")) return;
                t.preventDefault(), t.stopPropagation();
                const i = e.getAttribute("href").split("#")[1];
                this.openMenu({ activeMenuId: i, isMobile: !0 });
            });
        });
    }
    bindDesktopMenuClickEvents() {
        this.header.querySelectorAll('[href*="#wm-mega"]').forEach((e) => {
            e.addEventListener("click", (e) => {
                this.settings.openOnClick && (e.preventDefault(), e.stopPropagation());
            });
        }),
            this.settings.openOnClick &&
                document.querySelectorAll('[href*="#wm-mega"]').forEach((e) => {
                    const t = e.closest(".header-nav-item");
                    t &&
                        t.addEventListener("click", (t) => {
                            if (document.body.classList.contains("header--menu-open")) return;
                            t.preventDefault(), t.stopPropagation();
                            const i = e.getAttribute("href").split("#")[1];
                            this.isMenuOpen
                                ? this.activeMenu.id !== i
                                    ? this.openMenu({ activeMenuId: i })
                                    : this.closeMenu()
                                : this.openMenu({ activeMenuId: i });
                        });
                });
    }
    bindDesktopMenuHoverEvents() {
        if (this.settings.openOnClick) return;
        let e;
        this.header.querySelectorAll('[href*="#wm-mega"]').forEach((t) => {
            const i = t.closest(".header-nav-item");
            i &&
                (i.addEventListener("mouseenter", () => {
                    if (document.body.classList.contains("header--menu-open")) return;
                    clearTimeout(e);
                    const n = t.getAttribute("href").split("#")[1];
                    this.isMenuOpen ? this.activeMenu.id !== n && this.openMenu({ activeMenuId: n }) : this.openMenu({ activeMenuId: n }),
                        (this.menuTriggerCurrentlyHovered = i);
                }),
                i.addEventListener("mouseleave", () => {
                    document.body.classList.contains("header--menu-open") ||
                        (e = setTimeout(() => {
                            this.menuTriggerCurrentlyHovered === i &&
                                ((this.menuTriggerCurrentlyHovered = null), this.isMenuOpen && !this.menu.matches(":hover") && this.closeMenu());
                        }, this.settings.closeMenuDelay));
                }));
        }),
            this.menu.addEventListener("mouseenter", () => {
                clearTimeout(e);
            }),
            this.menu.addEventListener("mouseleave", () => {
                e = setTimeout(() => {
                    this.isMenuOpen && this.closeMenu();
                }, this.settings.closeMenuDelay);
            });
    }
    async buildStructure() {
        const e = this.els;
        for (const t of e) {
            const e = t.innerHTML.trim(),
                i = await this.getPageContentBySlug(e),
                n = await this.getPageColorTheme(e),
                a = { slug: e, html: i, colorTheme: n, menuId: wm$.generateId(e, "wm-mega") };
            this.menus.push(a);
        }
    }
    getPageColorTheme(e) {
        return fetch(`/${e}?format=json`)
            .then((e) => e.json())
            .then((e) => e.collection.mainContent[0]?.["background-source-video"])
            .then((e) => {
                const t = document.querySelector(`script[type="application/json"][data-sqs-type="imageV2"]#${e}`);
                return t ? JSON.parse(t.textContent).colorData?.suggestedBgColor : "dark";
            })
            .catch(() => "dark");
    }
    async getPageContentBySlug(e) {
        try {
            const t = await fetch(`/${e}?format=json`);
            if (!t.ok) throw new Error("Network response was not ok");
            return (await t.json()).collection.mainContent;
        } catch (t) {
            return console.error("Error fetching data:", t), null;
        }
    }
    buildDesktopHTML() {
        const e = wm$.injectComponent({
            target: { element: this.page, position: "afterbegin" },
            componentName: "mega-menu",
            pluginTitle: this.pluginTitle,
            componentContent: this.createDesktopMenu(),
        });
        (this.menu = e.querySelector(".wm-mega-menu")),
            (this.menu.dataset.layout = this.settings.layout),
            (this.menuWrapper = this.menu.querySelector(".mega-menu-wrapper")),
            (this.absoluteMenu = this.menu.querySelector(".mega-menu-absolute"));
    }
    buildMobileHTML() {
        this.menus.forEach((e, t) => {
            this.createMobileMenu(e);
        });
    }
    createDesktopMenu() {
        const e = this.menus
                .map((e, t) => `<div data-menu-id="${e.menuId}" class="mega-menu-item ${0 === t ? "active" : ""}">${this.getPageBody(e.html)}</div>`)
                .join(""),
            t = `<div class="wm-mega-menu" data-open-animation="${this.settings.openAnimation}" role="navigation"><div class="mega-menu-wrapper"><div class="mega-menu-absolute">${e}</div></div></div>`;
        return t;
    }
    createMobileMenu(e) {
        const t = this.els.find((t) => t.innerHTML.trim() === e.slug),
            i = t.closest(".header-menu-nav-item, .header-menu-nav-folder-item"),
            n = this.mobileFoldersList.querySelector(`[data-folder="root"]`);
        if (!i || !n) return;
        i.classList.add("mobile-mega-menu-trigger");
        const a = wm$.injectComponent({
                target: { element: n, position: "beforeend" },
                componentName: "mega-menu-mobile",
                pluginTitle: this.pluginTitle,
                componentContent: this.getMobileFolderStructure(e),
            }),
            s = a.querySelector(`[data-folder="${e.menuId}-mobile-folder"]`),
            o = a.querySelector(`[data-folder-id="${e.menuId}-mobile-folder"]`),
            l = i.querySelector(".header-menu-nav-item-content"),
            r = l.cloneNode(!0);
        r.classList.remove("header-menu-nav-item-content"),
            r.classList.add("header-menu-nav-folder-title"),
            r.setAttribute("data-folder-id", `${e.menuId}-mobile-folder`),
            r.setAttribute("tabindex", "-1");
        const d = r.querySelector("a");
        d && d.classList.add("header-menu-nav-folder-title-link");
        const c = document.createElement("span");
        (c.className = "chevron chevron--right"),
            (c.innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="14" viewBox="0 0 8 14"><path d="M0.5,0.5 L7,7 L0.5,13.5" fill="none"></path></svg>'),
            r.appendChild(c),
            s.prepend(r),
            o.appendChild(this.getBackButton(e));
    }
    getMobileFolderStructure(e) {
        return `\n    <div class="header-menu-nav-folder mobile-mega-menu-folder">\n      <div class="header-menu-nav-folder-content" data-folder="${e.menuId}-mobile-folder">\n        <div class="header-menu-nav-list" data-folder-id="${e.menuId}-mobile-folder">\n          ${this.getPageBody(e.html)}\n        </div>\n      </div>\n    </div>\n  `;
    }
    getBackButton(e) {
        const t = document.createElement("div");
        return (
            (t.className = "container header-menu-nav-item header-menu-nav-item--collection"),
            t.setAttribute("data-folder-id", `${e.menuId}-mobile-folder`),
            (t.innerHTML = `<a href="#" data-action="return" class="header-menu-nav-item-content"><span class="chevron chevron--left"><svg xmlns="http://www.w3.org/2000/svg" width="8" height="14" viewBox="0 0 8 14"><path d="M0.5,0.5 L7,7 L0.5,13.5" fill="none"></path></svg></span><span>${this.settings.backButtonText}</span></a>`),
            t
        );
    }
    getPageBody(e) {
        return e
            .map((e) => {
                if ("code-block" === e.type) {
                    return `<div class="page-section">${e.html}</div>`;
                }
                return `<div class="page-section" data-section-id="${e.id}">${e.html}</div>`;
            })
            .join("");
    }
    placeMegaMenusByScreenSize() {
        document.body.classList.contains("header--menu-open") ? this.setMobileHeaderOverlayMode() : this.setDesktopMode();
    }
    setMobileHeaderOverlayMode() {
        (this.isMobileMenuOpen = !0),
            this.header.appendChild(this.menu),
            (this.header.dataset.menuOverlayThemeType = this.mobileMenuOverlayTheme),
            (this.menu.dataset.layout = "full-width");
    }
    setDesktopMode() {
        (this.isMobileMenuOpen = !1),
            this.page.prepend(this.menu),
            this.header.removeAttribute("data-menu-overlay-theme-type"),
            (this.menu.dataset.layout = this.settings.layout);
    }
    setMegaMenuTriggerActive() {
        this.header.querySelectorAll('[href*="#wm-mega"]').forEach((e) => {
            const t = e.getAttribute("href").split("#")[1],
                i = t === this.activeMenu.id,
                n = e.closest(".header-nav-item"),
                a = e.closest(".header-menu-nav-item, .header-menu-nav-folder-item");
            i && this.settings.addActiveTriggerClass
                ? (n && n.classList.add(this.settings.activeDesktopTriggerClass),
                  a && a.classList.add(this.settings.activeMobileTriggerClass),
                  n && n.classList.add("mega-menu--active"))
                : (n && n.classList.remove(this.settings.activeDesktopTriggerClass),
                  a && a.classList.remove(this.settings.activeMobileTriggerClass),
                  n && n.classList.remove("mega-menu--active"));
        });
    }
    openMenu({ activeMenuId: e, isMobile: t } = {}) {
        if (
            (wm$.emitEvent("wmMegaMenu:beforeOpenMenu", this),
            this.runHooks("beforeOpenMenu"),
            this.isAnimating || (e && !this.menus.find((t) => t.menuId === e)))
        )
            return;
        const i = this.menus.find((t) => t.menuId === e) || this.activeMenu;
        if ((this.changeActiveMenu(i), !t)) {
            this.isAnimating = !0;
            const e = this.menuWrapper.offsetHeight;
            this.menu.classList.add("open"),
                (document.body.style.overflow = ""),
                document.body.classList.add("wm-mega-menu--open"),
                this.setHeaderBottom();
            const t = { duration: this.settings.openAnimationDelay, easing: "cubic-bezier(0.4, 0, 0.2, 1)" };
            this.menuWrapper.animate(this.getOpenAnimationKeyframes(), t).onfinish = () => {
                (this.isMenuOpen = !0),
                    (this.isAnimating = !1),
                    this.setMegaMenuTriggerActive(),
                    wm$.emitEvent("wmMegaMenu:afterOpenMenu", this),
                    this.runHooks("afterOpenMenu");
            };
        } else {
            const e = this.mobileFoldersList.querySelector(`[data-folder-id="${i.menuId}-mobile-folder"]`);
            e && ((this.isMenuOpen = !0), this.setMegaMenuTriggerActive(), e.click());
        }
    }
    closeMenu() {
        if ((wm$.emitEvent("wmMegaMenu:beforeCloseMenu", this), this.runHooks("beforeCloseMenu"), this.isAnimating)) return;
        if (!this.isMobileMenuOpen) {
            (this.isAnimating = !0), (document.body.style.overflow = "");
            const e = { duration: this.settings.closeAnimationDelay, easing: "cubic-bezier(0.4, 0, 0.2, 1)" };
            this.menuWrapper.animate(this.getCloseAnimationKeyframes(), e).onfinish = () => {
                this.menu.classList.remove("open"),
                    document.body.classList.remove("wm-mega-menu--open"),
                    (this.isMenuOpen = !1),
                    (this.isAnimating = !1),
                    this.setMegaMenuTriggerActive(),
                    wm$.emitEvent("wmMegaMenu:afterCloseMenu", this),
                    this.runHooks("afterCloseMenu");
            };
        } else {
            const e = this.mobileFoldersList.querySelector(`[data-folder-id="${this.activeMenu.menuId}-mobile-folder"] [data-action="return"]`);
            e && ((this.isMenuOpen = !1), this.setMegaMenuTriggerActive(), e.click());
        }
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
    positionArrow() {
        if ("inset" !== this.settings.layout) return;
        let e = this.menu.querySelector(".mega-menu-arrow");
        if (!e) {
            const t = document.createElement("div");
            t.classList.add("mega-menu-arrow"), this.menu.appendChild(t), (e = t);
        }
        const t = this.header.querySelector(`[href="#${this.activeMenu.id}"]`);
        if (!t) return;
        const i = t.getBoundingClientRect(),
            n = this.menuWrapper.getBoundingClientRect(),
            a = i.left + i.width / 2 - n.left - 5;
        requestAnimationFrame(() => {
            (e.style.left = `${a}px`), (e.style.top = `-${this.headerBottom}px`);
            const t = this.activeMenu.width * this.parseInsetLimit(this.settings.insetMenuWidthLimit),
                i = n.width - t;
            a < t
                ? (e.style.opacity = 0)
                : a > i
                  ? (e.style.opacity = 0)
                  : e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: "forwards" });
        });
    }
    changeActiveMenu(e) {
        if (this.activeMenu === e) return;
        this.menus.forEach((t) => {
            t.item.classList.toggle("active", t === e);
        }),
            (this.activeMenu = e),
            this.setSizing(),
            this.positionMenuWrapper(),
            (this.menu.dataset.sectionTheme = e.colorTheme),
            this.setMegaMenuTriggerActive(),
            "inset" === this.settings.layout && this.positionArrow(),
            wm$.emitEvent("wmMegaMenu:activeMenuChanged", this),
            this.runHooks("afterActiveMenuChange", this);
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
                // CRITICAL CHANGE FOR BACKDROP-FILTER SUPPORT
                // Original: this.absoluteMenu.style.transform = `translateX(-${e}px)`;
                // Modified: Use left positioning instead of transform
                this.absoluteMenu.style.left = `-${e}px`;
                this.absoluteMenu.style.transform = 'none';
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
        const e = this.menus.map((e) => ((e.item = this.menu.querySelector(`[data-menu-id="${e.menuId}"]`)), (e.width = e.item.offsetWidth), e.width)).reduce((e, t) => e + t, 0);
        let t = Array.from(this.activeMenu.item.children).reduce((e, t) => e + t.offsetHeight, 0);
        const i = window.getComputedStyle(this.menuWrapper);
        t += parseFloat(i.borderTopWidth) + parseFloat(i.borderBottomWidth);
        const n = this.activeMenu.width;
        (this.absoluteMenu.style.width = `${e}px`), (this.activeMenu.height = t), this.menu.style.setProperty("--active-menu-height", t + "px");
    }
    setHeaderBottom() {
        const e = this.header.getBoundingClientRect();
        (this.headerBottom = e.height), this.menu.style.setProperty("--header-bottom", this.headerBottom + "px");
    }
    runHooks(e) {
        const t = this.settings.hooks[e];
        t && Array.isArray(t) && t.forEach((e) => "function" == typeof e && e(this));
    }
}
window.wmMegaMenu = wmMegaMenu;

// Wait for toolkit and DOM to be ready, then find and initialize mega menu links
(function initWhenReady() {
    if (typeof wm$ !== 'undefined' && document.body) {
        console.log('Toolkit loaded, finding mega menu links...');
        
        // Find all navigation links with #wm-mega format
        const megaMenuLinks = document.querySelectorAll('a[href*="#wm-mega"]');
        console.log('Found mega menu links:', megaMenuLinks.length);
        
        if (megaMenuLinks.length > 0) {
            // Extract the hidden page slugs from the links
            const slugElements = [];
            megaMenuLinks.forEach(link => {
                const href = link.getAttribute('href');
                const match = href.match(/#wm-mega=\/(.+)/);
                if (match) {
                    const slug = match[1];
                    // Create a temporary element containing the slug
                    const el = document.createElement('div');
                    el.innerHTML = slug;
                    el.style.display = 'none';
                    slugElements.push(el);
                    console.log('Found mega menu slug:', slug);
                }
            });
            
            if (slugElements.length > 0) {
                try {
                    new wmMegaMenu(slugElements);
                    console.log('Mega Menu initialized successfully with', slugElements.length, 'menu(s)');
                } catch(err) {
                    console.error('Mega Menu initialization error:', err);
                }
            } else {
                console.error('No valid mega menu slugs found in links');
            }
        } else {
            console.error('No mega menu links found on page');
        }
    } else {
        if (!document.body) {
            console.log('Waiting for DOM...');
        } else {
            console.log('Waiting for toolkit...');
        }
        setTimeout(initWhenReady, 100);
    }
})();
