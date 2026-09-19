$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 5500
while ($true) {
	$listener = New-Object -TypeName System.Net.HttpListener
	$listener.Prefixes.Add("http://localhost:$port/")
	try {
		$listener.Start()
		break
	}
	catch [System.Net.HttpListenerException] {
		if ($port -ge 5510) { throw }
		$port += 1
	}
}

$contentTypes = @{
	'.css' = 'text/css; charset=utf-8'
	'.html' = 'text/html; charset=utf-8'
	'.js' = 'text/javascript; charset=utf-8'
	'.png' = 'image/png'
}

Write-Host "Serving Endorsement at http://localhost:$port/index.html"
Write-Host "Press Ctrl+C to stop."

try {
	while ($listener.IsListening) {
		$context = $listener.GetContext()
		$relativePath = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
		if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = 'index.html' }
		$filePath = [System.IO.Path]::GetFullPath((Join-Path $projectRoot $relativePath))
		$rootPath = [System.IO.Path]::GetFullPath($projectRoot)

		if (-not $filePath.StartsWith($rootPath, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $filePath -PathType Leaf)) {
			$context.Response.StatusCode = 404
			$context.Response.Close()
			continue
		}

		$bytes = [System.IO.File]::ReadAllBytes($filePath)
		$extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
		$context.Response.ContentType = if ($contentTypes.ContainsKey($extension)) { $contentTypes[$extension] } else { 'application/octet-stream' }
		$context.Response.ContentLength64 = $bytes.Length
		$context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
		$context.Response.Close()
	}
}
finally {
	$listener.Stop()
	$listener.Close()
}
