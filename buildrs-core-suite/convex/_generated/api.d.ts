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
import type * as cleanupDuplicates from "../cleanupDuplicates.js";
import type * as companies from "../companies.js";
import type * as companyEnrichment from "../companyEnrichment.js";
import type * as contacts from "../contacts.js";
import type * as creditBusinessLogic from "../creditBusinessLogic.js";
import type * as creditSystem from "../creditSystem.js";
import type * as creditSystemSecure from "../creditSystemSecure.js";
import type * as crons from "../crons.js";
import type * as deals from "../deals.js";
import type * as denormalizedMigration from "../denormalizedMigration.js";
import type * as finalSimplifiedMigration from "../finalSimplifiedMigration.js";
import type * as fullMigration from "../fullMigration.js";
import type * as http from "../http.js";
import type * as leadDatabase from "../leadDatabase.js";
import type * as leadUpdater from "../leadUpdater.js";
import type * as leads from "../leads.js";
import type * as migrationPlan from "../migrationPlan.js";
import type * as migrations from "../migrations.js";
import type * as newCandidateViews from "../newCandidateViews.js";
import type * as newCandidateViewsDenormalized from "../newCandidateViewsDenormalized.js";
import type * as newCandidateViewsSimplified from "../newCandidateViewsSimplified.js";
import type * as newContacts from "../newContacts.js";
import type * as newContactsDenormalized from "../newContactsDenormalized.js";
import type * as newContactsSimplified from "../newContactsSimplified.js";
import type * as newSchema from "../newSchema.js";
import type * as payAsYouScale from "../payAsYouScale.js";
import type * as payAsYouScaleSchema from "../payAsYouScaleSchema.js";
import type * as payAsYouScaleStripe from "../payAsYouScaleStripe.js";
import type * as pilotUpgradeBonus from "../pilotUpgradeBonus.js";
import type * as quickMigration from "../quickMigration.js";
import type * as repairSystemIntegrity from "../repairSystemIntegrity.js";
import type * as schema_backup from "../schema_backup.js";
import type * as searchViews from "../searchViews.js";
import type * as seedCreditPackages from "../seedCreditPackages.js";
import type * as seedPayAsYouScale from "../seedPayAsYouScale.js";
import type * as setupStripeProducts from "../setupStripeProducts.js";
import type * as simpleMigration from "../simpleMigration.js";
import type * as stripeIntegration from "../stripeIntegration.js";
import type * as stripeIntegrationRobust from "../stripeIntegrationRobust.js";
import type * as stripeReal from "../stripeReal.js";
import type * as systemValidation from "../systemValidation.js";
import type * as testPayAsYouScale from "../testPayAsYouScale.js";
import type * as testPilotUpgrade from "../testPilotUpgrade.js";
import type * as testQuery from "../testQuery.js";
import type * as timelineViews from "../timelineViews.js";
import type * as updateStartToPilot from "../updateStartToPilot.js";
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
  cleanupDuplicates: typeof cleanupDuplicates;
  companies: typeof companies;
  companyEnrichment: typeof companyEnrichment;
  contacts: typeof contacts;
  creditBusinessLogic: typeof creditBusinessLogic;
  creditSystem: typeof creditSystem;
  creditSystemSecure: typeof creditSystemSecure;
  crons: typeof crons;
  deals: typeof deals;
  denormalizedMigration: typeof denormalizedMigration;
  finalSimplifiedMigration: typeof finalSimplifiedMigration;
  fullMigration: typeof fullMigration;
  http: typeof http;
  leadDatabase: typeof leadDatabase;
  leadUpdater: typeof leadUpdater;
  leads: typeof leads;
  migrationPlan: typeof migrationPlan;
  migrations: typeof migrations;
  newCandidateViews: typeof newCandidateViews;
  newCandidateViewsDenormalized: typeof newCandidateViewsDenormalized;
  newCandidateViewsSimplified: typeof newCandidateViewsSimplified;
  newContacts: typeof newContacts;
  newContactsDenormalized: typeof newContactsDenormalized;
  newContactsSimplified: typeof newContactsSimplified;
  newSchema: typeof newSchema;
  payAsYouScale: typeof payAsYouScale;
  payAsYouScaleSchema: typeof payAsYouScaleSchema;
  payAsYouScaleStripe: typeof payAsYouScaleStripe;
  pilotUpgradeBonus: typeof pilotUpgradeBonus;
  quickMigration: typeof quickMigration;
  repairSystemIntegrity: typeof repairSystemIntegrity;
  schema_backup: typeof schema_backup;
  searchViews: typeof searchViews;
  seedCreditPackages: typeof seedCreditPackages;
  seedPayAsYouScale: typeof seedPayAsYouScale;
  setupStripeProducts: typeof setupStripeProducts;
  simpleMigration: typeof simpleMigration;
  stripeIntegration: typeof stripeIntegration;
  stripeIntegrationRobust: typeof stripeIntegrationRobust;
  stripeReal: typeof stripeReal;
  systemValidation: typeof systemValidation;
  testPayAsYouScale: typeof testPayAsYouScale;
  testPilotUpgrade: typeof testPilotUpgrade;
  testQuery: typeof testQuery;
  timelineViews: typeof timelineViews;
  updateStartToPilot: typeof updateStartToPilot;
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
