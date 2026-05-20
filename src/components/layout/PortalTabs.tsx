import type { Section } from "../../pages/portal.config";

interface PortalTabsProps {
  items: Array<{ key: Section; label: string }>;
  onSectionChange: (section: Section) => void;
  section: Section;
}

export function PortalTabs({ items, onSectionChange, section }: PortalTabsProps) {
  return (
    <div className="mb-8 flex flex-wrap gap-3">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSectionChange(item.key)}
          className={`rounded-full px-4 py-2 text-sm transition ${
            section === item.key ? "bg-primary text-primary-foreground" : "bg-[#1C0B2E] hover:bg-[#2D1548]"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
