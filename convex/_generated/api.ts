import { GenericId } from "convex/values";

export const api: any = {
  users: {
    viewer: "users:viewer",
    update: "users:update",
    awardPoints: "users:awardPoints",
    checkIn: "users:checkIn",
  },
  events: {
    get: "events:get",
    getById: "events:getById",
    create: "events:create",
    update: "events:update",
    deleteEvent: "events:deleteEvent",
  },
  tickets: {
    getByEventId: "tickets:getByEventId",
    getByUserId: "tickets:getByUserId",
    create: "tickets:create",
    getTicketByNumber: "tickets:getTicketByNumber",
    checkInTicket: "tickets:checkInTicket",
  },
  files: {
    generateUploadUrl: "files:generateUploadUrl",
    saveFile: "files:saveFile",
    getMetadata: "files:getMetadata",
  },
  admin: {
    getUsers: "admin:getUsers",
    updateUserRole: "admin:updateUserRole",
    updateUserStatus: "admin:updateUserStatus",
  }
};