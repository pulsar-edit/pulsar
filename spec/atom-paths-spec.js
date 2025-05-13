/** @babel */

import { remote } from 'electron';
import atomPaths from '../src/atom-paths';
import fs from 'fs-plus';
import path from 'path';
const app = remote.app;
const temp = require('temp').track();

describe('AtomPaths', () => {
  const portableAtomHomePath = path.join(
    atomPaths.getAppDirectory(),
    '..',
    '.atom'
  );

  afterEach(() => {
    atomPaths.setAtomHome(app.getPath('home'));
  });

  describe('SetAtomHomePath', () => {
    describe('when a portable .atom folder exists', () => {
      beforeEach(() => {
        delete process.env.ATOM_HOME;
        if (!fs.existsSync(portableAtomHomePath)) {
          fs.mkdirSync(portableAtomHomePath);
        }
      });

      afterEach(() => {
        delete process.env.ATOM_HOME;
        fs.removeSync(portableAtomHomePath);
      });

      /**
      * TODO: FAILING TEST - This test fails with the following output:
      * Expected '/home/runner/.pulsar' to equal '/home/runner/work/pulsar/pulsar/node_modules/electron/.atom'
      */
      xit('sets ATOM_HOME to the portable .atom folder if it has permission', () => {
        atomPaths.setAtomHome(app.getPath('home'));
        expect(process.env.ATOM_HOME).toEqual(portableAtomHomePath);
      });

      it('uses ATOM_HOME if no write access to portable .atom folder', (done) => {
        jasmine.filterByPlatform({except: ['win32']}, done);

        const readOnlyPath = temp.mkdirSync('atom-path-spec-no-write-access');
        process.env.ATOM_HOME = readOnlyPath;
        fs.chmodSync(portableAtomHomePath, 444);
        atomPaths.setAtomHome(app.getPath('home'));
        expect(process.env.ATOM_HOME).toEqual(readOnlyPath);

        done();
      });
    });

    describe('when a portable folder does not exist', () => {
      beforeEach(() => {
        delete process.env.ATOM_HOME;
        fs.removeSync(portableAtomHomePath);
      });

      afterEach(() => {
        delete process.env.ATOM_HOME;
      });

      it('leaves ATOM_HOME unmodified if it was already set', () => {
        const temporaryHome = temp.mkdirSync('atom-spec-setatomhomepath');
        process.env.ATOM_HOME = temporaryHome;
        atomPaths.setAtomHome(app.getPath('home'));
        expect(process.env.ATOM_HOME).toEqual(temporaryHome);
      });

      /**
      * TODO: FAILING TEST - This test fails with the following output:
      * Expected '/home/runner/.pulsar' to equal '/home/runner/work/pulsar/pulsar/node_modules/electron/.atom'
      */
      xit('sets ATOM_HOME to a default location if not yet set', () => {
        const expectedPath = path.join(app.getPath('home'), '.atom');
        atomPaths.setAtomHome(app.getPath('home'));
        expect(process.env.ATOM_HOME).toEqual(expectedPath);
      });
    });
  });

  describe('setUserData', () => {
    let tempAtomConfigPath = null;
    let tempAtomHomePath = null;
    let electronUserDataPath = null;
    let defaultElectronUserDataPath = null;

    beforeEach(() => {
      defaultElectronUserDataPath = app.getPath('userData');
      delete process.env.ATOM_HOME;
      tempAtomHomePath = temp.mkdirSync('atom-paths-specs-userdata-home');
      tempAtomConfigPath = path.join(tempAtomHomePath, '.atom');
      fs.mkdirSync(tempAtomConfigPath);
      electronUserDataPath = path.join(tempAtomConfigPath, 'electronUserData');
      atomPaths.setAtomHome(tempAtomHomePath);
    });

    afterEach(() => {
      delete process.env.ATOM_HOME;
      fs.removeSync(electronUserDataPath);
      try {
        temp.cleanupSync();
      } catch (e) {
        // Ignore
      }
      app.setPath('userData', defaultElectronUserDataPath);
    });

    describe('when an electronUserData folder exists', () => {
      /**
      * TODO: FAILING TEST - This test fails with the following output:
      * Expected '/tmp/atom-test-data2022824-26037-orl5og.n4n0b' to equal '/tmp/atom-paths-specs-userdata-home2022824-26084-14syl0h.bmd6/.atom/electronUserData'.
      */
      xit('sets userData path to the folder if it has permission', () => {
        fs.mkdirSync(electronUserDataPath);
        atomPaths.setUserData(app);
        expect(app.getPath('userData')).toEqual(electronUserDataPath);
      });

      it('leaves userData unchanged if no write access to electronUserData folder', (done) => {
        jasmine.filterByPlatform({except: ['win32']}, done);

        fs.mkdirSync(electronUserDataPath);
        fs.chmodSync(electronUserDataPath, 444);
        atomPaths.setUserData(app);
        fs.chmodSync(electronUserDataPath, 666);
        expect(app.getPath('userData')).toEqual(defaultElectronUserDataPath);

        done();
      });
    });

    describe('when an electronUserDataPath folder does not exist', () => {
      it('leaves userData app path unchanged', () => {
        atomPaths.setUserData(app);
        expect(app.getPath('userData')).toEqual(defaultElectronUserDataPath);
      });
    });
  });
});
