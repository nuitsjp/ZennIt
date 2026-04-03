using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

namespace ZennIt;

public class ExchangeGitHubToken(
    IHttpClientFactory httpClientFactory,
    ILoggerFactory loggerFactory)
{
    private readonly ILogger _logger = loggerFactory.CreateLogger<ExchangeGitHubToken>();
    private readonly GitHubOAuthClient _gitHubOAuthClient = new(httpClientFactory.CreateClient());

    [Function("ExchangeGitHubToken")]
    public async Task<HttpResponseData> Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", "post")] HttpRequestData req)
    {
        _logger.LogInformation("C# HTTP trigger function processed a request.");

        var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
        var code = query["code"];

        if (string.IsNullOrEmpty(code))
        {
            var badRequestResponse = req.CreateResponse(HttpStatusCode.BadRequest);
            await badRequestResponse.WriteStringAsync("Please pass a code on the query string");
            return badRequestResponse;
        }

        if (code == "heartbeat")
        {
            var heartbeat = req.CreateResponse(HttpStatusCode.OK);
            await heartbeat.WriteStringAsync("I'm awake!");
            return heartbeat;
        }

        var clientId = Environment.GetEnvironmentVariable("GitHubClientId");
        var clientSecret = Environment.GetEnvironmentVariable("GitHubClientSecret");
        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
        {
            return req.CreateResponse(HttpStatusCode.InternalServerError);
        }

        var gitHubResponse = await _gitHubOAuthClient.ExchangeCodeForAccessTokenAsync(clientId, clientSecret, code);

        var proxyResponse = req.CreateResponse(gitHubResponse.StatusCode);
        await proxyResponse.WriteStringAsync(gitHubResponse.Body);
        return proxyResponse;
    }
}
