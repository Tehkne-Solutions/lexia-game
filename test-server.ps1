$web = Invoke-WebRequest -Uri "http://localhost:3000/" -UseBasicParsing
"`n=== SERVIDOR RESPONDENDO ===" | Write-Host
"Status: $($web.StatusCode)" | Write-Host
"Length: $($web.Content.Length)" | Write-Host
"`n=== PRIMEIROS 500 CARACTERES ===" | Write-Host
$web.Content.Substring(0, [Math]::Min(500, $web.Content.Length)) | Write-Host
"`n=== CHECANDO SE HÁ 'root' ===" | Write-Host
if ($web.Content -like "*root*") { "'root' encontrado" | Write-Host } else { "'root' NÃO encontrado!" | Write-Host }
