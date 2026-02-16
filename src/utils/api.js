import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Health check
export const healthCheck = async () => {
    const response = await api.get('/health');
    return response.data;
};

// Get all checks
export const getChecks = async () => {
    const response = await api.get('/checks');
    return response.data;
};

// Upload Excel file
export const uploadExcel = async (file, tipo, mensajeId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);
    formData.append('mensaje_id', mensajeId);

    const response = await axios.post(`${API_BASE_URL}/upload-excel`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

// Generate link
export const generateLink = async (check, clase, grupo) => {
    const response = await api.post('/generate-link', { check, clase, grupo });
    return response.data;
};

// Preview campaign
export const previewCampaign = async (mensajes) => {
    const response = await api.post('/preview-campaign', { mensajes });
    return response.data;
};

// Send campaign
export const sendCampaign = async (mensajes, asuntoCorreo) => {
    const response = await api.post('/send-campaign', {
        mensajes,
        asunto_correo: asuntoCorreo,
    });
    return response.data;
};

export default api;
