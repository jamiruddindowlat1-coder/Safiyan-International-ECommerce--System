# run-api-layer.ps1
# Runs steps 8-11: DTOs + Category/Product/Attribute controller updates,
# then builds. Run this from D:\SIES AFTER the entity scripts (0-7) and
# AFTER the migration has already been applied successfully.

Write-Host "Step 8: Variant/Category/Image DTOs..." -ForegroundColor Cyan
.\8-create-variant-dtos.ps1

Write-Host "Step 9: CategoryController (hierarchy)..." -ForegroundColor Cyan
.\9-update-categorycontroller.ps1

Write-Host "Step 10: ProductController (images + variants)..." -ForegroundColor Cyan
.\10-update-productcontroller.ps1

Write-Host "Step 11: ProductAttributeController (new)..." -ForegroundColor Cyan
.\11-create-productattributecontroller.ps1

Write-Host ""
Write-Host "All API files updated. Building..." -ForegroundColor Cyan
dotnet build
