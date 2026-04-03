
// =====================================================================
// Tab Bar Type Selection Logic & Navigation
// =====================================================================
let currentTypeIndex = 0;
let nav = document.querySelector("nav");

// =====================================================================
// Add or remove .compact class on <nav> based on scroll direction
// =====================================================================
let lastScrollY = window.scrollY;
let compactNav = false;
function handleNavCompactOnScroll() {
    const newScrollY = window.scrollY;
    if (!nav) nav = document.querySelector("nav");
    if (!nav) return;
    if (newScrollY > lastScrollY + 2) {
        if (!compactNav) {
            nav.classList.add("compact");
            compactNav = true;
        }
    } else if (newScrollY < lastScrollY - 2) {
        if (compactNav) {
            nav.classList.remove("compact");
            compactNav = false;
        }
    }
    lastScrollY = newScrollY;
}
window.addEventListener("scroll", handleNavCompactOnScroll);

// =====================================================================
// Floating Rectangle Animation Settings & Calculation Helpers
// =====================================================================
const FLOATING_RECT_COLLAPSED_HEIGHT = 56;
const FLOATING_RECT_EXPANDED_HEIGHT = 72;
const FLOATING_RECT_TRANSITION_DURATION = 0.25;
const FLOATING_RECT_TRANSITION_TYPE = "ease-in-out";

function getFloatingRectWidths(tabBar) {
    if (!tabBar) return { expanded: 88, collapsed: 72 };
    const style = window.getComputedStyle(tabBar);
    const padLeft = parseFloat(style.paddingLeft) || 0;
    const padRight = parseFloat(style.paddingRight) || 0;
    if (Math.abs(padLeft - 32) < 2 && Math.abs(padRight - 32) < 2) {
        return { expanded: 104, collapsed: 88 };
    }
    if (Math.abs(padLeft - 24) < 2 && Math.abs(padRight - 24) < 2) {
        return { expanded: 88, collapsed: 72 };
    }
    return { expanded: 88, collapsed: 72 };
}

// =====================================================================
// Touch Interaction - Floating Rect Hover Effect for Tab Bar
// (with interruptible transition support)
// =====================================================================
function attachTabBarTouchListeners() {
    const tabBar = document.querySelector('.tab-bar');
    if (!tabBar) return;
    if (tabBar._touchListenersAttached) return;
    tabBar._touchListenersAttached = true;

    tabBar.addEventListener('touchstart', function (event) {
        if (!nav) nav = document.querySelector("nav");
        if (nav && nav.classList.contains("compact")) {
            nav.classList.remove("compact");
            compactNav = false;
            event.preventDefault();
            return;
        }
    }, { passive: false });

    let isTouchActive = false;
    let floatingRect = null;
    let allowTouchMove = false;
    let floatingRectCenter = { x: null, y: null };
    let touchStartSelectedIdx = -1;
    let lastFloatingRectState = null;
    let lastTransitionEndHandler = null;
    let isFloatingTransitioning = false;
    let floatingRectLastKnown = null;
    let interruptedTransitionData = null;
    let pendingFingerRectTransition = false;
    let caughtUpToFinger = false; // NEW: Are we now tracking the finger directly after a transition interruption?
    let fingerCatchupRAF = null;

    function getWidths() {
        return getFloatingRectWidths(tabBar);
    }

    function getRectCenter(rect) {
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        };
    }

    function shouldEnableFloatingRect() {
        if (!nav) nav = document.querySelector("nav");
        if (!nav) return true;
        return !nav.classList.contains("compact");
    }

    function getCurrentFloatingRectState(forceRead = false) {
        if (!floatingRect) return null;
        let left = parseFloat(floatingRect.style.left) || 0;
        let top = parseFloat(floatingRect.style.top) || 0;
        let width = parseFloat(floatingRect.style.width) || 0;
        let height = parseFloat(floatingRect.style.height) || 0;

        let offsetX = 0, offsetY = 0, scaleX = 1, scaleY = 1;
        let currTransform = floatingRect.style.transform || "";
        let match = currTransform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)\s*scale\(([\d.]+),\s*([\d.]+)\)/);
        if (match) {
            offsetX = parseFloat(match[1]);
            offsetY = parseFloat(match[2]);
            scaleX = parseFloat(match[3]);
            scaleY = parseFloat(match[4]);
        }
        return {
            x: left,
            y: top,
            offsetX,
            offsetY,
            scaleX,
            scaleY,
            width,
            height
        };
    }

    function instantlyTrackFinger(event) {
        // This should be called after catchup animation ends!
        if (!floatingRect || !(event && event.touches && event.touches.length > 0)) return;
        const touch = event.touches[0];
        const tabBarRect = tabBar.getBoundingClientRect();
        const { expanded: expandedWidth } = getWidths();
        let centerX = touch.clientX;
        const minX = tabBarRect.left + expandedWidth / 2 - 4;
        const maxX = tabBarRect.right - expandedWidth / 2 + 4;
        centerX = Math.max(minX, Math.min(centerX, maxX));
        const x = centerX - expandedWidth / 2;
        const y = tabBarRect.top + (tabBarRect.height - FLOATING_RECT_EXPANDED_HEIGHT) / 2;

        let squishX = 0, squishY = 0, offsetX = 0, offsetY = 0;

        if (touch.clientY < tabBarRect.top) {
            const dist = tabBarRect.top - touch.clientY;
            squishY = dist <= 32 ? dist / 32 : 1;
            offsetY = -Math.min(dist / 2, 16);
        } else if (touch.clientY > tabBarRect.bottom) {
            const dist = touch.clientY - tabBarRect.bottom;
            squishY = dist <= 32 ? dist / 32 : 1;
            offsetY = Math.min(dist / 2, 16);
        }

        if (touch.clientX < minX - expandedWidth / 2 + 4) {
            const dist = (minX - expandedWidth / 2 + 4) - touch.clientX;
            squishX = dist <= 32 ? dist / 32 : 1;
            offsetX = -Math.min(dist / 2, 16);
        } else if (touch.clientX > maxX + expandedWidth / 2 - 4) {
            const dist = touch.clientX - (maxX + expandedWidth / 2 - 4);
            squishX = dist <= 32 ? dist / 32 : 1;
            offsetX = Math.min(dist / 2, 16);
        }

        const minSquish = 0.7;
        const scaleX = 1 - (1 - minSquish) * squishX;
        const scaleY = 1 - (1 - minSquish) * squishY;

        floatingRect.style.transition = "none";
        floatingRect.style.left = `${x}px`;
        floatingRect.style.top = `${y}px`;
        floatingRect.style.width = `${expandedWidth}px`;
        floatingRect.style.height = `${FLOATING_RECT_EXPANDED_HEIGHT}px`;
        floatingRect.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scaleX}, ${scaleY})`;
        floatingRect.style.display = "block";

        floatingRectCenter.x = x + expandedWidth / 2 + offsetX;
        floatingRectCenter.y = y + FLOATING_RECT_EXPANDED_HEIGHT / 2 + offsetY;

        lastFloatingRectState = {
            x, y, offsetX, offsetY,
            scaleX, scaleY,
            width: expandedWidth,
            height: FLOATING_RECT_EXPANDED_HEIGHT
        };
    }

    function updateFloatingRect(event) {
        // If we're caught up to the finger (e.g. after catchup transition), always instantly track finger, no transition
        if (caughtUpToFinger && isTouchActive && allowTouchMove) {
            instantlyTrackFinger(event);
            return;
        }
        if (!isTouchActive || !floatingRect) return;
        if (!(event && event.touches && event.touches.length > 0)) return;
        if (!shouldEnableFloatingRect()) {
            floatingRect.style.display = "none";
            return;
        }

        // Always remove #selected from all tab-items before showing the floating rectangle.
        tabBar.querySelectorAll('.tab-item#selected').forEach(el => el.removeAttribute('id'));

        const touch = event.touches[0];
        const tabBarRect = tabBar.getBoundingClientRect();
        const { expanded: expandedWidth } = getWidths();

        let centerX = touch.clientX;
        const minX = tabBarRect.left + expandedWidth / 2 - 4;
        const maxX = tabBarRect.right - expandedWidth / 2 + 4;
        centerX = Math.max(minX, Math.min(centerX, maxX));
        const x = centerX - expandedWidth / 2;
        const y = tabBarRect.top + (tabBarRect.height - FLOATING_RECT_EXPANDED_HEIGHT) / 2;

        let squishX = 0, squishY = 0, offsetX = 0, offsetY = 0;

        if (touch.clientY < tabBarRect.top) {
            const dist = tabBarRect.top - touch.clientY;
            squishY = dist <= 32 ? dist / 32 : 1;
            offsetY = -Math.min(dist / 2, 16);
        } else if (touch.clientY > tabBarRect.bottom) {
            const dist = touch.clientY - tabBarRect.bottom;
            squishY = dist <= 32 ? dist / 32 : 1;
            offsetY = Math.min(dist / 2, 16);
        }

        if (touch.clientX < minX - expandedWidth / 2 + 4) {
            const dist = (minX - expandedWidth / 2 + 4) - touch.clientX;
            squishX = dist <= 32 ? dist / 32 : 1;
            offsetX = -Math.min(dist / 2, 16);
        } else if (touch.clientX > maxX + expandedWidth / 2 - 4) {
            const dist = touch.clientX - (maxX + expandedWidth / 2 - 4);
            squishX = dist <= 32 ? dist / 32 : 1;
            offsetX = Math.min(dist / 2, 16);
        }

        const minSquish = 0.7;
        const scaleX = 1 - (1 - minSquish) * squishX;
        const scaleY = 1 - (1 - minSquish) * squishY;

        floatingRect.style.left = `${x}px`;
        floatingRect.style.top = `${y}px`;
        floatingRect.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scaleX}, ${scaleY})`;
        floatingRect.style.display = "block";

        floatingRectCenter.x = x + expandedWidth / 2 + offsetX;
        floatingRectCenter.y = y + FLOATING_RECT_EXPANDED_HEIGHT / 2 + offsetY;

        lastFloatingRectState = {
            x, y, offsetX, offsetY,
            scaleX, scaleY,
            width: expandedWidth,
            height: FLOATING_RECT_EXPANDED_HEIGHT
        };
    }

    // A transition to the finger, interrupting any transition towards static targets
    function slideFloatingRectToFinger(event) {
        // NOTE: At entry, we're still transitioning. We need to animate the rect to the finger,
        // THEN, as soon as the transition is done, we need to disable transition and track finger directly!
        if (!floatingRect || !(event && event.touches && event.touches.length > 0)) return;
        const touch = event.touches[0];
        const tabBarRect = tabBar.getBoundingClientRect();
        const { expanded: expandedWidth } = getWidths();
        let centerX = touch.clientX;
        const minX = tabBarRect.left + expandedWidth / 2 - 4;
        const maxX = tabBarRect.right - expandedWidth / 2 + 4;
        centerX = Math.max(minX, Math.min(centerX, maxX));
        const x = centerX - expandedWidth / 2;
        const y = tabBarRect.top + (tabBarRect.height - FLOATING_RECT_EXPANDED_HEIGHT) / 2;
        let squishX = 0, squishY = 0, offsetX = 0, offsetY = 0;
        if (touch.clientY < tabBarRect.top) {
            const dist = tabBarRect.top - touch.clientY;
            squishY = dist <= 32 ? dist / 32 : 1;
            offsetY = -Math.min(dist / 2, 16);
        } else if (touch.clientY > tabBarRect.bottom) {
            const dist = touch.clientY - tabBarRect.bottom;
            squishY = dist <= 32 ? dist / 32 : 1;
            offsetY = Math.min(dist / 2, 16);
        }
        if (touch.clientX < minX - expandedWidth / 2 + 4) {
            const dist = (minX - expandedWidth / 2 + 4) - touch.clientX;
            squishX = dist <= 32 ? dist / 32 : 1;
            offsetX = -Math.min(dist / 2, 16);
        } else if (touch.clientX > maxX + expandedWidth / 2 - 4) {
            const dist = touch.clientX - (maxX + expandedWidth / 2 - 4);
            squishX = dist <= 32 ? dist / 32 : 1;
            offsetX = Math.min(dist / 2, 16);
        }
        const minSquish = 0.7;
        const scaleX = 1 - (1 - minSquish) * squishX;
        const scaleY = 1 - (1 - minSquish) * squishY;
        // Save initial state for transition, then assign destination
        if (floatingRect.style.transition === "") floatingRect.style.transition = "none";
        const curr = getCurrentFloatingRectState(true);
        floatingRect.style.transition = "none";
        if (curr) {
            floatingRect.style.left = `${curr.x}px`;
            floatingRect.style.top = `${curr.y}px`;
            floatingRect.style.width = `${curr.width}px`;
            floatingRect.style.height = `${curr.height}px`;
            floatingRect.style.transform = `translate(${curr.offsetX || 0}px, ${curr.offsetY || 0}px) scale(${curr.scaleX || 1}, ${curr.scaleY || 1})`;
        }

        // This flag controls our post-transition "stick to finger" logic
        caughtUpToFinger = false;

        requestAnimationFrame(() => {
            // Animate (transition) to the finger
            floatingRect.style.transition =
                `left ${FLOATING_RECT_TRANSITION_DURATION}s ${FLOATING_RECT_TRANSITION_TYPE},` +
                `top ${FLOATING_RECT_TRANSITION_DURATION}s ${FLOATING_RECT_TRANSITION_TYPE},` +
                `width ${FLOATING_RECT_TRANSITION_DURATION}s ${FLOATING_RECT_TRANSITION_TYPE},` +
                `height ${FLOATING_RECT_TRANSITION_DURATION}s ${FLOATING_RECT_TRANSITION_TYPE},` +
                `transform ${FLOATING_RECT_TRANSITION_DURATION}s ${FLOATING_RECT_TRANSITION_TYPE}`;
            floatingRect.style.left = `${x}px`;
            floatingRect.style.top = `${y}px`;
            floatingRect.style.width = `${expandedWidth}px`;
            floatingRect.style.height = `${FLOATING_RECT_EXPANDED_HEIGHT}px`;
            floatingRect.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scaleX}, ${scaleY})`;

            // Set up a one-time handler to mark "caught up" and start instant finger following
            if (lastTransitionEndHandler && typeof lastTransitionEndHandler === "function") {
                floatingRect.removeEventListener("transitionend", lastTransitionEndHandler);
            }
            lastTransitionEndHandler = null;

            const completeCatchup = (e) => {
                if (
                    !e ||
                    (e.propertyName !== "left" &&
                        e.propertyName !== "top" &&
                        e.propertyName !== "width" &&
                        e.propertyName !== "height" &&
                        e.propertyName !== "transform")
                ) {
                    return;
                }
                // Now switch to instant finger follow
                floatingRect.removeEventListener("transitionend", completeCatchup);
                floatingRect.style.transition = "none";
                caughtUpToFinger = true;
                // Make sure to draw at the exact finger on next frame.
                if (event.touches && event.touches.length > 0) {
                    instantlyTrackFinger(event);
                }
            };
            floatingRect.addEventListener("transitionend", completeCatchup);
        });

        floatingRectCenter.x = x + expandedWidth / 2 + offsetX;
        floatingRectCenter.y = y + FLOATING_RECT_EXPANDED_HEIGHT / 2 + offsetY;
        lastFloatingRectState = {
            x, y, offsetX, offsetY,
            scaleX, scaleY,
            width: expandedWidth,
            height: FLOATING_RECT_EXPANDED_HEIGHT
        };
        isFloatingTransitioning = false;
        pendingFingerRectTransition = true;
    }

    function hideFloatingRectAndSlideToSelected(selectedEl) {
        if (!floatingRect) return;

        const { expanded: expandedWidth, collapsed: collapsedWidth } = getWidths();
        let width = expandedWidth, height = FLOATING_RECT_EXPANDED_HEIGHT;
        let left, top;
        let start = lastFloatingRectState || {};

        if (selectedEl) {
            const rect = selectedEl.getBoundingClientRect();
            width = collapsedWidth;
            height = FLOATING_RECT_COLLAPSED_HEIGHT;
            left = rect.left + (rect.width - width) / 2;
            top = rect.top + (rect.height - height) / 2;
        } else if (floatingRectCenter.x !== null && floatingRectCenter.y !== null) {
            left = floatingRectCenter.x - width / 2;
            top = floatingRectCenter.y - height / 2;
        } else {
            floatingRect.style.display = "none";
            isTouchActive = false;
            isFloatingTransitioning = false;
            lastFloatingRectState = null;
            pendingFingerRectTransition = false;
            caughtUpToFinger = false;
            // --- Patch: always fully reset and hide the rectangle state if coords are invalid ---
            return;
        }

        if (
            start &&
            typeof start === "object" &&
            typeof start.x === "number" &&
            typeof start.scaleX === "number"
        ) {
            floatingRect.style.transition = "none";
            floatingRect.style.left = `${start.x}px`;
            floatingRect.style.top = `${start.y}px`;
            floatingRect.style.width = `${start.width}px`;
            floatingRect.style.height = `${start.height}px`;
            floatingRect.style.transform = `translate(${start.offsetX || 0}px, ${start.offsetY || 0}px) scale(${start.scaleX}, ${start.scaleY})`;
        }

        requestAnimationFrame(() => {
            floatingRect.style.transition =
                `left ${FLOATING_RECT_TRANSITION_DURATION}s ${FLOATING_RECT_TRANSITION_TYPE},` +
                `top ${FLOATING_RECT_TRANSITION_DURATION}s ${FLOATING_RECT_TRANSITION_TYPE},` +
                `width ${FLOATING_RECT_TRANSITION_DURATION}s ${FLOATING_RECT_TRANSITION_TYPE},` +
                `height ${FLOATING_RECT_TRANSITION_DURATION}s ${FLOATING_RECT_TRANSITION_TYPE},` +
                `transform ${FLOATING_RECT_TRANSITION_DURATION}s ${FLOATING_RECT_TRANSITION_TYPE}`;
            floatingRect.style.width = `${width}px`;
            floatingRect.style.height = `${height}px`;
            floatingRect.style.left = `${left}px`;
            floatingRect.style.top = `${top}px`;
            floatingRect.style.transform = "";
        });

        // --- Patch: Always hide floatingRect after transition or timeout fallback ---
        function hideRectCompletely() {
            floatingRect.style.display = "none";
            floatingRect.style.transition = "";
            floatingRect.style.width = `${expandedWidth}px`;
            floatingRect.style.height = `${FLOATING_RECT_EXPANDED_HEIGHT}px`;
            floatingRect.style.transform = "";
            lastFloatingRectState = null;
            isFloatingTransitioning = false;
            pendingFingerRectTransition = false;
            caughtUpToFinger = false;
        }

        if (lastTransitionEndHandler && typeof lastTransitionEndHandler === "function") {
            floatingRect.removeEventListener("transitionend", lastTransitionEndHandler);
        }
        lastTransitionEndHandler = function handleTransitionEnd(e) {
            if (
                e &&
                (e.propertyName === "left" ||
                    e.propertyName === "top" ||
                    e.propertyName === "width" ||
                    e.propertyName === "height" ||
                    e.propertyName === "transform") // also hide for transform
            ) {
                floatingRect.removeEventListener("transitionend", lastTransitionEndHandler);
                hideRectCompletely();
            }
        };
        floatingRect.addEventListener("transitionend", lastTransitionEndHandler);

        // Always hide after the duration, even if the transitionend doesn't fire (e.g. bug)
        setTimeout(() => {
            hideRectCompletely();
        }, (FLOATING_RECT_TRANSITION_DURATION * 1000) + 40);

        isTouchActive = false;
        lastFloatingRectState = null;
        isFloatingTransitioning = true;
        interruptedTransitionData = null;
        pendingFingerRectTransition = false;
        caughtUpToFinger = false;
    }

    // Patch: make floatingRect touchstart interrupt the transition and animate to finger
    tabBar.addEventListener("touchstart", function (event) {
        if (!shouldEnableFloatingRect()) {
            isTouchActive = false;
            allowTouchMove = false;
            floatingRectCenter = { x: null, y: null };
            touchStartSelectedIdx = -1;
            lastFloatingRectState = null;
            const fr = document.querySelector(".floating-rect");
            if (fr) fr.style.display = "none";
            return;
        }

        // Always remove #selected from all tab-items before any floating rectangle is shown.
        tabBar.querySelectorAll(".tab-item#selected").forEach(el => el.removeAttribute("id"));

        // If there's a pending transition to target, and the user starts a touch, immediately animate to finger
        if (isFloatingTransitioning) {
            isFloatingTransitioning = false;
            if (lastTransitionEndHandler && typeof lastTransitionEndHandler === "function") {
                floatingRect.removeEventListener("transitionend", lastTransitionEndHandler);
                lastTransitionEndHandler = null;
            }
            pendingFingerRectTransition = true;
            interruptedTransitionData = {
                event,
                lastFloatingRectState: getCurrentFloatingRectState(true)
            };
            // Slide rectangle to finger, tracking continuously if finger moves, and then seamlessly stick to the finger
            slideFloatingRectToFinger(event);
            isTouchActive = true;
            allowTouchMove = true;
            // See slideFloatingRectToFinger: it will switch to no-transition tracking when the animation ends.
            event.preventDefault();
            return;
        }

        isTouchActive = false;
        allowTouchMove = false;
        floatingRectCenter = { x: null, y: null };
        touchStartSelectedIdx = -1;
        lastFloatingRectState = null;
        caughtUpToFinger = false;

        // Already done above, but harmless if repeated:
        tabBar.querySelectorAll(".tab-item#selected").forEach(el => el.removeAttribute("id"));

        let selectedRect = null,
            selectedEl = null,
            tabItems = [...tabBar.querySelectorAll(".tab-item")];
        tabItems.forEach((el, i) => {
            if (el.id === "selected") {
                selectedRect = el.getBoundingClientRect();
                selectedEl = el;
                touchStartSelectedIdx = i;
            }
        });

        floatingRect = document.querySelector(".floating-rect");
        const { expanded: expandedWidth } = getWidths();

        if (!floatingRect) {
            floatingRect = document.createElement("div");
            floatingRect.className = "floating-rect";
            Object.assign(floatingRect.style, {
                position: "fixed",
                transform: "translateZ(0)",
                willChange: "left, top, width, height",
                left: "0px",
                top: "0px",
                width: `${expandedWidth}px`,
                height: `${FLOATING_RECT_EXPANDED_HEIGHT}px`,
                // background: "rgba(255,255,255,0.25)",
                borderRadius: "36px",
                pointerEvents: "none",
                zIndex: 1000,
                display: "none"
            });
            document.body.appendChild(floatingRect);
        } else {
            if (lastTransitionEndHandler && typeof lastTransitionEndHandler === "function") {
                floatingRect.removeEventListener("transitionend", lastTransitionEndHandler);
                lastTransitionEndHandler = null;
            }
            let computed = getCurrentFloatingRectState();
            floatingRect.style.transition = "none";
            if (computed) {
                floatingRect.style.left = `${computed.x}px`;
                floatingRect.style.top = `${computed.y}px`;
                floatingRect.style.width = `${computed.width}px`;
                floatingRect.style.height = `${computed.height}px`;
                floatingRect.style.transform = `translate(${computed.offsetX || 0}px, ${computed.offsetY || 0}px) scale(${computed.scaleX || 1}, ${computed.scaleY || 1})`;
            }
            isFloatingTransitioning = false;
        }
        floatingRect.style.width = `${expandedWidth}px`;
        floatingRect.style.height = `${FLOATING_RECT_EXPANDED_HEIGHT}px`;

        if (event.target.closest(".tab-bar")) {
            isTouchActive = true;
            event.preventDefault();

            if (selectedRect && !isFloatingTransitioning) {
                const left =
                    selectedRect.left + (selectedRect.width - expandedWidth) / 2;
                const top =
                    selectedRect.top +
                    (selectedRect.height - FLOATING_RECT_EXPANDED_HEIGHT) / 2;
                floatingRect.style.transition = "none";
                floatingRect.style.left = `${left}px`;
                floatingRect.style.top = `${top}px`;
                floatingRect.style.display = "block";
                allowTouchMove = true;
                requestAnimationFrame(() => {
                    floatingRect.style.transition =
                        `left ${FLOATING_RECT_TRANSITION_DURATION}s ${FLOATING_RECT_TRANSITION_TYPE},` +
                        `top ${FLOATING_RECT_TRANSITION_DURATION}s ${FLOATING_RECT_TRANSITION_TYPE},` +
                        `width ${FLOATING_RECT_TRANSITION_DURATION}s ${FLOATING_RECT_TRANSITION_TYPE},` +
                        `height ${FLOATING_RECT_TRANSITION_DURATION}s ${FLOATING_RECT_TRANSITION_TYPE},` +
                        `transform ${FLOATING_RECT_TRANSITION_DURATION}s ${FLOATING_RECT_TRANSITION_TYPE}`;
                });
            } else {
                floatingRect.style.display = "block";
                allowTouchMove = true;
            }
            updateFloatingRect(event);
        }
    }, { passive: false });

    tabBar.addEventListener("touchmove", function (event) {
        if ((!isTouchActive && !pendingFingerRectTransition) || !allowTouchMove) return;
        if (!shouldEnableFloatingRect()) {
            if (floatingRect) floatingRect.style.display = "none";
            return;
        }
        event.preventDefault();

        // Always remove #selected from all tab-items before showing the floating rectangle.
        tabBar.querySelectorAll(".tab-item#selected").forEach(el => el.removeAttribute('id'));

        // If we're in "caught up" state (i.e. after catchup), instantly track finger (no transition)
        if (caughtUpToFinger && floatingRect) {
            instantlyTrackFinger(event);
            return;
        }
        // If interrupt caused slide to finger, keep following finger until next phase
        if (pendingFingerRectTransition) {
            slideFloatingRectToFinger(event);
            return;
        }
        if (floatingRect && floatingRect.style.transition !== "") {
            floatingRect.style.transition = "";
        }
        updateFloatingRect(event);
    }, { passive: false });

    tabBar.addEventListener("touchend", function (event) {
        if ((!isTouchActive && !pendingFingerRectTransition)) return;
        if (!shouldEnableFloatingRect()) {
            if (floatingRect) floatingRect.style.display = "none";
            isTouchActive = false;
            allowTouchMove = false;
            pendingFingerRectTransition = false;
            caughtUpToFinger = false;
            return;
        }
        event.preventDefault();
        if (
            floatingRect &&
            floatingRect.style.transform &&
            !/^ *$/.test(floatingRect.style.transform)
        ) {
            const currTransform = floatingRect.style.transform;
            const match = currTransform.match(
                /translate\(([-\d.]+)px,\s*([-\d.]+)px\)\s*scale\(([\d.]+),\s*([\d.]+)\)/
            );
            if (match) {
                const dx = parseFloat(match[1]);
                const dy = parseFloat(match[2]);
                const scaleX = parseFloat(match[3]);
                const scaleY = parseFloat(match[4]);
                const currentLeft = parseFloat(floatingRect.style.left) || 0;
                const currentTop = parseFloat(floatingRect.style.top) || 0;
                const currentWidth = parseFloat(floatingRect.style.width) || 0;
                const currentHeight = parseFloat(floatingRect.style.height) || 0;
                lastFloatingRectState = {
                    x: currentLeft,
                    y: currentTop,
                    offsetX: dx,
                    offsetY: dy,
                    scaleX,
                    scaleY,
                    width: currentWidth,
                    height: currentHeight
                };
            }
        }

        let selectedOrNearestEl = null;
        const tabItems = [...tabBar.querySelectorAll(".tab-item")];
        if (event?.changedTouches?.length > 0) {
            const touch = event.changedTouches[0];
            const x = touch.clientX;
            const y = touch.clientY;

            for (let el of tabItems) {
                const rect = el.getBoundingClientRect();
                if (
                    x >= rect.left &&
                    x <= rect.right &&
                    y >= rect.top &&
                    y <= rect.bottom
                ) {
                    setTimeout(() => {
                        tabItems.forEach(tab => tab.id === "selected" && tab.removeAttribute("id"));
                        el.setAttribute("id", "selected");
                    }, FLOATING_RECT_TRANSITION_DURATION * 1000);
                    selectedOrNearestEl = el;
                    break;
                }
            }
            if (!selectedOrNearestEl && tabItems.length > 0) {
                let minDistance = Infinity,
                    nearestEl = null;
                for (let el of tabItems) {
                    const rect = el.getBoundingClientRect();
                    const dx =
                        x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
                    const dy =
                        y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
                    const dist = Math.hypot(dx, dy);
                    if (dist < minDistance) {
                        minDistance = dist;
                        nearestEl = el;
                    }
                }
                if (nearestEl) {
                    setTimeout(() => {
                        tabItems.forEach(tab => tab.id === "selected" && tab.removeAttribute("id"));
                        nearestEl.setAttribute("id", "selected");
                    }, FLOATING_RECT_TRANSITION_DURATION * 1000);
                    selectedOrNearestEl = nearestEl;
                }
            }
        }

        // ALWAYS remove #selected from all tab-items before assigning new "selected"
        tabBar.querySelectorAll(".tab-item#selected").forEach(el => el.removeAttribute('id'));

        hideFloatingRectAndSlideToSelected(selectedOrNearestEl);
        pendingFingerRectTransition = false;
        isTouchActive = false;
        allowTouchMove = false;
        caughtUpToFinger = false;
    }, { passive: false });

    tabBar.addEventListener("touchcancel", function (event) {
        if ((!isTouchActive && !pendingFingerRectTransition)) return;
        if (!shouldEnableFloatingRect()) {
            if (floatingRect) floatingRect.style.display = "none";
            isTouchActive = false;
            allowTouchMove = false;
            pendingFingerRectTransition = false;
            caughtUpToFinger = false;
            return;
        }
        event.preventDefault();
        // Always remove #selected from all tab-items on cancel as well.
        tabBar.querySelectorAll('.tab-item#selected').forEach(el => el.removeAttribute('id'));
        hideFloatingRectAndSlideToSelected(null);
        pendingFingerRectTransition = false;
        isTouchActive = false;
        allowTouchMove = false;
        caughtUpToFinger = false;
    }, { passive: false });
}

// =====================================================================
// On DOM load, setup touch listeners & MutationObserver for tab bar UI
// =====================================================================
document.addEventListener("DOMContentLoaded", () => {
    attachTabBarTouchListeners();
    nav = document.querySelector("nav");
    if (nav) {
        new MutationObserver(attachTabBarTouchListeners).observe(nav, {
            childList: true,
            subtree: true,
        });
    }
});

let lastShownSection = 0; // 0 = t1, 1 = t2

// Show/hide relevant section based on #selected tab
function updateSectionVisibility() {
    const section1 = document.getElementById("t1");
    const section2 = document.getElementById("t2");
    const allTabs = Array.from(document.querySelectorAll(".tab-bar .tab-item"));
    const selectedTab = document.querySelector(".tab-bar .tab-item#selected");
    let selectedIdx = -1;

    if (selectedTab) {
        selectedIdx = allTabs.indexOf(selectedTab);
        // valid only if in tab-bar
        if (selectedIdx === 0 || selectedIdx === 1) {
            lastShownSection = selectedIdx;
        }
    }

    // Show/hide according to last shown section ("sticky" rule)
    if (lastShownSection === 0) {
        if (section1) section1.style.display = "";
        if (section2) section2.style.display = "none";
    } else if (lastShownSection === 1) {
        if (section1) section1.style.display = "none";
        if (section2) section2.style.display = "";
    }
}

// Listen for clicks on tab items to update sections
document.addEventListener("DOMContentLoaded", () => {
    // Set initial section visibility
    updateSectionVisibility();
    // Listen to all tab-bar tab-item clicks
    document.querySelectorAll(".tab-bar .tab-item").forEach((tab, idx) => {
        tab.addEventListener("click", () => {
            // Remove #selected from all, add to clicked
            document.querySelectorAll(".tab-bar .tab-item#selected").forEach(el => el.removeAttribute("id"));
            tab.id = "selected";
            lastShownSection = idx;
            updateSectionVisibility();
        });
    });
});

// Also update section visibility on MutationObserver (tab switch by script, touch, etc)
const navEl = document.querySelector("nav");
if (navEl) {
    new MutationObserver(updateSectionVisibility).observe(navEl, {
        subtree: true,
        attributes: true,
        attributeFilter: ["id"]
    });
}
