/** @babel */

import {marked} from 'marked'
import createDOMPurify from 'dompurify'

function sanitize (html, readmeSrc) {
  const temporaryContainer = document.createElement('div')
  temporaryContainer.innerHTML = html

  for (const checkbox of temporaryContainer.querySelectorAll('input[type="checkbox"]')) {
    checkbox.setAttribute('disabled', '')
  }

  let path = require('path')

  for (const image of temporaryContainer.querySelectorAll('img')) {
    let imageSrc = image.getAttribute('src')

    let changeImageSrc = true

    // If src contains a protocol then it must be absolute
    if (/^(?:[a-z]+:)?\/\//i.test(imageSrc)) {
      changeImageSrc = false
    }

    // If src contains a base64 encoded image it must be left unchanged
    if (/^data:image\/.*;base64/i.test(imageSrc)) {
      changeImageSrc = false
    }

    // If path is absolute on file system it must be a local file, e.g. emoji
    if (path.isAbsolute(imageSrc)) {
      changeImageSrc = false
    }

    // If imageSrc needs changing and readmeSrc isn't undefined (i.e. if package was unpublished)
    if (changeImageSrc && readmeSrc) {
      if (path.isAbsolute(readmeSrc)) {
        // If repoUrl is a local path (i.e. package is installed)
        image.setAttribute('src', path.join(readmeSrc, imageSrc))
      } else {
        // If repoUrl is a URL (i.e. package isn't installed)
        image.setAttribute('src', new URL(imageSrc, readmeSrc))
      }
    }
  }

  return createDOMPurify().sanitize(temporaryContainer.innerHTML)
}

// Displays the readme for a package, if it has one
// TODO Decide to keep this or current button-to-new-tab view
export default class PackageReadmeView {
  constructor (readme, readmeSrc) {
    this.element = document.createElement('section')
    this.element.classList.add('section')

    const container = document.createElement('div')
    container.classList.add('section-container')

    const heading = document.createElement('div')
    heading.classList.add('section-heading', 'icon', 'icon-book')
    heading.textContent = 'README'
    container.appendChild(heading)

    this.packageReadme = document.createElement('div')
    this.packageReadme.classList.add('package-readme', 'native-key-bindings')
    this.packageReadme.tabIndex = -1
    container.appendChild(this.packageReadme)
    this.element.appendChild(container)

    marked(readme || '### No README.', {breaks: false}, (err, content) => {
      if (err) {
        this.packageReadme.innerHTML = '<h3>Error parsing README</h3>'
      } else {
        this.packageReadme.innerHTML = sanitize(content, readmeSrc)
      }
    })
  }

  destroy () {
    this.element.remove()
  }
}
