// // src/components/shared/ImportProductCard.tsx
// "use client";

// import Image from "next/image";
// import { useLanguage } from "@/context/LanguageContext";
// import { Button } from "@/components/ui/button";

// interface ImportProductCardProps {
//   image: string;
//   category: string;
//   title: { en: string; am: string };
//   leadTime: string;
//   minOrder: string;
// }

// export function ImportProductCard({
//   image,
//   category,
//   title,
//   leadTime,
//   minOrder,
// }: ImportProductCardProps) {
//   const { language } = useLanguage();
//   const isAm = language === "am";

//   return (
//     <div className="group w-full max-w-[392px] h-[500px] bg-white dark:bg-gray-800 rounded-[12px] border border-slate-100 dark:border-gray-700 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col">
//       {/* Image Area */}
//       <div className="relative w-full h-[261px] overflow-hidden rounded-t-[10px]">
//         <Image
//           src={image}
//           alt={title.en}
//           fill
//           className="object-cover group-hover:scale-110 transition-transform duration-700"
//           unoptimized
//           onError={(e) => {
//             const target = e.target as HTMLImageElement;
//             target.onerror = null;
//             target.src = "/images/textile.png";
//           }}
//         />
//         <div className="absolute bottom-2 left-4 bg-linear-to-r from-[#1295FF] to-[#8FB9F0] text-white text-[10px] font-black px-4 py-1.5 rounded-[40px] uppercase tracking-widest z-10">
//           {category}
//         </div>
//       </div>

//       <div className="p-6 py-2 flex flex-col flex-grow justify-between">
//         <div className="space-y-1">
//           <h3 className="font-bold text-[20px] text-slate-900 dark:text-white leading-[1.2] line-clamp-2">
//             {isAm ? title.am : title.en}
//           </h3>

//           <p className="text-xs text-slate-500 dark:text-gray-300 leading-relaxed line-clamp-2">
//             Professional sourcing and quality assurance for{" "}
//             {title.en.toLowerCase()}.
//           </p>

//           {/* Two Column Specs */}
//           <div className="grid grid-cols-2 gap-4 pt-2">
//             <div className="space-y-1">
//               <span className="text-[11px] text-slate-400 dark:text-gray-400 uppercase tracking-widest">
//                 Lead Time
//               </span>
//               <p className="text-sm font-bold text-[#1295FF]">{leadTime}</p>
//             </div>
//             <div className="space-y-1">
//               <span className="text-[11px] text-slate-400 dark:text-gray-400 uppercase tracking-widest">
//                 Minimum Order
//               </span>
//               <p className="text-sm font-bold text-[#9B1C31]">{minOrder}</p>
//             </div>
//           </div>
//         </div>

//         {/* Full Width Request Button */}
//         <div className="py-3 border-t border-slate-50 dark:border-gray-700 flex justify-center">
//           <Button
//             variant="primary-gradient"
//             className="w-fit h-[32px] rounded-[5px] text-[13px] font-bold shadow-md shadow-blue-500/10"
//           >
//             {isAm ? "አሁን ይጠይቁ" : "Request"}
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShoppingCart, PackageCheck, Clock } from "lucide-react";

interface ImportProductCardProps {
  image: string;
  category: string;
  title: { en: string; am: string };
  leadTime: string;
  minOrder: string;
  viewMode?: "grid" | "list";
}

export function ImportProductCard({
  image,
  category,
  title,
  leadTime,
  minOrder,
  viewMode = "grid",
}: ImportProductCardProps) {
  const { language } = useLanguage();
  const isAm = language === "am";
  const isList = viewMode === "list";

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-[12px] border border-slate-100 dark:border-gray-700 shadow-sm transition-all duration-500 flex group overflow-hidden",
        isList
          ? "sm:flex-row flex-col w-full sm:h-[220px] h-auto" // Vertical on mobile, Horizontal on sm+
          : "flex-col w-full max-w-[392px] h-[520px]"
      )}
    >
      {/* Image Area */}
      <div
        className={cn(
          "relative overflow-hidden shrink-0",
          isList
            ? "sm:w-[220px] w-full h-[200px] sm:h-full" // Square-ish on desktop list, full width on mobile
            : "w-full h-[240px]"
        )}
      >
        <Image
          src={image}
          alt={title.en}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-110 transition-transform duration-700"
          unoptimized
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = "/images/textile.png";
          }}
        />
        <div className="absolute bottom-4 left-4 bg-linear-to-r from-[#1295FF] to-[#8FB9F0] text-white text-[10px] font-black px-4 py-1.5 rounded-[40px] uppercase tracking-widest z-10">
          {category}
        </div>
      </div>

      {/* Content Section */}
      <div
        className={cn(
          "p-4 flex flex-col flex-grow",
          isList ? "justify-center" : "justify-between"
        )}
      >
        <div className="space-y-1">
          <h3 className="font-semibold text-[20px] text-slate-900 dark:text-white leading-tight line-clamp-1">
            {isAm ? title.am : title.en}
          </h3>
          <p
            className={cn(
              "text-[13px] text-slate-500 dark:text-gray-300 leading-relaxed",
              isList ? "line-clamp-2 mb-2" : "line-clamp-2 min-h-[40px]"
            )}
          >
            {isAm
              ? "የፕሮፌሽናል ምንጭ እና ጥራት ማረጋገጫ ለ"
              : "Professional sourcing and quality assurance for"}{" "}
            {(isAm ? title.am : title.en).toLowerCase()}.
          </p>

          {/* the specs section */}
          <div className=" p-4 py-2 rounded-xl space-y-1 mt-0.5">
            <div className="flex items-center justify-left">
              <div className="flex items-center gap-2 mr-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Clock size={14} className="text-blue-500" />
                {isAm ? "የመሪ ጊዜ" : "Lead Time"}
              </div>
              <span className="text-sm font-normal text-slate-900 dark:text-white">
                {leadTime}
              </span>
            </div>
            {/* <div className="h-[1px] bg-slate-200 dark:bg-zinc-800 w-full" />{" "} */}
            {/* Separator Line */}
            <div className="flex items-center justify-left">
              <div className="flex items-center gap-2 mr-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                <PackageCheck size={14} className="text-red-500" />
                {isAm ? "ዝቅተኛ መጠን" : "Min. Order"}
              </div>
              <span className="text-sm font-normal text-slate-900 dark:text-white">
                {minOrder}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div
          className={cn(
            "flex items-center gap-3 border-t border-slate-50 dark:border-gray-700",
            isList ? "mt-2 pt-2" : "pt-2"
          )}
        >
          <Button
            variant="primary-gradient"
            className={cn(
              "h-[35px] rounded-[5px] text-[13px] font-bold",
              isList ? "px-8" : "flex-grow"
            )}
          >
            {isAm ? "አሁን ይጠይቁ" : "Request Quote"}
          </Button>
          <Button
            variant="primary-gradient"
            className="w-[50px] h-[35px] p-0 rounded-[5px]"
          >
            <ShoppingCart size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
