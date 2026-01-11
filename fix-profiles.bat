@echo off
echo Fixing Farcaster Profiles in Database...
echo.

REM Replace YOUR_RAILWAY_API_URL with your actual Railway backend URL
REM Example: https://battlefield-production.up.railway.app

set API_URL=YOUR_RAILWAY_API_URL

echo Updating elalpha.eth profile...
curl -X POST %API_URL%/api/admin/update-user-profile ^
  -H "Content-Type: application/json" ^
  -d "{\"walletAddress\":\"0x3a0f52510051E2b3D9C1a930D699ccc82f77a92E\",\"fid\":1452351,\"username\":\"elalpha.eth\",\"pfpUrl\":\"YOUR_PFP_URL_HERE\"}"

echo.
echo.

echo Updating bullybort profile...
curl -X POST %API_URL%/api/admin/update-user-profile ^
  -H "Content-Type: application/json" ^
  -d "{\"walletAddress\":\"0x66834B79C41da2B5d709A68C874aEb2aAc082E94\",\"fid\":939116,\"username\":\"bullybort\",\"pfpUrl\":\"YOUR_PFP_URL_HERE\"}"

echo.
echo.
echo Done! Check the responses above for success messages.
echo Now refresh your browser to see updated profiles.
pause
