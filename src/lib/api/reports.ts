// API functions for reports/denuncias system
import { directus } from '@/lib/directus';
import { readItems, createItem, updateItem, deleteItem, readItem } from '@directus/sdk';

export interface Report {
    id: string;
    profile_id: string;
    reported_by?: string | null; // User ID
    type: 'fake' | 'inappropriate' | 'spam' | 'harassment' | 'minor' | 'other';
    description: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    reviewed_by?: string | null;
    reviewed_at?: string | null;
    date_created: string;
    date_updated: string;
}

export interface ReportWithProfile extends Report {
    reported_profile?: {
        id: string;
        display_name: string | null;
        ad_id?: string | null;
    };
    reporter_profile?: {
        id: string;
        email?: string;
    } | null;
}

/**
 * Get all reports with optional filters
 */
export async function getReports(filters?: {
    status?: Report['status'];
    type?: Report['type'];
    profileId?: string;
    limit?: number;
    offset?: number;
}): Promise<ReportWithProfile[]> {
    try {
        const filter: any = {};
        const filterAnd: any[] = [];

        if (filters?.status) filterAnd.push({ status: { _eq: filters.status } });
        if (filters?.type) filterAnd.push({ type: { _eq: filters.type } });
        if (filters?.profileId) filterAnd.push({ profile_id: { _eq: filters.profileId } });

        if (filterAnd.length > 0) {
            filter._and = filterAnd;
        }

        const limit = filters?.limit || 10;
        const page = filters?.offset ? Math.floor(filters.offset / limit) + 1 : 1;

        // Fetch reports with Directus
        // We can fetch related profiles if relationships are set up, but let's assume we need manual fetching for robust migration like before
        const result = await directus.request(readItems('reports', {
            filter,
            sort: ['-date_created'],
            limit,
            page
        }));

        const reportsWithProfiles = await Promise.all(result.map(async (report: any) => {
            let reportedProfile = null;
            let reporterProfile = null;

            try {
                if (report.profile_id) {
                    const p: any = await directus.request(readItem('profiles', report.profile_id));
                    reportedProfile = { id: p.id, display_name: p.display_name, ad_id: p.ad_id };
                }
            } catch (e) { /* ignore missing profile */ }

            try {
                if (report.reported_by) {
                    // Assuming reported_by is profile ID or User ID. PocketBase code fetched 'profiles'.
                    // Let's assume it references a profile ID.
                    const p: any = await directus.request(readItem('profiles', report.reported_by));
                    reporterProfile = { id: p.id, email: p.email }; // Profile usually doesn't have email in public return?
                }
            } catch (e) { /* ignore missing reporter */ }

            return {
                ...report,
                reported_profile: reportedProfile,
                reporter_profile: reporterProfile,
            } as ReportWithProfile;
        }));

        return reportsWithProfiles;
    } catch (err: any) {
        console.warn('Error fetching reports from Directus, using localStorage:', err);
        return getReportsFromLocalStorage(filters);
    }
}

/**
 * Get a single report by ID
 */
export async function getReportById(reportId: string): Promise<ReportWithProfile | null> {
    try {
        const report: any = await directus.request(readItem('reports', reportId));

        let reportedProfile = null;
        let reporterProfile = null;

        try {
            if (report.profile_id) {
                const p: any = await directus.request(readItem('profiles', report.profile_id));
                reportedProfile = { id: p.id, display_name: p.display_name, ad_id: p.ad_id };
            }
        } catch (e) { /* ignore */ }

        try {
            if (report.reported_by) {
                const p: any = await directus.request(readItem('profiles', report.reported_by));
                reporterProfile = { id: p.id, email: p.email };
            }
        } catch (e) { /* ignore */ }

        return {
            ...report,
            reported_profile: reportedProfile,
            reporter_profile: reporterProfile,
        } as ReportWithProfile;
    } catch (err: any) {
        console.warn('Error fetching report from Directus, using localStorage:', err);
        const reports = getReportsFromLocalStorage();
        return reports.find(r => r.id === reportId) || null;
    }
}

/**
 * Create a new report
 */
export async function createReport(report: Omit<Report, 'id' | 'date_created' | 'date_updated'>): Promise<{ success: boolean; data?: Report; error?: string }> {
    try {
        const data = await directus.request(createItem('reports', report));
        saveReportToLocalStorage(data as Report);
        return { success: true, data: data as Report };
    } catch (err: any) {
        console.warn('Error creating report in Directus, using localStorage:', err);

        // Fallback
        const newReport: Report = {
            ...report,
            id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: report.status || 'pending',
            date_created: new Date().toISOString(),
            date_updated: new Date().toISOString(),
        };

        saveReportToLocalStorage(newReport);
        return { success: true, data: newReport };
    }
}

/**
 * Update a report
 */
export async function updateReport(
    reportId: string,
    updates: Partial<Report>
): Promise<{ success: boolean; data?: Report; error?: string }> {
    try {
        const data = await directus.request(updateItem('reports', reportId, updates));
        updateReportInLocalStorage(reportId, data as Report);
        return { success: true, data: data as Report };
    } catch (err: any) {
        console.warn('Error updating report in Directus, using localStorage:', err);

        const reports = getReportsFromLocalStorage();
        const index = reports.findIndex(r => r.id === reportId);
        if (index === -1) {
            return { success: false, error: 'Report not found' };
        }

        const updatedReport = {
            ...reports[index],
            ...updates,
            date_updated: new Date().toISOString(),
        };

        updateReportInLocalStorage(reportId, updatedReport);
        return { success: true, data: updatedReport };
    }
}

/**
 * Delete a report
 */
export async function deleteReport(reportId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await directus.request(deleteItem('reports', reportId));
        deleteReportFromLocalStorage(reportId);
        return { success: true };
    } catch (err: any) {
        console.warn('Error deleting report from Directus, using localStorage:', err);
        deleteReportFromLocalStorage(reportId);
        return { success: true };
    }
}

// LocalStorage fallback functions
function getReportsFromLocalStorage(filters?: {
    status?: Report['status'];
    type?: Report['type'];
    profileId?: string;
}): ReportWithProfile[] {
    const stored = localStorage.getItem('spotgp_reports');
    if (!stored) return [];

    let reports: Report[] = JSON.parse(stored);

    if (filters?.status) {
        reports = reports.filter(r => r.status === filters.status);
    }
    if (filters?.type) {
        reports = reports.filter(r => r.type === filters.type);
    }
    if (filters?.profileId) {
        reports = reports.filter(r => r.profile_id === filters.profileId);
    }

    return reports as ReportWithProfile[];
}

function saveReportToLocalStorage(report: Report): void {
    const reports = getReportsFromLocalStorage();
    const existingIndex = reports.findIndex(r => r.id === report.id);

    if (existingIndex >= 0) {
        reports[existingIndex] = report;
    } else {
        reports.push(report);
    }

    localStorage.setItem('spotgp_reports', JSON.stringify(reports));
}

function updateReportInLocalStorage(reportId: string, updates: Partial<Report>): void {
    const reports = getReportsFromLocalStorage();
    const index = reports.findIndex(r => r.id === reportId);

    if (index >= 0) {
        reports[index] = { ...reports[index], ...updates };
        localStorage.setItem('spotgp_reports', JSON.stringify(reports));
    }
}

function deleteReportFromLocalStorage(reportId: string): void {
    const reports = getReportsFromLocalStorage();
    const filtered = reports.filter(r => r.id !== reportId);
    localStorage.setItem('spotgp_reports', JSON.stringify(filtered));
}
