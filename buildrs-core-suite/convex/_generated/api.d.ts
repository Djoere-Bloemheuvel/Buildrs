/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as analyticsViews from "../analyticsViews.js";
import type * as apolloProcessor from "../apolloProcessor.js";
import type * as auth from "../auth.js";
import type * as candidateViews from "../candidateViews.js";
import type * as companies from "../companies.js";
import type * as companyEnrichment from "../companyEnrichment.js";
import type * as contacts from "../contacts.js";
import type * as deals from "../deals.js";
import type * as leadDatabase from "../leadDatabase.js";
import type * as migrations from "../migrations.js";
import type * as quickMigration from "../quickMigration.js";
import type * as searchViews from "../searchViews.js";
import type * as simpleMigration from "../simpleMigration.js";
import type * as testQuery from "../testQuery.js";
import type * as timelineViews from "../timelineViews.js";
import type * as views from "../views.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analyticsViews: typeof analyticsViews;
  apolloProcessor: typeof apolloProcessor;
  auth: typeof auth;
  candidateViews: typeof candidateViews;
  companies: typeof companies;
  companyEnrichment: typeof companyEnrichment;
  contacts: typeof contacts;
  deals: typeof deals;
  leadDatabase: typeof leadDatabase;
  migrations: typeof migrations;
  quickMigration: typeof quickMigration;
  searchViews: typeof searchViews;
  simpleMigration: typeof simpleMigration;
  testQuery: typeof testQuery;
  timelineViews: typeof timelineViews;
  views: typeof views;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
