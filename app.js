'use strict';
const menuButton=document.getElementById('menu-toggle');
const mobileNav=document.getElementById('mobile-nav');
function closeMenu(){mobileNav.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu');}
menuButton.addEventListener('click',()=>{const opening=mobileNav.hidden;mobileNav.hidden=!opening;menuButton.setAttribute('aria-expanded',String(opening));menuButton.setAttribute('aria-label',opening?'Close menu':'Open menu');});
mobileNav.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
const bioDialog=document.getElementById('bio-dialog');
document.querySelectorAll('[data-member]').forEach(button=>button.addEventListener('click',()=>{const bio=bios[button.dataset.member];document.getElementById('bio-name').textContent=bio.name;document.getElementById('bio-text').textContent=bio.text;document.getElementById('bio-image').src=button.dataset.bio;document.getElementById('bio-image').alt=bio.name;bioDialog.showModal();}));
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{const period=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));let visible=0;document.querySelectorAll('[data-period]').forEach(group=>{group.hidden=period!=='all'&&group.dataset.period!==period;if(!group.hidden)visible+=group.querySelectorAll('.works li').length;});document.getElementById('filter-status').textContent=`${visible} works shown`;}));
const galleryDialog=document.getElementById('gallery-dialog');
const galleryImages=[...document.querySelectorAll('.gallery-item img')];
let galleryIndex=0;
function showPhoto(index){galleryIndex=(index+galleryImages.length)%galleryImages.length;const source=galleryImages[galleryIndex];document.getElementById('gallery-image').src=source.src;document.getElementById('gallery-image').alt=source.alt;document.getElementById('gallery-count').textContent=`${galleryIndex+1} / ${galleryImages.length}`;}
document.querySelectorAll('.gallery-item').forEach((button,index)=>button.addEventListener('click',()=>{showPhoto(index);galleryDialog.showModal();}));
document.getElementById('gallery-prev').addEventListener('click',()=>showPhoto(galleryIndex-1));
document.getElementById('gallery-next').addEventListener('click',()=>showPhoto(galleryIndex+1));
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();if(!galleryDialog.open)return;if(event.key==='ArrowLeft'){event.preventDefault();showPhoto(galleryIndex-1);}if(event.key==='ArrowRight'){event.preventDefault();showPhoto(galleryIndex+1);}});
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}));
document.getElementById('contact-form').addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;const values=new FormData(form);const name=String(values.get('name')).trim();const email=String(values.get('email')).trim();const message=String(values.get('message')).trim();const subject=encodeURIComponent(`Fides Quartet — ${name}`);const body=encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);window.location.href=`mailto:fidesquart4@gmail.com?subject=${subject}&body=${body}`;});
const observedSections=[...document.querySelectorAll('main>section[id]')];
const navLinks=[...document.querySelectorAll('.desktop-nav a')];
const navObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;navLinks.forEach(link=>{if(link.hash===`#${entry.target.id}`)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});});},{rootMargin:'-15% 0px -60% 0px'});
observedSections.forEach(section=>navObserver.observe(section));

