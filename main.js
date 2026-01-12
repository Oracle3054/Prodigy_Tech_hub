// ===== PRODIGY SITE CORE SCRIPT =====
document.addEventListener("DOMContentLoaded", () => {
  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);

  /* ========== 1. MOBILE MENU ========== */
  const hamburger = $("#hamburger");
  const mobileNav = $("#mobileNav");
  if (hamburger && mobileNav) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("open");
      mobileNav.classList.toggle("active");
      hamburger.setAttribute("aria-expanded", hamburger.classList.contains("open"));
    });

    mobileNav.addEventListener("click", e => {
      if (e.target.tagName === "A") mobileNav.classList.remove("active");
    });
  }

  /* ========== 2. SCROLL REVEAL ANIMATION ========== */
  const revealEls = $$("[data-animate]");
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => revealObs.observe(el));

  /* ========== 3. COUNTERS ========== */
  const counters = $$(".counter");
  const runCounters = () => {
    counters.forEach(counter => {
      const target = +counter.dataset.target;
      const step = target / 80;
      const update = () => {
        const current = +counter.innerText.replace(/\D/g, "");
        if (current < target) {
          counter.innerText = Math.ceil(current + step).toLocaleString();
          requestAnimationFrame(update);
        } else {
          counter.innerText = target.toLocaleString();
        }
      };
      update();
    });
  };
  const counterSection = $(".stat-row");
  if (counterSection) {
    const counterObs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) runCounters();
    }, { threshold: 0.5 });
    counterObs.observe(counterSection);
  }

  /* ========== 4. DROPDOWNS (Mission/Vision) ========== */
  $$(".about-dropdown").forEach(drop => {
    drop.querySelector(".dropdown-toggle").addEventListener("click", () => {
      drop.classList.toggle("active");
    });
  });

  /* ========== 5. TESTIMONIAL SLIDER ========== */
  const slides = $$(".testimonial-slide");
  const dotsContainer = $("#testimonialDots");
  if (slides.length && dotsContainer) {
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.classList.toggle("active", i === 0);
      dotsContainer.appendChild(dot);
      dot.addEventListener("click", () => setSlide(i));
    });

    const dots = dotsContainer.querySelectorAll("button");
    let current = 0;
    const setSlide = i => {
      slides.forEach(s => s.classList.remove("active"));
      dots.forEach(d => d.classList.remove("active"));
      slides[i].classList.add("active");
      dots[i].classList.add("active");
      current = i;
    };
    const next = () => setSlide((current + 1) % slides.length);
    let auto = setInterval(next, 6000);

    const slider = $("#testimonialSlider");
    slider?.addEventListener("mouseenter", () => clearInterval(auto));
    slider?.addEventListener("mouseleave", () => (auto = setInterval(next, 6000)));
  }

  /* ========== 6. BACKGROUND SLIDER ========== */
  const bgSlides = $$(".hero-bg .slide");
  if (bgSlides.length > 1) {
    let i = 0;
    setInterval(() => {
      bgSlides.forEach(s => s.classList.remove("active"));
      i = (i + 1) % bgSlides.length;
      bgSlides[i].classList.add("active");
    }, 7000);
  }

  /* ========== 7. REDUCED MOTION ========== */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll("*").forEach(el => el.style.transition = "none");
  }
});



  // Counter animation
  const counters = document.querySelectorAll('.counter');
  const speed = 200; // lower = faster

  counters.forEach(counter => {
    const updateCount = () => {
      const target = +counter.getAttribute('data-target');
      const count = +counter.innerText;
      const increment = target / speed;

      if (count < target) {
        counter.innerText = Math.ceil(count + increment);
        setTimeout(updateCount, 15);
      } else {
        counter.innerText = target;
      }
    };
    updateCount();
  });



  


