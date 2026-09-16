using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;
using Safiyan.Infrastructure.Data;

namespace Safiyan.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ReportController : ControllerBase
{
	private static readonly string[] EntryTypes = ["Purchase", "Expense", "Income"];
	private readonly ApplicationDbContext _context;

	public ReportController(ApplicationDbContext context)
	{
		_context = context;
	}

	[HttpGet("accounts")]
	public async Task<ActionResult<object>> GetAccounts(DateTime? from, DateTime? to)
	{
		var startDate = (from ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1)).Date;
		var endDate = (to ?? DateTime.UtcNow).Date;
		var endExclusive = endDate.AddDays(1);

		var orders = await _context.Orders
			.AsNoTracking()
			.Where(order => order.CreatedAt >= startDate && order.CreatedAt < endExclusive)
			.Select(order => new { order.CreatedAt, order.TotalAmount })
			.ToListAsync();

		var entries = await _context.AccountEntries
			.AsNoTracking()
			.Where(entry => entry.EntryDate >= startDate && entry.EntryDate < endExclusive)
			.OrderByDescending(entry => entry.EntryDate)
			.ToListAsync();

		var sales = orders.Sum(order => order.TotalAmount);
		var purchases = entries
			.Where(entry => entry.Type == "Purchase")
			.Sum(entry => entry.Amount);
		var expenses = entries
			.Where(entry => entry.Type == "Expense")
			.Sum(entry => entry.Amount);
		var otherIncome = entries
			.Where(entry => entry.Type == "Income")
			.Sum(entry => entry.Amount);

		var inventoryValue = await _context.Products
			.AsNoTracking()
			.SumAsync(product => product.Price * product.StockQuantity);

		var netProfit = sales + otherIncome - purchases - expenses;
		var cash = netProfit;
		var totalAssets = cash + inventoryValue;

		var daily = orders
			.GroupBy(order => order.CreatedAt.Date)
			.ToDictionary(group => group.Key, group => new DailyAccountRow
			{
				Date = group.Key,
				Sales = group.Sum(order => order.TotalAmount)
			});

		foreach (var entry in entries)
		{
			if (!daily.TryGetValue(entry.EntryDate.Date, out var row))
			{
				row = new DailyAccountRow { Date = entry.EntryDate.Date };
				daily[entry.EntryDate.Date] = row;
			}

			if (entry.Type == "Purchase") row.Purchases += entry.Amount;
			if (entry.Type == "Expense") row.Expenses += entry.Amount;
			if (entry.Type == "Income") row.OtherIncome += entry.Amount;
		}

		return Ok(new
		{
			From = startDate,
			To = endDate,
			Daily = daily.Values
				.OrderByDescending(row => row.Date)
				.Select(row => new
				{
					row.Date,
					row.Sales,
					row.Purchases,
					row.Expenses,
					row.OtherIncome,
					Profit = row.Sales + row.OtherIncome - row.Purchases - row.Expenses
				}),
			ProfitAndLoss = new
			{
				Sales = sales,
				OtherIncome = otherIncome,
				Purchases = purchases,
				Expenses = expenses,
				NetProfit = netProfit
			},
			BalanceSheet = new
			{
				Cash = cash,
				Inventory = inventoryValue,
				TotalAssets = totalAssets,
				Liabilities = 0m,
				Equity = totalAssets
			},
			TrialBalance = new
			{
				Debit = totalAssets,
				Credit = totalAssets
			},
			Entries = entries.Select(entry => new
			{
				entry.Id,
				entry.EntryDate,
				entry.Type,
				entry.Description,
				entry.Amount,
				entry.Reference
			})
		});
	}

	[HttpPost("entries")]
	public async Task<ActionResult<AccountEntry>> AddEntry(AccountEntryRequest request)
	{
		if (request is null)
			return BadRequest(new { message = "Accounting entry data is required." });

		var normalizedType = request.Type.Trim();
		if (!EntryTypes.Contains(normalizedType, StringComparer.OrdinalIgnoreCase))
			return BadRequest(new { message = "Type must be Purchase, Expense, or Income." });

		if (request.Amount <= 0)
			return BadRequest(new { message = "Amount must be greater than zero." });

		if (string.IsNullOrWhiteSpace(request.Description))
			return BadRequest(new { message = "Description is required." });

		var entry = new AccountEntry
		{
			EntryDate = request.EntryDate?.Date ?? DateTime.UtcNow.Date,
			Type = EntryTypes.First(type => type.Equals(normalizedType, StringComparison.OrdinalIgnoreCase)),
			Description = request.Description.Trim(),
			Amount = request.Amount,
			Reference = request.Reference?.Trim() ?? string.Empty
		};

		_context.AccountEntries.Add(entry);
		await _context.SaveChangesAsync();

		return Created($"/api/Report/entries/{entry.Id}", entry);
	}

	private sealed class DailyAccountRow
	{
		public DateTime Date { get; set; }
		public decimal Sales { get; set; }
		public decimal Purchases { get; set; }
		public decimal Expenses { get; set; }
		public decimal OtherIncome { get; set; }
	}

	public sealed class AccountEntryRequest
	{
		public DateTime? EntryDate { get; set; }
		public string Type { get; set; } = string.Empty;
		public string Description { get; set; } = string.Empty;
		public decimal Amount { get; set; }
		public string? Reference { get; set; }
	}
}
