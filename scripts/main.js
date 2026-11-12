"use strict";

(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
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
            item.classList.toggle("open", open);
            item.querySelector(".menu").setAttribute("aria-expanded", String(open));
            item.querySelector(".drop").inert = !open;
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
            const links = [...item.querySelectorAll(".drop a")];

            item.addEventListener("pointerenter", (event) => {
                if (event.pointerType !== "touch") {
                    openMenu(item);
                }
            });
            item.addEventListener("pointerleave", () => {
                if (!item.contains(document.activeElement)) {
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
                    if (!item.contains(document.activeElement)) {
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
            return !failed && !motionPreference.matches && !document.hidden && !dialog?.open && inView;
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

        function failVideo() {
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
            if (loading || player || failed || !/^https?:$/.test(window.location.protocol)) {
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
            repeatSlidesForLoop(element);
            const swiper = new window.Swiper(element, {
                slidesPerView: 4,
                slidesPerGroup: 1,
                spaceBetween: 24,
                loop: true,
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
            element.querySelectorAll(".best-prev, .best-next").forEach((button) => {
                button.disabled = false;
            });
            bindSliderKeys(element, swiper);
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
        const tileWidth = 1267; // Original Figma wordmark crop width, also used by .marquee-item.
        let copiesPerGroup = 0;
        let resizeFrame = 0;
        let inView = typeof IntersectionObserver !== "function";

        function buildGroups() {
            resizeFrame = 0;
            const copies = Math.ceil(window.innerWidth / tileWidth) + 1;
            if (copies === copiesPerGroup) {
                return;
            }
            const animation = track.getAnimations?.()[0];
            const previousOffset = animation && copiesPerGroup
                ? ((Number(animation.currentTime) || 0) / 1000 * 40) % (copiesPerGroup * tileWidth)
                : 0;
            copiesPerGroup = copies;
            groups.forEach((group) => {
                const items = Array.from({ length: copies }, () => {
                    const item = document.createElement("span");
                    item.className = "marquee-item";
                    return item;
                });
                group.replaceChildren(...items);
            });
            // The two groups are identical: -50% lands at exactly the second group's start.
            track.style.setProperty("--marquee-duration", `${(copies * tileWidth) / 40}s`);
            marquee.classList.add("is-ready");
            const updatedAnimation = track.getAnimations?.()[0];
            if (updatedAnimation) {
                updatedAnimation.currentTime = previousOffset / 40 * 1000;
            }
        }

        function syncPause() {
            marquee.classList.toggle("is-paused", !inView || document.hidden || dialog?.open || motionPreference.matches);
        }

        if (typeof IntersectionObserver === "function") {
            new IntersectionObserver(([entry]) => {
                inView = entry.isIntersecting;
                syncPause();
            }).observe(section);
        }
        window.addEventListener("resize", () => {
            if (!resizeFrame) {
                resizeFrame = window.requestAnimationFrame(buildGroups);
            }
        });
        document.addEventListener("visibilitychange", syncPause);
        dialog?.addEventListener("close", syncPause);
        dialog?.addEventListener("toggle", syncPause);
        motionPreference.addEventListener("change", syncPause);
        buildGroups();
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
    initHero();
    initBestItems();
    initEventSlider();
    initInstagram();
    initBrandMarquee();
    initSectionReveals();
})();
