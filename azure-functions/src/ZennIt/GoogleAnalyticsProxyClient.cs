using System.Net;
using System.Net.Http.Headers;
using System.Text;

namespace ZennIt;

public sealed class GoogleAnalyticsProxyClient(HttpClient httpClient)
{
    public async Task<GoogleAnalyticsProxyResult> SendAsync(
        string payload,
        string measurementId,
        string apiSecret,
        bool debug)
    {
        var endpoint = debug
            ? "https://www.google-analytics.com/debug/mp/collect"
            : "https://www.google-analytics.com/mp/collect";
        var requestUri = $"{endpoint}?measurement_id={measurementId}&api_secret={apiSecret}";

        using var content = new StringContent(payload, Encoding.UTF8);
        content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

        using var response = await httpClient.PostAsync(requestUri, content);
        var body = await response.Content.ReadAsStringAsync();

        return new GoogleAnalyticsProxyResult(response.StatusCode, body);
    }
}

public sealed record GoogleAnalyticsProxyResult(HttpStatusCode StatusCode, string Body);
