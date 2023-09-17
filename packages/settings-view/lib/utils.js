const ownerFromRepository = repository => {
  if (!repository) return ''

  const loginRegex = /github\.com\/([\w-]+)\/.+/
  let repo = repository
  if (typeof repository !== 'string') {
    repo = repository.url
    if (repo.match('git@github')) {
      const repoName = repo.split(':')[1]
      repo = `https://github.com/${repoName}`
    }
  }

  if (!repo.match('github.com/')) {
    repo = `https://github.com/${repo}`
  }

  const match = repo.match(loginRegex)
  return match ? match[1] : ''
}

const repoUrlFromRepository = repository => {
  if (!repository) return ''

  let repo = repository

  if (typeof repository === 'string') {
    repo = repository
  } else if (typeof repository === 'object' && typeof repository.url === 'string') {
    repo = repository.url
  } else {
    repo = ''
  }

  if (repo.endsWith('.git')) {
    repo = repo.replace('.git', '')
  }

  return repo
}

const packageComparatorAscending = (left, right) => {
  const leftStatus = atom.packages.isPackageDisabled(left.name)
  const rightStatus = atom.packages.isPackageDisabled(right.name)
  if (leftStatus === rightStatus) {
    if (left.name > right.name) {
      return -1
    } else if (left.name < right.name) {
      return 1
    } else {
      return 0
    }
  } else if (leftStatus > rightStatus) {
    return -1
  } else {
    return 1
  }
}

module.exports = {ownerFromRepository, repoUrlFromRepository, packageComparatorAscending}
