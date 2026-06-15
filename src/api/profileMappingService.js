import api from './axios';

export async function getProfileMappings() {
  const response = await api.get('/profile-mappings');
  return response.data;
}

export async function getMappingBySource(sourceId) {
  const response = await api.get(`/profile-mappings/source/${sourceId}`);
  return response.data;
}

export async function createProfileMapping(data) {
  const response = await api.post('/profile-mappings', data);
  return response.data;
}

export async function updateProfileMapping(id, data) {
  const response = await api.put(`/profile-mappings/${id}`, data);
  return response.data;
}

export async function deleteProfileMapping(id) {
  await api.delete(`/profile-mappings/${id}`);
}

export async function permanentlyDeleteProfileMapping(id) {
  await api.delete(`/profile-mappings/${id}/permanent`);
}
