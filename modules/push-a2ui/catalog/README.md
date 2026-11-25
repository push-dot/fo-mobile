# Push A2UI catalog (vendored)

`push-catalog.json` (A2UI v0.9.1) and `push-catalog.v1.json` (A2UI 1.0) are copies of the files of the same name in
`packages/contracts/a2ui/` on push-be branch `feat/a2ui-surfaces`, at the commits in `SOURCE`. iOS speaks 1.0,
Android v0.9.1 (its official renderer reads nothing newer).
Do not edit it here: change it in push-be and copy it again.

- iOS loads the document of its protocol version (`PushCatalog.protocolVersion` / `catalogFile`) at runtime (resource bundle `PushA2uiCatalog`) and registers each Push component with
  the schema from this file, data-bound props (`{path}` or `{@path}`) rewritten to `$ref: #/$defs/DynamicValue` so the
  renderer binds them.
- Android declares the v0.9.1 props in `PushCatalog.kt`; `src/shared/components/__tests__/a2ui-catalog.test.ts`
  checks that every prop in `push-catalog.json` is declared there.
