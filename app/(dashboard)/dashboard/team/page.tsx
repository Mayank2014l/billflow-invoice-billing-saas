"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, Plus, Trash2, Mail, Loader2, ShieldCheck, 
  UserPlus, UserMinus, ShieldAlert, CheckCircle, RefreshCw, X 
} from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { useOrg } from "@/hooks/use-org";

interface Member {
  id: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  createdAt: string;
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
}

interface Invite {
  id: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  createdAt: string;
  expiresAt: string;
}

export default function TeamPage() {
  const { activeOrg } = useOrg();
  const { isOwner, isAdmin, canChangeRoles, canManageTeam } = usePermissions();

  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Row action loadings
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/team");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setInvites(data.invites || []);
      }
    } catch (error) {
      console.error("Failed to load team data:", error);
      toast.error("Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [activeOrg]);

  const handleRoleChange = async (memberUserId: string, newRole: "OWNER" | "ADMIN" | "MEMBER", email: string) => {
    if (!confirm(`Are you sure you want to change ${email}'s role to ${newRole}?`)) return;
    
    setActionLoadingId(memberUserId);
    try {
      const res = await fetch(`/api/team/members/${memberUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        toast.success(`Role for ${email} updated successfully!`);
        fetchTeamData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update role");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveMember = async (memberUserId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from this workspace?`)) return;

    setActionLoadingId(memberUserId);
    try {
      const res = await fetch(`/api/team/members/${memberUserId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`${email} removed from workspace.`);
        fetchTeamData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to remove member");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevokeInvite = async (inviteId: string, email: string) => {
    if (!confirm(`Revoke invitation sent to ${email}?`)) return;

    setActionLoadingId(inviteId);
    try {
      const res = await fetch(`/api/team/invite/${inviteId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`Invitation for ${email} revoked.`);
        fetchTeamData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to revoke invitation");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Email is required");
      return;
    }

    setIsSubmittingInvite(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invite");

      toast.success(`Invitation dispatched to ${inviteEmail}`);
      setInviteEmail("");
      setInviteRole("MEMBER");
      setInviteModalOpen(false);
      fetchTeamData();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-violet-50 text-violet-750 border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-850";
      case "ADMIN":
        return "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
      default:
        return "bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900/60 dark:text-zinc-400 dark:border-zinc-800";
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Settings</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage workspace roles, permission levels, and dispatch pending invitations
          </p>
        </div>

        {canManageTeam && (
          <button
            onClick={() => setInviteModalOpen(true)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-violet-500/10 flex items-center gap-1.5 transition-all active:scale-98"
          >
            <UserPlus className="h-4 w-4" /> Invite Member
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 animate-pulse flex justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                <div className="space-y-2">
                  <div className="h-4.5 w-32 bg-zinc-250 dark:bg-zinc-800 rounded" />
                  <div className="h-3 w-48 bg-zinc-150 dark:bg-zinc-850 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Active Members List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-bold text-sm flex items-center gap-1.5">
              <Users className="h-4.5 w-4.5 text-violet-500" /> Active Workspace Members ({members.length})
            </h2>
            
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm divide-y divide-zinc-150 dark:divide-zinc-800">
              {members.map((member) => (
                <div 
                  key={member.id}
                  className="p-5 flex items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10 transition-colors"
                >
                  <div className="flex items-center gap-3 truncate">
                    <img
                      src={member.user?.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80"}
                      alt="Avatar"
                      className="h-10 w-10 rounded-full object-cover shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-800"
                    />
                    <div className="truncate text-xs">
                      <div className="font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                        {member.user?.name || "Pending Name"}
                      </div>
                      <div className="text-zinc-500 mt-0.5">{member.user?.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Role dropdown/badge */}
                    {canChangeRoles && member.role !== "OWNER" ? (
                      <select
                        disabled={actionLoadingId === member.userId}
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.userId, e.target.value as any, member.user.email)}
                        className="p-1 px-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-xs font-medium focus:outline-none"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MEMBER">Member</option>
                      </select>
                    ) : (
                      <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-bold uppercase tracking-wider ${getRoleBadgeStyle(member.role)}`}>
                        {member.role}
                      </span>
                    )}

                    {/* Delete member */}
                    {isOwner && member.role !== "OWNER" && (
                      <button
                        onClick={() => handleRemoveMember(member.userId, member.user.email)}
                        disabled={actionLoadingId === member.userId}
                        className="p-1.5 text-zinc-450 hover:text-red-500 rounded hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors disabled:opacity-50"
                        title="Remove member"
                      >
                        {actionLoadingId === member.userId ? (
                          <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                        ) : (
                          <Trash2 className="h-4.5 w-4.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending invites */}
          <div className="space-y-4">
            <h2 className="font-bold text-sm flex items-center gap-1.5">
              <Mail className="h-4.5 w-4.5 text-violet-500" /> Pending Invitations ({invites.length})
            </h2>

            {invites.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center text-xs text-zinc-400">
                No pending invitations. Click &quot;Invite Member&quot; to invite.
              </div>
            ) : (
              <div className="space-y-3">
                {invites.map((invite) => (
                  <div 
                    key={invite.id} 
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between gap-3 text-xs shadow-sm"
                  >
                    <div>
                      <div className="font-bold truncate text-zinc-850 dark:text-zinc-200">{invite.email}</div>
                      <div className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1.5">
                        <span>Role: <strong className="font-bold uppercase">{invite.role}</strong></span>
                        <span>&bull;</span>
                        <span>Expires: {new Date(invite.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {canManageTeam && (
                      <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-850 pt-2.5">
                        <button
                          onClick={() => handleRevokeInvite(invite.id, invite.email)}
                          disabled={actionLoadingId === invite.id}
                          className="px-2.5 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-955/20 border border-transparent rounded text-[10px] font-bold flex items-center gap-0.5"
                        >
                          Revoke
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Invite Member Dialog Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-1.5">
                <UserPlus className="h-4.5 w-4.5 text-violet-500" /> Invite Team Member
              </h3>
              <button onClick={() => setInviteModalOpen(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-500 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-500 mb-1">Workspace Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 focus:outline-none font-semibold text-zinc-800 dark:text-zinc-200"
                >
                  <option value="MEMBER">Member (Read Only access)</option>
                  <option value="ADMIN">Admin (Full Edit, invoice dispatch)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-150 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvite}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg flex items-center gap-1 active:scale-98 disabled:opacity-50"
                >
                  {isSubmittingInvite && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Dispatch Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
