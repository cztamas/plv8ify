import { afterEach, describe, expect, test } from 'bun:test'

import { buildAndLoadTsToDb } from './helpers'
import { db } from './setup/setup'

describe('integration tests', () => {
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

  // the current test setup blows up if there is a ternary in the code because knex handles ? as a placeholder :(
  test('handles Date type correctly', async () => {
    await buildAndLoadTsToDb(`
      function latestLeapYearBeforeYear(year: number): number {
        const firstGuess = year - (year % 4);
        if (firstGuess % 100 === 0 && firstGuess % 400 !== 0) {
          return firstGuess - 4;
        }
        return firstGuess;
      }

      export function latestLeapDayBefore(date: Date): Date {
        let year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();

        const dateIsBeforeFeb29 = month < 1 || (month === 1 && day < 29);
        if (dateIsBeforeFeb29) {
          year = year - 1;
        }

        const leapYear = latestLeapYearBeforeYear(year);
        return new Date(leapYear + '-02-29T00:00:00.000Z');
      }
    `)

    const result = await db.raw(
      `SELECT to_char(
        latestLeapDayBefore(
          to_date('2024-06-01', 'YYYY-MM-DD')
        ),
        'YYYY-MM-DD'
      ) as result`
    )
    expect(result.rows).toEqual([{ result: '2024-02-29' }])
  })
})
