using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;

namespace ZennIt;

public class TrackAnalytics(IHttpClientFactory httpClientFactory)
{
    private readonly GoogleAnalyticsProxyClient _proxyClient = new(httpClientFactory.CreateClient());

    [Function("TrackAnalytics")]
    public async Task<HttpResponseData> Run([HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequestData req)
    {
        var measurementId = Environment.GetEnvironmentVariable("GoogleAnalyticsMeasurementId");
        var apiSecret = Environment.GetEnvironmentVariable("GoogleAnalyticsApiSecret");
        if (string.IsNullOrEmpty(measurementId) || string.IsNullOrEmpty(apiSecret))
        {
            return req.CreateResponse(HttpStatusCode.InternalServerError);
        }

        var payload = await new StreamReader(req.Body).ReadToEndAsync();
        if (string.IsNullOrWhiteSpace(payload))
        {
            var badRequestResponse = req.CreateResponse(HttpStatusCode.BadRequest);
            await badRequestResponse.WriteStringAsync("Analytics payload is required.");
            return badRequestResponse;
        }

        var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
        var debug = string.Equals(query["debug"], "true", StringComparison.OrdinalIgnoreCase);

        var upstreamResponse = await _proxyClient.SendAsync(payload, measurementId, apiSecret, debug);
        var response = req.CreateResponse(upstreamResponse.StatusCode);
        await response.WriteStringAsync(upstreamResponse.Body);
        return response;
    }
}
