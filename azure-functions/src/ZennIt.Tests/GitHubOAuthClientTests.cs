using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace ZennIt.Tests;

public class GitHubOAuthClientTests
{
    [Fact]
    public async Task ExchangeCodeForAccessTokenAsync_GitHubFailure_KeepsStatusCode()
    {
        var handler = new StubHttpMessageHandler(new HttpResponseMessage(HttpStatusCode.Unauthorized)
        {
            Content = new StringContent("bad_verification_code")
        });
        var client = new HttpClient(handler);
        var oauthClient = new GitHubOAuthClient(client);

        var result = await oauthClient.ExchangeCodeForAccessTokenAsync("client", "secret", "code");

        Assert.Equal(HttpStatusCode.Unauthorized, result.StatusCode);
        Assert.Equal("bad_verification_code", result.Body);
    }

}
