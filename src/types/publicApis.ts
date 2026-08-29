// Types for Public APIs Ingestion, Cleansing & Vertical Aggregation Engine
export type ApiAuthType = "No Auth" | "API Key" | "OAuth" | "Bearer" | "User-Agent";
export type ApiCorsType = "yes" | "no" | "unknown";
export type ApiDomainCategory =
  | "Finance & Crypto"
  | "Geocoding & Maps"
  | "Weather & Environment"
  | "Logistics & Transport"
  | "DevOps & Cloud"
  | "CyberSecurity & Threat"
  | "E-Commerce & Trade"
  | "AI & Machine Learning"
  | "News & Media"
  | "Government & Open Data"
  | "Utilities & Tools";

export interface RawPublicApiItem {
  id: string;
  name: string;
  description: string;
  auth: string;
  https: boolean;
  cors: string;
  link: string;
  category: string;
}

export interface CleansedApiItem {
  id: string;
  name: string;
  description: string;
  category: ApiDomainCategory;
  authType: ApiAuthType;
  https: boolean;
  cors: ApiCorsType;
  baseUrl: string;
  docsUrl: string;
  sampleEndpoint: string;
  method: "GET" | "POST";
  healthScore: number; // 0 - 100
  latencyMs: number;
  rateLimit: string;
  tags: string[];
  mockResponse: Record<string, unknown> | unknown[];
  defaultParams?: Record<string, string>;
  defaultHeaders?: Record<string, string>;
  suggestedPipelineRoles: string[];
}

export interface AggregationStep {
  id: string;
  stepName: string;
  apiId: string;
  apiName: string;
  category: ApiDomainCategory;
  endpoint: string;
  method: "GET" | "POST";
  paramsMapping: Record<string, string>; // e.g. { "base_currency": "{{inputs.currency}}", "target": "USD" }
  extractFields: Record<string, string>; // e.g. { "rates": "data.rates", "timestamp": "data.time_last_update_utc" }
  condition?: string;
  enabled: boolean;
}

export interface VerticalAggregatedApi {
  id: string;
  name: string;
  slug: string;
  domain: ApiDomainCategory;
  description: string;
  icon: string;
  badge: string;
  version: string;
  executionMode: "sequential" | "parallel";
  inputSchema: {
    name: string;
    type: "string" | "number" | "boolean";
    description: string;
    required: boolean;
    defaultValue: string | number | boolean;
    example: string | number;
  }[];
  steps: AggregationStep[];
  responseTemplate: string; // JSON template string with interpolated values e.g. { "status": "success", "rates": "{{step_1.rates}}", "geo": "{{step_2.geo}}" }
  sampleInput: Record<string, unknown>;
  sampleOutput: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AggregatedExecutionResult {
  executionId: string;
  pipelineId: string;
  status: "success" | "partial_success" | "failed" | "running";
  totalDurationMs: number;
  stepResults: {
    stepId: string;
    stepName: string;
    apiName: string;
    status: "success" | "failed" | "skipped";
    durationMs: number;
    urlCalled: string;
    responseStatus: number;
    data: unknown;
    error?: string;
  }[];
  finalOutput: Record<string, unknown>;
  executedAt: string;
}
