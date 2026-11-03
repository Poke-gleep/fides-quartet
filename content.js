'use strict';

// Add future project files and their page previews here, then add a matching project card.
window.FIDES_PROJECTS = {
  'concert-dossier': {
    pdf: 'projects/konzertdossier.pdf',
    pages: Array.from({length: 6}, (_, i) => `projects/page-${String(i + 1).padStart(2, '0')}.webp`)
  }
};
