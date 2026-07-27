// page transition
const pageTransition = document.getElementById('pageTransition');

if (pageTransition) {
  requestAnimationFrame(() => {
    setTimeout(() => pageTransition.classList.add('revealed'), 80);
  });

  document.querySelectorAll('a[data-transition]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || link.target === '_blank' || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      pageTransition.classList.remove('revealed');
      setTimeout(() => { window.location.href = href; }, 620);
    });
  });
}

// year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// custom cursor
const cursor = document.getElementById('cursorDot');
if (cursor && matchMedia('(hover: hover)').matches) {
  window.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });
  document.querySelectorAll('a, button, .project-card').forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
  });
}

// showreel player
const showreelFrame = document.getElementById('showreelFrame');
const showreelVideo = document.getElementById('showreelVideo');
const showreelPlay = document.getElementById('showreelPlay');
const showreelDuration = document.getElementById('showreelDuration');

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

showreelVideo.addEventListener('loadedmetadata', () => {
  showreelDuration.textContent = formatTime(showreelVideo.duration);
});

function toggleShowreel() {
  if (showreelVideo.paused) {
    showreelVideo.play();
    showreelFrame.classList.add('playing');
  } else {
    showreelVideo.pause();
    showreelFrame.classList.remove('playing');
  }
}

showreelPlay.addEventListener('click', toggleShowreel);
showreelVideo.addEventListener('click', toggleShowreel);
showreelVideo.addEventListener('ended', () => showreelFrame.classList.remove('playing'));

// showreel scrub bar
const showreelScrub = document.getElementById('showreelScrub');
const showreelScrubFill = document.getElementById('showreelScrubFill');
const showreelScrubHandle = document.getElementById('showreelScrubHandle');
let isScrubbing = false;

function updateScrubUI(ratio) {
  const pct = Math.min(1, Math.max(0, ratio)) * 100;
  showreelScrubFill.style.width = pct + '%';
  showreelScrubHandle.style.left = pct + '%';
}

function ratioFromEvent(e) {
  const rect = showreelScrub.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  return x / rect.width;
}

showreelVideo.addEventListener('timeupdate', () => {
  if (!isScrubbing && showreelVideo.duration) {
    updateScrubUI(showreelVideo.currentTime / showreelVideo.duration);
  }
});

showreelScrub.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!showreelVideo.duration) return;
  const ratio = ratioFromEvent(e);
  showreelVideo.currentTime = ratio * showreelVideo.duration;
  updateScrubUI(ratio);
});

showreelScrub.addEventListener('mousedown', (e) => {
  e.stopPropagation();
  isScrubbing = true;
  showreelScrub.classList.add('scrubbing');
  updateScrubUI(ratioFromEvent(e));
});

window.addEventListener('mousemove', (e) => {
  if (!isScrubbing) return;
  updateScrubUI(ratioFromEvent(e));
});

window.addEventListener('mouseup', (e) => {
  if (!isScrubbing) return;
  isScrubbing = false;
  showreelScrub.classList.remove('scrubbing');
  if (showreelVideo.duration) {
    showreelVideo.currentTime = ratioFromEvent(e) * showreelVideo.duration;
  }
});

// image carousels (multi-visual project cards)
document.querySelectorAll('.project-visual--carousel').forEach((carousel) => {
  const imgs = carousel.querySelectorAll('.carousel-img');
  let i = 0;
  if (imgs.length < 2) return;
  setInterval(() => {
    imgs[i].classList.remove('active');
    i = (i + 1) % imgs.length;
    imgs[i].classList.add('active');
  }, 3200);
});

// mobile nav
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
burger.addEventListener('click', () => {
  nav.classList.toggle('open');
});
nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => nav.classList.remove('open'));
});

// reveal project cards on scroll
const cards = document.querySelectorAll('.project-card');
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
cards.forEach((card) => observer.observe(card));

// quote form -> mailto
const form = document.getElementById('quoteForm');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const type = document.getElementById('type').value;
  const budget = document.getElementById('budget').value;
  const message = document.getElementById('message').value;

  const subject = encodeURIComponent(`Demande de devis — ${name}`);
  const body = encodeURIComponent(
    `Nom: ${name}\nEmail: ${email}\nType de projet: ${type}\nBudget: ${budget}\n\nMessage:\n${message}`
  );

  window.location.href = `mailto:emond.sachapro@gmail.com?subject=${subject}&body=${body}`;
});
