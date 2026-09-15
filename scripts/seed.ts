import { VARIANTS, EXPERIMENT_NAME } from "../src/lib/experiment";
import { createPool } from "./db-utils";

const pool = createPool();

try {
  for (const variant of Object.values(VARIANTS)) {
    await pool.query(
      `
      insert into experiment_variants (experiment, variant, label, headline, subhead, active)
      values ($1, $2, $3, $4, $5, true)
      on conflict (experiment, variant) do update set
        label = excluded.label,
        headline = excluded.headline,
        subhead = excluded.subhead,
        active = excluded.active
      `,
      [EXPERIMENT_NAME, variant.id, variant.label, variant.headline, variant.subhead],
    );
  }
  console.log(`seeded ${Object.keys(VARIANTS).length} experiment variants`);
} finally {
  await pool.end();
}
