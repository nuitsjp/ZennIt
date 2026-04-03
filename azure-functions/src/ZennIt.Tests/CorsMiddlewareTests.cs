using Microsoft.AspNetCore.Http.Features;
using Microsoft.Azure.Functions.Worker;
using Moq;
using Xunit;

namespace ZennIt.Tests;

public class CorsMiddlewareTests
{
    [Fact]
    public async Task Invoke_SetsCorsHeadersOnResponseFeature()
    {
        Environment.SetEnvironmentVariable("AccessControlAllowOrigin", "chrome-extension://test");
        var middleware = new CorsMiddleware();
        var features = new TestInvocationFeatures();
        var context = new Mock<FunctionContext>();
        context.SetupGet(x => x.Features).Returns(features);

        await middleware.Invoke(context.Object, _ => Task.CompletedTask);

        var responseFeature = features.Get<IHttpResponseFeature>();
        Assert.NotNull(responseFeature);
        Assert.Equal("chrome-extension://test", responseFeature!.Headers["Access-Control-Allow-Origin"]);
        Assert.Equal("GET, POST, OPTIONS", responseFeature.Headers["Access-Control-Allow-Methods"]);
        Assert.Equal("*", responseFeature.Headers["Access-Control-Allow-Headers"]);
        Assert.Equal("true", responseFeature.Headers["Access-Control-Allow-Credentials"]);
    }
}
