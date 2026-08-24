export default function WorkspaceLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="กำลังโหลดข้อมูล">
      <div className="space-y-3">
        <div className="h-3 w-28 rounded bg-[#dfe7f5]" />
        <div className="h-8 w-64 rounded bg-[#dfe7f5]" />
        <div className="h-4 w-96 max-w-full rounded bg-[#e9eef7]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 rounded-xl border border-[#e2e8f2] bg-white" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.85fr)]">
        <div className="h-80 rounded-xl border border-[#e2e8f2] bg-white" />
        <div className="h-80 rounded-xl border border-[#e2e8f2] bg-white" />
      </div>
    </div>
  );
}
