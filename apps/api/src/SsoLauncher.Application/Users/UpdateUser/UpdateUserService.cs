#nullable enable

using Microsoft.EntityFrameworkCore;
using SsoLauncher.Application.Abstractions.Persistence;
using SsoLauncher.Application.Audit;
using SsoLauncher.Application.Audit.Snapshots;
using SsoLauncher.Application.Common.Text;
using SsoLauncher.Application.Organization;
using SsoLauncher.Domain.Constants;

namespace SsoLauncher.Application.Users.UpdateUser;

public sealed class UpdateUserService(
    ISsoLauncherDbContext dbContext,
    AuditLogger auditLogger,
    AuditSnapshotReader snapshotReader,
    DepartmentCatalog departmentCatalog)
{
    public async Task<bool> UpdateAsync(
        long userId,
        UpdateUserRequest request,
        long actorId,
        string actorName,
        CancellationToken cancellationToken = default)
    {
        var name = TextFormat.Title(request.Name);
        var employeeNumber = Normalize(request.EmployeeNumber);
        var department = Normalize(request.Department);
        var jobTitle = TextFormat.TitleOrNull(request.JobTitle);
        var email = EmailRules.Normalize(request.Email);

        if (string.IsNullOrWhiteSpace(name) ||
            !EmailRules.IsValid(email))
        {
            return false;
        }

        var user = await dbContext.Users
            .SingleOrDefaultAsync(
                x => x.Id == userId,
                cancellationToken
            );

        if (user is null)
        {
            return false;
        }

        var departemenCode =
            department == user.Department && user.DepartemenCode is not null
                ? user.DepartemenCode
                : await departmentCatalog.CodeOfAsync(department, cancellationToken);

        if (department is not null && departemenCode is null)
        {
            return false;
        }

        var emailExists = await dbContext.Users
            .AnyAsync(
                x =>
                    x.Id != userId &&
                    x.Email == email,
                cancellationToken
            );

        if (emailExists)
        {
            return false;
        }

        if (employeeNumber is not null)
        {
            var employeeNumberExists = await dbContext.Users
                .AnyAsync(
                    x =>
                        x.Id != userId &&
                        x.EmployeeNumber == employeeNumber,
                    cancellationToken
                );

            if (employeeNumberExists)
            {
                return false;
            }
        }

        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var before = await snapshotReader.UserAsync(
            userId,
            cancellationToken
        );

        var deactivated = user.IsActive && !request.IsActive;

        user.Name = name;
        user.Email = email;
        user.EmployeeNumber = employeeNumber;
        user.Department = department;
        user.DepartemenCode = departemenCode;
        user.JobTitle = jobTitle;
        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        if (deactivated)
        {
            await RevokeSessionsAsync(userId, cancellationToken);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var after = await snapshotReader.UserAsync(
            userId,
            cancellationToken
        );

        await auditLogger.RecordChangeAsync(
            actorId,
            actorName,
            AuditActions.Update,
            AuditTargets.User,
            userId,
            name,
            before,
            after,
            deactivated
                ? "Pengguna dinonaktifkan dan sesinya dicabut"
                : email,
            cancellationToken: cancellationToken
        );

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return true;
    }

    private async Task RevokeSessionsAsync(
        long userId,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;

        var sessions = await dbContext.RefreshTokens
            .Where(x =>
                x.UserId == userId &&
                x.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var session in sessions)
        {
            session.RevokedAt = now;
        }
    }

    private static string? Normalize(string? value)
    {
        var trimmed = value?.Trim();

        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }
}
