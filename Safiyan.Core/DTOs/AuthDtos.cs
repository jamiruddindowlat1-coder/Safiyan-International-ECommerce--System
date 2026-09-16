namespace Safiyan.Core.DTOs;

public sealed record RegisterDto(
    string FullName,
    string Email,
    string Password,
    string? Phone = null,
    string? Role = null);

public sealed record LoginDto(string Email, string Password);

public sealed record UpdateUserDto(
    string FullName,
    string Email,
    string? Phone = null,
    string? Password = null);
