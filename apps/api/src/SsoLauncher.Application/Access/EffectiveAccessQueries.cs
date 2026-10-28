using SsoLauncher.Application.Abstractions.Persistence;

namespace SsoLauncher.Application.Access;

public static class EffectiveAccessQueries
{
    public static IQueryable<long> ApplicationIdsForUser(
        ISsoLauncherDbContext dbContext,
        long userId,
        long? applicationId = null)
    {
        return dbContext.UserGroupMembers
            .Where(x =>
                x.UserId == userId &&
                x.UserGroup.IsActive)
            .SelectMany(x => x.UserGroup.Accesses)
            .Where(x => applicationId == null || x.ApplicationId == applicationId)
            .Select(x => x.ApplicationId)
            .Distinct();
    }
}