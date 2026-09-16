using System.Text;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

using Safiyan.Api.Middleware;
using Safiyan.Infrastructure.Data;
using Safiyan.Infrastructure.Data.Seed;
using Safiyan.Infrastructure.ExternalIntegrations;

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// DATABASE
// ============================================================

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));


// ============================================================
// CONTROLLERS
// ============================================================

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter()
        );
    });


// ============================================================
// MEMORY CACHE
// ============================================================

builder.Services.AddMemoryCache();


// ============================================================
// FILE STORAGE
// ============================================================

builder.Services.AddSingleton(sp =>
    new Safiyan.Infrastructure.Services.FileStorageService(
        AppContext.BaseDirectory
    ));


// ============================================================
// EXTERNAL SERVICES
// ============================================================

builder.Services.AddHttpClient<
    Safiyan.Infrastructure.ExternalIntegrations.UnsplashImageService
>();


builder.Services.AddHttpClient<ShippingApiClient>((serviceProvider, client) =>
{
    var baseUrl =
        serviceProvider
            .GetRequiredService<IConfiguration>()
            ["Integrations:Shipping:BaseUrl"];

    if (!string.IsNullOrWhiteSpace(baseUrl))
    {
        client.BaseAddress = new Uri(baseUrl);
    }
});


builder.Services.AddHttpClient<SslCommerzClient>((serviceProvider, client) =>
{
    var baseUrl =
        serviceProvider
            .GetRequiredService<IConfiguration>()
            ["Integrations:SslCommerz:BaseUrl"];

    if (!string.IsNullOrWhiteSpace(baseUrl))
    {
        client.BaseAddress = new Uri(baseUrl);
    }
});


builder.Services.AddHttpClient<StripeClient>((serviceProvider, client) =>
{
    var baseUrl =
        serviceProvider
            .GetRequiredService<IConfiguration>()
            ["Integrations:Stripe:BaseUrl"];

    if (!string.IsNullOrWhiteSpace(baseUrl))
    {
        client.BaseAddress = new Uri(baseUrl);
    }
});


// ============================================================
// JWT CONFIGURATION
// ============================================================

var jwtKey = builder.Configuration["Jwt:Key"];

if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
{
    throw new InvalidOperationException(
        "Jwt:Key must be configured with at least 32 characters."
    );
}


builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtKey)
                    ),

                ValidateIssuer = false,
                ValidateAudience = false,

                ValidateLifetime = true,

                ClockSkew = TimeSpan.FromMinutes(1),

                RoleClaimType =
                    System.Security.Claims.ClaimTypes.Role
            };
    });


builder.Services.AddAuthorization();


// ============================================================
// CORS
// ============================================================

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


// ============================================================
// SWAGGER + JWT AUTHORIZE
// ============================================================

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "Safiyan.Api",
            Version = "v1",
            Description =
                "Safiyan International ECommerce System API"
        }
    );


    // --------------------------------------------------------
    // JWT Bearer Security Definition
    // --------------------------------------------------------

    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",

            Type = SecuritySchemeType.Http,

            Scheme = "bearer",

            BearerFormat = "JWT",

            In = ParameterLocation.Header,

            Description =
                "Enter your JWT token below.\n\n" +
                "Example:\n" +
                "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6..."
        }
    );


    // --------------------------------------------------------
    // Apply Bearer Authentication Globally
    // --------------------------------------------------------

    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document)] = []
        });
});


// ============================================================
// BUILD APPLICATION
// ============================================================

var app = builder.Build();


// ============================================================
// DATABASE SEEDING
// ============================================================

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    try
    {
        var dbContext =
            services.GetRequiredService<ApplicationDbContext>();

        await dbContext.Database.MigrateAsync();

        // ----------------------------------------------------
        // Seed application data
        // ----------------------------------------------------

        await DevelopmentSeed.SeedAsync(dbContext);
    }
    catch (Exception ex)
    {
        var logger =
            services.GetRequiredService<ILogger<Program>>();

        logger.LogError(
            ex,
            "An error occurred while migrating/seeding the database."
        );

        throw;
    }
}


// ============================================================
// DEVELOPMENT / SWAGGER
// ============================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint(
            "/swagger/v1/swagger.json",
            "Safiyan.Api v1"
        );

        options.DocumentTitle =
            "Safiyan International ECommerce System API";
    });
}


// ============================================================
// HTTPS
// ============================================================

app.UseHttpsRedirection();


// ============================================================
// CORS
// ============================================================

app.UseCors("AllowFrontend");


// ============================================================
// CUSTOM MIDDLEWARE
// ============================================================

// ????? Middleware ??????? ????? ?????.
// ??? ExceptionMiddleware ????:

app.UseMiddleware<ExceptionMiddleware>();


// ============================================================
// AUTHENTICATION
// ============================================================

app.UseAuthentication();


// ============================================================
// AUTHORIZATION
// ============================================================

app.UseAuthorization();


// ============================================================
// CONTROLLERS
// ============================================================

app.MapControllers();


// ============================================================
// RUN
// ============================================================

app.Run();

   // test push


