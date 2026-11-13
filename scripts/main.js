"use strict";

(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobilePreference = window.matchMedia("(max-width: 768px)");
    const dialog = document.querySelector(".event-modal");
    const header = document.querySelector("header");
    const hero = document.querySelector(".hero");
    let updateHeroPlayback = () => {};

    // Modal owns its Swiper, keyboard scope and scroll lock.
    function initEventModal() {
        if (!dialog || typeof dialog.showModal !== "function") {
            return;
        }

        const previousOverflow = document.documentElement.style.overflow;
        const previousFocus = document.activeElement;
        let modalSwiper = null;

        dialog.showModal();
        document.documentElement.style.overflow = "hidden";

        if (typeof window.Swiper === "function") {
            modalSwiper = new window.Swiper(dialog.querySelector(".modal-slider"), {
                slidesPerView: 1,
                loop: true,
                speed: motionPreference.matches ? 0 : 450,
                navigation: {
                    prevEl: dialog.querySelector(".modal-prev"),
                    nextEl: dialog.querySelector(".modal-next"),
                    addIcons: false
                },
                pagination: {
                    el: dialog.querySelector(".modal-pagination"),
                    clickable: true,
                    renderBullet(index, className) {
                        return `<button class="${className}" type="button" aria-label="이벤트 배너 ${index + 1}"></button>`;
                    }
                },
                keyboard: {
                    enabled: true,
                    onlyInViewport: true
                },
                a11y: {
                    prevSlideMessage: "이전 이벤트 배너",
                    nextSlideMessage: "다음 이벤트 배너",
                    paginationBulletMessage: "이벤트 배너 {{index}}",
                    containerMessage: "이벤트 배너"
                }
            });

            dialog.querySelectorAll(".modal-prev, .modal-next").forEach((button) => {
                button.disabled = false;
            });
        } else {
            // A failed CDN must not prevent closing the dialog or using the page.
            dialog.querySelector(".modal-controls").hidden = true;
        }

        function closeModal() {
            if (dialog.open) {
                dialog.close();
            }
        }

        dialog.querySelector(".modal-close").addEventListener("click", closeModal);
        dialog.addEventListener("cancel", (event) => {
            event.preventDefault();
            closeModal();
        });
        dialog.addEventListener("close", () => {
            document.documentElement.style.overflow = previousOverflow;
            modalSwiper?.keyboard.disable();
            const focusTarget = previousFocus instanceof HTMLElement && previousFocus !== document.body
                ? previousFocus
                : document.querySelector(".logo a");
            focusTarget?.focus({ preventScroll: true });
            updateHeroPlayback();
        });

        motionPreference.addEventListener("change", () => {
            if (modalSwiper) {
                modalSwiper.params.speed = motionPreference.matches ? 0 : 450;
            }
        });
    }

    function initHeader() {
        if (!header || !hero) {
            return;
        }

        const promotion = document.querySelector(".promotion");
        const items = [...header.querySelectorAll(".nav-item")];
        let scrollFrame = 0;

        function setMenu(item, open) {
            const drop = item.querySelector(".drop");
            if (!drop) {
                return;
            }
            if (mobilePreference.matches && open) {
                drop.style.setProperty("--drawer-drop-height", `${drop.scrollHeight}px`);
            }
            item.classList.toggle("open", open);
            item.querySelector(".menu").setAttribute("aria-expanded", String(open));
            drop.inert = !open;
        }

        function closeMenus(except = null) {
            items.forEach((item) => {
                if (item !== except) {
                    setMenu(item, false);
                }
            });
        }

        function openMenu(item) {
            closeMenus(item);
            setMenu(item, true);
        }

        items.forEach((item) => {
            const trigger = item.querySelector(".menu");
            const drop = item.querySelector(".drop");
            const links = [...item.querySelectorAll(".drop a")];

            drop?.addEventListener("transitionend", (event) => {
                if (event.target === drop && event.propertyName === "height"
                    && mobilePreference.matches && item.classList.contains("open")
                    && drop.contains(document.activeElement)) {
                    // Keyboard focus may move before the animated panel has finished growing.
                    document.activeElement.scrollIntoView({ block: "nearest", inline: "nearest" });
                }
            });

            item.addEventListener("pointerenter", (event) => {
                if (!mobilePreference.matches && event.pointerType !== "touch") {
                    openMenu(item);
                }
            });
            item.addEventListener("pointerleave", () => {
                if (!mobilePreference.matches && !item.contains(document.activeElement)) {
                    setMenu(item, false);
                }
            });
            trigger.addEventListener("click", () => {
                if (item.classList.contains("open")) {
                    setMenu(item, false);
                } else {
                    openMenu(item);
                }
            });
            item.addEventListener("focusout", () => {
                queueMicrotask(() => {
                    if (!mobilePreference.matches && !item.contains(document.activeElement)) {
                        setMenu(item, false);
                    }
                });
            });
            item.addEventListener("keydown", (event) => {
                const index = links.indexOf(document.activeElement);

                if (event.key === "Escape") {
                    event.preventDefault();
                    setMenu(item, false);
                    trigger.focus();
                } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    openMenu(item);
                    const direction = event.key === "ArrowDown" ? 1 : -1;
                    const next = index < 0
                        ? (direction === 1 ? 0 : links.length - 1)
                        : (index + direction + links.length) % links.length;
                    links[next]?.focus();
                } else if (index >= 0 && (event.key === "Home" || event.key === "End")) {
                    event.preventDefault();
                    links[event.key === "Home" ? 0 : links.length - 1]?.focus();
                }
            });
        });

        document.addEventListener("pointerdown", (event) => {
            if (!header.contains(event.target)) {
                closeMenus();
            }
        });

        function updateHeader() {
            scrollFrame = 0;
            const bannerBottom = promotion ? promotion.getBoundingClientRect().bottom : 0;
            header.style.setProperty("--header-offset", `${Math.max(0, Math.min(36, bannerBottom))}px`);
            header.classList.toggle("is-solid", hero.getBoundingClientRect().bottom <= header.offsetHeight);
        }

        function scheduleHeaderUpdate() {
            if (!scrollFrame) {
                scrollFrame = window.requestAnimationFrame(updateHeader);
            }
        }

        promotion?.querySelector(".close").addEventListener("click", () => {
            promotion.classList.add("is-dismissed");
            promotion.inert = true;
            // Move focus out of the collapsing banner for keyboard users.
            header.querySelector(".logo a")?.focus({ preventScroll: true });
            scheduleHeaderUpdate();
        });

        if (promotion && typeof ResizeObserver === "function") {
            new ResizeObserver(scheduleHeaderUpdate).observe(promotion);
        }

        window.addEventListener("scroll", scheduleHeaderUpdate, { passive: true });
        window.addEventListener("resize", scheduleHeaderUpdate);
        updateHeader();

        const search = header.querySelector("#search");
        const searchInput = search.querySelector("input");
        const searchStatus = search.querySelector("#search-status");
        search.addEventListener("submit", (event) => {
            event.preventDefault();
            if (!searchInput.value.trim()) {
                searchInput.focus();
                return;
            }
            searchStatus.textContent = "";
            window.requestAnimationFrame(() => {
                searchStatus.textContent = "검색 결과는 아직 연결되지 않았습니다.";
            });
        });
    }

    // One shared GNB: dropdowns on PC/tablet, an accessible modal drawer on mobile.
    function initMobileHeader() {
        const trigger = header?.querySelector(".menu-mobile");
        const navigation = header?.querySelector("nav");
        const search = header?.querySelector("#search");
        const overlay = header?.querySelector(".menu-overlay");
        const heading = navigation?.querySelector(".drawer-heading");
        const closeButton = navigation?.querySelector(".drawer-close");
        if (!trigger || !navigation || !search || !overlay || !heading || !closeButton) {
            return;
        }
        const shell = trigger.parentElement;
        const searchButton = search.querySelector("button");
        const searchInput = search.querySelector("input");
        const desktopHeroLabel = hero?.getAttribute("aria-label");
        const backgroundState = new Map();
        let scrollState = null;

        function isOpen() {
            return header.classList.contains("is-menu-open");
        }

        function lockBackground() {
            const root = document.documentElement;
            const body = document.body;
            scrollState = {
                x: window.scrollX,
                y: window.scrollY,
                overflow: root.style.overflow,
                gutter: root.style.scrollbarGutter,
                body: Object.fromEntries(["overflow", "position", "top", "left", "width"]
                    .map((property) => [property, body.style[property]]))
            };
            // Preserve the scrollbar space so locking cannot change the breakpoint.
            root.style.scrollbarGutter = "stable";
            root.style.overflow = "hidden";
            body.style.overflow = "hidden";
            body.style.position = "fixed";
            body.style.top = `${-scrollState.y}px`;
            body.style.left = `${-scrollState.x}px`;
            body.style.width = "100%";
            const targets = [
                ...[...body.children].filter((element) => element !== header && element.tagName !== "SCRIPT"),
                ...[...shell.children].filter((element) => element !== navigation && element !== overlay)
            ];
            targets.forEach((element) => {
                backgroundState.set(element, element.inert);
                element.inert = true;
            });
        }

        function unlockBackground() {
            backgroundState.forEach((inert, element) => { element.inert = inert; });
            backgroundState.clear();
            if (!scrollState) {
                return;
            }
            const saved = scrollState;
            scrollState = null;
            Object.entries(saved.body).forEach(([property, value]) => {
                document.body.style[property] = value;
            });
            document.documentElement.style.overflow = saved.overflow;
            document.documentElement.style.scrollbarGutter = saved.gutter;
            window.scrollTo(saved.x, saved.y);
        }

        function closeMenu(restoreFocus = true) {
            const wasOpen = isOpen();
            header.classList.remove("is-menu-open");
            trigger.setAttribute("aria-expanded", "false");
            trigger.setAttribute("aria-label", "메뉴 열기");
            shell.removeAttribute("role");
            shell.removeAttribute("aria-modal");
            shell.removeAttribute("aria-labelledby");
            navigation.inert = mobilePreference.matches;
            if (wasOpen) {
                unlockBackground();
                if (restoreFocus && mobilePreference.matches) {
                    trigger.focus({ preventScroll: true });
                }
            }
        }

        function closeSearch() {
            search.classList.remove("is-search-open");
            if (mobilePreference.matches) {
                searchButton.setAttribute("aria-expanded", "false");
            }
        }

        function resetAccordions() {
            header.classList.add("drawer-reset");
            navigation.querySelectorAll(".nav-item").forEach((item) => {
                const drop = item.querySelector(".drop");
                if (drop) {
                    item.classList.remove("open");
                    item.querySelector(".menu").setAttribute("aria-expanded", "false");
                    drop.inert = true;
                    drop.style.removeProperty("--drawer-drop-height");
                }
            });
            // Reset while hidden, without replaying a previous accordion's closing motion.
            navigation.getBoundingClientRect();
            navigation.querySelector(":scope > ul").scrollTop = 0;
            header.classList.remove("drawer-reset");
        }

        function syncMobileHeader() {
            const wasOpen = isOpen();
            const focusedInNavigation = navigation.contains(document.activeElement);
            header.classList.remove("drawer-ready");
            closeMenu(false);
            trigger.hidden = !mobilePreference.matches;
            heading.hidden = !mobilePreference.matches;
            overlay.hidden = !mobilePreference.matches;
            closeSearch();
            if (desktopHeroLabel) {
                hero.setAttribute("aria-label", mobilePreference.matches
                    ? "TOUS les JOURS, HOLIDAY Lights on"
                    : desktopHeroLabel);
            }
            if (mobilePreference.matches) {
                resetAccordions();
                searchButton.setAttribute("aria-controls", "search-query");
                if (focusedInNavigation) {
                    trigger.focus({ preventScroll: true });
                }
            } else {
                navigation.querySelectorAll(".drop").forEach((drop) => {
                    drop.style.removeProperty("--drawer-drop-height");
                });
                searchButton.removeAttribute("aria-expanded");
                searchButton.removeAttribute("aria-controls");
                if (wasOpen) {
                    navigation.querySelector(".menu")?.focus({ preventScroll: true });
                }
            }
        }

        function openMenu() {
            if (!mobilePreference.matches || isOpen() || dialog?.open) {
                return;
            }
            closeSearch();
            resetAccordions();
            navigation.inert = false;
            lockBackground();
            header.classList.add("drawer-ready");
            // Establish the off-screen position before the first opening transition.
            navigation.getBoundingClientRect();
            header.classList.add("is-menu-open");
            // Keep the nav landmark; the existing generic wrapper owns dialog semantics.
            shell.setAttribute("role", "dialog");
            shell.setAttribute("aria-modal", "true");
            shell.setAttribute("aria-labelledby", "drawer-title");
            trigger.setAttribute("aria-expanded", "true");
            trigger.setAttribute("aria-label", "메뉴 닫기");
            closeButton.focus({ preventScroll: true });
        }

        function focusableItems() {
            return [...navigation.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), [tabindex]')]
                .filter((element) => element.tabIndex >= 0 && !element.closest("[inert]")
                    && element.getClientRects().length && getComputedStyle(element).visibility !== "hidden");
        }

        trigger.addEventListener("click", openMenu);
        closeButton.addEventListener("click", () => closeMenu());
        overlay.addEventListener("click", () => closeMenu());
        navigation.addEventListener("click", (event) => {
            if (mobilePreference.matches && event.target.closest("a[href]")) {
                closeMenu();
            }
        });
        document.addEventListener("keydown", (event) => {
            if (!isOpen()) {
                return;
            }
            if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                closeMenu();
            } else if (event.key === "Tab") {
                const items = focusableItems();
                const first = items[0] || closeButton;
                const last = items[items.length - 1] || closeButton;
                if (event.shiftKey && (document.activeElement === first || !navigation.contains(document.activeElement))) {
                    event.preventDefault();
                    last.focus({ preventScroll: true });
                } else if (!event.shiftKey && (document.activeElement === last || !navigation.contains(document.activeElement))) {
                    event.preventDefault();
                    first.focus({ preventScroll: true });
                }
            }
        }, true);
        document.addEventListener("focusin", (event) => {
            if (isOpen() && !navigation.contains(event.target)) {
                closeButton.focus({ preventScroll: true });
            }
        });
        header.addEventListener("keydown", (event) => {
            if (mobilePreference.matches && event.key === "Escape" && search.classList.contains("is-search-open")) {
                closeSearch();
                searchButton.focus({ preventScroll: true });
            }
        });
        document.addEventListener("pointerdown", (event) => {
            if (mobilePreference.matches && !header.contains(event.target)) {
                closeSearch();
            }
        });
        search.addEventListener("submit", (event) => {
            if (mobilePreference.matches && !search.classList.contains("is-search-open")) {
                event.preventDefault();
                event.stopImmediatePropagation();
                closeMenu(false);
                search.classList.add("is-search-open");
                searchButton.setAttribute("aria-expanded", "true");
                searchInput.focus();
            }
        }, true);
        mobilePreference.addEventListener("change", syncMobileHeader);
        syncMobileHeader();
    }

    // Load the official API only when the background video can actually be shown.
    function loadYouTubeAPI() {
        if (window.YT?.Player) {
            return Promise.resolve(window.YT);
        }

        return new Promise((resolve, reject) => {
            const existingCallback = window.onYouTubeIframeAPIReady;
            const timeout = window.setTimeout(() => {
                reject(new Error("YouTube API timeout"));
            }, 12000);

            window.onYouTubeIframeAPIReady = () => {
                window.clearTimeout(timeout);
                if (typeof existingCallback === "function") {
                    existingCallback();
                }
                resolve(window.YT);
            };

            const script = document.createElement("script");
            script.src = "https://www.youtube.com/iframe_api";
            script.async = true;
            script.addEventListener("error", () => {
                window.clearTimeout(timeout);
                reject(new Error("YouTube API unavailable"));
            }, { once: true });
            document.head.append(script);
        });
    }

    function initHero() {
        if (!hero) {
            return;
        }

        let player = null;
        let ready = false;
        let loading = false;
        let failed = false;
        let inView = hero.getBoundingClientRect().bottom > 0;
        let playbackTimeout = 0;
        let revealTimeout = 0;
        let loopTimer = 0;
        let playbackState = -1;
        let hasShownVideo = false;

        function shouldPlay() {
            return !mobilePreference.matches && !failed && !motionPreference.matches
                && !document.hidden && !dialog?.open && inView;
        }

        function showFallback() {
            window.clearTimeout(playbackTimeout);
            window.clearTimeout(revealTimeout);
            window.clearTimeout(loopTimer);
            hero.classList.remove("is-playing");
            hero.classList.add("is-video-pending");
        }

        function watchLoop() {
            window.clearTimeout(loopTimer);
            if (!ready || !shouldPlay() || playbackState !== 1) {
                return;
            }
            const duration = Number(player.getDuration());
            const time = Number(player.getCurrentTime());
            // Best effort: seek before YouTube reaches its end screen, retaining native loop as fallback.
            if (duration > 2 && time > 0 && duration - time > 0 && duration - time <= 0.3) {
                player.seekTo(0, true);
            }
            loopTimer = window.setTimeout(watchLoop, 200);
        }

        function revealVideo() {
            window.clearTimeout(revealTimeout);
            if (hero.classList.contains("is-playing")) {
                watchLoop();
                return;
            }
            // Hide startup chrome until playback has settled; shorter shielding for later buffering.
            revealTimeout = window.setTimeout(() => {
                if (shouldPlay() && playbackState === 1) {
                    hero.classList.remove("is-video-pending");
                    hero.classList.add("is-playing");
                    hasShownVideo = true;
                    watchLoop();
                }
            }, hasShownVideo ? 300 : 1500);
        }

        function failVideo(event) {
            if (event?.target && event.target !== player) {
                return;
            }
            if (mobilePreference.matches) {
                showFallback();
                return;
            }
            failed = true;
            showFallback();
            if (ready) {
                player.pauseVideo();
            }
        }

        function watchPlayback() {
            window.clearTimeout(playbackTimeout);
            playbackTimeout = window.setTimeout(() => {
                if (!hero.classList.contains("is-playing")) {
                    failVideo();
                }
            }, 12000);
        }

        async function createPlayer() {
            if (mobilePreference.matches || loading || player || failed || !/^https?:$/.test(window.location.protocol)) {
                return;
            }
            loading = true;

            try {
                const youtube = await loadYouTubeAPI();
                if (!shouldPlay()) {
                    loading = false;
                    return;
                }

                player = new youtube.Player("hero-player", {
                    videoId: hero.dataset.videoId,
                    playerVars: {
                        autoplay: 1,
                        mute: 1,
                        loop: 1,
                        playlist: hero.dataset.videoId,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        playsinline: 1,
                        rel: 0,
                        origin: window.location.origin
                    },
                    events: {
                        onReady(event) {
                            if (event.target !== player || mobilePreference.matches) {
                                event.target.destroy();
                                return;
                            }
                            ready = true;
                            const iframe = event.target.getIframe();
                            iframe.tabIndex = -1;
                            iframe.setAttribute("aria-hidden", "true");
                            iframe.setAttribute("title", "뚜레쥬르 배경 영상");
                            iframe.setAttribute("allow", "autoplay; encrypted-media");
                            event.target.mute();
                            updateHeroPlayback();
                        },
                        onStateChange(event) {
                            if (event.target !== player || mobilePreference.matches) {
                                return;
                            }
                            playbackState = event.data;
                            if (event.data === youtube.PlayerState.PLAYING) {
                                if (shouldPlay()) {
                                    window.clearTimeout(playbackTimeout);
                                    revealVideo();
                                } else {
                                    player.pauseVideo();
                                }
                            } else if (event.data === youtube.PlayerState.ENDED && shouldPlay()) {
                                showFallback();
                                player.seekTo(0, true);
                                player.playVideo();
                                watchPlayback();
                            } else if (event.data === 2 || event.data === 3) {
                                showFallback();
                                if (event.data === 3 && shouldPlay()) {
                                    watchPlayback();
                                }
                            }
                        },
                        onError: failVideo,
                        onAutoplayBlocked: failVideo
                    }
                });
                watchPlayback();
            } catch {
                failVideo();
            } finally {
                loading = false;
            }
        }

        updateHeroPlayback = () => {
            if (mobilePreference.matches) {
                showFallback();
                if (player) {
                    const previousPlayer = player;
                    player = null;
                    ready = false;
                    failed = false;
                    playbackState = -1;
                    hasShownVideo = false;
                    previousPlayer.destroy();
                    // YouTube replaces the mount with an iframe. Restore it for PC/tablet re-entry.
                    const mount = document.createElement("div");
                    mount.id = "hero-player";
                    hero.querySelector(".hero-video").replaceChildren(mount);
                }
                return;
            }
            if (!shouldPlay() || failed) {
                showFallback();
                if (ready) {
                    player.pauseVideo();
                }
                return;
            }

            if (ready) {
                player.mute();
                player.playVideo();
                watchPlayback();
            } else {
                void createPlayer();
            }
        };

        if (typeof IntersectionObserver === "function") {
            new IntersectionObserver(([entry]) => {
                inView = entry.isIntersecting;
                updateHeroPlayback();
            }).observe(hero);
        } else {
            window.addEventListener("scroll", () => {
                const bounds = hero.getBoundingClientRect();
                inView = bounds.bottom > 0 && bounds.top < window.innerHeight;
                updateHeroPlayback();
            }, { passive: true });
        }

        motionPreference.addEventListener("change", updateHeroPlayback);
        mobilePreference.addEventListener("change", updateHeroPlayback);
        document.addEventListener("visibilitychange", updateHeroPlayback);
        updateHeroPlayback();
    }


    // Repeat existing records only to satisfy Swiper's loop minimum at the original PC widths.
    function repeatSlidesForLoop(element, minimum = 0) {
        const wrapper = element.querySelector(".swiper-wrapper");
        const originals = [...wrapper.children].filter((slide) => !slide.hasAttribute("data-loop-copy"));
        if (!originals.length) {
            return;
        }
        const target = Math.ceil(Math.max(minimum, originals.length * 2) / originals.length) * originals.length;
        while (wrapper.children.length < target) {
            originals.forEach((slide) => {
                const copy = slide.cloneNode(true);
                copy.dataset.loopCopy = "true";
                wrapper.append(copy);
            });
        }
    }

    function bindSliderKeys(element, swiper) {
        element.addEventListener("keydown", (event) => {
            if (event.altKey || event.ctrlKey || event.metaKey || event.target.matches("input, textarea, select")) {
                return;
            }
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                if (event.key === "ArrowLeft") {
                    swiper.slidePrev();
                } else {
                    swiper.slideNext();
                }
            }
        });
    }

    function initBestItems() {
        const section = document.querySelector(".best-item");
        const element = section?.querySelector(".best-slider");
        if (!element) {
            return;
        }

        if (typeof window.Swiper === "function" && !element.swiper) {
            const wrapper = element.querySelector(".item-list");
            const originals = [...wrapper.children].filter((slide) => !slide.hasAttribute("data-loop-copy"));
            let swiper;

            function mountBestSlider() {
                const mobile = mobilePreference.matches;
                // Row-filled Grid uses rewind; PC/tablet retain the original loop options.
                swiper?.destroy(true, true);
                wrapper.replaceChildren(...originals);
                repeatSlidesForLoop(element);
                swiper = new window.Swiper(element, {
                    slidesPerView: mobile ? 2 : 4,
                    slidesPerGroup: mobile ? 2 : 1,
                    spaceBetween: mobile ? 30 : 24,
                    breakpoints: mobile ? {} : {
                        1024: { spaceBetween: "3.010752688%" },
                        1281: { spaceBetween: 24 }
                    },
                    loop: !mobile,
                    rewind: mobile,
                    grid: { rows: mobile ? 2 : 1, fill: mobile ? "row" : "column" },
                    speed: motionPreference.matches ? 0 : 450,
                    navigation: {
                        prevEl: element.querySelector(".best-prev"),
                        nextEl: element.querySelector(".best-next"),
                        addIcons: false
                    },
                    a11y: {
                        containerMessage: "베스트 상품",
                        prevSlideMessage: "이전 베스트 상품",
                        nextSlideMessage: "다음 베스트 상품"
                    }
                });
            }

            mountBestSlider();
            mobilePreference.addEventListener("change", mountBestSlider);
            element.querySelectorAll(".best-prev, .best-next").forEach((button) => {
                button.disabled = false;
            });
            bindSliderKeys(element, {
                slidePrev: () => swiper.slidePrev(),
                slideNext: () => swiper.slideNext()
            });
            motionPreference.addEventListener("change", () => {
                swiper.params.speed = motionPreference.matches ? 0 : 450;
            });
        }

        section.querySelectorAll(".product-visual").forEach((visual) => {
            const hoverImage = visual.querySelector(".product-image-hover");
            if (hoverImage.complete && hoverImage.naturalWidth > 0) {
                visual.classList.add("has-hover-image");
            }
            hoverImage.addEventListener("load", () => visual.classList.add("has-hover-image"));
            hoverImage.addEventListener("error", () => visual.classList.remove("has-hover-image"));
        });

        const status = section.querySelector(".product-status");
        const feedbackTimers = new WeakMap();

        section.addEventListener("click", (event) => {
            const button = event.target.closest(".product-actions button");
            if (!button || !section.contains(button)) {
                return;
            }

            const card = button.closest(".product-card");
            const name = card.querySelector(".name").textContent;
            let message;

            if (button.classList.contains("add-wishlist")) {
                const selected = button.getAttribute("aria-pressed") !== "true";
                section.querySelectorAll(".product-card").forEach((item) => {
                    if (item.dataset.productId === card.dataset.productId) {
                        item.querySelector(".add-wishlist").setAttribute("aria-pressed", String(selected));
                    }
                });
                message = `${name} 위시리스트 UI ${selected ? "선택" : "해제"}. 실제 저장은 연결되지 않았습니다.`;
            } else {
                window.clearTimeout(feedbackTimers.get(button));
                button.classList.add("is-feedback");
                feedbackTimers.set(button, window.setTimeout(() => {
                    button.classList.remove("is-feedback");
                }, 800));
                message = `${name} 장바구니 서비스는 아직 연결되지 않았습니다.`;
            }

            status.textContent = "";
            window.requestAnimationFrame(() => {
                status.textContent = message;
            });
        });
    }

    function initEventSlider() {
        const section = document.querySelector("section.event");
        const element = section?.querySelector(".event-slider");
        if (!element || typeof window.Swiper !== "function" || element.swiper) {
            return;
        }

        repeatSlidesForLoop(element);
        const swiper = new window.Swiper(element, {
            slidesPerView: "auto",
            centeredSlides: true,
            initialSlide: 1,
            slidesPerGroup: 1,
            spaceBetween: 50,
            breakpoints: {
                0: { slidesPerView: 1, spaceBetween: 30, autoHeight: true },
                769: { slidesPerView: "auto", spaceBetween: 50, autoHeight: false }
            },
            loop: true,
            speed: motionPreference.matches ? 0 : 600,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false
            },
            navigation: {
                prevEl: element.querySelector(".event-prev"),
                nextEl: element.querySelector(".event-next"),
                addIcons: false
            },
            a11y: {
                containerMessage: "뚜레쥬르 이벤트",
                prevSlideMessage: "이전 이벤트",
                nextSlideMessage: "다음 이벤트"
            }
        });

        element.querySelectorAll(".event-prev, .event-next").forEach((button) => {
            button.disabled = false;
        });
        bindSliderKeys(element, swiper);

        let hovered = false;
        let focused = false;
        let inView = typeof IntersectionObserver !== "function";

        function syncAutoplay() {
            const stopped = motionPreference.matches || hovered || focused
                || !inView || document.hidden || dialog?.open;
            if (stopped) {
                swiper.autoplay.stop();
            } else if (!swiper.autoplay.running) {
                swiper.autoplay.start();
            }

        }

        element.addEventListener("pointerenter", (event) => {
            if (event.pointerType !== "touch") {
                hovered = true;
                syncAutoplay();
            }
        });
        element.addEventListener("pointerleave", () => {
            hovered = false;
            syncAutoplay();
        });
        element.addEventListener("focusin", () => {
            focused = true;
            syncAutoplay();
        });
        element.addEventListener("focusout", () => {
            queueMicrotask(() => {
                focused = element.contains(document.activeElement);
                syncAutoplay();
            });
        });

        if (typeof IntersectionObserver === "function") {
            new IntersectionObserver(([entry]) => {
                inView = entry.isIntersecting;
                section.classList.toggle("is-in-view", inView);
                syncAutoplay();
            }, { threshold: 0.15 }).observe(element);
        } else {
            section.classList.add("is-in-view");
        }

        dialog?.addEventListener("close", syncAutoplay);
        dialog?.addEventListener("toggle", syncAutoplay);
        document.addEventListener("visibilitychange", syncAutoplay);
        motionPreference.addEventListener("change", () => {
            swiper.params.speed = motionPreference.matches ? 0 : 600;
            syncAutoplay();
        });
        syncAutoplay();
    }

    function initInstagram() {
        const section = document.querySelector(".insta");
        const element = section?.querySelector(".insta-slider");
        if (!element || typeof window.Swiper !== "function" || element.swiper) {
            return;
        }

        const count = element.querySelectorAll(".swiper-slide").length;
        const counter = section.querySelector(".slider-count");
        // 282px thumbnails + the original 24px gap; repeat only supplied posts.
        repeatSlidesForLoop(element, Math.ceil(window.innerWidth / 306) + 2);

        function updateCounter(swiper) {
            counter.textContent = `${((Number(swiper.realIndex) || 0) % count) + 1} / ${count}`;
        }

        const swiper = new window.Swiper(element, {
            slidesPerView: "auto",
            slidesPerGroup: 1,
            spaceBetween: 24,
            initialSlide: mobilePreference.matches ? 1 : 0,
            breakpoints: {
                0: { slidesPerView: 1, centeredSlides: true, slidesOffsetBefore: 0 },
                769: { slidesPerView: "auto", centeredSlides: false, slidesOffsetBefore: 0 }
            },
            loop: true,
            speed: motionPreference.matches ? 0 : 450,
            navigation: {
                prevEl: section.querySelector(".insta-prev"),
                nextEl: section.querySelector(".insta-next"),
                addIcons: false
            },
            a11y: {
                containerMessage: "뚜레쥬르 인스타그램 게시물",
                prevSlideMessage: "이전 인스타그램 게시물",
                nextSlideMessage: "다음 인스타그램 게시물"
            },
            on: { slideChange: updateCounter }
        });
        updateCounter(swiper);
        section.querySelectorAll(".insta-prev, .insta-next").forEach((button) => {
            button.disabled = false;
        });
        bindSliderKeys(element, swiper);
        motionPreference.addEventListener("change", () => {
            swiper.params.speed = motionPreference.matches ? 0 : 450;
        });
    }

    function initBrandMarquee() {
        const section = document.querySelector(".bulk-order");
        const marquee = section?.querySelector(".bulk-marquee");
        if (!marquee) {
            return;
        }

        const track = marquee.querySelector(".marquee-track");
        const groups = [...track.querySelectorAll(".marquee-group")];
        let tileWidth = 0;
        let copiesPerGroup = 0;
        let resizeFrame = 0;
        let inView = typeof IntersectionObserver !== "function";

        const speed = 40; // Pixels per second at both PC and tablet sizes.
        const maximumCopies = 64; // At most 128 tiles across the two identical groups.

        function buildGroups() {
            resizeFrame = 0;
            const probe = track.querySelector(".marquee-item");
            const measuredWidth = probe?.getBoundingClientRect().width;
            const viewportWidth = marquee.getBoundingClientRect().width;
            // An open modal or unfinished layout can leave the probe without a box.
            // Keep the existing groups until a load/resize/visibility event retries.
            if (!Number.isFinite(measuredWidth) || measuredWidth <= 0
                || !Number.isFinite(viewportWidth) || viewportWidth <= 0) {
                return;
            }
            const copies = Math.ceil(viewportWidth / measuredWidth) + 1;
            if (!Number.isSafeInteger(copies) || copies < 1 || copies > maximumCopies) {
                return;
            }
            if (copies === copiesPerGroup && measuredWidth === tileWidth) {
                return;
            }
            const animation = track.getAnimations?.()[0];
            const time = Number(animation?.currentTime);
            const phase = tileWidth > 0 && Number.isFinite(time)
                ? ((time / 1000 * speed) % tileWidth) / tileWidth
                : 0;
            // Build off-DOM only after all size/count checks have passed.
            const replacements = groups.map(() => {
                const fragment = document.createDocumentFragment();
                for (let index = 0; index < copies; index += 1) {
                    const item = document.createElement("span");
                    item.className = "marquee-item";
                    fragment.append(item);
                }
                return fragment;
            });
            groups.forEach((group, index) => group.replaceChildren(replacements[index]));
            tileWidth = measuredWidth;
            copiesPerGroup = copies;
            // -50% moves exactly one group. Preserve the phase within its repeated tile.
            track.style.setProperty("--marquee-duration", `${copies * tileWidth / speed}s`);
            marquee.classList.add("is-ready");
            const updatedAnimation = track.getAnimations?.()[0];
            if (updatedAnimation) {
                updatedAnimation.currentTime = phase * tileWidth / speed * 1000;
            }
        }

        function scheduleBuild() {
            if (!resizeFrame) {
                resizeFrame = window.requestAnimationFrame(() => {
                    try {
                        buildGroups();
                    } catch (error) {
                        resizeFrame = 0;
                        console.error("Unable to initialize the brand marquee:", error);
                    }
                });
            }
        }

        function syncPause() {
            marquee.classList.toggle("is-paused", !inView || document.hidden || dialog?.open || motionPreference.matches);
            scheduleBuild();
        }

        if (typeof IntersectionObserver === "function") {
            new IntersectionObserver(([entry]) => {
                inView = entry.isIntersecting;
                syncPause();
            }).observe(section);
        }
        window.addEventListener("resize", scheduleBuild);
        window.addEventListener("load", scheduleBuild, { once: true });
        document.fonts?.ready.then(scheduleBuild);
        if (typeof ResizeObserver === "function") {
            const observer = new ResizeObserver(scheduleBuild);
            observer.observe(marquee);
            observer.observe(section);
        }
        document.addEventListener("visibilitychange", syncPause);
        dialog?.addEventListener("close", syncPause);
        dialog?.addEventListener("toggle", syncPause);
        motionPreference.addEventListener("change", syncPause);
        scheduleBuild();
        syncPause();
    }

    function initSectionReveals() {
        const appVisuals = [...document.querySelectorAll(".app-phone-enter, .app-icon-enter")];
        appVisuals.forEach((visual) => {
            visual.addEventListener("animationend", (event) => {
                if (event.animationName === "app-phone-bounce" || event.animationName === "app-icon-bounce") {
                    visual.classList.add("hover-ready");
                }
            });
        });
        if (typeof IntersectionObserver !== "function" || motionPreference.matches) {
            appVisuals.forEach((visual) => visual.classList.add("hover-ready"));
            return;
        }

        // App children and event cards own their choreography; never stack two transforms on them.
        // Hero keeps its existing image/video fade instead of moving under the fixed header.
        const targets = [...document.querySelectorAll(".categories, .best-item, section.event > .title, .app-intro, .delivery, .bulk-order, .insta, .store-franchise, footer")];
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    if (entry.target.classList.contains("app-intro") && !motionPreference.matches) {
                        entry.target.classList.add("app-revealed");
                    }
                    entry.target.classList.remove("reveal-pending", "app-pending");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        targets.forEach((target) => {
            if (target.classList.contains("app-intro")) {
                target.dataset.appReveal = "";
                target.classList.add("app-pending");
            } else {
                target.dataset.reveal = "";
                target.classList.add("reveal-pending");
            }
            observer.observe(target);
        });

        motionPreference.addEventListener("change", () => {
            if (motionPreference.matches) {
                targets.forEach((target) => target.classList.remove("reveal-pending", "app-pending"));
                document.querySelector(".app-intro")?.classList.remove("app-revealed");
                appVisuals.forEach((visual) => visual.classList.add("hover-ready"));
                observer.disconnect();
            }
        });
    }

    // Marked preview links never jump to the page top; replacing href enables the real URL.
    document.addEventListener("click", (event) => {
        if (event.target.closest?.('a[aria-disabled="true"], a[data-placeholder-link][href="#"]')) {
            event.preventDefault();
        }
    });
    document.addEventListener("keydown", (event) => {
        if ((event.key === "Enter" || event.key === " ") && event.target.closest?.('a[aria-disabled="true"]')) {
            event.preventDefault();
        }
    });

    initEventModal();
    initHeader();
    initMobileHeader();
    initHero();
    initBestItems();
    initEventSlider();
    initInstagram();
    try {
        initBrandMarquee();
    } catch (error) {
        console.error("Unable to initialize the brand marquee:", error);
    }
    initSectionReveals();
})();
