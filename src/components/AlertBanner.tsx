import React from "react";
import { AlertTriangle } from "lucide-react";
import { getAlertBannerStyle, type AlertVariant } from "./styles/AlertBanner.styles";

interface AlertBannerProps {
  title: string;
  subtitle: string;
  variant?: AlertVariant;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ title, subtitle, variant = "warning" }) => {
  const styles = getAlertBannerStyle(variant);

  return (
    <div className="px-3.5 sm:px-5 py-2.5 sm:py-4 border-l-[4px] sm:border-l-[6px] flex items-center gap-2.5 sm:gap-3" style={styles.alertBox}>
      <AlertTriangle size={18} color={styles.alertIconColor} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-xs sm:text-sm break-words" style={styles.alertTitle}>
          {title}
        </p>
        <p className="text-[11px] sm:text-xs mt-0.5 sm:mt-1 break-words" style={styles.alertSubtitle}>
          {subtitle}
        </p>
      </div>
    </div>
  );
};
