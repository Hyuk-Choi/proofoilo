import { CheckCircle2 } from "lucide-react";

type InsightListProps = {
  title: string;
  description?: string;
  items: string[];
  tone?: "blue" | "green" | "amber" | "red";
};

const toneClass = {
  blue: "border-[#dbe7f8] bg-[#f8fbff] text-[#2563eb]",
  green: "border-[#cfe8df] bg-[#f3fbf8] text-[#168765]",
  amber: "border-[#eadfc5] bg-[#fffbf2] text-[#a96a0d]",
  red: "border-[#f1d7dc] bg-[#fff7f8] text-[#c24b5a]",
};

export function InsightList({
  title,
  description,
  items,
  tone = "blue",
}: InsightListProps) {
  return (
    <section className={`rounded-2xl border p-4 ${toneClass[tone]}`}>
      <div className="flex items-center gap-2">
        <CheckCircle2 size={15} className="shrink-0" />
        <h5 className="text-[12px] font-black">{title}</h5>
      </div>
      {description ? (
        <p className="mt-2 text-[11px] font-semibold leading-5 opacity-80">
          {description}
        </p>
      ) : null}
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2 rounded-xl bg-white/75 px-3 py-2.5 text-[11px] font-semibold leading-5 text-[#52657d] shadow-sm"
          >
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-current opacity-70" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
