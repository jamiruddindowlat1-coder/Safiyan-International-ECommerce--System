using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Safiyan.Api.Middleware;
using Safiyan.Infrastructure.Data;
using Safiyan.Infrastructure.Data.Seed;
using Safiyan.Infrastructure.ExternalIntegrations;

var builder = WebApplication.CreateBuilder(args);

// ----------------------------------------------------
// Database
// ----------------------------------------------------
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

// ----------------------------------------------------
// Controllers
// ----------------------------------------------------
builder.Services.AddControllers();
builder.Services.AddMemoryCache();
builder.Services.AddSingleton(sp => new Safiyan.Infrastructure.Services.FileStorageService(AppContext.BaseDirectory));
builder.Services.AddHttpClient<ShippingApiClient>((serviceProvider, client) =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var baseUrl = configuration["Integrations:Shipping:BaseUrl"];
    if (!string.IsNullOrWhiteSpace(baseUrl))
        client.BaseAddress = new Uri(baseUrl);
});
builder.Services.AddHttpClient<SslCommerzClient>((serviceProvider, client) =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var baseUrl = configuration["Integrations:SslCommerz:BaseUrl"];
    if (!string.IsNullOrWhiteSpace(baseUrl))
        client.BaseAddress = new Uri(baseUrl);
});
builder.Services.AddHttpClient<StripeClient>((serviceProvider, client) =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var baseUrl = configuration["Integrations:Stripe:BaseUrl"];
    if (!string.IsNullOrWhiteSpace(baseUrl))
        client.BaseAddress = new Uri(baseUrl);
});

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException("Jwt:Key must be configured with at least 32 characters.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            RoleClaimType = System.Security.Claims.ClaimTypes.Role
        };
    });
builder.Services.AddAuthorization();

// ----------------------------------------------------
// OpenAPI / Swagger
// ----------------------------------------------------
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();

// ----------------------------------------------------
// CORS
// ----------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// ----------------------------------------------------
// Build application
// ----------------------------------------------------
var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();

// ----------------------------------------------------
// Development OpenAPI
// ----------------------------------------------------
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Safiyan API v1");
        options.RoutePrefix = "swagger";
    });
}

// ----------------------------------------------------
// Middleware
// ----------------------------------------------------
app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

// ----------------------------------------------------
// Controllers
// ----------------------------------------------------
app.MapControllers();

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await DevelopmentSeed.SeedAsync(context);
}

// ----------------------------------------------------
// Run
// ----------------------------------------------------
app.Run();