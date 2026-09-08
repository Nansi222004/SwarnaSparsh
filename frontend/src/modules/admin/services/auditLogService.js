import api from '../../../services/api';

/**
 * Fetch paginated + filtered audit logs.
 * @param {Object} params - { entity, action, adminId, dateFrom, dateTo, search, page, limit }
 */
export const getAuditLogs = async (params = {}) => {
  const { data } = await api.get('/admin/audit-logs', { params });
  return data;
};

/**
 * Fetch audit stats (today / week / month counts).
 */
export const getAuditStats = async () => {
  const { data } = await api.get('/admin/audit-logs/stats');
  return data;
};

/**
 * Trigger CSV download of filtered audit logs.
 * @param {Object} params - same filter shape as getAuditLogs
 */
export const exportAuditLogs = async (params = {}) => {
  const response = await api.get('/admin/audit-logs/export', {
    params,
    responseType: 'blob',
  });
  const url  = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href  = url;
  link.setAttribute('download', `audit-logs-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
