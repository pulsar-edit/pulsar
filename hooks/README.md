### Contents
| Filename | Description |
| - | - |
| post-checkout | This hook executes after a branch checkout, or branch switch has occurred. |
| post-merge | This hook executes after a branch merge has occurred |
| update_editor.sh | The actual brains of the hooks. Performs a yarn install, yarn build, yarn build:apm, and syncs all submodules. |

### Disclaimer
These hooks are not guaranteed. These were made out of convenience and presented to the org as an optional tool for usage.

### Usage
There are several ways to apply these hooks:
- You can manually copy the files over to the `<pulsar-repo-root>/.git/hooks` folder and validate that they are executable - the effect should be immediate. This is the preferred option for Windows.
- You can use manage_hooks.sh to copy/symlink the hooks you choose. This is the preferred option for Linux/macOS.
  - Your mileage may vary on macOS as it has not been tested outright, but should work in theory.

### Instructions
- Open your favorite terminal
- Navigate to `<pulsar-repo-root>/hooks`.
  - IMPORTANT: The bash completions will only work within this directory, and are activated when using exactly `./manage-hooks.sh`.
- If you have bash-completions, source the `manage_hooks-completion.bash` file to allow for auto-complete ie `source manage_hooks-completion.bash`.
- Allow the auto-complete responses to guide you.
- Standard commands are `list`, `install` and `remove`
- The `install` and `remove` commands require the hook you wish to install, followed by an optional parameter for `copy` vs `symlink` with symlink being the default.
  - A symbolically linked hook allows you to receive updates in the future. If you plan on adjusting your hook(s), you probably want to `copy` the files to the `<pulsar-repo-root>/.git/hooks` directory
