import type { PriorityAction } from "@/types/analysis";

function getPriorityTone(priority: PriorityAction["priority"]) {
  if (priority === "높음") return "bg-[#fff0ed] text-[#d5644e]";
  if (priority === "중간") return "bg-[#fff4df] text-[#c77b0d]";
  return "bg-[#eef4ff] text-[#2563eb]";
}

export function ActionPlan({ actions }: { actions: PriorityAction[] }) {
  return (
    <section className="rounded-2xl border border-[#d9e4f4] bg-white p-5">
      <div>
        <p className="text-[10px] font-black tracking-[0.14em] text-[#2563eb]">
          PRIORITY ACTIONS
        </p>
        <h4 className="mt-1.5 text-[15px] font-black text-[#263853]">
          개선 우선순위
        </h4>
        <p className="mt-2 text-[12px] leading-6 text-[#6f7f94]">
          점수가 낮은 항목부터 실행 부담과 기대효과를 함께 보고 정렬했습니다.
        </p>
      </div>
      <div className="mt-4 grid gap-3">
        {actions.map((action, index) => (
          <article
            key={`${action.action}-${index}`}
            className="rounded-2xl border border-[#e3ebf5] bg-[#fbfcfe] p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-lg bg-[#10213d] text-[10px] font-black text-white">
                    {index + 1}
                  </span>
                  <strong className="text-[13px] font-black text-[#31435d]">
                    {action.action}
                  </strong>
                </div>
                <p className="mt-3 text-[12px] font-semibold leading-6 text-[#68788e]">
                  {action.reason}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black ${getPriorityTone(action.priority)}`}
              >
                {action.priority} 우선순위
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
