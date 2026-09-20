IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
CREATE TABLE [Categories] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(150) NOT NULL,
    [Description] nvarchar(1000) NOT NULL,
    [ImageUrl] nvarchar(500) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Categories] PRIMARY KEY ([Id])
);

CREATE TABLE [Coupons] (
    [Id] int NOT NULL IDENTITY,
    [Code] nvarchar(50) NOT NULL,
    [Description] nvarchar(1000) NOT NULL,
    [DiscountPercentage] decimal(5,2) NOT NULL,
    [MaximumDiscountAmount] decimal(18,2) NULL,
    [MinimumOrderAmount] decimal(18,2) NULL,
    [UsageLimit] int NOT NULL,
    [UsedCount] int NOT NULL,
    [StartDate] datetime2 NOT NULL,
    [EndDate] datetime2 NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Coupons] PRIMARY KEY ([Id])
);

CREATE TABLE [Users] (
    [Id] int NOT NULL IDENTITY,
    [FullName] nvarchar(150) NOT NULL,
    [Email] nvarchar(200) NOT NULL,
    [PasswordHash] nvarchar(max) NOT NULL,
    [Phone] nvarchar(30) NOT NULL,
    [Role] nvarchar(30) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
);

CREATE TABLE [Carts] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Carts] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Carts_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [Notifications] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [Title] nvarchar(200) NOT NULL,
    [Message] nvarchar(2000) NOT NULL,
    [Type] nvarchar(50) NOT NULL,
    [IsRead] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [ReadAt] datetime2 NULL,
    CONSTRAINT [PK_Notifications] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Notifications_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [Orders] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [OrderNumber] nvarchar(100) NOT NULL,
    [SubTotal] decimal(18,2) NOT NULL,
    [DiscountAmount] decimal(18,2) NOT NULL,
    [ShippingAmount] decimal(18,2) NOT NULL,
    [TaxAmount] decimal(18,2) NOT NULL,
    [TotalAmount] decimal(18,2) NOT NULL,
    [ShippingName] nvarchar(150) NOT NULL,
    [ShippingPhone] nvarchar(30) NOT NULL,
    [ShippingAddress] nvarchar(500) NOT NULL,
    [ShippingCity] nvarchar(100) NOT NULL,
    [ShippingPostalCode] nvarchar(20) NOT NULL,
    [ShippingCountry] nvarchar(100) NOT NULL,
    [Status] int NOT NULL,
    [PaymentStatus] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Orders] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Orders_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [Vendors] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [StoreName] nvarchar(150) NOT NULL,
    [StoreDescription] nvarchar(2000) NOT NULL,
    [Phone] nvarchar(30) NOT NULL,
    [Address] nvarchar(500) NOT NULL,
    [IsApproved] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Vendors] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Vendors_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [Wishlists] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Wishlists] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Wishlists_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [Payments] (
    [Id] int NOT NULL IDENTITY,
    [OrderId] int NOT NULL,
    [TransactionId] nvarchar(200) NOT NULL,
    [PaymentMethod] nvarchar(50) NOT NULL,
    [Amount] decimal(18,2) NOT NULL,
    [Status] int NOT NULL,
    [GatewayResponse] nvarchar(4000) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [PaidAt] datetime2 NULL,
    CONSTRAINT [PK_Payments] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Payments_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [Products] (
    [Id] int NOT NULL IDENTITY,
    [CategoryId] int NOT NULL,
    [VendorId] int NOT NULL,
    [Name] nvarchar(200) NOT NULL,
    [Description] nvarchar(4000) NOT NULL,
    [SKU] nvarchar(100) NOT NULL,
    [Price] decimal(18,2) NOT NULL,
    [DiscountPrice] decimal(18,2) NOT NULL,
    [StockQuantity] int NOT NULL,
    [ImageUrl] nvarchar(500) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Products] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Products_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [Categories] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Products_Vendors_VendorId] FOREIGN KEY ([VendorId]) REFERENCES [Vendors] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [CartItems] (
    [Id] int NOT NULL IDENTITY,
    [CartId] int NOT NULL,
    [ProductId] int NOT NULL,
    [Quantity] int NOT NULL,
    [UnitPrice] decimal(18,2) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_CartItems] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_CartItems_Carts_CartId] FOREIGN KEY ([CartId]) REFERENCES [Carts] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_CartItems_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [OrderItems] (
    [Id] int NOT NULL IDENTITY,
    [OrderId] int NOT NULL,
    [ProductId] int NOT NULL,
    [VendorId] int NOT NULL,
    [ProductName] nvarchar(200) NOT NULL,
    [ProductSKU] nvarchar(100) NOT NULL,
    [Quantity] int NOT NULL,
    [UnitPrice] decimal(18,2) NOT NULL,
    [DiscountAmount] decimal(18,2) NOT NULL,
    [TotalPrice] decimal(18,2) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_OrderItems] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_OrderItems_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_OrderItems_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_OrderItems_Vendors_VendorId] FOREIGN KEY ([VendorId]) REFERENCES [Vendors] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [Reviews] (
    [Id] int NOT NULL IDENTITY,
    [ProductId] int NOT NULL,
    [UserId] int NOT NULL,
    [Rating] int NOT NULL,
    [Comment] nvarchar(2000) NOT NULL,
    [IsApproved] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Reviews] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Reviews_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Reviews_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [WishlistItems] (
    [Id] int NOT NULL IDENTITY,
    [WishlistId] int NOT NULL,
    [ProductId] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_WishlistItems] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_WishlistItems_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_WishlistItems_Wishlists_WishlistId] FOREIGN KEY ([WishlistId]) REFERENCES [Wishlists] ([Id]) ON DELETE CASCADE
);

CREATE UNIQUE INDEX [IX_CartItems_CartId_ProductId] ON [CartItems] ([CartId], [ProductId]);

CREATE INDEX [IX_CartItems_ProductId] ON [CartItems] ([ProductId]);

CREATE INDEX [IX_Carts_UserId] ON [Carts] ([UserId]);

CREATE UNIQUE INDEX [IX_Categories_Name] ON [Categories] ([Name]);

CREATE UNIQUE INDEX [IX_Coupons_Code] ON [Coupons] ([Code]);

CREATE INDEX [IX_Notifications_UserId] ON [Notifications] ([UserId]);

CREATE INDEX [IX_OrderItems_OrderId] ON [OrderItems] ([OrderId]);

CREATE INDEX [IX_OrderItems_ProductId] ON [OrderItems] ([ProductId]);

CREATE INDEX [IX_OrderItems_VendorId] ON [OrderItems] ([VendorId]);

CREATE UNIQUE INDEX [IX_Orders_OrderNumber] ON [Orders] ([OrderNumber]);

CREATE INDEX [IX_Orders_UserId] ON [Orders] ([UserId]);

CREATE INDEX [IX_Payments_OrderId] ON [Payments] ([OrderId]);

CREATE INDEX [IX_Products_CategoryId] ON [Products] ([CategoryId]);

CREATE UNIQUE INDEX [IX_Products_SKU] ON [Products] ([SKU]);

CREATE INDEX [IX_Products_VendorId] ON [Products] ([VendorId]);

CREATE INDEX [IX_Reviews_ProductId_UserId] ON [Reviews] ([ProductId], [UserId]);

CREATE INDEX [IX_Reviews_UserId] ON [Reviews] ([UserId]);

CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);

CREATE UNIQUE INDEX [IX_Vendors_UserId] ON [Vendors] ([UserId]);

CREATE INDEX [IX_WishlistItems_ProductId] ON [WishlistItems] ([ProductId]);

CREATE UNIQUE INDEX [IX_WishlistItems_WishlistId_ProductId] ON [WishlistItems] ([WishlistId], [ProductId]);

CREATE INDEX [IX_Wishlists_UserId] ON [Wishlists] ([UserId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260908030337_InitialCreate', N'10.0.11');

COMMIT;
GO

BEGIN TRANSACTION;
CREATE TABLE [AccountEntries] (
    [Id] int NOT NULL IDENTITY,
    [EntryDate] datetime2 NOT NULL,
    [Type] nvarchar(30) NOT NULL,
    [Description] nvarchar(500) NOT NULL,
    [Amount] decimal(18,2) NOT NULL,
    [Reference] nvarchar(100) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_AccountEntries] PRIMARY KEY ([Id])
);

CREATE INDEX [IX_AccountEntries_EntryDate] ON [AccountEntries] ([EntryDate]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260908153724_AddAccountEntries', N'10.0.11');

COMMIT;
GO

BEGIN TRANSACTION;
ALTER TABLE [Vendors] ADD [CommissionRateOverride] decimal(5,2) NULL;

ALTER TABLE [Vendors] ADD [PayableBalance] decimal(18,2) NOT NULL DEFAULT 0.0;

ALTER TABLE [OrderItems] ADD [CommissionAmount] decimal(18,2) NOT NULL DEFAULT 0.0;

ALTER TABLE [OrderItems] ADD [CommissionRateApplied] decimal(5,2) NOT NULL DEFAULT 0.0;

ALTER TABLE [OrderItems] ADD [CommissionSettled] bit NOT NULL DEFAULT CAST(0 AS bit);

ALTER TABLE [OrderItems] ADD [VendorEarning] decimal(18,2) NOT NULL DEFAULT 0.0;

ALTER TABLE [Categories] ADD [CommissionRate] decimal(5,2) NOT NULL DEFAULT 0.0;

CREATE TABLE [VendorPayouts] (
    [Id] int NOT NULL IDENTITY,
    [VendorId] int NOT NULL,
    [PayoutReference] nvarchar(100) NOT NULL,
    [Amount] decimal(18,2) NOT NULL,
    [PaymentMethod] nvarchar(50) NOT NULL,
    [Notes] nvarchar(1000) NOT NULL,
    [Status] int NOT NULL,
    [PeriodFrom] datetime2 NOT NULL,
    [PeriodTo] datetime2 NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [PaidAt] datetime2 NULL,
    CONSTRAINT [PK_VendorPayouts] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_VendorPayouts_Vendors_VendorId] FOREIGN KEY ([VendorId]) REFERENCES [Vendors] ([Id]) ON DELETE NO ACTION
);

CREATE UNIQUE INDEX [IX_VendorPayouts_PayoutReference] ON [VendorPayouts] ([PayoutReference]);

CREATE INDEX [IX_VendorPayouts_VendorId] ON [VendorPayouts] ([VendorId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260912141826_AddCommissionSystem', N'10.0.11');

COMMIT;
GO

BEGIN TRANSACTION;
DROP INDEX [IX_CartItems_CartId_ProductId] ON [CartItems];

ALTER TABLE [Vendors] ADD [Slug] nvarchar(max) NOT NULL DEFAULT N'';

ALTER TABLE [Vendors] ADD [StoreBannerUrl] nvarchar(max) NULL;

ALTER TABLE [Vendors] ADD [StoreLogoUrl] nvarchar(max) NULL;

ALTER TABLE [Products] ADD [HasVariants] bit NOT NULL DEFAULT CAST(0 AS bit);

ALTER TABLE [OrderItems] ADD [ProductVariantId] int NULL;

ALTER TABLE [OrderItems] ADD [VariantDescription] nvarchar(500) NOT NULL DEFAULT N'';

ALTER TABLE [Categories] ADD [ParentCategoryId] int NULL;

ALTER TABLE [CartItems] ADD [ProductVariantId] int NULL;

CREATE TABLE [ProductAttributes] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(100) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_ProductAttributes] PRIMARY KEY ([Id])
);

CREATE TABLE [ProductImages] (
    [Id] int NOT NULL IDENTITY,
    [ProductId] int NOT NULL,
    [ImageUrl] nvarchar(500) NOT NULL,
    [IsPrimary] bit NOT NULL,
    [DisplayOrder] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_ProductImages] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ProductImages_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [ProductVariants] (
    [Id] int NOT NULL IDENTITY,
    [ProductId] int NOT NULL,
    [SKU] nvarchar(100) NOT NULL,
    [Price] decimal(18,2) NOT NULL,
    [DiscountPrice] decimal(18,2) NOT NULL,
    [StockQuantity] int NOT NULL,
    [ImageUrl] nvarchar(500) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_ProductVariants] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ProductVariants_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [ProductAttributeValues] (
    [Id] int NOT NULL IDENTITY,
    [ProductAttributeId] int NOT NULL,
    [Value] nvarchar(100) NOT NULL,
    CONSTRAINT [PK_ProductAttributeValues] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ProductAttributeValues_ProductAttributes_ProductAttributeId] FOREIGN KEY ([ProductAttributeId]) REFERENCES [ProductAttributes] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [ProductVariantAttributeValues] (
    [Id] int NOT NULL IDENTITY,
    [ProductVariantId] int NOT NULL,
    [ProductAttributeValueId] int NOT NULL,
    CONSTRAINT [PK_ProductVariantAttributeValues] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ProductVariantAttributeValues_ProductAttributeValues_ProductAttributeValueId] FOREIGN KEY ([ProductAttributeValueId]) REFERENCES [ProductAttributeValues] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_ProductVariantAttributeValues_ProductVariants_ProductVariantId] FOREIGN KEY ([ProductVariantId]) REFERENCES [ProductVariants] ([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_OrderItems_ProductVariantId] ON [OrderItems] ([ProductVariantId]);

CREATE INDEX [IX_Categories_ParentCategoryId] ON [Categories] ([ParentCategoryId]);

CREATE UNIQUE INDEX [IX_CartItems_CartId_ProductId_ProductVariantId] ON [CartItems] ([CartId], [ProductId], [ProductVariantId]) WHERE [ProductVariantId] IS NOT NULL;

CREATE INDEX [IX_CartItems_ProductVariantId] ON [CartItems] ([ProductVariantId]);

CREATE UNIQUE INDEX [IX_ProductAttributes_Name] ON [ProductAttributes] ([Name]);

CREATE UNIQUE INDEX [IX_ProductAttributeValues_ProductAttributeId_Value] ON [ProductAttributeValues] ([ProductAttributeId], [Value]);

CREATE INDEX [IX_ProductImages_ProductId_DisplayOrder] ON [ProductImages] ([ProductId], [DisplayOrder]);

CREATE INDEX [IX_ProductVariantAttributeValues_ProductAttributeValueId] ON [ProductVariantAttributeValues] ([ProductAttributeValueId]);

CREATE UNIQUE INDEX [IX_ProductVariantAttributeValues_ProductVariantId_ProductAttributeValueId] ON [ProductVariantAttributeValues] ([ProductVariantId], [ProductAttributeValueId]);

CREATE INDEX [IX_ProductVariants_ProductId] ON [ProductVariants] ([ProductId]);

CREATE UNIQUE INDEX [IX_ProductVariants_SKU] ON [ProductVariants] ([SKU]);

ALTER TABLE [CartItems] ADD CONSTRAINT [FK_CartItems_ProductVariants_ProductVariantId] FOREIGN KEY ([ProductVariantId]) REFERENCES [ProductVariants] ([Id]) ON DELETE NO ACTION;

ALTER TABLE [Categories] ADD CONSTRAINT [FK_Categories_Categories_ParentCategoryId] FOREIGN KEY ([ParentCategoryId]) REFERENCES [Categories] ([Id]) ON DELETE NO ACTION;

ALTER TABLE [OrderItems] ADD CONSTRAINT [FK_OrderItems_ProductVariants_ProductVariantId] FOREIGN KEY ([ProductVariantId]) REFERENCES [ProductVariants] ([Id]) ON DELETE NO ACTION;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260912214503_AddProductVariantsAndCategoryHierarchy', N'10.0.11');

COMMIT;
GO

BEGIN TRANSACTION;
INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260913074431_MakeImageUrlNullable', N'10.0.11');

COMMIT;
GO

BEGIN TRANSACTION;
DECLARE @var nvarchar(max);
SELECT @var = QUOTENAME([d].[name])
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Categories]') AND [c].[name] = N'ImageUrl');
IF @var IS NOT NULL EXEC(N'ALTER TABLE [Categories] DROP CONSTRAINT ' + @var + ';');
ALTER TABLE [Categories] ALTER COLUMN [ImageUrl] nvarchar(500) NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260913134049_CheckPending', N'10.0.11');

COMMIT;
GO

