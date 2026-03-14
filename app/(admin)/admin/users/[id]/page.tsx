"use client";
import { use } from "react";
import Image from "next/image";
import useSWR from "swr";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Select,
  SelectItem,
  Skeleton,
  useDisclosure,
} from "@heroui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

import ConfirmModal from "@/components/ui/ConfirmModal";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");

    return r.json();
  });

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading, mutate } = useSWR(`/api/admin/users/${id}`, fetcher);

  const user = data?.user;
  const recentItems: any[] = data?.recentItems ?? [];
  const itemCount: number = data?.itemCount ?? 0;
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  async function updateRole(newRole: string) {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    mutate();
  }

  async function toggleField(field: string, current: boolean) {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !current }),
    });
    mutate();
  }

  async function deleteUser() {
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });

    if (res.ok) router.push("/admin/users");
    else onDeleteClose();
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <p className="opacity-50">User not found.</p>
        <Button as={NextLink} href="/admin/users" variant="flat">
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button as={NextLink} href="/admin/users" size="sm" variant="flat">
          ← Users
        </Button>
        <h1 className="text-2xl font-bold">User Detail</h1>
      </div>

      {/* Profile card */}
      <Card>
        <CardBody className="flex flex-col sm:flex-row gap-6">
          <Avatar
            isBordered
            className="shrink-0"
            name={user.name || "?"}
            size="lg"
            src={user.image}
          />
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold">{user.name || "—"}</h2>
                <p className="text-sm opacity-60">{user.email}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Chip
                  color={user.role === "admin" ? "warning" : "default"}
                  size="sm"
                  variant="flat"
                >
                  {user.role ?? "user"}
                </Chip>
                <Chip
                  color={
                    user.subscription_status === "premium"
                      ? "success"
                      : "default"
                  }
                  size="sm"
                  variant="flat"
                >
                  {user.subscription_status ?? "free"}
                </Chip>
                {user.isVerified && (
                  <Chip color="primary" size="sm" variant="flat">
                    Verified
                  </Chip>
                )}
                {user.isFeatured && (
                  <Chip color="secondary" size="sm" variant="flat">
                    Featured
                  </Chip>
                )}
              </div>
            </div>

            {user.bio && <p className="text-sm opacity-70">{user.bio}</p>}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="text-center">
                <p className="text-lg font-bold">{itemCount}</p>
                <p className="text-xs opacity-50">Items</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{user.followerCount ?? 0}</p>
                <p className="text-xs opacity-50">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{user.followingCount ?? 0}</p>
                <p className="text-xs opacity-50">Following</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{user.profileViews ?? 0}</p>
                <p className="text-xs opacity-50">Profile Views</p>
              </div>
            </div>

            <p className="text-xs opacity-40">
              Joined{" "}
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "—"}
              {user.location && ` · ${user.location}`}
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">Admin Actions</h2>
        </CardHeader>
        <CardBody className="flex flex-row gap-4 flex-wrap">
          <Select
            className="max-w-40"
            label="Role"
            selectedKeys={[user.role ?? "user"]}
            size="sm"
            onSelectionChange={(keys) => {
              const newRole = Array.from(keys as Set<string>)[0];

              if (newRole) updateRole(newRole);
            }}
          >
            <SelectItem key="user">User</SelectItem>
            <SelectItem key="admin">Admin</SelectItem>
          </Select>

          <Button
            color={user.isVerified ? "success" : "default"}
            size="sm"
            variant="flat"
            onPress={() => toggleField("isVerified", user.isVerified)}
          >
            {user.isVerified ? "Unverify" : "Mark Verified"}
          </Button>

          <Button
            color={user.isFeatured ? "secondary" : "default"}
            size="sm"
            variant="flat"
            onPress={() => toggleField("isFeatured", user.isFeatured)}
          >
            {user.isFeatured ? "Unfeature" : "Feature User"}
          </Button>

          <Button
            color="danger"
            size="sm"
            variant="flat"
            onPress={onDeleteOpen}
          >
            Delete Account
          </Button>
        </CardBody>
      </Card>

      {/* Closet preview */}
      {recentItems.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">
              Recent Items ({itemCount} total)
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {recentItems.map((item: any) => (
                <div
                  key={item.id}
                  className="border border-divider rounded-xl overflow-hidden"
                >
                  {item.imageUrl ? (
                    <Image
                      unoptimized
                      alt={item.name}
                      className="w-full aspect-square object-cover"
                      height={200}
                      src={item.imageUrl}
                      width={200}
                    />
                  ) : (
                    <div className="w-full aspect-square bg-content2 flex items-center justify-center">
                      <span className="text-xs opacity-40">No image</span>
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    <p className="text-xs opacity-50">{item.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
      <ConfirmModal
        confirmLabel="Delete"
        isOpen={isDeleteOpen}
        message={`Delete user "${user?.name ?? user?.email}"? This cannot be undone.`}
        title="Delete Account"
        onClose={onDeleteClose}
        onConfirm={deleteUser}
      />
    </div>
  );
}
