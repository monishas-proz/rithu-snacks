import { ApiError } from "@/lib/api/api-error";
import { adminCustomerRepository } from "../repositories/admin-customer.repository";
import type {
  AdminCustomerListInput,
  AdminCustomerOrdersInput,
} from "../validations/admin-customer.schema";
import type {
  AdminCustomerListResponse,
  AdminCustomerDetailDto,
  AdminCustomerAddressDto,
  AdminCustomerOrdersResponse,
} from "../types/admin-customer.types";

export const adminCustomerService = {
  async getAdminCustomers(
    params: AdminCustomerListInput
  ): Promise<AdminCustomerListResponse> {
    return adminCustomerRepository.findAdminCustomers(params);
  },

  async getCustomerDetail(uuid: string): Promise<AdminCustomerDetailDto> {
    const customer = await adminCustomerRepository.findCustomerByUuid(uuid);
    if (!customer) {
      throw ApiError.notFound("Customer not found");
    }
    return customer;
  },

  async getCustomerAddresses(uuid: string): Promise<AdminCustomerAddressDto[]> {
    const addresses =
      await adminCustomerRepository.findCustomerAddressesByCustomerUuid(uuid);
    if (addresses === null) {
      throw ApiError.notFound("Customer not found");
    }
    return addresses;
  },

  async getCustomerOrders(
    uuid: string,
    params: AdminCustomerOrdersInput
  ): Promise<AdminCustomerOrdersResponse> {
    const result =
      await adminCustomerRepository.findCustomerOrdersByCustomerUuid(
        uuid,
        params
      );
    if (result === null) {
      throw ApiError.notFound("Customer not found");
    }
    return result;
  },
};
