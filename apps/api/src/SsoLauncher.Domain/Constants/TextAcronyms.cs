namespace SsoLauncher.Domain.Constants;

public static class TextAcronyms
{
    private static readonly HashSet<string> Words = new(StringComparer.OrdinalIgnoreCase)
    {
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
        "PDF"
    };

    public static bool Contains(string word)
    {
        return Words.Contains(word);
    }
}
