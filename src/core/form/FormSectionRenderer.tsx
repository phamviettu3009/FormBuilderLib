import type { ReactNode } from "react";
import type { ResolvedFormSection } from "./schema";

interface FormSectionRendererProps {
  section: ResolvedFormSection;
  gutter: number;
  children: ReactNode;
}

export function FormSectionRenderer({
  section,
  gutter,
  children,
}: FormSectionRendererProps) {
  return (
    <section
      className="form-builder-section"
      aria-label={section.title}
      style={{
        gap: `var(--form-builder-field-gap, ${gutter}px)`,
        gridTemplateColumns:
          section.layout?.direction === "vertical"
            ? "minmax(0, 1fr)"
            : `repeat(${section.layout?.columns ?? 1}, minmax(0, 1fr))`,
      }}
    >
      {(section.title || section.description) && (
        <header className="form-builder-section__header">
          {section.title && <h3>{section.title}</h3>}
          {section.description && <p>{section.description}</p>}
        </header>
      )}
      {children}
    </section>
  );
}
