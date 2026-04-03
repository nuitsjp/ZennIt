using System.Net.Http;
using System.Threading;

namespace ZennIt.Tests;

internal sealed class StubHttpMessageHandler(HttpResponseMessage response) : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        return Task.FromResult(response);
    }
}
