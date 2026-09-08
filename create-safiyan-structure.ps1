# Safiyan International Ecommerce System - Folder/File Structure Generator
# Run this script FROM INSIDE D:\SIES
$root = "."

function New-Dir($path) {
    if (-not (Test-Path $path)) { New-Item -ItemType Directory -Path $path -Force | Out-Null }
}
function New-File($path) {
    if (-not (Test-Path $path)) { New-Item -ItemType File -Path $path -Force | Out-Null }
}

Write-Host "Creating Safiyan International Ecommerce System structure in $(Get-Location)..." -ForegroundColor Cyan

$api = "$root\Safiyan.Api"
New-Dir "$api\Controllers"
New-Dir "$api\Middleware"
$apiControllers = @("AuthController.cs","ProductController.cs","CategoryController.cs","CartController.cs","OrderController.cs","PaymentController.cs","ShippingController.cs","VendorController.cs","CouponController.cs","ReviewController.cs","WishlistController.cs","NotificationController.cs","ReportController.cs","AdminController.cs")
foreach ($f in $apiControllers) { New-File "$api\Controllers\$f" }
foreach ($f in @("ExceptionMiddleware.cs","RateLimitingMiddleware.cs")) { New-File "$api\Middleware\$f" }
New-File "$api\Program.cs"
New-File "$api\appsettings.json"

$core = "$root\Safiyan.Core"
New-Dir "$core\Entities"
New-Dir "$core\DTOs"
New-Dir "$core\Interfaces"
New-Dir "$core\Enums"
New-Dir "$core\Exceptions"
foreach ($f in @("IRepository.cs","IProductService.cs","IOrderService.cs","IPaymentService.cs")) { New-File "$core\Interfaces\$f" }
foreach ($f in @("OrderStatus.cs","PaymentStatus.cs","UserRole.cs")) { New-File "$core\Enums\$f" }

$infra = "$root\Safiyan.Infrastructure"
New-Dir "$infra\Data\Migrations"
New-Dir "$infra\Data\Seed"
New-Dir "$infra\Repositories"
New-Dir "$infra\Services"
New-Dir "$infra\ExternalIntegrations"
New-File "$infra\Data\ApplicationDbContext.cs"
foreach ($f in @("PaymentService.cs","EmailService.cs","SmsService.cs","FileStorageService.cs","CacheService.cs")) { New-File "$infra\Services\$f" }
foreach ($f in @("SslCommerzClient.cs","StripeClient.cs","ShippingApiClient.cs")) { New-File "$infra\ExternalIntegrations\$f" }

$tests = "$root\Safiyan.Tests"
New-Dir "$tests\UnitTests"
New-Dir "$tests\IntegrationTests"

$fe = "$root\safiyan-frontend\src"
New-Dir "$fe\pages\customer"
foreach ($f in @("Home.jsx","ProductListing.jsx","ProductDetails.jsx","Cart.jsx","Checkout.jsx","OrderHistory.jsx","OrderTracking.jsx","Wishlist.jsx","Profile.jsx","Login.jsx","Register.jsx","SearchResults.jsx")) { New-File "$fe\pages\customer\$f" }
New-Dir "$fe\pages\vendor"
foreach ($f in @("VendorDashboard.jsx","VendorProducts.jsx","VendorOrders.jsx")) { New-File "$fe\pages\vendor\$f" }
New-Dir "$fe\pages\admin"
foreach ($f in @("Dashboard.jsx","ProductManage.jsx","CategoryManage.jsx","OrderManage.jsx","CustomerManage.jsx","VendorManage.jsx","CouponManage.jsx","Reports.jsx","Settings.jsx")) { New-File "$fe\pages\admin\$f" }
New-Dir "$fe\components\layout"
foreach ($f in @("Navbar.jsx","Footer.jsx","Sidebar.jsx")) { New-File "$fe\components\layout\$f" }
New-Dir "$fe\components\product"
foreach ($f in @("ProductCard.jsx","ProductGallery.jsx","ReviewList.jsx")) { New-File "$fe\components\product\$f" }
New-Dir "$fe\components\cart"
foreach ($f in @("CartDrawer.jsx","CartItem.jsx")) { New-File "$fe\components\cart\$f" }
New-Dir "$fe\components\common"
foreach ($f in @("Loader.jsx","Modal.jsx","Pagination.jsx","ProtectedRoute.jsx")) { New-File "$fe\components\common\$f" }
New-Dir "$fe\context"
foreach ($f in @("AuthContext.jsx","CartContext.jsx","WishlistContext.jsx")) { New-File "$fe\context\$f" }
New-Dir "$fe\services"
foreach ($f in @("api.js","authService.js","productService.js","orderService.js","paymentService.js")) { New-File "$fe\services\$f" }
New-Dir "$fe\config"
New-File "$fe\config\branding.js"
New-Dir "$fe\utils"
foreach ($f in @("currencyFormatter.js","validators.js")) { New-File "$fe\utils\$f" }
New-Dir "$fe\routes"
New-File "$fe\routes\AppRoutes.jsx"

Write-Host "`nDone! Full Safiyan International Ecommerce System structure created successfully." -ForegroundColor Green
