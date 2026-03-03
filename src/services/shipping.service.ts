
import api from '@/services/api';
import { ShippingZone } from '@/types/schema';

const shippingService = {
    getAll: async (): Promise<ShippingZone[]> => {
        const response = await api.get('/shipping');
        return response.data;
    },

    create: async (data: Partial<ShippingZone>): Promise<ShippingZone> => {
        const response = await api.post('/shipping', data);
        return response.data;
    },

    update: async (id: number, data: Partial<ShippingZone>): Promise<ShippingZone> => {
        const response = await api.put(`/shipping/${id}`, data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/shipping/${id}`);
    }
};

export default shippingService;
