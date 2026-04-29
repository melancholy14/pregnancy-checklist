interface MedicalDisclaimerProps {
  text?: string;
}

export function MedicalDisclaimer({ text }: MedicalDisclaimerProps) {
  if (!text) return null;

  return (
    <div className="bg-pastel-mint/20 border border-pastel-mint/40 rounded-xl px-4 py-3.5 mb-8">
      <p className="text-xs font-medium text-accent-green mb-1.5">
        <span className="mr-1.5">ℹ️</span>안내
      </p>
      <p className="text-sm text-accent-green leading-relaxed">{text}</p>
    </div>
  );
}
