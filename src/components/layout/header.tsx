"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LOGOS, ICONS, navigation, desktopIcons, mobileBottomIcons } from "@/constants/storefront";
import { NavButton } from "@/components/storefront/buttons/NavButton";
import { IconButton } from "@/components/storefront/buttons/IconButton";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useCustomerWishlistCount } from "@/features/customers/hooks/use-customer-wishlist";
import { useCustomerCartCount } from "@/features/customers/hooks/use-customer-cart";

export function Header() {
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  // Real-time badge counts from customer endpoints (only enabled when authenticated)
  const { data: wishlistCount = 0 } = useCustomerWishlistCount();
  const { data: cartCountData } = useCustomerCartCount();
  const cartCount =
    typeof cartCountData === "number"
      ? cartCountData
      : (cartCountData as { count?: number; totalQuantity?: number })?.totalQuantity ??
        (cartCountData as { count?: number })?.count ??
        0;

  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLDivElement>(null);

  useClickOutside([menuRef, buttonRef], () => setIsOpen(false));

  const resolvePath = React.useCallback(
    (item: { id: number; path?: string; alt?: string; text?: string }) => {
      const isUser =
        item.alt === "user" || item.text === "Account" || item.path === "/profile";
      const isWishlist =
        item.alt === "wishlist" || item.text === "Wishlist" || item.path === "/wishlist";
      const isCart =
        item.alt === "cart" || item.text === "Cart" || item.path === "/cart";

      if (isUser) {
        return isAuthenticated ? "/profile" : "/login";
      }
      if (isWishlist) {
        return isAuthenticated ? "/wishlist" : "/login?callbackUrl=/wishlist";
      }
      if (isCart) {
        return isAuthenticated ? "/cart" : "/login?callbackUrl=/cart";
      }
      return item.path || "/";
    },
    [isAuthenticated]
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-xs header-font">
      <div className="max-w-[1400px] mx-auto h-20 sm:h-24 px-2 sm:px-4 md:px-8 flex items-center justify-between">
        {/* Left Section (Logo + Brand Title) */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          <Link href="/" className="inline-block">
            <Image
              src={LOGOS.logo}
              alt="logo"
              width={100}
              height={100}
              priority
              className="w-[55px] sm:w-[65px] md:w-[80px] hover:scale-105 transition-transform duration-300 active:scale-95"
            />
          </Link>

          {/* Mobile Title */}
          <Link href="/" className="block md:hidden">
            <Image
              src={LOGOS.mobileTitle}
              alt="mobile title"
              width={120}
              height={40}
              priority
              className="w-[95px] sm:w-[120px] hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Desktop Title */}
          <Link href="/" className="hidden md:block">
            <Image
              src={LOGOS.title}
              alt="title"
              width={150}
              height={60}
              priority
              className="hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navigation.map((item) => (
            <NavButton
              key={item.id}
              variant="desktop"
              text={item.text}
              icon={item.icon}
              href={item.path}
              isActive={pathname === item.path}
            />
          ))}
        </nav>

        {/* Right Section (Icons & Hamburger) */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
          <div className="hidden lg:flex items-center gap-5">
            {desktopIcons.map((item) => {
              const targetPath = resolvePath(item);
              const badge =
                item.alt === "cart"
                  ? cartCount
                  : item.alt === "wishlist"
                  ? wishlistCount
                  : undefined;

              return (
                <IconButton
                  key={item.id}
                  icon={item.icon}
                  alt={item.alt}
                  href={targetPath}
                  badge={badge}
                />
              );
            })}
          </div>

          {/* Hamburger Menu Trigger */}
          <div ref={buttonRef} className="lg:hidden">
            <IconButton
              icon={ICONS.menu}
              alt="menu"
              onClick={() => setIsOpen(!isOpen)}
              imageClassName="w-[22px] h-[22px]"
            />
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <>
        {/* Overlay */}
        <div
          onClick={() => setIsOpen(false)}
          className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-all duration-500 ${
            isOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        />

        {/* Drawer Panel */}
        <div
          ref={menuRef}
          className={`fixed top-0 right-0 z-50 h-screen w-64 bg-[var(--brown-600)] border-l border-white/20 shadow-2xl transform transition-all duration-500 ease-in-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/20 px-6 py-5">
            <h2 className="text-xl font-semibold text-white uppercase">
              Menu
            </h2>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-2xl text-white hover:text-gray-300 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col py-3">
            {navigation.map((item) => (
              <NavButton
                key={item.id}
                variant="drawer"
                text={item.text}
                icon={item.icon}
                isActive={pathname === item.path}
                href={item.path}
                onClick={() => setIsOpen(false)}
              />
            ))}
          </nav>
        </div>
      </>

      {/* Mobile Bottom Navigation Bar */}
      <div
        className="
          fixed
          bottom-0
          left-0
          w-full
          bg-white/90
          backdrop-blur-xl
          border-t
          border-stone-200
          shadow-[0_-8px_30px_rgba(0,0,0,0.08)]
          flex
          justify-around
          items-center
          py-2.5
          pb-[calc(env(safe-area-inset-bottom)+10px)]
          lg:hidden
          z-50
        "
      >
        {mobileBottomIcons.map((item) => {
          const targetPath = resolvePath(item);
          const badge =
            item.text === "Cart"
              ? cartCount
              : item.text === "Wishlist"
              ? wishlistCount
              : undefined;

          return (
            <NavButton
              key={item.id}
              variant="bottom"
              icon={item.icon}
              text={item.text}
              href={targetPath}
              badge={badge}
              isActive={pathname === targetPath}
            />
          );
        })}
      </div>
    </header>
  );
}

export default Header;
