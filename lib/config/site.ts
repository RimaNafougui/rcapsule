export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  /** Logged-in navbar links (core actions only) */
  navItems: [
    {
      label: "Closet",
      href: "/closet",
    },
    {
      label: "Outfits",
      href: "/outfits",
    },
    {
      label: "Catalog",
      href: "/catalog",
    },
  ],
  /** Logged-out navbar links (marketing / conversion) */
  marketingNavItems: [
    {
      label: "Features",
      href: "/features",
    },
    {
      label: "Pricing",
      href: "/pricing",
    },
  ],
  /** Profile dropdown items (logged in) */
  profileDropdownItems: [
    {
      label: "My Profile",
      href: "/profile",
    },
    {
      label: "Wishlist",
      href: "/wishlist",
    },
    {
      label: "Collections",
      href: "/collections",
    },
    {
      label: "Settings",
      href: "/settings",
    },
  ],
  links: {
    github: "https://github.com/RimaNafougui/rcapsule",
  },
};
