/**
 * MoodFlix UI Module
 * Handles UI component generation and rendering
 */

const UI = {
    /**
     * Create a movie card HTML
     * @param {Object} movie - Movie data
     * @param {boolean} showRemove - Show remove button (for favorites)
     * @returns {string} HTML string
     */
    createMovieCard(movie, showRemove = false) {
        const posterUrl = API.getPosterUrl(movie.poster_path);
        const year = API.getYear(movie.release_date);
        const rating = API.formatRating(movie.vote_average);
        const primaryGenre = API.getPrimaryGenre(movie.genre_ids || (movie.genres ? movie.genres.map(g => g.id) : []));
        const isFavorite = Storage.isFavorite(movie.id);
        const genreClass = primaryGenre.toLowerCase().replace(/[^a-z]/g, '');

        return `
            <article class="movie-card" data-movie-id="${movie.id}">
                ${showRemove ? `
                    <button class="btn-remove" data-action="remove" data-movie-id="${movie.id}" aria-label="Remove from favorites">
                        ✕
                    </button>
                ` : ''}
                <div class="movie-poster-container">
                    <div class="movie-poster-frame">
                        <img 
                            src="${posterUrl}" 
                            alt="${movie.title} Poster" 
                            class="movie-poster"
                            loading="lazy"
                            onerror="this.src='https://via.placeholder.com/342x513/1e182a/ffffff?text=No+Poster'"
                        />
                        <div class="movie-rating">
                            <span class="material-symbols-outlined">star</span>
                            ${rating}
                        </div>
                    </div>
                </div>
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title}</h3>
                    <div class="movie-meta">
                        <span class="movie-year">${year}</span>
                        <span class="movie-genre-tag ${genreClass}">${primaryGenre}</span>
                    </div>
                    <div class="movie-actions">
                        <button class="btn-details" data-action="details" data-movie-id="${movie.id}">
                            Details
                        </button>
                        <button class="btn-favorite ${isFavorite ? 'active' : ''}" data-action="favorite" data-movie-id="${movie.id}">
                            <span class="material-symbols-outlined">${isFavorite ? 'favorite' : 'favorite_border'}</span>
                        </button>
                    </div>
                </div>
            </article>
        `;
    },

    /**
     * Create genre tag HTML
     * @param {string} genreName - Genre name
     * @returns {string} HTML string
     */
    createGenreTag(genreName) {
        const genreClass = genreName.toLowerCase().replace(/[^a-z]/g, '');
        return `<span class="genre-tag ${genreClass}">${genreName}</span>`;
    },

    /**
     * Create modal genre tag HTML
     * @param {string} genreName - Genre name
     * @returns {string} HTML string
     */
    createModalGenreTag(genreName) {
        const colors = CONFIG.GENRE_COLORS[genreName] || { bg: '#2d3436', text: '#fff' };
        return `
            <span class="modal-genre-tag" style="color: ${colors.text}; background-color: ${colors.bg};">
                ${genreName}
            </span>
        `;
    },

    /**
     * Create cast member HTML
     * @param {Object} member - Cast member data
     * @returns {string} HTML string
     */
    createCastMember(member) {
        const profileUrl = API.getProfileUrl(member.profile_path);
        const firstName = member.name.split(' ')[0];
        
        return `
            <div class="modal-cast-item">
                <div class="modal-cast-avatar">
                    <img 
                        src="${profileUrl}" 
                        alt="${member.name}"
                        loading="lazy"
                        onerror="this.src='https://via.placeholder.com/185x278/2d3436/ffffff?text=${firstName}'"
                    />
                </div>
                <span class="modal-cast-name">${firstName}</span>
            </div>
        `;
    },

    /**
     * Create movie modal content
     * @param {Object} movie - Full movie details
     * @returns {string} HTML string
     */
    createModalContent(movie) {
        const backdropUrl = API.getBackdropUrl(movie.backdrop_path);
        const year = API.getYear(movie.release_date);
        const runtime = API.formatRuntime(movie.runtime);
        const rating = API.formatRating(movie.vote_average);
        const genres = movie.genres || [];
        const cast = movie.credits?.cast?.slice(0, 6) || [];
        const videos = movie.videos?.results || [];
        const trailerUrl = API.getTrailerUrl(videos);
        const isFavorite = Storage.isFavorite(movie.id);
        const language = movie.original_language?.toUpperCase() || 'N/A';

        return `
            <div class="modal-backdrop">
                <img 
                    src="${backdropUrl}" 
                    alt="${movie.title} Backdrop"
                    onerror="this.src='https://via.placeholder.com/1280x720/1e182a/ffffff?text=No+Backdrop'"
                />
                <h2 class="modal-movie-title">${movie.title}</h2>
            </div>
            <div class="modal-body">
                <div style="display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 1.5rem; margin-bottom: 1.5rem;">
                    <div class="modal-genres">
                        ${genres.map(g => this.createModalGenreTag(g.name)).join('')}
                    </div>
                    <div class="modal-rating-box">
                        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">star</span>
                        <div>
                            <span class="modal-rating-value">${rating}</span>
                            <span class="modal-rating-label">/10 IMDb</span>
                        </div>
                    </div>
                </div>
                
                <div class="modal-meta">
                    <div class="modal-meta-item">
                        <span class="material-symbols-outlined">calendar_today</span>
                        <span>${year}</span>
                    </div>
                    <div class="modal-meta-item">
                        <span class="material-symbols-outlined">schedule</span>
                        <span>${runtime}</span>
                    </div>
                    <div class="modal-meta-item">
                        <span class="material-symbols-outlined">language</span>
                        <span>${language}</span>
                    </div>
                    ${movie.adult === false ? `
                        <span class="modal-meta-badge">PG-13</span>
                    ` : ''}
                </div>
                
                <div class="modal-section">
                    <h3 class="modal-section-title">The Story</h3>
                    <p class="modal-overview">${movie.overview || 'No overview available.'}</p>
                </div>
                
                ${cast.length > 0 ? `
                    <div class="modal-cast">
                        <h4 class="modal-cast-title">Starring</h4>
                        <div class="modal-cast-list">
                            ${cast.map(member => this.createCastMember(member)).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="modal-actions">
                    <button class="modal-btn modal-btn-primary" data-action="modal-favorite" data-movie-id="${movie.id}">
                        <span class="material-symbols-outlined">${isFavorite ? 'favorite' : 'favorite_border'}</span>
                        ${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                    </button>
                    ${trailerUrl ? `
                        <a href="${trailerUrl}" target="_blank" rel="noopener noreferrer" class="modal-btn modal-btn-secondary">
                            <span class="material-symbols-outlined">play_circle</span>
                            Watch Trailer
                        </a>
                    ` : `
                        <button class="modal-btn modal-btn-secondary" disabled>
                            <span class="material-symbols-outlined">play_circle</span>
                            No Trailer
                        </button>
                    `}
                </div>
            </div>
        `;
    },

    /**
     * Create toast notification HTML
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error)
     * @returns {string} HTML string
     */
    createToast(message, type = 'success') {
        const icon = type === 'success' ? 'check_circle' : 'error';
        return `
            <div class="toast ${type}">
                <span class="material-symbols-outlined">${icon}</span>
                <span>${message}</span>
            </div>
        `;
    },

    /**
     * Create empty state HTML
     * @param {string} title - Title text
     * @param {string} message - Description text
     * @param {string} icon - Material icon name
     * @returns {string} HTML string
     */
    createEmptyState(title, message, icon = 'movie_filter') {
        return `
            <div class="empty-state">
                <span class="material-symbols-outlined empty-state-icon">${icon}</span>
                <h3 class="empty-state-title">${title}</h3>
                <p class="empty-state-text">${message}</p>
                <a href="index.html" class="btn-discover">
                    <span class="material-symbols-outlined">search</span>
                    Discover Movies
                </a>
            </div>
        `;
    },

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error)
     * @param {number} duration - Duration in ms
     */
    showToast(message, type = 'success', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toastHTML = this.createToast(message, type);
        const toastElement = document.createElement('div');
        toastElement.innerHTML = toastHTML;
        const toast = toastElement.firstElementChild;
        
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Render movies to grid
     * @param {Array} movies - Array of movie objects
     * @param {string} containerId - Grid container ID
     * @param {boolean} showRemove - Show remove buttons
     * @param {boolean} append - Append to existing content
     */
    renderMovies(movies, containerId = 'moviesGrid', showRemove = false, append = false) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const html = movies.map(movie => this.createMovieCard(movie, showRemove)).join('');
        
        if (append) {
            container.insertAdjacentHTML('beforeend', html);
        } else {
            container.innerHTML = html;
        }
    },

    /**
     * Render genre tags
     * @param {Array} genreNames - Array of genre names
     * @param {string} containerId - Container ID
     */
    renderGenreTags(genreNames, containerId = 'genresTags') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = genreNames.map(name => this.createGenreTag(name)).join('');
    },

    /**
     * Show/hide element
     * @param {string} elementId - Element ID
     * @param {boolean} show - Show or hide
     */
    toggleElement(elementId, show) {
        const element = document.getElementById(elementId);
        if (!element) return;

        if (show) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    },

    /**
     * Show loading state
     */
    showLoading() {
        this.toggleElement('loadingContainer', true);
        this.toggleElement('moviesSection', false);
    },

    /**
     * Hide loading state
     */
    hideLoading() {
        this.toggleElement('loadingContainer', false);
    },

    /**
     * Show movies section
     */
    showMoviesSection() {
        this.toggleElement('moviesSection', true);
    },

    /**
     * Open movie modal
     * @param {Object} movie - Full movie details
     */
    openModal(movie) {
        const modal = document.getElementById('movieModal');
        const backdrop = document.getElementById('modalBackdrop');
        const body = document.getElementById('modalBody');
        
        if (!modal) return;

        // Generate content
        const content = this.createModalContent(movie);
        
        // Split content for backdrop and body
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        const backdropContent = tempDiv.querySelector('.modal-backdrop');
        const bodyContent = tempDiv.querySelector('.modal-body');
        
        if (backdrop && backdropContent) {
            backdrop.innerHTML = backdropContent.innerHTML;
        }
        if (body && bodyContent) {
            body.innerHTML = bodyContent.innerHTML;
        }

        // Show modal
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Store current movie
        modal.dataset.movieId = movie.id;
    },

    /**
     * Close movie modal
     */
    closeModal() {
        const modal = document.getElementById('movieModal');
        if (!modal) return;

        modal.classList.add('hidden');
        document.body.style.overflow = '';
        delete modal.dataset.movieId;
    },

    /**
     * Update favorite button state
     * @param {number} movieId - Movie ID
     * @param {boolean} isFavorite - Is favorite
     */
    updateFavoriteButton(movieId, isFavorite) {
        // Update card buttons
        const cardButtons = document.querySelectorAll(`.btn-favorite[data-movie-id="${movieId}"]`);
        cardButtons.forEach(btn => {
            btn.classList.toggle('active', isFavorite);
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.textContent = isFavorite ? 'favorite' : 'favorite_border';
            }
        });

        // Update modal button if open
        const modalButton = document.querySelector(`[data-action="modal-favorite"][data-movie-id="${movieId}"]`);
        if (modalButton) {
            const icon = modalButton.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.textContent = isFavorite ? 'favorite' : 'favorite_border';
            }
            // Update text content
            const textNode = Array.from(modalButton.childNodes).find(node => node.nodeType === 3);
            if (textNode) {
                modalButton.innerHTML = `
                    <span class="material-symbols-outlined">${isFavorite ? 'favorite' : 'favorite_border'}</span>
                    ${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                `;
            }
        }
    }
};
