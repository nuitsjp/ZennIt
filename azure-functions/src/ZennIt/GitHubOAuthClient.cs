using System.Net;

namespace ZennIt;

public sealed class GitHubOAuthClient(HttpClient httpClient)
{
    public async Task<GitHubOAuthResult> ExchangeCodeForAccessTokenAsync(
        string clientId,
        string clientSecret,
        string code)
    {
        var values = new Dictionary<string, string>
        {
            { "client_id", clientId },
            { "client_secret", clientSecret },
            { "code", code }
        };

        using var content = new FormUrlEncodedContent(values);
        using var response = await httpClient.PostAsync("https://github.com/login/oauth/access_token", content);
        var body = await response.Content.ReadAsStringAsync();

        return new GitHubOAuthResult(response.StatusCode, body);
    }
}

public sealed record GitHubOAuthResult(HttpStatusCode StatusCode, string Body);
