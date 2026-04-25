/**
 * Global Theme Management & Utilities
 * Handles theme persistence, switching, and DOM initialization
 */

const ThemeManager = (() => {
  const STORAGE_KEY = 'theme-preference';
  const THEME_ATTRIBUTE = 'data-theme';
  const DARK_THEME = 'dark';
  const LIGHT_THEME = 'light';
  const MOON_EMOJI = '🌙';
  const SUN_EMOJI = '☀️';

  /**
   * Get system color scheme preference
   */
  const getSystemPreference = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return DARK_THEME;
    }
    return LIGHT_THEME;
  };

  /**
   * Get current theme from localStorage or system preference
   */
  const getCurrentTheme = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return getSystemPreference();
  };

  /**
   * Apply theme to document root
   */
  const applyTheme = (theme) => {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
    document.documentElement.style.colorScheme = theme;
  };

  /**
   * Update all theme toggle button emojis
   */
  const updateToggleButtons = (theme) => {
    const buttons = document.querySelectorAll('button[id="themeToggle"]');
    const emoji = theme === DARK_THEME ? SUN_EMOJI : MOON_EMOJI;
    buttons.forEach((button) => {
      button.textContent = emoji;
      button.setAttribute('aria-label', `Switch to ${theme === DARK_THEME ? 'light' : 'dark'} mode`);
    });
  };

  /**
   * Set theme and persist to localStorage
   */
  const setTheme = (theme) => {
    if (![DARK_THEME, LIGHT_THEME].includes(theme)) {
      console.warn(`Invalid theme: ${theme}. Using ${LIGHT_THEME}`);
      theme = LIGHT_THEME;
    }

    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
    updateToggleButtons(theme);

    // Dispatch custom event for other parts of app to listen to
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  };

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = () => {
    const current = getCurrentTheme();
    const next = current === DARK_THEME ? LIGHT_THEME : DARK_THEME;
    setTheme(next);
  };

  /**
   * Attach click handlers to theme toggle buttons
   */
  const initializeToggleButtons = () => {
    const buttons = document.querySelectorAll('button[id="themeToggle"]');
    buttons.forEach((button) => {
      button.removeEventListener('click', toggleTheme);
      button.addEventListener('click', toggleTheme);
    });
  };

  /**
   * Initialize theme management on DOM ready
   */
  const initialize = () => {
    const theme = getCurrentTheme();

    // Add transition class to avoid flash on first load
    document.documentElement.classList.add('theme-transition-ready');

    // Apply theme and update buttons
    applyTheme(theme);
    updateToggleButtons(theme);

    // Initialize event listeners
    initializeToggleButtons();

    // Watch for dynamically added toggle buttons
    if (window.MutationObserver) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length) {
            initializeToggleButtons();
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  };

  /**
   * Public API
   */
  return {
    getCurrentTheme,
    setTheme,
    toggleTheme,
    initialize,
  };
})();

/**
 * Initialize when DOM is ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.initialize();
  });
} else {
  ThemeManager.initialize();
}

/**
 * Listen for system theme preference changes
 */
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only apply system preference if user hasn't set a preference
    if (!localStorage.getItem('theme-preference')) {
      ThemeManager.setTheme(e.matches ? 'dark' : 'light');
    }
  });
}
