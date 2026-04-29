// ============================================================
//  app.js — Homepage Logic for GOODRICK MOVIE ZONE
//  This file does three main things:
//  1. Loads movie data from TMDB API
//  2. Renders the hero, trending row, and movies grid
//  3. Handles genre filter buttons
// ============================================================

// --- TMDB API Configuration ---
const API_KEY = 'ede1397979b10fc39bacef77c9cded10'; // Replace with your TMDB API key from https://www.themoviedb.org/settings/api
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'; // For posters
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280'; // For backdrops

// --- STEP 1: Wait for the page to be fully loaded before we run any code ---
document.addEventListener('DOMContentLoaded', () => {

  // --- All the genres we want to show as filter buttons ---
  const ALL_GENRES = ['Action', 'Adventure', 'Biography', 'Crime', 'Comedy', 'Documentary', 'Drama', 'Horror', 'Mystery'];

  // --- We keep track of which genre is selected in each section ---
  let trendingActiveGenre = 'All';
  let moviesActiveGenre = 'All';

  // --- STEP 2: Fetch data from TMDB ---
  fetchTMDBData()
    .then(data => {
      init(data);
    })
    .catch(error => {
      console.error('Failed to load movie data:', error);
      // Fallback to local data if API fails
      fetch('movies.json')
        .then(response => response.json())
        .then(movies => init(movies))
        .catch(err => console.error('Fallback also failed:', err));
    });


  // --- Fetch data from TMDB API ---
  async function fetchTMDBData() {
    // Fetch genres first
    const genresResponse = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`);
    const genresData = await genresResponse.json();
    const genresMap = {};
    genresData.genres.forEach(genre => {
      genresMap[genre.id] = genre.name;
    });

    // Fetch popular movies
    const popularResponse = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`);
    const popularData = await popularResponse.json();

    // Fetch trending movies
    const trendingResponse = await fetch(`${BASE_URL}/trending/movie/day?api_key=${API_KEY}&language=en-US`);
    const trendingData = await trendingResponse.json();

    // Transform TMDB data to match our expected format
    const movies = popularData.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      poster: movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : '',
      backdrop: movie.backdrop_path ? BACKDROP_BASE_URL + movie.backdrop_path : '',
      rating: movie.vote_average,
      year: movie.release_date ? movie.release_date.split('-')[0] : '',
      genres: movie.genre_ids.map(id => genresMap[id]).filter(Boolean),
      type: 'Movie',
      description: movie.overview,
      isTrending: false // We'll set some as trending
    }));

    // Add trending movies (first 10 as trending)
    trendingData.results.slice(0, 10).forEach(movie => {
      const existing = movies.find(m => m.id === movie.id);
      if (existing) {
        existing.isTrending = true;
      } else {
        movies.push({
          id: movie.id,
          title: movie.title,
          poster: movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : '',
          backdrop: movie.backdrop_path ? BACKDROP_BASE_URL + movie.backdrop_path : '',
          rating: movie.vote_average,
          year: movie.release_date ? movie.release_date.split('-')[0] : '',
          genres: movie.genre_ids.map(id => genresMap[id]).filter(Boolean),
          type: 'Movie',
          description: movie.overview,
          isTrending: true
        });
      }
    });

    // Mark the first movie as featured
    if (movies.length > 0) {
      movies[0].featured = true;
    }

    return movies;
  }


  // --- STEP 3: Main init function — called once data is ready ---
  function init(movies) {
    renderHero(movies);
    renderTrending(movies);
    renderMovies(movies);
    setupNavScroll();
  }


  // ============================================================
  //  HERO SECTION
  //  Finds the movie marked "featured: true" and renders it
  //  as the big banner at the top of the page.
  // ============================================================
  function renderHero(movies) {
    // Find the featured movie (or fall back to the first movie)
    const featured = movies.find(m => m.featured) || movies[0];

    // Get the HTML elements we want to update
    const heroBg      = document.getElementById('heroBg');
    const heroContent = document.getElementById('heroContent');

    // Set the background image using the backdrop URL
    heroBg.style.backgroundImage = `url('${featured.backdrop}')`;

    // Build the star rating display (e.g., ★ 7.9)
    const stars = '★'.repeat(Math.round(featured.rating / 2));

    // Build the genre tags string (e.g., "Action · Crime · Drama")
    const genreText = featured.genres.join(' · ');

    // Inject the HTML into the hero content area
    heroContent.innerHTML = `
      <div class="hero-meta">
        <span class="badge">${featured.type === 'Series' ? 'SERIES' : 'MOVIE'}</span>
        <span class="hero-rating">★ ${featured.rating}</span>
        <span>${featured.year}</span>
        <span>${genreText}</span>
      </div>
      <h1 class="hero-title">${featured.title}</h1>
      <p class="hero-description">${featured.description}</p>
      <div class="hero-buttons">
        <a href="movie.html?id=${featured.id}" class="btn-watch">▶ Watch</a>
        <button class="btn-add" onclick="alert('Added to your list!')">＋ Add List</button>
      </div>
    `;
  }


  // ============================================================
  //  TRENDING ROW
  //  Renders the horizontally scrollable cards in "Trends Now"
  // ============================================================
  function renderTrending(movies) {
    // Build the genre filter buttons
    buildGenreButtons(
      'trendingGenres',          // ID of the container
      ALL_GENRES,                 // list of genres
      trendingActiveGenre,        // currently selected genre
      (genre) => {                // callback when a button is clicked
        trendingActiveGenre = genre;
        const filtered = filterByGenre(movies.filter(m => m.isTrending), genre);
        buildTrendingCards(filtered);
        buildGenreButtons('trendingGenres', ALL_GENRES, genre, arguments.callee);
      }
    );

    // Render all trending movies first
    const trendingMovies = movies.filter(m => m.isTrending);
    buildTrendingCards(trendingMovies);
  }

  // Builds the actual card HTML for the trending row
  function buildTrendingCards(movies) {
    const row = document.getElementById('trendingRow');

    // If no movies match the filter, show a message
    if (movies.length === 0) {
      row.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; padding: 8px 0;">No titles found for this genre.</p>';
      return;
    }

    // map() loops over the array and turns each movie into an HTML string
    row.innerHTML = movies.map(movie => `
      <div class="trending-card" onclick="window.location.href='movie.html?id=${movie.id}'">
        <img src="${movie.poster}" alt="${movie.title}" loading="lazy" />
        <div class="trending-card-info">
          <div class="trending-card-title">${movie.title}</div>
          <div class="trending-card-meta">
            <span class="star">★</span>
            <span>${movie.rating}</span>
            <span>·</span>
            <span>${movie.year}</span>
          </div>
        </div>
      </div>
    `).join('');  // join() connects all the strings into one big string
  }


  // ============================================================
  //  MOVIES GRID
  //  Renders the full movie grid with sort controls
  // ============================================================
  function renderMovies(movies) {
    // Build genre filters for movies section
    buildGenreButtons(
      'moviesGenres',
      ALL_GENRES,
      moviesActiveGenre,
      (genre) => {
        moviesActiveGenre = genre;
        const filtered = filterByGenre(movies, genre);
        buildMovieCards(filtered);
        buildGenreButtons('moviesGenres', ALL_GENRES, genre, arguments.callee);
      }
    );

    // Build the initial movie cards
    buildMovieCards(movies);

    // --- Sort Buttons ---
    document.getElementById('sortLatest').addEventListener('click', function() {
      setActiveSort(this);
      // Sort by year descending (newest first)
      const sorted = [...filterByGenre(movies, moviesActiveGenre)].sort((a, b) => b.year - a.year);
      buildMovieCards(sorted);
    });

    document.getElementById('sortYear').addEventListener('click', function() {
      setActiveSort(this);
      // Sort by year ascending (oldest first)
      const sorted = [...filterByGenre(movies, moviesActiveGenre)].sort((a, b) => a.year - b.year);
      buildMovieCards(sorted);
    });

    document.getElementById('sortAlpha').addEventListener('click', function() {
      setActiveSort(this);
      // Sort alphabetically A-Z by title
      const sorted = [...filterByGenre(movies, moviesActiveGenre)].sort((a, b) => a.title.localeCompare(b.title));
      buildMovieCards(sorted);
    });
  }

  // Helper: marks the clicked sort button as active
  function setActiveSort(btn) {
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  // Builds the grid of movie cards
  function buildMovieCards(movies) {
    const grid = document.getElementById('moviesGrid');

    if (movies.length === 0) {
      grid.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; padding: 12px 0; grid-column: 1/-1;">No titles found for this genre.</p>';
      return;
    }

    grid.innerHTML = movies.map(movie => `
      <article class="movie-card" onclick="window.location.href='movie.html?id=${movie.id}'" role="button" tabindex="0" aria-label="View ${movie.title}">
        <div class="movie-card-img-wrap">
          <span class="movie-type-badge">${movie.type}</span>
          <img src="${movie.poster}" alt="${movie.title}" loading="lazy" />
          <div class="movie-card-overlay">
            <div class="play-icon">▶</div>
          </div>
        </div>
        <div class="movie-card-body">
          <div class="movie-card-title">${movie.title}</div>
          <div class="movie-card-meta">
            <span>${movie.year}</span>
            <span class="movie-card-rating">★ ${movie.rating}</span>
          </div>
        </div>
      </article>
    `).join('');
  }


  // ============================================================
  //  GENRE FILTER BUTTONS (Reusable)
  //  Builds a row of genre buttons inside a container element.
  //  "activeGenre" is the currently selected one.
  //  "onSelect" is the function to call when a button is clicked.
  // ============================================================
  function buildGenreButtons(containerId, genres, activeGenre, onSelect) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear existing buttons

    // Create "All" button + one button per genre
    const allGenres = ['All', ...genres];

    allGenres.forEach(genre => {
      const btn = document.createElement('button');
      btn.className = `genre-btn ${genre === activeGenre ? 'active' : ''}`;
      btn.textContent = genre;
      btn.addEventListener('click', () => {
        onSelect(genre);
      });
      container.appendChild(btn);
    });
  }

  // Filters movies by genre. "All" means no filter.
  function filterByGenre(movies, genre) {
    if (genre === 'All') return movies;
    // Array.includes() checks if the genre is in the movie's genres array
    return movies.filter(m => m.genres.includes(genre));
  }


  // ============================================================
  //  NAVBAR SCROLL BEHAVIOUR
  //  Adds a solid background to the navbar once you scroll down
  // ============================================================
  function setupNavScroll() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 60) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

}); // End of DOMContentLoaded
