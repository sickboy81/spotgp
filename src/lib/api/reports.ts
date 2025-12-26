// API functions for reports/denuncias system
// Prepared for database integration - currently using localStorage simulation with Supabase integration ready

import { supabase } from '../supabase';
import { Database } from '../../types/supabase';

type Report = Database['public']['Tables']['reports']['Row'];
type ReportInsert = Database['public']['Tables']['reports']['Insert'];
type ReportUpdate = Database['public']['Tables']['reports']['Update'];

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
        // Try Supabase first
        let query = supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.type) {
            query = query.eq('type', filters.type);
        }
        if (filters?.profileId) {
            query = query.eq('profile_id', filters.profileId);
        }
        if (filters?.limit) {
            query = query.limit(filters.limit);
        }
        if (filters?.offset) {
            query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        if (data && data.length > 0) {
            // Fetch related profile data
            const reportsWithProfiles = await Promise.all(data.map(async (report) => {
                const [reportedProfile, reporterProfile] = await Promise.all([
                    supabase.from('profiles').select('id, display_name, ad_id').eq('id', report.profile_id).single().catch(() => ({ data: null })),
                    report.reported_by ? supabase.from('profiles').select('id').eq('id', report.reported_by).single().catch(() => ({ data: null })) : Promise.resolve({ data: null })
                ]);
                
                return {
                    ...report,
                    reported_profile: reportedProfile.data,
                    reporter_profile: reporterProfile.data,
                } as ReportWithProfile;
            }));
            
            return reportsWithProfiles;
        }

        // Fallback to localStorage if no data
        return getReportsFromLocalStorage(filters);
    } catch (err: any) {
        console.warn('Error fetching reports from Supabase, using localStorage:', err);
        return getReportsFromLocalStorage(filters);
    }
}

/**
 * Get a single report by ID
 */
export async function getReportById(reportId: string): Promise<ReportWithProfile | null> {
    try {
        const { data: report, error } = await supabase
            .from('reports')
            .select('*')
            .eq('id', reportId)
            .single();

        if (error) throw error;
        if (!report) return null;

        // Fetch related profile data
        const [reportedProfile, reporterProfile] = await Promise.all([
            supabase.from('profiles').select('id, display_name, ad_id').eq('id', report.profile_id).single().catch(() => ({ data: null })),
            report.reported_by ? supabase.from('profiles').select('id').eq('id', report.reported_by).single().catch(() => ({ data: null })) : Promise.resolve({ data: null })
        ]);

        return {
            ...report,
            reported_profile: reportedProfile.data,
            reporter_profile: reporterProfile.data,
        } as ReportWithProfile;
    } catch (err: any) {
        console.warn('Error fetching report from Supabase, using localStorage:', err);
        const reports = getReportsFromLocalStorage();
        return reports.find(r => r.id === reportId) || null;
    }
}

/**
 * Create a new report
 */
export async function createReport(report: ReportInsert): Promise<{ success: boolean; data?: Report; error?: string }> {
    try {
        // Try Supabase first
        const { data, error } = await supabase
            .from('reports')
            .insert(report)
            .select()
            .single();

        if (error) throw error;

        // Also save to localStorage as backup
        saveReportToLocalStorage(data);

        return { success: true, data };
    } catch (err: any) {
        console.warn('Error creating report in Supabase, using localStorage:', err);
        
        // Fallback to localStorage
        const newReport: Report = {
            ...report as any,
            id: report.id || `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: report.status || 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
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
    updates: ReportUpdate
): Promise<{ success: boolean; data?: Report; error?: string }> {
    try {
        const updateData = {
            ...updates,
            updated_at: new Date().toISOString(),
        };

        // Try Supabase first
        const { data, error } = await supabase
            .from('reports')
            .update(updateData)
            .eq('id', reportId)
            .select()
            .single();

        if (error) throw error;

        // Update localStorage as backup
        updateReportInLocalStorage(reportId, data);

        return { success: true, data };
    } catch (err: any) {
        console.warn('Error updating report in Supabase, using localStorage:', err);
        
        // Fallback to localStorage
        const reports = getReportsFromLocalStorage();
        const index = reports.findIndex(r => r.id === reportId);
        if (index === -1) {
            return { success: false, error: 'Report not found' };
        }

        const updatedReport = {
            ...reports[index],
            ...updates,
            updated_at: new Date().toISOString(),
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
        const { error } = await supabase
            .from('reports')
            .delete()
            .eq('id', reportId);

        if (error) throw error;

        // Remove from localStorage
        deleteReportFromLocalStorage(reportId);

        return { success: true };
    } catch (err: any) {
        console.warn('Error deleting report from Supabase, using localStorage:', err);
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
    const stored = localStorage.getItem('saphira_reports');
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

    localStorage.setItem('saphira_reports', JSON.stringify(reports));
}

function updateReportInLocalStorage(reportId: string, updates: Partial<Report>): void {
    const reports = getReportsFromLocalStorage();
    const index = reports.findIndex(r => r.id === reportId);
    
    if (index >= 0) {
        reports[index] = { ...reports[index], ...updates };
        localStorage.setItem('saphira_reports', JSON.stringify(reports));
    }
}

function deleteReportFromLocalStorage(reportId: string): void {
    const reports = getReportsFromLocalStorage();
    const filtered = reports.filter(r => r.id !== reportId);
    localStorage.setItem('saphira_reports', JSON.stringify(filtered));
}

