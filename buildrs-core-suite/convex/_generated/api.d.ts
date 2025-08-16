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
import type * as autoClientManager from "../autoClientManager.js";
import type * as autoClientSetup from "../autoClientSetup.js";
import type * as automationEngine from "../automationEngine.js";
import type * as automationMaintenance from "../automationMaintenance.js";
import type * as automationMonitoring from "../automationMonitoring.js";
import type * as automationScheduler from "../automationScheduler.js";
import type * as automationSchedulerInternal from "../automationSchedulerInternal.js";
import type * as automationSeeds from "../automationSeeds.js";
import type * as automationSystemRobust from "../automationSystemRobust.js";
import type * as automations from "../automations.js";
import type * as automationsStringClient from "../automationsStringClient.js";
import type * as bulkConvert from "../bulkConvert.js";
import type * as campaigns from "../campaigns.js";
import type * as candidateViews from "../candidateViews.js";
import type * as checkSpecificAutomation from "../checkSpecificAutomation.js";
import type * as cleanAutomationSystem from "../cleanAutomationSystem.js";
import type * as companies from "../companies.js";
import type * as companyEnrichment from "../companyEnrichment.js";
import type * as contacts from "../contacts.js";
import type * as creditBusinessLogic from "../creditBusinessLogic.js";
import type * as creditSystem from "../creditSystem.js";
import type * as creditSystemSecure from "../creditSystemSecure.js";
import type * as crons from "../crons.js";
import type * as deals from "../deals.js";
import type * as exactLeadConversion from "../exactLeadConversion.js";
import type * as exactLeadDatabase from "../exactLeadDatabase.js";
import type * as http from "../http.js";
import type * as leadConversion from "../leadConversion.js";
import type * as leadUpdater from "../leadUpdater.js";
import type * as leads from "../leads.js";
import type * as migrations from "../migrations.js";
import type * as payAsYouScale from "../payAsYouScale.js";
import type * as payAsYouScaleSchema from "../payAsYouScaleSchema.js";
import type * as payAsYouScaleStripe from "../payAsYouScaleStripe.js";
import type * as pilotUpgradeBonus from "../pilotUpgradeBonus.js";
import type * as pipelines from "../pipelines.js";
import type * as propositions from "../propositions.js";
import type * as repairSystemIntegrity from "../repairSystemIntegrity.js";
import type * as resetAutomationTemplates from "../resetAutomationTemplates.js";
import type * as sampleData from "../sampleData.js";
import type * as searchViews from "../searchViews.js";
import type * as seedCreditPackages from "../seedCreditPackages.js";
import type * as seedPayAsYouScale from "../seedPayAsYouScale.js";
import type * as setupClientAutomations from "../setupClientAutomations.js";
import type * as setupStripeProducts from "../setupStripeProducts.js";
import type * as stageAutomations from "../stageAutomations.js";
import type * as stages from "../stages.js";
import type * as stripeIntegration from "../stripeIntegration.js";
import type * as stripeIntegrationRobust from "../stripeIntegrationRobust.js";
import type * as stripeReal from "../stripeReal.js";
import type * as systemValidation from "../systemValidation.js";
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
  autoClientManager: typeof autoClientManager;
  autoClientSetup: typeof autoClientSetup;
  automationEngine: typeof automationEngine;
  automationMaintenance: typeof automationMaintenance;
  automationMonitoring: typeof automationMonitoring;
  automationScheduler: typeof automationScheduler;
  automationSchedulerInternal: typeof automationSchedulerInternal;
  automationSeeds: typeof automationSeeds;
  automationSystemRobust: typeof automationSystemRobust;
  automations: typeof automations;
  automationsStringClient: typeof automationsStringClient;
  bulkConvert: typeof bulkConvert;
  campaigns: typeof campaigns;
  candidateViews: typeof candidateViews;
  checkSpecificAutomation: typeof checkSpecificAutomation;
  cleanAutomationSystem: typeof cleanAutomationSystem;
  companies: typeof companies;
  companyEnrichment: typeof companyEnrichment;
  contacts: typeof contacts;
  creditBusinessLogic: typeof creditBusinessLogic;
  creditSystem: typeof creditSystem;
  creditSystemSecure: typeof creditSystemSecure;
  crons: typeof crons;
  deals: typeof deals;
  exactLeadConversion: typeof exactLeadConversion;
  exactLeadDatabase: typeof exactLeadDatabase;
  http: typeof http;
  leadConversion: typeof leadConversion;
  leadUpdater: typeof leadUpdater;
  leads: typeof leads;
  migrations: typeof migrations;
  payAsYouScale: typeof payAsYouScale;
  payAsYouScaleSchema: typeof payAsYouScaleSchema;
  payAsYouScaleStripe: typeof payAsYouScaleStripe;
  pilotUpgradeBonus: typeof pilotUpgradeBonus;
  pipelines: typeof pipelines;
  propositions: typeof propositions;
  repairSystemIntegrity: typeof repairSystemIntegrity;
  resetAutomationTemplates: typeof resetAutomationTemplates;
  sampleData: typeof sampleData;
  searchViews: typeof searchViews;
  seedCreditPackages: typeof seedCreditPackages;
  seedPayAsYouScale: typeof seedPayAsYouScale;
  setupClientAutomations: typeof setupClientAutomations;
  setupStripeProducts: typeof setupStripeProducts;
  stageAutomations: typeof stageAutomations;
  stages: typeof stages;
  stripeIntegration: typeof stripeIntegration;
  stripeIntegrationRobust: typeof stripeIntegrationRobust;
  stripeReal: typeof stripeReal;
  systemValidation: typeof systemValidation;
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
