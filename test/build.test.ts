import { existsSync, readFileSync } from 'node:fs'
import process from 'node:process'
import { describe, expect, it } from 'vitest'

const build = process.env.TEST_BUILD === 'true'
const allowList = process.env.ALLOW_LIST === 'true'

describe(`test-${build ? 'build' : 'generate'}`, () => {
  it('service worker is generated: ', () => {
    const swName = build
      ? './playground/.output/public/sw.js'
      : './playground/dist/sw.js'
    const webManifest = build
      ? './playground/.output/public/manifest.webmanifest'
      : './playground/dist/manifest.webmanifest'
    expect(existsSync(swName), `${swName} doesn't exist`).toBeTruthy()
    expect(existsSync(webManifest), `${webManifest} doesn't exist`).toBeTruthy()
    const swContent = readFileSync(swName, 'utf-8')
    let match: RegExpMatchArray | null
    match = swContent.match(/define\(\[['"]\.\/(workbox-\w+)['"]/)
    expect(match && match.length === 2, `workbox-***.js entry not found in ${swName}`).toBeTruthy()
    const workboxName = `./playground/${build ? '.output/public' : 'dist'}/${match?.[1]}.js`
    expect(existsSync(workboxName), `${workboxName} doesn't exist`).toBeTruthy()
    match = swContent.match(/['"]?url['"]?:\s*['"]manifest\.webmanifest['"]/)
    expect(match && match.length === 1, 'missing manifest.webmanifest in sw precache manifest').toBeTruthy()
    match = swContent.match(/['"]?url['"]?:\s*"\/"/)
    expect(match && match.length === 1, 'missing entry point route (/) in sw precache manifest').toBeTruthy()
    match = swContent.match(/['"]?url['"]?:\s*['"]about['"]/)
    expect(match && match.length === 1, 'missing about route (/about) in sw precache manifest').toBeTruthy()
    match = swContent.match(/['"]?url['"]?:\s*['"]_nuxt\/.*\.(css|js)['"]/)
    expect(match && match.length > 0, 'missing _nuxt/**.(css|js) in sw precache manifest').toBeTruthy()
    match = swContent.match(/['"]?url['"]?:\s*"(.*\/)?_payload.json"/)
    expect(match && match.length === 2, 'missing _payload.json and about/_payload.json entries in sw precache manifest').toBeTruthy()
    match = swContent.match(/['"]?url['"]?:\s*['"]_nuxt\/builds\/.*\.json['"]/)
    expect(match && match.length > 0, 'missing App Manifest json entries in sw precache manifest').toBeTruthy()
    if (allowList) {
      if (build) {
        // TODO: test runtime caching
      }
      else {
        match = swContent.match(/Response.redirect\(['"]\/404['"], 302\)/)
        expect(match && match.length > 0, 'missing runtime caching entry for /404').toBeTruthy()
      }
    }
    if (build) {
      match = swContent.match(/['"]?url['"]?:\s*['"]server\//)
      expect(match === null, 'found server/ entries in sw precache manifest').toBeTruthy()
    }
  })
})
