"use client";
import { useState } from "react";
import useSWR from "swr";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Select,
  SelectItem,
  Skeleton,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import NextLink from "next/link";

import ConfirmModal from "@/components/ui/ConfirmModal";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");

    return r.json();
  });

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [subscription, setSubscription] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    ...(search && { search }),
    ...(role && { role }),
    ...(subscription && { subscription }),
  });

  const { data, isLoading, mutate } = useSWR(
    `/api/admin/users?${params}`,
    fetcher,
  );

  const users: any[] = data?.users ?? [];
  const total: number = data?.total ?? 0;
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  async function toggleField(userId: string, field: string, current: boolean) {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !current }),
    });
    mutate();
  }

  function deleteUser(userId: string, name: string) {
    setDeleteTarget({ id: userId, name });
    onDeleteOpen();
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" });
    onDeleteClose();
    setDeleteTarget(null);
    mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm opacity-50 mt-1">{total} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          className="max-w-64"
          placeholder="Search by name or email..."
          size="sm"
          value={search}
          onValueChange={(v) => {
            setSearch(v);
            setOffset(0);
          }}
        />
        <Select
          className="max-w-36"
          placeholder="Role"
          selectedKeys={role ? [role] : []}
          size="sm"
          onSelectionChange={(keys) => {
            setRole(Array.from(keys as Set<string>)[0] ?? "");
            setOffset(0);
          }}
        >
          <SelectItem key="user">User</SelectItem>
          <SelectItem key="admin">Admin</SelectItem>
        </Select>
        <Select
          className="max-w-40"
          placeholder="Subscription"
          selectedKeys={subscription ? [subscription] : []}
          size="sm"
          onSelectionChange={(keys) => {
            setSubscription(Array.from(keys as Set<string>)[0] ?? "");
            setOffset(0);
          }}
        >
          <SelectItem key="free">Free</SelectItem>
          <SelectItem key="premium">Premium</SelectItem>
        </Select>
        {(search || role || subscription) && (
          <Button
            size="sm"
            variant="flat"
            onPress={() => {
              setSearch("");
              setRole("");
              setSubscription("");
              setOffset(0);
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-divider">
                <th className="text-left px-4 py-3 font-medium opacity-60">
                  User
                </th>
                <th className="text-left px-4 py-3 font-medium opacity-60">
                  Role
                </th>
                <th className="text-left px-4 py-3 font-medium opacity-60">
                  Plan
                </th>
                <th className="text-left px-4 py-3 font-medium opacity-60">
                  Joined
                </th>
                <th className="text-left px-4 py-3 font-medium opacity-60">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-divider">
                      <td className="px-4 py-3" colSpan={5}>
                        <Skeleton className="h-8 w-full rounded-lg" />
                      </td>
                    </tr>
                  ))
                : users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-divider hover:bg-content2 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={u.name || "?"}
                            size="sm"
                            src={u.image}
                          />
                          <div>
                            <p className="font-medium">{u.name || "—"}</p>
                            <p className="text-xs opacity-50">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Chip
                          color={u.role === "admin" ? "warning" : "default"}
                          size="sm"
                          variant="flat"
                        >
                          {u.role ?? "user"}
                        </Chip>
                      </td>
                      <td className="px-4 py-3">
                        <Chip
                          color={
                            u.subscription_status === "premium"
                              ? "success"
                              : "default"
                          }
                          size="sm"
                          variant="flat"
                        >
                          {u.subscription_status ?? "free"}
                        </Chip>
                      </td>
                      <td className="px-4 py-3 opacity-60 whitespace-nowrap">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Tooltip content="View detail">
                            <Button
                              as={NextLink}
                              href={`/admin/users/${u.id}`}
                              size="sm"
                              variant="flat"
                            >
                              View
                            </Button>
                          </Tooltip>
                          <Tooltip
                            content={
                              u.isVerified ? "Unverify" : "Mark verified"
                            }
                          >
                            <Button
                              color={u.isVerified ? "success" : "default"}
                              size="sm"
                              variant="flat"
                              onPress={() =>
                                toggleField(u.id, "isVerified", u.isVerified)
                              }
                            >
                              {u.isVerified ? "Verified" : "Verify"}
                            </Button>
                          </Tooltip>
                          <Tooltip content="Delete user">
                            <Button
                              color="danger"
                              size="sm"
                              variant="flat"
                              onPress={() =>
                                deleteUser(u.id, u.name || u.email)
                              }
                            >
                              Delete
                            </Button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm opacity-50">
            Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              isDisabled={offset === 0}
              size="sm"
              variant="flat"
              onPress={() => setOffset(Math.max(0, offset - limit))}
            >
              Previous
            </Button>
            <Button
              isDisabled={offset + limit >= total}
              size="sm"
              variant="flat"
              onPress={() => setOffset(offset + limit)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      <ConfirmModal
        confirmLabel="Delete"
        isOpen={isDeleteOpen}
        message={
          deleteTarget
            ? `Delete user "${deleteTarget.name}"? This cannot be undone.`
            : ""
        }
        title="Delete User"
        onClose={onDeleteClose}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
