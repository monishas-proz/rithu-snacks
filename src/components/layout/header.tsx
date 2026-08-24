"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LOGOS, ICONS, navigation, desktopIcons, mobileBottomIcons } from "@/constants/storefront";
import { NavButton } from "@/components/storefront/buttons/NavButton";
import { IconButton } from "@/components/storefront/buttons/IconButton";
import { useClickOutside } from "@/hooks/useClickOutside";

export function Header() {
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLDivElement>(null);

  useClickOutside([menuRef, buttonRef], () => setIsOpen(false));

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-xs header-font">
      <div className="max-w-[1400px] mx-auto h-20 sm:h-24 px-2 sm:px-4 md:px-8 flex items-center justify-between">
        {/* Left Section (Logo + Brand Title) */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          <Link href="/">
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
          <Image
            src={LOGOS.mobileTitle}
            alt="mobile title"
            width={120}
            height={40}
            priority
            className="block md:hidden w-[95px] sm:w-[120px] hover:scale-105 transition-transform duration-300"
          />

          {/* Desktop Title */}
          <Image
            src={LOGOS.title}
            alt="title"
            width={150}
            height={60}
            priority
            className="hidden md:block hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navigation.map((item) => (
            <NavButton
              key={item.id}
              variant="desktop"
              text={item.text}
              icon={item.icon}
              onClick={item.path ? () => router.push(item.path) : undefined}
            />
          ))}
        </nav>

        {/* Right Section (Icons & Hamburger) */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
          <div className="hidden lg:flex items-center gap-5">
            {desktopIcons.map((item) => (
              <IconButton
                key={item.id}
                icon={item.icon}
                alt={item.alt}
                onClick={item.path ? () => router.push(item.path) : undefined}
              />
            ))}
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
                onClick={
                  item.path
                    ? () => {
                        router.push(item.path);
                        setIsOpen(false);
                      }
                    : undefined
                }
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
          bg-white/80
          backdrop-blur-xl
          border-t
          border-white/20
          shadow-[0_-8px_30px_rgba(0,0,0,0.15)]
          flex
          justify-around
          items-center
          py-3
          pb-[calc(env(safe-area-inset-bottom)+12px)]
          lg:hidden
          z-50
        "
      >
        {mobileBottomIcons.map((item) => (
          <NavButton
            key={item.id}
            variant="bottom"
            icon={item.icon}
            text={item.text}
            onClick={item.path ? () => router.push(item.path) : undefined}
          />
        ))}
      </div>
    </header>
  );
}

export default Header;
