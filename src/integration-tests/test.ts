import { afterEach, describe, expect, test } from 'bun:test'

import { buildAndLoadTsToDb } from './helpers'
import { db } from './setup/setup'

describe('dummy tests', () => {
  afterEach(async () => {
    await db.raw('DROP FUNCTION IF EXISTS plv8_test')
  })

  test('should connect to postgres correctly', async () => {
    const result = await db.raw("SELECT 'world' as hello")

    expect(result.rows).toEqual([{ hello: 'world' }])
  })

  test('plv8 should be loaded correctly', async () => {
    await db.raw(`
      CREATE FUNCTION plv8_test(value INTEGER) RETURNS VARCHAR AS $$
        const range = Array(value).fill(null).map((_, index) => index);
        return JSON.stringify(range);
      $$ LANGUAGE plv8 IMMUTABLE STRICT;
    `)

    const result = await db.raw('SELECT plv8_test(5) as result')
    expect(result.rows).toEqual([{ result: '[0,1,2,3,4]' }])
  })

  test('compiles TS code to valid SQL', async () => {
    await buildAndLoadTsToDb(`
      export function testFunction(value: number): string {
        const range = Array(value).fill(null).map((_, index) => index);
        return JSON.stringify(range);
      }
    `)

    const result = await db.raw('SELECT testFunction(6) as result')
    expect(result.rows).toEqual([{ result: '[0,1,2,3,4,5]' }])
  })
})
