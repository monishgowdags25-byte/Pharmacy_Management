import api from './api';

const auditLogService = {
  getAuditLogs: (params) => api.get('/audit-logs', { params }),
};

export default auditLogService;
