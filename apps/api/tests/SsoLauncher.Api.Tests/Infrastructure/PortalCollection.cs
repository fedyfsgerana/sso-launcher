namespace SsoLauncher.Api.Tests.Infrastructure;

[CollectionDefinition(Name)]
public sealed class PortalCollection : ICollectionFixture<PortalApiFactory>
{
    public const string Name = "Portal";
}
