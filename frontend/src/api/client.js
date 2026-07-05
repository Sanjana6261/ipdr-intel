import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('API Error:', err.response?.data || err.message)
    return Promise.reject(err)
  }
)

export const parserAPI = {
  upload: (formData, onProgress) =>
    api.post('/parser/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
    }),
  getRecords: (subjectId, params) => api.get(`/parser/records/${subjectId}`, { params }),
  loadDemo: () => api.post('/parser/demo'),
}

export const networkAPI = {
  getGraph: (subjectId, params) => api.get(`/network/${subjectId}`, { params }),
  expandNode: (subjectId, nodeId) => api.get(`/network/${subjectId}/expand/${nodeId}`),
}

export const geoAPI = {
  getHeatmap: (subjectId, params) => api.get(`/geo/${subjectId}/heatmap`, { params }),
  getPath: (subjectId, params) => api.get(`/geo/${subjectId}/path`, { params }),
  getHotspots: (subjectId) => api.get(`/geo/${subjectId}/hotspots`),
}

export const casesAPI = {
  getAll: () => api.get('/cases'),
  getSubjects: (caseId) => api.get(`/cases/${caseId}/subjects`),
  linkSearch: (phones) => api.post('/cases/link', { phones }),
}

export const patternsAPI = {
  detect: (subjectId) => api.get(`/patterns/${subjectId}`),
}

export const predictiveAPI = {
  predict: (subjectId) => api.get(`/predict/${subjectId}`),
}

export const deviceAPI = {
  getDevice: (imei) => api.get(`/devices/${imei}`),
  getSubjectDevices: (subjectId) => api.get(`/devices/subject/${subjectId}`),
}

export const reportsAPI = {
  generate: (caseId) => api.get(`/reports/${caseId}`, { responseType: 'blob' }),
}

export default api
