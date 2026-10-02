"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { FormField } from "@/components/ui/FormField";
import { Dialog } from "@/components/ui/Dialog";
import { Alert } from "@/components/ui/Alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { getUsers, createUser, updateUser } from "@/services/api/users";
import { getUnits } from "@/services/api/units";
import { queryKeys } from "@/constants/queryKeys";
import { useAuth } from "@/features/auth/context/AuthContext";
import { UserItem, SystemRole, UserStatus } from "@/types/user";
import { Plus, Users, Edit3, ShieldAlert } from "lucide-react";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  // Filters
  const [filterUnit, setFilterUnit] = React.useState<string>("");
  const [filterStatus, setFilterStatus] = React.useState<string>("");

  // Create User Dialog
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createName, setCreateName] = React.useState("");
  const [createEmail, setCreateEmail] = React.useState("");
  const [createUnitId, setCreateUnitId] = React.useState("");
  const [createSystemRole, setCreateSystemRole] = React.useState<SystemRole>("USER");
  const [createError, setCreateError] = React.useState<string | null>(null);

  // Edit User Dialog
  const [editingUser, setEditingUser] = React.useState<UserItem | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editUnitId, setEditUnitId] = React.useState("");
  const [editSystemRole, setEditSystemRole] = React.useState<SystemRole>("USER");
  const [editStatus, setEditStatus] = React.useState<UserStatus>("ACTIVE");
  const [editError, setEditError] = React.useState<string | null>(null);

  const { data: units } = useQuery({
    queryKey: queryKeys.units(),
    queryFn: getUnits,
  });

  const {
    data: users,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.users({ unit_id: filterUnit, status: filterStatus }),
    queryFn: () =>
      getUsers({
        unit_id: filterUnit || undefined,
        status: filterStatus || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
      setIsCreateOpen(false);
      resetCreateForm();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to create user.";
      setCreateError(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: {
        name?: string;
        unit_id?: string;
        status?: UserStatus;
        system_role?: SystemRole;
      };
    }) => updateUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
      setEditingUser(null);
      setEditError(null);
    },
    onError: (err: unknown) => {
      // Refresh user list authoritative state to ensure UI is in sync while preserving form
      queryClient.invalidateQueries({ queryKey: queryKeys.users() });
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to update user due to status validation violation.";
      setEditError(msg);
    },
  });

  const resetCreateForm = () => {
    setCreateName("");
    setCreateEmail("");
    setCreateUnitId(units?.[0]?.id || "");
    setCreateSystemRole("USER");
    setCreateError(null);
  };

  const handleOpenCreate = () => {
    resetCreateForm();
    setCreateUnitId(units?.[0]?.id || "");
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditUnitId(user.unit?.id || units?.[0]?.id || "");
    setEditSystemRole(user.system_role);
    setEditStatus(user.status);
    setEditError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createEmail.trim()) {
      setCreateError("User name and email are required.");
      return;
    }
    createMutation.mutate({
      name: createName.trim(),
      email: createEmail.trim(),
      unit_id: createUnitId || units?.[0]?.id || "unit-ops",
      system_role: createSystemRole,
      status: "ACTIVE",
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);
    updateMutation.mutate({
      userId: editingUser.id,
      payload: {
        name: editName.trim() || undefined,
        unit_id: editUnitId || undefined,
        system_role: editSystemRole,
        status: editStatus,
      },
    });
  };

  return (
    <ContentContainer>
      <PageHeader
        title="User Management"
        description="Internal user directory and Sentinel system role configurations."
        action={
          isAdmin && (
            <Button variant="primary" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Add User
            </Button>
          )
        }
      />

      {/* Filter Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="w-48">
          <label htmlFor="filter-unit" className="block text-xs font-semibold text-slate-500 mb-1">
            Business Unit
          </label>
          <Select
            id="filter-unit"
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
          >
            <option value="">All Units</option>
            {units?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.code})
              </option>
            ))}
          </Select>
        </div>

        <div className="w-40">
          <label htmlFor="filter-status" className="block text-xs font-semibold text-slate-500 mb-1">
            Account Status
          </label>
          <Select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </Select>
        </div>

        {(filterUnit || filterStatus) && (
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterUnit("");
                setFilterStatus("");
              }}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <LoadingState label="Loading user directory..." />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !users || users.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8 text-slate-400" />}
          title="No Users Found"
          description="No users match the selected filter criteria."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>System Role</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="w-20 text-right">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-slate-900">
                  {u.name}
                </TableCell>
                <TableCell className="text-slate-600 font-mono text-xs">
                  {u.email}
                </TableCell>
                <TableCell className="text-slate-700">
                  {u.unit?.name || "Sentinel"} ({u.unit?.code || "GEN"})
                </TableCell>
                <TableCell>
                  <Badge
                    variant={u.system_role === "ADMIN" ? "default" : "secondary"}
                    dot
                  >
                    {u.system_role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={u.status === "ACTIVE" ? "success" : "destructive"}
                    dot
                  >
                    {u.status}
                  </Badge>
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(u)}
                      aria-label={`Edit user ${u.name}`}
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1 text-slate-600" aria-hidden="true" />
                      Edit
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog Tambah User */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New User"
        description="Register a new user into Sentinel."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateSubmit}
              isLoading={createMutation.isPending}
            >
              Save User
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <Alert variant="destructive" title="Failed to Add User">
              {createError}
            </Alert>
          )}

          <FormField label="Full Name" id="create-name" required>
            <Input
              id="create-name"
              placeholder="Risk Analyst 1"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              disabled={createMutation.isPending}
            />
          </FormField>

          <FormField label="Email" id="create-email" required>
            <Input
              id="create-email"
              type="email"
              placeholder="user@jawir.local"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              disabled={createMutation.isPending}
            />
          </FormField>

          <FormField label="Business Unit" id="create-unit" required>
            <Select
              id="create-unit"
              value={createUnitId}
              onChange={(e) => setCreateUnitId(e.target.value)}
              disabled={createMutation.isPending}
            >
              {units?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.code})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="System Role"
            id="create-role"
            required
            hint="System role controls administrative menu access, distinct from workflow roles."
          >
            <Select
              id="create-role"
              value={createSystemRole}
              onChange={(e) => setCreateSystemRole(e.target.value as SystemRole)}
              disabled={createMutation.isPending}
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </Select>
          </FormField>
        </form>
      </Dialog>

      {/* Dialog Edit User with Invariant Guard */}
      <Dialog
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Edit User: ${editingUser?.name || ""}`}
        description="Update profile, business unit, system role, or account status."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
              disabled={updateMutation.isPending}
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleEditSubmit}
              isLoading={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editError && (
            <Alert
              variant="warning"
              title="Update Rejected by Security Guard"
            >
              <div className="flex items-start gap-2 mt-1">
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
                <span>{editError}</span>
              </div>
            </Alert>
          )}

          <FormField label="Full Name" id="edit-name" required>
            <Input
              id="edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={updateMutation.isPending}
            />
          </FormField>

          <FormField label="Business Unit" id="edit-unit" required>
            <Select
              id="edit-unit"
              value={editUnitId}
              onChange={(e) => setEditUnitId(e.target.value)}
              disabled={updateMutation.isPending}
            >
              {units?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.code})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="System Role"
            id="edit-role"
            required
            hint="Notice: The system must maintain at least one ACTIVE ADMIN at all times."
          >
            <Select
              id="edit-role"
              value={editSystemRole}
              onChange={(e) => setEditSystemRole(e.target.value as SystemRole)}
              disabled={updateMutation.isPending}
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </Select>
          </FormField>

          <FormField
            label="Account Status"
            id="edit-status"
            required
            hint="Users who are active participants in in-flight cases cannot be deactivated."
          >
            <Select
              id="edit-status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as UserStatus)}
              disabled={updateMutation.isPending}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </Select>
          </FormField>
        </form>
      </Dialog>
    </ContentContainer>
  );
}
