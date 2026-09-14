$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$filePath = 'c:\Users\patri\OneDrive\Desktop\E-CDN\colegio-de-naujan\ENROLLMENT DATA - Copy.xlsx'
$wb = $excel.Workbooks.Open($filePath)

Write-Output "=== SHEET NAMES ==="
foreach ($sheet in $wb.Sheets) {
    Write-Output $sheet.Name
}

Write-Output ""
Write-Output "=== SHEET 1 HEADERS ==="
$ws = $wb.Sheets.Item(1)
$lastRow = $ws.UsedRange.Rows.Count
$lastCol = $ws.UsedRange.Columns.Count
Write-Output "Rows: $lastRow, Cols: $lastCol"

for ($c = 1; $c -le $lastCol; $c++) {
    $val = $ws.Cells.Item(1, $c).Value2
    Write-Output "Col $c : $val"
}

Write-Output ""
Write-Output "=== FIRST 5 DATA ROWS ==="
for ($r = 2; $r -le [Math]::Min(6, $lastRow); $r++) {
    $row = ""
    for ($c = 1; $c -le $lastCol; $c++) {
        $val = $ws.Cells.Item($r, $c).Value2
        $row += "[$val] "
    }
    Write-Output "Row $r : $row"
}

$wb.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
