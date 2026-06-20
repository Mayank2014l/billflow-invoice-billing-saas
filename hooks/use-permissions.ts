import { useOrg } from "./use-org";

export function usePermissions() {
  const { role } = useOrg();

  const isOwner = role === "OWNER";
  const isAdmin = role === "ADMIN" || role === "OWNER";
  const isMember = role === "MEMBER" || role === "ADMIN" || role === "OWNER";

  return {
    role,
    isOwner,
    isAdmin,
    isMember,
    canCreateEditInvoices: isAdmin,
    canManageBilling: isOwner,
    canDeleteOrg: isOwner,
    canManageTeam: isAdmin,
    canChangeRoles: isOwner,
  };
}
