// TEMPORARY (troubleshooting): a deliberate renderer crash.
//
// Renderer crashes on Windows CI (`0xC0000005`) have produced no dump from
// either Crashpad or Windows Error Reporting. An empty artifact cannot
// distinguish "this crash is unusual" from "our capture has never worked", so
// this spec provides the control: crash a renderer on purpose and see whether
// anything catches it.
//
// Deliberately NOT under `spec/`, so the normal suite never loads it. Run it
// on its own:
//
//   yarn start --test spec-crash-control
//
// Remove once the Windows crash is understood.
describe('crash control', () => {
  it('crashes the renderer on purpose', () => {
    process.crash();
  });
});
