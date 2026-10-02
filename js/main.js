document.documentElement.classList.add('js');

const header = document.querySelector('.header');
const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav');
const navLinks = nav.querySelectorAll('a');

// Menu mobile
const setMenu = (open) => {
  nav.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
};

burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
navLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

// Bordure de l'en-tête au défilement
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Lien actif selon la section visible (ancres de la page courante uniquement)
const anchorLinks = [...navLinks].filter((link) => link.getAttribute('href').startsWith('#'));
const sections = anchorLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    anchorLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
    });
  });
}, { rootMargin: '-45% 0px -50% 0px' });

sections.forEach((section) => spy.observe(section));

// Apparition des blocs
const revealer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    revealer.unobserve(entry.target);
  });
}, { threshold: 0.15 });

// Seuls les blocs sous la ligne de flottaison démarrent masqués
document.querySelectorAll('.reveal').forEach((el) => {
  if (el.getBoundingClientRect().top < window.innerHeight) return;
  el.classList.add('is-pending');
  revealer.observe(el);
});

document.getElementById('year').textContent = new Date().getFullYear();
