"use client";

import { useState } from "react";
import Image from "next/image";
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
  Receipt,
  Hash,
  type LucideIcon,
  Ruler,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { signOut } from "next-auth/react";
import { logoutApi } from "@/features/auth/api/auth.api";
import { Drawer } from "@/components/common/drawer";

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
      { label: "Variants", href: "/admin/dashboard/variants", icon: Layers },
      { label: "Categories", href: "/admin/dashboard/categories", icon: FolderTree },
      { label: "Brands", href: "/admin/dashboard/brands", icon: Crown },
      { label: "GST Rates", href: "/admin/dashboard/gst-rates", icon: Receipt },
      { label: "HSN Codes", href: "/admin/dashboard/hsn-codes", icon: Hash },
      { label: "Units", href: "/admin/dashboard/units", icon: Ruler },
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
    children: [{ label: "Blogs", href: "/admin/dashboard/blogs", icon: BookOpen }],
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

function SidebarItemComponent({
  item,
  pathname,
  onNavigate,
}: {
  item: SidebarItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(() => {
    if (item.children) {
      return item.children.some(
        (child) => pathname === child.href || pathname.startsWith(child.href + "/")
      );
    }
    return false;
  });

  const isActive =
    pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isActive
              ? "bg-secondary-100 text-secondary-600"
              : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
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
          <div className="mt-1.5 ml-4 space-y-1">
            {item.children &&
              item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    pathname === child.href
                      ? "bg-secondary-100 text-secondary-600 font-medium"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
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
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-[--color-primary-500] text-secondary-600"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
      )}
    >
      <item.icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

function SidebarBrand() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/logo.svg"
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 rounded-lg object-cover"
      />
      <span className="flex flex-col">
        <span className="font-hanken text-secondary-600 text-base font-bold">{APP_NAME} Admin</span>
        <span className="text-xs text-neutral-500">Enterprise management</span>
      </span>
    </div>
  );
}

function SidebarNavigation({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1.5 overflow-y-auto scrollbar-hide px-3 pb-4">
      {sidebarItems.map((item) => (
        <SidebarItemComponent
          key={item.href}
          item={item}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

function SidebarLogout() {
  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore network errors on logout
    }
    await signOut({ callbackUrl: "/admin/login" });
  };

  return (
    <div className="border-t border-neutral-200 p-3">
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white transition-colors bg-[var(--color-secondary-600)] hover:bg-[var(--color-secondary-700)] cursor-pointer"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </div>
  );
}

interface AdminSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <Drawer
        open={mobileOpen}
        onClose={onMobileClose}
        side="left"
        title={<SidebarBrand />}
        className="w-[280px] max-w-[calc(100vw-2rem)] bg-neutral-50"
      >
        <div className="flex h-full flex-col">
          <SidebarNavigation pathname={pathname} onNavigate={onMobileClose} />
          <SidebarLogout />
        </div>
      </Drawer>
      <aside className="hidden h-screen w-60 flex-col border-r border-neutral-300 bg-secondary-100 lg:flex">
        <div className="p-5 pb-4">
          <Link href="/admin/dashboard" className="rounded-lg">
            <SidebarBrand />
          </Link>
        </div>
        <SidebarNavigation pathname={pathname} />
        <SidebarLogout />
      </aside>
    </>
  );
}

export { AdminSidebar };
