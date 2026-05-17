"use client";
import {
  Dropdown,
  DropdownTrigger,
  Avatar,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import NextLink from "next/link";

import { logout } from "@/lib/actions/auth";
import { useUser } from "@/lib/contexts/UserContext";

export function ProfileDropdown({ user }: { user: any }) {
  const { isAdmin } = useUser();

  if (!user) return null;

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Avatar
          isBordered
          as="button"
          className="transition-transform"
          color="primary"
          name={user.name || "User"}
          size="sm"
          src={user.image || "/images/Default_pfp.png"}
        />
      </DropdownTrigger>
      <DropdownMenu aria-label="Profile Actions" variant="flat">
        <DropdownItem
          key="user-info"
          className="h-14 gap-2 opacity-100 italic"
          textValue="Signed in as"
        >
          <p className="eyebrow text-default-400">Signed in as</p>
          <p className="text-sm font-light text-foreground">{user.email}</p>
        </DropdownItem>

        <DropdownItem key="profile" as={NextLink} href="/profile">
          My Profile
        </DropdownItem>

        <DropdownItem key="wishlist" as={NextLink} href="/wishlist">
          Wishlist
        </DropdownItem>

        <DropdownItem key="collections" as={NextLink} href="/collections">
          Collections
        </DropdownItem>

        <DropdownItem key="settings" as={NextLink} href="/settings">
          Settings
        </DropdownItem>

        {isAdmin ? (
          <DropdownItem
            key="admin"
            as={NextLink}
            className="text-warning"
            color="warning"
            href="/admin"
          >
            Admin Panel
          </DropdownItem>
        ) : null}

        <DropdownItem
          key="logout"
          className="text-danger"
          color="danger"
          onPress={() => logout()}
        >
          Log Out
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
