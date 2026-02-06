import { v } from "convex/values";

export type Id<T extends string> = string & { __tableName: T };

export const query = (obj: { args: any, handler: (ctx: any, args: any) => Promise<any> }) => obj;
export const mutation = (obj: { args: any, handler: (ctx: any, args: any) => Promise<any> }) => obj;
export const internalMutation = (obj: { args: any, handler: (ctx: any, args: any) => Promise<any> }) => obj;
export const internalQuery = (obj: { args: any, handler: (ctx: any, args: any) => Promise<any> }) => obj;

export type QueryCtx = any;
export type MutationCtx = any;