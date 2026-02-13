/**
 * MoodFlix Storage Module
 * Handles localStorage operations for favorites and history
 */

const Storage = {
    KEYS: {
        FAVORITES: 'moodflix_favorites',
        HISTORY: 'moodflix_history',
        SETTINGS: 'moodflix_settings'
    },

    /**
     * Get all favorites from localStorage
     * @returns {Array} Array of favorite movies
     */
    getFavorites() {
        try {
            const favorites = localStorage.getItem(this.KEYS.FAVORITES);
            return favorites ? JSON.parse(favorites) : [];
        } catch (error) {
            console.error('Error reading favorites:', error);
            return [];
        }
    },

    /**
     * Save favorites to localStorage
     * @param {Array} favorites - Array of favorite movies
     */
    saveFavorites(favorites) {
        try {
            localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(favorites));
            this.updateFavoritesCount();
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    },

    /**
     * Add a movie to favorites
     * @param {Object} movie - Movie object to add
     * @returns {boolean} Success status
     */
    addFavorite(movie) {
        const favorites = this.getFavorites();
        
        // Check if already exists
        if (favorites.some(fav => fav.id === movie.id)) {
            return false;
        }
        
        // Check max limit
        if (favorites.length >= CONFIG.SETTINGS.maxFavorites) {
            return false;
        }
        
        // Add with timestamp
        favorites.unshift({
            ...movie,
            addedAt: Date.now()
        });
        
        this.saveFavorites(favorites);
        return true;
    },

    /**
     * Remove a movie from favorites
     * @param {number} movieId - Movie ID to remove
     * @returns {boolean} Success status
     */
    removeFavorite(movieId) {
        const favorites = this.getFavorites();
        const newFavorites = favorites.filter(fav => fav.id !== movieId);
        
        if (newFavorites.length === favorites.length) {
            return false;
        }
        
        this.saveFavorites(newFavorites);
        return true;
    },

    /**
     * Check if a movie is in favorites
     * @param {number} movieId - Movie ID to check
     * @returns {boolean} Whether the movie is in favorites
     */
    isFavorite(movieId) {
        const favorites = this.getFavorites();
        return favorites.some(fav => fav.id === movieId);
    },

    /**
     * Clear all favorites
     */
    clearFavorites() {
        this.saveFavorites([]);
    },

    /**
     * Get favorites count
     * @returns {number} Number of favorites
     */
    getFavoritesCount() {
        return this.getFavorites().length;
    },

    /**
     * Update favorites count in the UI
     */
    updateFavoritesCount() {
        const count = this.getFavoritesCount();
        const countElements = document.querySelectorAll('#favoritesCount');
        countElements.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-flex' : 'none';
        });
    },

    /**
     * Get search history
     * @returns {Array} Array of search history items
     */
    getHistory() {
        try {
            const history = localStorage.getItem(this.KEYS.HISTORY);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error reading history:', error);
            return [];
        }
    },

    /**
     * Save search history
     * @param {Array} history - Array of history items
     */
    saveHistory(history) {
        try {
            localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
        } catch (error) {
            console.error('Error saving history:', error);
        }
    },

    /**
     * Add a search to history
     * @param {Object} searchData - Search data to add
     */
    addToHistory(searchData) {
        const history = this.getHistory();
        
        // Add new search at the beginning
        history.unshift({
            ...searchData,
            searchedAt: Date.now()
        });
        
        // Limit history size
        if (history.length > CONFIG.SETTINGS.maxHistory) {
            history.pop();
        }
        
        this.saveHistory(history);
    },

    /**
     * Clear search history
     */
    clearHistory() {
        this.saveHistory([]);
    },

    /**
     * Get app settings
     * @returns {Object} Settings object
     */
    getSettings() {
        try {
            const settings = localStorage.getItem(this.KEYS.SETTINGS);
            return settings ? JSON.parse(settings) : {};
        } catch (error) {
            console.error('Error reading settings:', error);
            return {};
        }
    },

    /**
     * Save app settings
     * @param {Object} settings - Settings to save
     */
    saveSettings(settings) {
        try {
            const currentSettings = this.getSettings();
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify({
                ...currentSettings,
                ...settings
            }));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }
};

// Initialize favorites count on page load
document.addEventListener('DOMContentLoaded', () => {
    Storage.updateFavoritesCount();
});
