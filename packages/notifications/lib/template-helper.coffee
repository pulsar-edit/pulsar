module.exports =
  create: (htmlString) ->
    template = document.createElement('template')
    template.innerHTML = htmlString
    document.body.appendChild(template)
    template

  render: (template) ->
    document.importNode(template.content, true)
