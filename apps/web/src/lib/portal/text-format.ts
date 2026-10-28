const ACRONYMS = new Set([
  "PT",
  "CV",
  "TBK",
  "ERP",
  "SSO",
  "HRIS",
  "HR",
  "HRD",
  "IT",
  "GA",
  "QC",
  "QS",
  "PPIC",
  "PIC",
  "MKT",
  "ACC",
  "PUR",
  "FIN",
  "OPS",
  "MGT",
  "ENG",
  "DIR",
  "PRD",
  "DC",
  "ICS",
  "SPV",
  "SOP",
  "NIK",
  "KTP",
  "NPWP",
  "BPJS",
  "API",
  "PDF",
]);

const SHORT_ACRONYM_LENGTH = 4;

function collapse(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isAllCaps(text: string) {
  return /\p{L}/u.test(text) && !/\p{Ll}/u.test(text);
}

function isAcronym(core: string) {
  return ACRONYMS.has(core.toUpperCase());
}

function mapCore(word: string, map: (core: string) => string) {
  const match = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u.exec(word);

  if (!match || !match[2]) {
    return word;
  }

  return `${match[1]}${map(match[2])}${match[3]}`;
}

function titleCore(core: string, allCaps: boolean): string {
  if (isAcronym(core)) {
    return core.toUpperCase();
  }

  if (/\p{N}/u.test(core)) {
    return core;
  }

  if (/[-/]/.test(core)) {
    return core
      .split(/([-/])/)
      .map((part) =>
        part === "-" || part === "/" || !part ? part : titleCore(part, allCaps),
      )
      .join("");
  }

  if (
    !allCaps &&
    core.length >= 2 &&
    core.length <= SHORT_ACRONYM_LENGTH &&
    !/\P{Lu}/u.test(core)
  ) {
    return core;
  }

  return core.charAt(0).toUpperCase() + core.slice(1).toLowerCase();
}

function lowerCore(core: string) {
  return core
    .split("-")
    .map((part) => (isAcronym(part) ? part.toUpperCase() : part.toLowerCase()))
    .join("-");
}

export function titleText(value: string) {
  const text = collapse(value);

  if (!text) {
    return text;
  }

  const allCaps = isAllCaps(text);

  return text
    .split(" ")
    .map((word) => mapCore(word, (core) => titleCore(core, allCaps)))
    .join(" ");
}

export function sentenceText(value: string) {
  let text = collapse(value);

  if (!text) {
    return text;
  }

  if (isAllCaps(text)) {
    text = text
      .split(" ")
      .map((word) => mapCore(word, lowerCore))
      .join(" ");
  }

  const index = text.search(/\p{L}/u);

  return index < 0
    ? text
    : text.slice(0, index) +
        text.charAt(index).toUpperCase() +
        text.slice(index + 1);
}
