"use strict";

// Start appen når hele HTML siden er indlæst
document.addEventListener("DOMContentLoaded", initApp);

// Global variabel til at gemme alle spil data
let allGames = [];

// Konstanter til "Ugens Spil" sektion
const INTRO_GAME_ID = 17; // ID på det spil der skal vises som featured
const INTRO_BADGE_TEXT = "Ugens<br>Spil!"; // Tekst på badge

// Hovedfunktion der starter hele appen
function initApp() {
  // Hent spil data fra serveren
  getGames();

  // Setup alle filter funktioner
  const filterElements = [
    '#search-input',    // Søge felt
    '#genre-select',    // Genre dropdown
    '#sort-select',     // Sortering dropdown
    '#year-from',       // Minimum antal spillere
    '#year-to',         // Maximum antal spillere  
    '#rating-from',     // Minimum spilletid
    '#rating-to'        // Maximum spilletid
  ];
  
  // Tilføj event listeners til alle filter elementer
  filterElements.forEach(selector => {
    const el = document.querySelector(selector);
    if (el) {
      // Brug 'change' event for dropdowns, 'input' for tekstfelter
      const event = selector.includes('select') ? 'change' : 'input';
      el.addEventListener(event, filterGames);
    }
  });

  // "Ryd alle filtre" knap funktionalitet
  const clearBtn = document.querySelector("#clear-filters");
  if (clearBtn) clearBtn.addEventListener("click", clearAllFilters);

  // Toggle knap til at åbne/lukke filter panel
  const filterToggle = document.querySelector(".filterbarbot-toggle");
  const filterContent = document.querySelector(".filterbarbot-content");
  if (filterToggle && filterContent) {
    filterToggle.addEventListener("click", () => {
      filterToggle.classList.toggle("active");
      filterContent.classList.toggle("active");
    });
  }
}

// Henter spil data fra JSON fil på internettet
async function getGames() {
  const url = "https://raw.githubusercontent.com/cederdorff/race/refs/heads/master/data/games.json";
  try {
    // Forsøg at hente data
    const res = await fetch(url);
    allGames = await res.json(); // Konverter til JavaScript objekt
  } catch (err) {
    // Hvis det fejler, log fejlen og sæt tom liste
    console.error("Could not load games:", err);
    allGames = [];
  }

  // Fyld genre dropdown med alle tilgængelige genrer
  populateGenreDropdown();
  // Vis alle spil på siden
  displayGames(allGames);

  // Find det spil der skal vises som "Ugens Spil" (eller brug det første)
  const introGame = allGames.find(g => g.id === INTRO_GAME_ID) || allGames[0];
  if (introGame) renderIntroCard(introGame);
}

// Laver "Ugens Spil" kort i toppen af siden
function renderIntroCard(game) {
  const intro = document.querySelector("#intro");
  if (!intro) return; // Stop hvis elementet ikke findes
  
  // Fjern gammelt indhold
  intro.innerHTML = '';
  
  // Lav HTML for det featured spil kort
  const html = `
    <article class="ugens-spil" tabindex="0">
      ${INTRO_BADGE_TEXT ? `<span class="corner-badge">${INTRO_BADGE_TEXT}</span>` : ''}
      <img src="${game.image}" alt="Poster of ${game.title}" class="movie-poster" />
      <div class="movie-info">
        <h3>${game.title}  <p class="movie-rating">${game.rating}</p> <span class="movie-year">${game.shelf ? '('+game.shelf+')' : ''}</span></h3>
      </div>
    </article>
  `;
  // Indsæt HTML i siden
  intro.insertAdjacentHTML('beforeend', html);
}

// Hjælpe funktion til at forkorte lange tekster
function truncate(str, n) {
  return str && str.length > n ? str.slice(0, n-1) + '…' : str;
}

// Viser alle spil på siden (eller "ingen spil" besked)
function displayGames(games) {
  const list = document.querySelector("#movie-list");
  if (!list) return; // Stop hvis listen ikke findes
  
  // Hvis der ingen spil er, vis en besked. Ellers fjern alt indhold
  list.innerHTML = games.length === 0 
    ? '<p class="no-results">Ingen spil😢</p>' 
    : '';

  // Vis hvert enkelt spil
  games.forEach(game => displayGame(game));
}

// Laver et enkelt spil kort og tilføjer det til listen
function displayGame(game) {
  const list = document.querySelector("#movie-list");
  if (!list) return; // Stop hvis listen ikke findes

  // Lav HTML for spil kortet med alle detaljer
  const html = `
    <article class="movie-card" tabindex="0">
      <img src="${game.image}" alt="Poster of ${escapeHtml(game.title)}" class="movie-poster" />
      <div class="movie-info">
        <h3>${escapeHtml(game.title)} <span class="movie-year">${game.shelf ? ''+escapeHtml(game.shelf)+'' : ''}</span></h3>
        <p class="movie-genre">${escapeHtml(game.genre)}</p>
        <p class="movie-rating"> ${game.rating}</p>
        <p class="movie-director"><strong>Players:</strong> ${game.players.min}-${game.players.max} • <strong>Playtime:</strong> ${game.playtime}m</p>
        <p class="movie-description">${truncate(escapeHtml(game.description), 140)}</p>
      </div>
    </article>
  `;

  // Tilføj kortet til listen
  list.insertAdjacentHTML('beforeend', html);
  
  // Gør det sidste kort klikbart (åbner popup med detaljer)
  const newCard = list.lastElementChild;
  newCard.addEventListener('click', () => showGameModal(game));
  
  // Gør kortet tilgængeligt med tastatur (Enter eller Space)
  newCard.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showGameModal(game);
    }
  });
}

// Sikkerhedsfunktion: Gør tekst sikker for HTML (undgår hack angreb)
function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
}

// Fylder genre dropdown med alle tilgængelige spil genrer
function populateGenreDropdown() {
  const genreSelect = document.querySelector('#genre-select');
  if (!genreSelect) return; // Stop hvis dropdown ikke findes
  
  // Samle alle unikke genrer fra spillene
  const genres = new Set(); // Set fjerner automatisk dubletter
  for (const g of allGames) {
    if (g.genre) genres.add(g.genre);
  }
  
  // Start med "Alle genrer" option, tilføj derefter resten alfabetisk
  genreSelect.innerHTML = `<option value="all">Alle genrer</option>`;
  [...genres].sort().forEach(g => 
    genreSelect.insertAdjacentHTML('beforeend', `<option value="${g}">${g}</option>`)
  );
}

// Åbner popup vindue med alle detaljer om et spil
function showGameModal(game) {
  const dialogContent = document.querySelector('#dialog-content');
  if (!dialogContent) return; // Stop hvis popup ikke findes
  
  // Fyld popup med spil detaljer
  dialogContent.innerHTML = `
    <img src="${game.image}" alt="Poster af ${escapeHtml(game.title)}" class="movie-poster">
    <div class="dialog-details">
      <h2>${escapeHtml(game.title)}</h2>
      <p><strong>Players:</strong> ${game.players.min} - ${game.players.max}</p>
      <p><strong>Playtime:</strong> ${game.playtime} minutes</p>
      <p class="movie-rating">⭐ ${game.rating}</p>
      <p><strong>Shelf:</strong> ${escapeHtml(game.shelf || '-')}</p>
      <p><strong>Difficulty:</strong> ${escapeHtml(game.difficulty || '-')}</p>
      <p><strong>Genre:</strong> ${escapeHtml(game.genre || '-')}</p>
      <div class="movie-description">${escapeHtml(game.rules || game.description || '')}</div>
    </div>
  `;
  
  // Åbn popup vinduet
  const dlg = document.querySelector('#movie-dialog');
  if (dlg && typeof dlg.showModal === 'function') dlg.showModal();
}

// Nulstiller alle filtre til deres standard værdier
function clearAllFilters() {
  // Liste over alle filter elementer der skal nulstilles
  const elements = [
    '#search-input',    // Søgefelt
    '#genre-select',    // Genre dropdown
    '#sort-select',     // Sortering dropdown
    '#year-from',       // Min spillere
    '#year-to',         // Max spillere
    '#rating-from',     // Min spilletid
    '#rating-to'        // Max spilletid
  ];
  
  // Gå gennem hvert element og nulstil det
  elements.forEach(selector => {
    const el = document.querySelector(selector);
    if (el) {
      // Specielle værdier for dropdowns, tom streng for resten
      if (selector === '#genre-select') el.value = 'all';
      else if (selector === '#sort-select') el.value = 'none';
      else el.value = '';
    }
  });
  
  // Kør filteret igen for at vise alle spil
  filterGames();
}

// Hovedfunktion der filtrerer og sorterer spil baseret på bruger input
function filterGames() {
  // Start med en kopi af alle spil
  let filtered = allGames.slice();
  
  // Hent alle filter værdier fra formularen
  const searchValue = (document.querySelector('#search-input')?.value || '').toLowerCase();
  const genreValue = document.querySelector('#genre-select')?.value || 'all';
  const sortValue = document.querySelector('#sort-select')?.value || 'none';

  // VIGTIGT: I denne app bruges "year" felter til antal spillere, og "rating" felter til spilletid!
  const playersFrom = Number(document.querySelector('#year-from')?.value) || 0;
  const playersTo = Number(document.querySelector('#year-to')?.value) || Infinity;
  const playtimeFrom = Number(document.querySelector('#rating-from')?.value) || 0;
  const playtimeTo = Number(document.querySelector('#rating-to')?.value) || Infinity;

  // TEKST SØGNING: Søg i titel og beskrivelse
  if (searchValue) {
    filtered = filtered.filter(g => 
      (g.title || '').toLowerCase().includes(searchValue) || 
      (g.description || '').toLowerCase().includes(searchValue)
    );
  }

  // GENRE FILTER: Vis kun spil fra valgt genre
  if (genreValue && genreValue !== 'all') {
    filtered = filtered.filter(g => g.genre === genreValue);
  }

  // SPILLERE FILTER: Spillet skal passe med ønsket antal spillere
  if (playersFrom || playersTo !== Infinity) {
    filtered = filtered.filter(g => {
      const minPlayers = g.players?.min || 0;
      const maxPlayers = g.players?.max || 0;
      // Spillet passer hvis: spillets max >= ønsket min OG spillets min <= ønsket max
      return maxPlayers >= playersFrom && minPlayers <= playersTo;
    });
  }

  // SPILLETID FILTER: Filtrer baseret på hvor længe spillet tager
  if (playtimeFrom || playtimeTo !== Infinity) {
    filtered = filtered.filter(g => 
      (typeof g.playtime === 'number') && 
      g.playtime >= playtimeFrom && 
      g.playtime <= playtimeTo
    );
  }

  // SORTERING: Sortér den filtrerede liste
  if (sortValue === 'title') {
    filtered.sort((a,b) => a.title.localeCompare(b.title)); // A-Z
  } else if (sortValue === 'year') {
    filtered.sort((a,b) => (b.playtime||0) - (a.playtime||0)); // Længste spilletid først
  } else if (sortValue === 'rating') {
    filtered.sort((a,b) => (b.rating||0) - (a.rating||0)); // Højeste rating først
  }

  // Vis de filtrerede resultater på siden
  displayGames(filtered);
}

