/** @babel */

// Displays the readme for a package, if it has one
// TODO Decide to keep this or current button-to-new-tab view
export default class PackageReadmeView {
  constructor (readme, readmeSrc, readmeIsLocal) {
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

    readme ||= "### No README.";

    const markdownOpts = {
      breaks: false,
      taskCheckboxDisabled: true
    };

    if (readmeIsLocal) {
      markdownOpts.filePath = readmeSrc;
    } else {
      markdownOpts.rootDomain = readmeSrc;
    }

    try {
      this.packageReadme.innerHTML = atom.ui.markdown.render(readme, markdownOpts);
    } catch(err) {
      this.packageReadme.innerHTML = "<h3>Error parsing README</h3>";
    }
  }

  destroy () {
    this.element.remove()
  }
}
