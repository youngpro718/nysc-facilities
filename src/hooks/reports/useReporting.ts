/**
 * Reporting React Query Hooks
 * Phase 4: Advanced reporting capabilities
 * Handles report generation, downloads, and scheduling
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import {
  ReportGenerationService,
  type ReportConfig,
  type GeneratedReport,
  type LightingAuditorReportOptions,
} from '@/services/reports/reportGenerationService';

// Query keys for reports
export const REPORTS_QUERY_KEYS = {
  reports: {
    all: ['reports'] as const,
    generated: () => ['reports', 'generated'] as const,
    scheduled: () => ['reports', 'scheduled'] as const,
  },
} as const;

/**
 * Hook for generating facility reports
 * Handles the report generation process with loading states
 */
export function useGenerateReport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateReportMutation = useMutation({
    mutationFn: async (config: ReportConfig) => {
      setIsGenerating(true);
      setProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      try {
        const report = await ReportGenerationService.generateFacilityReport(config);
        setProgress(100);
        return report;
      } finally {
        clearInterval(progressInterval);
        setTimeout(() => {
          setIsGenerating(false);
          setProgress(0);
        }, 500);
      }
    },
    onError: (error) => {
      console.error('Error generating report:', error);
      setIsGenerating(false);
      setProgress(0);
    },
  });

  return {
    generateReport: generateReportMutation.mutate,
    generateReportAsync: generateReportMutation.mutateAsync,
    isGenerating: isGenerating || generateReportMutation.isPending,
    progress,
    error: generateReportMutation.error,
    data: generateReportMutation.data,
    reset: generateReportMutation.reset,
  };
}

/**
 * Hook for generating maintenance reports
 * Specialized hook for maintenance-focused reports
 */
export function useGenerateMaintenanceReport() {
  const generateReportMutation = useMutation({
    mutationFn: (buildingId?: string) => 
      ReportGenerationService.generateMaintenanceReport(buildingId),
  });

  return {
    generateMaintenanceReport: generateReportMutation.mutate,
    generateMaintenanceReportAsync: generateReportMutation.mutateAsync,
    isGenerating: generateReportMutation.isPending,
    error: generateReportMutation.error,
    data: generateReportMutation.data,
    reset: generateReportMutation.reset,
  };
}

/**
 * Hook for generating energy efficiency reports
 * Specialized hook for energy-focused reports
 */
export function useGenerateEnergyReport() {
  const generateReportMutation = useMutation({
    mutationFn: (buildingId?: string) => 
      ReportGenerationService.generateEnergyReport(buildingId),
  });

  return {
    generateEnergyReport: generateReportMutation.mutate,
    generateEnergyReportAsync: generateReportMutation.mutateAsync,
    isGenerating: generateReportMutation.isPending,
    error: generateReportMutation.error,
    data: generateReportMutation.data,
    reset: generateReportMutation.reset,
  };
}

/**
 * Hook for generating utilization reports
 * Specialized hook for space utilization reports
 */
export function useGenerateUtilizationReport() {
  const generateReportMutation = useMutation({
    mutationFn: ({ buildingId, dateRange }: { 
      buildingId?: string; 
      dateRange?: { start: string; end: string } 
    }) => ReportGenerationService.generateUtilizationReport(buildingId, dateRange),
  });

  return {
    generateUtilizationReport: generateReportMutation.mutate,
    generateUtilizationReportAsync: generateReportMutation.mutateAsync,
    isGenerating: generateReportMutation.isPending,
    error: generateReportMutation.error,
    data: generateReportMutation.data,
    reset: generateReportMutation.reset,
  };
}

/**
 * Hook for exporting dashboard data to CSV
 * Quick export functionality for dashboard data
 */
export function useExportDashboardCSV() {
  const exportMutation = useMutation({
    mutationFn: (buildingId?: string) => 
      ReportGenerationService.exportDashboardCSV(buildingId),
  });

  const downloadCSV = useCallback((report: GeneratedReport) => {
    if (report.format !== 'csv' || !report.data) {
      console.error('Invalid CSV report data');
      return;
    }

    // Create download link
    const blob = new Blob([report.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, []);

  return {
    exportCSV: exportMutation.mutate,
    exportCSVAsync: exportMutation.mutateAsync,
    downloadCSV,
    isExporting: exportMutation.isPending,
    error: exportMutation.error,
    data: exportMutation.data,
    reset: exportMutation.reset,
  };
}

/**
 * Hook for scheduling reports
 * Handles automatic report generation and delivery
 */
export function useScheduleReport() {
  const scheduleReportMutation = useMutation({
    mutationFn: (config: ReportConfig & { 
      schedule: 'daily' | 'weekly' | 'monthly';
      recipients: string[];
    }) => ReportGenerationService.scheduleReport(config),
  });

  return {
    scheduleReport: scheduleReportMutation.mutate,
    scheduleReportAsync: scheduleReportMutation.mutateAsync,
    isScheduling: scheduleReportMutation.isPending,
    error: scheduleReportMutation.error,
    data: scheduleReportMutation.data,
    reset: scheduleReportMutation.reset,
  };
}

/**
 * Hook for report download functionality
 * Handles downloading generated reports in various formats
 */
export function useReportDownload() {
  const downloadReport = useCallback((report: GeneratedReport) => {
    if (!report.data) {
      console.error('No report data available for download');
      return;
    }

    let mimeType: string;
    let fileExtension: string;

    switch (report.format) {
      case 'pdf':
        mimeType = 'application/pdf';
        fileExtension = 'pdf';
        break;
      case 'csv':
        mimeType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'json':
        mimeType = 'application/json';
        fileExtension = 'json';
        break;
      default:
        console.error(`Unsupported report format: ${report.format}`);
        return;
    }

    // Create download link
    const blob = new Blob([report.data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, []);

  const previewReport = useCallback((report: GeneratedReport) => {
    if (report.format === 'json' || report.format === 'csv') {
      // Open in new window for preview
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`<pre>${report.data}</pre>`);
        newWindow.document.title = report.title;
      }
    } else if (report.format === 'pdf') {
      // For PDF, would typically use a PDF viewer
      console.log('PDF preview would open here');
    }
  }, []);

  return {
    downloadReport,
    previewReport,
  };
}

/**
 * Hook for Lighting Auditor Export
 * Triggers lighting auditor report generation (CSV, PDF, JSON) and provides download helpers
 */
export function useLightingAuditorExport() {
  const mutation = useMutation({
    mutationFn: (options: LightingAuditorReportOptions) =>
      ReportGenerationService.generateLightingAuditorReport(options),
  });

  const { downloadReport } = useReportDownload();

  const exportAndDownload = useCallback(async (options: LightingAuditorReportOptions) => {
    const report = await mutation.mutateAsync(options);
    if (report) downloadReport(report);
    return report;
  }, [mutation, downloadReport]);

  return {
    exportLightingAudit: mutation.mutate,
    exportLightingAuditAsync: mutation.mutateAsync,
    exportAndDownload,
    isExporting: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    downloadReport,
  };
}

/**
 * Hook for comprehensive reporting dashboard
 * Provides all reporting functionality in one place
 */
export function useReportingDashboard() {
  const { generateReport, isGenerating, progress, data: generatedReport, error: generateError } = useGenerateReport();
  const { generateMaintenanceReport, isGenerating: isGeneratingMaintenance } = useGenerateMaintenanceReport();
  const { generateEnergyReport, isGenerating: isGeneratingEnergy } = useGenerateEnergyReport();
  const { generateUtilizationReport, isGenerating: isGeneratingUtilization } = useGenerateUtilizationReport();
  const { exportCSVAsync, downloadCSV, isExporting } = useExportDashboardCSV();
  const { scheduleReport, isScheduling } = useScheduleReport();
  const { downloadReport, previewReport } = useReportDownload();

  // Quick report generators
  const generateQuickMaintenanceReport = useCallback((buildingId?: string) => {
    generateMaintenanceReport(buildingId);
  }, [generateMaintenanceReport]);

  const generateQuickEnergyReport = useCallback((buildingId?: string) => {
    generateEnergyReport(buildingId);
  }, [generateEnergyReport]);

  const generateQuickUtilizationReport = useCallback((
    buildingId?: string,
    dateRange?: { start: string; end: string }
  ) => {
    generateUtilizationReport({ buildingId, dateRange });
  }, [generateUtilizationReport]);

  const exportQuickCSV = useCallback(async (buildingId?: string) => {
    try {
      const report = await exportCSVAsync(buildingId);
      if (report) {
        downloadCSV(report);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  }, [exportCSVAsync, downloadCSV]);

  // Custom report generator
  const generateCustomReport = useCallback((config: Partial<ReportConfig>) => {
    const fullConfig: ReportConfig = {
      title: config.title || 'Custom Facility Report',
      subtitle: config.subtitle,
      buildingId: config.buildingId,
      dateRange: config.dateRange,
      format: config.format || 'pdf',
      includeCharts: config.includeCharts ?? true,
      includeRecommendations: config.includeRecommendations ?? true,
      sections: config.sections || [
        { id: 'summary', title: 'Executive Summary', type: 'summary' },
        { id: 'utilization', title: 'Space Utilization', type: 'analytics' },
        { id: 'maintenance', title: 'Maintenance Status', type: 'table' },
        { id: 'recommendations', title: 'Recommendations', type: 'recommendations' },
      ],
    };

    generateReport(fullConfig);
  }, [generateReport]);

  const isAnyReportGenerating = isGenerating || isGeneratingMaintenance || 
                                 isGeneratingEnergy || isGeneratingUtilization || 
                                 isExporting || isScheduling;

  return {
    // Report generation
    generateCustomReport,
    generateQuickMaintenanceReport,
    generateQuickEnergyReport,
    generateQuickUtilizationReport,
    
    // CSV export
    exportQuickCSV,
    
    // Report management
    downloadReport,
    previewReport,
    scheduleReport,
    
    // State
    isGenerating: isAnyReportGenerating,
    progress,
    generatedReport,
    error: generateError,
  };
}

/**
 * Hook for report templates
 * Provides pre-configured report templates
 */
export function useReportTemplates() {
  const templates = {
    comprehensive: {
      title: 'Comprehensive Facility Report',
      subtitle: 'Complete facility analysis and recommendations',
      format: 'pdf' as const,
      includeCharts: true,
      includeRecommendations: true,
      sections: [
        { id: 'executive-summary', title: 'Executive Summary', type: 'summary' as const },
        { id: 'utilization-analysis', title: 'Space Utilization Analysis', type: 'analytics' as const },
        { id: 'maintenance-status', title: 'Maintenance Status', type: 'table' as const },
        { id: 'issue-analysis', title: 'Issue Analysis', type: 'analytics' as const },
        { id: 'energy-efficiency', title: 'Energy Efficiency', type: 'analytics' as const },
        { id: 'recommendations', title: 'Optimization Recommendations', type: 'recommendations' as const },
      ],
    },
    
    maintenance: {
      title: 'Maintenance Priority Report',
      subtitle: 'Focus on maintenance needs and scheduling',
      format: 'pdf' as const,
      sections: [
        { id: 'maintenance-summary', title: 'Maintenance Overview', type: 'summary' as const },
        { id: 'priority-list', title: 'Priority Maintenance List', type: 'table' as const },
        { id: 'maintenance-recommendations', title: 'Maintenance Recommendations', type: 'recommendations' as const },
      ],
    },
    
    utilization: {
      title: 'Space Utilization Report',
      subtitle: 'Occupancy patterns and space optimization',
      format: 'pdf' as const,
      includeCharts: true,
      sections: [
        { id: 'utilization-summary', title: 'Utilization Overview', type: 'summary' as const },
        { id: 'occupancy-trends', title: 'Occupancy Trends', type: 'analytics' as const },
        { id: 'space-optimization', title: 'Space Optimization', type: 'recommendations' as const },
      ],
    },
    
    energy: {
      title: 'Energy Efficiency Report',
      subtitle: 'Energy usage and efficiency analysis',
      format: 'pdf' as const,
      includeCharts: true,
      sections: [
        { id: 'energy-summary', title: 'Energy Overview', type: 'summary' as const },
        { id: 'efficiency-analysis', title: 'Efficiency Analysis', type: 'analytics' as const },
        { id: 'energy-recommendations', title: 'Energy Savings Opportunities', type: 'recommendations' as const },
      ],
    },
  };

  const getTemplate = useCallback((templateName: keyof typeof templates) => {
    return templates[templateName];
  }, []);

  const getTemplateNames = useCallback(() => {
    return Object.keys(templates) as Array<keyof typeof templates>;
  }, []);

  return {
    templates,
    getTemplate,
    getTemplateNames,
  };
}

// Export all types and services
export {
  ReportGenerationService,
  type ReportConfig,
  type GeneratedReport,
};
