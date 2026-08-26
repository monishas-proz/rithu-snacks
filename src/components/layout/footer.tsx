"use client";

import * as React from "react";
import Image from "next/image";
import {
  LOGOS,
  ICONS,
  contacts,
  footerSocialIcons,
  readyToAssist,
  mainMenu,
} from "@/constants/storefront";
import { ContactCard } from "@/components/storefront/cards/ContactCard";
import { FooterLinks } from "@/components/storefront/footer/FooterLinks";
import { IconButton } from "@/components/storefront/buttons/IconButton";

export function Footer() {
  const [email, setEmail] = React.useState("");
  const [isSubscribed, setIsSubscribed] = React.useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setTimeout(() => {
        setEmail("");
        setIsSubscribed(false);
      }, 3000);
    }
  };

  return (
    <footer className="relative pt-12">
      {/* Floating Contact Cards */}
      <div className="relative z-10 lg:translate-y-12 mb-6 lg:mb-0">
        <div className="grid md:grid-cols-3 gap-5 max-w-[1100px] mx-auto px-4">
          {contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      </div>

      {/* Main Brown Footer Area */}
      <div className="bg-[var(--brown-700)] min-h-[350px] pt-10 lg:pt-24 text-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex flex-col gap-10 lg:justify-between lg:flex-row">
            {/* Column 1: Ready to Assist */}
            <FooterLinks
              title="Ready to Assist"
              items={readyToAssist}
              className="mb-2"
            />

            {/* Column 2: Main Menu */}
            <FooterLinks
              title="Main Menu"
              items={mainMenu}
              className="mb-2"
            />

            {/* Column 3: Newsletter Sign Up */}
            <div>
              <h3 className="text-[24px] sm:text-[28px] lg:text-3xl font-semibold mb-6">
                Sign Up and Save
              </h3>

              <p className="text-gray-200 header-font">
                Join Our Newsletter for Updates & Offers
              </p>

              {isSubscribed ? (
                <div className="mt-8 py-2 text-sm text-amber-300 font-medium header-font">
                  ✓ Thank you for subscribing!
                </div>
              ) : (
                <form
                  onSubmit={handleSubscribe}
                  className="mt-8 border-b border-gray-300 flex items-center pb-3 header-font max-w-[300px] lg:max-w-none transition-colors duration-300 hover:border-white"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Your Email"
                    className="flex-1 bg-transparent outline-hidden text-white placeholder:text-gray-300 text-sm"
                  />

                  {email.trim() ? (
                    <button
                      type="submit"
                      className="bg-[var(--brown-600)] text-white px-4 py-1 rounded-md text-sm transition-all duration-300 hover:bg-[var(--brown-500)] cursor-pointer"
                    >
                      Submit
                    </button>
                  ) : (
                    <Image
                      src={ICONS.mail}
                      alt="mail"
                      width={20}
                      height={20}
                      className="invert transition-all duration-300"
                    />
                  )}
                </form>
              )}

              {/* Social Icons */}
              <div className="flex mt-7 gap-5">
                {footerSocialIcons.map((item) => (
                  <IconButton
                    key={item.id}
                    icon={item.icon}
                    alt={item.name}
                    imageClassName="w-[30px] h-[30px]"
                    className="hover:-translate-y-1"
                  />
                ))}
              </div>
            </div>

            {/* Column 4: Brand Logo & Address */}
            <div className="mt-2 lg:mt-0">
              <div className="flex justify-center">
                <Image
                  src={LOGOS.logo}
                  alt="logo"
                  width={90}
                  height={90}
                  className="transition-transform duration-300 hover:scale-105"
                />
              </div>

              <h3 className="text-xl lg:text-2xl font-semibold mt-5 text-center">
                Rithanya Food Products and Exports
              </h3>

              <div className="flex gap-2 mt-4 justify-center lg:justify-start">
                <Image
                  src={ICONS.location}
                  alt="location_icon"
                  width={25}
                  height={25}
                />
                <a
                  href="https://www.google.com/maps/place/RITHU'S+SNACKS/@11.1971509,78.1334803,13.77z/data=!4m6!3m5!1s0x3babcf3326ff1e47:0xafbe7c7cb1da0dd4!8m2!3d11.1995895!4d78.1815903!16s%2Fg%2F11vlt_cxvy?entry=ttu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="header-font text-sm hover:underline text-gray-200"
                >
                  6/1033, Thillai Nagar Trichy Road, Namakkal - 637 002.
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="mt-8 h-[3px] bg-[var(--brown-600)]" />

        {/* Copyright Bar */}
        <div className="flex flex-col gap-2 py-5 text-sm text-gray-200 header-font text-center lg:flex-row lg:justify-between lg:items-center lg:text-left lg:px-8 max-w-[1400px] mx-auto">
          <p className="header-font">
            Copyright © {new Date().getFullYear()} Rithu&apos;s Snacks. All Rights Reserved.
          </p>

          <p className="header-font">
            Design and Developed By ProZ Solutions LLP.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
