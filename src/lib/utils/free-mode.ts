/**
 * Free mode utilities
 * Controls if the site is in free mode (all features available without payment)
 */

const FREE_MODE_KEY = 'site_free_mode';

/**
 * Check if site is in free mode
 */
export function isFreeModeEnabled(): boolean {
    try {
        const stored = localStorage.getItem(FREE_MODE_KEY);
        // Default to true (free mode) if not set
        if (stored === null) return true;
        return stored === 'true';
    } catch {
        return true; // Default to free mode on error
    }
}

/**
 * Set free mode status
 */
export function setFreeMode(enabled: boolean): void {
    try {
        localStorage.setItem(FREE_MODE_KEY, enabled ? 'true' : 'false');
    } catch (error) {
        console.error('Error setting free mode:', error);
    }
}

/**
 * Check if user has access (always true in free mode)
 */
export function hasAccess(): boolean {
    return isFreeModeEnabled();
}

