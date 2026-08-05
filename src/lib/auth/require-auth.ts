import { auth } from "./config";
import { redirect } from "next/navigation";
import { ROLES } from "@/lib/constants";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  const userRole = session.user.role;
  if (userRole !== ROLES.ADMIN && userRole !== ROLES.STAFF) {
    redirect("/unauthorized");
  }
  return session;
}

export async function requireCustomer() {
  const session = await requireAuth();
  const userRole = session.user.role;
  if (userRole !== ROLES.CUSTOMER) {
    redirect("/unauthorized");
  }
  return session;
}

export async function requireRole(roles: string[]) {
  const session = await requireAuth();
  const userRole = session.user.role;
  if (!userRole || !roles.includes(userRole)) {
    redirect("/unauthorized");
  }
  return session;
}

export async function requirePermission(permission: string) {
  const session = await requireAuth();
  const userRole = session.user.role;

  if (userRole === ROLES.ADMIN) {
    return session;
  }

  if (userRole !== ROLES.STAFF) {
    redirect("/unauthorized");
  }

  return session;
}

export async function getOptionalSession() {
  return await auth();
}

export function isAdmin(session: { user?: { role?: string } } | null): boolean {
  return session?.user?.role === ROLES.ADMIN || session?.user?.role === ROLES.STAFF;
}

export function isCustomer(session: { user?: { role?: string } } | null): boolean {
  return session?.user?.role === ROLES.CUSTOMER;
}

export function isAuthenticated(session: { user?: { id?: string } } | null): boolean {
  return !!session?.user?.id;
}
