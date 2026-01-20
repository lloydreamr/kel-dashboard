/**
 * Visualization Components
 *
 * Components for competitor data visualization including scatter charts,
 * market positioning analysis, and data point editors.
 */

export { ScatterChart } from './ScatterChart';
export { ScatterChartSkeleton } from './ScatterChartSkeleton';
export { ChartLegend } from './ChartLegend';
export { CompetitorForm } from './CompetitorForm';
export { CompetitorDialog } from './CompetitorDialog';
export { DeleteCompetitorDialog } from './DeleteCompetitorDialog';
export { AddCompetitorButton } from './AddCompetitorButton';
export { CompetitorEditPopover } from './CompetitorEditPopover';
export { MarkKelPositionButton } from './MarkKelPositionButton';
export { KelPositionForm } from './KelPositionForm';
export { KelPositionDialog } from './KelPositionDialog';
export { COMPETITOR_CATEGORIES, DISTRIBUTION_CHANNELS } from './competitorSchema';
export { SwipeableSheetContent } from './SwipeableSheetContent';
export { CompetitorDetailSheet } from './CompetitorDetailSheet';
export { QuadrantStatsOverlay } from './QuadrantStatsOverlay';
export { OpportunityScoreOverlay } from './OpportunityScoreOverlay';
export { PitchModeHeader } from './PitchModeHeader';
export { EnterPitchModeButton } from './EnterPitchModeButton';
export { PdfExportContent } from './PdfExportContent';
export { DownloadPdfButton } from './DownloadPdfButton';
export { PitchCompetitorTable, getPriceRangeLabel, getMarketPosition } from './PitchCompetitorTable';
export { MetricTooltip } from './MetricTooltip';
export { ChartFilters, type ChartFiltersValue } from './ChartFilters';
export { ChartStatsBar } from './ChartStatsBar';
export { ComparisonPanel } from './ComparisonPanel';
export { ProximityRankingPanel } from './ProximityRankingPanel';
export { SmartInsightsPanel } from './SmartInsightsPanel';
export {
  ChartAxisSelector,
  METRIC_CONFIGS,
  VIEW_PRESETS,
  DEFAULT_AXIS_CONFIG,
  type ChartMetric,
  type ChartAxisConfig,
  type MetricConfig,
  type ViewPreset,
} from './ChartAxisSelector';
