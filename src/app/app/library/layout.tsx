/**
 * The Library section, plus the slot its contextual detail is presented in.
 *
 * `modal` is a parallel route rendered beside whatever `children` currently
 * holds. It is empty at every URL except a module route reached from inside this
 * section, where @modal/(.)modules/[id] intercepts the canonical route and
 * presents it as an overlay — leaving `children` on the Library the reader came
 * from, with its applied search, filters and view untouched, and leaving the
 * canonical module URL in the address bar.
 *
 * On a direct visit or a reload nothing is intercepted: `children` renders the
 * standalone module page and the slot falls back to @modal/default. The routing
 * is therefore the only thing that differs between the two presentations; the
 * route, the query and what a reader may see are identical.
 */
export default function LibraryLayout({ children, modal }: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return <>
    {children}
    {modal}
  </>;
}
