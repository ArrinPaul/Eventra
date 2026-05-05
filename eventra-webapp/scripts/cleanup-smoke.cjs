const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

function readEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^['\"]|['\"]$/g, '');
    env[key] = value;
  }
  return env;
}

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envLocal = readEnvFile(path.join(process.cwd(), '.env.local'));
  if (envLocal.DATABASE_URL) return envLocal.DATABASE_URL;
  const env = readEnvFile(path.join(process.cwd(), '.env'));
  return env.DATABASE_URL;
}

function parseArgs(argv) {
  const args = { runId: null, useLast: false };
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--runId' && argv[i + 1]) {
      args.runId = argv[i + 1];
      i += 1;
    } else if (token === '--last') {
      args.useLast = true;
    } else if (!token.startsWith('--') && !args.runId) {
      args.runId = token;
    }
  }
  return args;
}

function loadLastRunId() {
  const manifestPath = path.join(process.cwd(), '.smoke-last-run.json');
  if (!fs.existsSync(manifestPath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return data.runId || null;
  } catch {
    return null;
  }
}

(async () => {
  const { runId: inputRunId, useLast } = parseArgs(process.argv);
  const runId = inputRunId || (useLast ? loadLastRunId() : null);

  if (!runId) {
    console.error('Missing runId. Use: node scripts/cleanup-smoke.cjs --runId <id> or --last');
    process.exit(1);
  }

  const marker = `SMOKE-RUN:${runId}`;
  const databaseUrl = loadDatabaseUrl();
  if (!databaseUrl) {
    console.error('DATABASE_URL is missing in process env, .env.local, and .env');
    process.exit(1);
  }

  const useSsl = !/localhost|127\.0\.0\.1/i.test(databaseUrl);
  const sql = postgres(databaseUrl, {
    ssl: useSsl ? 'require' : false,
    prepare: false,
    connect_timeout: 10,
    max: 1,
  });

  const summary = {
    runId,
    marker,
    deleted: {
      activityFeed: 0,
      userBadges: 0,
      badges: 0,
      eventFeedback: 0,
      feedbackTemplates: 0,
      chatMessages: 0,
      chatParticipants: 0,
      chatRooms: 0,
      comments: 0,
      posts: 0,
      communityMembers: 0,
      communities: 0,
      notifications: 0,
      tickets: 0,
      ticketTiers: 0,
      waitlist: 0,
      eventMedia: 0,
      sponsors: 0,
      eventStaff: 0,
      aiChatMessages: 0,
      aiChatSessions: 0,
      events: 0,
      users: 0,
    },
  };

  try {
    await sql.begin(async (tx) => {
      const userRows = await tx`
        select id from users
        where email ilike ${`%${runId}%@eventra.local`}
      `;
      const users = userRows.map((row) => row.id);

      const eventRows = await tx`
        select id from events
        where title ilike ${`%${marker}%`}
      `;
      const events = eventRows.map((row) => row.id);

      const communityRows = await tx`
        select id from communities
        where name ilike ${`%${marker}%`}
      `;
      const communities = communityRows.map((row) => row.id);

      const badgeRows = await tx`
        select id from badges
        where name ilike ${`%${marker}%`}
      `;
      const badges = badgeRows.map((row) => row.id);

      const roomRows = await tx`
        select id from chat_rooms
        where name ilike ${`%${marker}%`}
          or event_id = any(${events.length ? tx.array(events, 'uuid') : tx.array([], 'uuid')})
      `;
      const rooms = roomRows.map((row) => row.id);

      const postRows = await tx`
        select id from posts
        where content ilike ${`%${marker}%`}
          or community_id = any(${communities.length ? tx.array(communities, 'uuid') : tx.array([], 'uuid')})
      `;
      const posts = postRows.map((row) => row.id);

      const ticketRows = await tx`
        select id from tickets
        where ticket_number ilike ${`SMOKE-${runId}%`}
          or event_id = any(${events.length ? tx.array(events, 'uuid') : tx.array([], 'uuid')})
      `;
      const tickets = ticketRows.map((row) => row.id);

      const activityRows = await tx`
        select id from activity_feed
        where content ilike ${`%${marker}%`}
          or metadata::text ilike ${`%${marker}%`}
          or target_id = any(${events.length ? tx.array(events.map(String), 'text') : tx.array([], 'text')})
      `;
      const activityIds = activityRows.map((row) => row.id);

      if (activityIds.length) {
        const rows = await tx`
          delete from activity_feed
          where id = any(${tx.array(activityIds, 'uuid')})
          returning id
        `;
        summary.deleted.activityFeed = rows.length;
      }

      if (badges.length || users.length) {
        const rows = await tx`
          delete from user_badges
          where (${badges.length ? tx`badge_id = any(${tx.array(badges, 'uuid')})` : tx`false`})
             or (${users.length ? tx`user_id = any(${tx.array(users, 'text')})` : tx`false`})
          returning user_id
        `;
        summary.deleted.userBadges = rows.length;
      }

      if (badges.length) {
        const rows = await tx`
          delete from badges
          where id = any(${tx.array(badges, 'uuid')})
          returning id
        `;
        summary.deleted.badges = rows.length;
      }

      if (events.length || users.length) {
        const rows = await tx`
          delete from event_feedback
          where (${events.length ? tx`event_id = any(${tx.array(events, 'uuid')})` : tx`false`})
             or (${users.length ? tx`user_id = any(${tx.array(users, 'text')})` : tx`false`})
             or comment ilike ${`%${marker}%`}
          returning id
        `;
        summary.deleted.eventFeedback = rows.length;
      }

      if (events.length) {
        const rows = await tx`
          delete from feedback_templates
          where event_id = any(${tx.array(events, 'uuid')})
             or title ilike ${`%${marker}%`}
          returning id
        `;
        summary.deleted.feedbackTemplates = rows.length;
      }

      if (rooms.length || users.length) {
        const rows = await tx`
          delete from chat_messages
          where (${rooms.length ? tx`room_id = any(${tx.array(rooms, 'uuid')})` : tx`false`})
             or (${users.length ? tx`sender_id = any(${tx.array(users, 'text')})` : tx`false`})
             or content ilike ${`%${marker}%`}
          returning id
        `;
        summary.deleted.chatMessages = rows.length;
      }

      if (rooms.length || users.length) {
        const rows = await tx`
          delete from chat_participants
          where (${rooms.length ? tx`room_id = any(${tx.array(rooms, 'uuid')})` : tx`false`})
             or (${users.length ? tx`user_id = any(${tx.array(users, 'text')})` : tx`false`})
          returning room_id
        `;
        summary.deleted.chatParticipants = rows.length;
      }

      if (rooms.length || events.length) {
        const rows = await tx`
          delete from chat_rooms
          where (${rooms.length ? tx`id = any(${tx.array(rooms, 'uuid')})` : tx`false`})
             or (${events.length ? tx`event_id = any(${tx.array(events, 'uuid')})` : tx`false`})
             or name ilike ${`%${marker}%`}
          returning id
        `;
        summary.deleted.chatRooms = rows.length;
      }

      if (posts.length) {
        const rows = await tx`
          delete from comments
          where post_id = any(${tx.array(posts, 'uuid')})
          returning id
        `;
        summary.deleted.comments = rows.length;
      }

      if (posts.length || communities.length || users.length) {
        const rows = await tx`
          delete from posts
          where (${posts.length ? tx`id = any(${tx.array(posts, 'uuid')})` : tx`false`})
             or (${communities.length ? tx`community_id = any(${tx.array(communities, 'uuid')})` : tx`false`})
             or (${users.length ? tx`author_id = any(${tx.array(users, 'text')})` : tx`false`})
             or content ilike ${`%${marker}%`}
          returning id
        `;
        summary.deleted.posts = rows.length;
      }

      if (communities.length || users.length) {
        const rows = await tx`
          delete from community_members
          where (${communities.length ? tx`community_id = any(${tx.array(communities, 'uuid')})` : tx`false`})
             or (${users.length ? tx`user_id = any(${tx.array(users, 'text')})` : tx`false`})
          returning community_id
        `;
        summary.deleted.communityMembers = rows.length;
      }

      if (communities.length) {
        const rows = await tx`
          delete from communities
          where id = any(${tx.array(communities, 'uuid')})
             or name ilike ${`%${marker}%`}
          returning id
        `;
        summary.deleted.communities = rows.length;
      }

      if (users.length) {
        const rows = await tx`
          delete from notifications
          where user_id = any(${tx.array(users, 'text')})
             or title ilike ${`%${marker}%`}
             or message ilike ${`%${marker}%`}
          returning id
        `;
        summary.deleted.notifications = rows.length;
      }

      if (tickets.length || events.length || users.length) {
        const rows = await tx`
          delete from tickets
          where (${tickets.length ? tx`id = any(${tx.array(tickets, 'uuid')})` : tx`false`})
             or (${events.length ? tx`event_id = any(${tx.array(events, 'uuid')})` : tx`false`})
             or (${users.length ? tx`user_id = any(${tx.array(users, 'text')})` : tx`false`})
             or ticket_number ilike ${`SMOKE-${runId}%`}
          returning id
        `;
        summary.deleted.tickets = rows.length;
      }

      if (events.length) {
        const rows = await tx`
          delete from ticket_tiers
          where event_id = any(${tx.array(events, 'uuid')})
             or name ilike ${`%${marker}%`}
          returning id
        `;
        summary.deleted.ticketTiers = rows.length;
      }

      if (events.length || users.length) {
        const rows = await tx`
          delete from waitlist
          where (${events.length ? tx`event_id = any(${tx.array(events, 'uuid')})` : tx`false`})
             or (${users.length ? tx`user_id = any(${tx.array(users, 'text')})` : tx`false`})
          returning id
        `;
        summary.deleted.waitlist = rows.length;
      }

      if (events.length || users.length) {
        const rows = await tx`
          delete from event_media
          where (${events.length ? tx`event_id = any(${tx.array(events, 'uuid')})` : tx`false`})
             or (${users.length ? tx`author_id = any(${tx.array(users, 'text')})` : tx`false`})
          returning id
        `;
        summary.deleted.eventMedia = rows.length;
      }

      if (events.length) {
        const rows = await tx`
          delete from sponsors
          where event_id = any(${tx.array(events, 'uuid')})
          returning id
        `;
        summary.deleted.sponsors = rows.length;
      }

      if (events.length || users.length) {
        const rows = await tx`
          delete from event_staff
          where (${events.length ? tx`event_id = any(${tx.array(events, 'uuid')})` : tx`false`})
             or (${users.length ? tx`user_id = any(${tx.array(users, 'text')})` : tx`false`})
          returning id
        `;
        summary.deleted.eventStaff = rows.length;
      }

      if (events.length || users.length) {
        const sessions = await tx`
          select id from ai_chat_sessions
          where (${events.length ? tx`event_id = any(${tx.array(events, 'uuid')})` : tx`false`})
             or (${users.length ? tx`user_id = any(${tx.array(users, 'text')})` : tx`false`})
        `;
        const sessionIds = sessions.map((row) => row.id);

        if (sessionIds.length) {
          const msgRows = await tx`
            delete from ai_chat_messages
            where session_id = any(${tx.array(sessionIds, 'uuid')})
            returning id
          `;
          summary.deleted.aiChatMessages = msgRows.length;

          const sessionRows = await tx`
            delete from ai_chat_sessions
            where id = any(${tx.array(sessionIds, 'uuid')})
            returning id
          `;
          summary.deleted.aiChatSessions = sessionRows.length;
        }
      }

      if (events.length) {
        const rows = await tx`
          delete from events
          where id = any(${tx.array(events, 'uuid')})
             or title ilike ${`%${marker}%`}
          returning id
        `;
        summary.deleted.events = rows.length;
      }

      if (users.length) {
        const rows = await tx`
          delete from users
          where id = any(${tx.array(users, 'text')})
          returning id
        `;
        summary.deleted.users = rows.length;
      }
    });

    console.log('SMOKE_CLEANUP_OK');
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error('SMOKE_CLEANUP_FAILED');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
})();
