import React from "react";
import { ArrowLeft } from "lucide-react";
import { COLORS } from "../../config/colors";

interface TopBarProps {
  title: string;
  subtitle?: string;
  onBack?: (() => void) | undefined;
}

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle, onBack }) => {
  return (
    <div
      className="flex items-end gap-3 sm:gap-5 px-3.5 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-3.5 sm:pb-5 w-full"
      style={{
        background: COLORS.card,
        borderBottom: `1px solid ${COLORS.line}`,
        boxShadow: `inset 0 4px 0 ${COLORS.orange}`,
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          className="mb-1 p-1 flex items-center justify-center transition-colors hover:opacity-70 shrink-0"
          style={{
            background: "transparent",
            border: "none",
            color: COLORS.slate,
          }}
        >
          <ArrowLeft size={20} strokeWidth={1.75} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <p className="kicker mb-1 sm:mb-2 text-[10.5px] sm:text-[11px]" style={{ color: COLORS.orange }}>
          PerceptAI
        </p>
        <h1 className="display text-lg sm:text-[1.85rem] font-semibold leading-tight break-words" style={{ color: COLORS.ink }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-[12px] sm:text-[14px] mt-1 sm:mt-1.5 leading-snug break-words" style={{ color: COLORS.slate }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
