"use client";
import React, { useEffect, useState } from "react";
import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
  Tooltip,
} from "@heroui/react";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { BellIcon } from "@heroicons/react/24/outline";

import { siteConfig } from "@/lib/config/site";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { ProfileDropdown } from "@/components/auth/dropdown";
import { Logo } from "@/components/ui/logo";
import { DSButton } from "@/components/ui/button";

function useUnreadCount(enabled: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const fetch_ = () =>
      fetch("/api/notifications?unreadOnly=true&limit=1")
        .then((r) => r.json())
        .then((d) => setCount(d.unreadCount || 0))
        .catch(() => {});

    fetch_();
    const interval = setInterval(fetch_, 60_000);

    return () => clearInterval(interval);
  }, [enabled]);

  return count;
}

export const AppNavbar = ({ user }: { user: any }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useReducer(
    (current: boolean) => !current,
    false,
  );
  const pathname = usePathname();
  const unreadCount = useUnreadCount(!!user);

  const navLinks = user ? siteConfig.navItems : siteConfig.marketingNavItems;

  return (
    <HeroUINavbar
      className="border-b border-divider backdrop-blur-lg bg-background/80 supports-[backdrop-filter]:bg-background/60"
      isMenuOpen={isMenuOpen}
      maxWidth="xl"
      position="sticky"
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarContent className="sm:hidden" justify="start">
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        />
      </NavbarContent>

      <NavbarContent justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
          </NextLink>
        </NavbarBrand>

        <ul className="hidden lg:flex gap-4 ml-4">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;

            return (
              <NavbarItem key={item.href}>
                <NextLink
                  className={clsx(
                    linkStyles({ color: "foreground" }),
                    "text-sm uppercase tracking-widest font-medium relative transition-opacity duration-200",
                    isActive ? "opacity-100" : "opacity-60 hover:opacity-100",
                  )}
                  href={item.href}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-foreground" />
                  )}
                </NextLink>
              </NavbarItem>
            );
          })}
        </ul>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem className="hidden sm:flex">
          <ThemeSwitch />
        </NavbarItem>

        {user ? (
          <>
            <NavbarItem>
              <Tooltip content="Notifications">
                <NextLink className="relative" href="/notifications">
                  <BellIcon className="w-5 h-5 text-default-500 hover:text-foreground transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-background text-[9px] font-bold flex items-center justify-center rounded-full">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </NextLink>
              </Tooltip>
            </NavbarItem>
            <NavbarItem>
              <ProfileDropdown user={user} />
            </NavbarItem>
          </>
        ) : (
          <div className="flex gap-2">
            <DSButton as={NextLink} href="/login" size="sm" variant="ghost">
              Log In
            </DSButton>
            <div className="hidden sm:flex">
              <DSButton
                as={NextLink}
                href="/signup"
                size="sm"
                variant="primary"
              >
                Sign Up
              </DSButton>
            </div>
          </div>
        )}
      </NavbarContent>

      <NavbarMenu className="pt-6 bg-background/95 backdrop-blur-xl">
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4"
              exit={{ opacity: 0, y: -10 }}
              initial={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {navLinks.map((item, index) => (
                <NavbarMenuItem key={`${item.label}-${index}`}>
                  <NextLink
                    className={clsx(
                      "w-full text-2xl font-light uppercase tracking-tighter py-2 transition-opacity duration-200",
                      pathname === item.href ? "opacity-100" : "opacity-60",
                    )}
                    href={item.href}
                    onClick={() => setIsMenuOpen()}
                  >
                    {item.label}
                  </NextLink>
                </NavbarMenuItem>
              ))}

              {!user && (
                <>
                  <NavbarMenuItem>
                    <NextLink
                      className="text-2xl font-light uppercase tracking-tighter py-2"
                      href="/login"
                      onClick={() => setIsMenuOpen()}
                    >
                      Log In
                    </NextLink>
                  </NavbarMenuItem>
                  <NavbarMenuItem>
                    <NextLink
                      className="text-2xl font-light uppercase tracking-tighter py-2"
                      href="/signup"
                      onClick={() => setIsMenuOpen()}
                    >
                      Sign Up
                    </NextLink>
                  </NavbarMenuItem>
                </>
              )}

              <div className="pt-4 border-t border-divider flex items-center justify-between">
                <span className="text-sm font-medium uppercase opacity-50">
                  Appearance
                </span>
                <ThemeSwitch />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
