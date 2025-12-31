// API functions for reports/denuncias system
import { pb } from '@/lib/pocketbase';

export interface Report {
    id: string;
    profile_id: string;
    reported_by?: string | null; // User ID
    type: 'fake' | 'inappropriate' | 'spam' | 'harassment' | 'minor' | 'other';
    description: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    reviewed_by?: string | null;
    reviewed_at?: string | null;
    created: string;
    updated: string;
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
        const filterParts: string[] = [];
        if (filters?.status) filterParts.push(`status = "${filters.status}"`);
        if (filters?.type) filterParts.push(`type = "${filters.type}"`);
        if (filters?.profileId) filterParts.push(`profile_id = "${filters.profileId}"`);

        const page = filters?.offset ? Math.floor(filters.offset / (filters.limit || 10)) + 1 : 1;
        const perPage = filters?.limit || 10;

        // Fetch reports
        const result = await pb.collection('reports').getList<Report>(page, perPage, {
            filter: filterParts.join(' && '),
            sort: '-created',
        });

        // Fetch related profiles manually to ensure we get what we need regardless of DB relation setup
        // In a mature PB setup, we would use 'expand'
        const reportsWithProfiles = await Promise.all(result.items.map(async (report) => {
            let reportedProfile = null;
            let reporterProfile = null;

            try {
                if (report.profile_id) {
                    const p = await pb.collection('profiles').getOne(report.profile_id);
                    reportedProfile = { id: p.id, display_name: p.display_name, ad_id: p.ad_id };
                }
            } catch (e) { /* ignore missing profile */ }

            try {
                if (report.reported_by) {
                    const p = await pb.collection('profiles').getOne(report.reported_by); // or users
                    reporterProfile = { id: p.id, email: (p as any).email };
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
        console.warn('Error fetching reports from PocketBase, using localStorage:', err);
        return getReportsFromLocalStorage(filters);
    }
}

/**
 * Get a single report by ID
 */
export async function getReportById(reportId: string): Promise<ReportWithProfile | null> {
    try {
        const report = await pb.collection('reports').getOne<Report>(reportId);

        let reportedProfile = null;
        let reporterProfile = null;

        try {
            if (report.profile_id) {
                const p = await pb.collection('profiles').getOne(report.profile_id);
                reportedProfile = { id: p.id, display_name: p.display_name, ad_id: p.ad_id };
            }
        } catch (e) { /* ignore */ }

        try {
            if (report.reported_by) {
                const p = await pb.collection('profiles').getOne(report.reported_by);
                reporterProfile = { id: p.id, email: (p as any).email };
            }
        } catch (e) { /* ignore */ }

        return {
            ...report,
            reported_profile: reportedProfile,
            reporter_profile: reporterProfile,
        } as ReportWithProfile;
    } catch (err: any) {
        console.warn('Error fetching report from PocketBase, using localStorage:', err);
        const reports = getReportsFromLocalStorage();
        return reports.find(r => r.id === reportId) || null;
    }
}

/**
 * Create a new report
 */
export async function createReport(report: Omit<Report, 'id' | 'created' | 'updated'>): Promise<{ success: boolean; data?: Report; error?: string }> {
    try {
        const data = await pb.collection('reports').create<Report>(report);
        saveReportToLocalStorage(data);
        return { success: true, data };
    } catch (err: any) {
        console.warn('Error creating report in PocketBase, using localStorage:', err);

        // Fallback
        const newReport: Report = {
            ...report,
            id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: report.status || 'pending',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
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
        const data = await pb.collection('reports').update<Report>(reportId, updates);
        updateReportInLocalStorage(reportId, data);
        return { success: true, data };
    } catch (err: any) {
        console.warn('Error updating report in PocketBase, using localStorage:', err);

        const reports = getReportsFromLocalStorage();
        const index = reports.findIndex(r => r.id === reportId);
        if (index === -1) {
            return { success: false, error: 'Report not found' };
        }

        const updatedReport = {
            ...reports[index],
            ...updates,
            updated: new Date().toISOString(),
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
        await pb.collection('reports').delete(reportId);
        deleteReportFromLocalStorage(reportId);
        return { success: true };
    } catch (err: any) {
        console.warn('Error deleting report from PocketBase, using localStorage:', err);
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
