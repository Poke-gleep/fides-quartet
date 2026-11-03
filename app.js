'use strict';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const english = {
  openMenu: 'Open menu', closeMenu: 'Close menu', biography: 'Biography',
  openPhoto: 'Open photo', photoOf: 'of', worksShown: 'works shown',
  projectPageAlt: 'Concert dossier, page', pageLabel: 'Page',
  enlargePage: 'Enlarge page', fitPage: 'Fit page', watchVideo: 'Watch video'
};
let language = new URLSearchParams(location.search).get('lang') === 'de' ? 'de' : 'en';
const t = key => (language === 'de' ? window.FIDES_I18N.de[key] : english[key]) || english[key] || key;
const originalText = new Map();
$$('[data-i18n], [data-de]').forEach(element => originalText.set(element, element.textContent));
const originalAttributes = new Map();
for (const attribute of ['aria', 'placeholder']) {
  $$(`[data-i18n-${attribute}]`).forEach(element => {
    const name = attribute === 'aria' ? 'aria-label' : 'placeholder';
    originalAttributes.set(element, {name, value: element.getAttribute(name)});
  });
}
const originalInstruments = $$('.instrument').map(element => element.textContent);
const originalPhotoAlts = $$('.gallery-item img').map(image => image.alt);
const originalDescription = $('meta[name="description"]').content;
const menuButton = $('#menu-toggle');
const mobileNav = $('#mobile-nav');
const bioDialog = $('#bio-dialog');
const galleryDialog = $('#gallery-dialog');
const projectDialog = $('#project-dialog');
const videoDialog = $('#video-dialog');
let memberKey = null;
let galleryIndex = 0;
let projectIndex = 0;
let currentProject = null;
let activeVideo = null;

function closeMenu() {
  mobileNav.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', t('openMenu'));
}
menuButton.addEventListener('click', () => {
  const opening = mobileNav.hidden;
  mobileNav.hidden = !opening;
  menuButton.setAttribute('aria-expanded', String(opening));
  menuButton.setAttribute('aria-label', t(opening ? 'closeMenu' : 'openMenu'));
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
window.matchMedia('(min-width:1101px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

function updateBiography() {
  const bio = language === 'de' ? window.FIDES_I18N.de.bios[memberKey] : bios[memberKey];
  $('#bio-name').textContent = bio.name;
  $('#bio-text').textContent = bio.text;
  $('#bio-image').alt = bio.name;
}
const preloaded = new Set();
function preload(source) {
  if (!source || preloaded.has(source)) return;
  preloaded.add(source);
  const image = new Image();
  image.src = source;
}
$$('[data-member]').forEach(button => {
  const prepare = () => preload(button.dataset.bio);
  button.addEventListener('pointerenter', prepare, {once: true});
  button.addEventListener('focus', prepare, {once: true});
  button.addEventListener('click', () => {
    memberKey = button.dataset.member;
    updateBiography();
    $('#bio-image').src = button.dataset.bio;
    bioDialog.showModal();
  });
});

function updateFilterStatus() {
  const visible = $$('[data-period]:not([hidden]) .works li').length;
  $('#filter-status').textContent = `${visible} ${t('worksShown')}`;
}
$$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  const period = button.dataset.filter;
  $$('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  $$('[data-period]').forEach(group => { group.hidden = period !== 'all' && group.dataset.period !== period; });
  updateFilterStatus();
}));

const galleryImages = $$('.gallery-item img');
function showPhoto(index) {
  galleryIndex = (index + galleryImages.length) % galleryImages.length;
  const source = galleryImages[galleryIndex];
  $('#gallery-image').src = source.dataset.full;
  $('#gallery-image').alt = source.alt;
  $('#gallery-count').textContent = `${galleryIndex + 1} / ${galleryImages.length}`;
  preload(galleryImages[(galleryIndex + 1) % galleryImages.length].dataset.full);
}
$$('.gallery-item').forEach((button, index) => button.addEventListener('click', () => {
  showPhoto(index);
  galleryDialog.showModal();
}));
$('#gallery-prev').addEventListener('click', () => showPhoto(galleryIndex - 1));
$('#gallery-next').addEventListener('click', () => showPhoto(galleryIndex + 1));

function updateZoomLabel() {
  $('#project-zoom').setAttribute('aria-label', t(projectDialog.classList.contains('is-zoomed') ? 'fitPage' : 'enlargePage'));
}
function showProjectPage(index) {
  const pages = currentProject.pages;
  projectIndex = Math.max(0, Math.min(index, pages.length - 1));
  const image = $('#project-image');
  image.hidden = true;
  $('#project-loading').hidden = false;
  image.src = pages[projectIndex];
  image.alt = `${t('projectPageAlt')} ${projectIndex + 1}`;
  if (image.complete && image.naturalWidth > 0) {
    image.hidden = false;
    $('#project-loading').hidden = true;
  }
  $('#project-error').hidden = true;
  $('#project-count').textContent = `${t('pageLabel')} ${projectIndex + 1} / ${pages.length}`;
  $('#project-prev').disabled = projectIndex === 0;
  $('#project-next').disabled = projectIndex === pages.length - 1;
  $('.project-page-area').scrollTop = 0;
  if (projectIndex + 1 < pages.length) preload(pages[projectIndex + 1]);
}
$('#project-image').addEventListener('load', () => {
  $('#project-image').hidden = false;
  $('#project-loading').hidden = true;
});
$('#project-image').addEventListener('error', () => {
  $('#project-image').hidden = true;
  $('#project-loading').hidden = true;
  $('#project-error').hidden = false;
});
$$('[data-project]').forEach(button => button.addEventListener('click', () => {
  currentProject = window.FIDES_PROJECTS[button.dataset.project];
  if (!currentProject) return;
  projectDialog.classList.remove('is-zoomed');
  $('#project-zoom').setAttribute('aria-pressed', 'false');
  updateZoomLabel();
  $('#project-download').href = currentProject.pdf;
  showProjectPage(0);
  projectDialog.showModal();
}));
$('#project-prev').addEventListener('click', () => showProjectPage(projectIndex - 1));
$('#project-next').addEventListener('click', () => showProjectPage(projectIndex + 1));
$('#project-zoom').addEventListener('click', () => {
  const zoomed = projectDialog.classList.toggle('is-zoomed');
  $('#project-zoom').setAttribute('aria-pressed', String(zoomed));
  updateZoomLabel();
});

$$('[data-video]').forEach(card => card.addEventListener('click', event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  activeVideo = card;
  $('#video-title').textContent = card.querySelector('h3').textContent;
  $('#video-fallback').href = card.href;
  const frame = document.createElement('iframe');
  frame.src = `https://www.youtube-nocookie.com/embed/${card.dataset.video}?autoplay=1&rel=0`;
  frame.title = $('#video-title').textContent;
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  $('#video-player').replaceChildren(frame);
  videoDialog.showModal();
}));
videoDialog.addEventListener('close', () => { $('#video-player').replaceChildren(); activeVideo = null; });

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  const delta = event.key === 'ArrowLeft' ? -1 : 1;
  if (galleryDialog.open) { event.preventDefault(); showPhoto(galleryIndex + delta); }
  if (projectDialog.open) { event.preventDefault(); showProjectPage(projectIndex + delta); }
});
// A horizontal swipe also turns photos or dossier pages on touch screens.
for (const [dialog, change] of [[galleryDialog, delta => showPhoto(galleryIndex + delta)], [projectDialog, delta => showProjectPage(projectIndex + delta)]]) {
  let start = null;
  dialog.addEventListener('touchstart', event => {
    start = event.touches.length === 1 ? {x: event.touches[0].clientX, y: event.touches[0].clientY} : null;
  }, {passive: true});
  dialog.addEventListener('touchend', event => {
    if (!start || dialog.classList.contains('is-zoomed')) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5) change(dx < 0 ? 1 : -1);
    start = null;
  }, {passive: true});
}
$$('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$$('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
}));
const modalObserver = new MutationObserver(() => document.body.classList.toggle('modal-open', $$('dialog[open]').length > 0));
$$('dialog').forEach(dialog => modalObserver.observe(dialog, {attributes: true, attributeFilter: ['open']}));

function applyLanguage(next, updateUrl = false) {
  language = next;
  document.documentElement.lang = next;
  const german = window.FIDES_I18N.de;
  for (const [element, value] of originalText) element.textContent = next === 'de' ? (element.dataset.de || german[element.dataset.i18n] || value) : value;
  for (const [element, original] of originalAttributes) element.setAttribute(original.name, next === 'de' ? (german[element.dataset.i18nAria || element.dataset.i18nPlaceholder] || original.value) : original.value);
  $$('.instrument').forEach((element, i) => { element.textContent = next === 'de' ? german.instruments[i] : originalInstruments[i]; });
  galleryImages.forEach((image, i) => { image.alt = next === 'de' ? german.photoAlts[i] : originalPhotoAlts[i]; });
  $$('[data-member]').forEach(button => button.setAttribute('aria-label', `${t('biography')}: ${bios[button.dataset.member].name}`));
  $$('.gallery-item').forEach((button, i) => button.setAttribute('aria-label', `${t('openPhoto')} ${i + 1} ${t('photoOf')} ${galleryImages.length}`));
  $$('[data-project]').forEach(button => button.setAttribute('aria-label', next === 'de' ? 'Konzertdossier öffnen' : 'Open concert dossier'));
  const toggle = $('#language-toggle');
  toggle.textContent = next === 'en' ? 'DE' : 'EN';
  toggle.lang = next === 'en' ? 'de' : 'en';
  toggle.setAttribute('aria-label', next === 'en' ? 'Auf Deutsch wechseln' : 'Switch to English');
  menuButton.setAttribute('aria-label', t(mobileNav.hidden ? 'openMenu' : 'closeMenu'));
  if (memberKey) updateBiography();
  if (galleryDialog.open) $('#gallery-image').alt = galleryImages[galleryIndex].alt;
  if (projectDialog.open) showProjectPage(projectIndex);
  if (activeVideo) {
    $('#video-title').textContent = activeVideo.querySelector('h3').textContent;
    $('#video-player iframe').title = $('#video-title').textContent;
  }
  $('.brand').setAttribute('aria-label', `Fides Quartet — ${next === 'de' ? 'Start' : 'Home'}`);
  $('.project-preview>img').alt = next === 'de' ? 'Konzertdossier — Fides Quartet / Pierluigi Ruggiero' : 'Concert dossier — Fides Quartet / Pierluigi Ruggiero';
  updateZoomLabel();
  const canonical = next === 'de' ? 'https://fides-quartet.com/?lang=de' : 'https://fides-quartet.com/';
  $('link[rel="canonical"]').href = canonical;
  $('meta[property="og:url"]').content = canonical;
  const description = next === 'de' ? 'Fides Quartet — Streichquartett, gegründet 2022. Konzerte, Repertoire, Projekte, Videos, Fotos und Kontakt.' : originalDescription;
  $('meta[name="description"]').content = description;
  $('meta[property="og:description"]').content = description;
  if (updateUrl) {
    const url = new URL(location.href);
    if (next === 'de') url.searchParams.set('lang', 'de'); else url.searchParams.delete('lang');
    history.replaceState(null, '', url);
  }
}
$('#language-toggle').addEventListener('click', () => applyLanguage(language === 'en' ? 'de' : 'en', true));
applyLanguage(language);

$('#contact-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  const name = String(values.get('name')).trim();
  const email = String(values.get('email')).trim();
  const message = String(values.get('message')).trim();
  const subject = encodeURIComponent(`Fides Quartet — ${name}`);
  const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
  window.location.href = `mailto:fidesquart4@gmail.com?subject=${subject}&body=${body}`;
});
const navLinks = $$('.desktop-nav a, #mobile-nav a');
const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => {
      if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  });
}, {rootMargin: '-15% 0px -60% 0px'});
$$('main>section[id]').forEach(section => navObserver.observe(section));
