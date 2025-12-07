import { api } from './api';

/**
 * Safety API - Block and Report functionality
 */

// ============================================
// BLOCK API
// ============================================

export const blockUser = async (userId, reason = '') => {
  const response = await api.post('/safety/block', {
    user_id: userId,
    reason
  });
  return response.data;
};

export const unblockUser = async (userId) => {
  const response = await api.delete(`/safety/block/${userId}`);
  return response.data;
};

export const getBlockedUsers = async () => {
  const response = await api.get('/safety/blocks');
  return response.data;
};

export const isUserBlocked = async (userId) => {
  const response = await axios.get(`/api/safety/is-blocked/${userId}`);
  return response.data;
};

// ============================================
// REPORT API
// ============================================

export const reportContent = async (type, targetId, reason, description = '') => {
  const response = await axios.post('/api/safety/report', {
    type,
    target_id: targetId,
    reason,
    description
  });
  return response.data;
};

export const getMyReports = async () => {
  const response = await axios.get('/api/safety/reports/my');
  return response.data;
};

export const getReportCount = async (type, targetId) => {
  const response = await axios.get(`/api/safety/reports/count/${type}/${targetId}`);
  return response.data;
};

// ============================================
// ADMIN API
// ============================================

export const getAdminReports = async (params = {}) => {
  const { status, type, limit = 50, skip = 0 } = params;
  const queryParams = new URLSearchParams();
  
  if (status) queryParams.append('status', status);
  if (type) queryParams.append('type', type);
  queryParams.append('limit', limit);
  queryParams.append('skip', skip);

  const response = await axios.get(`/api/safety/admin/reports?${queryParams}`);
  return response.data;
};

export const updateReportStatus = async (reportId, status, adminNotes = '') => {
  const response = await axios.patch(`/api/safety/admin/reports/${reportId}`, {
    status,
    admin_notes: adminNotes
  });
  return response.data;
};

export const deleteReport = async (reportId) => {
  const response = await axios.delete(`/api/safety/admin/reports/${reportId}`);
  return response.data;
};

export default {
  blockUser,
  unblockUser,
  getBlockedUsers,
  isUserBlocked,
  reportContent,
  getMyReports,
  getReportCount,
  getAdminReports,
  updateReportStatus,
  deleteReport
};
