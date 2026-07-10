const findInstallChannel = require("../src/find-install-channel.js");
const shell = require("shelljs");

describe("lumine-updater findInstallChannel", () => {
  describe("windows choco install", () => {
    it("fails if 'choco' isn't found", () => {
      spyOn(shell, "which").andReturn(false);

      let installCheck = findInstallChannel.windows_chocoInstalled();
      expect(installCheck).toBe(false);
    });
    it("fails if lumine isn't included in stdout", () => {
      spyOn(shell, "which").andReturn(true);
      spyOn(shell, "exec").andReturn({ code: 0, stdout: "not-installed" });

      let installCheck = findInstallChannel.windows_chocoInstalled();
      expect(installCheck).toBe(false);
    });
    it("fails if exit code is not 0", () => {
      spyOn(shell, "which").andReturn(true);
      spyOn(shell, "exec").andReturn({ code: 1, stdout: "" });

      let installCheck = findInstallChannel.windows_chocoInstalled();
      expect(installCheck).toBe(false);
    });
    it("succeeds if lumine is included in stdout", () => {
      spyOn(shell, "which").andReturn(true);
      spyOn(shell, "exec").andReturn({ code: 0, stdout: "lumine" });

      let installCheck = findInstallChannel.windows_chocoInstalled();
      expect(installCheck).toBe(true);
    });
  });

  describe("windows winget install", () => {
    it("fails if winget isn't found", () => {
      spyOn(shell, "which").andReturn(false);

      let installCheck = findInstallChannel.windows_wingetInstalled();
      expect(installCheck).toBe(false);
    });
    it("fails if lumine isn't found in stdout", () => {
      spyOn(shell, "which").andReturn(true);
      spyOn(shell, "exec").andReturn({ code: 0, stdout: "not-installed" });

      let installCheck = findInstallChannel.windows_wingetInstalled();
      expect(installCheck).toBe(false);
    });
    it("fails if exit code is not 0", () => {
      spyOn(shell, "which").andReturn(true);
      spyOn(shell, "exec").andReturn({ code: 1, stdout: "" });

      let installCheck = findInstallChannel.windows_wingetInstalled();
      expect(installCheck).toBe(false);
    });
    it("succeeds if Lumine is included in stdout", () => {
      spyOn(shell, "which").andReturn(true);
      spyOn(shell, "exec").andReturn({ code: 0, stdout: "Lumine" });

      let installCheck = findInstallChannel.windows_wingetInstalled();
      expect(installCheck).toBe(true);
    });
  });

  describe("linux/macos homebrew install", () => {
    it("fails if brew isn't found", () => {
      spyOn(shell, "which").andReturn(false);

      let installCheck = findInstallChannel.linux_macos_homebrewInstalled();
      expect(installCheck).toBe(false);
    });
    it("fails if lumine isn't found in stdout", () => {
      spyOn(shell, "which").andReturn(true);
      spyOn(shell, "exec").andReturn({ code: 0, stdout: "not-installed" });

      let installCheck = findInstallChannel.linux_macos_homebrewInstalled();
      expect(installCheck).toBe(false);
    });
    it("fails if exit code is not 0", () => {
      spyOn(shell, "which").andReturn(true);
      spyOn(shell, "exec").andReturn({ code: 1, stdout: "" });

      let installCheck = findInstallChannel.linux_macos_homebrewInstalled();
      expect(installCheck).toBe(false);
    });
    it("succeeds if lumine is included in stdout", () => {
      spyOn(shell, "which").andReturn(true);
      spyOn(shell, "exec").andReturn({ code: 0, stdout: "lumine" });

      let installCheck = findInstallChannel.linux_macos_homebrewInstalled();
      expect(installCheck).toBe(true);
    });
  });

  describe("linux debget install", () => {
    it("fails if deb-get isn't found", () => {
      spyOn(shell, "which").andReturn(false);

      let installCheck = findInstallChannel.linux_debGetInstalled();
      expect(installCheck).toBe(false);
    });
    it("fails if lumine isn't found in stdout", () => {
      spyOn(shell, "which").andReturn(true);
      spyOn(shell, "exec").andReturn({ code: 0, stdout: "not-installed" });

      let installCheck = findInstallChannel.linux_debGetInstalled();
      expect(installCheck).toBe(false);
    });
    it("fails if exit code is not 0", () => {
      spyOn(shell, "which").andReturn(false);
      spyOn(shell, "exec").andReturn({ code: 1, stdout: "" });

      let installCheck = findInstallChannel.linux_debGetInstalled();
      expect(installCheck).toBe(false);
    });
    it("succeeds if lumine is included in stdout", () => {
      spyOn(shell, "which").andReturn(true);
      spyOn(shell, "exec").andReturn({ code: 0, stdout: "lumine" });

      let installCheck = findInstallChannel.linux_debGetInstalled();
      expect(installCheck).toBe(true);
    });
  });

  describe("linux flatpak install", () => {
    it("fails if flatpak_id is not lumine", () => {
      process.env.FLATPAK_ID = "not-lumine";
      let installCheck = findInstallChannel.linux_flatpakInstalled();
      expect(installCheck).toBe(false);
    });
    it("succeeds if flatpak_id is lumine", () => {
      process.env.FLATPAK_ID = "io.github.lumine-code.lumine";
      let installCheck = findInstallChannel.linux_flatpakInstalled();
      expect(installCheck).toBe(true);
    });
  });
});
