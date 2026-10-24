// src/components/shared/ImportTimeline.tsx
"use client";
import { useLanguage } from "@/context/LanguageContext";
import { Heading2, BodySmall, Caption, Label } from "@/components/ui/typography";

interface ImportTimelineStep {
  timeline_id: number | string;
  step_name: { en: string; am: string };
  description: { en: string; am: string };
  duration: { en: string; am: string };
}

export function ImportTimeline({ timelines }: { timelines: ImportTimelineStep[] }) {
  const { language } = useLanguage();
  const isAm = language === "am";

  return (
    <div className="bg-[#F1F7FF] dark:bg-gray-800 rounded-3xl p-5 md:p-10 border border-blue-50 dark:border-gray-700 my-10 m-5">
      <Heading2 className="mb-6">
        {isAm ? "የገቢ ንግድ የጊዜ መስመር" : "Typical Import Timeline"}
      </Heading2>
      <div className=" mx-auto space-y-2">
        {timelines.map((step, i) => {
          // Calculate a progress percentage based on step index for visual effect
          const progress = ((i + 1) / timelines.length) * 100;
          return (
            <div key={step.timeline_id} className="space-y-2">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <BodySmall className="font-bold text-slate-700 dark:text-gray-200">
                    {isAm ? step.step_name.am : step.step_name.en}
                  </BodySmall>
                  <Caption className="text-[13px] text-slate-500 dark:text-gray-400 italic">
                    {isAm ? step.description.am : step.description.en}
                  </Caption>
                </div>
                <Label className="font-bold text-[#1295FF] dark:text-blue-300">
                  {isAm ? step.duration.am : step.duration.en}
                </Label>
              </div>
              <div className="h-2.5 w-full bg-white dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-[#1295FF] to-[#8FB9F0] transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
