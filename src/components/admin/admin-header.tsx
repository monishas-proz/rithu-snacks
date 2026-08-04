"use client";

import { Bell, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/common/dropdown";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { getInitials } from "@/lib/utils";

function AdminHeader() {
  const { data: session } = useSession();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Admin Dashboard</h1>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>

        <Dropdown
          trigger={
            <Button variant="ghost" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                {session?.user?.name
                  ? getInitials(session.user.name)
                  : "A"}
              </div>
              <span className="hidden md:inline text-sm">
                {session?.user?.name || "Admin"}
              </span>
            </Button>
          }
        >
          <DropdownItem onClick={() => signOut({ callbackUrl: "/admin/login" })}>
            Logout
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}

export { AdminHeader };
