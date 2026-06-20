"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Loader2, Mail, Check, AlertCircle, ArrowRight, LogOut, Building } from "lucide-react";
import { toast } from "sonner";

export default function InviteTokenPage() {
  const router = useRouter();
  const params = useParams() as { token: string };
  const { token } = params;
  const { data: session, status } = useSession();

  const [inviteDetails, setInviteDetails] = useState<any>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchInvite() {
      try {
        const res = await fetch(`/api/invites/${token}`);
        const data = await res.json();
        
        if (!res.ok) {
          setErrorMsg(data.error || "Failed to load invitation");
        } else {
          setInviteDetails(data);
        }
      } catch (error) {
        setErrorMsg("Failed to connect to server");
      } finally {
        setLoadingInvite(false);
      }
    }
    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/invites/${token}/accept`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to accept invitation");
      }

      toast.success("Joined organization successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Could not accept invite");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOutAndRedirect = async () => {
    await signOut({ callbackUrl: `/login?callbackUrl=/invite/${token}` });
  };

  if (loadingInvite) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600 mb-2" />
        <span className="text-xs font-semibold text-zinc-500">Checking invitation validity...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="h-10 w-10 rounded bg-violet-600 flex items-center justify-center text-white font-bold text-xl mx-auto shadow-md shadow-violet-500/10 mb-4">
            BF
          </div>
          <h1 className="text-xl font-bold">Workspace Invitation</h1>
        </div>

        {errorMsg ? (
          <div className="space-y-4 text-center">
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-lg text-xs flex items-center justify-center gap-2 font-medium">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => router.push("/")}
              className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold rounded-lg"
            >
              Go to Landing Page
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                <strong className="text-zinc-800 dark:text-zinc-200">{inviteDetails?.inviterName}</strong> has invited you to join:
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 dark:bg-violet-955/20 border border-violet-100 dark:border-violet-900/40 rounded-xl font-extrabold text-sm text-violet-750 dark:text-violet-300 mx-auto">
                <Building className="h-4.5 w-4.5" /> {inviteDetails?.organizationName}
              </div>
              <p className="text-[10px] text-zinc-400">
                Role assigned: <span className="font-bold">{inviteDetails?.role}</span>
              </p>
            </div>

            <hr className="border-zinc-150 dark:border-zinc-800" />

            {status === "unauthenticated" ? (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-955/10 text-amber-600 rounded-lg text-xs leading-normal">
                  You must be signed in to accept this invitation. Click the button below to sign in or sign up first.
                </div>
                <button
                  onClick={() => router.push(`/login?callbackUrl=/invite/${token}`)}
                  className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 active:scale-98 shadow-md shadow-violet-500/10"
                >
                  Sign In to Join <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : session?.user?.email?.toLowerCase() !== inviteDetails?.email?.toLowerCase() ? (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-955/10 text-amber-600 rounded-lg text-xs leading-normal space-y-1.5">
                  <p>This invite was sent to <strong className="font-bold">{inviteDetails?.email}</strong>.</p>
                  <p>You are currently signed in as <strong className="font-bold text-zinc-900 dark:text-zinc-150">{session?.user?.email}</strong>.</p>
                </div>
                <button
                  onClick={handleSignOutAndRedirect}
                  className="w-full py-2.5 bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out & Switch Accounts
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-955/10 text-green-650 rounded-lg text-xs flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-green-500 shrink-0" />
                  <span>Authenticated as {session?.user?.email}</span>
                </div>
                <button
                  onClick={handleAccept}
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 active:scale-98 shadow-lg shadow-violet-500/10 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Accepting...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> Accept Invitation & Join
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
