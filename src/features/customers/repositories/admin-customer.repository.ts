import { db } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma";
import type { AdminCustomerListInput } from "../validations/admin-customer.schema";
import type {
  AdminCustomerListItemDto,
  AdminCustomerListResponse,
} from "../types/admin-customer.types";

const adminCustomerInclude = Prisma.validator<Prisma.customer_profilesInclude>()({
  users_customer_profiles_user_idTousers: {
    select: {
      id: true,
      uuid: true,
      cust_id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      status: true,
      is_active: true,
      is_blocked: true,
      email_verified_at: true,
      phone_verified_at: true,
      last_login_at: true,
      createdAt: true,
      updatedAt: true,
    },
  },
});

export function formatAdminCustomer(
  profile: Prisma.customer_profilesGetPayload<{
    include: typeof adminCustomerInclude;
  }>
): AdminCustomerListItemDto {
  const user = profile.users_customer_profiles_user_idTousers;
  const profileUuid = profile.uuid || String(profile.id);
  const userUuid = user.uuid || String(user.id);

  let formattedDob: string | null = null;
  if (profile.dob) {
    formattedDob = profile.dob.toISOString().split("T")[0];
  }

  const isBlocked = user.is_blocked !== null && Number(user.is_blocked) > 0;
  const profileImage = profile.profile_image || user.avatar || null;

  return {
    id: profileUuid,
    userId: userUuid,
    customerId: user.cust_id ?? null,
    name: profile.name || user.name || "",
    email: profile.email || user.email || "",
    phone: profile.phone || user.phone || "",
    profileImage,
    isWhatsapp: Boolean(profile.is_whatsapp),
    whatsappNo: profile.whatsapp_no ?? null,
    dob: formattedDob,
    gender: profile.gender ?? null,
    referralCode: profile.referral_code ?? null,
    status: user.status,
    isActive: Boolean(user.is_active),
    isBlocked,
    emailVerified: user.email_verified_at !== null,
    phoneVerified: user.phone_verified_at !== null,
    lastLoginAt: user.last_login_at ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const adminCustomerRepository = {
  async findAdminCustomers(
    params: AdminCustomerListInput
  ): Promise<AdminCustomerListResponse> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const userWhere: Prisma.UserWhereInput = {
      deleted_at: null,
      role: {
        slug: "customer",
      },
    };

    if (params.status) {
      userWhere.status = params.status;
    }

    if (params.isActive !== undefined) {
      userWhere.is_active = params.isActive;
    }

    if (params.isBlocked !== undefined) {
      if (params.isBlocked) {
        userWhere.is_blocked = { not: null, gt: 0 };
      } else {
        userWhere.OR = [{ is_blocked: null }, { is_blocked: 0 }];
      }
    }

    if (params.emailVerified !== undefined) {
      userWhere.email_verified_at = params.emailVerified ? { not: null } : null;
    }

    if (params.phoneVerified !== undefined) {
      userWhere.phone_verified_at = params.phoneVerified ? { not: null } : null;
    }

    const where: Prisma.customer_profilesWhereInput = {
      is_active: true,
      users_customer_profiles_user_idTousers: userWhere,
    };

    if (params.gender) {
      where.gender = params.gender;
    }

    if (params.isWhatsapp !== undefined) {
      where.is_whatsapp = params.isWhatsapp;
    }

    if (params.search) {
      const s = params.search;
      where.AND = [
        ...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []),
        {
          OR: [
            { name: { contains: s } },
            { email: { contains: s } },
            { phone: { contains: s } },
            { whatsapp_no: { contains: s } },
            { referral_code: { contains: s } },
            { users_customer_profiles_user_idTousers: { name: { contains: s } } },
            { users_customer_profiles_user_idTousers: { email: { contains: s } } },
            { users_customer_profiles_user_idTousers: { phone: { contains: s } } },
            { users_customer_profiles_user_idTousers: { cust_id: { contains: s } } },
          ],
        },
      ];
    }

    const sortOrder = params.sortOrder ?? "desc";
    let orderBy: Prisma.customer_profilesOrderByWithRelationInput = {
      users_customer_profiles_user_idTousers: { createdAt: sortOrder },
    };

    if (params.sortBy === "name") {
      orderBy = { users_customer_profiles_user_idTousers: { name: sortOrder } };
    } else if (params.sortBy === "email") {
      orderBy = { users_customer_profiles_user_idTousers: { email: sortOrder } };
    } else if (params.sortBy === "createdAt") {
      orderBy = { users_customer_profiles_user_idTousers: { createdAt: sortOrder } };
    } else if (params.sortBy === "updatedAt") {
      orderBy = { users_customer_profiles_user_idTousers: { updatedAt: sortOrder } };
    } else if (params.sortBy === "lastLoginAt") {
      orderBy = { users_customer_profiles_user_idTousers: { last_login_at: sortOrder } };
    } else if (params.sortBy === "status") {
      orderBy = { users_customer_profiles_user_idTousers: { status: sortOrder } };
    }

    const [profiles, total] = await Promise.all([
      db.customer_profiles.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: adminCustomerInclude,
      }),
      db.customer_profiles.count({ where }),
    ]);

    const data = profiles.map((p) => formatAdminCustomer(p));

    return {
      data,
      meta: {
        page,
        limit: pageSize,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },
};
