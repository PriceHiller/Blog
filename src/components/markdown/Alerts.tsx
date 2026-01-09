import { Info, Lightbulb, MessageSquareWarning, OctagonAlert, TriangleAlert } from "lucide-react";
import React from "react";

function createAlert(alertType: string, Icon: React.ElementType) {
  alertType = alertType ?? "";
  return function ({ children }: { children: React.ReactNode }) {
    return (
      <blockquote>
        <div className={`alert ${alertType.toLowerCase()}`}>
          <div className={`alert-title`}><Icon className="alert-icon" /> {alertType}</div>
          <div className={`alert-content`}>{children} </div>
        </div>
      </blockquote>
    );
  };
}

export const Note = createAlert("Note", Info);
export const Tip = createAlert("Tip", Lightbulb);
export const Important = createAlert("Important", MessageSquareWarning);
export const Warning = createAlert("Warning", TriangleAlert);
export const Caution = createAlert("Caution", OctagonAlert);
