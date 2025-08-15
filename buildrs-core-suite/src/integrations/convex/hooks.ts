import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

// Company hooks
export const useCompanies = (search?: string, limit?: number) => {
  return useQuery(api.companies.list, { search, limit });
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

// Contact hooks
export const useContacts = (filters?: {
  companyId?: Id<"companies">;
  clientId?: Id<"clients">;
  search?: string;
  status?: string;
  limit?: number;
}) => {
  return useQuery(api.contacts.list, filters);
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

// Deal hooks
export const useDeals = (filters?: {
  clientId?: Id<"clients">;
  contactId?: Id<"contacts">;
  companyId?: Id<"companies">;
  pipelineId?: Id<"pipelines">;
  stageId?: Id<"stages">;
  status?: string;
  ownerId?: Id<"profiles">;
  limit?: number;
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