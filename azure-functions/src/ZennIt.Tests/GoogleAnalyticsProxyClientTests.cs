using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace ZennIt.Tests;

public class GoogleAnalyticsProxyClientTests
{
    [Fact]
    public async Task SendAsync_UpstreamFailure_KeepsStatusCode()
    {
        var handler = new StubHttpMessageHandler(new HttpResponseMessage(HttpStatusCode.BadRequest)
        {
            Content = new StringContent("invalid payload")
        });
        var client = new HttpClient(handler);
        var proxyClient = new GoogleAnalyticsProxyClient(client);

        var result = await proxyClient.SendAsync("{}", "measurement", "secret", debug: false);

        Assert.Equal(HttpStatusCode.BadRequest, result.StatusCode);
        Assert.Equal("invalid payload", result.Body);
    }

}
