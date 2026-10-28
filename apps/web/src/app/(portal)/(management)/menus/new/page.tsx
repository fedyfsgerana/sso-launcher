import { MenuForm } from "@/components/management/menu-form";

type CreateMenuPageProps = Readonly<{
  searchParams: Promise<{ parent?: string; level?: string }>;
}>;

export default async function CreateMenuPage({
  searchParams,
}: CreateMenuPageProps) {
  const { parent, level } = await searchParams;
  const parsedLevel = Number.parseInt(level ?? "0", 10);

  return (
    <MenuForm
      initialParentId={parent ?? ""}
      initialLevel={
        Number.isFinite(parsedLevel) && parsedLevel > 0 ? parsedLevel : 0
      }
    />
  );
}
