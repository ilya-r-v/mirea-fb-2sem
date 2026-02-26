import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'accept': 'application/json'
  }
});

export const api = {
  getProducts: async () => {
    const response = await apiClient.get('/products');
    return response.data;
  },
  createProduct: async (product) => {
    const response = await apiClient.post('/products', product, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },
  updateProduct: async (id, product) => {
    const response = await apiClient.patch(`/products/${id}`, product, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },
  deleteProduct: async (id) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data; // { path: string }
  },
  deleteImage: async (path) => {
    const filename = path.split('/').pop();
    const response = await apiClient.delete(`/images/${filename}`);
    return response.data;
  }
};