"use client";

import { createContext, useContext } from "react";
import type { Category, Subcategory, Tag } from "@/lib/db/schema";

type OrganizeContextValue = {
  categories: Category[];
  subcategories: Subcategory[];
  tags: Tag[];
};

const OrganizeContext = createContext<OrganizeContextValue | null>(null);

export function OrganizeProvider({
  value,
  children,
}: {
  value: OrganizeContextValue;
  children: React.ReactNode;
}) {
  return (
    <OrganizeContext.Provider value={value}>
      {children}
    </OrganizeContext.Provider>
  );
}

export function useOrganize() {
  const ctx = useContext(OrganizeContext);
  if (!ctx) throw new Error("useOrganize must be used within OrganizeProvider");
  return ctx;
}
