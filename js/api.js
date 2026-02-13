/**
 * MoodFlix API Module
 * Handles all TMDB API interactions
 */

const API = {
    /**
     * Make a request to the TMDB API
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} API response
     */
    async request(endpoint, params = {}) {
        const url = new URL(`${CONFIG.TMDB_BASE_URL}${endpoint}`);
        url.searchParams.append('api_key', CONFIG.TMDB_API_KEY);
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, value);
            }
        });

        try {
            const response = await fetch(url.toString());
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    },

    /**
     * Get poster image URL
     * @param {string} path - Image path from TMDB
     * @param {string} size - Image size (small, medium, large, original)
     * @returns {string} Full image URL
     */
    getPosterUrl(path, size = 'medium') {
        if (!path) {
            return 'https://via.placeholder.com/342x513/1e182a/ffffff?text=No+Poster';
        }
        const sizeValue = CONFIG.IMAGE_SIZES.poster[size] || CONFIG.IMAGE_SIZES.poster.medium;
        return `${CONFIG.TMDB_IMAGE_BASE_URL}/${sizeValue}${path}`;
    },

    /**
     * Get backdrop image URL
     * @param {string} path - Image path from TMDB
     * @param {string} size - Image size (small, medium, large, original)
     * @returns {string} Full image URL
     */
    getBackdropUrl(path, size = 'large') {
        if (!path) {
            return 'https://via.placeholder.com/1280x720/1e182a/ffffff?text=No+Backdrop';
        }
        const sizeValue = CONFIG.IMAGE_SIZES.backdrop[size] || CONFIG.IMAGE_SIZES.backdrop.large;
        return `${CONFIG.TMDB_IMAGE_BASE_URL}/${sizeValue}${path}`;
    },

    /**
     * Get profile image URL
     * @param {string} path - Image path from TMDB
     * @param {string} size - Image size (small, medium, large, original)
     * @returns {string} Full image URL
     */
    getProfileUrl(path, size = 'medium') {
        if (!path) {
            return 'https://via.placeholder.com/185x278/1e182a/ffffff?text=No+Photo';
        }
        const sizeValue = CONFIG.IMAGE_SIZES.profile[size] || CONFIG.IMAGE_SIZES.profile.medium;
        return `${CONFIG.TMDB_IMAGE_BASE_URL}/${sizeValue}${path}`;
    },

    /**
     * Discover movies by genres
     * @param {Array<number>} genreIds - Array of genre IDs
     * @param {number} page - Page number
     * @returns {Promise<Object>} Movie results
     */
    async discoverByGenres(genreIds, page = 1) {
        return this.request('/discover/movie', {
            with_genres: genreIds.join(','),
            sort_by: 'popularity.desc',
            include_adult: false,
            include_video: false,
            page: page,
            'vote_count.gte': 100
        });
    },

    /**
     * Search movies by query
     * @param {string} query - Search query
     * @param {number} page - Page number
     * @returns {Promise<Object>} Search results
     */
    async searchMovies(query, page = 1) {
        return this.request('/search/movie', {
            query: query,
            include_adult: false,
            page: page
        });
    },

    /**
     * Get popular movies
     * @param {number} page - Page number
     * @returns {Promise<Object>} Popular movies
     */
    async getPopularMovies(page = 1) {
        return this.request('/movie/popular', {
            page: page
        });
    },

    /**
     * Get top rated movies
     * @param {number} page - Page number
     * @returns {Promise<Object>} Top rated movies
     */
    async getTopRatedMovies(page = 1) {
        return this.request('/movie/top_rated', {
            page: page
        });
    },

    /**
     * Get movie details
     * @param {number} movieId - Movie ID
     * @returns {Promise<Object>} Movie details
     */
    async getMovieDetails(movieId) {
        return this.request(`/movie/${movieId}`, {
            append_to_response: 'credits,videos,similar'
        });
    },

    /**
     * Get movie credits (cast and crew)
     * @param {number} movieId - Movie ID
     * @returns {Promise<Object>} Movie credits
     */
    async getMovieCredits(movieId) {
        return this.request(`/movie/${movieId}/credits`);
    },

    /**
     * Get movie videos (trailers, teasers, etc.)
     * @param {number} movieId - Movie ID
     * @returns {Promise<Object>} Movie videos
     */
    async getMovieVideos(movieId) {
        return this.request(`/movie/${movieId}/videos`);
    },

    /**
     * Get similar movies
     * @param {number} movieId - Movie ID
     * @param {number} page - Page number
     * @returns {Promise<Object>} Similar movies
     */
    async getSimilarMovies(movieId, page = 1) {
        return this.request(`/movie/${movieId}/similar`, {
            page: page
        });
    },

    /**
     * Get movie recommendations
     * @param {number} movieId - Movie ID
     * @param {number} page - Page number
     * @returns {Promise<Object>} Recommended movies
     */
    async getRecommendations(movieId, page = 1) {
        return this.request(`/movie/${movieId}/recommendations`, {
            page: page
        });
    },

    /**
     * Get genre list
     * @returns {Promise<Object>} Genre list
     */
    async getGenres() {
        return this.request('/genre/movie/list');
    },

    /**
     * Detect genres from mood text
     * @param {string} moodText - User's mood description
     * @returns {Object} Detected genres and keywords
     */
    detectGenresFromMood(moodText) {
        const lowerText = moodText.toLowerCase();
        const detectedGenres = new Set();
        const matchedCategories = [];

        // Check each mood category
        Object.entries(CONFIG.MOOD_KEYWORDS).forEach(([category, data]) => {
            const matchedKeywords = data.keywords.filter(keyword => 
                lowerText.includes(keyword)
            );
            
            if (matchedKeywords.length > 0) {
                matchedCategories.push({
                    category,
                    keywords: matchedKeywords,
                    weight: matchedKeywords.length
                });
                data.genres.forEach(genreId => detectedGenres.add(genreId));
            }
        });

        // Sort by weight (number of matched keywords)
        matchedCategories.sort((a, b) => b.weight - a.weight);

        // If no genres detected, use popular defaults
        if (detectedGenres.size === 0) {
            // Default to popular genres
            detectedGenres.add(28); // Action
            detectedGenres.add(18); // Drama
            detectedGenres.add(35); // Comedy
        }

        const genreIds = Array.from(detectedGenres);
        const genreNames = genreIds.map(id => CONFIG.GENRE_MAP[id] || 'Unknown');

        return {
            genreIds,
            genreNames,
            matchedCategories,
            confidence: matchedCategories.length > 0 ? 
                Math.min(1, matchedCategories.reduce((sum, c) => sum + c.weight, 0) / 5) : 
                0.3
        };
    },

    /**
     * Format movie runtime
     * @param {number} minutes - Runtime in minutes
     * @returns {string} Formatted runtime
     */
    formatRuntime(minutes) {
        if (!minutes) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    },

    /**
     * Get year from release date
     * @param {string} releaseDate - Release date string
     * @returns {string} Year
     */
    getYear(releaseDate) {
        if (!releaseDate) return 'N/A';
        return releaseDate.split('-')[0];
    },

    /**
     * Format rating
     * @param {number} rating - Vote average
     * @returns {string} Formatted rating
     */
    formatRating(rating) {
        if (!rating) return 'N/A';
        return rating.toFixed(1);
    },

    /**
     * Get primary genre name
     * @param {Array} genreIds - Array of genre IDs
     * @returns {string} Primary genre name
     */
    getPrimaryGenre(genreIds) {
        if (!genreIds || genreIds.length === 0) return 'Movie';
        return CONFIG.GENRE_MAP[genreIds[0]] || 'Movie';
    },

    /**
     * Get trailer URL from videos
     * @param {Array} videos - Array of video objects
     * @returns {string|null} YouTube trailer URL
     */
    getTrailerUrl(videos) {
        if (!videos || videos.length === 0) return null;
        
        // Prefer official trailers
        const trailer = videos.find(v => 
            v.type === 'Trailer' && v.site === 'YouTube'
        ) || videos.find(v => 
            v.site === 'YouTube'
        );
        
        return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
    }
};
