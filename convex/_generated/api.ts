import { GenericId } from "convex/values";

export const api: any = {
  users: {
    viewer: "users:viewer",
    update: "users:update",
    awardPoints: "users:awardPoints",
    checkIn: "users:checkIn",
    list: "users:list",
  },
  events: {
    get: "events:get",
    getById: "events:getById",
    create: "events:create",
    update: "events:update",
    deleteEvent: "events:deleteEvent",
    getAttendees: "events:getAttendees",
  },
  tickets: {
    getByEventId: "tickets:getByEventId",
    getByUserId: "tickets:getByUserId",
    create: "tickets:create",
    getTicketByNumber: "tickets:getTicketByNumber",
    checkInTicket: "tickets:checkInTicket",
  },
  notifications: {
    get: "notifications:get",
    markRead: "notifications:markRead",
    deleteNotification: "notifications:deleteNotification",
    markAllRead: "notifications:markAllRead",
  },
  files: {
    generateUploadUrl: "files:generateUploadUrl",
    saveFile: "files:saveFile",
    getMetadata: "files:getMetadata",
  },
  chat: {
    getRooms: "chat:getRooms",
    getMessages: "chat:getMessages",
    sendMessage: "chat:sendMessage",
    createRoom: "chat:createRoom",
  },
  communities: {
    list: "communities:list",
    getById: "communities:getById",
    create: "communities:create",
    join: "communities:join",
  },
  posts: {
    list: "posts:list",
    create: "posts:create",
    like: "posts:like",
  },
  registrations: {
    register: "registrations:register",
    getRegistration: "registrations:getRegistration",
  },
  admin: {
    getUsers: "admin:getUsers",
    updateUserRole: "admin:updateUserRole",
    updateUserStatus: "admin:updateUserStatus",
  }
};