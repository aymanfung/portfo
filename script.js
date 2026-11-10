/* ============================================================
   Micro-interactions: cursor, magnetic, parallax, scroll reveal
   ============================================================ */
(function () {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* Year */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* Header scroll state */
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Reveal on scroll */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  if (reduceMotion || !finePointer) return;

  /* Cursor dot with lerp follow */
  const cursor = document.querySelector(".cursor");
  if (cursor) {
    let cx = -100, cy = -100, tx = -100, ty = -100, shown = false;
    window.addEventListener("mousemove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) { shown = true; cursor.style.opacity = "1"; }
    });
    window.addEventListener("mouseleave", () => { cursor.style.opacity = "0"; shown = false; });

    const magnetics = document.querySelectorAll("[data-magnetic]");
    magnetics.forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-active"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
    });

    (function loop() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    })();

    /* Magnetic elements */
    magnetics.forEach((el) => {
      const strength = 0.35;
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - (rect.left + rect.width / 2);
        const my = e.clientY - (rect.top + rect.height / 2);
        el.style.transform = `translate(${mx * strength}px, ${my * strength}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });

    /* Subtle parallax on project media */
    const parallaxEls = document.querySelectorAll("[data-parallax]");
    if (parallaxEls.length && "IntersectionObserver" in window) {
      let ticking = false;
      const update = () => {
        parallaxEls.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const center = rect.top + rect.height / 2 - window.innerHeight / 2;
          const offset = (center / window.innerHeight) * -24; // px of movement
          el.style.transform = `translate3d(0, ${offset}px, 0)`;
        });
        ticking = false;
      };
      window.addEventListener("scroll", () => {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
      }, { passive: true });
      update();
    }
  }
})();
