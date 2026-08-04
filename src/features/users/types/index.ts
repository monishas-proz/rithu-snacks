export interface UserListItem {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  roleId: number;
  status: string;
  image: string | null;
  createdAt: Date;
  roleName?: string;
}

export interface GetUserParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  roleId?: number;
}

export interface GetUserResult {
  data: UserListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  roleId?: number;
  status?: string;
}

export interface UpdateUserInput extends Partial<Omit<CreateUserInput, "password">> {}

export interface ResetPasswordInput {
  password: string;
}
