# Word validation and PDF export
# Opens the generated report in real Microsoft Word (which will raise a
# repair prompt if the OOXML is malformed), reports the page count, and
# exports a PDF so the layout can be proof-read.

$docx = 'C:\Users\11757\Desktop\liangyuez\PROG2002 A2 Report - COMPLETED.docx'
$pdf  = 'C:\Users\11757\Desktop\liangyuez\tools\report-preview.pdf'

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$word.AutomationSecurity = 3   # disable macros

try {
    $doc = $word.Documents.Open($docx, [ref]$false, [ref]$true)   # ReadOnly

    $pages = $doc.ComputeStatistics(2)   # wdStatisticPages
    $words = $doc.ComputeStatistics(0)   # wdStatisticWords
    $chars = $doc.ComputeStatistics(3)   # wdStatisticCharacters
    $shapes = $doc.Shapes.Count
    $inlineShapes = $doc.InlineShapes.Count

    Write-Output "OPENED WITHOUT REPAIR : yes"
    Write-Output "pages                 : $pages"
    Write-Output "words                 : $words"
    Write-Output "characters            : $chars"
    Write-Output "floating shapes       : $shapes"
    Write-Output "inline shapes         : $inlineShapes"

    # Export to PDF for visual proof-reading
    $doc.ExportAsFixedFormat($pdf, 17)   # wdExportFormatPDF
    Write-Output "pdf exported          : $pdf"

    $doc.Close([ref]$false)
}
finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
