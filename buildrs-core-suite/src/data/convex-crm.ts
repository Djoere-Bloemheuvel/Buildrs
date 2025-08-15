// New Convex-based CRM data layer
// This replaces the Supabase-based src/data/crm.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// ===============
// COMPANIES
// ===============

export const useCompanies = (search?: string) => {
  return useQuery(api.companies.list, { search });
};

export const useCompany = (id: Id<"companies">) => {
  return useQuery(api.companies.getById, { id });
};

export const useCreateCompany = () => {
  return useMutation(api.companies.create);
};

export const useUpdateCompany = () => {
  return useMutation(api.companies.update);
};

export const useDeleteCompany = () => {
  return useMutation(api.companies.remove);
};

// Helper function for backward compatibility
export async function fetchCompanies(search?: string) {
  // This is now handled by the useCompanies hook
  // Keep this for components that haven't been migrated yet
  console.warn("fetchCompanies is deprecated, use useCompanies hook instead");
  return [];
}

// ===============
// CONTACTS
// ===============

export const useContacts = (options?: {
  companyId?: Id<"companies">;
  clientId?: Id<"clients">;
  search?: string;
  status?: string;
}) => {
  return useQuery(api.contacts.list, options);
};

export const useContact = (id: Id<"contacts">) => {
  return useQuery(api.contacts.getById, { id });
};

export const useContactsByCompany = (companyId: Id<"companies">) => {
  return useQuery(api.contacts.getByCompany, { companyId });
};

export const useCreateContact = () => {
  return useMutation(api.contacts.create);
};

export const useUpdateContact = () => {
  return useMutation(api.contacts.update);
};

export const useDeleteContact = () => {
  return useMutation(api.contacts.remove);
};

// ===============
// DEALS
// ===============

export const useDeals = (filters?: {
  clientId?: Id<"clients">;
  contactId?: Id<"contacts">;
  companyId?: Id<"companies">;
  pipelineId?: Id<"pipelines">;
  stageId?: Id<"stages">;
  status?: string;
  ownerId?: Id<"profiles">;
}) => {
  return useQuery(api.deals.list, filters);
};

export const useDeal = (id: Id<"deals">) => {
  return useQuery(api.deals.getById, { id });
};

export const useDealLineItems = (dealId: Id<"deals">) => {
  return useQuery(api.deals.getLineItems, { dealId });
};

export const useCreateDeal = () => {
  return useMutation(api.deals.create);
};

export const useUpdateDeal = () => {
  return useMutation(api.deals.update);
};

export const useDeleteDeal = () => {
  return useMutation(api.deals.remove);
};

export const useAddDealLineItem = () => {
  return useMutation(api.deals.addLineItem);
};

// ===============
// MIGRATION HELPERS
// ===============

// These functions help with gradual migration from Supabase to Convex
export const convexHooks = {
  // Company hooks
  companies: {
    useList: useCompanies,
    useById: useCompany,
    useCreate: useCreateCompany,
    useUpdate: useUpdateCompany,
    useDelete: useDeleteCompany,
  },
  
  // Contact hooks
  contacts: {
    useList: useContacts,
    useById: useContact,
    useByCompany: useContactsByCompany,
    useCreate: useCreateContact,
    useUpdate: useUpdateContact,
    useDelete: useDeleteContact,
  },
  
  // Deal hooks
  deals: {
    useList: useDeals,
    useById: useDeal,
    useLineItems: useDealLineItems,
    useCreate: useCreateDeal,
    useUpdate: useUpdateDeal,
    useDelete: useDeleteDeal,
    useAddLineItem: useAddDealLineItem,
  },
};

export default convexHooks;