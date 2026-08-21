import { adminCustomerRepository } from "../repositories/admin-customer.repository";
import type { AdminCustomerListInput } from "../validations/admin-customer.schema";
import type { AdminCustomerListResponse } from "../types/admin-customer.types";

export const adminCustomerService = {
  async getAdminCustomers(
    params: AdminCustomerListInput
  ): Promise<AdminCustomerListResponse> {
    return adminCustomerRepository.findAdminCustomers(params);
  },
};
