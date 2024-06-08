import { afterAll } from 'bun:test'
import knex from 'knex'

export const db = knex({
  client: 'pg',
  connection: 'postgres://plv8ify:cool-dev-password@localhost:15432/plv8ify',
})

afterAll(async () => {
  await db.destroy()
})
