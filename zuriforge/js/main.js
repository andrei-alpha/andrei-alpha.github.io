/**
 * ZuriForge - Fine Woodworking & Maker Journal
 * Interactive functionality: Lightbox, Before/After Slider, Mobile Nav
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initComparisonSlider();
  initLightbox();
});

/* Mobile Navigation */
function initMobileNav() {
  const toggleBtn = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (!toggleBtn || !navLinks) return;

  toggleBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const isExpanded = navLinks.classList.contains('active');
    toggleBtn.setAttribute('aria-expanded', isExpanded);
  });

  // Close nav on click outside
  document.addEventListener('click', (e) => {
    if (!toggleBtn.contains(e.target) && !navLinks.contains(e.target) && navLinks.classList.contains('active')) {
      navLinks.classList.remove('active');
      toggleBtn.setAttribute('aria-expanded', false);
    }
  });
}

/* Before / After Finish Slider */
function initComparisonSlider() {
  const container = document.querySelector('.comparison-container');
  const sliderInput = document.querySelector('.comparison-slider-input');
  const beforeDiv = document.querySelector('.comparison-before');
  const handle = document.querySelector('.comparison-handle');

  if (!container || !sliderInput || !beforeDiv || !handle) return;

  function updateSlider(val) {
    beforeDiv.style.width = `${val}%`;
    handle.style.left = `${val}%`;
  }

  sliderInput.addEventListener('input', (e) => {
    updateSlider(e.target.value);
  });

  // Mouse move / touch move fallback
  let isDragging = false;

  function handleMove(e) {
    if (!isDragging) return;
    const rect = container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let offset = ((clientX - rect.left) / rect.width) * 100;
    offset = Math.max(0, Math.min(100, offset));
    sliderInput.value = offset;
    updateSlider(offset);
  }

  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    handleMove(e);
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  window.addEventListener('mousemove', handleMove);

  container.addEventListener('touchstart', (e) => {
    isDragging = true;
    handleMove(e);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  window.addEventListener('touchmove', handleMove, { passive: true });
}

/* Lightbox Modal */
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const closeBtn = document.querySelector('.lightbox-close');
  const prevBtn = document.querySelector('.lightbox-prev');
  const nextBtn = document.querySelector('.lightbox-next');

  if (!lightbox || !lightboxImg) return;

  // Gather all lightbox trigger elements
  const triggers = Array.from(document.querySelectorAll('[data-lightbox]'));
  let currentIndex = -1;

  function openLightbox(index) {
    if (index < 0 || index >= triggers.length) return;
    currentIndex = index;
    const trigger = triggers[currentIndex];
    const src = trigger.getAttribute('data-full') || trigger.getAttribute('src');
    const caption = trigger.getAttribute('data-caption') || trigger.getAttribute('alt') || '';

    lightboxImg.src = src;
    lightboxImg.alt = caption;
    if (lightboxCaption) {
      lightboxCaption.textContent = caption;
    }

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function showNext() {
    if (triggers.length === 0) return;
    const nextIdx = (currentIndex + 1) % triggers.length;
    openLightbox(nextIdx);
  }

  function showPrev() {
    if (triggers.length === 0) return;
    const prevIdx = (currentIndex - 1 + triggers.length) % triggers.length;
    openLightbox(prevIdx);
  }

  triggers.forEach((trigger, idx) => {
    trigger.addEventListener('click', () => {
      openLightbox(idx);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });
  if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft') showPrev();
  });
}
