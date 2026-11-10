import { CvTemplates } from "@/shared/ui/career-resources/cv-templates";
import { CareerKnowledge } from "@/shared/ui/career-resources/career-knowledge";
import { CareerTools } from "@/shared/ui/career-resources/career-tools";

export function CareerResources({ showCvTemplates = true }) {
  return (
    <>
      {showCvTemplates && <CvTemplates />}
      <CareerKnowledge />
      <CareerTools />
    </>
  );
}
