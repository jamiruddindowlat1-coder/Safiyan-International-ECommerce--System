import { vendorRepository } from '../repositories/vendorRepository';

export const vendorService = {
  getVendors() {
    return vendorRepository.getAll();
  },

  getVendor(vendorId) {
    return vendorRepository.getById(vendorId);
  },

  createVendor(vendor) {
    return vendorRepository.create(vendor);
  },

  updateVendor(vendorId, vendor) {
    return vendorRepository.update(vendorId, vendor);
  },

  deleteVendor(vendorId) {
    return vendorRepository.remove(vendorId);
  },

  approveVendor(vendorId) {
    return vendorRepository.approve(vendorId);
  },

  rejectVendor(vendorId) {
    return vendorRepository.reject(vendorId);
  },
};
