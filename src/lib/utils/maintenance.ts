/**
 * Maintenance mode utilities
 */

const MAINTENANCE_KEY = 'site_maintenance_mode';
const MAINTENANCE_MESSAGE_KEY = 'site_maintenance_message';

export interface MaintenanceSettings {
    enabled: boolean;
    message: string;
}

/**
 * Get current maintenance mode status
 */
export function getMaintenanceMode(): MaintenanceSettings {
    try {
        const enabled = localStorage.getItem(MAINTENANCE_KEY) === 'true';
        const message = localStorage.getItem(MAINTENANCE_MESSAGE_KEY) || 
            'O site está temporariamente em manutenção. Volte em breve.';
        return { enabled, message };
    } catch {
        return { enabled: false, message: 'O site está temporariamente em manutenção. Volte em breve.' };
    }
}

/**
 * Set maintenance mode
 */
export function setMaintenanceMode(enabled: boolean, message?: string): void {
    try {
        localStorage.setItem(MAINTENANCE_KEY, enabled ? 'true' : 'false');
        if (message) {
            localStorage.setItem(MAINTENANCE_MESSAGE_KEY, message);
        }
    } catch (error) {
        console.error('Error setting maintenance mode:', error);
    }
}

/**
 * Check if maintenance mode is enabled
 */
export function isMaintenanceModeEnabled(): boolean {
    return getMaintenanceMode().enabled;
}






