const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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

function writeManifest(payload) {
  const manifestPath = path.join(process.cwd(), '.smoke-last-run.json');
  fs.writeFileSync(manifestPath, JSON.stringify(payload, null, 2), 'utf8');
}

(async () => {
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

  const runId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const marker = `SMOKE-RUN:${runId}`;
  const organizerId = crypto.randomUUID();
  const attendeeId = crypto.randomUUID();
  const ticketNumber = `SMOKE-${runId}`;

  try {
    const result = await sql.begin(async (tx) => {
      await tx`
        insert into users (id, name, email, role)
        values (${organizerId}, ${`Smoke Organizer ${runId}`}, ${`smoke-organizer-${runId}@eventra.local`}, 'organizer')
      `;

      await tx`
        insert into users (id, name, email, role)
        values (${attendeeId}, ${`Smoke Attendee ${runId}`}, ${`smoke-attendee-${runId}@eventra.local`}, 'attendee')
      `;

      const eventRows = await tx`
        insert into events (
          title,
          description,
          start_date,
          end_date,
          category,
          location,
          capacity,
          organizer_id,
          status,
          type,
          visibility,
          waitlist_enabled,
          is_paid
        )
        values (
          ${`${marker} Event`},
          ${`${marker} seeded event for smoke regression`},
          now() + interval '1 day',
          now() + interval '1 day 2 hours',
          'tech',
          ${JSON.stringify({ type: 'physical', venue: 'Smoke Hall', city: 'Test City' })}::jsonb,
          120,
          ${organizerId},
          'published',
          'physical',
          'public',
          true,
          false
        )
        returning id
      `;
      const eventId = eventRows[0].id;

      const tierRows = await tx`
        insert into ticket_tiers (event_id, name, description, price, capacity)
        values (${eventId}, ${`${marker} General`}, ${`${marker} tier`}, 0, 120)
        returning id
      `;
      const tierId = tierRows[0].id;

      const ticketRows = await tx`
        insert into tickets (event_id, user_id, tier_id, ticket_number, status, price)
        values (${eventId}, ${attendeeId}, ${tierId}, ${ticketNumber}, 'confirmed', 0)
        returning id
      `;
      const ticketId = ticketRows[0].id;

      const notificationRows = await tx`
        insert into notifications (user_id, title, message, type, link, read)
        values (
          ${attendeeId},
          ${`${marker} Ticket Confirmation`},
          ${`${marker} ticket ${ticketNumber} created for event ${eventId}`},
          'ticket',
          ${`/tickets/${ticketId}`},
          false
        )
        returning id
      `;
      const notificationId = notificationRows[0].id;

      const communityRows = await tx`
        insert into communities (name, description, category, creator_id, member_count)
        values (${`${marker} Community`}, ${`${marker} community`}, 'General', ${organizerId}, 2)
        returning id
      `;
      const communityId = communityRows[0].id;

      await tx`
        insert into community_members (community_id, user_id, role)
        values (${communityId}, ${attendeeId}, 'member')
      `;

      const postRows = await tx`
        insert into posts (content, author_id, community_id)
        values (${`${marker} community kickoff post`}, ${organizerId}, ${communityId})
        returning id
      `;
      const postId = postRows[0].id;

      const roomRows = await tx`
        insert into chat_rooms (name, type, event_id)
        values (${`${marker} Room`}, 'group', ${eventId})
        returning id
      `;
      const roomId = roomRows[0].id;

      await tx`
        insert into chat_participants (room_id, user_id)
        values (${roomId}, ${organizerId}), (${roomId}, ${attendeeId})
      `;

      const chatMessageRows = await tx`
        insert into chat_messages (room_id, sender_id, content)
        values (${roomId}, ${organizerId}, ${`${marker} chat hello`})
        returning id
      `;
      const chatMessageId = chatMessageRows[0].id;

      const templateRows = await tx`
        insert into feedback_templates (event_id, title, description, questions, is_default)
        values (
          ${eventId},
          ${`${marker} Feedback Template`},
          ${`${marker} post-event template`},
          ${JSON.stringify([
            { id: 'q1', type: 'rating', label: 'Overall rating' },
            { id: 'q2', type: 'text', label: 'What worked well?' },
          ])}::jsonb,
          false
        )
        returning id
      `;
      const feedbackTemplateId = templateRows[0].id;

      const feedbackRows = await tx`
        insert into event_feedback (event_id, user_id, rating, content, responses)
        values (
          ${eventId},
          ${attendeeId},
          5,
          ${`${marker} great session`},
          ${JSON.stringify({ q1: 5, q2: 'Great networking and pacing' })}::jsonb
        )
        returning id
      `;
      const eventFeedbackId = feedbackRows[0].id;

      const badgeRows = await tx`
        insert into badges (name, description, icon, category, criteria)
        values (
          ${`${marker} Early Bird`},
          ${`${marker} awarded for attending smoke event`},
          'star',
          'event',
          ${JSON.stringify({ kind: 'smoke', runId })}::jsonb
        )
        returning id
      `;
      const badgeId = badgeRows[0].id;

      await tx`
        insert into user_badges (user_id, badge_id)
        values (${attendeeId}, ${badgeId})
      `;

      const announcementRows = await tx`
        insert into activity_feed (user_id, actor_id, type, target_id, content, metadata)
        values (
          ${organizerId},
          ${organizerId},
          'organizer_announcement',
          ${eventId}::text,
          ${`${marker} announcement`},
          ${JSON.stringify({ type: 'info', active: true })}::jsonb
        )
        returning id
      `;
      const announcementId = announcementRows[0].id;

      const webhookRows = await tx`
        insert into activity_feed (user_id, actor_id, type, target_id, content, metadata)
        values (
          ${organizerId},
          ${organizerId},
          'organizer_webhook',
          ${eventId}::text,
          ${`https://example.invalid/${runId}`},
          ${JSON.stringify({ events: ['registration.created'], secret: `${marker}-secret` })}::jsonb
        )
        returning id
      `;
      const webhookId = webhookRows[0].id;

      const ticketChain = await tx`
        select count(*)::int as count
        from events e
        join ticket_tiers tt on tt.event_id = e.id
        join tickets t on t.event_id = e.id and t.tier_id = tt.id
        join users u on u.id = t.user_id
        join notifications n on n.user_id = u.id
        where e.id = ${eventId}
          and t.id = ${ticketId}
          and n.id = ${notificationId}
      `;

      const communityFlow = await tx`
        select count(*)::int as count
        from communities c
        join community_members cm on cm.community_id = c.id
        join posts p on p.community_id = c.id
        where c.id = ${communityId}
          and cm.user_id = ${attendeeId}
          and p.id = ${postId}
      `;

      const chatFlow = await tx`
        select count(*)::int as count
        from chat_rooms cr
        join chat_participants cp on cp.room_id = cr.id
        join chat_messages cm on cm.room_id = cr.id
        where cr.id = ${roomId}
          and cm.id = ${chatMessageId}
      `;

      const feedbackFlow = await tx`
        select count(*)::int as count
        from feedback_templates ft
        join event_feedback ef on ef.event_id = ft.event_id
        where ft.id = ${feedbackTemplateId}
          and ef.id = ${eventFeedbackId}
      `;

      const badgeFlow = await tx`
        select count(*)::int as count
        from badges b
        join user_badges ub on ub.badge_id = b.id
        where b.id = ${badgeId}
          and ub.user_id = ${attendeeId}
      `;

      const organizerToolsFlow = await tx`
        select count(*)::int as count
        from activity_feed af
        where af.id in (${announcementId}, ${webhookId})
          and af.target_id = ${eventId}::text
      `;

      return {
        runId,
        marker,
        ids: {
          organizerId,
          attendeeId,
          eventId,
          tierId,
          ticketId,
          notificationId,
          communityId,
          postId,
          roomId,
          chatMessageId,
          feedbackTemplateId,
          eventFeedbackId,
          badgeId,
          announcementId,
          webhookId,
        },
        checks: {
          ticketChain: ticketChain[0].count,
          communityFlow: communityFlow[0].count,
          chatFlow: chatFlow[0].count,
          feedbackFlow: feedbackFlow[0].count,
          badgeFlow: badgeFlow[0].count,
          organizerToolsFlow: organizerToolsFlow[0].count,
        },
      };
    });

    const allPassed = Object.values(result.checks).every((value) => value > 0);
    const manifest = {
      createdAt: new Date().toISOString(),
      runId: result.runId,
      marker: result.marker,
      ids: result.ids,
      checks: result.checks,
      allPassed,
    };

    writeManifest(manifest);

    console.log('SMOKE_SEED_OK');
    console.log(JSON.stringify(manifest, null, 2));
    console.log('Cleanup command: npm run test:smoke:clean -- --last');

    if (!allPassed) {
      console.error('SMOKE_SEED_PARTIAL: one or more flow checks returned 0');
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('SMOKE_SEED_FAILED');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
})();
