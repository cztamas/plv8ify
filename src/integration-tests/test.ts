import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
} from 'bun:test'
import knex from 'knex'

let knexInstance

describe('dummy tests', () => {
  beforeAll(async () => {
    knexInstance = knex({
      client: 'pg',
      connection:
        'postgres://plv8ify:cool-dev-password@localhost:15432/plv8ify',
    })
  })

  afterEach(async () => {
    await knexInstance.raw('DROP FUNCTION IF EXISTS plv8_test')
  })

  afterAll(async () => {
    await knexInstance.destroy()
  })

  test('should connect to postgres correctly', async () => {
    const result = await knexInstance.raw("SELECT 'world' as hello")

    expect(result.rows).toEqual([{ hello: 'world' }])
  })

  test('plv8 should be loaded correctly', async () => {
    await knexInstance.raw(`
      CREATE FUNCTION plv8_test(value INTEGER) RETURNS VARCHAR AS $$
        const range = Array(value).fill(null).map((_, index) => index);
        return JSON.stringify(range);
      $$ LANGUAGE plv8 IMMUTABLE STRICT;
    `)

    const result = await knexInstance.raw('SELECT plv8_test(5) as result')
    expect(result.rows).toEqual([{ result: '[0,1,2,3,4]' }])
  })
})
