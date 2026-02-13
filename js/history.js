/**
 * MoodFlix History Page
 * Handles the search history functionality
 */

const HistoryApp = {
    /**
     * Initialize the history page
     */
    init() {
        this.loadHistory();
        this.bindEvents();
        Storage.updateFavoritesCount();
    },

    /**
     * Load and display search history
     */
    loadHistory() {
        const history = Storage.getHistory();
        const container = document.getElementById('historyList');
        
        if (!container) return;

        if (history.length === 0) {
            container.innerHTML = UI.createEmptyState(
                'No Search History',
                'Start searching for movies by mood to build your history!',
                'history'
            );
            
            // Hide clear button
            const clearBtn = document.getElementById('clearHistoryBtn');
            if (clearBtn) {
                clearBtn.style.display = 'none';
            }
        } else {
            container.innerHTML = history.map((item, index) => 
                this.createHistoryItem(item, index)
            ).join('');
            
            // Show clear button
            const clearBtn = document.getElementById('clearHistoryBtn');
            if (clearBtn) {
                clearBtn.style.display = 'flex';
            }
        }
    },

    /**
     * Create history item HTML
     * @param {Object} item - History item
     * @param {number} index - Item index
     * @returns {string} HTML string
     */
    createHistoryItem(item, index) {
        const date = new Date(item.searchedAt);
        const timeAgo = this.getTimeAgo(date);
        const genreNames = (item.genres || []).map(id => CONFIG.GENRE_MAP[id] || 'Unknown');
        
        return `
            <div class="history-item" data-index="${index}">
                <div class="history-content">
                    <p class="history-mood">"${this.truncateText(item.mood, 150)}"</p>
                    <div class="history-meta">
                        <span class="history-meta-item">
                            <span class="material-symbols-outlined">schedule</span>
                            ${timeAgo}
                        </span>
                        <span class="history-meta-item">
                            <span class="material-symbols-outlined">movie</span>
                            ${item.resultCount || 0} movies found
                        </span>
                    </div>
                    ${genreNames.length > 0 ? `
                        <div class="history-genres">
                            ${genreNames.slice(0, 4).map(name => 
                                `<span class="history-genre">${name}</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="history-actions">
                    <button class="btn-search-again" data-action="search" data-mood="${this.escapeHtml(item.mood)}">
                        <span class="material-symbols-outlined">search</span>
                        Search Again
                    </button>
                    <button class="btn-delete-history" data-action="delete" data-index="${index}" aria-label="Delete">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Get time ago string
     * @param {Date} date - Date object
     * @returns {string} Time ago string
     */
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString();
    },

    /**
     * Truncate text with ellipsis
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Max length
     * @returns {string} Truncated text
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    /**
     * Escape HTML characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Clear History button
        const clearBtn = document.getElementById('clearHistoryBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.handleClearHistory());
        }

        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Event delegation for history actions
        document.addEventListener('click', (e) => this.handleHistoryActions(e));
    },

    /**
     * Handle clear all history
     */
    handleClearHistory() {
        const history = Storage.getHistory();
        
        if (history.length === 0) return;

        if (confirm(`Are you sure you want to clear all ${history.length} search history items?`)) {
            Storage.clearHistory();
            this.loadHistory();
            UI.showToast('Search history cleared');
        }
    },

    /**
     * Handle history item actions
     * @param {Event} e - Click event
     */
    handleHistoryActions(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;

        switch (action) {
            case 'search':
                const mood = target.dataset.mood;
                this.searchAgain(mood);
                break;
            case 'delete':
                const index = parseInt(target.dataset.index);
                this.deleteHistoryItem(index);
                break;
        }
    },

    /**
     * Search again with a saved mood
     * @param {string} mood - Mood text
     */
    searchAgain(mood) {
        // Redirect to home with mood as query parameter
        const encodedMood = encodeURIComponent(mood);
        window.location.href = `index.html?mood=${encodedMood}`;
    },

    /**
     * Delete a single history item
     * @param {number} index - Item index
     */
    deleteHistoryItem(index) {
        const history = Storage.getHistory();
        
        if (index >= 0 && index < history.length) {
            // Remove item
            history.splice(index, 1);
            Storage.saveHistory(history);
            
            // Animate removal
            const item = document.querySelector(`.history-item[data-index="${index}"]`);
            if (item) {
                item.style.transform = 'translateX(100px)';
                item.style.opacity = '0';
                item.style.transition = 'all 0.3s ease';
                setTimeout(() => {
                    this.loadHistory();
                }, 300);
            } else {
                this.loadHistory();
            }
            
            UI.showToast('Search removed from history');
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    HistoryApp.init();
    
    // Check for mood parameter (from search again)
    const urlParams = new URLSearchParams(window.location.search);
    const mood = urlParams.get('mood');
    if (mood) {
        // Redirect to home to handle the search
        window.location.href = `index.html?mood=${encodeURIComponent(mood)}`;
    }
});
