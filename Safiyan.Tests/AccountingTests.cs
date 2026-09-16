using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Api.Controllers;
using Safiyan.Core.Entities;
using Safiyan.Infrastructure.Data;

namespace Safiyan.Tests;

public class AccountingTests
{
    [Fact]
    public async Task AddEntryRejectsUnknownType()
    {
        await using var context = CreateContext();
        var controller = new ReportController(context);

        var result = await controller.AddEntry(new ReportController.AccountEntryRequest
        {
            Type = "Unknown",
            Description = "Invalid entry",
            Amount = 10
        });

        Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Empty(context.AccountEntries);
    }

    [Fact]
    public async Task AddEntryStoresNormalizedEntry()
    {
        await using var context = CreateContext();
        var controller = new ReportController(context);

        var result = await controller.AddEntry(new ReportController.AccountEntryRequest
        {
            EntryDate = new DateTime(2026, 9, 8, 18, 30, 0),
            Type = " expense ",
            Description = "  Office supplies  ",
            Amount = 125.50m,
            Reference = "  INV-7  "
        });

        Assert.IsType<CreatedResult>(result.Result);
        var entry = Assert.Single(context.AccountEntries);
        Assert.Equal("Expense", entry.Type);
        Assert.Equal("Office supplies", entry.Description);
        Assert.Equal("INV-7", entry.Reference);
        Assert.Equal(new DateTime(2026, 9, 8), entry.EntryDate);
    }

    [Fact]
    public async Task GetAccountsCalculatesProfitAndBalanceSheet()
    {
        await using var context = CreateContext();
        var date = new DateTime(2026, 9, 8);
        context.Orders.Add(new Order { Id = 1, UserId = 1, TotalAmount = 100m, CreatedAt = date.AddHours(10) });
        context.Products.Add(new Product { Id = 1, CategoryId = 1, VendorId = 1, Name = "Stock", SKU = "STOCK-1", Price = 50m, StockQuantity = 2 });
        context.AccountEntries.AddRange(
            new AccountEntry { EntryDate = date, Type = "Purchase", Description = "Goods", Amount = 30m },
            new AccountEntry { EntryDate = date, Type = "Expense", Description = "Delivery", Amount = 10m });
        await context.SaveChangesAsync();

        var controller = new ReportController(context);
        var result = await controller.GetAccounts(date, date);
        var response = Assert.IsType<OkObjectResult>(result.Result).Value!;
        var profitAndLoss = response.GetType().GetProperty("ProfitAndLoss")!.GetValue(response)!;
        var balanceSheet = response.GetType().GetProperty("BalanceSheet")!.GetValue(response)!;

        Assert.Equal(100m, ReadDecimal(profitAndLoss, "Sales"));
        Assert.Equal(30m, ReadDecimal(profitAndLoss, "Purchases"));
        Assert.Equal(10m, ReadDecimal(profitAndLoss, "Expenses"));
        Assert.Equal(60m, ReadDecimal(profitAndLoss, "NetProfit"));
        Assert.Equal(100m, ReadDecimal(balanceSheet, "Inventory"));
        Assert.Equal(160m, ReadDecimal(balanceSheet, "TotalAssets"));
    }

    private static decimal ReadDecimal(object value, string propertyName)
    {
        return (decimal)value.GetType().GetProperty(propertyName)!.GetValue(value)!;
    }

    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }
}
