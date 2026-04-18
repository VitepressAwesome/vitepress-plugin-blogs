// @ts-check
/**
 * pnpm hook:
 * 1. 扫描当前 monorepo 下所有子目录，读取其 package.json 的 name 字段
 * 2. 若依赖里出现了同名包，则改写为 link: 本地路径
 * 3. 若本地目录不存在，保持原 npm 版本
 */
const { existsSync, readdirSync, readFileSync, statSync } = require('node:fs')
const { resolve, join } = require('node:path')

function scanLocalPackages(root) {
  /** @type {Record<string, string>} */
  const map = {}
  if (!existsSync(root))
    return map

  for (const entry of readdirSync(root)) {
    if (entry.startsWith('.') || entry === 'node_modules')
      continue

    const dir = join(root, entry)
    try {
      if (!statSync(dir).isDirectory())
        continue
    }
    catch { continue }

    const pkgPath = join(dir, 'package.json')
    if (!existsSync(pkgPath))
      continue

    try {
      const { name } = JSON.parse(readFileSync(pkgPath, 'utf8'))
      if (name)
        map[name] = dir
    }
    catch { /* ignore malformed package.json */ }
  }

  return map
}

const LOCAL_MAP = scanLocalPackages(resolve(__dirname, 'packages'))

function rewrite(deps) {
  if (!deps)
    return
  for (const [name, dir] of Object.entries(LOCAL_MAP)) {
    if (deps[name])
      deps[name] = `link:${dir}`
  }
}

function readPackage(pkg) {
  rewrite(pkg.dependencies)
  rewrite(pkg.devDependencies)
  return pkg
}

module.exports = { hooks: { readPackage } }
