import { SectionForm } from "@/components/management/section-form";

type EditSectionPageProps = Readonly<{
  params: Promise<{ sectionId: string }>;
}>;

export default async function EditSectionPage({
  params,
}: EditSectionPageProps) {
  const { sectionId } = await params;

  return <SectionForm sectionId={sectionId} />;
}
