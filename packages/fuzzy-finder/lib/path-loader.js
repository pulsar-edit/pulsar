const fs = require('fs')
const {Task} = require('atom')

module.exports = {
  startTask (callback, metricsReporter) {
    const results = []
    const taskPath = require.resolve('./load-paths-handler')
    const followSymlinks = atom.config.get('core.followSymlinks')
    let ignoredNames = atom.config.get('fuzzy-finder.ignoredNames') || []
    ignoredNames = ignoredNames.concat(atom.config.get('core.ignoredNames') || [])
    const ignoreVcsIgnores = atom.config.get('core.excludeVcsIgnoredPaths')
    const projectPaths = atom.project.getPaths().map((path) => fs.realpathSync(path))
    const useRipGrep = atom.config.get('fuzzy-finder.useRipGrep')

    const startTime = performance.now()

    const task = Task.once(
      taskPath,
      projectPaths,
      followSymlinks,
      ignoreVcsIgnores,
      ignoredNames,
      useRipGrep,
      () => {
        callback(results)

        const duration = Math.round(performance.now() - startTime)
        const numFiles = results.length
        const crawlerType = useRipGrep ? 'ripgrep' : 'fs'

        metricsReporter.sendCrawlEvent(duration, numFiles, crawlerType)
      }
    )

    task.on('load-paths:paths-found',
      (paths) => {
        paths = paths || []
        results.push(...paths)
      }
    )

    return task
  }
}
