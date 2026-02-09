import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("event_templates").collect();
  },
});

export const seedTemplates = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("event_templates").collect();
    if (existing.length > 0) return;

    const templates = [
      {
        name: "Professional Workshop",
        description: "A hands-on learning session focused on building practical skills.",
        category: "Workshop",
        defaultCapacity: 30,
        icon: "Hammer",
        suggestedAgenda: [
          { title: "Introduction & Setup", duration: 30 },
          { title: "Part 1: Foundational Concepts", duration: 60 },
          { title: "Coffee Break", duration: 15 },
          { title: "Part 2: Practical Application", duration: 90 },
          { title: "Q&A and Networking", duration: 30 },
        ]
      },
      {
        name: "Tech Conference",
        description: "Large scale event with multiple talks and networking segments.",
        category: "Tech",
        defaultCapacity: 200,
        icon: "Globe",
        suggestedAgenda: [
          { title: "Keynote Address", duration: 45 },
          { title: "Technical Track 1", duration: 60 },
          { title: "Lunch Break", duration: 60 },
          { title: "Panel Discussion", duration: 45 },
          { title: "Technical Track 2", duration: 60 },
          { title: "Closing Ceremony", duration: 30 },
        ]
      },
      {
        name: "Student Meetup",
        description: "Casual gathering for students to network and share ideas.",
        category: "Social",
        defaultCapacity: 50,
        icon: "Users",
        suggestedAgenda: [
          { title: "Icebreaker Activity", duration: 20 },
          { title: "Project Showcases", duration: 40 },
          { title: "Open Discussion", duration: 30 },
          { title: "Refreshments", duration: 30 },
        ]
      }
    ];

    for (const t of templates) {
      await ctx.db.insert("event_templates", t);
    }
  }
});
