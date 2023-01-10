# Settings View package

Edit core configuration settings, install and configure packages, and change themes from within Pulsar.

![Settings View](https://cloud.githubusercontent.com/assets/118951/16886698/b0ca5fae-4a8a-11e6-8afc-2c03fda4618c.PNG)

## Usage
You can open the Settings View by navigating to
***LNX***: _Edit > Preferences_ -
***MAC***: _Atom > Preferences_ -
***WIN***: _File > Settings_.

In order to install new packages and themes, click on the _Install_ section on the left-hand side.
Once installed, community packages/themes and their settings are housed within their respective section.
All packages/themes that have updates will be listed under the _Updates_ section. Finally, all keybindings (including ones that community packages have added) are available in the _Keybindings_ section.

Want to learn more? Check out the [Getting Started: Pulsar Basics](https://pulsar-edit.dev/docs/launch-manual/sections/getting-started/#pulsar-basics) and [Using Pulsar: Pulsar Packages](https://pulsar-edit.dev/docs/launch-manual/sections/using-pulsar/#pulsar-packages) sections in the Pulsar Launch Manual.

### Commands and Keybindings
All of the following commands are under the `atom-workspace` selector.

|Command|Description|Keybinding (Linux)|Keybinding (macOS)|Keybinding (Windows)|
|-------|-----------|------------------|-----------------|--------------------|
|`settings-view:open`|Opens the Settings View|<kbd>ctrl-,</kbd>|<kbd>cmd-,</kbd>|<kbd>ctrl-,</kbd>|
|`settings-view:core`|Opens the _Core_ section of the Settings View|
|`settings-view:editor`|Opens the _Editor_ section of the Settings View|
|`settings-view:system`|Opens the _System_ section of the Settings View (Windows)|
|`settings-view:show-keybindings`|Opens the _Keybindings_ section of the Settings View|
|`settings-view:uninstall-packages`|Opens the _Packages_ section of the Settings View|
|`settings-view:change-themes`|Opens the _Themes_ section of the Settings View|
|`settings-view:uninstall-themes`|Opens the _Themes_ section of the Settings View|
|`settings-view:check-for-updates`|Opens the _Updates_ section of the Settings View|
|`settings-view:install-packages-and-themes`|Opens the _Install_ section of the Settings View|
Custom keybindings can be added by referencing the above commands.  To learn more, visit the [Using Pulsar: Basic Customization](https://pulsar-edit.dev/docs/launch-manual/sections/using-pulsar/#basic-customization) or [Behind Pulsar: Keymaps In-Depth](https://pulsar-edit.dev/docs/launch-manual/sections/behind-pulsar/#keymaps-in-depth) sections in the Pulsar Launch Manual.

## Customize
The Settings View package uses the `ui-variables` to match a theme's color scheme. You can still customize the UI in your `styles.less` file. For example:

```less
// Change the color of the titles
.settings-view .section .section-heading {
  color: white;
}

// Change the font size of the setting descriptions
.settings-view .setting-description {
  font-size: 13px;
}
```

Use the [developer tools](https://pulsar-edit.dev/docs/launch-manual/sections/core-hacking/#developer-tools) to find more selectors.

## Contributing
Always feel free to help out!  Whether it's [filing bugs and feature requests](https://github.com/pulsar-edit/pulsar/issues/new) or working on some of the [open issues](https://github.com/pulsar-edit/pulsar/issues), Pulsar's [contributing guide](https://github.com/pulsar-edit/.github/blob/main/CONTRIBUTING.md) will help get you started while the [guide for contributing to packages](https://pulsar-edit.dev/docs/launch-manual/sections/core-hacking/#contributing-to-official-pulsar-packages) has some extra information.

## License
MIT License.  See [the license](https://github.com/pulsar-edit/pulsar/blob/master/LICENSE.md) for more details.
