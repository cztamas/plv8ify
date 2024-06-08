import fs from 'fs-extra'
import path from 'path'

import { PLV8ifyCLI } from '../impl/PLV8ifyCLI.js'
import { db } from './setup/setup'

const codeFilePath = path.join(__dirname, '../../tmp/code.ts')

export const buildAndLoadTsToDb = async (tsCode: string) => {
  await fs.outputFile(codeFilePath, tsCode)

  const plv8ify = new PLV8ifyCLI('esbuild')
  plv8ify.init(codeFilePath, 'types.ts')

  const bundledJs = await plv8ify.build({
    mode: 'inline',
    inputFile: codeFilePath,
    scopePrefix: '',
  })

  const sqlFiles = plv8ify.getPLV8SQLFunctions({
    mode: 'inline',
    scopePrefix: '',
    defaultVolatility: 'IMMUTABLE',
    bundledJs,
    pgFunctionDelimiter: '$plv8ify$',
    fallbackReturnType: 'JSONB',
    outputFolder: 'does-not-matter',
  })

  await Promise.all(sqlFiles.map(({ sql }) => db.raw(sql)))
}
