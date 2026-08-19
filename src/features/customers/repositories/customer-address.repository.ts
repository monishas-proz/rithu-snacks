import { db } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma";
import type { CustomerAddressResponse } from "../types/customer-address.types";

export function formatCustomerAddress(addr: {
  id: bigint;
  uuid: string | null;
  userId: bigint;
  cust_id: bigint | null;
  label: string | null;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string | null;
  country: string;
  latitude: Prisma.Decimal | number | null;
  longitude: Prisma.Decimal | number | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}): CustomerAddressResponse {
  return {
    id: addr.uuid || String(addr.id),
    label: addr.label ?? null,
    fullName: addr.full_name,
    phone: addr.phone,
    addressLine1: addr.address_line1,
    addressLine2: addr.address_line2 ?? null,
    landmark: addr.landmark ?? null,
    city: addr.city,
    state: addr.state,
    pincode: addr.pincode ?? "",
    country: addr.country,
    latitude: addr.latitude !== null && addr.latitude !== undefined ? Number(addr.latitude) : null,
    longitude: addr.longitude !== null && addr.longitude !== undefined ? Number(addr.longitude) : null,
    isDefault: Boolean(addr.isDefault),
    createdAt: addr.createdAt,
    updatedAt: addr.updatedAt,
  };
}

export const customerAddressRepository = {
  async findActiveByUserId(userId: bigint | number, tx?: Prisma.TransactionClient) {
    const client = tx || db;
    const list = await client.customerAddress.findMany({
      where: {
        userId: BigInt(userId),
        is_active: true,
        deleted_at: null,
      },
      orderBy: [
        { isDefault: "desc" },
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ],
    });

    return list;
  },

  async findByUuidAndUserId(
    uuid: string,
    userId: bigint | number,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || db;
    const address = await client.customerAddress.findFirst({
      where: {
        uuid,
        userId: BigInt(userId),
        is_active: true,
        deleted_at: null,
      },
    });

    return address;
  },

  async countActiveByUserId(userId: bigint | number, tx?: Prisma.TransactionClient) {
    const client = tx || db;
    return client.customerAddress.count({
      where: {
        userId: BigInt(userId),
        is_active: true,
        deleted_at: null,
      },
    });
  },

  async create(data: Prisma.CustomerAddressUncheckedCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx || db;
    return client.customerAddress.create({
      data,
    });
  },

  async updateByUuidAndUserId(
    uuid: string,
    userId: bigint | number,
    data: Prisma.CustomerAddressUncheckedUpdateInput,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || db;
    const existing = await this.findByUuidAndUserId(uuid, userId, client);
    if (!existing) return null;

    return client.customerAddress.update({
      where: { id: existing.id },
      data,
    });
  },

  async clearDefaultAddresses(userId: bigint | number, tx?: Prisma.TransactionClient) {
    const client = tx || db;
    return client.customerAddress.updateMany({
      where: {
        userId: BigInt(userId),
        is_active: true,
        deleted_at: null,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });
  },

  async setDefaultAddress(uuid: string, userId: bigint | number, tx?: Prisma.TransactionClient) {
    const client = tx || db;
    const existing = await this.findByUuidAndUserId(uuid, userId, client);
    if (!existing) return null;

    return client.customerAddress.update({
      where: { id: existing.id },
      data: {
        isDefault: true,
        updated_by: BigInt(userId),
      },
    });
  },

  async findLatestActiveAddress(
    userId: bigint | number,
    excludeUuid?: string,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || db;
    return client.customerAddress.findFirst({
      where: {
        userId: BigInt(userId),
        is_active: true,
        deleted_at: null,
        ...(excludeUuid ? { uuid: { not: excludeUuid } } : {}),
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });
  },

  async softDeleteByUuidAndUserId(
    uuid: string,
    userId: bigint | number,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || db;
    const existing = await this.findByUuidAndUserId(uuid, userId, client);
    if (!existing) return null;

    return client.customerAddress.update({
      where: { id: existing.id },
      data: {
        is_active: false,
        isDefault: false,
        deleted_at: new Date(),
        updated_by: BigInt(userId),
      },
    });
  },
};
