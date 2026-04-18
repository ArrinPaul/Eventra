const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const postgres = require('postgres');

function readEnvLocal(filePath) {
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

(async () => {
  const envPath = path.join(process.cwd(), '.env.local');
  const envFromFile = readEnvLocal(envPath);
  const databaseUrl = process.env.DATABASE_URL || envFromFile.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL is missing in process env and .env.local');
    process.exit(1);
  }

  const sql = postgres(databaseUrl, { ssl: 'require', prepare: false, connect_timeout: 10 });

  const runId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
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

      const events = await tx`
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
          waitlist_enabled
        )
        values (
          ${`Smoke Test Event ${runId}`},
          'Seeded event for relational smoke testing',
          now() + interval '1 day',
          now() + interval '1 day 2 hours',
          'tech',
          ${JSON.stringify({ type: 'physical', venue: 'Smoke Hall', city: 'Test City' })}::jsonb,
          100,
          ${organizerId},
          'published',
          'physical',
          'public',
          true
        )
        returning id
      `;
      const eventId = events[0].id;

      const tiers = await tx`
        insert into ticket_tiers (event_id, name, description, price, capacity)
        values (${eventId}, 'General', 'Smoke tier', 0, 100)
        returning id
      `;
      const tierId = tiers[0].id;

      const tickets = await tx`
        insert into tickets (event_id, user_id, tier_id, ticket_number, status, price)
        values (${eventId}, ${attendeeId}, ${tierId}, ${ticketNumber}, 'confirmed', 0)
        returning id
      `;
      const ticketId = tickets[0].id;

      const notifications = await tx`
        insert into notifications (user_id, title, message, type, link, read)
        values (
          ${attendeeId},
          'Smoke Ticket Confirmation',
          ${`Ticket ${ticketNumber} created for event ${eventId}`},
          'ticket',
          ${`/tickets/${ticketId}`},
          false
        )
        returning id
      `;
      const notificationId = notifications[0].id;

      const chainRows = await tx`
        select
          e.id as event_id,
          tt.id as tier_id,
          t.id as ticket_id,
          n.id as notification_id,
          u.id as attendee_id
        from events e
        join ticket_tiers tt on tt.event_id = e.id
        join tickets t on t.event_id = e.id and t.tier_id = tt.id
        join users u on u.id = t.user_id
        join notifications n on n.user_id = u.id
        where e.id = ${eventId}
          and t.id = ${ticketId}
          and n.id = ${notificationId}
      `;

      return {
        organizerId,
        attendeeId,
        eventId,
        tierId,
        ticketId,
        notificationId,
        chainCount: chainRows.length,
      };
    });

    console.log('SMOKE_SEED_OK');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('SMOKE_SEED_FAILED');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
})();
