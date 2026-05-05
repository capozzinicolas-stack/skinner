/**
 * Skinner Embed Helper — optional sidecar script for the /embed/{slug} iframe.
 *
 * Add to ANY host page after the iframe markup:
 *   <script src="https://app.skinner.lat/embed-helper.js" async></script>
 *
 * What it does:
 *   1. Auto-resize: listens for skinner:height_changed messages and adjusts
 *      every Skinner iframe's height so the analise content never gets
 *      double-scrollbars on the host page.
 *   2. Public API window.SkinnerWidget for advanced flows:
 *        - SkinnerWidget.on(eventType, callback)   → subscribe
 *        - SkinnerWidget.off(eventType, callback)  → unsubscribe
 *        - SkinnerWidget.open(slug, options?)      → open as floating modal
 *        - SkinnerWidget.close()                   → dismiss the modal
 *
 * Self-contained vanilla JS — no dependencies, no bundler. ~3KB unminified.
 * Designed to run in any page including those with strict Content-Security
 * Policies (no eval, no new Function).
 */
(function () {
  "use strict";

  if (typeof window === "undefined") return;
  if (window.__SkinnerWidgetLoaded__) return;
  window.__SkinnerWidgetLoaded__ = true;

  var ORIGIN = "https://app.skinner.lat";
  var listeners = Object.create(null);
  var modalNode = null;
  var modalIframe = null;

  function isSkinnerMessage(event) {
    return (
      event &&
      event.data &&
      typeof event.data === "object" &&
      event.data.source === "skinner" &&
      typeof event.data.type === "string"
    );
  }

  function emit(type, data) {
    var fns = listeners[type];
    if (!fns) return;
    for (var i = 0; i < fns.length; i++) {
      try {
        fns[i](data);
      } catch (err) {
        // Don't let host-side handler errors break the widget lifecycle.
        console.error("[SkinnerWidget] handler threw:", err);
      }
    }
  }

  function applyHeight(iframe, height) {
    if (!iframe || typeof height !== "number" || height <= 0) return;
    // Add a small buffer so the inner content never clips against rounded
    // edges of the iframe rendering box.
    iframe.style.height = height + 12 + "px";
  }

  function findSkinnerIframes() {
    var nodes = document.querySelectorAll("iframe");
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var src = nodes[i].getAttribute("src") || "";
      if (src.indexOf(ORIGIN + "/embed/") === 0 || src.indexOf("/embed/") === 0) {
        out.push(nodes[i]);
      }
    }
    return out;
  }

  // Global message listener: applies auto-resize to all matching iframes
  // AND fans out to subscribed handlers for analytics integrations.
  window.addEventListener("message", function (event) {
    if (!isSkinnerMessage(event)) return;
    var msg = event.data;

    if (msg.type === "skinner:height_changed") {
      var height = msg.data && msg.data.height;
      // Resize every Skinner iframe — ResizeObserver only emits one event
      // per page so we apply it broadly.
      var frames = findSkinnerIframes();
      for (var i = 0; i < frames.length; i++) {
        applyHeight(frames[i], height);
      }
    }

    emit(msg.type, msg.data);
  });

  function on(type, fn) {
    if (typeof fn !== "function") return;
    if (!listeners[type]) listeners[type] = [];
    listeners[type].push(fn);
  }

  function off(type, fn) {
    var fns = listeners[type];
    if (!fns) return;
    var idx = fns.indexOf(fn);
    if (idx >= 0) fns.splice(idx, 1);
  }

  function open(slug, options) {
    options = options || {};
    if (!slug) throw new Error("SkinnerWidget.open: slug is required");
    close();

    var qs = [];
    if (options.contact === "off") qs.push("contact=off");
    if (options.compact === true) qs.push("compact=true");
    var queryString = qs.length ? "?" + qs.join("&") : "";

    modalNode = document.createElement("div");
    modalNode.setAttribute(
      "style",
      "position:fixed;inset:0;z-index:99999;background:rgba(28,25,23,0.6);" +
        "display:flex;align-items:center;justify-content:center;padding:16px;"
    );
    modalNode.addEventListener("click", function (e) {
      if (e.target === modalNode) close();
    });

    var inner = document.createElement("div");
    inner.setAttribute(
      "style",
      "position:relative;background:#F7F3EE;width:100%;max-width:560px;" +
        "max-height:90vh;overflow:hidden;border:1px solid #C8BAA9;"
    );

    var closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.setAttribute(
      "style",
      "position:absolute;top:8px;right:12px;z-index:2;background:transparent;" +
        "border:0;font-size:24px;color:#7C7269;cursor:pointer;line-height:1;"
    );
    closeBtn.addEventListener("click", close);

    modalIframe = document.createElement("iframe");
    modalIframe.setAttribute("src", ORIGIN + "/embed/" + encodeURIComponent(slug) + queryString);
    modalIframe.setAttribute("allow", "camera; microphone");
    modalIframe.setAttribute(
      "style",
      "width:100%;height:80vh;border:0;display:block;background:#F7F3EE;"
    );
    modalIframe.setAttribute("data-skinner-iframe", "modal");

    inner.appendChild(closeBtn);
    inner.appendChild(modalIframe);
    modalNode.appendChild(inner);
    document.body.appendChild(modalNode);
    document.body.style.overflow = "hidden";
  }

  function close() {
    if (modalNode && modalNode.parentNode) {
      modalNode.parentNode.removeChild(modalNode);
    }
    modalNode = null;
    modalIframe = null;
    document.body.style.overflow = "";
  }

  window.SkinnerWidget = {
    on: on,
    off: off,
    open: open,
    close: close,
  };
})();
