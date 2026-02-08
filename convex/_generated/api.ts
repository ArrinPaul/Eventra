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
    createTicket: "tickets:createTicket",
    updateTicketStatus: "tickets:updateTicketStatus",
    getTicketByNumber: "tickets:getTicketByNumber",
    checkInTicket: "tickets:checkInTicket",
  },
  chat: {
    getRooms: "chat:getRooms",
    getMessages: "chat:getMessages",
    sendMessage: "chat:sendMessage",
    createRoom: "chat:createRoom",
  },
  notifications: {
    get: "notifications:get",
    markRead: "notifications:markRead",
    deleteNotification: "notifications:deleteNotification",
    markAllRead: "notifications:markAllRead",
  },
  files: {
    getUrl: "files:getUrl",
    saveFile: "files:saveFile",
  },
  admin: {
    getUsers: "admin:getUsers",
    updateUserRole: "admin:updateUserRole",
    updateUserStatus: "admin:updateUserStatus",
  },
  communities: {
    list: "communities:list",
    getById: "communities:getById",
    create: "communities:create",
    join: "communities:join",
    getMemberStatus: "communities:getMemberStatus",
  },
  posts: {
    list: "posts:list",
    create: "posts:create",
    like: "posts:like",
  },
  gamification: {
    getBadgeDefinitions: "gamification:getBadgeDefinitions",
    getUserBadges: "gamification:getUserBadges",
    getPointsHistory: "gamification:getPointsHistory",
    awardBadge: "gamification:awardBadge",
  },
  registrations: {
    register: "registrations:register",
    getRegistration: "registrations:getRegistration",
    getByEvents: "registrations:getByEvents",
  }
};
