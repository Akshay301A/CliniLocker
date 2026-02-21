# Push all changes to GitHub - run in PowerShell from repo root
Set-Location $PSScriptRoot

git add -A
git status

$msg = "Add push notifications: migration, FCM registration, AuthContext hook, Firebase setup guide"
git commit -m $msg

if ($LASTEXITCODE -eq 0) {
    git push origin master
} else {
    Write-Host "Commit failed or nothing to commit. Check status above."
}
