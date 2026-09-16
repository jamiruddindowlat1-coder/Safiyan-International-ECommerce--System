using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Safiyan.Core.Entities;

namespace Safiyan.Infrastructure.Data.Seed;

public static class DevelopmentSeed
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        var demoUsers = new[]
        {
            CreateUser("SIES Administrator", "admin@sies.local", "Admin@12345", "Admin"),
            CreateUser("SIES Vendor", "vendor@sies.local", "Vendor@12345", "Vendor"),
            CreateUser("SIES Customer", "customer@sies.local", "Customer@12345", "Customer")
        };

        foreach (var demoUser in demoUsers)
        {
            if (!await context.Users.AnyAsync(user => user.Email == demoUser.Email))
                context.Users.Add(demoUser);
        }

        await context.SaveChangesAsync();
    }

    private static User CreateUser(string fullName, string email, string password, string role)
    {
        return new User
        {
            FullName = fullName,
            Email = email,
            PasswordHash = HashPassword(password),
            Role = role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    private static string HashPassword(string password)
{
    const int iterations = 100_000;

    var salt = RandomNumberGenerator.GetBytes(16);

    var hash = Rfc2898DeriveBytes.Pbkdf2(
        password,
        salt,
        iterations,
        HashAlgorithmName.SHA256,
        32);

    return $"{iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
}
}



