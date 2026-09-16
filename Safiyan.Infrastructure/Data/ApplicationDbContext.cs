using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;

namespace Safiyan.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<ProductAttribute> ProductAttributes => Set<ProductAttribute>();
    public DbSet<ProductAttributeValue> ProductAttributeValues => Set<ProductAttributeValue>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<ProductVariantAttributeValue> ProductVariantAttributeValues => Set<ProductVariantAttributeValue>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Wishlist> Wishlists => Set<Wishlist>();
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AccountEntry> AccountEntries => Set<AccountEntry>();
    public DbSet<VendorPayout> VendorPayouts => Set<VendorPayout>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.FullName)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.Email)
                .HasMaxLength(200)
                .IsRequired();

            entity.HasIndex(x => x.Email)
                .IsUnique();

            entity.Property(x => x.PasswordHash)
                .IsRequired();

            entity.Property(x => x.Phone)
                .HasMaxLength(30);

            entity.Property(x => x.Role)
                .HasMaxLength(30)
                .IsRequired();

            entity.HasOne(x => x.Vendor)
                .WithOne(x => x.User)
                .HasForeignKey<Vendor>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Vendor
        modelBuilder.Entity<Vendor>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.StoreName)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.StoreDescription)
                .HasMaxLength(2000);

            entity.Property(x => x.Phone)
                .HasMaxLength(30);

            entity.Property(x => x.Address)
                .HasMaxLength(500);

            entity.Property(x => x.CommissionRateOverride)
                .HasPrecision(5, 2);

            entity.Property(x => x.PayableBalance)
                .HasPrecision(18, 2);
        });

        // Category
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.HasIndex(x => x.Name)
                .IsUnique();

            entity.Property(x => x.Description)
                .HasMaxLength(1000);

            entity.Property(x => x.ImageUrl)
                .HasMaxLength(500);

            entity.Property(x => x.CommissionRate)
                .HasPrecision(5, 2);

            // Self-referencing hierarchy (unlimited nesting).
            // Restrict delete so a parent category can't be removed while
            // subcategories still point to it.
            entity.HasOne(x => x.ParentCategory)
                .WithMany(x => x.SubCategories)
                .HasForeignKey(x => x.ParentCategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Product
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(x => x.Description)
                .HasMaxLength(4000);

            entity.Property(x => x.SKU)
                .HasMaxLength(100)
                .IsRequired();

            entity.HasIndex(x => x.SKU)
                .IsUnique();

            entity.Property(x => x.Price)
                .HasPrecision(18, 2);

            entity.Property(x => x.DiscountPrice)
                .HasPrecision(18, 2);

            entity.Property(x => x.ImageUrl)
                .HasMaxLength(500);

            entity.HasOne(x => x.Category)
                .WithMany(x => x.Products)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Vendor)
                .WithMany(x => x.Products)
                .HasForeignKey(x => x.VendorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ProductImage
        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.ImageUrl)
                .HasMaxLength(500)
                .IsRequired();

            entity.HasOne(x => x.Product)
                .WithMany(x => x.Images)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(x => new { x.ProductId, x.DisplayOrder });
        });

        // ProductAttribute (e.g. "Color", "Size")
        modelBuilder.Entity<ProductAttribute>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasMaxLength(100)
                .IsRequired();

            entity.HasIndex(x => x.Name)
                .IsUnique();
        });

        // ProductAttributeValue (e.g. "Red", "M")
        modelBuilder.Entity<ProductAttributeValue>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Value)
                .HasMaxLength(100)
                .IsRequired();

            entity.HasOne(x => x.ProductAttribute)
                .WithMany(x => x.Values)
                .HasForeignKey(x => x.ProductAttributeId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(x => new { x.ProductAttributeId, x.Value })
                .IsUnique();
        });

        // ProductVariant
        modelBuilder.Entity<ProductVariant>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.SKU)
                .HasMaxLength(100)
                .IsRequired();

            entity.HasIndex(x => x.SKU)
                .IsUnique();

            entity.Property(x => x.Price)
                .HasPrecision(18, 2);

            entity.Property(x => x.DiscountPrice)
                .HasPrecision(18, 2);

            entity.Property(x => x.ImageUrl)
                .HasMaxLength(500);

            entity.HasOne(x => x.Product)
                .WithMany(x => x.Variants)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ProductVariantAttributeValue (join: variant <-> attribute value)
        modelBuilder.Entity<ProductVariantAttributeValue>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.HasOne(x => x.ProductVariant)
                .WithMany(x => x.AttributeValues)
                .HasForeignKey(x => x.ProductVariantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.ProductAttributeValue)
                .WithMany(x => x.VariantLinks)
                .HasForeignKey(x => x.ProductAttributeValueId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.ProductVariantId, x.ProductAttributeValueId })
                .IsUnique();
        });

        // Cart
        modelBuilder.Entity<Cart>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // CartItem
        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.UnitPrice)
                .HasPrecision(18, 2);

            entity.HasOne(x => x.Cart)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.CartId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Product)
                .WithMany(x => x.CartItems)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.ProductVariant)
                .WithMany(x => x.CartItems)
                .HasForeignKey(x => x.ProductVariantId)
                .OnDelete(DeleteBehavior.Restrict);

            // Uniqueness now considers the variant too, so Red-M and Blue-L
            // of the same product can both sit in the cart as separate rows.
            entity.HasIndex(x => new { x.CartId, x.ProductId, x.ProductVariantId })
                .IsUnique();
        });

        // Order
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.OrderNumber)
                .HasMaxLength(100)
                .IsRequired();

            entity.HasIndex(x => x.OrderNumber)
                .IsUnique();

            entity.Property(x => x.SubTotal)
                .HasPrecision(18, 2);

            entity.Property(x => x.DiscountAmount)
                .HasPrecision(18, 2);

            entity.Property(x => x.ShippingAmount)
                .HasPrecision(18, 2);

            entity.Property(x => x.TaxAmount)
                .HasPrecision(18, 2);

            entity.Property(x => x.TotalAmount)
                .HasPrecision(18, 2);

            entity.Property(x => x.ShippingName)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.ShippingPhone)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(x => x.ShippingAddress)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(x => x.ShippingCity)
                .HasMaxLength(100);

            entity.Property(x => x.ShippingPostalCode)
                .HasMaxLength(20);

            entity.Property(x => x.ShippingCountry)
                .HasMaxLength(100);

            entity.HasOne(x => x.User)
                .WithMany(x => x.Orders)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // OrderItem
        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.ProductName)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(x => x.ProductSKU)
                .HasMaxLength(100);

            entity.Property(x => x.VariantDescription)
                .HasMaxLength(500);

            entity.Property(x => x.UnitPrice)
                .HasPrecision(18, 2);

            entity.Property(x => x.DiscountAmount)
                .HasPrecision(18, 2);

            entity.Property(x => x.TotalPrice)
                .HasPrecision(18, 2);

            entity.Property(x => x.CommissionRateApplied)
                .HasPrecision(5, 2);

            entity.Property(x => x.CommissionAmount)
                .HasPrecision(18, 2);

            entity.Property(x => x.VendorEarning)
                .HasPrecision(18, 2);

            entity.HasOne(x => x.Order)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Product)
                .WithMany(x => x.OrderItems)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.ProductVariant)
                .WithMany(x => x.OrderItems)
                .HasForeignKey(x => x.ProductVariantId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Vendor)
                .WithMany(x => x.OrderItems)
                .HasForeignKey(x => x.VendorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Payment
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.TransactionId)
                .HasMaxLength(200);

            entity.Property(x => x.PaymentMethod)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(x => x.Amount)
                .HasPrecision(18, 2);

            entity.Property(x => x.GatewayResponse)
                .HasMaxLength(4000);

            entity.HasOne(x => x.Order)
                .WithMany(x => x.Payments)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Coupon
        modelBuilder.Entity<Coupon>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Code)
                .HasMaxLength(50)
                .IsRequired();

            entity.HasIndex(x => x.Code)
                .IsUnique();

            entity.Property(x => x.Description)
                .HasMaxLength(1000);

            entity.Property(x => x.DiscountPercentage)
                .HasPrecision(5, 2);

            entity.Property(x => x.MaximumDiscountAmount)
                .HasPrecision(18, 2);

            entity.Property(x => x.MinimumOrderAmount)
                .HasPrecision(18, 2);
        });

        // Review
        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Comment)
                .HasMaxLength(2000);

            entity.HasOne(x => x.Product)
                .WithMany(x => x.Reviews)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.User)
                .WithMany(x => x.Reviews)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.ProductId, x.UserId });
        });

        // Wishlist
        modelBuilder.Entity<Wishlist>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasMaxLength(100)
                .IsRequired();

            entity.HasOne(x => x.User)
                .WithMany(x => x.Wishlists)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // WishlistItem
        modelBuilder.Entity<WishlistItem>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.HasOne(x => x.Wishlist)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.WishlistId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Product)
                .WithMany(x => x.WishlistItems)
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => new { x.WishlistId, x.ProductId })
                .IsUnique();
        });

        // Notification
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(x => x.Message)
                .HasMaxLength(2000)
                .IsRequired();

            entity.Property(x => x.Type)
                .HasMaxLength(50);

            entity.HasOne(x => x.User)
                .WithMany(x => x.Notifications)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Vendor payout
        modelBuilder.Entity<VendorPayout>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.PayoutReference)
                .HasMaxLength(100)
                .IsRequired();

            entity.HasIndex(x => x.PayoutReference)
                .IsUnique();

            entity.Property(x => x.Amount)
                .HasPrecision(18, 2);

            entity.Property(x => x.PaymentMethod)
                .HasMaxLength(50);

            entity.Property(x => x.Notes)
                .HasMaxLength(1000);

            entity.HasOne(x => x.Vendor)
                .WithMany(x => x.Payouts)
                .HasForeignKey(x => x.VendorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Account entry
        modelBuilder.Entity<AccountEntry>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.Type)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(x => x.Description)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(x => x.Amount)
                .HasPrecision(18, 2);

            entity.Property(x => x.Reference)
                .HasMaxLength(100);

            entity.HasIndex(x => x.EntryDate);
        });
    }
}