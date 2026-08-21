export interface AdminCustomerListItemDto {
  id: string; // customer_profiles.uuid
  userId: string; // users.uuid
  customerId: string | null; // users.cust_id
  name: string;
  email: string;
  phone: string;
  profileImage: string | null;
  isWhatsapp: boolean;
  whatsappNo: string | null;
  dob: string | null; // YYYY-MM-DD
  gender: "male" | "female" | "other" | null;
  referralCode: string | null;
  status: "active" | "inactive" | "banned";
  isActive: boolean;
  isBlocked: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminCustomerListPaginationMeta {
  page: number;
  limit: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminCustomerListResponse {
  data: AdminCustomerListItemDto[];
  meta: AdminCustomerListPaginationMeta;
}
