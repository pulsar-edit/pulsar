module.exports =
class AddProjectView {
  constructor () {
    this.element = document.createElement('div')
    this.element.id = 'add-projects-view'

    this.icon = document.createElement('div')
    this.icon.classList.add('icon', 'icon-large', 'icon-telescope')
    this.element.appendChild(this.icon)

    this.description = document.createElement('div')
    this.description.classList.add('description')
    this.description.innerText = atom.i18n.t("tree-view.src.project-is-empty")
    this.element.appendChild(this.description)

    this.addProjectsButton = document.createElement('button')
    this.addProjectsButton.classList.add('btn', 'btn-primary')
    this.addProjectsButton.innerText = atom.i18n.t("tree-view.src.add-folders")
    this.addProjectsButton.addEventListener('click', () => {
      atom.pickFolder(paths => {
        if (paths) {
          atom.project.setPaths(paths)
        }
      })
    })
    this.element.appendChild(this.addProjectsButton)

    this.reopenProjectButton = document.createElement('button')
    this.reopenProjectButton.classList.add('btn')
    this.reopenProjectButton.innerText = atom.i18n.t("tree-view.src.reopen-project")
    this.reopenProjectButton.addEventListener('click', () => {
      atom.commands.dispatch(this.element, 'application:reopen-project')
    })
    this.element.appendChild(this.reopenProjectButton)
  }
}
