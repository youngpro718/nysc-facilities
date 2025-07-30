import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import { KeyInventoryData, ReportCallback } from "./types";
import { 
  downloadPdf, 
  generateReportHeader, 
  generateMetricsSection,
  generateRecommendationsSection,
  calculateMetrics 
} from "./reportUtils";

export async function generateKeyInventoryReport(progressCallback: ReportCallback = () => {}) {
  try {
    progressCallback({
      status: 'generating',
      progress: 10,
      message: 'Fetching key inventory data...'
    });

    // Query keys table directly since views don't exist
    let { data: stats, error } = await supabase
      .from("keys")
      .select(`
        type,
        total_quantity,
        available_quantity
      `);

    // If error, handle it
    if (error) {
      throw error;
    }

    // Transform keys data to match expected format
    const typeGroups = (stats || []).reduce((acc, key) => {
      if (!acc[key.type]) {
        acc[key.type] = {
          type: key.type,
          total_quantity: 0,
          available_quantity: 0,
          active_assignments: 0,
          returned_assignments: 0,
          lost_count: 0
        };
      }
      acc[key.type].total_quantity += key.total_quantity || 0;
      acc[key.type].available_quantity += key.available_quantity || 0;
      return acc;
    }, {} as Record<string, any>);

    stats = Object.values(typeGroups);

    progressCallback({
      status: 'generating',
      progress: 60,
      message: `Processing ${(stats as any)?.length || 0} key types...`
    });

    const data = (stats || []) as KeyInventoryData[];

    // Calculate metrics
    const typeMetrics = calculateMetrics(data, (key) => key.type);
    const utilizationData = data.map(key => ({
      type: key.type,
      utilization: key.total_quantity > 0 ? 
        ((key.total_quantity - key.available_quantity) / key.total_quantity * 100) : 0
    }));

    // Generate recommendations
    const recommendations = generateKeyRecommendations(data);

    progressCallback({
      status: 'generating',
      progress: 80,
      message: 'Generating PDF document...'
    });

    const content: Content[] = [
      ...generateReportHeader('Key Inventory Report', 'Comprehensive analysis of key management and distribution'),
      
      // Summary statistics
      generateInventorySummary(data),
      { text: '\n' },

      // Key type distribution
      { text: 'Key Type Distribution', style: 'sectionHeader' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            ['Key Type', 'Total Keys', 'Available', 'Utilization %'],
            ...data.map(key => [
              key.type,
              key.total_quantity.toString(),
              key.available_quantity.toString(),
              key.total_quantity > 0 ? 
                `${(((key.total_quantity - key.available_quantity) / key.total_quantity) * 100).toFixed(1)}%` : '0%'
            ])
          ]
        },
        layout: 'lightHorizontalLines'
      },
      { text: '\n' },

      // Detailed inventory table
      { text: 'Detailed Inventory', style: 'sectionHeader' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: [
            ['Type', 'Total', 'Available', 'Active', 'Returned', 'Lost'],
            ...data.map(row => [
              row.type,
              row.total_quantity.toString(),
              row.available_quantity.toString(),
              row.active_assignments.toString(),
              row.returned_assignments.toString(),
              row.lost_count.toString()
            ])
          ]
        },
        layout: 'lightHorizontalLines'
      },
      { text: '\n' },

      // Utilization analysis
      generateUtilizationAnalysis(utilizationData),
      { text: '\n' },

      ...generateRecommendationsSection(recommendations)
    ];

    const docDefinition: TDocumentDefinitions = {
      content
    };

    progressCallback({
      status: 'generating',
      progress: 95,
      message: 'Downloading report...'
    });

    await downloadPdf(docDefinition, `key_inventory_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
    
    progressCallback({
      status: 'completed',
      progress: 100,
      message: 'Report generated successfully'
    });

    return data;
  } catch (error) {
    progressCallback({
      status: 'error',
      progress: 0,
      message: error instanceof Error ? error.message : 'Failed to generate key inventory report'
    });
    throw error;
  }
}

function generateInventorySummary(data: KeyInventoryData[]): Content {
  const totalKeys = data.reduce((sum, key) => sum + key.total_quantity, 0);
  const totalAvailable = data.reduce((sum, key) => sum + key.available_quantity, 0);
  const totalActive = data.reduce((sum, key) => sum + key.active_assignments, 0);
  const totalLost = data.reduce((sum, key) => sum + key.lost_count, 0);

  return {
    columns: [
      {
        text: [
          { text: 'Inventory Summary\n', style: 'sectionHeader' },
          { text: `Total Keys: ${totalKeys}\n`, style: 'metric' },
          { text: `Available: ${totalAvailable}\n`, style: 'metric' },
        ]
      },
      {
        text: [
          { text: '\n' },
          { text: `Active Assignments: ${totalActive}\n`, style: 'metric' },
          { text: `Lost/Missing: ${totalLost}\n`, style: 'metric' },
        ]
      }
    ]
  };
}

function generateUtilizationAnalysis(utilizationData: Array<{type: string, utilization: number}>): Content {
  const highUtilization = utilizationData.filter(item => item.utilization > 80);
  const lowUtilization = utilizationData.filter(item => item.utilization < 20);

  return {
    stack: [
      { text: 'Utilization Analysis', style: 'sectionHeader' },
      { text: `High Utilization (>80%): ${highUtilization.length} key types`, style: 'metric' },
      { text: `Low Utilization (<20%): ${lowUtilization.length} key types`, style: 'metric' },
      { text: '\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto'],
          body: [
            ['Key Type', 'Utilization'],
            ...utilizationData
              .sort((a, b) => b.utilization - a.utilization)
              .map(item => [item.type, `${item.utilization.toFixed(1)}%`])
          ]
        },
        layout: 'lightHorizontalLines'
      }
    ]
  };
}

function generateKeyRecommendations(data: KeyInventoryData[]): string[] {
  const recommendations: string[] = [];

  const lowStockKeys = data.filter(key => 
    key.available_quantity < key.total_quantity * 0.2 && key.total_quantity > 0
  );

  if (lowStockKeys.length > 0) {
    recommendations.push(`${lowStockKeys.length} key types have low availability (<20%) - consider ordering additional keys`);
  }

  const highLossKeys = data.filter(key => 
    key.lost_count > key.total_quantity * 0.1 && key.total_quantity > 0
  );

  if (highLossKeys.length > 0) {
    recommendations.push(`${highLossKeys.length} key types have high loss rates (>10%) - review key management procedures`);
  }

  const unutilizedKeys = data.filter(key => 
    key.available_quantity === key.total_quantity && key.total_quantity > 0
  );

  if (unutilizedKeys.length > 0) {
    recommendations.push(`${unutilizedKeys.length} key types are completely unused - consider redistributing or retiring`);
  }

  const totalLost = data.reduce((sum, key) => sum + key.lost_count, 0);
  const totalKeys = data.reduce((sum, key) => sum + key.total_quantity, 0);

  if (totalLost > totalKeys * 0.05) {
    recommendations.push('Overall key loss rate exceeds 5% - implement stricter key control policies');
  }

  return recommendations;
}