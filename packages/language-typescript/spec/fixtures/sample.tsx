// @ts-nocheck
function SomeComponent () {
  return <Button icon="code" on:click={props.openFile} />;
//       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ meta.tag.ts.tsx
//        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ meta.jsx.inside-tag.ts.tsx
//        ^^^^^^ entity.name.tag.ts.tsx
//                           ^^ meta.attribute-namespace.ts.tsx
//                           ^^^^^^^^ entity.other.attribute-name.namespaced.ts.tsx
}
