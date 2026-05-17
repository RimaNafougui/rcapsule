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
      className="border-b border-divider bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60"
      isMenuOpen={isMenuOpen}
      maxWidth="xl"
      position="sticky"
      onMenuOpenChange={setIsMenuOpen}
    >
      {/* Mobile: hamburger on the left */}
      <NavbarContent className="lg:hidden" justify="start">
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        />
      </NavbarContent>

      {/* Desktop: logo + nav links */}
      <NavbarContent justify="start">
        <NavbarBrand as="li" className="max-w-fit">
          <NextLink href="/">
            <Logo />
          </NextLink>
        </NavbarBrand>

        <ul className="hidden lg:flex items-center gap-8 ml-8">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;

            return (
              <NavbarItem key={item.label}>
                <NextLink
                  className={clsx(
                    "relative text-[12px] font-mono uppercase tracking-[0.18em] transition-opacity duration-200",
                    isActive ? "opacity-100" : "opacity-50 hover:opacity-100",
                  )}
                  href={item.href}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-px bg-foreground" />
                  )}
                </NextLink>
              </NavbarItem>
            );
          })}
        </ul>
      </NavbarContent>

      {/* Right side */}
      <NavbarContent justify="end">
        {user ? (
          <>
            <NavbarItem>
              <Tooltip content="Notifications">
                <NextLink className="relative" href="/notifications">
                  <BellIcon className="w-5 h-5 text-default-400 hover:text-foreground transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-foreground text-background text-[8px] font-mono flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </NextLink>
              </Tooltip>
            </NavbarItem>
            <NavbarItem className="hidden sm:flex">
              <ThemeSwitch />
            </NavbarItem>
            <NavbarItem>
              <ProfileDropdown user={user} />
            </NavbarItem>
          </>
        ) : (
          <div className="flex items-center gap-5">
            <NextLink
              className="hidden md:inline text-[12px] font-mono uppercase tracking-[0.18em] opacity-50 hover:opacity-100 transition-opacity"
              href="/login"
            >
              Sign in
            </NextLink>
            <DSButton as={NextLink} href="/signup" size="sm" variant="primary">
              Start free
            </DSButton>
          </div>
        )}
      </NavbarContent>

      {/* Mobile menu */}
      <NavbarMenu className="pt-8 pb-10 bg-background/95 backdrop-blur-xl">
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col h-full"
              exit={{ opacity: 0, y: -8 }}
              initial={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Primary nav links — editorial large */}
              <div className="flex flex-col gap-1 flex-1">
                {navLinks.map((item) => (
                  <NavbarMenuItem key={item.label}>
                    <NextLink
                      className={clsx(
                        "block font-display font-light text-[clamp(28px,6vw,42px)] leading-tight tracking-tight py-2 transition-opacity duration-200",
                        pathname === item.href
                          ? "opacity-100"
                          : "opacity-40 hover:opacity-100",
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
                        className="block font-display font-light text-[clamp(28px,6vw,42px)] leading-tight tracking-tight py-2 opacity-40 hover:opacity-100 transition-opacity"
                        href="/login"
                        onClick={() => setIsMenuOpen()}
                      >
                        Sign in
                      </NextLink>
                    </NavbarMenuItem>
                    <NavbarMenuItem>
                      <NextLink
                        className="block font-display font-light text-[clamp(28px,6vw,42px)] leading-tight tracking-tight py-2 opacity-40 hover:opacity-100 transition-opacity"
                        href="/signup"
                        onClick={() => setIsMenuOpen()}
                      >
                        Start free
                      </NextLink>
                    </NavbarMenuItem>
                  </>
                )}
              </div>

              {/* Bottom bar — theme switch */}
              <div className="pt-6 border-t border-divider flex items-center justify-between mt-auto">
                <span className="text-[11px] font-mono uppercase tracking-[0.18em] opacity-40">
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
