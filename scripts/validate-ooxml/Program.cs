// Validates every .pptx and .docx file in a directory against the Open XML schemas with the
// Open XML SDK, the library Microsoft ships for this. Exits 1 if any file has an error.
//   dotnet run --project scripts/validate-ooxml -- <directory>
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Validation;

if (args.Length != 1 || !Directory.Exists(args[0]))
{
    Console.Error.WriteLine("Usage: dotnet run --project scripts/validate-ooxml -- <directory>");
    return 2;
}

var files = Directory
    .EnumerateFiles(args[0])
    .Where(file => Path.GetExtension(file) is ".pptx" or ".docx")
    .Order()
    .ToList();
if (files.Count == 0)
{
    Console.Error.WriteLine($"No .pptx or .docx files in {args[0]}");
    return 2;
}

// Microsoft365 is the newest version the SDK knows, so nothing current is reported as unknown.
var validator = new OpenXmlValidator(FileFormatVersions.Microsoft365);
var failed = 0;

// PptxGenJS writes the presentation parts and chart parts with some children in the wrong schema
// order (notesMasterIdLst, axId, dPt). PowerPoint opens such files, and the order is not ours to fix,
// so these are listed but do not fail the run. Anything else, and every .docx finding, does.
static bool IsKnownPptxGenJsOrdering(ValidationErrorInfo error)
{
    var part = error.Part?.Uri.ToString() ?? "";
    return error.Id == "Sch_UnexpectedElementContentExpectingComplex"
        && (part == "/ppt/presentation.xml" || part.StartsWith("/ppt/charts/chart"));
}

foreach (var file in files)
{
    using OpenXmlPackage package = Open(file);
    var all = validator.Validate(package).ToList();
    var errors = all.Where(e => !IsKnownPptxGenJsOrdering(e)).ToList();
    var known = all.Count - errors.Count;
    Console.WriteLine(
        $"{Path.GetFileName(file)}: {(errors.Count == 0 ? "valid" : $"{errors.Count} error(s)")}"
            + (known > 0 ? $" (+{known} known PptxGenJS ordering finding(s))" : ""));
    foreach (var error in errors)
    {
        Console.WriteLine($"  [{error.Id}] {error.Description}");
        Console.WriteLine($"    part {error.Part?.Uri}, at {error.Path?.XPath}");
    }
    if (errors.Count > 0) failed++;
}

return failed == 0 ? 0 : 1;

static OpenXmlPackage Open(string file) =>
    Path.GetExtension(file) == ".pptx"
        ? PresentationDocument.Open(file, false)
        : WordprocessingDocument.Open(file, false);
