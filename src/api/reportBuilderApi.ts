import axios from 'axios';
import type {
  ReportConfig,
  QueryResult,
  ReportTemplate,
  DataSource,
  ShareableUser,
  PerSourceConfig,
  MultiQueryResponse,
} from '../pages/admin/report-builder/types';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

/** Fetch all available data sources with their field/filter metadata */
export const fetchSources = async (): Promise<DataSource[]> => {
  const res = await axios.get(`${BASE}/report-builder/sources`, getHeaders());
  return res.data.sources;
};

/** Execute a dynamic report query (paginated) */
export const executeQuery = async (config: Partial<ReportConfig>): Promise<QueryResult> => {
  const res = await axios.post(`${BASE}/report-builder/query`, config, getHeaders());
  return res.data;
};

/** Execute a full export query (no pagination, max 10,000 rows) */
export const exportQuery = async (config: Partial<ReportConfig>): Promise<QueryResult> => {
  const res = await axios.post(`${BASE}/report-builder/query/export`, config, getHeaders());
  return res.data;
};

/** Get user's saved report templates (includes shared ones visible to this user) */
export const fetchTemplates = async (): Promise<ReportTemplate[]> => {
  const res = await axios.get(`${BASE}/report-builder/templates`, getHeaders());
  return res.data;
};

/** Save a new report template */
export const saveTemplate = async (
  template: Partial<ReportTemplate> & { name: string; source: string }
): Promise<ReportTemplate> => {
  const res = await axios.post(`${BASE}/report-builder/templates`, template, getHeaders());
  return res.data;
};

/** Update an existing report template */
export const updateTemplate = async (
  id: string,
  updates: Partial<ReportTemplate>
): Promise<ReportTemplate> => {
  const res = await axios.put(`${BASE}/report-builder/templates/${id}`, updates, getHeaders());
  return res.data;
};

/** Delete a saved report template */
export const deleteTemplate = async (id: string): Promise<void> => {
  await axios.delete(`${BASE}/report-builder/templates/${id}`, getHeaders());
};

/** Fetch users available for sharing (active non-public users) */
export const fetchShareableUsers = async (): Promise<ShareableUser[]> => {
  const res = await axios.get(`${BASE}/report-builder/shareable-users`, getHeaders());
  return res.data;
};

/** Execute parallel queries across multiple data sources */
export const executeMultiQuery = async (
  sources: PerSourceConfig[]
): Promise<MultiQueryResponse> => {
  const res = await axios.post(
    `${BASE}/report-builder/multi-query`,
    { sources },
    getHeaders()
  );
  return res.data;
};

/** Export full data across multiple sources (no pagination) */
export const exportMultiQuery = async (
  sources: PerSourceConfig[]
): Promise<MultiQueryResponse> => {
  const res = await axios.post(
    `${BASE}/report-builder/multi-query/export`,
    { sources },
    getHeaders()
  );
  return res.data;
};
