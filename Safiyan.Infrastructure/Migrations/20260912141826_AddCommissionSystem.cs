using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Safiyan.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCommissionSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CommissionRateOverride",
                table: "Vendors",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PayableBalance",
                table: "Vendors",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "CommissionAmount",
                table: "OrderItems",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "CommissionRateApplied",
                table: "OrderItems",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "CommissionSettled",
                table: "OrderItems",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "VendorEarning",
                table: "OrderItems",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "CommissionRate",
                table: "Categories",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "VendorPayouts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VendorId = table.Column<int>(type: "int", nullable: false),
                    PayoutReference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    PaymentMethod = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    PeriodFrom = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PeriodTo = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorPayouts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorPayouts_Vendors_VendorId",
                        column: x => x.VendorId,
                        principalTable: "Vendors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VendorPayouts_PayoutReference",
                table: "VendorPayouts",
                column: "PayoutReference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VendorPayouts_VendorId",
                table: "VendorPayouts",
                column: "VendorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VendorPayouts");

            migrationBuilder.DropColumn(
                name: "CommissionRateOverride",
                table: "Vendors");

            migrationBuilder.DropColumn(
                name: "PayableBalance",
                table: "Vendors");

            migrationBuilder.DropColumn(
                name: "CommissionAmount",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "CommissionRateApplied",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "CommissionSettled",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "VendorEarning",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "CommissionRate",
                table: "Categories");
        }
    }
}
