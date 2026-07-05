// Run once: npx ts-node -e "require('./db/migrate')"
// Or: DATABASE_URL=... npx ts-node db/migrate.ts
import fs from 'fs';
import path from 'path';
import { getPool } from './client';
import { CLUBS } from '../data/clubs';
import { COURSES } from '../data/courses';

async function migrate() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    console.log('Running schema migration...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('Schema OK');

    // Seed courses
    console.log('Seeding courses...');
    for (const c of COURSES) {
      await client.query(
        `INSERT INTO courses (id,name,city,state,lat,lng,par,rating18,slope18,rating9,slope9,holes_count,source,verified,notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'seed',$13,$14)
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, verified=EXCLUDED.verified`,
        [c.id,c.name,c.city,c.state,c.lat,c.lng,c.par,c.rating18??null,c.slope18??null,
         c.rating9??null,c.slope9??null,c.holes,c.verified,c.notes??null],
      );
    }
    console.log(`Seeded ${COURSES.length} courses`);

    // Seed clubs catalog
    console.log('Seeding clubs catalog...');
    for (const cl of CLUBS) {
      await client.query(
        `INSERT INTO clubs_catalog (id,brand,family,model,year,type,category,stock_shaft,stock_loft,stock_7i_loft,carry_base,source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'seed')
         ON CONFLICT (id) DO NOTHING`,
        [cl.id,cl.brand,cl.family,cl.model,cl.year,cl.type,cl.category,cl.stockShaft,
         cl.stockLoft??null,cl.stock7iLoft??null,cl.carryBase??null],
      );
    }
    console.log(`Seeded ${CLUBS.length} clubs`);

    console.log('Migration complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((e) => { console.error(e); process.exit(1); });
