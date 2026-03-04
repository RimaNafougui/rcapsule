"use client";
import { Link, Divider } from "@heroui/react";
import { ArrowRight } from "lucide-react";
import { FaGithub, FaInstagram, FaTwitter } from "react-icons/fa";

import { Logo } from "@/components/ui/logo";
import { DSInput } from "@/components/ui/input";
import { Container } from "@/components/ui/container";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Product",
      links: [
        { name: "Features", href: "/features" },
        { name: "Pricing", href: "/pricing" },
        { name: "Download App", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about" },
        { name: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Refund Policy", href: "/refund-policy" },
      ],
    },
  ];

  return (
    <footer className="w-full border-t border-divider bg-background pt-16 pb-8">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <Link className="text-foreground w-fit" href="/">
              <Logo />
            </Link>
            <p className="text-default-500 text-sm leading-relaxed max-w-sm">
              Digitizing your wardrobe for a smarter, more sustainable
              lifestyle. Join the future of fashion management.
            </p>

            <div className="flex gap-2 max-w-sm mt-2 items-end">
              <DSInput
                placeholder="Enter your email"
                size="sm"
                variant="underline"
              />
              <button
                aria-label="Subscribe"
                className="p-2 hover:bg-default-100 transition-colors duration-200"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {footerLinks.map((section) => (
              <div key={section.title} className="flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/50">
                  {section.title}
                </h3>
                <ul className="flex flex-col gap-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        className="text-sm transition-colors duration-200 hover:underline underline-offset-4"
                        color="foreground"
                        href={link.href}
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Divider className="my-8" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p className="text-xs text-default-400">
              &copy; {currentYear} rcapsule. All rights reserved.
            </p>
            <span className="hidden sm:inline text-default-300">&middot;</span>
            <Link
              className="text-xs text-default-400 hover:text-foreground transition-colors duration-200"
              href="mailto:nafouguirima@gmail.com"
            >
              nafouguirima@gmail.com
            </Link>
          </div>

          <div className="flex gap-6">
            <Link
              isExternal
              color="foreground"
              href="https://github.com/Mercuryy200"
            >
              <FaGithub
                className="hover:text-default-500 transition-colors duration-200"
                size={20}
              />
            </Link>
            <Link isExternal color="foreground" href="https://twitter.com">
              <FaTwitter
                className="hover:text-default-500 transition-colors duration-200"
                size={20}
              />
            </Link>
            <Link
              isExternal
              color="foreground"
              href="https://instagram.com/Mercuryy.200"
            >
              <FaInstagram
                className="hover:text-default-500 transition-colors duration-200"
                size={20}
              />
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
