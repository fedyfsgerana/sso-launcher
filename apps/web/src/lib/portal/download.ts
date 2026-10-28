export function downloadText(
  fileName: string,
  content: string,
  type = "text/markdown",
) {
  const url = URL.createObjectURL(
    new Blob([content], { type: `${type};charset=utf-8` }),
  );
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
