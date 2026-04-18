/**
 * Script: publish-all.mjs
 * Publishes all workspace packages to npm using NPM_TOKEN env var.
 * Skips packages whose exact version is already published.
 * Uses `pnpm publish` so workspace:* and catalog: are replaced with real versions.
 *
 * Usage:
 *   NPM_TOKEN=npm_xxx node scripts/publish-all.mjs             # install -> build -> publish
 *   NPM_TOKEN=npm_xxx node scripts/publish-all.mjs --dry-run   # list what would be published
 *   NPM_TOKEN=npm_xxx node scripts/publish-all.mjs --skip-build # skip install+build steps
 */

import { execSync, spawnSync } from 'node:child_process'
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { globSync } from 'tinyglobby'

const dryRun = process.argv.includes('--dry-run')
const skipBuild = process.argv.includes('--skip-build')
const repoRoot = resolve(fileURLToPath(import.meta.url), '../..')
const root = resolve(fileURLToPath(import.meta.url), '../../packages')

// ---------------------------------------------------------
// 工具函数
// ---------------------------------------------------------
const startTime = Date.now()

function elapsed() {
  return `${((Date.now() - startTime) / 1000).toFixed(1)}s`
}

/**
 * @param {string} label
 */
function step(label) {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`  ${label}`)
  console.log('─'.repeat(60))
}

/**
 * @param {string} msg
 */
function log(msg) {
  process.stdout.write(`  ${msg}\n`)
}

/**
 * @param {string} cmd
 * @param {readonly string[]} args
 */
function runCommand(cmd, args, options = {}) {
  const t0 = Date.now()
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    encoding: 'utf8',
    ...options,
  })
  const duration = `${((Date.now() - t0) / 1000).toFixed(1)}s`
  return { ...result, duration }
}

// ---------------------------------------------------------
// Step 1: 检查 NPM_TOKEN
// ---------------------------------------------------------
const totalSteps = skipBuild ? 4 : 6
step(`Step 1/${totalSteps} · 检查 NPM_TOKEN 环境变量`)

const token = process.env.NPM_TOKEN
if (!token) {
  console.error('❌ NPM_TOKEN environment variable is not set.')
  console.error('')
  console.error('   请先设置 NPM_TOKEN 后再运行此脚本：')
  console.error('   Windows PowerShell:')
  console.error('     $env:NPM_TOKEN="npm_xxxxxxxx"; node scripts/publish-all.mjs')
  console.error('   Windows CMD:')
  console.error('     set NPM_TOKEN=npm_xxxxxxxx && node scripts/publish-all.mjs')
  console.error('   Linux / macOS:')
  console.error('     NPM_TOKEN=npm_xxxxxxxx node scripts/publish-all.mjs')
  console.error('')
  console.error('   Token 可在 https://www.npmjs.com/settings/tokens 创建（选 Automation 类型）')
  process.exit(1)
}
log(`✔  NPM_TOKEN 已设置 (长度: ${token.length} 字符)`)

// ---------------------------------------------------------
// Step 2: 写入临时 .npmrc 并验证 token
// ---------------------------------------------------------
step(`Step 2/${totalSteps} · 验证 npm 身份认证`)

const tmpNpmrc = join(tmpdir(), `.npmrc-publish-${Date.now()}`)
writeFileSync(tmpNpmrc, `//registry.npmjs.org/:_authToken=${token}\nregistry=https://registry.npmjs.org/\n`)
log(`  临时 .npmrc 写入: ${tmpNpmrc}`)

log('  正在执行 npm whoami...')
const whoami = spawnSync('npm', ['whoami', `--userconfig=${tmpNpmrc}`], { encoding: 'utf8' })
if (whoami.status !== 0) {
  console.error('\n❌ NPM_TOKEN 无效或已过期（npm whoami 返回错误）')
  console.error('   请到 https://www.npmjs.com/settings/tokens 生成新 token')
  process.exit(1)
}
const npmUser = whoami.stdout.trim()
log(`✔  已通过 npm 认证，当前用户: ${npmUser}`)

if (dryRun) {
  log('\n🔍 Dry run 模式 — 不会实际发布，仅列出待发布包')
}

// ---------------------------------------------------------
// Step 3: pnpm install
// ---------------------------------------------------------
if (!skipBuild) {
  step(`Step 3/${totalSteps} · 安装依赖 (pnpm install)`)
  log(`  工作目录: ${repoRoot}`)

  const install = runCommand('pnpm', ['install', '--frozen-lockfile'])
  if (install.status !== 0) {
    log('  frozen-lockfile 失败，尝试 --no-frozen-lockfile ...')
    const installFallback = runCommand('pnpm', ['install', '--no-frozen-lockfile'])
    if (installFallback.status !== 0) {
      console.error(`\n❌ pnpm install 失败 (${installFallback.duration})`)
      process.exit(1)
    }
    log(`✔  依赖安装完成 (${installFallback.duration})`)
  } else {
    log(`✔  依赖安装完成 (${install.duration})`)
  }

  // -------------------------------------------------------
  // Step 4: pnpm build
  // -------------------------------------------------------
  step(`Step 4/${totalSteps} · 构建所有包 (pnpm build)`)
  log(`  工作目录: ${repoRoot}`)

  const build = runCommand('pnpm', ['build'])
  if (build.status !== 0) {
    console.error(`\n❌ pnpm build 失败 (${build.duration})，终止发布`)
    console.error('   请修复构建错误后重新运行')
    process.exit(1)
  }
  log(`✔  构建完成 (${build.duration})`)
} else {
  log('\n  --skip-build: 跳过 install 和 build 步骤')
}

// ---------------------------------------------------------
// Step 5 (或 3): 扫描 packages 目录
// ---------------------------------------------------------
const scanStep = skipBuild ? 3 : 5
step(`Step ${scanStep}/${totalSteps} · 扫描 packages 目录`)

const pkgDirs = globSync(['*/package.json'], { cwd: root, absolute: false })
  .map(f => resolve(root, f.replace(/[/\\]package\.json$/, '')))
  .sort()

log(`  发现 ${pkgDirs.length} 个包:`)
for (const dir of pkgDirs) {
  const pkgJson = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'))
  const flag = pkgJson.private ? ' [private]' : ''
  log(`    · ${pkgJson.name}@${pkgJson.version}${flag}`)
}

// ---------------------------------------------------------
// Step 6 (或 4): 逐包检查并发布
// ---------------------------------------------------------
const publishStep = skipBuild ? 4 : 6
step(`Step ${publishStep}/${totalSteps} · 发布包`)

/**
 * @param {any} name
 * @param {any} version
 */
function npmViewExists(name, version) {
  try {
    execSync(`npm view ${name}@${version} version --userconfig=${tmpNpmrc}`, { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

const stats = { published: 0, skipped: 0, failed: 0, noDist: 0, private: 0 }
const total = pkgDirs.length

/**
 * @param {string} pkgDir
 * @param {number} index
 */
function publishPackage(pkgDir, index) {
  const pkgJsonPath = join(pkgDir, 'package.json')
  if (!existsSync(pkgJsonPath)) return

  const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
  const prefix = `[${index}/${total}]`

  if (pkg.private) {
    log(`${prefix} ⏭  ${pkg.name}  →  跳过 (private)`)
    stats.private++
    return
  }

  const distExists = existsSync(join(pkgDir, 'dist'))
  if (!distExists) {
    log(`${prefix} ⚠️  ${pkg.name}@${pkg.version}  →  跳过 (无 dist 目录)`)
    stats.noDist++
    return
  }

  log(`${prefix} 🔍 检查 npm: ${pkg.name}@${pkg.version} ...`)
  const alreadyPublished = npmViewExists(pkg.name, pkg.version)

  if (alreadyPublished) {
    log(`${prefix} ⏭  ${pkg.name}@${pkg.version}  →  已发布，跳过`)
    stats.skipped++
    return
  }

  if (dryRun) {
    log(`${prefix} 📦 ${pkg.name}@${pkg.version}  →  待发布 [dry-run]`)
    stats.published++
    return
  }

  const pkgStart = Date.now()
  log(`${prefix} 📦 发布中: ${pkg.name}@${pkg.version} ...`)

  const result = spawnSync(
    'pnpm',
    ['publish', '--access', 'public', '--no-git-checks'],
    {
      cwd: pkgDir,
      stdio: ['ignore', 'pipe', 'inherit'],
      encoding: 'utf8',
      env: {
        ...process.env,
        NPM_TOKEN: token,
        npm_config_userconfig: tmpNpmrc,
      },
    }
  )

  const duration = `${((Date.now() - pkgStart) / 1000).toFixed(1)}s`

  if (result.stdout?.trim()) {
    for (const line of result.stdout.trim().split('\n')) {
      log(`       ${line}`)
    }
  }

  if (result.status === 0) {
    log(`${prefix} ✅ ${pkg.name}@${pkg.version}  →  发布成功 (${duration})`)
    stats.published++
  } else {
    log(`${prefix} ❌ ${pkg.name}@${pkg.version}  →  发布失败 (exit code: ${result.status}, ${duration})`)
    stats.failed++
    process.exitCode = 1
  }
}

for (let i = 0; i < pkgDirs.length; i++) {
  publishPackage(pkgDirs[i], i + 1)
}

// ---------------------------------------------------------
// 汇总报告
// ---------------------------------------------------------
console.log(`\n${'═'.repeat(60)}`)
console.log('  📊 发布汇总')
console.log('═'.repeat(60))
if (dryRun) {
  log(`  📦 待发布:   ${stats.published}`)
} else {
  log(`  ✅ 发布成功: ${stats.published}`)
  if (stats.failed > 0) log(`  ❌ 发布失败: ${stats.failed}`)
}
if (stats.skipped > 0) log(`  ⏭  已是最新: ${stats.skipped}`)
if (stats.noDist > 0)  log(`  ⚠️  缺少 dist: ${stats.noDist}`)
if (stats.private > 0) log(`  🔒 私有跳过: ${stats.private}`)
log(`  ⏱  总耗时:   ${elapsed()}`)
console.log('═'.repeat(60))

if (dryRun) {
  console.log('\n  运行不带 --dry-run 参数可实际发布以上包。\n')
}
