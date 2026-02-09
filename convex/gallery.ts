import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const upload = mutation({
  args: {
    eventId: v.id("events"),
    storageId: v.string(),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("Image not found");

    return await ctx.db.insert("event_gallery", {
      eventId: args.eventId,
      userId,
      storageId: args.storageId,
      imageUrl: url,
      caption: args.caption,
      createdAt: Date.now(),
    });
  },
});

export const getByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const photos = await ctx.db
      .query("event_gallery")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .collect();

    const enriched = [];
    for (const photo of photos) {
      const user = await ctx.db.get(photo.userId);
      enriched.push({
        ...photo,
        authorName: user?.name || "Attendee",
        authorImage: user?.image,
      });
    }
    return enriched;
  },
});

export const deletePhoto = mutation({
  args: { id: v.id("event_gallery") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const photo = await ctx.db.get(args.id);
    if (!photo) return;

    // Only author or event organizer can delete
    const event = await ctx.db.get(photo.eventId);
    if (photo.userId !== userId && event?.organizerId !== userId) {
      throw new Error("Not authorized to delete this photo");
    }

    await ctx.storage.delete(photo.storageId);
    await ctx.db.delete(args.id);
  },
});
