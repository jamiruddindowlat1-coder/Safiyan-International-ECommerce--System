import { customerRepository } from '../repositories/customerRepository';

export const customerService = {
  getCustomer(customerId) {
    return customerRepository.getById(customerId);
  },

  updateCustomer(customerId, customer) {
    return customerRepository.update(customerId, customer);
  },

  setCustomerStatus(customerId, isActive) {
    return customerRepository.updateStatus(customerId, isActive);
  },
};
