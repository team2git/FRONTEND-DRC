import React from "react";
import { ArrowLeft } from "lucide-react";

type ServiceExitButtonProps = {
  onClick: () => void;
  label?: string;
  className?: string;
};

const ServiceExitButton: React.FC<ServiceExitButtonProps> = ({
  onClick,
  label = "Back to services",
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition",
        "hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-600 hover:shadow-md",
        className,
      ].join(" ")}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
};

export default ServiceExitButton;
