// Report Builder shared TypeScript types

export type ChartType = 'table' | 'bar' | 'line' | 'pie' | 'donut';
export type SharingType = 'private' | 'all_users' | 'specific_users' | 'by_roles';
export type RefreshSchedule = 'on_demand' | 'daily' | 'weekly' | 'monthly';

export interface FieldDef {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  options?: string[];
}

export interface FilterDef {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'daterange' | 'enum';
  options?: string[];
}

export interface DataSource {
  key: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  fields: FieldDef[];
  filters: FilterDef[];
  defaultFields: string[];
  groupByOptions: string[];
}

export interface ReportFilters {
  [key: string]: string | boolean | { from?: string; to?: string } | null;
}

export interface ReportConfig {
  source: string;
  filters: ReportFilters;
  fields: string[];
  groupBy: string;
  chartType: ChartType;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface QueryResult {
  data: Record<string, unknown>[];
  total: number;
  page?: number;
  limit?: number;
  pages?: number;
  isGrouped: boolean;
  groupBy?: string;
  fields?: string[];
}

export interface ShareableUser {
  _id: string;
  fullname?: string;
  email?: string;
  accessLevel?: string;
}

export interface ReportTemplate {
  _id: string;
  name: string;
  description: string;
  source: string;
  filters: ReportFilters;
  fields: string[];
  groupBy: string;
  chartType: ChartType;
  isShared: boolean;
  sharingType: SharingType;
  sharedWithUsers: ShareableUser[] | string[];
  sharedWithRoles: Array<{ _id: string; name?: string }> | string[];
  category: string;
  tags: string[];
  icon: string;
  color: string;
  isFeatured: boolean;
  executiveNotes: string;
  refreshSchedule: RefreshSchedule;
  createdBy:
    | string
    | {
        _id: string;
        fullname?: string;
        email?: string;
        accessLevel?: string;
      };
  createdAt: string;
  updatedAt: string;
}

export type WizardStep = 1 | 2 | 3;

// ─── Multi-Dataset Report Types ───────────────────────────────────────────────

export interface PerSourceConfig {
  source: string;
  label: string;
  color: string;
  filters: ReportFilters;
  fields: string[];
  groupBy: string;
  chartType: ChartType;
  limit: number;
}

export interface MultiSourceConfig {
  sources: PerSourceConfig[];
}

export interface MultiSourceResult {
  sourceKey: string;
  sourceLabel: string;
  sourceColor: string;
  data: Record<string, unknown>[];
  total: number;
  isGrouped: boolean;
  groupBy?: string;
  fields?: string[];
  error?: string;
}

export interface MultiQueryResponse {
  results: MultiSourceResult[];
  grandTotal: number;
  sourceCount: number;
}
