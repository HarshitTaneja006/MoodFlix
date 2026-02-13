/**
 * MoodFlix Main Application
 * Main entry point for the application
 */

const App = {
    // Current state
    state: {
        currentMovies: [],
        detectedGenres: [],
        isLoading: false,
        currentPage: 1,
        viewMode: 'grid' // grid or list
    },

    /**
     * Initialize the application
     */
    init() {
        this.bindEvents();
        this.initMoodInput();
        Storage.updateFavoritesCount();
        
        // Check for API key
        if (CONFIG.TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE') {
            this.showApiKeyWarning();
        }
        
        // Handle URL parameters (for search again from history)
        this.handleUrlParams();
    },
    
    /**
     * Handle URL parameters
     */
    handleUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const mood = urlParams.get('mood');
        
        if (mood) {
            const moodInput = document.getElementById('moodInput');
            if (moodInput) {
                moodInput.value = mood;
                // Update character count
                const charCount = document.getElementById('charCount');
                if (charCount) {
                    charCount.textContent = mood.length;
                }
                // Detect genres
                this.detectAndShowGenres(mood);
                // Clear URL parameter
                window.history.replaceState({}, document.title, window.location.pathname);
                // Auto-search after short delay
                setTimeout(() => this.handleFindMovies(), 500);
            }
        }
    },

    /**
     * Show API key warning
     */
    showApiKeyWarning() {
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            const warning = document.createElement('div');
            warning.className = 'api-warning';
            warning.style.cssText = `
                background: linear-gradient(135deg, #ff6b6b, #e94560);
                border: 2px solid #000;
                border-radius: 1rem;
                padding: 1.5rem;
                margin-bottom: 2rem;
                box-shadow: 4px 4px 0 #000;
                text-align: center;
            `;
            warning.innerHTML = `
                <h3 style="margin-bottom: 0.5rem; font-family: 'Fredoka', sans-serif;">⚠️ API Key Required</h3>
                <p style="margin-bottom: 0.75rem;">To use MoodFlix, you need a free TMDB API key.</p>
                <ol style="text-align: left; max-width: 500px; margin: 0 auto 1rem; padding-left: 1.5rem;">
                    <li>Go to <a href="https://www.themoviedb.org/signup" target="_blank" style="color: #00d9ff;">themoviedb.org/signup</a></li>
                    <li>Create a free account</li>
                    <li>Go to Settings → API → Create → Developer</li>
                    <li>Copy your API key</li>
                    <li>Open <code style="background: rgba(0,0,0,0.3); padding: 0.2rem 0.5rem; border-radius: 0.25rem;">js/config.js</code></li>
                    <li>Replace <code style="background: rgba(0,0,0,0.3); padding: 0.2rem 0.5rem; border-radius: 0.25rem;">YOUR_TMDB_API_KEY_HERE</code> with your key</li>
                </ol>
                <p style="font-size: 0.875rem; opacity: 0.9;">The app will work with demo data until you add your API key.</p>
            `;
            heroSection.insertBefore(warning, heroSection.firstChild);
        }
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Find Movies button
        const findBtn = document.getElementById('findMoviesBtn');
        if (findBtn) {
            findBtn.addEventListener('click', () => this.handleFindMovies());
        }

        // Mood input - Enter key
        const moodInput = document.getElementById('moodInput');
        if (moodInput) {
            moodInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleFindMovies();
                }
            });
        }

        // Modal close button
        const modalCloseBtn = document.getElementById('modalCloseBtn');
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => UI.closeModal());
        }

        // Modal overlay click to close
        const modalOverlay = document.getElementById('movieModal');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    UI.closeModal();
                }
            });
        }

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                UI.closeModal();
            }
        });

        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // View toggle buttons
        const gridViewBtn = document.getElementById('gridViewBtn');
        const listViewBtn = document.getElementById('listViewBtn');
        if (gridViewBtn && listViewBtn) {
            gridViewBtn.addEventListener('click', () => this.setViewMode('grid'));
            listViewBtn.addEventListener('click', () => this.setViewMode('list'));
        }

        // Event delegation for movie cards
        document.addEventListener('click', (e) => this.handleCardActions(e));
    },

    /**
     * Initialize mood input with character counter
     */
    initMoodInput() {
        const moodInput = document.getElementById('moodInput');
        const charCount = document.getElementById('charCount');
        
        if (moodInput && charCount) {
            moodInput.addEventListener('input', () => {
                charCount.textContent = moodInput.value.length;
                this.detectAndShowGenres(moodInput.value);
            });
        }
    },

    /**
     * Detect genres from mood text and show them
     * @param {string} text - Mood text
     */
    detectAndShowGenres(text) {
        const genresContainer = document.getElementById('genresContainer');
        const genresTags = document.getElementById('genresTags');
        
        if (!genresContainer || !genresTags) return;

        if (text.length < 3) {
            genresContainer.style.opacity = '0.5';
            genresTags.innerHTML = '<span style="color: rgba(255,255,255,0.5); font-style: italic;">Start typing to detect genres...</span>';
            return;
        }

        const detected = API.detectGenresFromMood(text);
        this.state.detectedGenres = detected.genreIds;
        
        if (detected.genreNames.length > 0) {
            genresContainer.style.opacity = '1';
            UI.renderGenreTags(detected.genreNames.slice(0, 5));
        }
    },

    /**
     * Handle Find Movies button click
     */
    async handleFindMovies() {
        const moodInput = document.getElementById('moodInput');
        const moodText = moodInput?.value?.trim();

        if (!moodText) {
            UI.showToast('Please describe your mood first!', 'error');
            moodInput?.focus();
            return;
        }

        // Detect genres if not already done
        if (this.state.detectedGenres.length === 0) {
            const detected = API.detectGenresFromMood(moodText);
            this.state.detectedGenres = detected.genreIds;
        }

        await this.searchMovies();
    },

    /**
     * Search movies based on detected genres
     */
    async searchMovies() {
        if (this.state.isLoading) return;

        this.state.isLoading = true;
        UI.showLoading();

        try {
            let results;
            
            // Check if API key is configured
            if (CONFIG.TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE') {
                // Use demo data
                results = this.getDemoMovies();
            } else {
                // Use real API
                const response = await API.discoverByGenres(this.state.detectedGenres);
                results = response.results || [];
            }

            this.state.currentMovies = results;
            
            if (results.length > 0) {
                UI.renderMovies(results);
                UI.hideLoading();
                UI.showMoviesSection();
                
                // Add to history
                const moodInput = document.getElementById('moodInput');
                Storage.addToHistory({
                    mood: moodInput?.value || '',
                    genres: this.state.detectedGenres,
                    resultCount: results.length
                });
            } else {
                UI.hideLoading();
                UI.showToast('No movies found. Try a different mood!', 'error');
            }
        } catch (error) {
            console.error('Search failed:', error);
            UI.hideLoading();
            UI.showToast('Failed to fetch movies. Please try again.', 'error');
        } finally {
            this.state.isLoading = false;
        }
    },

    /**
     * Handle card action clicks (details, favorite, remove)
     * @param {Event} e - Click event
     */
    async handleCardActions(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        const movieId = parseInt(target.dataset.movieId);

        switch (action) {
            case 'details':
                await this.openMovieDetails(movieId);
                break;
            case 'favorite':
            case 'modal-favorite':
                this.toggleFavorite(movieId);
                break;
            case 'remove':
                this.removeFromFavorites(movieId);
                break;
        }
    },

    /**
     * Open movie details modal
     * @param {number} movieId - Movie ID
     */
    async openMovieDetails(movieId) {
        try {
            let movie;
            
            if (CONFIG.TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE') {
                // Use demo data
                movie = this.getDemoMovieDetails(movieId);
            } else {
                movie = await API.getMovieDetails(movieId);
            }
            
            if (movie) {
                UI.openModal(movie);
            }
        } catch (error) {
            console.error('Failed to load movie details:', error);
            UI.showToast('Failed to load movie details.', 'error');
        }
    },

    /**
     * Toggle movie favorite status
     * @param {number} movieId - Movie ID
     */
    toggleFavorite(movieId) {
        const movie = this.state.currentMovies.find(m => m.id === movieId) || 
                      Storage.getFavorites().find(m => m.id === movieId);
        
        if (!movie) {
            // Try to get from demo data
            const demoMovie = this.getDemoMovies().find(m => m.id === movieId);
            if (demoMovie) {
                this.toggleFavoriteWithMovie(demoMovie);
            }
            return;
        }

        this.toggleFavoriteWithMovie(movie);
    },

    /**
     * Toggle favorite with movie object
     * @param {Object} movie - Movie object
     */
    toggleFavoriteWithMovie(movie) {
        const isFavorite = Storage.isFavorite(movie.id);
        
        if (isFavorite) {
            Storage.removeFavorite(movie.id);
            UI.updateFavoriteButton(movie.id, false);
            UI.showToast(`Removed "${movie.title}" from favorites`);
        } else {
            const success = Storage.addFavorite(movie);
            if (success) {
                UI.updateFavoriteButton(movie.id, true);
                UI.showToast(`Added "${movie.title}" to favorites`, 'success');
            } else {
                UI.showToast('Could not add to favorites', 'error');
            }
        }
    },

    /**
     * Remove movie from favorites
     * @param {number} movieId - Movie ID
     */
    removeFromFavorites(movieId) {
        const movie = Storage.getFavorites().find(m => m.id === movieId);
        if (movie) {
            Storage.removeFavorite(movieId);
            
            // Remove card from DOM with animation
            const card = document.querySelector(`.movie-card[data-movie-id="${movieId}"]`);
            if (card) {
                card.style.transform = 'scale(0.8)';
                card.style.opacity = '0';
                card.style.transition = 'all 0.3s ease';
                setTimeout(() => {
                    card.remove();
                    // Check if grid is empty
                    const grid = document.getElementById('moviesGrid');
                    if (grid && grid.children.length === 0) {
                        grid.innerHTML = UI.createEmptyState(
                            'No Favorites Yet',
                            'Start exploring movies and add them to your favorites!',
                            'favorite_border'
                        );
                    }
                }, 300);
            }
            
            UI.showToast(`Removed "${movie.title}" from favorites`);
        }
    },

    /**
     * Set view mode
     * @param {string} mode - View mode (grid or list)
     */
    setViewMode(mode) {
        this.state.viewMode = mode;
        
        const grid = document.getElementById('moviesGrid');
        const gridBtn = document.getElementById('gridViewBtn');
        const listBtn = document.getElementById('listViewBtn');
        
        if (grid) {
            grid.classList.toggle('list-view', mode === 'list');
        }
        
        if (gridBtn && listBtn) {
            gridBtn.classList.toggle('active', mode === 'grid');
            listBtn.classList.toggle('active', mode === 'list');
        }
    },

    /**
     * Get demo movies for testing without API key
     * @returns {Array} Demo movie data
     */
    getDemoMovies() {
        return [
            {
                id: 27205,
                title: 'Inception',
                overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: "inception".',
                poster_path: '/8IB2e4r4oVhHnANbnm7O3Tj6tF8.jpg',
                backdrop_path: '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
                release_date: '2010-07-16',
                vote_average: 8.4,
                genre_ids: [28, 878, 12]
            },
            {
                id: 157336,
                title: 'Interstellar',
                overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
                poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
                backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
                release_date: '2014-11-05',
                vote_average: 8.4,
                genre_ids: [12, 18, 878]
            },
            {
                id: 155,
                title: 'The Dark Knight',
                overview: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations.',
                poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
                backdrop_path: '/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
                release_date: '2008-07-16',
                vote_average: 8.5,
                genre_ids: [18, 28, 80, 53]
            },
            {
                id: 550,
                title: 'Fight Club',
                overview: 'A ticking-Loss insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
                poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
                backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
                release_date: '1999-10-15',
                vote_average: 8.4,
                genre_ids: [18]
            },
            {
                id: 680,
                title: 'Pulp Fiction',
                overview: 'A burger-loving hit man, his philosophical partner, a drug-addled gangster\'s moll and a washed-up boxer converge in this sprawling, comedic crime caper.',
                poster_path: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
                backdrop_path: '/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg',
                release_date: '1994-09-10',
                vote_average: 8.5,
                genre_ids: [53, 80]
            },
            {
                id: 238,
                title: 'The Godfather',
                overview: 'Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.',
                poster_path: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
                backdrop_path: '/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
                release_date: '1972-03-14',
                vote_average: 8.7,
                genre_ids: [18, 80]
            },
            {
                id: 278,
                title: 'The Shawshank Redemption',
                overview: 'Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.',
                poster_path: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
                backdrop_path: '/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
                release_date: '1994-09-23',
                vote_average: 8.7,
                genre_ids: [18, 80]
            },
            {
                id: 13,
                title: 'Forrest Gump',
                overview: 'A man with a low IQ has accomplished great things in his life and been present during significant historic events—in each case, far exceeding what anyone imagined he could do.',
                poster_path: '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
                backdrop_path: '/3h1JZGDhZ8nzxdgvkxha0qBqi05.jpg',
                release_date: '1994-06-23',
                vote_average: 8.5,
                genre_ids: [35, 18, 10749]
            }
        ];
    },

    /**
     * Get demo movie details
     * @param {number} movieId - Movie ID
     * @returns {Object} Demo movie details
     */
    getDemoMovieDetails(movieId) {
        const baseMovies = this.getDemoMovies();
        const movie = baseMovies.find(m => m.id === movieId);
        
        if (!movie) return null;

        // Add extra details for modal
        return {
            ...movie,
            genres: (movie.genre_ids || []).map(id => ({
                id,
                name: CONFIG.GENRE_MAP[id] || 'Unknown'
            })),
            runtime: 148,
            original_language: 'en',
            credits: {
                cast: [
                    { name: 'Leonardo DiCaprio', profile_path: null },
                    { name: 'Joseph Gordon-Levitt', profile_path: null },
                    { name: 'Elliot Page', profile_path: null },
                    { name: 'Tom Hardy', profile_path: null },
                    { name: 'Ken Watanabe', profile_path: null },
                    { name: 'Cillian Murphy', profile_path: null }
                ]
            },
            videos: {
                results: [
                    { type: 'Trailer', site: 'YouTube', key: 'YoHD9XEInc0' }
                ]
            }
        };
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
