/** Shimmering placeholder while a profile loads. */
export default function ProfileLoading() {
  return (
    <div className="container-page py-8 sm:py-12" aria-busy="true">
      <div className="skeleton h-4 w-32" />
      <div className="skeleton mt-6 h-16 w-full" />
      <div className="mt-8 grid gap-10 lg:grid-cols-3 lg:gap-12">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center gap-5">
            <div className="skeleton size-24 shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="skeleton h-10 w-2/3" />
              <div className="skeleton h-5 w-1/3" />
            </div>
          </div>
          <div className="skeleton h-40 w-full" />
          <div className="skeleton h-64 w-full" />
        </div>
        <div className="skeleton h-72 w-full" />
      </div>
      <span className="sr-only">Loading the profile…</span>
    </div>
  );
}
