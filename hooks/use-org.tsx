"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Organization, Role } from "@prisma/client";
import { toast } from "sonner";

interface OrgContextType {
  organizations: Organization[];
  activeOrg: Organization | null;
  role: Role | null;
  isLoading: boolean;
  refreshOrgs: () => Promise<void>;
  switchOrg: (orgId: string) => Promise<void>;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrgs = async () => {
    try {
      const res = await fetch("/api/organizations");
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.organizations || []);
        setActiveOrg(data.activeOrg || null);
        setRole(data.role || null);
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const switchOrg = async (orgId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/organizations/switch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId }),
      });
      if (res.ok) {
        toast.success("Switched organization");
        await fetchOrgs();
        window.location.reload();
      } else {
        toast.error("Failed to switch organization");
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while switching organization");
      setIsLoading(false);
    }
  };

  return (
    <OrgContext.Provider
      value={{
        organizations,
        activeOrg,
        role,
        isLoading,
        refreshOrgs: fetchOrgs,
        switchOrg,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error("useOrg must be used within an OrgProvider");
  }
  return context;
}
