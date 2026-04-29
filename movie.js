document.addEventListener('DOMContentLoaded', () => {

  // --- TMDB API Configuration ---
  const API_KEY = 'ede1397979b10fc39bacef77c9cded10'; // Replace with your TMDB API key
  const BASE_URL = 'https://api.themoviedb.org/3';
  const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
  const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

  // --- STEP 1: Read the movie ID from the URL ---
  // window.location.search gives us the "?id=3" part of the URL.
  // URLSearchParams helps us read individual values from it.
  const params = new URLSearchParams(window.location.search);
  const movieId = parseInt(params.get('id'), 10); // convert "3" (string) to 3 (number)

  // If there's no ID in the URL, redirect home
  if (!movieId) {
    window.location.href = 'index.html';
    return;
  }

  // --- STEP 2: Load movie details from TMDB ---
  fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`)
    .then(response => response.json())
    .then(movie => {
      // Transform TMDB data
      const transformedMovie = {
        id: movie.id,
        title: movie.title,
        poster: movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : '',
        backdrop: movie.backdrop_path ? BACKDROP_BASE_URL + movie.backdrop_path : '',
        rating: movie.vote_average,
        year: movie.release_date ? movie.release_date.split('-')[0] : '',
        genres: movie.genres.map(g => g.name),
        type: 'Movie',
        description: movie.overview,
        runtime: movie.runtime ? `${movie.runtime} min` : ''
      };
      renderMovieDetail(transformedMovie);
    })
    .catch(error => {
      console.error('Could not load movie data:', error);
      // Fallback to local
      fetch('movies.json')
        .then(response => response.json())
        .then(movies => {
          const movie = movies.find(m => m.id === movieId);
          if (movie) {
            renderMovieDetail(movie);
          } else {
            window.location.href = 'index.html';
          }
        })
        .catch(err => console.error('Fallback failed:', err));
    });


  // ============================================================
  //  RENDER FUNCTION
  //  Fills all the page elements with the movie's data
  // ============================================================
  function renderMovieDetail(movie) {

    // --- Update the browser tab title ---
    document.title = `${movie.title} (${movie.year}) — GOODRICK MOVIE ZONE`;

    // --- Backdrop (the blurred background image behind the content) ---
    const backdrop = document.getElementById('detailBackdrop');
    backdrop.style.backgroundImage = `url('${movie.backdrop}')`;

    // --- Poster image ---
    const poster = document.getElementById('detailPoster');
    poster.src = movie.poster;
    poster.alt = `${movie.title} Poster`;

    // --- Title ---
    document.getElementById('detailTitle').textContent = movie.title;

    // --- Year ---
    document.getElementById('detailYear').textContent = movie.year;

    // --- Rating ---
    document.getElementById('detailRating').textContent = movie.rating;

    // --- Type (Movie / Series) ---
    document.getElementById('detailType').textContent = movie.type;

    // --- Runtime ---
    const runtimeEl = document.getElementById('detailRuntime');
    if (movie.runtime) {
      runtimeEl.textContent = movie.runtime;
    } else {
      runtimeEl.style.display = 'none';
    }

    // --- Description ---
    document.getElementById('detailDescription').textContent = movie.description;

    // --- Episodes (only shown for Series) ---
    const episodesEl = document.getElementById('detailEpisodes');
    if (movie.type === 'Series' && movie.episodes) {
      episodesEl.innerHTML = `<strong>${movie.episodes} Episodes</strong>`;
    } else {
      episodesEl.style.display = 'none';
    }

    // --- Genre Tags ---
    // We loop through the genres array and create a <span> for each one
    const genresEl = document.getElementById('detailGenres');
    genresEl.innerHTML = movie.genres.map(genre => `
      <span class="genre-tag">${genre}</span>
    `).join('');

    // --- Update the meta description for SEO ---
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', `Watch ${movie.title} (${movie.year}) on GOODRICK MOVIE ZONE. ${movie.description.slice(0, 120)}...`);
    }
  }

}); // End of DOMContentLoaded
