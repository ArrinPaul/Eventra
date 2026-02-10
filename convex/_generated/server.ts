import { v } from "convex/values";

export type Id<T extends string> = string & { __tableName: T };

export type QueryCtx = {
  db: any;
  auth: any;
  storage: any;
};

export type MutationCtx = QueryCtx & {
  scheduler: any;
};

export const query = (obj: { args: any, handler: (ctx: QueryCtx, args: any) => Promise<any> }) => obj;
export const mutation = (obj: { args: any, handler: (ctx: MutationCtx, args: any) => Promise<any> }) => obj;
export const internalMutation = (obj: { args: any, handler: (ctx: MutationCtx, args: any) => Promise<any> }) => obj;
export const internalQuery = (obj: { args: any, handler: (ctx: QueryCtx, args: any) => Promise<any> }) => obj;