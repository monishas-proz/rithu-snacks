"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tag,
  ShoppingCart,
  Users,
  Shield,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  BookOpen,
  Truck,
  Star,
  Crown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { signOut } from "next-auth/react";

interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  {
    label: "Catalog",
    href: "/admin/dashboard/catalog",
    icon: Package,
    children: [
      { label: "Products", href: "/admin/dashboard/products", icon: Package },
      { label: "Categories", href: "/admin/dashboard/categories", icon: FolderTree },
      { label: "Brands", href: "/admin/dashboard/brands", icon: Crown },
      { label: "Attributes", href: "/admin/dashboard/attributes", icon: Tag },
    ],
  },
  {
    label: "Sales",
    href: "/admin/dashboard/sales",
    icon: ShoppingCart,
    children: [
      { label: "Orders", href: "/admin/dashboard/orders", icon: ShoppingCart },
      { label: "Customers", href: "/admin/dashboard/customers", icon: Users },
    ],
  },
  {
    label: "Inventory",
    href: "/admin/dashboard/inventory",
    icon: Truck,
    children: [
      { label: "Stock", href: "/admin/dashboard/inventory/stock", icon: Package },
      { label: "History", href: "/admin/dashboard/inventory/history", icon: BarChart3 },
    ],
  },
  {
    label: "Marketing",
    href: "/admin/dashboard/marketing",
    icon: Tag,
    children: [
      { label: "Coupons", href: "/admin/dashboard/coupons", icon: Tag },
      { label: "Offers", href: "/admin/dashboard/offers", icon: Star },
      { label: "Banners", href: "/admin/dashboard/banners", icon: ImageIcon },
    ],
  },
  {
    label: "CMS",
    href: "/admin/dashboard/cms",
    icon: BookOpen,
    children: [
      { label: "Blogs", href: "/admin/dashboard/blogs", icon: BookOpen },
    ],
  },
  {
    label: "Users",
    href: "/admin/dashboard/users",
    icon: Shield,
    children: [
      { label: "Users", href: "/admin/dashboard/users", icon: Users },
      { label: "Roles", href: "/admin/dashboard/roles", icon: Shield },
      { label: "Permissions", href: "/admin/dashboard/permissions", icon: Shield },
    ],
  },
  { label: "Reports", href: "/admin/dashboard/reports", icon: BarChart3 },
  { label: "Settings", href: "/admin/dashboard/settings", icon: Settings },
];

function SidebarItemComponent({ item, pathname }: { item: SidebarItem; pathname: string }) {
  const [isOpen, setIsOpen] = useState(() => {
    if (item.children) {
      return item.children.some(
        (child) => pathname === child.href || pathname.startsWith(child.href + "/")
      );
    }
    return false;
  });

  const isActive =
    pathname === item.href ||
    (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <item.icon className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          )}
        </button>
        {isOpen && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children && item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors",
                  pathname === child.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <child.icon className="h-3.5 w-3.5" />
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <item.icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-background">
      <div className="border-b p-4">
        <Link href="/admin/dashboard">
          <span className="text-lg font-bold text-primary">{APP_NAME} Admin</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {sidebarItems.map((item) => (
          <SidebarItemComponent key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
      <div className="border-t p-4">
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

export { AdminSidebar };
