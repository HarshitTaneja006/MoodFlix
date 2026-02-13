/**
 * MoodFlix Favorites Page
 * Handles the favorites gallery functionality
 */

const FavoritesApp = {
    /**
     * Initialize the favorites page
     */
    init() {
        this.loadFavorites();
        this.bindEvents();
        Storage.updateFavoritesCount();
    },

    /**
     * Load and display favorites
     */
    loadFavorites() {
        const favorites = Storage.getFavorites();
        const grid = document.getElementById('moviesGrid');
        
        if (!grid) return;

        if (favorites.length === 0) {
            grid.innerHTML = UI.createEmptyState(
                'No Favorites Yet',
                'Start exploring movies and add them to your favorites!',
                'favorite_border'
            );
            
            // Hide clear all button
            const clearBtn = document.getElementById('clearAllBtn');
            if (clearBtn) {
                clearBtn.style.display = 'none';
            }
        } else {
            UI.renderMovies(favorites, 'moviesGrid', true);
            
            // Show clear all button
            const clearBtn = document.getElementById('clearAllBtn');
            if (clearBtn) {
                clearBtn.style.display = 'flex';
            }
        }
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Clear All button
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.handleClearAll());
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

        // Event delegation for movie cards
        document.addEventListener('click', (e) => this.handleCardActions(e));
    },

    /**
     * Handle clear all favorites
     */
    handleClearAll() {
        const favorites = Storage.getFavorites();
        
        if (favorites.length === 0) return;

        if (confirm(`Are you sure you want to remove all ${favorites.length} favorites?`)) {
            Storage.clearFavorites();
            this.loadFavorites();
            UI.showToast('All favorites cleared');
        }
    },

    /**
     * Handle card action clicks
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
            
            // First try to get from favorites (has stored data)
            const favorites = Storage.getFavorites();
            const favoriteMovie = favorites.find(m => m.id === movieId);
            
            if (CONFIG.TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE') {
                // Use stored data with mock details
                movie = this.getMockMovieDetails(favoriteMovie || { id: movieId });
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
     * Get mock movie details for demo mode
     * @param {Object} movie - Basic movie data
     * @returns {Object} Mock full movie details
     */
    getMockMovieDetails(movie) {
        return {
            ...movie,
            genres: (movie.genre_ids || []).map(id => ({
                id,
                name: CONFIG.GENRE_MAP[id] || 'Unknown'
            })),
            runtime: Math.floor(Math.random() * 60) + 90,
            original_language: 'en',
            credits: {
                cast: [
                    { name: 'Lead Actor', profile_path: null },
                    { name: 'Supporting Actor', profile_path: null },
                    { name: 'Supporting Actress', profile_path: null }
                ]
            },
            videos: {
                results: []
            }
        };
    },

    /**
     * Toggle movie favorite status
     * @param {number} movieId - Movie ID
     */
    toggleFavorite(movieId) {
        const isFavorite = Storage.isFavorite(movieId);
        
        if (isFavorite) {
            this.removeFromFavorites(movieId);
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
            
            // Close modal if this movie is open
            const modal = document.getElementById('movieModal');
            if (modal && parseInt(modal.dataset.movieId) === movieId) {
                UI.closeModal();
            }
            
            // Remove card from DOM with animation
            const card = document.querySelector(`.movie-card[data-movie-id="${movieId}"]`);
            if (card) {
                card.style.transform = 'scale(0.8) rotate(3deg)';
                card.style.opacity = '0';
                card.style.transition = 'all 0.3s ease';
                setTimeout(() => {
                    card.remove();
                    
                    // Check if grid is empty
                    const grid = document.getElementById('moviesGrid');
                    if (grid && grid.children.length === 0) {
                        this.loadFavorites(); // Reload to show empty state
                    }
                }, 300);
            }
            
            UI.showToast(`Removed "${movie.title}" from favorites`);
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    FavoritesApp.init();
});
