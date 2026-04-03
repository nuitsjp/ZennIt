using System.Net;
using System.Security.Claims;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace ZennIt.Tests;

public class FunctionHandlersTests
{
    [Fact]
    public async Task ExchangeGitHubToken_Heartbeat_ReturnsOk()
    {
        var function = new ExchangeGitHubToken(new StubHttpClientFactory(HttpStatusCode.OK, "ignored"), NullLoggerFactory.Instance);
        var request = CreateRequest("https://example.test/api/ExchangeGitHubToken?code=heartbeat", method: "GET");

        var response = await function.Run(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("I'm awake!", await ReadBodyAsync(response));
    }

    [Fact]
    public async Task ExchangeGitHubToken_GitHubFailure_PropagatesStatusCode()
    {
        Environment.SetEnvironmentVariable("GitHubClientId", "client");
        Environment.SetEnvironmentVariable("GitHubClientSecret", "secret");

        var function = new ExchangeGitHubToken(new StubHttpClientFactory(HttpStatusCode.Unauthorized, "bad_verification_code"), NullLoggerFactory.Instance);
        var request = CreateRequest("https://example.test/api/ExchangeGitHubToken?code=test-code", method: "GET");

        var response = await function.Run(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("bad_verification_code", await ReadBodyAsync(response));
    }

    [Fact]
    public async Task TrackAnalytics_EmptyPayload_ReturnsBadRequest()
    {
        Environment.SetEnvironmentVariable("GoogleAnalyticsMeasurementId", "measurement");
        Environment.SetEnvironmentVariable("GoogleAnalyticsApiSecret", "secret");

        var function = new TrackAnalytics(new StubHttpClientFactory(HttpStatusCode.OK, string.Empty));
        var request = CreateRequest("https://example.test/api/TrackAnalytics", body: string.Empty);

        var response = await function.Run(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("Analytics payload is required.", await ReadBodyAsync(response));
    }

    [Fact]
    public async Task TrackAnalytics_UpstreamFailure_PropagatesStatusCode()
    {
        Environment.SetEnvironmentVariable("GoogleAnalyticsMeasurementId", "measurement");
        Environment.SetEnvironmentVariable("GoogleAnalyticsApiSecret", "secret");

        var function = new TrackAnalytics(new StubHttpClientFactory(HttpStatusCode.BadRequest, "invalid payload"));
        var request = CreateRequest(
            "https://example.test/api/TrackAnalytics?debug=true",
            body: "{\"client_id\":\"test\"}");

        var response = await function.Run(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("invalid payload", await ReadBodyAsync(response));
    }

    private static HttpRequestData CreateRequest(string url, string method = "POST", string body = "")
    {
        var functionContext = new Mock<FunctionContext>();
        var response = CreateResponse(functionContext.Object);

        var request = new Mock<HttpRequestData>(functionContext.Object);
        request.SetupGet(x => x.Url).Returns(new Uri(url));
        request.SetupGet(x => x.Method).Returns(method);
        request.SetupGet(x => x.Headers).Returns(new HttpHeadersCollection());
        request.SetupGet(x => x.Body).Returns(new MemoryStream(System.Text.Encoding.UTF8.GetBytes(body)));
        request.SetupGet(x => x.Cookies).Returns(Array.Empty<IHttpCookie>());
        request.SetupGet(x => x.Identities).Returns(Array.Empty<ClaimsIdentity>());
        request.Setup(x => x.CreateResponse()).Returns(response.Object);

        return request.Object;
    }

    private static Mock<HttpResponseData> CreateResponse(FunctionContext functionContext)
    {
        var response = new Mock<HttpResponseData>(functionContext);
        response.SetupProperty(x => x.StatusCode, HttpStatusCode.OK);
        response.SetupProperty(x => x.Headers, new HttpHeadersCollection());
        response.SetupProperty(x => x.Body, new MemoryStream());
        response.SetupGet(x => x.Cookies).Returns(new Mock<HttpCookies>().Object);
        return response;
    }

    private static async Task<string> ReadBodyAsync(HttpResponseData response)
    {
        response.Body.Position = 0;
        using var reader = new StreamReader(response.Body, leaveOpen: true);
        return await reader.ReadToEndAsync();
    }
}

internal sealed class StubHttpClientFactory(HttpStatusCode statusCode, string body) : IHttpClientFactory
{
    public HttpClient CreateClient(string name)
    {
        return CreateClient();
    }

    public HttpClient CreateClient()
    {
        return new HttpClient(new StubHttpMessageHandler(new HttpResponseMessage(statusCode)
        {
            Content = new StringContent(body)
        }));
    }
}
